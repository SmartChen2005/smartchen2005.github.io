import { T,box,cylinder,sphere,torus,batch,toon } from './home-motor-geometry.mjs?rev=20261025-cosmic';
export function createStreetLanterns(half,{start=-35,end=175,spacing=14}={}){
 const root=new T.Group();root.name='classical-amber-street-lanterns';
 const iron=toon('#242424'),glass=new T.MeshBasicMaterial({color:'#ffffff'}),b=batch(root),anchors=new Map(),centers=[];
 const pane=new T.CylinderGeometry(.21,.115,.64,4,1,false);pane.name='amber-lantern-glass';let id=0,anchor;
 function add(g,m,p,r=[0,0,0]){const key=g.uuid+m.uuid;if(!anchors.has(key))anchors.set(key,[]);anchors.get(key).push(anchor);b.add(g,m,p,r);}
 for(const side of [-1,1])for(let z=start;z<=end;z+=spacing){
  const x=side*(half+.57);anchor={id:id++,center:[x,2,z]};centers.push(anchor.center);
  add(box(.36,.18,.36),iron,[x,.09,z]);add(cylinder(.16,.32,8,.12),iron,[x,.34,z]);
  add(cylinder(.10,.48,12,.075),iron,[x,.70,z]);add(cylinder(.061,2.55,12,.048),iron,[x,2.10,z]);
  for(let k=0;k<6;k++){const a=k*Math.PI/3;add(cylinder(.009,2.14,6),iron,[x+Math.cos(a)*.058,2.07,z+Math.sin(a)*.058]);}
  for(const [y,r] of [[.49,.15],[.91,.095],[3.27,.105],[3.37,.15]])add(torus(r,.018),iron,[x,y,z],[Math.PI/2,0,0]);
  add(cylinder(.17,.12,4,.13),iron,[x,3.37,z],[0,Math.PI/4,0]);add(pane,glass,[x,3.75,z],[0,Math.PI/4,0]);
  for(const sx of [-1,1])for(const sz of [-1,1]){
   const p=new T.Vector3(x+sx*.082,3.43,z+sz*.082),q=new T.Vector3(x+sx*.151,4.07,z+sz*.151),v=q.clone().sub(p),e=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));
   add(cylinder(.011,v.length(),6),iron,p.add(q).multiplyScalar(.5).toArray(),[e.x,e.y,e.z]);
  }
  add(cylinder(.27,.10,4,.23),iron,[x,4.09,z],[0,Math.PI/4,0]);add(cylinder(.255,.22,4,.06),iron,[x,4.23,z],[0,Math.PI/4,0]);
  add(sphere(.055),iron,[x,4.40,z]);add(cylinder(.041,.15,8,0),iron,[x,4.50,z]);
 }
 b.finish();root.traverse(n=>{if(!n.isInstancedMesh)return;n.userData.burstAnchors=anchors.get(n.geometry.uuid+n.material.uuid);if(n.geometry===pane)n.layers.enable(3);});
 root.userData={count:id,centers};return root;
}
