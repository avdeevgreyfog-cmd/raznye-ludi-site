/* V49 — organizer preview modes + essential event facts. */
(() => {
  'use strict';

  const KEY='rl_hike_preview_v48';
  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  let mode='organizer';
  try{mode=sessionStorage.getItem(KEY)||'organizer'}catch(e){}

  const people=()=>Array.isArray(S?.participants)?S.participants:[];
  const rolesFor=pid=>window.HikeAccessV47?.roles?.(pid)||[];
  const personFor=pid=>people().find(p=>p.id===pid)||null;
  const isActualOrganizer=()=>document.body.classList.contains('hike-organizer');
  const nonLead=()=>people().filter(p=>!rolesFor(p.id).some(r=>r.id==='lead'));
  const ordinaryPerson=()=>nonLead().find(p=>rolesFor(p.id).filter(r=>r.id!=='lead').length===0)||nonLead()[0]||null;
  const responsiblePerson=()=>nonLead().find(p=>rolesFor(p.id).some(r=>r.id!=='lead'))||nonLead()[0]||null;

  function previewPid(){
    if(mode.startsWith('person:'))return mode.slice(7);
    if(mode==='participant')return ordinaryPerson()?.id||'';
    if(mode==='responsible')return responsiblePerson()?.id||'';
    return '';
  }
  function normalizeMode(){
    const pid=previewPid();
    if(mode!=='organizer'&&!pid)mode='organizer';
    if(mode.startsWith('person:')&&!personFor(pid))mode='organizer';
    try{sessionStorage.setItem(KEY,mode)}catch(e){}
  }

  const api={
    get active(){return isActualOrganizer()&&mode!=='organizer'&&!!previewPid()},
    get pid(){return previewPid()},
    get mode(){return mode},
    set(next){mode=String(next||'organizer');normalizeMode();render()}
  };
  window.HikePreviewV48=api;

  function roleLabel(pid){
    const roles=rolesFor(pid).filter(r=>r.id!=='lead');
    return roles.length?roles.map(r=>r.title).join(' · '):'Обычный участник';
  }
  function profileLabel(p){return p?`${p.name} · ${roleLabel(p.id)}`:'Профиль не найден'}
  function previewTitle(){return profileLabel(personFor(previewPid()))}

  function control(){
    const host=document.getElementById('hikeAuthBar');
    if(!host)return;
    const existing=document.getElementById('hikePreviewControl');
    if(!isActualOrganizer()){existing?.remove();return}
    const options=nonLead().map(p=>`<option value="person:${safe(p.id)}" ${mode===`person:${p.id}`?'selected':''}>${safe(p.name)} — ${safe(roleLabel(p.id))}</option>`).join('');
    const html=`<label class="hike-preview-control" id="hikePreviewControl"><span>Просмотр как</span><select id="hikePreviewSelect" aria-label="Просмотр интерфейса от лица участника"><option value="organizer" ${mode==='organizer'?'selected':''}>Мой вид — организатор</option><option value="participant" ${mode==='participant'?'selected':''}>Обычный участник</option><option value="responsible" ${mode==='responsible'?'selected':''}>Участник с ответственностью</option><optgroup label="Конкретный профиль">${options}</optgroup></select></label>`;
    if(existing)existing.outerHTML=html;else host.insertAdjacentHTML('afterbegin',html);
    document.getElementById('hikePreviewSelect')?.addEventListener('change',e=>api.set(e.target.value));
  }

  function banner(){
    document.getElementById('hikePreviewBanner')?.remove();
    document.body.classList.toggle('v48-preview-active',api.active);
    if(!api.active)return;
    const workspace=document.querySelector('.workspace'),topbar=workspace?.querySelector('.topbar');
    if(!workspace||!topbar)return;
    topbar.insertAdjacentHTML('afterend',`<div class="v48-preview-banner" id="hikePreviewBanner"><strong>Предпросмотр: ${safe(previewTitle())}</strong><span>Так эту страницу видит выбранный участник. Редактирование отключено.</span></div>`);
  }

  function meetingParts(){
    const raw=String(S.event?.meeting||'').trim();
    let time='',place='';
    const match=raw.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    if(match){time=match[1];place=(match[2]||'').trim()}else place=raw;
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

  function fact(type,label,value,detail='',edit=''){
    return `<article class="ov48-fact ${edit?'is-editable':''}"><div class="ov48-fact__icon">${icon(type)}</div><div><small>${safe(label)}</small><strong title="${safe(value)}">${safe(value)}</strong>${detail?`<em title="${safe(detail)}">${safe(detail)}</em>`:''}</div>${edit?`<button class="ov48-fact-edit" type="button" data-v49-edit="${safe(edit)}">Редактировать</button>`:''}</article>`;
  }

  function reviewBar(){
    if(!isActualOrganizer())return '';
    const ordinary=ordinaryPerson(),responsible=responsiblePerson();
    const active=mode==='organizer'?'organizer':mode==='responsible'?'responsible':mode==='participant'?'participant':'person';
    return `<section class="v49-reviewbar" aria-label="Режим проверки интерфейса"><div><small>Режим просмотра</small><strong>${api.active?safe(previewTitle()):'Организатор · редактирование доступно'}</strong></div><div class="v49-reviewbar__modes"><button type="button" data-v49-preview="organizer" class="${active==='organizer'?'active':''}">Организатор</button><button type="button" data-v49-preview="participant" class="${active==='participant'?'active':''}" ${ordinary?'':'disabled'}>Обычный участник${ordinary?` · ${safe(ordinary.name)}`:''}</button><button type="button" data-v49-preview="responsible" class="${active==='responsible'?'active':''}" ${responsible?'':'disabled'}>Ответственный${responsible?` · ${safe(responsible.name)}`:''}</button></div></section>`;
  }

  function overviewMeta(){
    if(tab!=='overview')return;
    const shell=document.querySelector('.ov44-shell'),hero=shell?.querySelector('.ov44-hero-head');if(!shell||!hero)return;
    shell.querySelector('.v49-reviewbar')?.remove();shell.querySelector('.ov48-event-facts')?.remove();
    const meet=meetingParts(),date=String(S.event?.date||'Дата уточняется'),duration=String(S.event?.duration||'2 дня · 1 ночь');
    const editable=isActualOrganizer()&&!api.active;
    hero.insertAdjacentHTML('afterend',`${reviewBar()}<section class="ov48-event-facts" aria-label="Основная информация о походе">
      ${fact('date','Дата',date,S.event?.status||'',editable?'#evStart':'')}
      ${fact('place','Место сбора',meet.place,'',editable?'#evMeetPlace':'')}
      ${fact('time','Время сбора',meet.time,'',editable?'#evMeetTime':'')}
      ${fact('days','Длительность',duration,'',editable?'#evDays':'')}
    </section>`);
    document.querySelectorAll('[data-v49-preview]').forEach(button=>button.addEventListener('click',()=>api.set(button.dataset.v49Preview)));
    document.querySelectorAll('[data-v49-edit]').forEach(button=>button.addEventListener('click',()=>window.HikeEventV49?.openEditor?.(button.dataset.v49Edit)));
  }

  function decorate(){
    normalizeMode();control();banner();overviewMeta();
    const build=document.querySelector('.build-label');if(build)build.textContent='V49 · роли, профили и параметры похода';
  }

  const baseRender=render;
  render=function renderV49Preview(){
    normalizeMode();
    const actual=S.current,pid=api.active?previewPid():'';
    if(pid)S.current=pid;
    let result;
    try{result=baseRender()}finally{if(pid)S.current=actual}
    decorate();return result;
  };

  const allowedClick=target=>!!target.closest('#hikePreviewControl,.v49-reviewbar,[data-tab],[data-mobile],[data-sheet-tab],[data-jump],[data-v44-jump],[data-v47-jump],[data-v47-doc-open],.leaflet-control,.leaflet-container,[data-gear-mode],[data-dir],[data-food-mode],[data-v36-gear-mode],[data-v36-food-mode]');
  document.addEventListener('click',event=>{
    if(!api.active)return;
    const target=event.target.closest('button,a,input,select,textarea,label');if(!target||allowedClick(target))return;
    event.preventDefault();event.stopImmediatePropagation();if(typeof toast==='function')toast('Предпросмотр: редактирование отключено');
  },true);
  document.addEventListener('change',event=>{
    if(!api.active||event.target.id==='hikePreviewSelect')return;
    if(event.target.matches('input,select,textarea')){event.preventDefault();event.stopImmediatePropagation();if(typeof toast==='function')toast('Предпросмотр: редактирование отключено')}
  },true);

  const observer=new MutationObserver(()=>decorate());
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  render();
})();
