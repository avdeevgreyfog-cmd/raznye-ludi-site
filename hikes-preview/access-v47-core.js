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
  const organizer=()=>document.body.classList.contains('hike-organizer')||(!signed()&&current()?.id==='p1');
  function roles(pid=current()?.id){
    const rows=[];
    if(Array.isArray(S.rolesV36?.roles)&&S.rolesV36.roles.length){
      S.rolesV36.roles.filter(r=>r.p===pid).forEach(r=>rows.push({id:r.id,title:r.title,desc:r.desc||''}));
    }else{
      (S.roles||[]).filter(r=>r.p===pid).forEach(r=>rows.push({id:legacyMap[r.title]||r.id,title:r.title,desc:r.desc||''}));
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
    if(!a.group){
      const r=personalReady(),card=document.querySelector('.ov44-readiness');if(card){card.querySelector('.ov44-card-head h2')?.replaceChildren('Моя готовность');card.querySelectorAll('.ov44-card-head>span,.ov44-ready-row>strong').forEach(el=>el.textContent=`${r.percent}%`);const bar=card.querySelector('.ov44-ready-track i');if(bar)bar.style.width=`${r.percent}%`;card.querySelector('p')?.replaceChildren(`${r.done} из ${r.total} личных пунктов готовы`)}
      const ms=[...document.querySelectorAll('.ov44-metric')],pr=(()=>{try{return progress(current()?.id)}catch(e){return [0,0,0]}})(),rs=roles(),tasks=ownTasks();
      metric(ms[1],'Дата',/уточня/i.test(S.event?.date||'')?'Уточняется':(S.event?.date||'Уточняется'),S.event?.meeting||'место сбора уточняется');
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
