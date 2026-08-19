(()=>{
const style=document.createElement('style');
style.textContent=`
.lead-body{display:block!important}
.lead-columns{display:grid!important;grid-template-columns:minmax(0,1.12fr) minmax(340px,.88fr)!important;gap:14px!important;align-items:start!important;width:100%!important;margin-top:12px!important}
.lead-columns>div{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;align-content:start!important;min-width:0!important;width:100%!important}
.lead-columns .subsection{margin:0!important;width:100%!important;min-width:0!important}
.lead-columns .subsection h4{margin-bottom:9px!important}
.jobs-title{width:100%!important;clear:both!important;margin:16px 0 8px!important;padding-top:14px!important;border-top:1px solid #e3e8eb!important}
.job-group{width:100%!important;max-width:none!important}
.actions{width:100%!important;clear:both!important;margin-top:14px!important}
.lead-kpis.v4{margin-bottom:0!important}
@media(max-width:980px){.lead-columns{grid-template-columns:1fr!important}.lead-columns>div{width:100%!important}}
`;
document.head.appendChild(style);

function headingOf(section){return (section?.querySelector('h4')?.textContent||'').trim().toLowerCase()}
function normalizeLead(card){
 const body=card.querySelector('.lead-body');
 const grid=body?.querySelector('.lead-columns');
 if(!body||!grid)return;
 let cols=[...grid.children].filter(x=>x.nodeType===1);
 if(cols.length<2){const col=document.createElement('div');grid.appendChild(col);cols=[...grid.children].filter(x=>x.nodeType===1)}
 const left=cols[0],right=cols[1];
 const sections=[...grid.querySelectorAll('.subsection')];
 for(const sec of sections){
   const h=headingOf(sec);
   if(h.includes('почему стоит')||h.includes('признаки массового')) left.appendChild(sec);
   else if(h.includes('компания и контакты')||h.includes('ограничения')) right.appendChild(sec);
 }
 // Все блоки вакансий должны идти только после информационной сетки на всю ширину.
 const jobsTitle=body.querySelector('.jobs-title');
 const actions=body.querySelector('.actions');
 if(jobsTitle&&grid.contains(jobsTitle)) body.insertBefore(jobsTitle,actions||null);
 const nestedJobs=[...grid.querySelectorAll('.job-group')];
 if(nestedJobs.length){
   let anchor=jobsTitle;
   nestedJobs.forEach(j=>{if(anchor?.nextSibling)body.insertBefore(j,anchor.nextSibling);else body.appendChild(j);anchor=j});
 }
}
function normalizeAll(){document.querySelectorAll('.lead').forEach(normalizeLead)}
const prev=window.renderLeads;
if(typeof prev==='function'){
 window.renderLeads=function(){const r=prev.apply(this,arguments);setTimeout(normalizeAll,0);return r}
}
setTimeout(normalizeAll,0);
})();
