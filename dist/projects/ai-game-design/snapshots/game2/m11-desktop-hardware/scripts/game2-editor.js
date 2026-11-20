"use strict";

(function startCatwalkEditor() {
  const levelData = globalThis.CATWALK_LEVEL_DATA;
  const model = globalThis.CATWALK_EDITOR_MODEL;
  if (!levelData || !model) {
    throw new Error("Catwalk editor dependencies failed to load.");
  }

  const canvas = document.querySelector("#editor-canvas");
  const canvasWrap = document.querySelector("#canvas-wrap");
  const context = canvas.getContext("2d");
  const elementPalette = document.querySelector("#element-palette");
  const modulePalette = document.querySelector("#module-palette");
  const objectInspector = document.querySelector("#object-inspector");
  const emptyInspector = document.querySelector("#empty-inspector");
  const selectionTitle = document.querySelector("#selection-title");
  const projectNameInput = document.querySelector("#project-name");
  const projectNameLabel = document.querySelector("#project-name-label");
  const worldReadout = document.querySelector("#world-readout");
  const cursorReadout = document.querySelector("#cursor-readout");
  const zoomReadout = document.querySelector("#zoom-readout");
  const horizontalScroll = document.querySelector("#horizontal-scroll");
  const saveStatus = document.querySelector("#save-status");
  const placementHint = document.querySelector("#placement-hint");
  const importFile = document.querySelector("#import-file");
  const emptyInspectorDefault = emptyInspector.textContent.trim();
  const requestedAnchorValue = new URLSearchParams(window.location.search).get("anchor");
  const requestedAnchor = requestedAnchorValue === null ? NaN : Number(requestedAnchorValue);

  const STORAGE_KEY = "catwalk-timeline-snapshot-m11-desktop-hardware";
  const COLORS = Object.freeze({
    platform: "#4f6a69",
    gap: "#d36f70",
    crate: "#9b7048",
    tunnel: "#728f8e",
    wall: "#826d5d",
    loafGoal: "#d4a55d",
    checkpoint: "#93b77f",
    gameStart: "#e29a62",
    exit: "#90b98b",
    ritual: "#bc8dd8",
    text: "#e4bd86",
    playerDialogue: "#8fb9d6",
    yarn: "#d88aa5",
    enemy: "#98a6a5",
    pawStorm: "#d388a5",
    pawStormEnd: "#d36f70",
    screenBlock: "#c6a06f",
    screenWalk: "#86b8c8",
  });
  const LABELS = Object.fromEntries(model.ELEMENT_LIBRARY.map((entry) => [
    `${entry.type}:${entry.enemyType || ""}`,
    entry.label,
  ]));
  const PALETTE_ICONS = Object.freeze({
    platform: "▬",
    gap: "⌄",
    crate: "▣",
    tunnel: "∩",
    wall: "▥",
    loafGoal: "Zz",
    checkpoint: "⚑",
    gameStart: "▶",
    exit: "⌂",
    ritual: "✦",
    text: "Aa",
    playerDialogue: "YOU",
    yarn: "◎",
    "enemy:mouse": "◁",
    "enemy:pigeon": "⌁",
    "enemy:dog": "◆",
    pawStorm: "✣",
    pawStormEnd: "■",
    screenBlock: "◐",
    screenWalk: "⇥",
  });
  const INTERFERENCE_EVENT_TYPES = new Set([
    "pawStorm",
    "pawStormEnd",
    "screenBlock",
    "screenWalk",
  ]);

  let project = loadProject();
  let selectedId = null;
  let selectedIds = new Set();
  let activeTool = "select";
  let placement = null;
  let hoverWorld = { x: 0, y: 0 };
  let view = { x: 0, zoom: 1 };
  let viewport = { width: 1, height: 1, top: 56, bottom: 520, scaleY: 1 };
  let pointerState = null;
  let saveTimer = null;
  let redrawRequested = false;

  function loadProject() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? model.parseProject(saved) : model.createEmptyProject();
    } catch (error) {
      saveStatus.textContent = "Local save unavailable";
      return model.createEmptyProject();
    }
  }

  function getWorldWidth() {
    return model.calculateWorldWidth(project);
  }

  function getSelectedObject() {
    return project.objects.find((object) => object.id === selectedId) || null;
  }

  function getSelectedObjects() {
    return project.objects.filter((object) => selectedIds.has(object.id));
  }

  function setSelection(objects, primary = objects[0] || null) {
    selectedIds = new Set(objects.map((object) => object.id));
    selectedId = primary && selectedIds.has(primary.id) ? primary.id : objects[0]?.id || null;
    updateInspector();
    requestDraw();
  }

  function requestDraw() {
    if (redrawRequested) {
      return;
    }
    redrawRequested = true;
    requestAnimationFrame(() => {
      redrawRequested = false;
      draw();
    });
  }

  function resizeCanvas() {
    const rect = canvasWrap.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    viewport.width = rect.width;
    viewport.height = rect.height;
    viewport.top = 56;
    viewport.bottom = Math.max(120, rect.height - 18);
    viewport.scaleY = (viewport.bottom - viewport.top) / model.WORLD_HEIGHT;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    clampView();
    requestDraw();
  }

  function worldToScreenX(x) {
    return (x - view.x) * view.zoom;
  }

  function worldToScreenY(y) {
    return viewport.top + y * viewport.scaleY;
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: view.x + (clientX - rect.left) / view.zoom,
      y: (clientY - rect.top - viewport.top) / viewport.scaleY,
    };
  }

  function clampView() {
    const visibleWorldWidth = viewport.width / view.zoom;
    view.x = Math.max(0, Math.min(view.x, Math.max(0, getWorldWidth() - visibleWorldWidth)));
    syncScroll();
  }

  function syncScroll() {
    const max = Math.max(0, getWorldWidth() - viewport.width / view.zoom);
    horizontalScroll.max = String(Math.ceil(max));
    horizontalScroll.value = String(Math.min(max, Math.round(view.x)));
    zoomReadout.textContent = `${Math.round(view.zoom * 100)}%`;
  }

  function draw() {
    context.clearRect(0, 0, viewport.width, viewport.height);
    drawBackground();
    drawModuleBands();
    project.objects
      .filter((object) => object.type !== "gap" && !INTERFERENCE_EVENT_TYPES.has(object.type))
      .forEach(drawObject);
    project.objects.filter((object) => object.type === "gap").forEach(drawObject);
    project.objects.filter((object) => INTERFERENCE_EVENT_TYPES.has(object.type)).forEach(drawObject);
    drawSelection();
    drawSelectionMarquee();
    drawPlacementGhost();
    updateReadouts();
  }

  function drawBackground() {
    const groundTop = worldToScreenY(470);
    context.fillStyle = "#0e1515";
    context.fillRect(0, 0, viewport.width, viewport.height);

    context.fillStyle = "rgba(215, 138, 165, 0.035)";
    context.fillRect(0, 0, viewport.width, viewport.top);
    context.strokeStyle = "rgba(215, 154, 176, 0.18)";
    context.beginPath();
    context.moveTo(0, viewport.top - 0.5);
    context.lineTo(viewport.width, viewport.top - 0.5);
    context.stroke();

    const worldLeft = view.x;
    const worldRight = view.x + viewport.width / view.zoom;
    const minorStart = Math.floor(worldLeft / 100) * 100;
    for (let x = minorStart; x <= worldRight + 100; x += 100) {
      const screenX = worldToScreenX(x);
      const major = x % 500 === 0;
      context.strokeStyle = major ? "rgba(154, 183, 176, 0.14)" : "rgba(154, 183, 176, 0.055)";
      context.beginPath();
      context.moveTo(Math.round(screenX) + 0.5, viewport.top);
      context.lineTo(Math.round(screenX) + 0.5, viewport.bottom);
      context.stroke();
      if (major) {
        context.fillStyle = "#5d6d69";
        context.font = "9px Inter, sans-serif";
        context.fillText(`${x.toLocaleString()} px`, screenX + 5, viewport.top + 14);
      }
    }

    for (let y = 0; y <= model.WORLD_HEIGHT; y += 100) {
      const screenY = worldToScreenY(y);
      context.strokeStyle = "rgba(154, 183, 176, 0.045)";
      context.beginPath();
      context.moveTo(0, screenY + 0.5);
      context.lineTo(viewport.width, screenY + 0.5);
      context.stroke();
    }

    context.fillStyle = "#253635";
    context.fillRect(0, groundTop, viewport.width, viewport.bottom - groundTop);
    context.strokeStyle = "#5f7a77";
    context.beginPath();
    context.moveTo(0, groundTop + 0.5);
    context.lineTo(viewport.width, groundTop + 0.5);
    context.stroke();

    context.fillStyle = "#7d8884";
    context.font = "9px Inter, sans-serif";
    context.fillText("CAT INTERFERENCE · POSITION / TIME", 12, 21);
    context.fillText("SINGLE ROUTE WORLD", 12, viewport.top + 31);
  }

  function drawModuleBands() {
    const groups = new Map();
    project.objects.forEach((object) => {
      if (!object.moduleInstanceId) {
        return;
      }
      const group = groups.get(object.moduleInstanceId) || {
        minX: object.x,
        maxX: object.x,
        title: object.moduleTitle || `Module #${object.moduleId}`,
        moduleId: object.moduleId,
      };
      group.minX = Math.min(group.minX, object.x - object.width / 2);
      group.maxX = Math.max(group.maxX, object.x + object.width / 2);
      groups.set(object.moduleInstanceId, group);
    });

    groups.forEach((group) => {
      const left = worldToScreenX(group.minX);
      const right = worldToScreenX(group.maxX);
      if (right < 0 || left > viewport.width) {
        return;
      }
      context.strokeStyle = "rgba(228, 189, 134, 0.23)";
      context.setLineDash([5, 5]);
      context.strokeRect(left, viewport.top + 23, right - left, viewport.bottom - viewport.top - 23);
      context.setLineDash([]);
      context.fillStyle = "rgba(228, 189, 134, 0.82)";
      context.font = "bold 9px Inter, sans-serif";
      context.fillText(`#${String(group.moduleId).padStart(2, "0")} ${group.title}`, left + 6, viewport.top + 42);
    });
  }

  function objectScreenRect(object) {
    const width = Math.max(5, object.width * view.zoom);
    const height = Math.max(5, object.height * viewport.scaleY);
    return {
      x: worldToScreenX(object.x) - width / 2,
      y: worldToScreenY(object.y) - height / 2,
      width,
      height,
    };
  }

  function drawObject(object, ghost = false) {
    const rect = objectScreenRect(object);
    if (rect.x > viewport.width + 100 || rect.x + rect.width < -100) {
      return;
    }
    context.save();
    context.globalAlpha = ghost ? 0.42 : 1;
    const color = COLORS[object.type] || "#95a09c";

    if (object.type === "gap") {
      context.fillStyle = "#0e1515";
      context.fillRect(rect.x, worldToScreenY(470) - 2, rect.width, viewport.bottom - worldToScreenY(470) + 2);
      context.strokeStyle = color;
      context.setLineDash([4, 4]);
      context.strokeRect(rect.x, worldToScreenY(470), rect.width, viewport.bottom - worldToScreenY(470));
      context.setLineDash([]);
      drawLabel("GAP", rect.x + 4, worldToScreenY(470) + 14, color);
    } else if (object.type === "platform") {
      drawRect(rect, color, "PLATFORM");
    } else if (object.type === "crate") {
      drawRect(rect, color, "J");
      context.strokeStyle = "rgba(255,255,255,.25)";
      context.beginPath();
      context.moveTo(rect.x, rect.y);
      context.lineTo(rect.x + rect.width, rect.y + rect.height);
      context.moveTo(rect.x + rect.width, rect.y);
      context.lineTo(rect.x, rect.y + rect.height);
      context.stroke();
    } else if (object.type === "tunnel") {
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.fillStyle = "rgba(114,143,142,.14)";
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
      drawLabel("HOLD K", rect.x + 5, rect.y + 14, color);
    } else if (object.type === "wall") {
      drawRect(rect, color, "SPACE");
      context.strokeStyle = "rgba(255,255,255,.18)";
      for (let y = rect.y + 12; y < rect.y + rect.height; y += 16) {
        context.beginPath();
        context.moveTo(rect.x, y);
        context.lineTo(rect.x + rect.width, y);
        context.stroke();
      }
    } else if (object.type === "loafGoal") {
      context.fillStyle = "rgba(212,165,93,.28)";
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
      context.strokeStyle = color;
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      drawLabel("HOLD S · REST CHECKPOINT", rect.x + 4, rect.y - 5, color);
    } else if (object.type === "checkpoint") {
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(rect.x + 6, rect.y + rect.height);
      context.lineTo(rect.x + 6, rect.y);
      context.lineTo(rect.x + rect.width, rect.y + 8);
      context.lineTo(rect.x + 6, rect.y + 17);
      context.stroke();
      drawLabel("CHECKPOINT", rect.x, rect.y - 7, color);
    } else if (object.type === "gameStart") {
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(rect.x + 7, rect.y + rect.height);
      context.lineTo(rect.x + 7, rect.y);
      context.lineTo(rect.x + rect.width, rect.y + 11);
      context.lineTo(rect.x + 7, rect.y + 23);
      context.stroke();
      drawLabel("GAME START · 9 LIVES", rect.x, rect.y - 7, color);
    } else if (object.type === "exit") {
      drawRect(rect, color, "HOME");
      context.fillStyle = "#dce8d8";
      context.beginPath();
      context.arc(rect.x + rect.width - 8, rect.y + rect.height / 2, 2, 0, Math.PI * 2);
      context.fill();
    } else if (object.type === "ritual") {
      context.fillStyle = "rgba(188,141,216,.16)";
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "#e5c8f3";
      context.font = "bold 10px Inter, sans-serif";
      context.textAlign = "center";
      context.fillText(String(object.order || 1), rect.x + rect.width / 2, rect.y + rect.height / 2 + 3);
      context.textAlign = "left";
      drawLabel((object.action || "scratch").toUpperCase(), rect.x - 2, rect.y - 7, color);
    } else if (object.type === "text") {
      context.fillStyle = "rgba(228,189,134,.08)";
      context.strokeStyle = "rgba(228,189,134,.55)";
      context.setLineDash([4, 3]);
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.setLineDash([]);
      context.fillStyle = "#ead7b9";
      context.font = `600 ${Math.max(9, Math.min(18, Number(object.fontSize || 18) * 0.65))}px Inter, sans-serif`;
      drawWrappedText(String(object.content || "Your message here"), rect.x + 7, rect.y + 18, rect.width - 14, 15);
    } else if (object.type === "playerDialogue") {
      context.fillStyle = "rgba(143,185,214,.12)";
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.beginPath();
      context.moveTo(rect.x + 18, rect.y + rect.height);
      context.lineTo(rect.x + 31, rect.y + rect.height);
      context.lineTo(rect.x + 23, rect.y + rect.height + 10);
      context.closePath();
      context.fill();
      context.stroke();
      drawLabel(`PLAYER OUTSIDE MONITOR · ${Number(object.displaySeconds || 4)}s`, rect.x + 6, rect.y - 7, color);
      context.fillStyle = "#d9edf8";
      context.font = "600 10px Inter, sans-serif";
      drawWrappedText(
        String(object.content || "Mocha, I am trying to work here."),
        rect.x + 8,
        rect.y + 19,
        rect.width - 16,
        15,
      );
    } else if (object.type === "yarn") {
      context.fillStyle = color;
      context.beginPath();
      context.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, Math.min(rect.width, rect.height) / 2, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#f0bfd0";
      context.beginPath();
      context.moveTo(rect.x + 4, rect.y + 4);
      context.lineTo(rect.x + rect.width - 4, rect.y + rect.height - 4);
      context.moveTo(rect.x + rect.width - 5, rect.y + 4);
      context.lineTo(rect.x + 5, rect.y + rect.height - 4);
      context.stroke();
    } else if (object.type === "enemy") {
      drawEnemy(object, rect);
    } else if (object.type === "pawStorm") {
      drawPawStorm(object);
    } else if (object.type === "pawStormEnd") {
      drawInterferenceMarker(object, "END PAW STORM", "#d36f70");
    } else if (object.type === "screenBlock") {
      drawScreenBlockEvent(object);
    } else if (object.type === "screenWalk") {
      const direction = object.walkDirection === "right-to-left" ? "RIGHT → LEFT" : "LEFT → RIGHT";
      drawInterferenceMarker(
        object,
        `CAT WALK · ${direction} · ${Number(object.durationSeconds || 4)}s`,
        "#86b8c8",
      );
    } else {
      drawRect(rect, color, object.type.toUpperCase());
    }
    context.restore();
  }

  function drawRect(rect, color, label) {
    context.fillStyle = `${color}55`;
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    if (label) {
      drawLabel(label, rect.x + 4, rect.y + 13, color);
    }
  }

  function drawLabel(text, x, y, color) {
    context.fillStyle = color;
    context.font = "bold 8px Inter, sans-serif";
    context.fillText(text, x, y);
  }

  function drawWrappedText(text, x, y, maxWidth, lineHeight) {
    let line = "";
    let lineY = y;
    Array.from(text).forEach((character) => {
      if (character === "\n") {
        context.fillText(line.trimEnd(), x, lineY);
        line = "";
        lineY += lineHeight;
        return;
      }
      const candidate = `${line}${character}`;
      if (line && context.measureText(candidate).width > maxWidth) {
        context.fillText(line.trimEnd(), x, lineY);
        line = character.trimStart();
        lineY += lineHeight;
        return;
      }
      line = candidate;
    });
    if (line) {
      context.fillText(line.trimEnd(), x, lineY);
    }
  }

  function drawEnemy(object, rect) {
    const color = object.enemyType === "dog"
      ? "#b5845f"
      : object.enemyType === "pigeon"
        ? "#8fa4b3"
        : "#98a6a5";
    const start = worldToScreenX(object.patrolMinX);
    const end = worldToScreenX(object.patrolMaxX);
    const airborne = object.enemyType === "pigeon";
    const pathY = airborne
      ? rect.y + rect.height / 2
      : rect.y + rect.height + 6;

    if (airborne) {
      context.fillStyle = `${color}16`;
      context.fillRect(start, pathY - 9, Math.max(1, end - start), 18);
    }
    context.strokeStyle = `${color}${airborne ? "bb" : "88"}`;
    context.lineWidth = airborne ? 2 : 1;
    context.setLineDash(airborne ? [8, 5] : [3, 4]);
    context.beginPath();
    context.moveTo(start, pathY);
    context.lineTo(end, pathY);
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(start, pathY - (airborne ? 9 : 4));
    context.lineTo(start, pathY + (airborne ? 9 : 4));
    context.moveTo(end, pathY - (airborne ? 9 : 4));
    context.lineTo(end, pathY + (airborne ? 9 : 4));
    context.stroke();
    if (airborne) {
      drawLabel(
        `AIR PATROL · ${Math.round(object.patrolMaxX - object.patrolMinX)}px`,
        start + 4,
        pathY + 20,
        color,
      );
    }

    context.fillStyle = color;
    context.beginPath();
    context.ellipse(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.width * 0.42,
      rect.height * 0.35,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    drawLabel((object.enemyType || "mouse").toUpperCase(), rect.x, rect.y - 6, color);
  }

  function drawPawStorm(object) {
    const x = worldToScreenX(object.x);
    const triggerValue = Number(object.triggerX ?? object.x);
    const triggerX = worldToScreenX(triggerValue);
    const label = object.triggerMode === "time"
      ? `PAW · ${object.delaySeconds}s`
      : object.triggerMode === "both"
        ? `PAW · X ${Math.round(triggerValue)} + ${object.delaySeconds}s`
        : `PAW · X ${Math.round(triggerValue)}`;
    context.fillStyle = "rgba(211,136,165,.12)";
    context.fillRect(x - 6, 0, 12, viewport.bottom);
    context.strokeStyle = "#d388a5";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(triggerX, 0);
    context.lineTo(triggerX, viewport.bottom);
    context.stroke();
    context.fillStyle = "#d9a5b9";
    context.font = "bold 9px Inter, sans-serif";
    context.fillText(label, triggerX + 6, 38);
    context.font = "8px Inter, sans-serif";
    context.fillStyle = "#936f7e";
    const blocked = (object.blockedKeys || []).join("").toUpperCase() || "—";
    const held = (object.heldKeys || []).join("").toUpperCase() || "—";
    context.fillText(`BLOCK ${blocked} · HOLD ${held}`, triggerX + 6, 50);
  }

  function drawInterferenceMarker(object, label, color) {
    const triggerX = worldToScreenX(object.triggerX ?? object.x);
    context.fillStyle = `${color}18`;
    context.fillRect(triggerX - 6, 0, 12, viewport.bottom);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(triggerX, 0);
    context.lineTo(triggerX, viewport.bottom);
    context.stroke();
    context.fillStyle = color;
    context.font = "bold 9px Inter, sans-serif";
    context.fillText(label, triggerX + 6, 66);
  }

  function drawScreenBlockEvent(object) {
    const color = "#c6a06f";
    const mode = object.endMode === "position"
      ? `TO X ${Math.round(object.endX)}`
      : `${Number(object.durationSeconds || 4)}s`;
    drawInterferenceMarker(
      object,
      `SCREEN BLOCK · ${String(object.side || "left").toUpperCase()} ${Math.round(object.coveragePercent || 35)}% · ${mode}`,
      color,
    );
    if (object.endMode === "position") {
      const start = worldToScreenX(object.triggerX ?? object.x);
      const end = worldToScreenX(object.endX);
      context.fillStyle = "rgba(198,160,111,.08)";
      context.fillRect(start, 72, Math.max(1, end - start), 22);
      context.strokeStyle = "rgba(198,160,111,.55)";
      context.setLineDash([5, 4]);
      context.strokeRect(start, 72, Math.max(1, end - start), 22);
      context.setLineDash([]);
    }
  }

  function drawSelection() {
    getSelectedObjects().forEach(drawObjectSelection);
  }

  function drawObjectSelection(object) {
    if (INTERFERENCE_EVENT_TYPES.has(object.type)) {
      const x = worldToScreenX(object.triggerX);
      context.strokeStyle = "#f3d6e0";
      context.setLineDash([4, 3]);
      context.strokeRect(x - 8, 3, 16, viewport.bottom - 6);
      context.setLineDash([]);
      return;
    }
    const rect = objectScreenRect(object);
    context.strokeStyle = "#f3d6e0";
    context.lineWidth = 2;
    context.setLineDash([4, 3]);
    context.strokeRect(rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8);
    context.setLineDash([]);
    const size = 6;
    [[rect.x - 4, rect.y - 4], [rect.x + rect.width - 2, rect.y - 4],
      [rect.x - 4, rect.y + rect.height - 2], [rect.x + rect.width - 2, rect.y + rect.height - 2]]
      .forEach(([x, y]) => {
        context.fillStyle = "#f3d6e0";
        context.fillRect(x, y, size, size);
      });
  }

  function drawSelectionMarquee() {
    if (pointerState?.mode !== "marquee") {
      return;
    }
    const rect = model.selectionRect(pointerState.startWorld, pointerState.currentWorld);
    const left = worldToScreenX(rect.left);
    const right = worldToScreenX(rect.right);
    const top = worldToScreenY(rect.top);
    const bottom = worldToScreenY(rect.bottom);
    context.fillStyle = "rgba(243, 214, 224, .08)";
    context.strokeStyle = "#f3d6e0";
    context.lineWidth = 1;
    context.setLineDash([6, 4]);
    context.fillRect(left, top, right - left, bottom - top);
    context.strokeRect(left, top, right - left, bottom - top);
    context.setLineDash([]);
  }

  function drawPlacementGhost() {
    if (!placement) {
      return;
    }
    if (placement.kind === "module") {
      const x = worldToScreenX(model.snap(hoverWorld.x));
      const width = levelData.MODULE_WIDTH * view.zoom;
      context.fillStyle = "rgba(228,189,134,.06)";
      context.strokeStyle = "rgba(228,189,134,.55)";
      context.setLineDash([6, 5]);
      context.fillRect(x, viewport.top, width, viewport.bottom - viewport.top);
      context.strokeRect(x, viewport.top, width, viewport.bottom - viewport.top);
      context.setLineDash([]);
      drawLabel(
        `PLACE #${String(placement.level.id).padStart(2, "0")} ${placement.level.title}`,
        x + 8,
        viewport.top + 18,
        "#e4bd86",
      );
    } else {
      const definition = placement.definition;
      const y = definition.type === "gap" ? definition.y : model.snap(hoverWorld.y);
      drawObject({
        ...definition,
        x: model.snap(hoverWorld.x),
        y,
      }, true);
    }
  }

  function updateReadouts() {
    const worldWidth = getWorldWidth();
    projectNameLabel.textContent = project.name;
    worldReadout.textContent = `${project.objects.length} objects · ${worldWidth.toLocaleString()}px world`;
    cursorReadout.textContent = `X ${Math.round(hoverWorld.x).toLocaleString()} · Y ${Math.round(hoverWorld.y)}`;
    horizontalScroll.max = String(Math.max(0, Math.ceil(worldWidth - viewport.width / view.zoom)));
  }

  function objectAt(worldX, worldY) {
    return [...project.objects].reverse().find((object) => {
      if (INTERFERENCE_EVENT_TYPES.has(object.type)) {
        return Math.abs(worldX - object.triggerX) <= 12 / view.zoom;
      }
      return worldX >= object.x - object.width / 2
        && worldX <= object.x + object.width / 2
        && worldY >= object.y - object.height / 2
        && worldY <= object.y + object.height / 2;
    }) || null;
  }

  function setTool(tool) {
    activeTool = tool;
    placement = null;
    document.querySelectorAll("[data-tool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tool === tool);
    });
    document.querySelectorAll(".palette-item").forEach((button) => button.classList.remove("is-selected"));
    canvasWrap.classList.toggle("is-select", tool === "select");
    canvasWrap.classList.toggle("is-pan", tool === "pan");
    placementHint.hidden = true;
    requestDraw();
  }

  function choosePlacement(nextPlacement, button) {
    placement = nextPlacement;
    activeTool = "place";
    document.querySelectorAll("[data-tool]").forEach((toolButton) => toolButton.classList.remove("is-active"));
    document.querySelectorAll(".palette-item").forEach((paletteButton) => {
      paletteButton.classList.toggle("is-selected", paletteButton === button);
    });
    canvasWrap.classList.remove("is-select", "is-pan");
    placementHint.hidden = false;
    placementHint.textContent = nextPlacement.kind === "module"
      ? `Place module #${String(nextPlacement.level.id).padStart(2, "0")}`
      : `Place ${nextPlacement.definition.label}`;
    requestDraw();
  }

  function renderPalettes() {
    const groups = new Map();
    model.ELEMENT_LIBRARY.forEach((definition) => {
      const definitions = groups.get(definition.group) || [];
      definitions.push(definition);
      groups.set(definition.group, definitions);
    });
    elementPalette.replaceChildren(...[...groups.entries()].map(([group, definitions]) => {
      const section = document.createElement("section");
      section.className = "palette-group";
      const heading = document.createElement("h3");
      heading.textContent = group;
      const grid = document.createElement("div");
      grid.className = "palette-grid";
      definitions.forEach((definition) => {
        const button = document.createElement("button");
        button.className = "palette-item";
        button.type = "button";
        const iconKey = definition.type === "enemy"
          ? `${definition.type}:${definition.enemyType}`
          : definition.type;
        const icon = PALETTE_ICONS[iconKey] || "•";
        button.innerHTML = `
          <span class="palette-icon palette-icon-${definition.type}" aria-hidden="true">${icon}</span>
          <span class="palette-copy">
            <strong>${definition.label}</strong>
            <small>${definition.type === "pawStorm" ? "position / time" : definition.type}</small>
          </span>
        `;
        button.addEventListener("click", () => choosePlacement({
          kind: "element",
          definition,
        }, button));
        grid.append(button);
      });
      section.append(heading, grid);
      return section;
    }));

    const moduleGrid = document.createElement("div");
    moduleGrid.className = "palette-grid";
    levelData.LEVEL_GALLERY.forEach((level) => {
      const button = document.createElement("button");
      button.className = "palette-item";
      button.dataset.kind = "module";
      button.type = "button";
      button.innerHTML = `
        <span class="palette-icon palette-icon-module" aria-hidden="true">${String(level.id).padStart(2, "0")}</span>
        <span class="palette-copy">
          <strong>#${String(level.id).padStart(2, "0")} ${level.title}</strong>
          <small>${level.focus} · ${level.hint}</small>
        </span>
      `;
      button.addEventListener("click", () => choosePlacement({
        kind: "module",
        level,
      }, button));
      moduleGrid.append(button);
    });
    modulePalette.replaceChildren(moduleGrid);
  }

  function placeAt(world) {
    if (!placement) {
      return;
    }
    if (placement.kind === "module") {
      const objects = model.createModule(placement.level.id, model.snap(world.x));
      project.objects.push(...objects);
      setSelection(objects);
    } else {
      const definition = placement.definition;
      const y = definition.type === "gap" ? definition.y : world.y;
      const object = model.createObject(definition, world.x, y);
      project.objects.push(object);
      setSelection([object]);
    }
    markDirty();
    clampView();
    requestDraw();
  }

  function selectObject(object) {
    setSelection(object ? [object] : []);
  }

  function selectionOrigins() {
    return getSelectedObjects().map((object) => ({
      id: object.id,
      x: object.x,
      y: object.y,
      triggerX: object.triggerX,
      endX: object.endX,
      patrolMinX: object.patrolMinX,
      patrolMaxX: object.patrolMaxX,
    }));
  }

  function translateSelection(origins, requestedDeltaX, requestedDeltaY) {
    if (!origins.length) {
      return;
    }
    const selectedObjects = origins
      .map((origin) => ({ origin, object: project.objects.find((object) => object.id === origin.id) }))
      .filter(({ object }) => object);
    const movableY = selectedObjects.filter(({ object }) => !INTERFERENCE_EVENT_TYPES.has(object.type));
    const minDeltaY = movableY.length ? Math.max(...movableY.map(({ origin }) => -origin.y)) : 0;
    const maxDeltaY = movableY.length
      ? Math.min(...movableY.map(({ origin }) => model.WORLD_HEIGHT - origin.y))
      : 0;
    const deltaX = model.snap(requestedDeltaX);
    const deltaY = movableY.length
      ? Math.max(minDeltaY, Math.min(maxDeltaY, model.snap(requestedDeltaY)))
      : 0;

    selectedObjects.forEach(({ object, origin }) => {
      object.x = origin.x + deltaX;
      if (INTERFERENCE_EVENT_TYPES.has(object.type)) {
        object.triggerX = origin.triggerX + deltaX;
        if (object.type === "screenBlock") {
          object.endX = origin.endX + deltaX;
        }
        return;
      }
      object.y = origin.y + deltaY;
      if (object.type === "enemy") {
        object.patrolMinX = origin.patrolMinX + deltaX;
        object.patrolMaxX = origin.patrolMaxX + deltaX;
      }
    });
    markDirty();
    updateInspector();
    requestDraw();
  }

  function updateInspector() {
    const selectionCount = selectedIds.size;
    const object = getSelectedObject();
    if (selectionCount > 1) {
      emptyInspector.hidden = false;
      objectInspector.hidden = true;
      selectionTitle.textContent = `${selectionCount} objects selected`;
      emptyInspector.textContent = "Drag any selected object to move the group. Duplicate and Delete apply to the whole selection.";
      return;
    }
    emptyInspector.textContent = emptyInspectorDefault;
    emptyInspector.hidden = Boolean(object);
    objectInspector.hidden = !object;
    if (!object) {
      selectionTitle.textContent = "Nothing selected";
      return;
    }
    const key = `${object.type}:${object.enemyType || ""}`;
    selectionTitle.textContent = LABELS[key] || LABELS[`${object.type}:`] || object.type;

    objectInspector.querySelectorAll("[data-property]").forEach((container) => {
      const property = container.dataset.property;
      const visible = property === "enemyType" || property === "patrol"
        ? object.type === "enemy"
        : property === "ritualAction" || property === "ritualOrder"
          ? object.type === "ritual"
          : property === "textContent"
            ? object.type === "text" || object.type === "playerDialogue"
          : property === "textStyle"
            ? object.type === "text"
          : property === "dialogueTiming"
            ? object.type === "playerDialogue"
          : ["triggerMode", "triggerTiming", "blockedKeys", "heldKeys", "pawDirections"].includes(property)
            ? object.type === "pawStorm"
          : property === "screenEventTrigger"
            ? ["pawStormEnd", "screenBlock", "screenWalk"].includes(object.type)
          : property === "screenBlockSettings"
            ? object.type === "screenBlock"
          : property === "screenWalkSettings"
            ? object.type === "screenWalk"
            : true;
      container.hidden = !visible;
    });

    objectInspector.querySelectorAll("[data-field]").forEach((input) => {
      const value = object[input.dataset.field];
      input.value = Array.isArray(value) ? value.join(", ") : value ?? "";
    });
  }

  function inspectorInput(event) {
    const input = event.target.closest("[data-field]");
    const object = getSelectedObject();
    if (!input || !object) {
      return;
    }
    const field = input.dataset.field;
    const numericFields = new Set([
      "x", "y", "width", "height", "patrolMinX", "patrolMaxX",
      "order", "fontSize", "triggerX", "delaySeconds", "durationSeconds", "displaySeconds",
      "coveragePercent", "endX",
    ]);
    const arrayFields = new Set(["blockedKeys", "heldKeys", "pawDirections"]);
    const oldX = object.x;
    if (numericFields.has(field)) {
      object[field] = Number(input.value || 0);
      if (field === "width" || field === "height") {
        object[field] = Math.max(4, object[field]);
      }
      if (field === "coveragePercent") {
        object[field] = Math.max(10, Math.min(90, object[field]));
      }
      if (["durationSeconds", "displaySeconds"].includes(field)) {
        object[field] = Math.max(0.5, object[field]);
      }
      if (field === "endX") {
        object.endX = Math.max(Number(object.triggerX || object.x), object.endX);
      }
      if (
        field === "triggerX"
        && ["pawStormEnd", "screenBlock", "screenWalk"].includes(object.type)
      ) {
        object.x = object.triggerX;
        if (object.type === "screenBlock" && object.endX < object.triggerX) {
          object.endX = object.triggerX;
        }
      }
      if (field === "x") {
        const deltaX = object.x - oldX;
        if (object.type === "enemy") {
          object.patrolMinX += deltaX;
          object.patrolMaxX += deltaX;
        }
        if (INTERFERENCE_EVENT_TYPES.has(object.type)) {
          object.triggerX += deltaX;
        }
        if (object.type === "screenBlock") {
          object.endX += deltaX;
        }
      }
    } else if (arrayFields.has(field)) {
      object[field] = input.value.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    } else {
      object[field] = input.value;
    }
    markDirty();
    if (event.type !== "input" || !arrayFields.has(field)) {
      updateInspector();
    }
    clampView();
    requestDraw();
  }

  function duplicateSelected() {
    const objects = getSelectedObjects();
    if (!objects.length) {
      return;
    }
    const duplicates = objects.map((object) => model.duplicateObject(object));
    project.objects.push(...duplicates);
    setSelection(duplicates);
    markDirty();
    requestDraw();
  }

  function deleteSelected() {
    if (!selectedIds.size) {
      return;
    }
    project.objects = project.objects.filter((object) => !selectedIds.has(object.id));
    selectedIds = new Set();
    selectedId = null;
    markDirty();
    updateInspector();
    requestDraw();
  }

  function markDirty() {
    project.updatedAt = new Date().toISOString();
    saveStatus.textContent = "Saving…";
    saveStatus.classList.remove("is-saved");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveProject, 600);
  }

  function saveProject() {
    try {
      localStorage.setItem(STORAGE_KEY, model.serializeProject(project));
      saveStatus.textContent = "Saved locally";
      saveStatus.classList.add("is-saved");
    } catch (error) {
      saveStatus.textContent = "Save failed";
      saveStatus.classList.remove("is-saved");
    }
  }

  function exportProject() {
    saveProject();
    const blob = new Blob([model.serializeProject(project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    link.href = url;
    link.download = `${safeName || "catwalk-single-route"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function playtestProject() {
    saveProject();
    window.location.href = "./game2-playtest.html";
  }

  function playtestNearEditingPosition() {
    saveProject();
    const selected = getSelectedObject();
    const anchorX = selected
      ? Number(INTERFERENCE_EVENT_TYPES.has(selected.type) ? selected.triggerX : selected.x)
      : view.x + viewport.width / (2 * view.zoom);
    window.location.href = `./game2-playtest.html?anchor=${Math.max(0, Math.round(anchorX))}`;
  }

  async function importProjectFile(file) {
    try {
      project = model.parseProject(await file.text());
      selectedIds = new Set();
      selectedId = null;
      view = { x: 0, zoom: 1 };
      projectNameInput.value = project.name;
      updateInspector();
      saveProject();
      clampView();
      requestDraw();
    } catch (error) {
      alert(`Could not import this project.\n\n${error.message}`);
    } finally {
      importFile.value = "";
    }
  }

  function newProject() {
    if (!confirm("Start a new single route? Export the current JSON first if you want a separate backup.")) {
      return;
    }
    project = model.createEmptyProject();
    selectedIds = new Set();
    selectedId = null;
    view = { x: 0, zoom: 1 };
    projectNameInput.value = project.name;
    updateInspector();
    saveProject();
    clampView();
    requestDraw();
  }

  function setZoom(nextZoom, anchorScreenX = viewport.width / 2) {
    const oldZoom = view.zoom;
    const anchorWorld = view.x + anchorScreenX / oldZoom;
    view.zoom = Math.max(0.25, Math.min(2.5, nextZoom));
    view.x = anchorWorld - anchorScreenX / view.zoom;
    clampView();
    requestDraw();
  }

  function frameAll() {
    const contentWidth = Math.max(1200, getWorldWidth());
    view.zoom = Math.max(0.25, Math.min(1, (viewport.width - 80) / contentWidth));
    view.x = 0;
    clampView();
    requestDraw();
  }

  canvas.addEventListener("pointerdown", (event) => {
    const world = screenToWorld(event.clientX, event.clientY);
    const isPan = activeTool === "pan" || event.button === 1;
    if (placement && event.button === 0) {
      placeAt(world);
      return;
    }
    if (isPan) {
      pointerState = {
        mode: "pan",
        clientX: event.clientX,
        viewX: view.x,
      };
      canvasWrap.classList.add("is-panning");
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (activeTool === "select" && event.button === 0) {
      const object = objectAt(world.x, world.y);
      if (object) {
        if (!selectedIds.has(object.id)) {
          selectObject(object);
        } else {
          selectedId = object.id;
          updateInspector();
        }
        pointerState = {
          mode: "drag",
          startWorld: world,
          origins: selectionOrigins(),
        };
      } else {
        selectObject(null);
        pointerState = {
          mode: "marquee",
          startWorld: world,
          currentWorld: world,
        };
      }
      canvas.setPointerCapture(event.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    hoverWorld = screenToWorld(event.clientX, event.clientY);
    placementHint.style.left = `${event.offsetX}px`;
    placementHint.style.top = `${event.offsetY}px`;
    if (pointerState?.mode === "pan") {
      view.x = pointerState.viewX - (event.clientX - pointerState.clientX) / view.zoom;
      clampView();
    } else if (pointerState?.mode === "drag") {
      translateSelection(
        pointerState.origins,
        hoverWorld.x - pointerState.startWorld.x,
        hoverWorld.y - pointerState.startWorld.y,
      );
    } else if (pointerState?.mode === "marquee") {
      pointerState.currentWorld = hoverWorld;
      const rect = model.selectionRect(pointerState.startWorld, pointerState.currentWorld);
      const objects = project.objects.filter((object) => model.objectIntersectsSelection(object, rect));
      setSelection(objects);
    }
    requestDraw();
  });

  function endPointer(event) {
    pointerState = null;
    canvasWrap.classList.remove("is-panning");
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const rect = canvas.getBoundingClientRect();
      setZoom(view.zoom * (event.deltaY > 0 ? 0.9 : 1.1), event.clientX - rect.left);
    } else {
      view.x += (event.deltaX + event.deltaY) / view.zoom;
      clampView();
      requestDraw();
    }
  }, { passive: false });

  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });
  document.querySelectorAll("[data-palette-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const showModules = button.dataset.paletteTab === "modules";
      elementPalette.hidden = showModules;
      modulePalette.hidden = !showModules;
      document.querySelectorAll("[data-palette-tab]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
    });
  });

  objectInspector.addEventListener("input", inspectorInput);
  objectInspector.addEventListener("change", inspectorInput);
  projectNameInput.addEventListener("input", () => {
    project.name = projectNameInput.value || "Catwalk Single Route";
    markDirty();
    requestDraw();
  });
  horizontalScroll.addEventListener("input", () => {
    view.x = Number(horizontalScroll.value);
    clampView();
    requestDraw();
  });

  document.querySelector("#duplicate-object").addEventListener("click", duplicateSelected);
  document.querySelector("#delete-object").addEventListener("click", deleteSelected);
  document.querySelector("#save-project").addEventListener("click", saveProject);
  document.querySelector("#playtest-project").addEventListener("click", playtestProject);
  document.querySelector("#playtest-here").addEventListener("click", playtestNearEditingPosition);
  document.querySelector("#export-project").addEventListener("click", exportProject);
  document.querySelector("#import-project").addEventListener("click", () => importFile.click());
  document.querySelector("#new-project").addEventListener("click", newProject);
  document.querySelector("#zoom-in").addEventListener("click", () => setZoom(view.zoom * 1.2));
  document.querySelector("#zoom-out").addEventListener("click", () => setZoom(view.zoom / 1.2));
  document.querySelector("#frame-all").addEventListener("click", frameAll);
  importFile.addEventListener("change", () => {
    if (importFile.files[0]) {
      importProjectFile(importFile.files[0]);
    }
  });

  window.addEventListener("keydown", (event) => {
    const editingText = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || "");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveProject();
      return;
    }
    if (editingText) {
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelected();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelected();
    } else if (event.key.toLowerCase() === "v") {
      setTool("select");
    } else if (event.key.toLowerCase() === "h") {
      setTool("pan");
    } else if (event.key === "Escape") {
      setTool("select");
    } else if (selectedIds.size && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const amount = event.shiftKey ? 100 : model.GRID_SIZE;
      const deltaX = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0;
      const deltaY = event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0;
      translateSelection(selectionOrigins(), deltaX, deltaY);
    }
  });

  window.addEventListener("resize", resizeCanvas);
  renderPalettes();
  projectNameInput.value = project.name;
  updateInspector();
  setTool("select");
  resizeCanvas();
  if (Number.isFinite(requestedAnchor)) {
    view.x = model.viewXForAnchor(
      requestedAnchor,
      viewport.width,
      view.zoom,
      getWorldWidth(),
    );
    clampView();
    requestDraw();
  }
  saveProject();
}());
