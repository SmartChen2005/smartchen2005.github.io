// Notion block/Markdown adapters and one shared editorial renderer.
// Both the connected Notion snapshot and the REST sync use this same document model.
export const escapeHtml = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function safeUrl(value, {media=false}={}) {
  try { const url=new URL(value); return (media ? url.protocol==='https:' : ['https:','http:','mailto:'].includes(url.protocol)) ? url.href : null; } catch { return null; }
}
export function mediaFilename(value) {
  try { const url=new URL(value);return url.searchParams.get('name')||decodeURIComponent(url.pathname.split('/').at(-1)); } catch {return '';}
}
export function canonicalMediaUrl(value) {
  try {const url=new URL(value);if(url.protocol==='https:'){url.search='';url.hash='';}return url.href;}catch{return value;}
}
export function mediaIdentity(value) {
  try {const u=new URL(value),parts=u.pathname.split('/').filter(Boolean);
    const id=u.protocol==='notion-file-block:'?parts[0]:u.protocol==='https:'&&u.hostname.endsWith('.amazonaws.com')?parts.at(-2):null;
    return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id||'')?id:null;
  }catch{return null;}
}
export function inline(value='') {
  if (Array.isArray(value)) return value.map(part=>{
    let text=escapeHtml(part.plain_text ?? part.text?.content ?? part.mention?.page?.id ?? part.equation?.expression ?? '');
    const a=part.annotations || {};
    for (const [key,tag] of [['code','code'],['bold','strong'],['italic','em'],['strikethrough','del']]) if(a[key])text=`<${tag}>${text}</${tag}>`;
    if(a.underline)text=`<span class="inline-underline">${text}</span>`;
    const href=safeUrl(part.href||part.text?.link?.url); return href?`<a href="${escapeHtml(href)}">${text}</a>`:text;
  }).join('');
  const source=String(value).replace(/\{(?:color|toggle)="[^"]*"\}/g,'');
  const pattern=/\\(.)|`([^`]+)`|\*\*([\s\S]+?)\*\*|\*([^*]+?)\*|~~([^~]+?)~~|\[([^\]]+)\]\(([^\s)]+)\)|<br\s*\/?\s*>|<span underline="true">([\s\S]*?)<\/span>|<mention-page url="([^"]+)">([^<]*)<\/mention-page>/g;
  let output='',last=0;
  for(const match of source.matchAll(pattern)){
    output+=escapeHtml(source.slice(last,match.index));
    if(match[1])output+=escapeHtml(match[1]);
    else if(match[2])output+=`<code>${escapeHtml(match[2])}</code>`;
    else if(match[3])output+=`<strong>${inline(match[3])}</strong>`;
    else if(match[4])output+=`<em>${inline(match[4])}</em>`;
    else if(match[5])output+=`<del>${inline(match[5])}</del>`;
    else if(match[6]){const href=safeUrl(match[7]);output+=href?`<a href="${escapeHtml(href)}">${inline(match[6])}</a>`:inline(match[6]);}
    else if(match[8])output+=`<span class="inline-underline">${inline(match[8])}</span>`;
    else if(match[9]){const href=safeUrl(match[9]);output+=href?`<a href="${escapeHtml(href)}">${escapeHtml(match[10]||'Referenced page')}</a>`:escapeHtml(match[10]);}
    else output+='<br>';
    last=match.index+match[0].length;
  }
  return output+escapeHtml(source.slice(last));
}
const unescape=value=>value.replace(/\\([\\*~`$\[\]{}|^])/g,'$1');
export function parseNotionMarkdown(markdown) {
  const lines=markdown.replace(/\r/g,'').split('\n'); let at=0;
  function nodes(until){
    const result=[];
    while(at<lines.length){
      const line=lines[at++].trim(); if(!line)continue;
      if(until&&line===until)return result;
      if(line==='<columns>'){
        const columns=[];
        while(at<lines.length&&lines[at].trim()!=='</columns>'){
          const start=lines[at++].trim();if(!start)continue;
          const opening=start.match(/^<column(?: ratio="([\d.]+)")?>$/);if(!opening)throw new Error('Malformed Notion column');
          columns.push({ratio:Number(opening[1]||50),children:nodes('</column>')});
        }
        if(lines[at++]?.trim()!=='</columns>')throw new Error('Unclosed Notion columns');
        result.push({type:'columns',columns});continue;
      }
      if(line.startsWith('<details')){
        const summary=lines[at++]?.trim().match(/^<summary>(.*)<\/summary>$/);
        if(!summary)throw new Error('Malformed Notion toggle');
        result.push({type:'toggle',text:summary[1],children:nodes('</details>')});continue;
      }
      if(line.startsWith('<callout')){result.push({type:'callout',children:nodes('</callout>')});continue;}
      if(line.startsWith('```')){
        const code=[];while(at<lines.length&&!lines[at].startsWith('```'))code.push(lines[at++]);
        if(at===lines.length)throw new Error('Unclosed code block');at++;
        result.push({type:'code',text:code.join('\n'),language:line.slice(3)});continue;
      }
      if(line.startsWith('<table ' )||line==='<table>'){
        let table=line;while(at<lines.length&&!table.includes('</table>'))table+='\n'+lines[at++];
        if(!table.includes('</table>'))throw new Error('Unclosed table');
        result.push({type:'table',header:table.includes('header-row="true"'),rows:[...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(row=>[...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c=>c[1]))});continue;
      }
      const image=line.match(/^!\[((?:\\.|[^\]])*)\]\((.+)\)(?: \{.*\})?$/);
      if(image){result.push({type:'image',src:image[2],caption:unescape(image[1])});continue;}
      const media=line.match(/^<(video|audio|file|pdf|embed) src="([^"]+)"(?:[^>]*)>(.*?)<\/\1>$/);
      if(media){result.push({type:media[1],src:media[2].replaceAll('&amp;','&'),caption:media[3]});continue;}
      const heading=line.match(/^(#{1,4}) (.*)$/);if(heading){result.push({type:'heading',level:heading[1].length,text:heading[2]});continue;}
      const list=line.match(/^(-|\d+\.) (.*)$/);if(list){result.push({type:list[1]==='-'?'bullet':'number',text:list[2]});continue;}
      if(line==='---'){result.push({type:'divider'});continue;}
      if(line.startsWith('>')){result.push({type:'quote',text:line.replace(/^>\s?/,'')});continue;}
      if(line==='<empty-block/>'){result.push({type:'empty'});continue;}
      if(line.startsWith('<'))throw new Error(`Unsupported Notion Markdown block: ${line.slice(0,70)}`);
      result.push({type:'paragraph',text:line});
    }
    if(until)throw new Error(`Unclosed Notion block: ${until}`);
    return result;
  }
  return nodes();
}
export function adaptNotionBlocks(blocks) {
  return blocks.filter(b=>!b.archived&&!b.in_trash).map(block=>{
    const type=block.type,body=block[type]||{}, children=()=>adaptNotionBlocks(body.children||[]);
    const text=body.rich_text||body.caption||[];
    const src=body.file?.url||body.external?.url||body.url;
    if(type==='paragraph')return {type,text,children:children()};
    if(type.startsWith('heading_'))return {type:'heading',level:Number(type.slice(-1)),text,children:children()};
    if(['image','video','audio','file','pdf','embed','bookmark','link_preview'].includes(type))return {type:type==='bookmark'||type==='link_preview'?'file':type,src,caption:body.caption||[],id:block.id};
    if(type==='column_list')return {type:'columns',columns:(body.children||[]).map(c=>({ratio:c.column?.width_ratio?c.column.width_ratio*100:100/body.children.length,children:adaptNotionBlocks(c.column?.children||[])}))};
    if(type==='bulleted_list_item'||type==='numbered_list_item')return {type:type==='bulleted_list_item'?'bullet':'number',text,children:children()};
    if(['quote','callout','toggle','code','divider'].includes(type))return {type,text,children:children(),language:body.language};
    if(type==='synced_block')return {type:'group',children:children()};
    if(type==='table')return {type:'table',header:body.has_column_header,rows:(body.children||[]).map(r=>r.table_row.cells)};
    if(type==='to_do')return {type:'paragraph',text:[{plain_text:body.checked?'✓ ':'□ '},...text],children:children()};
    if(type==='equation')return {type:'code',text:body.expression};
    if(type==='table_of_contents'||type==='breadcrumb')return {type:'empty'};
    if(type==='link_to_page')return {type:'file',src:`https://www.notion.so/${body.page_id||body.database_id}`,caption:'Referenced page'};
    throw new Error(`Unsupported Notion block ${type} (${block.id}); the previous site is preserved.`);
  });
}
export function allImages(nodes) {
  return nodes.flatMap(n=>n.type==='image'?[n]:n.type==='columns'?n.columns.flatMap(c=>allImages(c.children)):n.children?allImages(n.children):[]);
}
const plain=text=>Array.isArray(text)?text.map(t=>t.plain_text??t.text?.content??'').join(''):unescape(String(text||''));
export function publicationNodes(nodes) {
  return nodes.filter(n=>!(n.type==='toggle'&&plain(n.text)==='Website layout notes (not published)'));
}
export function videoDestination(src) {
  const url=safeUrl(src,{media:true});if(!url)return null;const u=new URL(url);
  const id=u.hostname==='youtu.be'?u.pathname.slice(1):/^(www\.)?youtube\.com$/.test(u.hostname)?u.searchParams.get('v')||u.pathname.match(/^\/embed\/([\w-]+)/)?.[1]:null;
  if(id&&/^[\w-]{11}$/.test(id))return {embed:`https://www.youtube-nocookie.com/embed/${id}`,watch:`https://www.youtube.com/watch?v=${id}`,platform:'YouTube'};
  const bv=u.searchParams.get('bvid')||u.pathname.match(/\/video\/(BV[\w]+)/)?.[1];
  if(/^(player\.|www\.)?bilibili\.com$/.test(u.hostname)&&bv&&/^BV[\w]+$/.test(bv))return {embed:`https://player.bilibili.com/player.html?bvid=${bv}&p=1&autoplay=0`,watch:`https://www.bilibili.com/video/${bv}/`,platform:'Bilibili'};
  if(/^(www\.)?vimeo\.com$/.test(u.hostname)&&/^\/\d+$/.test(u.pathname))return {embed:`https://player.vimeo.com/video${u.pathname}`,watch:url,platform:'Vimeo'};
  return {watch:url};
}
// A portrait's long edge matches a landscape's short edge at the same display scale.
export function landscapeRatio(nodes, resolveMedia) {
  for (const image of allImages(nodes)) {
    const media=resolveMedia(image.src);
    if(media.displayWidth>media.displayHeight&&media.displayHeight>0)return media.displayHeight/media.displayWidth;
  }
  return 2/3;
}
export function portraitScale(width, height, referenceRatio=2/3) {
  return height>width&&width>0?referenceRatio*width/height:1;
}
// Imported captions are editable paragraphs below a photo in Notion. Keep those
// adjacent short paragraphs with their image, including multi-line credits.
export function withImageCaptions(nodes) {
  return nodes.reduce((result,node,index)=>{
    if(node.type==='columns')result.push({...node,columns:node.columns.map(c=>({...c,children:withImageCaptions(c.children)}))});
    else if(node.type==='toggle')result.push({...node,children:withImageCaptions(node.children)});
    else if(node.type==='image'&&!plain(node.caption)){
      const captions=[];
      for(let i=index+1;nodes[i]?.type==='paragraph'&&plain(nodes[i].text).length<=140;i++)captions.push(nodes[i].text);
      if(captions.length){
        const text=captions.every(c=>typeof c==='string')?captions.join('\n'):captions.flatMap((c,i)=>[...(i?[{plain_text:'\n'}]:[]),...(Array.isArray(c)?c:[{plain_text:c}])]);
        result.push({...node,caption:text});
      }else result.push(node);
    }else if(node.type==='paragraph'){
      let previous=index-1;while(nodes[previous]?.type==='paragraph'&&plain(nodes[previous].text).length<=140)previous--;
      if(!(plain(node.text).length<=140&&nodes[previous]?.type==='image'&&!plain(nodes[previous].caption)))result.push(node);
    }else result.push(node);
    return result;
  },[]);
}
export function renderDocument(nodes, {title, resolveMedia=url=>({display:url,original:url}), prefix='../', omitIntro='', omitFirstImage='', paragraphCaptions=true, imageOffset=0, referenceRatio:articleRatio}={}) {
  nodes=publicationNodes(nodes);
  const referenceRatio=articleRatio??landscapeRatio(nodes,resolveMedia);
  let number=imageOffset;const unavailableSeries=new Set();
  const image=node=>{
    const native=/^notion-file-block:\/\//.test(node.src);
    const url=safeUrl(node.src,{media:true})||(native?node.src:null);if(!url)throw new Error('Image requires a valid HTTPS or native Notion source');
    const media=resolveMedia(url),caption=plain(node.caption),label=caption||`${title} — photograph ${String(++number).padStart(2,'0')}`;
    if(omitFirstImage&&node.src===omitFirstImage){omitFirstImage='';return '';}
    if(native&&!media.display?.startsWith('assets/'))throw new Error('Native Notion image is not cached: '+mediaFilename(node.src));
    if(media.unavailable){if(unavailableSeries.has(media.sourcePage))return '';unavailableSeries.add(media.sourcePage);return `<p class="story-text story-unavailable"><a href="${escapeHtml(media.sourcePage)}">View additional photographs in the original series</a></p>`;}
    const src=media.display.startsWith('assets/')?prefix+media.display:media.display;
    const original=media.original.startsWith('assets/')?prefix+media.original:media.original;
    const portrait=media.displayHeight>media.displayWidth;
    return `<figure class="story-image${portrait?' portrait':''}"${portrait?` style="--print-scale:${portraitScale(media.displayWidth,media.displayHeight,referenceRatio)}"`:''}><a class="story-image-open" href="${escapeHtml(original)}" data-image-title="${escapeHtml(label)}"><span class="media"><img src="${escapeHtml(src)}"${media.displayWidth?` width="${media.displayWidth}" height="${media.displayHeight}"`:''} alt="${escapeHtml(label)}" loading="lazy" decoding="async"><span class="media-error" hidden>Image unavailable. Open the original photograph.</span></span></a>${caption?`<figcaption>${inline(node.caption)}</figcaption>`:''}</figure>`;
  };
  function render(list){
    let html='';
    for(let i=0;i<list.length;i++){
      const n=list[i],nested=n.type==='language-pair'?'':n.children?.length?render(n.children):'';
      if(n.type==='paragraph'){if(omitIntro&&plain(n.text).trim()===omitIntro.trim()){omitIntro='';continue;} const caption=paragraphCaptions&&(['image','columns'].includes(list[i-1]?.type)||list[i-1]?.presentation==='film-carousel')&&plain(n.text).length<140;html+=`<p class="${caption?'story-caption':'story-text'}"${/[\u3400-\u9fff]/.test(plain(n.text))?' lang="zh-Hans"':''}>${inline(n.text)}</p>${nested}`;}
      else if(n.type==='heading')html+=`<h${Math.min(4,n.level+1)} class="story-heading">${inline(n.text)}</h${Math.min(4,n.level+1)}>${nested}`;
      else if(n.type==='language-pair'){
        const id='article-reading-language';
        const controls=n.children.map((language,index)=>`<input class="article-language-input sr-only" type="radio" name="${id}" id="${id}-${escapeHtml(language.code)}" value="${escapeHtml(language.code)}"${index===0?' checked':''}><label class="article-language-label" for="${id}-${escapeHtml(language.code)}" lang="${escapeHtml(language.code)}">${escapeHtml(language.label)}</label>`).join('<span class="article-language-divider" aria-hidden="true">/</span>');
        html+=`<fieldset class="article-language"><legend class="sr-only">Article language</legend>${controls}${n.children.map(language=>`<section class="article-language-panel" lang="${escapeHtml(language.code)}" aria-label="${escapeHtml(language.label)}">${render(language.children)}</section>`).join('')}</fieldset>`;
      }
      else if(n.type==='image')html+=image(n);
      else if(n.type==='columns'){
        const columns=n.columns.map(c=>({html:render(c.children),ratio:Number(c.ratio)>0?Number(c.ratio):50})).filter(c=>c.html.trim());
        if(columns.length===1)html+=columns[0].html;
        else if(columns.length)html+=`<div class="story-columns${columns.length>2?' multicolumn':''}${n.columns.some(c=>c.children.some(child=>['paragraph','bullet','number','video','language-pair'].includes(child.type)))?' prose-columns':''}" style="--columns:${columns.length};--column-tracks:${columns.map(c=>c.ratio+'fr').join(' ')}">${columns.map(c=>`<div>${c.html}</div>`).join('')}</div>`;
      }
      else if(n.type==='bullet'||n.type==='number'){
        const tag=n.type==='bullet'?'ul':'ol',kind=n.type;html+=`<${tag} class="story-list">`;
        do{const item=list[i];html+=`<li>${inline(item.text)}${item.children?.length?render(item.children):''}</li>`;i++;}while(list[i]?.type===kind);i--;html+=`</${tag}>`;
      }else if(n.type==='quote'||n.type==='callout')html+=`<blockquote class="story-quote">${inline(n.text||'')}${nested}</blockquote>`;
      else if(n.type==='toggle')html+=`<details class="story-toggle"><summary>${inline(n.text)}</summary>${nested}</details>`;
      else if(n.type==='video'||n.type==='embed'){
        const video=videoDestination(n.src);if(!video)throw new Error('Invalid video source');
        html+=`<figure class="story-video">${video.embed?`<iframe src="${escapeHtml(video.embed)}" title="${escapeHtml(plain(n.caption)||title+' — film')}" loading="eager" allow="fullscreen; picture-in-picture; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`:''}<figcaption><a href="${escapeHtml(video.watch)}">${inline(n.caption)||'Watch film'}${video.platform?' on '+video.platform:''}</a></figcaption></figure>`;
      }else if(['file','audio','pdf'].includes(n.type)){const url=safeUrl(n.src,{media:true});if(!url)throw new Error('Invalid file source');html+=`<p class="story-text"><a href="${escapeHtml(url)}">${inline(n.caption)||'Open '+n.type}</a></p>`;}
      else if(n.type==='table')html+=`<div class="story-table"><table>${n.rows.map((row,r)=>`<tr>${row.map(c=>`<${n.header&&r===0?'th':'td'}>${inline(c)}</${n.header&&r===0?'th':'td'}>`).join('')}</tr>`).join('')}</table></div>`;
      else if(n.type==='code')html+=`<pre class="story-code"><code>${escapeHtml(plain(n.text))}</code></pre>`;
      else if(n.type==='divider')html+='<hr class="story-rule">';
      else if(n.type==='group'){
        if(n.presentation==='film-carousel')html+=`<div class="film-carousel"><div class="film-strip" tabindex="0" role="region" aria-label="${escapeHtml(n.label||'Behind the scenes photographs')}">${nested}</div><nav class="film-strip-controls" aria-label="Photograph carousel" hidden><button type="button" data-strip-prev>Previous</button><button type="button" data-strip-next>Next</button></nav></div>`;
        else if(['film-copy','film-backstage'].includes(n.presentation))html+=`<div class="${n.presentation}">${nested}</div>`;
        else html+=nested;
      }
      else if(n.type!=='empty')throw new Error('Unknown document node: '+n.type);
    }
    return html;
  }
  return render(nodes);
}
