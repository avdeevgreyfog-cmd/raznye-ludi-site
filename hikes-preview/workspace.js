/* Shared workspace interactions. Keeps the existing event and module state. */
(() => {
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));
const rows=()=>S.rolesV36?.roles||[];
const actor=()=>window.HikePreviewV48?.active?window.HikePreviewV48.pid:S.current;
const has=id=>rows().some(r=>r.id===id&&r.p===actor());
function can(area){
  if(window.HikePreviewV48?.active)return false;
  if(window.HikeSession?.signed&&!window.HikeSession.approved)return false;
  if(window.HikeSession?.organizer||(!window.HikeSession?.signed&&S.current==='p1')||has('lead'))return true;
  if(area==='route'||area==='plan')return has('nav');
  if(area==='gear')return has('logistics');
  if(area==='food')return has('logistics')||rows().some(r=>r.p===actor()&&r.manageFood);
  if(area==='medical')return has('medic')||has('logistics');
  return false;
}
const canAct=()=>!window.HikePreviewV48?.active&&(!window.HikeSession?.signed||window.HikeSession.approved);
const avatar=pid=>{const p=S.participants.find(p=>p.id===pid);return '<span class="avatar">'+esc(initials(p?.callsign||p?.name||'?'))+'</span>'};
function rolesPage(){
  const all=rows(),main=all.filter(r=>['lead','nav','logistics'].includes(r.id)),other=all.filter(r=>!main.includes(r)),filled=main.filter(r=>r.p).length;
  const card=r=>{
    const candidates=S.rolesV36.candidates?.[r.id]||[],mine=candidates.includes(actor()),owner=S.participants.find(p=>p.id===r.p);
    return '<article class="ws-role '+(!r.p?'is-open':'')+'"><div class="ws-role-copy"><span class="ws-caption">'+(main.includes(r)?'Управление походом':'Задачи на маршруте')+'</span><h3>'+esc(r.title)+'</h3><p>'+esc(r.desc||'')+'</p><span class="ws-access">'+(r.id==='lead'?'Все разделы':r.id==='nav'?'Редактирование маршрута и плана':r.id==='logistics'?'Снаряжение, меню, закупки и вода':r.id==='medic'?'Состав общей аптечки':r.manageFood?'Редактирование меню, закупок и воды':'Без прав управления сайтом')+'</span></div><div class="ws-role-owner">'+(owner?avatar(owner.id)+'<span><b>'+esc(pn(owner.id))+'</b><small>Назначен</small></span>':'<span class="ws-open">Ответственный не назначен</span>')+'</div><div class="ws-role-actions">'+(can('roles')?'<label>Назначить<select data-ws-assign="'+esc(r.id)+'"><option value="">Не назначено</option>'+S.participants.filter(p=>p.rsvp!=='no').map(p=>'<option value="'+esc(p.id)+'" '+(r.p===p.id?'selected':'')+'>'+esc(pn(p.id))+(candidates.includes(p.id)?' · кандидат':'')+'</option>').join('')+'</select></label>'+(!main.includes(r)?'<button class="btn alt sm" data-ws-edit-role="'+esc(r.id)+'">Настроить роль</button>':''):'')+(r.p!==actor()?'<button class="btn alt sm" data-ws-candidate="'+esc(r.id)+'">'+(mine?'Отозвать кандидатуру':'Предложить себя')+'</button>':'')+'</div>'+(candidates.length?'<div class="ws-candidates"><small>Кандидаты</small>'+candidates.map(pid=>'<span>'+esc(pn(pid))+'</span>').join('')+'</div>':'')+'</article>';
  };
  return pageHead('Команда','Роли','Ответственные управляют своими разделами. Участники предлагают кандидатуру, руководитель назначает.',can('roles')?'<button class="btn sand" id="wsAddRole">+ Роль</button>':'')+
    '<div class="ws-summary"><div><small>Основные роли</small><strong>'+filled+' / '+main.length+'</strong><span>назначено</span></div><div><small>Требуют назначения</small><strong>'+(main.length-filled)+'</strong><span>ключевых зон ответственности</span></div><div><small>Кандидатуры</small><strong>'+Object.values(S.rolesV36.candidates||{}).reduce((n,a)=>n+a.length,0)+'</strong><span>ожидают выбора руководителя</span></div></div><section class="ws-section"><h2>Управление походом</h2><div class="ws-role-list">'+main.map(card).join('')+'</div></section><section class="ws-section"><h2>Задачи команды</h2><div class="ws-role-list">'+other.map(card).join('')+'</div></section>';
}
function roleModal(id){
  if(!can('roles'))return;const r=rows().find(r=>r.id===id);
  openModal(r?'Настроить роль':'Добавить роль','<div class="form-grid"><label class="field full">Название<input id="wsRoleTitle" maxlength="80" value="'+esc(r?.title||'')+'"></label><label class="field full">Задачи<textarea id="wsRoleDesc">'+esc(r?.desc||'')+'</textarea></label><label class="field full"><span><input id="wsRoleFood" type="checkbox" '+(r?.manageFood?'checked':'')+'> Поручить меню, закупки и воду</span><small>Остальные права управления не выдаются.</small></label></div>',layer=>{
    if(!can('roles'))return false;const title=layer.querySelector('#wsRoleTitle').value.trim();if(!title){toast('Укажите название');return false}
    const patch={title,desc:layer.querySelector('#wsRoleDesc').value.trim(),manageFood:layer.querySelector('#wsRoleFood').checked};
    if(r)Object.assign(r,patch);else rows().push({id:'task_'+crypto.randomUUID(),p:'',...patch});
    save();render();return true;
  });
}
function take(id){
  if(!canAct())return;const x=S.shared.find(g=>g.id===id);if(!x)return;
  const meta=S.gearV30?.meta?.[id]||{},mine=+(x.a||[]).find(a=>a[0]===S.current)?.[1]||0,other=(x.a||[]).filter(a=>a[0]!==S.current).reduce((n,a)=>n+(+a[1]||0),0),max=Math.max(0,+x.need-other);
  openModal('Я возьму: '+esc(x.title),'<p>Нужно '+esc(x.need)+' '+esc(meta.unit||'шт.')+' · другие участники берут '+other+'</p><label class="field">Моё количество<input id="wsTakeQty" type="number" min="0" max="'+Math.max(max,mine)+'" step="0.1" value="'+mine+'"></label><p>0 — снять обязательство. Указанное количество сразу подтверждается.</p>',layer=>{
    const q=Number(layer.querySelector('#wsTakeQty').value),remaining=Math.max(0,+x.need-(x.a||[]).filter(a=>a[0]!==S.current).reduce((n,a)=>n+(+a[1]||0),0));
    if(!Number.isFinite(q)||q<0||(q>remaining&&q>mine)){toast('Проверьте количество: потребность уже частично закрыта');return false}
    x.a=(x.a||[]).filter(a=>a[0]!==S.current);x.confirmed=(x.confirmed||[]).filter(p=>p!==S.current);
    if(q){x.a.push([S.current,q]);x.confirmed.push(S.current)}save();render();return true;
  });
}
function kit(id){
  const meta=S.gearV30?.meta?.[id];if(!meta)return;
  const editable=can('gear')||(meta.cat==='health'&&can('medical'));
  openModal('Состав: '+esc(S.shared.find(g=>g.id===id)?.title||'комплект'),'<label class="field">По одному предмету на строке<textarea id="wsKit" rows="12" '+(editable?'':'readonly')+'>'+esc((meta.kit||[]).map(x=>x.title).join('\n'))+'</textarea></label>',layer=>{
    if(!editable)return true;
    const titles=layer.querySelector('#wsKit').value.split('\n').map(s=>s.trim()).filter(Boolean);
    meta.kit=titles.map(title=>(meta.kit||[]).find(x=>x.title===title)||{id:'kit_'+crypto.randomUUID(),title});meta.type='kit';save();render();return true;
  });
}
function syncReturn(){
  const t=S.transportV24;if(!t)return;t.returnOverrides||={};
  for(const src of t.rides.there){
    if(t.returnOverrides[src.driver])continue;
    let back=t.rides.back.find(r=>r.linkedTo===src.id);
    if(!back&&(t.rides.back.some(r=>r.driver===src.driver)||(!can('roles')&&src.driver!==S.current)))continue;
    if(!back){back={id:'return_'+src.id,linkedTo:src.id,driver:src.driver,passengers:[],requests:[],stops:[]};t.rides.back.push(back)}
    Object.assign(back,{seats:src.seats,vehicle:src.vehicle,color:src.color,plate:src.plate,comment:src.comment});
    back.stops=[...(src.stops||[])].reverse().map(s=>({...s,id:'return_'+s.id,time:''}));
    const eligible=(src.requests||[]).filter(q=>q.status==='approved'&&!t.returnOverrides[q.pid]&&(!t.choices.back[q.pid]||['unset'].includes(t.choices.back[q.pid].mode)||t.choices.back[q.pid].rideId===back.id));
    const old=back.requests||[];back.requests=eligible.map(q=>({id:'return_'+q.id,pid:q.pid,pickupId:'return_'+q.pickupId,status:'approved',createdAt:q.createdAt}));back.passengers=eligible.map(q=>q.pid);
    old.filter(q=>!back.passengers.includes(q.pid)).forEach(q=>{if(t.choices.back[q.pid]?.rideId===back.id)t.choices.back[q.pid]={mode:'unset'}});
    t.choices.back[src.driver]={mode:'driver',rideId:back.id};
    back.requests.forEach(q=>t.choices.back[q.pid]={mode:'ride',rideId:back.id,requestId:q.id,pickupId:q.pickupId});
  }
  const orphan=t.rides.back.filter(r=>r.linkedTo&&!t.rides.there.some(s=>s.id===r.linkedTo));
  orphan.forEach(r=>Object.keys(t.choices.back).forEach(pid=>{if(t.choices.back[pid].rideId===r.id)t.choices.back[pid]={mode:'unset'}}));
  t.rides.back=t.rides.back.filter(r=>!orphan.includes(r));
  Object.entries(t.choices.there).forEach(([pid,c])=>{if((pid===S.current||can('roles'))&&!t.returnOverrides[pid]&&(!t.choices.back[pid]||['self','unset'].includes(t.choices.back[pid].mode)))t.choices.back[pid]={mode:c.mode==='self'?'self':'unset'}});
}
function bindWorkspace(){
  document.querySelectorAll('[data-ws-assign]').forEach(el=>el.onchange=()=>{
    if(!can('roles'))return;const r=rows().find(r=>r.id===el.dataset.wsAssign);if(!r)return;r.p=el.value;S.rolesV36.candidates[r.id]=(S.rolesV36.candidates[r.id]||[]).filter(p=>p!==r.p);save();render();
  });
  document.querySelectorAll('[data-ws-candidate]').forEach(el=>el.onclick=()=>{
    if(!canAct())return;const id=el.dataset.wsCandidate,a=S.rolesV36.candidates[id]||[];
    S.rolesV36.candidates[id]=a.includes(S.current)?a.filter(p=>p!==S.current):[...a,S.current];save();render();
  });
  document.getElementById('wsAddRole')?.addEventListener('click',()=>roleModal());
  document.querySelectorAll('[data-ws-edit-role]').forEach(el=>el.onclick=()=>roleModal(el.dataset.wsEditRole));
  document.querySelectorAll('[data-workspace-take]').forEach(el=>el.onclick=()=>take(el.dataset.workspaceTake));
  document.querySelectorAll('[data-workspace-kit]').forEach(el=>el.onclick=()=>kit(el.dataset.workspaceKit));
  if(tab==='food'&&!can('food'))document.querySelectorAll('[data-v36-water],[data-v36-water-person],[data-v36-product-buyer],[data-v36-product-purchased],#v36FoodReserve,#v36AutoWater').forEach(el=>{el.disabled=true;el.title='Изменяет ответственный за питание'});
  if(tab==='roles'&&!canAct())document.querySelectorAll('[data-ws-candidate]').forEach(el=>el.disabled=true);
  if(tab==='route'&&!can('route')){editorModeV13=false;document.querySelectorAll('#toggleEditorV13,#toggleEditorV14,#beginEditV15,#openRouteEditorV13,#resetRouteV13,#importProjectV17').forEach(el=>{el.disabled=true;el.hidden=true})}
  if(tab==='plan'&&!can('plan'))document.querySelectorAll('#addTimeline,[data-edit-time],[data-del-time],#v41Sync,#addBreakGeneralV23,#routeStartV23,#reserveV23,[data-profile-v23],[data-speed-v23],[data-add-break-v23],[data-break-title-v23],[data-break-min-v23],[data-break-up-v23],[data-break-down-v23],[data-break-del-v23]').forEach(el=>{el.disabled=true});
  if(tab==='plan'&&!can('plan'))document.querySelectorAll('[data-break-id-v23]').forEach(el=>el.draggable=false);
  document.querySelector('.build-label')?.replaceChildren('V61 · поход');
}
const originalStudio=openStudioV21;
openStudioV21=function(){
  if(can('route'))return originalStudio();
  const host=document.getElementById('routeMapFinal')?.parentElement;
  if(host?.requestFullscreen)host.requestFullscreen().catch(()=>toast('Полноэкранный просмотр недоступен'));else toast('Используйте масштабирование карты');
};
const originalBeginEdit=beginEditV15;
beginEditV15=function(){if(!can('route'))return toast('Маршрут изменяет руководитель или навигатор');return originalBeginEdit()};
const oldTransportSave=transportSaveV24;
transportSaveV24=function(msg){
  if(dir==='back'){const t=S.transportV24;t.returnOverrides||={};t.returnOverrides[S.current]=true;const r=t.rides.back.find(r=>r.driver===S.current);if(r)delete r.linkedTo}
  syncReturn();return oldTransportSave(msg);
};
window.HikeWorkspace={can,canAct,rolesPage,syncReturn,bind:bindWorkspace};
const oldRender=render;
render=function(){if(!can('route'))editorModeV13=false;const result=oldRender();bindWorkspace();return result};
render();
})();