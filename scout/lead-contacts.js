(()=>{
const style=document.createElement('style');
style.textContent=`
.summary-contact-line{margin-top:6px;font-size:11px;color:#69737d;display:flex;gap:6px;align-items:center;flex-wrap:wrap;line-height:1.35}
.summary-contact-line .contact-label{color:#8a939b}
.summary-contact-line a{color:#1f654d;text-decoration:none;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.summary-contact-line a:hover{text-decoration:underline}
.contacts.contact-detail{margin-top:10px;padding-top:9px;border-top:1px solid #e8ecef;line-height:1.65}
.contacts.contact-detail:before{content:'Контакты: ';font-weight:700;color:#26313b}
@media(max-width:720px){.summary-contact-line{font-size:10px}.summary-contact-line a{max-width:180px}}
`;
document.head.appendChild(style);

function siteHostname(href){try{return new URL(href,location.href).hostname.replace(/^www\./,'')}catch{return 'Сайт'}}
function decorateContacts(){
 document.querySelectorAll('.lead').forEach(card=>{
  const detail=card.querySelector('.lead-body .contacts');
  if(!detail)return;
  detail.classList.add('contact-detail');
  const summary=card.querySelector('summary');
  const companyBlock=summary?.firstElementChild;
  if(!companyBlock||companyBlock.querySelector('.summary-contact-line'))return;
  const compact=detail.cloneNode(true);
  compact.className='summary-contact-line';
  compact.removeAttribute('style');
  const site=compact.querySelector('a:not([href^="mailto:"])');
  if(site)site.textContent=siteHostname(site.getAttribute('href')||site.href);
  compact.querySelectorAll('a').forEach(a=>a.setAttribute('title',a.getAttribute('href')||a.textContent||''));
  compact.addEventListener('click',e=>e.stopPropagation());
  compact.addEventListener('mousedown',e=>e.stopPropagation());
  companyBlock.appendChild(compact);
 });
}
const baseRender=renderLeads;
renderLeads=function(){const r=baseRender.apply(this,arguments);setTimeout(decorateContacts,0);return r};
setTimeout(decorateContacts,0);
})();
