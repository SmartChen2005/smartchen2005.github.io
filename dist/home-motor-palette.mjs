// Street shots use three printing inks; cosmic palettes also guide native text.
export const MOTOR_PALETTES=[
  {ink:'#101c2c',accent:'#8198b6',paper:'#e8eff5'},
  {ink:'#151f29',accent:'#829da6',paper:'#e8edf0'},
  {ink:'#111c30',accent:'#577ec2',paper:'#e9edf8'},
  {ink:'#060b24',accent:'#5adce8',paper:'#eff6ff'},
  {ink:'#060a25',accent:'#a189ff',paper:'#f1f4ff'},
  {ink:'#04091d',accent:'#69d5f5',paper:'#edf6ff'},
  {ink:'#10242c',accent:'#5e96a3',paper:'#e6f0f1'},
  {ink:'#152039',accent:'#7e8ec0',paper:'#edf0f8'},
];
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
