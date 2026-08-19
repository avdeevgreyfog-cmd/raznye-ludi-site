(()=>{
const style=document.createElement('style');
style.textContent=`
.contact-intel-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.contact-intel-head h4{margin:0}.contact-intel-actions{display:flex;gap:6px;flex-wrap:wrap}.contact-intel-btn{border:1px solid #cbd3d9;background:#fff;padding:6px 9px;cursor:pointer;font-size:12px}.contact-intel-btn.primary{background:#1f654d;color:#fff;border-color:#1f654d}.contact-intel-btn:disabled{opacity:.55;cursor:not-allowed}.contact-intel-status{font-size:12px;color:#69737d;margin-top:7px;line-height:1.45}.contact-intel-result{margin-top:9px}.contact-purpose{border-top:1px solid #edf0f2;padding-top:8px;margin-top:8px}.contact-purpose:first-child{border-top:0;padding-top:0}.contact-purpose-title{font-weight:700;font-size:12px;margin-bottom:5px}.intel-contact-row{display:grid;grid-template-columns:minmax(90px,.8fr) minmax(160px,1.5fr) auto;gap:8px;align-items:center;font-size:12px;padding:4px 0}.intel-contact-row a{color:#1f654d;word-break:break-word}.intel-source{font-size:11px;color:#69737d}.intel-confidence{font-size:10px;border:1px solid #d7dee3;padding:2px 5px;background:#f7f9fa;white-space:nowrap}.intel-empty{font-size:12px;color:#69737d;line-height:1.5}.intel-note{font-size:11px;color:#69737d;margin-top:7px}.intel-error{font-size:12px;color:#762828;background:#fff1f1;border:1px solid #e7c7c7;padding:7px 8px;margin-top:7px}
@media(max-width:760px){.intel-contact-row{grid-template-columns:1fr}.contact-intel-head{display:block}.contact-intel-actions{margin-top:8px}}
`;
document.head.appendChild(style);

const purposeLabels={hr:'HR / подбор',career:'Карьера',procurement:'Закупки',tender:'Тендеры',supplier:'Поставщикам',general:'Общие контакты',unknown:'Другое'};
const channelLabels={phone:'Телефон',email:'Email',url:'Страница'};
function e(v){return typeof esc==='function'?esc(v):String(v??'')}
function valueHtml(c){if(c.channel==='email')return `<a href="mailto:${e(c.value)}">${e(c.value)}</a>`;if(c.channel==='phone')return `<a href="tel:${e(c.value)}">${e(c.value)}</a>`;return `<a href="${e(c.value)}" target="_blank" rel="noopener">${e(c.label||'Открыть страницу')}</a>`}
function relevantContacts(rows,company){const pubPhone=String(company?.public_phone||'').replace(/\D/g,''),pubEmail=String(company?.public_email||'').toLowerCase();return (rows||[]).filter(c=>{
  if(c.purpose!=='general'&&c.purpose!=='unknown')return true;
  if(c.channel==='phone'&&pubPhone&&String(c.value||'').replace(/\D/g,'')===pubPhone)return false;
  if(c.channel==='email'&&pubEmail&&String(c.value||'').toLowerCase()===pubEmail)return false;
  return c.channel!=='url';
})}
function renderContacts(el,data){const company=data.company||{},rows=relevantContacts(data.contacts||[],company);const groups=new Map();for(const c of rows){const k=c.purpose||'unknown',a=groups.get(k)||[];a.push(c);groups.set(k,a)}
  let html='';for(const [purpose,list] of groups){html+=`<div class="contact-purpose"><div class="contact-purpose-title">${e(purposeLabels[purpose]||purpose)}</div>`+list.map(c=>`<div class="intel-contact-row"><div>${e(channelLabels[c.channel]||c.channel)}</div><div>${valueHtml(c)}<div class="intel-source">Источник: <a href="${e(c.source_url)}" target="_blank" rel="noopener">${e(c.source_title||'страница сайта')}</a></div></div><div><span class="intel-confidence">${Number(c.confidence||0)}%</span></div></div>`).join('')+'</div>'}
  if(!html)html='<div class="intel-empty">Целевых контактов HR/закупок/тендеров пока не найдено. Если Scout нашёл только общий телефон или email, они сохраняются в блоке «Компания и контакты».</div>';
  const en=data.enrichment||{};const meta=en.checkedAt?`Последняя проверка: ${new Date(en.checkedAt).toLocaleString('ru-RU')} · страниц проверено: ${Number(en.pagesChecked||0)}`:'';
  el.innerHTML=html+(meta?`<div class="intel-note">${e(meta)}</div>`:'');
}
function blockHtml(l){const c=l.company||{},raw=c.raw||{},en=raw.contactEnrichment||null,id=encodeURIComponent(l.company_id),hasSite=!!c.site;const checked=en?.status==='done';return `<div class="subsection contact-intel" data-company-id="${e(l.company_id)}"><div class="contact-intel-head"><div><h4>Контактная разведка</h4><div class="contact-intel-status">${checked?`Проверено · найдено ${Number(en.contactsFound||0)} контактов · ${Number(en.pagesChecked||0)} страниц`:'Ищем контакты только на официальном сайте и сохраняем источник каждого результата.'}</div></div><div class="contact-intel-actions">${checked?`<button class="contact-intel-btn" onclick="event.preventDefault();event.stopPropagation();ScoutContacts.load('${id}',this)">Показать сохранённые</button>`:''}<button class="contact-intel-btn primary" ${hasSite?'':'disabled'} onclick="event.preventDefault();event.stopPropagation();ScoutContacts.enrich('${id}',this)">${checked?'Обновить поиск':'Найти контакты'}</button></div></div><div class="contact-intel-result">${hasSite?'':`<div class="intel-empty">Нет официального сайта — автоматический поиск пока недоступен.</div>`}</div></div>`}

const base=window.leadHtml;
if(typeof base==='function'){
  window.leadHtml=function(l){let html=base(l);const marker='<div class="subsection"><h4>Ограничения и качество сигнала</h4>';if(html.includes(marker))html=html.replace(marker,blockHtml(l)+marker);else html=html.replace('<div class="jobs-title">',blockHtml(l)+'<div class="jobs-title">');return html}
}
function target(btn){return btn?.closest('.contact-intel')?.querySelector('.contact-intel-result')}
async function request(id,method){const r=await af('/api/companies/'+id+'/enrich',{method,body:method==='POST'?'{}':undefined}),d=await safeJson(r);if(!r.ok)throw Error(d.detail||d.error||'Не удалось получить контакты');return d}
window.ScoutContacts={
 async enrich(id,btn){const el=target(btn);if(!el)return;const old=btn.textContent;btn.disabled=true;btn.textContent='Ищем…';el.innerHTML='<div class="contact-intel-status">Проверяем официальный сайт, страницы контактов, карьеры, закупок и тендеров…</div>';try{const d=await request(id,'POST');const full=await request(id,'GET');renderContacts(el,full);const status=btn.closest('.contact-intel')?.querySelector('.contact-intel-status');if(status)status.textContent=`Проверено · найдено ${Number(d.contactsFound||0)} контактов · ${Number(d.pagesChecked||0)} страниц`;btn.textContent='Обновить поиск'}catch(err){el.innerHTML=`<div class="intel-error">${e(err.message||err)}</div>`;btn.textContent=old}finally{btn.disabled=false}},
 async load(id,btn){const el=target(btn);if(!el)return;btn.disabled=true;el.innerHTML='<div class="contact-intel-status">Загружаем сохранённые контакты…</div>';try{renderContacts(el,await request(id,'GET'))}catch(err){el.innerHTML=`<div class="intel-error">${e(err.message||err)}</div>`}finally{btn.disabled=false}}
};
})();
