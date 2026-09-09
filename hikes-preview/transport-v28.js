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
