/* Scout company history v2
   Local persistence pilot. One compact snapshot per company per Scout run.
   Prepared to be replaced by Supabase persistence after UI/logic validation.
*/
(()=>{
const KEY='scout_company_history_v2';
const MAX_PER_COMPANY=50;

const style=document.createElement('style');
style.textContent=`
.company-history-panel{display:block;width:100%;border:1px solid #e1e6e9;background:#fff;margin:14px 0 8px}.company-history-panel>summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 12px;background:#fafbfc;font-size:13px;font-weight:800}.company-history-panel>summary::-webkit-details-marker{display:none}.history-summary-meta{font-size:11px;font-weight:500;color:#69737d}.history-body{padding:12px}.history-overview{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:8px;margin-bottom:12px}.history-stat{border:1px solid #e3e8eb;background:#fafbfc;padding:9px}.history-stat span{display:block;font-size:10px;color:#69737d;margin-bottom:3px}.history-stat b{font-size:13px}.history-trend{display:inline-block;padding:3px 6px;font-size:11px;border:1px solid #d8e0e4;background:#f5f7f8}.history-trend.growth{background:#eaf5ee;border-color:#cbe1d3;color:#24593e}.history-trend.decline{background:#fff1f1;border-color:#e7c7c7;color:#762828}.history-trend.stable{background:#f3f5f6;color:#56616c}.history-first{font-size:12px;color:#69737d;padding:7px 0}.history-timeline{border-top:1px solid #edf0f2;padding-top:6px}.history-event{display:grid;grid-template-columns:90px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #f0f2f3;font-size:12px}.history-event:last-child{border-bottom:0}.history-date{color:#69737d}.history-event-title{font-weight:700;margin-bottom:3px}.history-event-detail{color:#56616c;line-height:1.45}.history-growth .history-event-title{color:#24593e}.history-decline .history-event-title{color:#762828}
@media(max-width:760px){.history-overview{grid-template-columns:repeat(2,1fr)}.history-event{grid-template-columns:1fr;gap:3px}}
`;
document.head.appendChild(style);

function escH(v){return typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function loadDb(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function saveDb(db){try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){console.warn('SCOUT_HISTORY_SAVE',e);return false}}
function uniq(a){return [...new Set((a||[]).map(x=>String(x||'').trim()).filter(Boolean))]}
function roleLabel(r){if(typeof r==='string')return r;return r?.label||r?.role||r?.name||r?.title||r?.category||''}
function locationLabel(j){const r=j?.raw||{};return j?.location||j?.locationLabel||j?.city||j?.area||j?.town||r?.town?.title||r?.address||r?.place_of_work||''}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function runKey(){const r=window.latestRun||{};return String(r.id||r.run_id||r.runId||r.started_at||r.startedAt||r.finished_at||r.finishedAt||r.created_at||r.createdAt||'daily:'+new Date().toISOString().slice(0,10))}
function snapshot(l){
 const m=l?.metrics||{},c=l?.company||{},jobs=l?.jobs||[];
 const roles=uniq((m.roleSummary||[]).map(roleLabel)).slice(0,20);
 const locations=uniq(jobs.map(locationLabel)).slice(0,20);
 return {
  runKey:runKey(),
  date:new Date().toISOString(),
  provider:uniq(l?.providers||m.providers||[]).join(', '),
  vacancies:num(m.relevantJobs||jobs.length),
  totalVacancies:num(m.totalVacancies||c?.raw?.totalVacancies),
  fresh7d:num(m.newJobs7d),
  demand:num(m.demandScore),
  sales:num(m.salesPriority??m.salesPriorityScore??l?.score),
  roles,locations,
  contacts:{site:c.site||'',phone:c.public_phone||'',email:c.public_email||''}
 };
}
function arrDiff(a,b){const s=new Set(b||[]);return (a||[]).filter(x=>!s.has(x))}
function compare(prev,next){
 if(!prev)return {type:'first',title:'Компания впервые зафиксирована',details:['Создан базовый снимок для будущего сравнения.']};
 const dv=next.vacancies-prev.vacancies,dd=next.demand-prev.demand,ds=next.sales-prev.sales;
 const newRoles=arrDiff(next.roles,prev.roles),goneRoles=arrDiff(prev.roles,next.roles),newLoc=arrDiff(next.locations,prev.locations),goneLoc=arrDiff(prev.locations,next.locations);
 const gained=[];
 if(!prev.contacts?.phone&&next.contacts?.phone)gained.push('телефон');
 if(!prev.contacts?.email&&next.contacts?.email)gained.push('email');
 if(!prev.contacts?.site&&next.contacts?.site)gained.push('сайт');
 const details=[];
 if(dv)details.push(`Целевые вакансии: ${prev.vacancies} → ${next.vacancies} (${dv>0?'+':''}${dv})`);
 if(dd)details.push(`Потребность: ${prev.demand} → ${next.demand} (${dd>0?'+':''}${dd})`);
 if(ds)details.push(`Приоритет: ${prev.sales} → ${next.sales} (${ds>0?'+':''}${ds})`);
 if(newRoles.length)details.push(`Новые роли: ${newRoles.join(', ')}`);
 if(goneRoles.length)details.push(`Исчезли роли: ${goneRoles.join(', ')}`);
 if(newLoc.length)details.push(`Новые локации: ${newLoc.join(', ')}`);
 if(goneLoc.length)details.push(`Исчезли локации: ${goneLoc.join(', ')}`);
 if(gained.length)details.push(`Найдены новые контакты: ${gained.join(', ')}`);
 let type='stable',title='Без существенных изменений';
 if(dv>=2||dd>=5||ds>=5){type='growth';title='Рост активности найма'}
 else if(dv<=-2||dd<=-5||ds<=-5){type='decline';title='Снижение активности найма'}
 else if(details.length){type='change';title='Данные компании изменились'}
 return {type,title,details};
}
function saveLead(l){
 if(!l?.company_id)return null;
 const db=loadDb(),list=Array.isArray(db[l.company_id])?db[l.company_id]:[],next=snapshot(l),same=list.findIndex(x=>x.runKey===next.runKey);
 if(same>=0){
  // Same market scan: refresh the snapshot (contacts/score may have been enriched) without creating fake history.
  const prev=same>0?list[same-1]:null;
  next.diff=compare(prev,next);list[same]=next;
 }else{
  next.diff=compare(list[list.length-1],next);list.push(next);
 }
 db[l.company_id]=list.slice(-MAX_PER_COMPANY);saveDb(db);return next;
}
function captureCurrent(){const list=window.currentLeads||[];if(!Array.isArray(list)||!list.length)return;list.forEach(saveLead)}
function get(id){const db=loadDb();return Array.isArray(db[id])?db[id]:[]}
function stats(list){
 if(!list.length)return null;const first=list[0],last=list[list.length-1],days=Math.max(0,Math.round((new Date(last.date)-new Date(first.date))/86400000)),maxVac=Math.max(...list.map(x=>num(x.vacancies))),avgDemand=Math.round(list.reduce((s,x)=>s+num(x.demand),0)/list.length);return{checks:list.length,days,maxVac,avgDemand,trend:last.diff?.type||'first'}
}
function trendLabel(t){return t==='growth'?'Растёт':t==='decline'?'Снижается':t==='change'?'Изменилось':t==='first'?'База':'Стабильно'}
function dateRu(v){try{return new Date(v).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit'})}catch{return ''}}
function historyHtml(id){
 const list=get(id),s=stats(list);if(!s)return '';
 const last=list[list.length-1],events=[...list].reverse().slice(0,8);
 return `<details class="company-history-panel"><summary><span>История активности</span><span class="history-summary-meta">${s.checks} ${s.checks===1?'снимок':'снимков'} · ${trendLabel(s.trend)}</span></summary><div class="history-body">
 <div class="history-overview"><div class="history-stat"><span>Проверок</span><b>${s.checks}</b></div><div class="history-stat"><span>Наблюдаем</span><b>${s.days?s.days+' дн.':'первый день'}</b></div><div class="history-stat"><span>Максимум целевых</span><b>${s.maxVac}</b></div><div class="history-stat"><span>Средняя потребность</span><b>${s.avgDemand}/100</b></div></div>
 <div><span class="history-trend ${escH(s.trend)}">${escH(trendLabel(s.trend))}</span></div>
 ${list.length===1?'<div class="history-first">Это первый снимок. После следующего запуска Scout здесь появится реальная динамика: новые/закрытые вакансии, роли, локации и изменение баллов.</div>':''}
 <div class="history-timeline">${events.map(x=>{const d=x.diff||{},det=(d.details||[]).join(' · ');return `<div class="history-event history-${escH(d.type||'stable')}"><div class="history-date">${escH(dateRu(x.date))}</div><div><div class="history-event-title">${escH(d.title||'Снимок компании')}</div>${det?`<div class="history-event-detail">${escH(det)}</div>`:''}<div class="history-event-detail">Целевых: ${num(x.vacancies)} · Потребность: ${num(x.demand)} · Приоритет: ${num(x.sales)}</div></div></div>`}).join('')}</div>
 </div></details>`;
}
function idFromCard(card){const b=card.querySelector('.actions button[onclick*="setStatus"]');const s=b?.getAttribute('onclick')||'';const m=s.match(/setStatus\('([^']+)'/);if(!m)return'';try{return decodeURIComponent(m[1])}catch{return m[1]}}
function injectCard(card){
 if(card.querySelector('.company-history-panel'))return;const id=idFromCard(card);if(!id)return;const body=card.querySelector('.lead-body');if(!body)return;const html=historyHtml(id);if(!html)return;const jobs=body.querySelector('.jobs-title');if(jobs)jobs.insertAdjacentHTML('beforebegin',html);else{const actions=body.querySelector('.actions');if(actions)actions.insertAdjacentHTML('beforebegin',html);else body.insertAdjacentHTML('beforeend',html)}
}
function injectAll(){document.querySelectorAll('.lead').forEach(injectCard)}
function schedule(){captureCurrent();requestAnimationFrame(injectAll);setTimeout(injectAll,80)}
const original=window.renderLeads;
if(typeof original==='function')window.renderLeads=function(){const r=original.apply(this,arguments);schedule();return r};
const observer=new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.lead')||n.querySelector?.('.lead')))))schedule()});
observer.observe(document.getElementById('current-leads')||document.body,{subtree:true,childList:true});
observer.observe(document.getElementById('history-leads')||document.body,{subtree:true,childList:true});
window.ScoutHistory={captureCurrent,saveLead,get,stats,clear(id){const db=loadDb();if(id)delete db[id];else Object.keys(db).forEach(k=>delete db[k]);saveDb(db)}};
schedule();
})();
