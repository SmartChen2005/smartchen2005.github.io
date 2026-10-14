import { escapeHtml, inline, publicationNodes, renderDocument } from './gallery-document.mjs';

export function practiceSections(nodes) {
  const sections=[],intro=[];
  for(const node of publicationNodes(nodes)){
    if(node.type==='heading'&&node.level===2)sections.push({heading:node,children:[],id:'practice-section-'+(sections.length+1)});
    else if(sections.length)sections.at(-1).children.push(node);
    else intro.push(node);
  }
  return {intro,sections};
}

export function renderPractice(nodes,options) {
  const {intro,sections}=practiceSections(nodes);
  const index=sections.length?`<nav class="practice-index" aria-label="Assignments">${sections.map(s=>`<a class="text-link" href="#${s.id}">${inline(s.heading.text)}</a>`).join('')}</nav>`:'';
  const document=renderDocument(intro,options)+sections.map(s=>`<section class="practice-section${/Assignment #4|Final Portfolio/.test(inline(s.heading.text))?' practice-feature':''}" id="${escapeHtml(s.id)}"><h2 class="story-heading">${inline(s.heading.text)}</h2><div class="practice-works">${renderDocument(imageCaptions(s.children),options)}</div></section>`).join('');
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
