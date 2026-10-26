// All five setups share the approved unfilled, starry drawing finish.
export const isMotorLineShot=shot=>['lane','circuit','tunnel'].includes(shot.mode);
export const MOTOR_LINE_FRAGMENT=`
uniform sampler2D source;uniform sampler2D depthSource;
uniform sampler2D cars;uniform sampler2D carDepth;uniform sampler2D lampSource;uniform sampler2D lampDepth;
uniform vec2 texel;uniform vec3 ink;uniform vec3 paper;uniform vec3 accent;
uniform mat4 inverseViewProjection;uniform mat4 previousViewProjection;
uniform float burst;uniform float loopFocus;uniform bool moving;varying vec2 vUv;
float distanceAt(sampler2D depth,vec2 uv){float z=texture2D(depth,uv).x;return .08*180./(180.-z*(180.-.08));}
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
float echoContour(vec2 uv){
 // A shutter sample outside the image contributes no stroke. Clamping it would
 // stretch a border contour into a filled band during the extended chase.
 float inside=step(texel.x,uv.x)*step(texel.y,uv.y)*step(uv.x,1.-texel.x)*step(uv.y,1.-texel.y);
 return inside*contour(source,depthSource,clamp(uv,texel,1.-texel));
}
float starHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 skyStars(vec2 uv){
 // World directions keep the sky stable as the chase translates through town.
 vec2 ndc=uv*2.-1.;vec4 nearPoint=inverseViewProjection*vec4(ndc,-1.,1.),farPoint=inverseViewProjection*vec4(ndc,1.,1.);
 vec3 ray=normalize(farPoint.xyz/farPoint.w-nearPoint.xyz/nearPoint.w);
 vec2 angle=vec2(atan(ray.x,ray.z),asin(clamp(ray.y,-1.,1.)));
 vec2 p=angle*68.,cell=floor(p),offset=vec2(starHash(cell+3.),starHash(cell+17.))*.7+.15,d=fract(p)-offset;
 float r=mix(.065,.14,starHash(cell+29.));
 float pin=(1.-smoothstep(r*.15,r,length(d)))*step(.78,starHash(cell+41.));
 vec3 stars=paper*pin*mix(.65,1.2,starHash(cell+71.));
 p=angle*22.;cell=floor(p);d=fract(p)-(vec2(starHash(cell+91.),starHash(cell+107.))*.6+.2);
 float core=exp(-dot(d,d)*1050.);
 float cross=(exp(-abs(d.x)*180.-abs(d.y)*16.)+exp(-abs(d.y)*180.-abs(d.x)*16.))*.30;
 stars+=paper*(core+cross)*step(.91,starHash(cell+139.));return stars;
}
float lantern(vec2 uv){
 float nearest=min(texture2D(depthSource,uv).x,texture2D(carDepth,uv).x),depth=texture2D(lampDepth,uv).x;
 return texture2D(lampSource,uv).a*step(depth,nearest+.000003);
}
void main(){
 float environmentEdge=contour(source,depthSource,vUv);float vehicleEdge=contour(cars,carDepth,vUv);
 vec2 velocity=vec2(0.);float depth=texture2D(depthSource,vUv).x;
 if(moving&&depth<.999999){vec4 world=inverseViewProjection*vec4(vUv*2.-1.,depth*2.-1.,1.);world/=world.w;vec4 past=previousViewProjection*world;velocity=vUv-(past.xy/past.w*.5+.5);velocity*=min(1.,mix(.045,.09,burst)/max(length(velocity),.00001));}
 // Peripheral shutter echoes lengthen with the boost; cars and text stay sharp.
 float peripheral=smoothstep(.12,.4,abs(vUv.x-.5));
 float echo=echoContour(vUv+velocity*.3)*mix(.06,.17,burst)*peripheral;
 echo+=echoContour(vUv+velocity*.65)*.11*burst*peripheral;
 float visible=step(texture2D(carDepth,vUv).x,depth+.00003)*texture2D(cars,vUv).a;
 float haze=max(1.-smoothstep(38.,110.,distanceAt(depthSource,vUv)),loopFocus*.65);
 float line=mix(min(1.,environmentEdge*.42*(1.+loopFocus*.6)+echo)*mix(.28,1.,haze),vehicleEdge*.92,visible);
 vec3 background=ink;
 // Uncovered sky receives stars; the dissolving road gradually admits them.
 // Building and vehicle interiors keep their flat ground.
 if(texture2D(cars,vUv).a<.01)background+=skyStars(vUv)*(1.-texture2D(source,vUv).a);
 float core=lantern(vUv),halo=0.;
 for(int i=0;i<4;i++){float a=float(i)*1.570796;halo+=lantern(clamp(vUv+vec2(cos(a),sin(a))*texel*7.,texel,1.-texel))*.25;}
 vec3 color=mix(background,paper,clamp(line,0.,1.));color=mix(color,mix(accent,paper,.15),core*.94);color+=accent*halo*.16;
 gl_FragColor=vec4(color,1.);
 #include <colorspace_fragment>
}`;
