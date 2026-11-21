(() => {
  'use strict';

  function camera(yaw, elevation, center, scale, x, y) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const ce = Math.cos(elevation), se = Math.sin(elevation);
    return { right: [cy, 0, -sy], up: [sy * se, ce, cy * se], depth: [sy * ce, -se, cy * ce],
      center, scale, x, y };
  }

  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  function project(view, p) {
    const local = p.map((coordinate, i) => coordinate - view.center[i]);
    const scale = view.scale / (1 + dot(view.depth, local) * (view.perspective || 0) / (view.distance || 1));
    return [view.x + dot(view.right, local) * scale, view.y - dot(view.up, local) * scale];
  }

  function span(points) {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const p of points) {
      for (let i = 0; i < 3; i++) {
        lo[i] = Math.min(lo[i], p[i]);
        hi[i] = Math.max(hi[i], p[i]);
      }
    }
    return { lo, hi, center: lo.map((v, i) => (v + hi[i]) / 2) };
  }

  function pose(x, y, z, node) {
    const [qx, qy, qz, qw] = node.q;
    x *= node.size[0]; y *= node.size[1]; z *= node.size[2];
    const ax = 2 * (qy * z - qz * y), ay = 2 * (qz * x - qx * z), az = 2 * (qx * y - qy * x);
    return [node.p[0] + x + qw * ax + qy * az - qz * ay,
      node.p[1] + y + qw * ay + qz * ax - qx * az,
      node.p[2] + z + qw * az + qx * ay - qy * ax];
  }

  const veilSurfaces = new WeakMap();

  function veilSurface(node) {
    const { halo, columns, rows, rgba } = node.veil;
    if (!veilSurfaces.has(node.veil)) {
      const image = document.createElement('canvas');
      image.width = columns;
      image.height = rows;
      const bytes = Uint8ClampedArray.from(atob(rgba), character => character.charCodeAt(0));
      image.getContext('2d').putImageData(new ImageData(bytes, columns, rows), 0, 0);
      veilSurfaces.set(node.veil, image);
    }
    const [x, y] = node.dimensions.map(value => value / 2 + halo);
    const corners = [[-x, y], [x, y], [-x, -y], [x, -y]].map(([u, v]) => pose(u, v, 0, node));
    // The veil draw reads UVs from the ordinary mesh color attribute.
    const uv = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]];
    const vertices = Float32Array.from([0, 2, 1, 1, 2, 3].flatMap(i => [...corners[i], ...uv[i]]));
    return { bounds: corners, vertices, image: veilSurfaces.get(node.veil) };
  }

  function meshBatch(models, nodes) {
    const surface = nodes.find(node => node.veil);
    const veil = surface ? veilSurface(surface) : null;
    const solids = nodes.filter(node => !node.veil);
    const length = solids.reduce((total, node) => total + node.parts.reduce((sum, [name]) => sum + models[name][1].length * 6, 0), 0);
    const vertices = new Float32Array(length);
    const bounds = veil ? [...veil.bounds] : [];
    let offset = 0;
    for (const node of solids) {
      for (const [name, palette] of node.parts) {
        const [points, faces, materials] = models[name];
        const positions = [];
        for (let i = 0; i < points.length; i += 3) positions.push(pose(points[i], points[i + 1], points[i + 2], node));
        const box = span(positions);
        bounds.push(box.lo, box.hi);
        const colors = palette.map(color => [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255));
        for (let i = 0; i < faces.length; i += 3) {
          const a = positions[faces[i]], b = positions[faces[i + 1]], c = positions[faces[i + 2]];
          const ab = b.map((v, k) => v - a[k]), ac = c.map((v, k) => v - a[k]);
          const normal = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
          const norm = Math.hypot(...normal) || 1;
          const light = .52 + .48 * Math.max(0, dot(normal, [-.47, .74, -.48]) / norm);
          const color = colors[materials[i / 3]] || colors[0];
          for (const p of [a, b, c]) {
            vertices.set(p, offset);
            vertices.set([color[0] * light, color[1] * light, color[2] * light], offset + 3);
            offset += 6;
          }
        }
      }
    }
    return { vertices, bounds, veil };
  }

  function sizeCanvas(canvas, width, height) {
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(width * pixelRatio)), h = Math.max(1, Math.round(height * pixelRatio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return pixelRatio;
  }

  function clearCanvas(canvas, width, height) {
    const ratio = sizeCanvas(canvas, width, height), ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    return ctx;
  }

  function paintBatch(ctx, view, batch, gain, focus, range, opacity) {
    const triangles = [];
    const points = batch.vertices;
    const near = dot(view.depth, view.center) - (view.distance || 0) / (view.perspective || 1) + 2;
    for (let i = 0; i < points.length; i += 18) {
      const a = Array.from(points.subarray(i, i + 3)), b = Array.from(points.subarray(i + 6, i + 9)), c = Array.from(points.subarray(i + 12, i + 15));
      const depths = [a, b, c].map(p => dot(view.depth, p));
      if (view.perspective && depths.some(depth => depth < near)) continue;
      const center = a.map((value, k) => (value + b[k] + c[k]) / 3 - focus[k]);
      const fade = Math.max(0, Math.min(1, (range - Math.hypot(...center)) / (range * .28)));
      if (!fade) continue;
      triangles.push({ i, points: [a, b, c].map(p => project(view, p)), depth: depths[0] + depths[1] + depths[2], fade });
    }
    triangles.sort((a, b) => b.depth - a.depth);
    for (const tri of triangles) {
      const [a, b, c] = tri.points;
      const color = points.subarray(tri.i + 3, tri.i + 6);
      ctx.globalAlpha = opacity * tri.fade;
      ctx.fillStyle = `rgb(${Array.from(color, v => Math.min(255, v * gain * 255)).join(',')})`;
      ctx.beginPath();
      ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paintVeil(ctx, view, veil, focus, range) {
    if (view.perspective && veil.bounds.some(p => {
      const local = p.map((coordinate, i) => coordinate - view.center[i]);
      return view.distance + dot(view.depth, local) * view.perspective <= 2;
    })) return;
    const distance = Math.hypot(...veil.bounds[0].map((coordinate, i) => coordinate - focus[i]));
    if (distance >= range) return;
    const [a, b, c] = veil.bounds.slice(0, 3).map(p => project(view, p));
    const { width, height } = veil.image;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (range - distance) / (range * .28));
    ctx.transform((b[0] - a[0]) / width, (b[1] - a[1]) / width,
      (c[0] - a[0]) / height, (c[1] - a[1]) / height, a[0], a[1]);
    ctx.drawImage(veil.image, 0, 0);
    ctx.restore();
  }

  function createRenderer(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: true });
    if (!gl) {
      let batch, scenery;
      return {
        gpu: false,
        upload(data, surroundings) { batch = data; scenery = surroundings; },
        draw(view, width, height, gain, focus = view.center, range = 2000, opacity = 0, effects = []) {
          const ctx = clearCanvas(canvas, width, height);
          if (scenery && opacity) paintBatch(ctx, view, scenery, gain, focus, range, opacity);
          if (batch) paintBatch(ctx, view, batch, gain, focus, range, 1);
          if (batch?.veil) paintVeil(ctx, view, batch.veil, focus, range);
          for (const effect of effects) paintBatch(ctx, view, effect.batch, effect.gain, focus, range, effect.opacity);
        },
      };
    }
    const program = gl.createProgram();
    const shaders = [[gl.VERTEX_SHADER, `
      attribute vec3 aPosition, aColor;
      uniform vec3 uCenter, uRight, uUp, uDepth, uFocus;
      uniform vec2 uScale, uOffset;
      uniform float uLensDistance, uPerspective;
      varying vec3 vColor;
      varying float vDistance;
      void main() {
        vec3 p = aPosition - uCenter;
        float depth = dot(p, uDepth);
        float w = 1.0;
        float z = depth / 1800.0;
        if (uPerspective > 0.0) {
          const float near = 2.0, far = 1400.0;
          float d = depth + uLensDistance;
          w = mix(1.0, d / uLensDistance, uPerspective);
          z = mix(z, (d * (far + near) - 2.0 * near * far) / ((far - near) * uLensDistance), uPerspective);
        }
        gl_Position = vec4(dot(p, uRight) * uScale.x + uOffset.x * w,
          dot(p, uUp) * uScale.y + uOffset.y * w, z, w);
        vColor = aColor;
        vDistance = distance(aPosition, uFocus);
      }`], [gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform float uGain, uDistance, uOpacity;
      uniform bool uDrawVeil;
      uniform sampler2D uVeil;
      varying vec3 vColor;
      varying float vDistance;
      void main() {
        float opacity = uOpacity * (1.0 - smoothstep(uDistance * 0.72, uDistance, vDistance));
        if (opacity <= 0.001) discard;
        gl_FragColor = uDrawVeil ? texture2D(uVeil, vColor.xy) * opacity : vec4(vColor * uGain * opacity, opacity);
      }
    `]];
    for (const [type, source] of shaders) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    const uniforms = Object.fromEntries(['Center', 'Right', 'Up', 'Depth', 'Scale', 'Offset', 'LensDistance', 'Perspective', 'Gain', 'Focus', 'Distance', 'Opacity', 'DrawVeil', 'Veil'].map(name => [name, gl.getUniformLocation(program, `u${name}`)]));
    const buffer = gl.createBuffer();
    gl.useProgram(program);
    const attributes = ['aPosition', 'aColor'].map(name => gl.getAttribLocation(program, name));
    for (const attribute of attributes) gl.enableVertexAttribArray(attribute);
    function bindMeshBuffer(source) {
      gl.bindBuffer(gl.ARRAY_BUFFER, source);
      attributes.forEach((attribute, i) => gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 24, i * 12));
    }
    bindMeshBuffer(buffer);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.uniform1i(uniforms.Veil, 0);
    let count = 0, sceneryCount = 0, veilCount = 0;
    let uploadedVeil, effectsBuffer;
    return {
      gpu: true,
      upload(batch, scenery) {
        count = batch.vertices.length / 6;
        sceneryCount = scenery ? scenery.vertices.length / 6 : 0;
        veilCount = batch.veil ? batch.veil.vertices.length / 6 : 0;
        gl.bufferData(gl.ARRAY_BUFFER, (count + sceneryCount + veilCount) * 24, gl.STATIC_DRAW);
        if (count) gl.bufferSubData(gl.ARRAY_BUFFER, 0, batch.vertices);
        if (sceneryCount) gl.bufferSubData(gl.ARRAY_BUFFER, count * 24, scenery.vertices);
        if (veilCount) {
          gl.bufferSubData(gl.ARRAY_BUFFER, (count + sceneryCount) * 24, batch.veil.vertices);
          if (uploadedVeil !== batch.veil.image) {
            uploadedVeil = batch.veil.image;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, uploadedVeil);
          }
        }
      },
      draw(view, width, height, gain, focus = view.center, distance = 2000, opacity = 0, effects = []) {
        sizeCanvas(canvas, width, height);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform3fv(uniforms.Center, view.center);
        gl.uniform3fv(uniforms.Right, view.right);
        gl.uniform3fv(uniforms.Up, view.up);
        gl.uniform3fv(uniforms.Depth, view.depth);
        gl.uniform2f(uniforms.Scale, 2 * view.scale / width, 2 * view.scale / height);
        gl.uniform2f(uniforms.Offset, 2 * view.x / width - 1, 1 - 2 * view.y / height);
        gl.uniform1f(uniforms.LensDistance, view.distance || 1);
        gl.uniform1f(uniforms.Perspective, view.perspective || 0);
        gl.uniform1f(uniforms.Gain, gain);
        gl.uniform3fv(uniforms.Focus, focus);
        gl.uniform1f(uniforms.Distance, distance);
        gl.uniform1f(uniforms.Opacity, 1);
        gl.uniform1i(uniforms.DrawVeil, 0);
        gl.drawArrays(gl.TRIANGLES, 0, count);
        if (opacity && sceneryCount) {
          gl.uniform1f(uniforms.Opacity, opacity);
          gl.drawArrays(gl.TRIANGLES, count, sceneryCount);
        }
        if (veilCount) {
          gl.uniform1f(uniforms.Opacity, 1);
          gl.uniform1i(uniforms.DrawVeil, 1);
          gl.enable(gl.BLEND);
          gl.drawArrays(gl.TRIANGLES, count + sceneryCount, veilCount);
          gl.disable(gl.BLEND);
        }
        if (effects.length) {
          effectsBuffer ??= gl.createBuffer();
          bindMeshBuffer(effectsBuffer);
          gl.uniform1i(uniforms.DrawVeil, 0);
          gl.enable(gl.BLEND);
          for (const effect of effects) {
            gl.depthMask(effect.opacity === 1);
            gl.uniform1f(uniforms.Gain, effect.gain);
            gl.uniform1f(uniforms.Opacity, effect.opacity);
            gl.bufferData(gl.ARRAY_BUFFER, effect.batch.vertices, gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.TRIANGLES, 0, effect.batch.vertices.length / 6);
          }
          gl.depthMask(true);
          gl.disable(gl.BLEND);
          bindMeshBuffer(buffer);
        }
      },
    };
  }

  window.grandTurismoRender = { camera, project, dot, span, pose, meshBatch, clearCanvas, createRenderer };
})();
