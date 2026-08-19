(()=>{
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
// Main Scout keeps these as top-level `let`, so they are not properties of window.
// Expose read-only getters for extension modules such as contact intelligence.
try{
  Object.defineProperty(window,'currentLeads',{configurable:true,get:()=>currentLeads});
  Object.defineProperty(window,'historyLeads',{configurable:true,get:()=>historyLeads});
}catch{}
load('lead-card-v4.js?v=2')
  .then(()=>load('lead-filters.js?v=6'))
  .then(()=>load('contact-intel-v1.js?v=4'))
  .then(()=>load('lead-layout-v7.js?v=2'))
  .then(()=>{try{renderLeads()}catch{}})
  .catch(()=>{try{renderLeads()}catch{}});
})();
