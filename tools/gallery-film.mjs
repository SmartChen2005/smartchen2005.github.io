import { publicationNodes } from './gallery-document.mjs';

const plain=text=>Array.isArray(text)?text.map(t=>t.plain_text??t.text?.content??'').join(''):String(text||'');
const group=(presentation,children)=>({type:'group',presentation,children});

// Keep native columns, every photograph and the authored text sequence intact.
// Group standalone credit/poem lines and the original backstage carousel only.
export function filmSections(nodes) {
  const source=publicationNodes(nodes),result=[];
  for(let i=0;i<source.length;i++){
    if(source[i].type!=='paragraph'){result.push(source[i]);continue;}
    const text=[];
    while(source[i]?.type==='paragraph')text.push(source[i++]);
    const marker=text.findIndex(n=>/^behind the scene photos$/i.test(plain(n.text).trim()));
    const images=[];
    if(marker>=0)while(source[i]?.type==='image')images.push(source[i++]);
    if(marker>=0&&images.length>1){
      if(marker)result.push(group('film-copy',text.slice(0,marker)));
      result.push(group('film-backstage',[group('film-copy',text.slice(marker)),group('film-carousel',images)]));
    }else{
      result.push(group('film-copy',text),...images);
    }
    i--;
  }
  return result;
}
