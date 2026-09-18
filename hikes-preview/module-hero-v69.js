/* V69 — canonical module hero for Overview, Participants and Roles. */
(()=>{
'use strict';

const safe=v=>typeof esc==='function'?esc(v):String(v??'');

function metaValues(){
  const eventName=S?.event?.short||S?.event?.title||'Томинский лесопарк';
  const duration=S?.event?.duration||'Длительность уточняется';
  const date=S?.event?.date||'Дата уточняется';
  return [eventName,duration,date].filter(Boolean);
}
function metaHtml(){
  return metaValues().map(v=>`<span>${safe(v)}</span>`).join('');
}
function setMeta(el){
  if(!el)return;
  el.classList.add('module-hero-meta-v69');
  el.innerHTML=metaHtml();
}
function canonicalize(){
  const current=typeof tab==='string'?tab:'';
  document.body.classList.toggle('module-hero-v69-active',['overview','participants','roles'].includes(current));
  document.body.classList.toggle('module-hero-v69-overview',current==='overview');
  document.body.classList.toggle('module-hero-v69-participants',current==='participants');
  document.body.classList.toggle('module-hero-v69-roles',current==='roles');

  if(current==='overview'){
    const hero=document.querySelector('.ov44-hero-head');
    if(!hero)return;
    hero.classList.add('module-hero-v69');
    const copy=hero.querySelector('.ov44-hero-copy');
    copy?.classList.add('module-hero-copy-v69');
    const kicker=copy?.querySelector('.page-kicker');
    if(kicker)kicker.textContent='Командный штаб';
    const title=copy?.querySelector('h1');
    if(title)title.textContent='Обзор';
    let meta=copy?.querySelector('p');
    if(!meta&&copy){meta=document.createElement('p');copy.appendChild(meta)}
    setMeta(meta);
    return;
  }

  if(current==='participants'){
    const hero=document.querySelector('.p50-hero');
    if(!hero)return;
    hero.classList.add('module-hero-v69');
    const copy=hero.querySelector('.p50-hero__copy');
    copy?.classList.add('module-hero-copy-v69');
    const kicker=copy?.querySelector('.p50-kicker');
    if(kicker)kicker.textContent='Командный штаб';
    const title=copy?.querySelector('h1');
    if(title)title.textContent='Участники';
    setMeta(copy?.querySelector('.p50-meta'));
    const actions=hero.querySelector('.p50-hero__actions');
    actions?.classList.add('module-hero-actions-v69');
    return;
  }

  if(current==='roles'){
    const hero=document.querySelector('.page-head');
    if(!hero)return;
    hero.classList.add('module-hero-v69');
    const copy=hero.querySelector('.page-head__copy');
    copy?.classList.add('module-hero-copy-v69');
    const kicker=copy?.querySelector('.page-kicker');
    if(kicker)kicker.textContent='Командный штаб';
    const title=copy?.querySelector('h1');
    if(title)title.textContent='Роли';
    setMeta(copy?.querySelector('p'));
    const actions=hero.querySelector('.page-head__actions');
    actions?.classList.add('module-hero-actions-v69');
  }
}

if(typeof render==='function'&&!render.__moduleHeroV69){
  const base=render;
  const wrapped=function(){
    const result=base.apply(this,arguments);
    queueMicrotask(canonicalize);
    return result;
  };
  wrapped.__moduleHeroV69=true;
  render=wrapped;
}
queueMicrotask(canonicalize);
window.ModuleHeroV69={apply:canonicalize};
})();