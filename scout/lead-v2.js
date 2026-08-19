(()=>{
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
load('lead-card-v3.js?v=2').then(()=>load('lead-filters.js?v=2')).then(()=>{try{renderLeads()}catch{}}).catch(()=>{try{renderLeads()}catch{}});
})();
