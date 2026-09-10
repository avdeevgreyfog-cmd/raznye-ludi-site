/* V26 · Food workspace: meal plan, shopping, responsibilities and gear links. */
(function(){
  const VER=1;
  const MODE={self:['Личное','Каждый обеспечивает себя сам'],common:['Общее','Еда готовится централизованно'],hybrid:['Общее + личное','Общая основа и личные дополнения']};
  const DEFAULT_EQUIPMENT=['Котёл','Горелка','Топливо для горелки'];
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
        {id:'fm1',day:'День 1',time:'07:00',title:'Завтрак',mode:'self',location:'До выезда',menu:'Завтрак самостоятельно до общего сбора.',note:'Перед выходом не рассчитываем на общую готовку.',portions:0,planEventId:'',cooks:[],equipment:[]},
        {id:'fm2',day:'День 1',time:'12:30',title:'Обед на маршруте',mode:'self',location:'Привал',menu:'Личный обед + ходовой перекус.',note:'Каждый несёт свою еду и воду.',portions:0,planEventId:'t5',cooks:[],equipment:[]},
        {id:'fm3',day:'День 1',time:'19:00',title:'Ужин в лагере',mode:'common',location:'Лагерь',menu:'Гречка с тушёнкой + чай.',note:'Пример общего приёма пищи: продукты закупаются и распределяются заранее.',portions:Math.max(1,yes.length),planEventId:'',cooks:['p4'],equipment:DEFAULT_EQUIPMENT.map(title=>({title,sharedId:''}))}
      ],
      ingredients:[
        {id:'fi1',mealId:'fm3',title:'Гречка',need:0.8,unit:'кг',home:0.2,purchased:0,price:180,buyer:'p1',bring:[]},
        {id:'fi2',mealId:'fm3',title:'Тушёнка',need:5,unit:'бан.',home:2,purchased:0,price:230,buyer:'p1',bring:[]},
        {id:'fi3',mealId:'fm3',title:'Чай',need:20,unit:'пак.',home:20,purchased:0,price:0,buyer:'',bring:[]},
        {id:'fi4',mealId:'fm3',title:'Сахар',need:0.3,unit:'кг',home:0,purchased:0,price:95,buyer:'p5',bring:[]}
      ],
      mealChecks:{},
      attendance:{fm3:attendance},
      personNotes:{}
    };
  }
  function F(){return ensureFood()}
  function ensureFood(){
    if(!S.foodV31||S.foodV31.version!==VER){
      const old=S.foodV31&&typeof S.foodV31==='object'?S.foodV31:{};
      S.foodV31={...foodSeed(),...old,version:VER};
    }
    const f=S.foodV31;
    f.meals=Array.isArray(f.meals)?f.meals:[];f.ingredients=Array.isArray(f.ingredients)?f.ingredients:[];f.mealChecks=f.mealChecks||{};f.attendance=f.attendance||{};f.personNotes=f.personNotes||{};
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
  function dayGroups(){const map={};F().meals.slice().sort((a,b)=>a.day.localeCompare(b.day,'ru')||mealTime(a).localeCompare(mealTime(b))).forEach(m=>(map[m.day]||=[]).push(m));return map}
  function selfCheck(m){const c=F().mealChecks[m.id]?.[S.current]||{food:false,water:false};return `<div class="f31-self-check"><button class="${c.food?'done':''}" data-f31-check="${m.id}:food"><i>${c.food?'✓':''}</i>Еда собрана</button><button class="${c.water?'done':''}" data-f31-check="${m.id}:water"><i>${c.water?'✓':''}</i>Вода собрана</button></div>`}
  function commonActions(m){const a=F().attendance[m.id]?.[S.current]||'eat';return `<div class="f31-attendance"><span>Я участвую в этом приёме пищи</span><button class="${a==='eat'?'active':''}" data-f31-eat="${m.id}:eat">Ем</button><button class="${a==='skip'?'active skip':''}" data-f31-eat="${m.id}:skip">Не ем</button></div>`}
  function mealCard(m){
    const ing=mealIngredients(m.id),pct=mealBuyPct(m),event=mealEvent(m),tone=toneForMeal(m);
    return `<article class="f31-meal ${tone}"><div class="f31-meal-time"><strong>${esc(mealTime(m))}</strong><small>${esc(m.location||'')}</small></div><div class="f31-meal-main"><div class="f31-meal-title"><span><b>${esc(m.title)}</b><em class="mode-${m.mode}">${MODE[m.mode][0]}</em>${event?'<button class="f31-linked" data-f31-open-plan type="button">План ↗</button>':''}</span>${foodOrganizer()?`<button class="icon-btn" data-f31-edit-meal="${m.id}" title="Изменить">✎</button>`:''}</div><p>${esc(m.menu||MODE[m.mode][1])}</p>${m.note?`<small class="f31-note">${esc(m.note)}</small>`:''}${m.mode==='self'?selfCheck(m):commonActions(m)}${m.mode!=='self'?`<div class="f31-meal-stats"><span><b>${eaters(m)}</b> едят</span><span><b>${portions(m)}</b> порций</span><span><b>${pct}%</b> продуктов закрыто</span><span class="${mealNeed(m)?'warn':'ok'}"><b>${mealNeed(m)}</b> позиций докупить</span></div>`:''}${ing.length&&m.mode!=='self'?`<details class="f31-ingredients"><summary>Продукты <b>${ing.length}</b></summary><div>${ing.map(i=>`<div><span><b>${esc(i.title)}</b><small>${qtyFmt(secured(i))}/${qtyFmt(i.need)} ${esc(i.unit)}</small></span><em class="${shortage(i)?'warn':'ok'}">${shortage(i)?`докупить ${qtyFmt(shortage(i))} ${esc(i.unit)}`:'закрыто'}</em></div>`).join('')}</div></details>`:''}</div></article>`;
  }
  function planPageFood(){
    const meals=F().meals,common=meals.filter(m=>m.mode!=='self'),self=meals.filter(m=>m.mode==='self'),open=common.reduce((n,m)=>n+mealNeed(m),0),days=Object.keys(dayGroups()).length;
    return `${foodMetric('Приёмов пищи',meals.length,`${days} дн.`)}${foodMetric('Личное',self.length,'каждый отвечает за себя')}${foodMetric('Общее',common.length,'централизованное питание')}${foodMetric('Докупить',open,'позиций по общему меню',open?'warn':'ok')}`;
  }
  function planFood(){const g=dayGroups();return `<div class="f31-summary">${planPageFood()}</div><section class="f31-panel"><div class="f31-head"><div><div class="page-kicker">Расписание</div><h2>Когда и как питаемся</h2><p>Сразу видно, где каждый отвечает за себя, а где работает общее меню.</p></div>${foodOrganizer()?'<button class="btn sand" id="f31AddMeal">+ Приём пищи</button>':''}</div>${Object.entries(g).map(([day,list])=>`<div class="f31-day"><div class="f31-day-head"><b>${esc(day)}</b><span>${list.length} приёма</span></div>${list.map(mealCard).join('')}</div>`).join('')}</section>`}

  function aggKey(i){return `${String(i.title).trim().toLowerCase()}|${String(i.unit).trim().toLowerCase()}`}
  function aggregates(){const map=new Map();F().ingredients.forEach(i=>{const k=aggKey(i),m=F().meals.find(x=>x.id===i.mealId);if(!map.has(k))map.set(k,{key:k,title:i.title,unit:i.unit,need:0,secured:0,toBuy:0,estimate:0,lines:[],meals:new Set(),buyers:new Set()});const a=map.get(k),sh=shortage(i);a.need+=+i.need||0;a.secured+=Math.min(+i.need||0,secured(i));a.toBuy+=sh;a.estimate+=sh*(+i.price||0);a.lines.push(i);if(m)a.meals.add(m.title);if(i.buyer)a.buyers.add(i.buyer)});return [...map.values()].sort((a,b)=>b.toBuy-a.toBuy||a.title.localeCompare(b.title,'ru'))}
  function shoppingFood(){
    const a=aggregates(),open=a.filter(x=>x.toBuy>0),estimate=open.reduce((n,x)=>n+x.estimate,0),closed=a.filter(x=>x.toBuy<=0).length;
    return `<div class="f31-summary">${foodMetric('Продуктов',a.length,'суммарный список')}${foodMetric('Купить',open.length,'ещё не закрыто',open.length?'warn':'ok')}${foodMetric('Оценка',money(estimate),'по указанным ценам')}${foodMetric('Закрыто',`${closed}/${a.length}`,'есть / принесут / куплено',closed===a.length?'ok':'')}</div><section class="f31-panel"><div class="f31-head"><div><div class="page-kicker">Закупки</div><h2>Единый список продуктов</h2><p>Одинаковые продукты из разных приёмов пищи автоматически суммируются.</p></div></div><div class="f31-shop-list">${a.map(x=>{const done=x.toBuy<=0,buyer=x.buyers.size===1?[...x.buyers][0]:'';return `<article class="f31-shop ${done?'ok':'warn'}"><div><b>${esc(x.title)}</b><small>${[...x.meals].map(esc).join(' · ')}</small></div><div class="f31-shop-numbers"><span>Нужно<b>${qtyFmt(x.need)} ${esc(x.unit)}</b></span><span>Закрыто<b>${qtyFmt(x.secured)} ${esc(x.unit)}</b></span><span>Купить<b>${qtyFmt(x.toBuy)} ${esc(x.unit)}</b></span></div><div class="f31-shop-owner"><label>Покупает<select data-f31-buyer="${encodeURIComponent(x.key)}" ${foodOrganizer()?'':'disabled'}><option value="">Не назначено</option>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${p.id===buyer?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><strong>${x.estimate?money(x.estimate):'цена не задана'}</strong></div><div class="f31-shop-actions">${foodOrganizer()?`<button class="btn ${done?'alt':'sand'} sm" data-f31-purchased="${encodeURIComponent(x.key)}">${done?'Вернуть в список':'Отметить куплено'}</button>`:''}</div></article>`}).join('')||'<div class="f31-empty">Общие продукты пока не добавлены.</div>'}</div></section>`}

  function gearState(eq){
    const x=(S.shared||[]).find(g=>g.id===eq.sharedId)||(!eq.sharedId?(S.shared||[]).find(g=>g.title.toLowerCase()===eq.title.toLowerCase()):null);if(!x)return{kind:'none',text:'Не добавлено в снаряжение',x:null};
    const assigned=(x.a||[]).reduce((n,a)=>n+(+a[1]||0),0),confirmed=(x.a||[]).reduce((n,a)=>n+((x.confirmed||[]).includes(a[0])?(+a[1]||0):0),0),need=+x.need||1;
    if(assigned<need)return{kind:'risk',text:`Дефицит ${need-assigned}`,x};if(confirmed<need)return{kind:'warn',text:'Нужно подтвердить',x};return{kind:'ok',text:'Готово',x};
  }
  function orgFood(){
    const common=F().meals.filter(m=>m.mode!=='self');
    return `<div class="f31-summary">${foodMetric('Общих приёмов',common.length,'требуют координации')}${foodMetric('Повара',new Set(common.flatMap(m=>m.cooks)).size,'назначено людей')}${foodMetric('Оборудование',common.reduce((n,m)=>n+m.equipment.length,0),'связи со снаряжением')}${foodMetric('Особенности',Object.values(F().personNotes).filter(Boolean).length,'комментарии участников')}</div><section class="f31-panel"><div class="f31-head"><div><div class="page-kicker">Организация</div><h2>Кто покупает, готовит и что требуется</h2><p>Оборудование не дублируется: здесь показана потребность, фактическое назначение живёт в «Снаряжении».</p></div></div>${common.map(m=>`<article class="f31-org-meal"><div class="f31-org-title"><div><b>${esc(mealTime(m))} · ${esc(m.title)}</b><small>${esc(m.menu||'')}</small></div>${foodOrganizer()?`<button class="btn alt sm" data-f31-edit-meal="${m.id}">Настроить</button>`:''}</div><div class="f31-org-grid"><div><span>Готовят</span><strong>${m.cooks.length?m.cooks.map(pn).map(esc).join(', '):'не назначено'}</strong></div><div><span>Участники</span><strong>${eaters(m)} едят · ${portions(m)} порций</strong></div><div><span>Закупки</span><strong>${mealBuyPct(m)}% закрыто · ${mealNeed(m)} докупить</strong></div></div><div class="f31-equipment"><div class="f31-subhead"><b>Оборудование</b>${foodOrganizer()?`<button data-f31-eq-add="${m.id}">+ добавить требование</button>`:''}</div>${m.equipment.length?m.equipment.map((eq,idx)=>{const st=gearState(eq);return `<div class="f31-eq"><span><b>${esc(eq.title)}</b><small class="${st.kind}">${esc(st.text)}</small></span><div>${st.x?`<button class="btn alt sm" data-f31-open-gear="${st.x.id}">Снаряжение ↗</button>`:(foodOrganizer()?`<button class="btn sand sm" data-f31-link-gear="${m.id}:${idx}">Добавить в снаряжение</button>`:'')} ${foodOrganizer()?`<button class="icon-btn" data-f31-eq-del="${m.id}:${idx}" title="Удалить">×</button>`:''}</div></div>`}).join(''):'<div class="f31-empty compact">Требования к оборудованию не заданы.</div>'}</div></article>`).join('')||'<div class="f31-empty">Общих приёмов пищи пока нет.</div>'}</section>`}

  function foodPage(){ensureFood();return `${pageHead('Подготовка','Питание','Расписание приёмов пищи, общее меню, закупки и связь с групповым снаряжением.',foodOrganizer()?'<button class="btn sand" id="f31AddMealTop">+ Приём пищи</button>':'')}${tabs()}<div class="f31-content">${foodMode==='plan'?planFood():foodMode==='shopping'?shoppingFood():orgFood()}</div>${personNoteBlock()}`}
  function personNoteBlock(){const v=F().personNotes[S.current]||'';return `<section class="f31-note-panel"><div><b>Пищевые особенности</b><small>Комментарий только для этого мероприятия: что важно учесть при общем меню.</small></div><textarea id="f31PersonNote" rows="2" placeholder="Например: не ем тушёнку">${esc(v)}</textarea></section>`}

  function modalShell(title,body,actions){const l=document.getElementById('modalLayer');if(!l)return null;l.innerHTML=`<div class="f31-backdrop" data-f31-close></div><div class="f31-modal"><div class="f31-modal-head"><b>${title}</b><button data-f31-close>×</button></div><div class="f31-modal-body">${body}</div><div class="f31-modal-foot">${actions}</div></div>`;l.classList.add('open');l.setAttribute('aria-hidden','false');l.querySelectorAll('[data-f31-close]').forEach(b=>b.onclick=closeFoodModal);return l}
  function closeFoodModal(){const l=document.getElementById('modalLayer');if(!l)return;l.classList.remove('open');l.setAttribute('aria-hidden','true');l.innerHTML=''}
  function mealModal(id=''){
    const edit=!!id,m=edit?F().meals.find(x=>x.id===id):{day:'День 1',time:'12:00',title:'',mode:'self',location:'',menu:'',note:'',portions:0,planEventId:'',cooks:[],equipment:[]};if(!m)return;
    const body=`<div class="f31-form-row"><label>День<input id="f31Day" value="${esc(m.day)}"></label><label>Время<input id="f31Time" type="time" value="${esc(m.time)}"></label></div><label>Название<input id="f31Title" value="${esc(m.title)}" placeholder="Обед / Ужин"></label><div class="f31-form-row"><label>Тип<select id="f31MealMode">${Object.entries(MODE).map(([k,v])=>`<option value="${k}" ${m.mode===k?'selected':''}>${v[0]}</option>`).join('')}</select></label><label>Место<input id="f31Location" value="${esc(m.location||'')}"></label></div><label>Связать с событием «Плана»<select id="f31Plan"><option value="">Не связано</option>${(S.timeline||[]).map(t=>`<option value="${t.id}" ${m.planEventId===t.id?'selected':''}>${esc(t.time)} · ${esc(t.title)}</option>`).join('')}</select><small>Если связано, время в «Питании» берётся из события плана.</small></label><label>Меню / что взять<textarea id="f31Menu" rows="2">${esc(m.menu||'')}</textarea></label><label>Комментарий<textarea id="f31Note" rows="2">${esc(m.note||'')}</textarea></label><label id="f31PortionsWrap">Порций<input id="f31Portions" type="number" min="0" value="${+m.portions||0}"><small>0 = по числу участников, которые выбрали «Ем».</small></label><fieldset id="f31Cooks"><legend>Готовят</legend>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<label><input type="checkbox" value="${p.id}" ${m.cooks.includes(p.id)?'checked':''}> ${esc(p.name)}</label>`).join('')}</fieldset><div id="f31IngredientsWrap"><div class="f31-subhead"><b>Продукты этого приёма</b>${edit?'<button type="button" id="f31AddIngredient">+ продукт</button>':''}</div>${edit?ingredientEditorList(m.id):'<small>Сначала сохраните приём пищи, затем добавьте продукты.</small>'}</div>`;
    const actions=`${edit?'<button class="btn risk" id="f31DeleteMeal">Удалить</button>':''}<span></span><button class="btn alt" data-f31-close>Отмена</button><button class="btn sand" id="f31SaveMeal">${edit?'Сохранить':'Добавить'}</button>`;
    const l=modalShell(edit?'Настроить приём пищи':'Добавить приём пищи',body,actions);if(!l)return;
    const toggle=()=>{const common=document.getElementById('f31MealMode').value!=='self';document.getElementById('f31PortionsWrap').style.display=common?'grid':'none';document.getElementById('f31Cooks').style.display=common?'grid':'none';document.getElementById('f31IngredientsWrap').style.display=common?'block':'none'};document.getElementById('f31MealMode').onchange=toggle;toggle();
    document.getElementById('f31AddIngredient')?.addEventListener('click',()=>ingredientModal(m.id));
    document.querySelectorAll('[data-f31-edit-ing]').forEach(b=>b.onclick=()=>ingredientModal(m.id,b.dataset.f31EditIng));
    document.getElementById('f31DeleteMeal')?.addEventListener('click',()=>{if(!confirm(`Удалить «${m.title}» и связанные продукты?`))return;F().meals=F().meals.filter(x=>x.id!==m.id);F().ingredients=F().ingredients.filter(x=>x.mealId!==m.id);delete F().mealChecks[m.id];delete F().attendance[m.id];save();closeFoodModal();render()});
    document.getElementById('f31SaveMeal').onclick=()=>{const title=document.getElementById('f31Title').value.trim();if(!title)return toast('Укажи название приёма пищи');const patch={day:document.getElementById('f31Day').value.trim()||'День 1',time:document.getElementById('f31Time').value||'12:00',title,mode:document.getElementById('f31MealMode').value,location:document.getElementById('f31Location').value.trim(),planEventId:document.getElementById('f31Plan').value,menu:document.getElementById('f31Menu').value.trim(),note:document.getElementById('f31Note').value.trim(),portions:Math.max(0,+document.getElementById('f31Portions').value||0),cooks:[...document.querySelectorAll('#f31Cooks input:checked')].map(x=>x.value)};if(edit)Object.assign(m,patch);else{const nm={id:'fm_'+Date.now(),equipment:patch.mode==='common'?DEFAULT_EQUIPMENT.map(title=>({title,sharedId:''})):[],...patch};F().meals.push(nm);F().mealChecks[nm.id]={};F().attendance[nm.id]={};S.participants.forEach(p=>{F().mealChecks[nm.id][p.id]={food:false,water:false};F().attendance[nm.id][p.id]=p.rsvp==='yes'?'eat':'skip'})}save();closeFoodModal();render()};
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
    eq.sharedId=x.id;save();render();toast('Связано со снаряжением')
  }
  function openGear(){tab='gear';render()}

  function bindFood(){
    document.body.classList.toggle('f31-active',tab==='food');if(tab!=='food')return;
    document.querySelectorAll('[data-f31-mode]').forEach(b=>b.onclick=()=>{foodMode=b.dataset.f31Mode;render()});
    document.querySelectorAll('[data-f31-check]').forEach(b=>b.onclick=()=>{const [mid,k]=b.dataset.f31Check.split(':');F().mealChecks[mid][S.current][k]=!F().mealChecks[mid][S.current][k];save();render()});
    document.querySelectorAll('[data-f31-eat]').forEach(b=>b.onclick=()=>{const [mid,v]=b.dataset.f31Eat.split(':');F().attendance[mid][S.current]=v;save();render()});
    document.querySelectorAll('[data-f31-edit-meal]').forEach(b=>b.onclick=()=>mealModal(b.dataset.f31EditMeal));
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

  // New module registration without rewriting the established app shell.
  if(!NAV.some(x=>x[0]==='food')){const gearAt=NAV.findIndex(x=>x[0]==='gear');NAV.splice(gearAt+1,0,['food','Питание'])}
  const baseRenderNav=renderNav;
  renderNav=function(){
    baseRenderNav();
    document.querySelectorAll('[data-mobile="more"]').forEach(b=>b.classList.toggle('active',['participants','roles','plan','food'].includes(tab)));
  };
  toggleMobileSheet=function(){const sh=document.getElementById('mobileSheet');sh.innerHTML=[['food','Питание'],['participants','Участники'],['roles','Роли'],['plan','План']].map(([id,label])=>`<button type="button" data-sheet-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('');sh.classList.toggle('open');sh.setAttribute('aria-hidden',sh.classList.contains('open')?'false':'true');sh.querySelectorAll('[data-sheet-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.sheetTab;closeMobileSheet();render()})};
  const baseRender=render;
  render=function(){if(tab!=='food')return baseRender();renderNav();const who=document.getElementById('who');who.innerHTML=S.participants.map(p=>`<option value="${p.id}" ${p.id===S.current?'selected':''}>${esc(p.name)}</option>`).join('');document.getElementById('app').innerHTML=foodPage();bind()};
  const baseBind=bind;bind=function(){baseBind();bindFood()};
  ensureFood();document.querySelector('.build-label')?.replaceChildren(document.createTextNode('V26 · питание · меню и закупки'));render();
})();
