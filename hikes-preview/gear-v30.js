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