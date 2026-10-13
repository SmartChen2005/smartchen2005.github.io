// Server/build-time Notion access only. Authentication never reaches dist/.
import { setTimeout as delay } from 'node:timers/promises';
export const NOTION_VERSION='2026-03-11';
export class NotionGalleryClient {
  constructor({token,fetchImpl=fetch,sleep=delay}={}) {
    if(!token)throw new Error('Set NOTION_TOKEN for a Notion connection with read access to The Gallery.');
    this.token=token;this.fetch=fetchImpl;this.sleep=sleep;
  }
  async request(endpoint,{method='GET',body}={}) {
    if(!endpoint.startsWith('/'))throw new Error('Notion endpoint must be relative to the official API.');
    for(let attempt=0;attempt<4;attempt++) {
      const response=await this.fetch('https://api.notion.com/v1'+endpoint,{method,headers:{Authorization:'Bearer '+this.token,'Notion-Version':NOTION_VERSION,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
      if(response.status===429||response.status>=500){if(attempt===3)throw new Error(`Notion read failed (${response.status}). The existing site is preserved.`);await this.sleep(Math.min(60000,Math.max(1,Number(response.headers.get('retry-after'))||2**attempt)*1000));continue;}
      if(!response.ok)throw new Error(`Notion read failed (${response.status}); check the connection and database access. The existing site is preserved.`);
      const result=await response.json();
      if(result.request_status?.type==='incomplete')throw new Error('Notion returned an incomplete query. The existing site is preserved.');
      return result;
    }
  }
  async listPages(dataSourceId) {
    if(!/^[\da-f-]{32,36}$/i.test(dataSourceId))throw new Error('Invalid Notion data source ID');
    const pages=[],seen=new Set();let cursor;
    do {
      const data=await this.request(`/data_sources/${dataSourceId}/query`,{method:'POST',body:{page_size:100,is_archived:false,filter:{and:[{property:'Published',checkbox:{equals:true}},{or:[{property:'Type',select:{equals:'Photography'}},{property:'Type',select:{equals:'Film'}}]}]},...(cursor?{start_cursor:cursor}:{})}});
      pages.push(...data.results.filter(p=>p.object==='page'&&!p.archived&&!p.in_trash));
      if(data.has_more&&!data.next_cursor)throw new Error('Notion pagination is incomplete');
      cursor=data.has_more?data.next_cursor:null;
      if(cursor&&seen.has(cursor))throw new Error('Repeated Notion cursor');if(cursor)seen.add(cursor);
    }while(cursor);
    return pages;
  }
  async children(id,depth=0) {
    if(depth>30)throw new Error('Notion nesting exceeds the supported depth');
    const blocks=[],seen=new Set();let cursor;
    do {
      const data=await this.request(`/blocks/${id}/children?page_size=100${cursor?'&start_cursor='+encodeURIComponent(cursor):''}`);
      for(const block of data.results){if(block.archived||block.in_trash)continue;
        if(block.has_children){block[block.type]||={};block[block.type].children=await this.children(block.id,depth+1);}
        blocks.push(block);
      }
      if(data.has_more&&!data.next_cursor)throw new Error('Notion block pagination is incomplete');
      cursor=data.has_more?data.next_cursor:null;if(cursor&&seen.has(cursor))throw new Error('Repeated block cursor');if(cursor)seen.add(cursor);
    }while(cursor);
    return blocks;
  }
  async readPage(page) {
    let current=page;
    for(let attempt=0;attempt<3;attempt++){
      const blocks=await this.children(current.id);
      const latest=await this.request('/pages/'+current.id);
      if(latest.last_edited_time===current.last_edited_time)return {...latest,blocks};
      current=latest;
    }
    throw new Error('The Notion page changed during export; the previous site is preserved.');
  }
}
export function propertyValue(property) {
  if(!property)return '';
  switch(property.type){
    case 'title':case 'rich_text':return property[property.type].map(t=>t.plain_text??t.text?.content??'').join('');
    case 'select':case 'status':return property[property.type]?.name||'';
    case 'multi_select':return property.multi_select.map(o=>o.name);
    case 'checkbox':return property.checkbox;
    case 'number':return property.number;
    case 'url':return property.url||'';
    case 'date':return property.date?.start||'';
    case 'files':return property.files.map(f=>f.file?.url||f.external?.url).filter(Boolean);
    default:return '';
  }
}
export function galleryPageSnapshot(page) {
  const allowed=new Set(['Project','Type','Focus','Year','Published','Featured','Link','Slug','Summary','Subtitle','Credit','Cover','Cover image','Order','Related project','Content kind','Date label','Media status','Format']);
  const properties=Object.fromEntries(Object.entries(page.properties).filter(([name])=>allowed.has(name)).map(([name,p])=>[name,propertyValue(p)]));
  return {id:page.id,url:page.url,title:properties.Project,lastEditedAt:page.last_edited_time,properties,cover:page.cover,blocks:page.blocks};
}
