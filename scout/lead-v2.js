(()=>{
if(window.__scoutLeadLoaderV3)return;window.__scoutLeadLoaderV3=true;
function load(src,attr){return new Promise((resolve,reject)=>{if(attr&&document.querySelector(`script[${attr}]`)){resolve();return}const s=document.createElement('script');if(attr)s.setAttribute(attr,'1');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
try{
  Object.defineProperty(window,'currentLeads',{configurable:true,get:()=>currentLeads});
  Object.defineProperty(window,'historyLeads',{configurable:true,get:()=>historyLeads});
  Object.defineProperty(window,'latestRun',{configurable:true,get:()=>latestRun});
}catch{}
load('lead-card-v4.js?v=2','data-scout-lead-card-v4')
  .then(()=>load('lead-filters.js?v=6','data-scout-lead-filters-v6'))
  .then(()=>load('lead-layout-v7.js?v=4','data-scout-lead-layout-v7'))
  .then(()=>{try{renderLeads()}catch(e){console.error('SCOUT_RENDER',e)}})
  .catch(e=>{console.error('SCOUT_MODULE_LOAD',e);try{renderLeads()}catch{}});
})();
