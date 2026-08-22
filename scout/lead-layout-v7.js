(()=>{
if(window.__scoutLayoutV7)return;window.__scoutLayoutV7=true;
const style=document.createElement('style');
style.textContent=`
.lead-columns.layout-v7{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;align-items:start!important;width:100%!important;margin-top:12px!important}
.lead-columns.layout-v7>.subsection{margin:0!important;width:100%!important;min-width:0!important;height:auto!important}
.jobs-title.layout-v7-jobs{display:flex!important;width:100%!important;clear:both!important;margin:16px 0 8px!important;padding-top:14px!important;border-top:1px solid #e3e8eb!important}
.job-group.layout-v7-job{display:block!important;width:100%!important;max-width:none!important;margin:6px 0!important}
.actions.layout-v7-actions{display:flex!important;width:100%!important;clear:both!important;margin-top:14px!important}
@media(max-width:760px){.lead-columns.layout-v7{grid-template-columns:1fr!important}}
`;
document.head.appendChild(style);
function flattenCard(card){if(card.dataset.layoutV7==='done')return;const body=card.querySelector('.lead-body'),grid=body?.querySelector('.lead-columns');if(!body||!grid)return;const jobsTitle=body.querySelector('.jobs-title'),jobGroups=[...body.querySelectorAll('.job-group')],actions=body.querySelector('.actions'),sections=[...grid.querySelectorAll('.subsection')];if(!sections.length)return;sections.forEach(sec=>grid.appendChild(sec));[...grid.children].forEach(ch=>{if(!ch.classList.contains('subsection'))ch.remove()});grid.classList.add('layout-v7');let anchor=grid;if(jobsTitle){jobsTitle.classList.add('layout-v7-jobs');anchor.insertAdjacentElement('afterend',jobsTitle);anchor=jobsTitle}jobGroups.forEach(group=>{group.classList.add('layout-v7-job');anchor.insertAdjacentElement('afterend',group);anchor=group});if(actions){actions.classList.add('layout-v7-actions');anchor.insertAdjacentElement('afterend',actions)}card.dataset.layoutV7='done'}
function applyAll(){document.querySelectorAll('.lead').forEach(flattenCard)}
const original=window.renderLeads;if(typeof original==='function')window.renderLeads=function(){const r=original.apply(this,arguments);requestAnimationFrame(applyAll);return r};
const observer=new MutationObserver(mutations=>{if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.lead')||n.querySelector?.('.lead')))))requestAnimationFrame(applyAll)});
const cur=document.getElementById('current-leads'),hist=document.getElementById('history-leads');if(cur)observer.observe(cur,{subtree:true,childList:true});if(hist)observer.observe(hist,{subtree:true,childList:true});requestAnimationFrame(applyAll);
function loadOnce(attr,src){if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.setAttribute(attr,'1');s.src=src;s.onerror=()=>console.error('MODULE_LOAD_FAILED',src);document.body.appendChild(s)}
loadOnce('data-scout-contact-intel-v8','contact-intel-v1.js?v=8');
loadOnce('data-scout-company-history-v4','company-history-v1.js?v=4');
loadOnce('data-scout-monitoring-v2','monitoring-v1.js?v=2');
loadOnce('data-scout-scan-guard-v2','scan-guard-v1.js?v=2');
loadOnce('data-scout-main-ui-v2','main-ui-v1.js?v=2');
})();
