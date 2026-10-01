// Differential check against the actual portable C++ functions in Control.ino.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {distanceToZone,rhythmHit,noteIndex,MusicEngine} from '../dist/projects/world-sensing-music-station/music-engine.mjs';
const source=fs.readFileSync('dist/projects/world-sensing-music-station/files/Control.ino','utf8');
function extract(name){const start=source.search(new RegExp('(?:int8_t|uint8_t|uint16_t|const uint16_t\\*) '+name+'\\('));assert(start>=0);let cursor=source.indexOf('{',start),depth=1,end=cursor+1;while(depth){const c=source[end++];if(c==='{')depth++;if(c==='}')depth--;}return source.slice(start,end);}
const enums=source.match(/enum GenreMode[^;]+;/)[0];
const constants=source.match(/const float (?:MIN_CM|MAX_CM) =[^;]+;/g).join('\n');
const scales=source.match(/const uint16_t SCALE_\w+\[8\][^;]+;/g).join('\n');
const cpp=`#include <stdint.h>\n#include <iostream>\n#define constrain(x,a,b) ((x)<(a)?(a):((x)>(b)?(b):(x)))\nlong map(long x,long a,long b,long c,long d){return (x-a)*(d-c)/(b-a)+c;}\n${enums}\n${constants}\n${scales}\nGenreMode mode=MODE_AMBIENT;\n${['distanceToZone','makeRhythmHit','writeNoteIndexFromZone','currentScale','noteFromIndex'].map(extract).join('\n')}\nint main(){int op,z,step,m,bass;float cm,spd;while(std::cin>>op){if(op==0){std::cin>>cm;std::cout<<(int)distanceToZone(cm);}if(op==1){std::cin>>z>>spd>>step>>m;std::cout<<(int)makeRhythmHit(z,spd,step,(GenreMode)m);}if(op==2){std::cin>>z>>m>>bass;std::cout<<(int)writeNoteIndexFromZone(z,(GenreMode)m,bass);}if(op==3){std::cin>>z>>m>>bass;mode=(GenreMode)m;std::cout<<noteFromIndex(z,bass);}std::cout<<"\\n";}}`;
fs.mkdirSync('tools/music-qa',{recursive:true});fs.writeFileSync('tools/music-qa/firmware-reference.cpp',cpp);
const executable=process.platform==='win32'?'tools/music-qa/firmware-reference.exe':'tools/music-qa/firmware-reference';
const compiled=spawnSync(process.env.CXX||'g++',['-std=c++17','tools/music-qa/firmware-reference.cpp','-o',executable],{encoding:'utf8'});
assert.equal(compiled.status,0,compiled.stderr||String(compiled.error));
const input=[],expected=[],modes=['ambient','trap','techno'];
for(const cm of [9.99,10,34.99,35,58,59,82,83,107,108,131,132,155,156,179,180,180.01]){input.push(`0 ${cm}`);expected.push(distanceToZone(cm));}
for(let m=0;m<3;m++)for(const z of [-1,0,2,4,7])for(const spd of [0,.6,.8,1.2,1.6,1.8,2.6,3])for(let step=0;step<8;step++){input.push(`1 ${z} ${spd} ${step} ${m}`);expected.push(rhythmHit(z,spd,step,modes[m]));}
for(let m=0;m<3;m++)for(let z=-1;z<8;z++)for(const melody of [0,1]){input.push(`2 ${z} ${m} ${melody}`);expected.push(noteIndex(z,modes[m],!!melody));}
for(let m=0;m<3;m++)for(let z=-1;z<8;z++)for(const bass of [0,1]){const engine=new MusicEngine();engine.setMode(modes[m]);input.push(`3 ${z} ${m} ${bass}`);expected.push(engine.frequencies([0,bass?z:-1,bass?-1:z])[bass?1:2]);}
const result=spawnSync(executable,[],{input:input.join('\n')+'\n',encoding:'utf8'});assert.equal(result.status,0,result.stderr);
assert.deepEqual(result.stdout.trim().split(/\s+/).map(Number),expected);
console.log(`Passed: ${expected.length} differential cases against original Control.ino C++: zones, drum bits, note mapping and actual audio frequencies.`);
