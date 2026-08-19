(()=>{
function scoreOf(l){return Number(l?.metrics?.salesPriority??l?.metrics?.salesPriorityScore??l?.score??0)}
function demandOf(l){return Number(l?.metrics?.demandScore??0)}
function industryOf(l){return String(l?.metrics?.businessDirectionLabel||l?.metrics?.industry||l?.explanation?.industry||'Другое')}
let selectedIndustries=new Set();
function repairCurrentBucket(){
  if((currentLeads||[]).length || !(historyLeads||[]).length || !latestRun?.started_at)return;
  const since=Date.parse(latestRun.started_at);if(!Number.isFinite(since))return;
  const cur=[],hist=[];
  for(const l of historyLeads||[]){const t=Date.parse(l?.lastSignalAt||'');if(Number.isFinite(t)&&t>=since)cur.push(l);else hist.push(l)}
  if(cur.length){currentLeads=cur;historyLeads=hist}
}
function industryValues(){return [...new Set([...(currentLeads||[]),...(historyLeads||[])].map(industryOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'))}
function updateIndustryButton(){const b=document.getElementById('lead-industry-btn');if(!b)return;const n=selectedIndustries.size;if(!n)b.textContent='Все отрасли';else if(n===1)b.textContent=[...selectedIndustries][0];else b.textContent='Отрасли: '+n;b.title=n?[...selectedIndustries].join(', '):'Показаны все отрасли'}
function setAllIndustries(){selectedIndustries.clear();fillIndustries();renderLeads()}
function toggleIndustryPanel(force){const p=document.getElementById('lead-industry-panel');if(!p)return;const show=typeof force==='boolean'?force:p.classList.contains('hidden');p.classList.toggle('hidden',!show)}
function ensureToolbar(){
 if(document.getElementById('lead-toolbar-v2'))return;
 const host=document.getElementById('current-leads');if(!host)return;
 const bar=document.createElement('div');bar.id='lead-toolbar-v2';bar.className='lead-toolbar-v2';
 bar.innerHTML=`<div class="lead-tools-row">
  <input id="lead-search" class="input" placeholder="Поиск компании или роли">
  <div id="lead-industry-multi" class="industry-multi">
    <button id="lead-industry-btn" class="input industry-btn" type="button">Все отрасли</button>
    <div id="lead-industry-panel" class="industry-panel hidden">
      <div class="industry-actions"><button type="button" id="industry-all">Все</button><button type="button" id="industry-clear">Сбросить</button></div>
      <div id="lead-industry-options" class="industry-options"></div>
    </div>
  </div>
  <select id="lead-min-score" class="input"><option value="35" selected>Приоритет 35+</option><option value="55">Приоритет 55+</option><option value="70">Приоритет 70+</option><option value="0">Показать все</option></select>
  <select id="lead-sort" class="input"><option value="sales">Сортировка: приоритет</option><option value="demand">Сортировка: потребность</option><option value="fresh">Сортировка: свежесть</option><option value="jobs">Сортировка: целевые вакансии</option></select>
  <button id="lead-reset" class="btn ghost" type="button">Сбросить</button>
 </div><div id="lead-count" class="runmeta"></div>`;
 host.parentNode.insertBefore(bar,host);
 const st=document.createElement('style');st.textContent=`
 .lead-toolbar-v2{margin:13px 0 9px;padding:10px;background:#f7f9fa;border:1px solid #e1e6e9}
 .lead-tools-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
 .lead-tools-row .input{min-width:170px}.lead-tools-row #lead-search{min-width:240px;flex:1}.lead-toolbar-v2 .runmeta{margin-top:7px}
 .industry-multi{position:relative;min-width:190px}.industry-btn{width:100%;text-align:left;cursor:pointer;padding-right:30px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative}
 .industry-btn:after{content:'⌄';position:absolute;right:10px;top:8px;color:#69737d}
 .industry-panel{position:absolute;left:0;top:calc(100% + 4px);z-index:30;width:310px;max-width:85vw;background:#fff;border:1px solid #cbd3d9;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:9px}
 .industry-panel.hidden{display:none}.industry-actions{display:flex;gap:7px;padding-bottom:7px;border-bottom:1px solid #edf0f2;margin-bottom:5px}.industry-actions button{border:1px solid #cdd4d9;background:#fff;padding:5px 8px;cursor:pointer}
 .industry-options{max-height:280px;overflow:auto}.industry-option{display:flex;gap:8px;align-items:flex-start;padding:7px 4px;font-size:13px;cursor:pointer}.industry-option:hover{background:#f5f7f8}.industry-option input{margin-top:2px}.industry-option span{line-height:1.3}
 @media(max-width:700px){.lead-tools-row .input,.lead-tools-row #lead-search,.industry-multi{width:100%;min-width:0}.industry-panel{width:100%;max-width:none}}
 `;document.head.appendChild(st);
 ['lead-min-score','lead-sort'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderLeads()));
 document.getElementById('lead-search').addEventListener('input',()=>renderLeads());
 document.getElementById('lead-industry-btn').addEventListener('click',e=>{e.stopPropagation();toggleIndustryPanel()});
 document.getElementById('lead-industry-panel').addEventListener('click',e=>e.stopPropagation());
 document.getElementById('industry-all').addEventListener('click',()=>setAllIndustries());
 document.getElementById('industry-clear').addEventListener('click',()=>setAllIndustries());
 document.addEventListener('click',()=>toggleIndustryPanel(false));
 document.getElementById('lead-reset').addEventListener('click',()=>{document.getElementById('lead-search').value='';selectedIndustries.clear();document.getElementById('lead-min-score').value='35';document.getElementById('lead-sort').value='sales';const p=document.getElementById('filter');if(p)p.value='all';fillIndustries();renderLeads()});
}
function fillIndustries(){
 const box=document.getElementById('lead-industry-options');if(!box)return;
 const vals=industryValues(),allowed=new Set(vals);selectedIndustries=new Set([...selectedIndustries].filter(v=>allowed.has(v)));
 box.innerHTML=vals.length?vals.map(v=>`<label class="industry-option"><input type="checkbox" value="${esc(v)}" ${selectedIndustries.has(v)?'checked':''}><span>${esc(v)}</span></label>`).join(''):'<div class="muted" style="padding:7px">Отрасли пока не определены</div>';
 box.querySelectorAll('input[type=checkbox]').forEach(ch=>ch.addEventListener('change',e=>{const v=e.target.value;if(e.target.checked)selectedIndustries.add(v);else selectedIndustries.delete(v);updateIndustryButton();renderLeads()}));
 updateIndustryButton();
}
renderLeads=function(){
 repairCurrentBucket();ensureToolbar();fillIndustries();
 const priority=document.getElementById('filter')?.value||'all';
 const q=(document.getElementById('lead-search')?.value||'').trim().toLowerCase();
 const minScore=Number(document.getElementById('lead-min-score')?.value||0);
 const sort=document.getElementById('lead-sort')?.value||'sales';
 const apply=rows=>(rows||[]).filter(l=>{
   if(priority!=='all'&&l.priority!==priority)return false;
   if(scoreOf(l)<minScore)return false;
   if(selectedIndustries.size&&!selectedIndustries.has(industryOf(l)))return false;
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
repairCurrentBucket();ensureToolbar();fillIndustries();setTimeout(()=>renderLeads(),0);
})();
