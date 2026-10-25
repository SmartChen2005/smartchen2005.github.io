import * as T from './vendor/three/three.module.min.js';
export { T };
const cache = new Map();
const cached = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
export const box = (x=1,y=1,z=1) => cached(`b${x},${y},${z}`,()=>new T.BoxGeometry(x,y,z));
export const cylinder = (r=.1,h=1,n=20,top=r) => cached(`c${r},${h},${n},${top}`,()=>new T.CylinderGeometry(top,r,h,n));
export const sphere = (r=.1) => cached(`s${r}`,()=>new T.SphereGeometry(r,16,10));
export const torus = (r=.1,t=.015,arc=Math.PI*2) => cached(`t${r},${t},${arc}`,()=>new T.TorusGeometry(r,t,8,32,arc));
export function tube(points,r=.012,closed=false){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed,'centripetal');
  return new T.TubeGeometry(curve,Math.max(8,points.length*5),r,5,closed);
}

// Static repeated details become instanced draw calls, including the city's windows.
export function batch(parent){
  const groups=new Map(),dummy=new T.Object3D();
  return {
    add(geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
      const key=geometry.uuid+material.uuid;
      if(!groups.has(key))groups.set(key,{geometry,material,matrices:[]});
      dummy.position.set(...position);dummy.rotation.set(...rotation);dummy.scale.set(...scale);dummy.updateMatrix();
      groups.get(key).matrices.push(dummy.matrix.clone());
    },
    finish(){
      for(const {geometry,material,matrices} of groups.values()){
        const mesh=new T.InstancedMesh(geometry,material,matrices.length);
        matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
      }
      return parent;
    },
  };
}
export function mesh(parent,geometry,material,position=[0,0,0],rotation=[0,0,0]){
  const obj=new T.Mesh(geometry,material);obj.position.set(...position);obj.rotation.set(...rotation);
  obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;
}
export function toon(color){
  const data=new Uint8Array([70,140,205,255]);
  const gradient=new T.DataTexture(data,4,1,T.RedFormat);gradient.needsUpdate=true;
  gradient.minFilter=gradient.magFilter=T.NearestFilter;
  return new T.MeshToonMaterial({color,gradientMap:gradient});
}
export function loft(stations,{rings=32,steps=3,wheelArches=[],cockpit=false,profile=null,archRadius=.405,archCenter=.35}={}){
  const values=[],indices=[],sections=[];
  const cat=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
  for(let i=0;i<stations.length-1;i++)for(let k=0;k<steps;k++){
    const at=j=>stations[Math.max(0,Math.min(stations.length-1,j))];
    sections.push(stations[0].map((_,axis)=>cat(at(i-1)[axis],at(i)[axis],at(i+1)[axis],at(i+2)[axis],k/steps)));
  }
  sections.push(stations.at(-1));
  sections.forEach(([z,w,top,bottom=.24])=>{
    for(let i=0;i<rings;i++){
      const a=Math.PI*2*i/rings,c=Math.cos(a),s=Math.sin(a);
      if(profile){
        const q=i/rings*profile.length,k=Math.floor(q),f=q-k,u=profile[k],v=profile[(k+1)%profile.length];
        values.push(w*(u[0]+(v[0]-u[0])*f),bottom+(top-bottom)*(u[1]+(v[1]-u[1])*f),z);
      }else values.push(w*Math.sign(c)*Math.pow(Math.abs(c),.52),bottom+(top-bottom)*(.5+.5*Math.sign(s)*Math.pow(Math.abs(s),.75)),z);
    }
  });
  const append=(a,b,c)=>{
    const x=(values[a*3]+values[b*3]+values[c*3])/3,y=(values[a*3+1]+values[b*3+1]+values[c*3+1])/3,z=(values[a*3+2]+values[b*3+2]+values[c*3+2])/3;
    if(Math.abs(x)>.56&&wheelArches.some(w=>Math.hypot(z-w,y-archCenter)<archRadius))return;
    if(cockpit&&Math.abs(x)<.76&&y>.8&&z>-1.24&&z<.23)return;
    indices.push(a,b,c);
  };
  for(let n=0;n<sections.length-1;n++)for(let i=0;i<rings;i++){
    const a=n*rings+i,b=(n+1)*rings+i,c=(n+1)*rings+(i+1)%rings,d=n*rings+(i+1)%rings;
    append(a,c,b);append(a,d,c);
  }
  for(const n of [0,sections.length-1])for(let i=1;i<rings-1;i++){
    if(n===0)indices.push(0,i+1,i);else indices.push(n*rings,n*rings+i,n*rings+i+1);
  }
  // Snap the cut boundary to the actual circular arch instead of leaving the
  // sampled loft's zigzag triangle edge visible around a close-up tire.
  const edges=new Map();
  for(let i=0;i<indices.length;i+=3)for(let k=0;k<3;k++){
    const a=indices[i+k],b=indices[i+(k+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;
    const item=edges.get(key)||{a,b,count:0};item.count++;edges.set(key,item);
  }
  const boundary=new Set();for(const e of edges.values())if(e.count===1){boundary.add(e.a);boundary.add(e.b);}
  for(const index of boundary){
    const n=index*3,x=values[n],y=values[n+1],z=values[n+2];if(Math.abs(x)<.76||y>.81)continue;
    const wheel=wheelArches.find(w=>Math.hypot(z-w,y-archCenter)<archRadius+.105);if(wheel===undefined)continue;
    const length=Math.hypot(z-wheel,y-archCenter);if(length<.001)continue;
    values[n]=Math.sign(x)*Math.max(Math.abs(x),.86);values[n+1]=archCenter+(y-archCenter)*archRadius/length;values[n+2]=wheel+(z-wheel)*archRadius/length;
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(values,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function polygon(points){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
  const indices=[];for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);g.setIndex(indices);g.computeVertexNormals();return g;
}
