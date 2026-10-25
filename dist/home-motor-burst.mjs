import { T } from './home-motor-geometry.mjs?rev=20261025-cosmic';
import { motion } from './home-motor-motion.mjs?rev=20261025-cosmic';

// A seeded, analytic shock wave: asking for a previous frame restores that frame
// exactly. Geometry remains instanced, with no physics loop or particle objects.
export function createArchitectureBurst(roots,facades){
  const batches=[],base=new T.Matrix4(),center=new T.Vector3();let serial=0,active=false;
  for(const group of roots)group.traverse(mesh=>{
    if(!mesh.isInstancedMesh)return;
    mesh.geometry.computeBoundingBox();const pivot=mesh.geometry.boundingBox.getCenter(new T.Vector3()),pieces=[];
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,base);center.copy(pivot).applyMatrix4(base);
      const side=center.x<0?-1:1;
      const frontage=facades.filter(f=>f.side===side).reduce((a,b)=>Math.abs(b.z-center.z)<Math.abs(a.z-center.z)?b:a);
      const seed=serial++,rand=salt=>motion.rand(seed,salt);
      pieces.push({matrix:base.clone(),center:center.clone(),side,
        delay:.69+Math.abs(frontage.z+21.5)/560+rand(201)*.10,
        outward:6+rand(202)*8,lift:3.7+rand(203)*4.6,drift:(rand(204)-.5)*24,
        axis:new T.Vector3(rand(205)-.5,rand(206)-.5,rand(207)-.5).normalize(),spin:(.45+rand(208)*1.2)*(seed%2?1:-1)});
    }
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    batches.push({mesh,pieces,original:mesh.instanceMatrix.array.slice(),culled:mesh.frustumCulled});
  });
  const rotation=new T.Matrix4(),transform=new T.Matrix4();
  return {batches,
    update(local,enabled){
      if(!enabled){
        if(active)for(const {mesh,original,culled} of batches){mesh.instanceMatrix.array.set(original);mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=culled;}
        active=false;return;
      }
      active=true;
      for(const {mesh,pieces} of batches){
        // Resting bounds must not cull a flying spire or an airborne facade.
        mesh.frustumCulled=false;
        for(let i=0;i<pieces.length;i++){
          const p=pieces[i],age=Math.max(0,local-p.delay);
          // Slow release and broad depth-wise fanning: the wave reaches distant
          // houses early, while individual pieces rise and tumble more gently.
          const t=age-.25*(1-Math.exp(-age/.25));
          if(!t){mesh.setMatrixAt(i,p.matrix);continue;}
          rotation.makeRotationAxis(p.axis,p.spin*t*.38);
          transform.makeTranslation(-p.center.x,-p.center.y,-p.center.z).premultiply(rotation);
          transform.elements[12]+=p.center.x+p.side*(p.outward*t+1.8*t*t);
          transform.elements[13]+=p.center.y+p.lift*t+.6*t*t;
          transform.elements[14]+=p.center.z+p.drift*t;
          transform.multiply(p.matrix);mesh.setMatrixAt(i,transform);
        }
        mesh.instanceMatrix.needsUpdate=true;
      }
    },
  };
}
