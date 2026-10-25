// Each shot has exactly three printing inks, including lights and backfire.
export const MOTOR_PALETTES=[
  {ink:'#171d24',accent:'#b67550',paper:'#eae2cf'},
  {ink:'#151d22',accent:'#8c9b91',paper:'#e8e5d9'},
  {ink:'#141a20',accent:'#c74738',paper:'#ede8dc'},
  {ink:'#071521',accent:'#367f96',paper:'#e3f0ec'},
  {ink:'#172722',accent:'#6c8874',paper:'#eee7d7'},
  {ink:'#040c19',accent:'#369abb',paper:'#e8f4f4'},
  {ink:'#1b1c22',accent:'#ba7140',paper:'#ede1cb'},
  {ink:'#1b2428',accent:'#9d654e',paper:'#eae4d5'},
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
  float value=dot(pixel.rgb,vec3(0.2126,0.7152,0.0722));
  vec3 printed=value<0.075?ink:(value<0.42?accent:paper);
  gl_FragColor=vec4(printed,cutout?step(0.01,pixel.a):1.0);
  #include <colorspace_fragment>
}`;
