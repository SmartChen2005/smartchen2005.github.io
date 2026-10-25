// The complete chase shares graphite ground, pale contours and amber lanterns.
export const MOTOR_PALETTES=[{ink:'#3d3d41',accent:'#eac36b',paper:'#f2f1ed'}];
export const motorPalette=index=>MOTOR_PALETTES[((index%MOTOR_PALETTES.length)+MOTOR_PALETTES.length)%MOTOR_PALETTES.length];
export const THREE_INK_FRAGMENT=`
uniform sampler2D source;
uniform vec3 ink;
uniform vec3 accent;
uniform vec3 paper;
uniform bool cutout;
varying vec2 vUv;
void main(){
  vec4 pixel=texture2D(source,vUv);
  float value=dot(pixel.rgb/max(pixel.a,.001),vec3(0.2126,0.7152,0.0722));
  vec3 printed=value<0.075?ink:(value<0.42?accent:paper);
  gl_FragColor=vec4(printed,cutout?pixel.a:1.0);
  #include <colorspace_fragment>
  if(cutout)gl_FragColor.rgb*=gl_FragColor.a;
}`;
