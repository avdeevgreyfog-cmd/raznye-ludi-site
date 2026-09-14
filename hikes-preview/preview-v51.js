/* V51 — prominent organizer preview controls on every workspace page. */
(() => {
  'use strict';
  const people=()=>Array.isArray(S?.participants)?S.participants:[];
  const rolesFor=pid=>window.HikeAccessV47?.roles?.(pid)||[];
  const actualOrganizer=()=>document.body.classList.contains('hike-organizer')||S?.current==='p1';
  const nonLead=()=>people().filter(p=>!rolesFor(p.id).some(r=>r.id==='lead'||r.title==='Руководитель'));
  const ordinary=()=>nonLead().find(p=>rolesFor(p.id).filter(r=>r.id!=='lead').length===0)||nonLead()[0]||null;
  const responsible=()=>nonLead().find(p=>rolesFor(p.id).some(r=>r.id!=='lead'))||null;
  const roleLabel=pid=>{const rs=rolesFor(pid).filter(r=>r.id!=='lead');return rs.length?rs.map(r=>r.title).join(' · '):'Обычный участник'};
  const person=pid=>people().find(p=>p.id===pid)||null;
  const preview=()=>window.HikePreviewV48||null;

  function patchPreviewAccess(){
    const api=preview();if(!api||api.__v51Patched)return;
    try{Object.defineProperty(api,'active',{configurable:true,get(){return actualOrganizer()&&api.mode!=='organizer'&&!!api.pid}});api.__v51Patched=true}catch(e){}
  }
  function currentLabel(){
    const api=preview();if(!api||api.mode==='organizer')return {title:'Организатор',detail:'Редактирование доступно'};
    const p=person(api.pid);return {title:p?`${p.name} · ${roleLabel(p.id)}`:'Участник',detail:'Предпросмотр · редактирование отключено'};
  }
  function toolbar(){
    document.getElementById('hikeRolePreviewV51')?.remove();
    document.body.classList.toggle('v51-role-preview',actualOrganizer());
    if(!actualOrganizer())return;
    patchPreviewAccess();
    const api=preview();if(!api)return;
    const topbar=document.querySelector('.workspace .topbar');if(!topbar)return;
    const ord=ordinary(),resp=responsible(),state=currentLabel();
    const specific=nonLead().map(p=>`<option value="person:${esc(p.id)}" ${api.mode===`person:${p.id}`?'selected':''}>${esc(p.name)} — ${esc(roleLabel(p.id))}</option>`).join('');
    const active=api.mode==='organizer'?'organizer':api.mode==='participant'?'participant':api.mode==='responsible'?'responsible':'person';
    topbar.insertAdjacentHTML('afterend',`<section class="v51-role-toolbar ${api.active?'is-preview':''}" id="hikeRolePreviewV51" aria-label="Проверка интерфейса по ролям"><div class="v51-role-toolbar__state"><span class="v51-role-toolbar__eyebrow">Проверка интерфейса</span><strong>${esc(state.title)}${api.active?'<span class="v51-role-toolbar__badge">предпросмотр</span>':''}</strong><small>${esc(state.detail)}</small></div><div class="v51-role-toolbar__modes"><button type="button" data-v51-mode="organizer" class="${active==='organizer'?'active':''}">Организатор</button><button type="button" data-v51-mode="participant" class="${active==='participant'?'active':''}" ${ord?'':'disabled'}>Обычный участник</button><button type="button" data-v51-mode="responsible" class="${active==='responsible'?'active':''}" ${resp?'':'disabled'}>Ответственный</button></div><label class="v51-role-toolbar__profile"><span>Конкретный профиль</span><select id="hikeRolePreviewProfile"><option value="">Выбрать участника…</option>${specific}</select></label></section>`);
    document.querySelectorAll('[data-v51-mode]').forEach(btn=>btn.addEventListener('click',()=>api.set(btn.dataset.v51Mode)));
    document.getElementById('hikeRolePreviewProfile')?.addEventListener('change',e=>{if(e.target.value)api.set(e.target.value)});
  }
  function boot(){
    patchPreviewAccess();
    if(typeof render==='function'&&!render.__v51Wrapped){const base=render;const wrapped=function(){const result=base.apply(this,arguments);queueMicrotask(toolbar);return result};wrapped.__v51Wrapped=true;render=wrapped}
    toolbar();
    const observer=new MutationObserver(()=>toolbar());observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.HikeRolePreviewV51={refresh:toolbar};
})();
