/* V47 — private Supabase Storage adapter for hike documents. */
(() => {
  'use strict';
  const AUTH='rl_hike_auth_v42',SLUG='tominsky-lesopark',MAX=25*1024*1024;
  const MIME={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',txt:'text/plain',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gpx:'application/gpx+xml',kml:'application/vnd.google-earth.kml+xml'};
  let cfg=null,eventId='',loaded=false;
  const session=()=>{try{return JSON.parse(localStorage.getItem(AUTH)||'null')}catch(e){return null}};
  async function config(){
    if(cfg)return cfg;const text=await fetch('./supabase-v42.js?v=42-20260912').then(r=>r.text());
    const url=text.match(/PROJECT_URL\s*=\s*['"]([^'"]+)['"]/i)?.[1],key=text.match(/PUBLISHABLE_KEY\s*=\s*['"]([^'"]+)['"]/i)?.[1];
    if(!url||!key)throw new Error('Конфигурация хранилища недоступна');cfg={url,key};return cfg;
  }
  async function req(path,opt={}){
    const c=await config(),s=session();const headers={apikey:c.key,...(s?.access_token?{Authorization:`Bearer ${s.access_token}`}:{}) ,...(opt.headers||{})};
    return fetch(`${c.url}${path}`,{...opt,headers});
  }
  async function eid(){if(eventId)return eventId;const r=await req(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(SLUG)}&select=id`);const j=await r.json().catch(()=>[]);if(!r.ok||!j?.[0]?.id)throw new Error('Мероприятие не найдено');eventId=j[0].id;return eventId}
  async function load(force=false){if(loaded&&!force)return;if(!session()?.access_token)return;try{const id=await eid(),r=await req(`/rest/v1/hike_files?event_id=eq.${id}&is_visible=eq.true&select=*&order=created_at.desc`),j=await r.json().catch(()=>[]);if(!r.ok)throw new Error('Не удалось загрузить документы');loaded=true;window.V47Docs?.setDocs?.(j)}catch(e){console.warn('V47 docs',e)}}
  async function signed(doc){const r=await req(`/storage/v1/object/sign/hike-files/${encodeURI(doc.storage_path)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.signedURL)throw new Error(j.message||'Не удалось открыть файл');const c=await config();return j.signedURL.startsWith('http')?j.signedURL:`${c.url}/storage/v1${j.signedURL}`}
  async function open(id){const d=window.V47Docs?.get?.().find(x=>String(x.id)===String(id));if(!d?.storage_path)return;try{const a=document.createElement('a');a.href=await signed(d);a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}catch(e){toast(e.message||'Не удалось открыть документ')}}
  const clean=n=>{const p=String(n||'file').split('.'),x=p.length>1?`.${p.pop().toLowerCase()}`:'';return `${p.join('.').toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'file'}${x}`};
  function upload(){
    const a=window.HikeAccessV47?.access?.();if(!a?.admin)return toast('Загрузка доступна организатору');
    openModal('Добавить документ',`<div class="form-grid v47-upload-form"><div class="field full"><label>Файл</label><input id="v47File" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gpx,.kml" required><small>PDF, Word, Excel, TXT, изображения, GPX/KML · до 25 МБ</small></div><div class="field full"><label>Название</label><input id="v47Title" placeholder="Например, Памятка участника"></div><div class="field"><label>Категория</label><select id="v47Category"><option>Памятки</option><option>Маршрут</option><option>Безопасность</option><option>Организация</option><option>Материалы</option></select></div><div class="field full"><label>Описание</label><textarea id="v47Description" placeholder="Коротко — зачем этот файл участнику"></textarea></div></div>`,async layer=>{
      const file=layer.querySelector('#v47File').files?.[0];if(!file){toast('Выбери файл');return false}const ext=(file.name.split('.').pop()||'').toLowerCase();if(!MIME[ext]){toast('Этот формат пока не поддерживается');return false}if(file.size>MAX){toast('Файл больше 25 МБ');return false}
      const s=session();if(!s?.access_token){toast('Сначала войди в аккаунт организатора');return false}const id=await eid(),path=`${id}/${crypto.randomUUID()}/${clean(file.name)}`;
      const up=await req(`/storage/v1/object/hike-files/${encodeURI(path)}`,{method:'POST',headers:{'Content-Type':MIME[ext],'x-upsert':'false'},body:file});if(!up.ok){const b=await up.json().catch(()=>({}));throw new Error(b.message||'Не удалось загрузить файл')}
      const parts=s.access_token.split('.');let uid=s.user?.id||'';try{if(!uid)uid=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))).sub}catch(e){}
      const meta={event_id:id,title:layer.querySelector('#v47Title').value.trim()||file.name.replace(/\.[^.]+$/,''),description:layer.querySelector('#v47Description').value.trim(),category:layer.querySelector('#v47Category').value,file_name:file.name,mime_type:MIME[ext],size_bytes:file.size,storage_path:path,uploaded_by:uid,is_visible:true};
      const mr=await req('/rest/v1/hike_files',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(meta)});if(!mr.ok){await req(`/storage/v1/object/hike-files/${encodeURI(path)}`,{method:'DELETE'}).catch(()=>{});const b=await mr.json().catch(()=>({}));throw new Error(b.message||'Не удалось сохранить документ')}
      loaded=false;await load(true);toast('Документ загружен');render();return true;
    })
  }
  async function remove(id){const a=window.HikeAccessV47?.access?.();if(!a?.admin)return;const d=window.V47Docs?.get?.().find(x=>String(x.id)===String(id));if(!d?.storage_path||!confirm(`Удалить «${d.title}»?`))return;try{await req(`/storage/v1/object/hike-files/${encodeURI(d.storage_path)}`,{method:'DELETE'});const r=await req(`/rest/v1/hike_files?id=eq.${encodeURIComponent(d.id)}`,{method:'DELETE'});if(!r.ok)throw new Error('Не удалось удалить запись');loaded=false;await load(true);toast('Документ удалён');render()}catch(e){toast(e.message||'Не удалось удалить документ')}}
  window.V47Cloud={load,open,upload,remove};window.addEventListener('load',()=>load());
})();
