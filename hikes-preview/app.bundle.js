
;/* source: hikes-preview/v8.js */
const NAV = [
  ['overview','Обзор'],['participants','Участники'],['roles','Роли'],['gear','Снаряжение'],['transport','Транспорт'],['route','Маршрут'],['plan','План']
];
const STORAGE='rl_hikes_v8';
const roleDescriptions={
  'Руководитель':'Принимает ключевые решения по мероприятию, контролирует старт, остановку и изменение плана.',
  'Навигатор':'Ведёт маршрут, работает с картой и контрольными точками, держит резервный вариант движения.',
  'Замыкающий':'Контролирует хвост группы и помогает не допустить потери или отставания участника.',
  'Первая помощь':'Проверяет групповую аптечку и отвечает за организацию первой помощи при необходимости.',
  'Транспорт':'Сводит водителей, пассажиров, точки посадки и логистику туда и обратно.',
  'Связь':'Проверяет каналы, заряд и резервные способы связи.',
  'Снаряжение':'Контролирует распределение группового имущества и дефициты.',
  'Питание':'Контролирует воду, перекус и общие позиции питания, если они нужны.'
};
const seed=()=>({
  current:'',
  event:{title:'Томинский лесопарк',short:'Томинский лесопарк',type:'Поход-тренировка',status:'Регистрация открыта',date:'10–11 октября 2026',meeting:'09:00 · место сбора уточняется',start:'10:00',distance:'Уточняется',duration:'2 дня · 1 ночь',replyDeadline:'не задан'},
  participants:[],
  roles:[['Руководитель','',1],['Навигатор','',1],['Замыкающий','',1],['Первая помощь','',1],['Транспорт','',0],['Связь','',0],['Снаряжение','',0],['Питание','',0]].map((x,i)=>({id:'r'+i,title:x[0],p:x[1],critical:!!x[2],desc:roleDescriptions[x[0]]})),
  personal:[
    {id:'pg0',title:'Рюкзак',priority:'required'},
    {id:'pg1',title:'Вода',priority:'required'},
    {id:'pg2',title:'Дождезащита',priority:'weather'},
    {id:'pg3',title:'Фонарь',priority:'required'},
    {id:'pg4',title:'Power bank',priority:'recommended'},
    {id:'pg5',title:'Личные лекарства / мини-аптечка',priority:'required'},
    {id:'pg6',title:'Запасной слой / носки',priority:'weather'},
    {id:'pg7',title:'Телефон / офлайн-карта',priority:'required'}
  ],
  checks:{},
  shared:[
    {id:'g0',title:'Групповая аптечка',need:1,a:[],confirmed:[]},
    {id:'g1',title:'Компасы',need:3,a:[],confirmed:[]},
    {id:'g2',title:'Бумажный атлас',need:1,a:[],confirmed:[]},
    {id:'g3',title:'Power bank общий',need:1,a:[],confirmed:[]},
    {id:'g4',title:'Ремнабор',need:1,a:[],confirmed:[]},
    {id:'g5',title:'Тент / дождевое укрытие',need:1,a:[],confirmed:[]}
  ],
  cars:{there:[],back:[]},
  rides:{there:{},back:{}},
  routeSteps:[
    {id:'s1',title:'Старт',note:'Точка старта у лесного массива. Финальная точка сбора уточняется.'},
    {id:'s2',title:'Участок вдоль железной дороги',note:'Контроль движения группы и сверка с картой.'},
    {id:'s3',title:'Контрольная точка 1',note:'Короткая остановка, проверка состава и направления.'},
    {id:'s4',title:'Каменоломня',note:'Основной ориентир маршрута и участок для изучения местности.'},
    {id:'s5',title:'Привал',note:'Отдых, вода, проверка готовности группы к продолжению.'},
    {id:'s6',title:'Финиш',note:'Сбор группы и подготовка к обратной дороге.'}
  ],
  materials:[
    {id:'m1',title:'Атлас маршрута · v19',type:'PDF',status:'pending'},
    {id:'m2',title:'Трек маршрута',type:'GPX',status:'pending'},
    {id:'m3',title:'Краткая памятка участника',type:'TXT',status:'draft'}
  ],
  timeline:[
    {id:'t1',time:'09:00',title:'Общий сбор',owner:'',route:'',note:'Проверка состава и общей готовности.'},
    {id:'t2',time:'09:30',title:'Выезд / переход к старту',owner:'',route:'',note:'Финальная логистика уточняется.'},
    {id:'t3',time:'10:00',title:'Старт маршрута',owner:'',route:'s1',note:'Сверка направления и состава.'},
    {id:'t4',time:'12:30',title:'Привал',owner:'',route:'s5',note:'Вода, перекус, контроль состояния.'},
    {id:'t5',time:'',title:'Завершение маршрута',owner:'',route:'s6',note:'Сбор группы.'}
  ]
});
function hasHikeSession(){try{return !!JSON.parse(localStorage.getItem('rl_hike_auth_v42')||'null')?.access_token}catch(e){return false}}
function purgeLegacyDemoData(){
  const bad=new Set(['p2','p3','p4','p5','p6']);
  if(!hasHikeSession())bad.add('p1');
  const isBad=id=>bad.has(String(id||''));
  const legacyCars=new Set(['c1','c2','b1','b2']);
  const cleanMap=obj=>{if(!obj||typeof obj!=='object')return;for(const id of bad)delete obj[id]};

  if(Array.isArray(S.participants))S.participants=S.participants.filter(p=>!isBad(p?.id));
  if(Array.isArray(S.roles))S.roles=S.roles.map(r=>isBad(r?.p)?{...r,p:''}:r);
  cleanMap(S.checks);

  if(Array.isArray(S.shared))S.shared=S.shared.map(g=>({
    ...g,
    a:(g.a||[]).filter(a=>!isBad(a?.[0])),
    confirmed:(g.confirmed||[]).filter(id=>!isBad(id))
  }));

  if(S.cars)for(const d of ['there','back']){
    S.cars[d]=(S.cars[d]||[]).filter(c=>!isBad(c?.driver)&&!legacyCars.has(c?.id)).map(c=>({...c,pass:(c.pass||[]).filter(id=>!isBad(id))}));
  }
  if(S.rides)for(const d of ['there','back']){
    S.rides[d] ||= {};
    cleanMap(S.rides[d]);
    const cars=S.cars?.[d]||[];
    for(const [pid,value] of Object.entries(S.rides[d])){
      if(legacyCars.has(value)||(value==='own'&&!cars.some(c=>c.driver===pid))||(value&&!['own','self','need','unset'].includes(value)&&!cars.some(c=>c.id===value)))S.rides[d][pid]='unset';
    }
  }

  if(Array.isArray(S.timeline))S.timeline=S.timeline.map(t=>isBad(t?.owner)?{...t,owner:''}:t);

  if(S.rolesV36){
    if(Array.isArray(S.rolesV36.roles))S.rolesV36.roles=S.rolesV36.roles.map(r=>isBad(r?.p)?{...r,p:''}:r);
    cleanMap(S.rolesV36.skills);
    if(S.rolesV36.candidates&&typeof S.rolesV36.candidates==='object'){
      for(const key of Object.keys(S.rolesV36.candidates))S.rolesV36.candidates[key]=(S.rolesV36.candidates[key]||[]).filter(id=>!isBad(id));
    }
  }

  for(const block of [S.gearV30,S.gearV36]){
    if(!block)continue;
    cleanMap(block.status);cleanMap(block.final);cleanMap(block.notes);
  }

  if(S.foodV31){
    (S.foodV31.meals||[]).forEach(m=>{m.cooks=(m.cooks||[]).filter(id=>!isBad(id))});
    (S.foodV31.ingredients||[]).forEach(i=>{
      if(isBad(i.buyer)||(['fi1','fi2','fi4'].includes(i.id)&&['p1','p5'].includes(i.buyer)))i.buyer='';
      i.bring=(i.bring||[]).filter(x=>!isBad(x?.pid||x?.id));
    });
    if(S.foodV31.personNotes)cleanMap(S.foodV31.personNotes);
    if(S.foodV31.mealChecks)for(const value of Object.values(S.foodV31.mealChecks))cleanMap(value);
    if(S.foodV31.attendance)for(const value of Object.values(S.foodV31.attendance))cleanMap(value);
  }

  const t=S.transportV24;
  if(t){
    cleanMap(t.profiles);cleanMap(t.returnOverrides);
    for(const d of ['there','back']){
      if(t.choices?.[d])cleanMap(t.choices[d]);
      if(Array.isArray(t.rides?.[d]))t.rides[d]=t.rides[d]
        .filter(r=>!isBad(r?.driver)&&!legacyCars.has(r?.id))
        .map(r=>({...r,requests:(r.requests||[]).filter(q=>!isBad(q?.pid)),passengers:(r.passengers||[]).filter(id=>!isBad(id))}));
    }
  }

  if(isBad(S.current))S.current='';
}
let S;
function storageGet(){try{return localStorage.getItem(STORAGE)}catch(e){return null}}
function storageSet(v){try{localStorage.setItem(STORAGE,v)}catch(e){}}
try{S=JSON.parse(storageGet())||seed()}catch(e){S=seed()}
normalize();
let tab='overview',gearMode='personal',dir='there';
function normalize(){
  const fresh=seed();
  purgeLegacyDemoData();
  S.event={...fresh.event,...(S.event||{})};
  S.participants=S.participants||fresh.participants;
  S.roles=(S.roles||fresh.roles).map(r=>({...r,desc:r.desc||roleDescriptions[r.title]||''}));
  if(!S.personal?.[0]?.id){S.personal=fresh.personal;const old=S.checks||{};S.checks={};Object.keys(old).forEach(pid=>S.checks[pid]=(old[pid]||[]).map(i=>fresh.personal[i]?.id).filter(Boolean));}
  S.checks=S.checks||fresh.checks;
  S.shared=(S.shared||fresh.shared).map((g,i)=>({...g,confirmed:g.confirmed||fresh.shared[i]?.confirmed||[]}));
  S.cars=S.cars||fresh.cars; ['there','back'].forEach(d=>S.cars[d]=(S.cars[d]||[]).map((c,i)=>({...fresh.cars[d]?.[i],...c,time:c.time||fresh.cars[d]?.[i]?.time||'Уточняется',from:c.from||fresh.cars[d]?.[i]?.from||'Уточняется'})));
  S.rides=S.rides||fresh.rides;
  if(!S.routeSteps){S.routeSteps=(S.route||[]).map((title,i)=>({id:'s'+(i+1),title,note:''}));}
  S.materials=S.materials||fresh.materials;
  if(Array.isArray(S.timeline)&&Array.isArray(S.timeline[0]))S.timeline=S.timeline.map((t,i)=>({id:'t'+(i+1),time:t[0],title:t[1],owner:t[2],route:'',note:''}));
  S.timeline=S.timeline||fresh.timeline;
  S.current=(S.current&&S.participants.some(p=>p.id===S.current))?S.current:(S.participants[0]?.id||'');
}
const save=()=>{
  storageSet(JSON.stringify(S));
  // Cloud synchronization is added by supabase-v42.js for the authenticated organizer.
  // Keeping the local copy makes the interface resilient to a temporary network failure.
  if(typeof scheduleCloudSync==='function')scheduleCloudSync();
};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pn=id=>S.participants.find(p=>p.id===id)?.name||'—';
const initials=name=>name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
const assigned=g=>g.a.reduce((n,a)=>n+a[1],0);
const activeParticipants=()=>S.participants.filter(p=>['yes','maybe'].includes(p.rsvp));
function progress(pid){const done=(S.checks[pid]||[]).length,total=S.personal.length;return [done,total,total?Math.round(done/total*100):100]}
function driverCar(pid,d=dir){return S.cars[d].find(c=>c.driver===pid)}
function ensureDriverState(d){S.cars[d].forEach(c=>{S.rides[d][c.driver]='own';c.pass=c.pass.filter(p=>p!==c.driver)});}
ensureDriverState('there');ensureDriverState('back');save();
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
function tag(t,c=''){return `<span class="tag ${c}">${esc(t)}</span>`}
function pageHead(kicker,title,desc,actions=''){return `<div class="page-head"><div class="page-head__copy"><div class="page-kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div><div class="page-head__actions">${actions}</div></div>`}
function section(title,body,desc='',actions=''){return `<section class="section"><div class="section-head"><div><h2>${esc(title)}</h2>${desc?`<p>${esc(desc)}</p>`:''}</div><div class="section-actions">${actions}</div></div>${body}</section>`}
function attentionGroups(){
  const critical=[],warning=[],info=[];
  const pending=S.participants.filter(p=>p.rsvp==='pending');
  if(pending.length) warning.push({title:`Не ответили: ${pending.length}`,detail:pending.map(p=>p.name).join(' · '),tab:'participants'});
  const criticalRoles=S.roles.filter(r=>r.critical&&!r.p),secondaryRoles=S.roles.filter(r=>!r.critical&&!r.p);
  if(criticalRoles.length) critical.push({title:`Не закрыты базовые роли: ${criticalRoles.length}`,detail:criticalRoles.map(r=>r.title).join(' · '),tab:'roles'});
  if(secondaryRoles.length) info.push({title:`Не назначены вспомогательные роли: ${secondaryRoles.length}`,detail:secondaryRoles.map(r=>r.title).join(' · '),tab:'roles'});
  const unassigned=S.shared.filter(g=>assigned(g)===0),deficit=S.shared.filter(g=>assigned(g)>0&&assigned(g)<g.need);
  if(unassigned.length) critical.push({title:`Групповое имущество без ответственного: ${unassigned.length}`,detail:unassigned.map(g=>g.title).join(' · '),tab:'gear'});
  if(deficit.length) warning.push({title:`Есть дефицит группового имущества: ${deficit.length}`,detail:deficit.map(g=>`${g.title} −${g.need-assigned(g)}`).join(' · '),tab:'gear'});
  ['there','back'].forEach(d=>{const p=activeParticipants().filter(x=>['unset','need'].includes(S.rides[d][x.id]));if(p.length)critical.push({title:`Без транспорта ${d==='there'?'туда':'обратно'}: ${p.length}`,detail:p.map(x=>x.name).join(' · '),tab:'transport'});});
  const incomplete=activeParticipants().filter(p=>progress(p.id)[0]<progress(p.id)[1]);
  if(incomplete.length) warning.push({title:`Не завершили личный чек-лист: ${incomplete.length}`,detail:incomplete.map(p=>`${p.name} ${progress(p.id)[0]}/${progress(p.id)[1]}`).join(' · '),tab:'gear'});
  const maybe=S.participants.filter(p=>p.rsvp==='maybe');if(maybe.length)info.push({title:`Статус «Возможно»: ${maybe.length}`,detail:maybe.map(p=>p.name).join(' · '),tab:'participants'});
  return {critical,warning,info};
}
function attentionCount(){const g=attentionGroups();return g.critical.length+g.warning.length+g.info.length}
function readiness(){const a=activeParticipants();if(!a.length)return 0;return Math.round(a.reduce((n,p)=>n+progress(p.id)[2],0)/a.length)}
function rideLabel(pid,d){const r=S.rides[d][pid];if(r==='own')return driverCar(pid,d)?'Своя машина':'Еду на своей машине';if(r==='self')return 'Самостоятельно';if(r==='need'||r==='unset')return 'Не закрыто';const c=S.cars[d].find(x=>x.id===r);return c?c.name:'Не закрыто'}
function participantRoles(pid){return S.roles.filter(r=>r.p===pid).map(r=>r.title)}
function participantShared(pid){return S.shared.filter(g=>g.a.some(a=>a[0]===pid)).map(g=>g.title)}
function renderNav(){
  document.getElementById('nav').innerHTML=NAV.map(([id,label])=>`<button type="button" data-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');
  const main=[['overview','Обзор'],['gear','Снаряжение'],['transport','Транспорт'],['route','Маршрут'],['more','Ещё']];
  document.getElementById('mobile').innerHTML=main.map(([id,label])=>`<button type="button" data-mobile="${id}" class="${tab===id || (id==='more'&&['participants','roles','plan'].includes(tab))?'active':''}">${label}</button>`).join('');
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;closeMobileSheet();render()});
  document.querySelectorAll('[data-mobile]').forEach(b=>b.onclick=()=>{const id=b.dataset.mobile;if(id==='more')return toggleMobileSheet();tab=id;closeMobileSheet();render()});
}
function toggleMobileSheet(){const sh=document.getElementById('mobileSheet');sh.innerHTML=[['participants','Участники'],['roles','Роли'],['plan','План']].map(([id,label])=>`<button type="button" data-sheet-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');sh.classList.toggle('open');sh.setAttribute('aria-hidden',sh.classList.contains('open')?'false':'true');sh.querySelectorAll('[data-sheet-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.sheetTab;closeMobileSheet();render()});}
function closeMobileSheet(){const sh=document.getElementById('mobileSheet');sh.classList.remove('open');sh.setAttribute('aria-hidden','true')}
function render(){
  renderNav();
  const who=document.getElementById('who');who.innerHTML=S.participants.map(p=>`<option value="${p.id}" ${p.id===S.current?'selected':''}>${esc(p.name)}</option>`).join('');
  const pages={overview,participants:participantsPage,roles:rolesPage,gear:gearPage,transport:transportPage,route:routePage,plan:planPage};
  document.getElementById('app').innerHTML=pages[tab]();
  bind();
}
function mapSvg(){return `<svg class="map-svg" viewBox="0 0 620 330" role="img" aria-label="Схематичное превью маршрута"><path class="terrain" d="M20 78 C110 30, 178 72, 250 46 S390 38, 590 74"/><path class="terrain" d="M18 244 C120 195, 198 236, 286 205 S438 190, 598 226"/><path class="terrain" d="M58 158 C124 126, 184 142, 242 116 S390 99, 548 132"/><line class="rail" x1="205" y1="12" x2="236" y2="316"/><line class="rail" x1="218" y1="12" x2="249" y2="316"/><path class="route-halo" d="M92 58 L106 126 L194 171 L229 205 L315 174 L390 111 L492 137 L544 242"/><path class="route-line" d="M92 58 L106 126 L194 171 L229 205 L315 174 L390 111 L492 137 L544 242"/><circle class="pt" cx="92" cy="58" r="6"/><circle class="pt" cx="229" cy="205" r="6"/><circle class="pt" cx="390" cy="111" r="6"/><circle class="pt" cx="544" cy="242" r="6"/><text x="72" y="42">Старт</text><text x="178" y="229">Ж/д</text><text x="370" y="93">Каменоломня</text><text x="525" y="266">Финиш</text></svg>`}
function overview(){
  const yes=S.participants.filter(p=>p.rsvp==='yes').length,maybe=S.participants.filter(p=>p.rsvp==='maybe').length;
  const roleDone=S.roles.filter(r=>r.p).length,gearDone=S.shared.filter(g=>assigned(g)>=g.need).length;
  const me=S.participants.find(p=>p.id===S.current)||{id:'',name:'Гость',rsvp:'pending'},pr=progress(S.current),myRoles=participantRoles(S.current),myShared=participantShared(S.current),att=attentionGroups();
  const myTasks=[];
  if(me.rsvp==='pending')myTasks.push(['warn','Подтвердить участие']);
  if(['unset','need'].includes(S.rides.there[S.current]))myTasks.push(['warn','Выбрать транспорт туда']);
  if(['unset','need'].includes(S.rides.back[S.current]))myTasks.push(['warn','Выбрать транспорт обратно']);
  if(pr[0]<pr[1])myTasks.push(['warn',`Закрыть личный чек-лист (${pr[0]}/${pr[1]})`]);
  const unconfirmed=S.shared.filter(g=>g.a.some(a=>a[0]===S.current)&&!g.confirmed.includes(S.current));
  if(unconfirmed.length)myTasks.push(['warn',`Подтвердить групповое имущество: ${unconfirmed.map(g=>g.title).join(', ')}`]);
  if(!myTasks.length)myTasks.push(['ok','Критичных действий на сейчас нет']);
  const attentionHtml=(kind,label,items)=>items.length?`<div class="attention-group"><div class="attention-group__head"><strong>${label}</strong><span class="attention-count">${items.length}</span></div>${items.map(x=>`<div class="attention-item"><i class="attention-bar ${kind}"></i><div><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></div><button class="btn alt sm" data-jump="${x.tab}">Открыть</button></div>`).join('')}</div>`:'';
  return `${pageHead('Командный штаб',S.event.short,'Подготовка похода в одном месте: люди, роли, транспорт, снаряжение, маршрут и план дня.')}<section class="event-hero"><div class="hero-copy"><div><div class="hero-labels">${tag(S.event.type,'sand')}${tag(S.event.status,'ok')}</div><h2 class="hero-title">${esc(S.event.short)}</h2><p class="hero-lead">Разведывательный поход с проверкой ориентирования, связи и организации группы. Точные параметры маршрута уточняются.</p></div><div class="hero-meta"><div><small>Дата</small><strong>${esc(S.event.date)}</strong></div><div><small>Сбор</small><strong>${esc(S.event.meeting)}</strong></div><div><small>Старт</small><strong>${esc(S.event.start)}</strong></div><div><small>Длительность</small><strong>${esc(S.event.duration)}</strong></div></div></div><div class="map-panel"><div class="map-caption"><small>Маршрут</small><strong>Схема маршрута</strong></div><div class="map-watermark">Атлас v19 будет подключён</div>${mapSvg()}<div class="map-actions"><button class="btn sm" data-jump="route">Открыть маршрут</button></div></div></section><div class="summary-strip"><div class="metric"><small>Участвуют</small><strong>${yes}</strong><em>${maybe?`${maybe} возможно`:'все определились'}</em></div><div class="metric"><small>Роли</small><strong>${roleDone}/${S.roles.length}</strong><em>${S.roles.filter(r=>r.critical&&!r.p).length?'есть критичные':'базовые закрыты'}</em></div><div class="metric"><small>Групповое</small><strong>${gearDone}/${S.shared.length}</strong><em>${S.shared.length-gearDone?'есть дефициты':'комплект закрыт'}</em></div><div class="metric"><small>Готовность</small><strong>${readiness()}%</strong><em>по активным участникам</em></div><div class="metric"><small>Сигналы</small><strong>${attentionCount()}</strong><em>требуют внимания</em></div></div>${section('Моя подготовка',`<div class="my-prep"><div class="prep-primary"><div class="prep-person">${esc(me.name)}</div><div class="prep-role">${myRoles.length?myRoles.join(' · '):'Роль не назначена'}</div><div class="prep-checks"><div class="prep-line"><small>Участие</small><strong>${rsvpLabel(me.rsvp)}</strong></div><div class="prep-line"><small>Личное снаряжение</small><strong>${pr[0]} / ${pr[1]} · ${pr[2]}%</strong><div class="progress"><i style="width:${pr[2]}%"></i></div></div><div class="prep-line"><small>Транспорт туда</small><strong>${esc(rideLabel(S.current,'there'))}</strong></div><div class="prep-line"><small>Транспорт обратно</small><strong>${esc(rideLabel(S.current,'back'))}</strong></div>${myShared.length?`<div class="prep-line"><small>Групповое имущество</small><strong>${esc(myShared.join(' · '))}</strong></div>`:''}</div></div><div class="prep-side"><div class="page-kicker">Следующие действия</div>${myTasks.map(t=>`<div class="prep-task"><i class="task-dot ${t[0]}"></i><div>${esc(t[1])}</div></div>`).join('')}</div></div>`,'Каждый видит только то, что нужно сделать именно ему.')}${section('Требует внимания',`<div class="attention-groups">${attentionHtml('risk','Критично',att.critical)}${attentionHtml('','Требует решения',att.warning)}${attentionHtml('info','Информация',att.info)}${!attentionCount()?'<div class="panel">Незакрытых вопросов нет.</div>':''}</div>`,'Похожие проблемы объединены, чтобы организатор видел картину, а не простыню уведомлений.')}${section('Ближайшие этапы',`<div class="list">${S.timeline.slice(0,4).map(t=>`<div class="row"><div class="row-main"><div class="row-title"><b>${esc(t.time)} · ${esc(t.title)}</b></div><small>${esc(pn(t.owner))}${t.route?' · '+esc(routeName(t.route)):''}</small></div></div>`).join('')}</div>`,'Первые точки плана дня.')}`;
}
const RSVP={yes:'Участвую',maybe:'Возможно',no:'Не участвую',pending:'Не ответил'};
function rsvpLabel(x){return RSVP[x]||x}
function participantsPage(){
  const counts=Object.fromEntries(['yes','maybe','no','pending'].map(k=>[k,S.participants.filter(p=>p.rsvp===k).length]));
  return `${pageHead('Мероприятие','Участники','Кто идёт, кто ещё думает, как человек добирается и насколько готов.')}<div class="deadline-note"><div><strong>Ответить до ${esc(S.event.replyDeadline)}</strong><span> · после дедлайна организатор фиксирует состав</span></div>${tag(`${counts.pending} не ответили`,counts.pending?'warn':'ok')}</div><div class="rsvp-summary"><span><strong>${counts.yes}</strong> участвуют</span><span><strong>${counts.maybe}</strong> возможно</span><span><strong>${counts.no}</strong> не участвуют</span><span><strong>${counts.pending}</strong> не ответили</span></div>${section('Состав',`<div class="list">${S.participants.map(p=>{const pr=progress(p.id),roles=participantRoles(p.id),shared=participantShared(p.id);return `<div class="row"><div class="person-line"><div class="avatar">${initials(p.name)}</div><div class="person-copy"><div class="row-title"><b>${esc(p.name)}</b>${p.id===S.current?tag('вы смотрите как он','sand'):''}</div><small>${esc(roles.join(', ')||'без роли')} · ${esc(rideLabel(p.id,'there'))} · снаряжение ${pr[0]}/${pr[1]}${shared.length?' · несёт: '+esc(shared.join(', ')):''}</small><div class="progress"><i style="width:${pr[2]}%"></i></div></div></div><select class="status-select" data-rsvp="${p.id}" aria-label="Статус ${esc(p.name)}">${Object.entries(RSVP).map(([k,v])=>`<option value="${k}" ${p.rsvp===k?'selected':''}>${v}</option>`).join('')}</select></div>`}).join('')}</div>`,'Статус меняется одним действием; подробности остаются в строке.')}`;
}
function rolesPage(){return `${pageHead('Ответственность','Роли','Кто отвечает за конкретный вопрос и что входит в его зону ответственности.')}${section('Распределение',`<div>${S.roles.map(r=>`<div class="role-row"><div class="role-name"><strong>${esc(r.title)}</strong><small>${r.critical?'Базовая роль':'Вспомогательная роль'} ${!r.p?'· не назначена':''}</small></div><div class="role-desc">${esc(r.desc)}</div><select data-role="${r.id}" aria-label="Ответственный за ${esc(r.title)}"><option value="">Не назначено</option>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${r.p===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`).join('')}</div>`,'Для участника это справочник «кому писать по какому вопросу».')}`}
function gearPage(){
  const pr=progress(S.current),groups={required:'Обязательное',weather:'По погоде',recommended:'Рекомендуемое'};
  const personalHtml=Object.entries(groups).map(([key,label])=>{const items=S.personal.filter(i=>i.priority===key);return `<div class="gear-group"><div class="gear-group__title"><strong>${label}</strong><span class="priority ${key}">${items.filter(i=>(S.checks[S.current]||[]).includes(i.id)).length}/${items.length}</span></div>${items.map(i=>{const on=(S.checks[S.current]||[]).includes(i.id);return `<div class="check-row"><button class="check-box ${on?'on':''}" data-check="${i.id}" type="button">${on?'✓':''}</button><div><b>${esc(i.title)}</b><small class="priority ${key}">${label}</small></div><span>${on?'готово':'не отмечено'}</span></div>`}).join('')}</div>`}).join('');
  const sharedHtml=`<div class="shared-head"><span>Предмет</span><span>Нужно</span><span>Кто берёт</span><span>Статус</span></div>${S.shared.map(g=>{const x=assigned(g),mine=g.a.find(a=>a[0]===S.current),confirmed=g.confirmed.length,owners=g.a.map(a=>`${pn(a[0])} ×${a[1]}${g.confirmed.includes(a[0])?' ✓':''}`).join(', ')||'не назначено';let st=x===0?['Не назначен','risk']:x<g.need?[`Дефицит ${g.need-x}`,'warn']:confirmed<g.a.length?['Нужно подтвердить','warn']:['Закрыто','ok'];return `<div class="shared-row"><div><b>${esc(g.title)}</b><small class="shared-owner">${esc(owners)}</small></div><div>${g.need}</div><div class="shared-owner">Назначено ${x}</div><div><div class="status-text ${st[1]}">${st[0]}</div><div class="row-actions" style="margin-top:7px">${mine?`<button class="btn alt sm" data-drop="${g.id}">Снять</button>${!g.confirmed.includes(S.current)?`<button class="btn sm" data-confirm-gear="${g.id}">Подтвердить</button>`:''}`:`<button class="btn sm" data-take="${g.id}" ${x>=g.need?'disabled':''}>Возьму</button>`}</div></div></div>`}).join('')}`;
  return `${pageHead('Подготовка','Снаряжение','Личный чек-лист и групповое имущество без путаницы между «назначено» и «подтверждено».',`<button class="btn alt" id="addShared">Добавить групповое</button>`)}<div class="segmented"><button class="${gearMode==='personal'?'active':''}" data-gear-mode="personal">Личное</button><button class="${gearMode==='shared'?'active':''}" data-gear-mode="shared">Групповое</button></div>${gearMode==='personal'?`${section('Личный чек-лист',`<div class="card dark"><div class="prep-person">${esc(pn(S.current))}</div><small>Готовность ${pr[0]}/${pr[1]} · ${pr[2]}%</small><div class="progress dark"><i style="width:${pr[2]}%"></i></div></div>${personalHtml}`,'Обязательное выделено отдельно от погодных и рекомендованных вещей.')}`:`${section('Групповое имущество',sharedHtml,'Назначение и фактическое подтверждение разделены.')}`}`;
}
function transportPage(){
  ensureDriverState(dir);
  const cars=S.cars[dir],ride=S.rides[dir][S.current],currentDriver=driverCar(S.current,dir);
  const unresolved=activeParticipants().filter(p=>['unset','need'].includes(S.rides[dir][p.id]));
  return `${pageHead('Логистика','Транспорт','Дорога туда и обратно управляется отдельно. Водитель не может случайно стать пассажиром своей же машины.',`<button class="btn alt" id="addCar">Добавить машину</button>`)}<div class="segmented"><button class="${dir==='there'?'active':''}" data-dir="there">Туда</button><button class="${dir==='back'?'active':''}" data-dir="back">Обратно</button></div><div class="transport-alert"><div><strong>${unresolved.length?'Требуется решение':'Транспорт закрыт'}</strong><span>${unresolved.length?' · '+unresolved.map(p=>p.name).join(' · '):' · у активных участников выбран способ поездки'}</span></div>${tag(`${unresolved.length} без решения`,unresolved.length?'warn':'ok')}</div><div class="row-actions" style="justify-content:flex-start;margin-bottom:18px">${currentDriver?tag(`Вы водитель · ${currentDriver.name}`,'sand'):`<button class="btn ${ride==='need'?'sand':'alt'} sm" data-mode="need">Нужно место</button><button class="btn ${ride==='self'?'sand':'alt'} sm" data-mode="self">Самостоятельно</button>`}</div><div class="cars">${cars.map(c=>{const free=c.cap-c.pass.length,inside=c.pass.includes(S.current),isDriver=c.driver===S.current;return `<article class="car"><div class="car-head"><div><h3>${esc(c.name)}</h3><small>Водитель · ${esc(pn(c.driver))}</small></div>${tag(`Свободно ${free}`,free?'ok':'risk')}</div><div class="car-meta"><div><small>Выезд</small><strong>${esc(c.time)}</strong></div><div><small>Откуда</small><strong>${esc(c.from)}</strong></div></div><div class="passengers">${c.pass.length?c.pass.map(p=>`<div class="passenger"><span>${esc(pn(p))}</span><span>пассажир</span></div>`).join(''):'<div class="passenger"><span>Пассажиров пока нет</span></div>'}</div><div class="row-actions" style="justify-content:flex-start;margin-top:10px">${isDriver?tag('Ваша машина','sand'):inside?`<button class="btn alt sm" data-seat="${c.id}">Выйти</button>`:`<button class="btn sm" data-seat="${c.id}" ${free<=0?'disabled':''}>Занять место</button>`}</div></article>`}).join('')}</div>`;
}
function routeName(id){return S.routeSteps.find(s=>s.id===id)?.title||'—'}
function routePage(){return `${pageHead('Навигация','Маршрут','Карта отвечает на вопрос «где идём», а план — «когда и что делаем».')}<div class="route-layout"><div class="route-map"><div class="map-panel"><div class="map-caption"><small>Маршрут</small><strong>Схема маршрута</strong></div><div class="map-watermark">Схема маршрута</div>${mapSvg()}<div class="map-actions"><button class="btn sm" id="atlas">Открыть атлас</button></div></div></div><aside class="route-summary"><div class="metric"><small>Дистанция</small><strong>${esc(S.event.distance)}</strong><em>будет уточнено по финальной карте</em></div><div class="metric"><small>Формат</small><strong>${esc(S.event.duration)}</strong><em>${esc(S.event.type)}</em></div><div class="metric"><small>Старт</small><strong>${esc(S.event.start)}</strong><em>${esc(S.event.meeting)}</em></div>${section('Материалы',`<div>${S.materials.map(m=>`<div class="material"><div><b>${esc(m.title)}</b><small>${esc(m.type)}</small></div>${tag(m.status==='pending'?'не загружен':m.status==='draft'?'черновик':'готов',m.status==='ready'?'ok':'warn')}</div>`).join('')}</div>`)}</aside></div>${section('Этапы маршрута',`<div>${S.routeSteps.map((s,i)=>`<div class="route-step"><div></div><div><h3>${esc(s.title)}</h3><p>${esc(s.note)}</p></div><div class="row-actions"><button class="icon-btn" data-move="${i}:-1" ${i===0?'disabled':''}>↑</button><button class="icon-btn" data-move="${i}:1" ${i===S.routeSteps.length-1?'disabled':''}>↓</button></div></div>`).join('')}</div>`,'Порядок точек можно менять без дублирования таймлайна.')}`}
function planPage(){return `${pageHead('Организация дня','План','Таймлайн показывает время и действия; при необходимости этап привязывается к точке маршрута.',`<button class="btn sand" id="addTimeline">Добавить этап</button>`)}${section('Таймлайн',`<div class="timeline-head"><span>Время</span><span>Этап</span><span>Ответственный</span><span>Маршрут</span><span></span></div>${S.timeline.map(t=>`<div class="timeline-row"><div class="timeline-time">${esc(t.time)}</div><div><b>${esc(t.title)}</b><small>${esc(t.note||'')}</small></div><div>${esc(pn(t.owner))}</div><div>${t.route?esc(routeName(t.route)):'—'}</div><div class="row-actions"><button class="icon-btn" data-edit-time="${t.id}" title="Редактировать">✎</button><button class="icon-btn" data-del-time="${t.id}" title="Удалить">×</button></div></div>`).join('')}`,'Формы открываются внутри интерфейса — без браузерных prompt-окон.')}${section('Учебные задачи',`<div class="learning-grid"><div class="learning"><strong>Ориентирование</strong><p>Сверка карты, контрольных точек и положения группы.</p></div><div class="learning"><strong>Радиосвязь</strong><p>Проверка основного и резервного канала перед маршрутом.</p></div><div class="learning"><strong>Организация группы</strong><p>Контроль состава на старте, привале и финише.</p></div></div>`,'Без боевой тактики и опасных упражнений.')}`}
function openModal(title,body,onSave){const layer=document.getElementById('modalLayer');layer.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><strong>${esc(title)}</strong><button class="icon-btn" id="modalClose">×</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button class="btn alt" id="modalCancel">Отмена</button><button class="btn sand" id="modalSave">Сохранить</button></div></div>`;layer.classList.add('open');layer.setAttribute('aria-hidden','false');const close=()=>{layer.classList.remove('open');layer.setAttribute('aria-hidden','true');layer.innerHTML=''};layer.querySelector('#modalClose').onclick=close;layer.querySelector('#modalCancel').onclick=close;layer.onclick=e=>{if(e.target===layer)close()};layer.querySelector('#modalSave').onclick=async()=>{const button=layer.querySelector('#modalSave');button.disabled=true;try{if(await onSave(layer)!==false)close()}finally{button.disabled=false}}}
function timelineModal(item=null){const t=item||{time:'',title:'',owner:S.current,route:'',note:''};openModal(item?'Редактировать этап':'Новый этап',`<div class="form-grid"><div class="field"><label>Время</label><input id="fTime" type="time" value="${esc(t.time)}"></div><div class="field"><label>Ответственный</label><select id="fOwner">${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${p.id===t.owner?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field full"><label>Название</label><input id="fTitle" value="${esc(t.title)}" placeholder="Например, контрольная точка"></div><div class="field full"><label>Связанная точка маршрута</label><select id="fRoute"><option value="">Не привязывать</option>${S.routeSteps.map(s=>`<option value="${s.id}" ${s.id===t.route?'selected':''}>${esc(s.title)}</option>`).join('')}</select></div><div class="field full"><label>Комментарий</label><textarea id="fNote">${esc(t.note||'')}</textarea></div></div>`,layer=>{const time=layer.querySelector('#fTime').value,title=layer.querySelector('#fTitle').value.trim();if(!time||!title){toast('Заполни время и название');return false}const obj={id:item?.id||'t'+Date.now(),time,title,owner:layer.querySelector('#fOwner').value,route:layer.querySelector('#fRoute').value,note:layer.querySelector('#fNote').value.trim()};if(item)Object.assign(item,obj);else S.timeline.push(obj);S.timeline.sort((a,b)=>a.time.localeCompare(b.time));save();render();toast(item?'Этап обновлён':'Этап добавлен')})}
function sharedModal(){openModal('Добавить групповое имущество',`<div class="form-grid"><div class="field full"><label>Предмет</label><input id="gTitle" placeholder="Например, запасной компас"></div><div class="field"><label>Количество</label><input id="gNeed" type="number" min="1" value="1"></div></div>`,layer=>{const title=layer.querySelector('#gTitle').value.trim(),need=+layer.querySelector('#gNeed').value;if(!title||!need){toast('Заполни название и количество');return false}S.shared.push({id:'g'+Date.now(),title,need,a:[],confirmed:[]});save();render();toast('Предмет добавлен')})}
function carModal(){openModal('Добавить машину',`<div class="form-grid"><div class="field"><label>Водитель</label><select id="cDriver">${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Мест для пассажиров</label><input id="cCap" type="number" min="1" value="3"></div><div class="field"><label>Время выезда</label><input id="cTime" type="time" value="07:40"></div><div class="field"><label>Название</label><input id="cName" placeholder="Например, Kia Sportage"></div><div class="field full"><label>Точка отправления</label><input id="cFrom" placeholder="Точка уточняется"></div></div>`,layer=>{const driver=layer.querySelector('#cDriver').value;if(driverCar(driver,dir)){toast('У этого участника уже есть машина в этом направлении');return false}const cap=+layer.querySelector('#cCap').value,name=layer.querySelector('#cName').value.trim()||`Машина ${pn(driver)}`,time=layer.querySelector('#cTime').value||'Уточняется',from=layer.querySelector('#cFrom').value.trim()||'Точка уточняется';const id=(dir==='there'?'c':'b')+Date.now();S.cars[dir].push({id,driver,name,cap,pass:[],time,from});S.rides[dir][driver]='own';save();render();toast('Машина добавлена')})}
function bind(){
  document.getElementById('who').onchange=e=>{S.current=e.target.value;save();render()};
  document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{tab=b.dataset.jump;render()});
  document.querySelectorAll('[data-rsvp]').forEach(s=>s.onchange=()=>{S.participants.find(p=>p.id===s.dataset.rsvp).rsvp=s.value;save();render()});
  document.querySelectorAll('[data-role]').forEach(s=>s.onchange=()=>{S.roles.find(r=>r.id===s.dataset.role).p=s.value;save();toast('Ответственный обновлён');render()});
  document.querySelectorAll('[data-gear-mode]').forEach(b=>b.onclick=()=>{gearMode=b.dataset.gearMode;render()});
  document.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const id=b.dataset.check,a=S.checks[S.current]||[];S.checks[S.current]=a.includes(id)?a.filter(x=>x!==id):[...a,id];save();render()});
  document.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>{const g=S.shared.find(x=>x.id===b.dataset.take);if(assigned(g)>=g.need)return toast('Требуемое количество уже закрыто');g.a.push([S.current,1]);save();toast('Предмет закреплён');render()});
  document.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>{const g=S.shared.find(x=>x.id===b.dataset.drop);g.a=g.a.filter(a=>a[0]!==S.current);g.confirmed=g.confirmed.filter(x=>x!==S.current);save();render()});
  document.querySelectorAll('[data-confirm-gear]').forEach(b=>b.onclick=()=>{const g=S.shared.find(x=>x.id===b.dataset.confirmGear);if(!g.confirmed.includes(S.current))g.confirmed.push(S.current);save();toast('Готовность подтверждена');render()});
  document.getElementById('addShared')?.addEventListener('click',sharedModal);
  document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>{dir=b.dataset.dir;ensureDriverState(dir);save();render()});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(driverCar(S.current,dir))return toast('Вы водитель в этом направлении');const old=S.rides[dir][S.current],oldCar=S.cars[dir].find(c=>c.id===old);if(oldCar)oldCar.pass=oldCar.pass.filter(p=>p!==S.current);S.rides[dir][S.current]=b.dataset.mode;save();render()});
  document.querySelectorAll('[data-seat]').forEach(b=>b.onclick=()=>{if(driverCar(S.current,dir))return toast('Водитель не может занять пассажирское место');const c=S.cars[dir].find(x=>x.id===b.dataset.seat),old=S.rides[dir][S.current],oldCar=S.cars[dir].find(x=>x.id===old);if(c.pass.includes(S.current)){c.pass=c.pass.filter(p=>p!==S.current);S.rides[dir][S.current]='need'}else if(c.pass.length<c.cap){if(oldCar)oldCar.pass=oldCar.pass.filter(p=>p!==S.current);c.pass.push(S.current);S.rides[dir][S.current]=c.id}else return toast('Свободных мест нет');save();render()});
  document.getElementById('addCar')?.addEventListener('click',carModal);
  document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const [i,d]=b.dataset.move.split(':').map(Number),j=i+d;if(j<0||j>=S.routeSteps.length)return;[S.routeSteps[i],S.routeSteps[j]]=[S.routeSteps[j],S.routeSteps[i]];save();render()});
  document.getElementById('atlas')?.addEventListener('click',()=>toast('Атлас найден в материалах проекта, публичный файл подключим отдельно'));
  document.getElementById('addTimeline')?.addEventListener('click',()=>timelineModal());
  document.querySelectorAll('[data-edit-time]').forEach(b=>b.onclick=()=>timelineModal(S.timeline.find(t=>t.id===b.dataset.editTime)));
  document.querySelectorAll('[data-del-time]').forEach(b=>b.onclick=()=>{const t=S.timeline.find(x=>x.id===b.dataset.delTime);if(confirm(`Удалить этап «${t?.title||''}»?`)){S.timeline=S.timeline.filter(x=>x.id!==b.dataset.delTime);save();render()}});
}
document.getElementById('reset').onclick=()=>{if(confirm('Сбросить локальные изменения?')){S=seed();save();tab='overview';gearMode='personal';dir='there';render();toast('Локальные изменения сброшены')}};
document.getElementById('eventSwitcher').onclick=()=>toast('Сейчас доступно одно мероприятие.');
render();


;/* source: hikes-preview/route-v9.js */
const ROUTE_V9_POINTS=[{"id":"cp0","title":"Лагерь / старт","km":0.0,"fromPrev":null,"arrival":"10:00","stop":"","lat":55.575948,"lon":37.957684},{"id":"cp1","title":"Выход к ЖД","km":0.8,"fromPrev":0.8,"arrival":"10:15","stop":"","lat":55.572607,"lon":37.949596},{"id":"cp2","title":"Пересечение ЖД и ЛЭП","km":2.2,"fromPrev":1.4,"arrival":"10:45","stop":"","lat":55.582887,"lon":37.941299},{"id":"cp3","title":"Родник","km":3.3,"fromPrev":1.1,"arrival":"11:05","stop":"","lat":55.586927,"lon":37.930032},{"id":"cp4","title":"Каменоломня","km":3.7,"fromPrev":0.4,"arrival":"11:15","stop":"Привал 15 мин","lat":55.587161,"lon":37.925857},{"id":"cp5","title":"Карстовая пещера","km":4.7,"fromPrev":1.0,"arrival":"11:50","stop":"Привал 10 мин","lat":55.593047,"lon":37.918645},{"id":"cp6","title":"Верхняя западная развилка","km":6.2,"fromPrev":1.5,"arrival":"12:30","stop":"","lat":55.604122,"lon":37.929005},{"id":"cp7","title":"Памятник лётчикам","km":7.0,"fromPrev":0.8,"arrival":"12:45","stop":"Обед 60 мин","lat":55.60641,"lon":37.937701},{"id":"cp8","title":"Вход на просеку ЛЭП","km":7.5,"fromPrev":0.5,"arrival":"13:55","stop":"","lat":55.603081,"lon":37.93965},{"id":"cp9","title":"Южный сход с просеки ЛЭП","km":9.2,"fromPrev":1.7,"arrival":"14:30","stop":"","lat":55.588617,"lon":37.940033},{"id":"cp10","title":"Центральный поворот на север","km":10.0,"fromPrev":0.8,"arrival":"14:45","stop":"","lat":55.5855,"lon":37.950133},{"id":"cp11","title":"Пруд / озеро","km":12.3,"fromPrev":2.3,"arrival":"15:30","stop":"Привал 15 мин","lat":55.603128,"lon":37.945451},{"id":"cp12","title":"Северная кромка поля","km":13.6,"fromPrev":1.3,"arrival":"16:10","stop":"","lat":55.612462,"lon":37.941113},{"id":"cp13","title":"Выход к северной просеке","km":15.0,"fromPrev":1.5,"arrival":"16:40","stop":"","lat":55.608304,"lon":37.957908},{"id":"cp14","title":"Восточная кромка поля","km":16.6,"fromPrev":1.6,"arrival":"17:10","stop":"","lat":55.596966,"lon":37.96384},{"id":"cp15","title":"Поворот к восточной петле","km":17.9,"fromPrev":1.3,"arrival":"17:40","stop":"Привал 15 мин","lat":55.585372,"lon":37.963978},{"id":"cp16","title":"Дальний восточный край","km":19.2,"fromPrev":1.3,"arrival":"18:20","stop":"","lat":55.582733,"lon":37.981837},{"id":"cp17","title":"Возврат с восточной петли","km":20.4,"fromPrev":1.2,"arrival":"18:45","stop":"","lat":55.582436,"lon":37.964183},{"id":"cpf","title":"Лагерь / финиш","km":21.3,"fromPrev":0.9,"arrival":"19:00","stop":"","lat":55.575948,"lon":37.957684}];
const ROUTE_V9_LEGS=[{"id":"leg1","from":"cp0","to":"cp1","distance":0.8,"bearing":234,"guide":"Из лагеря по лесной тропе к выходу на ЖД."},{"id":"leg2","from":"cp1","to":"cp2","distance":1.4,"bearing":335,"guide":"Дальше вдоль ЖД до пересечения с просекой ЛЭП."},{"id":"leg3","from":"cp2","to":"cp3","distance":1.1,"bearing":302,"guide":"Сход от ЖД по тропе к роднику."},{"id":"leg4","from":"cp3","to":"cp4","distance":0.4,"bearing":276,"guide":"Короткий переход к каменоломне."},{"id":"leg5","from":"cp4","to":"cp5","distance":1.0,"bearing":325,"guide":"По западным тропам к карстовой пещере."},{"id":"leg6","from":"cp5","to":"cp6","distance":1.5,"bearing":28,"guide":"Подъём по тропе к верхней западной развилке."},{"id":"leg7","from":"cp6","to":"cp7","distance":0.8,"bearing":65,"guide":"Переход к памятнику лётчикам."},{"id":"leg8","from":"cp7","to":"cp8","distance":0.5,"bearing":164,"guide":"После обеда выход к началу просеки ЛЭП."},{"id":"leg9","from":"cp8","to":"cp9","distance":1.7,"bearing":178,"guide":"Прямой ход вниз вдоль просеки ЛЭП."},{"id":"leg10","from":"cp9","to":"cp10","distance":0.8,"bearing":118,"guide":"Сход с ЛЭП к центральному повороту на север."},{"id":"leg11","from":"cp10","to":"cp11","distance":2.3,"bearing":351,"guide":"Переход к пруду / озеру — главному ориентиру сектора."},{"id":"leg12","from":"cp11","to":"cp12","distance":1.3,"bearing":347,"guide":"Подъём к северной кромке поля."},{"id":"leg13","from":"cp12","to":"cp13","distance":1.5,"bearing":115,"guide":"Выход к северной просеке по краю открытого участка."},{"id":"leg14","from":"cp13","to":"cp14","distance":1.6,"bearing":164,"guide":"Спуск вдоль восточной кромки поля."},{"id":"leg15","from":"cp14","to":"cp15","distance":1.3,"bearing":179,"guide":"Переход к повороту в восточную петлю."},{"id":"leg16","from":"cp15","to":"cp16","distance":1.3,"bearing":106,"guide":"Восточная петля вдоль лесной кромки."},{"id":"leg17","from":"cp16","to":"cp17","distance":1.2,"bearing":269,"guide":"Возврат с дальнего восточного края."},{"id":"leg18","from":"cp17","to":"cpf","distance":0.9,"bearing":209,"guide":"Финальный возврат по лесной тропе в лагерь."}];
const ROUTE_V9_TRACK=[[55.57589,37.957558],[55.574919,37.954811],[55.57407,37.953524],[55.572978,37.954039],[55.572444,37.953996],[55.572493,37.950777],[55.572663,37.949018],[55.57441,37.94906],[55.575307,37.947988],[55.576448,37.94537],[55.577248,37.944683],[55.577709,37.943653],[55.578922,37.943138],[55.580547,37.943524],[55.581324,37.943524],[55.582148,37.942537],[55.582371,37.942336],[55.582611,37.941595],[55.582928,37.941255],[55.583302,37.940501],[55.583857,37.939455],[55.584391,37.938066],[55.584494,37.936682],[55.584312,37.93416],[55.584183,37.931482],[55.585622,37.929738],[55.586944,37.928043],[55.587168,37.925865],[55.588231,37.927092],[55.588569,37.926543],[55.589017,37.927225],[55.589314,37.927562],[55.589605,37.927186],[55.589666,37.925802],[55.589981,37.925373],[55.590567,37.92417],[55.590927,37.923399],[55.591224,37.921747],[55.592291,37.920878],[55.593019,37.918711],[55.593443,37.91811],[55.594183,37.917938],[55.594959,37.918346],[55.596654,37.919578],[55.598681,37.922015],[55.599493,37.922273],[55.599808,37.923067],[55.600948,37.923474],[55.601954,37.926843],[55.603105,37.928624],[55.604136,37.92901],[55.604075,37.930491],[55.603881,37.936757],[55.60496,37.938066],[55.606417,37.937679],[55.605493,37.938173],[55.605118,37.939696],[55.605033,37.940404],[55.603821,37.940662],[55.603287,37.940297],[55.602972,37.93931],[55.599869,37.939439],[55.600017,37.938744],[55.588556,37.94004],[55.58812,37.940941],[55.587223,37.941971],[55.586471,37.94313],[55.585961,37.945833],[55.585767,37.947893],[55.585476,37.950339],[55.587611,37.952185],[55.593819,37.951798],[55.594837,37.950447],[55.595989,37.949653],[55.596729,37.94873],[55.597929,37.949073],[55.598826,37.949159],[55.599735,37.948816],[55.601699,37.948022],[55.602572,37.948322],[55.603687,37.947679],[55.603105,37.945361],[55.603736,37.945104],[55.604221,37.947679],[55.605239,37.947679],[55.608342,37.94343],[55.610451,37.940898],[55.612147,37.94107],[55.612462,37.941113],[55.613699,37.945833],[55.612099,37.946992],[55.611396,37.949309],[55.612123,37.953386],[55.608172,37.958064],[55.606881,37.959158],[55.606118,37.959319],[55.605564,37.959995],[55.605112,37.960596],[55.604481,37.961358],[55.604196,37.961057],[55.604045,37.960188],[55.60333,37.960006],[55.603154,37.960403],[55.602481,37.959738],[55.602039,37.959845],[55.601893,37.960296],[55.601499,37.96257],[55.600966,37.962441],[55.60056,37.963815],[55.596241,37.963845],[55.59046,37.963922],[55.589265,37.964008],[55.585362,37.963978],[55.584967,37.966175],[55.585319,37.970037],[55.58504,37.973299],[55.585549,37.975659],[55.584785,37.979822],[55.583245,37.982054],[55.582335,37.981668],[55.581971,37.978449],[55.582105,37.970316],[55.582517,37.964373],[55.58208,37.963343],[55.581171,37.962377],[55.57957,37.962377],[55.577835,37.962141],[55.577932,37.961733],[55.577787,37.960854],[55.57702,37.960064],[55.576404,37.958407],[55.576006,37.957811]];
let routeModeV9='points',routeMapV9=null,routeMarkersV9={};
const cpV9=id=>ROUTE_V9_POINTS.find(p=>p.id===id);
function applyRouteV9(force=false){if(!force&&S.routeVersion===3)return;S.routeVersion=3;S.event={...S.event,title:'Томинский лесопарк · полевой маршрут',short:'Томинский лесопарк',type:'Поход-тренировка',status:'Подготовка',date:S.event?.date||'Дата уточняется',meeting:'09:00 · Лагерь',start:'10:00',finish:'19:00',distance:'21,3 км',duration:'9 часов',replyDeadline:S.event?.replyDeadline||'уточняется',cpCount:17};S.routeSteps=ROUTE_V9_POINTS.map(p=>({...p,note:p.stop||''}));S.materials=[{id:'m1',title:'Полевой атлас',type:'PDF · 14 страниц',status:'source',action:'source'},{id:'m2',title:'Трек маршрута',type:'GPX · 132 точки',status:'ready',url:'./route.gpx',action:'download'},{id:'m3',title:'Маршрут',type:'KML',status:'ready',url:'./route.kml',action:'download'}];S.timeline=ROUTE_V9_POINTS.map((p,i)=>({id:'rt'+i,time:p.arrival,title:p.title,owner:'',route:p.id,note:p.stop||(i===0?'Старт маршрута':i===ROUTE_V9_POINTS.length-1?'Плановый финиш':'Контроль прохождения')}));save();}
function mapSvgV9(){const W=620,H=330,pad=24,lats=ROUTE_V9_TRACK.map(p=>p[0]),lons=ROUTE_V9_TRACK.map(p=>p[1]),minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons),project=([lat,lon])=>[pad+(lon-minLon)/(maxLon-minLon)*(W-pad*2),pad+(maxLat-lat)/(maxLat-minLat)*(H-pad*2)],pts=ROUTE_V9_TRACK.map(p=>project(p).map(v=>v.toFixed(1)).join(',')).join(' '),marks=ROUTE_V9_POINTS.filter(p=>p.id!=='cpf').map((p,i)=>{const [x,y]=project([p.lat,p.lon]),lab=p.id==='cp0'?'Л':String(i);return `<g class="cp-mark"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/><text x="${(x+7).toFixed(1)}" y="${(y-7).toFixed(1)}">${lab}</text></g>`}).join('');return `<svg class="map-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Контур маршрута по GPX"><polyline class="route-halo" points="${pts}"/><polyline class="route-line" points="${pts}"/>${marks}</svg>`;}
mapSvg=mapSvgV9;
const overviewV8=overview;overview=function(){return overviewV8().replace('Разведывательный поход с проверкой ориентирования, связи и организации группы. Точные параметры маршрута уточняются.','Полевой маршрут 21,3 км через ЖД, ЛЭП, каменоломню, карстовую пещеру, памятник лётчикам и восточную петлю.').replace('Схема маршрута','GPX · реальный контур').replace('Атлас v19 будет подключён','21,3 км · 17 КП');};
function mountRouteMapV9(){const el=document.getElementById('routeMapInteractive');if(!el)return;if(routeMapV9){try{routeMapV9.remove()}catch(e){}routeMapV9=null;routeMarkersV9={}}if(!window.L){el.innerHTML=`<div class="map-fallback">${mapSvgV9()}<div class="map-fallback__note">Онлайн-подложка недоступна. Контур построен по загруженному GPX.</div></div>`;return}routeMapV9=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(routeMapV9);const line=L.polyline(ROUTE_V9_TRACK,{color:'#b88b3c',weight:4,opacity:.95,lineJoin:'round'}).addTo(routeMapV9);ROUTE_V9_POINTS.forEach((p,i)=>{const camp=p.id==='cp0'||p.id==='cpf',m=L.circleMarker([p.lat,p.lon],{radius:camp?7:5,color:'#171815',weight:2,fillColor:camp?'#c7a65a':'#f2eee5',fillOpacity:1}).addTo(routeMapV9);m.bindTooltip(`${p.id==='cp0'?'Старт':p.id==='cpf'?'Финиш':'КП '+i} · ${p.title}`,{direction:'top'});routeMarkersV9[p.id]=m});routeMapV9.fitBounds(line.getBounds(),{padding:[28,28]});}
function focusCpV9(id){const p=cpV9(id);if(!p)return;if(routeMapV9){routeMapV9.setView([p.lat,p.lon],15,{animate:true});routeMarkersV9[id]?.openTooltip();}document.querySelectorAll('[data-cp-v9]').forEach(x=>x.classList.toggle('active',x.dataset.cpV9===id));}
function materialRowsV9(){return S.materials.map(m=>`<div class="material"><div><b>${esc(m.title)}</b><small>${esc(m.type)}</small></div><div class="row-actions">${tag(m.status==='ready'?'готов':'источник',m.status==='ready'?'ok':'sand')}${m.action==='download'?`<a class="btn alt sm" href="${m.url}" download>Скачать</a>`:'<span class="source-note">исходный PDF</span>'}</div></div>`).join('')}
function cpRowsV9(){return ROUTE_V9_POINTS.map((p,i)=>{const num=p.id==='cp0'?'С':p.id==='cpf'?'Ф':String(i).padStart(2,'0');return `<button type="button" class="cp-row" data-cp-v9="${p.id}"><span class="cp-index">${num}</span><span class="cp-main"><b>${esc(p.title)}</b><small>${p.fromPrev!=null?`от предыдущей ${String(p.fromPrev).replace('.',',')} км · `:''}${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</small></span><span class="cp-km">${String(p.km).replace('.',',')} км</span><span class="cp-time">${esc(p.arrival)}${p.stop?`<small>${esc(p.stop)}</small>`:''}</span></button>`}).join('')}
function navRowsV9(){return ROUTE_V9_LEGS.map((l,i)=>{const a=cpV9(l.from),b=cpV9(l.to);return `<button type="button" class="nav-leg" data-cp-v9="${l.to}"><span class="leg-num">${String(i+1).padStart(2,'0')}</span><span><b>${esc(a.title)} → ${esc(b.title)}</b><small>${esc(l.guide)}</small></span><span class="leg-data"><b>${String(l.distance).replace('.',',')} км</b><small>${String(l.bearing).padStart(3,'0')}°</small></span></button>`}).join('')}
routeName=function(id){return cpV9(id)?.title||S.routeSteps.find(s=>s.id===id)?.title||'—'};
routePage=function(){const body=routeModeV9==='points'?section('Контрольные точки',`<div class="cp-head"><span>КП</span><span>Точка</span><span>Км</span><span>Время</span></div><div class="cp-list">${cpRowsV9()}</div>`,'Координаты WGS84 и время взяты из полевого атласа.'):routeModeV9==='navigation'?section('Азимуты и ориентиры',`<div class="navigation-note"><strong>Приоритет на местности</strong><p>Тропа, ЛЭП, ЖД и кромка поля важнее «идеального» азимута. Азимут используется как контроль направления, а не как повод идти напролом.</p></div><div class="nav-leg-list">${navRowsV9()}</div>`,'18 переходов между соседними точками маршрута.'):section('Полевой атлас',`<div class="atlas-source"><div class="atlas-source__number">14</div><div><b>Полевой атлас Томинского лесопарка</b><p>2 обзорные карты, 8 секторных листов, 2 детальных листа, маршрутный план и шпаргалка по азимутам. Данные из атласа уже перенесены в КП, навигацию и план.</p></div></div><div class="materials-list">${materialRowsV9()}</div>`,'Полный PDF остаётся исходным документом; GPX и KML опубликованы для загрузки.');return `${pageHead('Навигация','Маршрут','Реальный маршрут из загруженного полевого атласа, GPX и KML. География хранится отдельно от организационного плана.')}<div class="route-layout"><div class="route-map"><div id="routeMapInteractive" class="leaflet-map"><div class="map-fallback">${mapSvgV9()}</div></div></div><aside class="route-summary"><div class="metric"><small>Дистанция</small><strong>21,3 км</strong><em>по полевому атласу</em></div><div class="metric"><small>План</small><strong>10:00–19:00</strong><em>9 часов на маршрут</em></div><div class="metric"><small>Контрольные точки</small><strong>17 КП</strong><em>+ лагерь / старт / финиш</em></div><div class="metric"><small>Остановки</small><strong>5</strong><em>115 минут</em></div>${section('Материалы',materialRowsV9())}</aside></div><div class="segmented route-tabs"><button class="${routeModeV9==='points'?'active':''}" data-route-v9="points">КП</button><button class="${routeModeV9==='navigation'?'active':''}" data-route-v9="navigation">Навигация</button><button class="${routeModeV9==='atlas'?'active':''}" data-route-v9="atlas">Атлас</button></div>${body}`;};
planPage=function(){return `${pageHead('Организация дня','План','Контрольные времена перенесены из маршрутного плана. Организационные этапы можно корректировать отдельно.',`<button class="btn sand" id="addTimeline">Добавить этап</button>`)}<div class="summary-strip plan-summary"><div class="metric"><small>Старт</small><strong>10:00</strong><em>лагерь</em></div><div class="metric"><small>Финиш</small><strong>19:00</strong><em>плановый</em></div><div class="metric"><small>Дистанция</small><strong>21,3 км</strong><em>по атласу</em></div><div class="metric"><small>Остановки</small><strong>5</strong><em>115 минут</em></div><div class="metric"><small>Контроль</small><strong>17 КП</strong><em>по маршруту</em></div></div>${section('Маршрутный план',`<div class="timeline-head"><span>Время</span><span>Этап</span><span>Км</span><span>Маршрут</span><span></span></div>${S.timeline.map(t=>{const p=cpV9(t.route);return `<div class="timeline-row"><div class="timeline-time">${esc(t.time)}</div><div><b>${esc(t.title)}</b><small>${esc(t.note||'')}${p?.stop?` · ${esc(p.stop)}`:''}</small></div><div>${p?String(p.km).replace('.',',')+' км':'—'}</div><div>${t.route?esc(routeName(t.route)):'—'}</div><div class="row-actions"><button class="icon-btn" data-edit-time="${t.id}">✎</button><button class="icon-btn" data-del-time="${t.id}">×</button></div></div>`}).join('')}`,'Контрольные времена и остановки взяты из полевого атласа.')}${section('Учебные задачи',`<div class="learning-grid"><div class="learning"><strong>Ориентирование</strong><p>Сверка маршрута, линейных ориентиров и контрольных точек.</p></div><div class="learning"><strong>Радиосвязь</strong><p>Проверка основного и резервного канала перед маршрутом.</p></div><div class="learning"><strong>Контроль группы</strong><p>Сверка состава на старте, ключевых остановках и финише.</p></div></div>`,'Навигационные подсказки находятся в «Маршрут → Навигация».')}`;};
const bindV8=bind;bind=function(){bindV8();document.querySelectorAll('[data-route-v9]').forEach(b=>b.onclick=()=>{routeModeV9=b.dataset.routeV9;render()});document.querySelectorAll('[data-cp-v9]').forEach(b=>b.onclick=()=>focusCpV9(b.dataset.cpV9));if(tab==='route')requestAnimationFrame(mountRouteMapV9);};
function updateStaticRouteLabels(){const ev=document.querySelector('.event-switcher__button strong');if(ev)ev.textContent='Томинский лесопарк';const top=document.querySelector('.topbar__event strong');if(top)top.textContent='Томинский лесопарк · полевой маршрут';const build=document.querySelector('.build-label');if(build)build.textContent='V3 · маршрут подключён';}
applyRouteV9();updateStaticRouteLabels();const resetV9=document.getElementById('reset');resetV9.onclick=()=>{if(confirm('Сбросить все изменения демо-версии?')){S=seed();applyRouteV9(true);save();tab='overview';gearMode='personal';dir='there';routeModeV9='points';render();toast('Демо сброшено')}};render();


;/* source: hikes-preview/route-v10.js */
const ROUTE_V10_VERSION=4;
const ROUTE_V10_TRACK=[[55.575948,37.957684],[55.574959,37.95491],[55.574074,37.953563],[55.572979,37.954049],[55.57246,37.953892],[55.572607,37.949596],[55.572845,37.949768],[55.572808,37.949198],[55.572903,37.949024],[55.574423,37.94904],[55.574872,37.948571],[55.575479,37.947641],[55.576525,37.945271],[55.5772,37.944739],[55.577805,37.94358],[55.579095,37.943146],[55.580424,37.94351],[55.581265,37.943544],[55.582322,37.942374],[55.582887,37.941299],[55.583913,37.93936],[55.584418,37.937919],[55.584504,37.936545],[55.584201,37.931469],[55.585737,37.929486],[55.58661,37.929462],[55.586927,37.930032],[55.587255,37.929331],[55.587252,37.928988],[55.586953,37.927968],[55.58698,37.927453],[55.586781,37.92683],[55.587067,37.926251],[55.587161,37.925857],[55.587099,37.92625],[55.587454,37.926126],[55.588173,37.927021],[55.588558,37.926611],[55.589147,37.927395],[55.589406,37.927445],[55.589629,37.927039],[55.589683,37.925781],[55.590956,37.923347],[55.591201,37.921856],[55.592261,37.920913],[55.593047,37.918645],[55.593465,37.918082],[55.593982,37.917954],[55.594988,37.918327],[55.596647,37.919539],[55.598609,37.921943],[55.599485,37.922262],[55.599815,37.923053],[55.600885,37.923424],[55.60195,37.926823],[55.603064,37.928565],[55.604122,37.929005],[55.603878,37.936655],[55.604957,37.938054],[55.60641,37.937701],[55.605603,37.93798],[55.605195,37.939362],[55.605073,37.940279],[55.604881,37.940455],[55.603815,37.940655],[55.60336,37.940325],[55.603081,37.93965],[55.602736,37.939313],[55.599988,37.939444],[55.59995,37.938759],[55.588617,37.940033],[55.588099,37.940962],[55.587267,37.941898],[55.586469,37.943177],[55.585943,37.945933],[55.5855,37.950133],[55.58605,37.950843],[55.587614,37.952172],[55.59382,37.951777],[55.594779,37.950495],[55.595905,37.949722],[55.596705,37.948729],[55.597969,37.949095],[55.59894,37.949127],[55.601615,37.948027],[55.602652,37.948284],[55.603585,37.947745],[55.603648,37.947458],[55.603128,37.945451],[55.603498,37.945177],[55.60379,37.945283],[55.604264,37.94767],[55.60517,37.947703],[55.608399,37.943332],[55.610416,37.940936],[55.612462,37.941113],[55.61366,37.945819],[55.612149,37.946945],[55.611425,37.949249],[55.612107,37.953344],[55.608304,37.957908],[55.606982,37.95908],[55.606078,37.959333],[55.604511,37.961317],[55.604184,37.960983],[55.603983,37.960131],[55.603335,37.960034],[55.603079,37.960327],[55.602525,37.95977],[55.602072,37.95984],[55.601883,37.960359],[55.601545,37.962425],[55.600995,37.962439],[55.600522,37.963823],[55.596966,37.96384],[55.585372,37.963978],[55.584984,37.966067],[55.585306,37.969658],[55.585047,37.973321],[55.585553,37.975764],[55.584811,37.979782],[55.583342,37.981935],[55.582698,37.982238],[55.582733,37.981837],[55.582302,37.981392],[55.581987,37.978601],[55.582109,37.9702],[55.582486,37.965163],[55.582436,37.964183],[55.581984,37.963234],[55.581201,37.962398],[55.579454,37.962388],[55.577932,37.962143],[55.577792,37.96089],[55.577009,37.960054],[55.576478,37.958583],[55.575948,37.957684]];
let routeMapV10=null,routeMarkersV10={};
function applyRouteV10(){if(S.routeVersion===ROUTE_V10_VERSION)return;S.routeVersion=ROUTE_V10_VERSION;S.event={...S.event,title:'Томинский лесопарк · полевой маршрут',short:'Томинский лесопарк',type:'Поход-тренировка',status:'Подготовка',meeting:'09:00 · Лагерь',start:'10:00',finish:'19:00',distance:'21,3 км',duration:'9 часов',cpCount:17};S.materials=[{id:'m1',title:'Полевой атлас · финальная редакция',type:'PDF · источник маршрута',status:'source',action:'source'},{id:'m2',title:'Ruler GPX',type:'Предварительный трек · справочно',status:'draft',url:'./route.gpx',action:'download'},{id:'m3',title:'Ruler KML',type:'Предварительный трек · справочно',status:'draft',url:'./route.kml',action:'download'}];save();}
function mapSvgV10(){const W=700,H=390,pad=28,lats=ROUTE_V10_TRACK.map(p=>p[0]),lons=ROUTE_V10_TRACK.map(p=>p[1]),minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons),project=([lat,lon])=>[pad+(lon-minLon)/(maxLon-minLon)*(W-pad*2),pad+(maxLat-lat)/(maxLat-minLat)*(H-pad*2)],pts=ROUTE_V10_TRACK.map(p=>project(p).map(v=>v.toFixed(1)).join(',')).join(' '),marks=ROUTE_V9_POINTS.filter(p=>p.id!=='cpf').map((p,i)=>{const [x,y]=project([p.lat,p.lon]),lab=p.id==='cp0'?'Л':String(i);return `<g class="cp-mark-v10"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.id==='cp0'?7:5}"/><text x="${(x+8).toFixed(1)}" y="${(y-7).toFixed(1)}">${lab}</text></g>`}).join('');return `<svg class="map-svg map-svg-v10" viewBox="0 0 ${W} ${H}" role="img" aria-label="Финальная линия маршрута по полевому атласу"><rect width="100%" height="100%" fill="#eef0e7"/><g class="map-grid-v10"><path d="M0 78H700M0 156H700M0 234H700M0 312H700M140 0V390M280 0V390M420 0V390M560 0V390"/></g><polyline class="route-halo-v10" points="${pts}"/><polyline class="route-line-v10" points="${pts}"/>${marks}</svg>`;}
mapSvg=mapSvgV10;
const overviewV10Base=overview;overview=function(){return overviewV10Base().replace('GPX · реальный контур','Финальный маршрут · по PDF').replace('Полевой маршрут 21,3 км через ЖД, ЛЭП, каменоломню, карстовую пещеру, памятник лётчикам и восточную петлю.','Финальный маршрут 21,3 км по отредактированному полевому атласу. Предварительный GPX больше не используется для линии на карте.');};
function mountRouteMapV10(){const el=document.getElementById('routeMapFinal');if(!el)return;if(routeMapV10){try{routeMapV10.remove()}catch(e){}routeMapV10=null;routeMarkersV10={}}if(!window.L){el.innerHTML=`<div class="map-fallback-v10">${mapSvgV10()}<div class="map-fallback__note">Онлайн-карта недоступна. Показана финальная линия, восстановленная из полевого PDF.</div></div>`;return}routeMapV10=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:100,minZoom:12,maxZoom:18});routeMapV10.getContainer().style.background='#e9eee4';const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors',crossOrigin:true});tiles.addTo(routeMapV10);const line=L.polyline(ROUTE_V10_TRACK,{color:'#6c22c7',weight:4,opacity:.96,lineJoin:'round',lineCap:'round',smoothFactor:.25}).addTo(routeMapV10);ROUTE_V9_POINTS.forEach((p,i)=>{const camp=p.id==='cp0'||p.id==='cpf',m=L.circleMarker([p.lat,p.lon],{radius:camp?7:5,color:'#fff',weight:2,fillColor:camp?'#2f7a50':'#6c22c7',fillOpacity:1}).addTo(routeMapV10);m.bindTooltip(`${p.id==='cp0'?'Старт':p.id==='cpf'?'Финиш':'КП '+i} · ${p.title}`,{direction:'top'});routeMarkersV10[p.id]=m});const bounds=line.getBounds();routeMapV10.fitBounds(bounds,{padding:[34,34],animate:false});const Fit=L.Control.extend({onAdd:function(){const b=L.DomUtil.create('button','leaflet-bar fit-route-v10');b.type='button';b.title='Показать весь маршрут';b.innerHTML='⌂';L.DomEvent.disableClickPropagation(b);L.DomEvent.on(b,'click',()=>routeMapV10.fitBounds(bounds,{padding:[34,34],animate:true}));return b}});new Fit({position:'topleft'}).addTo(routeMapV10);setTimeout(()=>routeMapV10&&routeMapV10.invalidateSize(false),150);}
function focusCpV10(id){const p=cpV9(id);if(!p)return;if(routeMapV10){routeMapV10.setView([p.lat,p.lon],15,{animate:true});routeMarkersV10[id]?.openTooltip()}document.querySelectorAll('[data-cp-v9]').forEach(x=>x.classList.toggle('active',x.dataset.cpV9===id));}
function materialRowsV10(){return S.materials.map(m=>`<div class="material"><div><b>${esc(m.title)}</b><small>${esc(m.type)}</small></div><div class="row-actions">${m.action==='download'?`${tag('черновой','warn')}<a class="btn alt sm" href="${m.url}" download>Скачать</a>`:`${tag('эталон','sand')}<span class="source-note">данные перенесены</span>`}</div></div>`).join('')}
routePage=function(){const body=routeModeV9==='points'?section('Контрольные точки',`<div class="cp-head"><span>КП</span><span>Точка</span><span>Км</span><span>Время</span></div><div class="cp-list">${cpRowsV9()}</div>`,'Координаты WGS84 и контрольные времена взяты из финального полевого атласа.'):routeModeV9==='navigation'?section('Азимуты и ориентиры',`<div class="navigation-note"><strong>Приоритет на местности</strong><p>Тропа, ЛЭП, ЖД и кромка поля важнее «идеального» азимута. Азимут используется как контроль направления, а не как повод идти напролом.</p></div><div class="nav-leg-list">${navRowsV9()}</div>`,'18 переходов из маршрутной шпаргалки финального атласа.'):section('Полевой атлас',`<div class="atlas-source"><div class="atlas-source__number">14</div><div><b>Финальный маршрут зафиксирован в PDF</b><p>Отредактированная линия атласа считается эталоном. GPX/KML были предварительными рабочими файлами и местами расходятся с реальными тропами, поэтому для отрисовки маршрута больше не используются.</p></div></div><div class="materials-list">${materialRowsV10()}</div>`,'Контрольные точки, времена, азимуты и геометрия линии сведены по финальной редакции.');return `${pageHead('Навигация','Маршрут','Линия восстановлена по финальной обзорной схеме PDF, а не по предварительному GPX.')}<div class="route-layout route-layout-v10"><div class="route-map"><div class="route-map-head-v10"><div><small>Финальная схема</small><strong>Томинский лесопарк · 21,3 км</strong></div><span>PDF → карта</span></div><div id="routeMapFinal" class="leaflet-map leaflet-map-v10">${mapSvgV10()}</div><div class="route-map-foot-v10"><span>Колесо — масштаб</span><span>⌂ — весь маршрут</span><span>Клик по КП — перейти к точке</span></div></div><aside class="route-summary"><div class="metric"><small>Дистанция</small><strong>21,3 км</strong><em>по полевому атласу</em></div><div class="metric"><small>План</small><strong>10:00–19:00</strong><em>9 часов</em></div><div class="metric"><small>Контрольные точки</small><strong>17 КП</strong><em>+ лагерь</em></div><div class="metric"><small>Источник линии</small><strong>PDF</strong><em>финальная редакция</em></div>${section('Материалы',materialRowsV10())}</aside></div><div class="segmented route-tabs"><button class="${routeModeV9==='points'?'active':''}" data-route-v9="points">КП</button><button class="${routeModeV9==='navigation'?'active':''}" data-route-v9="navigation">Навигация</button><button class="${routeModeV9==='atlas'?'active':''}" data-route-v9="atlas">Атлас</button></div>${body}`;};
const bindBeforeV10=bind;bind=function(){bindBeforeV10();document.querySelectorAll('[data-cp-v9]').forEach(b=>b.onclick=()=>focusCpV10(b.dataset.cpV9));if(tab==='route')requestAnimationFrame(mountRouteMapV10);};
applyRouteV10();const buildV10=document.querySelector('.build-label');if(buildV10)buildV10.textContent='V4 · финальный маршрут по PDF';render();


;/* source: hikes-preview/route-v11.js */
/* V5: no duplicated SVG under Leaflet; switch OSM/satellite without flashing */
let routeBaseV11='osm',routeMapV11=null,routeLayerV11=null,routeMarkersV11={},overviewMapV11=null,overviewLayerV11=null,overviewBaseV11='osm';
function tileSpecV11(kind){return kind==='sat'?{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',opts:{maxZoom:19,attribution:'Tiles © Esri',keepBuffer:4,updateWhenZooming:false}}:{url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',opts:{maxZoom:19,attribution:'© OpenStreetMap contributors',keepBuffer:4,updateWhenZooming:false}}}
function makeTileV11(kind){const s=tileSpecV11(kind);return L.tileLayer(s.url,s.opts)}
function setLoadingV11(container,on){container?.querySelector('.route-loading-v11')?.classList.toggle('show',!!on)}
function replaceBaseV11(map,container,kind,isOverview=false){if(!map||!window.L)return;const current=isOverview?overviewLayerV11:routeLayerV11;const currentKind=isOverview?overviewBaseV11:routeBaseV11;if(current&&currentKind===kind)return;const next=makeTileV11(kind);setLoadingV11(container,true);next.addTo(map);next.once('load',()=>{if(current&&map.hasLayer(current))map.removeLayer(current);setLoadingV11(container,false)});setTimeout(()=>{if(current&&map.hasLayer(current))map.removeLayer(current);setLoadingV11(container,false)},2200);if(isOverview){overviewLayerV11=next;overviewBaseV11=kind}else{routeLayerV11=next;routeBaseV11=kind}}
function fitRouteV11(map,animate=false){if(!map)return;const b=L.latLngBounds(ROUTE_V10_TRACK.map(p=>[p[0],p[1]]));map.fitBounds(b,{padding:[34,34],animate})}
function mountRouteMapV11(){const el=document.getElementById('routeMapFinal');if(!el)return;if(routeMapV11){try{routeMapV11.remove()}catch(e){}routeMapV11=null;routeLayerV11=null;routeMarkersV11={}}if(!window.L){el.innerHTML=`<div class="map-fallback-v11">${mapSvgV10()}<small>Онлайн-подложка недоступна. Показан финальный маршрут по PDF.</small></div>`;return}el.innerHTML='';routeMapV11=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:110,minZoom:12,maxZoom:18,fadeAnimation:false,markerZoomAnimation:false});routeMapV11.getContainer().style.background='#eef0e7';routeLayerV11=makeTileV11(routeBaseV11).addTo(routeMapV11);const line=L.polyline(ROUTE_V10_TRACK,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.15,interactive:false}).addTo(routeMapV11);ROUTE_V9_POINTS.forEach((p,i)=>{const camp=p.id==='cp0'||p.id==='cpf',m=L.circleMarker([p.lat,p.lon],{radius:camp?7:5,color:'#fff',weight:2,fillColor:camp?'#2f7a50':'#6c22c7',fillOpacity:1}).addTo(routeMapV11);m.bindTooltip(`${p.id==='cp0'?'Старт':p.id==='cpf'?'Финиш':'КП '+i} · ${p.title}`,{direction:'top'});routeMarkersV11[p.id]=m});fitRouteV11(routeMapV11,false);const Fit=L.Control.extend({onAdd:function(){const b=L.DomUtil.create('button','leaflet-bar fit-route-v11');b.type='button';b.title='Показать весь маршрут';b.innerHTML='⌂';L.DomEvent.disableClickPropagation(b);L.DomEvent.on(b,'click',()=>fitRouteV11(routeMapV11,true));return b}});new Fit({position:'topleft'}).addTo(routeMapV11);setTimeout(()=>routeMapV11&&routeMapV11.invalidateSize(false),120);document.querySelectorAll('[data-map-layer-v11]').forEach(b=>b.classList.toggle('active',b.dataset.mapLayerV11===routeBaseV11))}
mountRouteMapV10=mountRouteMapV11;
focusCpV10=function(id){const p=cpV9(id);if(!p)return;if(routeMapV11){routeMapV11.setView([p.lat,p.lon],15,{animate:true});routeMarkersV11[id]?.openTooltip()}document.querySelectorAll('[data-cp-v9]').forEach(x=>x.classList.toggle('active',x.dataset.cpV9===id));};
function overviewMapMarkupV11(){return `<div class="overview-map-v11" id="overviewMapV11"><div class="overview-map-switch-v11"><button type="button" data-overview-layer-v11="osm" class="${overviewBaseV11==='osm'?'active':''}">Карта</button><button type="button" data-overview-layer-v11="sat" class="${overviewBaseV11==='sat'?'active':''}">Спутник</button></div><div class="route-loading-v11">Загрузка подложки…</div></div>`}
mapSvg=overviewMapMarkupV11;
function mountOverviewMapV11(){const el=document.getElementById('overviewMapV11');if(!el||!window.L)return;if(overviewMapV11){try{overviewMapV11.remove()}catch(e){}overviewMapV11=null;overviewLayerV11=null}overviewMapV11=L.map(el,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false,zoomAnimation:false,fadeAnimation:false});overviewLayerV11=makeTileV11(overviewBaseV11).addTo(overviewMapV11);L.polyline(ROUTE_V10_TRACK,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.15,interactive:false}).addTo(overviewMapV11);ROUTE_V9_POINTS.filter(p=>['cp0','cp4','cp7','cp11','cp16'].includes(p.id)).forEach(p=>L.circleMarker([p.lat,p.lon],{radius:p.id==='cp0'?6:4,color:'#fff',weight:2,fillColor:p.id==='cp0'?'#2f7a50':'#6c22c7',fillOpacity:1,interactive:false}).addTo(overviewMapV11));fitRouteV11(overviewMapV11,false);setTimeout(()=>overviewMapV11&&overviewMapV11.invalidateSize(false),100)}
routePage=function(){const body=routeModeV9==='points'?section('Контрольные точки',`<div class="cp-head"><span>КП</span><span>Точка</span><span>Км</span><span>Время</span></div><div class="cp-list">${cpRowsV9()}</div>`,'Координаты WGS84 и контрольные времена взяты из финального полевого атласа.'):routeModeV9==='navigation'?section('Азимуты и ориентиры',`<div class="navigation-note"><strong>Приоритет на местности</strong><p>Тропа, ЛЭП, ЖД и кромка поля важнее «идеального» азимута. Азимут используется как контроль направления, а не как повод идти напролом.</p></div><div class="nav-leg-list">${navRowsV9()}</div>`,'18 переходов из маршрутной шпаргалки финального атласа.'):section('Полевой атлас',`<div class="atlas-source"><div class="atlas-source__number">2</div><div><b>Два вида подложки</b><p>Финальный PDF содержит обзор на спутниковой подложке и обзор на OSM. В интерактивной карте сверху можно переключаться между «Карта» и «Спутник» без изменения самой линии маршрута.</p></div></div><div class="materials-list">${materialRowsV10()}</div>`,'PDF остаётся источником финальной геометрии; GPX/KML — только справочные черновики.');return `${pageHead('Навигация','Маршрут','Финальная линия из PDF поверх переключаемой картографической подложки.')}<div class="route-source-banner-v11"><strong>Источник маршрута:</strong> отредактированный PDF-атлас. Переключатель меняет только фон карты; линия и КП остаются теми же.</div><div class="route-layout route-layout-v10"><div class="route-map"><div class="route-map-head-v11"><div><small>Финальная схема</small><strong>Томинский лесопарк · 21,3 км</strong></div><div class="map-layer-switch-v11"><button type="button" data-map-layer-v11="osm" class="${routeBaseV11==='osm'?'active':''}">Карта</button><button type="button" data-map-layer-v11="sat" class="${routeBaseV11==='sat'?'active':''}">Спутник</button></div></div><div class="map-shell-v11"><div id="routeMapFinal" class="leaflet-map leaflet-map-v11"></div><div class="route-loading-v11">Загрузка подложки…</div><div class="route-legend-v11"><span><i></i> маршрут по PDF</span><span><b></b> контрольная точка</span></div></div><div class="route-map-foot-v11"><span>Колесо — масштаб</span><span>⌂ — весь маршрут</span><span>Клик по КП в списке — перейти к точке</span></div></div><aside class="route-summary"><div class="metric"><small>Дистанция</small><strong>21,3 км</strong><em>по полевому атласу</em></div><div class="metric"><small>План</small><strong>10:00–19:00</strong><em>9 часов</em></div><div class="metric"><small>Контрольные точки</small><strong>17 КП</strong><em>+ лагерь</em></div><div class="metric"><small>Подложка</small><strong>${routeBaseV11==='sat'?'Спутник':'OSM'}</strong><em>переключается</em></div>${section('Материалы',materialRowsV10())}</aside></div><div class="segmented route-tabs"><button class="${routeModeV9==='points'?'active':''}" data-route-v9="points">КП</button><button class="${routeModeV9==='navigation'?'active':''}" data-route-v9="navigation">Навигация</button><button class="${routeModeV9==='atlas'?'active':''}" data-route-v9="atlas">Атлас</button></div>${body}`;};
const bindV11Base=bind;bind=function(){bindV11Base();document.querySelectorAll('[data-map-layer-v11]').forEach(b=>b.onclick=()=>{const kind=b.dataset.mapLayerV11;if(kind===routeBaseV11)return;replaceBaseV11(routeMapV11,document.querySelector('.map-shell-v11'),kind,false);document.querySelectorAll('[data-map-layer-v11]').forEach(x=>x.classList.toggle('active',x.dataset.mapLayerV11===kind))});document.querySelectorAll('[data-overview-layer-v11]').forEach(b=>b.onclick=e=>{e.stopPropagation();const kind=b.dataset.overviewLayerV11;if(kind===overviewBaseV11)return;replaceBaseV11(overviewMapV11,document.getElementById('overviewMapV11'),kind,true);document.querySelectorAll('[data-overview-layer-v11]').forEach(x=>x.classList.toggle('active',x.dataset.overviewLayerV11===kind))});if(tab==='overview')requestAnimationFrame(mountOverviewMapV11)};
const buildV11=document.querySelector('.build-label');if(buildV11)buildV11.textContent='V5 · карта / спутник · PDF маршрут';render();


;/* source: hikes-preview/route-v12.js */
/* V6: fixed 200×200 m atlas coordinate grid. Alignment georeferenced from the final PDF overview. */
const GRID_V12={west:37.91483760804149,east:37.98471584355467,north:55.61919863946426,south:55.57065633379166,cols:22,rows:['А','Б','В','Г','Д','Е','Ж','З','И','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Э','Ю']};
const MERC_R_V12=6378137;
const mercXV12=lon=>MERC_R_V12*lon*Math.PI/180;
const mercYV12=lat=>MERC_R_V12*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
const lonFromXV12=x=>x/MERC_R_V12*180/Math.PI;
const latFromYV12=y=>(2*Math.atan(Math.exp(y/MERC_R_V12))-Math.PI/2)*180/Math.PI;
const GRID_X0_V12=mercXV12(GRID_V12.west),GRID_X1_V12=mercXV12(GRID_V12.east),GRID_Y0_V12=mercYV12(GRID_V12.south),GRID_Y1_V12=mercYV12(GRID_V12.north);
const GRID_DX_V12=(GRID_X1_V12-GRID_X0_V12)/GRID_V12.cols,GRID_DY_V12=(GRID_Y1_V12-GRID_Y0_V12)/GRID_V12.rows.length;
let gridEnabledV12=true,gridLayerV12=null,gridSelectedV12=null;
function gridCellV12(lat,lon){const x=mercXV12(lon),y=mercYV12(lat),col=Math.floor((x-GRID_X0_V12)/GRID_DX_V12),row=Math.floor((GRID_Y1_V12-y)/GRID_DY_V12);if(col<0||col>=GRID_V12.cols||row<0||row>=GRID_V12.rows.length)return null;return {row,col,code:`${GRID_V12.rows[row]}${String(col+1).padStart(2,'0')}`}}
function gridCodeV12(lat,lon){return gridCellV12(lat,lon)?.code||'—'}
function cellBoundsV12(row,col){const x0=GRID_X0_V12+col*GRID_DX_V12,x1=x0+GRID_DX_V12,y1=GRID_Y1_V12-row*GRID_DY_V12,y0=y1-GRID_DY_V12;return [[latFromYV12(y0),lonFromXV12(x0)],[latFromYV12(y1),lonFromXV12(x1)]]}
function cellCenterV12(row,col){const b=cellBoundsV12(row,col);return [(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2]}
function atlasBoundsV12(){return L.latLngBounds([[GRID_V12.south,GRID_V12.west],[GRID_V12.north,GRID_V12.east]])}
function gridLabelIconV12(text,row=false){return L.divIcon({className:'',html:`<div class="grid-label-v12 ${row?'grid-label-row-v12':''}">${text}</div>`,iconSize:[row?18:22,16],iconAnchor:[row?9:11,8]})}
function buildGridV12(map){if(!map||!window.L)return null;if(!map.getPane('gridPaneV12')){const p=map.createPane('gridPaneV12');p.style.zIndex='390';p.style.pointerEvents='none'}const group=L.layerGroup();const lineStyle={pane:'gridPaneV12',color:'#4d5250',weight:.7,opacity:.5,interactive:false};for(let c=0;c<=GRID_V12.cols;c++){const x=GRID_X0_V12+c*GRID_DX_V12,lon=lonFromXV12(x);L.polyline([[GRID_V12.south,lon],[GRID_V12.north,lon]],lineStyle).addTo(group)}for(let r=0;r<=GRID_V12.rows.length;r++){const y=GRID_Y1_V12-r*GRID_DY_V12,lat=latFromYV12(y);L.polyline([[lat,GRID_V12.west],[lat,GRID_V12.east]],lineStyle).addTo(group)}for(let c=0;c<GRID_V12.cols;c++){const x=GRID_X0_V12+(c+.5)*GRID_DX_V12,y=GRID_Y1_V12-.16*GRID_DY_V12;L.marker([latFromYV12(y),lonFromXV12(x)],{icon:gridLabelIconV12(String(c+1).padStart(2,'0')),interactive:false,keyboard:false}).addTo(group)}for(let r=0;r<GRID_V12.rows.length;r++){const x=GRID_X0_V12+.18*GRID_DX_V12,y=GRID_Y1_V12-(r+.5)*GRID_DY_V12;L.marker([latFromYV12(y),lonFromXV12(x)],{icon:gridLabelIconV12(GRID_V12.rows[r],true),interactive:false,keyboard:false}).addTo(group)}return group}
function setGridV12(on){gridEnabledV12=!!on;if(!routeMapV11)return;if(gridLayerV12&&routeMapV11.hasLayer(gridLayerV12))routeMapV11.removeLayer(gridLayerV12);if(gridSelectedV12&&routeMapV11.hasLayer(gridSelectedV12))routeMapV11.removeLayer(gridSelectedV12);gridSelectedV12=null;if(gridEnabledV12){gridLayerV12=buildGridV12(routeMapV11);gridLayerV12.addTo(routeMapV11)}document.querySelectorAll('[data-grid-toggle-v12]').forEach(b=>b.classList.toggle('active',gridEnabledV12));const s=document.getElementById('gridStatusV12');if(s)s.textContent=gridEnabledV12?'Сетка 200×200 м включена':'Сетка выключена'}
function handleGridClickV12(e){if(!gridEnabledV12||!routeMapV11)return;const cell=gridCellV12(e.latlng.lat,e.latlng.lng);if(!cell)return;if(gridSelectedV12&&routeMapV11.hasLayer(gridSelectedV12))routeMapV11.removeLayer(gridSelectedV12);gridSelectedV12=L.rectangle(cellBoundsV12(cell.row,cell.col),{className:'grid-selected-v12',color:'#9d7e38',weight:2,fillColor:'#c7a65a',fillOpacity:.16,interactive:false}).addTo(routeMapV11);const center=cellCenterV12(cell.row,cell.col),html=`<div class="grid-popup-v12"><strong>${cell.code}</strong><small>Квадрат 200 × 200 м</small><small>Центр: ${center[0].toFixed(6)}, ${center[1].toFixed(6)}</small><button type="button" data-copy-grid-v12="${cell.code}">Скопировать ${cell.code}</button></div>`;L.popup({closeButton:true,autoPan:true}).setLatLng(e.latlng).setContent(html).openOn(routeMapV11);const s=document.getElementById('gridStatusV12');if(s)s.textContent=`Выбран квадрат ${cell.code}`}
function cpRowsV12(){return ROUTE_V9_POINTS.map((p,i)=>{const idx=p.id==='cp0'?'С':p.id==='cpf'?'Ф':String(i),code=gridCodeV12(p.lat,p.lon);return `<button class="cp-row" data-cp-v9="${p.id}" type="button"><span class="cp-index">${idx}</span><span class="cp-main"><b>${esc(p.title)}</b><small><span class="grid-code-v12">${code}</span>${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</small></span><span class="cp-km">${String(p.km).replace('.',',')} км</span><span class="cp-time">${p.arrival}<small>${esc(p.stop||'')}</small></span></button>`}).join('')}
cpRowsV9=cpRowsV12;
function mountRouteMapV12(){const el=document.getElementById('routeMapFinal');if(!el)return;if(routeMapV11){try{routeMapV11.remove()}catch(e){}routeMapV11=null;routeLayerV11=null;routeMarkersV11={}}gridLayerV12=null;gridSelectedV12=null;if(!window.L){el.innerHTML=`<div class="map-fallback-v11">${mapSvgV10()}<small>Онлайн-подложка недоступна. Сетка доступна при загрузке карты.</small></div>`;return}el.innerHTML='';routeMapV11=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:110,minZoom:12,maxZoom:18,fadeAnimation:false,markerZoomAnimation:false});routeMapV11.getContainer().style.background='#eef0e7';routeLayerV11=makeTileV11(routeBaseV11).addTo(routeMapV11);L.polyline(ROUTE_V10_TRACK,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.15,interactive:false}).addTo(routeMapV11);ROUTE_V9_POINTS.forEach((p,i)=>{const camp=p.id==='cp0'||p.id==='cpf',code=gridCodeV12(p.lat,p.lon),m=L.circleMarker([p.lat,p.lon],{radius:camp?7:5,color:'#fff',weight:2,fillColor:camp?'#2f7a50':'#6c22c7',fillOpacity:1}).addTo(routeMapV11);m.bindTooltip(`${p.id==='cp0'?'Старт':p.id==='cpf'?'Финиш':'КП '+i} · ${p.title} · ${code}`,{direction:'top'});routeMarkersV11[p.id]=m});if(gridEnabledV12){gridLayerV12=buildGridV12(routeMapV11);gridLayerV12.addTo(routeMapV11);routeMapV11.fitBounds(atlasBoundsV12(),{padding:[22,22],animate:false})}else fitRouteV11(routeMapV11,false);const Fit=L.Control.extend({onAdd:function(){const b=L.DomUtil.create('button','leaflet-bar fit-route-v11');b.type='button';b.title=gridEnabledV12?'Показать всю сетку атласа':'Показать весь маршрут';b.innerHTML='⌂';L.DomEvent.disableClickPropagation(b);L.DomEvent.on(b,'click',()=>gridEnabledV12?routeMapV11.fitBounds(atlasBoundsV12(),{padding:[22,22],animate:true}):fitRouteV11(routeMapV11,true));return b}});new Fit({position:'topleft'}).addTo(routeMapV11);routeMapV11.on('click',handleGridClickV12);routeMapV11.on('popupopen',ev=>{const btn=ev.popup.getElement()?.querySelector('[data-copy-grid-v12]');if(btn)btn.onclick=()=>{const code=btn.dataset.copyGridV12;navigator.clipboard?.writeText(code);toast(`Скопировано: ${code}`)}});setTimeout(()=>routeMapV11&&routeMapV11.invalidateSize(false),120);document.querySelectorAll('[data-map-layer-v11]').forEach(b=>b.classList.toggle('active',b.dataset.mapLayerV11===routeBaseV11));document.querySelectorAll('[data-grid-toggle-v12]').forEach(b=>b.classList.toggle('active',gridEnabledV12))}
mountRouteMapV10=mountRouteMapV12;
routePage=function(){const body=routeModeV9==='points'?section('Контрольные точки',`<div class="cp-head"><span>КП</span><span>Точка</span><span>Км</span><span>Время</span></div><div class="cp-list">${cpRowsV9()}</div>`,'К каждому КП добавлен квадрат той же координатной сетки, что используется в PDF-атласе.'):routeModeV9==='navigation'?section('Азимуты и ориентиры',`<div class="navigation-note"><strong>Приоритет на местности</strong><p>Тропа, ЛЭП, ЖД и кромка поля важнее «идеального» азимута. Азимут используется как контроль направления, а не как повод идти напролом.</p></div><div class="nav-leg-list">${navRowsV9()}</div>`,'18 переходов из маршрутной шпаргалки финального атласа.'):section('Полевой атлас',`<div class="atlas-source"><div class="atlas-source__number">200</div><div><b>Координатная сетка 200 × 200 м</b><p>Колонки 01–22. Строки: А, Б, В, Г, Д, Е, Ж, З, И, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Э, Ю. Код квадрата формируется как буква + номер, например Т04.</p><p class="grid-note-v12">Сетка географически закреплена и совпадает между OSM, спутником и обзорными листами PDF.</p></div></div><div class="materials-list">${materialRowsV10()}</div>`,'Листы атласа используют одну и ту же сетку; при изменении масштаба код квадрата не меняется.');return `${pageHead('Навигация','Маршрут','Финальная линия из PDF, контрольные точки и полевая сетка 200 × 200 м.')}<div class="route-source-banner-v12"><strong>Координатная привязка:</strong> сетка перенесена с обзорного листа PDF: 22 колонки × 27 строк, размер клетки 200 × 200 м. Нажми на квадрат карты, чтобы получить его код.</div><div class="route-layout route-layout-v10"><div class="route-map"><div class="route-map-head-v11"><div><small>Финальная схема</small><strong>Томинский лесопарк · 21,3 км</strong></div><div class="map-controls-v12"><div class="map-layer-switch-v11"><button type="button" data-map-layer-v11="osm" class="${routeBaseV11==='osm'?'active':''}">Карта</button><button type="button" data-map-layer-v11="sat" class="${routeBaseV11==='sat'?'active':''}">Спутник</button></div><button type="button" class="grid-toggle-v12 ${gridEnabledV12?'active':''}" data-grid-toggle-v12>Сетка 200 м</button></div></div><div class="map-shell-v11"><div id="routeMapFinal" class="leaflet-map leaflet-map-v11"></div><div class="route-loading-v11">Загрузка подложки…</div><div class="route-legend-v11"><span><i></i> маршрут по PDF</span><span><b></b> контрольная точка</span><span class="grid-legend-v12"><i></i> сетка 200 м</span></div></div><div class="route-map-foot-v11"><span>Колесо — масштаб</span><span>⌂ — вся сетка / маршрут</span><span id="gridStatusV12">${gridEnabledV12?'Сетка 200×200 м включена':'Сетка выключена'}</span></div></div><aside class="route-summary"><div class="metric"><small>Дистанция</small><strong>21,3 км</strong><em>по полевому атласу</em></div><div class="metric"><small>Координатная сетка</small><strong>200 × 200 м</strong><em>22 × 27 ячеек</em></div><div class="metric"><small>Контрольные точки</small><strong>17 КП</strong><em>каждая с кодом квадрата</em></div><div class="metric"><small>Подложка</small><strong>${routeBaseV11==='sat'?'Спутник':'OSM'}</strong><em>переключается</em></div>${section('Материалы',materialRowsV10())}</aside></div><div class="segmented route-tabs"><button class="${routeModeV9==='points'?'active':''}" data-route-v9="points">КП</button><button class="${routeModeV9==='navigation'?'active':''}" data-route-v9="navigation">Навигация</button><button class="${routeModeV9==='atlas'?'active':''}" data-route-v9="atlas">Атлас</button></div>${body}`;};
const bindV12Base=bind;bind=function(){bindV12Base();document.querySelectorAll('[data-grid-toggle-v12]').forEach(b=>b.onclick=()=>setGridV12(!gridEnabledV12));};
const buildV12=document.querySelector('.build-label');if(buildV12)buildV12.textContent='V6 · сетка 200×200 · PDF маршрут';render();


;/* source: hikes-preview/route-v13-1.js */
/* V7 — editable route, dynamic CP metrics, editable grid, trail routing and print-atlas export */
const EDITOR_V13_KEY='rl_hike_route_editor_v13';
const EDITOR_V13_VERSION=1;
const TERRAIN_V13={
  unknown:{label:'Не задан',speed:4.0,color:'#6c22c7'},
  road:{label:'Дорога',speed:4.8,color:'#4f5961'},
  trail:{label:'Тропа',speed:4.2,color:'#7b35c9'},
  clearing:{label:'Просека',speed:4.0,color:'#b18432'},
  forest:{label:'Лес / без тропы',speed:3.0,color:'#4f7654'}
};
const CYR_ROWS_V13=['А','Б','В','Г','Д','Е','Ж','З','И','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Э','Ю'];
const BASE_ROUTE_RAW_M_V13=(()=>{let n=0;for(let i=0;i<ROUTE_V10_TRACK.length-1;i++)n+=havV13(ROUTE_V10_TRACK[i],ROUTE_V10_TRACK[i+1]);return n})();
const DISTANCE_CAL_V13=21300/BASE_ROUTE_RAW_M_V13;
let editorV13=loadEditorV13();
let editorModeV13=false,editorToolV13='route',selectedV13=null,undoV13=[],redoV13=[];
let routeLineV13=null,routeSegLayersV13=[],routeVertexLayersV13=[],cpLayersV13={},dynamicGridLayerV13=null,dynamicGridSelectedV13=null;
let lastBrouterPendingV13=false;

function cloneV13(v){return JSON.parse(JSON.stringify(v))}
function defaultEditorV13(){
  return {
    version:EDITOR_V13_VERSION,
    route:ROUTE_V10_TRACK.map(p=>[+p[0],+p[1]]),
    cps:ROUTE_V9_POINTS.map((p,i)=>({id:p.id||`cp${i}`,title:p.title||`КП ${i}`,lat:+p.lat,lon:+p.lon,stopMin:stopMinV13(p.stop),locked:p.id==='cp0'||p.id==='cpf'})),
    terrain:{},
    grid:{cell:200,offsetX:0,offsetY:0},
    speeds:{road:4.8,trail:4.2,clearing:4.0,forest:3.0,unknown:4.0},
    start:S.event.start||'10:00',snapCps:true
  };
}
function loadEditorV13(){try{const raw=localStorage.getItem(EDITOR_V13_KEY),x=raw?JSON.parse(raw):null;if(!x||x.version!==EDITOR_V13_VERSION||!Array.isArray(x.route)||x.route.length<2)return defaultEditorV13();const d=defaultEditorV13();return {...d,...x,grid:{...d.grid,...(x.grid||{})},speeds:{...d.speeds,...(x.speeds||{})}}}catch(e){return defaultEditorV13()}}
function saveEditorV13(){try{localStorage.setItem(EDITOR_V13_KEY,JSON.stringify(editorV13))}catch(e){} syncEventV13()}
function syncEventV13(){try{S.event.distance=`${(routeLenV13()/1000).toFixed(1).replace('.',',')} км`;S.event.start=editorV13.start;S.event.finish=finalEtaV13();S.event.duration=fmtDurationV13(routeDurationMinV13());save()}catch(e){}}
function pushHistoryV13(){undoV13.push(cloneV13(editorV13));if(undoV13.length>40)undoV13.shift();redoV13=[]}
function undoEditorV13(){if(!undoV13.length)return;redoV13.push(cloneV13(editorV13));editorV13=undoV13.pop();saveEditorV13();selectedV13=null;render();toast('Отменено')}
function redoEditorV13(){if(!redoV13.length)return;undoV13.push(cloneV13(editorV13));editorV13=redoV13.pop();saveEditorV13();selectedV13=null;render();toast('Повторено')}
function resetEditorV13(){pushHistoryV13();editorV13=defaultEditorV13();saveEditorV13();selectedV13=null;render();toast('Маршрут и сетка возвращены к PDF-версии')}

function havV13(a,b){const R=6371008.8,p1=a[0]*Math.PI/180,p2=b[0]*Math.PI/180,dp=(b[0]-a[0])*Math.PI/180,dl=(b[1]-a[1])*Math.PI/180,s=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(s))}
function rawRouteLenV13(){let n=0;for(let i=0;i<editorV13.route.length-1;i++)n+=havV13(editorV13.route[i],editorV13.route[i+1]);return n}
function routeLenV13(){return rawRouteLenV13()*DISTANCE_CAL_V13}
function routeCumV13(){const out=[0];for(let i=0;i<editorV13.route.length-1;i++)out.push(out[out.length-1]+havV13(editorV13.route[i],editorV13.route[i+1])*DISTANCE_CAL_V13);return out}
function pxyV13(lat,lon){return [mercXV12(lon),mercYV12(lat)]}
function llV13(x,y){return [latFromYV12(y),lonFromXV12(x)]}
function nearestRouteV13(lat,lon){const p=pxyV13(lat,lon),cum=routeCumV13();let best=null;for(let i=0;i<editorV13.route.length-1;i++){const a=pxyV13(editorV13.route[i][0],editorV13.route[i][1]),b=pxyV13(editorV13.route[i+1][0],editorV13.route[i+1][1]),vx=b[0]-a[0],vy=b[1]-a[1],wx=p[0]-a[0],wy=p[1]-a[1],den=vx*vx+vy*vy,t=den?Math.max(0,Math.min(1,(wx*vx+wy*vy)/den)):0,x=a[0]+t*vx,y=a[1]+t*vy,d=Math.hypot(p[0]-x,p[1]-y);if(!best||d<best.d){const ll=llV13(x,y),segM=havV13(editorV13.route[i],editorV13.route[i+1])*DISTANCE_CAL_V13;best={seg:i,t,d,lat:ll[0],lon:ll[1],along:cum[i]+t*segM}}}return best}
function stopMinV13(v){const m=String(v||'').match(/(\d+)\s*мин/i);if(m)return +m[1];const h=String(v||'').match(/(\d+)\s*час/i);return h?+h[1]*60:0}
function terrainSpeedV13(i){const t=editorV13.terrain[i]||'unknown';return Math.max(.5,+editorV13.speeds[t]||TERRAIN_V13[t]?.speed||4)}
function routeTravelMinToV13(m){let left=m,min=0;for(let i=0;i<editorV13.route.length-1&&left>0;i++){const seg=havV13(editorV13.route[i],editorV13.route[i+1])*DISTANCE_CAL_V13,use=Math.min(left,seg);min+=(use/1000)/terrainSpeedV13(i)*60;left-=use}return min}
function parseClockV13(s){const m=String(s||'10:00').match(/(\d{1,2}):(\d{2})/);return m?(+m[1]*60 + +m[2]):600}
function fmtClockV13(min){min=Math.round(min)%1440;if(min<0)min+=1440;return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`}
function bearingV13(a,b){const p1=a[0]*Math.PI/180,p2=b[0]*Math.PI/180,dl=(b[1]-a[1])*Math.PI/180,y=Math.sin(dl)*Math.cos(p2),x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);return (Math.atan2(y,x)*180/Math.PI+360)%360}
function dynamicCpsV13(){
  const arr=editorV13.cps.map(cp=>{const n=nearestRouteV13(cp.lat,cp.lon);return {...cp,near:n,along:n?.along||0}});
  const start=arr.find(c=>c.id==='cp0'),finish=arr.find(c=>c.id==='cpf'),middle=arr.filter(c=>c.id!=='cp0'&&c.id!=='cpf').sort((a,b)=>a.along-b.along);
  let stops=0;const startMin=parseClockV13(editorV13.start);const out=[];
  if(start)out.push({...start,number:'С',km:0,arrival:fmtClockV13(startMin)});
  middle.forEach((cp,i)=>{const eta=startMin+routeTravelMinToV13(cp.along)+stops;out.push({...cp,number:String(i+1),km:cp.along/1000,arrival:fmtClockV13(eta)});stops+=cp.stopMin||0});
  const total=routeLenV13(),finishEta=startMin+routeTravelMinToV13(total)+stops;
  if(finish)out.push({...finish,number:'Ф',km:total/1000,arrival:fmtClockV13(finishEta)});
  return out;
}
function finalEtaV13(){const cps=dynamicCpsV13();return cps[cps.length-1]?.arrival||'—'}
function routeDurationMinV13(){const start=parseClockV13(editorV13.start),end=parseClockV13(finalEtaV13());return end>=start?end-start:end+1440-start}
function fmtDurationV13(min){const h=Math.floor(min/60),m=Math.round(min%60);return `${h} ч ${m?`${m} мин`:''}`.trim()}


;/* source: hikes-preview/route-v13-2.js */
function gridCfgV13(){const cell=Math.max(50,Math.min(1000,+editorV13.grid.cell||200)),scale=cell/200,dx=GRID_DX_V12*scale,dy=GRID_DY_V12*scale,ox=(+editorV13.grid.offsetX||0)*(GRID_DX_V12/200),oy=(+editorV13.grid.offsetY||0)*(GRID_DY_V12/200),x0=GRID_X0_V12+ox,y1=GRID_Y1_V12+oy;return {cell,dx,dy,x0,y1}}
function rowCodeV13(i){const base=CYR_ROWS_V13.length;let n=i,s='';do{s=CYR_ROWS_V13[n%base]+s;n=Math.floor(n/base)-1}while(n>=0);return s}
function gridCellDynamicV13(lat,lon){const g=gridCfgV13(),x=mercXV12(lon),y=mercYV12(lat),col=Math.floor((x-g.x0)/g.dx),row=Math.floor((g.y1-y)/g.dy);if(col<0||row<0)return null;return {row,col,code:`${rowCodeV13(row)}${String(col+1).padStart(2,'0')}`}}
function gridCodeDynamicV13(lat,lon){return gridCellDynamicV13(lat,lon)?.code||'—'}
function gridBoundsDynamicV13(row,col){const g=gridCfgV13(),x0=g.x0+col*g.dx,x1=x0+g.dx,y1=g.y1-row*g.dy,y0=y1-g.dy;return [[latFromYV12(y0),lonFromXV12(x0)],[latFromYV12(y1),lonFromXV12(x1)]]}
function buildGridDynamicV13(map){if(!map||!window.L)return null;if(!map.getPane('gridPaneV13')){const p=map.createPane('gridPaneV13');p.style.zIndex='390';p.style.pointerEvents='none'}const g=gridCfgV13(),group=L.layerGroup(),atlasX0=GRID_X0_V12,atlasX1=GRID_X1_V12,atlasY0=GRID_Y0_V12,atlasY1=GRID_Y1_V12,line={pane:'gridPaneV13',color:'#454b49',weight:.7,opacity:.55,interactive:false};const cMin=Math.floor((atlasX0-g.x0)/g.dx)-1,cMax=Math.ceil((atlasX1-g.x0)/g.dx)+1,rMin=Math.floor((g.y1-atlasY1)/g.dy)-1,rMax=Math.ceil((g.y1-atlasY0)/g.dy)+1;
  for(let c=cMin;c<=cMax;c++){if(c<0)continue;const lon=lonFromXV12(g.x0+c*g.dx);L.polyline([[GRID_V12.south,lon],[GRID_V12.north,lon]],line).addTo(group)}
  for(let r=rMin;r<=rMax;r++){if(r<0)continue;const lat=latFromYV12(g.y1-r*g.dy);L.polyline([[lat,GRID_V12.west],[lat,GRID_V12.east]],line).addTo(group)}
  if(map.getZoom()>=13){for(let c=Math.max(0,cMin);c<cMax;c++){const x=g.x0+(c+.5)*g.dx;if(x<atlasX0||x>atlasX1)continue;L.marker([latFromYV12(atlasY1-.12*g.dy),lonFromXV12(x)],{icon:gridLabelIconV12(String(c+1).padStart(2,'0')),interactive:false,keyboard:false}).addTo(group)}for(let r=Math.max(0,rMin);r<rMax;r++){const y=g.y1-(r+.5)*g.dy;if(y<atlasY0||y>atlasY1)continue;L.marker([latFromYV12(y),lonFromXV12(atlasX0+.12*g.dx)],{icon:gridLabelIconV12(rowCodeV13(r),true),interactive:false,keyboard:false}).addTo(group)}}return group}
function refreshGridV13(){if(!routeMapV11)return;if(dynamicGridLayerV13&&routeMapV11.hasLayer(dynamicGridLayerV13))routeMapV11.removeLayer(dynamicGridLayerV13);if(dynamicGridSelectedV13&&routeMapV11.hasLayer(dynamicGridSelectedV13))routeMapV11.removeLayer(dynamicGridSelectedV13);dynamicGridSelectedV13=null;if(gridEnabledV12){dynamicGridLayerV13=buildGridDynamicV13(routeMapV11);dynamicGridLayerV13.addTo(routeMapV11)}updateGridStatusV13()}
function updateGridStatusV13(){const e=document.getElementById('gridStatusV12');if(e)e.textContent=gridEnabledV12?`Сетка ${gridCfgV13().cell}×${gridCfgV13().cell} м`:'Сетка выключена'}
function handleGridClickDynamicV13(e){if(!gridEnabledV12||editorModeV13&&editorToolV13!=='grid')return;const c=gridCellDynamicV13(e.latlng.lat,e.latlng.lng);if(!c)return;if(dynamicGridSelectedV13&&routeMapV11.hasLayer(dynamicGridSelectedV13))routeMapV11.removeLayer(dynamicGridSelectedV13);dynamicGridSelectedV13=L.rectangle(gridBoundsDynamicV13(c.row,c.col),{color:'#9d7e38',weight:2,fillColor:'#c7a65a',fillOpacity:.16,interactive:false}).addTo(routeMapV11);L.popup().setLatLng(e.latlng).setContent(`<div class="grid-popup-v12"><strong>${c.code}</strong><small>Квадрат ${gridCfgV13().cell} × ${gridCfgV13().cell} м</small><button type="button" data-copy-grid-v13="${c.code}">Скопировать ${c.code}</button></div>`).openOn(routeMapV11)}


;/* source: hikes-preview/route-v13-3.js */
function iconVertexV13(active=false){return L.divIcon({className:'',html:`<span class="route-vertex-v13 ${active?'active':''}"></span>`,iconSize:[12,12],iconAnchor:[6,6]})}
function iconCpV13(label,active=false){return L.divIcon({className:'',html:`<span class="route-cp-v13 ${active?'active':''}">${label}</span>`,iconSize:[26,26],iconAnchor:[13,13]})}
function clearEditLayersV13(){routeSegLayersV13.forEach(x=>routeMapV11?.removeLayer(x));routeVertexLayersV13.forEach(x=>routeMapV11?.removeLayer(x));Object.values(cpLayersV13).forEach(x=>routeMapV11?.removeLayer(x));routeSegLayersV13=[];routeVertexLayersV13=[];cpLayersV13={};if(routeLineV13&&routeMapV11?.hasLayer(routeLineV13))routeMapV11.removeLayer(routeLineV13);routeLineV13=null}
function routeColorV13(i){const t=editorV13.terrain[i]||'unknown';return TERRAIN_V13[t]?.color||TERRAIN_V13.unknown.color}
function drawRouteV13(){if(!routeMapV11)return;clearEditLayersV13();if(!editorModeV13){routeLineV13=L.polyline(editorV13.route,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.1,interactive:false}).addTo(routeMapV11)}else{
  for(let i=0;i<editorV13.route.length-1;i++){const seg=L.polyline([editorV13.route[i],editorV13.route[i+1]],{color:routeColorV13(i),weight:selectedV13?.type==='segment'&&selectedV13.index===i?8:5,opacity:.95,interactive:true,bubblingMouseEvents:false}).addTo(routeMapV11);seg.on('click',e=>{L.DomEvent.stopPropagation(e);if(editorToolV13==='route'){selectedV13={type:'segment',index:i};render()}});routeSegLayersV13.push(seg)}
  if(editorToolV13==='route'){const z=routeMapV11.getZoom();const step=z>=16?1:z>=15?2:4;editorV13.route.forEach((p,i)=>{if(i!==0&&i!==editorV13.route.length-1&&i%step!==0&&selectedV13?.index!==i)return;const m=L.marker(p,{icon:iconVertexV13(selectedV13?.type==='vertex'&&selectedV13.index===i),draggable:true,zIndexOffset:500}).addTo(routeMapV11);m.on('dragstart',()=>pushHistoryV13());m.on('drag',ev=>{const ll=ev.target.getLatLng();editorV13.route[i]=[ll.lat,ll.lng];redrawRouteOnlyV13()});m.on('dragend',()=>{saveEditorV13();if(editorV13.snapCps)snapAllCpsV13();selectedV13={type:'vertex',index:i};render()});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);selectedV13={type:'vertex',index:i};render()});routeVertexLayersV13.push(m)})}
 }
 const cps=dynamicCpsV13();cps.forEach(cp=>{const label=cp.number==='С'?'С':cp.number==='Ф'?'Ф':cp.number,m=L.marker([cp.lat,cp.lon],{icon:iconCpV13(label,selectedV13?.type==='cp'&&selectedV13.id===cp.id),draggable:editorModeV13,zIndexOffset:800}).addTo(routeMapV11);m.bindTooltip(`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title} · ${gridCodeDynamicV13(cp.lat,cp.lon)}`,{direction:'top'});if(editorModeV13){m.on('dragstart',()=>pushHistoryV13());m.on('dragend',ev=>{const ll=ev.target.getLatLng(),obj=editorV13.cps.find(x=>x.id===cp.id);if(obj){if(editorV13.snapCps){const n=nearestRouteV13(ll.lat,ll.lng);obj.lat=n.lat;obj.lon=n.lon}else{obj.lat=ll.lat;obj.lon=ll.lng}saveEditorV13();selectedV13={type:'cp',id:cp.id};render()}});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);selectedV13={type:'cp',id:cp.id};render()})}cpLayersV13[cp.id]=m})
}
function redrawRouteOnlyV13(){if(!routeMapV11)return;routeSegLayersV13.forEach((seg,i)=>seg.setLatLngs([editorV13.route[i],editorV13.route[i+1]]));Object.values(cpLayersV13).forEach((m)=>{});}
function snapAllCpsV13(){editorV13.cps.forEach(cp=>{if(cp.id==='cp0'||cp.id==='cpf')return;const n=nearestRouteV13(cp.lat,cp.lon);if(n){cp.lat=n.lat;cp.lon=n.lon}});const s=editorV13.cps.find(x=>x.id==='cp0'),f=editorV13.cps.find(x=>x.id==='cpf');if(s){s.lat=editorV13.route[0][0];s.lon=editorV13.route[0][1]}if(f){f.lat=editorV13.route[editorV13.route.length-1][0];f.lon=editorV13.route[editorV13.route.length-1][1]}saveEditorV13()}
function insertRoutePointV13(lat,lon){const n=nearestRouteV13(lat,lon);if(!n)return;pushHistoryV13();editorV13.route.splice(n.seg+1,0,[lat,lon]);const next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const i=+k;next[i>n.seg?i+1:i]=v});next[n.seg+1]=next[n.seg]||'unknown';editorV13.terrain=next;if(editorV13.snapCps)snapAllCpsV13();saveEditorV13();selectedV13={type:'vertex',index:n.seg+1};render();toast('Узел маршрута добавлен')}
function deleteVertexV13(i){if(i<=0||i>=editorV13.route.length-1){toast('Старт и финиш удалять нельзя');return}pushHistoryV13();editorV13.route.splice(i,1);const next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const n=+k;if(n===i) return;next[n>i?n-1:n]=v});editorV13.terrain=next;if(editorV13.snapCps)snapAllCpsV13();saveEditorV13();selectedV13=null;render();toast('Узел удалён')}
function addCpV13(lat,lon){pushHistoryV13();let p={lat,lon};if(editorV13.snapCps){const n=nearestRouteV13(lat,lon);p={lat:n.lat,lon:n.lon}}const id='u'+Date.now();editorV13.cps.push({id,title:'Новая контрольная точка',lat:p.lat,lon:p.lon,stopMin:0,locked:false});saveEditorV13();selectedV13={type:'cp',id};editorToolV13='route';render();toast('КП добавлена — задай название')}
function deleteCpV13(id){const cp=editorV13.cps.find(x=>x.id===id);if(!cp||cp.locked){toast('Старт / финиш удалять нельзя');return}pushHistoryV13();editorV13.cps=editorV13.cps.filter(x=>x.id!==id);saveEditorV13();selectedV13=null;render();toast('КП удалена')}
function updateCpV13(id,patch){const cp=editorV13.cps.find(x=>x.id===id);if(!cp)return;pushHistoryV13();Object.assign(cp,patch);saveEditorV13();render();toast('КП обновлена')}
function setTerrainV13(i,type){pushHistoryV13();editorV13.terrain[i]=type;saveEditorV13();render();toast(`Участок: ${TERRAIN_V13[type]?.label||type}`)}
async function routeSegmentBrouterV13(i){if(lastBrouterPendingV13)return;const a=editorV13.route[i],b=editorV13.route[i+1];if(!a||!b)return;lastBrouterPendingV13=true;toast('Строю участок по тропам OSM…');try{const u=`https://brouter.de/brouter?lonlats=${a[1]},${a[0]}%7C${b[1]},${b[0]}&profile=trekking&alternativeidx=0&format=geojson`,r=await fetch(u);if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json(),coords=j?.features?.[0]?.geometry?.coordinates||j?.geometry?.coordinates;if(!Array.isArray(coords)||coords.length<2)throw new Error('Нет геометрии');pushHistoryV13();const repl=coords.map(c=>[+c[1],+c[0]]);editorV13.route.splice(i,2,...repl);const delta=repl.length-2,next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const n=+k;if(n<i)next[n]=v;else if(n>i)next[n+delta]=v});for(let n=i;n<i+repl.length-1;n++)next[n]='trail';editorV13.terrain=next;if(editorV13.snapCps)snapAllCpsV13();saveEditorV13();selectedV13={type:'segment',index:i};render();toast('Участок проложен по тропам. Если не подходит — Отменить.')}catch(e){toast('Не удалось построить по тропам. Оставил ручную геометрию.')}finally{lastBrouterPendingV13=false}}

function terrainSummaryV13(fromM,toM){const cum=routeCumV13(),counts={};for(let i=0;i<editorV13.route.length-1;i++){const a=cum[i],b=cum[i+1];if(b<fromM||a>toM)continue;const t=editorV13.terrain[i]||'unknown',m=Math.max(0,Math.min(b,toM)-Math.max(a,fromM));counts[t]=(counts[t]||0)+m}const keys=Object.entries(counts).sort((a,b)=>b[1]-a[1]);return keys.length?keys.slice(0,2).map(([t])=>TERRAIN_V13[t].label).join(' + '):'—'}
function dynamicNavRowsV13(){const cps=dynamicCpsV13();return cps.slice(0,-1).map((a,i)=>{const b=cps[i+1],dist=Math.max(0,b.km-a.km),az=Math.round(bearingV13([a.lat,a.lon],[b.lat,b.lon])),terr=terrainSummaryV13(a.km*1000,b.km*1000);return `<button class="nav-leg" type="button" data-cp-dyn-v13="${b.id}"><span class="leg-num">${String(i+1).padStart(2,'0')}</span><span><b>${esc(a.title)} → ${esc(b.title)}</b><small>${esc(terr)}</small></span><span class="leg-data"><b>${dist.toFixed(1).replace('.',',')} км</b><small>${az}°</small></span></button>`}).join('')}
function cpRowsDynamicV13(){return dynamicCpsV13().map(cp=>`<button class="cp-row" data-cp-dyn-v13="${cp.id}" type="button"><span class="cp-index">${cp.number}</span><span class="cp-main"><b>${esc(cp.title)}</b><small><span class="grid-code-v12">${gridCodeDynamicV13(cp.lat,cp.lon)}</span>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</small></span><span class="cp-km">${cp.km.toFixed(1).replace('.',',')} км</span><span class="cp-time">${cp.arrival}<small>${cp.stopMin?`стоп ${cp.stopMin} мин`:''}</small></span></button>`).join('')}


;/* source: hikes-preview/route-v13-4.js */
function editorPanelV13(){
  if(!editorModeV13)return `<div class="metric"><small>Расчётная длина</small><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong><em>автопересчёт</em></div><div class="metric"><small>Расчётный финиш</small><strong>${finalEtaV13()}</strong><em>${fmtDurationV13(routeDurationMinV13())}</em></div><div class="metric"><small>КП</small><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong><em>можно редактировать</em></div><div class="metric"><small>Сетка</small><strong>${gridCfgV13().cell} × ${gridCfgV13().cell} м</strong><em>${editorV13.grid.offsetX||editorV13.grid.offsetY?'со смещением':'по PDF'}</em></div>`;
  let sel='';
  if(selectedV13?.type==='vertex'){const i=selectedV13.index,p=editorV13.route[i];sel=`<div class="editor-card-v13"><small>Узел маршрута · ${i+1}/${editorV13.route.length}</small><strong>${p[0].toFixed(6)}, ${p[1].toFixed(6)}</strong><p>Перетащи точку на карте или удали её.</p><button class="btn alt sm" data-delete-vertex-v13="${i}" ${i===0||i===editorV13.route.length-1?'disabled':''}>Удалить узел</button></div>`}
  else if(selectedV13?.type==='segment'){const i=selectedV13.index,t=editorV13.terrain[i]||'unknown',a=editorV13.route[i],b=editorV13.route[i+1];sel=`<div class="editor-card-v13"><small>Участок ${i+1}</small><strong>${(havV13(a,b)*DISTANCE_CAL_V13/1000).toFixed(2).replace('.',',')} км</strong><label>Тип движения<select data-terrain-v13="${i}">${Object.entries(TERRAIN_V13).map(([k,v])=>`<option value="${k}" ${k===t?'selected':''}>${v.label}</option>`).join('')}</select></label><div class="editor-inline-v13"><button class="btn sand sm" data-brouter-v13="${i}">Проложить по тропам OSM</button></div><p>Маршрутизация — подсказка. Если тропы в OSM нет или результат плохой, используй ручные узлы и «Отменить».</p></div>`}
  else if(selectedV13?.type==='cp'){const cp=editorV13.cps.find(x=>x.id===selectedV13.id),dyn=dynamicCpsV13().find(x=>x.id===selectedV13.id);if(cp)sel=`<div class="editor-card-v13"><small>${dyn?.number==='С'?'Старт':dyn?.number==='Ф'?'Финиш':`КП ${dyn?.number||''}`} · ${gridCodeDynamicV13(cp.lat,cp.lon)}</small><label>Название<input data-cp-title-v13="${cp.id}" value="${esc(cp.title)}"></label><label>Остановка, мин<input type="number" min="0" max="240" data-cp-stop-v13="${cp.id}" value="${cp.stopMin||0}"></label><div class="editor-inline-v13"><button class="btn sand sm" data-save-cp-v13="${cp.id}">Сохранить</button><button class="btn alt sm" data-delete-cp-v13="${cp.id}" ${cp.locked?'disabled':''}>Удалить</button></div><p>${dyn?`${dyn.km.toFixed(1).replace('.',',')} км · ETA ${dyn.arrival}`:''}</p></div>`}
  else if(editorToolV13==='grid'){const g=editorV13.grid;sel=`<div class="editor-card-v13"><small>Координатная сетка</small><label>Размер клетки<select id="gridCellV13">${[100,200,250,500].map(v=>`<option value="${v}" ${+g.cell===v?'selected':''}>${v} × ${v} м</option>`).join('')}<option value="custom" ${![100,200,250,500].includes(+g.cell)?'selected':''}>Свой размер</option></select></label><label>Свой размер, м<input id="gridCustomV13" type="number" min="50" max="1000" step="10" value="${+g.cell||200}"></label><div class="editor-grid2-v13"><label>Смещение X, м<input id="gridOffsetXV13" type="number" step="10" value="${+g.offsetX||0}"></label><label>Смещение Y, м<input id="gridOffsetYV13" type="number" step="10" value="${+g.offsetY||0}"></label></div><div class="editor-inline-v13"><button class="btn sand sm" id="applyGridV13">Применить</button><button class="btn alt sm" id="resetGridV13">Вернуть PDF 200 м</button></div><p>Изменение размера или смещения меняет коды квадратов. Исходная привязка PDF всегда доступна через сброс.</p></div>`}
  return `<div class="editor-summary-v13"><div class="editor-stat-v13"><span>Длина</span><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong></div><div class="editor-stat-v13"><span>Финиш</span><strong>${finalEtaV13()}</strong></div><div class="editor-stat-v13"><span>КП</span><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong></div></div>${sel||`<div class="editor-empty-v13"><strong>${editorToolV13==='route'?'Редактор маршрута':editorToolV13==='cp'?'Добавление КП':'Редактор сетки'}</strong><p>${editorToolV13==='route'?'Кликни по участку или узлу. Клик по карте добавит узел маршрута.':editorToolV13==='cp'?'Кликни по карте — новая КП будет привязана к ближайшему участку маршрута.':'Настрой размер и смещение сетки справа.'}</p></div>`}`
}
function editorToolbarV13(){return `<div class="editor-toolbar-v13"><button class="btn ${editorModeV13?'sand':'alt'}" id="toggleEditorV13">${editorModeV13?'Завершить редактирование':'Редактировать маршрут'}</button>${editorModeV13?`<div class="editor-tools-v13"><button class="editor-tool-v13 ${editorToolV13==='route'?'active':''}" data-editor-tool-v13="route">Маршрут</button><button class="editor-tool-v13 ${editorToolV13==='cp'?'active':''}" data-editor-tool-v13="cp">+ КП</button><button class="editor-tool-v13 ${editorToolV13==='grid'?'active':''}" data-editor-tool-v13="grid">Сетка</button></div><button class="icon-btn" id="undoV13" ${undoV13.length?'':'disabled'} title="Отменить">↶</button><button class="icon-btn" id="redoV13" ${redoV13.length?'':'disabled'} title="Повторить">↷</button>`:''}${editorModeV13?`<button class="btn alt" id="resetRouteV13">Вернуть PDF</button>`:''}<button class="btn alt" id="downloadGpxV13">GPX</button><button class="btn alt" id="exportAtlasV13">PDF / печать</button></div>`}

function mountRouteMapV13(){const el=document.getElementById('routeMapFinal');if(!el)return;if(routeMapV11){try{routeMapV11.remove()}catch(e){}routeMapV11=null;routeLayerV11=null;routeMarkersV11={}}dynamicGridLayerV13=null;dynamicGridSelectedV13=null;if(!window.L){el.innerHTML=`<div class="map-fallback-v11">${mapSvgV10()}<small>Онлайн-карта недоступна.</small></div>`;return}el.innerHTML='';routeMapV11=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:110,minZoom:12,maxZoom:19,fadeAnimation:false,markerZoomAnimation:false});routeLayerV11=makeTileV11(routeBaseV11).addTo(routeMapV11);if(gridEnabledV12){dynamicGridLayerV13=buildGridDynamicV13(routeMapV11);dynamicGridLayerV13.addTo(routeMapV11)}drawRouteV13();fitRouteV11=function(map,animate=false){if(!map)return;map.fitBounds(L.latLngBounds(editorV13.route),{padding:[34,34],animate})};fitRouteV11(routeMapV11,false);const Fit=L.Control.extend({onAdd:function(){const b=L.DomUtil.create('button','leaflet-bar fit-route-v11');b.type='button';b.innerHTML='⌂';b.title='Показать весь маршрут';L.DomEvent.disableClickPropagation(b);L.DomEvent.on(b,'click',()=>fitRouteV11(routeMapV11,true));return b}});new Fit({position:'topleft'}).addTo(routeMapV11);
  routeMapV11.on('zoomend',()=>{if(editorModeV13&&editorToolV13==='route')drawRouteV13();if(gridEnabledV12)refreshGridV13()});
  routeMapV11.on('click',e=>{if(editorModeV13){if(editorToolV13==='cp')return addCpV13(e.latlng.lat,e.latlng.lng);if(editorToolV13==='route')return insertRoutePointV13(e.latlng.lat,e.latlng.lng);if(editorToolV13==='grid')return handleGridClickDynamicV13(e)}else handleGridClickDynamicV13(e)});
  routeMapV11.on('popupopen',ev=>{const btn=ev.popup.getElement()?.querySelector('[data-copy-grid-v13]');if(btn)btn.onclick=()=>{navigator.clipboard?.writeText(btn.dataset.copyGridV13);toast(`Скопировано: ${btn.dataset.copyGridV13}`)}});
  setTimeout(()=>routeMapV11&&routeMapV11.invalidateSize(false),100);updateGridStatusV13();
}
mountRouteMapV10=mountRouteMapV13;

function mountOverviewMapV13(){const el=document.getElementById('overviewMapV11');if(!el||!window.L)return;if(overviewMapV11){try{overviewMapV11.remove()}catch(e){}overviewMapV11=null;overviewLayerV11=null}overviewMapV11=L.map(el,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false,zoomAnimation:false,fadeAnimation:false});overviewLayerV11=makeTileV11(overviewBaseV11).addTo(overviewMapV11);L.polyline(editorV13.route,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.1,interactive:false}).addTo(overviewMapV11);const cps=dynamicCpsV13(),key=cps.filter((x,i)=>x.number==='С'||x.number==='Ф'||i===4||i===7||i===11||i===16);key.forEach(cp=>L.circleMarker([cp.lat,cp.lon],{radius:cp.number==='С'?6:4,color:'#fff',weight:2,fillColor:cp.number==='С'?'#2f7a50':'#6c22c7',fillOpacity:1,interactive:false}).addTo(overviewMapV11));overviewMapV11.fitBounds(L.latLngBounds(editorV13.route),{padding:[20,20],animate:false});setTimeout(()=>overviewMapV11&&overviewMapV11.invalidateSize(false),100)}
mountOverviewMapV11=mountOverviewMapV13;
function downloadEditedGpxV13(){const pts=editorV13.route.map(p=>`<trkpt lat="${p[0].toFixed(7)}" lon="${p[1].toFixed(7)}"></trkpt>`).join(''),xml=`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Разные люди — Походы" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Томинский лесопарк — отредактированный маршрут</name><trkseg>${pts}</trkseg></trk></gpx>`,blob=new Blob([xml],{type:'application/gpx+xml'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='tomilinsky-route-edited.gpx';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}

function routePageV13(){const body=routeModeV9==='points'?section('Контрольные точки',`<div class="cp-head"><span>КП</span><span>Точка</span><span>Км</span><span>ETA</span></div><div class="cp-list">${cpRowsDynamicV13()}</div>`,'Километраж и время пересчитываются из текущей геометрии маршрута.'):routeModeV9==='navigation'?section('Переходы и азимуты',`<div class="navigation-note"><strong>Автопересчёт</strong><p>Расстояние между КП считается вдоль маршрута, азимут — между самими контрольными точками. Тип движения задаётся по участкам в редакторе.</p></div><div class="nav-leg-list">${dynamicNavRowsV13()}</div>`,'После перемещения маршрута или КП значения обновляются автоматически.'):section('Полевой атлас и экспорт',`<div class="atlas-source"><div class="atlas-source__number">PDF</div><div><b>Маршрут → атлас</b><p>Кнопка «PDF / печать» формирует печатный атлас из текущего маршрута: обзор OSM, спутник, 8 секторных листов, таблица КП и навигационная шпаргалка.</p><p class="grid-note-v12">Это печатный HTML: в системном диалоге выбери «Сохранить как PDF» или принтер.</p></div></div><div class="materials-list">${materialRowsV10()}</div>`,'GPX/KML остаются справочными; источником текущего атласа становится редактор.');
  return `${pageHead('Навигация','Маршрут','Редактируй геометрию, КП и сетку прямо на карте. Длина, ETA, азимуты и печатный атлас пересчитываются автоматически.',editorToolbarV13())}<div class="route-source-banner-v11"><strong>${editorModeV13?'Режим редактирования':'Режим просмотра'}:</strong> ${editorModeV13?'маршрут сохраняется локально после каждого изменения. Используй ↶, если автопрокладка или ручная правка не подошла.':'нажми «Редактировать маршрут», чтобы двигать линию и контрольные точки.'}</div><div class="route-layout route-layout-v10 route-editor-layout-v13"><div class="route-map"><div class="route-map-head-v11"><div><small>${editorModeV13?'Редактор':'Финальная схема'}</small><strong>Томинский лесопарк · ${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong></div><div class="map-controls-v12"><div class="map-layer-switch-v11"><button type="button" data-map-layer-v11="osm" class="${routeBaseV11==='osm'?'active':''}">Карта</button><button type="button" data-map-layer-v11="sat" class="${routeBaseV11==='sat'?'active':''}">Спутник</button></div><button type="button" class="grid-toggle-v12 ${gridEnabledV12?'active':''}" data-grid-toggle-v12>Сетка ${gridCfgV13().cell} м</button></div></div><div class="map-shell-v11"><div id="routeMapFinal" class="leaflet-map leaflet-map-v11 ${editorModeV13?'editing-v13':''}"></div><div class="route-loading-v11">Загрузка подложки…</div><div class="route-legend-v13">${editorModeV13?Object.entries(TERRAIN_V13).map(([k,v])=>`<span><i style="background:${v.color}"></i>${v.label}</span>`).join(''):`<span><i style="background:#6c22c7"></i>маршрут</span>`}</div></div><div class="route-map-foot-v11"><span>Колесо — масштаб</span><span>⌂ — весь маршрут</span><span id="gridStatusV12">${gridEnabledV12?`Сетка ${gridCfgV13().cell}×${gridCfgV13().cell} м`:'Сетка выключена'}</span></div></div><aside class="route-summary route-editor-panel-v13">${editorPanelV13()}</aside></div><div class="segmented route-tabs"><button class="${routeModeV9==='points'?'active':''}" data-route-v9="points">КП</button><button class="${routeModeV9==='navigation'?'active':''}" data-route-v9="navigation">Навигация</button><button class="${routeModeV9==='atlas'?'active':''}" data-route-v9="atlas">Атлас</button></div>${body}`}
routePage=routePageV13;

function planPageV13(){const cps=dynamicCpsV13();return `${pageHead('Организация дня','План','Маршрутный таймлайн теперь рассчитывается из геометрии, типов участков и остановок.',`<button class="btn alt" id="openRouteEditorV13">Открыть редактор маршрута</button>`)}<div class="plan-auto-summary-v13"><div><small>Старт</small><strong>${editorV13.start}</strong></div><div><small>Финиш</small><strong>${finalEtaV13()}</strong></div><div><small>Длительность</small><strong>${fmtDurationV13(routeDurationMinV13())}</strong></div><div><small>Расстояние</small><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong></div></div>${section('Автоматический маршрутный план',`<div class="timeline-head"><span>Время</span><span>Точка</span><span>Км</span><span>Квадрат</span><span>Остановка</span></div>${cps.map(cp=>`<div class="timeline-row"><div class="timeline-time">${cp.arrival}</div><div><b>${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':`КП ${cp.number} · ${esc(cp.title)}`}</b><small>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</small></div><div>${cp.km.toFixed(1).replace('.',',')} км</div><div>${gridCodeDynamicV13(cp.lat,cp.lon)}</div><div>${cp.stopMin?`${cp.stopMin} мин`:'—'}</div></div>`).join('')}`,'Любая правка маршрута или КП автоматически меняет накопленный километраж и ETA.')}${section('Скоростные профили',`<div class="speed-grid-v13">${Object.entries(TERRAIN_V13).map(([k,v])=>`<label><span><i style="background:${v.color}"></i>${v.label}</span><input type="number" min="0.5" max="8" step="0.1" data-speed-v13="${k}" value="${+editorV13.speeds[k]||v.speed}"><em>км/ч</em></label>`).join('')}</div>`,'Скорость используется только для расчёта времени. Тип каждого участка задаётся в редакторе маршрута.')}`}
planPage=planPageV13;


;/* source: hikes-preview/route-v13-5.js */
function tileXYV13(lat,lon,z){const n=2**z,x=(lon+180)/360*n,latR=lat*Math.PI/180,y=(1-Math.asinh(Math.tan(latR))/Math.PI)/2*n;return [x,y]}
function printMapV13(bounds,kind,title){const z=13,nw=tileXYV13(bounds.north,bounds.west,z),se=tileXYV13(bounds.south,bounds.east,z),x0=Math.floor(nw[0]),x1=Math.floor(se[0]),y0=Math.floor(nw[1]),y1=Math.floor(se[1]),W=(x1-x0+1)*256,H=(y1-y0+1)*256,scale=Math.min(1000/W,600/H)*.94,px=(lat,lon)=>{const t=tileXYV13(lat,lon,z);return [(t[0]-x0)*256,(t[1]-y0)*256]},tileUrl=(x,y)=>kind==='sat'?`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`:`https://tile.openstreetmap.org/${z}/${x}/${y}.png`,tiles=[];for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)tiles.push(`<img src="${tileUrl(x,y)}" style="left:${(x-x0)*256}px;top:${(y-y0)*256}px">`);const routePts=editorV13.route.map(p=>px(p[0],p[1]).join(',')).join(' '),cps=dynamicCpsV13().map(cp=>{const [x,y]=px(cp.lat,cp.lon);return `<g><circle cx="${x}" cy="${y}" r="6"/><text x="${x+8}" y="${y-8}">${cp.number}</text></g>`}).join('');const g=gridCfgV13(),grid=[];const atlasX0=mercXV12(bounds.west),atlasX1=mercXV12(bounds.east),atlasY0=mercYV12(bounds.south),atlasY1=mercYV12(bounds.north),cMin=Math.floor((atlasX0-g.x0)/g.dx)-1,cMax=Math.ceil((atlasX1-g.x0)/g.dx)+1,rMin=Math.floor((g.y1-atlasY1)/g.dy)-1,rMax=Math.ceil((g.y1-atlasY0)/g.dy)+1;for(let c=Math.max(0,cMin);c<=cMax;c++){const lon=lonFromXV12(g.x0+c*g.dx),a=px(bounds.north,lon),b=px(bounds.south,lon);grid.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`)}for(let r=Math.max(0,rMin);r<=rMax;r++){const lat=latFromYV12(g.y1-r*g.dy),a=px(lat,bounds.west),b=px(lat,bounds.east);grid.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`)}return `<section class="atlas-page"><header><div><small>${kind==='sat'?'СПУТНИК':'КАРТА'}</small><h1>${title}</h1></div><b>${(routeLenV13()/1000).toFixed(1)} км · ${gridCfgV13().cell} м</b></header><div class="print-map" style="--mw:${W};--mh:${H}"><div class="tile-stage" style="width:${W}px;height:${H}px;--stage-scale:${scale}">${tiles.join('')}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g class="print-grid">${grid.join('')}</g><polyline class="print-route-halo" points="${routePts}"/><polyline class="print-route" points="${routePts}"/><g class="print-cps">${cps}</g></svg></div></div><footer>Разные люди · Томинский лесопарк · сформировано из редактора маршрута</footer></section>`}
function printSectorBoundsV13(){const west=GRID_V12.west,east=GRID_V12.east,north=GRID_V12.north,south=GRID_V12.south,dx=(east-west)/4,dy=(north-south)/2,out=[];for(let r=0;r<2;r++)for(let c=0;c<4;c++)out.push({west:west+c*dx,east:west+(c+1)*dx,north:north-r*dy,south:north-(r+1)*dy});return out}
function openAtlasPrintV13(){const w=window.open('','_blank');if(!w){toast('Браузер заблокировал окно печати');return}const cps=dynamicCpsV13(),overview={west:GRID_V12.west,east:GRID_V12.east,north:GRID_V12.north,south:GRID_V12.south},sectors=printSectorBoundsV13();const cpRows=cps.map(cp=>`<tr><td>${cp.number}</td><td>${esc(cp.title)}</td><td>${cp.km.toFixed(1)}</td><td>${cp.arrival}</td><td>${gridCodeDynamicV13(cp.lat,cp.lon)}</td><td>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</td></tr>`).join(''),nav=dynamicCpsV13().slice(0,-1).map((a,i)=>{const b=dynamicCpsV13()[i+1];return `<tr><td>${i+1}</td><td>${esc(a.title)} → ${esc(b.title)}</td><td>${(b.km-a.km).toFixed(1)} км</td><td>${Math.round(bearingV13([a.lat,a.lon],[b.lat,b.lon]))}°</td><td>${esc(terrainSummaryV13(a.km*1000,b.km*1000))}</td></tr>`}).join('');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Полевой атлас — Томинский лесопарк</title><style>@page{size:A4 landscape;margin:8mm}*{box-sizing:border-box}body{margin:0;font:11px Arial,sans-serif;color:#171815;background:#ddd}.printbar{position:sticky;top:0;z-index:99;padding:10px;background:#171815;color:white;text-align:center}.printbar button{padding:9px 16px}.atlas-page{width:281mm;height:194mm;background:#f4f0e7;margin:8px auto;padding:7mm;display:flex;flex-direction:column;page-break-after:always}.atlas-page header{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #777;padding-bottom:3mm}.atlas-page h1{margin:1mm 0 0;font-size:22px;text-transform:uppercase}.atlas-page small{letter-spacing:.15em;color:#79633c}.atlas-page footer{margin-top:2mm;border-top:1px solid #aaa;padding-top:2mm;color:#666}.print-map{position:relative;flex:1;overflow:hidden;margin-top:4mm;background:#dfe4d9}.tile-stage{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(var(--stage-scale,.72));transform-origin:center}.tile-stage img{position:absolute;width:256px;height:256px}.tile-stage svg{position:absolute;inset:0;width:100%;height:100%}.print-grid line{stroke:#333;stroke-width:.6;opacity:.45}.print-route-halo{fill:none;stroke:white;stroke-width:8}.print-route{fill:none;stroke:#6c22c7;stroke-width:4}.print-cps circle{fill:#6c22c7;stroke:#fff;stroke-width:2}.print-cps text{font:bold 12px Arial;paint-order:stroke;stroke:white;stroke-width:3}.table-page table{width:100%;border-collapse:collapse;margin-top:5mm;font-size:10px}.table-page th,.table-page td{padding:2.4mm;border-bottom:1px solid #bbb;text-align:left}.table-page th{font-size:9px;text-transform:uppercase;color:#666}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:5mm 0}.summary div{border:1px solid #bbb;padding:4mm}.summary small{display:block}.summary strong{font-size:20px}@media print{body{background:white}.printbar{display:none}.atlas-page{margin:0}}</style></head><body><div class="printbar"><button onclick="window.print()">Печать / сохранить как PDF</button> &nbsp; Подожди, пока подложки карт загрузятся.</div>${printMapV13(overview,'osm','Обзор · OSM')}${printMapV13(overview,'sat','Обзор · спутник')}${sectors.map((b,i)=>printMapV13(b,'osm',`Лист ${i+1} · сектор`)).join('')}<section class="atlas-page table-page"><header><div><small>МАРШРУТНЫЙ ПЛАН</small><h1>Контрольные точки</h1></div><b>${(routeLenV13()/1000).toFixed(1)} км · ${finalEtaV13()}</b></header><div class="summary"><div><small>Старт</small><strong>${editorV13.start}</strong></div><div><small>Финиш</small><strong>${finalEtaV13()}</strong></div><div><small>Дистанция</small><strong>${(routeLenV13()/1000).toFixed(1)} км</strong></div><div><small>Сетка</small><strong>${gridCfgV13().cell} м</strong></div></div><table><thead><tr><th>КП</th><th>Точка</th><th>Км</th><th>ETA</th><th>Квадрат</th><th>WGS84</th></tr></thead><tbody>${cpRows}</tbody></table><footer>Время рассчитано по типам участков и остановкам.</footer></section><section class="atlas-page table-page"><header><div><small>НАВИГАЦИЯ</small><h1>Переходы и азимуты</h1></div><b>Автоматический расчёт</b></header><table><thead><tr><th>#</th><th>Переход</th><th>По маршруту</th><th>Азимут</th><th>Тип движения</th></tr></thead><tbody>${nav}</tbody></table><footer>Приоритет на местности: тропы, дороги, ЛЭП, ЖД и реальные ориентиры.</footer></section></body></html>`);w.document.close()}


;/* source: hikes-preview/route-v13-6.js */
const bindV13Base=bind;bind=function(){bindV13Base();
  document.getElementById('toggleEditorV13')?.addEventListener('click',()=>{editorModeV13=!editorModeV13;selectedV13=null;render()});
  document.getElementById('undoV13')?.addEventListener('click',undoEditorV13);document.getElementById('redoV13')?.addEventListener('click',redoEditorV13);document.getElementById('exportAtlasV13')?.addEventListener('click',openAtlasPrintV13);document.getElementById('downloadGpxV13')?.addEventListener('click',downloadEditedGpxV13);document.getElementById('resetRouteV13')?.addEventListener('click',()=>{if(confirm('Вернуть маршрут, КП и сетку к исходной PDF-версии?'))resetEditorV13()});document.getElementById('openRouteEditorV13')?.addEventListener('click',()=>{tab='route';editorModeV13=true;render()});
  document.querySelectorAll('[data-editor-tool-v13]').forEach(b=>b.onclick=()=>{editorToolV13=b.dataset.editorToolV13;selectedV13=null;render()});
  document.querySelectorAll('[data-delete-vertex-v13]').forEach(b=>b.onclick=()=>deleteVertexV13(+b.dataset.deleteVertexV13));
  document.querySelectorAll('[data-terrain-v13]').forEach(s=>s.onchange=()=>setTerrainV13(+s.dataset.terrainV13,s.value));
  document.querySelectorAll('[data-brouter-v13]').forEach(b=>b.onclick=()=>routeSegmentBrouterV13(+b.dataset.brouterV13));
  document.querySelectorAll('[data-delete-cp-v13]').forEach(b=>b.onclick=()=>deleteCpV13(b.dataset.deleteCpV13));
  document.querySelectorAll('[data-save-cp-v13]').forEach(b=>b.onclick=()=>{const id=b.dataset.saveCpV13,title=document.querySelector(`[data-cp-title-v13="${id}"]`)?.value.trim(),stopMin=+document.querySelector(`[data-cp-stop-v13="${id}"]`)?.value||0;if(!title){toast('Название КП не может быть пустым');return}updateCpV13(id,{title,stopMin})});
  document.querySelectorAll('[data-cp-dyn-v13]').forEach(b=>b.onclick=()=>{const cp=editorV13.cps.find(x=>x.id===b.dataset.cpDynV13);if(cp&&routeMapV11){routeMapV11.setView([cp.lat,cp.lon],15,{animate:true});cpLayersV13[cp.id]?.openTooltip()}});
  document.querySelectorAll('[data-speed-v13]').forEach(i=>i.onchange=()=>{const v=Math.max(.5,Math.min(8,+i.value||4));editorV13.speeds[i.dataset.speedV13]=v;saveEditorV13();render();toast('Скорость обновлена')});
  document.getElementById('applyGridV13')?.addEventListener('click',()=>{const sel=document.getElementById('gridCellV13'),custom=+document.getElementById('gridCustomV13').value||200,cell=sel.value==='custom'?custom:+sel.value,ox=+document.getElementById('gridOffsetXV13').value||0,oy=+document.getElementById('gridOffsetYV13').value||0;pushHistoryV13();editorV13.grid={cell:Math.max(50,Math.min(1000,cell)),offsetX:ox,offsetY:oy};saveEditorV13();render();toast('Сетка обновлена')});
  document.getElementById('resetGridV13')?.addEventListener('click',()=>{pushHistoryV13();editorV13.grid={cell:200,offsetX:0,offsetY:0};saveEditorV13();render();toast('Сетка возвращена к PDF')});
  document.querySelectorAll('[data-grid-toggle-v12]').forEach(b=>b.onclick=()=>{gridEnabledV12=!gridEnabledV12;refreshGridV13();b.classList.toggle('active',gridEnabledV12)});
  document.querySelectorAll('[data-map-layer-v11]').forEach(b=>b.onclick=()=>{const kind=b.dataset.mapLayerV11;if(kind===routeBaseV11)return;replaceBaseV11(routeMapV11,document.querySelector('.map-shell-v11'),kind,false);document.querySelectorAll('[data-map-layer-v11]').forEach(x=>x.classList.toggle('active',x.dataset.mapLayerV11===kind))});
  if(tab==='route')requestAnimationFrame(mountRouteMapV13);
};

const oldResetV13=document.getElementById('reset');if(oldResetV13)oldResetV13.addEventListener('dblclick',resetEditorV13);
syncEventV13();
const buildV13=document.querySelector('.build-label');if(buildV13)buildV13.textContent='V7 · редактор маршрута / КП / сетка / PDF';
render();


;/* source: hikes-preview/route-v14-1.js */
/* V8 — route editor UX stabilization: explicit edit modes, no accidental map edits, smooth control-point dragging */
let routeActionV14='select';
let dragRouteBaseV14=null;
let routeViewportV14=null;
let savePulseV14=null;
const ROUTE_HANDLE_MIN_Z_V14=14;

function captureViewportV14(){
  if(routeMapV11){const c=routeMapV11.getCenter();routeViewportV14={lat:c.lat,lng:c.lng,zoom:routeMapV11.getZoom()}}
}
function renderPreserveV14(){captureViewportV14();render()}
function markSavedV14(){
  const e=document.getElementById('editorSaveV14');if(!e)return;
  e.textContent='Сохранено';e.classList.add('saved');clearTimeout(savePulseV14);savePulseV14=setTimeout(()=>e.classList.remove('saved'),700);
}
function setSelectedV14(sel){selectedV13=sel;refreshSelectionStylesV14();refreshEditorPanelV14()}
function refreshSelectionStylesV14(){
  routeSegLayersV13.forEach((seg,i)=>seg.setStyle({weight:selectedV13?.type==='segment'&&selectedV13.index===i?8:5,opacity:selectedV13?.type==='segment'&&selectedV13.index!==i?.65:.95}));
  routeVertexLayersV13.forEach(m=>{const i=m._routeIndexV14;m.setIcon(iconVertexV13(selectedV13?.type==='vertex'&&selectedV13.index===i))});
  Object.entries(cpLayersV13).forEach(([id,m])=>{const d=dynamicCpsV13().find(x=>x.id===id);if(d)m.setIcon(iconCpV13(d.number,selectedV13?.type==='cp'&&selectedV13.id===id))});
}
function refreshEditorPanelV14(){
  const p=document.getElementById('editorPanelV14');if(p){p.innerHTML=editorPanelV13();bindPanelV14()}
  const len=document.getElementById('routeLenV14');if(len)len.textContent=`${(routeLenV13()/1000).toFixed(1).replace('.',',')} км`;
  const fin=document.getElementById('routeFinishV14');if(fin)fin.textContent=finalEtaV13();
  const cpCount=document.getElementById('routeCpCountV14');if(cpCount)cpCount.textContent=String(dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length);
  const grid=document.getElementById('routeGridV14');if(grid)grid.textContent=`${gridCfgV13().cell} м`;
  const table=document.querySelector('.cp-list-v14');if(table)table.innerHTML=cpRowsDynamicV13();
  const nav=document.querySelector('.nav-leg-list-v14');if(nav)nav.innerHTML=dynamicNavRowsV13();
  bindDynamicRowsV14();
  markSavedV14();
}
function bindDynamicRowsV14(){document.querySelectorAll('[data-cp-dyn-v13]').forEach(b=>b.onclick=()=>{const cp=editorV13.cps.find(x=>x.id===b.dataset.cpDynV13);if(cp&&routeMapV11){routeMapV11.setView([cp.lat,cp.lon],15,{animate:true});cpLayersV13[cp.id]?.openTooltip();setSelectedV14({type:'cp',id:cp.id})}})}
function bindPanelV14(){
  document.querySelectorAll('[data-delete-vertex-v14]').forEach(b=>b.onclick=()=>deleteVertexV13(+b.dataset.deleteVertexV14));
  document.querySelectorAll('[data-terrain-v14]').forEach(s=>s.onchange=()=>setTerrainV13(+s.dataset.terrainV14,s.value));
  document.querySelectorAll('[data-brouter-v14]').forEach(b=>b.onclick=()=>routeSegmentBrouterV13(+b.dataset.brouterV14));
  document.querySelectorAll('[data-split-segment-v14]').forEach(b=>b.onclick=()=>splitSegmentV14(+b.dataset.splitSegmentV14));
  document.querySelectorAll('[data-delete-cp-v14]').forEach(b=>b.onclick=()=>deleteCpV13(b.dataset.deleteCpV14));
  document.querySelectorAll('[data-save-cp-v14]').forEach(b=>b.onclick=()=>{const id=b.dataset.saveCpV14,title=document.querySelector(`[data-cp-title-v14="${id}"]`)?.value.trim(),stopMin=+document.querySelector(`[data-cp-stop-v14="${id}"]`)?.value||0;if(!title){toast('Название КП не может быть пустым');return}updateCpV13(id,{title,stopMin})});
  document.getElementById('applyGridV14')?.addEventListener('click',applyGridV14);
  document.getElementById('resetGridV14')?.addEventListener('click',resetGridV14);
  document.querySelectorAll('[data-grid-nudge-v14]').forEach(b=>b.onclick=()=>nudgeGridV14(b.dataset.gridNudgeV14));
  document.getElementById('snapCpsV14')?.addEventListener('change',e=>{editorV13.snapCps=e.target.checked;saveEditorV13();markSavedV14()});
}
function applyGridV14(){const sel=document.getElementById('gridCellV14'),custom=+document.getElementById('gridCustomV14')?.value||200,cell=sel?.value==='custom'?custom:+sel?.value,ox=+document.getElementById('gridOffsetXV14')?.value||0,oy=+document.getElementById('gridOffsetYV14')?.value||0;pushHistoryV13();editorV13.grid={cell:Math.max(50,Math.min(1000,cell||200)),offsetX:ox,offsetY:oy};saveEditorV13();refreshGridV13();refreshEditorPanelV14();toast('Сетка обновлена')}
function resetGridV14(){pushHistoryV13();editorV13.grid={cell:200,offsetX:0,offsetY:0};saveEditorV13();refreshGridV13();refreshEditorPanelV14();toast('Сетка возвращена к PDF')}
function nudgeGridV14(dir){const step=25;pushHistoryV13();if(dir==='left')editorV13.grid.offsetX=(+editorV13.grid.offsetX||0)-step;if(dir==='right')editorV13.grid.offsetX=(+editorV13.grid.offsetX||0)+step;if(dir==='up')editorV13.grid.offsetY=(+editorV13.grid.offsetY||0)+step;if(dir==='down')editorV13.grid.offsetY=(+editorV13.grid.offsetY||0)-step;saveEditorV13();refreshGridV13();refreshEditorPanelV14()}

editorToolbarV13=function(){return `<div class="editor-toolbar-v13 editor-toolbar-v14"><button class="btn ${editorModeV13?'sand':'alt'}" id="toggleEditorV14">${editorModeV13?'Завершить':'Редактировать'}</button>${editorModeV13?`<div class="history-v14"><button class="icon-btn" id="undoV14" ${undoV13.length?'':'disabled'} title="Отменить">↶</button><button class="icon-btn" id="redoV14" ${redoV13.length?'':'disabled'} title="Повторить">↷</button></div><span class="editor-save-v14" id="editorSaveV14">Сохранено</span><button class="btn alt" id="resetRouteV14">Вернуть PDF</button>`:''}<button class="btn alt" id="downloadGpxV14">GPX</button><button class="btn alt" id="exportAtlasV14">PDF / печать</button></div>`}
function routeToolStripV14(){if(!editorModeV13)return '';return `<div class="route-toolstrip-v14"><div class="route-toolgroup-v14"><button class="route-tool-v14 ${editorToolV13==='route'?'active':''}" data-tool-v14="route">Линия</button><button class="route-tool-v14 ${editorToolV13==='cp'?'active':''}" data-tool-v14="cp">КП</button><button class="route-tool-v14 ${editorToolV13==='grid'?'active':''}" data-tool-v14="grid">Сетка</button></div>${editorToolV13==='route'?`<div class="route-toolgroup-v14 secondary"><button class="route-tool-v14 ${routeActionV14==='select'?'active':''}" data-action-v14="select">Выбирать / двигать</button><button class="route-tool-v14 ${routeActionV14==='add'?'active':''}" data-action-v14="add">+ Добавить узел</button></div>`:''}<div class="route-modehint-v14">${editorToolV13==='route'?(routeActionV14==='add'?'Клик по карте добавит один узел. После добавления вернёмся в режим выбора.':'Перетаскивай белые узлы. Клик по пустой карте ничего не меняет.'):editorToolV13==='cp'?'Клик по карте добавит КП. Существующие КП можно перетаскивать.':'Настройки и смещение сетки — в панели справа.'}</div></div>`}
editorPanelV13=function(){
  if(!editorModeV13)return `<div class="metric"><small>Расчётная длина</small><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong><em>автопересчёт</em></div><div class="metric"><small>Расчётный финиш</small><strong>${finalEtaV13()}</strong><em>${fmtDurationV13(routeDurationMinV13())}</em></div><div class="metric"><small>КП</small><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong><em>можно редактировать</em></div><div class="metric"><small>Сетка</small><strong>${gridCfgV13().cell} × ${gridCfgV13().cell} м</strong><em>${editorV13.grid.offsetX||editorV13.grid.offsetY?'со смещением':'по PDF'}</em></div>`;
  let sel='';
  if(selectedV13?.type==='vertex'){const i=selectedV13.index,p=editorV13.route[i];sel=`<div class="editor-card-v13"><small>Контрольный узел · ${i+1}/${editorV13.route.length}</small><strong>${p[0].toFixed(6)}, ${p[1].toFixed(6)}</strong><p>При перетаскивании соседние скрытые точки двигаются плавно вместе с узлом, чтобы линия не ломалась.</p><button class="btn alt sm" data-delete-vertex-v14="${i}" ${i===0||i===editorV13.route.length-1?'disabled':''}>Удалить узел</button></div>`}
  else if(selectedV13?.type==='segment'){const i=selectedV13.index,t=editorV13.terrain[i]||'unknown',a=editorV13.route[i],b=editorV13.route[i+1];sel=`<div class="editor-card-v13"><small>Участок ${i+1}</small><strong>${(havV13(a,b)*DISTANCE_CAL_V13/1000).toFixed(2).replace('.',',')} км</strong><label>Тип движения<select data-terrain-v14="${i}">${Object.entries(TERRAIN_V13).map(([k,v])=>`<option value="${k}" ${k===t?'selected':''}>${v.label}</option>`).join('')}</select></label><div class="editor-inline-v13"><button class="btn sand sm" data-brouter-v14="${i}">По тропам OSM</button><button class="btn alt sm" data-split-segment-v14="${i}">Узел в середине</button></div><p>Автопрокладка меняет только выбранный участок. Если результат не подходит, нажми ↶.</p></div>`}
  else if(selectedV13?.type==='cp'){const cp=editorV13.cps.find(x=>x.id===selectedV13.id),dyn=dynamicCpsV13().find(x=>x.id===selectedV13.id);if(cp)sel=`<div class="editor-card-v13"><small>${dyn?.number==='С'?'Старт':dyn?.number==='Ф'?'Финиш':`КП ${dyn?.number||''}`} · ${gridCodeDynamicV13(cp.lat,cp.lon)}</small><label>Название<input data-cp-title-v14="${cp.id}" value="${esc(cp.title)}"></label><label>Остановка, мин<input type="number" min="0" max="240" data-cp-stop-v14="${cp.id}" value="${cp.stopMin||0}"></label><div class="editor-inline-v13"><button class="btn sand sm" data-save-cp-v14="${cp.id}">Сохранить</button><button class="btn alt sm" data-delete-cp-v14="${cp.id}" ${cp.locked?'disabled':''}>Удалить</button></div><p>${dyn?`${dyn.km.toFixed(1).replace('.',',')} км · ETA ${dyn.arrival}`:''}</p></div>`}
  else if(editorToolV13==='grid'){const g=editorV13.grid;sel=`<div class="editor-card-v13"><small>Координатная сетка</small><label>Размер клетки<select id="gridCellV14">${[100,200,250,500].map(v=>`<option value="${v}" ${+g.cell===v?'selected':''}>${v} × ${v} м</option>`).join('')}<option value="custom" ${![100,200,250,500].includes(+g.cell)?'selected':''}>Свой размер</option></select></label><label>Свой размер, м<input id="gridCustomV14" type="number" min="50" max="1000" step="10" value="${+g.cell||200}"></label><div class="grid-nudge-v14"><span></span><button data-grid-nudge-v14="up">↑</button><span></span><button data-grid-nudge-v14="left">←</button><button type="button" class="grid-nudge-center-v14" title="Текущее смещение">${+g.offsetX||0}; ${+g.offsetY||0}</button><button data-grid-nudge-v14="right">→</button><span></span><button data-grid-nudge-v14="down">↓</button><span></span></div><div class="editor-grid2-v13"><label>Смещение X, м<input id="gridOffsetXV14" type="number" step="10" value="${+g.offsetX||0}"></label><label>Смещение Y, м<input id="gridOffsetYV14" type="number" step="10" value="${+g.offsetY||0}"></label></div><div class="editor-inline-v13"><button class="btn sand sm" id="applyGridV14">Применить</button><button class="btn alt sm" id="resetGridV14">PDF 200 м</button></div><p>Стрелки двигают сетку по 25 м. Точная величина задаётся полями ниже.</p></div>`}
  const snap=`<label class="snap-toggle-v14"><input type="checkbox" id="snapCpsV14" ${editorV13.snapCps?'checked':''}><span><b>КП следуют за маршрутом</b><small>После изменения линии КП привязываются к ближайшему участку.</small></span></label>`;
  return `<div class="editor-summary-v13"><div class="editor-stat-v13"><span>Длина</span><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong></div><div class="editor-stat-v13"><span>Финиш</span><strong>${finalEtaV13()}</strong></div><div class="editor-stat-v13"><span>КП</span><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong></div></div>${sel||`<div class="editor-empty-v13"><strong>${editorToolV13==='route'?'Выбери узел или участок':editorToolV13==='cp'?'Контрольные точки':'Редактор сетки'}</strong><p>${editorToolV13==='route'?'По пустой карте можно спокойно кликать и двигать её — маршрут не изменится, пока не включён «+ Добавить узел».':editorToolV13==='cp'?'Клик по карте добавляет КП; существующую КП можно перетащить.':'Настрой размер и сдвиг сетки.'}</p></div>`}${editorToolV13!=='grid'?snap:''}`
}

function routePageV14(){
  const body=routeModeV9==='points'?section('Контрольные точки',`<div class="cp-head"><span>КП</span><span>Точка</span><span>Км</span><span>ETA</span></div><div class="cp-list cp-list-v14">${cpRowsDynamicV13()}</div>`,'Километраж и ETA считаются из текущей линии маршрута.'):routeModeV9==='navigation'?section('Переходы и азимуты',`<div class="navigation-note"><strong>Автопересчёт</strong><p>Расстояние считается вдоль маршрута, азимут — между КП. Тип движения задаётся по участкам.</p></div><div class="nav-leg-list nav-leg-list-v14">${dynamicNavRowsV13()}</div>`,'Значения обновляются после редактирования.'):section('Полевой атлас и экспорт',`<div class="atlas-source"><div class="atlas-source__number">PDF</div><div><b>Маршрут → атлас</b><p>Экспорт использует текущее состояние линии, КП и сетки.</p></div></div><div class="materials-list">${materialRowsV10()}</div>`,'GPX/KML — справочные исходники; редактор хранит актуальную версию.');
  return `${pageHead('Навигация','Маршрут','Редактор маршрута с явными режимами: выбор, добавление узла, КП и сетка. Случайный клик по карте больше не меняет линию.',editorToolbarV13())}${routeToolStripV14()}<div class="route-layout route-layout-v10 route-editor-layout-v13"><div class="route-map"><div class="route-map-head-v11"><div><small>${editorModeV13?'Редактор':'Маршрут'}</small><strong>Томинский лесопарк · <span id="routeLenV14">${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</span></strong></div><div class="map-controls-v12"><div class="map-layer-switch-v11"><button type="button" data-map-layer-v11="osm" class="${routeBaseV11==='osm'?'active':''}">Карта</button><button type="button" data-map-layer-v11="sat" class="${routeBaseV11==='sat'?'active':''}">Спутник</button></div><button type="button" class="grid-toggle-v12 ${gridEnabledV12?'active':''}" data-grid-toggle-v12>Сетка</button></div></div><div class="map-shell-v11"><div id="routeMapFinal" class="leaflet-map leaflet-map-v11 ${editorModeV13?'editing-v13':''}"></div><div class="route-loading-v11">Загрузка подложки…</div><div class="editor-map-hint-v14">${editorModeV13?(editorToolV13==='route'?(routeActionV14==='add'?'Клик: добавить один узел':'Перетаскивай узлы · клик по линии: выбрать участок'):editorToolV13==='cp'?'Клик: добавить КП · маркер: перетащить':'Клик: посмотреть квадрат'):'Колесо: масштаб · карта/спутник'}</div></div><div class="route-map-foot-v11"><span>⌂ — весь маршрут</span><span>${editorModeV13?'Автосохранение включено':'Просмотр'}</span><span id="gridStatusV12">Сетка ${gridCfgV13().cell}×${gridCfgV13().cell} м</span></div></div><aside class="route-summary route-editor-panel-v13" id="editorPanelV14">${editorPanelV13()}</aside></div><div class="segmented route-tabs"><button class="${routeModeV9==='points'?'active':''}" data-route-v9="points">КП</button><button class="${routeModeV9==='navigation'?'active':''}" data-route-v9="navigation">Навигация</button><button class="${routeModeV9==='atlas'?'active':''}" data-route-v9="atlas">Атлас</button></div>${body}`
}
routePage=routePageV14;


;/* source: hikes-preview/route-v14-2.js */
function smoothDragRouteV14(i,ll){
  if(!dragRouteBaseV14)return;const base=dragRouteBaseV14,old=base[i],dLat=ll.lat-old[0],dLon=ll.lng-old[1],z=routeMapV11?.getZoom()||15,r=z>=17?2:z>=16?3:z>=15?4:6,last=base.length-1;
  for(let j=Math.max(0,i-r);j<=Math.min(last,i+r);j++){if((j===0||j===last)&&j!==i)continue;const dist=Math.abs(j-i),w=Math.cos((dist/(r+1))*Math.PI/2)**2;editorV13.route[j]=[base[j][0]+dLat*w,base[j][1]+dLon*w]}
  updateRouteGeometryV14();
}
function updateRouteGeometryV14(){
  routeSegLayersV13.forEach((seg,i)=>{if(editorV13.route[i+1])seg.setLatLngs([editorV13.route[i],editorV13.route[i+1]])});
  routeVertexLayersV13.forEach(m=>{const i=m._routeIndexV14;if(editorV13.route[i])m.setLatLng(editorV13.route[i])});
}
function updateCpMarkersV14(){const d=dynamicCpsV13();d.forEach(cp=>{const m=cpLayersV13[cp.id];if(m){m.setLatLng([cp.lat,cp.lon]);m.setIcon(iconCpV13(cp.number,selectedV13?.type==='cp'&&selectedV13.id===cp.id));m.setTooltipContent(`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title} · ${gridCodeDynamicV13(cp.lat,cp.lon)}`)}})}
function visibleVertexStepV14(){const z=routeMapV11?.getZoom()||15;return z>=17?1:z>=16?2:z>=15?4:8}
function drawRouteV14(){
  if(!routeMapV11)return;clearEditLayersV13();
  if(!editorModeV13){routeLineV13=L.polyline(editorV13.route,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.1,interactive:false}).addTo(routeMapV11)}else{
    for(let i=0;i<editorV13.route.length-1;i++){const seg=L.polyline([editorV13.route[i],editorV13.route[i+1]],{color:routeColorV13(i),weight:selectedV13?.type==='segment'&&selectedV13.index===i?8:5,opacity:selectedV13?.type==='segment'&&selectedV13.index!==i?.65:.95,interactive:editorToolV13==='route',bubblingMouseEvents:false}).addTo(routeMapV11);seg.on('click',e=>{if(editorToolV13!=='route')return;L.DomEvent.stopPropagation(e);routeActionV14='select';setSelectedV14({type:'segment',index:i})});routeSegLayersV13.push(seg)}
    if(editorToolV13==='route'&&routeMapV11.getZoom()>=ROUTE_HANDLE_MIN_Z_V14){const step=visibleVertexStepV14();editorV13.route.forEach((p,i)=>{if(i!==0&&i!==editorV13.route.length-1&&i%step!==0&&selectedV13?.index!==i)return;const m=L.marker(p,{icon:iconVertexV13(selectedV13?.type==='vertex'&&selectedV13.index===i),draggable:routeActionV14==='select',zIndexOffset:500}).addTo(routeMapV11);m._routeIndexV14=i;m.on('dragstart',()=>{pushHistoryV13();dragRouteBaseV14=cloneV13(editorV13.route)});m.on('drag',ev=>smoothDragRouteV14(i,ev.target.getLatLng()));m.on('dragend',()=>{dragRouteBaseV14=null;if(editorV13.snapCps)snapAllCpsV13();saveEditorV13();setSelectedV14({type:'vertex',index:i});updateCpMarkersV14();refreshEditorPanelV14()});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);setSelectedV14({type:'vertex',index:i})});routeVertexLayersV13.push(m)})}
  }
  const cps=dynamicCpsV13();cps.forEach(cp=>{const label=cp.number,m=L.marker([cp.lat,cp.lon],{icon:iconCpV13(label,selectedV13?.type==='cp'&&selectedV13.id===cp.id),draggable:editorModeV13&&editorToolV13==='cp',zIndexOffset:800}).addTo(routeMapV11);m.bindTooltip(`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title} · ${gridCodeDynamicV13(cp.lat,cp.lon)}`,{direction:'top'});if(editorModeV13){m.on('dragstart',()=>pushHistoryV13());m.on('dragend',ev=>{const ll=ev.target.getLatLng(),obj=editorV13.cps.find(x=>x.id===cp.id);if(obj){if(editorV13.snapCps){const n=nearestRouteV13(ll.lat,ll.lng);obj.lat=n.lat;obj.lon=n.lon}else{obj.lat=ll.lat;obj.lon=ll.lng}saveEditorV13();setSelectedV14({type:'cp',id:cp.id});refreshEditorPanelV14()}});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);setSelectedV14({type:'cp',id:cp.id})})}cpLayersV13[cp.id]=m})
}
drawRouteV13=drawRouteV14;
function mountRouteMapV14(){
  const el=document.getElementById('routeMapFinal');if(!el)return;if(routeMapV11){try{routeMapV11.remove()}catch(e){}routeMapV11=null;routeLayerV11=null;routeMarkersV11={}}dynamicGridLayerV13=null;dynamicGridSelectedV13=null;if(!window.L){el.innerHTML=`<div class="map-fallback-v11">${mapSvgV10()}<small>Онлайн-карта недоступна.</small></div>`;return}el.innerHTML='';routeMapV11=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:110,minZoom:12,maxZoom:19,fadeAnimation:false,markerZoomAnimation:false});routeLayerV11=makeTileV11(routeBaseV11).addTo(routeMapV11);if(gridEnabledV12){dynamicGridLayerV13=buildGridDynamicV13(routeMapV11);dynamicGridLayerV13.addTo(routeMapV11)}drawRouteV14();if(routeViewportV14){routeMapV11.setView([routeViewportV14.lat,routeViewportV14.lng],routeViewportV14.zoom,{animate:false});routeViewportV14=null}else routeMapV11.fitBounds(L.latLngBounds(editorV13.route),{padding:[34,34],animate:false});const Fit=L.Control.extend({onAdd:function(){const b=L.DomUtil.create('button','leaflet-bar fit-route-v11');b.type='button';b.innerHTML='⌂';b.title='Показать весь маршрут';L.DomEvent.disableClickPropagation(b);L.DomEvent.on(b,'click',()=>routeMapV11.fitBounds(L.latLngBounds(editorV13.route),{padding:[34,34],animate:true}));return b}});new Fit({position:'topleft'}).addTo(routeMapV11);
  routeMapV11.on('zoomend',()=>{if(editorModeV13&&editorToolV13==='route')drawRouteV14();if(gridEnabledV12)refreshGridV13()});
  routeMapV11.on('click',e=>{if(editorModeV13){if(editorToolV13==='cp')return addCpV14(e.latlng.lat,e.latlng.lng);if(editorToolV13==='route'&&routeActionV14==='add')return insertRoutePointV14(e.latlng.lat,e.latlng.lng);if(editorToolV13==='grid')return handleGridClickDynamicV13(e);if(editorToolV13==='route'&&routeActionV14==='select')return setSelectedV14(null)}else handleGridClickDynamicV13(e)});
  routeMapV11.on('popupopen',ev=>{const btn=ev.popup.getElement()?.querySelector('[data-copy-grid-v13]');if(btn)btn.onclick=()=>{navigator.clipboard?.writeText(btn.dataset.copyGridV13);toast(`Скопировано: ${btn.dataset.copyGridV13}`)}});setTimeout(()=>routeMapV11&&routeMapV11.invalidateSize(false),100);updateGridStatusV13();
}
mountRouteMapV13=mountRouteMapV14;mountRouteMapV10=mountRouteMapV14;

function redrawAllV14(){drawRouteV14();refreshEditorPanelV14();markSavedV14()}
insertRoutePointV14=function(lat,lon){const n=nearestRouteV13(lat,lon);if(!n)return;pushHistoryV13();editorV13.route.splice(n.seg+1,0,[lat,lon]);const next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const i=+k;next[i>n.seg?i+1:i]=v});next[n.seg+1]=next[n.seg]||'unknown';editorV13.terrain=next;if(editorV13.snapCps)snapAllCpsV13();saveEditorV13();selectedV13={type:'vertex',index:n.seg+1};routeActionV14='select';redrawAllV14();updateCpMarkersV14();toast('Узел добавлен')}
function splitSegmentV14(i){const a=editorV13.route[i],b=editorV13.route[i+1];if(!a||!b)return;insertRoutePointV14((a[0]+b[0])/2,(a[1]+b[1])/2)}
addCpV14=function(lat,lon){pushHistoryV13();let p={lat,lon};if(editorV13.snapCps){const n=nearestRouteV13(lat,lon);p={lat:n.lat,lon:n.lon}}const id='u'+Date.now();editorV13.cps.push({id,title:'Новая контрольная точка',lat:p.lat,lon:p.lon,stopMin:0,locked:false});saveEditorV13();selectedV13={type:'cp',id};drawRouteV14();refreshEditorPanelV14();toast('КП добавлена — задай название')}
deleteVertexV13=function(i){if(i<=0||i>=editorV13.route.length-1){toast('Старт и финиш удалять нельзя');return}pushHistoryV13();editorV13.route.splice(i,1);const next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const n=+k;if(n===i)return;next[n>i?n-1:n]=v});editorV13.terrain=next;if(editorV13.snapCps)snapAllCpsV13();saveEditorV13();selectedV13=null;redrawAllV14();updateCpMarkersV14();toast('Узел удалён')}
deleteCpV13=function(id){const cp=editorV13.cps.find(x=>x.id===id);if(!cp||cp.locked){toast('Старт / финиш удалять нельзя');return}pushHistoryV13();editorV13.cps=editorV13.cps.filter(x=>x.id!==id);saveEditorV13();selectedV13=null;redrawAllV14();toast('КП удалена')}
updateCpV13=function(id,patch){const cp=editorV13.cps.find(x=>x.id===id);if(!cp)return;pushHistoryV13();Object.assign(cp,patch);saveEditorV13();drawRouteV14();refreshEditorPanelV14();toast('КП обновлена')}
setTerrainV13=function(i,type){pushHistoryV13();editorV13.terrain[i]=type;saveEditorV13();drawRouteV14();setSelectedV14({type:'segment',index:i});refreshEditorPanelV14();toast(`Участок: ${TERRAIN_V13[type]?.label||type}`)}
undoEditorV13=function(){if(!undoV13.length)return;redoV13.push(cloneV13(editorV13));editorV13=undoV13.pop();saveEditorV13();selectedV13=null;redrawAllV14();refreshGridV13();toast('Отменено')}
redoEditorV13=function(){if(!redoV13.length)return;undoV13.push(cloneV13(editorV13));editorV13=redoV13.pop();saveEditorV13();selectedV13=null;redrawAllV14();refreshGridV13();toast('Повторено')}
resetEditorV13=function(){pushHistoryV13();editorV13=defaultEditorV13();saveEditorV13();selectedV13=null;routeActionV14='select';redrawAllV14();refreshGridV13();toast('Возвращена PDF-версия')}
async function routeSegmentBrouterV14(i){if(lastBrouterPendingV13)return;const a=editorV13.route[i],b=editorV13.route[i+1];if(!a||!b)return;lastBrouterPendingV13=true;toast('Строю выбранный участок по OSM…');try{const u=`https://brouter.de/brouter?lonlats=${a[1]},${a[0]}%7C${b[1]},${b[0]}&profile=trekking&alternativeidx=0&format=geojson`,r=await fetch(u);if(!r.ok)throw new Error();const j=await r.json(),coords=j?.features?.[0]?.geometry?.coordinates||j?.geometry?.coordinates;if(!Array.isArray(coords)||coords.length<2)throw new Error();pushHistoryV13();const repl=coords.map(c=>[+c[1],+c[0]]),delta=repl.length-2,next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const n=+k;if(n<i)next[n]=v;else if(n>i)next[n+delta]=v});for(let n=i;n<i+repl.length-1;n++)next[n]='trail';editorV13.route.splice(i,2,...repl);editorV13.terrain=next;if(editorV13.snapCps)snapAllCpsV13();saveEditorV13();selectedV13={type:'segment',index:i};redrawAllV14();updateCpMarkersV14();toast('Участок перестроен. ↶ отменит результат.')}catch(e){toast('Не удалось построить по OSM. Геометрия не изменена.')}finally{lastBrouterPendingV13=false}}
routeSegmentBrouterV13=routeSegmentBrouterV14;

const bindV14Base=bind;bind=function(){bindV14Base();
  document.getElementById('toggleEditorV14')?.addEventListener('click',()=>{editorModeV13=!editorModeV13;editorToolV13='route';routeActionV14='select';selectedV13=null;renderPreserveV14()});
  document.getElementById('undoV14')?.addEventListener('click',undoEditorV13);document.getElementById('redoV14')?.addEventListener('click',redoEditorV13);
  document.getElementById('exportAtlasV14')?.addEventListener('click',openAtlasPrintV13);document.getElementById('downloadGpxV14')?.addEventListener('click',downloadEditedGpxV13);
  document.getElementById('resetRouteV14')?.addEventListener('click',()=>{if(confirm('Вернуть маршрут, КП и сетку к исходной PDF-версии?'))resetEditorV13()});
  document.querySelectorAll('[data-tool-v14]').forEach(b=>b.onclick=()=>{editorToolV13=b.dataset.toolV14;routeActionV14='select';selectedV13=null;renderPreserveV14()});
  document.querySelectorAll('[data-action-v14]').forEach(b=>b.onclick=()=>{routeActionV14=b.dataset.actionV14;selectedV13=null;renderPreserveV14()});
  bindPanelV14();bindDynamicRowsV14();
};
const buildV14=document.querySelector('.build-label');if(buildV14)buildV14.textContent='V8 · удобный редактор маршрута';
render();


;/* source: hikes-preview/route-v15.js */
/* V9 — precise route editing, trail range routing, explicit save/discard, live route sheet */
let editBaseV15=null,editDirtyV15=false,routeActionV15='select',rangeStartV15=null,routeMidLayerV15=null,dragBaseV15=null;
const persistEditorV15=saveEditorV13;

function sameV15(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}}
function dirtyV15(){editDirtyV15=!!editBaseV15&&!sameV15(editorV13,editBaseV15);updateDirtyUiV15()}
function updateDirtyUiV15(){const e=document.getElementById('editorStateV15');if(e){e.textContent=editDirtyV15?'Есть несохранённые изменения':'Изменений нет';e.classList.toggle('dirty',editDirtyV15)}}
function draftSaveV15(){if(editorModeV13&&editBaseV15){dirtyV15();return}persistEditorV15()}
saveEditorV13=draftSaveV15;

function beginEditV15(){if(editorModeV13)return;editBaseV15=cloneV13(editorV13);editDirtyV15=false;undoV13=[];redoV13=[];editorModeV13=true;editorToolV13='route';routeActionV15='select';selectedV13=null;rangeStartV15=null;renderPreserveV14()}
function saveAndExitV15(){if(!editorModeV13)return;editorModeV13=false;routeActionV15='select';rangeStartV15=null;selectedV13=null;editBaseV15=null;editDirtyV15=false;persistEditorV15();renderPreserveV14();toast('Изменения маршрута сохранены')}
function discardAndExitV15(){if(!editorModeV13)return;if(editDirtyV15&&!confirm('Отменить все изменения, сделанные после входа в редактор?'))return;if(editBaseV15)editorV13=cloneV13(editBaseV15);editorModeV13=false;routeActionV15='select';rangeStartV15=null;selectedV13=null;editBaseV15=null;editDirtyV15=false;renderPreserveV14();toast('Изменения отменены')}
window.addEventListener('beforeunload',e=>{if(editorModeV13&&editDirtyV15){e.preventDefault();e.returnValue=''}});

function iconPointV15(i,active=false,path=false){const end=i===0?'С':i===editorV13.route.length-1?'Ф':'';if(end)return L.divIcon({className:'',html:`<span class="route-endpoint-v15 ${active?'active':''} ${path?'path-anchor':''}">${end}</span>`,iconSize:[26,26],iconAnchor:[13,13]});return L.divIcon({className:'',html:`<span class="route-point-v15 ${active?'active':''} ${path?'path-anchor':''}"></span>`,iconSize:[14,14],iconAnchor:[7,7]})}
function iconMidV15(){return L.divIcon({className:'',html:'<span class="route-midadd-v15">+</span>',iconSize:[24,24],iconAnchor:[12,12]})}
function visibleStepV15(){const z=routeMapV11?.getZoom()||15;return z>=18?1:z>=17?2:z>=16?3:z>=15?5:z>=14?8:14}
function syncEndpointCpV15(i,ll){const last=editorV13.route.length-1;if(i===0){const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=ll.lat;s.lon=ll.lng}if(editorV13.loopLocked!==false){editorV13.route[last]=[ll.lat,ll.lng];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=ll.lat;f.lon=ll.lng}}}else if(i===last){const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=ll.lat;f.lon=ll.lng}if(editorV13.loopLocked!==false){editorV13.route[0]=[ll.lat,ll.lng];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=ll.lat;s.lon=ll.lng}}}}
function updateRouteGeomV15(){routeSegLayersV13.forEach((seg,i)=>{if(editorV13.route[i+1])seg.setLatLngs([editorV13.route[i],editorV13.route[i+1]])});routeVertexLayersV13.forEach(m=>{const i=m._routeIndexV15;if(editorV13.route[i])m.setLatLng(editorV13.route[i])});if(routeMidLayerV15&&selectedV13?.type==='segment'){const i=selectedV13.index,a=editorV13.route[i],b=editorV13.route[i+1];if(a&&b)routeMidLayerV15.setLatLng([(a[0]+b[0])/2,(a[1]+b[1])/2])}updateCpMarkersV14();const c=document.getElementById('pointCoordsV15');if(c&&selectedV13?.type==='vertex'){const p=editorV13.route[selectedV13.index];c.textContent=`${p[0].toFixed(6)}, ${p[1].toFixed(6)}`}}
function clearMidV15(){if(routeMidLayerV15&&routeMapV11?.hasLayer(routeMidLayerV15))routeMapV11.removeLayer(routeMidLayerV15);routeMidLayerV15=null}
function showMidV15(i){clearMidV15();if(!editorModeV13||editorToolV13!=='route'||!routeMapV11)return;const a=editorV13.route[i],b=editorV13.route[i+1];if(!a||!b)return;routeMidLayerV15=L.marker([(a[0]+b[0])/2,(a[1]+b[1])/2],{icon:iconMidV15(),zIndexOffset:1100}).addTo(routeMapV11);routeMidLayerV15.bindTooltip('Добавить точку на этот участок',{direction:'top'});routeMidLayerV15.on('click',e=>{L.DomEvent.stopPropagation(e);splitSegmentV15(i)})}
function setSelectedV15(sel){selectedV13=sel;refreshSelectionV15();refreshPanelV15();if(sel?.type==='segment')showMidV15(sel.index);else clearMidV15()}
function refreshSelectionV15(){routeSegLayersV13.forEach((s,i)=>s.setStyle({weight:selectedV13?.type==='segment'&&selectedV13.index===i?8:5,opacity:selectedV13?.type==='segment'&&selectedV13.index!==i?.55:.95}));routeVertexLayersV13.forEach(m=>{const i=m._routeIndexV15;m.setIcon(iconPointV15(i,selectedV13?.type==='vertex'&&selectedV13.index===i,rangeStartV15===i))})}

function drawRouteV15(){if(!routeMapV11)return;clearEditLayersV13();clearMidV15();if(!editorModeV13){routeLineV13=L.polyline(editorV13.route,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.08,interactive:false}).addTo(routeMapV11)}else{
 for(let i=0;i<editorV13.route.length-1;i++){const seg=L.polyline([editorV13.route[i],editorV13.route[i+1]],{color:routeColorV13(i),weight:selectedV13?.type==='segment'&&selectedV13.index===i?8:5,opacity:selectedV13?.type==='segment'&&selectedV13.index!==i?.55:.95,interactive:editorToolV13==='route',bubblingMouseEvents:false}).addTo(routeMapV11);seg.on('click',e=>{if(editorToolV13!=='route')return;L.DomEvent.stopPropagation(e);if(routeActionV15==='path')return chooseRangeOnSegmentV15(i,e.latlng);routeActionV15='select';setSelectedV15({type:'segment',index:i})});routeSegLayersV13.push(seg)}
 if(editorToolV13==='route'){const step=visibleStepV15();editorV13.route.forEach((p,i)=>{if(i!==0&&i!==editorV13.route.length-1&&i%step!==0&&selectedV13?.index!==i&&rangeStartV15!==i)return;const m=L.marker(p,{icon:iconPointV15(i,selectedV13?.type==='vertex'&&selectedV13.index===i,rangeStartV15===i),draggable:routeActionV15==='select',zIndexOffset:(i===0||i===editorV13.route.length-1)?1400:1050}).addTo(routeMapV11);m._routeIndexV15=i;m.on('dragstart',()=>{pushHistoryV13();dragBaseV15=cloneV13(editorV13.route)});m.on('drag',ev=>{const ll=ev.target.getLatLng();editorV13.route[i]=[ll.lat,ll.lng];syncEndpointCpV15(i,ll);updateRouteGeomV15()});m.on('dragend',()=>{dragBaseV15=null;saveEditorV13();setSelectedV15({type:'vertex',index:i});refreshPanelV15();toast('Точка перемещена')});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);if(routeActionV15==='path')return chooseRangeAnchorV15(i);setSelectedV15({type:'vertex',index:i})});routeVertexLayersV13.push(m)})}
 }
 const cps=dynamicCpsV13();cps.forEach(cp=>{const interactive=!editorModeV13||editorToolV13==='cp',m=L.marker([cp.lat,cp.lon],{icon:iconCpV13(cp.number,selectedV13?.type==='cp'&&selectedV13.id===cp.id),draggable:editorModeV13&&editorToolV13==='cp',interactive,zIndexOffset:editorToolV13==='cp'?1300:700}).addTo(routeMapV11);m.bindTooltip(`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title} · ${gridCodeDynamicV13(cp.lat,cp.lon)}`,{direction:'top'});if(editorModeV13&&editorToolV13==='cp'){m.on('dragstart',()=>pushHistoryV13());m.on('dragend',ev=>{const ll=ev.target.getLatLng(),obj=editorV13.cps.find(x=>x.id===cp.id);if(!obj)return;obj.lat=ll.lat;obj.lon=ll.lng;if(cp.id==='cp0'){editorV13.route[0]=[ll.lat,ll.lng];if(editorV13.loopLocked!==false){editorV13.route[editorV13.route.length-1]=[ll.lat,ll.lng];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=ll.lat;f.lon=ll.lng}}}if(cp.id==='cpf'){editorV13.route[editorV13.route.length-1]=[ll.lat,ll.lng];if(editorV13.loopLocked!==false){editorV13.route[0]=[ll.lat,ll.lng];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=ll.lat;s.lon=ll.lng}}}saveEditorV13();drawRouteV15();setSelectedV15({type:'cp',id:cp.id});toast('КП перемещена')});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);setSelectedV15({type:'cp',id:cp.id})})}cpLayersV13[cp.id]=m})
 if(selectedV13?.type==='segment')showMidV15(selectedV13.index)
}
drawRouteV13=drawRouteV15;

function insertPointAtV15(seg,lat,lon){pushHistoryV13();editorV13.route.splice(seg+1,0,[lat,lon]);const next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const n=+k;next[n>seg?n+1:n]=v});next[seg+1]=next[seg]||'unknown';editorV13.terrain=next;saveEditorV13();return seg+1}
function addPointMapV15(lat,lon){const n=nearestRouteV13(lat,lon);if(!n)return;const idx=insertPointAtV15(n.seg,lat,lon);routeActionV15='select';drawRouteV15();setSelectedV15({type:'vertex',index:idx});toast('Точка маршрута добавлена')}
function splitSegmentV15(i){const a=editorV13.route[i],b=editorV13.route[i+1];if(!a||!b)return;const idx=insertPointAtV15(i,(a[0]+b[0])/2,(a[1]+b[1])/2);drawRouteV15();setSelectedV15({type:'vertex',index:idx});toast('Добавлена точка — теперь её можно точно сместить')}
function deletePointV15(i){if(i<=0||i>=editorV13.route.length-1){toast('Старт и финиш можно двигать, но не удалять');return}pushHistoryV13();editorV13.route.splice(i,1);const next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const n=+k;if(n===i)return;next[n>i?n-1:n]=v});editorV13.terrain=next;saveEditorV13();selectedV13=null;drawRouteV15();refreshPanelV15();toast('Точка маршрута удалена')}
function applyPointCoordsV15(i){const lat=+document.getElementById('vertexLatV15')?.value,lon=+document.getElementById('vertexLonV15')?.value;if(!Number.isFinite(lat)||!Number.isFinite(lon)){toast('Проверь координаты');return}pushHistoryV13();editorV13.route[i]=[lat,lon];syncEndpointCpV15(i,{lat,lng:lon});saveEditorV13();drawRouteV15();setSelectedV15({type:'vertex',index:i});toast('Координаты точки обновлены')}
function applyCpV15(id){const cp=editorV13.cps.find(x=>x.id===id);if(!cp)return;const title=document.getElementById('cpTitleV15')?.value.trim(),stop=+document.getElementById('cpStopV15')?.value||0,lat=+document.getElementById('cpLatV15')?.value,lon=+document.getElementById('cpLonV15')?.value;if(!title||!Number.isFinite(lat)||!Number.isFinite(lon)){toast('Проверь название и координаты');return}pushHistoryV13();Object.assign(cp,{title,stopMin:stop,lat,lon});if(id==='cp0'){editorV13.route[0]=[lat,lon];if(editorV13.loopLocked!==false){editorV13.route[editorV13.route.length-1]=[lat,lon];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=lat;f.lon=lon}}}if(id==='cpf'){editorV13.route[editorV13.route.length-1]=[lat,lon];if(editorV13.loopLocked!==false){editorV13.route[0]=[lat,lon];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=lat;s.lon=lon}}}saveEditorV13();drawRouteV15();setSelectedV15({type:'cp',id});toast('КП обновлена')}
function deleteCpV15(id){const cp=editorV13.cps.find(x=>x.id===id);if(!cp||cp.locked){toast('Старт и финиш удалять нельзя');return}pushHistoryV13();editorV13.cps=editorV13.cps.filter(x=>x.id!==id);saveEditorV13();selectedV13=null;drawRouteV15();refreshPanelV15();toast('КП удалена')}
function addCpMapV15(lat,lon){pushHistoryV13();const id='u'+Date.now();editorV13.cps.push({id,title:'Новая контрольная точка',lat,lon,stopMin:0,locked:false});saveEditorV13();drawRouteV15();setSelectedV15({type:'cp',id});toast('КП добавлена — координаты уже рассчитаны')}

function chooseRangeAnchorV15(i){if(rangeStartV15===null){rangeStartV15=i;selectedV13={type:'vertex',index:i};refreshSelectionV15();refreshPanelV15();toast('Начало выбрано. Теперь выбери конец участка.');return}if(i===rangeStartV15){rangeStartV15=null;refreshSelectionV15();refreshPanelV15();return}const a=rangeStartV15,b=i;rangeStartV15=null;routeRangeBrouterV15(a,b)}
function chooseRangeOnSegmentV15(i,ll){const idx=insertPointAtV15(i,ll.lat,ll.lng);drawRouteV15();chooseRangeAnchorV15(idx)}
async function fetchBrouterV15(a,b){const u=`https://brouter.de/brouter?lonlats=${a[1]},${a[0]}%7C${b[1]},${b[0]}&profile=trekking&alternativeidx=0&format=geojson`,r=await fetch(u);if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json(),c=j?.features?.[0]?.geometry?.coordinates||j?.geometry?.coordinates;if(!Array.isArray(c)||c.length<2)throw new Error('no geometry');return c.map(x=>[+x[1],+x[0]])}
async function routeRangeBrouterV15(i1,i2){if(lastBrouterPendingV13)return;let a=Math.min(i1,i2),b=Math.max(i1,i2);if(b-a<1)return;lastBrouterPendingV13=true;toast('Прокладываю выбранный фрагмент по дорогам и тропам OSM…');try{const repl=await fetchBrouterV15(editorV13.route[a],editorV13.route[b]);pushHistoryV13();const oldCount=b-a+1,delta=repl.length-oldCount,next={};Object.entries(editorV13.terrain).forEach(([k,v])=>{const n=+k;if(n<a)next[n]=v;else if(n>=b)next[n+delta]=v});for(let n=a;n<a+repl.length-1;n++)next[n]='trail';editorV13.route.splice(a,oldCount,...repl);editorV13.terrain=next;saveEditorV13();routeActionV15='select';selectedV13={type:'segment',index:a};drawRouteV15();refreshPanelV15();toast('Фрагмент перестроен по OSM. Если не подходит — ↶')}catch(e){routeActionV15='select';toast('OSM не смог построить этот фрагмент. Маршрут не изменён.')}finally{lastBrouterPendingV13=false;rangeStartV15=null}}
async function routeOneSegmentV15(i){return routeRangeBrouterV15(i,i+1)}

function panelV15(){if(!editorModeV13)return editorPanelV13();let sel='';if(selectedV13?.type==='vertex'){const i=selectedV13.index,p=editorV13.route[i],end=i===0?'Старт':i===editorV13.route.length-1?'Финиш':`Точка ${i+1}`;sel=`<div class="editor-card-v13"><small>${end}</small><strong id="pointCoordsV15">${p[0].toFixed(6)}, ${p[1].toFixed(6)}</strong><div class="coord-grid-v15"><label>Широта<input id="vertexLatV15" type="number" step="0.000001" value="${p[0].toFixed(6)}"></label><label>Долгота<input id="vertexLonV15" type="number" step="0.000001" value="${p[1].toFixed(6)}"></label></div><div class="editor-inline-v13"><button class="btn sand sm" data-save-point-v15="${i}">Применить координаты</button><button class="btn alt sm" data-delete-point-v15="${i}" ${i===0||i===editorV13.route.length-1?'disabled':''}>Удалить точку</button></div>${(i===0||i===editorV13.route.length-1)?`<label class="loop-toggle-v15"><input id="loopLockV15" type="checkbox" ${editorV13.loopLocked!==false?'checked':''}><span><b>Старт и финиш совпадают</b><small>При перемещении одной конечной точки вторая двигается вместе с ней.</small></span></label>`:''}<div class="editor-help-v15">Перетаскивание двигает только эту точку. Соседние точки маршрута больше не смещаются автоматически.</div></div>`}
else if(selectedV13?.type==='segment'){const i=selectedV13.index,t=editorV13.terrain[i]||'unknown',a=editorV13.route[i],b=editorV13.route[i+1];sel=`<div class="editor-card-v13"><small>Участок ${i+1}</small><strong>${(havV13(a,b)*DISTANCE_CAL_V13/1000).toFixed(2).replace('.',',')} км</strong><label>Тип движения<select data-terrain-v15="${i}">${Object.entries(TERRAIN_V13).map(([k,v])=>`<option value="${k}" ${k===t?'selected':''}>${v.label}</option>`).join('')}</select></label><div class="editor-inline-v13"><button class="btn sand sm" data-route-one-v15="${i}">По тропе этот участок</button><button class="btn alt sm" data-split-v15="${i}">+ Точка в середине</button></div><div class="editor-help-v15">Для длинного фрагмента включи сверху «По тропе A→B» и укажи начало и конец на карте.</div></div>`}
else if(selectedV13?.type==='cp'){const cp=editorV13.cps.find(x=>x.id===selectedV13.id),d=dynamicCpsV13().find(x=>x.id===selectedV13.id);if(cp)sel=`<div class="editor-card-v13"><small>${d?.number==='С'?'Старт':d?.number==='Ф'?'Финиш':`КП ${d?.number||''}`} · ${gridCodeDynamicV13(cp.lat,cp.lon)}</small><label>Название<input id="cpTitleV15" value="${esc(cp.title)}"></label><label>Остановка, мин<input id="cpStopV15" type="number" min="0" max="240" value="${cp.stopMin||0}"></label><div class="coord-grid-v15"><label>Широта<input id="cpLatV15" type="number" step="0.000001" value="${cp.lat.toFixed(6)}"></label><label>Долгота<input id="cpLonV15" type="number" step="0.000001" value="${cp.lon.toFixed(6)}"></label></div><div class="editor-inline-v13"><button class="btn sand sm" data-save-cp-v15="${cp.id}">Сохранить КП</button><button class="btn alt sm" data-delete-cp-v15="${cp.id}" ${cp.locked?'disabled':''}>Удалить КП</button></div><p>${d?`${d.km.toFixed(1).replace('.',',')} км от старта · ETA ${d.arrival}`:''}</p></div>`}
else if(editorToolV13==='grid')return editorPanelV13();
const empty=`<div class="editor-empty-v13"><strong>${editorToolV13==='route'?'Выбери точку или участок':editorToolV13==='cp'?'Добавь или выбери КП':'Сетка'}</strong><p>${editorToolV13==='route'?(routeActionV15==='add'?'Клик по карте добавит одну точку маршрута.':'Ничего не двигается само: выбери белую точку и перетащи её.'):editorToolV13==='cp'?'Клик по карте добавит КП точно в выбранных координатах.':'Настрой сетку.'}</p></div>`;return `<div class="editor-summary-v13"><div class="editor-stat-v13"><span>Длина</span><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong></div><div class="editor-stat-v13"><span>Финиш</span><strong>${finalEtaV13()}</strong></div><div class="editor-stat-v13"><span>КП</span><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong></div></div>${sel||empty}`}
editorPanelV13=panelV15;

function toolbarV15(){return `<div class="editor-toolbar-v15">${!editorModeV13?`<button class="btn sand" id="beginEditV15">Редактировать маршрут</button>`:`<span class="editor-state-v15 ${editDirtyV15?'dirty':''}" id="editorStateV15">${editDirtyV15?'Есть несохранённые изменения':'Изменений нет'}</span><button class="btn editor-save-v15" id="saveEditV15">Сохранить изменения</button><button class="btn alt editor-discard-v15" id="discardEditV15">Не сохранять</button><button class="icon-btn" id="undoV15" ${undoV13.length?'':'disabled'} title="Отменить">↶</button><button class="icon-btn" id="redoV15" ${redoV13.length?'':'disabled'} title="Повторить">↷</button><button class="btn alt" id="resetPdfV15">Вернуть PDF</button>`}<button class="btn alt" id="gpxV15">GPX</button><button class="btn alt" id="pdfV15">PDF / печать</button></div>`}
editorToolbarV13=toolbarV15;
function toolstripV15(){if(!editorModeV13)return '';const hint=editorToolV13==='route'?(routeActionV15==='add'?'Добавление одной точки: кликни в нужном месте на карте.':routeActionV15==='path'?(rangeStartV15===null?'По тропе A→B: выбери начало на линии или белой точке.':'Начало выбрано. Теперь укажи конец фрагмента.'):'Выбор: двигай одну белую точку или кликни по участку. Ничего соседнее не двигается.'):(editorToolV13==='cp'?'КП: клик по карте добавляет точку; существующую можно перетащить.':'Сетка: размер и смещение настраиваются справа.');return `<div class="route-toolstrip-v15"><div class="route-toolgroup-v15"><button class="route-tool-v15 ${editorToolV13==='route'?'active':''}" data-tool-v15="route">Линия</button><button class="route-tool-v15 ${editorToolV13==='cp'?'active':''}" data-tool-v15="cp">КП</button><button class="route-tool-v15 ${editorToolV13==='grid'?'active':''}" data-tool-v15="grid">Сетка</button></div>${editorToolV13==='route'?`<div class="route-toolgroup-v15"><button class="route-tool-v15 ${routeActionV15==='select'?'active':''}" data-action-v15="select">Выбрать / двигать</button><button class="route-tool-v15 ${routeActionV15==='add'?'active':''}" data-action-v15="add">+ Точка</button><button class="route-tool-v15 path ${routeActionV15==='path'?'active':''}" data-action-v15="path">По тропе A→B</button></div>`:''}<div class="route-hint-v15">${rangeStartV15!==null?`<span class="path-progress-v15">A выбрана · точка ${rangeStartV15+1}</span> `:''}${hint}</div></div>`}

function refreshPanelV15(){const p=document.getElementById('editorPanelV15');if(p){p.innerHTML=panelV15();bindPanelV15()}const l=document.getElementById('routeLenV15');if(l)l.textContent=`${(routeLenV13()/1000).toFixed(1).replace('.',',')} км`;const f=document.getElementById('routeFinishV15');if(f)f.textContent=finalEtaV13();const c=document.getElementById('routeCpCountV15');if(c)c.textContent=String(dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length);dirtyV15()}
function bindPanelV15(){document.querySelectorAll('[data-save-point-v15]').forEach(b=>b.onclick=()=>applyPointCoordsV15(+b.dataset.savePointV15));document.querySelectorAll('[data-delete-point-v15]').forEach(b=>b.onclick=()=>deletePointV15(+b.dataset.deletePointV15));document.querySelectorAll('[data-split-v15]').forEach(b=>b.onclick=()=>splitSegmentV15(+b.dataset.splitV15));document.querySelectorAll('[data-route-one-v15]').forEach(b=>b.onclick=()=>routeOneSegmentV15(+b.dataset.routeOneV15));document.querySelectorAll('[data-terrain-v15]').forEach(s=>s.onchange=()=>{pushHistoryV13();editorV13.terrain[+s.dataset.terrainV15]=s.value;saveEditorV13();drawRouteV15();setSelectedV15({type:'segment',index:+s.dataset.terrainV15})});document.querySelectorAll('[data-save-cp-v15]').forEach(b=>b.onclick=()=>applyCpV15(b.dataset.saveCpV15));document.querySelectorAll('[data-delete-cp-v15]').forEach(b=>b.onclick=()=>deleteCpV15(b.dataset.deleteCpV15));document.getElementById('loopLockV15')?.addEventListener('change',e=>{editorV13.loopLocked=e.target.checked;saveEditorV13();refreshPanelV15()});bindPanelV14()}

function mountMapV15(){const el=document.getElementById('routeMapFinal');if(!el)return;if(routeMapV11){try{routeMapV11.remove()}catch(e){}routeMapV11=null;routeLayerV11=null;routeMarkersV11={}}dynamicGridLayerV13=null;dynamicGridSelectedV13=null;if(!window.L){el.innerHTML=`<div class="map-fallback-v11">${mapSvgV10()}<small>Онлайн-карта недоступна.</small></div>`;return}el.innerHTML='';routeMapV11=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:110,minZoom:12,maxZoom:19,fadeAnimation:false,markerZoomAnimation:false});routeLayerV11=makeTileV11(routeBaseV11).addTo(routeMapV11);if(gridEnabledV12){dynamicGridLayerV13=buildGridDynamicV13(routeMapV11);dynamicGridLayerV13.addTo(routeMapV11)}drawRouteV15();if(routeViewportV14){routeMapV11.setView([routeViewportV14.lat,routeViewportV14.lng],routeViewportV14.zoom,{animate:false});routeViewportV14=null}else routeMapV11.fitBounds(L.latLngBounds(editorV13.route),{padding:[34,34],animate:false});const Fit=L.Control.extend({onAdd(){const b=L.DomUtil.create('button','leaflet-bar fit-route-v11');b.type='button';b.innerHTML='⌂';b.title='Весь маршрут';L.DomEvent.disableClickPropagation(b);L.DomEvent.on(b,'click',()=>routeMapV11.fitBounds(L.latLngBounds(editorV13.route),{padding:[34,34],animate:true}));return b}});new Fit({position:'topleft'}).addTo(routeMapV11);routeMapV11.on('zoomend',()=>{if(editorModeV13&&editorToolV13==='route')drawRouteV15();if(gridEnabledV12)refreshGridV13()});routeMapV11.on('click',e=>{if(editorModeV13){if(editorToolV13==='cp')return addCpMapV15(e.latlng.lat,e.latlng.lng);if(editorToolV13==='route'&&routeActionV15==='add')return addPointMapV15(e.latlng.lat,e.latlng.lng);if(editorToolV13==='grid')return handleGridClickDynamicV13(e);if(editorToolV13==='route'&&routeActionV15==='select')return setSelectedV15(null)}else handleGridClickDynamicV13(e)});setTimeout(()=>routeMapV11&&routeMapV11.invalidateSize(false),100);updateGridStatusV13()}
mountRouteMapV13=mountMapV15;mountRouteMapV10=mountMapV15;

function routePageV15(){const body=routeModeV9==='points'?section('Контрольные точки',`<div class="cp-head"><span>КП</span><span>Точка</span><span>Км</span><span>ETA</span></div><div class="cp-list cp-list-v15">${cpRowsDynamicV13()}</div>`,'Координаты, километраж и ETA пересчитываются из текущей геометрии.'):routeModeV9==='navigation'?section('Переходы и азимуты',`<div class="navigation-note"><strong>Автопересчёт</strong><p>После сохранения маршрута расстояния, тип движения, ETA и азимуты используются в маршрутном бланке и PDF.</p></div><div class="nav-leg-list nav-leg-list-v15">${dynamicNavRowsV13()}</div>`):section('Полевой атлас и экспорт',`<div class="atlas-source"><div class="atlas-source__number">PDF</div><div><b>Редактор является источником атласа</b><p>Сохранённые линия, КП, сетка, скорости и остановки используются при формировании печатной версии.</p></div></div><div class="materials-list">${materialRowsV10()}</div>`);return `${pageHead('Навигация','Маршрут','Точное редактирование линии, контрольных точек и сетки с явным сохранением изменений.',toolbarV15())}${editorModeV13?`<div class="route-unsaved-banner-v15"><strong>Черновик:</strong> изменения не попадут в сохранённый маршрут, пока не нажмёшь «Сохранить изменения».</div>`:''}${toolstripV15()}<div class="route-layout route-layout-v10 route-editor-layout-v13"><div class="route-map"><div class="route-map-head-v11"><div><small>${editorModeV13?'Редактор':'Маршрут'}</small><strong>Томинский лесопарк · <span id="routeLenV15">${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</span></strong></div><div class="map-controls-v12"><div class="map-layer-switch-v11"><button type="button" data-map-layer-v11="osm" class="${routeBaseV11==='osm'?'active':''}">Карта</button><button type="button" data-map-layer-v11="sat" class="${routeBaseV11==='sat'?'active':''}">Спутник</button></div><button type="button" class="grid-toggle-v12 ${gridEnabledV12?'active':''}" data-grid-toggle-v12>Сетка ${gridCfgV13().cell} м</button></div></div><div class="map-shell-v11"><div id="routeMapFinal" class="leaflet-map leaflet-map-v11 ${routeActionV15==='path'?'edit-path-v15':''}"></div><div class="route-loading-v11">Загрузка подложки…</div></div><div class="route-map-foot-v11"><span>Колесо — масштаб</span><span>⌂ — весь маршрут</span><span>${editorModeV13?'Белые точки — узлы линии':'Клик по КП в списке — перейти'}</span></div></div><aside class="route-summary route-editor-panel-v15"><div id="editorPanelV15">${panelV15()}</div></aside></div><div class="segmented route-tabs"><button class="${routeModeV9==='points'?'active':''}" data-route-v9="points">КП</button><button class="${routeModeV9==='navigation'?'active':''}" data-route-v9="navigation">Навигация</button><button class="${routeModeV9==='atlas'?'active':''}" data-route-v9="atlas">Атлас</button></div>${body}`}
routePage=routePageV15;

function routeSheetRowsV15(){const cps=dynamicCpsV13();return cps.map((cp,i)=>{const prev=i?cps[i-1]:null,next=i<cps.length-1?cps[i+1]:null,leg=prev?Math.max(0,cp.km-prev.km):0,az=next?Math.round(bearingV13([cp.lat,cp.lon],[next.lat,next.lon])):null;return `<tr><td class="num">${cp.number}</td><td><b>${esc(cp.title)}</b><small>${gridCodeDynamicV13(cp.lat,cp.lon)}</small></td><td>${leg?leg.toFixed(1).replace('.',','):'—'} км</td><td>${cp.km.toFixed(1).replace('.',',')} км</td><td><b>${cp.arrival}</b>${cp.stopMin?`<small>стоп ${cp.stopMin} мин</small>`:''}</td><td>${az===null?'—':az+'°'}</td><td class="coords">${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</td></tr>`}).join('')}
function planPageV15(){const timeline=`<div class="timeline-head"><span>Время</span><span>Этап</span><span>Ответственный</span><span>Маршрут</span><span></span></div>${S.timeline.map(t=>`<div class="timeline-row"><div class="timeline-time">${esc(t.time)}</div><div><b>${esc(t.title)}</b><small>${esc(t.note||'')}</small></div><div>${esc(pn(t.owner))}</div><div>${t.route?esc(routeName(t.route)):'—'}</div><div class="row-actions"><button class="icon-btn" data-edit-time="${t.id}" title="Редактировать">✎</button><button class="icon-btn" data-del-time="${t.id}" title="Удалить">×</button></div></div>`).join('')}`;return `${pageHead('Расчёт маршрута','План','Маршрутный бланк строится автоматически из сохранённой линии, КП, скоростей и остановок.',`<button class="btn sand" id="addTimeline">Добавить орг. этап</button>`)}<div class="plan-auto-summary-v13"><div><small>Старт</small><strong>${editorV13.start}</strong></div><div><small>Финиш</small><strong>${finalEtaV13()}</strong></div><div><small>Длина</small><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong></div><div><small>КП</small><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong></div></div>${section('Параметры расчёта',`<div class="route-plan-controls-v15"><div class="route-plan-start-v15"><label>Время старта<input type="time" id="routeStartV15" value="${editorV13.start}"></label></div><div class="speed-row-v15">${Object.entries(TERRAIN_V13).map(([k,v])=>`<label><span>${v.label}</span><input type="number" min="0.5" max="8" step="0.1" data-speed-v15="${k}" value="${editorV13.speeds[k]??v.speed}"></label>`).join('')}</div></div>`,'Скорость задаётся в км/ч. Время каждой КП учитывает длину участков и остановки.')}${section('Маршрутный бланк',`<div class="route-form-v15"><table class="route-form-table-v15"><thead><tr><th>КП</th><th>Точка / квадрат</th><th>От предыдущей</th><th>Всего</th><th>ETA / стоп</th><th>Азимут дальше</th><th>WGS84</th></tr></thead><tbody>${routeSheetRowsV15()}</tbody></table></div>`,'Эти же данные используются при экспорте печатного атласа.')}${section('Организационный таймлайн',timeline,'Это отдельный командный план. Маршрутный расчёт выше меняется автоматически.')}`}
planPage=planPageV15;

const bindV15Base=bind;bind=function(){bindV15Base();document.getElementById('beginEditV15')?.addEventListener('click',beginEditV15);document.getElementById('saveEditV15')?.addEventListener('click',saveAndExitV15);document.getElementById('discardEditV15')?.addEventListener('click',discardAndExitV15);document.getElementById('undoV15')?.addEventListener('click',()=>{undoEditorV13();dirtyV15()});document.getElementById('redoV15')?.addEventListener('click',()=>{redoEditorV13();dirtyV15()});document.getElementById('resetPdfV15')?.addEventListener('click',()=>{if(confirm('Вернуть черновик к исходному маршруту PDF?')){editorV13=defaultEditorV13();saveEditorV13();selectedV13=null;rangeStartV15=null;drawRouteV15();refreshPanelV15()}});document.getElementById('gpxV15')?.addEventListener('click',downloadEditedGpxV13);document.getElementById('pdfV15')?.addEventListener('click',openAtlasPrintV13);document.querySelectorAll('[data-tool-v15]').forEach(b=>b.onclick=()=>{editorToolV13=b.dataset.toolV15;routeActionV15='select';rangeStartV15=null;selectedV13=null;renderPreserveV14()});document.querySelectorAll('[data-action-v15]').forEach(b=>b.onclick=()=>{routeActionV15=b.dataset.actionV15;rangeStartV15=null;selectedV13=null;renderPreserveV14()});bindPanelV15();document.querySelectorAll('[data-cp-dyn-v13]').forEach(b=>b.onclick=()=>{const cp=editorV13.cps.find(x=>x.id===b.dataset.cpDynV13);if(cp&&routeMapV11){routeMapV11.setView([cp.lat,cp.lon],15,{animate:true});setSelectedV15({type:'cp',id:cp.id})}});document.getElementById('routeStartV15')?.addEventListener('change',e=>{editorV13.start=e.target.value||'10:00';saveEditorV13();render();toast('Время старта обновлено')});document.querySelectorAll('[data-speed-v15]').forEach(i=>i.onchange=()=>{editorV13.speeds[i.dataset.speedV15]=Math.max(.5,Math.min(8,+i.value||4));saveEditorV13();render();toast('Скорость обновлена')});document.querySelectorAll('[data-grid-toggle-v12]').forEach(b=>b.onclick=()=>{gridEnabledV12=!gridEnabledV12;refreshGridV13();b.classList.toggle('active',gridEnabledV12)});document.querySelectorAll('[data-map-layer-v11]').forEach(b=>b.onclick=()=>{const kind=b.dataset.mapLayerV11;if(kind===routeBaseV11)return;replaceBaseV11(routeMapV11,document.querySelector('.map-shell-v11'),kind,false);document.querySelectorAll('[data-map-layer-v11]').forEach(x=>x.classList.toggle('active',x.dataset.mapLayerV11===kind))});if(tab==='route')requestAnimationFrame(mountMapV15)};

if(editorV13.loopLocked===undefined)editorV13.loopLocked=true;
const buildV15=document.querySelector('.build-label');if(buildV15)buildV15.textContent='V9 · точный редактор / сохранить или отменить';
render();


;/* source: hikes-preview/route-v15-fix.js */
/* V9.1 — fix panel recursion and keep grid editor compatible */
function panelV15(){
  if(!editorModeV13)return `<div class="metric"><small>Расчётная длина</small><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong><em>по сохранённой линии</em></div><div class="metric"><small>Расчётный финиш</small><strong>${finalEtaV13()}</strong><em>${fmtDurationV13(routeDurationMinV13())}</em></div><div class="metric"><small>КП</small><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong><em>координаты и ETA</em></div><div class="metric"><small>Сетка</small><strong>${gridCfgV13().cell} × ${gridCfgV13().cell} м</strong><em>${editorV13.grid.offsetX||editorV13.grid.offsetY?'со смещением':'по PDF'}</em></div>`;
  let sel='';
  if(selectedV13?.type==='vertex'){
    const i=selectedV13.index,p=editorV13.route[i],end=i===0?'Старт':i===editorV13.route.length-1?'Финиш':`Точка ${i+1}`;
    sel=`<div class="editor-card-v13"><small>${end}</small><strong id="pointCoordsV15">${p[0].toFixed(6)}, ${p[1].toFixed(6)}</strong><div class="coord-grid-v15"><label>Широта<input id="vertexLatV15" type="number" step="0.000001" value="${p[0].toFixed(6)}"></label><label>Долгота<input id="vertexLonV15" type="number" step="0.000001" value="${p[1].toFixed(6)}"></label></div><div class="editor-inline-v13"><button class="btn sand sm" data-save-point-v15="${i}">Применить координаты</button><button class="btn alt sm" data-delete-point-v15="${i}" ${i===0||i===editorV13.route.length-1?'disabled':''}>Удалить точку</button></div>${(i===0||i===editorV13.route.length-1)?`<label class="loop-toggle-v15"><input id="loopLockV15" type="checkbox" ${editorV13.loopLocked!==false?'checked':''}><span><b>Старт и финиш совпадают</b><small>Если включено, перемещение лагеря меняет обе конечные точки.</small></span></label>`:''}<div class="editor-help-v15">Перетаскивание меняет только выбранную точку. Соседние узлы остаются на своих координатах.</div></div>`;
  } else if(selectedV13?.type==='segment'){
    const i=selectedV13.index,t=editorV13.terrain[i]||'unknown',a=editorV13.route[i],b=editorV13.route[i+1];
    sel=`<div class="editor-card-v13"><small>Участок ${i+1}</small><strong>${(havV13(a,b)*DISTANCE_CAL_V13/1000).toFixed(2).replace('.',',')} км</strong><label>Тип движения<select data-terrain-v15="${i}">${Object.entries(TERRAIN_V13).map(([k,v])=>`<option value="${k}" ${k===t?'selected':''}>${v.label}</option>`).join('')}</select></label><div class="editor-inline-v13"><button class="btn sand sm" data-route-one-v15="${i}">По тропе этот участок</button><button class="btn alt sm" data-split-v15="${i}">+ Точка в середине</button></div><div class="editor-help-v15">На самой линии также появляется кнопка «+». Добавь точку и затем смести только её.</div></div>`;
  } else if(selectedV13?.type==='cp'){
    const cp=editorV13.cps.find(x=>x.id===selectedV13.id),d=dynamicCpsV13().find(x=>x.id===selectedV13.id);
    if(cp)sel=`<div class="editor-card-v13"><small>${d?.number==='С'?'Старт':d?.number==='Ф'?'Финиш':`КП ${d?.number||''}`} · ${gridCodeDynamicV13(cp.lat,cp.lon)}</small><label>Название<input id="cpTitleV15" value="${esc(cp.title)}"></label><label>Остановка, мин<input id="cpStopV15" type="number" min="0" max="240" value="${cp.stopMin||0}"></label><div class="coord-grid-v15"><label>Широта<input id="cpLatV15" type="number" step="0.000001" value="${cp.lat.toFixed(6)}"></label><label>Долгота<input id="cpLonV15" type="number" step="0.000001" value="${cp.lon.toFixed(6)}"></label></div><div class="editor-inline-v13"><button class="btn sand sm" data-save-cp-v15="${cp.id}">Сохранить КП</button><button class="btn alt sm" data-delete-cp-v15="${cp.id}" ${cp.locked?'disabled':''}>Удалить КП</button></div><p>${d?`${d.km.toFixed(1).replace('.',',')} км от старта · ETA ${d.arrival}`:''}</p></div>`;
  } else if(editorToolV13==='grid'){
    const g=editorV13.grid;
    sel=`<div class="editor-card-v13"><small>Координатная сетка</small><label>Размер клетки<select id="gridCellV14">${[100,200,250,500].map(v=>`<option value="${v}" ${+g.cell===v?'selected':''}>${v} × ${v} м</option>`).join('')}<option value="custom" ${![100,200,250,500].includes(+g.cell)?'selected':''}>Свой размер</option></select></label><label>Свой размер, м<input id="gridCustomV14" type="number" min="50" max="1000" step="10" value="${+g.cell||200}"></label><div class="grid-nudge-v14"><span></span><button data-grid-nudge-v14="up">↑</button><span></span><button data-grid-nudge-v14="left">←</button><button type="button" class="grid-nudge-center-v14">${+g.offsetX||0}; ${+g.offsetY||0}</button><button data-grid-nudge-v14="right">→</button><span></span><button data-grid-nudge-v14="down">↓</button><span></span></div><div class="editor-grid2-v13"><label>Смещение X, м<input id="gridOffsetXV14" type="number" step="10" value="${+g.offsetX||0}"></label><label>Смещение Y, м<input id="gridOffsetYV14" type="number" step="10" value="${+g.offsetY||0}"></label></div><div class="editor-inline-v13"><button class="btn sand sm" id="applyGridV14">Применить</button><button class="btn alt sm" id="resetGridV14">PDF 200 м</button></div><p>Стрелки двигают сетку по 25 м. Поля ниже задают точное смещение.</p></div>`;
  }
  const empty=`<div class="editor-empty-v13"><strong>${editorToolV13==='route'?'Выбери точку или участок':editorToolV13==='cp'?'Добавь или выбери КП':'Сетка'}</strong><p>${editorToolV13==='route'?(routeActionV15==='add'?'Клик по карте добавит одну точку маршрута.':routeActionV15==='path'?'Укажи начало и конец участка прямо на линии.':'Выбери белую точку и двигай только её. Клик по участку откроет действия справа.'):editorToolV13==='cp'?'Клик по карте добавляет КП точно в выбранных координатах.':'Настрой размер и смещение сетки.'}</p></div>`;
  return `<div class="editor-summary-v13"><div class="editor-stat-v13"><span>Длина</span><strong>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</strong></div><div class="editor-stat-v13"><span>Финиш</span><strong>${finalEtaV13()}</strong></div><div class="editor-stat-v13"><span>КП</span><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong></div></div>${sel||empty}`;
}
editorPanelV13=panelV15;
const buildV151=document.querySelector('.build-label');if(buildV151)buildV151.textContent='V9.1 · точный редактор маршрута';
render();


;/* source: hikes-preview/route-v16.js */
/* V10 — in-place editor controls + explicit A/B trail routing */
let pathAV16=null,pathBV16=null,pathLayersV16=[],routeHitLayersV16=[],pathErrorV16='';

function clearHitV16(){routeHitLayersV16.forEach(l=>{try{routeMapV11?.removeLayer(l)}catch(e){}});routeHitLayersV16=[]}
function clearPathLayersV16(){pathLayersV16.forEach(l=>{try{routeMapV11?.removeLayer(l)}catch(e){}});pathLayersV16=[]}
function clearPathAnchorsV16(redraw=true){pathAV16=null;pathBV16=null;pathErrorV16='';clearPathLayersV16();if(redraw)refreshToolstripV16()}
function nearV16(a,b,m=0.6){return havV13(a,b)<=m}
function anchorMeasureV16(a){if(!a)return 0;return a.seg+(a.frac||0)}
function anchorFromLatLngV16(lat,lon){const n=nearestRouteV13(lat,lon);if(!n)return null;const a=editorV13.route[n.seg],b=editorV13.route[n.seg+1],d=Math.max(0.01,havV13(a,b)),frac=Math.max(0,Math.min(1,havV13(a,[n.lat,n.lon])/d));return {seg:n.seg,frac,lat:n.lat,lon:n.lon}}
function anchorFromVertexV16(i){const last=editorV13.route.length-1,p=editorV13.route[i];if(i>=last)return {seg:last-1,frac:1,lat:p[0],lon:p[1]};return {seg:i,frac:0,lat:p[0],lon:p[1]}}
function orderedAnchorsV16(){if(!pathAV16||!pathBV16)return null;return anchorMeasureV16(pathAV16)<=anchorMeasureV16(pathBV16)?[pathAV16,pathBV16]:[pathBV16,pathAV16]}
function pathPreviewPointsV16(){const ab=orderedAnchorsV16();if(!ab)return [];const [a,b]=ab,pts=[[a.lat,a.lon]];for(let i=a.seg+1;i<=b.seg;i++)pts.push(editorV13.route[i]);pts.push([b.lat,b.lon]);return pts.filter((p,i,arr)=>!i||!nearV16(p,arr[i-1],.2))}
function pathAnchorIconV16(label){return L.divIcon({className:'',html:`<span class="path-anchor-v16">${label}</span>`,iconSize:[30,30],iconAnchor:[15,15]})}
function renderPathAnchorsV16(){clearPathLayersV16();if(!routeMapV11||routeActionV15!=='path')return;if(pathAV16){const m=L.marker([pathAV16.lat,pathAV16.lon],{icon:pathAnchorIconV16('A'),zIndexOffset:1800,interactive:false}).addTo(routeMapV11);pathLayersV16.push(m)}if(pathBV16){const m=L.marker([pathBV16.lat,pathBV16.lon],{icon:pathAnchorIconV16('B'),zIndexOffset:1800,interactive:false}).addTo(routeMapV11);pathLayersV16.push(m)}if(pathAV16&&pathBV16){const pts=pathPreviewPointsV16();if(pts.length>1){const l=L.polyline(pts,{color:'#c7a65a',weight:9,opacity:.62,dashArray:'7 7',interactive:false,lineCap:'round'}).addTo(routeMapV11);l.bringToBack();pathLayersV16.push(l)}}}
function pickPathAnchorV16(lat,lon){const a=anchorFromLatLngV16(lat,lon);if(!a)return;if(!pathAV16){pathAV16=a;pathBV16=null;pathErrorV16='';toast('Точка A выбрана. Теперь выбери B на маршруте.')}else if(!pathBV16){if(Math.abs(anchorMeasureV16(a)-anchorMeasureV16(pathAV16))<0.01){toast('Точка B должна быть дальше от A');return}pathBV16=a;pathErrorV16='';toast('A и B выбраны. Нажми «Проложить по тропе».')}else{pathAV16=a;pathBV16=null;pathErrorV16='';toast('Новая точка A выбрана. Теперь выбери B.')}renderPathAnchorsV16();refreshToolstripV16()}
function pickPathVertexV16(i){const a=anchorFromVertexV16(i);pickPathAnchorV16(a.lat,a.lon)}

function routeToolstripV16(){if(!editorModeV13)return '';let hint='';if(editorToolV13==='route'){if(routeActionV15==='add')hint='Добавление точки: нажми прямо на линию маршрута. Масштаб и положение карты не изменятся.';else if(routeActionV15==='path')hint=!pathAV16?'Шаг 1 из 2: нажми на маршрут в месте начала фрагмента.':!pathBV16?'Шаг 2 из 2: нажми на маршрут в месте окончания фрагмента.':'A и B зафиксированы. Проверь выделенный фрагмент и только потом запускай прокладку.';else hint='Выбор: перетаскивай одну белую точку или нажми на участок. Переключение инструментов больше не перезагружает карту.'}else if(editorToolV13==='cp')hint='КП: клик по карте добавляет точку; существующую можно перетаскивать.';else hint='Сетка: размер и смещение настраиваются справа.';return `<div class="route-toolstrip-v15 route-toolstrip-v16" id="routeToolstripV16"><div class="route-toolgroup-v15"><button class="route-tool-v15 ${editorToolV13==='route'?'active':''}" data-tool-v16="route">Линия</button><button class="route-tool-v15 ${editorToolV13==='cp'?'active':''}" data-tool-v16="cp">КП</button><button class="route-tool-v15 ${editorToolV13==='grid'?'active':''}" data-tool-v16="grid">Сетка</button></div>${editorToolV13==='route'?`<div class="route-toolgroup-v15"><button class="route-tool-v15 ${routeActionV15==='select'?'active':''}" data-action-v16="select">Выбрать / двигать</button><button class="route-tool-v15 ${routeActionV15==='add'?'active':''}" data-action-v16="add">+ Точка</button><button class="route-tool-v15 path ${routeActionV15==='path'?'active':''}" data-action-v16="path">По тропе</button></div>`:''}${editorToolV13==='route'&&routeActionV15==='path'?`<div class="path-flow-v16"><div class="path-steps-v16"><span class="${pathAV16?'done':'active'}"><b>A</b>${pathAV16?'выбрана':'начало'}</span><i>→</i><span class="${pathBV16?'done':pathAV16?'active':''}"><b>B</b>${pathBV16?'выбрана':'конец'}</span></div><button class="btn sand sm" id="applyPathV16" ${pathAV16&&pathBV16?'':'disabled'}>${lastBrouterPendingV13?'Прокладываю…':'Проложить по тропе'}</button><button class="btn alt sm" id="clearPathV16" ${pathAV16||pathBV16?'':'disabled'}>Сбросить A/B</button></div>`:''}<div class="route-hint-v15 route-hint-v16">${pathErrorV16?`<span class="path-error-v16">${esc(pathErrorV16)}</span>`:hint}</div></div>`}
toolstripV15=routeToolstripV16;

function bindToolstripV16(){document.querySelectorAll('[data-tool-v16]').forEach(b=>b.onclick=()=>setToolV16(b.dataset.toolV16));document.querySelectorAll('[data-action-v16]').forEach(b=>b.onclick=()=>setActionV16(b.dataset.actionV16));document.getElementById('applyPathV16')?.addEventListener('click',applyPathRoutingV16);document.getElementById('clearPathV16')?.addEventListener('click',()=>clearPathAnchorsV16(true))}
function refreshToolstripV16(){const old=document.getElementById('routeToolstripV16');if(!old)return;const wrap=document.createElement('div');wrap.innerHTML=routeToolstripV16();const next=wrap.firstElementChild;old.replaceWith(next);bindToolstripV16()}
function setToolV16(tool){editorToolV13=tool;routeActionV15='select';selectedV13=null;clearPathAnchorsV16(false);drawRouteV16();refreshPanelV15();refreshToolstripV16()}
function setActionV16(action){routeActionV15=action;selectedV13=null;clearPathAnchorsV16(false);drawRouteV16();refreshPanelV15();refreshToolstripV16();if(action==='path')toast('Режим «По тропе»: сначала выбери A, затем B прямо на линии маршрута.')}

function addPointSnappedV16(lat,lon){const n=nearestRouteV13(lat,lon);if(!n)return;const d=havV13([lat,lon],[n.lat,n.lon]);if(d>140){toast('Нажми ближе к линии маршрута — точка добавляется на выбранный участок.');return}const idx=insertPointAtV15(n.seg,n.lat,n.lon);routeActionV15='select';drawRouteV16();setSelectedV15({type:'vertex',index:idx});refreshToolstripV16();toast('Точка добавлена на линию. Теперь её можно сместить.')}
addPointMapV15=addPointSnappedV16;

function clearRouteHitV16(){routeHitLayersV16.forEach(x=>{try{routeMapV11?.removeLayer(x)}catch(e){}});routeHitLayersV16=[]}
function handleRouteHitV16(i,ll){if(editorToolV13!=='route')return;if(routeActionV15==='path')return pickPathAnchorV16(ll.lat,ll.lng);if(routeActionV15==='add'){const n=nearestRouteV13(ll.lat,ll.lng);if(!n)return;const idx=insertPointAtV15(n.seg,n.lat,n.lon);routeActionV15='select';drawRouteV16();setSelectedV15({type:'vertex',index:idx});refreshToolstripV16();toast('Точка добавлена на этот участок.');return}setSelectedV15({type:'segment',index:i})}
function drawRouteV16(){if(!routeMapV11)return;clearEditLayersV13();clearMidV15();clearRouteHitV16();clearPathLayersV16();if(!editorModeV13){routeLineV13=L.polyline(editorV13.route,{color:'#6c22c7',weight:4,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.08,interactive:false}).addTo(routeMapV11)}else{
  for(let i=0;i<editorV13.route.length-1;i++){const visible=L.polyline([editorV13.route[i],editorV13.route[i+1]],{color:routeColorV13(i),weight:selectedV13?.type==='segment'&&selectedV13.index===i?8:5,opacity:selectedV13?.type==='segment'&&selectedV13.index!==i?.55:.95,interactive:false,lineCap:'round'}).addTo(routeMapV11);routeSegLayersV13.push(visible);if(editorToolV13==='route'){const hit=L.polyline([editorV13.route[i],editorV13.route[i+1]],{color:'#000',weight:18,opacity:.001,interactive:true,bubblingMouseEvents:false}).addTo(routeMapV11);hit.on('click',e=>{L.DomEvent.stopPropagation(e);handleRouteHitV16(i,e.latlng)});routeHitLayersV16.push(hit)}}
  if(editorToolV13==='route'){const step=visibleStepV15();editorV13.route.forEach((p,i)=>{if(i!==0&&i!==editorV13.route.length-1&&i%step!==0&&selectedV13?.index!==i)return;const m=L.marker(p,{icon:iconPointV15(i,selectedV13?.type==='vertex'&&selectedV13.index===i,false),draggable:routeActionV15==='select',zIndexOffset:(i===0||i===editorV13.route.length-1)?1500:1200}).addTo(routeMapV11);m._routeIndexV15=i;m.on('dragstart',()=>{pushHistoryV13();dragBaseV15=cloneV13(editorV13.route)});m.on('drag',ev=>{const ll=ev.target.getLatLng();editorV13.route[i]=[ll.lat,ll.lng];syncEndpointCpV15(i,ll);updateRouteGeomV15()});m.on('dragend',()=>{dragBaseV15=null;saveEditorV13();setSelectedV15({type:'vertex',index:i});refreshPanelV15();toast('Точка перемещена')});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);if(routeActionV15==='path')return pickPathVertexV16(i);if(routeActionV15==='add'){toast('Это уже существующая точка. Для новой нажми между точками на линии.');return}setSelectedV15({type:'vertex',index:i})});routeVertexLayersV13.push(m)})}
 }
 const cps=dynamicCpsV13();cps.forEach(cp=>{const interactive=!editorModeV13||editorToolV13==='cp',m=L.marker([cp.lat,cp.lon],{icon:iconCpV13(cp.number,selectedV13?.type==='cp'&&selectedV13.id===cp.id),draggable:editorModeV13&&editorToolV13==='cp',interactive,zIndexOffset:editorToolV13==='cp'?1350:700}).addTo(routeMapV11);m.bindTooltip(`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title} · ${gridCodeDynamicV13(cp.lat,cp.lon)}`,{direction:'top'});if(editorModeV13&&editorToolV13==='cp'){m.on('dragstart',()=>pushHistoryV13());m.on('dragend',ev=>{const ll=ev.target.getLatLng(),obj=editorV13.cps.find(x=>x.id===cp.id);if(!obj)return;obj.lat=ll.lat;obj.lon=ll.lng;if(cp.id==='cp0'){editorV13.route[0]=[ll.lat,ll.lng];if(editorV13.loopLocked!==false){editorV13.route[editorV13.route.length-1]=[ll.lat,ll.lng];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=ll.lat;f.lon=ll.lng}}}if(cp.id==='cpf'){editorV13.route[editorV13.route.length-1]=[ll.lat,ll.lng];if(editorV13.loopLocked!==false){editorV13.route[0]=[ll.lat,ll.lng];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=ll.lat;s.lon=ll.lng}}}saveEditorV13();drawRouteV16();setSelectedV15({type:'cp',id:cp.id});toast('КП перемещена')});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);setSelectedV15({type:'cp',id:cp.id})})}cpLayersV13[cp.id]=m});
 if(selectedV13?.type==='segment'&&routeActionV15==='select')showMidV15(selectedV13.index);renderPathAnchorsV16()}
drawRouteV15=drawRouteV16;drawRouteV13=drawRouteV16;

function appendRouteV16(state,p,t){if(!state.route.length){state.route.push(p);return}if(nearV16(state.route[state.route.length-1],p,.25))return;state.terrain[state.route.length-1]=t||'unknown';state.route.push(p)}
function replaceRangeWithRouteV16(repl){const ab=orderedAnchorsV16();if(!ab)return;const [a,b]=ab,oldR=editorV13.route,oldT=i=>editorV13.terrain[i]||'unknown',state={route:[],terrain:{}};appendRouteV16(state,oldR[0]);for(let i=0;i<a.seg;i++)appendRouteV16(state,oldR[i+1],oldT(i));const A=[a.lat,a.lon],B=[b.lat,b.lon];appendRouteV16(state,A,oldT(a.seg));const rr=repl.map(p=>[+p[0],+p[1]]);if(rr.length){rr[0]=A;rr[rr.length-1]=B;for(let i=1;i<rr.length;i++)appendRouteV16(state,rr[i],'trail')}else appendRouteV16(state,B,'trail');appendRouteV16(state,oldR[b.seg+1],oldT(b.seg));for(let i=b.seg+1;i<oldR.length-1;i++)appendRouteV16(state,oldR[i+1],oldT(i));editorV13.route=state.route;editorV13.terrain=state.terrain;if(editorV13.snapCps)snapAllCpsV13()}
async function applyPathRoutingV16(){if(!pathAV16||!pathBV16||lastBrouterPendingV13)return;lastBrouterPendingV13=true;pathErrorV16='';refreshToolstripV16();const ab=orderedAnchorsV16();try{const repl=await fetchBrouterV15([ab[0].lat,ab[0].lon],[ab[1].lat,ab[1].lon]);pushHistoryV13();replaceRangeWithRouteV16(repl);saveEditorV13();pathAV16=null;pathBV16=null;routeActionV15='select';selectedV13=null;drawRouteV16();refreshPanelV15();toast('Фрагмент перестроен по тропам OSM. Если не подходит — ↶')}catch(e){pathErrorV16='Не удалось построить этот фрагмент по OSM. Точки A/B сохранены — можно повторить или выбрать другой участок.';toast('Прокладка не удалась. A/B не сброшены.')}finally{lastBrouterPendingV13=false;refreshToolstripV16();renderPathAnchorsV16()}}

const bindV16Base=bind;bind=function(){bindV16Base();bindToolstripV16();if(tab==='route')setTimeout(()=>{renderPathAnchorsV16();updateDirtyUiV15()},0)};

const oldBeginV16=beginEditV15;beginEditV15=function(){oldBeginV16();pathAV16=null;pathBV16=null;pathErrorV16=''};
const oldSaveExitV16=saveAndExitV15;saveAndExitV15=function(){clearPathAnchorsV16(false);oldSaveExitV16()};
const oldDiscardExitV16=discardAndExitV15;discardAndExitV15=function(){clearPathAnchorsV16(false);oldDiscardExitV16()};

const buildV16=document.querySelector('.build-label');if(buildV16)buildV16.textContent='V10 · стабильное редактирование / понятная прокладка A→B';
render();


;/* source: hikes-preview/route-v17.js */
/* V11 — project export/import so edited local route can be shared */
const PROJECT_FORMAT_V17='raznye-ludi-hike-project';
function clonePlainV17(v){return JSON.parse(JSON.stringify(v))}
function projectPayloadV17(){
  let cps=[];try{cps=dynamicCpsV13().map(cp=>({id:cp.id,number:cp.number,title:cp.title,lat:cp.lat,lon:cp.lon,km:cp.km,arrival:cp.arrival,stopMin:cp.stopMin,grid:gridCodeDynamicV13(cp.lat,cp.lon)}))}catch(e){}
  return {
    format:PROJECT_FORMAT_V17,
    version:1,
    exportedAt:new Date().toISOString(),
    note:'Экспорт текущего состояния модуля «Разные люди — Походы». routeEditor содержит фактическую геометрию, КП, сетку, скорости и настройки расчёта.',
    event:clonePlainV17(S.event),
    appState:clonePlainV17(S),
    routeEditor:clonePlainV17(editorV13),
    view:{routeBase:typeof routeBaseV11!=='undefined'?routeBaseV11:'osm',overviewBase:typeof overviewBaseV11!=='undefined'?overviewBaseV11:'osm',gridEnabled:typeof gridEnabledV12!=='undefined'?gridEnabledV12:true},
    calculated:{distanceMeters:Math.round(routeLenV13()),distanceKm:+(routeLenV13()/1000).toFixed(3),finish:finalEtaV13(),cps}
  }
}
function projectFileNameV17(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return `tomilinsky-route-project-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`}
function downloadProjectV17(){try{const payload=projectPayloadV17(),blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=projectFileNameV17();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);toast(editDirtyV15?'Экспортирован текущий черновик проекта':'Проект маршрута скачан')}catch(e){console.error(e);toast('Не удалось экспортировать проект')}}
function validProjectV17(p){return p&&p.format===PROJECT_FORMAT_V17&&p.routeEditor&&Array.isArray(p.routeEditor.route)&&p.routeEditor.route.length>1&&Array.isArray(p.routeEditor.cps)}
async function importProjectFileV17(file){if(!file)return;try{const p=JSON.parse(await file.text());if(!validProjectV17(p)){toast('Это не файл проекта «Разные люди — Походы»');return}if(!confirm('Заменить текущий локальный маршрут данными из выбранного файла проекта?'))return;editorV13=clonePlainV17(p.routeEditor);if(p.appState&&p.appState.event){S=clonePlainV17(p.appState);save()}else if(p.event){S.event={...S.event,...p.event};save()}if(p.view){if(p.view.routeBase)routeBaseV11=p.view.routeBase;if(p.view.overviewBase)overviewBaseV11=p.view.overviewBase;if(typeof p.view.gridEnabled==='boolean')gridEnabledV12=p.view.gridEnabled}persistEditorV15();editBaseV15=null;editDirtyV15=false;editorModeV13=false;selectedV13=null;routeActionV15='select';pathAV16=null;pathBV16=null;render();toast('Проект импортирован')}catch(e){console.error(e);toast('Не удалось прочитать файл проекта')}}
const toolbarV17Base=editorToolbarV13;
editorToolbarV13=function(){const s=toolbarV17Base();return s.replace(/<\/div>\s*$/,'<button class="btn alt" id="exportProjectV17" title="Скачать полный проект с геометрией, КП, сеткой и расчётом">Проект JSON</button><button class="btn alt" id="importProjectV17">Импорт</button><input id="importProjectFileV17" type="file" accept="application/json,.json" hidden></div>')};
const bindV17Base=bind;
bind=function(){bindV17Base();document.getElementById('exportProjectV17')?.addEventListener('click',downloadProjectV17);document.getElementById('importProjectV17')?.addEventListener('click',()=>document.getElementById('importProjectFileV17')?.click());document.getElementById('importProjectFileV17')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importProjectFileV17(f);e.target.value=''})};
const buildV17=document.querySelector('.build-label');if(buildV17)buildV17.textContent='V11 · экспорт проекта для совместной правки';
render();


;/* source: hikes-preview/route-v18.js */
/* V12 — shared base route captured from Sergey's saved GPX export on 2026-09-09.
   Fresh sessions (and untouched old-base sessions) start from this geometry.
   Existing locally edited routes are never overwritten. */
const SHARED_ROUTE_REV_V18='2026-09-09-gpx-1';
const SHARED_ROUTE_V18=[[55.5760522,37.9578406],[55.576126,37.957683],[55.576,37.957374],[55.575709,37.956353],[55.575391,37.955849],[55.575181,37.955316],[55.575028,37.954991],[55.574922,37.954766],[55.57473,37.954359],[55.574194,37.953712],[55.573918,37.953565],[55.573696,37.953612],[55.57339,37.953879],[55.5731,37.954053],[55.572732,37.953969],[55.5725415,37.9540066],[55.5724882,37.9540171],[55.5725096,37.9518474],[55.5725827,37.9492826],[55.5727495,37.9493068],[55.572808,37.949198],[55.572903,37.949024],[55.574423,37.94904],[55.574872,37.948571],[55.575479,37.947641],[55.576525,37.945271],[55.5770953,37.9448569],[55.577395,37.944207],[55.577548,37.943901],[55.577689,37.943619],[55.577811,37.9435372],[55.578159,37.943255],[55.578706,37.943126],[55.579179,37.943055],[55.579301,37.943096],[55.579496,37.943226],[55.579901,37.943411],[55.580078,37.943385],[55.580387,37.943341],[55.580799,37.943391],[55.5811,37.943525],[55.581197,37.943577],[55.581288,37.943573],[55.58156,37.94327],[55.581991,37.942616],[55.582091,37.94251],[55.5822532,37.9424],[55.5822777,37.9423827],[55.58258,37.942202],[55.5828748,37.94196],[55.5828627,37.9416328],[55.583913,37.93936],[55.584418,37.937919],[55.584504,37.936545],[55.584201,37.931469],[55.5841119,37.9300083],[55.5841932,37.9299821],[55.584486,37.930078],[55.585289,37.929547],[55.585706,37.929486],[55.58661,37.929462],[55.586927,37.930032],[55.587074,37.9299035],[55.587187,37.929433],[55.587289,37.92943],[55.587249,37.929076],[55.587025,37.92814],[55.586941,37.927981],[55.58701,37.927538],[55.586936,37.927439],[55.586933,37.92734],[55.586827,37.927232],[55.586791,37.926959],[55.586786,37.926663],[55.586905,37.926569],[55.587218,37.926272],[55.587311,37.92625],[55.587388,37.926274],[55.587428,37.926226],[55.587456,37.926174],[55.587386,37.926025],[55.587161,37.925857],[55.5873963,37.9259322],[55.587431,37.925827],[55.587493,37.925757],[55.587555,37.925721],[55.587629,37.925752],[55.587666,37.925839],[55.587652,37.925913],[55.587598,37.926008],[55.587595,37.926112],[55.587653,37.92611],[55.587721,37.926076],[55.587791,37.926058],[55.587859,37.926072],[55.587932,37.926106],[55.587991,37.9262],[55.587952,37.926237],[55.587891,37.926271],[55.587702,37.926278],[55.587694,37.92634],[55.587715,37.926378],[55.587869,37.926416],[55.587953,37.926503],[55.58804,37.926528],[55.588096,37.926476],[55.588221,37.926331],[55.588329,37.926167],[55.588369,37.926065],[55.588335,37.925912],[55.588371,37.925787],[55.588429,37.925667],[55.588458,37.925536],[55.588535,37.925431],[55.588644,37.925327],[55.588866,37.925422],[55.588995,37.924913],[55.589068,37.924813],[55.589543,37.924008],[55.589568,37.923842],[55.589745,37.92341],[55.589831,37.923354],[55.589936,37.923233],[55.590264,37.922804],[55.590307,37.922686],[55.590327,37.922572],[55.590314,37.922434],[55.590363,37.922369],[55.590566,37.921838],[55.590656,37.92152],[55.590698,37.921258],[55.590838,37.921058],[55.591017,37.920744],[55.591208,37.920496],[55.591462,37.920358],[55.591588,37.920336],[55.591666,37.920099],[55.591891,37.919969],[55.591855,37.919465],[55.592,37.919325],[55.592225,37.919177],[55.592549,37.91933],[55.592716,37.919329],[55.5928067,37.9193384],[55.593047,37.918645],[55.593465,37.918082],[55.593594,37.918041],[55.593757,37.918108],[55.594111,37.917912],[55.594299,37.917908],[55.594496,37.91816],[55.594814,37.918244],[55.59509,37.91839],[55.595375,37.918451],[55.59565,37.918696],[55.595722,37.918849],[55.595866,37.918926],[55.596005,37.918933],[55.596312,37.919248],[55.596844,37.919836],[55.597096,37.920151],[55.597325,37.920315],[55.59757,37.920447],[55.597793,37.920722],[55.59794,37.921048],[55.598008,37.921335],[55.598494,37.921726],[55.599104,37.922098],[55.59931,37.922187],[55.59946,37.922197],[55.599816,37.922945],[55.600449,37.923229],[55.600964,37.923537],[55.6017,37.925625],[55.601941,37.926793],[55.602633,37.928056],[55.603009,37.928495],[55.60319,37.928568],[55.603712,37.928774],[55.6040195,37.9289624],[55.6041615,37.929056],[55.604165,37.929053],[55.604074,37.930477],[55.603859,37.936769],[55.604215,37.937117],[55.604283,37.937197],[55.604367,37.937375],[55.604652,37.937627],[55.604823,37.937897],[55.604951,37.937984],[55.60516,37.938146],[55.605181,37.938141],[55.605524,37.938083],[55.605601,37.938082],[55.605707,37.937982],[55.605815,37.937972],[55.605944,37.937888],[55.606172,37.937832],[55.606412,37.937907],[55.60641,37.937701],[55.606412,37.937907],[55.606172,37.937832],[55.605944,37.937888],[55.605815,37.937972],[55.605707,37.937982],[55.605601,37.938082],[55.6056005,37.9380923],[55.6055753,37.9381045],[55.605342,37.93842],[55.605249,37.938942],[55.605138,37.939463],[55.605164,37.939769],[55.605174,37.939881],[55.605174,37.940267],[55.604808,37.940609],[55.603773,37.940658],[55.603781,37.940096],[55.603522,37.94046],[55.603434,37.940382],[55.603345,37.940346],[55.60327,37.940228],[55.603204,37.940049],[55.6031389,37.93979],[55.603081,37.93965],[55.60301,37.9394147],[55.602736,37.939313],[55.599988,37.939444],[55.5997016,37.9394548],[55.5885595,37.9400316],[55.588564,37.940094],[55.588613,37.940204],[55.588651,37.940292],[55.588615,37.940501],[55.588381,37.940565],[55.588084,37.940946],[55.587735,37.94108],[55.58732,37.941906],[55.587168,37.942368],[55.586841,37.94255],[55.586428,37.943151],[55.586155,37.944084],[55.586083,37.944868],[55.586131,37.946348],[55.58567,37.947689],[55.585652,37.949084],[55.5855,37.950133],[55.585501,37.950168],[55.587562,37.952206],[55.591286,37.951935],[55.593746,37.951756],[55.593897,37.951984],[55.594171,37.951479],[55.594481,37.951055],[55.594725,37.950665],[55.594841,37.950517],[55.595074,37.950292],[55.595165,37.950231],[55.595453,37.950166],[55.595626,37.950051],[55.59589,37.94968],[55.596227,37.949112],[55.596394,37.948919],[55.596822,37.948698],[55.597014,37.948716],[55.597413,37.948985],[55.597722,37.94908],[55.597975,37.949114],[55.598469,37.948998],[55.598612,37.949051],[55.598656,37.949115],[55.598976,37.949186],[55.599115,37.949163],[55.599858,37.948797],[55.600338,37.948608],[55.600983,37.948234],[55.601157,37.948154],[55.601597,37.948032],[55.601825,37.948043],[55.601992,37.948101],[55.602371,37.948297],[55.602642,37.94824],[55.602892,37.948108],[55.603146,37.947891],[55.603465,37.947691],[55.603643,37.947642],[55.603677,37.945964],[55.603683,37.945741],[55.603683,37.945187],[55.603588,37.945213],[55.603488,37.945273],[55.603438,37.945274],[55.603402,37.945297],[55.6033964,37.9452968],[55.603402,37.945297],[55.603438,37.945274],[55.603488,37.945273],[55.603588,37.945213],[55.603683,37.945187],[55.603683,37.945741],[55.603677,37.945964],[55.603643,37.947642],[55.603658,37.947642],[55.605038,37.947646],[55.605205,37.947621],[55.605359,37.947598],[55.605535,37.94741],[55.607508,37.944591],[55.609369,37.942334],[55.610201,37.94122],[55.610444,37.940818],[55.610517,37.94083],[55.610923,37.940895],[55.611137,37.940864],[55.611362,37.940872],[55.611578,37.940918],[55.612055,37.940873],[55.612198,37.940902],[55.612441,37.940941],[55.612497,37.941455],[55.613463,37.945017],[55.613599,37.945624],[55.614278,37.948211],[55.614818,37.950017],[55.614859,37.950176],[55.614735,37.950322],[55.614454,37.950618],[55.613518,37.951761],[55.61337,37.951959],[55.613237,37.952088],[55.613047,37.952348],[55.612914,37.952477],[55.61274,37.95271],[55.61249,37.952995],[55.612193,37.953301],[55.612156,37.953369],[55.612138,37.953457],[55.612129,37.953332],[55.611885,37.953664],[55.611061,37.954649],[55.610526,37.955258],[55.609877,37.956063],[55.609309,37.956718],[55.608273,37.957963],[55.6082963,37.9580346],[55.608298,37.95804],[55.607846,37.958222],[55.607715,37.958421],[55.607634,37.95855],[55.60748,37.958665],[55.60734,37.958692],[55.607212,37.958802],[55.607106,37.959016],[55.606625,37.95929],[55.606491,37.959244],[55.606411,37.959242],[55.606301,37.959258],[55.606142,37.959271],[55.605953,37.959429],[55.605795,37.959491],[55.605696,37.959794],[55.605468,37.960247],[55.605413,37.960419],[55.605315,37.960506],[55.605199,37.960516],[55.605112,37.960599],[55.605036,37.960817],[55.604955,37.960884],[55.604876,37.960824],[55.60479,37.960878],[55.604733,37.960982],[55.604699,37.961119],[55.604653,37.961204],[55.604568,37.961208],[55.604506,37.961251],[55.604378,37.961377],[55.604271,37.961532],[55.604262,37.961546],[55.604207,37.961046],[55.604171,37.960717],[55.604114,37.960369],[55.604068,37.960087],[55.604031,37.960114],[55.603963,37.960106],[55.603847,37.96005],[55.603591,37.960163],[55.603451,37.959958],[55.603107,37.960496],[55.602911,37.96029],[55.602583,37.959979],[55.602451,37.959526],[55.602218,37.959714],[55.602067,37.959887],[55.6019909,37.9600645],[55.601983,37.960095],[55.601834,37.960577],[55.601789,37.961119],[55.601695,37.961685],[55.601596,37.961977],[55.601511,37.962486],[55.600963,37.962417],[55.600567,37.96381],[55.59729,37.963764],[55.596901,37.963788],[55.596077,37.963797],[55.593293,37.963854],[55.5854732,37.964014],[55.585423,37.964015],[55.5850108,37.9640347],[55.584984,37.966067],[55.585306,37.969658],[55.585047,37.973321],[55.585553,37.975764],[55.584811,37.979782],[55.583342,37.981935],[55.5825231,37.9825123],[55.5823715,37.9820296],[55.582302,37.981392],[55.5818803,37.9801064],[55.5819167,37.9785723],[55.582109,37.9702],[55.582185,37.9645845],[55.582179,37.964582],[55.582235,37.964069],[55.582173,37.963817],[55.582116,37.963644],[55.5820925,37.9633645],[55.582072,37.963283],[55.581998,37.963248],[55.581891,37.962952],[55.58176,37.962772],[55.581631,37.962643],[55.5815225,37.9625704],[55.581463,37.962532],[55.580282,37.962573],[55.5802034,37.9626021],[55.579825,37.962474],[55.579114,37.96214],[55.578958,37.962234],[55.57888,37.962188],[55.578776,37.962077],[55.5786479,37.9620339],[55.578603,37.96203],[55.578327,37.962047],[55.57808,37.962048],[55.57797,37.962023],[55.577841,37.961122],[55.577704,37.960659],[55.577496,37.960435],[55.577332,37.960355],[55.57716,37.96007],[55.5768,37.959693],[55.576598,37.958858],[55.5762355,37.957996],[55.5762324,37.9579886],[55.5760522,37.9578406]];

function routeIsOriginalPdfV18(route){
  if(!Array.isArray(route)||route.length!==ROUTE_V10_TRACK.length)return false;
  for(let i=0;i<route.length;i++){
    if(Math.abs(+route[i][0]-+ROUTE_V10_TRACK[i][0])>1e-8||Math.abs(+route[i][1]-+ROUTE_V10_TRACK[i][1])>1e-8)return false;
  }
  return true;
}
function applySharedBaseV18(){
  let raw=null;try{raw=localStorage.getItem(EDITOR_V13_KEY)}catch(e){}
  const untouched=!raw||routeIsOriginalPdfV18(editorV13.route);
  if(!untouched)return false;
  editorV13.route=SHARED_ROUTE_V18.map(p=>[+p[0],+p[1]]);
  editorV13.loopLocked=true;
  const first=editorV13.route[0],last=editorV13.route[editorV13.route.length-1];
  const s=editorV13.cps.find(x=>x.id==='cp0'),f=editorV13.cps.find(x=>x.id==='cpf');
  if(s){s.lat=first[0];s.lon=first[1]}
  if(f){f.lat=last[0];f.lon=last[1]}
  try{localStorage.setItem('rl_hike_shared_route_revision',SHARED_ROUTE_REV_V18)}catch(e){}
  try{persistEditorV15()}catch(e){try{saveEditorV13()}catch(_e){}}
  return true;
}
const sharedAppliedV18=applySharedBaseV18();
if(sharedAppliedV18){try{syncEventV13()}catch(e){}}
const buildV18=document.querySelector('.build-label');
if(buildV18)buildV18.textContent='V12 · сохранённый маршрут GPX · общая база';
if(sharedAppliedV18)render();


;/* source: hikes-preview/route-v19.js */
/* V13 — final shared route from latest GPX (2026-09-09). */
const FINAL_ROUTE_REV_V19='2026-09-09-gpx-final-2';
const FINAL_ROUTE_V19=[[55.5761279,37.9576806],[55.576126,37.957683],[55.576,37.957374],[55.575709,37.956353],[55.575391,37.955849],[55.575181,37.955316],[55.575028,37.954991],[55.574922,37.954766],[55.57473,37.954359],[55.574194,37.953712],[55.573918,37.953565],[55.573696,37.953612],[55.57339,37.953879],[55.5731,37.954053],[55.572732,37.953969],[55.5725415,37.9540066],[55.5724882,37.9540171],[55.5725096,37.9518474],[55.5725827,37.9492826],[55.5726343,37.9492906],[55.5726494,37.9489983],[55.572903,37.949024],[55.574423,37.94904],[55.574872,37.948571],[55.575479,37.947641],[55.576525,37.945271],[55.5770953,37.9448569],[55.577395,37.944207],[55.577548,37.943901],[55.577689,37.943619],[55.577811,37.9435372],[55.578159,37.943255],[55.578706,37.943126],[55.579179,37.943055],[55.579301,37.943096],[55.579496,37.943226],[55.579901,37.943411],[55.580078,37.943385],[55.580387,37.943341],[55.580799,37.943391],[55.5811,37.943525],[55.581197,37.943577],[55.581288,37.943573],[55.58156,37.94327],[55.581991,37.942616],[55.582091,37.94251],[55.5822532,37.9424],[55.5822777,37.9423827],[55.58258,37.942202],[55.5828748,37.94196],[55.5828627,37.9416328],[55.583913,37.93936],[55.584418,37.937919],[55.584504,37.936545],[55.584201,37.931469],[55.5841119,37.9300083],[55.5841932,37.9299821],[55.584486,37.930078],[55.585289,37.929547],[55.585706,37.929486],[55.58661,37.929462],[55.586927,37.930032],[55.587074,37.9299035],[55.587187,37.929433],[55.587289,37.92943],[55.587249,37.929076],[55.587025,37.92814],[55.586941,37.927981],[55.58701,37.927538],[55.586936,37.927439],[55.586933,37.92734],[55.586827,37.927232],[55.586791,37.926959],[55.586786,37.926663],[55.586905,37.926569],[55.587218,37.926272],[55.587311,37.92625],[55.587388,37.926274],[55.587428,37.926226],[55.587456,37.926174],[55.587386,37.926025],[55.587161,37.925857],[55.5873963,37.9259322],[55.587431,37.925827],[55.587493,37.925757],[55.587555,37.925721],[55.587629,37.925752],[55.587666,37.925839],[55.587652,37.925913],[55.587598,37.926008],[55.587595,37.926112],[55.587653,37.92611],[55.587721,37.926076],[55.587791,37.926058],[55.587859,37.926072],[55.587932,37.926106],[55.587991,37.9262],[55.587952,37.926237],[55.587891,37.926271],[55.587702,37.926278],[55.587694,37.92634],[55.587715,37.926378],[55.587869,37.926416],[55.587953,37.926503],[55.58804,37.926528],[55.588096,37.926476],[55.588221,37.926331],[55.588329,37.926167],[55.588369,37.926065],[55.588335,37.925912],[55.588371,37.925787],[55.588429,37.925667],[55.588458,37.925536],[55.588535,37.925431],[55.588644,37.925327],[55.588866,37.925422],[55.588995,37.924913],[55.589068,37.924813],[55.589543,37.924008],[55.589568,37.923842],[55.589745,37.92341],[55.589831,37.923354],[55.589936,37.923233],[55.590264,37.922804],[55.590307,37.922686],[55.590327,37.922572],[55.590314,37.922434],[55.590363,37.922369],[55.590566,37.921838],[55.590656,37.92152],[55.590698,37.921258],[55.590838,37.921058],[55.591017,37.920744],[55.591208,37.920496],[55.591462,37.920358],[55.591588,37.920336],[55.591666,37.920099],[55.591891,37.919969],[55.591855,37.919465],[55.592,37.919325],[55.592225,37.919177],[55.592549,37.91933],[55.592716,37.919329],[55.5928067,37.9193384],[55.593047,37.918645],[55.593465,37.918082],[55.593594,37.918041],[55.593757,37.918108],[55.594111,37.917912],[55.594299,37.917908],[55.594496,37.91816],[55.594814,37.918244],[55.59509,37.91839],[55.595375,37.918451],[55.59565,37.918696],[55.595722,37.918849],[55.595866,37.918926],[55.596005,37.918933],[55.596312,37.919248],[55.596844,37.919836],[55.597096,37.920151],[55.597325,37.920315],[55.59757,37.920447],[55.597793,37.920722],[55.59794,37.921048],[55.598008,37.921335],[55.598494,37.921726],[55.599104,37.922098],[55.59931,37.922187],[55.59946,37.922197],[55.599816,37.922945],[55.600449,37.923229],[55.600964,37.923537],[55.6017,37.925625],[55.601941,37.926793],[55.602633,37.928056],[55.603009,37.928495],[55.60319,37.928568],[55.603712,37.928774],[55.6040195,37.9289624],[55.6041615,37.929056],[55.604165,37.929053],[55.604074,37.930477],[55.603859,37.936769],[55.604215,37.937117],[55.604283,37.937197],[55.604367,37.937375],[55.604652,37.937627],[55.604823,37.937897],[55.604951,37.937984],[55.60516,37.938146],[55.605181,37.938141],[55.605524,37.938083],[55.605601,37.938082],[55.605707,37.937982],[55.605815,37.937972],[55.605944,37.937888],[55.606172,37.937832],[55.606412,37.937907],[55.60641,37.937701],[55.606412,37.937907],[55.606172,37.937832],[55.605944,37.937888],[55.605815,37.937972],[55.605707,37.937982],[55.605601,37.938082],[55.6056005,37.9380923],[55.6055753,37.9381045],[55.605342,37.93842],[55.605249,37.938942],[55.605138,37.939463],[55.605164,37.939769],[55.605174,37.939881],[55.605174,37.940267],[55.604808,37.940609],[55.603773,37.940658],[55.603781,37.940096],[55.603522,37.94046],[55.603434,37.940382],[55.603345,37.940346],[55.60327,37.940228],[55.603204,37.940049],[55.6031389,37.93979],[55.603081,37.93965],[55.60301,37.9394147],[55.602777,37.939692],[55.602587,37.939785],[55.602307,37.939889],[55.602002,37.939881],[55.601617,37.939841],[55.601488,37.939907],[55.600687,37.939873],[55.598836,37.939893],[55.598527,37.939862],[55.598405,37.939874],[55.598311,37.939972],[55.597586,37.940013],[55.596379,37.940025],[55.595124,37.940113],[55.594908,37.940128],[55.594671,37.940007],[55.594588,37.939964],[55.594519,37.939979],[55.594442,37.940026],[55.594356,37.940044],[55.594282,37.940087],[55.593885,37.940113],[55.593832,37.940037],[55.59361,37.940094],[55.591719,37.940037],[55.591355,37.9401],[55.591165,37.940115],[55.590976,37.940074],[55.590668,37.940108],[55.590447,37.940067],[55.589762,37.9401],[55.589655,37.940167],[55.589596,37.940187],[55.589307,37.940139],[55.589044,37.940131],[55.588725,37.940202],[55.588613,37.940204],[55.588651,37.940292],[55.588615,37.940501],[55.588381,37.940565],[55.588084,37.940946],[55.587735,37.94108],[55.58732,37.941906],[55.587168,37.942368],[55.586841,37.94255],[55.586428,37.943151],[55.586155,37.944084],[55.586083,37.944868],[55.586131,37.946348],[55.58567,37.947689],[55.585652,37.949084],[55.5855,37.950133],[55.585501,37.950168],[55.587562,37.952206],[55.591286,37.951935],[55.593746,37.951756],[55.593897,37.951984],[55.594171,37.951479],[55.594481,37.951055],[55.594725,37.950665],[55.594841,37.950517],[55.595074,37.950292],[55.595165,37.950231],[55.595453,37.950166],[55.595626,37.950051],[55.59589,37.94968],[55.596227,37.949112],[55.596394,37.948919],[55.596822,37.948698],[55.597014,37.948716],[55.597413,37.948985],[55.597722,37.94908],[55.597975,37.949114],[55.598469,37.948998],[55.598612,37.949051],[55.598656,37.949115],[55.598976,37.949186],[55.599115,37.949163],[55.599858,37.948797],[55.600338,37.948608],[55.600983,37.948234],[55.601157,37.948154],[55.601597,37.948032],[55.601825,37.948043],[55.601992,37.948101],[55.602371,37.948297],[55.602642,37.94824],[55.602892,37.948108],[55.603146,37.947891],[55.603465,37.947691],[55.603643,37.947642],[55.603677,37.945964],[55.603683,37.945741],[55.603683,37.945187],[55.603588,37.945213],[55.603488,37.945273],[55.603438,37.945274],[55.603402,37.945297],[55.6033964,37.9452968],[55.603402,37.945297],[55.603438,37.945274],[55.603488,37.945273],[55.603588,37.945213],[55.603683,37.945187],[55.603683,37.945741],[55.603677,37.945964],[55.603643,37.947642],[55.603658,37.947642],[55.605038,37.947646],[55.605205,37.947621],[55.605359,37.947598],[55.605535,37.94741],[55.607508,37.944591],[55.609369,37.942334],[55.610201,37.94122],[55.610444,37.940818],[55.610517,37.94083],[55.610923,37.940895],[55.611137,37.940864],[55.611362,37.940872],[55.611578,37.940918],[55.612055,37.940873],[55.612198,37.940902],[55.612441,37.940941],[55.612497,37.941455],[55.613463,37.945017],[55.613599,37.945624],[55.614278,37.948211],[55.614818,37.950017],[55.614859,37.950176],[55.614735,37.950322],[55.614454,37.950618],[55.613518,37.951761],[55.61337,37.951959],[55.613237,37.952088],[55.613047,37.952348],[55.612914,37.952477],[55.61274,37.95271],[55.61249,37.952995],[55.612193,37.953301],[55.612156,37.953369],[55.612138,37.953457],[55.612129,37.953332],[55.611885,37.953664],[55.611061,37.954649],[55.610526,37.955258],[55.609877,37.956063],[55.609309,37.956718],[55.608273,37.957963],[55.6082963,37.9580346],[55.608298,37.95804],[55.607846,37.958222],[55.607715,37.958421],[55.607634,37.95855],[55.60748,37.958665],[55.60734,37.958692],[55.607212,37.958802],[55.607106,37.959016],[55.606625,37.95929],[55.606491,37.959244],[55.606411,37.959242],[55.606301,37.959258],[55.606142,37.959271],[55.605953,37.959429],[55.605795,37.959491],[55.605696,37.959794],[55.605468,37.960247],[55.605413,37.960419],[55.605315,37.960506],[55.605199,37.960516],[55.605112,37.960599],[55.605036,37.960817],[55.604955,37.960884],[55.604876,37.960824],[55.60479,37.960878],[55.604733,37.960982],[55.604699,37.961119],[55.604653,37.961204],[55.604568,37.961208],[55.604506,37.961251],[55.604378,37.961377],[55.604271,37.961532],[55.604262,37.961546],[55.604207,37.961046],[55.604171,37.960717],[55.604114,37.960369],[55.604068,37.960087],[55.604031,37.960114],[55.603963,37.960106],[55.603847,37.96005],[55.603591,37.960163],[55.603451,37.959958],[55.603107,37.960496],[55.602911,37.96029],[55.602583,37.959979],[55.602451,37.959526],[55.602218,37.959714],[55.602067,37.959887],[55.6019909,37.9600645],[55.601983,37.960095],[55.601834,37.960577],[55.601789,37.961119],[55.601695,37.961685],[55.601596,37.961977],[55.601511,37.962486],[55.600963,37.962417],[55.600567,37.96381],[55.59729,37.963764],[55.596901,37.963788],[55.596077,37.963797],[55.593293,37.963854],[55.5854732,37.964014],[55.585423,37.964015],[55.5850108,37.9640347],[55.584984,37.966067],[55.585306,37.969658],[55.585047,37.973321],[55.585553,37.975764],[55.584811,37.979782],[55.583342,37.981935],[55.5825231,37.9825123],[55.5823715,37.9820296],[55.582302,37.981392],[55.5818803,37.9801064],[55.5819167,37.9785723],[55.582109,37.9702],[55.582185,37.9645845],[55.582179,37.964582],[55.582235,37.964069],[55.582173,37.963817],[55.582116,37.963644],[55.5820925,37.9633645],[55.582072,37.963283],[55.581998,37.963248],[55.581891,37.962952],[55.58176,37.962772],[55.581631,37.962643],[55.5815225,37.9625704],[55.581463,37.962532],[55.580282,37.962573],[55.5802034,37.9626021],[55.579825,37.962474],[55.579114,37.96214],[55.578958,37.962234],[55.57888,37.962188],[55.578776,37.962077],[55.5786479,37.9620339],[55.578603,37.96203],[55.578327,37.962047],[55.57808,37.962048],[55.57797,37.962023],[55.577841,37.961122],[55.577704,37.960659],[55.577496,37.960435],[55.577332,37.960355],[55.57716,37.96007],[55.5768,37.959693],[55.576598,37.958858],[55.5762629,37.9580292],[55.5762386,37.9579568],[55.5761279,37.9576806]];

function sameRouteV19(a,b,tol=1e-8){
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return false;
  for(let i=0;i<a.length;i++){
    if(Math.abs(+a[i][0]-+b[i][0])>tol||Math.abs(+a[i][1]-+b[i][1])>tol)return false;
  }
  return true;
}
function isPdfRouteV19(route){try{return routeIsOriginalPdfV18(route)}catch(e){return false}}
function distanceScaleV19(){return isPdfRouteV19(editorV13.route)?DISTANCE_CAL_V13:1}
routeLenV13=function(){return rawRouteLenV13()*distanceScaleV19()};
routeCumV13=function(){
  const out=[0],k=distanceScaleV19();
  for(let i=0;i<editorV13.route.length-1;i++)out.push(out[out.length-1]+havV13(editorV13.route[i],editorV13.route[i+1])*k);
  return out;
};
routeTravelMinToV13=function(m){
  let left=m,min=0,k=distanceScaleV19();
  for(let i=0;i<editorV13.route.length-1&&left>0;i++){
    const seg=havV13(editorV13.route[i],editorV13.route[i+1])*k,use=Math.min(left,seg);
    min+=(use/1000)/terrainSpeedV13(i)*60;left-=use;
  }
  return min;
};

function applyFinalRouteV19(){
  let rev='';try{rev=localStorage.getItem('rl_hike_shared_route_revision')||''}catch(e){}
  const current=editorV13.route;
  const previousShared=(typeof SHARED_ROUTE_V18!=='undefined'&&sameRouteV19(current,SHARED_ROUTE_V18));
  const untouchedPdf=isPdfRouteV19(current);
  const alreadyFinal=sameRouteV19(current,FINAL_ROUTE_V19);
  if(alreadyFinal){
    try{localStorage.setItem('rl_hike_shared_route_revision',FINAL_ROUTE_REV_V19)}catch(e){}
    return false;
  }
  if(!(previousShared||untouchedPdf||rev==='2026-09-09-gpx-1'))return false;
  editorV13.route=FINAL_ROUTE_V19.map(p=>[+p[0],+p[1]]);
  editorV13.loopLocked=true;
  const first=editorV13.route[0],last=editorV13.route[editorV13.route.length-1];
  const s=editorV13.cps.find(x=>x.id==='cp0'),f=editorV13.cps.find(x=>x.id==='cpf');
  if(s){s.lat=first[0];s.lon=first[1]}
  if(f){f.lat=last[0];f.lon=last[1]}
  try{localStorage.setItem('rl_hike_shared_route_revision',FINAL_ROUTE_REV_V19)}catch(e){}
  try{persistEditorV15()}catch(e){try{saveEditorV13()}catch(_e){}}
  try{syncEventV13()}catch(e){}
  return true;
}
applyFinalRouteV19();
const buildV19=document.querySelector('.build-label');
if(buildV19)buildV19.textContent='V13 · финальный GPX · конструктор атласа';


;/* source: hikes-preview/atlas-v20.js */
/* V14 — field atlas constructor: sources, area, sheet split, overlap and per-sheet print. */
const ATLAS_V20_KEY='rl_hike_atlas_v20';
const YANDEX_KEY_V20='rl_hike_yandex_tiles_key';
const ATLAS_SOURCES_V20={
  osm:{label:'OSM · тропы и дороги',short:'OSM',attribution:'© OpenStreetMap contributors'},
  sat:{label:'Спутник · Esri World Imagery',short:'Спутник',attribution:'Esri World Imagery'},
  hybrid:{label:'Гибрид · спутник + подписи',short:'Гибрид',attribution:'Esri World Imagery / Reference'},
  yandex:{label:'Яндекс · схема (API)',short:'Яндекс',attribution:'© Яндекс Карты'}
};
function defaultAtlasV20(){
  return {
    paper:'A4',orientation:'landscape',sheetCount:8,overlap:200,margin:350,
    overview1:'sat',overview2:'osm',detailDefault:'osm',
    includeOverview:true,includePlan:true,includeNav:true,includeGrid:true,includeCps:true,
    area:null,sheetSources:{},selected:{}
  };
}
function loadAtlasV20(){try{const x=JSON.parse(localStorage.getItem(ATLAS_V20_KEY)||'null');return {...defaultAtlasV20(),...(x||{}),sheetSources:{...(x?.sheetSources||{})},selected:{...(x?.selected||{})}}}catch(e){return defaultAtlasV20()}}
let atlasV20=loadAtlasV20(),atlasPickLayerV20=null;
function saveAtlasV20(){try{localStorage.setItem(ATLAS_V20_KEY,JSON.stringify(atlasV20))}catch(e){}}
function yandexKeyV20(){try{return localStorage.getItem(YANDEX_KEY_V20)||''}catch(e){return ''}}
function setYandexKeyV20(v){try{if(v)localStorage.setItem(YANDEX_KEY_V20,v);else localStorage.removeItem(YANDEX_KEY_V20)}catch(e){}}
function cosLatV20(bounds){return Math.cos((((bounds.north+bounds.south)/2)*Math.PI)/180)}
function projGroundV20(m,bounds){return m/Math.max(.2,cosLatV20(bounds))}
function routeBoundsV20(margin=350){
  const lats=editorV13.route.map(p=>+p[0]),lons=editorV13.route.map(p=>+p[1]);
  let west=Math.min(...lons),east=Math.max(...lons),south=Math.min(...lats),north=Math.max(...lats);
  const raw={west,east,south,north},pad=projGroundV20(Math.max(0,+margin||0),raw);
  let x0=mercXV12(west)-pad,x1=mercXV12(east)+pad,y0=mercYV12(south)-pad,y1=mercYV12(north)+pad;
  return {west:lonFromXV12(x0),east:lonFromXV12(x1),south:latFromYV12(y0),north:latFromYV12(y1)};
}
function atlasBoundsCurrentV20(){
  if(atlasV20.area&&Number.isFinite(+atlasV20.area.west))return {...atlasV20.area};
  if(typeof GRID_V12!=='undefined')return {west:GRID_V12.west,east:GRID_V12.east,south:GRID_V12.south,north:GRID_V12.north};
  return routeBoundsV20(atlasV20.margin);
}
function boundsSizeV20(b){
  const lat=(b.north+b.south)/2*Math.PI/180;
  const w=(mercXV12(b.east)-mercXV12(b.west))*Math.cos(lat);
  const h=(mercYV12(b.north)-mercYV12(b.south))*Math.cos(lat);
  return {w,h,aspect:w/Math.max(1,h)};
}
function factorPairsV20(n){const out=[];for(let r=1;r<=n;r++)if(n%r===0)out.push([n/r,r]);return out}
function layoutV20(count,bounds){
  const target=boundsSizeV20(bounds).aspect,pageAspect=1.35;
  let best=null;
  factorPairsV20(Math.max(1,+count||1)).forEach(([cols,rows])=>{
    const score=Math.abs(Math.log(((cols/rows)*pageAspect)/Math.max(.01,target)));
    if(!best||score<best.score)best={cols,rows,score};
  });
  return best||{cols:1,rows:1};
}
function splitBoundsV20(bounds,count,overlapM){
  const {cols,rows}=layoutV20(count,bounds),x0=mercXV12(bounds.west),x1=mercXV12(bounds.east),y0=mercYV12(bounds.south),y1=mercYV12(bounds.north);
  const dx=(x1-x0)/cols,dy=(y1-y0)/rows,ov=projGroundV20(Math.max(0,+overlapM||0),bounds)/2,out=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const left=x0+c*dx-(c?ov:0),right=x0+(c+1)*dx+(c<cols-1?ov:0);
    const top=y1-r*dy+(r?ov:0),bottom=y1-(r+1)*dy-(r<rows-1?ov:0);
    out.push({index:r*cols+c+1,row:r,col:c,rows,cols,west:lonFromXV12(left),east:lonFromXV12(right),north:latFromYV12(top),south:latFromYV12(bottom)});
  }
  return out;
}
function sourceOptionsV20(value,inherit=false){
  let h=inherit?`<option value="inherit" ${value==='inherit'?'selected':''}>Как для детальных листов</option>`:'';
  Object.entries(ATLAS_SOURCES_V20).forEach(([k,s])=>h+=`<option value="${k}" ${value===k?'selected':''}>${s.label}</option>`);
  return h;
}
function atlasSourceForSheetV20(i){const x=atlasV20.sheetSources?.[i];return !x||x==='inherit'?atlasV20.detailDefault:x}
function atlasSelectedV20(i){return atlasV20.selected?.[i]!==false}
function sheetsV20(){return splitBoundsV20(atlasBoundsCurrentV20(),atlasV20.sheetCount,atlasV20.overlap)}
function atlasSchemeV20(active=0,forPrint=false){
  const sh=sheetsV20(),meta=sh[0]||{cols:1,rows:1};
  return `<div class="atlas-scheme-v20 ${forPrint?'print':''}" style="grid-template-columns:repeat(${meta.cols},1fr)">${sh.map(s=>`<span class="${s.index===active?'active':''}">${s.index}</span>`).join('')}</div>`;
}
function modalRootV20(){
  let el=document.getElementById('atlasDesignerV20');
  if(!el){el=document.createElement('div');el.id='atlasDesignerV20';el.className='atlas-modal-v20';document.body.appendChild(el)}
  return el;
}
function closeAtlasV20(){document.getElementById('atlasDesignerV20')?.remove()}
function areaTextV20(){const s=boundsSizeV20(atlasBoundsCurrentV20());return `${(s.w/1000).toFixed(2).replace('.',',')} × ${(s.h/1000).toFixed(2).replace('.',',')} км`}
function renderAtlasDesignerV20(){
  const root=modalRootV20(),b=atlasBoundsCurrentV20(),sh=sheetsV20(),lay=layoutV20(atlasV20.sheetCount,b),key=yandexKeyV20();
  root.innerHTML=`<div class="atlas-backdrop-v20" data-atlas-close></div><section class="atlas-dialog-v20">
    <header><div><small>ПОЛЕВОЙ АТЛАС</small><h2>Конструктор печатных листов</h2><p>Обзорные карты и детальные листы строятся из одной географической области. Подложку можно задавать отдельно для каждого листа.</p></div><button class="atlas-x-v20" data-atlas-close>×</button></header>
    <div class="atlas-body-v20">
      <div class="atlas-config-v20">
        <section class="atlas-block-v20"><h3>1. Область</h3><div class="atlas-area-line-v20"><strong>${areaTextV20()}</strong><span>${b.south.toFixed(5)}, ${b.west.toFixed(5)} → ${b.north.toFixed(5)}, ${b.east.toFixed(5)}</span></div>
          <div class="atlas-actions-v20"><button class="btn alt sm" id="atlasAreaRouteV20">По маршруту + запас</button><button class="btn alt sm" id="atlasAreaPickV20">Выбрать на карте</button><button class="btn alt sm" id="atlasAreaPdfV20">Область исходного атласа</button></div>
          <label>Запас вокруг маршрута, м<input id="atlasMarginV20" type="number" min="0" max="3000" step="50" value="${atlasV20.margin}"></label>
        </section>
        <section class="atlas-block-v20"><h3>2. Бумага и разбиение</h3><div class="atlas-grid3-v20">
          <label>Формат<select id="atlasPaperV20"><option ${atlasV20.paper==='A4'?'selected':''}>A4</option><option ${atlasV20.paper==='A3'?'selected':''}>A3</option></select></label>
          <label>Ориентация<select id="atlasOrientV20"><option value="landscape" ${atlasV20.orientation==='landscape'?'selected':''}>Альбомная</option><option value="portrait" ${atlasV20.orientation==='portrait'?'selected':''}>Книжная</option></select></label>
          <label>Листов<select id="atlasCountV20">${[2,4,6,8,9,12,16].map(n=>`<option value="${n}" ${+atlasV20.sheetCount===n?'selected':''}>${n}</option>`).join('')}</select></label>
        </div><div class="atlas-grid2-v20">
          <label>Перекрытие соседей, м<input id="atlasOverlapV20" type="number" min="0" max="1000" step="50" value="${atlasV20.overlap}"></label>
          <div class="atlas-layout-note-v20"><small>Авторазбивка</small><strong>${lay.cols} × ${lay.rows}</strong><span>${sh.length} листов</span></div>
        </div></section>
        <section class="atlas-block-v20"><h3>3. Подложки</h3>
          <div class="atlas-grid2-v20"><label>Обзор 1<select id="atlasOverview1V20">${sourceOptionsV20(atlasV20.overview1)}</select></label><label>Обзор 2<select id="atlasOverview2V20">${sourceOptionsV20(atlasV20.overview2)}</select></label></div>
          <label>По умолчанию для детальных листов<select id="atlasDetailV20">${sourceOptionsV20(atlasV20.detailDefault)}</select></label>
          <div class="atlas-yandex-v20"><div><b>Яндекс · схема</b><small>Для официального Tiles API нужен ключ. Спутник и гибрид Яндекса через Tiles API недоступны, поэтому для этих режимов используется спутниковая подложка Esri.</small></div><input id="atlasYandexKeyV20" type="password" placeholder="API key Yandex Tiles" value="${esc(key)}"></div>
        </section>
        <section class="atlas-block-v20"><h3>4. Содержимое</h3><div class="atlas-checks-v20">
          <label><input id="atlasOverviewChkV20" type="checkbox" ${atlasV20.includeOverview?'checked':''}> Обзорные листы</label>
          <label><input id="atlasGridChkV20" type="checkbox" ${atlasV20.includeGrid?'checked':''}> Координатная сетка</label>
          <label><input id="atlasCpsChkV20" type="checkbox" ${atlasV20.includeCps?'checked':''}> КП</label>
          <label><input id="atlasPlanChkV20" type="checkbox" ${atlasV20.includePlan?'checked':''}> Маршрутный план</label>
          <label><input id="atlasNavChkV20" type="checkbox" ${atlasV20.includeNav?'checked':''}> Азимуты</label>
        </div></section>
      </div>
      <aside class="atlas-sheets-panel-v20"><div class="atlas-sheets-head-v20"><div><small>ДЕТАЛЬНЫЕ ЛИСТЫ</small><strong>${lay.cols} × ${lay.rows}</strong></div>${atlasSchemeV20()}</div>
        <div class="atlas-sheet-list-v20">${sh.map(s=>`<div class="atlas-sheet-row-v20"><label class="atlas-sheet-check-v20"><input type="checkbox" data-atlas-sheet-check="${s.index}" ${atlasSelectedV20(s.index)?'checked':''}><b>Лист ${s.index}</b></label><select data-atlas-sheet-source="${s.index}">${sourceOptionsV20(atlasV20.sheetSources?.[s.index]||'inherit',true)}</select><button class="btn alt sm" data-atlas-one="${s.index}">Открыть</button></div>`).join('')}</div>
      </aside>
    </div>
    <footer><div><small>Как в исходном атласе: общий обзор → перекрывающиеся детальные листы → маршрутный план.</small></div><div class="atlas-footer-actions-v20"><button class="btn alt" id="atlasSheetsOnlyV20">Только листы</button><button class="btn sand" id="atlasFullV20">Сводный атлас</button></div></footer>
  </section>`;
  bindAtlasDesignerV20();
}
function readAtlasControlsV20(){
  const val=id=>document.getElementById(id)?.value;
  atlasV20.paper=val('atlasPaperV20')||atlasV20.paper;atlasV20.orientation=val('atlasOrientV20')||atlasV20.orientation;
  atlasV20.sheetCount=+val('atlasCountV20')||atlasV20.sheetCount;atlasV20.overlap=Math.max(0,+val('atlasOverlapV20')||0);atlasV20.margin=Math.max(0,+val('atlasMarginV20')||0);
  atlasV20.overview1=val('atlasOverview1V20')||atlasV20.overview1;atlasV20.overview2=val('atlasOverview2V20')||atlasV20.overview2;atlasV20.detailDefault=val('atlasDetailV20')||atlasV20.detailDefault;
  atlasV20.includeOverview=!!document.getElementById('atlasOverviewChkV20')?.checked;atlasV20.includeGrid=!!document.getElementById('atlasGridChkV20')?.checked;
  atlasV20.includeCps=!!document.getElementById('atlasCpsChkV20')?.checked;atlasV20.includePlan=!!document.getElementById('atlasPlanChkV20')?.checked;atlasV20.includeNav=!!document.getElementById('atlasNavChkV20')?.checked;
  document.querySelectorAll('[data-atlas-sheet-check]').forEach(x=>atlasV20.selected[x.dataset.atlasSheetCheck]=x.checked);
  document.querySelectorAll('[data-atlas-sheet-source]').forEach(x=>atlasV20.sheetSources[x.dataset.atlasSheetSource]=x.value);
  setYandexKeyV20(val('atlasYandexKeyV20')?.trim()||'');saveAtlasV20();
}
function bindAtlasDesignerV20(){
  document.querySelectorAll('[data-atlas-close]').forEach(b=>b.onclick=closeAtlasV20);
  ['atlasPaperV20','atlasOrientV20','atlasCountV20','atlasOverlapV20','atlasOverview1V20','atlasOverview2V20','atlasDetailV20','atlasOverviewChkV20','atlasGridChkV20','atlasCpsChkV20','atlasPlanChkV20','atlasNavChkV20'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{readAtlasControlsV20();renderAtlasDesignerV20()}));
  document.getElementById('atlasMarginV20')?.addEventListener('change',readAtlasControlsV20);
  document.getElementById('atlasYandexKeyV20')?.addEventListener('change',readAtlasControlsV20);
  document.querySelectorAll('[data-atlas-sheet-check],[data-atlas-sheet-source]').forEach(x=>x.addEventListener('change',readAtlasControlsV20));
  document.getElementById('atlasAreaRouteV20')?.addEventListener('click',()=>{readAtlasControlsV20();atlasV20.area=routeBoundsV20(atlasV20.margin);saveAtlasV20();renderAtlasDesignerV20()});
  document.getElementById('atlasAreaPdfV20')?.addEventListener('click',()=>{atlasV20.area={west:GRID_V12.west,east:GRID_V12.east,south:GRID_V12.south,north:GRID_V12.north};saveAtlasV20();renderAtlasDesignerV20()});
  document.getElementById('atlasAreaPickV20')?.addEventListener('click',pickAreaOnMapV20);
  document.getElementById('atlasFullV20')?.addEventListener('click',()=>{readAtlasControlsV20();openAtlasOutputV20('full')});
  document.getElementById('atlasSheetsOnlyV20')?.addEventListener('click',()=>{readAtlasControlsV20();openAtlasOutputV20('sheets')});
  document.querySelectorAll('[data-atlas-one]').forEach(b=>b.onclick=()=>{readAtlasControlsV20();openAtlasOutputV20('one',+b.dataset.atlasOne)});
}
function pickAreaOnMapV20(){
  if(editorModeV13){toast('Сначала заверши или сохрани редактирование маршрута, затем выбери область атласа.');return}
  closeAtlasV20();tab='route';render();
  setTimeout(()=>{
    if(!routeMapV11){toast('Карта ещё не готова');return}
    let first=null,mark=null,rect=null;
    toast('Область атласа: кликни первый угол, затем противоположный.');
    const h=e=>{
      if(!first){first=e.latlng;mark=L.circleMarker(first,{radius:6,color:'#171815',weight:2,fillColor:'#c7a65a',fillOpacity:1}).addTo(routeMapV11);toast('Первый угол выбран. Кликни противоположный угол.');return}
      const second=e.latlng;
      atlasV20.area={west:Math.min(first.lng,second.lng),east:Math.max(first.lng,second.lng),south:Math.min(first.lat,second.lat),north:Math.max(first.lat,second.lat)};
      if(mark)routeMapV11.removeLayer(mark);if(rect)routeMapV11.removeLayer(rect);routeMapV11.off('click',h);saveAtlasV20();toast('Область атласа сохранена');openAtlasDesignerV20();
    };
    routeMapV11.on('click',h);
  },180);
}
function openAtlasDesignerV20(){renderAtlasDesignerV20()}
function validateSourcesV20(mode,one){
  const used=new Set();
  if(mode==='full'&&atlasV20.includeOverview){used.add(atlasV20.overview1);used.add(atlasV20.overview2)}
  sheetsV20().forEach(s=>{if((mode!=='one'||s.index===one)&&atlasSelectedV20(s.index))used.add(atlasSourceForSheetV20(s.index))});
  if(used.has('yandex')&&!yandexKeyV20()){toast('Для подложки Яндекс введи API key Tiles API в конструкторе атласа.');return false}
  return true;
}
function tileXYPrintV20(lat,lon,z){const n=2**z,x=(lon+180)/360*n,lr=lat*Math.PI/180,y=(1-Math.asinh(Math.tan(lr))/Math.PI)/2*n;return [x,y]}
function sourceTilesV20(source,x,y,z){
  if(source==='sat')return [`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`];
  if(source==='hybrid')return [
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`
  ];
  if(source==='yandex')return [`https://tiles.api-maps.yandex.ru/v1/tiles/?apikey=${encodeURIComponent(yandexKeyV20())}&lang=ru_RU&x=${x}&y=${y}&z=${z}&l=map&projection=web_mercator`];
  return [`https://tile.openstreetmap.org/${z}/${x}/${y}.png`];
}
function zoomForBoundsV20(bounds,detail){
  const s=boundsSizeV20(bounds),max=Math.max(s.w,s.h);
  if(!detail)return max<4500?14:13;
  if(max<1300)return 17;if(max<2600)return 16;return 15;
}
function inBoundsV20(lat,lon,b){return lat<=b.north&&lat>=b.south&&lon>=b.west&&lon<=b.east}
function mapPageV20(bounds,source,title,sheetMeta=null){
  const z=zoomForBoundsV20(bounds,!!sheetMeta),nw=tileXYPrintV20(bounds.north,bounds.west,z),se=tileXYPrintV20(bounds.south,bounds.east,z);
  const px0=nw[0]*256,py0=nw[1]*256,px1=se[0]*256,py1=se[1]*256,W=Math.max(100,px1-px0),H=Math.max(100,py1-py0);
  const x0=Math.floor(nw[0]),x1=Math.floor(se[0]),y0=Math.floor(nw[1]),y1=Math.floor(se[1]),imgs=[];
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
    sourceTilesV20(source,x,y,z).forEach((url,layer)=>imgs.push(`<img class="atlas-tile-v20 layer-${layer}" src="${url}" style="left:${((x*256-px0)/W*100).toFixed(5)}%;top:${((y*256-py0)/H*100).toFixed(5)}%;width:${(256/W*100).toFixed(5)}%;height:${(256/H*100).toFixed(5)}%">`));
  }
  const pxy=(lat,lon)=>{const t=tileXYPrintV20(lat,lon,z);return [t[0]*256-px0,t[1]*256-py0]};
  const routePts=editorV13.route.map(p=>pxy(p[0],p[1]).join(',')).join(' ');
  let grid='',gridLabels='';
  if(atlasV20.includeGrid){
    const g=gridCfgV13(),ax0=mercXV12(bounds.west),ax1=mercXV12(bounds.east),ay0=mercYV12(bounds.south),ay1=mercYV12(bounds.north);
    const cMin=Math.max(0,Math.floor((ax0-g.x0)/g.dx)-1),cMax=Math.ceil((ax1-g.x0)/g.dx)+1,rMin=Math.max(0,Math.floor((g.y1-ay1)/g.dy)-1),rMax=Math.ceil((g.y1-ay0)/g.dy)+1;
    for(let c=cMin;c<=cMax;c++){const lon=lonFromXV12(g.x0+c*g.dx),a=pxy(bounds.north,lon),bb=pxy(bounds.south,lon);grid+=`<line x1="${a[0]}" y1="${a[1]}" x2="${bb[0]}" y2="${bb[1]}"/>`;if(c<cMax){const lon2=lonFromXV12(g.x0+(c+.5)*g.dx),p=pxy(bounds.north,lon2);gridLabels+=`<text x="${p[0]}" y="18">${String(c+1).padStart(2,'0')}</text>`}}
    for(let r=rMin;r<=rMax;r++){const lat=latFromYV12(g.y1-r*g.dy),a=pxy(lat,bounds.west),bb=pxy(lat,bounds.east);grid+=`<line x1="${a[0]}" y1="${a[1]}" x2="${bb[0]}" y2="${bb[1]}"/>`;if(r<rMax&&CYR_ROWS_V13[r]){const lat2=latFromYV12(g.y1-(r+.5)*g.dy),p=pxy(lat2,bounds.west);gridLabels+=`<text x="13" y="${p[1]}">${CYR_ROWS_V13[r]}</text>`}}
  }
  let cps='';
  if(atlasV20.includeCps)dynamicCpsV13().filter(cp=>inBoundsV20(cp.lat,cp.lon,bounds)).forEach(cp=>{const p=pxy(cp.lat,cp.lon);cps+=`<g><circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+9}" y="${p[1]-8}">${esc(cp.number)} ${esc(cp.title)}</text></g>`});
  const src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;
  const side=sheetMeta?`<aside class="atlas-print-side-v20"><div><small>ОБЗОРНАЯ СХЕМА</small>${atlasSchemeV20(sheetMeta.index,true)}</div><div class="atlas-print-legend-v20"><b>Лист ${sheetMeta.index}</b><span>${src.label}</span><span>Перекрытие: ${atlasV20.overlap} м</span><span>Сетка: ${gridCfgV13().cell} м</span><span>Масштаб: детальный</span></div></aside>`:'';
  return `<section class="atlas-page-v20"><header><div><small>${src.short.toUpperCase()}</small><h1>${esc(title)}</h1></div><b>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км · ${gridCfgV13().cell} м</b></header><div class="atlas-map-layout-v20"><div class="atlas-map-crop-v20">${imgs.join('')}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g class="atlas-grid-lines-v20">${grid}</g><g class="atlas-grid-labels-v20">${gridLabels}</g><polyline class="atlas-route-halo-v20" points="${routePts}"/><polyline class="atlas-route-v20" points="${routePts}"/><g class="atlas-cps-v20">${cps}</g></svg>${source==='yandex'?'<div class="atlas-brand-v20">Яндекс Карты</div>':''}</div>${side}</div><footer><span>${src.attribution}</span><span>Разные люди · полевой атлас · ${new Date().toLocaleDateString('ru-RU')}</span></footer></section>`;
}
function tablePlanV20(){
  const cps=dynamicCpsV13(),rows=cps.map((cp,i)=>{const prev=i?cps[i-1]:null;return `<tr><td>${cp.number}</td><td>${esc(cp.title)}</td><td>${cp.km.toFixed(1)}</td><td>${prev?(cp.km-prev.km).toFixed(1):'—'}</td><td>${cp.arrival}</td><td>${cp.stopMin||''}</td><td>${gridCodeDynamicV13(cp.lat,cp.lon)}</td><td>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</td></tr>`}).join('');
  return `<section class="atlas-page-v20 atlas-table-v20"><header><div><small>МАРШРУТНЫЙ ПЛАН</small><h1>Время и координаты</h1></div><b>${(routeLenV13()/1000).toFixed(1)} км · ${editorV13.start} → ${finalEtaV13()}</b></header><table><thead><tr><th>КП</th><th>Название</th><th>Км</th><th>От пред.</th><th>ETA</th><th>Стоп</th><th>Квадрат</th><th>WGS84</th></tr></thead><tbody>${rows}</tbody></table><footer><span>Расстояние и ETA рассчитаны по текущей геометрии маршрута.</span></footer></section>`;
}
function tableNavV20(){
  const cps=dynamicCpsV13(),rows=cps.slice(0,-1).map((a,i)=>{const b=cps[i+1];return `<tr><td>${i+1}</td><td>${esc(a.title)} → ${esc(b.title)}</td><td>${(b.km-a.km).toFixed(1)} км</td><td>${Math.round(bearingV13([a.lat,a.lon],[b.lat,b.lon]))}°</td><td>${esc(terrainSummaryV13(a.km*1000,b.km*1000))}</td></tr>`}).join('');
  return `<section class="atlas-page-v20 atlas-table-v20"><header><div><small>НАВИГАЦИЯ</small><h1>Переходы и азимуты</h1></div><b>Автоматический расчёт</b></header><table><thead><tr><th>#</th><th>Переход</th><th>По маршруту</th><th>Азимут</th><th>Тип движения</th></tr></thead><tbody>${rows}</tbody></table><footer><span>Приоритет на местности: реальные тропы, дороги и линейные ориентиры.</span></footer></section>`;
}
function printCssV20(){
  const paper=atlasV20.paper==='A3'?'A3':'A4',orientation=atlasV20.orientation==='portrait'?'portrait':'landscape';
  return `@page{size:${paper} ${orientation};margin:7mm}*{box-sizing:border-box}body{margin:0;background:#d9d8d2;color:#171815;font:10px Arial,sans-serif}.printbar{position:sticky;top:0;z-index:99;background:#171815;color:#fff;padding:10px;text-align:center}.printbar button{padding:9px 16px;margin-right:10px}.atlas-page-v20{width:${orientation==='landscape'?'281mm':'194mm'};height:${orientation==='landscape'?'194mm':'281mm'};margin:7px auto;background:#f2eee5;padding:6mm;display:flex;flex-direction:column;page-break-after:always}.atlas-page-v20 header{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #777;padding-bottom:2.5mm}.atlas-page-v20 h1{margin:1mm 0 0;font-size:20px;text-transform:uppercase}.atlas-page-v20 small{letter-spacing:.11em;color:#725f3f}.atlas-map-layout-v20{display:grid;grid-template-columns:minmax(0,1fr) 42mm;gap:4mm;flex:1;min-height:0;margin-top:3mm}.atlas-page-v20:not(:has(.atlas-print-side-v20)) .atlas-map-layout-v20{grid-template-columns:1fr}.atlas-map-crop-v20{position:relative;overflow:hidden;background:#dfe4d9;min-height:0}.atlas-tile-v20{position:absolute;object-fit:fill}.atlas-map-crop-v20 svg{position:absolute;inset:0;width:100%;height:100%}.atlas-grid-lines-v20 line{stroke:#424744;stroke-width:.7;opacity:.52}.atlas-grid-labels-v20 text{font:bold 12px Arial;fill:#222;paint-order:stroke;stroke:#fff;stroke-width:3;text-anchor:middle;dominant-baseline:middle}.atlas-route-halo-v20{fill:none;stroke:#fff;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}.atlas-route-v20{fill:none;stroke:#6c22c7;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.atlas-cps-v20 circle{fill:#6c22c7;stroke:#fff;stroke-width:2}.atlas-cps-v20 text{font:bold 11px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:4}.atlas-print-side-v20{border-left:1px solid #aaa;padding-left:3mm;display:flex;flex-direction:column;gap:5mm}.atlas-scheme-v20.print{display:grid;gap:1px;background:#999;border:1px solid #777;margin-top:2mm}.atlas-scheme-v20.print span{display:grid;place-items:center;min-height:11mm;background:#eee}.atlas-scheme-v20.print span.active{background:#c7a65a;font-weight:700}.atlas-print-legend-v20{display:grid;gap:2mm}.atlas-print-legend-v20 b{font-size:16px}.atlas-page-v20 footer{display:flex;justify-content:space-between;border-top:1px solid #aaa;margin-top:2mm;padding-top:2mm;color:#666}.atlas-brand-v20{position:absolute;left:8px;bottom:8px;background:#fff;padding:4px 6px;font-weight:700;border:1px solid #bbb}.atlas-table-v20 table{width:100%;border-collapse:collapse;margin-top:4mm;font-size:9px}.atlas-table-v20 th,.atlas-table-v20 td{border-bottom:1px solid #bbb;padding:2mm;text-align:left}.atlas-table-v20 th{font-size:8px;text-transform:uppercase;color:#666}@media print{body{background:white}.printbar{display:none}.atlas-page-v20{margin:0}}`;
}
function outputPagesV20(mode,one){
  const b=atlasBoundsCurrentV20(),sh=sheetsV20().filter(s=>atlasSelectedV20(s.index)&&(mode!=='one'||s.index===one)),pages=[];
  if(mode==='full'&&atlasV20.includeOverview){
    pages.push(mapPageV20(b,atlasV20.overview1,'Обзор территории · 1'));
    if(atlasV20.overview2!==atlasV20.overview1)pages.push(mapPageV20(b,atlasV20.overview2,'Обзор территории · 2'));
  }
  sh.forEach(s=>pages.push(mapPageV20(s,atlasSourceForSheetV20(s.index),`Лист ${s.index} · сектор`,s)));
  if(mode==='full'&&atlasV20.includePlan)pages.push(tablePlanV20());
  if(mode==='full'&&atlasV20.includeNav)pages.push(tableNavV20());
  return pages.join('');
}
function openAtlasOutputV20(mode='full',one=0){
  if(!validateSourcesV20(mode,one))return;
  const w=window.open('','_blank');if(!w){toast('Браузер заблокировал окно печати');return}
  const title=mode==='one'?`Лист ${one} — полевой атлас`:mode==='sheets'?'Детальные листы — полевой атлас':'Полевой атлас';
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${printCssV20()}</style></head><body><div class="printbar"><button onclick="window.print()">Печать / сохранить PDF</button>Подожди, пока картографические тайлы полностью загрузятся.</div>${outputPagesV20(mode,one)}</body></html>`);w.document.close();
}
openAtlasPrintV13=openAtlasDesignerV20;
const bindV20Base=bind;
bind=function(){bindV20Base();const b=document.getElementById('exportAtlasV13');if(b){b.textContent='Конструктор атласа';b.title='Настроить область, разбиение, подложки и печатные листы'}};
const buildV20=document.querySelector('.build-label');if(buildV20)buildV20.textContent='V14 · финальный маршрут · конструктор атласа';
render();


;/* source: hikes-preview/map-studio-v21.js */
/* V15 — fullscreen map studio: route, checkpoints, generic marks, grid and atlas sheets. */
const MAP_STUDIO_V21_KEY='rl_map_studio_v21';
const MAP_MARK_TYPES_V21={
  poi:{label:'Точка',icon:'•'},
  camp:{label:'Лагерь',icon:'▲'},
  parking:{label:'Парковка',icon:'P'},
  water:{label:'Вода / родник',icon:'≈'},
  meeting:{label:'Место встречи',icon:'◎'},
  warning:{label:'Важное место',icon:'!'}
};
const MAP_BASES_V21={
  trail:{label:'Тропы',hint:'OSM · дороги и тропы'},
  sat:{label:'Спутник',hint:'Esri World Imagery'},
  city:{label:'Город',hint:'Яндекс при наличии ключа · иначе городская схема'}
};
let studioV21={
  open:false,map:null,base:'trail',tile:null,tool:'select',selected:null,
  route:null,routeHit:null,handles:[],cps:{},marks:{},grid:null,atlas:[],atlasArea:null,
  pathA:null,pathB:null,pathALayer:null,pathBLayer:null,pathPreview:null,pathBusy:false,
  areaA:null,areaALayer:null,areaPreview:null,
  history:[],future:[],baseEditor:null,baseAtlas:null,dirty:false,mouse:null
};

function cloneV21(v){return JSON.parse(JSON.stringify(v))}
function ensureMapDataV21(){if(!Array.isArray(editorV13.marks))editorV13.marks=[];if(!editorV13.grid)editorV13.grid={cell:200,offsetX:0,offsetY:0}}
function loadStudioPrefsV21(){try{return JSON.parse(localStorage.getItem(MAP_STUDIO_V21_KEY)||'{}')||{}}catch(e){return {}}}
function saveStudioPrefsV21(){try{localStorage.setItem(MAP_STUDIO_V21_KEY,JSON.stringify({base:studioV21.base,tool:studioV21.tool}))}catch(e){}}
function mapCityUsesYandexV21(){return typeof yandexKeyV20==='function'&&!!yandexKeyV20()}
function tileSpecStudioV21(kind){
  if(kind==='sat')return {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',opts:{maxZoom:19,keepBuffer:5,updateWhenZooming:false,attribution:'Tiles © Esri'}};
  if(kind==='city'&&mapCityUsesYandexV21())return {url:`https://tiles.api-maps.yandex.ru/v1/tiles/?apikey=${encodeURIComponent(yandexKeyV20())}&lang=ru_RU&x={x}&y={y}&z={z}&l=map&projection=web_mercator`,opts:{maxZoom:19,keepBuffer:5,updateWhenZooming:false,attribution:'© Яндекс Карты'}};
  if(kind==='city')return {url:'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',opts:{maxZoom:20,keepBuffer:5,updateWhenZooming:false,attribution:'© OpenStreetMap contributors © CARTO'}};
  return {url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',opts:{maxZoom:19,keepBuffer:5,updateWhenZooming:false,attribution:'© OpenStreetMap contributors'}};
}
function makeStudioTileV21(kind){const s=tileSpecStudioV21(kind);return L.tileLayer(s.url,s.opts)}
function studioRootV21(){let e=document.getElementById('mapStudioV21');if(!e){e=document.createElement('div');e.id='mapStudioV21';document.body.appendChild(e)}return e}
function studioIsDirtyV21(){return studioV21.dirty||!sameV21(editorV13,studioV21.baseEditor)||!sameV21(atlasV20,studioV21.baseAtlas)}
function sameV21(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}}
function markDirtyV21(){studioV21.dirty=true;updateStudioStatusV21()}
function pushStudioHistoryV21(){studioV21.history.push({editor:cloneV21(editorV13),atlas:cloneV21(atlasV20)});if(studioV21.history.length>60)studioV21.history.shift();studioV21.future=[]}
function restoreStudioSnapshotV21(s){if(!s)return;editorV13=cloneV21(s.editor);atlasV20=cloneV21(s.atlas);ensureMapDataV21();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();updateStudioHeaderMetricsV21()}
function undoStudioV21(){if(!studioV21.history.length)return;studioV21.future.push({editor:cloneV21(editorV13),atlas:cloneV21(atlasV20)});restoreStudioSnapshotV21(studioV21.history.pop())}
function redoStudioV21(){if(!studioV21.future.length)return;studioV21.history.push({editor:cloneV21(editorV13),atlas:cloneV21(atlasV20)});restoreStudioSnapshotV21(studioV21.future.pop())}
function saveStudioV21(){
  try{persistEditorV15()}catch(e){try{localStorage.setItem(EDITOR_V13_KEY,JSON.stringify(editorV13))}catch(_e){}}
  try{saveAtlasV20()}catch(e){}
  try{syncEventV13()}catch(e){}
  studioV21.baseEditor=cloneV21(editorV13);studioV21.baseAtlas=cloneV21(atlasV20);studioV21.dirty=false;
  updateStudioStatusV21();toast('Карта и маршрут сохранены');
}
function discardStudioV21(){editorV13=cloneV21(studioV21.baseEditor);atlasV20=cloneV21(studioV21.baseAtlas);studioV21.dirty=false;studioV21.history=[];studioV21.future=[];drawStudioAllV21();renderStudioInspectorV21();updateStudioHeaderMetricsV21();toast('Изменения отменены')}
function closeStudioV21(force=false){
  if(!force&&studioIsDirtyV21()&&!confirm('Есть несохранённые изменения. Закрыть карту без сохранения?'))return;
  if(studioIsDirtyV21()){editorV13=cloneV21(studioV21.baseEditor);atlasV20=cloneV21(studioV21.baseAtlas)}
  try{studioV21.map?.remove()}catch(e){}
  studioV21.open=false;studioV21.map=null;document.getElementById('mapStudioV21')?.remove();document.body.classList.remove('map-studio-open-v21');
  try{render()}catch(e){}
}
function openStudioV21(){
  ensureMapDataV21();
  const prefs=loadStudioPrefsV21();
  studioV21.open=true;studioV21.base=['trail','sat','city'].includes(prefs.base)?prefs.base:'trail';studioV21.tool='select';studioV21.selected=null;
  studioV21.pathA=studioV21.pathB=null;studioV21.areaA=null;studioV21.history=[];studioV21.future=[];studioV21.baseEditor=cloneV21(editorV13);studioV21.baseAtlas=cloneV21(atlasV20);studioV21.dirty=false;
  document.body.classList.add('map-studio-open-v21');renderStudioShellV21();requestAnimationFrame(mountStudioMapV21)
}

function renderStudioShellV21(){
  const root=studioRootV21();
  root.className='map-studio-v21';
  root.innerHTML=`<header class="studio-top-v21">
    <div class="studio-title-v21"><button class="studio-icon-btn-v21" id="studioCloseV21" title="Закрыть">←</button><div><small>КАРТОГРАФИЧЕСКАЯ МАСТЕРСКАЯ</small><strong>Томинский лесопарк</strong></div></div>
    <div class="studio-base-switch-v21">${Object.entries(MAP_BASES_V21).map(([k,v])=>`<button data-studio-base="${k}" class="${studioV21.base===k?'active':''}"><b>${v.label}</b><small>${v.hint}</small></button>`).join('')}</div>
    <div class="studio-top-actions-v21"><span id="studioSaveStateV21" class="studio-save-state-v21">Сохранено</span><button class="studio-btn-v21 ghost" id="studioDiscardV21">Не сохранять</button><button class="studio-btn-v21 primary" id="studioSaveV21">Сохранить</button></div>
  </header>
  <div class="studio-body-v21">
    <nav class="studio-tools-v21">
      ${studioToolButtonV21('select','↖','Выбрать / двигать')}
      ${studioToolButtonV21('add','＋','Добавить узел')}
      ${studioToolButtonV21('path','⌁','По тропе A→B')}
      ${studioToolButtonV21('cp','КП','Контрольные точки')}
      ${studioToolButtonV21('mark','●','Метки')}
      ${studioToolButtonV21('grid','▦','Сетка')}
      ${studioToolButtonV21('atlas','▤','Листы атласа')}
      <span class="studio-tools-sep-v21"></span>
      <button id="studioUndoV21" title="Отменить">↶</button><button id="studioRedoV21" title="Повторить">↷</button>
    </nav>
    <main class="studio-map-wrap-v21"><div id="studioMapV21" class="studio-map-v21"></div><div class="studio-cross-v21" id="studioCrossV21"></div>
      <div class="studio-map-quick-v21"><button id="studioFitRouteV21">Весь маршрут</button><button id="studioFitAreaV21">Область атласа</button><button id="studioNakarteV21">Nakarte ↗</button><button id="studioYandexV21">Яндекс ↗</button></div>
    </main>
    <aside class="studio-inspector-v21" id="studioInspectorV21"></aside>
  </div>
  <footer class="studio-status-v21"><span id="studioCoordV21">—</span><span id="studioGridCodeV21">Квадрат —</span><span id="studioDistanceV21">${(routeLenV13()/1000).toFixed(2).replace('.',',')} км</span><span id="studioEtaV21">Финиш ${finalEtaV13()}</span><span id="studioZoomV21">zoom —</span></footer>`;
  bindStudioShellV21();renderStudioInspectorV21();updateStudioStatusV21();
}
function studioToolButtonV21(tool,icon,label){return `<button data-studio-tool="${tool}" class="${studioV21.tool===tool?'active':''}" title="${label}"><span>${icon}</span><small>${label}</small></button>`}
function bindStudioShellV21(){
  document.getElementById('studioCloseV21')?.addEventListener('click',()=>closeStudioV21(false));
  document.getElementById('studioSaveV21')?.addEventListener('click',saveStudioV21);
  document.getElementById('studioDiscardV21')?.addEventListener('click',()=>{if(!studioIsDirtyV21()||confirm('Отменить все изменения после последнего сохранения?'))discardStudioV21()});
  document.getElementById('studioUndoV21')?.addEventListener('click',undoStudioV21);document.getElementById('studioRedoV21')?.addEventListener('click',redoStudioV21);
  document.querySelectorAll('[data-studio-tool]').forEach(b=>b.addEventListener('click',()=>setStudioToolV21(b.dataset.studioTool)));
  document.querySelectorAll('[data-studio-base]').forEach(b=>b.addEventListener('click',()=>setStudioBaseV21(b.dataset.studioBase)));
  document.getElementById('studioFitRouteV21')?.addEventListener('click',fitStudioRouteV21);document.getElementById('studioFitAreaV21')?.addEventListener('click',fitStudioAreaV21);
  document.getElementById('studioNakarteV21')?.addEventListener('click',openNakarteV21);document.getElementById('studioYandexV21')?.addEventListener('click',openYandexV21);
}
function setStudioToolV21(tool){
  if(!['select','add','path','cp','mark','grid','atlas'].includes(tool))return;
  studioV21.tool=tool;studioV21.selected=null;if(tool!=='path')clearStudioPathV21();if(tool!=='atlas')clearStudioAreaPickV21();saveStudioPrefsV21();
  document.querySelectorAll('[data-studio-tool]').forEach(b=>b.classList.toggle('active',b.dataset.studioTool===tool));
  studioV21.map?.getContainer().classList.toggle('crosshair',['add','cp','mark','atlas'].includes(tool));drawStudioAllV21();renderStudioInspectorV21();
}
function setStudioBaseV21(kind){
  if(!MAP_BASES_V21[kind]||!studioV21.map)return;studioV21.base=kind;saveStudioPrefsV21();document.querySelectorAll('[data-studio-base]').forEach(b=>b.classList.toggle('active',b.dataset.studioBase===kind));
  const next=makeStudioTileV21(kind),old=studioV21.tile;next.addTo(studioV21.map);next.once('load',()=>{if(old&&studioV21.map?.hasLayer(old))studioV21.map.removeLayer(old)});setTimeout(()=>{if(old&&studioV21.map?.hasLayer(old))studioV21.map.removeLayer(old)},2200);studioV21.tile=next;renderStudioInspectorV21();
}
function mountStudioMapV21(){
  const el=document.getElementById('studioMapV21');if(!el||!window.L)return;
  studioV21.map=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:110,minZoom:3,maxZoom:20,fadeAnimation:false,markerZoomAnimation:false});
  studioV21.tile=makeStudioTileV21(studioV21.base).addTo(studioV21.map);fitStudioRouteV21(false);drawStudioAllV21();
  studioV21.map.on('mousemove',e=>{studioV21.mouse=e.latlng;updateStudioMouseV21(e.latlng)});
  studioV21.map.on('zoomend',()=>{drawStudioAllV21();updateStudioMouseV21(studioV21.mouse);updateStudioStatusV21()});
  studioV21.map.on('click',handleStudioMapClickV21);
  studioV21.map.on('mousemove',e=>{if(studioV21.tool==='atlas'&&studioV21.areaA)drawAreaPreviewV21(e.latlng)});
  setTimeout(()=>studioV21.map?.invalidateSize(false),80);
}
function clearLayerV21(layer){if(layer&&studioV21.map?.hasLayer(layer))studioV21.map.removeLayer(layer)}
function clearStudioDrawV21(){
  clearLayerV21(studioV21.route);clearLayerV21(studioV21.routeHit);studioV21.handles.forEach(clearLayerV21);studioV21.handles=[];
  Object.values(studioV21.cps).forEach(clearLayerV21);studioV21.cps={};Object.values(studioV21.marks).forEach(clearLayerV21);studioV21.marks={};
  clearLayerV21(studioV21.grid);studioV21.grid=null;studioV21.atlas.forEach(clearLayerV21);studioV21.atlas=[];clearLayerV21(studioV21.atlasArea);studioV21.atlasArea=null;
}
function drawStudioAllV21(){if(!studioV21.map)return;clearStudioDrawV21();drawStudioGridV21();drawStudioAtlasV21();drawStudioRouteV21();drawStudioCpsV21();drawStudioMarksV21();drawPathAnchorsV21();updateStudioHeaderMetricsV21();updateStudioStatusV21()}
function routeHandleStepV21(){const z=studioV21.map?.getZoom()||15;if(z>=18)return 1;if(z>=17)return 2;if(z>=16)return 4;if(z>=15)return 8;if(z>=14)return 14;return 24}
function routePointIconV21(i,active=false){const last=editorV13.route.length-1,label=i===0?'С':i===last?'Ф':'';return L.divIcon({className:'',html:`<span class="studio-route-node-v21 ${label?'endpoint':''} ${active?'active':''}">${label}</span>`,iconSize:[label?26:14,label?26:14],iconAnchor:[label?13:7,label?13:7]})}
function drawStudioRouteV21(){
  const map=studioV21.map;if(!map)return;
  studioV21.route=L.polyline(editorV13.route,{color:'#6c22c7',weight:5,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.05,interactive:false}).addTo(map);
  studioV21.routeHit=L.polyline(editorV13.route,{color:'#000',weight:24,opacity:0,interactive:true,bubblingMouseEvents:false}).addTo(map);
  studioV21.routeHit.on('click',e=>{L.DomEvent.stopPropagation(e);handleStudioRouteClickV21(e.latlng)});
  if(studioV21.tool==='select'){
    const step=routeHandleStepV21(),last=editorV13.route.length-1;
    editorV13.route.forEach((p,i)=>{if(i!==0&&i!==last&&i%step!==0&&!(studioV21.selected?.type==='vertex'&&studioV21.selected?.index===i))return;const m=L.marker(p,{icon:routePointIconV21(i,studioV21.selected?.type==='vertex'&&studioV21.selected.index===i),draggable:true,zIndexOffset:(i===0||i===last)?1400:1000}).addTo(map);m._routeIndexV21=i;
      m.on('dragstart',()=>pushStudioHistoryV21());m.on('drag',ev=>{const ll=ev.target.getLatLng();moveRouteVertexV21(i,ll.lat,ll.lng,false)});m.on('dragend',ev=>{const ll=ev.target.getLatLng();moveRouteVertexV21(i,ll.lat,ll.lng,true);studioV21.selected={type:'vertex',index:i};markDirtyV21();renderStudioInspectorV21();drawStudioAllV21()});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);studioV21.selected={type:'vertex',index:i};renderStudioInspectorV21();drawStudioAllV21()});studioV21.handles.push(m)})
  }
}
function moveRouteVertexV21(i,lat,lon,final){
  const last=editorV13.route.length-1;editorV13.route[i]=[lat,lon];
  if(i===0){const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=lat;s.lon=lon}if(editorV13.loopLocked!==false){editorV13.route[last]=[lat,lon];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=lat;f.lon=lon}}}
  if(i===last){const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=lat;f.lon=lon}if(editorV13.loopLocked!==false){editorV13.route[0]=[lat,lon];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=lat;s.lon=lon}}}
  if(studioV21.route)studioV21.route.setLatLngs(editorV13.route);if(studioV21.routeHit)studioV21.routeHit.setLatLngs(editorV13.route);if(final)markDirtyV21();updateStudioHeaderMetricsV21();
}
function handleStudioRouteClickV21(ll){
  if(studioV21.tool==='add')return addRouteNodeV21(ll);
  if(studioV21.tool==='path')return choosePathAnchorV21(ll);
  if(studioV21.tool==='select'){const n=nearestRouteV13(ll.lat,ll.lng);if(n){studioV21.selected={type:'segment',index:n.seg,near:n};renderStudioInspectorV21()}}
}
function addRouteNodeV21(ll){const n=nearestRouteV13(ll.lat,ll.lng);if(!n)return;pushStudioHistoryV21();const p=[n.lat,n.lon];editorV13.route.splice(n.seg+1,0,p);rebuildTerrainAfterInsertV21(n.seg);studioV21.selected={type:'vertex',index:n.seg+1};studioV21.tool='select';markDirtyV21();document.querySelectorAll('[data-studio-tool]').forEach(b=>b.classList.toggle('active',b.dataset.studioTool==='select'));drawStudioAllV21();renderStudioInspectorV21();toast('Узел добавлен. Теперь его можно перетащить.')}
function rebuildTerrainAfterInsertV21(seg){const next={};Object.entries(editorV13.terrain||{}).forEach(([k,v])=>{const i=+k;next[i>seg?i+1:i]=v});next[seg+1]=next[seg]||'unknown';editorV13.terrain=next}
function deleteRouteNodeV21(i){const last=editorV13.route.length-1;if(i<=0||i>=last){toast('Старт и финиш можно двигать, но нельзя удалить');return}pushStudioHistoryV21();editorV13.route.splice(i,1);const next={};Object.entries(editorV13.terrain||{}).forEach(([k,v])=>{const n=+k;if(n===i)return;next[n>i?n-1:n]=v});editorV13.terrain=next;studioV21.selected=null;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function updateSelectedVertexCoordsV21(){const i=studioV21.selected?.index,lat=+document.getElementById('studioVertexLatV21')?.value,lon=+document.getElementById('studioVertexLonV21')?.value;if(!Number.isFinite(i)||!Number.isFinite(lat)||!Number.isFinite(lon))return toast('Проверь координаты');pushStudioHistoryV21();moveRouteVertexV21(i,lat,lon,true);drawStudioAllV21();renderStudioInspectorV21()}

function cpIconStudioV21(cp,active){return L.divIcon({className:'',html:`<span class="studio-cp-v21 ${active?'active':''}">${esc(cp.number)}</span>`,iconSize:[26,26],iconAnchor:[13,13]})}
function drawStudioCpsV21(){const map=studioV21.map;if(!map)return;dynamicCpsV13().forEach(cp=>{const drag=studioV21.tool==='cp',m=L.marker([cp.lat,cp.lon],{icon:cpIconStudioV21(cp,studioV21.selected?.type==='cp'&&studioV21.selected.id===cp.id),draggable:drag,zIndexOffset:1250}).addTo(map);m.bindTooltip(`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title} · ${gridCodeDynamicV13(cp.lat,cp.lon)}`,{direction:'top'});m.on('click',e=>{L.DomEvent.stopPropagation(e);studioV21.selected={type:'cp',id:cp.id};renderStudioInspectorV21();drawStudioAllV21()});if(drag){m.on('dragstart',()=>pushStudioHistoryV21());m.on('dragend',e=>{const ll=e.target.getLatLng(),obj=editorV13.cps.find(x=>x.id===cp.id);if(!obj)return;obj.lat=ll.lat;obj.lon=ll.lng;if(cp.id==='cp0'||cp.id==='cpf')moveCpEndpointV21(cp.id,ll.lat,ll.lng);markDirtyV21();studioV21.selected={type:'cp',id:cp.id};drawStudioAllV21();renderStudioInspectorV21()})}studioV21.cps[cp.id]=m})}
function moveCpEndpointV21(id,lat,lon){const last=editorV13.route.length-1;if(id==='cp0'){editorV13.route[0]=[lat,lon];if(editorV13.loopLocked!==false){editorV13.route[last]=[lat,lon];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=lat;f.lon=lon}}}else{editorV13.route[last]=[lat,lon];if(editorV13.loopLocked!==false){editorV13.route[0]=[lat,lon];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=lat;s.lon=lon}}}}
function addCpStudioV21(ll){pushStudioHistoryV21();const n=nearestRouteV13(ll.lat,ll.lng),id='cp_'+Date.now();editorV13.cps.push({id,title:'Новая контрольная точка',lat:n?.lat||ll.lat,lon:n?.lon||ll.lng,stopMin:0,locked:false});studioV21.selected={type:'cp',id};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function saveCpStudioV21(){const id=studioV21.selected?.id,cp=editorV13.cps.find(x=>x.id===id);if(!cp)return;const title=document.getElementById('studioCpTitleV21')?.value.trim(),stopMin=Math.max(0,+document.getElementById('studioCpStopV21')?.value||0),lat=+document.getElementById('studioCpLatV21')?.value,lon=+document.getElementById('studioCpLonV21')?.value;if(!title||!Number.isFinite(lat)||!Number.isFinite(lon))return toast('Проверь название и координаты');pushStudioHistoryV21();Object.assign(cp,{title,stopMin,lat,lon});if(id==='cp0'||id==='cpf')moveCpEndpointV21(id,lat,lon);markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function deleteCpStudioV21(){const id=studioV21.selected?.id,cp=editorV13.cps.find(x=>x.id===id);if(!cp||cp.locked)return toast('Старт и финиш удалить нельзя');pushStudioHistoryV21();editorV13.cps=editorV13.cps.filter(x=>x.id!==id);studioV21.selected=null;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}

function markIconV21(m,active=false){const meta=MAP_MARK_TYPES_V21[m.type]||MAP_MARK_TYPES_V21.poi;return L.divIcon({className:'',html:`<span class="studio-mark-v21 ${active?'active':''}">${meta.icon}</span>`,iconSize:[24,24],iconAnchor:[12,12]})}
function drawStudioMarksV21(){const map=studioV21.map;if(!map)return;ensureMapDataV21();editorV13.marks.forEach(m=>{const marker=L.marker([m.lat,m.lon],{icon:markIconV21(m,studioV21.selected?.type==='mark'&&studioV21.selected.id===m.id),draggable:studioV21.tool==='mark',zIndexOffset:1180}).addTo(map);marker.bindTooltip(`${m.title||'Метка'} · ${(+m.lat).toFixed(6)}, ${(+m.lon).toFixed(6)}`,{direction:'top'});marker.on('click',e=>{L.DomEvent.stopPropagation(e);studioV21.selected={type:'mark',id:m.id};renderStudioInspectorV21();drawStudioAllV21()});if(studioV21.tool==='mark'){marker.on('dragstart',()=>pushStudioHistoryV21());marker.on('dragend',e=>{const ll=e.target.getLatLng();m.lat=ll.lat;m.lon=ll.lng;markDirtyV21();studioV21.selected={type:'mark',id:m.id};drawStudioAllV21();renderStudioInspectorV21()})}studioV21.marks[m.id]=marker})}
function addMarkStudioV21(ll){pushStudioHistoryV21();const id='m_'+Date.now();editorV13.marks.push({id,type:'poi',title:'Новая точка',note:'',lat:ll.lat,lon:ll.lng});studioV21.selected={type:'mark',id};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function saveMarkStudioV21(){const id=studioV21.selected?.id,m=editorV13.marks.find(x=>x.id===id);if(!m)return;const title=document.getElementById('studioMarkTitleV21')?.value.trim(),type=document.getElementById('studioMarkTypeV21')?.value||'poi',note=document.getElementById('studioMarkNoteV21')?.value||'',lat=+document.getElementById('studioMarkLatV21')?.value,lon=+document.getElementById('studioMarkLonV21')?.value;if(!title||!Number.isFinite(lat)||!Number.isFinite(lon))return toast('Проверь название и координаты');pushStudioHistoryV21();Object.assign(m,{title,type,note,lat,lon});markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function deleteMarkStudioV21(){const id=studioV21.selected?.id;pushStudioHistoryV21();editorV13.marks=editorV13.marks.filter(x=>x.id!==id);studioV21.selected=null;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}

function studioGridBoundsV21(){const a=atlasV20.area||routeBoundsV20(Math.max(350,+atlasV20.margin||350)),map=studioV21.map;if(!map)return a;const b=map.getBounds();return {west:Math.min(a.west,b.getWest()),east:Math.max(a.east,b.getEast()),south:Math.min(a.south,b.getSouth()),north:Math.max(a.north,b.getNorth())}}
function drawStudioGridV21(){if(studioV21.tool!=='grid'&&!gridEnabledV12)return;const map=studioV21.map,b=studioGridBoundsV21(),g=gridCfgV13(),group=L.layerGroup(),x0=mercXV12(b.west),x1=mercXV12(b.east),y0=mercYV12(b.south),y1=mercYV12(b.north);const cMin=Math.max(0,Math.floor((x0-g.x0)/g.dx)-1),cMax=Math.ceil((x1-g.x0)/g.dx)+1,rMin=Math.max(0,Math.floor((g.y1-y1)/g.dy)-1),rMax=Math.ceil((g.y1-y0)/g.dy)+1,line={color:'#3f4542',weight:.75,opacity:.52,interactive:false};for(let c=cMin;c<=cMax;c++){const lon=lonFromXV12(g.x0+c*g.dx);L.polyline([[b.south,lon],[b.north,lon]],line).addTo(group)}for(let r=rMin;r<=rMax;r++){const lat=latFromYV12(g.y1-r*g.dy);L.polyline([[lat,b.west],[lat,b.east]],line).addTo(group)}if(map.getZoom()>=13){for(let c=cMin;c<cMax;c++){const lon=lonFromXV12(g.x0+(c+.5)*g.dx);L.marker([b.north,lon],{icon:L.divIcon({className:'',html:`<span class="studio-grid-label-v21">${String(c+1).padStart(2,'0')}</span>`,iconSize:[28,16],iconAnchor:[14,8]}),interactive:false}).addTo(group)}for(let r=rMin;r<rMax;r++){const lat=latFromYV12(g.y1-(r+.5)*g.dy);L.marker([lat,b.west],{icon:L.divIcon({className:'',html:`<span class="studio-grid-label-v21 row">${rowCodeV13(r)}</span>`,iconSize:[24,16],iconAnchor:[12,8]}),interactive:false}).addTo(group)}}studioV21.grid=group.addTo(map)}
function applyStudioGridV21(){const cell=Math.max(50,Math.min(1000,+document.getElementById('studioGridCellV21')?.value||200)),offsetX=+document.getElementById('studioGridXV21')?.value||0,offsetY=+document.getElementById('studioGridYV21')?.value||0;pushStudioHistoryV21();editorV13.grid={...editorV13.grid,cell,offsetX,offsetY};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function resetStudioGridV21(){pushStudioHistoryV21();editorV13.grid={cell:200,offsetX:0,offsetY:0};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function anchorGridToAreaV21(){const b=atlasBoundsCurrentV20();pushStudioHistoryV21();const cell=Math.max(50,+editorV13.grid.cell||200),cos=Math.max(.2,Math.cos(((b.north+b.south)/2)*Math.PI/180)),proj=cell/cos;editorV13.grid={cell,offsetX:0,offsetY:0,originX:mercXV12(b.west),originY:mercYV12(b.north),metricStep:proj,originCell:cell};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();toast('Сетка привязана к левому верхнему углу выбранной области')}
const gridCfgV13BeforeV21=gridCfgV13;
gridCfgV13=function(){const g=editorV13.grid||{};if(Number.isFinite(+g.originX)&&Number.isFinite(+g.originY)){const cell=Math.max(50,Math.min(1000,+g.cell||200)),base=Number.isFinite(+g.metricStep)?+g.metricStep:cell/Math.max(.2,Math.cos((editorV13.route?.[0]?.[0]||55.58)*Math.PI/180));const scale=cell/Math.max(1,+g.originCell||cell);return {cell,dx:base*scale,dy:base*scale,x0:+g.originX+(+g.offsetX||0)/Math.max(.2,Math.cos((editorV13.route?.[0]?.[0]||55.58)*Math.PI/180)),y1:+g.originY+(+g.offsetY||0)/Math.max(.2,Math.cos((editorV13.route?.[0]?.[0]||55.58)*Math.PI/180))}}return gridCfgV13BeforeV21()};

function drawStudioAtlasV21(){if(studioV21.tool!=='atlas')return;const map=studioV21.map,b=atlasBoundsCurrentV20();studioV21.atlasArea=L.rectangle([[b.south,b.west],[b.north,b.east]],{color:'#c7a65a',weight:3,dashArray:'8 5',fill:false,interactive:false}).addTo(map);sheetsV20().forEach(s=>{const r=L.rectangle([[s.south,s.west],[s.north,s.east]],{color:'#171815',weight:1.4,opacity:.8,fillColor:'#c7a65a',fillOpacity:.035,interactive:false}).addTo(map);const c=[(s.north+s.south)/2,(s.east+s.west)/2];const label=L.marker(c,{icon:L.divIcon({className:'',html:`<span class="studio-sheet-label-v21">${s.index}</span>`,iconSize:[28,28],iconAnchor:[14,14]}),interactive:false}).addTo(map);studioV21.atlas.push(r,label)})}
function startStudioAreaPickV21(){studioV21.tool='atlas';studioV21.areaA=null;clearStudioAreaPickV21();document.querySelectorAll('[data-studio-tool]').forEach(b=>b.classList.toggle('active',b.dataset.studioTool==='atlas'));renderStudioInspectorV21();toast('Кликни первый угол области, затем противоположный')}
function clearStudioAreaPickV21(){studioV21.areaA=null;clearLayerV21(studioV21.areaALayer);clearLayerV21(studioV21.areaPreview);studioV21.areaALayer=studioV21.areaPreview=null}
function handleStudioAreaClickV21(ll){if(!studioV21.areaA){studioV21.areaA=ll;studioV21.areaALayer=L.circleMarker(ll,{radius:6,color:'#171815',weight:2,fillColor:'#c7a65a',fillOpacity:1}).addTo(studioV21.map);renderStudioInspectorV21();return}pushStudioHistoryV21();const a=studioV21.areaA;atlasV20.area={west:Math.min(a.lng,ll.lng),east:Math.max(a.lng,ll.lng),south:Math.min(a.lat,ll.lat),north:Math.max(a.lat,ll.lat)};saveAtlasV20();markDirtyV21();clearStudioAreaPickV21();drawStudioAllV21();renderStudioInspectorV21();toast('Область атласа обновлена')}
function drawAreaPreviewV21(ll){clearLayerV21(studioV21.areaPreview);if(!studioV21.areaA)return;const a=studioV21.areaA;studioV21.areaPreview=L.rectangle([[Math.min(a.lat,ll.lat),Math.min(a.lng,ll.lng)],[Math.max(a.lat,ll.lat),Math.max(a.lng,ll.lng)]],{color:'#c7a65a',weight:2,dashArray:'6 4',fillColor:'#c7a65a',fillOpacity:.08,interactive:false}).addTo(studioV21.map)}
function applyAtlasQuickV21(){const count=+document.getElementById('studioAtlasCountV21')?.value||8,overlap=Math.max(0,+document.getElementById('studioAtlasOverlapV21')?.value||200);pushStudioHistoryV21();atlasV20.sheetCount=count;atlasV20.overlap=overlap;saveAtlasV20();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function areaFromRouteStudioV21(){pushStudioHistoryV21();atlasV20.area=routeBoundsV20(Math.max(0,+atlasV20.margin||350));saveAtlasV20();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();fitStudioAreaV21()}

function nearestAnchorV21(ll){const n=nearestRouteV13(ll.lat,ll.lng);return n?{seg:n.seg,t:n.t,lat:n.lat,lon:n.lon,along:n.along}:null}
function choosePathAnchorV21(ll){const a=nearestAnchorV21(ll);if(!a)return;if(!studioV21.pathA){studioV21.pathA=a;studioV21.pathB=null;drawPathAnchorsV21();renderStudioInspectorV21();toast('A выбран. Теперь выбери конец участка B.');return}studioV21.pathB=a;if(studioV21.pathB.along<studioV21.pathA.along){const t=studioV21.pathA;studioV21.pathA=studioV21.pathB;studioV21.pathB=t}drawPathAnchorsV21();renderStudioInspectorV21();toast('A и B выбраны. Нажми «Проложить по тропам».')}
function drawPathAnchorsV21(){clearLayerV21(studioV21.pathALayer);clearLayerV21(studioV21.pathBLayer);clearLayerV21(studioV21.pathPreview);studioV21.pathALayer=studioV21.pathBLayer=studioV21.pathPreview=null;if(!studioV21.map)return;const mk=(p,l)=>L.marker([p.lat,p.lon],{icon:L.divIcon({className:'',html:`<span class="studio-path-anchor-v21">${l}</span>`,iconSize:[28,28],iconAnchor:[14,14]}),interactive:false,zIndexOffset:1600}).addTo(studioV21.map);if(studioV21.pathA)studioV21.pathALayer=mk(studioV21.pathA,'A');if(studioV21.pathB){studioV21.pathBLayer=mk(studioV21.pathB,'B');const a=studioV21.pathA,b=studioV21.pathB,pts=[[a.lat,a.lon]];for(let i=a.seg+1;i<=b.seg;i++)pts.push(editorV13.route[i]);pts.push([b.lat,b.lon]);studioV21.pathPreview=L.polyline(pts,{color:'#c7a65a',weight:7,opacity:.9,dashArray:'10 7',interactive:false}).addTo(studioV21.map)}}
function clearStudioPathV21(){studioV21.pathA=studioV21.pathB=null;clearLayerV21(studioV21.pathALayer);clearLayerV21(studioV21.pathBLayer);clearLayerV21(studioV21.pathPreview);studioV21.pathALayer=studioV21.pathBLayer=studioV21.pathPreview=null}
async function routeStudioPathV21(){if(studioV21.pathBusy||!studioV21.pathA||!studioV21.pathB)return;studioV21.pathBusy=true;renderStudioInspectorV21();const a=studioV21.pathA,b=studioV21.pathB;try{const u=`https://brouter.de/brouter?lonlats=${a.lon},${a.lat}%7C${b.lon},${b.lat}&profile=trekking&alternativeidx=0&format=geojson`,r=await fetch(u);if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json(),coords=j?.features?.[0]?.geometry?.coordinates||j?.geometry?.coordinates;if(!Array.isArray(coords)||coords.length<2)throw new Error('no geometry');pushStudioHistoryV21();const repl=coords.map(c=>[+c[1],+c[0]]),prefix=editorV13.route.slice(0,a.seg+1),suffix=editorV13.route.slice(b.seg+1);if(havV13(prefix[prefix.length-1],[a.lat,a.lon])>.2)prefix.push([a.lat,a.lon]);if(havV13(repl[0],[a.lat,a.lon])>.2)repl.unshift([a.lat,a.lon]);if(havV13(repl[repl.length-1],[b.lat,b.lon])>.2)repl.push([b.lat,b.lon]);if(suffix.length&&havV13(repl[repl.length-1],suffix[0])<.2)suffix.shift();editorV13.route=[...prefix,...repl,...suffix];editorV13.terrain={};const start=prefix.length-1;for(let i=start;i<start+repl.length-1;i++)editorV13.terrain[i]='trail';clearStudioPathV21();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();toast('Фрагмент перестроен по доступным тропам OSM. Проверь линию перед сохранением.')}catch(e){console.error(e);toast('Автопрокладка не получилась. A и B оставлены — можно переставить одну границу и повторить.')}finally{studioV21.pathBusy=false;renderStudioInspectorV21()}}

function handleStudioMapClickV21(e){const ll=e.latlng;if(studioV21.tool==='cp')return addCpStudioV21(ll);if(studioV21.tool==='mark')return addMarkStudioV21(ll);if(studioV21.tool==='atlas')return handleStudioAreaClickV21(ll);if(studioV21.tool==='grid'){const c=gridCellDynamicV13(ll.lat,ll.lng);if(c)toast(`Квадрат ${c.code}`)}}
function fitStudioRouteV21(animate=true){if(!studioV21.map||!editorV13.route?.length)return;studioV21.map.fitBounds(L.latLngBounds(editorV13.route),{padding:[46,46],animate})}
function fitStudioAreaV21(){if(!studioV21.map)return;const b=atlasBoundsCurrentV20();studioV21.map.fitBounds([[b.south,b.west],[b.north,b.east]],{padding:[38,38],animate:true})}
function openNakarteV21(){if(!studioV21.map)return;const c=studioV21.map.getCenter(),z=Math.round(studioV21.map.getZoom()),l=studioV21.base==='sat'?'S':'O';window.open(`https://nakarte.me/#m=${z}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}&l=${l}`,'_blank','noopener')}
function openYandexV21(){if(!studioV21.map)return;const c=studioV21.map.getCenter(),z=Math.round(studioV21.map.getZoom());window.open(`https://yandex.ru/maps/?ll=${encodeURIComponent(c.lng+','+c.lat)}&z=${z}`,'_blank','noopener')}
function downloadGeoJsonV21(){ensureMapDataV21();const features=[{type:'Feature',properties:{name:'Маршрут'},geometry:{type:'LineString',coordinates:editorV13.route.map(p=>[p[1],p[0]])}},...dynamicCpsV13().map(cp=>({type:'Feature',properties:{name:cp.title,kind:'checkpoint',number:cp.number,stopMin:cp.stopMin||0},geometry:{type:'Point',coordinates:[cp.lon,cp.lat]}})),...editorV13.marks.map(m=>({type:'Feature',properties:{name:m.title,kind:m.type,note:m.note||''},geometry:{type:'Point',coordinates:[m.lon,m.lat]}}))];const b=atlasBoundsCurrentV20();features.push({type:'Feature',properties:{name:'Область атласа',kind:'atlas'},geometry:{type:'Polygon',coordinates:[[[b.west,b.south],[b.east,b.south],[b.east,b.north],[b.west,b.north],[b.west,b.south]]]}});const blob=new Blob([JSON.stringify({type:'FeatureCollection',features},null,2)],{type:'application/geo+json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='field-map.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}

function renderStudioInspectorV21(){const e=document.getElementById('studioInspectorV21');if(!e)return;let h='';
  if(studioV21.tool==='select')h=inspectorSelectV21();
  if(studioV21.tool==='add')h=`<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>Добавить узел</h3></div><div class="studio-help-v21">Кликни по линии маршрута. Новая точка появится прямо на выбранном участке, после чего автоматически включится режим перемещения.</div>`;
  if(studioV21.tool==='path')h=inspectorPathV21();
  if(studioV21.tool==='cp')h=inspectorCpV21();
  if(studioV21.tool==='mark')h=inspectorMarkV21();
  if(studioV21.tool==='grid')h=inspectorGridV21();
  if(studioV21.tool==='atlas')h=inspectorAtlasV21();
  e.innerHTML=h;bindStudioInspectorV21();
}
function inspectorSelectV21(){const s=studioV21.selected;if(s?.type==='vertex'){const p=editorV13.route[s.index],last=editorV13.route.length-1;return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>${s.index===0?'Старт':s.index===last?'Финиш':`Узел ${s.index+1}`}</h3></div><label>Широта<input id="studioVertexLatV21" value="${p[0].toFixed(7)}"></label><label>Долгота<input id="studioVertexLonV21" value="${p[1].toFixed(7)}"></label><button class="studio-btn-v21 primary wide" id="studioVertexApplyV21">Применить координаты</button><button class="studio-btn-v21 danger wide" id="studioVertexDeleteV21" ${s.index===0||s.index===last?'disabled':''}>Удалить точку</button><div class="studio-help-v21">На карте двигается только выбранный узел. Для более точного изгиба сначала добавь новый узел.</div>`}if(s?.type==='segment'){return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>Участок</h3></div><div class="studio-stat-card-v21"><span>Отрезок</span><strong>${((havV13(editorV13.route[s.index],editorV13.route[s.index+1]))/1000).toFixed(2).replace('.',',')} км</strong></div><button class="studio-btn-v21 wide" id="studioSplitSegV21">Добавить узел в середине</button><div class="studio-help-v21">Для автопрокладки большого фрагмента выбери инструмент «По тропе A→B».</div>`}return `<div class="studio-ins-head-v21"><small>РЕДАКТОР</small><h3>Выбрать / двигать</h3></div><div class="studio-help-v21">Приблизь нужный участок. Белые узлы можно перетаскивать независимо. Старт и финиш для замкнутого маршрута двигаются вместе.</div><div class="studio-kpis-v21"><div><span>Длина</span><strong>${(routeLenV13()/1000).toFixed(2).replace('.',',')} км</strong></div><div><span>КП</span><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong></div><div><span>Финиш</span><strong>${finalEtaV13()}</strong></div></div>`}
function inspectorPathV21(){const a=studioV21.pathA,b=studioV21.pathB;return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>По тропе A → B</h3></div><div class="studio-step-v21 ${a?'done':''}"><b>1</b><span>${a?`A · ${(a.along/1000).toFixed(2)} км`:'Кликни на маршруте начало участка'}</span></div><div class="studio-step-v21 ${b?'done':''}"><b>2</b><span>${b?`B · ${(b.along/1000).toFixed(2)} км`:'Кликни на маршруте конец участка'}</span></div><div class="studio-step-v21 ${a&&b?'ready':''}"><b>3</b><span>Проверь выделенный пунктиром фрагмент и запусти прокладку.</span></div><button class="studio-btn-v21 primary wide" id="studioPathGoV21" ${!a||!b||studioV21.pathBusy?'disabled':''}>${studioV21.pathBusy?'Прокладываю…':'Проложить по тропам'}</button><button class="studio-btn-v21 ghost wide" id="studioPathResetV21" ${!a&&!b?'disabled':''}>Сбросить A / B</button><div class="studio-help-v21">Автопрокладка использует trekking-маршрутизацию по известным дорогам и тропам OSM. Если нужной тропы нет в данных, оставь ручную геометрию.</div>`}
function inspectorCpV21(){const id=studioV21.selected?.type==='cp'?studioV21.selected.id:null,cp=id?editorV13.cps.find(x=>x.id===id):null,dyn=id?dynamicCpsV13().find(x=>x.id===id):null;if(!cp)return `<div class="studio-ins-head-v21"><small>КОНТРОЛЬНЫЕ ТОЧКИ</small><h3>Добавить КП</h3></div><div class="studio-help-v21">Кликни в нужном месте карты. Новая КП автоматически привяжется к ближайшему участку маршрута и получит координаты.</div>`;return `<div class="studio-ins-head-v21"><small>${dyn?.number==='С'?'СТАРТ':dyn?.number==='Ф'?'ФИНИШ':`КП ${dyn?.number||''}`}</small><h3>${esc(cp.title)}</h3></div><label>Название<input id="studioCpTitleV21" value="${esc(cp.title)}"></label><label>Остановка, мин<input id="studioCpStopV21" type="number" min="0" max="240" value="${cp.stopMin||0}"></label><div class="studio-grid2-v21"><label>Широта<input id="studioCpLatV21" value="${(+cp.lat).toFixed(7)}"></label><label>Долгота<input id="studioCpLonV21" value="${(+cp.lon).toFixed(7)}"></label></div><div class="studio-stat-card-v21"><span>Квадрат / ETA</span><strong>${gridCodeDynamicV13(cp.lat,cp.lon)} · ${dyn?.arrival||'—'}</strong></div><button class="studio-btn-v21 primary wide" id="studioCpSaveV21">Сохранить КП</button><button class="studio-btn-v21 danger wide" id="studioCpDeleteV21" ${cp.locked?'disabled':''}>Удалить КП</button>`}
function inspectorMarkV21(){const id=studioV21.selected?.type==='mark'?studioV21.selected.id:null,m=id?editorV13.marks.find(x=>x.id===id):null;if(!m)return `<div class="studio-ins-head-v21"><small>МЕТКИ</small><h3>Добавить точку</h3></div><div class="studio-help-v21">Кликни по карте. Метка не влияет на маршрут и время: это отдельный ориентир, парковка, лагерь, вода или произвольная подпись.</div>`;return `<div class="studio-ins-head-v21"><small>МЕТКА</small><h3>${esc(m.title)}</h3></div><label>Тип<select id="studioMarkTypeV21">${Object.entries(MAP_MARK_TYPES_V21).map(([k,v])=>`<option value="${k}" ${m.type===k?'selected':''}>${v.label}</option>`).join('')}</select></label><label>Название<input id="studioMarkTitleV21" value="${esc(m.title)}"></label><label>Описание<textarea id="studioMarkNoteV21" rows="3">${esc(m.note||'')}</textarea></label><div class="studio-grid2-v21"><label>Широта<input id="studioMarkLatV21" value="${(+m.lat).toFixed(7)}"></label><label>Долгота<input id="studioMarkLonV21" value="${(+m.lon).toFixed(7)}"></label></div><button class="studio-btn-v21 primary wide" id="studioMarkSaveV21">Сохранить метку</button><button class="studio-btn-v21 danger wide" id="studioMarkDeleteV21">Удалить метку</button>`}
function inspectorGridV21(){const g=editorV13.grid||{};return `<div class="studio-ins-head-v21"><small>КООРДИНАТНАЯ СЕТКА</small><h3>${+g.cell||200} × ${+g.cell||200} м</h3></div><label>Размер клетки, м<input id="studioGridCellV21" type="number" min="50" max="1000" step="50" value="${+g.cell||200}"></label><div class="studio-grid2-v21"><label>Смещение X, м<input id="studioGridXV21" type="number" step="25" value="${+g.offsetX||0}"></label><label>Смещение Y, м<input id="studioGridYV21" type="number" step="25" value="${+g.offsetY||0}"></label></div><button class="studio-btn-v21 primary wide" id="studioGridApplyV21">Применить</button><button class="studio-btn-v21 wide" id="studioGridAnchorV21">Привязать к области атласа</button><button class="studio-btn-v21 ghost wide" id="studioGridResetV21">Вернуть исходную сетку 200 м</button><div class="studio-help-v21">Для текущего лесопарка исходная привязка совпадает с PDF. Для новой территории можно привязать нулевую точку сетки к выбранной области.</div>`}
function inspectorAtlasV21(){const b=atlasBoundsCurrentV20(),s=boundsSizeV20(b),lay=layoutV20(atlasV20.sheetCount,b);return `<div class="studio-ins-head-v21"><small>ПЕЧАТНЫЙ АТЛАС</small><h3>${lay.cols} × ${lay.rows} · ${atlasV20.sheetCount} листов</h3></div><div class="studio-stat-card-v21"><span>Область</span><strong>${(s.w/1000).toFixed(2).replace('.',',')} × ${(s.h/1000).toFixed(2).replace('.',',')} км</strong></div><div class="studio-grid2-v21"><label>Листов<select id="studioAtlasCountV21">${[2,4,6,8,9,12,16].map(n=>`<option value="${n}" ${+atlasV20.sheetCount===n?'selected':''}>${n}</option>`).join('')}</select></label><label>Перекрытие, м<input id="studioAtlasOverlapV21" type="number" min="0" max="1000" step="50" value="${+atlasV20.overlap||0}"></label></div><button class="studio-btn-v21 primary wide" id="studioAtlasApplyV21">Обновить разбиение</button><button class="studio-btn-v21 wide" id="studioAtlasPickV21">Выбрать область двумя кликами</button><button class="studio-btn-v21 wide" id="studioAtlasRouteV21">Область по маршруту + запас</button><button class="studio-btn-v21 sand wide" id="studioAtlasDesignerV21">Открыть конструктор атласа</button><div class="studio-help-v21">На карте показаны реальные границы листов и зоны перекрытия. Подложку каждого листа, формат бумаги и состав PDF настраивай в конструкторе.</div>`}
function bindStudioInspectorV21(){
  document.getElementById('studioVertexApplyV21')?.addEventListener('click',updateSelectedVertexCoordsV21);document.getElementById('studioVertexDeleteV21')?.addEventListener('click',()=>deleteRouteNodeV21(studioV21.selected?.index));
  document.getElementById('studioSplitSegV21')?.addEventListener('click',()=>{const i=studioV21.selected?.index,a=editorV13.route[i],b=editorV13.route[i+1];if(a&&b)addRouteNodeV21({lat:(a[0]+b[0])/2,lng:(a[1]+b[1])/2})});
  document.getElementById('studioPathGoV21')?.addEventListener('click',routeStudioPathV21);document.getElementById('studioPathResetV21')?.addEventListener('click',()=>{clearStudioPathV21();drawStudioAllV21();renderStudioInspectorV21()});
  document.getElementById('studioCpSaveV21')?.addEventListener('click',saveCpStudioV21);document.getElementById('studioCpDeleteV21')?.addEventListener('click',deleteCpStudioV21);
  document.getElementById('studioMarkSaveV21')?.addEventListener('click',saveMarkStudioV21);document.getElementById('studioMarkDeleteV21')?.addEventListener('click',deleteMarkStudioV21);
  document.getElementById('studioGridApplyV21')?.addEventListener('click',applyStudioGridV21);document.getElementById('studioGridResetV21')?.addEventListener('click',resetStudioGridV21);document.getElementById('studioGridAnchorV21')?.addEventListener('click',anchorGridToAreaV21);
  document.getElementById('studioAtlasApplyV21')?.addEventListener('click',applyAtlasQuickV21);document.getElementById('studioAtlasPickV21')?.addEventListener('click',startStudioAreaPickV21);document.getElementById('studioAtlasRouteV21')?.addEventListener('click',areaFromRouteStudioV21);document.getElementById('studioAtlasDesignerV21')?.addEventListener('click',()=>{saveStudioV21();openAtlasDesignerV20()});
}
function updateStudioMouseV21(ll){if(!ll)return;const c=gridCellDynamicV13(ll.lat,ll.lng),coord=document.getElementById('studioCoordV21'),grid=document.getElementById('studioGridCodeV21');if(coord)coord.textContent=`${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;if(grid)grid.textContent=`Квадрат ${c?.code||'—'}`}
function updateStudioHeaderMetricsV21(){const d=document.getElementById('studioDistanceV21'),e=document.getElementById('studioEtaV21');if(d)d.textContent=`${(routeLenV13()/1000).toFixed(2).replace('.',',')} км`;if(e)e.textContent=`Финиш ${finalEtaV13()}`}
function updateStudioStatusV21(){const s=document.getElementById('studioSaveStateV21'),z=document.getElementById('studioZoomV21'),u=document.getElementById('studioUndoV21'),r=document.getElementById('studioRedoV21');if(s){const dirty=studioIsDirtyV21();s.textContent=dirty?'Есть несохранённые изменения':'Сохранено';s.classList.toggle('dirty',dirty)}if(z&&studioV21.map)z.textContent=`zoom ${studioV21.map.getZoom()}`;if(u)u.disabled=!studioV21.history.length;if(r)r.disabled=!studioV21.future.length}

/* Atlas source simplification: exactly the three map families used in the project. */
if(typeof ATLAS_SOURCES_V20!=='undefined'){
  ATLAS_SOURCES_V20.osm.label='Тропы · OSM';ATLAS_SOURCES_V20.osm.short='Тропы';
  ATLAS_SOURCES_V20.sat.label='Спутник · Esri';ATLAS_SOURCES_V20.sat.short='Спутник';
  ATLAS_SOURCES_V20.city={label:'Город · Яндекс / городская схема',short:'Город',attribution:'© OpenStreetMap contributors © CARTO / © Яндекс Карты'};
}
sourceOptionsV20=function(value,inherit=false){let h=inherit?`<option value="inherit" ${value==='inherit'?'selected':''}>Как для детальных листов</option>`:'';['osm','sat','city'].forEach(k=>{const s=ATLAS_SOURCES_V20[k];h+=`<option value="${k}" ${value===k?'selected':''}>${s.label}</option>`});return h};
const sourceTilesBeforeV21=sourceTilesV20;
sourceTilesV20=function(source,x,y,z){if(source==='city'){if(mapCityUsesYandexV21())return [`https://tiles.api-maps.yandex.ru/v1/tiles/?apikey=${encodeURIComponent(yandexKeyV20())}&lang=ru_RU&x=${x}&y=${y}&z=${z}&l=map&projection=web_mercator`];return [`https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`]}return sourceTilesBeforeV21(source,x,y,z)};
const mapPageBeforeV21=mapPageV20;
mapPageV20=function(bounds,source,title,sheetMeta=null){let html=mapPageBeforeV21(bounds,source,title,sheetMeta);ensureMapDataV21();if(!editorV13.marks.length)return html;const z=zoomForBoundsV20(bounds,!!sheetMeta),nw=tileXYPrintV20(bounds.north,bounds.west,z),se=tileXYPrintV20(bounds.south,bounds.east,z),px0=nw[0]*256,py0=nw[1]*256,W=Math.max(100,se[0]*256-px0),H=Math.max(100,se[1]*256-py0),pxy=(lat,lon)=>{const t=tileXYPrintV20(lat,lon,z);return [t[0]*256-px0,t[1]*256-py0]};let marks='';editorV13.marks.filter(m=>inBoundsV20(m.lat,m.lon,bounds)).forEach(m=>{const p=pxy(m.lat,m.lon),meta=MAP_MARK_TYPES_V21[m.type]||MAP_MARK_TYPES_V21.poi;marks+=`<g class="atlas-mark-v21"><circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+9}" y="${p[1]-8}">${esc(meta.icon)} ${esc(m.title)}</text></g>`});return html.replace('</svg>',`<g class="atlas-marks-v21">${marks}</g></svg>`)};
const printCssBeforeV21=printCssV20;
printCssV20=function(){return printCssBeforeV21()+`.atlas-marks-v21 circle{fill:#c7a65a;stroke:#171815;stroke-width:2}.atlas-marks-v21 text{font:bold 11px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:4}`};

/* Small route map supports the same three viewing modes. */
const tileSpecBeforeV21=tileSpecV11;
tileSpecV11=function(kind){if(kind==='city'){const s=tileSpecStudioV21('city');return {url:s.url,opts:s.opts}}return tileSpecBeforeV21(kind)};
function injectCityButtonV21(){document.querySelectorAll('.map-layer-switch-v11').forEach(g=>{if(g.querySelector('[data-map-layer-v11="city"]'))return;const b=document.createElement('button');b.type='button';b.dataset.mapLayerV11='city';b.textContent='Город';g.appendChild(b);b.addEventListener('click',()=>{if(routeBaseV11==='city')return;replaceBaseV11(routeMapV11,document.querySelector('.map-shell-v11'),'city',false);g.querySelectorAll('[data-map-layer-v11]').forEach(x=>x.classList.toggle('active',x.dataset.mapLayerV11==='city'))})})}

const toolbarBeforeV21=editorToolbarV13;
editorToolbarV13=function(){const s=toolbarBeforeV21();return s.replace(/<\/div>\s*$/,'<button class="btn sand" id="openMapStudioV21">Карта на весь экран</button><button class="btn alt" id="downloadGeoJsonV21">GeoJSON</button></div>')};
const bindBeforeV21=bind;
bind=function(){bindBeforeV21();document.getElementById('openMapStudioV21')?.addEventListener('click',openStudioV21);document.getElementById('downloadGeoJsonV21')?.addEventListener('click',downloadGeoJsonV21);injectCityButtonV21()};
const buildV21=document.querySelector('.build-label');if(buildV21)buildV21.textContent='V15 · полноэкранная карта · финальный атлас';
window.addEventListener('keydown',e=>{if(!studioV21.open)return;if(e.key==='Escape')closeStudioV21(false);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveStudioV21()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoStudioV21():undoStudioV21()}});
render();


;/* source: hikes-preview/map-studio-v21-fix.js */
/* V15.2 — interaction and atlas-output safety fixes. */
if(typeof studioV21!=='undefined'&&studioV21.areaPicking===undefined)studioV21.areaPicking=false;

/* Migrate older atlas source choices to the final three-mode model. */
(function migrateAtlasSourcesV212(){
  const valid=['osm','sat','city'],norm=v=>valid.includes(v)?v:(v==='yandex'?'city':v==='hybrid'?'sat':'osm');
  atlasV20.overview1=norm(atlasV20.overview1);atlasV20.overview2=norm(atlasV20.overview2);atlasV20.detailDefault=norm(atlasV20.detailDefault);
  Object.keys(atlasV20.sheetSources||{}).forEach(k=>{const v=atlasV20.sheetSources[k];if(v!=='inherit')atlasV20.sheetSources[k]=norm(v)});
  try{saveAtlasV20()}catch(e){}
})();

/* The fine metric grid is useful only at working zoom. Never span it between a remote old atlas area and the current viewport. */
studioGridBoundsV21=function(){
  const map=studioV21.map;if(!map)return atlasBoundsCurrentV20();const b=map.getBounds();
  return {west:b.getWest(),east:b.getEast(),south:b.getSouth(),north:b.getNorth()};
};
const drawStudioGridBaseV212=drawStudioGridV21;
drawStudioGridV21=function(){
  const z=studioV21.map?.getZoom?.()||0;
  if(z<13)return;
  return drawStudioGridBaseV212();
};

/* Atlas tool is inspection by default. Two-click area editing starts only after the explicit button. */
const clearStudioAreaPickBaseV212=clearStudioAreaPickV21;
clearStudioAreaPickV21=function(){studioV21.areaPicking=false;return clearStudioAreaPickBaseV212()};
const startStudioAreaPickBaseV212=startStudioAreaPickV21;
startStudioAreaPickV21=function(){startStudioAreaPickBaseV212();studioV21.areaPicking=true;renderStudioInspectorV21()};
const handleStudioMapClickBaseV212=handleStudioMapClickV21;
handleStudioMapClickV21=function(e){
  if(studioV21.tool==='atlas'&&!studioV21.areaPicking)return;
  return handleStudioMapClickBaseV212(e);
};
const pickAreaOnMapBaseV212=pickAreaOnMapV20;
pickAreaOnMapV20=function(){
  if(studioV21.open){closeAtlasV20();startStudioAreaPickV21();return}
  return pickAreaOnMapBaseV212();
};

/* Keep Nakarte integration conservative: satellite uses the known S layer code; other modes only share center/zoom. */
openNakarteV21=function(){
  if(!studioV21.map)return;
  const c=studioV21.map.getCenter(),z=Math.round(studioV21.map.getZoom()),layer=studioV21.base==='sat'?'&l=S':'';
  window.open(`https://nakarte.me/#m=${z}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}${layer}`,'_blank','noopener');
};

/* Make atlas area-picking state explicit. */
const inspectorAtlasBaseV212=inspectorAtlasV21;
inspectorAtlasV21=function(){
  const h=inspectorAtlasBaseV212();
  if(!studioV21.areaPicking)return h;
  return h.replace('<div class="studio-help-v21">','<div class="studio-step-v21 ready"><b>•</b><span>Режим выбора области включён: укажи два противоположных угла на карте.</span></div><div class="studio-help-v21">');
};

/* Add field-atlas essentials missing from the earlier browser print: north arrow and a real metric scale bar. */
const mapPageBaseV212=mapPageV20;
mapPageV20=function(bounds,source,title,sheetMeta=null){
  let html=mapPageBaseV212(bounds,source,title,sheetMeta),size=boundsSizeV20(bounds),bar=1000;
  if(size.w<1800)bar=200;else if(size.w<3500)bar=500;
  const width=Math.max(5,Math.min(38,bar/Math.max(1,size.w)*100));
  const extras=`<div class="atlas-north-v212"><b>С</b><span>↑</span></div><div class="atlas-scale-v212"><div style="width:${width.toFixed(2)}%"></div><span>${bar>=1000?(bar/1000)+' км':bar+' м'}</span></div>`;
  return html.replace('</svg>',`</svg>${extras}`);
};
const printCssBaseV212=printCssV20;
printCssV20=function(){return printCssBaseV212()+`.atlas-north-v212{position:absolute;right:8px;top:8px;width:30px;height:44px;background:rgba(255,255,255,.86);border:1px solid #777;display:grid;place-items:center;align-content:center;z-index:5}.atlas-north-v212 b{font:700 10px Arial}.atlas-north-v212 span{font:700 22px/18px Arial}.atlas-scale-v212{position:absolute;left:10px;bottom:9px;z-index:5;display:flex;align-items:end;gap:7px;background:rgba(255,255,255,.88);padding:5px 7px;border:1px solid #888;min-width:115px}.atlas-scale-v212>div{height:6px;border:2px solid #171815;border-top:0;min-width:22px}.atlas-scale-v212 span{font:bold 9px Arial;white-space:nowrap}`};

const buildV212=document.querySelector('.build-label');
if(buildV212)buildV212.textContent='V15.2 · полноэкранная карта · финальный атлас';


;/* source: hikes-preview/atlas-v22.js */
/* V16 — atlas print parity with the reference PDF: true overview thumbnail, auto page orientation, undistorted map viewport, print legend/scale. */
const ATLAS_V22_MIGRATION='rl_atlas_v22_auto_orientation';
try{
  if(!localStorage.getItem(ATLAS_V22_MIGRATION)){
    atlasV20.orientation='auto';
    saveAtlasV20();
    localStorage.setItem(ATLAS_V22_MIGRATION,'1');
  }
}catch(e){}

function atlasPaperSizeV22(orientation){
  const a3=atlasV20.paper==='A3';
  if(a3)return orientation==='portrait'?{w:297,h:420}:{w:420,h:297};
  return orientation==='portrait'?{w:210,h:297}:{w:297,h:210};
}
function atlasPageMetricsV22(orientation,withRail=false,overview=false){
  const p=atlasPaperSizeV22(orientation),outer=12,header=19,footer=10;
  const bodyW=p.w-outer,bodyH=p.h-outer-header-footer;
  const rail=withRail?43:0,gap=withRail?4:0,legend=overview?25:0;
  return {pageW:p.w,pageH:p.h,mapW:bodyW-rail-gap,mapH:Math.max(60,bodyH-legend),rail,gap,header,footer,outer};
}
function atlasOrientationV22(bounds,withRail=false,overview=false){
  if(atlasV20.orientation==='portrait'||atlasV20.orientation==='landscape')return atlasV20.orientation;
  const b=boundsSizeV20(bounds),geo=Math.max(.08,b.aspect);
  const lp=atlasPageMetricsV22('landscape',withRail,overview),pp=atlasPageMetricsV22('portrait',withRail,overview);
  const la=lp.mapW/lp.mapH,pa=pp.mapW/pp.mapH;
  return Math.abs(Math.log(geo/la))<=Math.abs(Math.log(geo/pa))?'landscape':'portrait';
}
function expandBoundsAspectV22(bounds,targetAspect){
  const x0=mercXV12(bounds.west),x1=mercXV12(bounds.east),y0=mercYV12(bounds.south),y1=mercYV12(bounds.north);
  let w=x1-x0,h=y1-y0;const cx=(x0+x1)/2,cy=(y0+y1)/2,cur=w/Math.max(1,h);
  if(cur<targetAspect)w=h*targetAspect;else h=w/targetAspect;
  return {west:lonFromXV12(cx-w/2),east:lonFromXV12(cx+w/2),south:latFromYV12(cy-h/2),north:latFromYV12(cy+h/2)};
}
function printZoomV22(bounds,detail){
  const s=boundsSizeV20(bounds),max=Math.max(s.w,s.h);
  if(!detail){if(max<5500)return 15;if(max<9500)return 14;return 13}
  if(max<3400)return 17;if(max<6500)return 16;return 15;
}
function tileSurfaceV22(bounds,source,z){
  const nw=tileXYPrintV20(bounds.north,bounds.west,z),se=tileXYPrintV20(bounds.south,bounds.east,z),px0=nw[0]*256,py0=nw[1]*256,px1=se[0]*256,py1=se[1]*256;
  const W=Math.max(100,px1-px0),H=Math.max(100,py1-py0),imgs=[];
  for(let x=Math.floor(nw[0]);x<=Math.floor(se[0]);x++)for(let y=Math.floor(nw[1]);y<=Math.floor(se[1]);y++){
    sourceTilesV20(source,x,y,z).forEach((url,layer)=>imgs.push(`<img class="atlas-tile-v20 layer-${layer}" src="${url}" loading="eager" decoding="async" style="left:${((x*256-px0)/W*100).toFixed(5)}%;top:${((y*256-py0)/H*100).toFixed(5)}%;width:${(256/W*100).toFixed(5)}%;height:${(256/H*100).toFixed(5)}%">`));
  }
  const pxy=(lat,lon)=>{const t=tileXYPrintV20(lat,lon,z);return [t[0]*256-px0,t[1]*256-py0]};
  return {imgs,W,H,pxy};
}
function gridSvgV22(bounds,pxy){
  if(!atlasV20.includeGrid)return {lines:'',labels:''};
  const g=gridCfgV13(),ax0=mercXV12(bounds.west),ax1=mercXV12(bounds.east),ay0=mercYV12(bounds.south),ay1=mercYV12(bounds.north);
  const cMin=Math.floor((ax0-g.x0)/g.dx)-1,cMax=Math.ceil((ax1-g.x0)/g.dx)+1,rMin=Math.floor((g.y1-ay1)/g.dy)-1,rMax=Math.ceil((g.y1-ay0)/g.dy)+1;
  let lines='',labels='';
  for(let c=cMin;c<=cMax;c++){
    const lon=lonFromXV12(g.x0+c*g.dx),a=pxy(bounds.north,lon),b=pxy(bounds.south,lon);lines+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    if(c>=0&&c<cMax){const p=pxy(bounds.north,lonFromXV12(g.x0+(c+.5)*g.dx));labels+=`<text class="grid-top-v22" x="${p[0]}" y="16">${String(c+1).padStart(2,'0')}</text>`}
  }
  for(let r=rMin;r<=rMax;r++){
    const lat=latFromYV12(g.y1-r*g.dy),a=pxy(lat,bounds.west),b=pxy(lat,bounds.east);lines+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    if(r>=0&&r<rMax){const p=pxy(latFromYV12(g.y1-(r+.5)*g.dy),bounds.west);labels+=`<text class="grid-side-v22" x="14" y="${p[1]}">${rowCodeV13(r)}</text>`}
  }
  return {lines,labels};
}
function routeAndPointsSvgV22(bounds,pxy){
  const routePts=editorV13.route.map(p=>pxy(p[0],p[1]).join(',')).join(' ');
  let cps='';
  if(atlasV20.includeCps)dynamicCpsV13().filter(cp=>inBoundsV20(cp.lat,cp.lon,bounds)).forEach(cp=>{
    const p=pxy(cp.lat,cp.lon),camp=cp.number==='С'||cp.number==='Ф';
    cps+=`<g class="${camp?'camp':''}"><circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+9}" y="${p[1]-8}">${esc(cp.number)} ${esc(cp.title)}</text></g>`;
  });
  let marks='';
  try{(editorV13.marks||[]).filter(m=>inBoundsV20(m.lat,m.lon,bounds)).forEach(m=>{const p=pxy(m.lat,m.lon);marks+=`<g class="atlas-user-mark-v22"><circle cx="${p[0]}" cy="${p[1]}" r="5"/><text x="${p[0]+8}" y="${p[1]+4}">${esc(m.title||'Точка')}</text></g>`})}catch(e){}
  return {routePts,cps,marks};
}
function sectorTextV22(s){
  if(!s)return '';
  const vr=s.rows===1?'центр':s.row===0?'север':s.row===s.rows-1?'юг':s.rows===4?(s.row===1?'север-центр':'юг-центр'):`ряд ${s.row+1}`;
  const hr=s.cols===1?'центр':s.col===0?'запад':s.col===s.cols-1?'восток':`колонка ${s.col+1}`;
  return `${vr}-${hr}`;
}
function niceScaleV22(widthM){
  const target=widthM*.24,candidates=[50,100,200,250,500,1000,2000,2500,5000,10000];let best=candidates[0];
  for(const c of candidates)if(c<=target)best=c;return best;
}
function scaleBlockV22(bounds,mapWidthMm){
  const w=boundsSizeV20(bounds).w,len=niceScaleV22(w),pct=Math.max(5,Math.min(48,len/w*100)),den=Math.max(100,Math.round((w*1000/Math.max(1,mapWidthMm))/100)*100);
  const fmt=n=>n>=1000?`${String(n/1000).replace('.',',')} км`:`${n} м`;
  return `<div class="atlas-scale-v22"><div class="atlas-scale-line-v22" style="width:${pct.toFixed(2)}%"><i></i><i></i><i></i></div><div class="atlas-scale-label-v22" style="width:${pct.toFixed(2)}%"><span>0</span><span>${fmt(len/2)}</span><span>${fmt(len)}</span></div><small>Масштаб ~1:${den.toLocaleString('ru-RU')}</small></div>`;
}
function compassV22(){return `<div class="atlas-north-v22"><b>С</b><svg viewBox="0 0 24 38" aria-hidden="true"><path d="M12 1 L20 25 L12 20 L4 25 Z"/><line x1="12" y1="19" x2="12" y2="37"/></svg></div>`}
function miniOverviewV22(activeIndex){
  const b=atlasBoundsCurrentV20(),ratio=.72,rb=expandBoundsAspectV22(b,ratio),z=13,t=tileSurfaceV22(rb,'osm',z),sh=sheetsV20();
  const routePts=editorV13.route.map(p=>t.pxy(p[0],p[1]).join(',')).join(' ');
  let rects='';
  sh.forEach(s=>{const a=t.pxy(s.north,s.west),c=t.pxy(s.south,s.east),x=Math.min(a[0],c[0]),y=Math.min(a[1],c[1]),w=Math.abs(c[0]-a[0]),h=Math.abs(c[1]-a[1]),cx=x+w/2,cy=y+h/2;rects+=`<rect class="${s.index===activeIndex?'active':''}" x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${cx}" y="${cy}">${s.index}</text>`});
  return `<div class="atlas-mini-map-v22" style="aspect-ratio:${ratio}">${t.imgs.join('')}<svg viewBox="0 0 ${t.W} ${t.H}" preserveAspectRatio="none"><polyline class="atlas-mini-route-v22" points="${routePts}"/><g class="atlas-mini-sheets-v22">${rects}</g></svg></div>`;
}
function legendV22(source){
  const src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;
  return `<div class="atlas-legend-v22"><small>УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</small><div><span><i class="lg-route"></i>Маршрут</span><span><i class="lg-cp"></i>Контрольная точка</span><span><i class="lg-camp"></i>Старт / финиш</span><span><i class="lg-grid"></i>Координатная сетка ${gridCfgV13().cell} м</span><span><i class="lg-sheet"></i>Текущий лист</span></div><em>${esc(src.label)}</em></div>`;
}
function detailRailV22(sheet,source){return `<aside class="atlas-rail-v22"><section><small>ОБЗОРНАЯ СХЕМА</small>${miniOverviewV22(sheet.index)}<p>Лист ${sheet.index} выделен на общей карте. Соседние листы имеют перекрытие ${atlasV20.overlap} м.</p></section>${legendV22(source)}</aside>`}
function overviewLegendV22(source){return `<div class="atlas-overview-legend-v22">${legendV22(source)}<div class="atlas-overview-meta-v22"><span>Область: ${areaTextV20()}</span><span>Листов: ${atlasV20.sheetCount}</span><span>Перекрытие: ${atlasV20.overlap} м</span></div></div>`}
function mapFrameV22(bounds,source,detail,targetAspect){
  const rb=expandBoundsAspectV22(bounds,targetAspect),z=printZoomV22(rb,detail),t=tileSurfaceV22(rb,source,z),g=gridSvgV22(rb,t.pxy),rp=routeAndPointsSvgV22(rb,t.pxy);
  return {bounds:rb,z,html:`<div class="atlas-map-crop-v20 atlas-map-crop-v22">${t.imgs.join('')}<svg viewBox="0 0 ${t.W} ${t.H}" preserveAspectRatio="none"><g class="atlas-grid-lines-v20">${g.lines}</g><g class="atlas-grid-labels-v20">${g.labels}</g><polyline class="atlas-route-halo-v20" points="${rp.routePts}"/><polyline class="atlas-route-v20" points="${rp.routePts}"/><g class="atlas-cps-v20">${rp.cps}</g><g>${rp.marks}</g></svg>${source==='yandex'?'<div class="atlas-brand-v20">Яндекс Карты</div>':''}${compassV22()}</div>`};
}
mapPageV20=function(bounds,source,title,sheetMeta=null){
  const withRail=!!sheetMeta,overview=!sheetMeta,orientation=atlasOrientationV22(bounds,withRail,overview),m=atlasPageMetricsV22(orientation,withRail,overview),target=m.mapW/m.mapH,frame=mapFrameV22(bounds,source,withRail,target),src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;
  const headerTitle=sheetMeta?'Томинский лесопарк - полевой атлас':title;
  const subtitle=sheetMeta?`Лист ${sheetMeta.index} - ${sectorTextV22(sheetMeta)}`:'Обзорная схема';
  return `<section class="atlas-page-v20 atlas-page-v22 page-${orientation}-v22" data-orientation="${orientation}"><header class="atlas-head-v22"><div><h1>${esc(headerTitle)}</h1><small>${esc(subtitle)}</small></div>${sheetMeta?`<b>Лист ${sheetMeta.index}</b>`:`<b>Маршрут · ${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</b>`}</header><div class="atlas-map-layout-v20 atlas-map-layout-v22 ${withRail?'with-rail':''}">${frame.html}${withRail?detailRailV22(sheetMeta,source):''}</div>${overview?overviewLegendV22(source):''}<footer class="atlas-foot-v22">${scaleBlockV22(frame.bounds,m.mapW)}<div><span>${src.attribution}</span><span>Разные люди · ${new Date().toLocaleDateString('ru-RU')}</span></div></footer></section>`;
};

const tablePlanBaseV22=tablePlanV20,tableNavBaseV22=tableNavV20;
tablePlanV20=function(){return tablePlanBaseV22().replace('atlas-page-v20 atlas-table-v20','atlas-page-v20 atlas-table-v20 page-landscape-v22')};
tableNavV20=function(){return tableNavBaseV22().replace('atlas-page-v20 atlas-table-v20','atlas-page-v20 atlas-table-v20 page-landscape-v22')};

printCssV20=function(){
  const paper=atlasV20.paper==='A3'?'A3':'A4',L=atlasPaperSizeV22('landscape'),P=atlasPaperSizeV22('portrait');
  return `@page landscapePage{size:${paper} landscape;margin:0}@page portraitPage{size:${paper} portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#d8d6cf;color:#171815;font:10px Arial,sans-serif}.printbar{position:sticky;top:0;z-index:99;background:#171815;color:#fff;padding:10px 14px;text-align:center}.printbar button{padding:9px 16px;margin-right:10px}.printbar .ready{color:#d4bd82}.atlas-page-v20{margin:7px auto;background:#fff;padding:6mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}.page-landscape-v22{page:landscapePage;width:${L.w}mm;height:${L.h}mm}.page-portrait-v22{page:portraitPage;width:${P.w}mm;height:${P.h}mm}.atlas-head-v22{display:flex;justify-content:space-between;align-items:flex-start;border:0!important;padding:0 0 3mm!important;min-height:14mm}.atlas-head-v22 h1{font:bold 15px Arial;margin:0 0 2mm;text-transform:none}.atlas-head-v22 small{font-size:8px;color:#555;letter-spacing:0}.atlas-head-v22>b{font-size:10px}.atlas-map-layout-v22{display:grid!important;grid-template-columns:1fr!important;gap:4mm!important;flex:1;min-height:0;margin:0!important}.atlas-map-layout-v22.with-rail{grid-template-columns:minmax(0,1fr) 43mm!important}.atlas-map-crop-v22{position:relative;overflow:hidden;background:#e7e8e1;min-width:0;min-height:0;border:.2mm solid #777}.atlas-tile-v20{position:absolute;object-fit:fill}.atlas-map-crop-v22 svg{position:absolute;inset:0;width:100%;height:100%}.atlas-grid-lines-v20 line{stroke:#333;stroke-width:.7;opacity:.48}.atlas-grid-labels-v20 text{font:bold 11px Arial;fill:#222;paint-order:stroke;stroke:#fff;stroke-width:3;text-anchor:middle;dominant-baseline:middle}.atlas-route-halo-v20{fill:none;stroke:#fff;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}.atlas-route-v20{fill:none;stroke:#6c22c7;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.atlas-cps-v20 circle{fill:#6c22c7;stroke:#fff;stroke-width:2}.atlas-cps-v20 .camp circle{fill:#2f7a50}.atlas-cps-v20 text,.atlas-user-mark-v22 text{font:bold 10px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:4}.atlas-user-mark-v22 circle{fill:#c7a65a;stroke:#171815;stroke-width:1.5}.atlas-rail-v22{display:flex;flex-direction:column;gap:4mm;border-left:.2mm solid #999;padding-left:3mm;min-width:0}.atlas-rail-v22 section>small,.atlas-legend-v22>small{display:block;font-size:7px;font-weight:700;letter-spacing:.08em;margin-bottom:1.5mm}.atlas-rail-v22 p{font-size:7px;line-height:1.35;color:#666;margin:1.5mm 0 0}.atlas-mini-map-v22{position:relative;width:100%;overflow:hidden;border:.25mm solid #777;background:#e6eadf}.atlas-mini-map-v22 img{position:absolute;object-fit:fill}.atlas-mini-map-v22 svg{position:absolute;inset:0;width:100%;height:100%}.atlas-mini-route-v22{fill:none;stroke:#6c22c7;stroke-width:4}.atlas-mini-sheets-v22 rect{fill:rgba(255,255,255,.03);stroke:#555;stroke-width:2}.atlas-mini-sheets-v22 rect.active{fill:rgba(199,166,90,.34);stroke:#9d7e38;stroke-width:5}.atlas-mini-sheets-v22 text{font:bold 19px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:5;text-anchor:middle;dominant-baseline:middle}.atlas-legend-v22{border:.2mm solid #aaa;padding:2.5mm;background:#faf9f6}.atlas-legend-v22>div{display:grid;gap:1.5mm}.atlas-legend-v22 span{display:flex;align-items:center;gap:2mm;font-size:7px}.atlas-legend-v22 i{display:inline-block;width:9mm;height:2mm;position:relative;flex:none}.lg-route:after{content:'';position:absolute;left:0;right:0;top:.7mm;border-top:1.2mm solid #6c22c7}.lg-cp:after{content:'';position:absolute;width:2.7mm;height:2.7mm;border-radius:50%;background:#6c22c7;border:.5mm solid white;box-shadow:0 0 0 .2mm #777;left:3mm;top:-.3mm}.lg-camp:after{content:'';position:absolute;width:2.7mm;height:2.7mm;border-radius:50%;background:#2f7a50;left:3mm;top:-.3mm}.lg-grid{border-top:.2mm solid #555}.lg-sheet{border:.6mm solid #c7a65a;height:4mm!important}.atlas-legend-v22 em{display:block;margin-top:2mm;font-size:6.5px;color:#777;font-style:normal}.atlas-overview-legend-v22{display:grid;grid-template-columns:1.4fr .6fr;gap:4mm;margin-top:3mm}.atlas-overview-meta-v22{border:.2mm solid #aaa;padding:2.5mm;display:grid;gap:1.5mm;font-size:7px}.atlas-north-v22{position:absolute;right:3mm;top:3mm;width:8mm;text-align:center;background:rgba(255,255,255,.82);padding:1mm}.atlas-north-v22 b{display:block;font-size:8px}.atlas-north-v22 svg{position:static!important;width:5mm!important;height:8mm!important}.atlas-north-v22 path{fill:#171815}.atlas-north-v22 line{stroke:#171815;stroke-width:2}.atlas-foot-v22{display:grid!important;grid-template-columns:1fr auto;gap:5mm;align-items:end;border:0!important;margin:2mm 0 0!important;padding:0!important;min-height:8mm;color:#666}.atlas-foot-v22>div:last-child{display:grid;text-align:right;gap:.7mm;font-size:6.5px}.atlas-scale-v22{min-width:55mm}.atlas-scale-line-v22{height:2.5mm;border-bottom:.4mm solid #171815;display:flex;justify-content:space-between;align-items:end}.atlas-scale-line-v22 i{height:2.5mm;border-left:.4mm solid #171815}.atlas-scale-label-v22{display:flex;justify-content:space-between;font-size:6.5px;color:#222}.atlas-scale-v22 small{font-size:6px;color:#666}.atlas-brand-v20{position:absolute;left:2mm;bottom:2mm;background:#fff;padding:1mm 1.5mm;font-weight:700;border:.2mm solid #bbb}.atlas-table-v20{page:landscapePage;width:${L.w}mm;height:${L.h}mm;padding:8mm}.atlas-table-v20 table{width:100%;border-collapse:collapse;margin-top:4mm;font-size:9px}.atlas-table-v20 th,.atlas-table-v20 td{border-bottom:1px solid #bbb;padding:2mm;text-align:left}.atlas-table-v20 th{font-size:8px;text-transform:uppercase;color:#666}@media print{body{background:white}.printbar{display:none}.atlas-page-v20{margin:0}}`;
};

openAtlasOutputV20=function(mode='full',one=0){
  if(!validateSourcesV20(mode,one))return;
  const w=window.open('','_blank');if(!w){toast('Браузер заблокировал окно печати');return}
  const title=mode==='one'?`Лист ${one} - полевой атлас`:mode==='sheets'?'Детальные листы - полевой атлас':'Полевой атлас';
  const pages=outputPagesV20(mode,one);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${printCssV20()}</style></head><body><div class="printbar"><button id="printAtlasBtn" onclick="window.print()" disabled>Загрузка карт...</button><span id="printAtlasState">Подготавливаю листы в печатном разрешении</span></div>${pages}<script>(function(){var imgs=[].slice.call(document.images),btn=document.getElementById('printAtlasBtn'),s=document.getElementById('printAtlasState');if(!imgs.length){btn.disabled=false;btn.textContent='Печать / сохранить PDF';s.textContent='Готово';return}var done=0;function tick(){done++;s.textContent='Загружено '+done+' / '+imgs.length;if(done>=imgs.length){btn.disabled=false;btn.textContent='Печать / сохранить PDF';s.textContent='Карты готовы к печати';s.className='ready'}}imgs.forEach(function(i){if(i.complete)tick();else{i.addEventListener('load',tick,{once:true});i.addEventListener('error',tick,{once:true})}});setTimeout(function(){btn.disabled=false;btn.textContent='Печать / сохранить PDF';s.textContent='Можно печатать; часть тайлов могла не загрузиться'},12000)})();<\/script></body></html>`);w.document.close();
};

const bindAtlasDesignerBaseV22=bindAtlasDesignerV20;
bindAtlasDesignerV20=function(){
  const sel=document.getElementById('atlasOrientV20');
  if(sel&&!sel.querySelector('option[value="auto"]')){const o=document.createElement('option');o.value='auto';o.textContent='Авто - по форме листа';sel.insertBefore(o,sel.firstChild);sel.value=atlasV20.orientation||'auto'}
  bindAtlasDesignerBaseV22();
};
const renderAtlasDesignerBaseV22=renderAtlasDesignerV20;
renderAtlasDesignerV20=function(){renderAtlasDesignerBaseV22();const note=document.querySelector('.atlas-layout-note-v20');if(note&&atlasV20.orientation==='auto'){note.insertAdjacentHTML('beforeend','<span class="atlas-auto-note-v22">ориентация листов: авто</span>')}};

const buildV22=document.querySelector('.build-label');
if(buildV22)buildV22.textContent='V16 · атлас по образцу PDF · автоориентация';


;/* source: hikes-preview/plan-v23.js */
/* V17 — flexible route plan: independent breaks, pace profiles, copyable CP coordinates and electronic exports. */
const PLAN_V23_MIGRATION='rl_plan_v23_breaks_v1';
const PACE_PROFILES_V23={
  working:{label:'Рабочий темп',short:'Рабочий',hint:'Идём собранно и держим график.',speeds:{road:5.0,trail:4.2,clearing:3.1,forest:2.3,unknown:3.6}},
  relaxed:{label:'Спокойный темп',short:'Спокойный',hint:'Прогулочный режим без задачи идти быстро.',speeds:{road:4.0,trail:3.4,clearing:2.5,forest:1.8,unknown:3.0}}
};
const TERRAIN_META_V23={
  road:{label:'Дорога',hint:'Широкая дорога или грунтовка: спокойно проходит велосипед/мопед.'},
  trail:{label:'Тропа',hint:'Пешая извилистая тропа, где велосипеду уже заметно сложнее.'},
  clearing:{label:'Трудный проход',hint:'Заросшая тропа, плохая просека, кусты или местами бурелом.'},
  forest:{label:'Лес / без тропы',hint:'Движение напрямую через лес без нормального пути.'},
  unknown:{label:'Не задано',hint:'Пока участок не классифицирован вручную.'}
};

if(typeof TERRAIN_V13!=='undefined'){
  TERRAIN_V13.road.label=TERRAIN_META_V23.road.label;
  TERRAIN_V13.trail.label=TERRAIN_META_V23.trail.label;
  TERRAIN_V13.clearing.label=TERRAIN_META_V23.clearing.label;
  TERRAIN_V13.forest.label=TERRAIN_META_V23.forest.label;
  TERRAIN_V13.unknown.label=TERRAIN_META_V23.unknown.label;
}

function ensurePlanV23(){
  if(!editorV13.plan||typeof editorV13.plan!=='object')editorV13.plan={};
  const p=editorV13.plan;
  if(!['working','relaxed'].includes(p.profile))p.profile='working';
  if(!Number.isFinite(+p.reservePct))p.reservePct=10;
  if(!p.speedProfiles||typeof p.speedProfiles!=='object')p.speedProfiles={};
  Object.entries(PACE_PROFILES_V23).forEach(([k,v])=>{
    p.speedProfiles[k]={...v.speeds,...(p.speedProfiles[k]||{})};
  });
  if(!Array.isArray(p.breaks))p.breaks=[];
  if(!Array.isArray(editorV13.marks))editorV13.marks=[];
  let migrated=false;
  try{migrated=localStorage.getItem(PLAN_V23_MIGRATION)==='1'}catch(e){}
  if(!migrated){
    (editorV13.cps||[]).forEach(cp=>{
      const min=Math.max(0,+cp.stopMin||0);
      if(min&&cp.id!=='cpf')p.breaks.push({id:'br_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),title:min>=45?'Обед':'Перерыв',minutes:min,afterCpId:cp.id});
      cp.stopMin=0;
    });
    try{localStorage.setItem(PLAN_V23_MIGRATION,'1')}catch(e){}
    persistPlanV23();
  }
  syncLegacySpeedsV23();
  return p;
}
function syncLegacySpeedsV23(){
  const p=editorV13.plan||{},profile=PACE_PROFILES_V23[p.profile]?p.profile:'working',src=p.speedProfiles?.[profile]||PACE_PROFILES_V23[profile].speeds;
  editorV13.speeds={...(editorV13.speeds||{}),...src};
}
function persistPlanV23(){
  try{persistEditorV15()}catch(e){try{localStorage.setItem(EDITOR_V13_KEY,JSON.stringify(editorV13));syncEventV13()}catch(_e){}}
}
function planProfileV23(){ensurePlanV23();return editorV13.plan.profile}
function profileSpeedV23(type){const p=ensurePlanV23(),profile=planProfileV23();return Math.max(.5,+p.speedProfiles?.[profile]?.[type]||PACE_PROFILES_V23[profile].speeds[type]||3)}
function reservePctV23(){return Math.max(0,Math.min(50,+ensurePlanV23().reservePct||0))}
function breaksV23(){return ensurePlanV23().breaks}
function breaksAfterV23(cpId){return breaksV23().filter(b=>b.afterCpId===cpId)}
function breaksTotalV23(){return breaksV23().reduce((s,b)=>s+Math.max(0,+b.minutes||0),0)}
function fmtMinutesV23(min){min=Math.max(0,Math.round(min));const h=Math.floor(min/60),m=min%60;return h?`${h} ч${m?' '+m+' мин':''}`:`${m} мин`}

terrainSpeedV13=function(i){const t=editorV13.terrain[i]||'unknown';return profileSpeedV23(t)};
function rawTravelMinV23(toM){
  const cum=routeCumV13();let left=Math.max(0,+toM||0),min=0;
  for(let i=0;i<cum.length-1&&left>0;i++){
    const seg=Math.max(0,cum[i+1]-cum[i]),use=Math.min(left,seg);min+=(use/1000)/terrainSpeedV13(i)*60;left-=use;
  }
  return min;
}
function plannedTravelMinV23(toM){return rawTravelMinV23(toM)*(1+reservePctV23()/100)}
routeTravelMinToV13=plannedTravelMinV23;

dynamicCpsV13=function(){
  ensurePlanV23();
  const arr=(editorV13.cps||[]).map(cp=>{const n=nearestRouteV13(cp.lat,cp.lon);return {...cp,near:n,along:n?.along||0,stopMin:0}});
  const start=arr.find(c=>c.id==='cp0'),finish=arr.find(c=>c.id==='cpf'),middle=arr.filter(c=>c.id!=='cp0'&&c.id!=='cpf').sort((a,b)=>a.along-b.along),order=[];
  if(start)order.push(start);order.push(...middle);if(finish)order.push(finish);
  const startMin=parseClockV13(editorV13.start),total=routeLenV13();let pauseBefore=0,midNo=0;
  return order.map(cp=>{
    const along=cp.id==='cp0'?0:cp.id==='cpf'?total:Math.max(0,Math.min(total,cp.along));
    const number=cp.id==='cp0'?'С':cp.id==='cpf'?'Ф':String(++midNo),eta=startMin+plannedTravelMinV23(along)+pauseBefore;
    const out={...cp,number,km:along/1000,arrival:fmtClockV13(eta),stopMin:0};
    pauseBefore+=breaksAfterV23(cp.id).reduce((s,b)=>s+Math.max(0,+b.minutes||0),0);
    return out;
  });
};
finalEtaV13=function(){const cps=dynamicCpsV13();return cps[cps.length-1]?.arrival||'—'};
routeDurationMinV13=function(){const a=parseClockV13(editorV13.start),b=parseClockV13(finalEtaV13());return b>=a?b-a:b+1440-a};

function breakTimelineV23(){
  const cps=dynamicCpsV13(),events=[];
  cps.forEach(cp=>{
    events.push({kind:'cp',cp,time:cp.arrival});
    let cursor=parseClockV13(cp.arrival);
    breaksAfterV23(cp.id).forEach(b=>{const min=Math.max(0,+b.minutes||0),start=fmtClockV13(cursor),end=fmtClockV13(cursor+min);events.push({kind:'break',break:b,after:cp,start,end});cursor+=min});
  });
  return events;
}
function cpAnchorIdsV23(){return dynamicCpsV13().filter(cp=>cp.id!=='cpf').map(cp=>cp.id)}
function normalizeBreakAnchorV23(b){const ids=cpAnchorIdsV23();if(!ids.includes(b.afterCpId))b.afterCpId=ids[0]||'cp0'}
function addBreakV23(afterCpId){ensurePlanV23();const ids=cpAnchorIdsV23();const anchor=ids.includes(afterCpId)?afterCpId:(ids[1]||ids[0]||'cp0');editorV13.plan.breaks.push({id:'br_'+Date.now(),title:'Перерыв',minutes:10,afterCpId:anchor});persistPlanV23();render();toast('Перерыв добавлен')}
function updateBreakV23(id,patch){const b=breaksV23().find(x=>x.id===id);if(!b)return;Object.assign(b,patch);b.minutes=Math.max(0,Math.min(240,+b.minutes||0));normalizeBreakAnchorV23(b);persistPlanV23();render()}
function deleteBreakV23(id){editorV13.plan.breaks=breaksV23().filter(x=>x.id!==id);persistPlanV23();render();toast('Перерыв удалён')}
function moveBreakV23(id,dir){const b=breaksV23().find(x=>x.id===id),ids=cpAnchorIdsV23();if(!b||!ids.length)return;let i=Math.max(0,ids.indexOf(b.afterCpId));i=Math.max(0,Math.min(ids.length-1,i+dir));b.afterCpId=ids[i];persistPlanV23();render()}

function routePlanStatsV23(){const base=rawTravelMinV23(routeLenV13()),reserve=base*reservePctV23()/100,pauses=breaksTotalV23();return {base,reserve,pauses,total:base+reserve+pauses}}
function speedCardsV23(){
  const p=ensurePlanV23(),profile=planProfileV23(),order=['road','trail','clearing','forest'];
  return `<div class="pace-profiles-v23"><button data-profile-v23="working" class="${profile==='working'?'active':''}"><b>Рабочий</b><small>${PACE_PROFILES_V23.working.hint}</small></button><button data-profile-v23="relaxed" class="${profile==='relaxed'?'active':''}"><b>Спокойный</b><small>${PACE_PROFILES_V23.relaxed.hint}</small></button></div><div class="speed-cards-v23">${order.map(k=>`<label><span><b>${TERRAIN_META_V23[k].label}</b><small>${TERRAIN_META_V23[k].hint}</small></span><em><input type="number" min="0.5" max="8" step="0.1" data-speed-v23="${k}" value="${(+p.speedProfiles[profile][k]).toFixed(1)}"> км/ч</em></label>`).join('')}</div><div class="speed-fallback-v23">Не классифицированный участок: <b>${(+p.speedProfiles[profile].unknown).toFixed(1)} км/ч</b>. Тип поверхности можно назначать по участкам в полноэкранном редакторе.</div>`;
}
function routeTimelineHtmlV23(){
  const ev=breakTimelineV23();
  return `<div class="route-timeline-v23">${ev.map((x,i)=>{
    if(x.kind==='cp'){
      const cp=x.cp,next=ev.slice(i+1).find(y=>y.kind==='cp')?.cp,az=next?Math.round(bearingV13([cp.lat,cp.lon],[next.lat,next.lon])):null;
      return `<article class="plan-cp-v23" data-cp-anchor="${cp.id}"><div class="plan-time-v23">${cp.arrival}</div><div class="plan-dot-v23 ${cp.number==='С'||cp.number==='Ф'?'endpoint':''}">${cp.number}</div><div class="plan-main-v23"><div><b>${esc(cp.title)}</b><span>${cp.km.toFixed(1).replace('.',',')} км · ${gridCodeDynamicV13(cp.lat,cp.lon)}${az!==null?' · дальше '+az+'°':''}</span></div><div class="plan-coords-v23"><code>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</code><button data-copy-cp-v23="${cp.id}">Копировать</button><button data-open-cp-v23="${cp.id}">Карта ↗</button></div></div>${cp.id!=='cpf'?`<button class="plan-add-break-v23" data-add-break-v23="${cp.id}" title="Добавить перерыв после этой точки">＋ перерыв</button>`:''}</article><div class="plan-drop-v23" data-break-drop-v23="${cp.id}">Перетащить перерыв сюда</div>`;
    }
    const b=x.break;
    return `<article class="plan-break-v23" draggable="true" data-break-id-v23="${b.id}"><div class="plan-time-v23">${x.start}<small>→ ${x.end}</small></div><div class="plan-break-icon-v23">Ⅱ</div><div class="plan-break-main-v23"><input list="breakTypesV23" data-break-title-v23="${b.id}" value="${esc(b.title||'Перерыв')}" aria-label="Название перерыва"><label><input type="number" min="0" max="240" step="5" data-break-min-v23="${b.id}" value="${Math.max(0,+b.minutes||0)}"> мин</label><span>После: ${esc(x.after.title)}</span></div><div class="plan-break-actions-v23"><button data-break-up-v23="${b.id}" title="Выше">↑</button><button data-break-down-v23="${b.id}" title="Ниже">↓</button><button data-break-del-v23="${b.id}" title="Удалить">×</button></div></article>`;
  }).join('')}<datalist id="breakTypesV23"><option value="Перерыв"><option value="Перекур"><option value="Обед"><option value="Отдых"><option value="Сбор группы"><option value="Навигационная пауза"></datalist></div>`;
}
function cpRowsDynamicV23(){return dynamicCpsV13().map(cp=>`<div class="cp-row-v23"><button class="cp-focus-v23" data-cp-dyn-v13="${cp.id}" type="button"><span class="cp-index">${cp.number}</span><span class="cp-main"><b>${esc(cp.title)}</b><small><span class="grid-code-v12">${gridCodeDynamicV13(cp.lat,cp.lon)}</span>${cp.km.toFixed(1).replace('.',',')} км</small></span><span class="cp-time">${cp.arrival}</span></button><div class="cp-coordline-v23"><code>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</code><button type="button" data-copy-cp-v23="${cp.id}">Копировать</button><button type="button" data-open-cp-v23="${cp.id}">Открыть ↗</button></div></div>`).join('')}
cpRowsDynamicV13=cpRowsDynamicV23;

function planPageV23(){
  ensurePlanV23();const stats=routePlanStatsV23(),profile=PACE_PROFILES_V23[planProfileV23()];
  const org=`<div class="timeline-head"><span>Время</span><span>Этап</span><span>Ответственный</span><span>Маршрут</span><span></span></div>${S.timeline.map(t=>`<div class="timeline-row"><div class="timeline-time">${esc(t.time)}</div><div><b>${esc(t.title)}</b><small>${esc(t.note||'')}</small></div><div>${esc(pn(t.owner))}</div><div>${t.route?esc(routeName(t.route)):'—'}</div><div class="row-actions"><button class="icon-btn" data-edit-time="${t.id}" title="Редактировать">✎</button><button class="icon-btn" data-del-time="${t.id}" title="Удалить">×</button></div></div>`).join('')}`;
  return `${pageHead('Расчёт маршрута','План','КП задают географию. Перерывы — отдельные временные события, которые можно свободно переставлять.',`<button class="btn alt" id="copyAllCpV23">Скопировать все КП</button><button class="btn sand" id="addBreakGeneralV23">Добавить перерыв</button>`)}<div class="plan-auto-summary-v23"><div><small>Старт</small><strong>${editorV13.start}</strong></div><div><small>Финиш</small><strong>${finalEtaV13()}</strong></div><div><small>Движение</small><strong>${fmtMinutesV23(stats.base)}</strong></div><div><small>Перерывы</small><strong>${fmtMinutesV23(stats.pauses)}</strong></div><div><small>Резерв ${reservePctV23()}%</small><strong>${fmtMinutesV23(stats.reserve)}</strong></div><div><small>Темп</small><strong>${profile.short}</strong></div></div>${section('Темп и расчёт',`<div class="plan-settings-v23"><div class="plan-start-reserve-v23"><label>Время старта<input type="time" id="routeStartV23" value="${editorV13.start}"></label><label>Организационный резерв<input type="number" min="0" max="50" step="1" id="reserveV23" value="${reservePctV23()}"><span>% от времени движения</span></label></div>${speedCardsV23()}</div>`,'Скорость зависит от выбранного темпа и проходимости конкретного участка. Резерв распределяется по маршруту пропорционально времени движения.')}${section('План маршрута',routeTimelineHtmlV23(),'Перерывы не имеют координат и не являются КП. Их можно перетаскивать между точками или перемещать стрелками на телефоне.')}${section('Организационный таймлайн',org,'Отдельный командный план мероприятия, не влияющий на расчёт движения.')}`;
}
planPage=planPageV23;

function removeLegacyStopEditorsV23(){document.querySelectorAll('#cpStopV15,#studioCpStopV21').forEach(el=>{const l=el.closest('label');if(l)l.remove();else el.remove()});document.querySelectorAll('.editor-card-v13,.studio-inspector-v21').forEach(box=>{if(box.querySelector('.breaks-note-v23'))return;const cp=box.querySelector('#cpTitleV15,#studioCpTitleV21');if(cp){const n=document.createElement('div');n.className='breaks-note-v23';n.textContent='Остановки и обед теперь настраиваются отдельно во вкладке «План».';cp.closest('label')?.after(n)}})}
function injectRouteMapTimesV23(){const head=document.querySelector('.route-map-head-v11>div:first-child');if(head&&!head.querySelector('.map-time-v23')){const e=document.createElement('div');e.className='map-time-v23';e.innerHTML=`<span>Старт <b>${editorV13.start}</b></span><span>Финиш <b>${finalEtaV13()}</b></span>`;head.appendChild(e)}}
function copyTextV23(text,msg='Скопировано'){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast(msg)).catch(()=>fallbackCopyV23(text,msg));else fallbackCopyV23(text,msg)}
function fallbackCopyV23(text,msg){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');toast(msg)}catch(e){toast('Не удалось скопировать')}t.remove()}
function cpByIdV23(id){return dynamicCpsV13().find(cp=>cp.id===id)}
function copyCpV23(id){const cp=cpByIdV23(id);if(cp)copyTextV23(`${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}`,`${cp.number==='С'||cp.number==='Ф'?cp.number:'КП '+cp.number}: координаты скопированы`)}
function openCpV23(id){const cp=cpByIdV23(id);if(cp)window.open(`https://yandex.ru/maps/?pt=${cp.lon.toFixed(6)},${cp.lat.toFixed(6)}&z=16&l=map`,'_blank','noopener')}
function copyAllCpV23(){const text=dynamicCpsV13().map(cp=>`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title}\n${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}`).join('\n\n');copyTextV23(text,'Все координаты КП скопированы')}

function blobDownloadV23(name,type,text){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function xmlEscV23(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function exportGpxV23(){
  const cps=dynamicCpsV13(),marks=editorV13.marks||[],wpts=[...cps.map(cp=>`<wpt lat="${cp.lat}" lon="${cp.lon}"><name>${xmlEscV23(cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number+' · '+cp.title)}</name><desc>${xmlEscV23(cp.title)}</desc></wpt>`),...marks.map(m=>`<wpt lat="${m.lat}" lon="${m.lon}"><name>${xmlEscV23(m.title||'Точка')}</name><desc>${xmlEscV23(m.note||'')}</desc></wpt>`)].join('');
  const trk=editorV13.route.map(p=>`<trkpt lat="${p[0]}" lon="${p[1]}"></trkpt>`).join('');
  blobDownloadV23('route-and-points.gpx','application/gpx+xml',`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Raznye Ludi" xmlns="http://www.topografix.com/GPX/1/1">${wpts}<trk><name>Маршрут</name><trkseg>${trk}</trkseg></trk></gpx>`)
}
function exportKmlV23(){
  const pts=dynamicCpsV13().map(cp=>`<Placemark><name>${xmlEscV23(cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number+' · '+cp.title)}</name><Point><coordinates>${cp.lon},${cp.lat},0</coordinates></Point></Placemark>`).join('');
  const marks=(editorV13.marks||[]).map(m=>`<Placemark><name>${xmlEscV23(m.title||'Точка')}</name><description>${xmlEscV23(m.note||'')}</description><Point><coordinates>${m.lon},${m.lat},0</coordinates></Point></Placemark>`).join('');
  const line=editorV13.route.map(p=>`${p[1]},${p[0]},0`).join(' ');
  blobDownloadV23('route-and-points.kml','application/vnd.google-earth.kml+xml',`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Разные люди · маршрут</name><Placemark><name>Маршрут</name><LineString><tessellate>1</tessellate><coordinates>${line}</coordinates></LineString></Placemark>${pts}${marks}</Document></kml>`)
}
function exportGeoJsonV23(){if(typeof downloadGeoJsonV21==='function')return downloadGeoJsonV21();}
function exportProjectV23(){ensurePlanV23();blobDownloadV23('field-map-project.json','application/json',JSON.stringify({format:'raznye-ludi-field-map',version:2,exportedAt:new Date().toISOString(),editor:editorV13,atlas:typeof atlasV20!=='undefined'?atlasV20:null},null,2))}
function exportCardV23(){return section('Электронный экспорт',`<div class="export-grid-v23"><button class="btn sand" id="exportGpxV23"><b>GPX</b><span>трек + КП + метки</span></button><button class="btn alt" id="exportKmlV23"><b>KML</b><span>Google Earth и совместимые карты</span></button><button class="btn alt" id="exportGeoV23"><b>GeoJSON</b><span>GIS / веб-карты</span></button><button class="btn alt" id="exportProjectV23"><b>Проект JSON</b><span>полное редактируемое состояние</span></button></div>`,'GPX и KML содержат географическую линию и точки в WGS84. Бумажный атлас остаётся отдельным экспортом.')}
const routePageBeforeV23=routePage;
routePage=function(){return routePageBeforeV23()+exportCardV23()};

/* Fullscreen studio: classify route segments with the same four terrain classes. */
const inspectorSelectBeforeV23=inspectorSelectV21;
inspectorSelectV21=function(){
  const s=studioV21.selected;
  if(s?.type!=='segment')return inspectorSelectBeforeV23();
  const i=s.index,a=editorV13.route[i],b=editorV13.route[i+1],t=editorV13.terrain[i]||'unknown',speed=profileSpeedV23(t);
  return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>Участок ${i+1}</h3></div><div class="studio-stat-card-v21"><span>Отрезок</span><strong>${(havV13(a,b)/1000).toFixed(2).replace('.',',')} км</strong></div><label>Проходимость<select id="studioTerrainV23">${['road','trail','clearing','forest','unknown'].map(k=>`<option value="${k}" ${t===k?'selected':''}>${TERRAIN_META_V23[k].label}</option>`).join('')}</select></label><div class="studio-stat-card-v21"><span>${PACE_PROFILES_V23[planProfileV23()].label}</span><strong>${speed.toFixed(1)} км/ч</strong></div><div class="studio-help-v21">${TERRAIN_META_V23[t].hint} Скорость берётся из выбранного профиля во вкладке «План».</div><button class="studio-btn-v21 wide" id="studioSplitSegV21">Добавить узел в середине</button>`;
};
const inspectorCpBeforeV23=inspectorCpV21;
inspectorCpV21=function(){
  const id=studioV21.selected?.type==='cp'?studioV21.selected.id:null,cp=id?editorV13.cps.find(x=>x.id===id):null,dyn=id?dynamicCpsV13().find(x=>x.id===id):null;if(!cp)return inspectorCpBeforeV23();
  return `<div class="studio-ins-head-v21"><small>${dyn?.number==='С'?'СТАРТ':dyn?.number==='Ф'?'ФИНИШ':`КП ${dyn?.number||''}`}</small><h3>${esc(cp.title)}</h3></div><label>Название<input id="studioCpTitleV21" value="${esc(cp.title)}"></label><div class="studio-grid2-v21"><label>Широта<input id="studioCpLatV21" value="${(+cp.lat).toFixed(7)}"></label><label>Долгота<input id="studioCpLonV21" value="${(+cp.lon).toFixed(7)}"></label></div><div class="studio-coordinate-actions-v23"><code>${(+cp.lat).toFixed(6)}, ${(+cp.lon).toFixed(6)}</code><button id="studioCopyCpV23">Копировать</button><button id="studioOpenCpV23">Карта ↗</button></div><div class="studio-stat-card-v21"><span>Квадрат / ETA</span><strong>${gridCodeDynamicV13(cp.lat,cp.lon)} · ${dyn?.arrival||'—'}</strong></div><div class="breaks-note-v23">Перерывы не привязаны к КП и редактируются во вкладке «План».</div><button class="studio-btn-v21 primary wide" id="studioCpSaveV21">Сохранить КП</button><button class="studio-btn-v21 danger wide" id="studioCpDeleteV21" ${cp.locked?'disabled':''}>Удалить КП</button>`;
};
const bindStudioInspectorBeforeV23=bindStudioInspectorV21;
bindStudioInspectorV21=function(){bindStudioInspectorBeforeV23();document.getElementById('studioTerrainV23')?.addEventListener('change',e=>{const i=studioV21.selected?.index;if(!Number.isInteger(i))return;pushStudioHistoryV21();editorV13.terrain[i]=e.target.value;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()});document.getElementById('studioCopyCpV23')?.addEventListener('click',()=>copyCpV23(studioV21.selected?.id));document.getElementById('studioOpenCpV23')?.addEventListener('click',()=>openCpV23(studioV21.selected?.id));};
const renderStudioShellBeforeV23=renderStudioShellV21;
renderStudioShellV21=function(){renderStudioShellBeforeV23();const title=document.querySelector('.studio-title-v21>div');if(title&&!title.querySelector('.studio-schedule-v23')){const e=document.createElement('span');e.className='studio-schedule-v23';title.appendChild(e)}updateStudioHeaderMetricsV21()};
const updateStudioHeaderMetricsBeforeV23=updateStudioHeaderMetricsV21;
updateStudioHeaderMetricsV21=function(){updateStudioHeaderMetricsBeforeV23();const e=document.getElementById('studioEtaV21');if(e)e.textContent=`Старт ${editorV13.start} · Финиш ${finalEtaV13()}`;const s=document.querySelector('.studio-schedule-v23');if(s)s.textContent=`Старт ${editorV13.start} · Финиш ${finalEtaV13()}`};

/* Atlas: richer field legend and route plan with independent breaks. */
if(typeof legendV22==='function'){
  legendV22=function(source){const src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;return `<div class="atlas-legend-v22 atlas-legend-v23"><small>УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</small><div><span><i class="lg-route"></i>Маршрут</span><span><i class="lg-cp"></i>Контрольная точка</span><span><i class="lg-camp"></i>Старт / финиш</span><span><i class="lg-road-v23"></i>Дорога</span><span><i class="lg-trail-v23"></i>Тропа</span><span><i class="lg-rail-v23"></i>Железная дорога</span><span><i class="lg-power-v23"></i>ЛЭП / просека</span><span><i class="lg-water-v23"></i>Вода</span><span><i class="lg-swamp-v23"></i>Болото</span><span><i class="lg-forest-v23"></i>Лес</span><span><i class="lg-open-v23"></i>Открытая местность</span><span><i class="lg-grid"></i>Сетка ${gridCfgV13().cell} м</span><span><i class="lg-sheet"></i>Текущий лист</span></div><em>${esc(src.label)}</em></div>`};
}
tablePlanV20=function(){
  const stats=routePlanStatsV23(),rows=breakTimelineV23().map(x=>x.kind==='cp'?`<tr><td>${x.cp.number}</td><td><b>${esc(x.cp.title)}</b></td><td>${x.cp.km.toFixed(1)}</td><td>${x.cp.arrival}</td><td>${gridCodeDynamicV13(x.cp.lat,x.cp.lon)}</td><td>${x.cp.lat.toFixed(6)}, ${x.cp.lon.toFixed(6)}</td></tr>`:`<tr class="atlas-break-row-v23"><td>—</td><td><b>${esc(x.break.title)}</b></td><td>—</td><td>${x.start}–${x.end} · ${x.break.minutes} мин</td><td>—</td><td>после ${esc(x.after.title)}</td></tr>`).join('');
  return `<section class="atlas-page-v20 atlas-table-v20 page-landscape-v22"><header><div><small>МАРШРУТНЫЙ ПЛАН</small><h1>Время, перерывы и координаты</h1></div><b>${PACE_PROFILES_V23[planProfileV23()].short} · ${editorV13.start} → ${finalEtaV13()}</b></header><div class="atlas-plan-summary-v23"><span>Движение ${fmtMinutesV23(stats.base)}</span><span>Резерв ${reservePctV23()}% · ${fmtMinutesV23(stats.reserve)}</span><span>Перерывы ${fmtMinutesV23(stats.pauses)}</span><span>Длина ${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</span></div><table><thead><tr><th>КП</th><th>Событие</th><th>Км</th><th>Время</th><th>Квадрат</th><th>WGS84 / примечание</th></tr></thead><tbody>${rows}</tbody></table><footer><span>Перерывы являются временными событиями и не имеют координат.</span></footer></section>`;
};

const bindBeforeV23=bind;
bind=function(){
  bindBeforeV23();ensurePlanV23();removeLegacyStopEditorsV23();injectRouteMapTimesV23();
  document.getElementById('routeStartV23')?.addEventListener('change',e=>{editorV13.start=e.target.value||'10:00';persistPlanV23();render();toast('Время старта обновлено')});
  document.getElementById('reserveV23')?.addEventListener('change',e=>{editorV13.plan.reservePct=Math.max(0,Math.min(50,+e.target.value||0));persistPlanV23();render();toast('Резерв обновлён')});
  document.querySelectorAll('[data-profile-v23]').forEach(b=>b.addEventListener('click',()=>{editorV13.plan.profile=b.dataset.profileV23;syncLegacySpeedsV23();persistPlanV23();render();toast(`Темп: ${PACE_PROFILES_V23[editorV13.plan.profile].label}`)}));
  document.querySelectorAll('[data-speed-v23]').forEach(i=>i.addEventListener('change',()=>{const p=planProfileV23();editorV13.plan.speedProfiles[p][i.dataset.speedV23]=Math.max(.5,Math.min(8,+i.value||3));syncLegacySpeedsV23();persistPlanV23();render();toast('Скорость обновлена')}));
  document.getElementById('addBreakGeneralV23')?.addEventListener('click',()=>addBreakV23());
  document.querySelectorAll('[data-add-break-v23]').forEach(b=>b.addEventListener('click',()=>addBreakV23(b.dataset.addBreakV23)));
  document.querySelectorAll('[data-break-title-v23]').forEach(i=>i.addEventListener('change',()=>updateBreakV23(i.dataset.breakTitleV23,{title:i.value.trim()||'Перерыв'})));
  document.querySelectorAll('[data-break-min-v23]').forEach(i=>i.addEventListener('change',()=>updateBreakV23(i.dataset.breakMinV23,{minutes:+i.value||0})));
  document.querySelectorAll('[data-break-up-v23]').forEach(b=>b.addEventListener('click',()=>moveBreakV23(b.dataset.breakUpV23,-1)));
  document.querySelectorAll('[data-break-down-v23]').forEach(b=>b.addEventListener('click',()=>moveBreakV23(b.dataset.breakDownV23,1)));
  document.querySelectorAll('[data-break-del-v23]').forEach(b=>b.addEventListener('click',()=>deleteBreakV23(b.dataset.breakDelV23)));
  let dragId=null;document.querySelectorAll('[data-break-id-v23]').forEach(row=>row.addEventListener('dragstart',e=>{dragId=row.dataset.breakIdV23;e.dataTransfer.effectAllowed='move';row.classList.add('dragging')}));document.querySelectorAll('[data-break-id-v23]').forEach(row=>row.addEventListener('dragend',()=>row.classList.remove('dragging')));document.querySelectorAll('[data-break-drop-v23]').forEach(z=>{z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('over')});z.addEventListener('dragleave',()=>z.classList.remove('over'));z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('over');if(dragId)updateBreakV23(dragId,{afterCpId:z.dataset.breakDropV23})})});
  document.querySelectorAll('[data-copy-cp-v23]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();copyCpV23(b.dataset.copyCpV23)}));
  document.querySelectorAll('[data-open-cp-v23]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openCpV23(b.dataset.openCpV23)}));
  document.getElementById('copyAllCpV23')?.addEventListener('click',copyAllCpV23);
  document.getElementById('exportGpxV23')?.addEventListener('click',exportGpxV23);document.getElementById('exportKmlV23')?.addEventListener('click',exportKmlV23);document.getElementById('exportGeoV23')?.addEventListener('click',exportGeoJsonV23);document.getElementById('exportProjectV23')?.addEventListener('click',exportProjectV23);
};

ensurePlanV23();
const buildV23=document.querySelector('.build-label');if(buildV23)buildV23.textContent='V17 · гибкий план · темпы · электронный экспорт';
render();


;/* source: hikes-preview/transport-v24.js */
/* V18 — transport planner: driver profiles, event rides, pickup points, requests and Yandex handoff. */
const TRANSPORT_V24_VERSION=1;
let transportMapV24=null,transportMapLayersV24=[];

function transportSeedV24(){
  const routeStart=(typeof editorV13!=='undefined'&&Array.isArray(editorV13.route)&&editorV13.route[0])?editorV13.route[0]:[null,null];
  const profiles={};
  (S.participants||[]).forEach(p=>profiles[p.id]={driver:false,defaultSeats:3,phone:'',vehicle:'',plate:'',color:''});
  const legacyDrivers=new Set([...(S.cars?.there||[]).map(c=>c.driver),...(S.cars?.back||[]).map(c=>c.driver)]);
  legacyDrivers.forEach(pid=>{if(profiles[pid])profiles[pid].driver=true});
  const state={version:TRANSPORT_V24_VERSION,arrival:{title:'Место прибытия мероприятия',lat:routeStart[0],lon:routeStart[1],time:S.event?.start||'09:15',note:'Точка транспорта задаётся отдельно от пешего маршрута.'},profiles,rides:{there:[],back:[]},choices:{there:{},back:{}}};
  ['there','back'].forEach(d=>{
    (S.participants||[]).forEach(p=>state.choices[d][p.id]={mode:'unset'});
    (S.cars?.[d]||[]).forEach((c,idx)=>{
      const stop={id:`legacy_${d}_${idx}`,title:c.from||'Точка посадки уточняется',lat:null,lon:null,time:c.time&&c.time!=='Уточняется'?c.time:'',note:'Уточни точные координаты точки.'};
      const ride={id:`tv24_${d}_${c.id||idx}`,driver:c.driver,seats:Math.max(0,+c.cap||3),vehicle:c.name||`Машина ${pn(c.driver)}`,color:'',plate:'',comment:'',stops:[stop],passengers:[...(c.pass||[])],requests:[]};
      state.rides[d].push(ride);state.choices[d][c.driver]={mode:'driver',rideId:ride.id};
      (c.pass||[]).forEach(pid=>{const req={id:`legacy_req_${d}_${ride.id}_${pid}`,pid,pickupId:stop.id,status:'approved',createdAt:Date.now()};ride.requests.push(req);state.choices[d][pid]={mode:'ride',rideId:ride.id,requestId:req.id,pickupId:stop.id}});
    });
    (S.participants||[]).forEach(p=>{
      if(state.choices[d][p.id].mode!=='unset')return;
      const old=S.rides?.[d]?.[p.id];
      if(old==='self')state.choices[d][p.id]={mode:'self'};
      else if(old==='need')state.choices[d][p.id]={mode:'unset'};
    });
  });
  return state;
}
function ensureTransportV24(){
  if(!S.transportV24||S.transportV24.version!==TRANSPORT_V24_VERSION)S.transportV24=transportSeedV24();
  const T=S.transportV24;T.profiles=T.profiles||{};T.rides=T.rides||{there:[],back:[]};T.choices=T.choices||{there:{},back:{}};
  (S.participants||[]).forEach(p=>{
    if(!T.profiles[p.id])T.profiles[p.id]={driver:false,defaultSeats:3,phone:'',vehicle:'',plate:'',color:''};
    ['there','back'].forEach(d=>{if(!T.choices[d])T.choices[d]={};if(!T.choices[d][p.id])T.choices[d][p.id]={mode:'unset'}});
  });
  if(!T.arrival)T.arrival={title:'Место прибытия мероприятия',lat:null,lon:null,time:'',note:''};
  syncLegacyTransportV24(false);return T;
}
function tv24(){return ensureTransportV24()}
function transportProfileV24(pid=S.current){return tv24().profiles[pid]}
function transportRideV24(id,d=dir){return tv24().rides[d].find(r=>r.id===id)}
function transportDriverRideV24(pid=S.current,d=dir){return tv24().rides[d].find(r=>r.driver===pid)}
function transportChoiceV24(pid=S.current,d=dir){return tv24().choices[d][pid]||{mode:'unset'}}
function transportRequestV24(pid=S.current,d=dir){for(const r of tv24().rides[d]){const q=(r.requests||[]).find(x=>x.pid===pid&&['pending','approved'].includes(x.status));if(q)return {ride:r,request:q}}return null}
function transportConfirmedV24(){return S.participants.filter(p=>p.rsvp==='yes')}
function transportFreeV24(r){return Math.max(0,(+r.seats||0)-(r.passengers||[]).length)}
function transportSaveV24(msg=''){syncLegacyTransportV24(true);if(msg)toast(msg);render()}
function syncLegacyTransportV24(doSave=true){
  const T=S.transportV24;if(!T)return;
  S.cars=S.cars||{there:[],back:[]};S.rides=S.rides||{there:{},back:{}};
  ['there','back'].forEach(d=>{
    S.cars[d]=(T.rides[d]||[]).map(r=>({id:r.id,driver:r.driver,name:r.vehicle||`Машина ${pn(r.driver)}`,cap:+r.seats||0,pass:[...(r.passengers||[])],time:r.stops?.[0]?.time||'',from:r.stops?.[0]?.title||'Точка уточняется'}));
    (S.participants||[]).forEach(p=>{
      const c=T.choices[d]?.[p.id]||{mode:'unset'};
      S.rides[d][p.id]=c.mode==='driver'?'own':c.mode==='self'?'self':c.mode==='ride'?c.rideId:c.mode==='request'?'need':'unset';
    });
  });
  if(doSave)save();
}
function fmtCoordV24(lat,lon){return Number.isFinite(+lat)&&Number.isFinite(+lon)?`${(+lat).toFixed(6)}, ${(+lon).toFixed(6)}`:'координаты не заданы'}
function hasCoordV24(p){return p&&p.lat!==null&&p.lon!==null&&p.lat!==''&&p.lon!==''&&Number.isFinite(+p.lat)&&Number.isFinite(+p.lon)}
function yandexPointV24(lat,lon){return `https://yandex.ru/maps/?ll=${encodeURIComponent(`${lon},${lat}`)}&z=16&pt=${encodeURIComponent(`${lon},${lat},pm2rdm`)}`}
function yandexRouteV24(points){const pts=points.filter(hasCoordV24);if(pts.length<2)return null;return `https://yandex.ru/maps/?mode=routes&rtext=${pts.map(p=>`${(+p.lat).toFixed(6)}%2C${(+p.lon).toFixed(6)}`).join('~')}&rtt=auto`}
function rideRoutePointsV24(r,d=dir){const a=tv24().arrival,st=(r.stops||[]).filter(hasCoordV24);return d==='there'?[...st,a]:[a,...st]}
function openYandexRideV24(r,d=dir){const u=yandexRouteV24(rideRoutePointsV24(r,d));if(!u)return toast('Сначала задай координаты хотя бы двух точек');window.open(u,'_blank','noopener')}
function copyTextV24(s,msg='Скопировано'){navigator.clipboard?.writeText(s).then(()=>toast(msg)).catch(()=>toast('Не удалось скопировать'))}

function transportSummaryV24(d=dir){
  const T=tv24(),people=transportConfirmedV24(),rides=T.rides[d],drivers=people.filter(p=>rides.some(r=>r.driver===p.id)).length;
  let inCars=0,self=0,pending=0,unset=0;
  people.forEach(p=>{const c=T.choices[d][p.id]||{mode:'unset'};if(c.mode==='ride')inCars++;else if(c.mode==='self')self++;else if(c.mode==='request')pending++;else if(c.mode!=='driver')unset++});
  const free=rides.reduce((n,r)=>n+transportFreeV24(r),0);return {total:people.length,drivers,inCars,self,pending,unset,free};
}
function directionLabelV24(d){return d==='there'?'Туда':'Обратно'}
function stopKindV24(d){return d==='there'?'Точка посадки':'Точка высадки'}

function profileCardV24(){const p=transportProfileV24(),ride=transportDriverRideV24(S.current,dir);return `<div class="tv24-profile"><div class="tv24-profile-main"><div class="avatar small">${initials(pn(S.current))}</div><div><small>МОЙ ТРАНСПОРТНЫЙ ПРОФИЛЬ</small><strong>${esc(pn(S.current))}</strong><span>${p.driver?`Водитель · обычно ${p.defaultSeats} пасс. мест${p.vehicle?' · '+esc(p.vehicle):''}`:'Не водитель'}${p.phone?' · телефон указан':''}</span></div></div><div class="row-actions"><button class="btn alt sm" id="tv24ProfileEdit">Настроить профиль</button>${p.driver&&!ride?`<button class="btn sand sm" id="tv24CreateRide">Создать рейс ${dir==='there'?'туда':'обратно'}</button>`:''}</div></div>`}
function arrivalCardV24(){const a=tv24().arrival;return `<div class="tv24-arrival"><div class="tv24-arrival-pin">★</div><div class="tv24-arrival-copy"><small>${dir==='there'?'КУДА НУЖНО ПРИЕХАТЬ':'ОТКУДА УЕЗЖАЕМ'}</small><h3>${esc(a.title||'Место прибытия')}</h3><p>${esc(a.note||'')}</p><div class="tv24-coordinate"><code>${esc(fmtCoordV24(a.lat,a.lon))}</code>${a.time?`<b>${dir==='there'?'Прибыть к':'Отъезд ориентировочно'} ${esc(a.time)}</b>`:''}</div></div><div class="tv24-arrival-actions"><button class="btn alt sm" id="tv24EditArrival">Редактировать</button>${hasCoordV24(a)?`<button class="btn sm" data-tv24-yandex-point="arrival">Яндекс ↗</button>`:''}</div></div>`}
function requestStateCardV24(){const c=transportChoiceV24(),active=transportRequestV24();if(c.mode==='self')return `<div class="tv24-myride self"><div><small>МОЙ ВАРИАНТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Добираюсь самостоятельно</strong><span>При необходимости можно выбрать машину ниже.</span></div><button class="btn alt sm" data-tv24-unset-self>Изменить</button></div>`;
  if(active){const r=active.ride,q=active.request,stop=(r.stops||[]).find(s=>s.id===q.pickupId),approved=q.status==='approved';return `<div class="tv24-myride ${approved?'approved':'pending'}"><div><small>${approved?'ПОДТВЕРЖДЕНО':'ЗАЯВКА ОТПРАВЛЕНА'}</small><strong>${esc(pn(r.driver))} · ${esc(r.vehicle||'автомобиль')}</strong><span>${esc(stop?.title||stopKindV24(dir))}${stop?.time?' · '+esc(stop.time):''}</span>${approved&&transportProfileV24(r.driver).phone?`<a href="tel:${esc(transportProfileV24(r.driver).phone)}">${esc(transportProfileV24(r.driver).phone)}</a>`:''}</div><div class="row-actions">${stop&&hasCoordV24(stop)?`<button class="btn sm" data-tv24-yandex-stop="${r.id}:${stop.id}">Точка в Яндекс</button>`:''}<button class="btn alt sm" data-tv24-cancel-request="${q.id}">${approved?'Отказаться от места':'Отменить заявку'}</button></div></div>`}
  const ride=transportDriverRideV24();if(ride)return `<div class="tv24-myride approved"><div><small>МОЙ РЕЙС · ${directionLabelV24(dir).toUpperCase()}</small><strong>Вы водитель</strong><span>${(ride.passengers||[]).length} пассажиров · ${transportFreeV24(ride)} свободных мест</span></div><button class="btn alt sm" data-tv24-edit-ride="${ride.id}">Редактировать рейс</button></div>`;
  return `<div class="tv24-myride unset"><div><small>МОЙ ВАРИАНТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Транспорт пока не выбран</strong><span>Можно попроситься к водителю или отметить самостоятельную поездку.</span></div><button class="btn alt sm" data-tv24-self>Поеду самостоятельно</button></div>`;
}
function rideStopsHtmlV24(r){return (r.stops||[]).map((s,i)=>`<div class="tv24-stop ${hasCoordV24(s)?'':'missing'}"><div class="tv24-stop-index">${i+1}</div><div><b>${esc(s.title||stopKindV24(dir))}</b><small>${s.time?esc(s.time):'время уточняется'} · ${esc(fmtCoordV24(s.lat,s.lon))}</small>${s.note?`<em>${esc(s.note)}</em>`:''}</div>${r.driver===S.current?`<button class="icon-btn" data-tv24-edit-stop="${r.id}:${s.id}" title="Редактировать">✎</button>`:''}</div>`).join('')||`<div class="tv24-empty-small">${dir==='there'?'Водитель ещё не указал точку посадки.':'Точки высадки пока не указаны.'}</div>`}
function pendingForRideV24(r){return (r.requests||[]).filter(q=>q.status==='pending')}
function rideCardV24(r){const me=r.driver===S.current,free=transportFreeV24(r),prof=transportProfileV24(r.driver),pending=pendingForRideV24(r),my=transportRequestV24(),activeElsewhere=my&&my.ride.id!==r.id;return `<article class="tv24-ride ${me?'mine':''}"><header><div><small>${me?'МОЙ РЕЙС':'ВОДИТЕЛЬ'}</small><h3>${esc(pn(r.driver))}${r.vehicle?' · '+esc(r.vehicle):''}</h3><span>${r.color?esc(r.color)+' · ':''}${r.plate?esc(r.plate):''}</span></div><div class="tv24-seats"><strong>${(r.passengers||[]).length} / ${+r.seats||0}</strong><small>${free} свободно</small>${pending.length?`<em>${pending.length} заявк${pending.length===1?'а':'и'}</em>`:''}</div></header><div class="tv24-route-line"><div><span>${dir==='there'?'Посадки':'Старт'}</span><b>${dir==='there'?`${(r.stops||[]).length} точ${(r.stops||[]).length===1?'ка':'ки'}`:esc(tv24().arrival.title)}</b></div><i>→</i><div><span>${dir==='there'?'Прибытие':'Высадки'}</span><b>${dir==='there'?esc(tv24().arrival.title):`${(r.stops||[]).length} точ${(r.stops||[]).length===1?'ка':'ки'}`}</b></div></div><div class="tv24-stops">${rideStopsHtmlV24(r)}</div><div class="tv24-passengers"><small>ПАССАЖИРЫ</small>${(r.passengers||[]).length?(r.passengers||[]).map(pid=>`<span>${esc(pn(pid))}</span>`).join(''):'<em>Пока никого</em>'}</div>${me&&pending.length?`<div class="tv24-requests"><small>ОЖИДАЮТ РЕШЕНИЯ</small>${pending.map(q=>{const st=(r.stops||[]).find(s=>s.id===q.pickupId);return `<div><span><b>${esc(pn(q.pid))}</b><small>${esc(st?.title||'точка не выбрана')}</small></span><button class="btn sm" data-tv24-approve="${r.id}:${q.id}">Подтвердить</button><button class="btn alt sm" data-tv24-decline="${r.id}:${q.id}">Отказать</button></div>`}).join('')}</div>`:''}<footer><div class="row-actions">${me?`<button class="btn alt sm" data-tv24-edit-ride="${r.id}">Настройки рейса</button><button class="btn sm" data-tv24-add-stop="${r.id}">+ ${dir==='there'?'Посадка':'Высадка'}</button>`:`<button class="btn sand sm" data-tv24-request="${r.id}" ${free<=0||activeElsewhere||my?.ride.id===r.id?'disabled':''}>${my?.ride.id===r.id?'Заявка уже отправлена':free<=0?'Мест нет':'Попроситься'}</button>`}<button class="btn alt sm" data-tv24-yandex-ride="${r.id}">Маршрут в Яндекс</button></div>${me&&dir==='there'?`<button class="text-button" data-tv24-copy-back="${r.id}">Скопировать этот рейс обратно</button>`:''}</footer></article>`}
function organizerSummaryV24(){const s=transportSummaryV24();return `<div class="tv24-summary"><div><small>ПОДТВЕРДИЛИ УЧАСТИЕ</small><strong>${s.total}</strong></div><div><small>Водителей</small><strong>${s.drivers}</strong></div><div><small>В машинах</small><strong>${s.inCars}</strong></div><div><small>Самостоятельно</small><strong>${s.self}</strong></div><div class="${s.pending?'warn':''}"><small>Ждут ответа</small><strong>${s.pending}</strong></div><div class="${s.unset?'risk':''}"><small>Не определились</small><strong>${s.unset}</strong></div><div><small>Свободных мест</small><strong>${s.free}</strong></div></div>`}
function transportPage(){ensureTransportV24();const rides=tv24().rides[dir],prof=transportProfileV24();return `${pageHead('Логистика','Транспорт','Водители сами задают точки посадки, время и места. Пассажир отправляет одну заявку и получает точку после подтверждения.',prof.driver&&dir==='there'&&transportDriverRideV24(S.current,'there')?`<button class="btn alt" data-tv24-copy-back="${transportDriverRideV24(S.current,'there').id}">Скопировать рейс обратно</button>`:'')}<div class="segmented tv24-dir"><button class="${dir==='there'?'active':''}" data-tv24-dir="there">Туда</button><button class="${dir==='back'?'active':''}" data-tv24-dir="back">Обратно</button></div>${profileCardV24()}${organizerSummaryV24()}${arrivalCardV24()}${requestStateCardV24()}<div class="tv24-layout"><section class="section tv24-rides-section"><div class="section-head"><div><h2>${dir==='there'?'Доступные рейсы':'Обратные рейсы'}</h2><p>${dir==='there'?'Выбери водителя и конкретную точку посадки. Место считается занятым только после подтверждения водителем.':'По умолчанию водитель может скопировать рейс «туда» и затем изменить высадки, время и состав.'}</p></div></div><div class="tv24-rides">${rides.length?rides.map(rideCardV24).join(''):'<div class="empty-state"><strong>Рейсов пока нет</strong><span>Водитель может создать первый рейс из своего профиля.</span></div>'}</div></section><aside class="section tv24-map-section"><div class="section-head"><div><h2>Карта транспорта</h2><p>Точки посадки и место мероприятия. Дорожный маршрут открывается в Яндекс Картах.</p></div></div><div id="transportMapV24" class="tv24-map"></div><div class="tv24-map-legend"><span><i class="arrival"></i>Место мероприятия</span><span><i class="pickup"></i>${dir==='there'?'Посадка':'Высадка'}</span></div></aside></div>`}

function transportProfileModalV24(){const p=transportProfileV24(),hasRide=['there','back'].some(d=>!!transportDriverRideV24(S.current,d));openModal('Транспортный профиль',`<div class="form-grid"><div class="field full"><label class="tv24-check"><input id="tv24ProfDriver" type="checkbox" ${p.driver?'checked':''}><span><b>Я водитель</b><small>Смогу создавать рейсы и брать пассажиров.</small></span></label></div><div class="field"><label>Обычно пассажирских мест</label><input id="tv24ProfSeats" type="number" min="0" max="12" value="${+p.defaultSeats||3}"></div><div class="field"><label>Телефон</label><input id="tv24ProfPhone" type="tel" value="${esc(p.phone||'')}" placeholder="+7 ..."></div><div class="field"><label>Автомобиль</label><input id="tv24ProfVehicle" value="${esc(p.vehicle||'')}" placeholder="Например, Kia Sportage"></div><div class="field"><label>Цвет</label><input id="tv24ProfColor" value="${esc(p.color||'')}" placeholder="Серый"></div><div class="field"><label>Госномер</label><input id="tv24ProfPlate" value="${esc(p.plate||'')}" placeholder="Необязательно"></div></div>`,layer=>{const driver=layer.querySelector('#tv24ProfDriver').checked;if(!driver&&hasRide){toast('Сначала удали свои рейсы в мероприятии');return false}Object.assign(p,{driver,defaultSeats:Math.max(0,+layer.querySelector('#tv24ProfSeats').value||0),phone:layer.querySelector('#tv24ProfPhone').value.trim(),vehicle:layer.querySelector('#tv24ProfVehicle').value.trim(),color:layer.querySelector('#tv24ProfColor').value.trim(),plate:layer.querySelector('#tv24ProfPlate').value.trim()});transportSaveV24('Профиль транспорта обновлён')})}
function transportRideModalV24(ride=null,d=dir){const p=transportProfileV24(),r=ride||{seats:p.defaultSeats||3,vehicle:p.vehicle||'',color:p.color||'',plate:p.plate||'',comment:''};openModal(ride?'Настройки рейса':`Новый рейс · ${directionLabelV24(d)}`,`<div class="form-grid"><div class="field"><label>Пассажирских мест на этот выезд</label><input id="tv24RideSeats" type="number" min="0" max="12" value="${+r.seats||0}"></div><div class="field"><label>Автомобиль</label><input id="tv24RideVehicle" value="${esc(r.vehicle||'')}" placeholder="Можно оставить пустым"></div><div class="field"><label>Цвет</label><input id="tv24RideColor" value="${esc(r.color||'')}"></div><div class="field"><label>Госномер</label><input id="tv24RidePlate" value="${esc(r.plate||'')}"></div><div class="field full"><label>Комментарий для пассажиров</label><textarea id="tv24RideComment" placeholder="Где искать машину, особенности поездки">${esc(r.comment||'')}</textarea></div></div>${ride?`<div class="tv24-modal-danger"><button type="button" class="btn alt sm" id="tv24DeleteRide">Удалить рейс</button></div>`:''}`,layer=>{const seats=Math.max(0,+layer.querySelector('#tv24RideSeats').value||0);if(ride&&seats<(ride.passengers||[]).length){toast('Нельзя поставить мест меньше подтверждённых пассажиров');return false}if(!ride){if(transportDriverRideV24(S.current,d)){toast('У вас уже есть рейс в этом направлении');return false}ride={id:`ride_${d}_${Date.now()}`,driver:S.current,seats,vehicle:'',color:'',plate:'',comment:'',stops:[],passengers:[],requests:[]};tv24().rides[d].push(ride);tv24().choices[d][S.current]={mode:'driver',rideId:ride.id}}Object.assign(ride,{seats,vehicle:layer.querySelector('#tv24RideVehicle').value.trim(),color:layer.querySelector('#tv24RideColor').value.trim(),plate:layer.querySelector('#tv24RidePlate').value.trim(),comment:layer.querySelector('#tv24RideComment').value.trim()});transportSaveV24(ride.stops.length?'Рейс обновлён':'Рейс создан — добавь точку')});setTimeout(()=>{document.getElementById('tv24DeleteRide')?.addEventListener('click',()=>deleteRideV24(ride,d))},0)}
function deleteRideV24(r,d=dir){if(!r)return;if((r.passengers||[]).length||pendingForRideV24(r).length)return toast('Сначала закрой заявки и пассажиров');if(!confirm('Удалить этот рейс?'))return;tv24().rides[d]=tv24().rides[d].filter(x=>x.id!==r.id);tv24().choices[d][r.driver]={mode:'unset'};document.getElementById('modalCancel')?.click();transportSaveV24('Рейс удалён')}

function pointModalV24({title,value={},kind='stop',onSave}){const v={title:value.title||'',lat:value.lat,lon:value.lon,time:value.time||'',note:value.note||''};openModal(title,`<div class="form-grid"><div class="field full"><label>Название точки</label><input id="tv24PointTitle" value="${esc(v.title)}" placeholder="Например, парковка у метро"></div><div class="field"><label>Время</label><input id="tv24PointTime" type="time" value="${esc(v.time)}"></div><div class="field"></div><div class="field"><label>Широта</label><input id="tv24PointLat" type="number" step="0.000001" value="${Number.isFinite(+v.lat)?(+v.lat).toFixed(6):''}"></div><div class="field"><label>Долгота</label><input id="tv24PointLon" type="number" step="0.000001" value="${Number.isFinite(+v.lon)?(+v.lon).toFixed(6):''}"></div><div class="field full"><label>Комментарий</label><textarea id="tv24PointNote" placeholder="Выход, парковка, ориентир">${esc(v.note)}</textarea></div><div class="field full"><div id="tv24PointPicker" class="tv24-point-picker"></div><small class="tv24-field-help">Кликни по карте или перетащи метку. Для городской навигации после сохранения можно открыть точку в Яндекс Картах.</small></div></div>`,layer=>{const obj={title:layer.querySelector('#tv24PointTitle').value.trim(),time:layer.querySelector('#tv24PointTime').value,lat:+layer.querySelector('#tv24PointLat').value,lon:+layer.querySelector('#tv24PointLon').value,note:layer.querySelector('#tv24PointNote').value.trim()};if(!obj.title){toast('Укажи название точки');return false}if(!Number.isFinite(obj.lat)||!Number.isFinite(obj.lon)){toast('Укажи точку на карте или координаты');return false}onSave(obj)});setTimeout(()=>mountPointPickerV24(v),40)}
function mountPointPickerV24(v){const el=document.getElementById('tv24PointPicker');if(!el||!window.L)return;let lat=Number.isFinite(+v.lat)?+v.lat:(hasCoordV24(tv24().arrival)?+tv24().arrival.lat:55.75),lon=Number.isFinite(+v.lon)?+v.lon:(hasCoordV24(tv24().arrival)?+tv24().arrival.lon:37.62);const m=L.map(el,{zoomControl:true,attributionControl:false}).setView([lat,lon],Number.isFinite(+v.lat)?15:11);let spec;try{spec=tileSpecStudioV21('city')}catch(e){spec={url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',opts:{maxZoom:19}}}L.tileLayer(spec.url,spec.opts).addTo(m);const marker=L.marker([lat,lon],{draggable:true}).addTo(m);const set=ll=>{marker.setLatLng(ll);const a=document.getElementById('tv24PointLat'),o=document.getElementById('tv24PointLon');if(a)a.value=ll.lat.toFixed(6);if(o)o.value=ll.lng.toFixed(6)};m.on('click',e=>set(e.latlng));marker.on('dragend',e=>set(e.target.getLatLng()));setTimeout(()=>m.invalidateSize(false),100)}
function arrivalModalV24(){pointModalV24({title:'Место прибытия мероприятия',value:tv24().arrival,kind:'arrival',onSave:o=>{tv24().arrival={...tv24().arrival,...o};transportSaveV24('Место мероприятия обновлено')}})}
function stopModalV24(r,stop=null){pointModalV24({title:stop?`Редактировать · ${stopKindV24(dir)}`:`Добавить · ${stopKindV24(dir)}`,value:stop||{},kind:'stop',onSave:o=>{if(stop)Object.assign(stop,o);else(r.stops||(r.stops=[])).push({id:`stop_${Date.now()}`,...o});transportSaveV24(stop?'Точка обновлена':'Точка добавлена')}})}
function requestModalV24(r){if(transportRequestV24())return toast('Сначала откажись от текущей заявки или места');const stops=(r.stops||[]);if(!stops.length)return toast('Водитель ещё не указал точку посадки');openModal('Попроситься в машину',`<div class="tv24-request-choice"><p>Выбери, где ${dir==='there'?'тебя забрать':'тебя высадить'}:</p>${stops.map((s,i)=>`<label><input type="radio" name="tv24Pickup" value="${s.id}" ${i===0?'checked':''}><span><b>${esc(s.title)}</b><small>${s.time?esc(s.time)+' · ':''}${esc(fmtCoordV24(s.lat,s.lon))}</small></span></label>`).join('')}</div>`,layer=>{if(transportFreeV24(r)<=0){toast('Свободных мест уже нет');return false}const pickupId=layer.querySelector('[name="tv24Pickup"]:checked')?.value;if(!pickupId){toast('Выбери точку');return false}const q={id:`req_${Date.now()}`,pid:S.current,pickupId,status:'pending',createdAt:Date.now()};(r.requests||(r.requests=[])).push(q);tv24().choices[dir][S.current]={mode:'request',rideId:r.id,requestId:q.id,pickupId};transportSaveV24('Заявка отправлена водителю')})}
function findRequestByIdV24(id,d=dir){for(const r of tv24().rides[d]){const q=(r.requests||[]).find(x=>x.id===id);if(q)return {r,q}}return null}
function approveRequestV24(rid,qid){const r=transportRideV24(rid);if(!r||r.driver!==S.current)return;const q=(r.requests||[]).find(x=>x.id===qid);if(!q||q.status!=='pending')return;if(transportFreeV24(r)<=0)return toast('Свободных мест больше нет');const other=transportRequestV24(q.pid,dir);if(other&&(other.ride.id!==r.id||other.request.id!==q.id))return toast('У пассажира уже есть другой активный вариант');q.status='approved';if(!r.passengers.includes(q.pid))r.passengers.push(q.pid);tv24().choices[dir][q.pid]={mode:'ride',rideId:r.id,requestId:q.id,pickupId:q.pickupId};transportSaveV24(`${pn(q.pid)} подтверждён`)}
function declineRequestV24(rid,qid){const r=transportRideV24(rid);if(!r||r.driver!==S.current)return;const q=(r.requests||[]).find(x=>x.id===qid);if(!q)return;q.status='declined';r.passengers=(r.passengers||[]).filter(pid=>pid!==q.pid);tv24().choices[dir][q.pid]={mode:'unset'};transportSaveV24('Заявка отклонена')}
function cancelRequestV24(qid){const x=findRequestByIdV24(qid);if(!x||x.q.pid!==S.current)return;x.q.status='cancelled';x.r.passengers=(x.r.passengers||[]).filter(pid=>pid!==S.current);tv24().choices[dir][S.current]={mode:'unset'};transportSaveV24('Транспорт освобождён')}
function setSelfV24(){const active=transportRequestV24();if(active)return toast('Сначала откажись от текущей заявки или места');if(transportDriverRideV24())return toast('Сначала удали свой рейс');tv24().choices[dir][S.current]={mode:'self'};transportSaveV24('Отмечено: самостоятельно')}
function unsetSelfV24(){if(transportChoiceV24().mode==='self'){tv24().choices[dir][S.current]={mode:'unset'};transportSaveV24()}}
function copyRideBackV24(rid){const src=transportRideV24(rid,'there');if(!src||src.driver!==S.current)return;const existing=transportDriverRideV24(S.current,'back');if(existing)return toast('Обратный рейс уже существует');if(!confirm('Скопировать машину, пассажиров и точки в обратном порядке? Время можно будет изменить.'))return;const stops=[...(src.stops||[])].reverse().map(s=>({...s,id:`back_stop_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,time:''}));const back={id:`ride_back_${Date.now()}`,driver:src.driver,seats:src.seats,vehicle:src.vehicle,color:src.color,plate:src.plate,comment:src.comment,stops,passengers:[],requests:[]};tv24().rides.back.push(back);tv24().choices.back[src.driver]={mode:'driver',rideId:back.id};let copied=0,skipped=0;(src.passengers||[]).forEach(pid=>{const c=tv24().choices.back[pid]||{mode:'unset'};if(['ride','request','driver'].includes(c.mode)){skipped++;return}const origReq=(src.requests||[]).find(q=>q.pid===pid&&q.status==='approved'),origIndex=(src.stops||[]).findIndex(s=>s.id===origReq?.pickupId),newIndex=origIndex<0?0:stops.length-1-origIndex,q={id:`back_req_${Date.now()}_${pid}`,pid,pickupId:stops[newIndex]?.id||'',status:'approved',createdAt:Date.now()};back.requests.push(q);back.passengers.push(pid);tv24().choices.back[pid]={mode:'ride',rideId:back.id,requestId:q.id,pickupId:q.pickupId};copied++});transportSaveV24(`Обратный рейс создан · пассажиров ${copied}${skipped?`, пропущено ${skipped}`:''}`)}

function mountTransportMapV24(){const el=document.getElementById('transportMapV24');if(!el||!window.L)return;try{transportMapV24?.remove()}catch(e){}transportMapV24=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:true});let spec;try{spec=tileSpecStudioV21('city')}catch(e){spec={url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',opts:{maxZoom:19,attribution:'© OpenStreetMap contributors'}}}L.tileLayer(spec.url,spec.opts).addTo(transportMapV24);const pts=[],a=tv24().arrival;if(hasCoordV24(a)){const m=L.marker([a.lat,a.lon],{icon:L.divIcon({className:'',html:'<span class="tv24-map-arrival">★</span>',iconSize:[30,30],iconAnchor:[15,15]})}).addTo(transportMapV24).bindTooltip(a.title);pts.push([a.lat,a.lon])}tv24().rides[dir].forEach((r,ri)=>{const line=[];(r.stops||[]).forEach((s,si)=>{if(!hasCoordV24(s))return;const m=L.marker([s.lat,s.lon],{icon:L.divIcon({className:'',html:`<span class="tv24-map-stop">${ri+1}.${si+1}</span>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(transportMapV24).bindTooltip(`${pn(r.driver)} · ${s.title}`);pts.push([s.lat,s.lon]);line.push([s.lat,s.lon])});if(hasCoordV24(a)){if(dir==='there')line.push([a.lat,a.lon]);else line.unshift([a.lat,a.lon])}if(line.length>1)L.polyline(line,{weight:3,opacity:.6,dashArray:'6 7'}).addTo(transportMapV24)});if(pts.length)transportMapV24.fitBounds(pts,{padding:[28,28],maxZoom:14});else transportMapV24.setView([55.75,37.62],9);setTimeout(()=>transportMapV24?.invalidateSize(false),80)}

function bindTransportV24(){
  document.querySelectorAll('[data-tv24-dir]').forEach(b=>b.onclick=()=>{dir=b.dataset.tv24Dir;render()});
  document.getElementById('tv24ProfileEdit')?.addEventListener('click',transportProfileModalV24);document.getElementById('tv24CreateRide')?.addEventListener('click',()=>transportRideModalV24(null,dir));document.getElementById('tv24EditArrival')?.addEventListener('click',arrivalModalV24);
  document.querySelectorAll('[data-tv24-edit-ride]').forEach(b=>b.onclick=()=>transportRideModalV24(transportRideV24(b.dataset.tv24EditRide),dir));
  document.querySelectorAll('[data-tv24-add-stop]').forEach(b=>b.onclick=()=>stopModalV24(transportRideV24(b.dataset.tv24AddStop)));
  document.querySelectorAll('[data-tv24-edit-stop]').forEach(b=>b.onclick=()=>{const [rid,sid]=b.dataset.tv24EditStop.split(':');const r=transportRideV24(rid),s=r?.stops.find(x=>x.id===sid);if(r&&s)stopModalV24(r,s)});
  document.querySelectorAll('[data-tv24-request]').forEach(b=>b.onclick=()=>requestModalV24(transportRideV24(b.dataset.tv24Request)));
  document.querySelectorAll('[data-tv24-approve]').forEach(b=>b.onclick=()=>{const [r,q]=b.dataset.tv24Approve.split(':');approveRequestV24(r,q)});document.querySelectorAll('[data-tv24-decline]').forEach(b=>b.onclick=()=>{const [r,q]=b.dataset.tv24Decline.split(':');declineRequestV24(r,q)});
  document.querySelectorAll('[data-tv24-cancel-request]').forEach(b=>b.onclick=()=>cancelRequestV24(b.dataset.tv24CancelRequest));document.querySelectorAll('[data-tv24-self]').forEach(b=>b.onclick=setSelfV24);document.querySelectorAll('[data-tv24-unset-self]').forEach(b=>b.onclick=unsetSelfV24);
  document.querySelectorAll('[data-tv24-copy-back]').forEach(b=>b.onclick=()=>copyRideBackV24(b.dataset.tv24CopyBack));
  document.querySelectorAll('[data-tv24-yandex-ride]').forEach(b=>b.onclick=()=>openYandexRideV24(transportRideV24(b.dataset.tv24YandexRide),dir));
  document.querySelectorAll('[data-tv24-yandex-point]').forEach(b=>b.onclick=()=>{const a=tv24().arrival;if(hasCoordV24(a))window.open(yandexPointV24(a.lat,a.lon),'_blank','noopener')});
  document.querySelectorAll('[data-tv24-yandex-stop]').forEach(b=>b.onclick=()=>{const [rid,sid]=b.dataset.tv24YandexStop.split(':'),r=transportRideV24(rid),s=r?.stops.find(x=>x.id===sid);if(hasCoordV24(s))window.open(yandexPointV24(s.lat,s.lon),'_blank','noopener')});
  requestAnimationFrame(mountTransportMapV24);
}

ensureTransportV24();
const bindBeforeV24=bind;bind=function(){bindBeforeV24();if(tab==='transport')bindTransportV24()};
const buildV24=document.querySelector('.build-label');if(buildV24)buildV24.textContent='V18 · транспорт по заявкам · точки посадки';
render();


;/* source: hikes-preview/transport-v24-fix.js */
/* V18.1 — transport interaction fixes. */
hasCoordV24=function(p){return !!p&&p.lat!==null&&p.lon!==null&&p.lat!==''&&p.lon!==''&&Number.isFinite(+p.lat)&&Number.isFinite(+p.lon)};
fmtCoordV24=function(lat,lon){return lat!==null&&lon!==null&&lat!==''&&lon!==''&&Number.isFinite(+lat)&&Number.isFinite(+lon)?`${(+lat).toFixed(6)}, ${(+lon).toFixed(6)}`:'координаты не заданы'};

const arrivalCardBaseV241=arrivalCardV24;
arrivalCardV24=function(){const a=tv24().arrival,time=dir==='there'?a.time:a.returnTime;return `<div class="tv24-arrival"><div class="tv24-arrival-pin">★</div><div class="tv24-arrival-copy"><small>${dir==='there'?'КУДА НУЖНО ПРИЕХАТЬ':'ОТКУДА УЕЗЖАЕМ'}</small><h3>${esc(a.title||'Место мероприятия')}</h3><p>${esc(a.note||'')}</p><div class="tv24-coordinate"><code>${esc(fmtCoordV24(a.lat,a.lon))}</code>${time?`<b>${dir==='there'?'Прибыть к':'Ориентир выезда'} ${esc(time)}</b>`:`<b>${dir==='there'?'Время прибытия не задано':'Время обратного выезда уточняется'}</b>`}</div></div><div class="tv24-arrival-actions"><button class="btn alt sm" id="tv24EditArrival">Редактировать</button>${hasCoordV24(a)?`<button class="btn sm" data-tv24-yandex-point="arrival">Яндекс ↗</button>`:''}</div></div>`};
arrivalModalV24=function(){const a=tv24().arrival,value={...a,time:dir==='there'?(a.time||''):(a.returnTime||'')};pointModalV24({title:dir==='there'?'Место прибытия мероприятия':'Место и время обратного выезда',value,kind:'arrival',onSave:o=>{const next={...a,title:o.title,lat:o.lat,lon:o.lon,note:o.note};if(dir==='there')next.time=o.time;else next.returnTime=o.time;tv24().arrival=next;transportSaveV24('Точка транспорта обновлена')}})};

const stopModalBaseV241=stopModalV24;
stopModalV24=function(r,stop=null){stopModalBaseV241(r,stop);if(!stop)return;setTimeout(()=>{const body=document.querySelector('#modalLayer .modal-body');if(!body)return;const active=(r.requests||[]).filter(q=>q.pickupId===stop.id&&['pending','approved'].includes(q.status));const wrap=document.createElement('div');wrap.className='tv24-modal-danger';wrap.innerHTML=`<button type="button" class="btn alt sm" id="tv24DeleteStop" ${active.length?'disabled':''}>Удалить точку</button>${active.length?`<small>Точку используют ${active.length} активн. заявк/пассажиров. Сначала освободи их.</small>`:''}`;body.appendChild(wrap);wrap.querySelector('#tv24DeleteStop')?.addEventListener('click',()=>{if(active.length)return;r.stops=(r.stops||[]).filter(s=>s.id!==stop.id);(r.requests||[]).filter(q=>q.pickupId===stop.id&&['declined','cancelled'].includes(q.status)).forEach(q=>q.pickupId='');document.getElementById('modalCancel')?.click();transportSaveV24('Точка удалена')})},60)};

const buildV241=document.querySelector('.build-label');if(buildV241)buildV241.textContent='V18.1 · транспорт по заявкам · точки посадки';


;/* source: hikes-preview/transport-v25.js */
/* V19 — transport UX refinement: editorial layout, full-size point picker, direct map editing, Yandex handoff. */
(function(){
  const STYLE_ID='transport-v25-style';
  if(!document.getElementById(STYLE_ID)){
    const st=document.createElement('style');st.id=STYLE_ID;st.textContent=`
.tv25-page{display:grid;gap:18px}.tv25-topline{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(360px,.85fr);gap:14px;align-items:stretch}.tv25-destination{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:center;padding:20px 22px;background:#171815;color:#f2eee5;border:1px solid #2e302b;min-height:118px}.tv25-destination-pin{width:42px;height:42px;border:1px solid #c7a65a;display:grid;place-items:center;font:700 20px/1 Bahnschrift,Segoe UI,sans-serif;color:#c7a65a}.tv25-destination-copy small,.tv25-eyebrow{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#98998f}.tv25-destination-copy h2{margin:5px 0 5px;font:700 clamp(22px,2.1vw,34px)/.98 Bahnschrift Condensed,Arial Narrow,sans-serif;letter-spacing:.01em}.tv25-destination-copy p{margin:0;color:#b9b9b0;max-width:720px}.tv25-destination-meta{display:flex;gap:12px;flex-wrap:wrap;margin-top:11px;align-items:center}.tv25-destination-meta code{font:600 12px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace;color:#f2eee5}.tv25-destination-meta b{font-size:12px;color:#c7a65a}.tv25-destination-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.tv25-summary{display:grid;grid-template-columns:repeat(2,1fr);border:1px solid #d6d0c3;background:#f2eee5}.tv25-stat{padding:15px 16px;border-right:1px solid #d6d0c3;border-bottom:1px solid #d6d0c3;min-height:72px}.tv25-stat:nth-child(2n){border-right:0}.tv25-stat:nth-last-child(-n+2){border-bottom:0}.tv25-stat small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#77786f}.tv25-stat strong{display:block;margin-top:4px;font:700 24px/1 Bahnschrift Condensed,Arial Narrow,sans-serif;color:#171815}.tv25-stat.risk strong{color:#8d342a}.tv25-stat.warn strong{color:#8b691d}.tv25-personal{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px 0;border-top:1px solid #d6d0c3;border-bottom:1px solid #d6d0c3}.tv25-personal-main{display:flex;gap:12px;align-items:center}.tv25-personal-main .avatar{flex:none}.tv25-personal-main strong{display:block;font-size:15px;margin:2px 0}.tv25-personal-main span{display:block;font-size:12px;color:#6f7068}.tv25-mytrip{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 20px;border:1px solid #d6d0c3;background:#fffdf8}.tv25-mytrip.approved{border-left:4px solid #5a785e}.tv25-mytrip.pending{border-left:4px solid #b5892d}.tv25-mytrip.unset{border-left:4px solid #a5a49b}.tv25-mytrip.self{border-left:4px solid #6d7179}.tv25-mytrip small{display:block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#7b7c74}.tv25-mytrip strong{display:block;margin:3px 0;font:700 20px/1.05 Bahnschrift Condensed,Arial Narrow,sans-serif}.tv25-mytrip span,.tv25-mytrip a{display:block;font-size:12px;color:#66675f;text-decoration:none}.tv25-workspace{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.75fr);gap:18px;align-items:start}.tv25-rides{display:grid;gap:10px}.tv25-rides-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:8px}.tv25-rides-head h2{margin:0;font:700 28px/1 Bahnschrift Condensed,Arial Narrow,sans-serif}.tv25-rides-head p{margin:4px 0 0;color:#75766f;font-size:13px}.tv25-ride{background:#fffdf8;border-top:1px solid #cfc9bc;border-bottom:1px solid #cfc9bc;padding:18px 0;display:grid;gap:14px}.tv25-ride.mine{border-top-color:#c7a65a}.tv25-ride-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:start}.tv25-driver{display:flex;gap:12px;align-items:center}.tv25-driver-name{font:700 22px/1 Bahnschrift Condensed,Arial Narrow,sans-serif}.tv25-driver-meta{font-size:12px;color:#75766f;margin-top:3px}.tv25-capacity{text-align:right}.tv25-capacity strong{display:block;font:700 23px/1 Bahnschrift Condensed,Arial Narrow,sans-serif}.tv25-capacity small{font-size:11px;color:#74756e}.tv25-capacity em{display:block;font-style:normal;font-size:10px;color:#8b691d;margin-top:4px}.tv25-capbar{width:116px;height:4px;background:#e1ddd4;margin-top:8px}.tv25-capbar i{display:block;height:100%;background:#171815}.tv25-itinerary{position:relative;padding-left:26px;display:grid;gap:10px}.tv25-itinerary:before{content:'';position:absolute;left:8px;top:12px;bottom:12px;width:1px;background:#cfc9bc}.tv25-stop{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;min-height:43px}.tv25-stop-dot{position:absolute;left:-24px;top:11px;width:13px;height:13px;border-radius:50%;background:#f2eee5;border:2px solid #171815;z-index:1}.tv25-stop.arrival .tv25-stop-dot{border-color:#c7a65a;background:#c7a65a}.tv25-stop b{display:block;font-size:13px}.tv25-stop small{display:block;margin-top:2px;font-size:11px;color:#7d7e76}.tv25-stop em{display:block;font-size:11px;color:#686961;font-style:normal;margin-top:2px}.tv25-stop-actions{display:flex;gap:6px;align-items:center}.tv25-ride-lower{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:end;border-top:1px solid #e0dbd0;padding-top:12px}.tv25-passengers small{display:block;font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#85867e;margin-bottom:5px}.tv25-passenger-chips{display:flex;gap:6px;flex-wrap:wrap}.tv25-passenger-chips span{padding:5px 8px;border:1px solid #d7d1c6;font-size:11px}.tv25-requests{padding:12px 14px;background:#f6f0e3;border-left:3px solid #c7a65a;display:grid;gap:8px}.tv25-request{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center}.tv25-request b{display:block;font-size:12px}.tv25-request small{display:block;font-size:10px;color:#77786f}.tv25-map-panel{position:sticky;top:82px;border:1px solid #cfc9bc;background:#fffdf8;overflow:hidden}.tv25-map-head{padding:14px 15px;display:flex;justify-content:space-between;gap:10px;align-items:center;border-bottom:1px solid #d9d4ca}.tv25-map-head h3{margin:0;font:700 20px/1 Bahnschrift Condensed,Arial Narrow,sans-serif}.tv25-map-head p{margin:3px 0 0;font-size:11px;color:#77786f}.tv25-map-toolbar{display:flex;gap:6px}.tv25-map{height:560px;background:#e5e1d7}.tv25-map-note{padding:10px 14px;border-top:1px solid #d9d4ca;font-size:11px;color:#74756d;line-height:1.45}.tv25-map-arrival,.tv25-map-stop{display:grid;place-items:center;border-radius:50%;font:700 11px/1 Bahnschrift,Segoe UI,sans-serif;box-shadow:0 1px 5px #0004}.tv25-map-arrival{width:32px;height:32px;background:#171815;color:#c7a65a;border:2px solid #f2eee5}.tv25-map-stop{width:28px;height:28px;background:#f2eee5;color:#171815;border:2px solid #171815}.tv25-map-stop.mine{background:#c7a65a}.tv25-map-drag-tip{position:absolute;z-index:500;left:12px;bottom:12px;padding:8px 10px;background:#171815;color:#f2eee5;font-size:10px;pointer-events:none;box-shadow:0 2px 12px #0004}.tv25-empty{padding:26px 0;border-top:1px solid #d6d0c3;color:#74756d}.tv25-empty strong{display:block;color:#171815;font-size:15px;margin-bottom:4px}.modal.tv25-point-modal{width:min(1180px,calc(100vw - 28px));max-width:none;height:min(780px,calc(100vh - 28px));display:grid;grid-template-rows:auto minmax(0,1fr) auto}.modal.tv25-point-modal .modal-body{padding:0;min-height:0;overflow:hidden}.tv25-picker{height:100%;display:grid;grid-template-columns:320px minmax(0,1fr)}.tv25-picker-side{padding:18px;border-right:1px solid #d8d2c7;overflow:auto;background:#f7f3eb}.tv25-picker-side h3{margin:0 0 4px;font:700 24px/1 Bahnschrift Condensed,Arial Narrow,sans-serif}.tv25-picker-side>p{margin:0 0 18px;color:#72736b;font-size:12px}.tv25-picker-field{display:grid;gap:5px;margin-bottom:12px}.tv25-picker-field label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#77786f}.tv25-picker-field input,.tv25-picker-field textarea{width:100%;box-sizing:border-box}.tv25-picker-coords{display:grid;grid-template-columns:1fr 1fr;gap:8px}.tv25-picker-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px}.tv25-picker-actions .wide{grid-column:1/-1}.tv25-picker-map-wrap{position:relative;min-width:0;min-height:0;background:#e2ded5}.tv25-picker-map{position:absolute;inset:0}.tv25-picker-cross{position:absolute;z-index:500;left:50%;top:50%;width:18px;height:18px;transform:translate(-50%,-50%);pointer-events:none}.tv25-picker-cross:before,.tv25-picker-cross:after{content:'';position:absolute;background:#171815}.tv25-picker-cross:before{left:8px;top:0;width:2px;height:18px}.tv25-picker-cross:after{left:0;top:8px;width:18px;height:2px}.tv25-picker-help{position:absolute;z-index:500;left:14px;top:14px;max-width:290px;padding:9px 11px;background:#171815e8;color:#f2eee5;font-size:11px;line-height:1.4}.tv25-picker-coordinate{position:absolute;z-index:500;right:14px;bottom:14px;padding:8px 10px;background:#f2eee5e8;border:1px solid #c9c3b8;font:600 11px ui-monospace,SFMono-Regular,Consolas,monospace}.tv25-picker-pin{width:30px;height:30px;border-radius:50% 50% 50% 0;background:#c7a65a;border:2px solid #171815;transform:rotate(-45deg);box-shadow:0 2px 7px #0004}.tv25-picker-pin:after{content:'';position:absolute;width:7px;height:7px;background:#171815;border-radius:50%;left:9px;top:9px}.tv25-picker-pin-wrap{transform:translateY(-7px)}@media(max-width:1050px){.tv25-topline{grid-template-columns:1fr}.tv25-workspace{grid-template-columns:1fr}.tv25-map-panel{position:relative;top:auto}.tv25-map{height:430px}}@media(max-width:720px){.tv25-destination{grid-template-columns:auto 1fr;padding:16px}.tv25-destination-actions{grid-column:1/-1;justify-content:flex-start}.tv25-personal{grid-template-columns:1fr}.tv25-mytrip{grid-template-columns:1fr}.tv25-ride-head{grid-template-columns:1fr}.tv25-capacity{text-align:left}.tv25-capbar{width:100%}.tv25-ride-lower{grid-template-columns:1fr}.tv25-request{grid-template-columns:1fr auto auto}.tv25-map{height:380px}.modal.tv25-point-modal{width:100vw;height:100dvh;max-height:none;border-radius:0}.tv25-picker{grid-template-columns:1fr;grid-template-rows:auto minmax(360px,1fr)}.tv25-picker-side{border-right:0;border-bottom:1px solid #d8d2c7;max-height:46vh}.tv25-picker-map-wrap{min-height:360px}}
`;document.head.appendChild(st)}
  function isArrivalEditorV25(){const lead=(S.roles||[]).find(r=>r.title==='Руководитель')?.p,transport=(S.roles||[]).find(r=>r.title==='Транспорт')?.p;return S.current===lead||S.current===transport||S.current==='p1'}
  function capacityPctV25(r){return (+r.seats||0)?Math.min(100,Math.round((r.passengers||[]).length/(+r.seats||1)*100)):0}
  function summaryHtmlV25(){const s=transportSummaryV24();return `<div class="tv25-summary"><div class="tv25-stat"><small>Водителей</small><strong>${s.drivers}</strong></div><div class="tv25-stat"><small>В машинах</small><strong>${s.inCars}</strong></div><div class="tv25-stat"><small>Свободных мест</small><strong>${s.free}</strong></div><div class="tv25-stat ${s.unset?'risk':s.pending?'warn':''}"><small>${s.pending?'Ждут ответа':'Не определились'}</small><strong>${s.pending||s.unset}</strong></div></div>`}
  function profileHtmlV25(){const p=transportProfileV24(),ride=transportDriverRideV24(S.current,dir);return `<div class="tv25-personal"><div class="tv25-personal-main"><div class="avatar small">${initials(pn(S.current))}</div><div><span class="tv25-eyebrow">МОЙ ТРАНСПОРТНЫЙ ПРОФИЛЬ</span><strong>${esc(pn(S.current))}</strong><span>${p.driver?`Водитель · обычно ${p.defaultSeats} пассажирских мест${p.vehicle?' · '+esc(p.vehicle):''}`:'Не водитель'}${p.phone?' · контакт указан':''}</span></div></div><div class="row-actions"><button class="btn alt sm" id="tv24ProfileEdit">Профиль</button>${p.driver&&!ride?`<button class="btn sand sm" id="tv24CreateRide">Создать рейс</button>`:''}</div></div>`}
  function destinationHtmlV25(){const a=tv24().arrival,time=dir==='there'?a.time:a.returnTime;return `<div class="tv25-destination"><div class="tv25-destination-pin">★</div><div class="tv25-destination-copy"><small>${dir==='there'?'МЕСТО ПРИБЫТИЯ':'ТОЧКА ОТПРАВЛЕНИЯ ОБРАТНО'}</small><h2>${esc(a.title||'Место мероприятия')}</h2><p>${esc(a.note||'Транспортная точка задаётся отдельно от пешего маршрута.')}</p><div class="tv25-destination-meta"><code>${esc(fmtCoordV24(a.lat,a.lon))}</code>${time?`<b>${dir==='there'?'Прибыть к':'Выезд'} ${esc(time)}</b>`:''}</div></div><div class="tv25-destination-actions">${isArrivalEditorV25()?`<button class="btn sand sm" id="tv24EditArrival">Изменить точку</button>`:''}${hasCoordV24(a)?`<button class="btn alt sm" data-tv24-yandex-point="arrival">Яндекс ↗</button>`:''}</div></div>`}
  function myTripHtmlV25(){const c=transportChoiceV24(),active=transportRequestV24();if(c.mode==='self')return `<div class="tv25-mytrip self"><div><small>МОЙ ВАРИАНТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Добираюсь самостоятельно</strong><span>Точка мероприятия и время указаны выше.</span></div><button class="btn alt sm" data-tv24-unset-self>Изменить</button></div>`;if(active){const r=active.ride,q=active.request,stop=(r.stops||[]).find(s=>s.id===q.pickupId),approved=q.status==='approved',prof=transportProfileV24(r.driver);return `<div class="tv25-mytrip ${approved?'approved':'pending'}"><div><small>${approved?'МЕСТО ПОДТВЕРЖДЕНО':'ЗАЯВКА У ВОДИТЕЛЯ'}</small><strong>${esc(pn(r.driver))}${r.vehicle?' · '+esc(r.vehicle):''}</strong><span>${esc(stop?.title||stopKindV24(dir))}${stop?.time?' · быть к '+esc(stop.time):''}</span>${approved&&prof.phone?`<a href="tel:${esc(prof.phone)}">${esc(prof.phone)}</a>`:''}</div><div class="row-actions">${stop&&hasCoordV24(stop)?`<button class="btn sand sm" data-tv24-yandex-stop="${r.id}:${stop.id}">Как добраться</button>`:''}<button class="btn alt sm" data-tv24-cancel-request="${q.id}">${approved?'Отказаться':'Отменить заявку'}</button></div></div>`}const ride=transportDriverRideV24();if(ride)return `<div class="tv25-mytrip approved"><div><small>МОЙ РЕЙС · ${directionLabelV24(dir).toUpperCase()}</small><strong>Вы водитель · ${(ride.passengers||[]).length}/${+ride.seats||0}</strong><span>${transportFreeV24(ride)} свободных мест · ${(ride.stops||[]).length} ${dir==='there'?'точек посадки':'точек высадки'}</span></div><div class="row-actions"><button class="btn sand sm" data-tv24-edit-ride="${ride.id}">Настроить рейс</button>${dir==='there'?`<button class="btn alt sm" data-tv24-copy-back="${ride.id}">Скопировать обратно</button>`:''}</div></div>`;return `<div class="tv25-mytrip unset"><div><small>МОЙ ВАРИАНТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Транспорт пока не выбран</strong><span>Выбери машину ниже или отметь самостоятельную поездку.</span></div><button class="btn alt sm" data-tv24-self>Поеду самостоятельно</button></div>`}
  function stopRowV25(r,s,arrival=false){const mine=r&&r.driver===S.current,a=tv24().arrival,time=dir==='there'?a.time:a.returnTime;return `<div class="tv25-stop ${arrival?'arrival':''}"><i class="tv25-stop-dot"></i><div><b>${arrival?esc(a.title):esc(s.title||stopKindV24(dir))}</b><small>${arrival?(time?`${dir==='there'?'прибыть к ':'выезд '}${esc(time)} · `:'')+esc(fmtCoordV24(a.lat,a.lon)):(s.time?`${esc(s.time)} · `:'')+esc(fmtCoordV24(s.lat,s.lon))}</small>${!arrival&&s.note?`<em>${esc(s.note)}</em>`:''}</div><div class="tv25-stop-actions">${!arrival&&hasCoordV24(s)?`<button class="btn alt sm" data-tv24-yandex-stop="${r.id}:${s.id}">Яндекс</button>`:''}${!arrival&&mine?`<button class="btn sm" data-tv24-edit-stop="${r.id}:${s.id}">Изменить</button>`:''}</div></div>`}
  function rideCardV25(r){const me=r.driver===S.current,free=transportFreeV24(r),pending=pendingForRideV24(r),my=transportRequestV24(),activeElsewhere=my&&my.ride.id!==r.id,stops=r.stops||[];const itinerary=dir==='there'?[...stops.map(s=>stopRowV25(r,s,false)),stopRowV25(r,tv24().arrival,true)]:[stopRowV25(r,tv24().arrival,true),...stops.map(s=>stopRowV25(r,s,false))];return `<article class="tv25-ride ${me?'mine':''}"><div class="tv25-ride-head"><div class="tv25-driver"><div class="avatar small">${initials(pn(r.driver))}</div><div><span class="tv25-eyebrow">${me?'МОЙ РЕЙС':'ВОДИТЕЛЬ'}</span><div class="tv25-driver-name">${esc(pn(r.driver))}${r.vehicle?' · '+esc(r.vehicle):''}</div><div class="tv25-driver-meta">${[r.color,r.plate].filter(Boolean).map(esc).join(' · ')||'Данные машины можно уточнить у водителя'}${r.comment?' · '+esc(r.comment):''}</div></div></div><div class="tv25-capacity"><strong>${(r.passengers||[]).length} / ${+r.seats||0}</strong><small>${free} свободно</small>${pending.length?`<em>${pending.length} ожидают ответа</em>`:''}<div class="tv25-capbar"><i style="width:${capacityPctV25(r)}%"></i></div></div></div><div class="tv25-itinerary">${itinerary.join('')}</div>${me&&pending.length?`<div class="tv25-requests"><span class="tv25-eyebrow">ЗАЯВКИ</span>${pending.map(q=>{const st=stops.find(s=>s.id===q.pickupId);return `<div class="tv25-request"><span><b>${esc(pn(q.pid))}</b><small>${esc(st?.title||'точка не выбрана')}</small></span><button class="btn sm" data-tv24-approve="${r.id}:${q.id}">Подтвердить</button><button class="btn alt sm" data-tv24-decline="${r.id}:${q.id}">Отказать</button></div>`}).join('')}</div>`:''}<div class="tv25-ride-lower"><div class="tv25-passengers"><small>ПАССАЖИРЫ</small><div class="tv25-passenger-chips">${(r.passengers||[]).length?(r.passengers||[]).map(pid=>`<span>${esc(pn(pid))}</span>`).join(''):'<span>Пока никого</span>'}</div></div><div class="row-actions">${me?`<button class="btn alt sm" data-tv24-edit-ride="${r.id}">Параметры</button><button class="btn sand sm" data-tv24-add-stop="${r.id}">+ ${dir==='there'?'Посадка':'Высадка'}</button>`:`<button class="btn sand sm" data-tv24-request="${r.id}" ${free<=0||activeElsewhere||my?.ride.id===r.id?'disabled':''}>${my?.ride.id===r.id?'Заявка отправлена':free<=0?'Мест нет':'Попроситься'}</button>`}<button class="btn alt sm" data-tv24-yandex-ride="${r.id}">Весь маршрут ↗</button></div></div></article>`}
  transportPage=function(){ensureTransportV24();const rides=tv24().rides[dir];return `${pageHead('Логистика','Транспорт','Точки посадки, заявки в машины и дорога до мероприятия в одном месте. Карта редактируется прямо здесь; Яндекс используется для готовой городской навигации.')}<div class="segmented tv24-dir"><button class="${dir==='there'?'active':''}" data-tv24-dir="there">Туда</button><button class="${dir==='back'?'active':''}" data-tv24-dir="back">Обратно</button></div><div class="tv25-page"><div class="tv25-topline">${destinationHtmlV25()}${summaryHtmlV25()}</div>${profileHtmlV25()}${myTripHtmlV25()}<div class="tv25-workspace"><div><div class="tv25-rides-head"><div><span class="tv25-eyebrow">${dir==='there'?'ПОЕЗДКА НА МЕРОПРИЯТИЕ':'ВОЗВРАЩЕНИЕ'}</span><h2>${dir==='there'?'Машины и точки посадки':'Обратные рейсы'}</h2><p>${dir==='there'?'Пассажир выбирает конкретную точку, водитель подтверждает заявку.':'Рейс туда можно скопировать и скорректировать под вечер.'}</p></div></div><div class="tv25-rides">${rides.length?rides.map(rideCardV25).join(''):`<div class="tv25-empty"><strong>Рейсов пока нет</strong><span>Участник с профилем водителя может создать первый рейс.</span></div>`}</div></div><aside class="tv25-map-panel"><div class="tv25-map-head"><div><h3>Карта транспорта</h3><p>Перетащи свою точку прямо на карте или открой её редактор.</p></div><div class="tv25-map-toolbar"><button class="btn alt sm" id="tv25MapFit">Все точки</button></div></div><div style="position:relative"><div id="transportMapV24" class="tv25-map"></div><div class="tv25-map-drag-tip">Свои точки можно перетаскивать</div></div><div class="tv25-map-note">Встроенная карта работает без ключа и отвечает за выбор точек. Готовый автомобильный маршрут открывается в Яндекс Картах одной кнопкой.</div></aside></div></div>`}
  let pickerMapV25=null,pickerMarkerV25=null;
  function pickerCoordV25(ll){const a=document.getElementById('tv25PointLat'),o=document.getElementById('tv25PointLon'),c=document.getElementById('tv25PickerCoord');if(a)a.value=ll.lat.toFixed(6);if(o)o.value=ll.lng.toFixed(6);if(c)c.textContent=`${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`}
  function pickerSetV25(ll,pan=false){if(!pickerMarkerV25||!pickerMapV25)return;pickerMarkerV25.setLatLng(ll);pickerCoordV25(ll);if(pan)pickerMapV25.panTo(ll)}
  function pickerExternalYandexV25(){const lat=+document.getElementById('tv25PointLat')?.value,lon=+document.getElementById('tv25PointLon')?.value;if(!Number.isFinite(lat)||!Number.isFinite(lon))return toast('Сначала выбери точку');window.open(yandexPointV24(lat,lon),'_blank','noopener')}
  function mountPickerV25(v){const el=document.getElementById('tv25PickerMap');if(!el||!window.L)return;try{pickerMapV25?.remove()}catch(e){}let lat=Number.isFinite(+v.lat)?+v.lat:(hasCoordV24(tv24().arrival)?+tv24().arrival.lat:55.75),lon=Number.isFinite(+v.lon)?+v.lon:(hasCoordV24(tv24().arrival)?+tv24().arrival.lon:37.62);pickerMapV25=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:true,zoomSnap:.5}).setView([lat,lon],Number.isFinite(+v.lat)?16:11);let spec;try{spec=tileSpecStudioV21('city')}catch(e){spec={url:'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',opts:{maxZoom:20,attribution:'© OpenStreetMap contributors © CARTO'}}}L.tileLayer(spec.url,spec.opts).addTo(pickerMapV25);pickerMarkerV25=L.marker([lat,lon],{draggable:true,icon:L.divIcon({className:'tv25-picker-pin-wrap',html:'<span class="tv25-picker-pin"></span>',iconSize:[30,36],iconAnchor:[15,31]})}).addTo(pickerMapV25);pickerMapV25.on('click',e=>pickerSetV25(e.latlng));pickerMapV25.on('move',()=>{const c=pickerMapV25.getCenter(),el=document.getElementById('tv25PickerCoord');if(el)el.textContent=`центр ${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`});pickerMarkerV25.on('dragend',e=>pickerSetV25(e.target.getLatLng()));pickerCoordV25({lat,lng:lon});document.getElementById('tv25UseCenter')?.addEventListener('click',()=>pickerSetV25(pickerMapV25.getCenter()));document.getElementById('tv25YandexPoint')?.addEventListener('click',pickerExternalYandexV25);document.getElementById('tv25MyLocation')?.addEventListener('click',()=>{if(!navigator.geolocation)return toast('Геолокация недоступна');navigator.geolocation.getCurrentPosition(pos=>{const ll={lat:pos.coords.latitude,lng:pos.coords.longitude};pickerSetV25(ll,true);pickerMapV25.setZoom(16)},()=>toast('Не удалось получить геопозицию'))});['tv25PointLat','tv25PointLon'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{const la=+document.getElementById('tv25PointLat').value,lo=+document.getElementById('tv25PointLon').value;if(Number.isFinite(la)&&Number.isFinite(lo))pickerSetV25({lat:la,lng:lo},true)}));setTimeout(()=>pickerMapV25?.invalidateSize(false),100)}
  pointModalV24=function({title,value={},kind='stop',onSave}){const v={title:value.title||'',lat:value.lat,lon:value.lon,time:value.time||'',note:value.note||''};openModal(title,`<div class="tv25-picker"><aside class="tv25-picker-side"><span class="tv25-eyebrow">${kind==='arrival'?'ТОЧКА МЕРОПРИЯТИЯ':dir==='there'?'ТОЧКА ПОСАДКИ':'ТОЧКА ВЫСАДКИ'}</span><h3>${esc(title)}</h3><p>Кликни по карте, перетащи метку или поставь точку в центре текущего вида.</p><div class="tv25-picker-field"><label>Название</label><input id="tv25PointTitle" value="${esc(v.title)}" placeholder="Например, парковка у выхода №2"></div><div class="tv25-picker-field"><label>Время</label><input id="tv25PointTime" type="time" value="${esc(v.time)}"></div><div class="tv25-picker-coords"><div class="tv25-picker-field"><label>Широта</label><input id="tv25PointLat" type="number" step="0.000001" value="${Number.isFinite(+v.lat)?(+v.lat).toFixed(6):''}"></div><div class="tv25-picker-field"><label>Долгота</label><input id="tv25PointLon" type="number" step="0.000001" value="${Number.isFinite(+v.lon)?(+v.lon).toFixed(6):''}"></div></div><div class="tv25-picker-field"><label>Комментарий / ориентир</label><textarea id="tv25PointNote" rows="3" placeholder="Выход, парковка, ориентир">${esc(v.note)}</textarea></div><div class="tv25-picker-actions"><button type="button" class="btn alt sm" id="tv25MyLocation">Моё место</button><button type="button" class="btn alt sm" id="tv25UseCenter">Точка в центре</button><button type="button" class="btn sm wide" id="tv25YandexPoint">Посмотреть в Яндекс ↗</button></div></aside><div class="tv25-picker-map-wrap"><div id="tv25PickerMap" class="tv25-picker-map"></div><div class="tv25-picker-cross"></div><div class="tv25-picker-help">Масштабируй и двигай карту. Клик ставит метку; саму метку можно перетащить.</div><div class="tv25-picker-coordinate" id="tv25PickerCoord">—</div></div></div>`,layer=>{const obj={title:layer.querySelector('#tv25PointTitle').value.trim(),time:layer.querySelector('#tv25PointTime').value,lat:+layer.querySelector('#tv25PointLat').value,lon:+layer.querySelector('#tv25PointLon').value,note:layer.querySelector('#tv25PointNote').value.trim()};if(!obj.title){toast('Укажи название точки');return false}if(!Number.isFinite(obj.lat)||!Number.isFinite(obj.lon)){toast('Укажи точку на карте');return false}try{pickerMapV25?.remove()}catch(e){}pickerMapV25=null;pickerMarkerV25=null;onSave(obj)});document.querySelector('#modalLayer .modal')?.classList.add('tv25-point-modal');setTimeout(()=>mountPickerV25(v),60)}
  mountTransportMapV24=function(){const el=document.getElementById('transportMapV24');if(!el||!window.L)return;try{transportMapV24?.remove()}catch(e){}transportMapV24=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:true,zoomSnap:.5,minZoom:3,maxZoom:20});let spec;try{spec=tileSpecStudioV21('city')}catch(e){spec={url:'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',opts:{maxZoom:20,attribution:'© OpenStreetMap contributors © CARTO'}}}L.tileLayer(spec.url,spec.opts).addTo(transportMapV24);const pts=[],a=tv24().arrival,canArrival=isArrivalEditorV25();if(hasCoordV24(a)){const m=L.marker([a.lat,a.lon],{draggable:canArrival,icon:L.divIcon({className:'',html:'<span class="tv25-map-arrival">★</span>',iconSize:[32,32],iconAnchor:[16,16]})}).addTo(transportMapV24).bindTooltip(`${a.title}${canArrival?' · можно перетащить':''}`);if(canArrival)m.on('dragend',e=>{const ll=e.target.getLatLng();a.lat=ll.lat;a.lon=ll.lng;transportSaveV24('Место мероприятия перемещено')});m.on('click',()=>{if(canArrival)arrivalModalV24()});pts.push([a.lat,a.lon])}tv24().rides[dir].forEach((r,ri)=>{const line=[];(r.stops||[]).forEach((s,si)=>{if(!hasCoordV24(s))return;const mine=r.driver===S.current,m=L.marker([s.lat,s.lon],{draggable:mine,icon:L.divIcon({className:'',html:`<span class="tv25-map-stop ${mine?'mine':''}">${ri+1}.${si+1}</span>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(transportMapV24).bindTooltip(`${pn(r.driver)} · ${s.title}${mine?' · можно перетащить':''}`);if(mine){m.on('dragend',e=>{const ll=e.target.getLatLng();s.lat=ll.lat;s.lon=ll.lng;transportSaveV24('Точка посадки перемещена')});m.on('click',()=>stopModalV24(r,s))}else m.on('click',()=>window.open(yandexPointV24(s.lat,s.lon),'_blank','noopener'));pts.push([s.lat,s.lon]);line.push([s.lat,s.lon])});if(hasCoordV24(a)){if(dir==='there')line.push([a.lat,a.lon]);else line.unshift([a.lat,a.lon])}if(line.length>1)L.polyline(line,{color:'#6e7068',weight:3,opacity:.68,dashArray:'7 7',interactive:false}).addTo(transportMapV24)});if(pts.length)transportMapV24.fitBounds(pts,{padding:[36,36],maxZoom:15});else transportMapV24.setView([55.75,37.62],10);document.getElementById('tv25MapFit')?.addEventListener('click',()=>{if(pts.length)transportMapV24.fitBounds(pts,{padding:[36,36],maxZoom:15})});setTimeout(()=>transportMapV24?.invalidateSize(false),90)}
  const bindBaseV25=bind;bind=function(){bindBaseV25();if(tab==='transport'){document.querySelectorAll('[data-tv24-dir]').forEach(b=>b.onclick=()=>{dir=b.dataset.tv24Dir;render()});requestAnimationFrame(mountTransportMapV24)}};
  const build=document.querySelector('.build-label');if(build)build.textContent='V19 · транспорт · карта и точки переработаны';render();
})();


;/* source: hikes-preview/transport-v26.js */
/* V20 — transport reference redesign. */
(function(){
  const routeColors=['#2d82df','#1a9c5b','#ef8a31','#e34d4d','#7c5bd6','#1aa3a3'];
  function isArrivalEditorV26(){const lead=(S.roles||[]).find(r=>r.title==='Руководитель')?.p,transport=(S.roles||[]).find(r=>r.title==='Транспорт')?.p;return S.current===lead||S.current===transport||S.current==='p1'}
  function s26(){return transportSummaryV24(dir)}
  function eventMetaV26(){const e=S.event||{};return `<div class="tv26-event-meta"><span>▣ ${esc(e.date||'Дата уточняется')}</span><span>↟ ${esc(e.type||'Поход')}</span><span>⌖ ${esc(tv24().arrival?.title||e.short||'Место мероприятия')}</span></div>`}
  function summaryV26(){const s=s26();return `<div class="tv26-summary"><div class="tv26-summary-title">Организационная сводка</div><div class="tv26-stat"><span class="tv26-stat-icon">🚙</span><div><small>Водители</small><strong>${s.drivers}</strong></div></div><div class="tv26-stat"><span class="tv26-stat-icon">●●</span><div><small>Пассажиры</small><strong>${s.inCars}</strong></div></div><div class="tv26-stat"><span class="tv26-stat-icon">＋</span><div><small>Свободных мест</small><strong>${s.free}</strong></div></div><div class="tv26-stat"><span class="tv26-stat-icon">↗</span><div><small>Самостоятельно</small><strong>${s.self}</strong></div></div><div class="tv26-stat ${s.unset?'risk':s.pending?'warn':''}"><span class="tv26-stat-icon">?</span><div><small>${s.pending?'Ждут ответа':'Без решения'}</small><strong>${s.pending||s.unset}</strong></div></div></div>`}
  function destinationV26(){const a=tv24().arrival,time=dir==='there'?a.time:a.returnTime;return `<section class="tv26-darkcard"><h2 class="tv26-card-title">${dir==='there'?'Место прибытия':'Обратный выезд'}</h2><div class="tv26-destination"><span class="tv26-pin"></span><div class="tv26-destination-copy"><h3>${esc(a.title||'Место мероприятия')}</h3><p>${esc(a.note||'Точка транспорта задаётся отдельно от пешего маршрута.')}</p><div class="tv26-destination-meta"><code>${esc(fmtCoordV24(a.lat,a.lon))}</code>${time?`<b>${dir==='there'?'Быть к':'Выезд'} ${esc(time)}</b>`:''}</div></div><div class="tv26-card-actions"><button class="btn sand sm" id="tv26ShowDestination">Показать на карте</button>${hasCoordV24(a)?`<button class="btn alt sm" data-tv24-yandex-point="arrival">Открыть в Яндекс</button>`:''}${isArrivalEditorV26()?`<button class="btn alt sm" id="tv24EditArrival">Редактировать</button>`:''}</div></div></section>`}
  function profileV26(){const p=transportProfileV24(),ride=transportDriverRideV24(S.current,dir);return `<section class="tv26-darkcard"><h2 class="tv26-card-title">Мой транспорт</h2><div class="tv26-profile"><div class="avatar">${initials(pn(S.current))}</div><div class="tv26-profile-copy"><strong>${esc(pn(S.current))}</strong><div class="tv26-badges">${p.driver?`<span class="tv26-badge green">Водитель</span><span class="tv26-badge">Обычно ${p.defaultSeats} места</span>`:`<span class="tv26-badge">Не водитель</span>`}</div><span>${p.vehicle?esc(p.vehicle):'Автомобиль не указан'}${p.plate?' · '+esc(p.plate):''}</span>${p.phone?`<span>${esc(p.phone)}</span>`:''}</div><div class="tv26-profile-actions"><button class="btn alt sm" id="tv24ProfileEdit">Редактировать профиль</button>${p.driver&&!ride?`<button class="btn sand sm" id="tv24CreateRide">+ Рейс</button>`:''}</div></div></section>`}
  function myTripV26(){const c=transportChoiceV24(),active=transportRequestV24();if(c.mode==='self')return `<div class="tv26-mytripbar self"><div><small>МОЙ ВАРИАНТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Добираюсь самостоятельно</strong><span>Точка мероприятия и время указаны выше.</span></div><button class="btn alt sm" data-tv24-unset-self>Изменить</button></div>`;if(active){const r=active.ride,q=active.request,stop=(r.stops||[]).find(s=>s.id===q.pickupId),approved=q.status==='approved',prof=transportProfileV24(r.driver);return `<div class="tv26-mytripbar ${approved?'':'pending'}"><div><small>${approved?'МЕСТО ПОДТВЕРЖДЕНО':'ЗАЯВКА ОТПРАВЛЕНА'}</small><strong>Еду с ${esc(pn(r.driver))}${r.vehicle?' · '+esc(r.vehicle):''}</strong><span>${esc(stop?.title||stopKindV24(dir))}${stop?.time?' · '+esc(stop.time):''}</span>${approved&&prof.phone?`<a href="tel:${esc(prof.phone)}">${esc(prof.phone)}</a>`:''}</div><div class="row-actions">${stop&&hasCoordV24(stop)?`<button class="btn sand sm" data-tv24-yandex-stop="${r.id}:${stop.id}">Как добраться</button>`:''}<button class="btn alt sm" data-tv24-cancel-request="${q.id}">${approved?'Отказаться':'Отменить'}</button></div></div>`}const ride=transportDriverRideV24();if(ride)return `<div class="tv26-mytripbar"><div><small>МОЙ РЕЙС · ${directionLabelV24(dir).toUpperCase()}</small><strong>${(ride.passengers||[]).length}/${+ride.seats||0} пассажиров</strong><span>${transportFreeV24(ride)} свободных мест · ${(ride.stops||[]).length} точек</span></div><div class="row-actions"><button class="btn sand sm" data-tv24-edit-ride="${ride.id}">Настроить</button>${dir==='there'?`<button class="btn alt sm" data-tv24-copy-back="${ride.id}">Скопировать обратно</button>`:''}</div></div>`;return `<div class="tv26-mytripbar unset"><div><small>МОЙ ВАРИАНТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Транспорт пока не выбран</strong><span>Выбери машину ниже или отметь самостоятельную поездку.</span></div><button class="btn alt sm" data-tv24-self>Поеду самостоятельно</button></div>`}
  function stopRowsV26(r){const a=tv24().arrival,timeA=dir==='there'?a.time:a.returnTime;const stops=r.stops||[];const rows=[];if(dir==='back')rows.push({time:timeA||'—',title:a.title||'Место мероприятия',kind:'start'});stops.forEach((s,i)=>rows.push({time:s.time||'—',title:s.title||stopKindV24(dir),kind:i===0?'start':'mid',stop:s}));if(dir==='there')rows.push({time:timeA||'—',title:a.title||'Место мероприятия',kind:'end'});return rows.slice(0,4).map(x=>`<div class="tv26-route-row ${x.kind==='mid'?'mid':x.kind==='end'?'end':''}"><time>${esc(x.time)}</time><span title="${esc(x.title)}">${esc(x.title)}</span></div>`).join('')}
  function rideV26(r,idx){const free=transportFreeV24(r),me=r.driver===S.current,pending=pendingForRideV24(r),active=transportRequestV24(),blocked=active&&active.ride.id!==r.id,full=free<=0;return `<div><article class="tv26-ride ${me?'mine':''}"><div class="tv26-driver"><div class="avatar small">${initials(pn(r.driver))}</div><div class="tv26-driver-copy"><strong>${esc(pn(r.driver))}</strong><span>${esc(r.vehicle||'Автомобиль')}</span><span class="tv26-driver-tag">Водитель</span><div class="tv26-seatline ${full?'full':''}">${+r.seats||0} мест · <b>${free?`${free} свободно`:'нет мест'}</b></div></div></div><div class="tv26-route-mini">${stopRowsV26(r)}</div><div class="tv26-passinfo"><div class="tv26-passavatars">${(r.passengers||[]).slice(0,3).map(pid=>`<span>${initials(pn(pid))}</span>`).join('')}${(r.passengers||[]).length>3?`<span>+${(r.passengers||[]).length-3}</span>`:''}</div><small>${(r.passengers||[]).length} пассажир${(r.passengers||[]).length===1?'':'а'}</small></div><div class="tv26-ride-action">${me?`<button class="btn sand sm" data-tv24-add-stop="${r.id}">+ Точка</button><button class="btn alt sm" data-tv24-edit-ride="${r.id}">Параметры</button>`:`<button class="btn sand sm" data-tv24-request="${r.id}" ${full||blocked||active?.ride.id===r.id?'disabled':''}>${active?.ride.id===r.id?'Заявка отправлена':full?'Нет мест':'Попроситься'}</button><button class="btn alt sm" data-tv24-yandex-ride="${r.id}">Маршрут</button>`}</div></article>${me&&pending.length?`<div class="tv26-driver-requests">${pending.map(q=>{const st=(r.stops||[]).find(s=>s.id===q.pickupId);return `<div class="tv26-request-row"><span><strong>${esc(pn(q.pid))} хочет поехать с вами</strong><small>${esc(st?.title||'Точка не выбрана')}${st?.time?' · '+esc(st.time):''}</small></span><button class="btn sand sm" data-tv24-approve="${r.id}:${q.id}">Подтвердить</button><button class="btn alt sm" data-tv24-decline="${r.id}:${q.id}">Отказать</button></div>`}).join('')}</div>`:''}</div>`}
  function ridesPanelV26(){const rides=tv24().rides[dir],p=transportProfileV24(),own=transportDriverRideV24(S.current,dir);return `<section class="tv26-panel"><div class="tv26-panel-head"><div><h2>Рейсы на мероприятие</h2><div class="tv26-panel-sub">Водители задают точки и время, пассажиры отправляют заявку.</div></div><div class="tv26-panel-actions"><div class="segmented"><button class="${dir==='there'?'active':''}" data-tv24-dir="there">Туда</button><button class="${dir==='back'?'active':''}" data-tv24-dir="back">Обратно</button></div>${p.driver&&!own?`<button class="btn sand sm" id="tv24CreateRide">+ Добавить рейс</button>`:''}</div></div><div class="tv26-rides">${rides.length?rides.map(rideV26).join(''):`<div class="tv26-empty"><strong>Рейсов пока нет</strong><span>Водитель может создать первый рейс.</span></div>`}</div></section>`}
  function mapPanelV26(){return `<aside class="tv26-map-panel"><div class="tv26-map-topbar"><div class="tv26-map-legend"><span class="tv26-map-chip"><i></i>Все точки</span><span class="tv26-map-chip"><i class="blue"></i>Точки посадки</span><span class="tv26-map-chip"><i class="orange"></i>Место прибытия</span></div><button class="btn alt sm" id="tv25MapFit">Все точки</button></div><div id="transportMapV24" class="tv26-map"></div><div class="tv26-map-bottom"><button class="btn alt sm" id="tv26OpenAnyRoute">Построить маршрут</button><small>Свои точки можно перетаскивать прямо на карте. Точный автомобильный маршрут открывается в Яндекс.</small></div></aside>`}
  transportPage=function(){ensureTransportV24();const e=S.event||{};return `${pageHead('Логистика','Транспорт','')}<div class="tv26-shell"><div class="tv26-eventbar"><div><div class="tv26-kicker">Транспорт мероприятия</div><h1 class="tv26-event-title">${esc(e.title||'Поход')}</h1>${eventMetaV26()}</div><div class="tv26-event-actions">${isArrivalEditorV26()?`<button class="btn alt sm" id="tv24EditArrival">Редактировать место</button>`:''}</div></div>${summaryV26()}<div class="tv26-topgrid">${destinationV26()}${profileV26()}</div>${myTripV26()}<div class="tv26-workgrid">${ridesPanelV26()}${mapPanelV26()}</div></div>`}
  function mapMarkerIconV26(kind,label,mine=false){return L.divIcon({className:'',html:`<span class="tv26-map-pin ${kind} ${mine?'mine':''}"><span>${esc(label)}</span></span>`,iconSize:[32,38],iconAnchor:[16,34]})}
  function mapLabelV26(title,time){return `<div class="tv26-map-label"><b>${esc(title)}</b>${time?`<span>${esc(time)}</span>`:''}</div>`}
  mountTransportMapV24=function(){const el=document.getElementById('transportMapV24');if(!el||!window.L)return;try{transportMapV24?.remove()}catch(e){}transportMapV24=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:true,zoomSnap:.5,minZoom:3,maxZoom:20});let spec;try{spec=tileSpecStudioV21('city')}catch(e){spec={url:'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',opts:{maxZoom:20,attribution:'© OpenStreetMap contributors © CARTO'}}}L.tileLayer(spec.url,spec.opts).addTo(transportMapV24);const pts=[],a=tv24().arrival,canArrival=isArrivalEditorV26();if(hasCoordV24(a)){const m=L.marker([a.lat,a.lon],{draggable:canArrival,icon:mapMarkerIconV26('arrival','★')}).addTo(transportMapV24).bindTooltip(mapLabelV26(a.title||'Место мероприятия',dir==='there'?a.time:a.returnTime),{direction:'top',className:'tv26-leaflet-tip'});if(canArrival)m.on('dragend',e=>{const ll=e.target.getLatLng();a.lat=ll.lat;a.lon=ll.lng;transportSaveV24('Место мероприятия перемещено')});m.on('click',()=>{if(canArrival)arrivalModalV24()});pts.push([a.lat,a.lon])}tv24().rides[dir].forEach((r,ri)=>{const color=routeColors[ri%routeColors.length],line=[];(r.stops||[]).forEach((s,si)=>{if(!hasCoordV24(s))return;const mine=r.driver===S.current,m=L.marker([s.lat,s.lon],{draggable:mine,icon:mapMarkerIconV26('pickup',`${ri+1}.${si+1}`,mine)}).addTo(transportMapV24).bindTooltip(mapLabelV26(`${pn(r.driver)} · ${s.title}`,s.time),{direction:'top',className:'tv26-leaflet-tip'});if(mine){m.on('dragend',e=>{const ll=e.target.getLatLng();s.lat=ll.lat;s.lon=ll.lng;transportSaveV24('Точка посадки перемещена')});m.on('click',()=>stopModalV24(r,s))}else m.on('click',()=>window.open(yandexPointV24(s.lat,s.lon),'_blank','noopener'));pts.push([s.lat,s.lon]);line.push([s.lat,s.lon])});if(hasCoordV24(a)){if(dir==='there')line.push([a.lat,a.lon]);else line.unshift([a.lat,a.lon])}if(line.length>1)L.polyline(line,{color,weight:4,opacity:.84,interactive:false}).addTo(transportMapV24)});if(pts.length)transportMapV24.fitBounds(pts,{padding:[42,42],maxZoom:14});else transportMapV24.setView([55.75,37.62],10);document.getElementById('tv25MapFit')?.addEventListener('click',()=>{if(pts.length)transportMapV24.fitBounds(pts,{padding:[42,42],maxZoom:14})});document.getElementById('tv26ShowDestination')?.addEventListener('click',()=>{if(hasCoordV24(a))transportMapV24.setView([a.lat,a.lon],16)});document.getElementById('tv26OpenAnyRoute')?.addEventListener('click',()=>{const r=tv24().rides[dir][0];if(r)openYandexRideV24(r,dir);else if(hasCoordV24(a))window.open(yandexPointV24(a.lat,a.lon),'_blank','noopener')});setTimeout(()=>transportMapV24?.invalidateSize(false),90)}
  const bindBeforeV26=bind;bind=function(){bindBeforeV26();if(tab==='transport'){requestAnimationFrame(mountTransportMapV24)}};
  const build=document.querySelector('.build-label');if(build)build.textContent='V20 · транспорт · визуал по референсу';
  render();
})();


;/* source: hikes-preview/transport-v27.js */
/* V21 — closer implementation of the approved transport reference. */
(function(){
  const COLORS=['#2e83df','#1a9d5c','#ee8135','#d84b50','#7b61d8','#1aa4a2'];
  function canEditArrivalV27(){const lead=(S.roles||[]).find(r=>r.title==='Руководитель')?.p,transport=(S.roles||[]).find(r=>r.title==='Транспорт')?.p;return S.current===lead||S.current===transport||S.current==='p1'}
  function carSvgV27(){return `<svg viewBox="0 0 64 34" aria-hidden="true"><path d="M11 23h42l-3-9-7-5H24l-8 6-5 8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 11h19l6 7H16l6-7Z" fill="currentColor" opacity=".12"/><circle cx="20" cy="25" r="4" fill="currentColor"/><circle cx="46" cy="25" r="4" fill="currentColor"/><path d="M14 19h36" stroke="currentColor" stroke-width="2"/></svg>`}
  function heroV27(){const e=S.event||{};return `<section class="tv27-hero"><div class="tv27-hero-inner"><div><div class="tv27-back">← К мероприятию</div><h1 class="tv27-title">${esc(e.title||'Поход')}</h1><div class="tv27-meta"><span>▣ ${esc(e.date||'Дата уточняется')}</span><span>↟ ${esc(e.type||'Поход')}</span><span>⌖ ${esc(tv24().arrival?.title||'Место мероприятия')}</span></div></div><div class="tv27-hero-actions">${canEditArrivalV27()?`<button class="btn alt" id="tv24EditArrival">Редактировать место</button>`:''}</div></div></section>`}
  function summaryV27(){const s=transportSummaryV24(dir);return `<section class="tv27-summary"><div class="tv27-summary-title">Организационная сводка</div><div class="tv27-stat"><span class="tv27-stat-icon">V</span><div><small>Водители</small><strong>${s.drivers}</strong></div></div><div class="tv27-stat"><span class="tv27-stat-icon">P</span><div><small>Пассажиры</small><strong>${s.inCars}</strong></div></div><div class="tv27-stat"><span class="tv27-stat-icon">+</span><div><small>Свободных мест</small><strong>${s.free}</strong></div></div><div class="tv27-stat"><span class="tv27-stat-icon">↗</span><div><small>Самостоятельно</small><strong>${s.self}</strong></div></div><div class="tv27-stat ${s.unset?'risk':s.pending?'warn':''}"><span class="tv27-stat-icon">?</span><div><small>${s.pending?'Ждут ответа':'Без решения'}</small><strong>${s.pending||s.unset}</strong></div></div></section>`}
  function destinationV27(){const a=tv24().arrival,time=dir==='there'?a.time:a.returnTime;return `<section class="tv27-card"><h2>${dir==='there'?'Место прибытия':'Обратный выезд'}</h2><div class="tv27-destination"><span class="tv27-destination-pin"></span><div class="tv27-destination-copy"><h3>${esc(a.title||'Место мероприятия')}</h3><p>${esc(a.note||'Точка транспорта задаётся отдельно от пешего маршрута.')}</p><div class="tv27-destination-meta"><code>${esc(fmtCoordV24(a.lat,a.lon))}</code>${time?`<b>${dir==='there'?'Быть к':'Выезд'} ${esc(time)}</b>`:''}</div></div><div class="tv27-destination-thumb" aria-hidden="true"></div><div class="tv27-card-actions"><button class="btn sand" id="tv27ShowDestination">Показать на карте</button>${hasCoordV24(a)?`<button class="btn alt" data-tv24-yandex-point="arrival">Открыть в Яндекс Картах</button>`:''}${canEditArrivalV27()?`<button class="btn alt" id="tv24EditArrival">Изменить точку</button>`:''}</div></div></section>`}
  function profileV27(){const p=transportProfileV24(),ride=transportDriverRideV24(S.current,dir);return `<section class="tv27-card"><h2>Мой транспорт</h2><div class="tv27-profile"><div class="tv27-avatar">${initials(pn(S.current))}</div><div class="tv27-profile-copy"><strong>${esc(pn(S.current))}</strong><div class="tv27-badges">${p.driver?`<span class="tv27-badge green">Водитель</span><span class="tv27-badge">Обычно ${+p.defaultSeats||0} мест</span>`:`<span class="tv27-badge">Не водитель</span>`}</div><span>${p.vehicle?esc(p.vehicle):'Автомобиль не указан'}${p.color?' · '+esc(p.color):''}</span>${p.plate?`<span>${esc(p.plate)}</span>`:''}${p.phone?`<span>${esc(p.phone)}</span>`:''}</div><div class="tv27-profile-actions"><button class="btn alt" id="tv24ProfileEdit">Редактировать профиль</button>${p.driver&&!ride?`<button class="btn sand" id="tv24CreateRide">+ Добавить рейс</button>`:''}</div></div></section>`}
  function myTripV27(){const c=transportChoiceV24(),active=transportRequestV24();if(c.mode==='self')return `<div class="tv27-mytrip self"><div><small>МОЙ ТРАНСПОРТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Добираюсь самостоятельно</strong><span>Ориентируйся на место и время прибытия выше.</span></div><button class="btn alt" data-tv24-unset-self>Изменить</button></div>`;if(active){const r=active.ride,q=active.request,stop=(r.stops||[]).find(s=>s.id===q.pickupId),approved=q.status==='approved',prof=transportProfileV24(r.driver);return `<div class="tv27-mytrip ${approved?'':'pending'}"><div><small>${approved?'ПОДТВЕРЖДЕНО':'ЗАЯВКА У ВОДИТЕЛЯ'}</small><strong>Еду с ${esc(pn(r.driver))}${r.vehicle?' · '+esc(r.vehicle):''}</strong><span>${esc(stop?.title||stopKindV24(dir))}${stop?.time?' · быть к '+esc(stop.time):''}</span>${approved&&prof.phone?`<a href="tel:${esc(prof.phone)}">${esc(prof.phone)}</a>`:''}</div><div class="row-actions">${stop&&hasCoordV24(stop)?`<button class="btn sand" data-tv24-yandex-stop="${r.id}:${stop.id}">Как добраться</button>`:''}<button class="btn alt" data-tv24-cancel-request="${q.id}">${approved?'Отказаться от места':'Отменить заявку'}</button></div></div>`}const own=transportDriverRideV24();if(own)return `<div class="tv27-mytrip"><div><small>МОЙ РЕЙС · ${directionLabelV24(dir).toUpperCase()}</small><strong>${(own.passengers||[]).length}/${+own.seats||0} пассажиров</strong><span>${transportFreeV24(own)} свободных мест · ${(own.stops||[]).length} ${dir==='there'?'точек посадки':'точек высадки'}</span></div><div class="row-actions"><button class="btn sand" data-tv24-edit-ride="${own.id}">Настроить рейс</button>${dir==='there'?`<button class="btn alt" data-tv24-copy-back="${own.id}">Скопировать обратно</button>`:''}</div></div>`;return `<div class="tv27-mytrip unset"><div><small>МОЙ ТРАНСПОРТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Транспорт пока не выбран</strong><span>Выбери машину ниже или отметь самостоятельную поездку.</span></div><button class="btn alt" data-tv24-self>Поеду самостоятельно</button></div>`}
  function routeRowsV27(r){const a=tv24().arrival,time=dir==='there'?a.time:a.returnTime,stops=r.stops||[],rows=[];if(dir==='back')rows.push({time:time||'—',title:a.title||'Место мероприятия',kind:'start'});stops.forEach((s,i)=>rows.push({time:s.time||'—',title:s.title||stopKindV24(dir),kind:i===0?'start':'mid'}));if(dir==='there')rows.push({time:time||'—',title:a.title||'Место мероприятия',kind:'end'});return rows.slice(0,4).map(x=>`<div class="tv27-route-row ${x.kind==='mid'?'mid':x.kind==='end'?'end':''}"><time>${esc(x.time)}</time><span title="${esc(x.title)}">${esc(x.title)}</span></div>`).join('')}
  function rideV27(r){const free=transportFreeV24(r),me=r.driver===S.current,pending=pendingForRideV24(r),active=transportRequestV24(),blocked=active&&active.ride.id!==r.id,full=free<=0;return `<div class="tv27-ride-wrap"><article class="tv27-ride ${me?'mine':''}"><div class="tv27-driver"><div class="tv27-car">${carSvgV27()}</div><div class="tv27-driver-copy"><strong>${esc(pn(r.driver))}</strong><span>${esc(r.vehicle||'Автомобиль')}</span><span class="tv27-driver-tag">Водитель</span><div class="tv27-seatline ${full?'full':''}">${+r.seats||0} мест · <b>${free?`${free} свободно`:'нет мест'}</b></div></div></div><div class="tv27-route">${routeRowsV27(r)}</div><div class="tv27-passinfo"><div class="tv27-passavatars">${(r.passengers||[]).slice(0,3).map(pid=>`<span>${initials(pn(pid))}</span>`).join('')}${(r.passengers||[]).length>3?`<span>+${(r.passengers||[]).length-3}</span>`:''}</div><small>${(r.passengers||[]).length} пассажир${(r.passengers||[]).length===1?'':'а'}</small></div><div class="tv27-ride-action">${me?`<button class="btn sand" data-tv24-add-stop="${r.id}">+ Точка</button><button class="btn alt" data-tv24-edit-ride="${r.id}">Параметры</button>`:`<button class="btn sand" data-tv24-request="${r.id}" ${full||blocked||active?.ride.id===r.id?'disabled':''}>${active?.ride.id===r.id?'Заявка отправлена':full?'Нет мест':'Попроситься'}</button><button class="btn alt" data-tv24-yandex-ride="${r.id}">Маршрут</button>`}</div></article>${me&&pending.length?`<div class="tv27-driver-requests">${pending.map(q=>{const st=(r.stops||[]).find(s=>s.id===q.pickupId);return `<div class="tv27-request-row"><span><strong>${esc(pn(q.pid))} хочет поехать с вами</strong><small>${esc(st?.title||'Точка не выбрана')}${st?.time?' · '+esc(st.time):''}</small></span><button class="btn sand" data-tv24-approve="${r.id}:${q.id}">Подтвердить</button><button class="btn alt" data-tv24-decline="${r.id}:${q.id}">Отказать</button></div>`}).join('')}</div>`:''}</div>`}
  function ridesV27(){const rides=tv24().rides[dir],p=transportProfileV24(),own=transportDriverRideV24(S.current,dir);return `<section class="tv27-panel"><div class="tv27-panel-head"><div><h2>${dir==='there'?'Рейсы на мероприятие':'Обратные рейсы'}</h2><div class="tv27-panel-sub">${dir==='there'?'Выбери водителя и конкретную точку посадки.':'Можно использовать тот же состав и скорректировать высадки.'}</div></div><div class="tv27-panel-actions"><div class="segmented"><button class="${dir==='there'?'active':''}" data-tv24-dir="there">Туда</button><button class="${dir==='back'?'active':''}" data-tv24-dir="back">Обратно</button></div>${p.driver&&!own?`<button class="btn sand" id="tv24CreateRide">+ Добавить рейс</button>`:''}</div></div><div class="tv27-rides">${rides.length?rides.map(rideV27).join(''):`<div class="tv27-empty"><strong>Рейсов пока нет</strong><span>Водитель может создать первый рейс.</span></div>`}</div></section>`}
  function mapV27(){return `<aside class="tv27-map-panel"><div class="tv27-map-topbar"><div class="tv27-map-legend"><span class="tv27-map-chip"><i></i>Все точки</span><span class="tv27-map-chip"><i class="blue"></i>Посадки</span><span class="tv27-map-chip"><i class="orange"></i>Прибытие</span></div><button class="btn alt" id="tv25MapFit">Все точки</button></div><div id="transportMapV24" class="tv27-map"></div><div class="tv27-map-bottom"><button class="btn alt" id="tv27OpenRoute">Построить маршрут в Яндекс</button><small>Водитель двигает свои точки прямо на карте. Для точного автомобильного маршрута используется Яндекс.</small></div></aside>`}
  transportPage=function(){ensureTransportV24();return `${heroV27()}<div class="tv27-shell">${summaryV27()}<div class="tv27-topgrid">${destinationV27()}${profileV27()}</div>${myTripV27()}<div class="tv27-workgrid">${ridesV27()}${mapV27()}</div></div>`}
  function markerIconV27(kind,label,mine=false){return L.divIcon({className:'',html:`<span class="tv27-map-pin ${kind} ${mine?'mine':''}"><span>${esc(label)}</span></span>`,iconSize:[32,38],iconAnchor:[16,34]})}
  function markerLabelV27(title,time){return `<div class="tv27-map-label"><b>${esc(title)}</b>${time?`<span>${esc(time)}</span>`:''}</div>`}
  mountTransportMapV24=function(){const el=document.getElementById('transportMapV24');if(!el||!window.L)return;try{transportMapV24?.remove()}catch(e){}transportMapV24=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:true,zoomSnap:.5,minZoom:3,maxZoom:20});let spec;try{spec=tileSpecStudioV21('city')}catch(e){spec={url:'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',opts:{maxZoom:20,attribution:'© OpenStreetMap contributors © CARTO'}}}L.tileLayer(spec.url,spec.opts).addTo(transportMapV24);const pts=[],a=tv24().arrival,canArrival=canEditArrivalV27();if(hasCoordV24(a)){const m=L.marker([a.lat,a.lon],{draggable:canArrival,icon:markerIconV27('arrival','★')}).addTo(transportMapV24).bindTooltip(markerLabelV27(a.title||'Место мероприятия',dir==='there'?a.time:a.returnTime),{direction:'top',className:'tv27-leaflet-tip'});if(canArrival)m.on('dragend',e=>{const ll=e.target.getLatLng();a.lat=ll.lat;a.lon=ll.lng;transportSaveV24('Место мероприятия перемещено')});m.on('click',()=>{if(canArrival)arrivalModalV24()});pts.push([a.lat,a.lon])}tv24().rides[dir].forEach((r,ri)=>{const color=COLORS[ri%COLORS.length],line=[];(r.stops||[]).forEach((s,si)=>{if(!hasCoordV24(s))return;const mine=r.driver===S.current,m=L.marker([s.lat,s.lon],{draggable:mine,icon:markerIconV27('pickup',`${ri+1}.${si+1}`,mine)}).addTo(transportMapV24).bindTooltip(markerLabelV27(s.title||stopKindV24(dir),s.time),{direction:'top',className:'tv27-leaflet-tip'});if(mine){m.on('dragend',e=>{const ll=e.target.getLatLng();s.lat=ll.lat;s.lon=ll.lng;transportSaveV24('Точка перемещена')});m.on('click',()=>stopModalV24(r,s))}else m.on('click',()=>window.open(yandexPointV24(s.lat,s.lon),'_blank','noopener'));pts.push([s.lat,s.lon]);line.push([s.lat,s.lon])});if(hasCoordV24(a)){if(dir==='there')line.push([a.lat,a.lon]);else line.unshift([a.lat,a.lon])}if(line.length>1)L.polyline(line,{color,weight:4,opacity:.86,interactive:false}).addTo(transportMapV24)});if(pts.length)transportMapV24.fitBounds(pts,{padding:[42,42],maxZoom:14});else transportMapV24.setView([55.75,37.62],10);document.getElementById('tv25MapFit')?.addEventListener('click',()=>{if(pts.length)transportMapV24.fitBounds(pts,{padding:[42,42],maxZoom:14})});document.getElementById('tv27ShowDestination')?.addEventListener('click',()=>{if(hasCoordV24(a)){transportMapV24.setView([a.lat,a.lon],16);setTimeout(()=>transportMapV24.openPopup?.(),100)}});document.getElementById('tv27OpenRoute')?.addEventListener('click',()=>{const own=transportDriverRideV24(S.current,dir),r=own||tv24().rides[dir][0];if(r)openYandexRideV24(r,dir);else if(hasCoordV24(a))window.open(yandexPointV24(a.lat,a.lon),'_blank','noopener');else toast('Сначала задай точки')});setTimeout(()=>transportMapV24?.invalidateSize(false),100)}
  const renderBeforeV27=render;render=function(){document.body.classList.toggle('tv27-transport-active',tab==='transport');return renderBeforeV27()};
  const bindBeforeV27=bind;bind=function(){bindBeforeV27();if(tab==='transport')requestAnimationFrame(mountTransportMapV24)};
  document.body.classList.toggle('tv27-transport-active',tab==='transport');
  const build=document.querySelector('.build-label');if(build)build.textContent='V21 · транспорт · референс доведён';
  render();
})();


;/* source: hikes-preview/transport-v27-fix.js */
/* V21.1 — small interaction fixes after the reference redesign. */
(function(){
  const bindBeforeV271=bind;
  bind=function(){
    bindBeforeV271();
    if(tab!=='transport')return;
    const editButtons=[...document.querySelectorAll('#tv24EditArrival')];
    editButtons.slice(1).forEach(b=>{b.onclick=()=>arrivalModalV24()});
  };
  const build=document.querySelector('.build-label');if(build)build.textContent='V21.1 · транспорт · референс доведён';
  if(tab==='transport')render();
})();


;/* source: hikes-preview/transport-v28.js */
/* V22 — organizer participation visibility + summary interactions. */
(function(){
  const baseTransportPageV28=transportPage;
  const baseBindV28=bind;
  let drawerFilterV28='all';

  function organizerV28(){
    const lead=(S.roles||[]).find(r=>r.title==='Руководитель')?.p;
    const transport=(S.roles||[]).find(r=>r.title==='Транспорт')?.p;
    return S.current===lead||S.current===transport||S.current==='p1';
  }
  function rsvpMetaV28(v){
    return v==='yes'?{label:'Подтвердил',tone:'yes'}:
      v==='maybe'?{label:'Возможно',tone:'maybe'}:
      v==='no'?{label:'Отказался',tone:'no'}:
      {label:'Нет ответа',tone:'pending'};
  }
  function rsvpCountsV28(){
    const out={yes:0,maybe:0,no:0,pending:0,total:(S.participants||[]).length};
    (S.participants||[]).forEach(p=>{if(out[p.rsvp]!==undefined)out[p.rsvp]++;else out.pending++});
    return out;
  }
  function transportMetaV28(pid){
    const c=transportChoiceV24(pid,dir);
    if(c.mode==='driver'){
      const r=transportDriverRideV24(pid,dir),used=(r?.passengers||[]).length,seats=+r?.seats||0;
      return {label:'Водитель',tone:'ok',detail:r?`${used}/${seats} пассажиров · ${transportFreeV24(r)} свободных мест`:'Рейс ещё не настроен'};
    }
    if(c.mode==='self')return {label:'Самостоятельно',tone:'',detail:'Добирается самостоятельно'};
    if(c.mode==='ride'){
      const r=transportRideV24(c.rideId,dir),q=(r?.requests||[]).find(x=>x.id===c.requestId||x.pid===pid),st=(r?.stops||[]).find(x=>x.id===(c.pickupId||q?.pickupId));
      return {label:'Место подтверждено',tone:'ok',detail:r?`${pn(r.driver)}${st?.title?' · '+st.title:''}${st?.time?' · '+st.time:''}`:'Машина выбрана'};
    }
    if(c.mode==='request'){
      const active=transportRequestV24(pid,dir),r=active?.ride,q=active?.request,st=(r?.stops||[]).find(x=>x.id===q?.pickupId);
      return {label:'Ждёт ответа',tone:'warn',detail:r?`Заявка к ${pn(r.driver)}${st?.title?' · '+st.title:''}`:'Заявка отправлена'};
    }
    return {label:'Без транспорта',tone:'risk',detail:'Способ поездки ещё не выбран'};
  }
  function matchesFilterV28(p,filter){
    if(filter==='all')return true;
    if(['yes','maybe','no','pending'].includes(filter))return (p.rsvp||'pending')===filter;
    const c=transportChoiceV24(p.id,dir);
    if(filter==='driver')return c.mode==='driver';
    if(filter==='incars')return c.mode==='ride';
    if(filter==='self')return c.mode==='self';
    if(filter==='unresolved')return ['unset','request'].includes(c.mode);
    return true;
  }
  function filterTitleV28(filter){
    return ({all:'Все участники',yes:'Подтвердили участие',maybe:'Возможно',no:'Отказались',pending:'Нет ответа',driver:'Водители',incars:'Пассажиры в машинах',self:'Самостоятельно',unresolved:'Без решения / ждут ответа'})[filter]||'Участники';
  }
  function peopleRowsV28(filter){
    const people=(S.participants||[]).filter(p=>matchesFilterV28(p,filter));
    if(!people.length)return `<div class="tv28-empty">По этому фильтру участников нет.</div>`;
    return people.map(p=>{
      const rsvp=rsvpMetaV28(p.rsvp),tr=transportMetaV28(p.id);
      return `<div class="tv28-person"><div class="tv28-person-avatar">${esc(initials(p.name))}</div><div class="tv28-person-main"><div class="tv28-person-name"><strong>${esc(p.name)}</strong><span class="tv28-rsvp-badge ${rsvp.tone}">${esc(rsvp.label)}</span></div><div class="tv28-person-transport"><b>${esc(directionLabelV24(dir))}:</b> ${esc(tr.detail)}</div></div><span class="tv28-transport-badge ${tr.tone}">${esc(tr.label)}</span></div>`;
    }).join('');
  }
  function drawerHtmlV28(){
    if(!organizerV28())return '';
    const c=rsvpCountsV28();
    return `<div class="tv28-drawer-backdrop" data-tv28-close></div><aside class="tv28-drawer" id="tv28Drawer" aria-hidden="true"><div class="tv28-drawer-head"><div><div class="tv28-drawer-kicker">Организатор</div><h2 id="tv28DrawerTitle">Все участники</h2></div><button class="tv28-close" type="button" data-tv28-close aria-label="Закрыть">×</button></div><div class="tv28-rsvp-summary"><div class="tv28-rsvp-cell yes"><small>Подтвердили</small><strong>${c.yes}</strong></div><div class="tv28-rsvp-cell maybe"><small>Возможно</small><strong>${c.maybe}</strong></div><div class="tv28-rsvp-cell no"><small>Отказались</small><strong>${c.no}</strong></div><div class="tv28-rsvp-cell"><small>Нет ответа</small><strong>${c.pending}</strong></div></div><div class="tv28-drawer-filters" id="tv28Filters"><button class="tv28-filter active" data-tv28-filter="all">Все</button><button class="tv28-filter" data-tv28-filter="yes">Подтвердили</button><button class="tv28-filter" data-tv28-filter="maybe">Возможно</button><button class="tv28-filter" data-tv28-filter="no">Отказались</button><button class="tv28-filter" data-tv28-filter="pending">Нет ответа</button></div><div class="tv28-people-list" id="tv28PeopleList">${peopleRowsV28('all')}</div></aside>`;
  }
  function openDrawerV28(filter='all'){
    if(!organizerV28())return;
    drawerFilterV28=filter;
    const drawer=document.getElementById('tv28Drawer'),list=document.getElementById('tv28PeopleList'),title=document.getElementById('tv28DrawerTitle');
    if(!drawer||!list)return;
    list.innerHTML=peopleRowsV28(filter);if(title)title.textContent=filterTitleV28(filter);
    document.querySelectorAll('[data-tv28-filter]').forEach(b=>b.classList.toggle('active',b.dataset.tv28Filter===filter));
    drawer.setAttribute('aria-hidden','false');document.body.classList.add('tv28-drawer-open');
  }
  function closeDrawerV28(){document.body.classList.remove('tv28-drawer-open');document.getElementById('tv28Drawer')?.setAttribute('aria-hidden','true')}
  function enhanceSummaryV28(){
    document.body.classList.toggle('tv28-organizer',organizerV28());
    if(!organizerV28())return;
    const summary=document.querySelector('.tv27-summary');if(!summary)return;
    const title=summary.querySelector('.tv27-summary-title');
    if(title&&!title.querySelector('.tv28-summary-link')){
      const link=document.createElement('button');link.type='button';link.className='tv28-summary-link';link.textContent='Состав участников →';link.onclick=()=>openDrawerV28('all');title.appendChild(link);
    }
    if(!summary.querySelector('.tv28-participation')){
      const c=rsvpCountsV28(),el=document.createElement('button');el.type='button';el.className='tv28-participation';el.innerHTML=`<span class="tv28-stat-icon">✓</span><div><small>Участие</small><strong>${c.yes}/${c.total}</strong></div>`;el.onclick=()=>openDrawerV28('all');
      title?.insertAdjacentElement('afterend',el);
    }
    const filters=['driver','incars','driver','self','unresolved'];
    summary.querySelectorAll('.tv27-stat').forEach((el,i)=>{
      el.setAttribute('role','button');el.setAttribute('tabindex','0');el.title='Показать участников';
      const go=()=>openDrawerV28(filters[i]||'all');el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}};
    });
  }
  function bindDrawerV28(){
    document.querySelectorAll('[data-tv28-close]').forEach(b=>b.onclick=closeDrawerV28);
    document.querySelectorAll('[data-tv28-filter]').forEach(b=>b.onclick=()=>openDrawerV28(b.dataset.tv28Filter));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('tv28-drawer-open'))closeDrawerV28()},{once:true});
  }

  transportPage=function(){return baseTransportPageV28()+drawerHtmlV28()};
  bind=function(){baseBindV28();if(tab==='transport'){requestAnimationFrame(()=>{enhanceSummaryV28();bindDrawerV28()})}};
  const build=document.querySelector('.build-label');if(build)build.textContent='V22 · транспорт · современная сетка · участники';
  render();
})();


;/* source: hikes-preview/unified-v29.js */
/* RL workspace shell — keep one visual language across every hike tab. */
(function(){
  document.body.classList.add('rl-unified-shell');
  const build=document.querySelector('.build-label');
  if(build)build.textContent='V35 · читаемая светлая рабочая тема';
})();


;/* source: hikes-preview/gear-v30.js */
/* V25 · Gear workspace: fast personal readiness, organizer assignment, editable kits, team exception filters. */
(function(){
  const VER=2;
  const STATUS={
    ready:['Готово','ok'],
    check:['Проверить','warn'],
    borrow:['Нужно одолжить','risk'],
    missing:['Нет / не готово','risk'],
    unset:['Не отмечено','']
  };
  const PRIORITY={required:'Обязательно',weather:'По погоде',recommended:'Рекомендуется'};
  const TYPES={item:'Обычный предмет',kit:'Комплект',consumable:'Расходник / объём'};
  const CATS={
    pack:['Рюкзак и упаковка','Защита вещей от влаги и нормальная укладка.'],
    clothing:['Одежда и обувь','По погоде; обувь должна быть разношенной.'],
    food:['Вода и питание','Запас на плановый маршрут и небольшой резерв.'],
    light:['Свет и инструмент','Свет и минимум для бытовых полевых задач.'],
    nav:['Навигация и связь','Офлайн-маршрут, питание электроники и резерв.'],
    health:['Аптечка и здоровье','Личные лекарства и средства для мелких проблем.'],
    hygiene:['Гигиена','Минимальный набор без лишнего веса.'],
    docs:['Документы','Документы, деньги и офлайн-контакты группы.']
  };
  const PERSONAL=[
    ['pg0','Рюкзак','pack','required','Под объём конкретного похода.'],
    ['pg8','Чехол от дождя на рюкзак','pack','weather','Нужен при вероятности осадков.'],
    ['pg9','Гермомешок / плотные пакеты','pack','recommended','Для сухой одежды и электроники.'],
    ['pg19','Пакет для мусора','pack','required','Мусор с маршрута уносим с собой.'],
    ['pg10','Походная обувь','clothing','required','Разношенная и подходящая под покрытие.'],
    ['pg6','Запасные носки / сухой слой','clothing','required','Минимум один сухой комплект.'],
    ['pg11','Утепляющий слой','clothing','weather','Флис / кофта по температуре.'],
    ['pg2','Дождевик / мембранная куртка','clothing','weather','Сверить с прогнозом.'],
    ['pg12','Головной убор','clothing','weather','По сезону.'],
    ['pg1','Питьевая вода','food','required','Объём зависит от маршрута и погоды.'],
    ['pg13','Личный перекус','food','required','То, что удобно есть без готовки.'],
    ['pg3','Налобный фонарь','light','required','Проверить включение и заряд.'],
    ['pg7','Телефон + офлайн-карта / трек','nav','required','Маршрут должен открываться без связи.'],
    ['pg4','Power bank + кабель','nav','recommended','Полностью зарядить перед выходом.'],
    ['pg5','Личные лекарства','health','required','Общая аптечка не заменяет личные лекарства.'],
    ['pg24','Личная мини-аптечка / пластыри','health','recommended','Для небольших повреждений и мозолей.'],
    ['pg16','Репеллент / средство от клещей','health','weather','По сезону.'],
    ['pg17','Салфетки + антисептик','hygiene','recommended','Упаковать от влаги.'],
    ['pg18','Документ / карта / наличные','docs','recommended','По необходимости поездки; контакты сохранить офлайн.']
  ].map(([id,title,category,priority,help])=>({id,title,category,priority,help}));
  const FINAL=[
    ['weather','Проверить прогноз','За 1–2 дня и утром перед выходом.'],
    ['shoes','Проверить обувь и одежду','Не брать новую непроверенную обувь.'],
    ['charge','Зарядить телефон и power bank','Проверить кабель.'],
    ['offline','Скачать офлайн-карту и маршрут','Открыть один раз без сети.'],
    ['lamp','Проверить фонарь','Включение и заряд.'],
    ['water','Проверить воду и еду','Хватит ли на весь участок.'],
    ['meds','Проверить личные лекарства','Постоянно принимаемые должны быть с собой.'],
    ['shared','Сверить общее имущество','Не забыть распределённое и не дублировать лишнее.']
  ].map(([id,title,hint])=>({id,title,hint}));
  const FIRST_AID=['Стерильные салфетки / марля','Бинт','Эластичный бинт','Пластыри разных размеров','Пластыри / тейп от мозолей','Медицинский тейп','Одноразовые перчатки','Средство для обработки небольших повреждений','Ножницы','Пинцет','Термоодеяло','Краткая памятка первой помощи'].map((title,i)=>({id:'fa'+i,title}));
  const REPAIR=['Армированный скотч / тейп','Пластиковые стяжки','Шнур / паракорд','Иголка и прочная нить','Небольшая запасная фурнитура'].map((title,i)=>({id:'rp'+i,title}));
  const KITCHEN=['Котелок / котлы','Горелка','Топливо для горелки','Средства розжига'].map((title,i)=>({id:'kt'+i,title}));
  const DEFAULT_META={
    g0:{cat:'health',unit:'компл.',type:'kit',desc:'Базовый групповой комплект. Проверяет ответственный за первую помощь.',kit:FIRST_AID,note:'Базовая шпаргалка по комплектности, не индивидуальное медицинское назначение.'},
    g1:{cat:'nav',unit:'шт.',type:'item',desc:'Резерв навигации, распределённый между участниками.'},
    g2:{cat:'nav',unit:'шт.',type:'item',desc:'Бумажная карта / атлас как резерв электронного трека.'},
    g3:{cat:'nav',unit:'шт.',type:'item',desc:'Резерв питания навигации и связи.'},
    g4:{cat:'light',unit:'компл.',type:'kit',desc:'Небольшой полевой ремнабор.',kit:REPAIR,note:'Состав адаптируется под конкретное снаряжение.'},
    g5:{cat:'pack',unit:'шт.',type:'item',desc:'Общее дождевое укрытие, если требуется по погоде или задаче.'}
  };
  const SHARED_CATS={health:'Медицина',nav:'Навигация и связь',light:'Ремонт и инструмент',pack:'Укрытие и быт',food:'Вода и питание',other:'Прочее'};
  const PRESETS={
    custom:{title:'Своя позиция',need:1,unit:'шт.',cat:'other',type:'item',desc:'',kit:[]},
    radios:{title:'Рации',need:4,unit:'шт.',cat:'nav',type:'item',desc:'Если используются группой; проверить заряд и распределение.',kit:[]},
    trash:{title:'Пакеты для общего мусора',need:2,unit:'шт.',cat:'pack',type:'item',desc:'Распределить между участниками.',kit:[]},
    water:{title:'Общая вода',need:6,unit:'л',cat:'food',type:'consumable',desc:'Только если общий запас нужен по маршруту.',kit:[]},
    kitchen:{title:'Кухонный комплект',need:1,unit:'компл.',cat:'food',type:'kit',desc:'Подключать, если планируется готовка.',kit:KITCHEN}
  };
  let mode='personal',teamFilter='issues';

  const G=()=>ensure();
  function organizer(){const lead=S.roles.find(r=>r.title==='Руководитель')?.p,gear=S.roles.find(r=>r.title==='Снаряжение')?.p;return S.current===lead||S.current===gear||S.current==='p1'}
  function ensure(){
    if(!S.gearV30){const old=S.checks||{};S.gearV30={version:VER,status:{},final:{},kits:{},meta:{}};(S.participants||[]).forEach(p=>{const checked=new Set(old[p.id]||[]);S.gearV30.status[p.id]={};PERSONAL.forEach(i=>S.gearV30.status[p.id][i.id]=checked.has(i.id)?'ready':'unset');S.gearV30.final[p.id]={}})}
    const g=S.gearV30;g.version=VER;g.status||={};g.final||={};g.kits||={};g.meta||={};
    const oldItems=new Map((S.personal||[]).map(i=>[i.id,i]));S.personal=PERSONAL.map(i=>({...oldItems.get(i.id),...i}));
    (S.participants||[]).forEach(p=>{g.status[p.id]||={};g.final[p.id]||={};PERSONAL.forEach(i=>{if(!STATUS[g.status[p.id][i.id]])g.status[p.id][i.id]='unset'});FINAL.forEach(i=>{if(typeof g.final[p.id][i.id]!=='boolean')g.final[p.id][i.id]=false})});
    (S.shared||[]).forEach(x=>{
      g.meta[x.id]={...(DEFAULT_META[x.id]||{}),...(g.meta[x.id]||{})};
      const m=g.meta[x.id];m.type=m.type||(m.kit?.length?'kit':'item');m.unit=m.unit||'шт.';m.cat=m.cat||'other';m.kit=Array.isArray(m.kit)?m.kit:[];
      x.a=Array.isArray(x.a)?x.a:[];x.confirmed=Array.isArray(x.confirmed)?x.confirmed:[];
      if(m.type==='kit'){x.need=1;x.a=x.a.slice(0,1).map(a=>[a[0],1]);x.confirmed=x.confirmed.filter(pid=>x.a.some(a=>a[0]===pid))}
      if(m.kit.length){g.kits[x.id]||={};m.kit.forEach(i=>{if(typeof g.kits[x.id][i.id]!=='boolean')g.kits[x.id][i.id]=false})}
    });
    sync(false);return g;
  }
  function sync(write=true){if(!S.gearV30)return;S.checks||={};S.participants.forEach(p=>S.checks[p.id]=PERSONAL.filter(i=>S.gearV30.status[p.id]?.[i.id]==='ready').map(i=>i.id));if(write)save()}
  function pstat(pid){const st=G().status[pid]||{},ready=PERSONAL.filter(i=>st[i.id]==='ready').length,req=PERSONAL.filter(i=>i.priority==='required'),reqOpen=req.filter(i=>st[i.id]!=='ready').length,check=PERSONAL.filter(i=>st[i.id]==='check').length,help=PERSONAL.filter(i=>['borrow','missing'].includes(st[i.id])).length;return{ready,total:PERSONAL.length,pct:Math.round(ready/PERSONAL.length*100),reqOpen,check,help}}
  function fstat(pid){const f=G().final[pid]||{},done=FINAL.filter(i=>f[i.id]).length;return{done,total:FINAL.length,pct:Math.round(done/FINAL.length*100)}}
  function aq(x){return x.a.reduce((n,a)=>n+(+a[1]||0),0)}
  function cq(x){return x.a.reduce((n,a)=>n+(x.confirmed.includes(a[0])?(+a[1]||0):0),0)}
  function mine(x){return +(x.a.find(a=>a[0]===S.current)?.[1]||0)}
  function kstat(x){const kit=G().meta[x.id]?.kit||[],c=G().kits[x.id]||{},done=kit.filter(i=>c[i.id]).length;return{done,total:kit.length}}
  function sstate(x){const need=+x.need||0,k=kstat(x);if(aq(x)<need)return[aq(x)?`Не хватает ${need-aq(x)}`:'Не назначено','risk'];if(cq(x)<need)return['Нужно подтвердить','warn'];if(k.total&&k.done<k.total)return['Проверить комплект','warn'];return['Готово','ok']}
  function totals(){const l=S.shared||[];return{all:l.length,ok:l.filter(x=>sstate(x)[1]==='ok').length,def:l.filter(x=>aq(x)<(+x.need||0)).length,conf:l.filter(x=>aq(x)>=(+x.need||0)&&cq(x)<(+x.need||0)).length}}
  function metric(a,b,c,t=''){return `<div class="g30-metric ${t}"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c)}</span></div>`}
  function tabs(){const a=[['personal','Моё снаряжение'],['shared','Общее']];if(organizer())a.push(['team','Команда']);return `<div class="g30-tabs">${a.map(([k,v])=>`<button data-g30-mode="${k}" class="${mode===k?'active':''}">${v}</button>`).join('')}</div>`}
  function pri(i){return `<span class="g30-priority ${i.priority}">${PRIORITY[i.priority]}</span>`}
  function otherStatus(v){const list=[['unset','Другой статус…'],['check','Проверить'],['borrow','Нужно одолжить'],['missing','Нет / не готово']];return `<select class="g30-other ${STATUS[v]?.[1]||''}">${list.map(([k,t])=>`<option value="${k}" ${v===k?'selected':''}>${t}</option>`).join('')}</select>`}

  function personal(){
    const s=pstat(S.current),st=G().status[S.current]||{};
    return `<div class="g30-summary">${metric('Готовность',`${s.ready}/${s.total}`,`${s.pct}% всего списка`,s.reqOpen?'':'ok')}${metric('Обязательное',s.reqOpen?`${s.reqOpen} не закрыто`:'всё закрыто','главный контроль',s.reqOpen?'risk':'ok')}${metric('Проверить',s.check,'заряд / состояние',s.check?'warn':'')}${metric('Нужна помощь',s.help,'нет вещи / одолжить',s.help?'risk':'')}</div><section class="g30-panel"><div class="g30-person"><div class="avatar">${initials(pn(S.current))}</div><div><small>МОЯ ПОДГОТОВКА</small><b>${esc(pn(S.current))}</b><span>Однодневный поход / тренировка · ночёвка не включена</span></div><strong>${s.pct}%</strong></div>${Object.entries(CATS).map(([cat,m])=>{const items=PERSONAL.filter(i=>i.category===cat),ready=items.filter(i=>st[i.id]==='ready').length,issues=items.filter(i=>['check','borrow','missing'].includes(st[i.id])||(i.priority==='required'&&st[i.id]!=='ready')).length;return `<details class="g30-cat" ${issues?'open':''}><summary><span><b>${m[0]}</b><small>${m[1]}</small></span><em>${ready}/${items.length}${issues?` · ${issues} требуют внимания`:''}</em></summary><div>${items.map(i=>{const v=st[i.id]||'unset',tone=STATUS[v][1];return `<div class="g30-item ${tone}"><span><b>${esc(i.title)}</b>${pri(i)}<small>${esc(i.help)}</small></span><div class="g30-status-actions"><button class="g30-ready ${v==='ready'?'active':''}" data-g30-ready="${i.id}">${v==='ready'?'✓ Готово':'Отметить готово'}</button>${otherStatus(v).replace('<select ','<select data-g30-status="'+i.id+'" ')}</div></div>`}).join('')}</div></details>`}).join('')}</section>${finalBlock()}`;
  }
  function finalBlock(){const f=G().final[S.current],s=fstat(S.current);return `<section class="g30-panel"><div class="g30-head"><div><div class="page-kicker">Перед выходом</div><h2>Финальная проверка</h2><p>Действия для конкретного мероприятия, а не постоянное состояние вещей.</p></div><b>${s.done}/${s.total}</b></div><div class="g30-final">${FINAL.map(i=>`<button class="${f[i.id]?'done':''}" data-g30-final="${i.id}"><i>${f[i.id]?'✓':''}</i><span><b>${i.title}</b><small>${i.hint}</small></span></button>`).join('')}</div></section>`}

  function owners(x){return x.a.length?`<div class="g30-owners">${x.a.map(a=>`<span class="${x.confirmed.includes(a[0])?'ok':''}"><b>${esc(pn(a[0]))}</b> · ${a[1]} ${esc(G().meta[x.id]?.unit||'шт.')}${x.confirmed.includes(a[0])?' ✓':''}</span>`).join('')}</div>`:'<small class="g30-muted">Никто не взял</small>'}
  function kit(x){const m=G().meta[x.id]||{},arr=m.kit||[];if(!arr.length)return'';const k=kstat(x),can=mine(x)>0||organizer();return `<details class="g30-kit"><summary><span><b>Состав комплекта</b><small>${esc(m.note||'Проверить комплектность перед выходом.')}</small></span><em>${k.done}/${k.total}</em></summary><div>${arr.map(i=>`<button ${can?'':'disabled'} class="${G().kits[x.id]?.[i.id]?'done':''}" data-g30-kit="${x.id}:${i.id}"><i>${G().kits[x.id]?.[i.id]?'✓':''}</i>${esc(i.title)}</button>`).join('')}</div></details>`}
  function actions(x){const n=mine(x),full=aq(x)>=(+x.need||0),confirmed=x.confirmed.includes(S.current),u=G().meta[x.id]?.unit||'шт.',isKit=G().meta[x.id]?.type==='kit';if(n)return `<div class="g30-actions">${!isKit?`<span class="g30-step"><button data-g30-qty="${x.id}:-1">−</button><b>${n} ${esc(u)}</b><button data-g30-qty="${x.id}:1" ${full?'disabled':''}>+</button></span>`:`<button class="btn alt sm" data-g30-drop="${x.id}">Снять с себя</button>`}<button class="btn ${confirmed?'alt':'sand'} sm" data-g30-confirm="${x.id}">${confirmed?'Подтверждено ✓':'Подтвердить'}</button></div>`;return full?'<small class="g30-muted">Потребность распределена</small>':`<button class="btn sand sm" data-g30-take="${x.id}">Возьму 1 ${esc(u)}</button>`}
  function shared(){
    const t=totals(),grouped={};S.shared.forEach(x=>{const c=G().meta[x.id]?.cat||'other';(grouped[c]||=[]).push(x)});
    return `<div class="g30-summary">${metric('Позиций',t.all,'общее имущество')}${metric('Готово',`${t.ok}/${t.all}`,'распределено и проверено',t.ok===t.all?'ok':'')}${metric('Дефицит',t.def,'не хватает количества',t.def?'risk':'ok')}${metric('Подтверждение',t.conf,'назначено, но не подтверждено',t.conf?'warn':'')}</div><section class="g30-panel"><div class="g30-head"><div><div class="page-kicker">Команда</div><h2>Общее имущество</h2><p>Участник может взять позицию сам, организатор — назначить её человеку.</p></div>${organizer()?'<button class="btn sand" id="g30Add">+ Добавить</button>':''}</div>${Object.entries(grouped).map(([c,list])=>`<div class="g30-group"><div class="g30-group-title"><b>${esc(SHARED_CATS[c]||'Прочее')}</b><span>${list.filter(x=>sstate(x)[1]==='ok').length}/${list.length} готово</span></div>${list.map(x=>{const m=G().meta[x.id]||{},ss=sstate(x),u=m.unit||'шт.';return `<article class="g30-shared ${ss[1]}"><div><p><b>${esc(x.title)}</b><em class="${ss[1]}">${ss[0]}</em><span class="g30-type">${esc(TYPES[m.type]||TYPES.item)}</span></p><small>${esc(m.desc||'')}</small><div class="g30-counts"><span>Нужно <b>${x.need} ${esc(u)}</b></span><span>Назначено <b>${aq(x)} ${esc(u)}</b></span><span>Подтверждено <b>${cq(x)} ${esc(u)}</b></span></div></div><div>${owners(x)}</div><div>${actions(x)}${organizer()?`<div class="g30-admin-actions"><button data-g30-assign="${x.id}">Назначить</button><button data-g30-edit="${x.id}">Изменить</button><button class="danger" data-g30-delete="${x.id}">Удалить</button></div>`:''}</div>${kit(x)}</article>`}).join('')}</div>`).join('')}</section>`;
  }

  function problems(pid){const st=G().status[pid]||{};return PERSONAL.filter(i=>['borrow','missing','check'].includes(st[i.id])||(i.priority==='required'&&st[i.id]!=='ready')).map(i=>[i,st[i.id]||'unset'])}
  function teamMatches(p){const pr=problems(p.id),f=fstat(p.id),req=PERSONAL.filter(i=>i.priority==='required');if(teamFilter==='all')return true;if(teamFilter==='borrow')return pr.some(x=>x[1]==='borrow');if(teamFilter==='required')return req.some(i=>G().status[p.id]?.[i.id]!=='ready');if(teamFilter==='final')return f.done<f.total;if(teamFilter==='maybe')return p.rsvp!=='yes';return pr.length>0||f.done<f.total||p.rsvp!=='yes'}
  function team(){
    const confirmed=S.participants.filter(p=>p.rsvp==='yes'),secondary=S.participants.filter(p=>['maybe','pending'].includes(p.rsvp)),visible=[...confirmed,...secondary].filter(teamMatches),req=PERSONAL.filter(i=>i.priority==='required');
    const allConfirmed=confirmed.flatMap(p=>problems(p.id)),borrow=allConfirmed.filter(x=>x[1]==='borrow').length,missing=allConfirmed.filter(x=>x[1]==='missing').length,ready=confirmed.filter(p=>req.every(i=>G().status[p.id]?.[i.id]==='ready')).length,t=totals();
    const filters=[['issues','Требуют внимания'],['all','Все'],['borrow','Нужно одолжить'],['required','Не закрыли обязательное'],['final','Не прошли финальную проверку'],['maybe','Возможно / нет ответа']];
    return `<div class="g30-summary">${metric('Подтверждённые',`${ready}/${confirmed.length}`,'закрыли обязательное',ready===confirmed.length?'ok':'warn')}${metric('Нужно одолжить',borrow,'только участники «иду»',borrow?'risk':'ok')}${metric('Нет / не готово',missing,'явные проблемы',missing?'risk':'ok')}${metric('Общее',`${t.ok}/${t.all}`,'полностью готово',t.ok===t.all?'ok':'warn')}</div><section class="g30-panel"><div class="g30-head"><div><div class="page-kicker">Организатор</div><h2>Готовность команды</h2><p>Основная статистика считает только подтвердивших участие. «Возможно» и «нет ответа» вынесены отдельно.</p></div></div><div class="g30-filters">${filters.map(([k,v])=>`<button class="${teamFilter===k?'active':''}" data-g30-filter="${k}">${v}</button>`).join('')}</div><div class="g30-team">${visible.length?visible.map(p=>{const pr=problems(p.id),rr=req.filter(i=>G().status[p.id]?.[i.id]==='ready').length,f=fstat(p.id);return `<div class="g30-team-row"><span class="g30-team-person"><span class="avatar">${initials(p.name)}</span><span><b>${esc(p.name)}</b><small>${p.rsvp==='yes'?'Участвует':p.rsvp==='maybe'?'Возможно':'Нет ответа'}</small></span></span><span><b>${rr}/${req.length}</b><small>обязательное</small></span><span><b>${f.done}/${f.total}</b><small>перед выходом</small></span><span class="g30-problems">${pr.length?pr.slice(0,4).map(([i,v])=>`<em class="${STATUS[v][1]||'warn'}">${esc(i.title)} · ${esc(v==='unset'?'не отмечено':STATUS[v][0])}</em>`).join(''):(f.done<f.total?'<em class="warn">Не завершена финальная проверка</em>':'<em class="ok">Критичных проблем нет</em>')}</span></div>`}).join(''):'<div class="g30-empty">В этом фильтре проблем нет.</div>'}</div></section>`;
  }

  function page(){ensure();if(mode==='team'&&!organizer())mode='personal';return `${pageHead('Подготовка','Снаряжение','Личная сборка, распределение общего имущества и финальная проверка перед выходом.',organizer()&&mode==='shared'?'<button class="btn sand" id="g30AddTop">+ Добавить общее</button>':'')}${tabs()}<div class="g30-content">${mode==='personal'?personal():mode==='shared'?shared():team()}</div>`}

  function qty(id,d){const x=S.shared.find(g=>g.id===id);if(!x)return;const m=G().meta[id]||{};if(m.type==='kit')return toast('Комплект назначается как одна отдельная единица');let r=x.a.find(a=>a[0]===S.current),n=+(r?.[1]||0);if(d>0&&aq(x)>=(+x.need||0))return toast('Потребность уже распределена');n=Math.max(0,n+d);if(r)r[1]=n;else if(n)x.a.push([S.current,n]);x.a=x.a.filter(a=>+a[1]>0);x.confirmed=x.confirmed.filter(p=>p!==S.current);save();render()}
  function dropMine(id){const x=S.shared.find(g=>g.id===id);if(!x)return;x.a=x.a.filter(a=>a[0]!==S.current);x.confirmed=x.confirmed.filter(p=>p!==S.current);save();render()}
  function close(){const l=document.getElementById('modalLayer');if(!l)return;l.classList.remove('open');l.setAttribute('aria-hidden','true');l.innerHTML=''}
  function openModal(html){const l=document.getElementById('modalLayer');if(!l)return null;l.innerHTML=`<div class="g30-backdrop" data-g30-close></div>${html}`;l.classList.add('open');l.setAttribute('aria-hidden','false');l.querySelectorAll('[data-g30-close]').forEach(b=>b.onclick=close);return l}
  function kitText(arr){return (arr||[]).map(i=>i.title).join('\n')}
  function kitFromText(text,old=[]){const byTitle=new Map(old.map(i=>[i.title,i.id]));return text.split(/\n+/).map(x=>x.trim()).filter(Boolean).map((title,i)=>({id:byTitle.get(title)||`ki_${Date.now()}_${i}`,title}))}
  function itemModal(id=''){
    const edit=!!id,x=edit?S.shared.find(g=>g.id===id):null,m=edit?G().meta[id]||{}:PRESETS.custom;
    const l=openModal(`<div class="g30-modal"><div class="g30-modal-head"><b>${edit?'Изменить':'Добавить'} общее имущество</b><button data-g30-close>×</button></div><div class="g30-modal-body">${!edit?`<label>Шаблон<select id="g30Preset">${Object.entries(PRESETS).map(([k,v])=>`<option value="${k}">${esc(v.title)}</option>`).join('')}</select></label>`:''}<label>Название<input id="g30Title"></label><label>Тип<select id="g30Type">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><div><label>Нужно<input id="g30Need" type="number" min="1" value="1"></label><label>Единица<input id="g30Unit" value="шт."></label></div><label>Раздел<select id="g30Cat">${Object.entries(SHARED_CATS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Подсказка<textarea id="g30Desc" rows="2"></textarea></label><label id="g30KitWrap">Состав комплекта, одна позиция на строку<textarea id="g30KitText" rows="7"></textarea><small>Комплект всегда считается одной отдельной единицей. Если нужно две аптечки, создайте две позиции.</small></label></div><div class="g30-modal-foot"><button class="btn alt" data-g30-close>Отмена</button><button class="btn sand" id="g30Save">${edit?'Сохранить':'Добавить'}</button></div></div>`);if(!l)return;
    const toggleType=()=>{const isKit=document.getElementById('g30Type').value==='kit';document.getElementById('g30KitWrap').style.display=isKit?'grid':'none';document.getElementById('g30Need').disabled=isKit;if(isKit){document.getElementById('g30Need').value=1;if(!document.getElementById('g30Unit').value)document.getElementById('g30Unit').value='компл.'}};
    const fill=(v)=>{document.getElementById('g30Title').value=v.title==='Своя позиция'?'':v.title;document.getElementById('g30Type').value=v.type||'item';document.getElementById('g30Need').value=v.type==='kit'?1:(v.need||1);document.getElementById('g30Unit').value=v.unit||'шт.';document.getElementById('g30Cat').value=v.cat||'other';document.getElementById('g30Desc').value=v.desc||'';document.getElementById('g30KitText').value=kitText(v.kit||[]);toggleType()};
    if(edit)fill({title:x.title,need:x.need,...m});else{fill(PRESETS.custom);document.getElementById('g30Preset').onchange=()=>fill(PRESETS[document.getElementById('g30Preset').value])}
    document.getElementById('g30Type').onchange=toggleType;
    document.getElementById('g30Save').onclick=()=>{const title=document.getElementById('g30Title').value.trim();if(!title)return toast('Укажи название');const type=document.getElementById('g30Type').value,need=type==='kit'?1:Math.max(1,+document.getElementById('g30Need').value||1),unit=document.getElementById('g30Unit').value.trim()||(type==='kit'?'компл.':'шт.'),cat=document.getElementById('g30Cat').value,desc=document.getElementById('g30Desc').value.trim(),oldKit=edit?(G().meta[id]?.kit||[]):[],kit=type==='kit'?kitFromText(document.getElementById('g30KitText').value,oldKit):[];let target=x;if(!edit){id='g30_'+Date.now();target={id,title,need,a:[],confirmed:[]};S.shared.push(target)}else{target.title=title;target.need=need;if(type==='kit'){target.a=target.a.slice(0,1).map(a=>[a[0],1]);target.confirmed=target.confirmed.filter(pid=>target.a.some(a=>a[0]===pid))}else{target.a=target.a.map(a=>[a[0],Math.min(+a[1]||0,need)]).filter(a=>a[1]>0);target.confirmed=target.confirmed.filter(pid=>target.a.some(a=>a[0]===pid))}}
      G().meta[id]={...(G().meta[id]||{}),unit,cat,type,desc,kit,note:type==='kit'?'Проверьте состав перед выходом.':''};const oldState=G().kits[id]||{};G().kits[id]={};kit.forEach(i=>G().kits[id][i.id]=!!oldState[i.id]);save();close();render()};
  }
  function assignModal(id){const x=S.shared.find(g=>g.id===id);if(!x)return;const m=G().meta[id]||{},isKit=m.type==='kit',active=S.participants.filter(p=>p.rsvp!=='no');const l=openModal(`<div class="g30-modal g30-modal-sm"><div class="g30-modal-head"><b>Назначить: ${esc(x.title)}</b><button data-g30-close>×</button></div><div class="g30-modal-body"><label>Участник<select id="g30AssignPerson">${active.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.rsvp==='yes'?'участвует':p.rsvp==='maybe'?'возможно':'нет ответа'}</option>`).join('')}</select></label><label>Количество<input id="g30AssignQty" type="number" min="0" max="${x.need}" value="1" ${isKit?'disabled':''}></label><small class="g30-form-note">0 снимает назначение. После изменения участник должен подтвердить, что действительно берёт вещь.</small></div><div class="g30-modal-foot"><button class="btn alt" data-g30-close>Отмена</button><button class="btn sand" id="g30AssignSave">Сохранить назначение</button></div></div>`);if(!l)return;
    const syncPerson=()=>{const pid=document.getElementById('g30AssignPerson').value,cur=x.a.find(a=>a[0]===pid)?.[1]||0;document.getElementById('g30AssignQty').value=isKit?1:(cur||1)};document.getElementById('g30AssignPerson').onchange=syncPerson;syncPerson();
    document.getElementById('g30AssignSave').onclick=()=>{const pid=document.getElementById('g30AssignPerson').value;let q=isKit?1:Math.max(0,+document.getElementById('g30AssignQty').value||0);if(isKit){x.a=[[pid,1]];x.confirmed=[]}else{const others=x.a.filter(a=>a[0]!==pid),cap=Math.max(0,(+x.need||0)-others.reduce((n,a)=>n+(+a[1]||0),0));q=Math.min(q,cap);x.a=others;if(q)x.a.push([pid,q]);x.confirmed=x.confirmed.filter(p=>p!==pid)}save();close();render()};
  }
  function removeItem(id){if(!organizer())return;const x=S.shared.find(g=>g.id===id);if(!x)return;if(!window.confirm(`Удалить «${x.title}» из общего имущества?`))return;S.shared=S.shared.filter(g=>g.id!==id);delete G().meta[id];delete G().kits[id];save();render()}

  function bind30(){
    document.body.classList.toggle('g30-active',tab==='gear');if(tab!=='gear')return;
    document.querySelectorAll('[data-g30-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.g30Mode;render()});
    document.querySelectorAll('[data-g30-ready]').forEach(b=>b.onclick=()=>{const id=b.dataset.g30Ready,v=G().status[S.current][id];G().status[S.current][id]=v==='ready'?'unset':'ready';sync();render()});
    document.querySelectorAll('[data-g30-status]').forEach(s=>s.onchange=()=>{G().status[S.current][s.dataset.g30Status]=s.value;sync();render()});
    document.querySelectorAll('[data-g30-final]').forEach(b=>b.onclick=()=>{G().final[S.current][b.dataset.g30Final]=!G().final[S.current][b.dataset.g30Final];save();render()});
    document.querySelectorAll('[data-g30-take]').forEach(b=>b.onclick=()=>qty(b.dataset.g30Take,1));
    document.querySelectorAll('[data-g30-qty]').forEach(b=>b.onclick=()=>{const [id,d]=b.dataset.g30Qty.split(':');qty(id,+d)});
    document.querySelectorAll('[data-g30-drop]').forEach(b=>b.onclick=()=>dropMine(b.dataset.g30Drop));
    document.querySelectorAll('[data-g30-confirm]').forEach(b=>b.onclick=()=>{const x=S.shared.find(g=>g.id===b.dataset.g30Confirm);if(!x||!mine(x))return;x.confirmed.includes(S.current)?x.confirmed=x.confirmed.filter(p=>p!==S.current):x.confirmed.push(S.current);save();render()});
    document.querySelectorAll('[data-g30-kit]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.g30Kit.split(':');const x=S.shared.find(g=>g.id===id);if(!x||(!mine(x)&&!organizer()))return;G().kits[id][k]=!G().kits[id][k];save();render()});
    document.querySelectorAll('[data-g30-filter]').forEach(b=>b.onclick=()=>{teamFilter=b.dataset.g30Filter;render()});
    document.querySelectorAll('[data-g30-assign]').forEach(b=>b.onclick=()=>assignModal(b.dataset.g30Assign));
    document.querySelectorAll('[data-g30-edit]').forEach(b=>b.onclick=()=>itemModal(b.dataset.g30Edit));
    document.querySelectorAll('[data-g30-delete]').forEach(b=>b.onclick=()=>removeItem(b.dataset.g30Delete));
    document.getElementById('g30Add')?.addEventListener('click',()=>itemModal());document.getElementById('g30AddTop')?.addEventListener('click',()=>itemModal());
  }

  progress=function(pid){const req=PERSONAL.filter(i=>i.priority==='required'),done=req.filter(i=>G().status[pid]?.[i.id]==='ready').length;return[done,req.length,Math.round(done/req.length*100)]};
  ensure();sync(true);const oldBind=bind;gearPage=page;bind=function(){oldBind();bind30()};document.querySelector('.build-label')?.replaceChildren(document.createTextNode('V25 · снаряжение · управление и контроль'));render();
})();

;/* source: hikes-preview/food-v31.js */
/* V27 · Food workspace: flexible meal schedule, shopping, responsibilities and gear links. */
(function(){
  const VER=2;
  const MODE={
    self:['Самостоятельно','Каждый обеспечивает себя сам'],
    common:['Общее','Еда готовится централизованно'],
    hybrid:['Общее + личное','Общая основа и личные дополнения']
  };
  const DEFAULT_EQUIPMENT=['Котёл','Горелка','Топливо для горелки'];
  const MEAL_PRESETS={
    custom:{label:'Своя запись',title:'',time:'12:00',mode:'self',location:'',menu:'',note:''},
    lunch:{label:'Обед · самостоятельно',title:'Обед',time:'13:00',mode:'self',location:'На маршруте',menu:'Каждый берёт свой обед, перекус и воду.',note:'Общая закупка не требуется.'},
    dinner:{label:'Ужин · общий',title:'Ужин',time:'19:00',mode:'common',location:'Лагерь',menu:'',note:'Общее приготовление в лагере.'},
    breakfast:{label:'Завтрак · после ночёвки',title:'Завтрак',time:'08:00',mode:'common',location:'Лагерь',menu:'',note:'Добавлять только на день после ночёвки, если завтрак организуется группой.'},
    snack:{label:'Перекус · самостоятельно',title:'Перекус',time:'16:00',mode:'self',location:'На маршруте',menu:'Каждый берёт свой перекус.',note:''}
  };
  let foodMode='plan';

  function foodOrganizer(){
    const lead=S.roles.find(r=>r.title==='Руководитель')?.p;
    const food=S.roles.find(r=>r.title==='Питание')?.p;
    return S.current===lead||S.current===food||S.current==='p1';
  }
  function foodSeed(){
    const yes=(S.participants||[]).filter(p=>p.rsvp==='yes').map(p=>p.id);
    const attendance={};yes.forEach(pid=>attendance[pid]='eat');
    return {
      version:VER,
      meals:[
        {id:'fm2',day:'День 1',time:'12:30',title:'Обед',mode:'self',location:'Привал',menu:'Личный обед + ходовой перекус.',note:'Каждый несёт свою еду и воду.',portions:0,planEventId:'t5',cooks:[],equipment:[]},
        {id:'fm3',day:'День 1',time:'19:00',title:'Ужин',mode:'common',location:'Лагерь',menu:'Гречка с тушёнкой + чай.',note:'Общий приём пищи: продукты закупаются и распределяются заранее.',portions:Math.max(1,yes.length),planEventId:'',cooks:[],equipment:DEFAULT_EQUIPMENT.map(title=>({title,sharedId:''}))}
      ],
      ingredients:[
        {id:'fi1',mealId:'fm3',title:'Гречка',need:0.8,unit:'кг',home:0.2,purchased:0,price:180,buyer:'',bring:[]},
        {id:'fi2',mealId:'fm3',title:'Тушёнка',need:5,unit:'бан.',home:2,purchased:0,price:230,buyer:'',bring:[]},
        {id:'fi3',mealId:'fm3',title:'Чай',need:20,unit:'пак.',home:20,purchased:0,price:0,buyer:'',bring:[]},
        {id:'fi4',mealId:'fm3',title:'Сахар',need:0.3,unit:'кг',home:0,purchased:0,price:95,buyer:'',bring:[]}
      ],
      mealChecks:{},
      attendance:{fm3:attendance},
      personNotes:{}
    };
  }
  function F(){return ensureFood()}
  function ensureFood(){
    const old=S.foodV31&&typeof S.foodV31==='object'?S.foodV31:null;
    if(!old){S.foodV31=foodSeed()}
    else if(old.version!==VER){
      const migrated={...foodSeed(),...old,version:VER};
      migrated.meals=Array.isArray(old.meals)?old.meals.slice():foodSeed().meals;
      migrated.ingredients=Array.isArray(old.ingredients)?old.ingredients.slice():foodSeed().ingredients;
      const defaultBreakfast=migrated.meals.find(m=>m.id==='fm1'&&m.day==='День 1'&&m.title==='Завтрак'&&m.mode==='self'&&m.time==='07:00');
      if(defaultBreakfast){
        migrated.meals=migrated.meals.filter(m=>m.id!=='fm1');
        migrated.ingredients=migrated.ingredients.filter(i=>i.mealId!=='fm1');
        if(migrated.mealChecks)delete migrated.mealChecks.fm1;
        if(migrated.attendance)delete migrated.attendance.fm1;
      }
      S.foodV31=migrated;
    }
    const f=S.foodV31;
    f.meals=Array.isArray(f.meals)?f.meals:[];
    f.ingredients=Array.isArray(f.ingredients)?f.ingredients:[];
    f.mealChecks=f.mealChecks||{};f.attendance=f.attendance||{};f.personNotes=f.personNotes||{};
    f.meals.forEach(m=>{
      m.mode=MODE[m.mode]?m.mode:'self';m.day=m.day||'День 1';m.time=m.time||'12:00';m.cooks=Array.isArray(m.cooks)?m.cooks:[];m.equipment=Array.isArray(m.equipment)?m.equipment:[];
      f.mealChecks[m.id]=f.mealChecks[m.id]||{};f.attendance[m.id]=f.attendance[m.id]||{};
      (S.participants||[]).forEach(p=>{
        if(!f.mealChecks[m.id][p.id])f.mealChecks[m.id][p.id]={food:false,water:false};
        if(m.mode!=='self'&&!['eat','skip'].includes(f.attendance[m.id][p.id]))f.attendance[m.id][p.id]=p.rsvp==='yes'?'eat':'skip';
      });
    });
    save();return f;
  }
  function mealTime(m){const t=(S.timeline||[]).find(x=>x.id===m.planEventId);return t?.time||m.time||'—'}
  function mealEvent(m){return (S.timeline||[]).find(x=>x.id===m.planEventId)}
  function mealIngredients(id){return F().ingredients.filter(i=>i.mealId===id)}
  function bringQty(i){return (i.bring||[]).reduce((n,x)=>n+(+x.qty||0),0)}
  function secured(i){return Math.max(0,+i.home||0)+Math.max(0,+i.purchased||0)+bringQty(i)}
  function shortage(i){return Math.max(0,(+i.need||0)-secured(i))}
  function mealNeed(m){return mealIngredients(m.id).reduce((n,i)=>n+(shortage(i)>0?1:0),0)}
  function mealBuyPct(m){const a=mealIngredients(m.id);if(!a.length)return 100;const need=a.reduce((n,i)=>n+(+i.need||0),0),closed=a.reduce((n,i)=>n+Math.min(+i.need||0,secured(i)),0);return need?Math.round(closed/need*100):100}
  function eaters(m){return (S.participants||[]).filter(p=>p.rsvp!=='no'&&F().attendance[m.id]?.[p.id]!=='skip').length}
  function portions(m){return Math.max(1,+m.portions||eaters(m)||1)}
  function money(n){return `${Math.round(+n||0).toLocaleString('ru-RU')} ₽`}
  function qtyFmt(n){const x=Math.round((+n||0)*100)/100;return String(x).replace('.',',')}
  function toneForMeal(m){if(m.mode==='self')return 'self';return mealNeed(m)?'warn':'ok'}
  function foodMetric(k,v,s,t=''){return `<div class="f31-metric ${t}"><small>${esc(k)}</small><strong>${esc(v)}</strong><span>${esc(s)}</span></div>`}
  function tabs(){return `<div class="f31-tabs">${[['plan','План питания'],['shopping','Закупки'],['org','Организация']].map(([k,v])=>`<button class="${foodMode===k?'active':''}" data-f31-mode="${k}">${v}</button>`).join('')}</div>`}
  function dayGroups(){const map={};F().meals.slice().sort((a,b)=>a.day.localeCompare(b.day,'ru',{numeric:true})||mealTime(a).localeCompare(mealTime(b))).forEach(m=>(map[m.day]||=[]).push(m));return map}
  function nextDay(){const nums=F().meals.map(m=>+(String(m.day).match(/\d+/)?.[0]||0));return `День ${Math.max(1,...nums)}`}
  function selfCheck(m){const c=F().mealChecks[m.id]?.[S.current]||{food:false,water:false};return `<div class="f31-self-check"><button class="${c.food?'done':''}" data-f31-check="${m.id}:food"><i>${c.food?'✓':''}</i>Еда собрана</button><button class="${c.water?'done':''}" data-f31-check="${m.id}:water"><i>${c.water?'✓':''}</i>Вода собрана</button></div>`}
  function commonActions(m){const a=F().attendance[m.id]?.[S.current]||'eat';return `<div class="f31-attendance"><span>Я участвую в этом приёме пищи</span><button class="${a==='eat'?'active':''}" data-f31-eat="${m.id}:eat">Ем</button><button class="${a==='skip'?'active skip':''}" data-f31-eat="${m.id}:skip">Не ем</button></div>`}
  function mealCard(m){
    const ing=mealIngredients(m.id),pct=mealBuyPct(m),event=mealEvent(m),tone=toneForMeal(m);
    const controls=foodOrganizer()?`<span class="row-actions"><button class="icon-btn" data-f31-edit-meal="${m.id}" title="Изменить">✎</button><button class="icon-btn" data-f31-delete-meal="${m.id}" title="Удалить">×</button></span>`:'';
    return `<article class="f31-meal ${tone}"><div class="f31-meal-time"><strong>${esc(mealTime(m))}</strong><small>${esc(m.location||'')}</small></div><div class="f31-meal-main"><div class="f31-meal-title"><span><b>${esc(m.title)}</b><em class="mode-${m.mode}">${MODE[m.mode][0]}</em>${event?'<button class="f31-linked" data-f31-open-plan type="button">План ↗</button>':''}</span>${controls}</div><p>${esc(m.menu||MODE[m.mode][1])}</p>${m.note?`<small class="f31-note">${esc(m.note)}</small>`:''}${m.mode==='self'?selfCheck(m):commonActions(m)}${m.mode!=='self'?`<div class="f31-meal-stats"><span><b>${eaters(m)}</b> едят</span><span><b>${portions(m)}</b> порций</span><span><b>${pct}%</b> продуктов закрыто</span><span class="${mealNeed(m)?'warn':'ok'}"><b>${mealNeed(m)}</b> позиций докупить</span></div>`:''}${ing.length&&m.mode!=='self'?`<details class="f31-ingredients"><summary>Продукты <b>${ing.length}</b></summary><div>${ing.map(i=>`<div><span><b>${esc(i.title)}</b><small>${qtyFmt(secured(i))}/${qtyFmt(i.need)} ${esc(i.unit)}</small></span><em class="${shortage(i)?'warn':'ok'}">${shortage(i)?`докупить ${qtyFmt(shortage(i))} ${esc(i.unit)}`:'закрыто'}</em></div>`).join('')}</div></details>`:''}</div></article>`;
  }
  function planPageFood(){
    const meals=F().meals,common=meals.filter(m=>m.mode!=='self'),self=meals.filter(m=>m.mode==='self'),open=common.reduce((n,m)=>n+mealNeed(m),0),days=Object.keys(dayGroups()).length;
    return `${foodMetric('Приёмов пищи',meals.length,days?`${days} дн.`:'план пуст')}${foodMetric('Самостоятельно',self.length,'каждый отвечает за себя')}${foodMetric('Общее',common.length,'требует координации')}${foodMetric('Докупить',open,'позиций по общему меню',open?'warn':'ok')}`;
  }
  function planFood(){
    const g=dayGroups(),days=Object.entries(g);
    const body=days.length?days.map(([day,list])=>`<div class="f31-day"><div class="f31-day-head"><b>${esc(day)}</b><span>${list.length} ${list.length===1?'приём':'приёма'} ${foodOrganizer()?`<button class="btn alt sm" data-f31-add-day="${esc(day)}">+ добавить</button>`:''}</span></div>${list.map(mealCard).join('')}</div>`).join(''):`<div class="f31-empty">Питание пока не запланировано. Добавляй только те приёмы пищи, которые реально нужно учитывать.</div>`;
    return `<div class="f31-summary">${planPageFood()}</div><section class="f31-panel"><div class="f31-head"><div><div class="page-kicker">Расписание</div><h2>Когда и как питаемся</h2><p>Завтрак дома не нужно добавлять. В плане остаются только реальные точки питания: например, обед на маршруте, общий ужин и завтрак после ночёвки.</p></div>${foodOrganizer()?'<button class="btn sand" id="f31AddMeal">+ Приём пищи</button>':''}</div>${body}</section>`;
  }

  function aggKey(i){return `${String(i.title).trim().toLowerCase()}|${String(i.unit).trim().toLowerCase()}`}
  function aggregates(){
    const validMeals=new Map(F().meals.filter(m=>m.mode!=='self').map(m=>[m.id,m])),map=new Map();
    F().ingredients.forEach(i=>{const m=validMeals.get(i.mealId);if(!m)return;const k=aggKey(i);if(!map.has(k))map.set(k,{key:k,title:i.title,unit:i.unit,need:0,secured:0,toBuy:0,estimate:0,lines:[],meals:new Set(),buyers:new Set()});const a=map.get(k),sh=shortage(i);a.need+=+i.need||0;a.secured+=Math.min(+i.need||0,secured(i));a.toBuy+=sh;a.estimate+=sh*(+i.price||0);a.lines.push(i);a.meals.add(m.title);if(i.buyer)a.buyers.add(i.buyer)});
    return [...map.values()].sort((a,b)=>b.toBuy-a.toBuy||a.title.localeCompare(b.title,'ru'));
  }
  function shoppingFood(){
    const a=aggregates(),open=a.filter(x=>x.toBuy>0),estimate=open.reduce((n,x)=>n+x.estimate,0),closed=a.filter(x=>x.toBuy<=0).length;
    return `<div class="f31-summary">${foodMetric('Продуктов',a.length,'суммарный список')}${foodMetric('Купить',open.length,'ещё не закрыто',open.length?'warn':'ok')}${foodMetric('Оценка',money(estimate),'по указанным ценам')}${foodMetric('Закрыто',`${closed}/${a.length}`,'есть / принесут / куплено',closed===a.length?'ok':'')}</div><section class="f31-panel"><div class="f31-head"><div><div class="page-kicker">Закупки</div><h2>Единый список продуктов</h2><p>В закупки попадают только общие и смешанные приёмы пищи. Самостоятельное питание сюда не попадает.</p></div></div><div class="f31-shop-list">${a.map(x=>{const done=x.toBuy<=0,buyer=x.buyers.size===1?[...x.buyers][0]:'';return `<article class="f31-shop ${done?'ok':'warn'}"><div><b>${esc(x.title)}</b><small>${[...x.meals].map(esc).join(' · ')}</small></div><div class="f31-shop-numbers"><span>Нужно<b>${qtyFmt(x.need)} ${esc(x.unit)}</b></span><span>Закрыто<b>${qtyFmt(x.secured)} ${esc(x.unit)}</b></span><span>Купить<b>${qtyFmt(x.toBuy)} ${esc(x.unit)}</b></span></div><div class="f31-shop-owner"><label>Покупает<select data-f31-buyer="${encodeURIComponent(x.key)}" ${foodOrganizer()?'':'disabled'}><option value="">Не назначено</option>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${p.id===buyer?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><strong>${x.estimate?money(x.estimate):'цена не задана'}</strong></div><div class="f31-shop-actions">${foodOrganizer()?`<button class="btn ${done?'alt':'sand'} sm" data-f31-purchased="${encodeURIComponent(x.key)}">${done?'Вернуть в список':'Отметить куплено'}</button>`:''}</div></article>`}).join('')||'<div class="f31-empty">Для общих приёмов пищи продукты пока не добавлены.</div>'}</div></section>`;
  }

  function gearState(eq){
    const x=(S.shared||[]).find(g=>g.id===eq.sharedId)||(!eq.sharedId?(S.shared||[]).find(g=>g.title.toLowerCase()===eq.title.toLowerCase()):null);if(!x)return{kind:'none',text:'Не добавлено в снаряжение',x:null};
    const assigned=(x.a||[]).reduce((n,a)=>n+(+a[1]||0),0),confirmed=(x.a||[]).reduce((n,a)=>n+((x.confirmed||[]).includes(a[0])?(+a[1]||0):0),0),need=+x.need||1;
    if(assigned<need)return{kind:'risk',text:`Дефицит ${need-assigned}`,x};if(confirmed<need)return{kind:'warn',text:'Нужно подтвердить',x};return{kind:'ok',text:'Готово',x};
  }
  function orgFood(){
    const common=F().meals.filter(m=>m.mode!=='self');
    return `<div class="f31-summary">${foodMetric('Общих приёмов',common.length,'требуют координации')}${foodMetric('Повара',new Set(common.flatMap(m=>m.cooks)).size,'назначено людей')}${foodMetric('Оборудование',common.reduce((n,m)=>n+m.equipment.length,0),'связи со снаряжением')}${foodMetric('Особенности',Object.values(F().personNotes).filter(Boolean).length,'комментарии участников')}</div><section class="f31-panel"><div class="f31-head"><div><div class="page-kicker">Организация</div><h2>Кто покупает, готовит и что требуется</h2><p>Самостоятельные обеды здесь не мешают: организационный блок показывает только общие и смешанные приёмы пищи.</p></div></div>${common.map(m=>`<article class="f31-org-meal"><div class="f31-org-title"><div><b>${esc(mealTime(m))} · ${esc(m.title)}</b><small>${esc(m.menu||'')}</small></div>${foodOrganizer()?`<button class="btn alt sm" data-f31-edit-meal="${m.id}">Настроить</button>`:''}</div><div class="f31-org-grid"><div><span>Готовят</span><strong>${m.cooks.length?m.cooks.map(pn).map(esc).join(', '):'не назначено'}</strong></div><div><span>Участники</span><strong>${eaters(m)} едят · ${portions(m)} порций</strong></div><div><span>Закупки</span><strong>${mealBuyPct(m)}% закрыто · ${mealNeed(m)} докупить</strong></div></div><div class="f31-equipment"><div class="f31-subhead"><b>Оборудование</b>${foodOrganizer()?`<button data-f31-eq-add="${m.id}">+ добавить требование</button>`:''}</div>${m.equipment.length?m.equipment.map((eq,idx)=>{const st=gearState(eq);return `<div class="f31-eq"><span><b>${esc(eq.title)}</b><small class="${st.kind}">${esc(st.text)}</small></span><div>${st.x?`<button class="btn alt sm" data-f31-open-gear="${st.x.id}">Снаряжение ↗</button>`:(foodOrganizer()?`<button class="btn sand sm" data-f31-link-gear="${m.id}:${idx}">Добавить в снаряжение</button>`:'')} ${foodOrganizer()?`<button class="icon-btn" data-f31-eq-del="${m.id}:${idx}" title="Удалить">×</button>`:''}</div></div>`}).join(''):'<div class="f31-empty compact">Требования к оборудованию не заданы.</div>'}</div></article>`).join('')||'<div class="f31-empty">Общих приёмов пищи пока нет.</div>'}</section>`;
  }

  function foodPage(){ensureFood();return `${pageHead('Подготовка','Питание','Гибкое расписание питания: добавляй только нужные приёмы, выбирай «Самостоятельно» или «Общее», управляй закупками и готовкой.',foodOrganizer()?'<button class="btn sand" id="f31AddMealTop">+ Приём пищи</button>':'')}${tabs()}<div class="f31-content">${foodMode==='plan'?planFood():foodMode==='shopping'?shoppingFood():orgFood()}</div>${personNoteBlock()}`}
  function personNoteBlock(){const v=F().personNotes[S.current]||'';return `<section class="f31-note-panel"><div><b>Пищевые особенности</b><small>Комментарий только для этого мероприятия: что важно учесть при общем меню.</small></div><textarea id="f31PersonNote" rows="2" placeholder="Например: не ем тушёнку">${esc(v)}</textarea></section>`}

  function modalShell(title,body,actions){const l=document.getElementById('modalLayer');if(!l)return null;l.innerHTML=`<div class="f31-backdrop" data-f31-close></div><div class="f31-modal"><div class="f31-modal-head"><b>${title}</b><button data-f31-close>×</button></div><div class="f31-modal-body">${body}</div><div class="f31-modal-foot">${actions}</div></div>`;l.classList.add('open');l.setAttribute('aria-hidden','false');l.querySelectorAll('[data-f31-close]').forEach(b=>b.onclick=closeFoodModal);return l}
  function closeFoodModal(){const l=document.getElementById('modalLayer');if(!l)return;l.classList.remove('open');l.setAttribute('aria-hidden','true');l.innerHTML=''}
  function removeMeal(id,fromModal=false){
    const m=F().meals.find(x=>x.id===id);if(!m)return;if(!confirm(`Удалить «${m.title}» из плана питания?`))return;
    F().meals=F().meals.filter(x=>x.id!==id);F().ingredients=F().ingredients.filter(x=>x.mealId!==id);delete F().mealChecks[id];delete F().attendance[id];save();if(fromModal)closeFoodModal();render();
  }
  function mealModal(id='',presetDay=''){
    const edit=!!id,m=edit?F().meals.find(x=>x.id===id):{day:presetDay||nextDay(),time:'12:00',title:'',mode:'self',location:'',menu:'',note:'',portions:0,planEventId:'',cooks:[],equipment:[]};if(!m)return;
    const presetSelect=!edit?`<label>Быстрый шаблон<select id="f31Preset">${Object.entries(MEAL_PRESETS).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select><small>Завтрак дома в первый день вообще не нужно создавать. Добавляй завтрак только после ночёвки или когда он реально организуется.</small></label>`:'';
    const body=`${presetSelect}<div class="f31-form-row"><label>День<input id="f31Day" value="${esc(m.day)}" placeholder="День 1"></label><label>Время<input id="f31Time" type="time" value="${esc(m.time)}"></label></div><label>Название<input id="f31Title" value="${esc(m.title)}" placeholder="Обед / Ужин / Завтрак / Перекус"></label><div class="f31-form-row"><label>Как питаемся<select id="f31MealMode">${Object.entries(MODE).map(([k,v])=>`<option value="${k}" ${m.mode===k?'selected':''}>${v[0]}</option>`).join('')}</select></label><label>Место<input id="f31Location" value="${esc(m.location||'')}"></label></div><label>Связать с событием «Плана»<select id="f31Plan"><option value="">Не связано</option>${(S.timeline||[]).map(t=>`<option value="${t.id}" ${m.planEventId===t.id?'selected':''}>${esc(t.time)} · ${esc(t.title)}</option>`).join('')}</select><small>Если связано, время в «Питании» берётся из события плана.</small></label><label>Меню / что взять<textarea id="f31Menu" rows="2">${esc(m.menu||'')}</textarea></label><label>Комментарий<textarea id="f31Note" rows="2">${esc(m.note||'')}</textarea></label><label id="f31PortionsWrap">Порций<input id="f31Portions" type="number" min="0" value="${+m.portions||0}"><small>0 = по числу участников, которые выбрали «Ем».</small></label><fieldset id="f31Cooks"><legend>Готовят</legend>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<label><input type="checkbox" value="${p.id}" ${m.cooks.includes(p.id)?'checked':''}> ${esc(p.name)}</label>`).join('')}</fieldset><div id="f31IngredientsWrap"><div class="f31-subhead"><b>Продукты этого приёма</b>${edit?'<button type="button" id="f31AddIngredient">+ продукт</button>':''}</div>${edit?ingredientEditorList(m.id):'<small>Сначала сохраните общий приём пищи, затем добавьте продукты.</small>'}</div>`;
    const actions=`${edit?'<button class="btn risk" id="f31DeleteMeal">Удалить</button>':''}<span></span><button class="btn alt" data-f31-close>Отмена</button><button class="btn sand" id="f31SaveMeal">${edit?'Сохранить':'Добавить'}</button>`;
    const l=modalShell(edit?'Настроить приём пищи':'Добавить приём пищи',body,actions);if(!l)return;
    const toggle=()=>{const common=document.getElementById('f31MealMode').value!=='self';document.getElementById('f31PortionsWrap').style.display=common?'grid':'none';document.getElementById('f31Cooks').style.display=common?'grid':'none';document.getElementById('f31IngredientsWrap').style.display=common?'block':'none'};
    const applyPreset=()=>{const p=MEAL_PRESETS[document.getElementById('f31Preset')?.value];if(!p)return;const day=document.getElementById('f31Day').value;document.getElementById('f31Title').value=p.title;document.getElementById('f31Time').value=p.time;document.getElementById('f31MealMode').value=p.mode;document.getElementById('f31Location').value=p.location;document.getElementById('f31Menu').value=p.menu;document.getElementById('f31Note').value=p.note;document.getElementById('f31Day').value=day;toggle()};
    document.getElementById('f31MealMode').onchange=toggle;toggle();
    if(!edit){document.getElementById('f31Preset').onchange=applyPreset;document.getElementById('f31Preset').value=presetDay?'custom':'lunch';if(!presetDay)applyPreset()}
    document.getElementById('f31AddIngredient')?.addEventListener('click',()=>ingredientModal(m.id));
    document.querySelectorAll('[data-f31-edit-ing]').forEach(b=>b.onclick=()=>ingredientModal(m.id,b.dataset.f31EditIng));
    document.getElementById('f31DeleteMeal')?.addEventListener('click',()=>removeMeal(m.id,true));
    document.getElementById('f31SaveMeal').onclick=()=>{
      const title=document.getElementById('f31Title').value.trim();if(!title)return toast('Укажи название приёма пищи');
      const mode=document.getElementById('f31MealMode').value;
      const patch={day:document.getElementById('f31Day').value.trim()||'День 1',time:document.getElementById('f31Time').value||'12:00',title,mode,location:document.getElementById('f31Location').value.trim(),planEventId:document.getElementById('f31Plan').value,menu:document.getElementById('f31Menu').value.trim(),note:document.getElementById('f31Note').value.trim(),portions:mode==='self'?0:Math.max(0,+document.getElementById('f31Portions').value||0),cooks:mode==='self'?[]:[...document.querySelectorAll('#f31Cooks input:checked')].map(x=>x.value)};
      if(edit){Object.assign(m,patch);if(mode==='self')m.equipment=[];else if(!m.equipment.length)m.equipment=DEFAULT_EQUIPMENT.map(title=>({title,sharedId:''}))}
      else{const nm={id:'fm_'+Date.now(),equipment:mode==='self'?[]:DEFAULT_EQUIPMENT.map(title=>({title,sharedId:''})),...patch};F().meals.push(nm);F().mealChecks[nm.id]={};F().attendance[nm.id]={};S.participants.forEach(p=>{F().mealChecks[nm.id][p.id]={food:false,water:false};F().attendance[nm.id][p.id]=p.rsvp==='yes'?'eat':'skip'})}
      save();closeFoodModal();render();
    };
  }
  function ingredientEditorList(mealId){const a=mealIngredients(mealId);return a.length?`<div class="f31-ing-edit-list">${a.map(i=>`<button type="button" data-f31-edit-ing="${i.id}"><span><b>${esc(i.title)}</b><small>${qtyFmt(i.need)} ${esc(i.unit)} · дома ${qtyFmt(i.home)} · купить ${qtyFmt(shortage(i))}</small></span><em>✎</em></button>`).join('')}</div>`:'<small>Продукты пока не добавлены.</small>'}
  function ingredientModal(mealId,id=''){
    const edit=!!id,i=edit?F().ingredients.find(x=>x.id===id):{title:'',need:1,unit:'шт.',home:0,purchased:0,price:0,buyer:'',bring:[]};if(!i)return;
    const bring=(i.bring||[])[0]||{pid:'',qty:0};
    const body=`<label>Продукт<input id="f31IngTitle" value="${esc(i.title)}"></label><div class="f31-form-row"><label>Нужно<input id="f31IngNeed" type="number" min="0" step="0.1" value="${i.need}"></label><label>Единица<input id="f31IngUnit" value="${esc(i.unit)}"></label></div><div class="f31-form-row"><label>Уже есть у группы<input id="f31IngHome" type="number" min="0" step="0.1" value="${i.home||0}"></label><label>Ориентир цены за единицу, ₽<input id="f31IngPrice" type="number" min="0" step="1" value="${i.price||0}"></label></div><label>Кто покупает<select id="f31IngBuyer"><option value="">Не назначено</option>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${i.buyer===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="f31-form-row"><label>Кто принесёт из дома<select id="f31IngBring"><option value="">Никто</option>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${bring.pid===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Количество<input id="f31IngBringQty" type="number" min="0" step="0.1" value="${bring.qty||0}"></label></div>`;
    const actions=`${edit?'<button class="btn risk" id="f31DeleteIng">Удалить</button>':''}<span></span><button class="btn alt" data-f31-close>Отмена</button><button class="btn sand" id="f31SaveIng">Сохранить</button>`;
    const l=modalShell(edit?'Изменить продукт':'Добавить продукт',body,actions);if(!l)return;
    document.getElementById('f31DeleteIng')?.addEventListener('click',()=>{F().ingredients=F().ingredients.filter(x=>x.id!==i.id);save();closeFoodModal();mealModal(mealId)});
    document.getElementById('f31SaveIng').onclick=()=>{const title=document.getElementById('f31IngTitle').value.trim();if(!title)return toast('Укажи продукт');const pid=document.getElementById('f31IngBring').value,q=Math.max(0,+document.getElementById('f31IngBringQty').value||0),patch={mealId,title,need:Math.max(0,+document.getElementById('f31IngNeed').value||0),unit:document.getElementById('f31IngUnit').value.trim()||'шт.',home:Math.max(0,+document.getElementById('f31IngHome').value||0),price:Math.max(0,+document.getElementById('f31IngPrice').value||0),buyer:document.getElementById('f31IngBuyer').value,bring:pid&&q?[{pid,qty:q,confirmed:false}]:[]};if(edit)Object.assign(i,patch);else F().ingredients.push({id:'fi_'+Date.now(),purchased:0,...patch});save();closeFoodModal();mealModal(mealId)};
  }
  function purchaseToggle(key){const a=aggregates().find(x=>x.key===key);if(!a)return;const done=a.toBuy<=0;a.lines.forEach(i=>{if(done)i.purchased=0;else i.purchased=Math.max(0,(+i.need||0)-Math.max(0,+i.home||0)-bringQty(i))});save();render()}
  function buyerSet(key,pid){const a=aggregates().find(x=>x.key===key);if(!a)return;a.lines.forEach(i=>i.buyer=pid);save();render()}
  function addEquipment(mealId){const m=F().meals.find(x=>x.id===mealId);if(!m)return;const title=prompt('Что требуется для приготовления?','Котёл');if(!title?.trim())return;m.equipment.push({title:title.trim(),sharedId:''});save();render()}
  function removeEquipment(mealId,idx){const m=F().meals.find(x=>x.id===mealId);if(!m)return;m.equipment.splice(+idx,1);save();render()}
  function linkGear(mealId,idx){
    const m=F().meals.find(x=>x.id===mealId),eq=m?.equipment?.[+idx];if(!eq)return;let x=(S.shared||[]).find(g=>g.title.toLowerCase()===eq.title.toLowerCase());
    if(!x){const id='gfood_'+Date.now();x={id,title:eq.title,need:1,a:[],confirmed:[]};S.shared.push(x);if(S.gearV30){S.gearV30.meta=S.gearV30.meta||{};S.gearV30.meta[id]={unit:'шт.',cat:'food',type:'item',desc:`Требуется для питания: ${m.title}`,kit:[]};S.gearV30.kits=S.gearV30.kits||{};S.gearV30.kits[id]={}}}
    eq.sharedId=x.id;save();render();toast('Связано со снаряжением');
  }
  function openGear(){tab='gear';render()}

  function bindFood(){
    document.body.classList.toggle('f31-active',tab==='food');if(tab!=='food')return;
    document.querySelectorAll('[data-f31-mode]').forEach(b=>b.onclick=()=>{foodMode=b.dataset.f31Mode;render()});
    document.querySelectorAll('[data-f31-check]').forEach(b=>b.onclick=()=>{const [mid,k]=b.dataset.f31Check.split(':');F().mealChecks[mid][S.current][k]=!F().mealChecks[mid][S.current][k];save();render()});
    document.querySelectorAll('[data-f31-eat]').forEach(b=>b.onclick=()=>{const [mid,v]=b.dataset.f31Eat.split(':');F().attendance[mid][S.current]=v;save();render()});
    document.querySelectorAll('[data-f31-edit-meal]').forEach(b=>b.onclick=()=>mealModal(b.dataset.f31EditMeal));
    document.querySelectorAll('[data-f31-delete-meal]').forEach(b=>b.onclick=()=>removeMeal(b.dataset.f31DeleteMeal));
    document.querySelectorAll('[data-f31-add-day]').forEach(b=>b.onclick=()=>mealModal('',b.dataset.f31AddDay));
    document.getElementById('f31AddMeal')?.addEventListener('click',()=>mealModal());document.getElementById('f31AddMealTop')?.addEventListener('click',()=>mealModal());
    document.querySelectorAll('[data-f31-purchased]').forEach(b=>b.onclick=()=>purchaseToggle(decodeURIComponent(b.dataset.f31Purchased)));
    document.querySelectorAll('[data-f31-buyer]').forEach(s=>s.onchange=()=>buyerSet(decodeURIComponent(s.dataset.f31Buyer),s.value));
    document.querySelectorAll('[data-f31-eq-add]').forEach(b=>b.onclick=()=>addEquipment(b.dataset.f31EqAdd));
    document.querySelectorAll('[data-f31-eq-del]').forEach(b=>b.onclick=()=>{const [mid,idx]=b.dataset.f31EqDel.split(':');removeEquipment(mid,idx)});
    document.querySelectorAll('[data-f31-link-gear]').forEach(b=>b.onclick=()=>{const [mid,idx]=b.dataset.f31LinkGear.split(':');linkGear(mid,idx)});
    document.querySelectorAll('[data-f31-open-gear]').forEach(b=>b.onclick=openGear);
    document.querySelectorAll('[data-f31-open-plan]').forEach(b=>b.onclick=()=>{tab='plan';render()});
    const note=document.getElementById('f31PersonNote');if(note)note.onchange=()=>{F().personNotes[S.current]=note.value.trim();save();toast('Комментарий сохранён')};
  }

  if(!NAV.some(x=>x[0]==='food')){const gearAt=NAV.findIndex(x=>x[0]==='gear');NAV.splice(gearAt+1,0,['food','Питание'])}
  const baseRenderNav=renderNav;
  renderNav=function(){baseRenderNav();document.querySelectorAll('[data-mobile="more"]').forEach(b=>b.classList.toggle('active',['participants','roles','plan','food'].includes(tab)))};
  toggleMobileSheet=function(){const sh=document.getElementById('mobileSheet');sh.innerHTML=[['food','Питание'],['participants','Участники'],['roles','Роли'],['plan','План']].map(([id,label])=>`<button type="button" data-sheet-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');sh.classList.toggle('open');sh.setAttribute('aria-hidden',sh.classList.contains('open')?'false':'true');sh.querySelectorAll('[data-sheet-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.sheetTab;closeMobileSheet();render()})};
  const baseRender=render;
  render=function(){if(tab!=='food')return baseRender();renderNav();const who=document.getElementById('who');who.innerHTML=S.participants.map(p=>`<option value="${p.id}" ${p.id===S.current?'selected':''}>${esc(p.name)}</option>`).join('');document.getElementById('app').innerHTML=foodPage();bind()};
  const baseBind=bind;bind=function(){baseBind();bindFood()};
  ensureFood();document.querySelector('.build-label')?.replaceChildren(document.createTextNode('V27 · питание · гибкий график'));render();
})();

;/* source: hikes-preview/yandex-js-v34.js */
/* V34 — Yandex Maps JavaScript API as the interactive city basemap under Leaflet editing overlays. */
(() => {
  'use strict';

  const RL_YANDEX_JS_API_KEY = 'ec183557-30ee-4662-86c4-c363798c6092';
  const state = {
    loader: null,
    map: null,
    host: null,
    status: null,
    raf: 0,
    failed: false
  };

  function setStatus(text = '', type = '') {
    const el = state.status || document.getElementById('studioYandexStatusV34');
    if (!el) return;
    state.status = el;
    el.textContent = text;
    el.className = `studio-yandex-status-v34${text ? ' is-visible' : ''}${type ? ` is-${type}` : ''}`;
  }

  function ensureHost() {
    const wrap = document.querySelector('.studio-map-wrap-v21');
    const leaflet = document.getElementById('studioMapV21');
    if (!wrap || !leaflet) return null;

    let host = document.getElementById('studioYandexV34');
    if (!host) {
      host = document.createElement('div');
      host.id = 'studioYandexV34';
      host.className = 'studio-yandex-v34';
      host.setAttribute('aria-hidden', 'true');
      wrap.insertBefore(host, leaflet);
    }

    let status = document.getElementById('studioYandexStatusV34');
    if (!status) {
      status = document.createElement('div');
      status.id = 'studioYandexStatusV34';
      status.className = 'studio-yandex-status-v34';
      wrap.appendChild(status);
    }

    state.host = host;
    state.status = status;
    return { wrap, host, status };
  }

  function loadYandex() {
    if (window.ymaps3?.ready) return window.ymaps3.ready.then(() => window.ymaps3);
    if (state.loader) return state.loader;

    state.loader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-rl-yandex-v34]');
      const finish = () => {
        if (!window.ymaps3?.ready) {
          reject(new Error('Yandex Maps API did not expose ymaps3'));
          return;
        }
        window.ymaps3.ready.then(() => resolve(window.ymaps3)).catch(reject);
      };

      if (existing) {
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.dataset.rlYandexV34 = '1';
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(RL_YANDEX_JS_API_KEY)}&lang=ru_RU`;
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once: true });
      document.head.appendChild(script);
    });

    return state.loader;
  }

  function currentLeafletLocation() {
    if (typeof studioV21 === 'undefined' || !studioV21.map) return null;
    const c = studioV21.map.getCenter();
    return { center: [c.lng, c.lat], zoom: studioV21.map.getZoom() };
  }

  function syncYandexNow() {
    state.raf = 0;
    if (!state.map || typeof studioV21 === 'undefined' || studioV21.base !== 'city') return;
    const location = currentLeafletLocation();
    if (!location) return;
    try {
      state.map.setLocation({ ...location, duration: 0 });
    } catch (error) {
      console.warn('Yandex basemap sync failed', error);
    }
  }

  function scheduleSync() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(syncYandexNow);
  }

  async function ensureYandexMap() {
    const shell = ensureHost();
    if (!shell) return;
    setStatus('Загрузка Яндекс Карт…', 'loading');

    try {
      const ymaps3 = await loadYandex();
      if (!document.getElementById('studioYandexV34')) return;

      if (!state.map) {
        const location = currentLeafletLocation() || { center: [37.93, 55.59], zoom: 13 };
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;
        state.map = new YMap(shell.host, {
          location,
          behaviors: [],
          mode: 'raster',
          theme: 'light',
          zoomRange: { min: 3, max: 20 }
        }, [
          new YMapDefaultSchemeLayer(),
          new YMapDefaultFeaturesLayer()
        ]);
      }

      state.failed = false;
      setStatus('');
      scheduleSync();
    } catch (error) {
      state.failed = true;
      console.error('Yandex Maps initialization failed', error);
      setStatus('Яндекс Карты не загрузились. Проверьте HTTP Referer ключа.', 'error');
    }
  }

  function removeLeafletTile() {
    if (typeof studioV21 === 'undefined' || !studioV21.map || !studioV21.tile) return;
    try {
      if (studioV21.map.hasLayer(studioV21.tile)) studioV21.map.removeLayer(studioV21.tile);
    } catch (error) {
      console.warn('Leaflet tile cleanup failed', error);
    }
    studioV21.tile = null;
  }

  function enableYandex() {
    const shell = ensureHost();
    if (!shell || typeof studioV21 === 'undefined') return;
    shell.wrap.classList.add('is-yandex-v34');
    removeLeafletTile();
    ensureYandexMap();
  }

  function disableYandex() {
    const wrap = document.querySelector('.studio-map-wrap-v21');
    wrap?.classList.remove('is-yandex-v34');
    setStatus('');
  }

  function destroyYandex() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    try { state.map?.destroy(); } catch (error) { console.warn('Yandex map destroy failed', error); }
    state.map = null;
    state.host = null;
    state.status = null;
  }

  if (typeof MAP_BASES_V21 !== 'undefined' && MAP_BASES_V21.city) {
    MAP_BASES_V21.city.label = 'Яндекс';
    MAP_BASES_V21.city.hint = 'Яндекс Карты · JavaScript API';
  }
  if (typeof ATLAS_SOURCES_V20 !== 'undefined' && ATLAS_SOURCES_V20.yandex) {
    ATLAS_SOURCES_V20.yandex.label = 'Яндекс · схема (Tiles API)';
  }

  if (typeof setStudioBaseV21 === 'function') {
    const setStudioBaseOriginal = setStudioBaseV21;
    setStudioBaseV21 = function setStudioBaseWithYandexV34(kind) {
      if (kind !== 'city') {
        disableYandex();
        return setStudioBaseOriginal(kind);
      }
      if (typeof studioV21 === 'undefined' || !studioV21.map) return;
      studioV21.base = 'city';
      try { saveStudioPrefsV21(); } catch (error) {}
      document.querySelectorAll('[data-studio-base]').forEach((button) => {
        button.classList.toggle('active', button.dataset.studioBase === 'city');
      });
      enableYandex();
      try { renderStudioInspectorV21(); } catch (error) {}
    };
  }

  if (typeof mountStudioMapV21 === 'function') {
    const mountStudioMapOriginal = mountStudioMapV21;
    mountStudioMapV21 = function mountStudioMapWithYandexV34() {
      mountStudioMapOriginal();
      if (typeof studioV21 === 'undefined' || !studioV21.map) return;
      if (!studioV21.__yandexV34Bound) {
        studioV21.__yandexV34Bound = true;
        studioV21.map.on('move zoom moveend zoomend resize', scheduleSync);
      }
      if (studioV21.base === 'city') enableYandex();
    };
  }

  if (typeof closeStudioV21 === 'function') {
    const closeStudioOriginal = closeStudioV21;
    closeStudioV21 = function closeStudioWithYandexV34(force = false) {
      const result = closeStudioOriginal(force);
      if (typeof studioV21 === 'undefined' || !studioV21.open) destroyYandex();
      return result;
    };
  }

  const build = document.querySelector('.build-label');
  if (build) build.textContent = 'V34 · Яндекс Карты подключены';
})();


;/* source: hikes-preview/operations-v36.js */
/* V36 — operational planner: editable gear, compact roles, recipe/water planning and Yandex on the route map. */
(() => {
  'use strict';

  const BUILD = 'V36 · планировщик снаряжения, питания и воды';
  const YANDEX_KEY = 'ec183557-30ee-4662-86c4-c363798c6092';
  const STATUS = {
    ready: ['Готово', 'ok'],
    check: ['Проверить', 'warn'],
    borrow: ['Нужно одолжить', 'risk'],
    missing: ['Нет / не готово', 'risk'],
    unset: ['Не отмечено', '']
  };
  const PRIORITY = { required: 'Обязательно', weather: 'По погоде', recommended: 'Рекомендуется' };
  const DEFAULT_CATS = {
    pack: ['Рюкзак и упаковка', 'Укладка, защита вещей и переноска.'],
    clothing: ['Одежда и обувь', 'Слои, обувь и защита по погоде.'],
    food: ['Вода и питание', 'Личный запас воды и ходовой еды.'],
    light: ['Свет и инструмент', 'Фонарь и минимальный бытовой инструмент.'],
    nav: ['Навигация и связь', 'Телефон, офлайн-карта, питание электроники.'],
    health: ['Аптечка и здоровье', 'Личные лекарства и мелкая первая помощь.'],
    hygiene: ['Гигиена', 'Минимум для маршрута и ночёвки.'],
    docs: ['Документы', 'Документы, деньги и офлайн-контакты.'],
    other: ['Прочее', 'Дополнительные вещи этого похода.']
  };
  const ROLE_DEFS = [
    ['lead', 'Руководитель', 'Общее решение по мероприятию: состав, сроки, старт, остановка и изменение плана.'],
    ['nav', 'Навигатор', 'Маршрут, карта, контрольные точки, ориентиры и запасной вариант движения.'],
    ['safety', 'Замыкающий / безопасность', 'Целостность группы, темп, состояние участников и базовая безопасность на маршруте.'],
    ['logistics', 'Завхоз', 'Групповое имущество, питание, вода и закупки.'],
    ['medic', 'Медик', 'Подготовка и проверка общей аптечки.'],
    ['photographer', 'Фотограф / летописец', 'Взять фотоаппарат, снимать поход и собрать материалы.'],
    ['cook', 'Повар', 'Приготовление еды. При необходимости руководитель отдельно поручает управление меню.']
  ];
  const SKILLS = [
    ['firstAid', 'Первая помощь'],
    ['driver', 'Водитель'],
    ['cook', 'Готовка'],
    ['radio', 'Радиосвязь']
  ];

  let gearMode36 = 'mine';
  let foodMode36 = 'plan';
  const openGearCats36 = new Set(['pack']);
  let yandexLoader36 = null;
  let routeYandex36 = { map: null, host: null, status: null, leaflet: null, raf: 0, active: false };

  const copy = (v) => JSON.parse(JSON.stringify(v));
  const num = (v, fallback = 0) => Number.isFinite(+v) ? +v : fallback;
  const fmt = (v, digits = 2) => {
    const n = Math.round((+v || 0) * (10 ** digits)) / (10 ** digits);
    return String(n).replace('.', ',');
  };
  const activePeople36 = () => (S.participants || []).filter(p => p.rsvp === 'yes');
  const allRelevantPeople36 = () => (S.participants || []).filter(p => p.rsvp !== 'no');

  function ensureRoles36() {
    if (!S.rolesV36) {
      const old = copy(S.roles || []);
      const find = (...names) => old.find(r => names.includes(r.title) && r.p)?.p || '';
      const roles = ROLE_DEFS.map(([id, title, desc]) => ({ id, title, desc, p: '' }));
      roles.find(r => r.id === 'lead').p = find('Руководитель');
      roles.find(r => r.id === 'nav').p = find('Навигатор');
      roles.find(r => r.id === 'safety').p = find('Замыкающий', 'Первая помощь');
      roles.find(r => r.id === 'logistics').p = find('Транспорт', 'Снаряжение', 'Питание', 'Связь');
      const skills = {};
      (S.participants || []).forEach(p => skills[p.id] = []);
      const addSkill = (pid, skill) => { if (pid && skills[pid] && !skills[pid].includes(skill)) skills[pid].push(skill); };
      old.filter(r => r.title === 'Первая помощь').forEach(r => addSkill(r.p, 'firstAid'));
      old.filter(r => r.title === 'Связь').forEach(r => addSkill(r.p, 'radio'));
      Object.values(S.cars || {}).flat().forEach(c => addSkill(c.driver, 'driver'));
      (S.foodV31?.meals || []).flatMap(m => m.cooks || []).forEach(pid => addSkill(pid, 'cook'));
      S.rolesV36 = { version: 1, roles, skills, legacy: old };
    }
    const r = S.rolesV36;
    r.roles = Array.isArray(r.roles) ? r.roles : [];
    ROLE_DEFS.forEach(([id, title, desc]) => {
      let row = r.roles.find(x => x.id === id);
      if (!row) { row = { id, title, desc, p: '' }; r.roles.push(row); }
      if (!row.title || (id === 'logistics' && row.title === 'Логистика и снабжение')) row.title = title;
      if (!row.desc) row.desc = desc;
    });
    r.candidates ||= {};
    r.roles.forEach(x => { r.candidates[x.id] ||= []; });
    r.skills ||= {};
    (S.participants || []).forEach(p => { if (!Array.isArray(r.skills[p.id])) r.skills[p.id] = []; });
    S.roles = r.roles.map(x => ({ id: `v36_${x.id}`, title: x.title, p: x.p || '', critical: ['lead','nav','logistics'].includes(x.id), desc: x.desc }));
  }

  function ensureGear36() {
    if (!S.gearV36) {
      const categories = {};
      Object.entries(DEFAULT_CATS).forEach(([id, [title, desc]]) => categories[id] = { id, title, desc });
      const source = Array.isArray(S.personal) ? S.personal : [];
      const items = source.map((i, idx) => ({
        id: i.id || `gi_${idx}`,
        title: i.title || 'Предмет',
        category: i.category || 'other',
        priority: PRIORITY[i.priority] ? i.priority : 'recommended',
        help: i.help || '',
        weightKg: num(i.weightKg, 0)
      }));
      const status = copy(S.gearV30?.status || {});
      (S.participants || []).forEach(p => {
        status[p.id] ||= {};
        items.forEach(i => {
          if (!STATUS[status[p.id][i.id]]) status[p.id][i.id] = (S.checks?.[p.id] || []).includes(i.id) ? 'ready' : 'unset';
        });
      });
      S.gearV36 = { version: 1, categories, items, status };
    }
    const g = S.gearV36;
    g.categories ||= {};
    Object.entries(DEFAULT_CATS).forEach(([id, [title, desc]]) => { if (!g.categories[id]) g.categories[id] = { id, title, desc }; });
    g.items = Array.isArray(g.items) ? g.items : [];
    g.status ||= {};
    (S.participants || []).forEach(p => {
      g.status[p.id] ||= {};
      g.items.forEach(i => { if (!STATUS[g.status[p.id][i.id]]) g.status[p.id][i.id] = 'unset'; });
    });
    g.items.forEach(i => { if (!g.categories[i.category]) g.categories[i.category] = { id: i.category, title: i.category, desc: '' }; });
    syncGear36(false);
  }

  function syncGear36(write = true) {
    const g = S.gearV36;
    if (!g) return;
    S.personal = g.items.map(i => ({ id: i.id, title: i.title, category: i.category, priority: i.priority, help: i.help, weightKg: i.weightKg || 0 }));
    S.checks ||= {};
    (S.participants || []).forEach(p => {
      S.checks[p.id] = g.items.filter(i => g.status[p.id]?.[i.id] === 'ready').map(i => i.id);
    });
    if (write) save();
  }

  function ensureFood36() {
    const f31 = S.foodV31 ||= { version: 2, meals: [], ingredients: [], mealChecks: {}, attendance: {}, personNotes: {} };
    f31.meals = Array.isArray(f31.meals) ? f31.meals : [];
    f31.ingredients = Array.isArray(f31.ingredients) ? f31.ingredients : [];
    f31.mealChecks ||= {}; f31.attendance ||= {}; f31.personNotes ||= {};
    if (!S.foodV36) {
      S.foodV36 = {
        version: 1,
        reservePct: 10,
        water: { drinkPerPerson: 2, cookingLiters: 2, reservePct: 10, refillLiters: 0, assignments: {} }
      };
    }
    const f = S.foodV36;
    f.reservePct = Math.max(0, num(f.reservePct, 10));
    f.water ||= { drinkPerPerson: 2, cookingLiters: 2, reservePct: 10, refillLiters: 0, assignments: {} };
    f.water.assignments ||= {};
    (S.participants || []).forEach(p => { if (!Number.isFinite(+f.water.assignments[p.id])) f.water.assignments[p.id] = 0; });
    f31.meals.forEach(m => {
      m.mode = ['self', 'common', 'hybrid'].includes(m.mode) ? m.mode : 'self';
      m.day ||= 'День 1'; m.time ||= '12:00'; m.title ||= 'Приём пищи';
      f31.mealChecks[m.id] ||= {};
      f31.attendance[m.id] ||= {};
      (S.participants || []).forEach(p => {
        f31.mealChecks[m.id][p.id] ||= { food: false, water: false };
        if (!['eat', 'skip'].includes(f31.attendance[m.id][p.id])) f31.attendance[m.id][p.id] = p.rsvp === 'yes' ? 'eat' : 'skip';
      });
    });
    f31.ingredients.forEach(i => {
      const m = f31.meals.find(x => x.id === i.mealId);
      if (!m) return;
      if (!Number.isFinite(+i.perPerson)) {
        const p = mealPortions36(m);
        const reserve = 1 + f.reservePct / 100;
        i.perPerson = p > 0 && reserve > 0 ? num(i.need, 0) / p / reserve : 0;
      }
      i.home = Math.max(0, num(i.home));
      i.purchased = Math.max(0, num(i.purchased));
      i.price = Math.max(0, num(i.price));
      i.bring = Array.isArray(i.bring) ? i.bring : [];
      i.unit ||= 'шт.';
      i.title ||= 'Продукт';
    });
    syncFood36(false);
  }

  function mealPortions36(m) {
    if (num(m.portions) > 0) return Math.max(1, Math.round(num(m.portions)));
    const attendees = (S.participants || []).filter(p => p.rsvp !== 'no' && S.foodV31?.attendance?.[m.id]?.[p.id] !== 'skip');
    return Math.max(1, attendees.length || activePeople36().length || 1);
  }

  function ingredientNeed36(i) {
    const m = S.foodV31?.meals?.find(x => x.id === i.mealId);
    if (!m) return 0;
    return Math.max(0, num(i.perPerson) * mealPortions36(m) * (1 + num(S.foodV36?.reservePct, 0) / 100));
  }

  function bringQty36(i) { return (i.bring || []).reduce((n, x) => n + Math.max(0, num(x.qty)), 0); }
  function ingredientCovered36(i) { return Math.max(0, num(i.home)) + Math.max(0, num(i.purchased)) + bringQty36(i); }
  function ingredientBuy36(i) { return Math.max(0, ingredientNeed36(i) - ingredientCovered36(i)); }

  function syncFood36(write = true) {
    if (!S.foodV31 || !S.foodV36) return;
    S.foodV31.ingredients.forEach(i => { i.need = ingredientNeed36(i); });
    if (write) save();
  }

  function ensure36(write = false) {
    ensureRoles36();
    ensureGear36();
    ensureFood36();
    if (write) save();
  }

  function organizer36() {
    const roles = S.rolesV36?.roles || [];
    const lead = roles.find(r => r.id === 'lead')?.p;
    const logistics = roles.find(r => r.id === 'logistics')?.p;
    return window.HikeWorkspace?.can(tab === 'food' ? 'food' : 'gear') ?? (S.current === 'p1' || S.current === lead || S.current === logistics);
  }

  function progress36(pid) {
    ensureGear36();
    const req = S.gearV36.items.filter(i => i.priority === 'required');
    const done = req.filter(i => S.gearV36.status[pid]?.[i.id] === 'ready').length;
    return [done, req.length, req.length ? Math.round(done / req.length * 100) : 100];
  }

  function rolePage36() {
    ensureRoles36();
    if (window.HikeWorkspace) return window.HikeWorkspace.rolesPage();
    const roles = S.rolesV36.roles;
    const skills = S.rolesV36.skills;
    const roleCards = roles.map(r => `<article class="v36-role-card">
      <div><span class="v36-role-index">${String(roles.indexOf(r) + 1).padStart(2, '0')}</span><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p></div>
      <label>Ответственный<select data-v36-role="${r.id}"><option value="">Не назначено</option>${allRelevantPeople36().map(p => `<option value="${p.id}" ${r.p === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    </article>`).join('');
    const skillRows = allRelevantPeople36().map(p => `<div class="v36-skill-row"><span><b>${esc(p.name)}</b><small>Дополнительные компетенции, не отдельные роли</small></span><div>${SKILLS.map(([id, label]) => `<button type="button" data-v36-skill="${p.id}:${id}" class="${skills[p.id]?.includes(id) ? 'active' : ''}">${esc(label)}</button>`).join('')}</div></div>`).join('');
    return `${pageHead('Ответственность', 'Роли', 'Четыре основные роли закрывают управление походом. Отдельные умения отмечаются как компетенции, а не раздувают список ролей.')}
      <div class="v36-role-grid">${roleCards}</div>
      ${section('Дополнительные компетенции', `<div class="v36-skill-list">${skillRows}</div>`, 'Первая помощь, вождение, готовка и связь могут быть у любого участника независимо от основной роли.')}`;
  }

  function gearStatus36(pid, id) { return S.gearV36.status[pid]?.[id] || 'unset'; }
  function gearItemWeight36(item) { return Math.max(0, num(item.weightKg)); }
  function personalWeight36(pid, onlyReady = false) {
    return S.gearV36.items.reduce((n, i) => n + ((!onlyReady || gearStatus36(pid, i.id) === 'ready') ? gearItemWeight36(i) : 0), 0);
  }
  function sharedMeta36(id) {
    S.gearV30 ||= { meta: {}, kits: {}, status: {}, final: {} };
    S.gearV30.meta ||= {};
    S.gearV30.meta[id] ||= { unit: 'шт.', cat: 'other', type: 'item', desc: '', kit: [], weightKg: 0 };
    return S.gearV30.meta[id];
  }
  function sharedAssigned36(x) { return (x.a || []).reduce((n, a) => n + num(a[1]), 0); }
  function sharedAssignedWeight36(pid) {
    return (S.shared || []).reduce((sum, x) => {
      const q = num((x.a || []).find(a => a[0] === pid)?.[1]);
      return sum + q * Math.max(0, num(sharedMeta36(x.id).weightKg));
    }, 0);
  }

  function priorityChip36(i) { return `<span class="v36-chip ${i.priority}">${esc(PRIORITY[i.priority] || 'Рекомендуется')}</span>`; }
  function statusSelect36(pid, item) {
    const v = gearStatus36(pid, item.id);
    return `<select class="v36-status ${STATUS[v]?.[1] || ''}" data-v36-gear-status="${item.id}" aria-label="Статус ${esc(item.title)}">${Object.entries(STATUS).map(([k, [label]]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
  }

  function gearMine36() {
    const g = S.gearV36, pid = S.current;
    const req = g.items.filter(i => i.priority === 'required');
    const readyReq = req.filter(i => gearStatus36(pid, i.id) === 'ready').length;
    const attention = g.items.filter(i => ['check', 'borrow', 'missing'].includes(gearStatus36(pid, i.id))).length;
    const groups = Object.values(g.categories).map(cat => {
      const items = g.items.filter(i => i.category === cat.id);
      if (!items.length) return '';
      const ready = items.filter(i => gearStatus36(pid, i.id) === 'ready').length;
      const issues = items.filter(i => ['borrow', 'missing'].includes(gearStatus36(pid, i.id))).length;
      const rows = items.map(i => `<div class="v36-gear-row ${gearStatus36(pid, i.id)}"><div class="v36-gear-copy"><b>${esc(i.title)}</b><div>${priorityChip36(i)}${i.weightKg ? `<span class="v36-weight">${fmt(i.weightKg, 2)} кг</span>` : ''}</div><small>${esc(i.help || '')}</small></div><button class="v36-ready ${gearStatus36(pid, i.id) === 'ready' ? 'active' : ''}" data-v36-gear-ready="${i.id}" type="button">${gearStatus36(pid, i.id) === 'ready' ? '✓ Готово' : 'Отметить готово'}</button>${statusSelect36(pid, i)}</div>`).join('');
      return `<details class="v36-gear-group" data-v36-cat="${cat.id}" ${openGearCats36.has(cat.id) ? 'open' : ''}><summary><span><b>${esc(cat.title)}</b><small>${esc(cat.desc || '')}</small></span><span class="v36-group-stat"><strong>${ready}/${items.length}</strong>${issues ? `<em>${issues} проблем</em>` : '<em>готовность</em>'}</span></summary><div>${rows}</div></details>`;
    }).join('');
    return `<div class="v36-summary v36-summary-4"><div><small>Обязательное</small><strong>${readyReq}/${req.length}</strong><span>готово</span></div><div><small>Требует внимания</small><strong>${attention}</strong><span>проверить / одолжить</span></div><div><small>Личный вес</small><strong>${fmt(personalWeight36(pid), 1)} кг</strong><span>по заполненным весам</span></div><div><small>Общее на мне</small><strong>${fmt(sharedAssignedWeight36(pid), 1)} кг</strong><span>распределённое имущество</span></div></div><div class="v36-gear-groups">${groups}</div>`;
  }

  function gearTemplate36() {
    const g = S.gearV36;
    const groups = Object.values(g.categories).map(cat => {
      const items = g.items.filter(i => i.category === cat.id);
      return `<section class="v36-template-group"><div class="v36-template-head"><div><b>${esc(cat.title)}</b><small>${esc(cat.desc || '')}</small></div><button class="btn alt sm" type="button" data-v36-edit-cat="${cat.id}">Изменить раздел</button></div>${items.length ? items.map(i => `<div class="v36-template-row"><span><b>${esc(i.title)}</b><small>${esc(i.help || 'Без подсказки')}</small></span><div>${priorityChip36(i)}${i.weightKg ? `<span class="v36-weight">${fmt(i.weightKg)} кг</span>` : ''}</div><div class="row-actions"><button class="btn alt sm" data-v36-edit-item="${i.id}">Изменить</button><button class="btn ghost sm" data-v36-delete-item="${i.id}">Удалить</button></div></div>`).join('') : '<div class="v36-empty">В этом разделе пока нет предметов.</div>'}</section>`;
    }).join('');
    return `<div class="v36-template-toolbar"><div><b>Шаблон этого похода</b><small>Изменения применяются ко всем участникам, но их отметки готовности сохраняются.</small></div><div><button class="btn alt" id="v36AddCat">+ Раздел</button><button class="btn sand" id="v36AddGear">+ Предмет</button></div></div>${groups}`;
  }

  function sharedState36(x) {
    const assigned = sharedAssigned36(x), need = Math.max(0, num(x.need));
    const confirmed = (x.confirmed || []).filter(pid => (x.a || []).some(a => a[0] === pid)).length;
    if (!assigned) return ['Не распределено', 'risk'];
    if (assigned < need) return [`Не хватает ${fmt(need - assigned)}`, 'warn'];
    if (confirmed < (x.a || []).length) return ['Нужно подтвердить', 'warn'];
    return ['Готово', 'ok'];
  }

  function gearShared36() {
    const list = S.shared || [];
    const rows = list.map(x => {
      const meta = sharedMeta36(x.id), st = sharedState36(x);
      const owners = (x.a || []).map(a => `${pn(a[0])} · ${fmt(a[1])} ${meta.unit || 'шт.'}${(x.confirmed || []).includes(a[0]) ? ' ✓' : ''}`).join(' · ') || 'пока не назначено';
      const mine = num((x.a || []).find(a => a[0] === S.current)?.[1]);
      return `<article class="v36-shared-row ${st[1]}"><div><span class="v36-chip ${st[1]}">${st[0]}</span><h3>${esc(x.title)}</h3><p>${esc(meta.desc || '')}</p><small>${esc(owners)}</small></div><div class="v36-shared-numbers"><span><small>Нужно</small><b>${fmt(x.need)} ${esc(meta.unit || 'шт.')}</b></span><span><small>Распределено</small><b>${fmt(sharedAssigned36(x))}</b></span><span><small>Вес / ед.</small><b>${meta.weightKg ? `${fmt(meta.weightKg)} кг` : '—'}</b></span></div><div class="v36-shared-actions"><button class="btn alt sm" data-workspace-take="${esc(x.id)}">${mine ? 'Изменить количество' : 'Я возьму'}</button>${sharedMeta36(x.id).cat === 'health' || sharedMeta36(x.id).kit?.length ? `<button class="btn alt sm" data-workspace-kit="${esc(x.id)}">Состав комплекта</button>` : ''}${mine ? `<button class="btn alt sm" data-v36-shared-confirm="${x.id}">${(x.confirmed || []).includes(S.current) ? '✓ Подтверждено' : 'Подтвердить'}</button>` : ''}${organizer36() ? `<button class="btn alt sm" data-v36-shared-assign="${x.id}">Распределить</button><button class="btn ghost sm" data-v36-shared-edit="${x.id}">Изменить</button>` : ''}</div></article>`;
    }).join('');
    return `${organizer36() ? '<div class="v36-inline-toolbar"><div><b>Групповое имущество</b><small>Сначала задаём потребность, затем распределяем между участниками.</small></div><button class="btn sand" id="v36AddShared">+ Общее имущество</button></div>' : ''}<div class="v36-shared-list">${rows || '<div class="v36-empty">Групповое имущество пока не добавлено.</div>'}</div>`;
  }

  function gearTeam36() {
    const req = S.gearV36.items.filter(i => i.priority === 'required');
    return `<div class="v36-team-list">${allRelevantPeople36().map(p => {
      const done = req.filter(i => gearStatus36(p.id, i.id) === 'ready').length;
      const problems = S.gearV36.items.filter(i => ['borrow', 'missing'].includes(gearStatus36(p.id, i.id)));
      return `<div class="v36-team-row"><span class="v36-person"><span class="avatar">${initials(p.name)}</span><span><b>${esc(p.name)}</b><small>${p.rsvp === 'yes' ? 'Участвует' : p.rsvp === 'maybe' ? 'Возможно' : 'Нет ответа'}</small></span></span><span><small>Обязательное</small><b>${done}/${req.length}</b></span><span><small>Вес</small><b>${fmt(personalWeight36(p.id) + sharedAssignedWeight36(p.id), 1)} кг</b></span><span class="v36-team-problems">${problems.length ? problems.slice(0, 3).map(i => `<em>${esc(i.title)}</em>`).join('') : '<em class="ok">Нет отметок о нехватке</em>'}</span></div>`;
    }).join('')}</div>`;
  }

  function gearPage36() {
    ensureGear36();
    if (!organizer36() && ['template', 'team'].includes(gearMode36)) gearMode36 = 'mine';
    const tabs = [['mine', 'Моё снаряжение'], ['shared', 'Групповое']];
    if (organizer36()) tabs.push(['team', 'Команда'], ['template', 'Шаблон похода']);
    return `${pageHead('Подготовка', 'Снаряжение', 'Сначала определяем, что нужно взять, затем отмечаем личную готовность и распределяем общее имущество.')}
      <div class="v36-tabs">${tabs.map(([id, label]) => `<button type="button" data-v36-gear-mode="${id}" class="${gearMode36 === id ? 'active' : ''}">${label}</button>`).join('')}</div>
      <div class="v36-content">${gearMode36 === 'mine' ? gearMine36() : gearMode36 === 'shared' ? gearShared36() : gearMode36 === 'team' ? gearTeam36() : gearTemplate36()}</div>`;
  }

  function foodMealChecks36(m) {
    const c = S.foodV31.mealChecks?.[m.id]?.[S.current] || { food: false, water: false };
    return `<div class="v36-self-check"><button data-v36-meal-check="${m.id}:food" class="${c.food ? 'active' : ''}">${c.food ? '✓ ' : ''}Еда собрана</button><button data-v36-meal-check="${m.id}:water" class="${c.water ? 'active' : ''}">${c.water ? '✓ ' : ''}Вода собрана</button></div>`;
  }

  function foodPlan36() {
    const meals = [...S.foodV31.meals].sort((a, b) => String(a.day).localeCompare(String(b.day), 'ru', { numeric: true }) || String(a.time).localeCompare(String(b.time)));
    const groups = {};
    meals.forEach(m => (groups[m.day] ||= []).push(m));
    const open = S.foodV31.ingredients.filter(i => ingredientBuy36(i) > 0).length;
    const common = meals.filter(m => m.mode !== 'self').length;
    const summary = `<div class="v36-summary v36-summary-4"><div><small>Приёмов пищи</small><strong>${meals.length}</strong><span>${Object.keys(groups).length || 0} дн.</span></div><div><small>Общих</small><strong>${common}</strong><span>требуют расчёта</span></div><div><small>Докупить</small><strong>${open}</strong><span>позиций</span></div><div><small>Резерв продуктов</small><strong>${fmt(S.foodV36.reservePct, 0)}%</strong><span>добавляется к норме</span></div></div>`;
    const days = Object.entries(groups).map(([day, list]) => `<section class="v36-food-day"><div class="v36-food-day-head"><div><b>${esc(day)}</b><small>${list.length} ${list.length === 1 ? 'приём' : 'приёма'} пищи</small></div>${organizer36() ? `<button class="btn alt sm" data-v36-add-meal-day="${esc(day)}">+ добавить</button>` : ''}</div>${list.map(m => foodMealCard36(m)).join('')}</section>`).join('');
    return `${summary}${organizer36() ? `<div class="v36-reserve"><label>Общий резерв продуктов <input id="v36FoodReserve" type="number" min="0" max="50" step="1" value="${num(S.foodV36.reservePct, 10)}"> %</label><small>Норма каждого ингредиента считается на человека × число порций + резерв.</small></div>` : ''}${days || '<div class="v36-empty">План питания пока пуст.</div>'}`;
  }

  function foodMealCard36(m) {
    const common = m.mode !== 'self';
    const ingredients = S.foodV31.ingredients.filter(i => i.mealId === m.id);
    const needBuy = ingredients.filter(i => ingredientBuy36(i) > 0).length;
    return `<article class="v36-meal ${common ? 'common' : 'self'}"><div class="v36-meal-time"><b>${esc((S.timeline||[]).find(t=>t.id===m.planEventId)?.time || m.time || '—')}</b><small>${esc(m.location || '')}</small></div><div class="v36-meal-main"><div class="v36-meal-head"><div><h3>${esc(m.title)}</h3><span class="v36-chip ${common ? 'ok' : ''}">${common ? (m.mode === 'hybrid' ? 'Общее + личное' : 'Общее') : 'Самостоятельно'}</span></div>${organizer36() ? `<div><button class="btn alt sm" data-v36-edit-meal="${m.id}">Изменить</button></div>` : ''}</div><p>${esc(m.menu || (common ? 'Меню не заполнено' : 'Каждый отвечает за свою еду.'))}</p>${m.note ? `<small class="v36-note">${esc(m.note)}</small>` : ''}${common ? `<div class="v36-meal-meta"><span><small>Порций</small><b>${mealPortions36(m)}</b></span><span><small>Продуктов</small><b>${ingredients.length}</b></span><span><small>Докупить</small><b>${needBuy}</b></span></div><div class="v36-recipe">${ingredients.length ? ingredients.map(i => `<div class="v36-recipe-row"><span><b>${esc(i.title)}</b><small>${fmt(i.perPerson)} ${esc(i.unit)} / чел.</small></span><span><small>Всего</small><b>${fmt(ingredientNeed36(i))} ${esc(i.unit)}</b></span><span class="${ingredientBuy36(i) > 0 ? 'warn' : 'ok'}"><small>${ingredientBuy36(i) > 0 ? 'Докупить' : 'Закрыто'}</small><b>${ingredientBuy36(i) > 0 ? `${fmt(ingredientBuy36(i))} ${esc(i.unit)}` : '✓'}</b></span>${organizer36() ? `<button class="icon-btn" data-v36-edit-ing="${i.id}" title="Изменить">✎</button>` : ''}</div>`).join('') : '<div class="v36-empty compact">Рецепт пока не заполнен.</div>'}${organizer36() ? `<button class="v36-add-line" data-v36-add-ing="${m.id}">+ продукт в рецепт</button>` : ''}</div>` : foodMealChecks36(m)}</div></article>`;
  }

  function foodAggregates36() {
    const map = new Map();
    S.foodV31.ingredients.forEach(i => {
      const meal = S.foodV31.meals.find(m => m.id === i.mealId);
      if (!meal || meal.mode === 'self') return;
      const key = `${String(i.title).trim().toLowerCase()}|${String(i.unit).trim().toLowerCase()}`;
      if (!map.has(key)) map.set(key, { key, title: i.title, unit: i.unit, need: 0, home: 0, purchased: 0, bring: 0, price: 0, lines: [], buyers: new Set() });
      const a = map.get(key);
      a.need += ingredientNeed36(i); a.home += num(i.home); a.purchased += num(i.purchased); a.bring += bringQty36(i); a.price = Math.max(a.price, num(i.price)); a.lines.push(i); if (i.buyer) a.buyers.add(i.buyer);
    });
    return [...map.values()].map(a => ({ ...a, toBuy: Math.max(0, a.need - a.home - a.purchased - a.bring) })).sort((a, b) => b.toBuy - a.toBuy || a.title.localeCompare(b.title, 'ru'));
  }

  function foodProducts36() {
    const a = foodAggregates36();
    const open = a.filter(x => x.toBuy > 0);
    const estimate = open.reduce((n, x) => n + x.toBuy * x.price, 0);
    return `<div class="v36-summary v36-summary-3"><div><small>Позиций</small><strong>${a.length}</strong><span>по всем общим меню</span></div><div><small>Нужно докупить</small><strong>${open.length}</strong><span>после запасов группы</span></div><div><small>Оценка</small><strong>${Math.round(estimate).toLocaleString('ru-RU')} ₽</strong><span>по указанным ценам</span></div></div><div class="v36-products"><div class="v36-products-head"><span>Продукт</span><span>Нужно</span><span>Есть / принесут</span><span>Докупить</span><span>Ответственный</span><span></span></div>${a.map(x => `<div class="v36-product-row ${x.toBuy > 0 ? 'warn' : 'ok'}"><span><b>${esc(x.title)}</b><small>${esc(x.unit)}</small></span><span><b>${fmt(x.need)}</b></span><span><b>${fmt(x.home + x.bring + x.purchased)}</b></span><span><b>${x.toBuy > 0 ? fmt(x.toBuy) : '✓'}</b></span><span><select data-v36-product-buyer="${encodeURIComponent(x.key)}"><option value="">Не назначен</option>${allRelevantPeople36().map(p => `<option value="${p.id}" ${x.buyers.has(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></span><span><button class="btn alt sm" data-v36-product-purchased="${encodeURIComponent(x.key)}">${x.toBuy > 0 ? 'Отметить куплено' : 'Вернуть в закупку'}</button></span></div>`).join('') || '<div class="v36-empty">В общих меню пока нет продуктов.</div>'}</div>`;
  }

  function waterCalc36() {
    const w = S.foodV36.water, people = activePeople36();
    const base = Math.max(0, num(w.drinkPerPerson)) * people.length + Math.max(0, num(w.cookingLiters)) + Math.max(0, num(w.householdLiters));
    const total = Math.max(0, base * (1 + Math.max(0, num(w.reservePct)) / 100) - Math.max(0, num(w.refillLiters)));
    const assigned = people.reduce((n, p) => n + Math.max(0, num(w.assignments[p.id])), 0);
    return { people, base, total, assigned, delta: total - assigned };
  }

  function foodWater36() {
    const w = S.foodV36.water, c = waterCalc36();
    return `<div class="v36-summary v36-summary-4"><div><small>Участников</small><strong>${c.people.length}</strong><span>подтвердили участие</span></div><div><small>Питьё</small><strong>${fmt(w.drinkPerPerson, 1)} л</strong><span>на человека</span></div><div><small>На старте</small><strong>${fmt(c.total, 1)} л</strong><span>с учётом готовки и резерва</span></div><div><small>Распределено</small><strong>${fmt(c.assigned, 1)} л</strong><span class="${Math.abs(c.delta) < .05 ? 'ok' : 'warn'}">${Math.abs(c.delta) < .05 ? 'баланс сходится' : `${c.delta > 0 ? 'осталось' : 'лишнее'} ${fmt(Math.abs(c.delta), 1)} л`}</span></div></div>
      <section class="v36-water-settings"><div><h2>Расчёт воды</h2><p>Личная питьевая вода + общая вода на готовку и бытовые нужды + резерв − подтверждённое пополнение. Объёмы задаёт ответственный под условия похода.</p></div><div class="v36-water-fields"><label>Л/чел.<input data-v36-water="drinkPerPerson" type="number" min="0" step="0.1" value="${num(w.drinkPerPerson)}"></label><label>На готовку, л<input data-v36-water="cookingLiters" type="number" min="0" step="0.1" value="${num(w.cookingLiters)}"></label><label>На бытовые нужды, л<input data-v36-water="householdLiters" type="number" min="0" step="0.1" value="${num(w.householdLiters)}"></label><label>Резерв, %<input data-v36-water="reservePct" type="number" min="0" step="1" value="${num(w.reservePct)}"></label><label>Пополнение, л<input data-v36-water="refillLiters" type="number" min="0" step="0.1" value="${num(w.refillLiters)}"></label></div></section>
      <section class="v36-water-distribution"><div class="v36-inline-toolbar"><div><b>Кто сколько несёт на старте</b><small>Можно распределить автоматически и затем вручную поправить нагрузку.</small></div><button class="btn alt" id="v36AutoWater">Распределить поровну</button></div>${c.people.map(p => `<label class="v36-water-row"><span><span class="avatar">${initials(p.name)}</span><b>${esc(p.name)}</b></span><span><input data-v36-water-person="${p.id}" type="number" min="0" step="0.1" value="${num(w.assignments[p.id])}"> л</span></label>`).join('') || '<div class="v36-empty">Нет подтверждённых участников.</div>'}</section>`;
  }

  function foodPage36() {
    ensureFood36();
    const tabs = [['plan', 'Меню и приёмы'], ['products', 'Продукты'], ['water', 'Вода']];
    const actions = organizer36() ? '<button class="btn alt" id="v36FoodIo">Импорт / экспорт</button><button class="btn sand" id="v36AddMeal">+ Приём пищи</button>' : '';
    return `${pageHead('Подготовка', 'Питание', 'Планируем меню, считаем продукты по числу людей и отдельно распределяем воду.', actions)}<div class="v36-tabs">${tabs.map(([id, label]) => `<button data-v36-food-mode="${id}" class="${foodMode36 === id ? 'active' : ''}">${label}</button>`).join('')}</div><div class="v36-content">${foodMode36 === 'plan' ? foodPlan36() : foodMode36 === 'products' ? foodProducts36() : foodWater36()}</div>`;
  }

  function openModal36(title, body, footer = '') {
    const l = document.getElementById('modalLayer');
    if (!l) return null;
    l.innerHTML = `<div class="v36-backdrop" data-v36-close></div><div class="v36-modal"><div class="v36-modal-head"><b>${title}</b><button type="button" data-v36-close>×</button></div><div class="v36-modal-body">${body}</div><div class="v36-modal-foot">${footer}</div></div>`;
    l.classList.add('open'); l.setAttribute('aria-hidden', 'false');
    l.querySelectorAll('[data-v36-close]').forEach(b => b.onclick = closeModal36);
    return l;
  }
  function closeModal36() { const l = document.getElementById('modalLayer'); if (!l) return; l.classList.remove('open'); l.setAttribute('aria-hidden', 'true'); l.innerHTML = ''; }

  function gearItemModal36(id = '') {
    const edit = !!id, g = S.gearV36, item = edit ? g.items.find(i => i.id === id) : { title: '', category: Object.keys(g.categories)[0] || 'other', priority: 'recommended', help: '', weightKg: 0 };
    if (!item) return;
    const body = `<label>Название<input id="v36GiTitle" value="${esc(item.title)}"></label><label>Раздел<select id="v36GiCat">${Object.values(g.categories).map(c => `<option value="${c.id}" ${item.category === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></label><div class="v36-form-row"><label>Приоритет<select id="v36GiPriority">${Object.entries(PRIORITY).map(([k, v]) => `<option value="${k}" ${item.priority === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>Вес, кг<input id="v36GiWeight" type="number" min="0" step="0.05" value="${num(item.weightKg)}"></label></div><label>Подсказка<textarea id="v36GiHelp" rows="3">${esc(item.help || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить предмет' : 'Добавить предмет', body, `<button class="btn alt" data-v36-close>Отмена</button><button class="btn sand" id="v36GiSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36GiSave').onclick = () => {
      const title = document.getElementById('v36GiTitle').value.trim(); if (!title) return toast('Укажи название');
      const patch = { title, category: document.getElementById('v36GiCat').value, priority: document.getElementById('v36GiPriority').value, weightKg: Math.max(0, num(document.getElementById('v36GiWeight').value)), help: document.getElementById('v36GiHelp').value.trim() };
      if (edit) Object.assign(item, patch); else { const ni = { id: `gi36_${Date.now()}`, ...patch }; g.items.push(ni); (S.participants || []).forEach(p => g.status[p.id][ni.id] = 'unset'); }
      syncGear36(); closeModal36(); render();
    };
  }

  function gearCategoryModal36(id = '') {
    const edit = !!id, g = S.gearV36, cat = edit ? g.categories[id] : { id: '', title: '', desc: '' };
    if (!cat) return;
    const body = `<label>Название раздела<input id="v36CatTitle" value="${esc(cat.title || '')}"></label><label>Описание<textarea id="v36CatDesc" rows="3">${esc(cat.desc || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить раздел' : 'Добавить раздел', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit && !g.items.some(i => i.category === id) ? '<button class="btn risk" id="v36CatDelete">Удалить</button>' : ''}<button class="btn sand" id="v36CatSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36CatDelete')?.addEventListener('click', () => { delete g.categories[id]; save(); closeModal36(); render(); });
    document.getElementById('v36CatSave').onclick = () => {
      const title = document.getElementById('v36CatTitle').value.trim(); if (!title) return toast('Укажи название раздела');
      if (edit) { cat.title = title; cat.desc = document.getElementById('v36CatDesc').value.trim(); }
      else { const key = `cat_${Date.now()}`; g.categories[key] = { id: key, title, desc: document.getElementById('v36CatDesc').value.trim() }; }
      save(); closeModal36(); render();
    };
  }

  function sharedModal36(id = '') {
    const edit = !!id, x = edit ? (S.shared || []).find(g => g.id === id) : { title: '', need: 1, a: [], confirmed: [] }, meta = edit ? sharedMeta36(id) : { unit: 'шт.', cat: 'other', type: 'item', desc: '', weightKg: 0, kit: [] };
    if (!x) return;
    const body = `<label>Название<input id="v36ShTitle" value="${esc(x.title)}"></label><div class="v36-form-row"><label>Нужно<input id="v36ShNeed" type="number" min="0" step="0.1" value="${num(x.need, 1)}"></label><label>Единица<input id="v36ShUnit" value="${esc(meta.unit || 'шт.')}"></label></div><label>Вес одной единицы, кг<input id="v36ShWeight" type="number" min="0" step="0.05" value="${num(meta.weightKg)}"></label><label>Описание<textarea id="v36ShDesc" rows="3">${esc(meta.desc || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить групповое имущество' : 'Добавить групповое имущество', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit ? '<button class="btn risk" id="v36ShDelete">Удалить</button>' : ''}<button class="btn sand" id="v36ShSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36ShDelete')?.addEventListener('click', () => { if (!confirm(`Удалить «${x.title}»?`)) return; S.shared = S.shared.filter(g => g.id !== id); if (S.gearV30?.meta) delete S.gearV30.meta[id]; save(); closeModal36(); render(); });
    document.getElementById('v36ShSave').onclick = () => {
      const title = document.getElementById('v36ShTitle').value.trim(); if (!title) return toast('Укажи название');
      const need = Math.max(0, num(document.getElementById('v36ShNeed').value));
      if (!edit) { id = `sh36_${Date.now()}`; x.id = id; S.shared ||= []; S.shared.push(x); }
      x.title = title; x.need = need; // Changing demand must not silently alter participant commitments.
      Object.assign(sharedMeta36(id), { unit: document.getElementById('v36ShUnit').value.trim() || 'шт.', desc: document.getElementById('v36ShDesc').value.trim(), weightKg: Math.max(0, num(document.getElementById('v36ShWeight').value)) });
      save(); closeModal36(); render();
    };
  }

  function sharedAssignModal36(id) {
    const x = (S.shared || []).find(g => g.id === id); if (!x) return;
    const meta = sharedMeta36(id);
    const body = `<div class="v36-assign-list">${allRelevantPeople36().map(p => `<label><span><b>${esc(p.name)}</b><small>${p.rsvp === 'yes' ? 'участвует' : p.rsvp === 'maybe' ? 'возможно' : 'нет ответа'}</small></span><span><input data-v36-assign-person="${p.id}" type="number" min="0" step="0.1" value="${num((x.a || []).find(a => a[0] === p.id)?.[1])}"> ${esc(meta.unit || 'шт.')}</span></label>`).join('')}</div><small>Нужно распределить: ${fmt(x.need)} ${esc(meta.unit || 'шт.')}. После изменения подтверждения участников сбрасываются.</small>`;
    const l = openModal36(`Распределить: ${esc(x.title)}`, body, `<button class="btn alt" data-v36-close>Отмена</button><button class="btn sand" id="v36AssignSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36AssignSave').onclick = () => {
      x.a = [...document.querySelectorAll('[data-v36-assign-person]')].map(inp => [inp.dataset.v36AssignPerson, Math.max(0, num(inp.value))]).filter(a => a[1] > 0);
      x.confirmed = [];
      save(); closeModal36(); render();
    };
  }

  function mealModal36(id = '', presetDay = '') {
    const edit = !!id, f = S.foodV31, m = edit ? f.meals.find(x => x.id === id) : { day: presetDay || 'День 1', time: '12:00', title: '', mode: 'self', location: '', menu: '', note: '', portions: 0, cooks: [], equipment: [] };
    if (!m) return;
    const body = `<div class="v36-form-row"><label>День<input id="v36MealDay" value="${esc(m.day)}"></label><label>Время<input id="v36MealTime" type="time" value="${esc(m.time || '12:00')}"></label></div><label>Название<input id="v36MealTitle" value="${esc(m.title)}" placeholder="Обед / ужин / завтрак"></label><div class="v36-form-row"><label>Формат<select id="v36MealMode"><option value="self" ${m.mode === 'self' ? 'selected' : ''}>Самостоятельно</option><option value="common" ${m.mode === 'common' ? 'selected' : ''}>Общее</option><option value="hybrid" ${m.mode === 'hybrid' ? 'selected' : ''}>Общее + личное</option></select></label><label>Порций (0 = автоматически)<input id="v36MealPortions" type="number" min="0" step="1" value="${num(m.portions)}"></label></div><label>Время из плана<select id="v36MealPlan"><option value="">Задать вручную</option>${(S.timeline||[]).map(t=>`<option value="${esc(t.id)}" ${m.planEventId===t.id?'selected':''}>${esc(t.time)} · ${esc(t.title)}</option>`).join('')}</select></label><label>Место<input id="v36MealLocation" value="${esc(m.location || '')}"></label><label>Меню<textarea id="v36MealMenu" rows="2">${esc(m.menu || '')}</textarea></label><label>Комментарий<textarea id="v36MealNote" rows="2">${esc(m.note || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить приём пищи' : 'Добавить приём пищи', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit ? '<button class="btn risk" id="v36MealDelete">Удалить</button>' : ''}<button class="btn sand" id="v36MealSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36MealDelete')?.addEventListener('click', () => { if (!confirm(`Удалить «${m.title}»?`)) return; f.meals = f.meals.filter(x => x.id !== m.id); f.ingredients = f.ingredients.filter(i => i.mealId !== m.id); delete f.mealChecks[m.id]; delete f.attendance[m.id]; syncFood36(); closeModal36(); render(); });
    document.getElementById('v36MealSave').onclick = () => {
      const title = document.getElementById('v36MealTitle').value.trim(); if (!title) return toast('Укажи название');
      const patch = { planEventId: document.getElementById('v36MealPlan').value, day: document.getElementById('v36MealDay').value.trim() || 'День 1', time: document.getElementById('v36MealTime').value || '12:00', title, mode: document.getElementById('v36MealMode').value, location: document.getElementById('v36MealLocation').value.trim(), menu: document.getElementById('v36MealMenu').value.trim(), note: document.getElementById('v36MealNote').value.trim(), portions: Math.max(0, Math.round(num(document.getElementById('v36MealPortions').value))) };
      if (edit) Object.assign(m, patch); else { const nm = { id: `fm36_${Date.now()}`, cooks: [], equipment: [], ...patch }; f.meals.push(nm); f.mealChecks[nm.id] = {}; f.attendance[nm.id] = {}; (S.participants || []).forEach(p => { f.mealChecks[nm.id][p.id] = { food: false, water: false }; f.attendance[nm.id][p.id] = p.rsvp === 'yes' ? 'eat' : 'skip'; }); }
      syncFood36(); closeModal36(); render();
    };
  }

  function ingredientModal36(mealId, id = '') {
    const f = S.foodV31, edit = !!id, i = edit ? f.ingredients.find(x => x.id === id) : { mealId, title: '', perPerson: 0.1, unit: 'кг', home: 0, purchased: 0, price: 0, buyer: '', bring: [] };
    if (!i) return;
    const body = `<label>Продукт<input id="v36IngTitle" value="${esc(i.title || '')}"></label><div class="v36-form-row"><label>На человека<input id="v36IngPer" type="number" min="0" step="0.01" value="${fmt(num(i.perPerson), 3).replace(',', '.')}"></label><label>Единица<input id="v36IngUnit" value="${esc(i.unit || 'шт.')}"></label></div><div class="v36-form-row"><label>Уже есть у группы<input id="v36IngHome" type="number" min="0" step="0.01" value="${num(i.home)}"></label><label>Цена за единицу, ₽<input id="v36IngPrice" type="number" min="0" step="1" value="${num(i.price)}"></label></div><label>Кто покупает<select id="v36IngBuyer"><option value="">Не назначено</option>${allRelevantPeople36().map(p => `<option value="${p.id}" ${i.buyer === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><small>Итоговая потребность пересчитается автоматически по числу порций и общему резерву.</small>`;
    const l = openModal36(edit ? 'Изменить продукт' : 'Добавить продукт', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit ? '<button class="btn risk" id="v36IngDelete">Удалить</button>' : ''}<button class="btn sand" id="v36IngSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36IngDelete')?.addEventListener('click', () => { f.ingredients = f.ingredients.filter(x => x.id !== i.id); syncFood36(); closeModal36(); render(); });
    document.getElementById('v36IngSave').onclick = () => {
      const title = document.getElementById('v36IngTitle').value.trim(); if (!title) return toast('Укажи продукт');
      const patch = { mealId, title, perPerson: Math.max(0, num(document.getElementById('v36IngPer').value)), unit: document.getElementById('v36IngUnit').value.trim() || 'шт.', home: Math.max(0, num(document.getElementById('v36IngHome').value)), price: Math.max(0, num(document.getElementById('v36IngPrice').value)), buyer: document.getElementById('v36IngBuyer').value };
      if (edit) Object.assign(i, patch); else f.ingredients.push({ id: `fi36_${Date.now()}`, purchased: 0, bring: [], ...patch });
      syncFood36(); closeModal36(); render();
    };
  }

  function foodIOModal36() {
    const payload = { format: 'raznye-ludi-food-v36', version: 1, reservePct: S.foodV36.reservePct, meals: copy(S.foodV31.meals), ingredients: copy(S.foodV31.ingredients), water: copy(S.foodV36.water) };
    const body = `<p class="v36-modal-copy">Этот JSON можно сохранить, отредактировать вручную или передать ChatGPT. При импорте текущий план питания и воды будет заменён.</p><textarea id="v36FoodJson" rows="18">${esc(JSON.stringify(payload, null, 2))}</textarea>`;
    const l = openModal36('Импорт / экспорт питания', body, `<button class="btn alt" data-v36-close>Закрыть</button><button class="btn alt" id="v36FoodCopy">Копировать</button><button class="btn sand" id="v36FoodImport">Импортировать JSON</button>`);
    if (!l) return;
    document.getElementById('v36FoodCopy').onclick = async () => { const t = document.getElementById('v36FoodJson').value; try { await navigator.clipboard.writeText(t); toast('JSON скопирован'); } catch (e) { document.getElementById('v36FoodJson').select(); toast('Текст выделен — скопируй вручную'); } };
    document.getElementById('v36FoodImport').onclick = () => {
      try {
        const p = JSON.parse(document.getElementById('v36FoodJson').value);
        if (!p || !Array.isArray(p.meals) || !Array.isArray(p.ingredients)) throw new Error('bad format');
        S.foodV31.meals = p.meals; S.foodV31.ingredients = p.ingredients; S.foodV31.mealChecks ||= {}; S.foodV31.attendance ||= {};
        if (Number.isFinite(+p.reservePct)) S.foodV36.reservePct = Math.max(0, +p.reservePct);
        if (p.water && typeof p.water === 'object') S.foodV36.water = { ...S.foodV36.water, ...p.water, assignments: { ...(p.water.assignments || {}) } };
        ensureFood36(); syncFood36(); closeModal36(); render(); toast('План питания импортирован');
      } catch (e) { toast('Не удалось прочитать JSON'); }
    };
  }

  function autoWater36() {
    const c = waterCalc36(); if (!c.people.length) return;
    const raw = c.total / c.people.length;
    let left = c.total;
    c.people.forEach((p, idx) => {
      const v = idx === c.people.length - 1 ? left : Math.round(raw * 10) / 10;
      S.foodV36.water.assignments[p.id] = Math.max(0, v); left -= v;
    });
    save(); render();
  }

  function setAggregatePurchased36(encoded) {
    const key = decodeURIComponent(encoded), a = foodAggregates36().find(x => x.key === key); if (!a) return;
    const done = a.toBuy <= 0.0001;
    a.lines.forEach(i => { i.purchased = done ? 0 : Math.max(0, ingredientNeed36(i) - num(i.home) - bringQty36(i)); });
    syncFood36(); render();
  }
  function setAggregateBuyer36(encoded, pid) {
    const key = decodeURIComponent(encoded), a = foodAggregates36().find(x => x.key === key); if (!a) return;
    a.lines.forEach(i => i.buyer = pid); syncFood36(); render();
  }

  function bind36() {
    ensure36(false);
    if (tab === 'roles') {
      document.querySelectorAll('[data-v36-role]').forEach(s => s.onchange = () => { const r = S.rolesV36.roles.find(x => x.id === s.dataset.v36Role); if (r) r.p = s.value; ensureRoles36(); save(); render(); });
      document.querySelectorAll('[data-v36-skill]').forEach(b => b.onclick = () => { const [pid, skill] = b.dataset.v36Skill.split(':'); const a = S.rolesV36.skills[pid] ||= []; const i = a.indexOf(skill); if (i >= 0) a.splice(i, 1); else a.push(skill); save(); render(); });
    }
    if (tab === 'gear') {
      document.querySelectorAll('[data-v36-gear-mode]').forEach(b => b.onclick = () => { gearMode36 = b.dataset.v36GearMode; render(); });
      document.querySelectorAll('.v36-gear-group').forEach(d => d.addEventListener('toggle', () => { const id = d.dataset.v36Cat; if (d.open) openGearCats36.add(id); else openGearCats36.delete(id); }));
      document.querySelectorAll('[data-v36-gear-ready]').forEach(b => b.onclick = () => { const id = b.dataset.v36GearReady, current = gearStatus36(S.current, id); S.gearV36.status[S.current][id] = current === 'ready' ? 'unset' : 'ready'; syncGear36(); render(); });
      document.querySelectorAll('[data-v36-gear-status]').forEach(s => s.onchange = () => { S.gearV36.status[S.current][s.dataset.v36GearStatus] = s.value; syncGear36(); render(); });
      document.getElementById('v36AddGear')?.addEventListener('click', () => gearItemModal36());
      document.getElementById('v36AddCat')?.addEventListener('click', () => gearCategoryModal36());
      document.querySelectorAll('[data-v36-edit-item]').forEach(b => b.onclick = () => gearItemModal36(b.dataset.v36EditItem));
      document.querySelectorAll('[data-v36-edit-cat]').forEach(b => b.onclick = () => gearCategoryModal36(b.dataset.v36EditCat));
      document.querySelectorAll('[data-v36-delete-item]').forEach(b => b.onclick = () => { const id = b.dataset.v36DeleteItem, x = S.gearV36.items.find(i => i.id === id); if (!x || !confirm(`Удалить «${x.title}» из шаблона похода?`)) return; S.gearV36.items = S.gearV36.items.filter(i => i.id !== id); Object.values(S.gearV36.status).forEach(s => delete s[id]); syncGear36(); render(); });
      document.getElementById('v36AddShared')?.addEventListener('click', () => sharedModal36());
      document.querySelectorAll('[data-v36-shared-edit]').forEach(b => b.onclick = () => sharedModal36(b.dataset.v36SharedEdit));
      document.querySelectorAll('[data-v36-shared-assign]').forEach(b => b.onclick = () => sharedAssignModal36(b.dataset.v36SharedAssign));
      document.querySelectorAll('[data-v36-shared-confirm]').forEach(b => b.onclick = () => { const x = (S.shared || []).find(g => g.id === b.dataset.v36SharedConfirm); if (!x) return; x.confirmed ||= []; const i = x.confirmed.indexOf(S.current); if (i >= 0) x.confirmed.splice(i, 1); else x.confirmed.push(S.current); save(); render(); });
    }
    if (tab === 'food') {
      document.querySelectorAll('[data-v36-food-mode]').forEach(b => b.onclick = () => { foodMode36 = b.dataset.v36FoodMode; render(); });
      document.getElementById('v36AddMeal')?.addEventListener('click', () => mealModal36());
      document.querySelectorAll('[data-v36-add-meal-day]').forEach(b => b.onclick = () => mealModal36('', b.dataset.v36AddMealDay));
      document.querySelectorAll('[data-v36-edit-meal]').forEach(b => b.onclick = () => mealModal36(b.dataset.v36EditMeal));
      document.querySelectorAll('[data-v36-add-ing]').forEach(b => b.onclick = () => ingredientModal36(b.dataset.v36AddIng));
      document.querySelectorAll('[data-v36-edit-ing]').forEach(b => b.onclick = () => { const i = S.foodV31.ingredients.find(x => x.id === b.dataset.v36EditIng); if (i) ingredientModal36(i.mealId, i.id); });
      document.querySelectorAll('[data-v36-meal-check]').forEach(b => b.onclick = () => { const [mid, k] = b.dataset.v36MealCheck.split(':'); S.foodV31.mealChecks[mid][S.current][k] = !S.foodV31.mealChecks[mid][S.current][k]; save(); render(); });
      const reserve = document.getElementById('v36FoodReserve'); if (reserve) reserve.onchange = () => { S.foodV36.reservePct = Math.max(0, num(reserve.value)); syncFood36(); render(); };
      document.querySelectorAll('[data-v36-product-purchased]').forEach(b => b.onclick = () => setAggregatePurchased36(b.dataset.v36ProductPurchased));
      document.querySelectorAll('[data-v36-product-buyer]').forEach(s => s.onchange = () => setAggregateBuyer36(s.dataset.v36ProductBuyer, s.value));
      document.getElementById('v36FoodIo')?.addEventListener('click', foodIOModal36);
      document.querySelectorAll('[data-v36-water]').forEach(i => i.onchange = () => { S.foodV36.water[i.dataset.v36Water] = Math.max(0, num(i.value)); save(); render(); });
      document.querySelectorAll('[data-v36-water-person]').forEach(i => i.onchange = () => { S.foodV36.water.assignments[i.dataset.v36WaterPerson] = Math.max(0, num(i.value)); save(); render(); });
      document.getElementById('v36AutoWater')?.addEventListener('click', autoWater36);
    }
    if (tab === 'route') requestAnimationFrame(setupRouteYandex36);
  }

  function loadYandex36() {
    if (window.ymaps3?.ready) return window.ymaps3.ready.then(() => window.ymaps3);
    if (yandexLoader36) return yandexLoader36;
    yandexLoader36 = new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src?.includes('api-maps.yandex.ru/v3/'));
      const ready = () => window.ymaps3?.ready ? window.ymaps3.ready.then(() => resolve(window.ymaps3)).catch(reject) : reject(new Error('ymaps3 unavailable'));
      if (existing) {
        if (window.ymaps3?.ready) return ready();
        existing.addEventListener('load', ready, { once: true }); existing.addEventListener('error', reject, { once: true }); return;
      }
      const s = document.createElement('script'); s.async = true; s.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(YANDEX_KEY)}&lang=ru_RU`; s.addEventListener('load', ready, { once: true }); s.addEventListener('error', reject, { once: true }); document.head.appendChild(s);
    });
    return yandexLoader36;
  }

  function routeLocation36() {
    if (typeof routeMapV11 === 'undefined' || !routeMapV11) return null;
    const c = routeMapV11.getCenter(); return { center: [c.lng, c.lat], zoom: routeMapV11.getZoom() };
  }
  function routeYandexStatus36(text = '', error = false) {
    const el = routeYandex36.status; if (!el) return; el.textContent = text; el.classList.toggle('show', !!text); el.classList.toggle('error', !!error);
  }
  function syncRouteYandex36() {
    routeYandex36.raf = 0; if (!routeYandex36.active || !routeYandex36.map) return;
    const location = routeLocation36(); if (!location) return;
    try { routeYandex36.map.setLocation({ ...location, duration: 0 }); } catch (e) {}
  }
  function scheduleRouteYandex36() { if (routeYandex36.raf) cancelAnimationFrame(routeYandex36.raf); routeYandex36.raf = requestAnimationFrame(syncRouteYandex36); }

  async function enableRouteYandex36(button) {
    const mapEl = document.getElementById('routeMapFinal'); if (!mapEl || typeof routeMapV11 === 'undefined' || !routeMapV11) return;
    const shell = mapEl.parentElement; if (!shell) return;
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    let host = shell.querySelector('.route-yandex-v36'); if (!host) { host = document.createElement('div'); host.className = 'route-yandex-v36'; shell.insertBefore(host, mapEl); }
    let status = shell.querySelector('.route-yandex-status-v36'); if (!status) { status = document.createElement('div'); status.className = 'route-yandex-status-v36'; shell.appendChild(status); }
    routeYandex36.host = host; routeYandex36.status = status; routeYandex36.leaflet = mapEl; routeYandex36.active = true;
    shell.classList.add('route-yandex-active-v36'); routeYandexStatus36('Загрузка Яндекс Карт…');
    const controls = button?.parentElement?.querySelectorAll('button') || []; controls.forEach(b => b.classList.toggle('active', b === button)); if (button) button.textContent = 'Яндекс';
    try {
      const ymaps3 = await loadYandex36();
      if (!routeYandex36.map) {
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;
        routeYandex36.map = new YMap(host, { location: routeLocation36() || { center: [37.93, 55.59], zoom: 13 }, behaviors: [], mode: 'raster', theme: 'light' }, [new YMapDefaultSchemeLayer(), new YMapDefaultFeaturesLayer()]);
      }
      if (!routeMapV11.__v36YandexBound) { routeMapV11.__v36YandexBound = true; routeMapV11.on('move zoom moveend zoomend resize', scheduleRouteYandex36); }
      routeYandexStatus36(''); scheduleRouteYandex36();
    } catch (e) { console.error('Yandex route map failed', e); routeYandexStatus36('Яндекс Карты не загрузились. Проверьте ограничения ключа и обновите страницу.', true); }
  }

  function disableRouteYandex36() {
    routeYandex36.active = false;
    document.querySelector('.map-shell-v11.route-yandex-active-v36, .route-yandex-active-v36')?.classList.remove('route-yandex-active-v36');
    routeYandexStatus36('');
  }

  function routeMapButton36() {
    const mapEl = document.getElementById('routeMapFinal'); if (!mapEl) return null;
    const region = mapEl.closest('.route-map') || mapEl.parentElement?.parentElement || document;
    const buttons = [...region.querySelectorAll('button')];
    let b = buttons.find(x => ['город', 'яндекс'].includes(x.textContent.trim().toLowerCase()));
    if (!b) {
      const sw = region.querySelector('.map-layer-switch-v11, .route-map-head-v11 div:last-child');
      if (sw) { b = document.createElement('button'); b.type = 'button'; b.textContent = 'Яндекс'; b.dataset.v36YandexRoute = '1'; sw.appendChild(b); }
    } else { b.textContent = 'Яндекс'; b.dataset.v36YandexRoute = '1'; }
    return b;
  }

  function setupRouteYandex36() {
    const b = routeMapButton36(); if (!b) return;
    const mapEl = document.getElementById('routeMapFinal'); const region = mapEl?.closest('.route-map') || mapEl?.parentElement?.parentElement;
    if (region) [...region.querySelectorAll('button')].filter(x => ['карта', 'спутник'].includes(x.textContent.trim().toLowerCase())).forEach(x => {
      if (!x.dataset.v36YandexOff) { x.dataset.v36YandexOff = '1'; x.addEventListener('click', disableRouteYandex36, true); }
    });
    if (!b.dataset.v36Bound) { b.dataset.v36Bound = '1'; b.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); enableRouteYandex36(b); }, true); }
  }

  ensure36(true);
  progress = progress36;
  rolesPage = rolePage36;
  gearPage = gearPage36;

  const renderBefore36 = render;
  render = function renderV36() {
    ensure36(false);
    if (tab !== 'food') return renderBefore36();
    renderNav();
    const who = document.getElementById('who');
    if (who) who.innerHTML = (S.participants || []).map(p => `<option value="${p.id}" ${p.id === S.current ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    document.getElementById('app').innerHTML = foodPage36();
    bind();
  };

  const bindBefore36 = bind;
  bind = function bindV36() { bindBefore36(); bind36(); };

  document.addEventListener('click', e => {
    if (tab !== 'route') return;
    const b = e.target.closest('button'); if (!b) return;
    const t = b.textContent.trim().toLowerCase();
    if (['город', 'яндекс'].includes(t) && document.getElementById('routeMapFinal') && (b.closest('.route-map') || b.closest('.map-layer-switch-v11'))) {
      e.preventDefault(); e.stopImmediatePropagation(); enableRouteYandex36(b);
    }
  }, true);

  const build = document.querySelector('.build-label'); if (build) build.textContent = BUILD;
  render();
})();


;/* source: hikes-preview/workspace-v37.js */
/* V37 — one editorial/workspace language across every Hikes tab. */
(() => {
  'use strict';

  const COPY = {
    overview: { kicker: 'Поход', title: 'Обзор', desc: 'Сводка по готовности команды, маршруту, транспорту, снаряжению и питанию.' },
    participants: { kicker: 'Команда', title: 'Участники', desc: 'Статусы участия и краткая готовность каждого участника.' },
    roles: { kicker: 'Команда', title: 'Роли', desc: 'Основные зоны ответственности и дополнительные компетенции участников.' },
    gear: { kicker: 'Подготовка', title: 'Снаряжение', desc: 'Что нужно взять, что уже готово и как распределено групповое имущество.' },
    food: { kicker: 'Подготовка', title: 'Питание', desc: 'Меню, продукты, закупки и распределение воды на команду.' },
    transport: { kicker: 'Логистика', title: 'Транспорт', desc: 'Как команда добирается на мероприятие и возвращается обратно.' },
    route: { kicker: 'Навигация', title: 'Маршрут', desc: 'Линия маршрута, контрольные точки, карта и навигационные материалы.' },
    plan: { kicker: 'Навигация', title: 'План', desc: 'Время старта, темп, перерывы и последовательность этапов похода.' }
  };

  const basePageHeadV37 = pageHead;
  pageHead = function pageHeadV37(kicker, title, desc, actions = '') {
    const copy = COPY[tab];
    if (!copy) return basePageHeadV37(kicker, title, desc, actions);
    return basePageHeadV37(copy.kicker, copy.title, copy.desc, actions);
  };

  const baseTransportPageV37 = transportPage;
  transportPage = function transportPageV37() {
    const html = baseTransportPageV37();
    const withoutLegacyHero = html.replace(/<section class="tv27-hero">[\s\S]*?<\/section>/, '');
    return `${pageHead('Логистика', 'Транспорт', COPY.transport.desc)}${withoutLegacyHero}`;
  };

  function syncOverviewRolesV37() {
    if (tab !== 'overview' || !S.rolesV36?.roles) return;
    const list = document.querySelector('.ov32-responsibles');
    if (!list) return;
    list.innerHTML = S.rolesV36.roles.map(role => `<button type="button" class="${role.p ? '' : 'missing'}"><span>${esc(role.title)}</span><b>${esc(role.p ? pn(role.p) : 'Не назначено')}</b></button>`).join('');
    list.querySelectorAll('button').forEach(button => button.onclick = () => { tab = 'roles'; render(); });
    const panel = list.closest('.ov32-panel');
    const kicker = panel?.querySelector('.page-kicker');
    if (kicker) kicker.textContent = 'Ответственность';
  }

  function normalizeTabCopyV37() {
    document.body.dataset.hikeTab = tab;
    const app = document.getElementById('app');
    if (app) app.dataset.hikeTab = tab;
    const replacements = new Map([
      ['Когда и как питаемся', 'План питания'],
      ['Мне нужно сделать', 'Ближайшие действия'],
      ['Организационная сводка', 'Сводка'],
      ['Рейсы на мероприятие', 'Рейсы туда'],
      ['Обратные рейсы', 'Рейсы обратно'],
      ['Организационный таймлайн', 'Командный таймлайн'],
      ['План маршрута', 'Маршрут по времени']
    ]);
    document.querySelectorAll('.section-head h2,.ov32-panel-head h2,.tv27-card h2,.tv27-panel-head h2,.v36-food-day-head b').forEach(el => {
      const next = replacements.get(el.textContent.trim());
      if (next) el.textContent = next;
    });
    syncOverviewRolesV37();
  }

  const baseRenderV37 = render;
  render = function renderV37() {
    const result = baseRenderV37();
    normalizeTabCopyV37();
    const build = document.querySelector('.build-label');
    if (build) build.textContent = 'V37 · единый стиль всех вкладок';
    return result;
  };

  const baseBindV37 = bind;
  bind = function bindV37() {
    baseBindV37();
    normalizeTabCopyV37();
  };

  render();
})();


;/* source: hikes-preview/profile-v38.js */
/* V38 — participant self-service profile shared by participants, roles and transport. */
(() => {
  'use strict';

  const SKILL_META = [
    ['firstAid', 'Первая помощь', 'Может помочь с базовой первой помощью и аптечкой.'],
    ['cook', 'Готовка', 'Готов участвовать в общей готовке.'],
    ['radio', 'Радиосвязь', 'Умеет работать с рациями и связью группы.']
  ];

  function ensureProfile38() {
    (S.participants || []).forEach(p => {
      if (typeof p.callsign !== 'string') p.callsign = '';
    });
    if (typeof ensureTransportV24 === 'function') ensureTransportV24();
    if (!S.rolesV36) S.rolesV36 = { version: 1, roles: [], skills: {} };
    S.rolesV36.skills ||= {};
    (S.participants || []).forEach(p => {
      if (!Array.isArray(S.rolesV36.skills[p.id])) S.rolesV36.skills[p.id] = [];
    });
  }

  function person38() {
    ensureProfile38();
    return (S.participants || []).find(p => p.id === S.current) || S.participants?.[0];
  }

  function displayName38(p) {
    if (!p) return 'Участник';
    return p.callsign ? `${p.callsign} · ${p.name}` : p.name;
  }

  function profileRoles38(pid) {
    return (S.rolesV36?.roles || []).filter(r => r.p === pid).map(r => r.title);
  }

  function profileSkills38(pid) {
    return S.rolesV36?.skills?.[pid] || [];
  }

  function profilePage38() {
    const p = person38();
    if (!p) return pageHead('Личный профиль', 'Мой профиль', 'Настройки участника пока недоступны.');
    const transport = typeof transportProfileV24 === 'function' ? transportProfileV24(p.id) : { driver: false, defaultSeats: 3, phone: '', vehicle: '', color: '', plate: '' };
    const skills = profileSkills38(p.id);
    const roles = profileRoles38(p.id);
    const rsvp = typeof rsvpLabel === 'function' ? rsvpLabel(p.rsvp) : (p.rsvp || '—');
    const driverLabel = transport.driver ? `Водитель · ${Math.max(0, +transport.defaultSeats || 0)} мест` : 'Не водитель';
    const callsign = p.callsign || 'Не указан';
    const roleLabel = roles.length ? roles.join(' · ') : 'Роль не назначена';
    const skillLabels = SKILL_META.filter(([id]) => skills.includes(id)).map(([, label]) => label);

    return `${pageHead('Личный профиль', 'Мой профиль', 'Постоянные данные участника: имя, позывной, контакты, транспорт и полезные компетенции.', '<button class="btn sand" type="button" data-v38-save>Сохранить изменения</button>')}
      <div class="v38-profile-shell">
        <section class="v38-profile-summary">
          <div class="v38-identity">
            <div class="avatar">${esc(initials(p.callsign || p.name))}</div>
            <div><h2>${esc(p.name)}</h2><p>${p.callsign ? `Позывной · ${esc(p.callsign)}` : 'Позывной пока не указан'}</p><div class="v38-identity-tags">${tag(rsvp, p.rsvp === 'yes' ? 'ok' : p.rsvp === 'pending' ? 'warn' : '')}${transport.driver ? tag('Водитель', 'ok') : tag('Не водитель')}${skillLabels.slice(0, 2).map(x => tag(x)).join('')}</div></div>
          </div>
          <div class="v38-profile-facts">
            <div><small>Позывной</small><b>${esc(callsign)}</b><span>Используется внутри команды</span></div>
            <div><small>Роль в походе</small><b>${esc(roleLabel)}</b><span>Назначается организатором</span></div>
            <div><small>Транспорт</small><b>${esc(driverLabel)}</b><span>${transport.vehicle ? esc(transport.vehicle) : transport.driver ? 'Автомобиль не указан' : 'Личный автомобиль не используется'}</span></div>
          </div>
        </section>

        <div class="v38-profile-grid">
          <div class="v38-profile-stack">
            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Основные данные</h2><p>То, как участник отображается внутри похода и как с ним связаться.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-form-grid">
                  <label class="v38-field"><span>Имя</span><input id="v38Name" autocomplete="name" value="${esc(p.name || '')}" placeholder="Ваше имя"></label>
                  <label class="v38-field"><span>Позывной</span><input id="v38Callsign" value="${esc(p.callsign || '')}" placeholder="Например, Серый"></label>
                  <label class="v38-field full"><span>Телефон</span><input id="v38Phone" type="tel" autocomplete="tel" value="${esc(transport.phone || '')}" placeholder="+7 ..."><small class="v38-help">Нужен прежде всего для связи с водителем и организатором. Можно оставить пустым.</small></label>
                </div>
              </div>
            </section>

            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Транспорт</h2><p>Один транспортный профиль используется во вкладке «Транспорт» и при создании рейсов.</p></div></div>
              <div class="v38-profile-card-body">
                <label class="v38-driver-toggle"><span><b>Я могу быть водителем</b><small>После включения можно создавать рейсы и брать пассажиров.</small></span><span class="v38-switch"><input id="v38Driver" type="checkbox" ${transport.driver ? 'checked' : ''}><i></i></span></label>
                <div class="v38-form-grid v38-driver-fields ${transport.driver ? '' : 'is-disabled'}" id="v38DriverFields">
                  <label class="v38-field"><span>Пассажирских мест</span><input id="v38Seats" type="number" min="0" max="12" value="${Math.max(0, +transport.defaultSeats || 3)}"></label>
                  <label class="v38-field"><span>Автомобиль</span><input id="v38Vehicle" value="${esc(transport.vehicle || '')}" placeholder="Kia Sportage"></label>
                  <label class="v38-field"><span>Цвет</span><input id="v38Color" value="${esc(transport.color || '')}" placeholder="Серый"></label>
                  <label class="v38-field"><span>Госномер</span><input id="v38Plate" value="${esc(transport.plate || '')}" placeholder="Необязательно"></label>
                </div>
              </div>
            </section>

            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Компетенции</h2><p>Это не роли и не обязанности. Организатор просто видит, на кого можно опереться при необходимости.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-skill-grid">${SKILL_META.map(([id, label, desc]) => `<label class="v38-skill"><input type="checkbox" data-v38-skill="${id}" ${skills.includes(id) ? 'checked' : ''}><b>${esc(label)}</b><small>${esc(desc)}</small></label>`).join('')}</div>
              </div>
            </section>
          </div>

          <div class="v38-profile-stack">
            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>В этом походе</h2><p>Эти параметры относятся уже к мероприятию и меняются в соответствующих вкладках.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-readonly-list">
                  <div class="v38-readonly-row"><span>Участие</span><b>${esc(rsvp)}</b></div>
                  <div class="v38-readonly-row"><span>Основная роль</span><b class="${roles.length ? '' : 'warn'}">${esc(roleLabel)}</b></div>
                  <div class="v38-readonly-row"><span>Транспорт туда</span><b>${esc(typeof rideLabel === 'function' ? rideLabel(p.id, 'there') : '—')}</b></div>
                  <div class="v38-readonly-row"><span>Транспорт обратно</span><b>${esc(typeof rideLabel === 'function' ? rideLabel(p.id, 'back') : '—')}</b></div>
                </div>
                <div class="v38-profile-note">Статус участия, роли, конкретные рейсы, снаряжение и питание специально не редактируются здесь. Так личный профиль остаётся постоянным, а настройки конкретного похода не смешиваются с ним.</div>
              </div>
            </section>

            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Как используются данные</h2><p>Профиль связан с остальными рабочими разделами.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-readonly-list">
                  <div class="v38-readonly-row"><span>Имя и позывной</span><b>Участники и назначения</b></div>
                  <div class="v38-readonly-row"><span>Водитель и машина</span><b>Транспорт</b></div>
                  <div class="v38-readonly-row"><span>Компетенции</span><b>Роли и организация</b></div>
                  <div class="v38-readonly-row"><span>Телефон</span><b>Связь внутри команды</b></div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div class="v38-profile-actions"><button class="btn sand" type="button" data-v38-save>Сохранить изменения</button></div>
      </div>`;
  }

  function toggleDriverFields38() {
    const on = !!document.getElementById('v38Driver')?.checked;
    const box = document.getElementById('v38DriverFields');
    if (box) box.classList.toggle('is-disabled', !on);
    box?.querySelectorAll('input').forEach(i => i.disabled = !on);
  }

  function saveProfile38() {
    ensureProfile38();
    const p = person38();
    if (!p) return;
    const name = document.getElementById('v38Name')?.value.trim() || '';
    if (!name) return toast('Укажи имя');
    const driver = !!document.getElementById('v38Driver')?.checked;
    const hasRide = typeof transportDriverRideV24 === 'function' && ['there', 'back'].some(d => !!transportDriverRideV24(p.id, d));
    if (!driver && hasRide) return toast('Сначала удали созданные рейсы во вкладке «Транспорт»');

    p.name = name;
    p.callsign = document.getElementById('v38Callsign')?.value.trim() || '';

    if (typeof transportProfileV24 === 'function') {
      const t = transportProfileV24(p.id);
      Object.assign(t, {
        driver,
        defaultSeats: Math.max(0, +(document.getElementById('v38Seats')?.value || t.defaultSeats || 0)),
        phone: document.getElementById('v38Phone')?.value.trim() || '',
        vehicle: document.getElementById('v38Vehicle')?.value.trim() || '',
        color: document.getElementById('v38Color')?.value.trim() || '',
        plate: document.getElementById('v38Plate')?.value.trim() || ''
      });
    }

    const skills = S.rolesV36.skills[p.id] ||= [];
    const selected = new Set(SKILL_META.filter(([id]) => document.querySelector(`[data-v38-skill="${id}"]`)?.checked).map(([id]) => id));
    SKILL_META.forEach(([id]) => {
      const i = skills.indexOf(id);
      if (selected.has(id) && i < 0) skills.push(id);
      if (!selected.has(id) && i >= 0) skills.splice(i, 1);
    });
    const driverIndex = skills.indexOf('driver');
    if (driver && driverIndex < 0) skills.push('driver');
    if (!driver && driverIndex >= 0) skills.splice(driverIndex, 1);

    if (typeof syncLegacyTransportV24 === 'function') syncLegacyTransportV24(false);
    save();
    toast('Профиль сохранён');
    render();
  }

  function mountProfileAccess38() {
    const p = person38();
    if (!p) return;
    const nav = document.getElementById('nav');
    if (nav) {
      let wrap = document.getElementById('v38ProfileEntry');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'v38ProfileEntry';
        wrap.className = 'v38-profile-entry';
        nav.insertAdjacentElement('afterend', wrap);
      }
      wrap.innerHTML = `<button type="button" class="v38-profile-nav ${tab === 'profile' ? 'active' : ''}" id="v38ProfileNav"><span class="avatar">${esc(initials(p.callsign || p.name))}</span><span><b>${esc(p.callsign || 'Мой профиль')}</b><small>${esc(p.callsign ? p.name : 'Личные настройки')}</small></span><i>›</i></button>`;
      document.getElementById('v38ProfileNav').onclick = () => { tab = 'profile'; render(); };
    }

    const viewer = document.querySelector('.viewer');
    if (viewer) {
      let top = document.getElementById('v38ProfileTop');
      if (!top) {
        top = document.createElement('button');
        top.type = 'button';
        top.id = 'v38ProfileTop';
        top.className = 'v38-profile-top';
        viewer.appendChild(top);
      }
      top.classList.toggle('active', tab === 'profile');
      top.innerHTML = `<span class="avatar">${esc(initials(p.callsign || p.name))}</span><span>${esc(p.callsign || 'Профиль')}</span>`;
      top.onclick = () => { tab = 'profile'; render(); };
    }
  }

  function decorateProfileNames38() {
    const people = new Map((S.participants || []).map(p => [p.id, p]));
    document.querySelectorAll('select option').forEach(o => {
      const p = people.get(o.value);
      if (p) o.textContent = displayName38(p);
    });
    if (tab === 'participants') {
      const names = document.querySelectorAll('.person-copy .row-title b');
      (S.participants || []).forEach((p, i) => {
        if (!p.callsign || !names[i] || names[i].parentElement?.querySelector('.v38-callsign')) return;
        names[i].insertAdjacentHTML('afterend', `<span class="v38-callsign">${esc(p.callsign)}</span>`);
      });
    }
  }

  function bindProfile38() {
    document.getElementById('v38Driver')?.addEventListener('change', toggleDriverFields38);
    document.querySelectorAll('[data-v38-save]').forEach(b => b.onclick = saveProfile38);
    toggleDriverFields38();
  }

  ensureProfile38();
  const renderBefore38 = render;
  const bindBefore38 = bind;

  bind = function bindV38() {
    bindBefore38();
    if (tab === 'profile') bindProfile38();
    mountProfileAccess38();
    decorateProfileNames38();
  };

  render = function renderV38() {
    ensureProfile38();
    if (tab !== 'profile') {
      const out = renderBefore38();
      mountProfileAccess38();
      decorateProfileNames38();
      const build = document.querySelector('.build-label'); if (build) build.textContent = 'V38 · единый профиль участника';
      return out;
    }
    renderNav();
    const who = document.getElementById('who');
    if (who) who.innerHTML = (S.participants || []).map(p => `<option value="${p.id}" ${p.id === S.current ? 'selected' : ''}>${esc(displayName38(p))}</option>`).join('');
    const app = document.getElementById('app');
    if (app) app.innerHTML = profilePage38();
    bind();
    mountProfileAccess38();
    decorateProfileNames38();
    const build = document.querySelector('.build-label'); if (build) build.textContent = 'V38 · единый профиль участника';
  };

  render();
})();


;/* source: hikes-preview/onboarding-v39.js */
/* V39 — guided onboarding, contextual help and persistent help preferences. */
(() => {
  'use strict';

  const VERSION = 1;
  const KEY = 'rl_hikes_onboarding_v1';
  let tourActive39 = false;
  let tourStep39 = 0;
  let tourOriginTab39 = 'overview';
  let highlighted39 = null;
  let welcomeTimer39 = null;

  const TOPICS = {
    overview: {
      title: 'Обзор похода',
      text: 'Главная сводка: что уже готово и где есть незакрытые вопросы.',
      points: ['Сигналы показывают проблемы, которые требуют решения.', 'Готовность собирается из данных остальных разделов.', 'Из обзора удобно переходить к конкретной проблеме.']
    },
    participants: {
      title: 'Участники',
      text: 'Здесь фиксируется состав именно этого похода.',
      points: ['Статус участия относится к мероприятию, а не к постоянному профилю.', 'В строке видно транспорт, роль и общую готовность.', 'Имя, позывной и постоянные данные человек меняет в «Моём профиле».']
    },
    roles: {
      title: 'Роли и компетенции',
      text: 'Роль — ответственность в конкретном походе. Компетенция — постоянный навык человека.',
      points: ['Основные роли назначает организатор.', 'Первая помощь, готовка и радиосвязь отмечаются как компетенции.', 'Один человек может иметь несколько компетенций.']
    },
    gear: {
      title: 'Снаряжение',
      text: 'Сначала задаётся, что требуется походу, затем люди отмечают готовность и получают групповое имущество.',
      points: ['«Моё снаряжение» — личный чек-лист участника.', '«Групповое» — вещи, которые достаточно взять на команду.', '«Шаблон похода» позволяет организатору добавлять и менять перечень вещей.']
    },
    food: {
      title: 'Питание и вода',
      text: 'Меню превращается в расчёт продуктов, закупки и объём воды на команду.',
      points: ['Для общих блюд задаётся норма продукта на человека.', 'Одинаковые продукты из разных блюд суммируются в закупках.', 'Вода считается отдельно: питьё + готовка + резерв − пополнение.']
    },
    transport: {
      title: 'Транспорт',
      text: 'Водители создают рейсы, а пассажиры выбирают подходящую машину и точку посадки.',
      points: ['Данные машины берутся из личного профиля водителя.', 'Конкретный рейс относится только к текущему походу.', 'Место считается занятым после подтверждения водителем.']
    },
    route: {
      title: 'Маршрут',
      text: 'Рабочая карта похода: линия движения, контрольные точки и разные картографические подложки.',
      points: ['«Карта» подходит для троп и ориентиров.', '«Спутник» помогает сверять реальный рельеф и объекты.', '«Яндекс» удобен для городской части и знакомых ориентиров.']
    },
    plan: {
      title: 'План',
      text: 'Последовательность этапов похода и ориентировочное время.',
      points: ['План связывает сбор, выезд, маршрут, привалы и завершение.', 'Время — рабочий ориентир, а не обещание точности до минуты.', 'Ответственные помогают понять, кто контролирует конкретный этап.']
    },
    profile: {
      title: 'Мой профиль',
      text: 'Постоянные данные человека, которые используются в разных походах.',
      points: ['Имя, позывной и телефон не нужно вводить заново в каждом разделе.', 'Водитель и автомобиль автоматически используются в транспорте.', 'Роли конкретного похода здесь не редактируются.']
    }
  };

  const TOUR = [
    {
      id: 'event',
      title: 'Текущее мероприятие',
      text: 'Здесь видно, с каким походом вы сейчас работаете. В дальнейшем отсюда можно будет переключаться между мероприятиями.',
      selector: '.event-switcher'
    },
    {
      id: 'profile',
      tab: 'profile',
      title: 'Мой профиль',
      text: 'Заполните имя, позывной, телефон, данные автомобиля и полезные компетенции. Эти данные не нужно повторять в каждом походе.',
      selector: '.v38-profile-summary',
      fallback: '#v38ProfileEntry'
    },
    {
      id: 'participants',
      tab: 'participants',
      title: 'Кто идёт',
      text: 'Во вкладке «Участники» команда отмечает участие. Здесь же быстро видно готовность каждого человека.',
      selector: '.deadline-note',
      fallback: '.page-head'
    },
    {
      id: 'roles',
      tab: 'roles',
      title: 'Кто за что отвечает',
      text: 'Основных ролей немного: руководитель, навигатор, безопасность и логистика. Узкие навыки хранятся как компетенции.',
      selector: '.v36-role-grid',
      fallback: '.page-head'
    },
    {
      id: 'gear',
      tab: 'gear',
      title: 'Снаряжение',
      text: 'Личный чек-лист, групповое имущество, распределение по людям и редактируемый шаблон похода находятся в одном разделе.',
      selector: '.v36-tabs',
      fallback: '.page-head'
    },
    {
      id: 'food',
      tab: 'food',
      title: 'Питание и вода',
      text: 'Составьте меню — система пересчитает продукты по числу людей, сформирует закупки и поможет распределить воду.',
      selector: '.v36-tabs',
      fallback: '.page-head'
    },
    {
      id: 'transport',
      tab: 'transport',
      title: 'Транспорт',
      text: 'Водитель создаёт рейс, задаёт места и точки посадки. Остальные участники выбирают, как добираются туда и обратно.',
      selector: '.tv24-dir',
      fallback: '.page-head'
    },
    {
      id: 'route',
      tab: 'route',
      title: 'Маршрут и карта',
      text: 'Здесь находятся трек, контрольные точки и картографические подложки. Для разных задач можно переключаться между картой, спутником и Яндексом.',
      selector: '#routeMapFinal',
      fallback: '.page-head'
    },
    {
      id: 'plan',
      tab: 'plan',
      title: 'План похода',
      text: 'Последняя вкладка связывает время, этапы маршрута, привалы и ответственных в одну последовательность действий.',
      selector: '.page-head'
    }
  ];

  function readState39() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { version: VERSION, status: 'new', hintsEnabled: true };
      const parsed = JSON.parse(raw);
      return {
        version: VERSION,
        status: ['new', 'completed', 'dismissed'].includes(parsed.status) ? parsed.status : 'new',
        hintsEnabled: parsed.hintsEnabled !== false
      };
    } catch (e) {
      return { version: VERSION, status: 'new', hintsEnabled: true };
    }
  }

  function writeState39(patch) {
    const next = { ...readState39(), ...patch, version: VERSION };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  }

  function ensureLayer39() {
    let root = document.getElementById('v39Layer');
    if (!root) {
      root = document.createElement('div');
      root.id = 'v39Layer';
      root.className = 'v39-layer';
      document.body.appendChild(root);
    }
    return root;
  }

  function clearHighlight39() {
    if (highlighted39) highlighted39.classList.remove('v39-tour-target');
    highlighted39 = null;
    document.querySelectorAll('.v39-tour-target').forEach(el => el.classList.remove('v39-tour-target'));
  }

  function closeLayer39() {
    clearHighlight39();
    const root = ensureLayer39();
    root.className = 'v39-layer';
    root.innerHTML = '';
  }

  function showWelcome39() {
    if (tourActive39) return;
    const root = ensureLayer39();
    root.className = 'v39-layer open welcome';
    root.innerHTML = `<div class="v39-dim"></div><section class="v39-welcome" role="dialog" aria-modal="true" aria-labelledby="v39WelcomeTitle">
      <div class="v39-welcome-mark">РЛ</div>
      <div class="v39-kicker">Быстрый старт</div>
      <h2 id="v39WelcomeTitle">Разобраться в «Походах» за пару минут</h2>
      <p>Покажем, где профиль участника, состав команды, роли, снаряжение, питание, транспорт, маршрут и план. После этого обучение больше не будет открываться само.</p>
      <div class="v39-welcome-points"><span>9 коротких шагов</span><span>Можно прервать в любой момент</span><span>Всегда доступно через «?»</span></div>
      <div class="v39-welcome-actions"><button type="button" class="btn alt" id="v39Dismiss">Больше не показывать</button><button type="button" class="btn sand" id="v39Start">Показать за 2 минуты</button></div>
    </section>`;
    document.getElementById('v39Dismiss').onclick = () => { writeState39({ status: 'dismissed' }); closeLayer39(); };
    document.getElementById('v39Start').onclick = () => startTour39(0);
  }

  function startTour39(step = 0) {
    clearTimeout(welcomeTimer39);
    closeLayer39();
    tourActive39 = true;
    tourStep39 = Math.max(0, Math.min(TOUR.length - 1, step));
    tourOriginTab39 = tab || 'overview';
    showTourStep39();
  }

  function finishTour39(completed = true) {
    tourActive39 = false;
    clearHighlight39();
    closeLayer39();
    writeState39({ status: completed ? 'completed' : 'dismissed' });
    if (completed) {
      tab = 'overview';
      render();
      if (typeof toast === 'function') toast('Обучение завершено. Его всегда можно открыть через «?»');
    }
  }

  function targetForStep39(step) {
    const preferred = document.querySelector(step.selector || '');
    if (preferred && preferred.getClientRects().length) return preferred;
    const fallback = step.fallback ? document.querySelector(step.fallback) : null;
    if (fallback && fallback.getClientRects().length) return fallback;
    return document.querySelector('#app .page-head') || document.querySelector('.workspace');
  }

  function positionTour39(target, pop) {
    if (!target || !pop) return;
    if (window.matchMedia('(max-width: 760px)').matches) {
      pop.removeAttribute('style');
      return;
    }
    const r = target.getBoundingClientRect();
    const pad = 14;
    const width = Math.min(370, window.innerWidth - pad * 2);
    pop.style.width = `${width}px`;
    pop.style.position = 'fixed';
    let left;
    let top;
    if (r.right < window.innerWidth * 0.42) {
      left = Math.min(window.innerWidth - width - pad, r.right + 18);
      top = Math.max(pad, Math.min(window.innerHeight - pop.offsetHeight - pad, r.top));
    } else {
      left = Math.max(pad, Math.min(window.innerWidth - width - pad, r.left));
      const below = r.bottom + 16;
      top = below + pop.offsetHeight < window.innerHeight - pad ? below : Math.max(pad, r.top - pop.offsetHeight - 16);
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  function showTourStep39() {
    if (!tourActive39) return;
    const step = TOUR[tourStep39];
    if (!step) return finishTour39(true);

    if (step.tab && tab !== step.tab) {
      tab = step.tab;
      render();
      return;
    }

    clearHighlight39();
    const target = targetForStep39(step);
    if (target) {
      highlighted39 = target;
      target.classList.add('v39-tour-target');
      try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    }

    const root = ensureLayer39();
    root.className = 'v39-layer open tour';
    root.innerHTML = `<div class="v39-dim tour-dim"></div><section class="v39-tour-card" role="dialog" aria-modal="true">
      <div class="v39-tour-progress"><span>Шаг ${tourStep39 + 1} из ${TOUR.length}</span><i><b style="width:${((tourStep39 + 1) / TOUR.length) * 100}%"></b></i></div>
      <div class="v39-kicker">${step.tab ? (TOPICS[step.tab]?.title || 'Поход') : 'Навигация'}</div>
      <h2>${step.title}</h2>
      <p>${step.text}</p>
      <div class="v39-tour-actions"><button type="button" class="v39-skip" id="v39Skip">Пропустить обучение</button><span></span>${tourStep39 > 0 ? '<button type="button" class="btn alt" id="v39Prev">Назад</button>' : ''}<button type="button" class="btn sand" id="v39Next">${tourStep39 === TOUR.length - 1 ? 'Готово' : 'Далее'}</button></div>
    </section>`;

    document.getElementById('v39Skip').onclick = () => finishTour39(false);
    document.getElementById('v39Prev')?.addEventListener('click', () => { tourStep39 -= 1; showTourStep39(); });
    document.getElementById('v39Next').onclick = () => {
      if (tourStep39 >= TOUR.length - 1) return finishTour39(true);
      tourStep39 += 1;
      showTourStep39();
    };
    requestAnimationFrame(() => positionTour39(target, root.querySelector('.v39-tour-card')));
  }

  function topicModal39(topicId = tab) {
    const topic = TOPICS[topicId] || TOPICS.overview;
    const root = ensureLayer39();
    root.className = 'v39-layer open help';
    root.innerHTML = `<div class="v39-dim" data-v39-close></div><section class="v39-help-modal" role="dialog" aria-modal="true">
      <header><div><div class="v39-kicker">Справка</div><h2>${topic.title}</h2></div><button type="button" class="v39-close" data-v39-close aria-label="Закрыть">×</button></header>
      <p class="v39-help-lead">${topic.text}</p>
      <div class="v39-help-points">${topic.points.map(x => `<div><i>✓</i><span>${x}</span></div>`).join('')}</div>
      <div class="v39-help-footer"><button type="button" class="btn alt" id="v39AllHelp">Все разделы</button><button type="button" class="btn sand" id="v39TourAgain">Пройти обучение</button></div>
    </section>`;
    root.querySelectorAll('[data-v39-close]').forEach(b => b.onclick = closeLayer39);
    document.getElementById('v39TourAgain').onclick = () => startTour39(0);
    document.getElementById('v39AllHelp').onclick = helpCenter39;
  }

  function helpCenter39() {
    const state = readState39();
    const root = ensureLayer39();
    root.className = 'v39-layer open help';
    root.innerHTML = `<div class="v39-dim" data-v39-close></div><section class="v39-help-modal v39-help-center" role="dialog" aria-modal="true">
      <header><div><div class="v39-kicker">Помощь</div><h2>Как устроены «Походы»</h2></div><button type="button" class="v39-close" data-v39-close aria-label="Закрыть">×</button></header>
      <p class="v39-help-lead">Выберите раздел для короткого объяснения или запустите интерактивный тур заново.</p>
      <div class="v39-help-grid">${Object.entries(TOPICS).map(([id, x]) => `<button type="button" data-v39-topic="${id}"><b>${x.title}</b><span>${x.text}</span></button>`).join('')}</div>
      <div class="v39-help-settings"><label><span><b>Контекстные подсказки</b><small>Показывать маленькие кнопки «?» возле сложных разделов.</small></span><span class="v39-switch"><input id="v39HintsGlobal" type="checkbox" ${state.hintsEnabled ? 'checked' : ''}><i></i></span></label></div>
      <div class="v39-help-footer"><button type="button" class="btn alt" data-v39-close>Закрыть</button><button type="button" class="btn sand" id="v39TourAgain">Пройти обучение</button></div>
    </section>`;
    root.querySelectorAll('[data-v39-close]').forEach(b => b.onclick = closeLayer39);
    root.querySelectorAll('[data-v39-topic]').forEach(b => b.onclick = () => topicModal39(b.dataset.v39Topic));
    document.getElementById('v39TourAgain').onclick = () => startTour39(0);
    document.getElementById('v39HintsGlobal').onchange = e => {
      writeState39({ hintsEnabled: e.target.checked });
      closeLayer39();
      mountHelp39();
      if (typeof toast === 'function') toast(e.target.checked ? 'Подсказки включены' : 'Контекстные подсказки отключены');
    };
  }

  function mountTopHelp39() {
    const viewer = document.querySelector('.viewer');
    if (!viewer) return;
    let btn = document.getElementById('v39HelpTop');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'v39HelpTop';
      btn.type = 'button';
      btn.className = 'v39-help-top';
      btn.title = 'Помощь и обучение';
      btn.setAttribute('aria-label', 'Помощь и обучение');
      btn.textContent = '?';
      viewer.appendChild(btn);
    }
    btn.onclick = helpCenter39;
  }

  function mountContextHelp39() {
    document.querySelectorAll('.v39-context-help').forEach(x => x.remove());
    if (!readState39().hintsEnabled || tourActive39) return;
    const topic = TOPICS[tab];
    const head = document.querySelector('#app .page-head');
    if (!topic || !head) return;
    const actions = head.querySelector('.page-head__actions') || head;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v39-context-help';
    btn.title = `Что здесь находится: ${topic.title}`;
    btn.setAttribute('aria-label', `Справка: ${topic.title}`);
    btn.textContent = '?';
    btn.onclick = () => topicModal39(tab);
    actions.prepend(btn);
  }

  function mountProfileHelp39() {
    if (tab !== 'profile') return;
    const grid = document.querySelector('.v38-profile-grid');
    if (!grid || document.getElementById('v39ProfileHelp')) return;
    const state = readState39();
    const stack = grid.lastElementChild || grid;
    const card = document.createElement('section');
    card.id = 'v39ProfileHelp';
    card.className = 'v38-profile-card v39-profile-help';
    card.innerHTML = `<div class="v38-profile-card-head"><div><h2>Помощь и обучение</h2><p>Управление подсказками интерфейса для этого браузера.</p></div></div><div class="v38-profile-card-body">
      <label class="v39-setting-row"><span><b>Контекстные подсказки</b><small>Показывать кнопки «?» с пояснениями на рабочих вкладках.</small></span><span class="v39-switch"><input id="v39ProfileHints" type="checkbox" ${state.hintsEnabled ? 'checked' : ''}><i></i></span></label>
      <div class="v39-profile-help-actions"><button type="button" class="btn alt" id="v39OpenHelp">Открыть справку</button><button type="button" class="btn alt" id="v39RestartTour">Пройти обучение заново</button></div>
      <small class="v39-setting-note">Статус обучения хранится только в этом браузере. Очистка данных сайта сбросит настройку.</small>
    </div>`;
    stack.appendChild(card);
    document.getElementById('v39ProfileHints').onchange = e => {
      writeState39({ hintsEnabled: e.target.checked });
      mountContextHelp39();
      if (typeof toast === 'function') toast(e.target.checked ? 'Подсказки включены' : 'Контекстные подсказки отключены');
    };
    document.getElementById('v39OpenHelp').onclick = helpCenter39;
    document.getElementById('v39RestartTour').onclick = () => startTour39(0);
  }

  function mountHelp39() {
    mountTopHelp39();
    mountContextHelp39();
    mountProfileHelp39();
    const build = document.querySelector('.build-label');
    if (build) build.textContent = 'V39 · обучение и контекстная помощь';
  }

  const renderBefore39 = render;
  const bindBefore39 = bind;

  bind = function bindV39() {
    bindBefore39();
    mountHelp39();
  };

  render = function renderV39() {
    const out = renderBefore39();
    mountHelp39();
    if (tourActive39) setTimeout(showTourStep39, 30);
    return out;
  };

  window.addEventListener('resize', () => {
    if (!tourActive39) return;
    const root = ensureLayer39();
    const card = root.querySelector('.v39-tour-card');
    const step = TOUR[tourStep39];
    if (card && step) positionTour39(targetForStep39(step), card);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (tourActive39) finishTour39(false);
    else if (ensureLayer39().classList.contains('open')) closeLayer39();
  });

  mountHelp39();
  if (readState39().status === 'new') {
    welcomeTimer39 = setTimeout(() => {
      if (!tourActive39 && !document.querySelector('.modal-layer.open')) showWelcome39();
    }, 650);
  }
})();


;/* source: hikes-preview/onboarding-v40-fix.js */
/* V40 — keep onboarding cards above large map targets and prevent the route step from swallowing the tour. */
(() => {
  'use strict';

  function reposition40(target, card) {
    if (!target || !card || window.matchMedia('(max-width:760px)').matches) return;
    const r = target.getBoundingClientRect();
    const pad = 14;
    const width = Math.min(370, window.innerWidth - pad * 2);
    card.style.width = `${width}px`;
    card.style.position = 'fixed';
    let left = Math.max(pad, Math.min(window.innerWidth - width - pad, r.left));
    let top = r.bottom + 14;
    if (top + card.offsetHeight > window.innerHeight - pad) top = Math.max(pad, r.top - card.offsetHeight - 14);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function normalizeTourTarget40() {
    const layer = document.getElementById('v39Layer');
    if (!layer?.classList.contains('tour')) return;
    const card = layer.querySelector('.v39-tour-card');
    let target = document.querySelector('.v39-tour-target');
    if (!card || !target) return;
    const rect = target.getBoundingClientRect();
    const tooLarge = rect.height > window.innerHeight * .48 || rect.width > window.innerWidth * .78;
    const isRouteMap = target.id === 'routeMapFinal' || !!target.closest('#routeMapFinal');
    if (tooLarge || isRouteMap) {
      target.classList.remove('v39-tour-target');
      const safe = document.querySelector('#app .page-head') || document.querySelector('.topbar');
      if (safe) {
        safe.classList.add('v39-tour-target');
        target = safe;
      }
    }
    requestAnimationFrame(() => reposition40(target, card));
  }

  const observer = new MutationObserver(() => normalizeTourTarget40());
  observer.observe(document.documentElement, { subtree:true, childList:true, attributes:true, attributeFilter:['class'] });
  window.addEventListener('resize', normalizeTourTarget40);
  window.addEventListener('scroll', () => {
    const layer = document.getElementById('v39Layer');
    if (!layer?.classList.contains('tour')) return;
    const target = document.querySelector('.v39-tour-target');
    const card = layer.querySelector('.v39-tour-card');
    if (target && card) reposition40(target,card);
  }, { passive:true });
})();


;/* source: hikes-preview/transport-v40.js */
/* V40 — transport workspace: profile is the single source of driver/car data, event rides keep only event-specific settings, Yandex JS API powers transport maps and pickup-point selection. */
(() => {
  'use strict';

  const YANDEX_KEY_V40 = 'ec183557-30ee-4662-86c4-c363798c6092';
  const COLORS_V40 = ['#2f6b4f','#3b74a8','#9a6a2b','#7557a6','#5f7d70','#a35454'];
  const mapState40 = { map: null, entities: [], points: new Map(), host: null, status: null };
  const pickerState40 = { map: null, marker: null, listener: null };
  const requestMapState40 = { map: null, markers: [], points: new Map() };
  let yandexPromise40 = null;

  function organizer40() {
    const roles = S.rolesV36?.roles || [];
    const lead = roles.find(r => r.id === 'lead')?.p;
    const logistics = roles.find(r => r.id === 'logistics')?.p;
    return window.HikeWorkspace?.can('transport') ?? (S.current === 'p1' || S.current === lead);
  }

  function profile40(pid = S.current) {
    return transportProfileV24(pid) || { driver:false, defaultSeats:0, phone:'', vehicle:'', color:'', plate:'' };
  }

  function rideVehicle40(r) {
    const p = profile40(r.driver);
    return {
      vehicle: p.vehicle || r.vehicle || 'Автомобиль не указан',
      color: p.color || r.color || '',
      plate: p.plate || r.plate || ''
    };
  }

  function syncRideProfile40(r) {
    if (!r) return;
    const p = profile40(r.driver);
    if (p.vehicle) r.vehicle = p.vehicle;
    if (p.color) r.color = p.color;
    if (p.plate) r.plate = p.plate;
  }

  function openProfile40() {
    tab = 'profile';
    render();
  }

  function loadYandex40() {
    if (window.ymaps3?.ready) return window.ymaps3.ready.then(() => window.ymaps3);
    if (yandexPromise40) return yandexPromise40;
    yandexPromise40 = new Promise((resolve, reject) => {
      const ready = () => {
        if (!window.ymaps3?.ready) return reject(new Error('Yandex Maps API is unavailable'));
        window.ymaps3.ready.then(() => resolve(window.ymaps3)).catch(reject);
      };
      const existing = [...document.scripts].find(s => s.src?.includes('api-maps.yandex.ru/v3/'));
      if (existing) {
        if (window.ymaps3?.ready) return ready();
        existing.addEventListener('load', ready, { once:true });
        existing.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once:true });
        setTimeout(() => { if (window.ymaps3?.ready) ready(); }, 1200);
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.dataset.rlTransportYandexV40 = '1';
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(YANDEX_KEY_V40)}&lang=ru_RU`;
      script.addEventListener('load', ready, { once:true });
      script.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once:true });
      document.head.appendChild(script);
    });
    return yandexPromise40;
  }

  function carSvg40() {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8.5 22.5 11 16.8c.7-1.7 2.1-2.8 3.9-3.1l8.7-1.3c1.7-.2 3.3.4 4.4 1.7l4.3 5.1 1.6.5c1.3.4 2.1 1.6 2.1 2.9v5.1h-2.8a4.5 4.5 0 0 1-8.7 0h-9a4.5 4.5 0 0 1-8.7 0H4v-3.2c0-1.1.7-2.1 1.8-2.5l2.7-.9Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m12 20 2-4.1 9.8-1.4c.9-.1 1.8.2 2.4.9l3.7 4.6H12Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="11.2" cy="27.4" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="28.8" cy="27.4" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`;
  }

  function yMarkerElement40(kind, label, title, subtitle = '') {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `tv40-y-marker ${kind}`;
    el.innerHTML = `<span>${esc(label)}</span><em><b>${esc(title)}</b>${subtitle ? `<small>${esc(subtitle)}</small>` : ''}</em>`;
    return el;
  }

  function destroyYandexMap40(state = mapState40) {
    try { state.map?.destroy?.(); } catch (e) {}
    state.map = null;
    if (state.entities) state.entities.length = 0;
    if (state.markers) state.markers.length = 0;
    state.points?.clear?.();
  }

  function allTransportPoints40() {
    const out = [];
    const a = tv24().arrival;
    if (hasCoordV24(a)) out.push({ key:'arrival', kind:'arrival', label:'★', title:a.title || 'Место мероприятия', subtitle:dir === 'there' ? (a.time || '') : (a.returnTime || ''), lon:+a.lon, lat:+a.lat });
    tv24().rides[dir].forEach((r, ri) => {
      (r.stops || []).forEach((s, si) => {
        if (!hasCoordV24(s)) return;
        out.push({ key:`${r.id}:${s.id}`, kind:'pickup', label:String(si + 1), title:s.title || stopKindV24(dir), subtitle:`${pn(r.driver)}${s.time ? ` · ${s.time}` : ''}`, lon:+s.lon, lat:+s.lat, rideId:r.id, stopId:s.id, color:COLORS_V40[ri % COLORS_V40.length] });
      });
    });
    return out;
  }

  function bounds40(points) {
    if (!points.length) return null;
    if (points.length === 1) return { center:[points[0].lon, points[0].lat], zoom:15 };
    const lons = points.map(p => p.lon), lats = points.map(p => p.lat);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
    if (Math.abs(maxLon - minLon) < .0001 && Math.abs(maxLat - minLat) < .0001) return { center:[minLon, minLat], zoom:15 };
    return { bounds:[[minLon, minLat],[maxLon, maxLat]] };
  }

  function setMapStatus40(text = '', error = false) {
    const el = document.getElementById('tv40MapStatus');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('show', !!text);
    el.classList.toggle('error', !!error);
  }

  async function mountTransportMap40() {
    const host = document.getElementById('transportMapV24');
    if (!host) return;
    destroyYandexMap40(mapState40);
    mapState40.host = host;
    mapState40.status = document.getElementById('tv40MapStatus');
    setMapStatus40('Загрузка Яндекс Карт…');
    try {
      const ymaps3 = await loadYandex40();
      if (!document.getElementById('transportMapV24')) return;
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;
      const points = allTransportPoints40();
      const location = bounds40(points) || { center:[37.93,55.59], zoom:11 };
      const map = new YMap(host, { location, mode:'raster', theme:'light', zoomRange:{min:3,max:20} }, [new YMapDefaultSchemeLayer(), new YMapDefaultFeaturesLayer()]);
      mapState40.map = map;
      points.forEach(p => {
        const el = yMarkerElement40(p.kind, p.label, p.title, p.subtitle);
        el.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); focusTransportPoint40(p.key); };
        if (p.color) el.style.setProperty('--ride-color', p.color);
        const marker = new YMapMarker({ coordinates:[p.lon,p.lat], zIndex:p.kind === 'arrival' ? 50 : 30 }, el);
        map.addChild(marker);
        mapState40.entities.push(marker);
        mapState40.points.set(p.key, p);
      });
      setMapStatus40('');
    } catch (error) {
      console.error('Transport Yandex map failed', error);
      setMapStatus40('Не удалось загрузить Яндекс Карту. Проверьте доступ ключа и обновите страницу.', true);
    }
  }

  function fitTransportMap40() {
    const points = [...mapState40.points.values()];
    const loc = bounds40(points);
    if (mapState40.map && loc) mapState40.map.setLocation({ ...loc, duration:250 });
  }

  function focusTransportPoint40(key) {
    const p = mapState40.points.get(key) || allTransportPoints40().find(x => x.key === key);
    if (!p) return;
    mapState40.map?.setLocation?.({ center:[p.lon,p.lat], zoom:16, duration:260 });
    document.querySelectorAll('[data-tv40-point-key]').forEach(el => el.classList.toggle('is-focused', el.dataset.tv40PointKey === key));
    const row = document.querySelector(`[data-tv40-point-key="${CSS.escape(key)}"]`);
    row?.scrollIntoView?.({ block:'nearest', behavior:'smooth' });
  }

  function summary40() {
    const s = transportSummaryV24(dir);
    const unresolved = s.unset + s.pending;
    const metrics = [
      ['all','Участников',s.total,'подтвердили участие'],
      ['incars','В машинах',s.inCars,'подтверждённые места'],
      ['free','Свободных мест',s.free,s.drivers ? `${s.drivers} водител${s.drivers === 1 ? 'ь' : 'я'}` : 'рейсов пока нет'],
      ['unresolved','Без решения',unresolved,s.pending ? `${s.pending} ждут ответа` : 'нужно выбрать транспорт']
    ];
    return `<div class="tv40-summary">${metrics.map(([filter,label,value,note]) => `<button type="button" data-tv40-people="${filter}" class="${filter === 'unresolved' && unresolved ? 'warn' : ''}"><small>${label}</small><strong>${value}</strong><span>${note}</span></button>`).join('')}</div>`;
  }

  function destination40() {
    const a = tv24().arrival;
    const time = dir === 'there' ? a.time : a.returnTime;
    return `<section class="tv40-destination" data-tv40-point-key="arrival"><div class="tv40-dest-pin">★</div><div class="tv40-dest-copy"><small>${dir === 'there' ? 'МЕСТО ПРИБЫТИЯ' : 'ТОЧКА ОБРАТНОГО ВЫЕЗДА'}</small><h2>${esc(a.title || 'Место мероприятия')}</h2><p>${esc(a.note || 'Точка транспорта задаётся отдельно от пешего маршрута.')}</p><div><span>${time ? `${dir === 'there' ? 'Быть к' : 'Выезд'} ${esc(time)}` : 'Время уточняется'}</span><code>${esc(fmtCoordV24(a.lat,a.lon))}</code></div></div><div class="tv40-dest-actions"><button class="btn alt sm" type="button" data-tv40-focus="arrival">Показать на карте</button>${hasCoordV24(a) ? '<button class="btn alt sm" type="button" data-tv24-yandex-point="arrival">Открыть в Яндекс</button>' : ''}${organizer40() ? '<button class="btn alt sm" type="button" id="tv40EditArrival">Изменить</button>' : ''}</div></section>`;
  }

  function profileReference40() {
    const p = profile40();
    const ride = transportDriverRideV24(S.current, dir);
    const vehicle = p.vehicle ? `${p.vehicle}${p.color ? ` · ${p.color}` : ''}` : 'Автомобиль не указан';
    return `<div class="tv40-profile-ref"><div class="avatar">${initials(pn(S.current))}</div><div><small>ДАННЫЕ ИЗ МОЕГО ПРОФИЛЯ</small><strong>${p.driver ? 'Я водитель' : 'Я не водитель'}</strong><span>${p.driver ? `${esc(vehicle)} · обычно ${Math.max(0,+p.defaultSeats||0)} пассажирских мест` : 'Чтобы создавать рейсы, включите водителя в личном профиле.'}</span></div><div class="tv40-profile-actions"><button type="button" class="btn alt sm" id="tv40OpenProfile">Мой профиль</button>${p.driver && !ride ? '<button type="button" class="btn sand sm" id="tv40CreateRide">+ Создать рейс</button>' : ''}</div></div>`;
  }

  function myTrip40() {
    const active = transportRequestV24();
    const c = transportChoiceV24();
    const own = transportDriverRideV24();
    if (own) return `<section class="tv40-mytrip driver"><div><small>МОЙ РЕЙС · ${directionLabelV24(dir).toUpperCase()}</small><strong>${(own.passengers||[]).length}/${+own.seats||0} пассажиров</strong><span>${transportFreeV24(own)} свободных мест · ${(own.stops||[]).length} ${dir === 'there' ? 'точек посадки' : 'точек высадки'}</span></div><div class="row-actions"><button class="btn sand sm" data-tv40-add-stop="${own.id}">+ ${dir === 'there' ? 'Точка посадки' : 'Точка высадки'}</button><button class="btn alt sm" data-tv40-edit-ride="${own.id}">Параметры рейса</button>${dir === 'there' ? `<button class="btn alt sm" data-tv40-copy-back="${own.id}">Скопировать обратно</button>` : ''}</div></section>`;
    if (c.mode === 'self') return `<section class="tv40-mytrip self"><div><small>МОЙ ТРАНСПОРТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Добираюсь самостоятельно</strong><span>Ориентируйтесь на место и время мероприятия.</span></div><button class="btn alt sm" data-tv40-unset-self>Изменить</button></section>`;
    if (active) {
      const r = active.ride, q = active.request, stop = (r.stops||[]).find(s => s.id === q.pickupId), approved = q.status === 'approved', prof = profile40(r.driver), car = rideVehicle40(r);
      return `<section class="tv40-mytrip ${approved ? 'approved' : 'pending'}"><div><small>${approved ? 'МЕСТО ПОДТВЕРЖДЕНО' : 'ЗАЯВКА У ВОДИТЕЛЯ'}</small><strong>${esc(pn(r.driver))} · ${esc(car.vehicle)}</strong><span>${esc(stop?.title || stopKindV24(dir))}${stop?.time ? ` · ${dir === 'there' ? 'быть к' : 'высадка'} ${esc(stop.time)}` : ''}</span>${approved && prof.phone ? `<a href="tel:${esc(prof.phone)}">${esc(prof.phone)}</a>` : ''}</div><div class="row-actions">${stop && hasCoordV24(stop) ? `<button class="btn sand sm" data-tv40-focus="${r.id}:${stop.id}">Показать точку</button><button class="btn alt sm" data-tv24-yandex-stop="${r.id}:${stop.id}">Открыть в Яндекс</button>` : ''}<button class="btn alt sm" data-tv40-cancel="${q.id}">${approved ? 'Отказаться от места' : 'Отменить заявку'}</button></div></section>`;
    }
    return `<section class="tv40-mytrip unset"><div><small>МОЙ ТРАНСПОРТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Транспорт пока не выбран</strong><span>Выберите подходящий рейс ниже или отметьте самостоятельную поездку.</span></div><button class="btn alt sm" data-tv40-self>Поеду самостоятельно</button></section>`;
  }

  function stopRows40(r) {
    const stops = r.stops || [];
    if (!stops.length) return `<div class="tv40-empty-inline">${r.driver === S.current ? `Добавьте ${dir === 'there' ? 'точку посадки' : 'точку высадки'} на Яндекс Карте.` : `Водитель пока не указал ${dir === 'there' ? 'точку посадки' : 'точку высадки'}.`}</div>`;
    return stops.map((s, i) => `<button type="button" class="tv40-stop ${hasCoordV24(s) ? '' : 'missing'}" data-tv40-focus="${r.id}:${s.id}" data-tv40-point-key="${r.id}:${s.id}"><i>${i + 1}</i><span><b>${esc(s.title || stopKindV24(dir))}</b><small>${s.time ? esc(s.time) : 'время уточняется'}${s.note ? ` · ${esc(s.note)}` : ''}</small></span><em>На карте</em></button>`).join('');
  }

  function pendingRequests40(r) {
    const pending = pendingForRideV24(r);
    if (r.driver !== S.current || !pending.length) return '';
    return `<div class="tv40-requests"><div class="tv40-requests-head"><b>Заявки пассажиров</b><span>${pending.length}</span></div>${pending.map(q => { const st = (r.stops||[]).find(s => s.id === q.pickupId); return `<div class="tv40-request"><span><strong>${esc(pn(q.pid))}</strong><small>${esc(st?.title || 'Точка не выбрана')}${st?.time ? ` · ${esc(st.time)}` : ''}</small></span><button class="btn sand sm" data-tv40-approve="${r.id}:${q.id}">Подтвердить</button><button class="btn alt sm" data-tv40-decline="${r.id}:${q.id}">Отказать</button></div>`; }).join('')}</div>`;
  }

  function rideCard40(r, index) {
    syncRideProfile40(r);
    const me = r.driver === S.current, free = transportFreeV24(r), car = rideVehicle40(r), active = transportRequestV24(), blocked = active && active.ride.id !== r.id, full = free <= 0;
    return `<div class="tv40-ride-wrap"><article class="tv40-ride ${me ? 'mine' : ''}"><header><div class="tv40-driver"><div class="tv40-car-icon">${carSvg40()}</div><div><small>${me ? 'МОЙ РЕЙС' : 'ВОДИТЕЛЬ'}</small><h3>${esc(pn(r.driver))}</h3><p>${esc(car.vehicle)}${car.color ? ` · ${esc(car.color)}` : ''}${car.plate ? ` · ${esc(car.plate)}` : ''}</p></div></div><div class="tv40-capacity ${full ? 'full' : ''}"><strong>${free}</strong><span>свободно из ${+r.seats||0}</span></div></header><div class="tv40-stops">${stopRows40(r)}</div>${r.comment ? `<div class="tv40-comment">${esc(r.comment)}</div>` : ''}<div class="tv40-passengers"><div><small>ПАССАЖИРЫ</small><span>${(r.passengers||[]).length ? (r.passengers||[]).map(pid => `<b title="${esc(pn(pid))}">${esc(initials(pn(pid)))}</b>`).join('') : '<em>Пока никого</em>'}</span></div><div class="row-actions">${me ? `<button class="btn sand sm" data-tv40-add-stop="${r.id}">+ ${dir === 'there' ? 'Посадка' : 'Высадка'}</button><button class="btn alt sm" data-tv40-edit-ride="${r.id}">Параметры</button>` : `<button class="btn sand sm" data-tv40-request="${r.id}" ${full || blocked || active?.ride.id === r.id ? 'disabled' : ''}>${active?.ride.id === r.id ? (active.request.status === 'approved' ? 'Место подтверждено' : 'Заявка отправлена') : full ? 'Мест нет' : 'Попроситься'}</button>`}<button class="btn alt sm" data-tv24-yandex-ride="${r.id}">Маршрут в Яндекс</button></div></div></article>${pendingRequests40(r)}</div>`;
  }

  function rides40() {
    const rides = tv24().rides[dir] || [];
    return `<section class="tv40-panel"><div class="tv40-panel-head"><div><div class="page-kicker">${dir === 'there' ? 'Туда' : 'Обратно'}</div><h2>${dir === 'there' ? 'Рейсы и точки посадки' : 'Обратные рейсы и высадки'}</h2><p>${dir === 'there' ? 'Пассажир выбирает водителя и конкретную точку. Водитель подтверждает заявку.' : 'По умолчанию возвращаемся в той же машине. Здесь можно изменить возвращение; время обратного выезда уточняет водитель.'}</p></div></div><div class="tv40-rides">${rides.length ? rides.map(rideCard40).join('') : `<div class="tv40-empty"><div class="tv40-empty-icon">${carSvg40()}</div><strong>Рейсов пока нет</strong><span>${profile40().driver ? 'Создайте первый рейс и отметьте точку посадки на карте.' : 'Когда водитель создаст рейс, он появится здесь.'}</span>${profile40().driver ? '<button class="btn sand sm" id="tv40CreateRideEmpty">+ Создать рейс</button>' : ''}</div>`}</div></section>`;
  }

  function mapPanel40() {
    return `<aside class="tv40-map-panel"><div class="tv40-map-head"><div><div class="page-kicker">Яндекс Карты</div><h2>Точки транспорта</h2><p>Место мероприятия и все точки ${dir === 'there' ? 'посадки' : 'высадки'} на одной карте.</p></div><button class="btn alt sm" type="button" id="tv40FitMap">Все точки</button></div><div class="tv40-map-wrap"><div id="transportMapV24" class="tv40-map"></div><div class="tv40-map-status" id="tv40MapStatus"></div></div><div class="tv40-map-foot"><span><i class="arrival"></i>Место мероприятия</span><span><i class="pickup"></i>${dir === 'there' ? 'Посадка' : 'Высадка'}</span><small>Маршрут по дорогам открывается отдельной кнопкой в Яндекс Картах.</small></div></aside>`;
  }

  function transportPage40() {
    ensureTransportV24();
    (tv24().rides[dir] || []).forEach(syncRideProfile40);
    return `${pageHead('Логистика','Транспорт','Рейсы, точки посадки и заявки пассажиров. Данные водителя и автомобиля редактируются только в личном профиле.', '<button class="btn alt" type="button" id="tv40ProfileTop">Мой профиль</button>')}
      <div class="tv40-shell">
        <div class="tv40-toolbar"><div class="segmented tv40-directions tv24-dir"><button class="${dir === 'there' ? 'active' : ''}" data-tv40-dir="there">Поездка на мероприятие</button><button class="${dir === 'back' ? 'active' : ''}" data-tv40-dir="back">Изменить возвращение</button></div><span>${dir === 'there' ? 'Обратно — та же машина, если не выбран другой вариант' : 'Возвращение после мероприятия'}</span></div>
        ${summary40()}
        ${profileReference40()}
        ${destination40()}
        ${myTrip40()}
        <div class="tv40-workgrid">${rides40()}${mapPanel40()}</div>
      </div>`;
  }

  function peopleStatus40(pid) {
    const c = transportChoiceV24(pid,dir);
    if (c.mode === 'driver') {
      const r = transportDriverRideV24(pid,dir);
      return { label:'Водитель', tone:'ok', detail:r ? `${transportFreeV24(r)} свободных мест` : 'рейс не создан' };
    }
    if (c.mode === 'ride') {
      const r = transportRideV24(c.rideId,dir), st = (r?.stops||[]).find(s => s.id === c.pickupId);
      return { label:'Место подтверждено', tone:'ok', detail:r ? `${pn(r.driver)}${st ? ` · ${st.title}` : ''}` : 'машина выбрана' };
    }
    if (c.mode === 'request') return { label:'Ждёт ответа', tone:'warn', detail:'заявка у водителя' };
    if (c.mode === 'self') return { label:'Самостоятельно', tone:'', detail:'без машины команды' };
    return { label:'Без решения', tone:'risk', detail:'нужно выбрать транспорт' };
  }

  function openPeople40(filter = 'all') {
    const rides = tv24().rides[dir] || [];
    let people = (S.participants||[]).filter(p => p.rsvp === 'yes');
    if (filter === 'incars') people = people.filter(p => transportChoiceV24(p.id,dir).mode === 'ride');
    if (filter === 'unresolved') people = people.filter(p => ['unset','request'].includes(transportChoiceV24(p.id,dir).mode));
    if (filter === 'free') {
      const freeDrivers = new Set(rides.filter(r => transportFreeV24(r) > 0).map(r => r.driver));
      people = people.filter(p => freeDrivers.has(p.id));
    }
    const title = filter === 'incars' ? 'Пассажиры в машинах' : filter === 'free' ? 'Водители со свободными местами' : filter === 'unresolved' ? 'Без решения / ждут ответа' : 'Транспорт участников';
    openModal(title, `<div class="tv40-people">${people.length ? people.map(p => { const s = peopleStatus40(p.id), pr = profile40(p.id); return `<div class="tv40-person"><span class="avatar">${initials(p.name)}</span><span><b>${esc(p.name)}</b><small>${esc(s.detail)}</small></span><em class="${s.tone}">${esc(s.label)}</em>${pr.driver && pr.vehicle ? `<small>${esc(pr.vehicle)}</small>` : ''}</div>`; }).join('') : '<div class="tv40-empty-inline">По этому фильтру никого нет.</div>'}</div>`, () => true);
    const saveBtn = document.getElementById('modalSave'); if (saveBtn) saveBtn.textContent = 'Закрыть';
    document.getElementById('modalCancel')?.remove();
  }

  function rideModal40(ride = null, d = dir) {
    const p = profile40();
    if (!p.driver) return openProfile40();
    const existing = ride || { seats:Math.max(0,+p.defaultSeats||0), comment:'' };
    const carText = p.vehicle ? `${p.vehicle}${p.color ? ` · ${p.color}` : ''}${p.plate ? ` · ${p.plate}` : ''}` : 'Автомобиль не заполнен в профиле';
    openModal(ride ? 'Параметры рейса' : `Новый рейс · ${directionLabelV24(d)}`, `<div class="tv40-ride-editor"><div class="tv40-readonly-car"><div class="tv40-car-icon">${carSvg40()}</div><div><small>АВТОМОБИЛЬ ИЗ ПРОФИЛЯ</small><b>${esc(carText)}</b><span>Изменить машину можно только в «Моём профиле».</span></div><button class="btn alt sm" type="button" id="tv40ProfileFromRide">Профиль</button></div><div class="form-grid"><div class="field"><label>Пассажирских мест на этот рейс</label><input id="tv40RideSeats" type="number" min="0" max="12" value="${Math.max(0,+existing.seats||0)}"></div><div class="field full"><label>Комментарий пассажирам</label><textarea id="tv40RideComment" placeholder="Например: без крупного багажа; позвоните за 5 минут">${esc(existing.comment||'')}</textarea></div></div>${ride ? '<div class="tv40-danger"><button class="btn alt sm" type="button" id="tv40DeleteRide">Удалить рейс</button></div>' : ''}</div>`, layer => {
      const seats = Math.max(0,+layer.querySelector('#tv40RideSeats').value||0);
      if (ride && seats < (ride.passengers||[]).length) { toast('Мест не может быть меньше подтверждённых пассажиров'); return false; }
      let target = ride;
      if (!target) {
        if (transportDriverRideV24(S.current,d)) { toast('В этом направлении у вас уже есть рейс'); return false; }
        target = { id:`ride_${d}_${Date.now()}`, driver:S.current, seats, vehicle:p.vehicle||'', color:p.color||'', plate:p.plate||'', comment:'', stops:[], passengers:[], requests:[] };
        tv24().rides[d].push(target);
        tv24().choices[d][S.current] = { mode:'driver', rideId:target.id };
      }
      target.seats = seats;
      target.comment = layer.querySelector('#tv40RideComment').value.trim();
      syncRideProfile40(target);
      transportSaveV24(target.stops.length ? 'Рейс сохранён' : 'Рейс создан — добавьте точку на карте');
    });
    setTimeout(() => {
      document.getElementById('tv40ProfileFromRide')?.addEventListener('click', () => { document.getElementById('modalCancel')?.click(); openProfile40(); });
      document.getElementById('tv40DeleteRide')?.addEventListener('click', () => {
        if (!ride) return;
        if ((ride.passengers||[]).length || pendingForRideV24(ride).length) return toast('Сначала закройте заявки и освободите пассажиров');
        if (!confirm('Удалить этот рейс?')) return;
        tv24().rides[d] = tv24().rides[d].filter(x => x.id !== ride.id);
        tv24().choices[d][ride.driver] = { mode:'unset' };
        document.getElementById('modalCancel')?.click();
        transportSaveV24('Рейс удалён');
      });
    }, 0);
  }

  function pickerInitial40(v) {
    if (hasCoordV24(v)) return [ +v.lon, +v.lat ];
    const a = tv24().arrival;
    if (hasCoordV24(a)) return [ +a.lon, +a.lat ];
    return [37.93,55.59];
  }

  function setPickerCoords40(coords, center = false) {
    const [lon,lat] = coords;
    const latInput = document.getElementById('tv40PointLat'), lonInput = document.getElementById('tv40PointLon'), label = document.getElementById('tv40PickerCoords');
    if (latInput) latInput.value = (+lat).toFixed(6);
    if (lonInput) lonInput.value = (+lon).toFixed(6);
    if (label) label.textContent = `${(+lat).toFixed(6)}, ${(+lon).toFixed(6)}`;
    pickerState40.marker?.update?.({ coordinates:[+lon,+lat] });
    if (center) pickerState40.map?.setLocation?.({ center:[+lon,+lat], zoom:16, duration:180 });
  }

  async function mountPickerMap40(v) {
    const el = document.getElementById('tv40PointMap');
    if (!el) return;
    try { pickerState40.map?.destroy?.(); } catch (e) {}
    pickerState40.map = null; pickerState40.marker = null; pickerState40.listener = null;
    const status = document.getElementById('tv40PickerStatus');
    if (status) status.textContent = 'Загрузка Яндекс Карт…';
    try {
      const ymaps3 = await loadYandex40();
      if (!document.getElementById('tv40PointMap')) return;
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = ymaps3;
      const initial = pickerInitial40(v);
      const map = new YMap(el, { location:{center:initial,zoom:hasCoordV24(v)?16:13}, mode:'raster', theme:'light', zoomRange:{min:3,max:20} }, [new YMapDefaultSchemeLayer(),new YMapDefaultFeaturesLayer()]);
      const markerEl = document.createElement('div'); markerEl.className = 'tv40-picker-marker'; markerEl.innerHTML = '<span></span>';
      const marker = new YMapMarker({ coordinates:initial, draggable:true, mapFollowsOnDrag:true, onDragEnd:(coords) => setPickerCoords40(coords,false) }, markerEl);
      const listener = new YMapListener({ layer:'any', onClick:(object,event) => { const c = event?.coordinates; if (Array.isArray(c) && c.length >= 2) setPickerCoords40(c,true); } });
      map.addChild(marker); map.addChild(listener);
      pickerState40.map = map; pickerState40.marker = marker; pickerState40.listener = listener;
      setPickerCoords40(initial,false);
      if (status) status.textContent = '';
      const syncManual = () => { const lat = +document.getElementById('tv40PointLat')?.value, lon = +document.getElementById('tv40PointLon')?.value; if (Number.isFinite(lat) && Number.isFinite(lon)) setPickerCoords40([lon,lat],true); };
      document.getElementById('tv40PointLat')?.addEventListener('change', syncManual);
      document.getElementById('tv40PointLon')?.addEventListener('change', syncManual);
    } catch (error) {
      console.error('Yandex point picker failed', error);
      if (status) { status.textContent = 'Карта не загрузилась. Координаты можно ввести вручную.'; status.classList.add('error'); }
    }
  }

  function pointModal40({ title, value = {}, kind = 'stop', onSave }) {
    const v = { title:value.title||'', lat:value.lat, lon:value.lon, time:value.time||'', note:value.note||'' };
    openModal(title, `<div class="tv40-picker"><div class="tv40-picker-side"><div class="field"><label>Название точки</label><input id="tv40PointTitle" value="${esc(v.title)}" placeholder="Например, парковка у метро"></div><div class="field"><label>Время</label><input id="tv40PointTime" type="time" value="${esc(v.time)}"></div><div class="field"><label>Комментарий / ориентир</label><textarea id="tv40PointNote" placeholder="Выход из метро, парковка, магазин, шлагбаум">${esc(v.note)}</textarea></div><div class="tv40-coords"><div class="field"><label>Широта</label><input id="tv40PointLat" type="number" step="0.000001" value="${hasCoordV24(v)?(+v.lat).toFixed(6):''}"></div><div class="field"><label>Долгота</label><input id="tv40PointLon" type="number" step="0.000001" value="${hasCoordV24(v)?(+v.lon).toFixed(6):''}"></div></div><div class="tv40-picker-note"><b>Как выбрать точку</b><span>Кликните по Яндекс Карте или перетащите зелёную метку. Название и ориентир заполните так, чтобы пассажир без звонка понял, куда идти.</span></div></div><div class="tv40-picker-map-wrap"><div id="tv40PointMap" class="tv40-picker-map"></div><div class="tv40-picker-status" id="tv40PickerStatus"></div><div class="tv40-picker-coordinate" id="tv40PickerCoords">${hasCoordV24(v)?esc(fmtCoordV24(v.lat,v.lon)):'Выберите точку'}</div></div></div>`, layer => {
      const obj = { title:layer.querySelector('#tv40PointTitle').value.trim(), time:layer.querySelector('#tv40PointTime').value, lat:+layer.querySelector('#tv40PointLat').value, lon:+layer.querySelector('#tv40PointLon').value, note:layer.querySelector('#tv40PointNote').value.trim() };
      if (!obj.title) { toast('Укажите название точки'); return false; }
      if (!Number.isFinite(obj.lat) || !Number.isFinite(obj.lon)) { toast('Выберите точку на карте или укажите координаты'); return false; }
      onSave(obj);
    });
    const modal = document.querySelector('#modalLayer .modal'); modal?.classList.add('tv40-point-modal');
    setTimeout(() => mountPickerMap40(v), 60);
  }

  function stopModal40(r, stop = null) {
    pointModal40({ title:stop ? `Изменить · ${stopKindV24(dir)}` : `Добавить · ${stopKindV24(dir)}`, value:stop||{}, kind:'stop', onSave:o => { if (stop) Object.assign(stop,o); else (r.stops||(r.stops=[])).push({id:`stop_${Date.now()}`,...o}); transportSaveV24(stop?'Точка обновлена':'Точка добавлена'); } });
    if (stop) setTimeout(() => {
      const body = document.querySelector('#modalLayer .modal-body'); if (!body) return;
      const active = (r.requests||[]).filter(q => q.pickupId === stop.id && ['pending','approved'].includes(q.status));
      const del = document.createElement('div'); del.className = 'tv40-danger'; del.innerHTML = `<button class="btn alt sm" type="button" id="tv40DeleteStop" ${active.length?'disabled':''}>Удалить точку</button>${active.length?`<small>Эту точку используют ${active.length} активных пассажиров / заявок.</small>`:''}`; body.querySelector('.tv40-picker-side')?.appendChild(del);
      document.getElementById('tv40DeleteStop')?.addEventListener('click', () => { if (active.length) return; r.stops = (r.stops||[]).filter(s => s.id !== stop.id); document.getElementById('modalCancel')?.click(); transportSaveV24('Точка удалена'); });
    },80);
  }

  function arrivalModal40() {
    const a = tv24().arrival, value = { ...a, time:dir === 'there' ? (a.time||'') : (a.returnTime||'') };
    pointModal40({ title:dir === 'there' ? 'Место прибытия мероприятия' : 'Место и время обратного выезда', value, kind:'arrival', onSave:o => { const next = {...a,title:o.title,lat:o.lat,lon:o.lon,note:o.note}; if (dir === 'there') next.time = o.time; else next.returnTime = o.time; tv24().arrival = next; transportSaveV24('Точка мероприятия обновлена'); } });
  }

  function requestMapPoints40(r) {
    return (r.stops||[]).filter(hasCoordV24).map((s,i) => ({key:s.id,title:s.title||stopKindV24(dir),subtitle:s.time||'',lon:+s.lon,lat:+s.lat,label:String(i+1)}));
  }

  async function mountRequestMap40(r) {
    const host = document.getElementById('tv40RequestMap'); if (!host) return;
    destroyYandexMap40(requestMapState40);
    try {
      const ymaps3 = await loadYandex40();
      if (!document.getElementById('tv40RequestMap')) return;
      const {YMap,YMapDefaultSchemeLayer,YMapDefaultFeaturesLayer,YMapMarker} = ymaps3;
      const pts = requestMapPoints40(r), loc = bounds40(pts) || {center:[37.93,55.59],zoom:12};
      const map = new YMap(host,{location:loc,mode:'raster',theme:'light',zoomRange:{min:3,max:20}},[new YMapDefaultSchemeLayer(),new YMapDefaultFeaturesLayer()]);
      requestMapState40.map = map;
      pts.forEach(p => { const el = yMarkerElement40('pickup',p.label,p.title,p.subtitle); el.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); const radio = document.querySelector(`[name="tv40Pickup"][value="${CSS.escape(p.key)}"]`); if (radio) { radio.checked = true; requestFocus40(p.key); } }; const m = new YMapMarker({coordinates:[p.lon,p.lat]},el); map.addChild(m); requestMapState40.markers.push(m); requestMapState40.points.set(p.key,p); });
    } catch(e) { console.error('Request map failed',e); host.innerHTML = '<div class="tv40-map-fallback">Карта недоступна. Точки можно выбрать по списку.</div>'; }
  }

  function requestFocus40(stopId) {
    const p = requestMapState40.points.get(stopId); if (!p) return;
    requestMapState40.map?.setLocation?.({center:[p.lon,p.lat],zoom:16,duration:180});
    document.querySelectorAll('.tv40-pickup-option').forEach(x => x.classList.toggle('active', x.dataset.stopId === stopId));
  }

  function requestModal40(r) {
    if (transportDriverRideV24()) return toast('Вы уже водитель: сначала отмените свой рейс');
    if (transportRequestV24()) return toast('Сначала отмените текущую заявку или освободите подтверждённое место');
    const stops = (r.stops||[]);
    if (!stops.length) return toast('Водитель ещё не указал точку посадки');
    openModal('Попроситься в машину', `<div class="tv40-request-picker"><div class="tv40-request-options"><p>Выберите, где ${dir === 'there' ? 'вас забрать' : 'вас высадить'}:</p>${stops.map((s,i) => `<label class="tv40-pickup-option ${i===0?'active':''}" data-stop-id="${s.id}"><input type="radio" name="tv40Pickup" value="${s.id}" ${i===0?'checked':''}><i>${i+1}</i><span><b>${esc(s.title||stopKindV24(dir))}</b><small>${s.time?esc(s.time):'время уточняется'}${s.note?` · ${esc(s.note)}`:''}</small><em>${esc(fmtCoordV24(s.lat,s.lon))}</em></span></label>`).join('')}</div><div class="tv40-request-map" id="tv40RequestMap"></div></div>`, layer => {
      if (transportFreeV24(r) <= 0) { toast('Свободных мест уже нет'); return false; }
      const pickupId = layer.querySelector('[name="tv40Pickup"]:checked')?.value; if (!pickupId) { toast('Выберите точку'); return false; }
      const q = {id:`req_${Date.now()}`,pid:S.current,pickupId,status:'pending',createdAt:Date.now()}; (r.requests||(r.requests=[])).push(q); tv24().choices[dir][S.current] = {mode:'request',rideId:r.id,requestId:q.id,pickupId}; transportSaveV24('Заявка отправлена водителю');
    });
    document.querySelector('#modalLayer .modal')?.classList.add('tv40-request-modal');
    setTimeout(() => {
      document.querySelectorAll('[name="tv40Pickup"]').forEach(radio => radio.addEventListener('change', () => requestFocus40(radio.value)));
      mountRequestMap40(r).then(() => { const checked = document.querySelector('[name="tv40Pickup"]:checked'); if (checked) requestFocus40(checked.value); });
    },60);
  }

  function bindTransport40() {
    document.querySelectorAll('[data-tv40-dir]').forEach(b => b.onclick = () => { dir = b.dataset.tv40Dir; render(); });
    document.getElementById('tv40OpenProfile')?.addEventListener('click', openProfile40);
    document.getElementById('tv40ProfileTop')?.addEventListener('click', openProfile40);
    document.getElementById('tv40CreateRide')?.addEventListener('click', () => rideModal40(null,dir));
    document.getElementById('tv40CreateRideEmpty')?.addEventListener('click', () => rideModal40(null,dir));
    document.getElementById('tv40EditArrival')?.addEventListener('click', arrivalModal40);
    document.querySelectorAll('[data-tv40-edit-ride]').forEach(b => b.onclick = () => rideModal40(transportRideV24(b.dataset.tv40EditRide),dir));
    document.querySelectorAll('[data-tv40-add-stop]').forEach(b => b.onclick = () => stopModal40(transportRideV24(b.dataset.tv40AddStop)));
    document.querySelectorAll('[data-tv40-request]').forEach(b => b.onclick = () => requestModal40(transportRideV24(b.dataset.tv40Request)));
    document.querySelectorAll('[data-tv40-approve]').forEach(b => b.onclick = () => { const [rid,qid] = b.dataset.tv40Approve.split(':'); approveRequestV24(rid,qid); });
    document.querySelectorAll('[data-tv40-decline]').forEach(b => b.onclick = () => { const [rid,qid] = b.dataset.tv40Decline.split(':'); declineRequestV24(rid,qid); });
    document.querySelectorAll('[data-tv40-cancel]').forEach(b => b.onclick = () => cancelRequestV24(b.dataset.tv40Cancel));
    document.querySelectorAll('[data-tv40-self]').forEach(b => b.onclick = setSelfV24);
    document.querySelectorAll('[data-tv40-unset-self]').forEach(b => b.onclick = unsetSelfV24);
    document.querySelectorAll('[data-tv40-copy-back]').forEach(b => b.onclick = () => copyRideBackV24(b.dataset.tv40CopyBack));
    document.querySelectorAll('[data-tv40-focus]').forEach(b => b.onclick = () => focusTransportPoint40(b.dataset.tv40Focus));
    document.getElementById('tv40FitMap')?.addEventListener('click', fitTransportMap40);
    document.querySelectorAll('[data-tv40-people]').forEach(b => b.onclick = () => openPeople40(b.dataset.tv40People));
    document.querySelectorAll('[data-tv24-yandex-ride]').forEach(b => b.onclick = () => openYandexRideV24(transportRideV24(b.dataset.tv24YandexRide),dir));
    document.querySelectorAll('[data-tv24-yandex-point]').forEach(b => b.onclick = () => { const a = tv24().arrival; if (hasCoordV24(a)) window.open(yandexPointV24(a.lat,a.lon),'_blank','noopener'); });
    document.querySelectorAll('[data-tv24-yandex-stop]').forEach(b => b.onclick = () => { const [rid,sid] = b.dataset.tv24YandexStop.split(':'), r = transportRideV24(rid), s = r?.stops.find(x => x.id === sid); if (hasCoordV24(s)) window.open(yandexPointV24(s.lat,s.lon),'_blank','noopener'); });
    requestAnimationFrame(mountTransportMap40);
  }

  /* Override the legacy transport render/binders without touching shared transport state. */
  transportPage = transportPage40;
  transportRideModalV24 = rideModal40;
  stopModalV24 = stopModal40;
  arrivalModalV24 = arrivalModal40;
  requestModalV24 = requestModal40;
  mountTransportMapV24 = mountTransportMap40;
  bindTransportV24 = bindTransport40;

  const build = document.querySelector('.build-label');
  if (build) build.textContent = 'V40 · транспорт на Яндекс Картах';
  render();
})();


;/* source: hikes-preview/plan-v41.js */
/* V41 — clearer day plan and compact checkpoint list. */
(()=>{
'use strict';
let view41='day';
const km41=()=>{try{return (routeLenV13()/1000).toFixed(1).replace('.',',')+' км'}catch(e){return S.event?.distance||'—'}};
const calc41=()=>routePlanStatsV23();
function summary41(){const s=calc41();return `<div class="v41-summary"><div><small>Дистанция</small><strong>${km41()}</strong><span>по текущей линии</span></div><div><small>Старт</small><strong>${editorV13.start}</strong><span>маршрута</span></div><div><small>Финиш</small><strong>${finalEtaV13()}</strong><span>расчётный</span></div><div><small>Движение</small><strong>${fmtMinutesV23(s.base)}</strong><span>без остановок</span></div><div><small>Перерывы</small><strong>${fmtMinutesV23(s.pauses)}</strong><span>${breaksV23().length} событий</span></div><div><small>Резерв</small><strong>${reservePctV23()}%</strong><span>${fmtMinutesV23(s.reserve)}</span></div></div>`}
function tabs41(){return `<div class="v41-tabs"><button class="${view41==='day'?'active':''}" data-v41-view="day">План дня</button><button class="${view41==='route'?'active':''}" data-v41-view="route">Маршрут и перерывы</button><button class="${view41==='pace'?'active':''}" data-v41-view="pace">Расчёт темпа</button></div>`}
function sync41(){const a=(S.timeline||[]).find(t=>/старт маршрут/i.test(t.title||'')),b=(S.timeline||[]).find(t=>/(заверш|финиш).*маршрут/i.test(t.title||'')),bad=(a&&a.time!==editorV13.start)||(b&&b.time!==finalEtaV13());return bad?`<div class="v41-sync warn"><span><b>В расписании и расчёте маршрута разное время</b><small>Расчёт: ${editorV13.start} → ${finalEtaV13()}</small></span><button class="btn alt sm" id="v41Sync">Синхронизировать</button></div>`:`<div class="v41-sync ok"><span><b>Расписание согласовано с маршрутом</b><small>${editorV13.start} → ${finalEtaV13()}</small></span></div>`}
function day41(){const cps=dynamicCpsV13(), linked=new Set((S.timeline||[]).map(t=>t.route).filter(Boolean));const derived=cps.filter(cp=>!linked.has(cp.id)).map(cp=>({id:'derived_'+cp.id,time:cp.arrival,title:cp.title,note:cp.km.toFixed(1).replace('.',',')+' км · расчёт по текущему темпу и перерывам',route:cp.id,auto:true}));const rows=[...(S.timeline||[]),...derived].map(t=>{const cp=cps.find(cp=>cp.id===t.route);return cp?{...t,time:cp.arrival}:t}).sort((a,b)=>(a.time||'').localeCompare(b.time||''));return `<div class="v41-day-layout"><section class="v41-panel"><div class="v41-panel-head"><div><div class="page-kicker">Организация мероприятия</div><h2>План дня</h2><p>Сбор, выезд, маршрут, остановки и завершение в одном расписании.</p></div></div>${sync41()}<div class="v41-day-list">${rows.map((t,i)=>`<article class="v41-day-row"><div class="v41-day-time">${esc(t.time)}</div><div class="v41-day-line"><i></i>${i<rows.length-1?'<span></span>':''}</div><div class="v41-day-main"><div><b>${esc(t.title)}</b>${t.route?'<em>Маршрут</em>':''}</div><p>${esc(t.note||'Без комментария')}</p><div class="v41-day-meta"><span><small>Ответственный</small><b>${esc(pn(t.owner))}</b></span><span><small>Привязка</small><b>${t.route?esc(routeName(t.route)):'Без привязки'}</b></span></div></div><div class="v41-day-actions">${t.auto?'':`<button class="icon-btn" data-edit-time="${t.id}">✎</button><button class="icon-btn" data-del-time="${t.id}">×</button>`}</div></article>`).join('')}</div></section><aside class="v41-side"><div class="v41-side-card"><small>РАСЧЁТ МАРШРУТА</small><strong>${editorV13.start} → ${finalEtaV13()}</strong><span>${km41()} · ${PACE_PROFILES_V23[planProfileV23()].short.toLowerCase()} темп</span><button class="btn alt sm" data-v41-view="route">Открыть маршрутный план</button></div><div class="v41-side-card"><small>ПЕРЕРЫВЫ</small><strong>${breaksV23().length}</strong><span>Всего ${fmtMinutesV23(breaksTotalV23())}</span><button class="btn alt sm" data-v41-view="route">Настроить</button></div></aside></div>`}
function route41(){return `<section class="v41-panel"><div class="v41-panel-head"><div><div class="page-kicker">Расчётный маршрут</div><h2>Контрольные точки и перерывы</h2><p>КП приходят из карты. Перерывы — отдельные временные события между точками.</p></div></div>${routeTimelineHtmlV23()}</section>`}
function pace41(){return `<div class="v41-pace"><section class="v41-panel"><div class="v41-panel-head"><div><div class="page-kicker">Параметры</div><h2>Старт и резерв</h2><p>Изменения сразу пересчитывают ETA контрольных точек.</p></div></div><div class="plan-settings-v23"><div class="plan-start-reserve-v23"><label>Время старта<input type="time" id="routeStartV23" value="${editorV13.start}"></label><label>Организационный резерв<input type="number" min="0" max="50" step="1" id="reserveV23" value="${reservePctV23()}"><span>% от времени движения</span></label></div></div></section><section class="v41-panel"><div class="v41-panel-head"><div><div class="page-kicker">Темп группы</div><h2>Скорость по типу участка</h2><p>Выберите профиль и при необходимости скорректируйте значения.</p></div></div>${speedCardsV23()}</section></div>`}
function page41(){ensurePlanV23();let actions=view41==='day'?'<button class="btn sand" id="addTimeline">+ Этап</button>':view41==='route'?'<button class="btn alt" id="copyAllCpV23">Скопировать КП</button><button class="btn sand" id="addBreakGeneralV23">+ Перерыв</button>':'';return `${pageHead('Организация дня','План','Единое расписание похода: организационные этапы, расчёт движения, контрольные точки и остановки.',actions)}${summary41()}${tabs41()}${view41==='day'?day41():view41==='route'?route41():pace41()}`}
function syncTimes41(){let n=0;(S.timeline||[]).forEach(t=>{if(/старт маршрут/i.test(t.title||'')&&t.time!==editorV13.start){t.time=editorV13.start;n++}if(/(заверш|финиш).*маршрут/i.test(t.title||'')&&t.time!==finalEtaV13()){t.time=finalEtaV13();n++}});if(n){S.timeline.sort((a,b)=>(a.time||'').localeCompare(b.time||''));save();render();toast('Время маршрута синхронизировано')}else toast('Расписание уже совпадает с расчётом')}
function cp41(){return dynamicCpsV13().map(cp=>`<div class="v41-cp-row"><button class="v41-cp-main" data-cp-dyn-v13="${cp.id}"><span class="v41-cp-index ${cp.number==='С'||cp.number==='Ф'?'endpoint':''}">${cp.number}</span><span class="v41-cp-copy"><b>${esc(cp.title)}</b><small><span class="grid-code-v12">${gridCodeDynamicV13(cp.lat,cp.lon)}</span>${cp.km.toFixed(1).replace('.',',')} км · ${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</small></span><span class="v41-cp-eta"><small>ETA</small><b>${cp.arrival}</b></span></button><div class="v41-cp-actions"><button data-copy-cp-v23="${cp.id}">Копировать</button><button data-open-cp-v23="${cp.id}">Яндекс ↗</button></div></div>`).join('')}
planPage=page41;cpRowsDynamicV23=cp41;cpRowsDynamicV13=cp41;
const oldBind41=bind;bind=function(){oldBind41();document.querySelectorAll('[data-v41-view]').forEach(b=>b.onclick=()=>{view41=b.dataset.v41View;render()});document.getElementById('v41Sync')?.addEventListener('click',syncTimes41);if(tab==='plan'){const x=document.querySelector('.build-label');if(x)x.textContent='V41 · единый план дня'}};
render();
})();


;/* source: hikes-preview/supabase-v42.js */
/* V42 — authenticated team access for the Hikes workspace. No privileged key is shipped to the browser. */
(() => {
  'use strict';

  const PROJECT_URL = 'https://qmnjsvifwcutjailxdug.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_R1n0gwDrWkKn0-D5nuaz3Q_jRjTFwTD';
  const EVENT_SLUG = 'tominsky-lesopark';
  const AUTH_KEY = 'rl_hike_auth_v42';
  const REVISION_KEY = 'rl_hike_cloud_revision_v42';
  let session = null, event = null, membership = null, isOrganizer = false, cloudReady = false, writeTimer = 0, lastRevision = '', writeInFlight = false, pendingWrite = false, remoteLocal = {};
  window.HikeSession={signed:false,approved:false,organizer:false};
  window.HikeCloudConfig={url:PROJECT_URL,key:PUBLISHABLE_KEY};

  const headers = extra => {
    const result = { apikey: PUBLISHABLE_KEY, ...extra };
    if (session?.access_token) result.Authorization = `Bearer ${session.access_token}`;
    return result;
  };
  async function request(path, options = {}) {
    const response = await fetch(`${PROJECT_URL}${path}`, { method: options.method || 'GET', headers: headers({ 'Content-Type': 'application/json', ...(options.headers || {}) }), body: options.body === undefined ? undefined : JSON.stringify(options.body) });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || body?.error_description || body?.hint || `Ошибка сервера (${response.status})`);
    return body;
  }
  function saveSession(next) { session = next || null; try { session ? localStorage.setItem(AUTH_KEY, JSON.stringify(session)) : localStorage.removeItem(AUTH_KEY); } catch (e) {} }
  function loadSession() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (e) { return null; } }
  function extractHashSession() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (!hash.get('access_token')) return null;
    const next = { access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token'), expires_at: Math.floor(Date.now() / 1000) + Number(hash.get('expires_in') || 3600), user: { id: hash.get('user_id') || '' } };
    history.replaceState({}, document.title, `${location.pathname}${location.search}`);
    return next;
  }
  async function refreshSession() {
    if (!session?.refresh_token) return false;
    try {
      const response = await fetch(`${PROJECT_URL}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }) });
      const next = await response.json();
      if (!response.ok || !next.access_token) return false;
      saveSession({ ...next, expires_at: Math.floor(Date.now() / 1000) + Number(next.expires_in || 3600) });
      return true;
    } catch (e) { return false; }
  }
  async function ensureSession() {
    saveSession(extractHashSession() || loadSession());
    if (!session) return false;
    if ((session.expires_at || 0) < Math.floor(Date.now() / 1000) + 60 && !(await refreshSession())) { saveSession(null); return false; }
    const user = await request('/auth/v1/user').catch(() => null);
    if (!user?.id) { saveSession(null); return false; }
    session.user = user; saveSession(session); return true;
  }
  function modal(title, body, onConfirm) { openModal(title, body, async layer => { try { return await onConfirm(layer); } catch (error) { toast(error.message || 'Не удалось выполнить действие'); return false; } }); }
  const appUrl = () => `${location.origin}${location.pathname}`;
  async function requestMagicLink(email) { await request(`/auth/v1/otp?redirect_to=${encodeURIComponent(appUrl())}`, { method: 'POST', body: { email, create_user: true } }); }
  function authModal() {
    modal('Войти в поход', '<div class="hike-auth-copy"><p>Укажи email. Придёт одноразовая ссылка: пароль придумывать не нужно.</p><label class="field"><span>Email</span><input id="hikeEmail" type="email" autocomplete="email" placeholder="name@example.com" required></label></div>', async layer => {
      const email = layer.querySelector('#hikeEmail').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Укажи корректный email'); return false; }
      await requestMagicLink(email); toast('Ссылка для входа отправлена на email'); return true;
    });
  }
  async function getEvent() { const rows = await request(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(EVENT_SLUG)}&select=*`); event = rows?.[0] || null; if (!event) throw new Error('Мероприятие в базе не найдено'); }
  async function getMembership() { const rows = await request(`/rest/v1/hike_members?event_id=eq.${event.id}&user_id=eq.${session.user.id}&select=*`); membership = rows?.[0] || null; isOrganizer = membership?.role === 'organizer'; }
  async function ensureProfileAndRequest() {
    if (membership) return;
    modal('Присоединиться к походу', '<div class="hike-auth-copy"><p>Представься команде. После отправки организатор подтвердит участие.</p><label class="field"><span>Имя</span><input id="hikeDisplayName" autocomplete="name" placeholder="Как тебя показать в списке" required></label></div>', async layer => {
      const name = layer.querySelector('#hikeDisplayName').value.trim();
      if (name.length < 2) { toast('Укажи имя'); return false; }
      await request(`/rest/v1/profiles?id=eq.${session.user.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { display_name: name } });
      const created = await request('/rest/v1/hike_members', { method: 'POST', headers: { Prefer: 'return=representation' }, body: { event_id: event.id, user_id: session.user.id, status: 'requested', role: 'participant' } });
      membership = created?.[0] || { event_id: event.id, user_id: session.user.id, status: 'requested', role: 'participant' };
      ensureCurrentParticipant(name, false); updateAuthUI(); toast('Заявка отправлена организатору'); return true;
    });
  }
  function russianDate(value,durationDays=1) {
    if (!value) return 'Дата уточняется';
    const start = new Date(value);
    if (Number.isNaN(start.getTime())) return 'Дата уточняется';
    const tz='Europe/Moscow';
    const parts=d=>Object.fromEntries(new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:tz}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const a=parts(start),days=Math.max(1,Number(durationDays)||1);
    if(days===1)return `${a.day} ${a.month} ${a.year}`;
    const end=new Date(start.getTime()+(days-1)*86400000),b=parts(end);
    if(a.month===b.month&&a.year===b.year)return `${a.day}–${b.day} ${b.month} ${b.year}`;
    if(a.year===b.year)return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
    return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  }
  function applyEventToApp() {
    if (!event || !S?.event) return;
    S.event.date = russianDate(event.starts_at,event.duration_days);
    S.event.durationDays = Math.max(1,Number(event.duration_days)||1);
    S.event.overnight = event.overnight !== false;
    S.event.meeting = event.meeting_label || 'Время и точка уточняются';
    S.event.replyDeadline = event.reply_deadline ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone:'Europe/Moscow' }).format(new Date(event.reply_deadline)) : 'не задан';
    S.event.status = ({ planning: 'Подготовка', open: 'Регистрация открыта', closed: 'Набор закрыт', cancelled: 'Отменён' })[event.status] || 'Подготовка';
  }
  function cloudKeys() {
    const values = {...remoteLocal};
    if(isOrganizer || window.HikeWorkspace?.can('route')){
      ['rl_hike_route_editor_v13','rl_hike_shared_route_revision','rl_hike_atlas_v20'].forEach(key=>{const value=localStorage.getItem(key);if(value!==null)values[key]=value});
    }
    return values;
  }
  function restoreCloudKeys(values) { Object.entries(values || {}).forEach(([key, value]) => { if (key.startsWith('rl_hike_') && key !== AUTH_KEY && typeof value === 'string') localStorage.setItem(key, value); }); }
  function ensureCurrentParticipant(displayName, forceOrganizer) {
    if (!S || !session?.user?.id) return;
    const id = forceOrganizer ? 'p1' : session.user.id, name = displayName || session.user.email?.split('@')[0] || 'Участник';
    let person = S.participants?.find(p => p.id === id);
    if (!person) { person = { id, name, rsvp: forceOrganizer ? 'yes' : 'pending' }; S.participants.push(person); } else if (displayName) person.name = displayName;
    if (!forceOrganizer && membership) person.rsvp = membership.status === 'approved' ? 'yes' : membership.status === 'declined' ? 'no' : 'pending';
    S.current = id; S.checks ||= {}; S.checks[id] ||= []; S.rides ||= { there: {}, back: {} }; S.rides.there ||= {}; S.rides.back ||= {}; S.rides.there[id] ||= 'unset'; S.rides.back[id] ||= 'unset';
  }
  async function syncOrganizerRoster() {
    if (!isOrganizer && !window.HikeWorkspace?.can?.('participants')) return;
    const members = await request(`/rest/v1/hike_members?event_id=eq.${event.id}&select=user_id,status,role`);
    const profiles = await request('/rest/v1/profiles?select=id,display_name');
    const names = new Map((profiles || []).map(profile => [profile.id, profile.display_name]));
    (members || []).forEach(member => { if (member.role === 'organizer') return; if (!S.participants.find(person => person.id === member.user_id)) S.participants.push({ id: member.user_id, name: names.get(member.user_id) || 'Участник', rsvp: member.status === 'approved' ? 'yes' : member.status === 'declined' ? 'no' : 'pending' }); });
  }
  async function loadCloudDocument() {
    if (!membership) return true;
    const rows = await request('/rest/v1/hike_documents?event_id=eq.'+event.id+'&select=payload,updated_at'), document = rows?.[0];
    lastRevision = document?.updated_at || ''; remoteLocal = document?.payload?.local || {};
    if (!document?.payload?.app) return true;
    if (sessionStorage.getItem(REVISION_KEY) === lastRevision) return true;
    restoreCloudKeys(remoteLocal);
    localStorage.setItem(STORAGE, JSON.stringify({...document.payload.app,current:isOrganizer?'p1':session.user.id}));
    sessionStorage.setItem(REVISION_KEY,lastRevision);
    location.reload(); return false;
  }
  function syncStatus(text,error=false){
    let el=document.getElementById('hikeSyncStatus');
    if(!el){el=document.createElement('button');el.id='hikeSyncStatus';el.className='text-button';document.getElementById('hikeAuthBar')?.appendChild(el)}
    el.textContent=text;el.style.color=error?'#995038':'#577261';
    el.onclick=error?()=>{if(confirm('Обновить командные данные? Несохранённое действие понадобится повторить.')){sessionStorage.removeItem(REVISION_KEY);location.reload()}}:null;
  }
  async function flushCloud(){
    writeTimer=0;
    if(writeInFlight){pendingWrite=true;return}
    if(!cloudReady||!pendingWrite)return;
    writeInFlight=true;pendingWrite=false;syncStatus('Сохраняется…');
    try{
      const local=cloudKeys(),app=JSON.parse(JSON.stringify(S));
      const row=await request('/rest/v1/rpc/save_hike_workspace',{method:'POST',body:{p_event:event.id,p_revision:lastRevision||null,p_app:app,p_local:local}});
      lastRevision=row.updated_at;remoteLocal=local;
      if(lastRevision)sessionStorage.setItem(REVISION_KEY,lastRevision);
      syncStatus('Сохранено для команды');
    }catch(error){
      cloudReady=false;pendingWrite=false;
      syncStatus('Не сохранено · обновить',true);toast(error.message||'Не удалось сохранить изменения для команды');
    }finally{writeInFlight=false;if(pendingWrite&&cloudReady)window.scheduleCloudSync(true)}
  }
  window.scheduleCloudSync = function scheduleCloudSync(now=false){
    if(!cloudReady||!event||!S||(!isOrganizer&&membership?.status!=='approved')||window.HikePreviewV48?.active)return;
    pendingWrite=true;clearTimeout(writeTimer);writeTimer=setTimeout(flushCloud,now?0:700);
  };
  function wrapStorage() {
    const nativeSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) { nativeSet.call(this, key, value); if (this === localStorage && (key === STORAGE || key?.startsWith('rl_hike_')) && key !== AUTH_KEY) window.scheduleCloudSync?.(); };
  }
  function updateAuthUI() {
    window.HikeSession={signed:!!session?.user,approved:isOrganizer||membership?.status==='approved',organizer:isOrganizer};
    const label = document.getElementById('hikeAuthLabel'), login = document.getElementById('hikeAuthButton'), settings = document.getElementById('hikeSettingsButton'), signout = document.getElementById('hikeSignoutButton'), selector = document.getElementById('who');
    if (!session?.user) { label.textContent = 'Гость'; login.hidden = false; settings.hidden = true; signout.hidden = true; selector.hidden = true; return; }
    label.textContent = membership?.status === 'requested' ? 'Заявка отправлена' : session.user.email; login.hidden = true; settings.hidden = !isOrganizer; signout.hidden = false; selector.hidden = true; document.body.classList.toggle('hike-organizer', isOrganizer);
  }
  function settingsModal() {
    const start = event?.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : '', deadline = event?.reply_deadline ? new Date(event.reply_deadline).toISOString().slice(0, 16) : '';
    modal('Настройки похода', `<div class="form-grid hike-settings-form"><div class="field full"><label>Название<input id="hsTitle" value="${esc(event.title || '')}"></label></div><div class="field"><label>Дата и время старта<input id="hsStart" type="datetime-local" value="${start}"></label></div><div class="field"><label>Дедлайн ответа<input id="hsDeadline" type="datetime-local" value="${deadline}"></label></div><div class="field full"><label>Сбор<input id="hsMeeting" value="${esc(event.meeting_label || '')}" placeholder="Например: 07:30 · метро ..."></label></div><div class="field"><label>Лимит участников<input id="hsLimit" type="number" min="1" value="${event.participant_limit || ''}"></label></div><div class="field"><label>Статус<select id="hsStatus"><option value="planning" ${event.status === 'planning' ? 'selected' : ''}>Подготовка</option><option value="open" ${event.status === 'open' ? 'selected' : ''}>Регистрация открыта</option><option value="closed" ${event.status === 'closed' ? 'selected' : ''}>Набор закрыт</option><option value="cancelled" ${event.status === 'cancelled' ? 'selected' : ''}>Отменён</option></select></label></div></div>`, async layer => {
      const value = id => layer.querySelector(id).value.trim(), title = value('#hsTitle');
      if (!title) { toast('Укажи название похода'); return false; }
      const starts = value('#hsStart'), deadlineValue = value('#hsDeadline'), limit = value('#hsLimit');
      const rows = await request(`/rest/v1/hike_events?id=eq.${event.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { title, starts_at: starts ? new Date(starts).toISOString() : null, reply_deadline: deadlineValue ? new Date(deadlineValue).toISOString() : null, meeting_label: value('#hsMeeting') || null, participant_limit: limit ? Number(limit) : null, status: value('#hsStatus') } });
      event = rows?.[0] || event; applyEventToApp(); save(); render(); updateAuthUI(); toast('Параметры похода сохранены для всей команды'); return true;
    });
  }
  function attachControls() {
    document.getElementById('hikeAuthButton').onclick = authModal; document.getElementById('hikeSettingsButton').onclick = settingsModal;
    document.getElementById('hikeSignoutButton').onclick = () => { saveSession(null); sessionStorage.removeItem(REVISION_KEY); location.reload(); };
    document.getElementById('eventSwitcher').onclick = () => isOrganizer ? settingsModal() : toast('Сейчас открыт один поход. Войти можно по ссылке из письма.');
    document.getElementById('reset').onclick = () => toast('Данные похода не сбрасываются с устройства: рабочая версия хранится у команды централизованно.');
  }
  function wireMembershipActions() {
    document.querySelectorAll('select[data-rsvp]').forEach(control => {
      const canManageMembers = isOrganizer || !!window.HikeWorkspace?.can?.('participants');
      control.disabled = !canManageMembers;
      if (!canManageMembers) return;
      control.addEventListener('change', async () => {
        const userId = control.dataset.rsvp;
        if (!/^[0-9a-f-]{36}$/i.test(userId)) return;
        const status = control.value === 'yes' ? 'approved' : control.value === 'no' ? 'declined' : 'requested';
        try {
          await request(`/rest/v1/hike_members?event_id=eq.${event.id}&user_id=eq.${userId}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { status } });
          toast(status === 'approved' ? 'Участие подтверждено' : status === 'declined' ? 'Заявка отклонена' : 'Заявка оставлена на рассмотрении');
        } catch (error) { toast('Не удалось обновить заявку: ' + error.message); }
      });
    });
  }
  const baseRenderWithMembership = render;
  render = function renderWithMembership() {
    const result = baseRenderWithMembership();
    wireMembershipActions();
    return result;
  };
  async function start() {
    wrapStorage(); attachControls(); if (!(await ensureSession())) { updateAuthUI(); return; }
    await getEvent(); await getMembership(); if (!membership) { updateAuthUI(); await ensureProfileAndRequest(); return; }
    if (!(await loadCloudDocument())) return;
    const profileRows = await request(`/rest/v1/profiles?id=eq.${session.user.id}&select=display_name`), displayName = profileRows?.[0]?.display_name || session.user.email?.split('@')[0];
    ensureCurrentParticipant(displayName, isOrganizer); await syncOrganizerRoster(); applyEventToApp(); cloudReady = true; updateAuthUI(); render(); if (isOrganizer) window.scheduleCloudSync(true); wireMembershipActions();
    setInterval(async () => { if (!membership || document.hidden || pendingWrite || writeInFlight || !cloudReady) return; try { const rows = await request(`/rest/v1/hike_documents?event_id=eq.${event.id}&select=updated_at`); if (rows?.[0]?.updated_at && rows[0].updated_at !== lastRevision) { sessionStorage.removeItem(REVISION_KEY); location.reload(); } } catch (e) {} }, 45000);
  }
  start().catch(error => { console.error(error); toast('Не удалось подключить командные данные: ' + (error.message || 'проверь соединение')); updateAuthUI(); });
})();


;/* source: hikes-preview/preview-demo-v52.js */
/* V52 — make role preview available in the local organizer demo as well as authenticated organizer mode. */
(() => {
  'use strict';

  function hasSession() {
    try { return !!JSON.parse(localStorage.getItem('rl_hike_auth_v42') || 'null')?.access_token; }
    catch (e) { return false; }
  }

  function isLocalOrganizerDemo() {
    if (hasSession()) return false;
    if (!window.S || !Array.isArray(S.participants)) return false;
    const current = S.participants.find(person => person.id === S.current) || S.participants[0];
    if (!current) return false;
    if (current.id === 'p1') return true;
    try {
      const roles = typeof participantRoles === 'function' ? participantRoles(current.id) : [];
      return Array.isArray(roles) && roles.includes('Руководитель');
    } catch (e) {
      return false;
    }
  }

  function enable() {
    if (!isLocalOrganizerDemo()) return;
    document.body.classList.add('hike-organizer');
    document.body.dataset.previewDemo = 'organizer';
  }

  enable();
  document.addEventListener('DOMContentLoaded', enable, { once: true });
})();


;/* source: hikes-preview/sidebar-v49.js */
/* V60 — sidebar grouping + deterministic current workspace modules. */
(() => {
  'use strict';
  const RELEASE='60-20260914g';
  const GROUPS=[['Поход',['overview','participants','roles']],['Подготовка',['gear','food','transport','documents']],['На местности',['route','plan']]];
  const ICONS={
    overview:'<circle cx="12" cy="12" r="8.5"/><path d="M14.9 9.1 13 13l-3.9 1.9L11 11z"/><path d="M12 2.5v1.2M12 20.3v1.2M2.5 12h1.2M20.3 12h1.2"/>',
    participants:'<circle cx="9" cy="8" r="2.4"/><circle cx="16.3" cy="9.1" r="1.8"/><path d="M4.8 17.8c.3-3 2-4.8 4.2-4.8s3.9 1.8 4.2 4.8"/><path d="M13.9 14.2c.8-.9 1.6-1.3 2.5-1.3 1.8 0 3 1.3 3.3 3.6"/>',
    roles:'<circle cx="8.5" cy="7.5" r="2.4"/><path d="M4.2 17.5c.35-3.2 2.1-5 4.3-5 1.35 0 2.45.55 3.2 1.55"/><circle cx="16.7" cy="15.6" r="2.1"/><path d="M16.7 11.9v1M16.7 18.2v1M13 15.6h1M19.4 15.6h1M14.1 13l.7.7M18.6 17.5l.7.7M19.3 13l-.7.7M14.8 17.5l-.7.7"/>',
    gear:'<path d="M8.5 6V5a3.5 3.5 0 0 1 7 0v1"/><rect x="6.3" y="5.8" width="11.4" height="14.2" rx="3.2"/><path d="M8.2 10.2h7.6M8.8 14.1h6.4v3H8.8z"/><path d="M6.3 10.2H5.1v5.2h1.2M17.7 10.2h1.2v5.2h-1.2"/>',
    food:'<path d="M6.5 3v5.2M4.7 3v3.2M8.3 3v3.2M4.7 6.2c0 1.5.7 2.3 1.8 2.3s1.8-.8 1.8-2.3M6.5 8.5V21"/><path d="M15.1 3v18M15.1 3c3.2 1.6 4.2 5.1 4.2 8.3h-4.2"/>',
    transport:'<path d="M5.2 6.2h10.5c1.2 0 2 .4 2.7 1.5l1.5 2.4c.4.6.6 1.3.6 2v4.3H3.5V8c0-1 .7-1.8 1.7-1.8Z"/><path d="M5.8 8.3h8v4h-8zM14.8 8.3h2.2l1.8 3.9h-4z"/><circle cx="7" cy="17.3" r="1.6"/><circle cx="17.2" cy="17.3" r="1.6"/><path d="M3.5 13.2h17"/>',
    documents:'<path d="M6 3.5h8.3L18.5 7v13.5H6z"/><path d="M14.3 3.5V7h4.2M8.8 11h6.8M8.8 14.2h6.8M8.8 17.4h4.5"/>',
    route:'<path d="M3.5 5.2 8.5 3l7 2.2 5-2.2v15.8l-5 2.2-7-2.2-5 2.2z"/><path d="M8.5 3v15.8M15.5 5.2V21"/><path d="M6.5 15.2c1.1-2 2.3-2.8 3.5-2.8 1.8 0 2.3 1.5 3.7 1.5 1.2 0 2.1-1 3.1-2.6" stroke-dasharray="1.6 2.2"/><path d="M17.1 7.5c0 1.5-1.7 3.6-1.7 3.6s-1.7-2.1-1.7-3.6a1.7 1.7 0 1 1 3.4 0Z"/>',
    plan:'<path d="M6 3.5h8.2L18 7.3v13.2H6z"/><path d="M14.2 3.5v3.8H18M8.8 11h6.4M8.8 14.5h6.4M8.8 18h4.2"/>'
  };
  const iconFor=id=>`<span class="sidebar-v43-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[id]||'<circle cx="12" cy="12" r="7"/>'}</svg></span>`;
  function decorateNav(){
    const nav=document.getElementById('nav');if(!nav)return;const buttons=Array.from(nav.querySelectorAll('button[data-tab]'));if(!buttons.length)return;
    const map=new Map(buttons.map(button=>[button.dataset.tab,button])),used=new Set(),fragment=document.createDocumentFragment();
    GROUPS.forEach(([title,ids])=>{const available=ids.map(id=>map.get(id)).filter(Boolean);if(!available.length)return;const group=document.createElement('div');group.className='sidebar-nav-group';const heading=document.createElement('div');heading.className='sidebar-nav-group__title';heading.textContent=title;const items=document.createElement('div');items.className='sidebar-nav-group__items';available.forEach(button=>{const id=button.dataset.tab;used.add(id);button.querySelector('.sidebar-v43-icon')?.remove();button.insertAdjacentHTML('afterbegin',iconFor(id));items.appendChild(button)});group.append(heading,items);fragment.appendChild(group)});
    buttons.filter(button=>!used.has(button.dataset.tab)).forEach(button=>{button.querySelector('.sidebar-v43-icon')?.remove();button.insertAdjacentHTML('afterbegin',iconFor(button.dataset.tab));fragment.appendChild(button)});nav.replaceChildren(fragment);nav.dataset.v43Decorated='1';
  }
  function decorateSidebar(){document.getElementById('sidebar')?.classList.add('sidebar-v43-ready');decorateNav()}
  const originalRenderNav=window.renderNav;if(typeof originalRenderNav==='function')window.renderNav=function(){originalRenderNav.apply(this,arguments);decorateNav()};requestAnimationFrame(decorateSidebar);

})();


;/* source: hikes-preview/overview-v44.js */
/* V44 — approved daylight Overview composition. Uses existing hike state only. */
(() => {
  'use strict';

  let map44 = null;
  const $ = (s, root=document) => root.querySelector(s);
  const safe = v => typeof esc === 'function' ? esc(v) : String(v ?? '');

  function routeStats44(){
    let distance=S.event?.distance||'Уточняется',duration='Уточняется',finish='—',start=S.event?.start||'—',controlPoints=0;
    try{
      if(typeof routeLenV13==='function') distance=`${(routeLenV13()/1000).toFixed(1).replace('.',',')} км`;
      if(typeof routeDurationMinV13==='function'&&typeof fmtDurationV13==='function') duration=fmtDurationV13(routeDurationMinV13());
      if(typeof finalEtaV13==='function') finish=finalEtaV13();
      if(typeof dynamicCpsV13==='function'){
        const cps=dynamicCpsV13()||[];
        controlPoints=Math.max(0,cps.length>=2?cps.length-2:cps.length);
      }
      if(typeof editorV13!=='undefined'&&editorV13?.start) start=editorV13.start;
    }catch(e){}
    return {distance,duration,finish,start,controlPoints};
  }

  function confirmedCount44(){return (S.participants||[]).filter(p=>p.rsvp==='yes').length}
  function maybeCount44(){return (S.participants||[]).filter(p=>p.rsvp==='maybe').length}
  function rolesDone44(){return (S.roles||[]).filter(r=>r.p).length}
  function assigned44(g){return (g.a||[]).reduce((n,a)=>n+(+a[1]||0),0)}
  function gearDone44(){return (S.shared||[]).filter(g=>assigned44(g)>=(+g.need||0)).length}

  function attention44(){
    try{
      const groups=attentionGroups();
      const all=[...(groups.critical||[]).map(x=>({...x,tone:'risk'})),...(groups.warning||[]).map(x=>({...x,tone:'warn'})),...(groups.info||[]).map(x=>({...x,tone:'info'}))];
      return {groups,all,count:all.length};
    }catch(e){return {groups:{critical:[],warning:[],info:[]},all:[],count:0}}
  }

  function nextTasks44(me){
    const out=[];
    if(!me)return out;
    if(me.rsvp==='pending'||me.rsvp==='maybe')out.push({text:'Подтвердить участие',tab:'participants',tone:'warn'});
    if(me.rsvp==='yes'){
      if(['unset','need',undefined,null].includes(S.rides?.there?.[me.id]))out.push({text:'Выбрать транспорт туда',tab:'transport',tone:'risk'});
      if(['unset','need',undefined,null].includes(S.rides?.back?.[me.id]))out.push({text:'Подтвердить транспорт обратно',tab:'transport',tone:'risk'});
      const pr=progress(me.id); if(pr[0]<pr[1])out.push({text:`Закрыть чек-лист снаряжения (${pr[0]}/${pr[1]})`,tab:'gear',tone:'warn'});
      const unc=(S.shared||[]).filter(g=>(g.a||[]).some(a=>a[0]===me.id)&&!(g.confirmed||[]).includes(me.id));
      if(unc.length)out.push({text:'Подтвердить групповое имущество',tab:'gear',tone:'warn'});
    }
    if(!out.length)out.push({text:'Критичных действий на сейчас нет',tab:'',tone:'ok'});
    return out.slice(0,3);
  }

  function eventDateISO44(value){
    const s=String(value||'').trim();
    if(!s||/уточня|не задан/i.test(s))return '';
    let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(m)return `${m[1]}-${m[2]}-${m[3]}`;
    m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/); if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    const months={января:1,февраля:2,марта:3,апреля:4,мая:5,июня:6,июля:7,августа:8,сентября:9,октября:10,ноября:11,декабря:12};
    m=s.toLowerCase().match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?/);
    if(m){const y=m[3]||new Date().getFullYear();return `${y}-${String(months[m[2]]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}
    return '';
  }

  function routePoint44(){
    try{
      const r=typeof editorV13!=='undefined'&&Array.isArray(editorV13.route)?editorV13.route:[];
      if(r.length){const p=r[Math.floor(r.length/2)];return {lat:+p[0],lon:+p[1]}}
    }catch(e){}
    return null;
  }

  function weatherText44(code){
    const c=+code;
    if(c===0)return ['Ясно','sun'];
    if([1,2].includes(c))return ['Переменная облачность','partly'];
    if(c===3)return ['Облачно','cloud'];
    if([45,48].includes(c))return ['Туман','fog'];
    if([51,53,55,56,57].includes(c))return ['Морось','rain'];
    if([61,63,65,66,67,80,81,82].includes(c))return ['Дождь','rain'];
    if([71,73,75,77,85,86].includes(c))return ['Снег','snow'];
    if([95,96,99].includes(c))return ['Гроза','storm'];
    return ['Прогноз','partly'];
  }

  function weatherIcon44(kind){
    const common='viewBox="0 0 48 48" aria-hidden="true"';
    if(kind==='sun')return `<svg ${common}><circle cx="24" cy="24" r="8"/><path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M38.1 9.9l-5 5M14.9 33.1l-5 5"/></svg>`;
    if(kind==='rain'||kind==='storm')return `<svg ${common}><path d="M14 31h22a8 8 0 0 0 0-16 12 12 0 0 0-23-2 9 9 0 0 0 1 18Z"/><path d="M17 36l-2 5M26 36l-2 5M35 36l-2 5"/></svg>`;
    if(kind==='snow')return `<svg ${common}><path d="M14 30h22a8 8 0 0 0 0-16 12 12 0 0 0-23-2 9 9 0 0 0 1 18Z"/><path d="M18 36v6M15 39h6M30 36v6M27 39h6"/></svg>`;
    return `<svg ${common}><path d="M14 31h22a8 8 0 0 0 0-16 12 12 0 0 0-23-2 9 9 0 0 0 1 18Z"/><circle cx="14" cy="12" r="6"/><path d="M14 2v4M4 12h4M20 12h4M7 5l3 3M21 5l-3 3"/></svg>`;
  }

  function weatherPlaceholder44(){
    const dateISO=eventDateISO44(S.event?.date), point=routePoint44();
    let title='Погода появится после выбора даты',detail='Координаты маршрута уже готовы для прогноза.';
    if(dateISO&&point){title='Загружаем прогноз…';detail='По координатам маршрута и дате похода.'}
    else if(dateISO&&!point){title='Маршрут пока не задан';detail='После сохранения трека появится прогноз.'}
    return `<div class="ov44-weather-body" id="ov44WeatherBody"><div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>${safe(title)}</strong><span>${safe(detail)}</span></div></div>`;
  }

  function metric44(icon,label,value,detail,tone=''){
    return `<div class="ov44-metric ${tone}"><span class="ov44-metric-icon">${icon}</span><div><small>${safe(label)}</small><strong>${safe(value)}</strong><em>${safe(detail)}</em></div></div>`;
  }

  function ico44(type){
    const icons={
      route:'<path d="M5 18c2-5 4-8 7-8s4 3 7 3 4-3 5-7"/><circle cx="5" cy="18" r="2"/><circle cx="24" cy="6" r="2"/>',
      users:'<circle cx="9" cy="8" r="2.5"/><circle cx="17" cy="9" r="2"/><path d="M4 19c.4-3.5 2.2-5.3 5-5.3s4.6 1.8 5 5.3M14 14.5c.8-.8 1.7-1.2 2.7-1.2 2 0 3.4 1.4 3.8 4"/>',
      roles:'<circle cx="8" cy="8" r="2.5"/><path d="M3 19c.4-3.5 2.2-5.3 5-5.3 1.3 0 2.4.4 3.2 1.2"/><circle cx="17" cy="16" r="2.4"/><path d="M17 11.8v1M17 19.2v1M12.8 16h1M20.2 16h1"/>',
      gear:'<path d="M8 7V5.8A3.8 3.8 0 0 1 11.8 2h.4A3.8 3.8 0 0 1 16 5.8V7"/><rect x="5.5" y="6.5" width="13" height="15" rx="3"/><path d="M9 11h6M9 15h6"/>',
      alert:'<path d="M12 3 22 21H2L12 3Z"/><path d="M12 9v5M12 18h.01"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[type]||icons.route}</svg>`;
  }

  function overview44(){
    const me=(S.participants||[]).find(p=>p.id===S.current)||(S.participants||[])[0];
    const meId=me?.id||'',rs=routeStats44(),att=attention44(),tasks=nextTasks44(me),pr=me?progress(me.id):[0,0,0],roles=me?participantRoles(me.id):[],shared=me?participantShared(me.id):[];
    const yes=confirmedCount44(),maybe=maybeCount44(),roleDone=rolesDone44(),gearDone=gearDone44(),ready=typeof readiness==='function'?readiness():0;
    const roleMissing=Math.max(0,(S.roles||[]).length-roleDone),gearMissing=Math.max(0,(S.shared||[]).length-gearDone);
    const topAttention=att.all.slice(0,3);
    const subtitle=[S.event?.type,S.event?.duration].filter(Boolean).join(' · ');

    return `<div class="ov44-shell">
      <header class="ov44-hero-head"><div class="ov44-hero-copy"><div class="page-kicker">Командный штаб</div><h1>${safe(S.event?.short||S.event?.title||'Поход')}</h1><p>${safe(subtitle)}</p></div></header>
      <section class="ov44-top-grid">
        <div class="ov44-map-card"><div id="overviewMapV44" class="ov44-map"><div class="ov44-map-fallback">Маршрут загружается…</div></div><div class="ov44-map-actions"><button class="btn alt sm" data-v44-jump="route">Открыть маршрут</button></div></div>
        <aside class="ov44-right-stack">
          <section class="ov44-card ov44-readiness"><div class="ov44-card-head"><h2>Готовность группы</h2><span>${safe(ready)}%</span></div><div class="ov44-ready-row"><strong>${safe(ready)}%</strong><div class="ov44-ready-track"><i style="width:${Math.max(0,Math.min(100,ready))}%"></i></div></div><p>${yes} участников · ${att.count} ${att.count===1?'вопрос':'вопроса'}</p></section>
          <section class="ov44-card ov44-weather"><div class="ov44-card-head"><h2>Погода <small>(предварительно)</small></h2><button data-v44-weather type="button">Обновить</button></div>${weatherPlaceholder44()}</section>
        </aside>
      </section>
      <section class="ov44-metrics-strip">
        ${metric44(ico44('route'),'Маршрут',rs.distance,rs.duration)}
        ${metric44(ico44('users'),'Участники',String(yes),maybe?`${maybe} возможно`:'состав подтверждён')}
        ${metric44(ico44('roles'),'Роли',`${roleDone}/${(S.roles||[]).length}`,roleMissing?`${roleMissing} не закрыто`:'распределены')}
        ${metric44(ico44('gear'),'Снаряжение',`${gearDone}/${(S.shared||[]).length}`,gearMissing?`${gearMissing} дефицита`:'групповое закрыто')}
        ${metric44(ico44('alert'),'Внимание',String(att.count),att.count?'требует решения':'вопросов нет',att.count?'risk':'ok')}
      </section>
      <section class="ov44-main-grid">
        <section class="ov44-card ov44-my-prep"><div class="ov44-card-head"><h2>Моя подготовка</h2><button data-v44-jump="profile">Открыть профиль</button></div>
          <div class="ov44-prep-grid"><div class="ov44-person"><div class="avatar">${safe(initials(me?.name||(window.HikeSession?.signed?'У':'Г')))}</div><div><strong>${safe(me?.name||(window.HikeSession?.signed?'Участник':'Гость'))}</strong><span>${safe(roles.join(' · ')||'Роль не назначена')}</span></div></div>
          <div class="ov44-progress-block"><div><span>Снаряжение</span><b>${pr[0]} / ${pr[1]}</b></div><div class="ov44-progress"><i style="width:${pr[2]}%"></i></div></div>
          <div class="ov44-prep-lines"><button data-v44-jump="transport"><span>Транспорт туда</span><b>${safe(rideLabel(meId,'there'))}</b></button><button data-v44-jump="transport"><span>Транспорт обратно</span><b class="${['unset','need'].includes(S.rides?.back?.[meId])?'warn':''}">${safe(rideLabel(meId,'back'))}</b></button>${shared.length?`<button data-v44-jump="gear"><span>Групповое имущество</span><b>${safe(shared.join(' · '))}</b></button>`:''}</div></div>
          <div class="ov44-next-action"><span>Следующее действие</span><strong>${safe(tasks[0]?.text||'Критичных действий нет')}</strong>${tasks[0]?.tab?`<button data-v44-jump="${tasks[0].tab}">Открыть раздел →</button>`:''}</div>
        </section>
        <section class="ov44-card ov44-attention"><div class="ov44-card-head"><h2>Требует внимания <span>${att.count}</span></h2><button data-v44-jump="participants">Смотреть всё</button></div><div class="ov44-att-list">${topAttention.map(x=>`<button data-v44-jump="${x.tab}" class="${x.tone}"><i></i><span><b>${safe(x.title)}</b><small>${safe(x.detail)}</small></span><em>Открыть</em></button>`).join('')||'<div class="ov44-empty">Незакрытых вопросов нет.</div>'}</div></section>
      </section>
      <section class="ov44-bottom-grid">
        <section class="ov44-card ov44-links"><div class="ov44-card-head"><h2>Полезные разделы</h2></div><button data-v44-jump="route">Маршрут и трек <span>→</span></button><button data-v44-jump="plan">План дня <span>→</span></button><button data-v44-jump="gear">Чек-лист снаряжения <span>→</span></button><button data-v44-jump="food">Питание <span>→</span></button></section>
        <section class="ov44-card ov44-nearest"><div class="ov44-card-head"><h2>Ближайшие задачи</h2><button data-v44-jump="plan">Весь план</button></div>${tasks.map((t,i)=>`<button class="ov44-near-row ${t.tone}" ${t.tab?`data-v44-jump="${t.tab}"`:''}><i></i><span>${safe(t.text)}</span><em>${i===0?'сейчас':'далее'}</em></button>`).join('')}</section>
        <section class="ov44-scenic"><div class="ov44-scenic-copy"><strong>Люди. Природа. Движение.</strong><span>Больше, чем просто поход.</span></div><button data-v44-jump="route" aria-label="Открыть маршрут">→</button></section>
      </section>
    </div>`;
  }

  function initMap44(){
    if(tab!=='overview')return;
    const el=$('#overviewMapV44'); if(!el)return;
    try{if(map44){map44.remove();map44=null}}catch(e){}
    try{
      if(typeof L==='undefined'||typeof editorV13==='undefined'||!Array.isArray(editorV13.route)||editorV13.route.length<2){el.innerHTML='<div class="ov44-map-fallback">Маршрут пока не задан</div>';return}
      el.innerHTML='';
      map44=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:false,dragging:true,tap:false});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map44);
      const line=L.polyline(editorV13.route,{weight:5,opacity:.96,color:'#1f6b53'}).addTo(map44);
      const cps=typeof dynamicCpsV13==='function'?(dynamicCpsV13()||[]):[];
      cps.forEach(cp=>L.circleMarker([cp.lat,cp.lon],{radius:cp.number==='С'||cp.number==='Ф'?6:4,weight:2,color:'#1f6b53',fillColor:'#f8fbf8',fillOpacity:1}).addTo(map44));
      map44.fitBounds(line.getBounds(),{padding:[22,22]});
      setTimeout(()=>map44?.invalidateSize(),80);
    }catch(e){el.innerHTML='<div class="ov44-map-fallback">Не удалось отрисовать маршрут</div>'}
  }

  async function loadWeather44(){
    if(tab!=='overview')return;
    const body=$('#ov44WeatherBody'); if(!body)return;
    const dateISO=eventDateISO44(S.event?.date),point=routePoint44();
    if(!dateISO||!point){
      if(!dateISO) body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>Погода появится после выбора даты</strong><span>Координаты маршрута уже готовы для прогноза.</span></div>`;
      else body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('cloud')}</div><div class="ov44-weather-copy"><strong>Маршрут пока не задан</strong><span>После сохранения трека появится прогноз.</span></div>`;
      return;
    }
    const today=new Date();today.setHours(0,0,0,0);const d=new Date(`${dateISO}T00:00:00`);const days=Math.round((d-today)/86400000);
    if(days<0){body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('cloud')}</div><div class="ov44-weather-copy"><strong>Дата уже прошла</strong><span>Для обзора нужен будущий прогноз.</span></div>`;return}
    if(days>16){body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>Прогноз будет доступен ближе к дате</strong><span>Сервис даёт прогноз до 16 дней вперёд.</span></div>`;return}
    body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>Загружаем прогноз…</strong><span>По координатам маршрута.</span></div>`;
    try{
      const q=new URLSearchParams({latitude:String(point.lat),longitude:String(point.lon),daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',timezone:'auto',wind_speed_unit:'ms',start_date:dateISO,end_date:dateISO});
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);if(!r.ok)throw new Error(`weather ${r.status}`);const j=await r.json();
      const dly=j.daily||{},code=dly.weather_code?.[0],mx=dly.temperature_2m_max?.[0],mn=dly.temperature_2m_min?.[0],rain=dly.precipitation_probability_max?.[0],wind=dly.wind_speed_10m_max?.[0],wt=weatherText44(code);
      body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44(wt[1])}</div><div class="ov44-weather-copy ov44-weather-live"><div><strong>${Number.isFinite(mx)?`${Math.round(mx)}°`:'—'}</strong><span>${safe(wt[0])}${Number.isFinite(mn)?` · минимум ${Math.round(mn)}°`:''}</span></div><dl><div><dt>Ветер</dt><dd>${Number.isFinite(wind)?`${wind.toFixed(1).replace('.',',')} м/с`:'—'}</dd></div><div><dt>Осадки</dt><dd>${Number.isFinite(rain)?`${Math.round(rain)}%`:'—'}</dd></div></dl></div>`;
    }catch(e){body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('cloud')}</div><div class="ov44-weather-copy"><strong>Прогноз временно недоступен</strong><span>Остальные данные похода работают без погоды.</span></div>`}
  }

  function bind44(){
    document.body.classList.toggle('ov44-active',tab==='overview');
    if(tab!=='overview')return;
    document.querySelectorAll('[data-v44-jump]').forEach(b=>b.onclick=()=>{const target=b.dataset.v44Jump;if(!target)return;tab=target;render()});
    document.querySelector('[data-v44-weather]')?.addEventListener('click',loadWeather44);
    requestAnimationFrame(()=>{initMap44();loadWeather44()});
  }

  const baseBind44=bind;
  bind=function(){baseBind44();bind44()};
  overview=overview44;
  document.querySelector('.build-label')?.replaceChildren(document.createTextNode('V44 · обзор похода'));
  render();
})();


;/* source: hikes-preview/hotfix-v58.js */
/* V58 — remove duplicate Overview facts and make organizer preview editing functional. */
(() => {
  'use strict';

  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  const previewAdmin=()=>!!window.HikeAccessV47?.access?.().admin;
  const cloudOrganizer=()=>document.body.classList.contains('hike-organizer');
  const plural=(n,one,few,many)=>{const a=Math.abs(Number(n)||0)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
  const duration=(days,overnight)=>{
    const d=Math.max(1,Number(days)||1);
    if(!overnight)return `${d} ${plural(d,'день','дня','дней')}`;
    const n=Math.max(1,d-1);
    return `${d} ${plural(d,'день','дня','дней')} · ${n} ${plural(n,'ночь','ночи','ночей')}`;
  };
  const meetingParts=raw=>{
    const text=String(raw||'').trim();
    if(!text||/^время и точка уточняются$/i.test(text))return {time:'',place:''};
    const m=text.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    return m?{time:m[1],place:(m[2]||'').trim()}:{time:'',place:text};
  };
  const editIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5 8 18.8 18.2 8.6a2 2 0 0 0-2.8-2.8L5.2 16zM13.8 7.4l2.8 2.8"/></svg>';

  function setFact(card,value,detail,focus){
    if(!card)return;
    const strong=card.querySelector('strong');if(strong){strong.textContent=value;strong.title=value}
    let em=card.querySelector('em');
    if(!em){em=document.createElement('em');card.querySelector('div:nth-child(2)')?.appendChild(em)}
    if(em){em.textContent=detail;em.title=detail}
    card.querySelectorAll('.ov48-fact-edit,.ov57-fact-edit,.v58-fact-edit').forEach(n=>n.remove());
    const editable=previewAdmin()||cloudOrganizer();
    card.classList.toggle('v58-editable',editable);
    if(!editable)return;
    const b=document.createElement('button');b.type='button';b.className='v58-fact-edit';b.dataset.v58Focus=focus;b.setAttribute('aria-label','Редактировать');b.innerHTML=editIcon;
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.HikeEventV49?.openEditor?.(focus)});
    card.appendChild(b);
  }

  function decorateFacts(){
    if(typeof tab!=='undefined'&&tab!=='overview')return;
    const shell=document.querySelector('.ov44-shell');if(!shell)return;
    shell.querySelectorAll('.ov57-event-facts').forEach(n=>n.remove());
    const cards=[...shell.querySelectorAll('.ov48-event-facts .ov48-fact')];if(cards.length<4)return;
    const meet=meetingParts(S?.event?.meeting);
    const d=window.HikeEventV49?.event?.duration_days||S?.event?.durationDays||2;
    const overnight=window.HikeEventV49?.event?.overnight ?? (S?.event?.overnight!==false);
    setFact(cards[0],S?.event?.date||'Дата уточняется','Дата начала похода','#evStart');
    setFact(cards[1],meet.place||'Место уточняется','Точка общего сбора','#evMeetPlace');
    setFact(cards[2],meet.time||'Время уточняется','До выхода на маршрут','#evMeetTime');
    setFact(cards[3],duration(d,overnight),'Длительность всего похода','#evDays');
    const build=document.querySelector('.build-label');if(build)build.textContent='V58 · стабильная сборка';
  }

  function statusCode(value){return ({'Подготовка':'planning','Регистрация открыта':'open','Набор закрыт':'closed','Отменён':'cancelled'})[value]||'planning'}
  function statusText(value){return ({planning:'Подготовка',open:'Регистрация открыта',closed:'Набор закрыт',cancelled:'Отменён'})[value]||'Подготовка'}

  function localEditor(focus=''){
    if(!previewAdmin()){if(typeof toast==='function')toast('Редактирование доступно организатору');return}
    const row=window.HikeEventV49?.event||{};
    const meet=meetingParts(S?.event?.meeting||row.meeting_label);
    const days=Math.max(1,Number(row.duration_days||S?.event?.durationDays)||2);
    const overnight=row.overnight ?? (S?.event?.overnight!==false);
    const start=S?.event?._previewStart||'';
    const status=row.status||statusCode(S?.event?.status);
    openModal('Основная информация о походе',`<div class="form-grid hike-settings-form v49-event-form">
      <div class="field full"><label>Название<input id="evTitle" value="${safe(row.title||S?.event?.title||S?.event?.short||'Томинский лесопарк · поход-тренировка')}"></label></div>
      <div class="field"><label>Дата и время старта<input id="evStart" type="datetime-local" value="${safe(start)}"></label></div>
      <div class="field"><label>Время сбора<input id="evMeetTime" type="time" value="${safe(meet.time)}"></label></div>
      <div class="field full"><label>Место сбора<input id="evMeetPlace" value="${safe(meet.place)}" placeholder="Например: парковка у входа в лесопарк"></label></div>
      <div class="field"><label>Количество дней<input id="evDays" type="number" min="1" max="30" value="${days}"></label></div>
      <div class="field"><label class="v49-check"><input id="evOvernight" type="checkbox" ${overnight?'checked':''}><span>С ночёвкой</span></label></div>
      <div class="field full"><label>Статус<select id="evStatus"><option value="planning" ${status==='planning'?'selected':''}>Подготовка</option><option value="open" ${status==='open'?'selected':''}>Регистрация открыта</option><option value="closed" ${status==='closed'?'selected':''}>Набор закрыт</option><option value="cancelled" ${status==='cancelled'?'selected':''}>Отменён</option></select></label></div>
    </div>`,layer=>{
      const title=layer.querySelector('#evTitle').value.trim();if(!title){toast('Укажи название похода');return false}
      const starts=layer.querySelector('#evStart').value,meetTime=layer.querySelector('#evMeetTime').value,meetPlace=layer.querySelector('#evMeetPlace').value.trim(),daysValue=Math.max(1,Number(layer.querySelector('#evDays').value)||1),night=layer.querySelector('#evOvernight').checked,st=layer.querySelector('#evStatus').value;
      S.event.title=title;S.event.durationDays=daysValue;S.event.overnight=night;S.event.duration=duration(daysValue,night);S.event.meeting=[meetTime,meetPlace].filter(Boolean).join(' · ')||'Время и точка уточняются';S.event.status=statusText(st);S.event._previewStart=starts;
      S.event.date=starts?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(starts)):'Дата уточняется';
      if(typeof save==='function')save();render();toast('Изменения сохранены в режиме проверки');return true;
    });
    requestAnimationFrame(()=>document.querySelector(focus)?.focus());
  }

  function patchEditor(){
    const api=window.HikeEventV49;if(!api||api.__v58Patched)return false;
    const original=api.openEditor.bind(api);
    api.openEditor=focus=>cloudOrganizer()?original(focus):localEditor(focus);
    api.__v58Patched=true;
    return true;
  }

  let scheduled=false;
  const refresh=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patchEditor();decorateFacts()})};
  const observer=new MutationObserver(refresh);
  const boot=()=>{observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});refresh()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',()=>{const timer=setInterval(()=>{refresh();if(patchEditor()&&document.querySelector('.ov48-event-facts')){clearInterval(timer);refresh()}},80);setTimeout(()=>clearInterval(timer),5000)},{once:true});
})();


;/* source: hikes-preview/access-v47-docs.js */
/* V47 — documents UI and render integration. */
(() => {
  'use strict';
  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  let docs=[];
  const fallback=()=> (S.materials||[]).map((m,i)=>({id:m.id||`local_${i}`,title:m.title||'Материал',category:'Материалы',file_name:m.title||'',type:m.type||'',description:m.status==='ready'?'Материал подготовлен':'Файл будет добавлен организатором',local:true}));
  const rows=()=>docs.length?docs:fallback();
  const ext=d=>(String(d.file_name||d.title||d.type||'FILE').split('.').pop()||d.type||'FILE').toUpperCase().slice(0,6);
  const size=n=>!n?'':n<1048576?`${Math.max(1,Math.round(n/1024))} КБ`:`${(n/1048576).toFixed(1).replace('.',',')} МБ`;
  function mini(){
    const host=document.querySelector('.ov44-bottom-grid .ov44-card:first-child');if(!host)return;const list=rows().slice(0,4);
    host.classList.add('v47-doc-summary');host.innerHTML=`<div class="ov44-card-head"><h2>Документы и материалы</h2><button data-v47-jump="documents">Все документы</button></div><div class="v47-doc-mini">${list.map(d=>`<button data-v47-doc-open="${safe(d.id)}" ${d.local||!d.storage_path?'disabled':''}><span><b>${safe(d.title)}</b><small>${safe(d.category||ext(d))}${size(d.size_bytes)?` · ${safe(size(d.size_bytes))}`:''}</small></span><em>${safe(ext(d))}${d.local||!d.storage_path?'':' ↓'}</em></button>`).join('')||'<div class="ov44-empty">Документы пока не добавлены.</div>'}</div>`;bind();
  }
  function row(d,a){const ready=!!d.storage_path&&!d.local;return `<article class="v47-doc-row"><div class="v47-doc-type">${safe(ext(d))}</div><div class="v47-doc-copy"><div><strong>${safe(d.title)}</strong><span>${safe(d.category||'Материалы')}</span></div><p>${safe(d.description||(ready?'Материал похода':'Файл ещё не загружен'))}</p><small>${safe(d.file_name||'')}${size(d.size_bytes)?` · ${safe(size(d.size_bytes))}`:''}</small></div><div class="v47-doc-actions">${ready?`<button class="btn alt sm" data-v47-doc-open="${safe(d.id)}">Открыть / скачать</button>`:'<span class="v47-doc-pending">Ожидает файл</span>'}${a.admin&&ready?`<button class="icon-btn" data-v47-doc-delete="${safe(d.id)}" title="Удалить">×</button>`:''}</div></article>`}
  function page(){const base=window.HikeAccessV47?.access?.()||{admin:false},a={...base,admin:base.admin||!!window.HikeWorkspace?.can?.('documents')},list=rows(),actions=a.admin?'<button class="btn sand" id="v47UploadDocument">Загрузить документ</button>':'';return `<div class="v47-doc-page">${pageHead('Подготовка','Документы','Памятки, PDF, Word, треки и другие материалы этого похода.',actions)}<section class="v47-doc-intro"><div><span>Материалы похода</span><strong>${list.length}</strong><small>документов и файлов</small></div><p>${a.admin?'Организатор может добавлять материалы. Участникам доступно чтение и скачивание.':'Здесь находятся материалы, которые организатор рекомендует скачать или изучить до похода.'}</p></section><section class="v47-doc-list">${list.map(d=>row(d,a)).join('')||'<div class="v47-doc-empty"><strong>Документы пока не добавлены</strong><span>Когда организатор загрузит материалы, они появятся здесь.</span></div>'}</section></div>`}
  function bind(){document.querySelectorAll('[data-v47-jump]').forEach(b=>b.onclick=()=>{tab=b.dataset.v47Jump;render()});document.querySelectorAll('[data-v47-doc-open]').forEach(b=>b.onclick=()=>window.V47Cloud?.open?.(b.dataset.v47DocOpen));document.querySelectorAll('[data-v47-doc-delete]').forEach(b=>b.onclick=()=>window.V47Cloud?.remove?.(b.dataset.v47DocDelete));document.getElementById('v47UploadDocument')?.addEventListener('click',()=>window.V47Cloud?.upload?.())}
  function setDocs(next){docs=Array.isArray(next)?next:[];if(tab==='overview')mini();if(tab==='documents')refresh()}
  function refresh(){if(tab!=='documents')return;const app=document.getElementById('app');if(app)app.innerHTML=page();bind()}
  if(Array.isArray(NAV)&&!NAV.some(([id])=>id==='documents')){const at=NAV.findIndex(([id])=>id==='transport');NAV.splice(at>=0?at+1:NAV.length,0,['documents','Документы'])}
  const baseRender=render;render=function(){if(tab!=='documents')return baseRender();renderNav();const who=document.getElementById('who');if(who)who.innerHTML=(S.participants||[]).map(p=>`<option value="${safe(p.id)}" ${p.id===S.current?'selected':''}>${safe(p.name)}</option>`).join('');document.body.classList.remove('ov44-active');document.body.dataset.hikeTab='documents';const app=document.getElementById('app');if(app){app.dataset.hikeTab='documents';app.innerHTML=page()}bind();window.V47Cloud?.load?.();document.querySelector('.build-label')?.replaceChildren('V47 · роли и документы')};
  window.V47Docs={decorateOverview:mini,bind,setDocs,get:()=>rows(),refresh};
})();


;/* source: hikes-preview/access-v47-core.js */
/* V47 — role-aware workspace core. */
(() => {
  'use strict';
  const legacyMap={
    'Руководитель':'lead','Навигатор':'nav','Замыкающий':'safety','Первая помощь':'safety',
    'Транспорт':'logistics','Снаряжение':'logistics','Питание':'logistics','Связь':'logistics'
  };
  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  const current=()=> (S.participants||[]).find(p=>p.id===S.current)||(S.participants||[])[0]||null;
  const signed=()=>{try{return !!JSON.parse(localStorage.getItem('rl_hike_auth_v42')||'null')?.access_token}catch(e){return false}};
  const organizer=()=>{
    if(window.HikePreviewV48?.active)return false;
    return document.body.classList.contains('hike-organizer')||(!signed()&&current()?.id==='p1');
  };
  function roles(pid=current()?.id){
    const modern=(S.roles||[]).filter(r=>r.p===pid).map(r=>({id:r.id,title:r.title,desc:r.desc||'',critical:!!r.critical,responsibilities:Array.isArray(r.responsibilities)?r.responsibilities:[],acceptance:r.acceptance||''}));
    if(modern.length)return modern;
    const rows=[];
    if(Array.isArray(S.rolesV36?.roles)&&S.rolesV36.roles.length){
      S.rolesV36.roles.filter(r=>r.p===pid).forEach(r=>rows.push({id:r.id,title:r.title,desc:r.desc||''}));
    }
    return rows.filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i);
  }
  function access(){
    const rs=roles(),ids=new Set(rs.map(r=>r.id)),admin=organizer(),lead=ids.has('lead');
    return {admin,lead,roles:rs,ids,group:admin||lead,responsibility:rs.filter(r=>r.id!=='lead')};
  }
  const rideDone=(pid,d)=>{const v=S.rides?.[d]?.[pid];return !!v&&!['unset','need'].includes(v)};
  function ownTasks(pid=current()?.id){
    const p=(S.participants||[]).find(x=>x.id===pid); if(!p)return [];
    const out=[];
    if(['pending','maybe'].includes(p.rsvp))out.push({text:'Подтвердить участие',tab:'participants',tone:'warn'});
    if(p.rsvp!=='no'){
      if(!rideDone(pid,'there'))out.push({text:'Выбрать транспорт туда',tab:'transport',tone:'risk'});
      if(!rideDone(pid,'back'))out.push({text:'Подтвердить транспорт обратно',tab:'transport',tone:'risk'});
      try{const pr=progress(pid);if(pr[0]<pr[1])out.push({text:`Закрыть чек-лист снаряжения (${pr[0]}/${pr[1]})`,tab:'gear',tone:'warn'})}catch(e){}
      const unc=(S.shared||[]).filter(g=>(g.a||[]).some(a=>a[0]===pid)&&!(g.confirmed||[]).includes(pid));
      if(unc.length)out.push({text:`Подтвердить групповое имущество (${unc.length})`,tab:'gear',tone:'warn'});
    }
    return out;
  }
  function personalReady(pid=current()?.id){
    const p=(S.participants||[]).find(x=>x.id===pid);if(!p)return {done:0,total:4,percent:0};let n=0;
    if(p.rsvp==='yes')n++;try{const pr=progress(pid);if(!pr[1]||pr[0]>=pr[1])n++}catch(e){}if(rideDone(pid,'there'))n++;if(rideDone(pid,'back'))n++;
    return {done:n,total:4,percent:Math.round(n/4*100)};
  }
  function responsibility(){
    const a=access(),out=[];
    if(a.ids.has('nav')){
      let cp=0;try{cp=typeof dynamicCpsV13==='function'?Math.max(0,(dynamicCpsV13()||[]).length-2):0}catch(e){}
      out.push({title:'Маршрут и контрольные точки',detail:cp?`${cp} контрольных точек на маршруте`:'Проверить маршрут перед выходом',tab:'route',tone:'info'});
      out.push({title:'План движения',detail:`${(S.timeline||[]).length} этапов в плане`,tab:'plan',tone:'info'});
    }
    if(a.ids.has('logistics')){
      const t=['there','back'].reduce((n,d)=>n+(S.participants||[]).filter(p=>['yes','maybe'].includes(p.rsvp)&&['unset','need',undefined].includes(S.rides?.[d]?.[p.id])).length,0);
      const g=(S.shared||[]).filter(x=>(x.a||[]).reduce((n,y)=>n+(+y[1]||0),0)<(+x.need||0)).length;
      out.push({title:'Транспорт',detail:t?`${t} незакрытых решений`:'Логистика закрыта',tab:'transport',tone:t?'warn':'ok'});
      out.push({title:'Групповое снаряжение',detail:g?`${g} позиций требуют решения`:'Дефицитов нет',tab:'gear',tone:g?'warn':'ok'});
      out.push({title:'Питание и вода',detail:'Проверить меню, закупку и распределение',tab:'food',tone:'info'});
    }
    if(a.ids.has('safety')){
      const people=(S.participants||[]).filter(p=>['yes','maybe'].includes(p.rsvp));
      const bad=people.filter(p=>{try{const pr=progress(p.id);return pr[0]<pr[1]}catch(e){return false}});
      out.push({title:'Состав и готовность группы',detail:`${people.length} участников · ${bad.length} с незакрытым снаряжением`,tab:'participants',tone:bad.length?'warn':'ok'});
      out.push({title:'Безопасность и аптечка',detail:'Проверить распределение общего имущества',tab:'gear',tone:'info'});
    }
    return out.slice(0,4);
  }
  function metric(node,label,value,detail,risk=false){if(!node)return;node.querySelector('small')?.replaceChildren(label);node.querySelector('strong')?.replaceChildren(value);node.querySelector('em')?.replaceChildren(detail);node.classList.toggle('risk',risk)}
  const list=(items,personal=false)=>items.length?items.map(x=>`<button data-v47-jump="${safe(x.tab)}" class="${safe(x.tone||'')}"><i></i><span><b>${safe(x.title||x.text)}</b><small>${safe(personal?'Относится только к вашей подготовке':x.detail||'')}</small></span><em>Открыть</em></button>`).join(''):'<div class="ov44-empty">Новых действий нет.</div>';
  function navMarks(){
    const a=access();document.querySelectorAll('#nav [data-tab]').forEach(b=>b.classList.remove('is-responsibility'));
    const mark=ids=>ids.forEach(id=>document.querySelector(`#nav [data-tab="${id}"]`)?.classList.add('is-responsibility'));
    if(a.ids.has('nav'))mark(['route','plan']);if(a.ids.has('logistics'))mark(['gear','food','transport','documents']);if(a.ids.has('safety'))mark(['participants','gear']);
  }
  function applyOverview(){
    if(tab!=='overview')return;const a=access();document.body.dataset.hikeAccess=a.admin?'organizer':a.roles.length?'responsible':'participant';document.querySelector('.ov44-hero-copy p')?.remove();
    const heroKicker=document.querySelector('.ov44-hero-copy .page-kicker');if(heroKicker&&!a.group)heroKicker.textContent=a.responsibility.length?'Мой поход · зона ответственности':'Мой поход';
    if(!a.group){
      const r=personalReady(),card=document.querySelector('.ov44-readiness');if(card){card.querySelector('.ov44-card-head h2')?.replaceChildren('Моя готовность');card.querySelectorAll('.ov44-card-head>span,.ov44-ready-row>strong').forEach(el=>el.textContent=`${r.percent}%`);const bar=card.querySelector('.ov44-ready-track i');if(bar)bar.style.width=`${r.percent}%`;card.querySelector('p')?.replaceChildren(`${r.done} из ${r.total} личных пунктов готовы`)}
      const ms=[...document.querySelectorAll('.ov44-metric')],pr=(()=>{try{return progress(current()?.id)}catch(e){return [0,0,0]}})(),rs=roles(),tasks=ownTasks(),there=rideDone(current()?.id,'there'),back=rideDone(current()?.id,'back'),transportDone=(there?1:0)+(back?1:0);
      metric(ms[1],'Транспорт',transportDone===2?'Готово':`${transportDone}/2`,transportDone===2?'туда и обратно подтверждены':transportDone===1?'одно направление не закрыто':'нужно выбрать поездку',transportDone<2);
      metric(ms[2],'Моя роль',rs[0]?.title||'Участник',rs.length>1?`ещё ${rs.length-1}`:(rs.length?'моя ответственность':'без отдельной зоны'));
      metric(ms[3],'Снаряжение',`${pr[0]}/${pr[1]}`,pr[0]>=pr[1]?'личное готово':`${Math.max(0,pr[1]-pr[0])} осталось`);
      metric(ms[4],'Мои задачи',String(tasks.length),tasks.length?'осталось выполнить':'всё закрыто',tasks.some(x=>x.tone==='risk'));
      const box=document.querySelector('.ov44-attention');if(box){const items=a.responsibility.length?responsibility():tasks;const h=box.querySelector('.ov44-card-head h2');if(h)h.innerHTML=`${a.responsibility.length?'Моя ответственность':'Что осталось сделать'} <span>${items.length}</span>`;const act=box.querySelector('.ov44-card-head button');if(act){act.textContent=a.responsibility.length?rs.map(x=>x.title).join(' · '):'Только мои задачи';act.removeAttribute('data-v44-jump');act.disabled=true}const target=box.querySelector('.ov44-att-list');if(target)target.innerHTML=list(items,!a.responsibility.length)}
    }
    window.V47Docs?.decorateOverview?.();navMarks();bindExtra();
  }
  function bindExtra(){document.querySelectorAll('[data-v47-jump]').forEach(b=>b.onclick=()=>{tab=b.dataset.v47Jump;render()})}
  window.HikeAccessV47={access,roles,ownTasks,responsibility,applyOverview,navMarks,bindExtra};
  const baseBind=bind;bind=function(){baseBind();navMarks();if(tab==='overview')applyOverview();window.V47Docs?.bind?.()};
  const baseRenderNav=renderNav;renderNav=function(){baseRenderNav();navMarks();const m=document.querySelector('[data-mobile="more"]');if(m&&tab==='documents')m.classList.add('active')};
  toggleMobileSheet=function(){const sh=document.getElementById('mobileSheet');sh.innerHTML=[['participants','Участники'],['roles','Роли'],['documents','Документы'],['plan','План']].map(([id,label])=>`<button type="button" data-sheet-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');sh.classList.toggle('open');sh.setAttribute('aria-hidden',sh.classList.contains('open')?'false':'true');sh.querySelectorAll('[data-sheet-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.sheetTab;closeMobileSheet();render()})};
})();


;/* source: hikes-preview/access-v47-cloud.js */
/* V47 — private Supabase Storage adapter for hike documents. */
(() => {
  'use strict';
  const AUTH='rl_hike_auth_v42',SLUG='tominsky-lesopark',MAX=25*1024*1024;
  const MIME={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',txt:'text/plain',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gpx:'application/gpx+xml',kml:'application/vnd.google-earth.kml+xml'};
  let cfg=null,eventId='',loaded=false;
  const session=()=>{try{return JSON.parse(localStorage.getItem(AUTH)||'null')}catch(e){return null}};
  async function config(){
    if(cfg)return cfg;if(window.HikeCloudConfig){cfg=window.HikeCloudConfig;return cfg}const text=await fetch('./supabase-v42.js?v=42-20260912').then(r=>r.text());
    const url=text.match(/PROJECT_URL\s*=\s*['"]([^'"]+)['"]/i)?.[1],key=text.match(/PUBLISHABLE_KEY\s*=\s*['"]([^'"]+)['"]/i)?.[1];
    if(!url||!key)throw new Error('Конфигурация хранилища недоступна');cfg={url,key};return cfg;
  }
  async function req(path,opt={}){
    const c=await config(),s=session();const headers={apikey:c.key,...(s?.access_token?{Authorization:`Bearer ${s.access_token}`}:{}) ,...(opt.headers||{})};
    return fetch(`${c.url}${path}`,{...opt,headers});
  }
  async function eid(){if(eventId)return eventId;const r=await req(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(SLUG)}&select=id`);const j=await r.json().catch(()=>[]);if(!r.ok||!j?.[0]?.id)throw new Error('Мероприятие не найдено');eventId=j[0].id;return eventId}
  async function load(force=false){if(loaded&&!force)return;if(!session()?.access_token)return;try{const id=await eid(),r=await req(`/rest/v1/hike_files?event_id=eq.${id}&is_visible=eq.true&select=*&order=created_at.desc`),j=await r.json().catch(()=>[]);if(!r.ok)throw new Error('Не удалось загрузить документы');loaded=true;window.V47Docs?.setDocs?.(j)}catch(e){console.warn('V47 docs',e)}}
  async function signed(doc){const r=await req(`/storage/v1/object/sign/hike-files/${encodeURI(doc.storage_path)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.signedURL)throw new Error(j.message||'Не удалось открыть файл');const c=await config();return j.signedURL.startsWith('http')?j.signedURL:`${c.url}/storage/v1${j.signedURL}`}
  async function open(id){const d=window.V47Docs?.get?.().find(x=>String(x.id)===String(id));if(!d?.storage_path)return;try{const a=document.createElement('a');a.href=await signed(d);a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}catch(e){toast(e.message||'Не удалось открыть документ')}}
  const clean=n=>{const p=String(n||'file').split('.'),x=p.length>1?`.${p.pop().toLowerCase()}`:'';return `${p.join('.').toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'file'}${x}`};
  function upload(){
    const a=window.HikeAccessV47?.access?.();if(!(a?.admin||window.HikeWorkspace?.can?.('documents')))return toast('Нет доступа к редактированию документов');
    openModal('Добавить документ',`<div class="form-grid v47-upload-form"><div class="field full"><label>Файл</label><input id="v47File" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gpx,.kml" required><small>PDF, Word, Excel, TXT, изображения, GPX/KML · до 25 МБ</small></div><div class="field full"><label>Название</label><input id="v47Title" placeholder="Например, Памятка участника"></div><div class="field"><label>Категория</label><select id="v47Category"><option>Памятки</option><option>Маршрут</option><option>Безопасность</option><option>Организация</option><option>Материалы</option></select></div><div class="field full"><label>Описание</label><textarea id="v47Description" placeholder="Коротко — зачем этот файл участнику"></textarea></div></div>`,async layer=>{
      const file=layer.querySelector('#v47File').files?.[0];if(!file){toast('Выбери файл');return false}const ext=(file.name.split('.').pop()||'').toLowerCase();if(!MIME[ext]){toast('Этот формат пока не поддерживается');return false}if(file.size>MAX){toast('Файл больше 25 МБ');return false}
      const s=session();if(!s?.access_token){toast('Сначала войди в аккаунт организатора');return false}const id=await eid(),path=`${id}/${crypto.randomUUID()}/${clean(file.name)}`;
      const up=await req(`/storage/v1/object/hike-files/${encodeURI(path)}`,{method:'POST',headers:{'Content-Type':MIME[ext],'x-upsert':'false'},body:file});if(!up.ok){const b=await up.json().catch(()=>({}));throw new Error(b.message||'Не удалось загрузить файл')}
      const parts=s.access_token.split('.');let uid=s.user?.id||'';try{if(!uid)uid=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))).sub}catch(e){}
      const meta={event_id:id,title:layer.querySelector('#v47Title').value.trim()||file.name.replace(/\.[^.]+$/,''),description:layer.querySelector('#v47Description').value.trim(),category:layer.querySelector('#v47Category').value,file_name:file.name,mime_type:MIME[ext],size_bytes:file.size,storage_path:path,uploaded_by:uid,is_visible:true};
      const mr=await req('/rest/v1/hike_files',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(meta)});if(!mr.ok){await req(`/storage/v1/object/hike-files/${encodeURI(path)}`,{method:'DELETE'}).catch(()=>{});const b=await mr.json().catch(()=>({}));throw new Error(b.message||'Не удалось сохранить документ')}
      loaded=false;await load(true);toast('Документ загружен');render();return true;
    })
  }
  async function remove(id){const a=window.HikeAccessV47?.access?.();if(!(a?.admin||window.HikeWorkspace?.can?.('documents')))return;const d=window.V47Docs?.get?.().find(x=>String(x.id)===String(id));if(!d?.storage_path||!confirm(`Удалить «${d.title}»?`))return;try{await req(`/storage/v1/object/hike-files/${encodeURI(d.storage_path)}`,{method:'DELETE'});const r=await req(`/rest/v1/hike_files?id=eq.${encodeURIComponent(d.id)}`,{method:'DELETE'});if(!r.ok)throw new Error('Не удалось удалить запись');loaded=false;await load(true);toast('Документ удалён');render()}catch(e){toast(e.message||'Не удалось удалить документ')}}
  window.V47Cloud={load,open,upload,remove};window.addEventListener('load',()=>load());
})();


;/* source: hikes-preview/preview-v48.js */
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


;/* source: hikes-preview/event-v49.js */
/* V58 — event facts are separate from route timing; organizer preview can edit locally. */
(() => {
  'use strict';

  const PROJECT_URL='https://qmnjsvifwcutjailxdug.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_R1n0gwDrWkKn0-D5nuaz3Q_jRjTFwTD';
  const EVENT_SLUG='tominsky-lesopark';
  const AUTH_KEY='rl_hike_auth_v42';
  let eventRow=null;

  const session=()=>{try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch(e){return null}};
  const cloudOrganizer=()=>document.body.classList.contains('hike-organizer')&&!!session()?.access_token;
  const organizerView=()=>cloudOrganizer()||!!window.HikeAccessV47?.access?.().admin;
  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  const plural=(n,one,few,many)=>{const a=Math.abs(Number(n)||0)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
  const durationLabel=row=>{
    const days=Math.max(1,Number(row?.duration_days)||1);
    if(!row?.overnight)return `${days} ${plural(days,'день','дня','дней')}`;
    const nights=Math.max(1,days-1);
    return `${days} ${plural(days,'день','дня','дней')} · ${nights} ${plural(nights,'ночь','ночи','ночей')}`;
  };
  const russianDate=(value,durationDays=1)=>{
    if(!value)return 'Дата уточняется';
    const start=new Date(value);
    if(Number.isNaN(start.getTime()))return 'Дата уточняется';
    const tz='Europe/Moscow';
    const parts=d=>Object.fromEntries(new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:tz}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const a=parts(start),days=Math.max(1,Number(durationDays)||1);
    if(days===1)return `${a.day} ${a.month} ${a.year}`;
    const end=new Date(start.getTime()+(days-1)*86400000),b=parts(end);
    if(a.month===b.month&&a.year===b.year)return `${a.day}–${b.day} ${b.month} ${b.year}`;
    if(a.year===b.year)return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
    return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  };
  const toLocal=value=>{
    if(!value)return '';
    const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
    const pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const meetingParts=raw=>{
    const text=String(raw||'').trim();
    const match=text.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    return match?{time:match[1],place:(match[2]||'').trim()}:{time:'',place:text};
  };
  const statusCode=value=>({
    'Подготовка':'planning','Регистрация открыта':'open','Набор закрыт':'closed','Отменён':'cancelled'
  })[value]||'planning';

  async function request(path,options={}){
    const auth=session();
    const headers={apikey:PUBLISHABLE_KEY,'Content-Type':'application/json',...(options.headers||{})};
    if(auth?.access_token)headers.Authorization=`Bearer ${auth.access_token}`;
    const response=await fetch(`${PROJECT_URL}${path}`,{method:options.method||'GET',headers,body:options.body===undefined?undefined:JSON.stringify(options.body)});
    const body=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(body?.message||body?.error_description||`Ошибка сервера (${response.status})`);
    return body;
  }

  function apply(row){
    if(!row||typeof S==='undefined'||!S?.event)return;
    eventRow=row;
    S.event.date=russianDate(row.starts_at,row.duration_days);
    S.event.meeting=row.meeting_label||'Время и точка уточняются';
    S.event.duration=durationLabel(row);
    S.event.durationDays=Math.max(1,Number(row.duration_days)||1);
    S.event.overnight=!!row.overnight;
    S.event.status=({planning:'Подготовка',open:'Регистрация открыта',closed:'Набор закрыт',cancelled:'Отменён'})[row.status]||'Подготовка';
    if(row.title)S.event.title=row.title;
  }

  function localRow(){
    const parts=meetingParts(S?.event?.meeting);
    const durationDays=Math.max(1,Number(S?.event?.durationDays)||2);
    return {
      slug:EVENT_SLUG,
      title:S?.event?.title||S?.event?.short||'Томинский лесопарк · поход-тренировка',
      starts_at:S?.event?._previewStart?new Date(S.event._previewStart).toISOString():'2026-10-10T07:00:00.000Z',
      meeting_label:[parts.time,parts.place].filter(Boolean).join(' · ')||null,
      duration_days:durationDays,
      overnight:S?.event?.overnight!==false,
      participant_limit:null,
      reply_deadline:null,
      status:statusCode(S?.event?.status)
    };
  }

  async function load(){
    const rows=await request(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(EVENT_SLUG)}&select=*`);
    const row=rows?.[0]||null;if(row)apply(row);return row;
  }

  function focusLater(selector){if(!selector)return;requestAnimationFrame(()=>document.querySelector(selector)?.focus())}

  async function openEditor(focus=''){
    if(!organizerView()){if(typeof toast==='function')toast('Редактирование доступно организатору');return}
    let row=eventRow;
    if(!row)row=await load().catch(()=>null);
    if(!row)row=localRow();
    const meeting=meetingParts(row.meeting_label),start=toLocal(row.starts_at),deadline=toLocal(row.reply_deadline),days=Math.max(1,Number(row.duration_days)||1);
    openModal('Основная информация о походе',`<div class="form-grid hike-settings-form v49-event-form">
      <div class="field full"><label>Название<input id="evTitle" value="${safe(row.title||'')}"></label></div>
      <div class="field"><label>Дата и время старта<input id="evStart" type="datetime-local" value="${safe(start)}"></label></div>
      <div class="field"><label>Время сбора<input id="evMeetTime" type="time" value="${safe(meeting.time)}"></label></div>
      <div class="field full"><label>Место сбора<input id="evMeetPlace" value="${safe(meeting.place)}" placeholder="Например: парковка у входа в лесопарк"></label></div>
      <div class="field"><label>Количество дней<input id="evDays" type="number" min="1" max="30" value="${days}"></label></div>
      <div class="field"><label class="v49-check"><input id="evOvernight" type="checkbox" ${row.overnight?'checked':''}><span>С ночёвкой</span></label></div>
      <div class="field"><label>Дедлайн ответа<input id="evDeadline" type="datetime-local" value="${safe(deadline)}"></label></div>
      <div class="field"><label>Лимит участников<input id="evLimit" type="number" min="1" value="${row.participant_limit||''}"></label></div>
      <div class="field full"><label>Статус<select id="evStatus"><option value="planning" ${row.status==='planning'?'selected':''}>Подготовка</option><option value="open" ${row.status==='open'?'selected':''}>Регистрация открыта</option><option value="closed" ${row.status==='closed'?'selected':''}>Набор закрыт</option><option value="cancelled" ${row.status==='cancelled'?'selected':''}>Отменён</option></select></label></div>
    </div>`,async layer=>{
      const title=layer.querySelector('#evTitle').value.trim();if(!title){toast('Укажи название похода');return false}
      const starts=layer.querySelector('#evStart').value,meetTime=layer.querySelector('#evMeetTime').value,meetPlace=layer.querySelector('#evMeetPlace').value.trim(),deadlineValue=layer.querySelector('#evDeadline').value,limit=layer.querySelector('#evLimit').value,daysValue=Math.max(1,Number(layer.querySelector('#evDays').value)||1),overnight=layer.querySelector('#evOvernight').checked,status=layer.querySelector('#evStatus').value;
      const meetingLabel=[meetTime,meetPlace].filter(Boolean).join(' · ')||null;
      const payload={title,starts_at:starts?new Date(starts).toISOString():null,meeting_label:meetingLabel,duration_days:daysValue,overnight,reply_deadline:deadlineValue?new Date(deadlineValue).toISOString():null,participant_limit:limit?Number(limit):null,status};
      let next={...row,...payload};
      if(cloudOrganizer()){
        const rows=await request(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(EVENT_SLUG)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:payload});
        next=rows?.[0]||next;
        apply(next);if(typeof save==='function')save();render();toast('Параметры похода сохранены для всей команды');return true;
      }
      apply(next);if(typeof save==='function')save();render();toast('Изменения сохранены в режиме проверки. Для общей версии войдите как организатор.');return true;
    });
    focusLater(focus);
  }

  function wireOrganizerControls(){
    if(!organizerView())return;
    const settings=document.getElementById('hikeSettingsButton');if(settings)settings.onclick=()=>openEditor('#evTitle');
    const switcher=document.getElementById('eventSwitcher');if(switcher)switcher.onclick=()=>openEditor('#evTitle');
  }

  window.HikeEventV49={load,openEditor,durationLabel,get event(){return eventRow}};
  const baseRender=render;
  render=function renderV49(){const result=baseRender();if(eventRow)apply(eventRow);wireOrganizerControls();return result};

  const observer=new MutationObserver(()=>wireOrganizerControls());
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  load().then(row=>{if(row)render()}).catch(error=>console.warn('V49 event load failed',error));
})();


;/* source: hikes-preview/participants-v50.js */
/* V50 — Participants page: organizer and participant views from the approved reference. */
(() => {
  'use strict';

  if (!document.querySelector('link[data-participants-v50]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './participants-v50.css?v=50-20260914';
    link.dataset.participantsV50 = '1';
    document.head.appendChild(link);
  }

  const safe = v => typeof esc === 'function' ? esc(v) : String(v ?? '');
  const admin = () => !!window.HikeAccessV47?.access?.().admin || !!window.HikeWorkspace?.can?.('participants');
  const people = () => Array.isArray(S?.participants) ? S.participants : [];
  const me = () => people().find(p => p.id === S.current) || people()[0] || null;
  const counts = () => Object.fromEntries(['yes','maybe','no','pending'].map(k => [k, people().filter(p => p.rsvp === k).length]));
  const limit = () => Number(window.HikeEventV49?.event?.participant_limit || S.event?.participantLimit || 0) || 0;
  const free = () => Math.max(0, limit() - counts().yes);
  const team = () => admin() ? people() : people().filter(p => p.rsvp === 'yes' || p.id === S.current);
  const rolesFor = pid => {
    const rows = window.HikeAccessV47?.roles?.(pid);
    if (Array.isArray(rows) && rows.length) return rows.map(r => r.title).filter(Boolean);
    try { return participantRoles(pid) || []; } catch (e) { return []; }
  };
  const ride = pid => { try { return rideLabel(pid, 'there'); } catch (e) { return 'Не указано'; } };
  const prep = pid => { try { return progress(pid); } catch (e) { return [0,0,0]; } };
  const statusLabel = value => ({ yes:'Подтверждён', maybe:'Возможно', pending:'Ожидает подтверждения', no:'Не участвует' }[value] || value);
  const statusClass = value => value === 'pending' ? 'pending' : value === 'maybe' ? 'maybe' : value === 'no' ? 'no' : '';
  const joinLink = () => `${location.origin}${location.pathname}?join=tominsky-lesopark`;

  function icon(type) {
    const map = {
      people:'<circle cx="8" cy="8" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M3.8 19c.4-3.5 2.1-5.5 4.4-5.5s4 2 4.4 5.5M13.7 14.2c.8-.8 1.7-1.2 2.7-1.2 2 0 3.3 1.4 3.7 3.9"/>',
      check:'<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12 2.5 2.5 5.2-5.4"/>',
      wait:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 1.8"/>',
      help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.3a2.3 2.3 0 1 1 3.2 2.1c-.7.4-1 .8-1 1.7M12 16.7h.01"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
      link:'<path d="M10 13.8 8.1 15.7a3.3 3.3 0 0 1-4.7-4.7l3-3a3.3 3.3 0 0 1 4.6 0M14 10.2l1.9-1.9a3.3 3.3 0 1 1 4.7 4.7l-3 3a3.3 3.3 0 0 1-4.6 0"/>',
      car:'<path d="M5 9.5 7 5h10l2 4.5M4 10h16v7H4z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>',
      role:'<circle cx="8" cy="7" r="2.4"/><path d="M4 17c.4-3.2 2-5 4-5s3.6 1.8 4 5M16.5 12v6M13.5 15h6"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${map[type] || map.people}</svg>`;
  }

  function avatar() {
    return `<span class="p50-avatar"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#dfece3"/><path d="M12 43c1.7-9.5 6.4-14.4 12-14.4S34.4 33.5 36 43" fill="#3e775d"/><circle cx="24" cy="20" r="8" fill="#e7b18c"/><path d="M16.5 20.5c.3-7 3.8-10.5 8.3-10.5 4.4 0 7.1 2.8 7.1 7.1 0 1.1-.2 2.1-.5 3-1.9-3.2-5.3-5-9.2-4.9-2.1 0-4 .5-5.7 1.5z" fill="#284d43"/><path d="M18.4 27.5c1.6 1.2 3.5 1.8 5.6 1.8 2.1 0 4-.6 5.6-1.8" fill="none" stroke="#d49273" stroke-width="1.2" stroke-linecap="round"/><path d="M15.6 36.7c2.3-2.7 5-4 8.4-4 3.5 0 6.3 1.3 8.5 4" fill="none" stroke="#6fa083" stroke-width="2.3" stroke-linecap="round"/></svg></span>`;
  }
  function miniAvatar() { return avatar().replace('p50-avatar','p50-mini-avatar'); }

  function roleAssignments() {
    const rows=[];
    if (Array.isArray(S.rolesV36?.roles) && S.rolesV36.roles.length) {
      S.rolesV36.roles.filter(r=>r.p).forEach(r=>rows.push({title:r.title,pid:r.p}));
    } else if (Array.isArray(S.roles)) {
      S.roles.filter(r=>r.p).forEach(r=>rows.push({title:r.title,pid:r.p}));
    }
    return rows;
  }

  function hero() {
    const action = admin() ? `<div class="p50-hero__actions"><button class="p50-btn primary" data-p50-copy>${icon('link')} Пригласить участников</button></div>` : '';
    return `<section class="p50-hero"><div class="p50-hero__copy"><div class="p50-kicker">${admin()?'Командный штаб':'Команда похода'}</div><h1>Участники</h1><div class="p50-meta"><span>${safe(S.event?.short || 'Томинский лесопарк')}</span><span>${safe(S.event?.duration || 'Длительность уточняется')}</span><span>${safe(S.event?.date || 'Дата уточняется')}</span></div></div>${action}</section>`;
  }

  function organizerSummary() {
    const c=counts(), l=limit(), f=free();
    const stat=(type,label,value,detail,tone='')=>`<div class="p50-stat ${tone}"><div class="p50-stat__icon">${icon(type)}</div><div><small>${label}</small><strong>${value}</strong><em>${detail}</em></div></div>`;
    return `<section class="p50-summary">${stat('people','Участники',c.yes,l?`из ${l} мест`:'подтверждено')}${stat('check','Подтверждены',c.yes,'готовы к походу')}${stat('wait','Ожидают решения',c.pending,'нужно решение',c.pending?'warn':'')}${stat('help','Возможно',c.maybe,'ещё думают',c.maybe?'warn':'')}${stat('plus','Свободных мест',l?f:'—',l?'можно приглашать':'лимит не задан')}</section>`;
  }

  function participantSummary() {
    const c=counts(), l=limit(), f=free();
    const item=(type,label,value,detail)=>`<div class="p50-friendly"><div class="p50-friendly__icon">${icon(type)}</div><div><small>${label}</small><strong>${value}</strong><span class="p50-sub">${detail}</span></div></div>`;
    return `<section class="p50-participant-summary">${item('people','Команда',`Нас уже ${c.yes}`,c.yes===1?'участник подтвердил участие':'участников подтвердили участие')}${item('plus','Набор',l?`${f} свободных мест`:'Регистрация открыта',l?'можно пригласить друзей':'лимит участников не задан')}</section>`;
  }

  function participantRows() {
    const rows=team();
    return rows.map(p=>{
      const pr=prep(p.id), rs=rolesFor(p.id), role=rs.join(' · ')||'Участник', transport=ride(p.id), isMe=p.id===S.current;
      if(admin()) {
        return `<div class="p50-row" data-p50-person data-name="${safe(p.name).toLowerCase()}" data-status="${safe(p.rsvp)}"><div class="p50-person">${avatar()}<div class="p50-person-copy"><div class="p50-name"><span>${safe(p.name)}</span>${isMe?'<span class="p50-me">Вы</span>':''}</div><span class="p50-sub">${safe(rs[0]||'Участник')}</span></div></div><div class="p50-cell"><select class="p50-status-select" data-rsvp="${safe(p.id)}" aria-label="Статус ${safe(p.name)}">${['yes','pending','maybe','no'].map(v=>`<option value="${v}" ${p.rsvp===v?'selected':''}>${statusLabel(v)}</option>`).join('')}</select></div><div class="p50-cell"><strong>${safe(role)}</strong><small>зона ответственности</small></div><div class="p50-cell"><strong>${safe(transport)}</strong><small>туда</small></div><div class="p50-progress-cell"><span class="p50-ring" style="--p:${pr[2]}"></span><div class="p50-cell"><strong>${pr[0]}/${pr[1]}</strong><small>${pr[2]>=100?'готов':'подготовка'}</small></div></div></div>`;
      }
      return `<div class="p50-row ${isMe?'is-me':''}" data-p50-person data-name="${safe(p.name).toLowerCase()}"><div class="p50-person">${avatar()}<div class="p50-person-copy"><div class="p50-name"><span>${safe(p.name)}</span>${isMe?'<span class="p50-me">Это вы</span>':''}</div><span class="p50-sub">${safe(role)}</span></div></div><div class="p50-cell"><strong>${safe(role)}</strong><small>${rs.length?'роль в походе':'без отдельной роли'}</small></div><div class="p50-cell"><strong>${safe(transport)}</strong><small>транспорт туда</small></div><div class="p50-progress-cell"><span class="p50-ring" style="--p:${pr[2]}"></span><div class="p50-cell"><strong>${pr[0]}/${pr[1]}</strong><small>${pr[2]>=100?'готов':'подготовка'}</small></div></div><div class="p50-cell"><strong>${isMe?'Мой профиль':'Участник'}</strong><small>${isMe?'ваши данные':'в составе группы'}</small></div></div>`;
    }).join('') || '<div class="p50-empty">Участники пока не добавлены.</div>';
  }

  function mainCard() {
    const filter=admin()?`<select class="p50-filter" id="p50Filter"><option value="all">Все статусы</option><option value="yes">Подтверждены</option><option value="pending">Ожидают подтверждения</option><option value="maybe">Возможно</option><option value="no">Не участвуют</option></select>`:'';
    const head=admin()?'<span>Участник</span><span>Статус</span><span>Роль</span><span>Транспорт</span><span>Готовность</span>':'<span>Участник</span><span>Роль</span><span>Транспорт</span><span>Готовность</span><span></span>';
    const invite=admin()?`<div class="p50-invite-footer"><div class="p50-invite-box"><strong>Пригласить по ссылке</strong><span>Любой, у кого есть ссылка, сможет войти и подать заявку.</span><button class="p50-btn" data-p50-copy>Скопировать ссылку</button></div><div class="p50-invite-box"><strong>Пригласить по почте</strong><span>Откроется письмо с готовой ссылкой на поход.</span><button class="p50-btn primary" data-p50-mail>${icon('mail')} Почта</button></div></div>`:'';
    return `<section class="p50-card p50-main"><div class="p50-card-head"><div><h2>${admin()?'Список участников':'Наша команда'}</h2><small>${admin()?'Управление составом и готовностью':'Только подтверждённые участники и полезная информация'}</small></div><div class="p50-tools"><input class="p50-search" id="p50Search" type="search" placeholder="Найти участника…" aria-label="Найти участника">${filter}</div></div><div class="p50-table-head">${head}</div><div id="p50Rows">${participantRows()}</div>${invite}</section>`;
  }

  function compositionCard() {
    const c=counts(), l=limit(), total=l||Math.max(c.yes,1), fill=Math.max(0,Math.min(100,Math.round(c.yes/total*100)));
    if(!admin()) return '';
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Состав группы</h3><span>${c.yes}/${l||c.yes}</span></div><div class="p50-compose"><div class="p50-donut" style="--fill:${fill}%"><b>${c.yes}/${l||c.yes}</b></div><div class="p50-legend"><div><span><i class="p50-dot"></i>Подтверждены</span><b>${c.yes}</b></div><div><span><i class="p50-dot warn"></i>Ожидают</span><b>${c.pending+c.maybe}</b></div><div><span><i class="p50-dot muted"></i>Свободно</span><b>${l?free():'—'}</b></div></div></div></section>`;
  }

  function rolesCard() {
    const rows=roleAssignments();
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>${admin()?'Роли в команде':'Кто за что отвечает'}</h3><span>${rows.length}</span></div><div class="p50-role-list">${rows.length?rows.slice(0,7).map(r=>`<div class="p50-role-item"><div><strong>${safe(r.title)}</strong><small>${safe(pn(r.pid))}</small></div><em>${safe(pn(r.pid))}</em></div>`).join(''):'<div class="p50-empty">Роли пока не распределены.</div>'}</div></section>`;
  }

  function requestsCard() {
    if(!admin())return '';
    const rows=people().filter(p=>p.rsvp==='pending');
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Новые заявки</h3><span>${rows.length}</span></div>${rows.length?rows.map(p=>`<div class="p50-request"><div class="p50-request__name">${miniAvatar()}<div><b>${safe(p.name)}</b><small>Хочет присоединиться к походу</small></div></div><div class="p50-request-actions"><button class="p50-btn success" data-p50-status="yes" data-pid="${safe(p.id)}">Принять</button><button class="p50-btn danger" data-p50-status="no" data-pid="${safe(p.id)}">Отклонить</button></div></div>`).join(''):'<div class="p50-empty">Новых заявок нет.</div>'}</section>`;
  }

  function myCard() {
    if(admin())return '';
    const p=me();if(!p)return '';
    const pr=prep(p.id), rs=rolesFor(p.id);
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Моё участие</h3><span>${safe(statusLabel(p.rsvp))}</span></div><div class="p50-my-status"><div class="p50-my-line"><span>Роль</span><strong>${safe(rs.join(' · ')||'Участник')}</strong></div><div class="p50-my-line"><span>Транспорт</span><strong>${safe(ride(p.id))}</strong></div><div class="p50-my-line"><span>Снаряжение</span><strong>${pr[0]}/${pr[1]}</strong></div></div></section>`;
  }

  function inviteCard() {
    if(admin())return '';
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Пригласить друга</h3><span>по ссылке</span></div><div class="p50-invite"><p>Если набор открыт, можно поделиться ссылкой. Новый человек сначала подаст заявку, а организатор её подтвердит.</p><div class="p50-invite-row"><input value="${safe(joinLink())}" readonly><button class="p50-btn" data-p50-copy>Копировать</button></div></div></section>`;
  }

  function participantsV50() {
    document.body.classList.add('p50-active');
    const summary=admin()?organizerSummary():participantSummary();
    return `<div class="p50-shell">${hero()}${summary}<div class="p50-grid">${mainCard()}<aside class="p50-side">${compositionCard()}${rolesCard()}${requestsCard()}${myCard()}${inviteCard()}</aside></div></div>`;
  }

  participantsPage = participantsV50;

  function applyFilter() {
    const q=(document.getElementById('p50Search')?.value||'').trim().toLowerCase();
    const status=document.getElementById('p50Filter')?.value||'all';
    document.querySelectorAll('[data-p50-person]').forEach(row=>{
      const matchName=!q||(row.dataset.name||'').includes(q);
      const matchStatus=status==='all'||row.dataset.status===status;
      row.hidden=!(matchName&&matchStatus);
    });
  }

  function bindV50() {
    if(tab!=='participants')return;
    document.getElementById('p50Search')?.addEventListener('input',applyFilter);
    document.getElementById('p50Filter')?.addEventListener('change',applyFilter);
    document.querySelectorAll('[data-p50-copy]').forEach(button=>button.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(joinLink());toast('Ссылка на поход скопирована')}catch(e){toast('Не удалось скопировать ссылку')}
    }));
    document.querySelectorAll('[data-p50-mail]').forEach(button=>button.addEventListener('click',()=>{
      const subject=encodeURIComponent(`Приглашение: ${S.event?.short||'поход'}`),body=encodeURIComponent(`Присоединяйся к походу:\n${joinLink()}`);location.href=`mailto:?subject=${subject}&body=${body}`;
    }));
    document.querySelectorAll('[data-p50-status]').forEach(button=>button.addEventListener('click',()=>{
      const pid=button.dataset.pid,value=button.dataset.p50Status,select=document.querySelector(`select[data-rsvp="${CSS.escape(pid)}"]`);
      if(select){select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));return}
      const p=people().find(x=>x.id===pid);if(p){p.rsvp=value;save();render()}
    }));
  }

  const baseRender=render;
  render=function renderV50(){
    document.body.classList.toggle('p50-active',tab==='participants');
    const result=baseRender();
    if(tab==='participants')bindV50();
    const build=document.querySelector('.build-label');if(build&&tab==='participants')build.textContent='V50 · участники и роли';
    return result;
  };

  if(tab==='participants')render();
})();


;/* source: hikes-preview/preview-v51.js */
/* V55 — prominent organizer preview controls on every workspace page. */
(() => {
  'use strict';
  const people=()=>Array.isArray(S?.participants)?S.participants:[];
  const rolesFor=pid=>window.HikeAccessV47?.roles?.(pid)||[];
  const actualOrganizer=()=>document.body.classList.contains('hike-organizer')||S?.current==='p1';
  const nonLead=()=>people().filter(p=>!rolesFor(p.id).some(r=>r.id==='lead'||r.title==='Руководитель'));
  const ordinary=()=>nonLead().find(p=>rolesFor(p.id).filter(r=>r.id!=='lead').length===0)||nonLead()[0]||null;
  const responsible=()=>nonLead().find(p=>rolesFor(p.id).some(r=>r.id!=='lead'))||null;
  const roleLabel=pid=>{const rs=rolesFor(pid).filter(r=>r.id!=='lead');return rs.length?rs.map(r=>r.title).join(' · '):'Обычный участник'};
  const person=pid=>people().find(p=>p.id===pid)||null;
  const preview=()=>window.HikePreviewV48||null;

  function patchPreviewAccess(){
    const api=preview();if(!api||api.__v51Patched)return;
    try{Object.defineProperty(api,'active',{configurable:true,get(){return actualOrganizer()&&api.mode!=='organizer'&&!!api.pid}});api.__v51Patched=true}catch(e){}
  }
  function currentLabel(){
    const api=preview();if(!api||api.mode==='organizer')return {title:'Организатор',detail:'Редактирование доступно'};
    const p=person(api.pid);return {title:p?`${p.name} · ${roleLabel(p.id)}`:'Участник',detail:'Предпросмотр · редактирование отключено'};
  }
  function toolbar(){
    document.getElementById('hikeRolePreviewV51')?.remove();
    document.body.classList.toggle('v51-role-preview',actualOrganizer());
    if(!actualOrganizer())return;
    patchPreviewAccess();
    const api=preview();if(!api)return;
    const topbar=document.querySelector('.workspace .topbar');if(!topbar)return;
    const ord=ordinary(),resp=responsible(),state=currentLabel();
    const specific=nonLead().map(p=>`<option value="person:${esc(p.id)}" ${api.mode===`person:${p.id}`?'selected':''}>${esc(p.name)} — ${esc(roleLabel(p.id))}</option>`).join('');
    const active=api.mode==='organizer'?'organizer':api.mode==='participant'?'participant':api.mode==='responsible'?'responsible':'person';
    topbar.insertAdjacentHTML('afterend',`<section class="v51-role-toolbar ${api.active?'is-preview':''}" id="hikeRolePreviewV51" aria-label="Проверка интерфейса по ролям"><div class="v51-role-toolbar__state"><span class="v51-role-toolbar__eyebrow">Проверка интерфейса</span><strong>${esc(state.title)}${api.active?'<span class="v51-role-toolbar__badge">предпросмотр</span>':''}</strong><small>${esc(state.detail)}</small></div><div class="v51-role-toolbar__modes"><button type="button" data-v51-mode="organizer" class="${active==='organizer'?'active':''}">Организатор</button><button type="button" data-v51-mode="participant" class="${active==='participant'?'active':''}" ${ord?'':'disabled'}>Обычный участник</button><button type="button" data-v51-mode="responsible" class="${active==='responsible'?'active':''}" ${resp?'':'disabled'}>Ответственный</button></div><label class="v51-role-toolbar__profile"><span>Конкретный профиль</span><select id="hikeRolePreviewProfile"><option value="">Выбрать участника…</option>${specific}</select></label></section>`);
    document.querySelectorAll('[data-v51-mode]').forEach(btn=>btn.addEventListener('click',()=>api.set(btn.dataset.v51Mode)));
    document.getElementById('hikeRolePreviewProfile')?.addEventListener('change',e=>{if(e.target.value)api.set(e.target.value)});
  }

  function directPreviewControl(event){
    const api=preview();if(!api)return;
    const button=event.target?.closest?.('[data-v51-mode]');
    if(button){
      event.preventDefault();
      event.stopImmediatePropagation();
      api.set(button.dataset.v51Mode||'organizer');
      return;
    }
    if(event.type==='change'&&event.target?.id==='hikeRolePreviewProfile'&&event.target.value){
      event.preventDefault();
      event.stopImmediatePropagation();
      api.set(event.target.value);
    }
  }

  function boot(){
    patchPreviewAccess();
    if(typeof render==='function'&&!render.__v51Wrapped){const base=render;const wrapped=function(){const result=base.apply(this,arguments);queueMicrotask(toolbar);return result};wrapped.__v51Wrapped=true;render=wrapped}
    toolbar();
    const observer=new MutationObserver(()=>toolbar());observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  }
  window.addEventListener('click',directPreviewControl,true);
  window.addEventListener('change',directPreviewControl,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.HikeRolePreviewV51={refresh:toolbar};
})();


;/* source: hikes-preview/avatars-v56.js */
/* V60 — avatar picker with a neutral default for new participants. */
(()=>{
'use strict';
const R='60-20260914g';
const A=[
{id:'default',label:'Стандарт',src:`./assets/avatars-v59/avatar-default.svg?r=${R}`},
{id:'field-cap',label:'Аватар 1',src:`./assets/avatars-v59/avatar-01.svg?r=${R}`},
{id:'watch-cap',label:'Аватар 2',src:`./assets/avatars-v59/avatar-02.svg?r=${R}`},
{id:'boonie',label:'Аватар 3',src:`./assets/avatars-v59/avatar-03.svg?r=${R}`},
{id:'headset',label:'Аватар 4',src:`./assets/avatars-v59/avatar-04.svg?r=${R}`},
{id:'hood',label:'Аватар 5',src:`./assets/avatars-v59/avatar-05.svg?r=${R}`},
{id:'avatar-06',label:'Аватар 6',src:`./assets/avatars-v59/avatar-06.svg?r=${R}`},
{id:'avatar-07',label:'Аватар 7',src:`./assets/avatars-v59/avatar-07.svg?r=${R}`},
{id:'avatar-08',label:'Аватар 8',src:`./assets/avatars-v59/avatar-08.svg?r=${R}`},
{id:'avatar-09',label:'Аватар 9',src:`./assets/avatars-v59/avatar-09.svg?r=${R}`},
{id:'avatar-10',label:'Аватар 10',src:`./assets/avatars-v59/avatar-10.svg?r=${R}`}
];
const M=Object.fromEntries(A.map(x=>[x.id,x])),D=A[0];
const people=()=>Array.isArray(S?.participants)?S.participants:[];
const current=()=>people().find(p=>p.id===S.current)||people()[0]||null;
const admin=()=>!!window.HikeAccessV47?.access?.().admin||!!window.HikeWorkspace?.can?.('participants');
const team=()=>admin()?people():people().filter(p=>p.rsvp==='yes'||p.id===S.current);
const html=p=>`<img class="v56-avatar-img" src="${M[p?.avatarKey]?.src||D.src}" alt="">`;
function defaults(){let c=false;people().forEach(p=>{if(!M[p.avatarKey]){p.avatarKey=D.id;c=true}});if(c&&typeof save==='function')save()}
function fill(el,p){if(el&&p)el.innerHTML=html(p)}
function participants(){if(typeof tab!=='undefined'&&tab!=='participants')return;const list=team();document.querySelectorAll('.p50-row[data-p50-person]').forEach((row,i)=>fill(row.querySelector('.p50-avatar'),list[i]));document.querySelectorAll('.p50-request').forEach(card=>fill(card.querySelector('.p50-mini-avatar'),people().find(p=>card.textContent.includes(p.name))))}
function picker(p){return `<section class="v38-profile-card v56-avatar-card" id="v56AvatarCard"><div class="v38-profile-card-head"><div><h2>Аватар</h2><p>Выберите иконку, которая будет показываться в профиле и списке участников.</p></div></div><div class="v38-profile-card-body"><div class="v56-avatar-picker">${A.map(a=>`<button type="button" class="v56-avatar-option ${p.avatarKey===a.id?'is-selected':''}" data-v56-avatar="${a.id}" aria-label="${a.label}"><img src="${a.src}" alt=""><span>${a.label}</span></button>`).join('')}</div><p class="v56-avatar-note">Новый участник получает стандартную иконку. При желании её можно заменить на любой из 10 вариантов.</p></div></section>`}
function profile(){const p=current();if(!p)return;fill(document.querySelector('.v38-profile-summary .avatar'),p);fill(document.querySelector('.v38-profile-nav .avatar'),p);fill(document.querySelector('.v38-profile-top .avatar'),p);fill(document.querySelector('.ov44-person .avatar'),p);if(typeof tab!=='undefined'&&tab==='profile'&&!document.getElementById('v56AvatarCard')){const s=document.querySelector('.v38-profile-stack'),c=s?.querySelector('.v38-profile-card');if(s&&c)c.insertAdjacentHTML('afterend',picker(p))}}
function decorate(){defaults();participants();profile()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-v56-avatar]');if(!b)return;const p=current(),k=b.dataset.v56Avatar;if(!p||!M[k])return;p.avatarKey=k;if(typeof save==='function')save();if(typeof toast==='function')toast('Аватар выбран');if(typeof render==='function')render()});
defaults();
if(typeof render==='function'&&!render.__v56AvatarWrapped){const base=render;const wrapped=function(){const r=base.apply(this,arguments);queueMicrotask(decorate);return r};wrapped.__v56AvatarWrapped=true;render=wrapped}
queueMicrotask(decorate);
window.HikeAvatarsV56={avatars:A,decorate,src:k=>M[k]?.src||D.src,defaultKey:D.id};
})();

;/* source: hikes-preview/overview-v57.js */
/* V58 — reuse the existing Overview facts row; no duplicate cards. */
(() => {
  'use strict';

  const plural=(n,one,few,many)=>{const a=Math.abs(Number(n)||0)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
  const organizerView=()=>document.body.classList.contains('hike-organizer')||!!window.HikeAccessV47?.access?.().admin;
  const durationFromRow=row=>{
    const days=Math.max(1,Number(row?.duration_days)||1);
    const overnight=!!row?.overnight;
    if(!overnight)return `${days} ${plural(days,'день','дня','дней')}`;
    const nights=Math.max(1,days-1);
    return `${days} ${plural(days,'день','дня','дней')} · ${nights} ${plural(nights,'ночь','ночи','ночей')}`;
  };
  const meetingParts=raw=>{
    const text=String(raw||'').trim();
    if(!text||text==='Время и точка уточняются')return {time:'',place:''};
    const match=text.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    return match?{time:match[1],place:(match[2]||'').trim()}:{time:'',place:text};
  };
  const eventDuration=()=>{
    const row=window.HikeEventV49?.event;
    if(row)return durationFromRow(row);
    const raw=String(S?.event?.duration||'').trim();
    if(raw&&!/^\d+\s*ч(?:\s|$)/i.test(raw)&&raw!=='1 день')return raw;
    return '2 дня · 1 ночь';
  };
  const editIcon=()=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5 8 18.8 18.2 8.6a2 2 0 0 0-2.8-2.8L5.2 16zM13.8 7.4l2.8 2.8"/></svg>';

  function normalizeEventDuration(){
    if(!S?.event)return;
    const raw=String(S.event.duration||'').trim();
    const row=window.HikeEventV49?.event;
    if(row){
      S.event.duration=durationFromRow(row);
      S.event.durationDays=Math.max(1,Number(row.duration_days)||1);
      S.event.overnight=!!row.overnight;
      return;
    }
    if(!raw||/^\d+\s*ч(?:\s|$)/i.test(raw)||raw==='1 день'){
      S.event.duration='2 дня · 1 ночь';
      S.event.durationDays=2;
      S.event.overnight=true;
    }
  }

  function setFact(card,value,detail,focus,editable){
    if(!card)return;
    const strong=card.querySelector('strong');if(strong){strong.textContent=value;strong.title=value}
    let em=card.querySelector('em');
    if(detail){
      if(!em){em=document.createElement('em');card.querySelector('div:nth-child(2)')?.appendChild(em)}
      if(em){em.textContent=detail;em.title=detail}
    }else em?.remove();
    card.querySelectorAll('.ov48-fact-edit,.ov57-fact-edit').forEach(node=>node.remove());
    card.classList.toggle('ov57-is-editable',editable);
    if(!editable)return;
    const button=document.createElement('button');
    button.type='button';button.className='ov57-fact-edit';button.dataset.v57Edit=focus;button.setAttribute('aria-label','Редактировать');button.innerHTML=editIcon();
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();window.HikeEventV49?.openEditor?.(focus)});
    card.appendChild(button);
  }

  function decorate(){
    normalizeEventDuration();
    if(typeof tab!=='undefined'&&tab!=='overview')return;
    const shell=document.querySelector('.ov44-shell');if(!shell)return;
    shell.querySelectorAll('.ov57-event-facts').forEach(node=>node.remove());
    const cards=[...shell.querySelectorAll('.ov48-event-facts .ov48-fact')];if(cards.length<4)return;
    const meeting=meetingParts(S?.event?.meeting),editable=organizerView();
    setFact(cards[0],S?.event?.date||'Дата уточняется','Дата начала похода','#evStart',editable);
    setFact(cards[1],meeting.place||'Место уточняется','Точка общего сбора','#evMeetPlace',editable);
    setFact(cards[2],meeting.time||'Время уточняется','До выхода на маршрут','#evMeetTime',editable);
    setFact(cards[3],eventDuration(),'Длительность всего похода','#evDays',editable);
  }

  const beforeRender=render;
  render=function renderV58(){const out=beforeRender();requestAnimationFrame(decorate);return out};
  const beforeBind=bind;
  bind=function bindV58(){beforeBind();decorate()};
  window.HikeOverviewV57={decorate,eventDuration};
  queueMicrotask(decorate);
})();


;/* source: hikes-preview/workspace.js */
/* Shared workspace interactions. Keeps the existing event and module state. */
(() => {
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));
const rows=()=>S.rolesV36?.roles||[];
const actor=()=>window.HikePreviewV48?.active?window.HikePreviewV48.pid:S.current;
const has=id=>rows().some(r=>r.id===id&&r.p===actor());
function can(area){
  if(window.HikePreviewV48?.active)return false;
  if(window.HikeSession?.signed&&!window.HikeSession.approved)return false;
  if(window.HikeSession?.organizer||(!window.HikeSession?.signed&&S.current==='p1'))return true;
  const modules=['participants','gear','food','transport','documents','route','plan'];
  const pid=actor();
  const infer=r=>{
    if(Array.isArray(r.responsibilities))return r.responsibilities.filter(x=>modules.includes(x));
    const t=String(r.title||'').toLowerCase();
    if(t.includes('руковод')||t.includes('организ'))return modules;
    if(t.includes('навиг')||t.includes('маршрут')||t.includes('ориент'))return['route','plan'];
    if(t.includes('снаряж')||t.includes('завхоз')||t.includes('экип'))return['gear','food','transport'];
    if(t.includes('транспорт')||t.includes('водител'))return['transport'];
    if(t.includes('питан')||t.includes('еда')||t.includes('вод'))return['food'];
    if(t.includes('документ')||t.includes('файл'))return['documents'];
    return[];
  };
  const moduleCan=module=> (S.roles||[]).some(r=>r.p===pid&&r.critical!==false&&infer(r).includes(module));
  if(modules.includes(area))return moduleCan(area);
  if(area==='roles'&&typeof tab!=='undefined'&&tab==='transport')return moduleCan('transport');
  if(area==='roles')return has('lead');
  return false;
}
const canAct=()=>!window.HikePreviewV48?.active&&(!window.HikeSession?.signed||window.HikeSession.approved);
const avatar=pid=>{const p=S.participants.find(p=>p.id===pid);return '<span class="avatar">'+esc(initials(p?.callsign||p?.name||'?'))+'</span>'};
function rolesPage(){
  const all=rows(),main=all.filter(r=>['lead','nav','logistics'].includes(r.id)),other=all.filter(r=>!main.includes(r)),filled=main.filter(r=>r.p).length;
  const card=r=>{
    const candidates=S.rolesV36.candidates?.[r.id]||[],mine=candidates.includes(actor()),owner=S.participants.find(p=>p.id===r.p);
    return '<article class="ws-role '+(!r.p?'is-open':'')+'"><div class="ws-role-copy"><span class="ws-caption">'+(main.includes(r)?'Управление походом':'Задачи на маршруте')+'</span><h3>'+esc(r.title)+'</h3><p>'+esc(r.desc||'')+'</p><span class="ws-access">'+(r.id==='lead'?'Все разделы':r.id==='nav'?'Редактирование маршрута и плана':r.id==='logistics'?'Снаряжение, меню, закупки и вода':r.id==='medic'?'Состав общей аптечки':r.manageFood?'Редактирование меню, закупок и воды':'Без прав управления сайтом')+'</span></div><div class="ws-role-owner">'+(owner?avatar(owner.id)+'<span><b>'+esc(pn(owner.id))+'</b><small>Назначен</small></span>':'<span class="ws-open">Ответственный не назначен</span>')+'</div><div class="ws-role-actions">'+(can('roles')?'<label>Назначить<select data-ws-assign="'+esc(r.id)+'"><option value="">Не назначено</option>'+S.participants.filter(p=>p.rsvp!=='no').map(p=>'<option value="'+esc(p.id)+'" '+(r.p===p.id?'selected':'')+'>'+esc(pn(p.id))+(candidates.includes(p.id)?' · кандидат':'')+'</option>').join('')+'</select></label>'+(!main.includes(r)?'<button class="btn alt sm" data-ws-edit-role="'+esc(r.id)+'">Настроить роль</button>':''):'')+(r.p!==actor()?'<button class="btn alt sm" data-ws-candidate="'+esc(r.id)+'">'+(mine?'Отозвать кандидатуру':'Предложить себя')+'</button>':'')+'</div>'+(candidates.length?'<div class="ws-candidates"><small>Кандидаты</small>'+candidates.map(pid=>'<span>'+esc(pn(pid))+'</span>').join('')+'</div>':'')+'</article>';
  };
  return pageHead('Команда','Роли','Ответственные управляют своими разделами. Участники предлагают кандидатуру, руководитель назначает.',can('roles')?'<button class="btn sand" id="wsAddRole">+ Роль</button>':'')+
    '<div class="ws-summary"><div><small>Основные роли</small><strong>'+filled+' / '+main.length+'</strong><span>назначено</span></div><div><small>Требуют назначения</small><strong>'+(main.length-filled)+'</strong><span>ключевых зон ответственности</span></div><div><small>Кандидатуры</small><strong>'+Object.values(S.rolesV36.candidates||{}).reduce((n,a)=>n+a.length,0)+'</strong><span>ожидают выбора руководителя</span></div></div><section class="ws-section"><h2>Управление походом</h2><div class="ws-role-list">'+main.map(card).join('')+'</div></section><section class="ws-section"><h2>Задачи команды</h2><div class="ws-role-list">'+other.map(card).join('')+'</div></section>';
}
function roleModal(id){
  if(!can('roles'))return;const r=rows().find(r=>r.id===id);
  openModal(r?'Настроить роль':'Добавить роль','<div class="form-grid"><label class="field full">Название<input id="wsRoleTitle" maxlength="80" value="'+esc(r?.title||'')+'"></label><label class="field full">Задачи<textarea id="wsRoleDesc">'+esc(r?.desc||'')+'</textarea></label><label class="field full"><span><input id="wsRoleFood" type="checkbox" '+(r?.manageFood?'checked':'')+'> Поручить меню, закупки и воду</span><small>Остальные права управления не выдаются.</small></label></div>',layer=>{
    if(!can('roles'))return false;const title=layer.querySelector('#wsRoleTitle').value.trim();if(!title){toast('Укажите название');return false}
    const patch={title,desc:layer.querySelector('#wsRoleDesc').value.trim(),manageFood:layer.querySelector('#wsRoleFood').checked};
    if(r)Object.assign(r,patch);else rows().push({id:'task_'+crypto.randomUUID(),p:'',...patch});
    save();render();return true;
  });
}
function take(id){
  if(!canAct())return;const x=S.shared.find(g=>g.id===id);if(!x)return;
  const meta=S.gearV30?.meta?.[id]||{},mine=+(x.a||[]).find(a=>a[0]===S.current)?.[1]||0,other=(x.a||[]).filter(a=>a[0]!==S.current).reduce((n,a)=>n+(+a[1]||0),0),max=Math.max(0,+x.need-other);
  openModal('Я возьму: '+esc(x.title),'<p>Нужно '+esc(x.need)+' '+esc(meta.unit||'шт.')+' · другие участники берут '+other+'</p><label class="field">Моё количество<input id="wsTakeQty" type="number" min="0" max="'+Math.max(max,mine)+'" step="0.1" value="'+mine+'"></label><p>0 — снять обязательство. Указанное количество сразу подтверждается.</p>',layer=>{
    const q=Number(layer.querySelector('#wsTakeQty').value),remaining=Math.max(0,+x.need-(x.a||[]).filter(a=>a[0]!==S.current).reduce((n,a)=>n+(+a[1]||0),0));
    if(!Number.isFinite(q)||q<0||(q>remaining&&q>mine)){toast('Проверьте количество: потребность уже частично закрыта');return false}
    x.a=(x.a||[]).filter(a=>a[0]!==S.current);x.confirmed=(x.confirmed||[]).filter(p=>p!==S.current);
    if(q){x.a.push([S.current,q]);x.confirmed.push(S.current)}save();render();return true;
  });
}
function kit(id){
  const meta=S.gearV30?.meta?.[id];if(!meta)return;
  const editable=can('gear')||(meta.cat==='health'&&can('medical'));
  openModal('Состав: '+esc(S.shared.find(g=>g.id===id)?.title||'комплект'),'<label class="field">По одному предмету на строке<textarea id="wsKit" rows="12" '+(editable?'':'readonly')+'>'+esc((meta.kit||[]).map(x=>x.title).join('\n'))+'</textarea></label>',layer=>{
    if(!editable)return true;
    const titles=layer.querySelector('#wsKit').value.split('\n').map(s=>s.trim()).filter(Boolean);
    meta.kit=titles.map(title=>(meta.kit||[]).find(x=>x.title===title)||{id:'kit_'+crypto.randomUUID(),title});meta.type='kit';save();render();return true;
  });
}
function syncReturn(){
  const t=S.transportV24;if(!t)return;t.returnOverrides||={};
  for(const src of t.rides.there){
    if(t.returnOverrides[src.driver])continue;
    let back=t.rides.back.find(r=>r.linkedTo===src.id);
    if(!back&&(t.rides.back.some(r=>r.driver===src.driver)||(!can('roles')&&src.driver!==S.current)))continue;
    if(!back){back={id:'return_'+src.id,linkedTo:src.id,driver:src.driver,passengers:[],requests:[],stops:[]};t.rides.back.push(back)}
    Object.assign(back,{seats:src.seats,vehicle:src.vehicle,color:src.color,plate:src.plate,comment:src.comment});
    back.stops=[...(src.stops||[])].reverse().map(s=>({...s,id:'return_'+s.id,time:''}));
    const eligible=(src.requests||[]).filter(q=>q.status==='approved'&&!t.returnOverrides[q.pid]&&(!t.choices.back[q.pid]||['unset'].includes(t.choices.back[q.pid].mode)||t.choices.back[q.pid].rideId===back.id));
    const old=back.requests||[];back.requests=eligible.map(q=>({id:'return_'+q.id,pid:q.pid,pickupId:'return_'+q.pickupId,status:'approved',createdAt:q.createdAt}));back.passengers=eligible.map(q=>q.pid);
    old.filter(q=>!back.passengers.includes(q.pid)).forEach(q=>{if(t.choices.back[q.pid]?.rideId===back.id)t.choices.back[q.pid]={mode:'unset'}});
    t.choices.back[src.driver]={mode:'driver',rideId:back.id};
    back.requests.forEach(q=>t.choices.back[q.pid]={mode:'ride',rideId:back.id,requestId:q.id,pickupId:q.pickupId});
  }
  const orphan=t.rides.back.filter(r=>r.linkedTo&&!t.rides.there.some(s=>s.id===r.linkedTo));
  orphan.forEach(r=>Object.keys(t.choices.back).forEach(pid=>{if(t.choices.back[pid].rideId===r.id)t.choices.back[pid]={mode:'unset'}}));
  t.rides.back=t.rides.back.filter(r=>!orphan.includes(r));
  Object.entries(t.choices.there).forEach(([pid,c])=>{if((pid===S.current||can('roles'))&&!t.returnOverrides[pid]&&(!t.choices.back[pid]||['self','unset'].includes(t.choices.back[pid].mode)))t.choices.back[pid]={mode:c.mode==='self'?'self':'unset'}});
}
function bindWorkspace(){
  document.querySelectorAll('[data-ws-assign]').forEach(el=>el.onchange=()=>{
    if(!can('roles'))return;const r=rows().find(r=>r.id===el.dataset.wsAssign);if(!r)return;r.p=el.value;S.rolesV36.candidates[r.id]=(S.rolesV36.candidates[r.id]||[]).filter(p=>p!==r.p);save();render();
  });
  document.querySelectorAll('[data-ws-candidate]').forEach(el=>el.onclick=()=>{
    if(!canAct())return;const id=el.dataset.wsCandidate,a=S.rolesV36.candidates[id]||[];
    S.rolesV36.candidates[id]=a.includes(S.current)?a.filter(p=>p!==S.current):[...a,S.current];save();render();
  });
  document.getElementById('wsAddRole')?.addEventListener('click',()=>roleModal());
  document.querySelectorAll('[data-ws-edit-role]').forEach(el=>el.onclick=()=>roleModal(el.dataset.wsEditRole));
  document.querySelectorAll('[data-workspace-take]').forEach(el=>el.onclick=()=>take(el.dataset.workspaceTake));
  document.querySelectorAll('[data-workspace-kit]').forEach(el=>el.onclick=()=>kit(el.dataset.workspaceKit));
  if(tab==='food'&&!can('food'))document.querySelectorAll('[data-v36-water],[data-v36-water-person],[data-v36-product-buyer],[data-v36-product-purchased],#v36FoodReserve,#v36AutoWater').forEach(el=>{el.disabled=true;el.title='Изменяет ответственный за питание'});
  if(tab==='roles'&&!canAct())document.querySelectorAll('[data-ws-candidate]').forEach(el=>el.disabled=true);
  if(tab==='route'&&!can('route')){editorModeV13=false;document.querySelectorAll('#toggleEditorV13,#toggleEditorV14,#beginEditV15,#openRouteEditorV13,#resetRouteV13,#importProjectV17').forEach(el=>{el.disabled=true;el.hidden=true})}
  if(tab==='plan'&&!can('plan'))document.querySelectorAll('#addTimeline,[data-edit-time],[data-del-time],#v41Sync,#addBreakGeneralV23,#routeStartV23,#reserveV23,[data-profile-v23],[data-speed-v23],[data-add-break-v23],[data-break-title-v23],[data-break-min-v23],[data-break-up-v23],[data-break-down-v23],[data-break-del-v23]').forEach(el=>{el.disabled=true});
  if(tab==='plan'&&!can('plan'))document.querySelectorAll('[data-break-id-v23]').forEach(el=>el.draggable=false);
  document.querySelector('.build-label')?.replaceChildren('V61 · поход');
}
const originalStudio=openStudioV21;
openStudioV21=function(){
  if(can('route'))return originalStudio();
  const host=document.getElementById('routeMapFinal')?.parentElement;
  if(host?.requestFullscreen)host.requestFullscreen().catch(()=>toast('Полноэкранный просмотр недоступен'));else toast('Используйте масштабирование карты');
};
const originalBeginEdit=beginEditV15;
beginEditV15=function(){if(!can('route'))return toast('Маршрут изменяет руководитель или навигатор');return originalBeginEdit()};
const oldTransportSave=transportSaveV24;
transportSaveV24=function(msg){
  if(dir==='back'){const t=S.transportV24;t.returnOverrides||={};t.returnOverrides[S.current]=true;const r=t.rides.back.find(r=>r.driver===S.current);if(r)delete r.linkedTo}
  syncReturn();return oldTransportSave(msg);
};
window.HikeWorkspace={can,canAct,rolesPage,syncReturn,bind:bindWorkspace};
const oldRender=render;
render=function(){if(!can('route'))editorModeV13=false;const result=oldRender();bindWorkspace();return result};
render();
})();
;window.V47Cloud?.load?.();render();
