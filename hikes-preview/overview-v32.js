/* V28 · Overview workspace: operational dashboard over all hike modules. */
(function(){
  let overviewMapV32=null;

  const toneLabelV32={ok:'Готово',warn:'Требует внимания',risk:'Не закрыто',info:'Информация'};
  const confirmedV32=()=>S.participants.filter(p=>p.rsvp==='yes');
  const assignedV32=g=>(g.a||[]).reduce((n,a)=>n+(+a[1]||0),0);
  const confirmedQtyV32=g=>(g.a||[]).reduce((n,a)=>n+((g.confirmed||[]).includes(a[0])?(+a[1]||0):0),0);
  const foodV32=()=>S.foodV31&&typeof S.foodV31==='object'?S.foodV31:{meals:[],ingredients:[],mealChecks:{},attendance:{},personNotes:{}};
  const foodMealsV32=()=>Array.isArray(foodV32().meals)?foodV32().meals:[];
  const commonMealsV32=()=>foodMealsV32().filter(m=>m.mode!=='self');
  const foodIngredientsV32=()=>Array.isArray(foodV32().ingredients)?foodV32().ingredients:[];
  const foodBringV32=i=>(i.bring||[]).reduce((n,x)=>n+(+x.qty||0),0);
  const foodSecuredV32=i=>Math.max(0,+i.home||0)+Math.max(0,+i.purchased||0)+foodBringV32(i);
  const foodShortV32=i=>Math.max(0,(+i.need||0)-foodSecuredV32(i));
  const foodMealTimeV32=m=>S.timeline.find(x=>x.id===m.planEventId)?.time||m.time||'—';
  const dayOrderV32=day=>{const m=String(day||'').match(/(\d+)/);return m?+m[1]:999};
  const roleV32=title=>S.roles.find(r=>r.title===title);

  function routeStatsV32(){
    let distance=S.event.distance||'Уточняется',duration='Уточняется',finish=S.event.finish||'—',cps=[],start=S.event.start||'—';
    try{
      if(typeof routeLenV13==='function')distance=`${(routeLenV13()/1000).toFixed(1).replace('.',',')} км`;
      if(typeof routeDurationMinV13==='function'&&typeof fmtDurationV13==='function')duration=fmtDurationV13(routeDurationMinV13());
      if(typeof finalEtaV13==='function')finish=finalEtaV13();
      if(typeof dynamicCpsV13==='function')cps=dynamicCpsV13()||[];
      if(typeof editorV13!=='undefined'&&editorV13?.start)start=editorV13.start;
    }catch(e){}
    return {distance,duration,finish,cps,start,controlPoints:Math.max(0,cps.length>=2?cps.length-2:cps.length)};
  }

  function directionStatesV32(){
    const yes=confirmedV32(),pending=S.participants.filter(p=>p.rsvp==='pending'),maybe=S.participants.filter(p=>p.rsvp==='maybe');
    const participants={tone:(pending.length||maybe.length)?'warn':'ok',value:`${yes.length}`,detail:pending.length?`${pending.length} не ответили${maybe.length?` · ${maybe.length} возможно`:''}`:(maybe.length?`${maybe.length} возможно`:'состав подтверждён'),tab:'participants'};

    const criticalMissing=S.roles.filter(r=>r.critical&&!r.p),otherMissing=S.roles.filter(r=>!r.critical&&!r.p);
    const roles={tone:criticalMissing.length?'risk':otherMissing.length?'warn':'ok',value:`${S.roles.filter(r=>r.p).length}/${S.roles.length}`,detail:criticalMissing.length?`${criticalMissing.length} базовых ролей не закрыто`:otherMissing.length?`${otherMissing.length} вспомогательных ролей свободно`:'роли распределены',tab:'roles'};

    const transportOpen=[];['there','back'].forEach(d=>yes.forEach(p=>{if(['unset','need',undefined,null].includes(S.rides?.[d]?.[p.id]))transportOpen.push({d,p})}));
    const transport={tone:transportOpen.length?'risk':'ok',value:transportOpen.length?`${transportOpen.length}`:'✓',detail:transportOpen.length?'поездок без решения':'туда и обратно закрыто',tab:'transport'};

    const sharedDef=(S.shared||[]).filter(g=>assignedV32(g)<(+g.need||0));
    const sharedConfirm=(S.shared||[]).filter(g=>assignedV32(g)>=(+g.need||0)&&confirmedQtyV32(g)<(+g.need||0));
    const personalOpen=yes.filter(p=>{const q=progress(p.id);return q[0]<q[1]});
    const gear={tone:sharedDef.length?'risk':(sharedConfirm.length||personalOpen.length)?'warn':'ok',value:`${(S.shared||[]).filter(g=>assignedV32(g)>=(+g.need||0)&&confirmedQtyV32(g)>=(+g.need||0)).length}/${(S.shared||[]).length}`,detail:sharedDef.length?`${sharedDef.length} дефицита`:sharedConfirm.length?`${sharedConfirm.length} ждут подтверждения`:personalOpen.length?`${personalOpen.length} участников не собраны`:'имущество и обязательное закрыты',tab:'gear'};

    const common=commonMealsV32(),commonIds=new Set(common.map(m=>m.id)),ings=foodIngredientsV32().filter(i=>commonIds.has(i.mealId)),foodShort=ings.filter(i=>foodShortV32(i)>0),foodNoMenu=common.filter(m=>!String(m.menu||'').trim());
    const food={tone:foodShort.length?'warn':foodNoMenu.length?'warn':'ok',value:common.length?`${common.length}`:'—',detail:foodShort.length?`${foodShort.length} продуктов докупить`:foodNoMenu.length?`${foodNoMenu.length} приёмов без меню`:common.length?'общее питание закрыто':'только самостоятельное питание',tab:'food'};

    const rs=routeStatsV32(),hasRoute=(()=>{try{return typeof editorV13!=='undefined'&&Array.isArray(editorV13.route)&&editorV13.route.length>1}catch(e){return false}})(),hasPlan=Array.isArray(S.timeline)&&S.timeline.length>0;
    const route={tone:!hasRoute?'risk':!hasPlan?'warn':'ok',value:rs.distance,detail:!hasRoute?'маршрут не задан':!hasPlan?'план дня не заполнен':`${rs.duration} · финиш ${rs.finish}`,tab:'route'};
    return {participants,roles,transport,gear,food,route};
  }

  function attentionV32(){
    const critical=[],warning=[],info=[],yes=confirmedV32();
    const pending=S.participants.filter(p=>p.rsvp==='pending');
    if(pending.length)warning.push({title:`Не ответили по участию: ${pending.length}`,detail:pending.map(p=>p.name).join(' · '),tab:'participants'});
    const maybe=S.participants.filter(p=>p.rsvp==='maybe');
    if(maybe.length)info.push({title:`Статус «Возможно»: ${maybe.length}`,detail:maybe.map(p=>p.name).join(' · '),tab:'participants'});

    const missingCritical=S.roles.filter(r=>r.critical&&!r.p);
    if(missingCritical.length)critical.push({title:`Не закрыты базовые роли: ${missingCritical.length}`,detail:missingCritical.map(r=>r.title).join(' · '),tab:'roles'});

    ['there','back'].forEach(d=>{const open=yes.filter(p=>['unset','need',undefined,null].includes(S.rides?.[d]?.[p.id]));if(open.length)critical.push({title:`Без транспорта ${d==='there'?'туда':'обратно'}: ${open.length}`,detail:open.map(p=>p.name).join(' · '),tab:'transport'})});

    const unassigned=(S.shared||[]).filter(g=>assignedV32(g)===0&&(+g.need||0)>0),deficit=(S.shared||[]).filter(g=>assignedV32(g)>0&&assignedV32(g)<(+g.need||0)),unconfirmed=(S.shared||[]).filter(g=>assignedV32(g)>=(+g.need||0)&&confirmedQtyV32(g)<(+g.need||0));
    if(unassigned.length)critical.push({title:`Общее имущество без ответственного: ${unassigned.length}`,detail:unassigned.map(g=>g.title).join(' · '),tab:'gear'});
    if(deficit.length)warning.push({title:`Дефицит общего имущества: ${deficit.length}`,detail:deficit.map(g=>`${g.title} −${(+g.need||0)-assignedV32(g)}`).join(' · '),tab:'gear'});
    if(unconfirmed.length)warning.push({title:`Общее имущество ждёт подтверждения: ${unconfirmed.length}`,detail:unconfirmed.map(g=>g.title).join(' · '),tab:'gear'});
    const personalOpen=yes.filter(p=>{const q=progress(p.id);return q[0]<q[1]});
    if(personalOpen.length)warning.push({title:`Не закрыто обязательное снаряжение: ${personalOpen.length}`,detail:personalOpen.map(p=>{const q=progress(p.id);return `${p.name} ${q[0]}/${q[1]}`}).join(' · '),tab:'gear'});

    const common=commonMealsV32(),ids=new Set(common.map(m=>m.id)),short=foodIngredientsV32().filter(i=>ids.has(i.mealId)&&foodShortV32(i)>0),noMenu=common.filter(m=>!String(m.menu||'').trim());
    if(short.length)warning.push({title:`По питанию нужно докупить: ${short.length}`,detail:short.slice(0,5).map(i=>`${i.title} ${String(foodShortV32(i)).replace('.',',')} ${i.unit||''}`).join(' · '),tab:'food'});
    if(noMenu.length)warning.push({title:`Не задано меню: ${noMenu.length}`,detail:noMenu.map(m=>`${m.day} · ${m.title}`).join(' · '),tab:'food'});

    return {critical,warning,info,count:critical.length+warning.length+info.length};
  }

  function myFoodV32(pid){
    const f=foodV32(),meals=foodMealsV32().slice().sort((a,b)=>dayOrderV32(a.day)-dayOrderV32(b.day)||foodMealTimeV32(a).localeCompare(foodMealTimeV32(b))),tasks=[],summary=[];
    meals.forEach(m=>{
      if(m.mode==='self'){
        const c=f.mealChecks?.[m.id]?.[pid]||{food:false,water:false};
        if(!c.food||!c.water)tasks.push({tone:'warn',text:`${m.title}: ${!c.food&&!c.water?'еда и вода не отмечены':!c.food?'еда не отмечена':'вода не отмечена'}`,tab:'food'});
        summary.push(`${foodMealTimeV32(m)} ${m.title} · самостоятельно`);
      }else if(f.attendance?.[m.id]?.[pid]!=='skip')summary.push(`${foodMealTimeV32(m)} ${m.title} · общее`);
    });
    return {tasks,summary:summary.slice(0,3)};
  }

  function myTasksV32(me){
    const out=[];
    if(me.rsvp==='pending'||me.rsvp==='maybe')out.push({tone:'warn',text:'Подтвердить участие',tab:'participants'});
    if(me.rsvp==='yes'){
      if(['unset','need',undefined,null].includes(S.rides?.there?.[me.id]))out.push({tone:'risk',text:'Выбрать транспорт туда',tab:'transport'});
      if(['unset','need',undefined,null].includes(S.rides?.back?.[me.id]))out.push({tone:'risk',text:'Выбрать транспорт обратно',tab:'transport'});
      const pr=progress(me.id);if(pr[0]<pr[1])out.push({tone:'warn',text:`Закрыть обязательное снаряжение (${pr[0]}/${pr[1]})`,tab:'gear'});
      const unc=(S.shared||[]).filter(g=>(g.a||[]).some(a=>a[0]===me.id)&&!(g.confirmed||[]).includes(me.id));if(unc.length)out.push({tone:'warn',text:`Подтвердить общее: ${unc.map(g=>g.title).join(', ')}`,tab:'gear'});
      out.push(...myFoodV32(me.id).tasks);
    }
    if(!out.length)out.push({tone:'ok',text:'Критичных действий на сейчас нет',tab:''});
    return out;
  }

  function unifiedTimelineV32(){
    const rows=(S.timeline||[]).map(t=>({time:t.time,title:t.title,meta:pn(t.owner),tab:'plan',kind:'plan'}));
    foodMealsV32().filter(m=>!m.planEventId).forEach(m=>rows.push({time:foodMealTimeV32(m),title:m.title,meta:m.mode==='self'?'Питание · самостоятельно':'Питание · общее',tab:'food',kind:'food'}));
    try{if(typeof breakTimelineV23==='function')breakTimelineV23().filter(x=>x.kind==='break').forEach(x=>rows.push({time:x.start,title:x.break?.title||'Перерыв',meta:`${x.break?.minutes||0} мин · маршрут`,tab:'plan',kind:'break'}))}catch(e){}
    const seen=new Set();return rows.sort((a,b)=>String(a.time).localeCompare(String(b.time))).filter(x=>{const k=`${x.time}|${x.title}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,7);
  }

  function responsibilitiesV32(){
    const titles=['Руководитель','Навигатор','Первая помощь','Транспорт','Питание'];
    return titles.map(title=>{const r=roleV32(title);return {title,pid:r?.p||'',name:r?.p?pn(r.p):'Не назначено'}});
  }

  function statusCardV32(key,title,s){return `<button class="ov32-status ${s.tone}" data-v32-jump="${s.tab}"><span><small>${esc(title)}</small><strong>${esc(s.value)}</strong></span><em>${esc(s.detail)}</em><i>${toneLabelV32[s.tone]||''}</i></button>`}
  function prepLineV32(label,value,tab,tone=''){return `<button class="ov32-prep-line ${tone}" data-v32-jump="${tab}"><span>${esc(label)}</span><strong>${esc(value)}</strong><i>›</i></button>`}

  function routePreviewV32(){
    const rs=routeStatsV32();
    return `<div class="ov32-route-card"><div class="ov32-route-map" id="overviewRouteMapV32"><div class="ov32-map-fallback">Маршрут загружается…</div></div><div class="ov32-route-overlay"><div><small>Маршрут</small><strong>${esc(rs.distance)}</strong></div><div><small>В пути</small><strong>${esc(rs.duration)}</strong></div><div><small>КТ</small><strong>${rs.controlPoints}</strong></div><div><small>Финиш</small><strong>${esc(rs.finish)}</strong></div></div><div class="ov32-route-actions"><button class="btn sm" data-v32-jump="route">Маршрут</button><button class="btn alt sm" data-v32-jump="plan">План</button></div></div>`;
  }

  function overviewV32(){
    const me=S.participants.find(p=>p.id===S.current)||S.participants[0],states=directionStatesV32(),att=attentionV32(),tasks=myTasksV32(me),pr=progress(me.id),roles=participantRoles(me.id),shared=participantShared(me.id),food=myFoodV32(me.id),timeline=unifiedTimelineV32(),responsibles=responsibilitiesV32(),rs=routeStatsV32();
    const readyDirections=Object.values(states).filter(x=>x.tone==='ok').length,critical=att.critical.length,warnings=att.warning.length,stageTone=critical?'risk':warnings?'warn':'ok',stageTitle=critical?'Подготовка требует решений':warnings?'Основное закрыто, остались вопросы':'Можно выходить',stageText=critical?`${readyDirections}/6 направлений закрыто · ${critical} критичных · ${warnings} требуют внимания`:warnings?`${readyDirections}/6 направлений закрыто · ${warnings} вопросов осталось`:'6/6 направлений закрыто · критических вопросов нет';
    const attentionHtml=(tone,label,items)=>items.length?`<div class="ov32-att-group"><div class="ov32-att-head"><strong>${label}</strong><span>${items.length}</span></div>${items.map(x=>`<button class="ov32-att-item" data-v32-jump="${x.tab}"><i class="${tone}"></i><span><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></span><em>Открыть</em></button>`).join('')}</div>`:'';
    const foodShort=commonMealsV32().length?foodIngredientsV32().filter(i=>commonMealsV32().some(m=>m.id===i.mealId)&&foodShortV32(i)>0).length:0;

    return `${pageHead('Командный штаб',S.event.short||S.event.title,'Главное по мероприятию: личная готовность, состояние команды, маршрут, питание и ближайшие действия.')}
      <section class="ov32-stage ${stageTone}"><div><span>${esc(S.event.status||'Подготовка')}</span><strong>${stageTitle}</strong><small>${stageText}</small></div><div class="ov32-stage-meta"><span><small>Дата</small><b>${esc(S.event.date||'Уточняется')}</b></span><span><small>Сбор</small><b>${esc(S.event.meeting||'Уточняется')}</b></span><span><small>Старт</small><b>${esc(rs.start)}</b></span><span><small>Финиш</small><b>${esc(rs.finish)}</b></span></div></section>
      <section class="ov32-hero"><div class="ov32-hero-copy"><div class="hero-labels">${tag(S.event.type||'Поход','sand')}${tag(S.event.status||'Подготовка','ok')}</div><h2>${esc(S.event.title||S.event.short)}</h2><p>Единая оперативная картина подготовки. Детали редактируются в профильных вкладках, здесь остаются только состояние и следующие действия.</p><div class="ov32-hero-facts"><span><small>Дистанция</small><b>${esc(rs.distance)}</b></span><span><small>Расчётное время</small><b>${esc(rs.duration)}</b></span><span><small>Контрольных точек</small><b>${rs.controlPoints}</b></span></div></div>${routePreviewV32()}</section>
      <section class="ov32-status-grid">${statusCardV32('participants','Участники',states.participants)}${statusCardV32('roles','Роли',states.roles)}${statusCardV32('transport','Транспорт',states.transport)}${statusCardV32('gear','Снаряжение',states.gear)}${statusCardV32('food','Питание',states.food)}${statusCardV32('route','Маршрут и план',states.route)}</section>
      <div class="ov32-two-col"><section class="ov32-panel"><div class="ov32-panel-head"><div><div class="page-kicker">Лично</div><h2>Моя подготовка</h2></div><span class="ov32-person">${esc(me.name)}</span></div><div class="ov32-roleline">${roles.length?esc(roles.join(' · ')):'Роль не назначена'}</div><div class="ov32-prep-list">${prepLineV32('Участие',rsvpLabel(me.rsvp),'participants',me.rsvp==='yes'?'ok':'warn')}${prepLineV32('Снаряжение',`${pr[0]}/${pr[1]} обязательных · ${pr[2]}%`,'gear',pr[0]===pr[1]?'ok':'warn')}${prepLineV32('Транспорт туда',rideLabel(me.id,'there'),'transport',['unset','need'].includes(S.rides?.there?.[me.id])?'risk':'ok')}${prepLineV32('Транспорт обратно',rideLabel(me.id,'back'),'transport',['unset','need'].includes(S.rides?.back?.[me.id])?'risk':'ok')}${prepLineV32('Питание',food.summary.length?food.summary.join(' · '):'Для меня приёмы не заданы','food')}${shared.length?prepLineV32('Общее имущество',shared.join(' · '),'gear'):''}</div></section>
      <section class="ov32-panel ov32-actions"><div class="ov32-panel-head"><div><div class="page-kicker">Сейчас</div><h2>Мне нужно сделать</h2></div><span>${tasks.length}</span></div><div class="ov32-task-list">${tasks.map(t=>`<button class="ov32-task ${t.tone}" ${t.tab?`data-v32-jump="${t.tab}"`:''}><i></i><span>${esc(t.text)}</span>${t.tab?'<em>›</em>':''}</button>`).join('')}</div></section></div>
      <section class="ov32-panel"><div class="ov32-panel-head"><div><div class="page-kicker">Контроль</div><h2>Требует внимания</h2><p>Только незакрытые вопросы из всех модулей.</p></div><span>${att.count}</span></div><div class="ov32-attention">${attentionHtml('risk','Критично',att.critical)}${attentionHtml('warn','Требует решения',att.warning)}${attentionHtml('info','Информация',att.info)}${!att.count?'<div class="ov32-empty ok">Критичных вопросов нет. Основные направления подготовки закрыты.</div>':''}</div></section>
      <div class="ov32-lower"><section class="ov32-panel"><div class="ov32-panel-head"><div><div class="page-kicker">Хронология</div><h2>Ближайший план</h2></div><button class="btn alt sm" data-v32-jump="plan">Весь план</button></div><div class="ov32-timeline">${timeline.map((x,i)=>`<button data-v32-jump="${x.tab}"><time>${esc(x.time)}</time><i class="${x.kind}"></i><span><b>${esc(x.title)}</b><small>${esc(x.meta||'')}</small></span></button>`).join('')||'<div class="ov32-empty">События пока не добавлены.</div>'}</div></section>
      <div class="ov32-stack"><section class="ov32-panel"><div class="ov32-panel-head"><div><div class="page-kicker">Связь</div><h2>Кто отвечает</h2></div><button class="btn alt sm" data-v32-jump="roles">Все роли</button></div><div class="ov32-responsibles">${responsibles.map(r=>`<button data-v32-jump="roles" class="${r.pid?'':'missing'}"><span>${esc(r.title)}</span><b>${esc(r.name)}</b></button>`).join('')}</div></section><section class="ov32-panel"><div class="ov32-panel-head"><div><div class="page-kicker">Питание</div><h2>Ближайшие приёмы</h2></div><button class="btn alt sm" data-v32-jump="food">Открыть</button></div><div class="ov32-food-mini">${foodMealsV32().slice().sort((a,b)=>dayOrderV32(a.day)-dayOrderV32(b.day)||foodMealTimeV32(a).localeCompare(foodMealTimeV32(b))).slice(0,4).map(m=>`<button data-v32-jump="food"><time>${esc(foodMealTimeV32(m))}</time><span><b>${esc(m.title)}</b><small>${esc(m.mode==='self'?'самостоятельно':m.mode==='hybrid'?'общее + личное':'общее')}</small></span></button>`).join('')||'<div class="ov32-empty">Питание пока не запланировано.</div>'}</div>${foodShort?`<div class="ov32-food-alert">Нужно докупить: <b>${foodShort}</b> поз.</div>`:''}</section></div></div>`;
  }

  function overviewV33(){
    const me=S.participants.find(p=>p.id===S.current)||S.participants[0],states=directionStatesV32(),att=attentionV32(),tasks=myTasksV32(me),pr=progress(me.id),roles=participantRoles(me.id),shared=participantShared(me.id),food=myFoodV32(me.id),timeline=unifiedTimelineV32(),responsibles=responsibilitiesV32(),rs=routeStatsV32();
    const readyDirections=Object.values(states).filter(x=>x.tone==='ok').length,critical=att.critical.length,warnings=att.warning.length,stageTone=critical?'risk':warnings?'warn':'ok',stageTitle=critical?'Нужно закрыть риски':warnings?'Подготовка продолжается':'Можно выходить',stageText=critical?`${critical} критичных вопроса · ${warnings} требуют решения`:warnings?`${warnings} вопросов осталось`: 'Все ключевые направления закрыты';
    const statusList=Object.entries({participants:'Участники',roles:'Роли',transport:'Транспорт',gear:'Снаряжение',food:'Питание',route:'Маршрут'}).map(([key,label])=>{const s=states[key];return `<button class="ov33-direction ${s.tone}" data-v32-jump="${s.tab}"><span><b>${esc(label)}</b><small>${esc(s.detail)}</small></span><strong>${esc(s.value)}</strong><i>${toneLabelV32[s.tone]||''}</i></button>`}).join('');
    const attentionGroup=(tone,label,items)=>items.length?`<div class="ov33-att-group"><div class="ov33-att-label"><span class="${tone}"></span><b>${label}</b><em>${items.length}</em></div>${items.map(x=>`<button class="ov33-att-row" data-v32-jump="${x.tab}"><span><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></span><i>Открыть</i></button>`).join('')}</div>`:'';
    return `<header class="ov33-page-head"><div><div class="page-kicker">Командный штаб · ${esc(S.event.type||'Поход')}</div><h1>${esc(S.event.short||S.event.title)}</h1><p>${esc(S.event.title||'Поход')}. Подготовка, маршрут и действия группы в одном рабочем контуре.</p></div><div class="ov33-head-actions"><button class="btn alt sm" data-v32-jump="route">Открыть маршрут</button><button class="btn sm" data-v32-jump="plan">Открыть план</button></div></header>
      <section class="ov33-command"><div class="ov33-map-zone">${routePreviewV32()}</div><aside class="ov33-brief ${stageTone}"><div class="ov33-brief-label">Статус подготовки</div><strong>${stageTitle}</strong><p>${stageText}</p><div class="ov33-event-meta"><span><small>Дата</small><b>${esc(S.event.date||'Уточняется')}</b></span><span><small>Сбор</small><b>${esc(S.event.meeting||'Уточняется')}</b></span><span><small>Старт</small><b>${esc(rs.start)}</b></span><span><small>Финиш</small><b>${esc(rs.finish)}</b></span></div><div class="ov33-route-metrics"><span><small>Дистанция</small><b>${esc(rs.distance)}</b></span><span><small>В пути</small><b>${esc(rs.duration)}</b></span><span><small>Контрольных точек</small><b>${rs.controlPoints}</b></span></div></aside><section class="ov33-directions"><div class="ov33-section-title"><span>Готовность направлений</span><b>${readyDirections}/6</b></div>${statusList}</section></section>
      <div class="ov33-workspace"><section class="ov33-focus"><div class="ov33-section-head"><div><span>Контроль подготовки</span><h2>Что требует решения</h2></div><b>${att.count}</b></div><div class="ov33-attention">${attentionGroup('risk','Критично',att.critical)}${attentionGroup('warn','Нужно решить',att.warning)}${attentionGroup('info','На контроле',att.info)}${!att.count?'<div class="ov33-clear">Незакрытых вопросов нет.</div>':''}</div><div class="ov33-timeline-head"><div><span>Ближайший ход дня</span><h2>План</h2></div><button class="btn alt sm" data-v32-jump="plan">Весь план</button></div><div class="ov33-timeline">${timeline.map(x=>`<button data-v32-jump="${x.tab}"><time>${esc(x.time)}</time><i class="${x.kind}"></i><span><b>${esc(x.title)}</b><small>${esc(x.meta||'')}</small></span></button>`).join('')||'<div class="ov33-clear">События пока не добавлены.</div>'}</div></section>
      <aside class="ov33-personal"><section><div class="ov33-section-head"><div><span>Моя подготовка</span><h2>${esc(me.name)}</h2></div><b>${pr[2]}%</b></div><p class="ov33-roleline">${roles.length?esc(roles.join(' · ')):'Роль не назначена'}</p><div class="ov33-checks">${prepLineV32('Участие',rsvpLabel(me.rsvp),'participants',me.rsvp==='yes'?'ok':'warn')}${prepLineV32('Снаряжение',`${pr[0]}/${pr[1]} обязательных`,'gear',pr[0]===pr[1]?'ok':'warn')}${prepLineV32('Транспорт туда',rideLabel(me.id,'there'),'transport',['unset','need'].includes(S.rides?.there?.[me.id])?'risk':'ok')}${prepLineV32('Транспорт обратно',rideLabel(me.id,'back'),'transport',['unset','need'].includes(S.rides?.back?.[me.id])?'risk':'ok')}${prepLineV32('Питание',food.summary.length?food.summary.join(' · '):'Не запланировано','food')}${shared.length?prepLineV32('Общее имущество',shared.join(' · '),'gear'):''}</div></section><section class="ov33-my-actions"><div class="ov33-section-head"><div><span>Следующие действия</span><h2>Мне нужно сделать</h2></div><b>${tasks.length}</b></div>${tasks.map(t=>`<button class="ov33-task ${t.tone}" ${t.tab?`data-v32-jump="${t.tab}"`:''}><i></i><span>${esc(t.text)}</span><em>›</em></button>`).join('')}</section><section class="ov33-responsible"><div class="ov33-section-head"><div><span>Связь</span><h2>Кто отвечает</h2></div><button class="btn alt sm" data-v32-jump="roles">Все роли</button></div>${responsibles.map(r=>`<button data-v32-jump="roles" class="${r.pid?'':'missing'}"><span>${esc(r.title)}</span><b>${esc(r.name)}</b></button>`).join('')}</section></aside></div>`;
  }

  function initMapV32(){
    if(tab!=='overview')return;const el=document.getElementById('overviewRouteMapV32');if(!el)return;
    try{if(overviewMapV32){overviewMapV32.remove();overviewMapV32=null}}catch(e){}
    if(typeof L==='undefined'||typeof editorV13==='undefined'||!Array.isArray(editorV13.route)||editorV13.route.length<2){el.innerHTML='<div class="ov32-map-fallback">Маршрут пока не задан</div>';return}
    try{
      el.innerHTML='';overviewMapV32=L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,dragging:true,tap:false});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(overviewMapV32);
      const line=L.polyline(editorV13.route,{weight:4,opacity:.95}).addTo(overviewMapV32);
      const cps=typeof dynamicCpsV13==='function'?dynamicCpsV13():[];
      cps.forEach(cp=>L.circleMarker([cp.lat,cp.lon],{radius:cp.number==='С'||cp.number==='Ф'?5:3,weight:2,fillOpacity:1}).addTo(overviewMapV32));
      overviewMapV32.fitBounds(line.getBounds(),{padding:[18,18]});setTimeout(()=>overviewMapV32?.invalidateSize(),60);
    }catch(e){el.innerHTML='<div class="ov32-map-fallback">Не удалось отрисовать превью маршрута</div>'}
  }

  function bindOverviewV32(){
    if(tab!=='overview')return;
    document.body.classList.add('ov32-active');
    document.querySelectorAll('[data-v32-jump]').forEach(b=>b.onclick=()=>{const target=b.dataset.v32Jump;if(!target)return;tab=target;render()});
    requestAnimationFrame(initMapV32);
  }

  const baseBindV32=bind;
  bind=function(){baseBindV32();if(tab!=='overview'){document.body.classList.remove('ov32-active');return}bindOverviewV32()};
  overview=overviewV33;
  document.querySelector('.build-label')?.replaceChildren(document.createTextNode('V29 · полевой командный центр'));
  render();
})();
