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
  current:'p1',
  event:{title:'Лыткарино · разведывательный поход',short:'Лыткарино',type:'Поход-тренировка',status:'Подготовка',date:'Дата уточняется',meeting:'07:30 · точка уточняется',start:'09:15',distance:'Уточняется',duration:'1 день',replyDeadline:'18 сентября'},
  participants:[['p1','Сергей','yes'],['p2','Иван','yes'],['p3','Алексей','yes'],['p4','Максим','maybe'],['p5','Андрей','yes'],['p6','Николай','pending']].map(x=>({id:x[0],name:x[1],rsvp:x[2]})),
  roles:[['Руководитель','p1',1],['Навигатор','p2',1],['Замыкающий','',1],['Первая помощь','p3',1],['Транспорт','p5',0],['Связь','p2',0],['Снаряжение','',0],['Питание','p4',0]].map((x,i)=>({id:'r'+i,title:x[0],p:x[1],critical:!!x[2],desc:roleDescriptions[x[0]]})),
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
  checks:{p1:['pg0','pg1','pg2','pg3','pg4','pg5','pg6','pg7'],p2:['pg0','pg1','pg3','pg4','pg7'],p3:['pg0','pg1','pg5','pg7'],p4:['pg0','pg7'],p5:['pg0','pg1','pg2','pg3','pg6','pg7'],p6:[]},
  shared:[
    {id:'g0',title:'Групповая аптечка',need:1,a:[['p3',1]],confirmed:['p3']},
    {id:'g1',title:'Компасы',need:3,a:[['p1',1],['p2',1]],confirmed:['p2']},
    {id:'g2',title:'Бумажный атлас',need:1,a:[['p2',1]],confirmed:[]},
    {id:'g3',title:'Power bank общий',need:1,a:[['p5',1]],confirmed:['p5']},
    {id:'g4',title:'Ремнабор',need:1,a:[],confirmed:[]},
    {id:'g5',title:'Тент / дождевое укрытие',need:1,a:[['p1',1]],confirmed:['p1']}
  ],
  cars:{
    there:[
      {id:'c1',driver:'p1',name:'Машина Сергея',cap:3,pass:['p2','p3'],time:'07:40',from:'Точка A · уточняется'},
      {id:'c2',driver:'p5',name:'Машина Андрея',cap:3,pass:['p4'],time:'07:50',from:'Точка B · уточняется'}
    ],
    back:[
      {id:'b1',driver:'p1',name:'Машина Сергея',cap:3,pass:['p2'],time:'17:30',from:'Финиш маршрута'},
      {id:'b2',driver:'p5',name:'Машина Андрея',cap:3,pass:[],time:'17:40',from:'Финиш маршрута'}
    ]
  },
  rides:{there:{p1:'own',p2:'c1',p3:'c1',p4:'c2',p5:'own',p6:'unset'},back:{p1:'own',p2:'b1',p3:'unset',p4:'unset',p5:'own',p6:'unset'}},
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
    {id:'t1',time:'07:30',title:'Общий сбор',owner:'p1',route:'',note:'Проверка состава и общей готовности.'},
    {id:'t2',time:'07:50',title:'Выезд',owner:'p5',route:'',note:'Распределение по машинам.'},
    {id:'t3',time:'09:15',title:'Старт маршрута',owner:'p2',route:'s1',note:'Сверка направления и состава.'},
    {id:'t4',time:'10:30',title:'Контрольная точка 1',owner:'p2',route:'s3',note:'Ориентирование по карте.'},
    {id:'t5',time:'12:30',title:'Привал',owner:'p4',route:'s5',note:'Вода, перекус, контроль состояния.'},
    {id:'t6',time:'15:30',title:'Завершение маршрута',owner:'p1',route:'s6',note:'Сбор группы.'},
    {id:'t7',time:'17:30',title:'Отъезд',owner:'p5',route:'',note:'Распределение по машинам обратно.'}
  ]
});
let S;
function storageGet(){try{return localStorage.getItem(STORAGE)}catch(e){return null}}
function storageSet(v){try{localStorage.setItem(STORAGE,v)}catch(e){}}
try{S=JSON.parse(storageGet())||seed()}catch(e){S=seed()}
normalize();
let tab='overview',gearMode='personal',dir='there';
function normalize(){
  const fresh=seed();
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
  S.current=S.current||'p1';
}
const save=()=>storageSet(JSON.stringify(S));
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
  const me=S.participants.find(p=>p.id===S.current),pr=progress(S.current),myRoles=participantRoles(S.current),myShared=participantShared(S.current),att=attentionGroups();
  const myTasks=[];
  if(me.rsvp==='pending')myTasks.push(['warn','Подтвердить участие']);
  if(['unset','need'].includes(S.rides.there[S.current]))myTasks.push(['warn','Выбрать транспорт туда']);
  if(['unset','need'].includes(S.rides.back[S.current]))myTasks.push(['warn','Выбрать транспорт обратно']);
  if(pr[0]<pr[1])myTasks.push(['warn',`Закрыть личный чек-лист (${pr[0]}/${pr[1]})`]);
  const unconfirmed=S.shared.filter(g=>g.a.some(a=>a[0]===S.current)&&!g.confirmed.includes(S.current));
  if(unconfirmed.length)myTasks.push(['warn',`Подтвердить групповое имущество: ${unconfirmed.map(g=>g.title).join(', ')}`]);
  if(!myTasks.length)myTasks.push(['ok','Критичных действий на сейчас нет']);
  const attentionHtml=(kind,label,items)=>items.length?`<div class="attention-group"><div class="attention-group__head"><strong>${label}</strong><span class="attention-count">${items.length}</span></div>${items.map(x=>`<div class="attention-item"><i class="attention-bar ${kind}"></i><div><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></div><button class="btn alt sm" data-jump="${x.tab}">Открыть</button></div>`).join('')}</div>`:'';
  return `${pageHead('Командный штаб',S.event.short,'Подготовка похода в одном месте: люди, роли, транспорт, снаряжение, маршрут и план дня.')}<section class="event-hero"><div class="hero-copy"><div><div class="hero-labels">${tag(S.event.type,'sand')}${tag(S.event.status,'ok')}</div><h2 class="hero-title">${esc(S.event.short)}</h2><p class="hero-lead">Разведывательный поход с проверкой ориентирования, связи и организации группы. Точные параметры маршрута уточняются.</p></div><div class="hero-meta"><div><small>Дата</small><strong>${esc(S.event.date)}</strong></div><div><small>Сбор</small><strong>${esc(S.event.meeting)}</strong></div><div><small>Старт</small><strong>${esc(S.event.start)}</strong></div><div><small>Длительность</small><strong>${esc(S.event.duration)}</strong></div></div></div><div class="map-panel"><div class="map-caption"><small>Маршрут</small><strong>Схема · демо</strong></div><div class="map-watermark">Атлас v19 будет подключён</div>${mapSvg()}<div class="map-actions"><button class="btn sm" data-jump="route">Открыть маршрут</button></div></div></section><div class="summary-strip"><div class="metric"><small>Участвуют</small><strong>${yes}</strong><em>${maybe?`${maybe} возможно`:'все определились'}</em></div><div class="metric"><small>Роли</small><strong>${roleDone}/${S.roles.length}</strong><em>${S.roles.filter(r=>r.critical&&!r.p).length?'есть критичные':'базовые закрыты'}</em></div><div class="metric"><small>Групповое</small><strong>${gearDone}/${S.shared.length}</strong><em>${S.shared.length-gearDone?'есть дефициты':'комплект закрыт'}</em></div><div class="metric"><small>Готовность</small><strong>${readiness()}%</strong><em>по активным участникам</em></div><div class="metric"><small>Сигналы</small><strong>${attentionCount()}</strong><em>требуют внимания</em></div></div>${section('Моя подготовка',`<div class="my-prep"><div class="prep-primary"><div class="prep-person">${esc(me.name)}</div><div class="prep-role">${myRoles.length?myRoles.join(' · '):'Роль не назначена'}</div><div class="prep-checks"><div class="prep-line"><small>Участие</small><strong>${rsvpLabel(me.rsvp)}</strong></div><div class="prep-line"><small>Личное снаряжение</small><strong>${pr[0]} / ${pr[1]} · ${pr[2]}%</strong><div class="progress"><i style="width:${pr[2]}%"></i></div></div><div class="prep-line"><small>Транспорт туда</small><strong>${esc(rideLabel(S.current,'there'))}</strong></div><div class="prep-line"><small>Транспорт обратно</small><strong>${esc(rideLabel(S.current,'back'))}</strong></div>${myShared.length?`<div class="prep-line"><small>Групповое имущество</small><strong>${esc(myShared.join(' · '))}</strong></div>`:''}</div></div><div class="prep-side"><div class="page-kicker">Следующие действия</div>${myTasks.map(t=>`<div class="prep-task"><i class="task-dot ${t[0]}"></i><div>${esc(t[1])}</div></div>`).join('')}</div></div>`,'Каждый видит только то, что нужно сделать именно ему.')}${section('Требует внимания',`<div class="attention-groups">${attentionHtml('risk','Критично',att.critical)}${attentionHtml('','Требует решения',att.warning)}${attentionHtml('info','Информация',att.info)}${!attentionCount()?'<div class="panel">Незакрытых вопросов нет.</div>':''}</div>`,'Похожие проблемы объединены, чтобы организатор видел картину, а не простыню уведомлений.')}${section('Ближайшие этапы',`<div class="list">${S.timeline.slice(0,4).map(t=>`<div class="row"><div class="row-main"><div class="row-title"><b>${esc(t.time)} · ${esc(t.title)}</b></div><small>${esc(pn(t.owner))}${t.route?' · '+esc(routeName(t.route)):''}</small></div></div>`).join('')}</div>`,'Первые точки плана дня.')}`;
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
function routePage(){return `${pageHead('Навигация','Маршрут','Карта отвечает на вопрос «где идём», а план — «когда и что делаем».')}<div class="route-layout"><div class="route-map"><div class="map-panel"><div class="map-caption"><small>Маршрут</small><strong>Схема · демо</strong></div><div class="map-watermark">Контурное превью до подключения атласа</div>${mapSvg()}<div class="map-actions"><button class="btn sm" id="atlas">Открыть атлас</button></div></div></div><aside class="route-summary"><div class="metric"><small>Дистанция</small><strong>${esc(S.event.distance)}</strong><em>будет уточнено по финальной карте</em></div><div class="metric"><small>Формат</small><strong>${esc(S.event.duration)}</strong><em>${esc(S.event.type)}</em></div><div class="metric"><small>Старт</small><strong>${esc(S.event.start)}</strong><em>${esc(S.event.meeting)}</em></div>${section('Материалы',`<div>${S.materials.map(m=>`<div class="material"><div><b>${esc(m.title)}</b><small>${esc(m.type)}</small></div>${tag(m.status==='pending'?'не загружен':m.status==='draft'?'черновик':'готов',m.status==='ready'?'ok':'warn')}</div>`).join('')}</div>`)}</aside></div>${section('Этапы маршрута',`<div>${S.routeSteps.map((s,i)=>`<div class="route-step"><div></div><div><h3>${esc(s.title)}</h3><p>${esc(s.note)}</p></div><div class="row-actions"><button class="icon-btn" data-move="${i}:-1" ${i===0?'disabled':''}>↑</button><button class="icon-btn" data-move="${i}:1" ${i===S.routeSteps.length-1?'disabled':''}>↓</button></div></div>`).join('')}</div>`,'Порядок точек можно менять без дублирования таймлайна.')}`}
function planPage(){return `${pageHead('Организация дня','План','Таймлайн показывает время и действия; при необходимости этап привязывается к точке маршрута.',`<button class="btn sand" id="addTimeline">Добавить этап</button>`)}${section('Таймлайн',`<div class="timeline-head"><span>Время</span><span>Этап</span><span>Ответственный</span><span>Маршрут</span><span></span></div>${S.timeline.map(t=>`<div class="timeline-row"><div class="timeline-time">${esc(t.time)}</div><div><b>${esc(t.title)}</b><small>${esc(t.note||'')}</small></div><div>${esc(pn(t.owner))}</div><div>${t.route?esc(routeName(t.route)):'—'}</div><div class="row-actions"><button class="icon-btn" data-edit-time="${t.id}" title="Редактировать">✎</button><button class="icon-btn" data-del-time="${t.id}" title="Удалить">×</button></div></div>`).join('')}`,'Формы открываются внутри интерфейса — без браузерных prompt-окон.')}${section('Учебные задачи',`<div class="learning-grid"><div class="learning"><strong>Ориентирование</strong><p>Сверка карты, контрольных точек и положения группы.</p></div><div class="learning"><strong>Радиосвязь</strong><p>Проверка основного и резервного канала перед маршрутом.</p></div><div class="learning"><strong>Организация группы</strong><p>Контроль состава на старте, привале и финише.</p></div></div>`,'Без боевой тактики и опасных упражнений.')}`}
function openModal(title,body,onSave){const layer=document.getElementById('modalLayer');layer.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><strong>${esc(title)}</strong><button class="icon-btn" id="modalClose">×</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button class="btn alt" id="modalCancel">Отмена</button><button class="btn sand" id="modalSave">Сохранить</button></div></div>`;layer.classList.add('open');layer.setAttribute('aria-hidden','false');const close=()=>{layer.classList.remove('open');layer.setAttribute('aria-hidden','true');layer.innerHTML=''};layer.querySelector('#modalClose').onclick=close;layer.querySelector('#modalCancel').onclick=close;layer.onclick=e=>{if(e.target===layer)close()};layer.querySelector('#modalSave').onclick=()=>{if(onSave(layer)!==false)close()}}
function timelineModal(item=null){const t=item||{time:'',title:'',owner:S.current,route:'',note:''};openModal(item?'Редактировать этап':'Новый этап',`<div class="form-grid"><div class="field"><label>Время</label><input id="fTime" type="time" value="${esc(t.time)}"></div><div class="field"><label>Ответственный</label><select id="fOwner">${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${p.id===t.owner?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="field full"><label>Название</label><input id="fTitle" value="${esc(t.title)}" placeholder="Например, контрольная точка"></div><div class="field full"><label>Связанная точка маршрута</label><select id="fRoute"><option value="">Не привязывать</option>${S.routeSteps.map(s=>`<option value="${s.id}" ${s.id===t.route?'selected':''}>${esc(s.title)}</option>`).join('')}</select></div><div class="field full"><label>Комментарий</label><textarea id="fNote">${esc(t.note||'')}</textarea></div></div>`,layer=>{const time=layer.querySelector('#fTime').value,title=layer.querySelector('#fTitle').value.trim();if(!time||!title){toast('Заполни время и название');return false}const obj={id:item?.id||'t'+Date.now(),time,title,owner:layer.querySelector('#fOwner').value,route:layer.querySelector('#fRoute').value,note:layer.querySelector('#fNote').value.trim()};if(item)Object.assign(item,obj);else S.timeline.push(obj);S.timeline.sort((a,b)=>a.time.localeCompare(b.time));save();render();toast(item?'Этап обновлён':'Этап добавлен')})}
function sharedModal(){openModal('Добавить групповое имущество',`<div class="form-grid"><div class="field full"><label>Предмет</label><input id="gTitle" placeholder="Например, запасной компас"></div><div class="field"><label>Количество</label><input id="gNeed" type="number" min="1" value="1"></div></div>`,layer=>{const title=layer.querySelector('#gTitle').value.trim(),need=+layer.querySelector('#gNeed').value;if(!title||!need){toast('Заполни название и количество');return false}S.shared.push({id:'g'+Date.now(),title,need,a:[],confirmed:[]});save();render();toast('Предмет добавлен')})}
function carModal(){openModal('Добавить машину',`<div class="form-grid"><div class="field"><label>Водитель</label><select id="cDriver">${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Мест для пассажиров</label><input id="cCap" type="number" min="1" value="3"></div><div class="field"><label>Время выезда</label><input id="cTime" type="time" value="07:40"></div><div class="field"><label>Название</label><input id="cName" placeholder="Машина Сергея"></div><div class="field full"><label>Точка отправления</label><input id="cFrom" placeholder="Точка уточняется"></div></div>`,layer=>{const driver=layer.querySelector('#cDriver').value;if(driverCar(driver,dir)){toast('У этого участника уже есть машина в этом направлении');return false}const cap=+layer.querySelector('#cCap').value,name=layer.querySelector('#cName').value.trim()||`Машина ${pn(driver)}`,time=layer.querySelector('#cTime').value||'Уточняется',from=layer.querySelector('#cFrom').value.trim()||'Точка уточняется';const id=(dir==='there'?'c':'b')+Date.now();S.cars[dir].push({id,driver,name,cap,pass:[],time,from});S.rides[dir][driver]='own';save();render();toast('Машина добавлена')})}
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
document.getElementById('reset').onclick=()=>{if(confirm('Сбросить все изменения демо-версии?')){S=seed();save();tab='overview';gearMode='personal';dir='there';render();toast('Демо сброшено')}};
document.getElementById('eventSwitcher').onclick=()=>toast('Пока тестируем один реальный сценарий. Создание новых мероприятий — следующий этап после UX-проверки.');
render();
