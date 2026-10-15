import { escapeHtml, inline, publicationNodes, renderDocument, allImages, landscapeRatio } from './gallery-document.mjs';

export function practiceSections(nodes, prefix='practice') {
  const sections=[],intro=[];
  for(const node of publicationNodes(nodes)){
    if(node.type==='heading'&&node.level===2)sections.push({heading:node,children:[],id:prefix+'-section-'+(sections.length+1)});
    else if(sections.length)sections.at(-1).children.push(node);
    else intro.push(node);
  }
  return {intro,sections};
}

export function renderPractice(nodes,options) {
  return renderSections(nodes,options,{prefix:'practice',label:'Assignments',practice:true});
}

// Share the assignment index interaction without applying its small-print sizing.
export function renderChapters(nodes,options) {
  return renderSections(nodes,options,{prefix:'chapter',label:'Contents',practice:false});
}

function renderSections(nodes,options,{prefix,label:indexLabel,practice}) {
  const {intro,sections}=practiceSections(nodes,prefix);
  const referenceRatio=landscapeRatio(publicationNodes(nodes),options.resolveMedia);
  let imageOffset=allImages(intro).filter(i=>!i.caption?.length).length;
  const renderSection=children=>{
    const prepared=imageCaptions(children);
    const html=renderDocument(prepared,{...options,referenceRatio,imageOffset});
    imageOffset+=allImages(prepared).filter(i=>!i.caption?.length).length;
    return html;
  };
  const label=s=>inline(s.heading.text).replace(/^\((.*)\)$/s,'$1');
  const index=sections.length?`<nav class="practice-index" id="${prefix}-contents" aria-label="${indexLabel}">${sections.map(s=>`<a class="text-link" href="#${s.id}">${label(s)}</a>`).join('')}</nav>`:'';
  const document=renderDocument(intro,{...options,referenceRatio})+sections.map(s=>`<section class="${practice?'practice-section':'chapter-section'}${practice&&/Assignment #4|Final Portfolio/.test(label(s))?' practice-feature':''}" id="${escapeHtml(s.id)}"><h2 class="story-heading"><a href="#${prefix}-contents">${label(s)}<span class="sr-only"> — back to contents</span></a></h2><div class="${practice?'practice':'chapter'}-works">${renderSection(s.children)}</div></section>`).join('');
  return {index,document};
}

// Source captions remain editable paragraphs in Notion; present them with their photograph.
function imageCaptions(nodes) {
  const result=[];
  for(let i=0;i<nodes.length;i++){
    const node=nodes[i],following=nodes[i+1];
    if(node.type==='columns')result.push({...node,columns:node.columns.map(c=>({...c,children:imageCaptions(c.children)}))});
    else if(node.type==='image'&&!node.caption?.length&&following?.type==='paragraph'){
      const caption=Array.isArray(following.text)?following.text.map(t=>t.plain_text??t.text?.content??'').join(''):following.text;
      if(caption?.length<=140){result.push({...node,caption:following.text});i++;}
      else result.push(node);
    }else result.push(node);
  }
  return result;
}
