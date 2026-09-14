/* V48 — organizer can preview participant personas without changing shared data. */
(() => {
  'use strict';

  const KEY='rl_hike_preview_v48';
  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  let mode='organizer';
  try{mode=sessionStorage.getItem(KEY)||'organizer'}catch(e){}

  const people=()=>Array.isArray(S?.participants)?S.participants:[];
  const rolesFor=pid=>window.HikeAccessV47?.roles?.(pid)||[];
  const personFor=pid=>people().find(p=>p.id===pid)||null;
  const previewPid=()=>mode.startsWith('person:')?mode.slice(7):'';
  const isActualOrganizer=()=>document.body.classList.contains('hike-organizer');

  function normalizeMode(){
    const pid=previewPid();
    if(pid&&!personFor(pid))mode='organizer';
    try{sessionStorage.setItem(KEY,mode)}catch(e){}
  }

  const api={
    get active(){return mode!=='organizer'&&!!previewPid()},
    get pid(){return previewPid()},
    get mode(){return mode},
    set(next){mode=String(next||'organizer');normalizeMode();render()}
  };
  window.HikePreviewV48=api;

  function roleLabel(pid){
    const roles=rolesFor(pid).filter(r=>r.id!=='lead');
    return roles.length?roles.map(r=>r.title).join(' · '):'Обычный участник';
  }

  function previewTitle(){
    const p=personFor(previewPid());
    return p?`${p.name} · ${roleLabel(p.id)}`:'Участник';
  }

  function control(){
    const host=document.getElementById('hikeAuthBar');
    if(!host)return;
    const existing=document.getElementById('hikePreviewControl');
    if(!isActualOrganizer()){
      existing?.remove();
      return;
    }
    const rows=people().filter(p=>!rolesFor(p.id).some(r=>r.id==='lead'));
    const options=rows.map(p=>`<option value="person:${safe(p.id)}" ${mode===`person:${p.id}`?'selected':''}>${safe(p.name)} — ${safe(roleLabel(p.id))}</option>`).join('');
    const html=`<label class="hike-preview-control" id="hikePreviewControl"><span>Просмотр как</span><select id="hikePreviewSelect" aria-label="Просмотр интерфейса от лица участника"><option value="organizer" ${mode==='organizer'?'selected':''}>Мой вид — организатор</option><optgroup label="Профили участников">${options}</optgroup></select></label>`;
    if(existing)existing.outerHTML=html;else host.insertAdjacentHTML('afterbegin',html);
    document.getElementById('hikePreviewSelect')?.addEventListener('change',e=>api.set(e.target.value));
  }

  function banner(){
    document.getElementById('hikePreviewBanner')?.remove();
    document.body.classList.toggle('v48-preview-active',api.active);
    if(!api.active)return;
    const workspace=document.querySelector('.workspace'),topbar=workspace?.querySelector('.topbar');
    if(!workspace||!topbar)return;
    topbar.insertAdjacentHTML('afterend',`<div class="v48-preview-banner" id="hikePreviewBanner"><strong>Предпросмотр: ${safe(previewTitle())}</strong><span>Интерфейс показан от лица этого участника. Редактирование в режиме предпросмотра заблокировано.</span></div>`);
  }

  function meetingParts(){
    const raw=String(S.event?.meeting||'').trim();
    let time='',place='';
    const match=raw.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    if(match){time=match[1];place=(match[2]||'').trim()}
    else place=raw;
    if(!time)time=String(S.event?.start||'').trim();
    if(!place||/^время и точка уточняются$/i.test(place))place='Точка сбора уточняется';
    return {time:time||'Уточняется',place};
  }

  function icon(type){
    const data={
      date:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M12 14h2M17 14h.01M7 18h2M12 18h2"/>',
      place:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      time:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
      days:'<path d="M5 4h14v16H5zM8 2v4M16 2v4M5 9h14"/><path d="M9 13h6M9 16h4"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${data[type]}</svg>`;
  }

  function fact(type,label,value,detail=''){
    return `<article class="ov48-fact"><div class="ov48-fact__icon">${icon(type)}</div><div><small>${safe(label)}</small><strong title="${safe(value)}">${safe(value)}</strong>${detail?`<em title="${safe(detail)}">${safe(detail)}</em>`:''}</div></article>`;
  }

  function eventFacts(){
    if(tab!=='overview')return;
    const shell=document.querySelector('.ov44-shell'),hero=shell?.querySelector('.ov44-hero-head');
    if(!shell||!hero)return;
    shell.querySelector('.ov48-event-facts')?.remove();
    const meet=meetingParts();
    const date=String(S.event?.date||'Дата уточняется');
    const duration=String(S.event?.duration||'Уточняется');
    const start=String(S.event?.start||'').trim();
    hero.insertAdjacentHTML('afterend',`<section class="ov48-event-facts" aria-label="Основная информация о походе">
      ${fact('date','Дата',date,S.event?.status||'')}
      ${fact('place','Место сбора',meet.place,'куда приезжает команда')}
      ${fact('time','Время сбора',meet.time,start&&start!==meet.time?`старт маршрута ${start}`:'')}
      ${fact('days','Длительность',duration,S.event?.type||'')}
    </section>`);
  }

  function decorate(){
    normalizeMode();
    control();
    banner();
    eventFacts();
    const build=document.querySelector('.build-label');
    if(build)build.textContent='V48 · профили и ключевая информация';
  }

  const baseRender=render;
  render=function renderV48(){
    normalizeMode();
    const actual=S.current;
    const pid=api.active?previewPid():'';
    if(pid)S.current=pid;
    let result;
    try{result=baseRender()}
    finally{if(pid)S.current=actual}
    decorate();
    return result;
  };

  const allowedClick=target=>!!target.closest('#hikePreviewControl,[data-tab],[data-mobile],[data-sheet-tab],[data-jump],[data-v44-jump],[data-v47-jump],[data-v47-doc-open],.leaflet-control,.leaflet-container,[data-gear-mode],[data-dir],[data-food-mode],[data-v36-gear-mode],[data-v36-food-mode]');
  document.addEventListener('click',event=>{
    if(!api.active)return;
    const target=event.target.closest('button,a,input,select,textarea,label');
    if(!target||allowedClick(target))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(typeof toast==='function')toast('Предпросмотр: редактирование отключено');
  },true);
  document.addEventListener('change',event=>{
    if(!api.active||event.target.id==='hikePreviewSelect')return;
    if(event.target.matches('input,select,textarea')){event.preventDefault();event.stopImmediatePropagation();if(typeof toast==='function')toast('Предпросмотр: редактирование отключено')}
  },true);

  render();
})();
