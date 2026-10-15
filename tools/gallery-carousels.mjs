// Restore only source-identified carousel groups; ordinary photo rows stay rows.
export function sourceCarousels(nodes,groups,resolveMedia) {
  if(!groups?.length)return nodes;
  const groupOf=image=>groups.findIndex(g=>g.originals.includes(resolveMedia(image.src).original));
  const carousel=(images,index)=>({type:'group',presentation:'film-carousel',label:groups[index].label,children:images});
  function visit(list){
    const result=[];
    for(let i=0;i<list.length;i++){
      const node=list[i];
      if(node.type==='image'){
        const index=groupOf(node),images=[node];
        if(index>=0)while(list[i+1]?.type==='image'&&groupOf(list[i+1])===index)images.push(list[++i]);
        result.push(images.length>1?carousel(images,index):node);
      }else if(node.type==='columns'){
        const flat=node.columns.flatMap(c=>c.children);
        const index=flat[0]?.type==='image'?groupOf(flat[0]):-1;
        if(flat.length>1&&index>=0&&flat.every(n=>n.type==='image'&&groupOf(n)===index))result.push(carousel(flat,index));
        else result.push({...node,columns:node.columns.map(c=>({...c,children:visit(c.children)}))});
      }else if(node.children)result.push({...node,children:visit(node.children)});
      else result.push(node);
    }
    return result;
  }
  return visit(nodes);
}
