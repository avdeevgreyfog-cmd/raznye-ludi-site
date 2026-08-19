(()=>{
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
load('lead-card-v4.js?v=2').then(()=>load('lead-filters.js?v=6')).then(()=>load('lead-layout-v7.js?v=1')).then(()=>{try{renderLeads()}catch{}}).catch(()=>{try{renderLeads()}catch{}});
})();
