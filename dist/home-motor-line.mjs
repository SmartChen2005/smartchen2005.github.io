// A single shot uses hidden-line drawing; all other rendering styles stay intact.
export const isMotorLineShot=shot=>shot.id==='exhaust-exit';
export const MOTOR_LINE_FRAGMENT=`
uniform sampler2D source;uniform sampler2D depthSource;
uniform sampler2D cars;uniform sampler2D carDepth;
uniform vec2 texel;uniform vec3 ink;uniform vec3 paper;uniform vec3 accent;
uniform mat4 inverseViewProjection;uniform mat4 previousViewProjection;
uniform bool moving;varying vec2 vUv;
float distanceAt(sampler2D depth,vec2 uv){float z=texture2D(depth,uv).x;return .08*150./(150.-z*(150.-.08));}
float contour(sampler2D normals,sampler2D depth,vec2 uv){
 vec4 center=texture2D(normals,uv);float z=texture2D(depth,uv).x,edge=0.;
 for(int i=0;i<2;i++){
  vec2 axis=i==0?vec2(1,0):vec2(0,1),stepUv=axis*texel*.8;
  vec2 a=clamp(uv+stepUv,texel,1.-texel),b=clamp(uv-stepUv,texel,1.-texel);
  vec4 plus=texture2D(normals,a),minus=texture2D(normals,b);
  float normalDelta=max(length(center.rgb-plus.rgb),length(center.rgb-minus.rgb));
  float normalEdge=smoothstep(.10,.24,normalDelta);
  // Hardware depth is affine across a planar face: second differences reject
  // its perspective slope, leaving discontinuities rather than a filled road.
  float curvature=max(0.,abs(texture2D(depth,a).x+texture2D(depth,b).x-2.*z)-.0000003)/max(1.-z,.00002);
  float depthEdge=smoothstep(.003,.012,curvature)*smoothstep(.02,.08,normalDelta);
  edge=max(edge,max(normalEdge,depthEdge)*max(center.a,max(plus.a,minus.a)));
 }
 return edge;
}
float starHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 skyStars(vec2 uv){
 // World directions keep the sky stable as the chase translates through town.
 vec2 ndc=uv*2.-1.;vec4 nearPoint=inverseViewProjection*vec4(ndc,-1.,1.),farPoint=inverseViewProjection*vec4(ndc,1.,1.);
 vec3 ray=normalize(farPoint.xyz/farPoint.w-nearPoint.xyz/nearPoint.w);
 vec2 angle=vec2(atan(ray.x,ray.z),asin(clamp(ray.y,-1.,1.)));
 vec2 p=angle*68.,cell=floor(p),offset=vec2(starHash(cell+3.),starHash(cell+17.))*.7+.15,d=fract(p)-offset;
 float r=mix(.045,.095,starHash(cell+29.));
 float pin=(1.-smoothstep(r*.15,r,length(d)))*step(.82,starHash(cell+41.));
 vec3 stars=mix(accent,paper,starHash(cell+57.))*pin*mix(.45,1.25,starHash(cell+71.));
 p=angle*26.;cell=floor(p);d=fract(p)-(vec2(starHash(cell+91.),starHash(cell+107.))*.6+.2);
 float core=exp(-dot(d,d)*1400.);
 float cross=(exp(-abs(d.x)*180.-abs(d.y)*16.)+exp(-abs(d.y)*180.-abs(d.x)*16.))*.23;
 stars+=paper*(core+cross)*step(.94,starHash(cell+139.));return stars;
}
void main(){
 float environmentEdge=contour(source,depthSource,vUv);float vehicleEdge=contour(cars,carDepth,vUv);
 vec2 velocity=vec2(0.);float depth=texture2D(depthSource,vUv).x;
 if(moving&&depth<.999999){vec4 world=inverseViewProjection*vec4(vUv*2.-1.,depth*2.-1.,1.);world/=world.w;vec4 past=previousViewProjection*world;velocity=vUv-(past.xy/past.w*.5+.5);velocity*=min(1.,.045/max(length(velocity),.00001));}
 // One peripheral echo keeps the stroke drawing quiet around the main sentence.
 float echo=contour(source,depthSource,clamp(vUv+velocity*.3,texel,1.-texel))*.06*smoothstep(.12,.4,abs(vUv.x-.5));
 float visible=step(texture2D(carDepth,vUv).x,depth+.00003)*texture2D(cars,vUv).a;
 float haze=1.-smoothstep(38.,110.,distanceAt(depthSource,vUv));
 float line=mix(min(1.,environmentEdge*.42+echo)*mix(.28,1.,haze),vehicleEdge*.92,visible);
 vec3 background=ink;
 // Only empty sky receives stars. Buildings, road and vehicle interiors keep their flat ground.
 if(depth>.999999&&texture2D(cars,vUv).a<.01)background+=skyStars(vUv);
 gl_FragColor=vec4(mix(background,paper,clamp(line,0.,1.)),1.);
 #include <colorspace_fragment>
}`;
