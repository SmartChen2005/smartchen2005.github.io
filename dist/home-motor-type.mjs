import { T, box, mesh, toon } from './home-motor-geometry.mjs?rev=20261024-pop-city';
export const MOTOR_SENTENCE='Smart Chen is a (game) designer, filmmaker, and car enthusiast.';
export const TYPE_PLACEMENTS=[{kind:'under',z:42,y:2.55},{kind:'over',z:63,y:.025},{kind:'under',z:133,y:2.55}];
const inside=(point,polygon)=>{
  let yes=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)yes=!yes;
  }return yes;
};
function glyphShapes(data){
  const paths=data.contours.map(commands=>{
    const path=new T.Path();
    for(const [op,...p] of commands){
      if(op==='M')path.moveTo(...p);else if(op==='L')path.lineTo(...p);else if(op==='Q')path.quadraticCurveTo(...p);else if(op==='C')path.bezierCurveTo(...p);else path.closePath();
    }
    const points=path.getPoints(8),area=Math.abs(T.ShapeUtils.area(points));return {path,points,area,parent:null,depth:0};
  }).sort((a,b)=>b.area-a.area);
  for(let i=0;i<paths.length;i++){
    const node=paths[i];
    for(let j=i-1;j>=0;j--)if(inside(node.points[0],paths[j].points)){node.parent=paths[j];node.depth=paths[j].depth+1;break;}
  }
  const shapes=[];
  for(const node of paths)if(node.depth%2===0){
    const shape=new T.Shape();shape.curves=node.path.curves;shape.autoClose=true;
    for(const hole of paths)if(hole.parent===node&&hole.depth%2===1)shape.holes.push(hole.path);
    shapes.push(shape);
  }
  return shapes;
}
export function createSentenceGeometry(font){
  if(font.text!==MOTOR_SENTENCE)throw new Error('The scene sentence must match the homepage.');
  const parts=Array.from({length:4},()=>({position:[],normal:[]}));
  let x=0;
  for(let i=0;i<MOTOR_SENTENCE.length;i++){
    const char=MOTOR_SENTENCE[i],glyph=(i<10?font.italic:font.regular)[char];
    if(glyph.contours.length){
      const geometry=new T.ExtrudeGeometry(glyphShapes(glyph),{depth:.15,bevelEnabled:true,bevelThickness:.012,bevelSize:.007,bevelSegments:1,curveSegments:7,steps:1});
      const pos=geometry.attributes.position,norm=geometry.attributes.normal;
      for(const group of geometry.groups){
        const role=group.materialIndex===1?3:(i<10?0:i<39?1:2),out=parts[role];
        for(let n=group.start;n<group.start+group.count;n++){
          out.position.push(pos.getX(n)+x,pos.getY(n),pos.getZ(n));out.normal.push(norm.getX(n),norm.getY(n),norm.getZ(n));
        }
      }
      geometry.dispose();
    }
    x+=glyph.advance;
  }
  const geometries=parts.map(part=>{
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new T.Float32BufferAttribute(part.normal,3));g.translate(-x/2,0,0);return g;
  });
  return {geometries,width:x,scale:15.2/x};
}
export function createStreetType(font){
  const root=new T.Group();root.name='physical-homepage-sentence';
  const data=createSentenceGeometry(font),materials=[toon('#ffe600'),toon('#ff278f'),toon('#fff1c9'),toon('#17132c')];
  const placements=[];
  for(const placement of TYPE_PLACEMENTS){
    const group=new T.Group();group.name=`sentence-${placement.kind}`;group.position.set(0,placement.y,placement.z);
    if(placement.kind==='over')group.rotation.x=-Math.PI/2;
    const glyphs=new T.Group();glyphs.scale.setScalar(data.scale);
    if(placement.kind==='over')glyphs.rotation.z=Math.PI;
    else if(placement.z===42)glyphs.rotation.y=Math.PI;
    data.geometries.forEach((g,i)=>mesh(glyphs,g,materials[i]));group.add(glyphs);root.add(group);placements.push(group);
    if(placement.kind==='under'){
      mesh(root,box(15.6,.14,.32),materials[3],[0,placement.y-.1,placement.z+.03]);
      for(const x of [-7.7,7.7])mesh(root,box(.14,placement.y,.18),materials[3],[x,placement.y/2,placement.z]);
    }
  }
  return {root,placements,apply(p){materials[0].color.set(p.accent);materials[1].color.set(p.walls[0]);materials[2].color.set(p.trim);materials[3].color.set(p.ink);}};
}
