(()=>{
function scoreOf(l){return Number(l?.metrics?.salesPriorityScore??l?.score??0)}
function demandOf(l){return Number(l?.metrics?.demandScore??0)}
function industryOf(l){return String(l?.metrics?.industry||l?.explanation?.industry||'Другое')}
function ensureToolbar(){
 if(document.getElementById('lead-toolbar-v2'))return;
 const host=document.getElementById('current-leads');if(!host)return;
 const bar=document.createElement('div');bar.id='lead-toolbar-v2';bar.className='lead-toolbar-v2';
 bar.innerHTML=`<div class="lead-tools-row">
  <input id="lead-search" class="input" placeholder="Поиск компании или роли">
  <select id="lead-industry" class="input"><option value="all">Все отрасли</option></select>
  <select id="lead-min-score" class="input"><option value="35" selected>Приоритет 35+</option><option value="55">Приоритет 55+</option><option value="70">Приоритет 70+</option><option value="0">Показать все</option></select>
  <select id="lead-sort" class="input"><option value="sales">Сортировка: приоритет</option><option value="demand">Сортировка: потребность</option><option value="fresh">Сортировка: свежесть</option><option value="jobs">Сортировка: целевые вакансии</option></select>
  <button id="lead-reset" class="btn ghost" type="button">Сбросить</button>
 </div><div id="lead-count" class="runmeta"></div>`;
 host.parentNode.insertBefore(bar,host);
 const st=document.createElement('style');st.textContent=`.lead-toolbar-v2{margin:13px 0 9px;padding:10px;background:#f7f9fa;border:1px solid #e1e6e9}.lead-tools-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.lead-tools-row .input{min-width:170px}.lead-tools-row #lead-search{min-width:240px;flex:1}.lead-toolbar-v2 .runmeta{margin-top:7px}@media(max-width:700px){.lead-tools-row .input,.lead-tools-row #lead-search{width:100%;min-width:0}}`;document.head.appendChild(st);
 ['lead-industry','lead-min-score','lead-sort'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderLeads()));
 document.getElementById('lead-search').addEventListener('input',()=>renderLeads());
 document.getElementById('lead-reset').addEventListener('click',()=>{document.getElementById('lead-search').value='';document.getElementById('lead-industry').value='all';document.getElementById('lead-min-score').value='35';document.getElementById('lead-sort').value='sales';const p=document.getElementById('filter');if(p)p.value='all';renderLeads()});
}
function fillIndustries(){const s=document.getElementById('lead-industry');if(!s)return;const current=s.value||'all';const vals=[...new Set([...(currentLeads||[]),...(historyLeads||[])].map(industryOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));s.innerHTML='<option value="all">Все отрасли</option>'+vals.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');if(vals.includes(current))s.value=current}
const baseRender=renderLeads;
renderLeads=function(){
 ensureToolbar();fillIndustries();
 const priority=document.getElementById('filter')?.value||'all';
 const q=(document.getElementById('lead-search')?.value||'').trim().toLowerCase();
 const industry=document.getElementById('lead-industry')?.value||'all';
 const minScore=Number(document.getElementById('lead-min-score')?.value||0);
 const sort=document.getElementById('lead-sort')?.value||'sales';
 const apply=rows=>(rows||[]).filter(l=>{
   if(priority!=='all'&&l.priority!==priority)return false;
   if(scoreOf(l)<minScore)return false;
   if(industry!=='all'&&industryOf(l)!==industry)return false;
   if(q){const c=l.company||{},roles=(l.metrics?.roleSummary||[]).map(r=>r.label).join(' '),hay=(String(c.name||'')+' '+industryOf(l)+' '+roles).toLowerCase();if(!hay.includes(q))return false}
   return true;
 }).sort((a,b)=>{
   if(sort==='demand')return demandOf(b)-demandOf(a)||scoreOf(b)-scoreOf(a);
   if(sort==='fresh')return Number(b.metrics?.newJobs7d||0)-Number(a.metrics?.newJobs7d||0)||scoreOf(b)-scoreOf(a);
   if(sort==='jobs')return Number(b.metrics?.relevantJobs||0)-Number(a.metrics?.relevantJobs||0)||scoreOf(b)-scoreOf(a);
   return scoreOf(b)-scoreOf(a)||demandOf(b)-demandOf(a)
 });
 const cur=apply(currentLeads),hist=apply(historyLeads);
 document.getElementById('current-leads').innerHTML=cur.length?cur.map(leadHtml).join(''):'<div class="empty">По выбранным фильтрам компаний нет.</div>';
 document.getElementById('history-title').textContent='Исторические сигналы ('+hist.length+')';
 document.getElementById('history-leads').innerHTML=hist.length?hist.map(leadHtml).join(''):'<div class="empty">По выбранным фильтрам истории нет.</div>';
 const total=(currentLeads||[]).length,count=document.getElementById('lead-count');if(count)count.textContent=`Показано ${cur.length} из ${total} компаний последнего запуска. По умолчанию скрыты слабые лиды ниже 35/100.`;
};
ensureToolbar();fillIndustries();setTimeout(()=>renderLeads(),0);
})();
