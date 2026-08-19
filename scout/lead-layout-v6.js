(()=>{
const style=document.createElement('style');
style.textContent=`
.lead-columns.layout-v6{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;align-items:start!important;width:100%!important;margin-top:12px!important}
.lead-columns.layout-v6>.subsection{margin:0!important;width:100%!important;min-width:0!important;height:auto!important}
.lead-columns.layout-v6>.layout-col-v6{display:contents!important}
.jobs-title{width:100%!important;clear:both!important;margin:16px 0 8px!important;padding-top:14px!important;border-top:1px solid #e3e8eb!important}
.job-group{width:100%!important;max-width:none!important}
.actions{width:100%!important;clear:both!important}
@media(max-width:760px){.lead-columns.layout-v6{grid-template-columns:1fr!important}}
`;
document.head.appendChild(style);

function flattenCard(card){
 const grid=card.querySelector('.lead-body .lead-columns');
 if(!grid)return;
 const sections=[...grid.querySelectorAll(':scope .subsection')];
 if(!sections.length)return;
 // Переносим все смысловые карточки непосредственно в одну grid-сетку.
 sections.forEach(sec=>grid.appendChild(sec));
 [...grid.children].forEach(ch=>{
   if(!ch.classList.contains('subsection'))ch.remove();
 });
 grid.classList.add('layout-v6');
}
function applyAll(){document.querySelectorAll('.lead').forEach(flattenCard)}

const original=window.renderLeads;
if(typeof original==='function'){
 window.renderLeads=function(){const r=original.apply(this,arguments);requestAnimationFrame(applyAll);setTimeout(applyAll,30);return r};
}
new MutationObserver(()=>requestAnimationFrame(applyAll)).observe(document.documentElement,{subtree:true,childList:true});
requestAnimationFrame(applyAll);
setTimeout(applyAll,100);
})();
