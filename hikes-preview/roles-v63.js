/* V63: explicit organizer role CRUD + consistent SVG role icons */
(() => {
'use strict';
const ICONS_V63={
leader:{label:'Руководитель',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l3 2.1 3.6.7-.9 3.5 1.8 3.2-3.2 1.9-.5 3.6H12l-3.8 0-.5-3.6-3.2-1.9 1.8-3.2-.9-3.5L9 5.1 12 3z"/><path d="M9.3 11.8l1.8 1.8 3.8-4"/></svg>'},
compass:{label:'Навигация',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></svg>'},
tail:{label:'Замыкающий',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h6a5 5 0 015 5v7"/><path d="M15 14l3 3 3-3"/><path d="M5 5h.01"/></svg>'},
medical:{label:'Первая помощь',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M9 5V3h6v2M12 9v6M9 12h6"/></svg>'},
radio:{label:'Связь',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="15" rx="2"/><path d="M9 3l6 3M9 10h6M10 17h4"/><circle cx="12" cy="14" r="1.7"/></svg>'},
backpack:{label:'Снаряжение',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V5a4 4 0 018 0v2"/><rect x="5" y="7" width="14" height="14" rx="4"/><path d="M5 13h3v5H5M19 13h-3v5h3M9 11h6"/></svg>'},
car:{label:'Транспорт',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16l1.5-6h11L19 16"/><rect x="3" y="13" width="18" height="6" rx="2"/><path d="M7 19v2M17 19v2"/><circle cx="7" cy="16" r="1"/><circle cx="17" cy="16" r="1"/></svg>'},
food:{label:'Питание',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v7M4 3v4a3 3 0 006 0V3M7 10v11M16 3v18M16 3c3 2 4 5 4 8h-4"/></svg>'},
fire:{label:'Костёр',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 4-2 5-2 8 0 1.8 1 3 2 3 1.8 0 3-1.5 3-3.3 2 1.9 3 4 3 6.1A6 6 0 116 16c0-3 1.8-5.3 4.2-7.7C10 11 11 12 12 12c1 0 1.8-.8 1.8-2 0-2-1.2-3.8-1.8-7z"/></svg>'},
camera:{label:'Фото / видео',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l1.5-2h5L16 7h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z"/><circle cx="12" cy="13" r="3.5"/></svg>'},
leaf:{label:'Экология',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C12 4 6 7 5 13c-.6 3.7 2.2 6.6 5.8 6 5.9-1 8.7-7.1 9.2-15z"/><path d="M5 20c2-5 5-8 10-11"/></svg>'},
notes:{label:'Летописец',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>'},
water:{label:'Вода',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s5 6 5 10a5 5 0 01-10 0c0-4 5-10 5-10z"/></svg>'},
checklist:{label:'Организация',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9l1.5 1.5L13 8M9 14l1.5 1.5L13 13M15 9h1M15 14h1"/></svg>'}
};

const RESPONSIBILITY_AREAS_V65={
participants:{label:'Участники',hint:'состав, заявки и статусы'},
gear:{label:'Снаряжение',hint:'списки и распределение'},
food:{label:'Питание',hint:'меню, вода и закупки'},
transport:{label:'Транспорт',hint:'рейсы, точки и пассажиры'},
documents:{label:'Документы',hint:'загрузка и удаление файлов'},
route:{label:'Маршрут',hint:'трек, КП и редактор'},
plan:{label:'План',hint:'тайминг и этапы дня'}
};
const inferResponsibilitiesV65=role=>{
const t=String(role?.title||'').toLowerCase();
if(t.includes('руковод')||t.includes('организ'))return Object.keys(RESPONSIBILITY_AREAS_V65);
if(t.includes('навиг')||t.includes('маршрут')||t.includes('ориент'))return['route','plan'];
if(t.includes('снаряж')||t.includes('завхоз')||t.includes('экип'))return['gear','food','transport'];
if(t.includes('транспорт')||t.includes('водител'))return['transport'];
if(t.includes('питан')||t.includes('еда')||t.includes('вод'))return['food'];
if(t.includes('документ')||t.includes('файл'))return['documents'];
return[];
};
const ensureRoleResponsibilitiesV65=role=>{
if(!Array.isArray(role.responsibilities))role.responsibilities=role.critical?inferResponsibilitiesV65(role):[];
role.responsibilities=[...new Set(role.responsibilities)].filter(key=>RESPONSIBILITY_AREAS_V65[key]);
if(!role.critical)role.responsibilities=[];
if(!Array.isArray(role.duties))role.duties=[];
role.duties=role.duties.map(x=>String(x||'').trim()).filter(Boolean);
if(role.critical)role.acceptance='accepted';
else if(role.p&&!role.acceptance)role.acceptance='accepted';
else if(!role.p)role.acceptance='';
return role;
};
const responsibilityChipsV65=role=>{
ensureRoleResponsibilitiesV65(role);
if(!role.critical)return'<div class="role-extra-note-v66">Дополнительная роль · без доступа к модулям</div>';
const list=role.responsibilities;
if(!list.length)return'<div class="role-responsibility-empty-v65">Нет доступа к рабочим модулям</div>';
const visible=list.slice(0,4).map(key=>`<span class="role-scope-chip-v65">${esc(RESPONSIBILITY_AREAS_V65[key].label)}</span>`).join('');
return`<div class="role-scope-chips-v65">${visible}${list.length>4?`<span class="role-scope-chip-v65 more">+${list.length-4}</span>`:''}</div>`;
};
const responsibilitiesPickerV65=selected=>{
const set=new Set(selected||[]);
return`<div class="role-responsibility-picker-v65">${Object.entries(RESPONSIBILITY_AREAS_V65).map(([key,item])=>`<label class="role-responsibility-choice-v65"><input type="checkbox" name="roleResponsibilityV65" value="${key}" ${set.has(key)?'checked':''}><span><b>${esc(item.label)}</b><small>${esc(item.hint)}</small></span></label>`).join('')}</div>`;
};

const canManageRolesV63=()=>!!window.HikeSession?.organizer||document.body.classList.contains('hike-organizer')||!!(document.getElementById('hikeSettingsButton')&&!document.getElementById('hikeSettingsButton').hidden);
const inferIconV63=role=>{
if(role?.icon&&ICONS_V63[role.icon])return role.icon;
const t=String(role?.title||'').toLowerCase();
if(t.includes('руковод')||t.includes('организ'))return'leader';
if(t.includes('навиг')||t.includes('маршрут')||t.includes('ориент'))return'compass';
if(t.includes('замык'))return'tail';
if(t.includes('помощ')||t.includes('аптеч')||t.includes('мед'))return'medical';
if(t.includes('связ')||t.includes('радио'))return'radio';
if(t.includes('снаряж')||t.includes('завхоз')||t.includes('экип'))return'backpack';
if(t.includes('транспорт')||t.includes('водител'))return'car';
if(t.includes('питан')||t.includes('еда')||t.includes('кух'))return'food';
if(t.includes('кост')||t.includes('огон'))return'fire';
if(t.includes('фото')||t.includes('видео'))return'camera';
if(t.includes('эколог')||t.includes('природ'))return'leaf';
if(t.includes('летопис')||t.includes('дневник')||t.includes('замет'))return'notes';
if(t.includes('вода'))return'water';
return'checklist'};
const iconSvgV63=role=>ICONS_V63[inferIconV63(role)]?.svg||ICONS_V63.checklist.svg;
const rolePersonV63=role=>{
if(!role.p)return`<div class="role-person-v63 empty"><span class="role-avatar-v63 empty">+</span><span><b>Не назначено</b><small>Нужен ответственный</small></span></div>`;
const person=S.participants.find(x=>x.id===role.p);
if(!person)return`<div class="role-person-v63 empty"><span class="role-avatar-v63 empty">+</span><span><b>Не назначено</b><small>Участник недоступен</small></span></div>`;
return`<div class="role-person-v63"><span class="role-avatar-v63">${esc(initials(person.name))}</span><span><b>${esc(person.name)}</b><small>${role.critical?'Ключевая ответственность':'Дополнительная роль'}</small></span></div>`};
const roleStatusV63=role=>{
ensureRoleResponsibilitiesV65(role);
if(!role.p)return`<span class="role-status-v63 free"><i></i>Свободно</span>`;
if(!role.critical&&role.acceptance==='pending')return`<span class="role-status-v63 pending-v66"><i>…</i>Ждёт подтверждения</span>`;
if(!role.critical&&role.acceptance==='declined')return`<span class="role-status-v63 declined-v66"><i>×</i>Отказался</span>`;
return`<span class="role-status-v63 ok"><i>✓</i>${role.critical?'Назначено':'Подтверждено'}</span>`;
};
const participantOptionsV63=role=>`<option value="">Не назначено</option>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${role.p===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;
const roleRowV63=(role,manage)=>`<div class="role-row-v63 ${role.p?'':'is-free'}">
<div class="role-icon-v63">${iconSvgV63(role)}</div>
<div class="role-copy-v63"><strong>${esc(role.title)}</strong><small>${esc(role.desc||'Описание роли пока не заполнено.')}</small>${responsibilityChipsV65(role)}${role.duties?.length?`<div class="role-duties-count-v65">${role.duties.length} ${role.duties.length===1?'конкретная задача':'конкретных задач'}</div>`:''}</div>
<div class="role-owner-v63">${rolePersonV63(role)}${!manage&&!role.critical&&role.p===((window.HikePreviewV48?.active&&window.HikePreviewV48.pid)||S.current)&&role.acceptance==='pending'?`<div class="role-confirm-v66"><button class="btn sand sm" type="button" data-role-confirm-v66="${role.id}">Подтвердить</button><button class="btn alt sm" type="button" data-role-decline-v66="${role.id}">Отказаться</button></div>`:''}</div>
<div class="role-status-cell-v63">${roleStatusV63(role)}</div>
${manage?`<div class="role-manage-v63">
<label class="role-assign-v63"><span>Ответственный</span><select data-role="${role.id}" aria-label="Ответственный за ${esc(role.title)}">${participantOptionsV63(role)}</select></label>
<div class="role-manage-buttons-v63">
${role.p?`<button class="btn alt sm" type="button" data-role-unassign-v63="${role.id}">Снять</button>`:''}
<button class="btn alt sm" type="button" data-role-edit-v63="${role.id}">Изменить</button>
<button class="btn alt sm danger-v63" type="button" data-role-delete-v63="${role.id}">Удалить</button>
</div></div>`:''}</div>`;
const roleSectionV63=(title,desc,roles,manage,tone='')=>{
if(!roles.length)return'';
const assigned=roles.filter(r=>r.p).length;
return`<section class="roles-group-v63 ${tone}"><div class="roles-group-head-v63"><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><span>${assigned} из ${roles.length} назначены</span></div><div class="roles-list-v63">${roles.map(role=>roleRowV63(role,manage)).join('')}</div></section>`};
function rolesPageV63(){
const manage=canManageRolesV63(),total=S.roles.length,assigned=S.roles.filter(r=>r.p).length,free=total-assigned,pct=total?Math.round(assigned/total*100):100;
const critical=S.roles.filter(r=>r.critical),additional=S.roles.filter(r=>!r.critical&&r.p),open=S.roles.filter(r=>!r.critical&&!r.p);
return`${pageHead('Ответственность','Роли','Кто за что отвечает в походе.',manage?`<button class="btn sand roles-add-primary-v63" id="addRoleV63" type="button">+ Добавить роль</button>`:'')}
${manage?`<div class="roles-manager-bar-v63"><div><strong>Управление ролями</strong><span>Добавляй нужные обязанности, назначай участников и удаляй лишние роли.</span></div><button class="btn sand" id="addRoleV63Secondary" type="button">+ Добавить роль</button></div>`:''}
<div class="roles-summary-v63">
<div class="roles-summary-item-v63"><span class="summary-svg-v63">${ICONS_V63.checklist.svg}</span><div><strong>${total}</strong><small>ролей всего</small></div></div>
<div class="roles-summary-item-v63"><span class="summary-svg-v63">${ICONS_V63.leader.svg}</span><div><strong>${assigned}</strong><small>назначено</small></div></div>
<div class="roles-summary-item-v63"><span class="summary-svg-v63">${ICONS_V63.tail.svg}</span><div><strong>${free}</strong><small>свободно</small></div></div>
<div class="roles-progress-v63"><div><span>Распределено ${assigned} из ${total}</span><b>${pct}%</b></div><div class="roles-progress-track-v63"><i style="width:${pct}%"></i></div></div>
</div>
${roleSectionV63('Ответственные роли','Роли, которым можно выдать доступ к рабочим модулям сайта.',critical,manage,'critical')}
${roleSectionV63('Дополнительные роли','Командные обязанности без доступа к модулям. Назначенный участник подтверждает такую роль.',additional,manage,'additional')}
${roleSectionV63('Свободные роли','Свободные дополнительные роли, для которых пока не выбран участник.',open,manage,'free')}
${manage?`<div class="roles-organizer-note-v63"><span>i</span><div><strong>Организатор управляет структурой ролей</strong><p>Для ответственной роли настрой доступ к конкретным модулям. Дополнительные роли не дают системных прав и подтверждаются самим участником.</p></div></div>`:`<div class="roles-organizer-note-v63 viewer"><span>i</span><div><strong>Роли команды</strong><p>Здесь видно, к кому обращаться по конкретному вопросу во время подготовки и похода.</p></div></div>`}`;}
function iconPickerV63(selected){return`<div class="role-icon-picker-v63">${Object.entries(ICONS_V63).map(([key,item])=>`<label class="role-icon-choice-v63 ${key===selected?'selected':''}"><input type="radio" name="roleIconV63" value="${key}" ${key===selected?'checked':''}><span class="role-icon-choice-svg-v63">${item.svg}</span><small>${esc(item.label)}</small></label>`).join('')}</div>`}
function bindIconPickerV63(layer){layer.querySelectorAll('input[name="roleIconV63"]').forEach(input=>{input.onchange=()=>{layer.querySelectorAll('.role-icon-choice-v63').forEach(label=>label.classList.toggle('selected',label.contains(input)&&input.checked))}})}
function roleModalV63(item=null){
const role=item||{title:'',desc:'',critical:false,p:'',icon:'checklist',responsibilities:[],duties:[]};ensureRoleResponsibilitiesV65(role);const selectedIcon=inferIconV63(role);
openModal(item?'Изменить роль':'Добавить роль',`<div class="form-grid role-form-v63">
<div class="field full"><label>Название роли</label><input id="roleTitleV63" value="${esc(role.title)}" placeholder="Например, Костровой"></div>
<div class="field full"><label>Краткое описание роли</label><textarea id="roleDescV63" placeholder="Например: ведёт группу по маршруту и контролирует ориентирование">${esc(role.desc||'')}</textarea></div>
<div class="field full role-responsibility-field-v65 role-module-field-v66"><label>Доступ к модулям</label><p class="role-field-help-v65">Отметь только те разделы сайта, которые назначенный человек сможет редактировать. «Обзор» остаётся доступен всем только для просмотра, а управление ролями — организатору.</p>${responsibilitiesPickerV65(role.responsibilities)}</div>
<div class="field full"><label>Конкретные обязанности</label><p class="role-field-help-v65">Необязательно. По одной задаче в строке — например «проверить офлайн-карту» или «собрать групповую аптечку».</p><textarea id="roleDutiesV65" placeholder="Проверить офлайн-карту&#10;Сверить контрольные точки">${esc((role.duties||[]).join('\n'))}</textarea></div>
<div class="field full"><label>Иконка</label>${iconPickerV63(selectedIcon)}</div>
<div class="field"><label>Ответственный</label><select id="rolePersonV63">${participantOptionsV63(role)}</select></div>
<div class="field"><label>Тип роли</label><select id="roleTypeV63"><option value="critical" ${role.critical?'selected':''}>Ответственная роль</option><option value="additional" ${!role.critical?'selected':''}>Дополнительная роль</option></select></div>
</div>`,layer=>{
const title=layer.querySelector('#roleTitleV63').value.trim(),desc=layer.querySelector('#roleDescV63').value.trim(),icon=layer.querySelector('input[name="roleIconV63"]:checked')?.value||'checklist',p=layer.querySelector('#rolePersonV63').value,critical=layer.querySelector('#roleTypeV63').value==='critical';
let responsibilities=[...layer.querySelectorAll('input[name="roleResponsibilityV65"]:checked')].map(input=>input.value);
const duties=layer.querySelector('#roleDutiesV65').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
if(!title){toast('Укажи название роли');return false}
if(!critical)responsibilities=[];
const oldPerson=item?.p||'',oldAcceptance=item?.acceptance||'';
const acceptance=!p?'':critical?'accepted':oldPerson===p?(oldAcceptance||'accepted'):'pending';
const next={title,desc,icon,p,critical,responsibilities,duties,acceptance};
if(item)Object.assign(item,next);else S.roles.push({id:`r${Date.now()}`,...next});
save();render();toast(item?'Роль обновлена':'Роль добавлена')});
bindIconPickerV63(document.getElementById('modalLayer'));
const typeSelectV66=document.getElementById('roleTypeV63'),moduleFieldV66=document.querySelector('.role-module-field-v66');
const syncRoleTypeV66=()=>{const extra=typeSelectV66?.value==='additional';moduleFieldV66?.classList.toggle('is-disabled',extra);moduleFieldV66?.querySelectorAll('input[name="roleResponsibilityV65"]').forEach(input=>input.disabled=extra)};
typeSelectV66?.addEventListener('change',syncRoleTypeV66);syncRoleTypeV66()}
function deleteRoleV63(role){
openModal('Удалить роль?',`<div class="delete-role-copy-v63"><div class="delete-role-icon-v63">${iconSvgV63(role)}</div><div><strong>${esc(role.title)}</strong><p>Роль будет удалена из текущего похода${role.p?` вместе с назначением «${esc(pn(role.p))}»`:''}. Сам участник и его остальные данные останутся без изменений.</p></div></div>`,()=>{S.roles=S.roles.filter(r=>r.id!==role.id);save();render();toast('Роль удалена')})}
const baseBindV63=bind;
bind=function(){
baseBindV63();
if(tab!=='roles')return;
const add=()=>roleModalV63();
document.getElementById('addRoleV63')?.addEventListener('click',add);
document.getElementById('addRoleV63Secondary')?.addEventListener('click',add);
document.querySelectorAll('select[data-role]').forEach(select=>{select.onchange=()=>{const role=S.roles.find(r=>r.id===select.dataset.role);if(!role)return;const next=select.value,changed=role.p!==next;role.p=next;ensureRoleResponsibilitiesV65(role);role.acceptance=!next?'':role.critical?'accepted':changed?'pending':(role.acceptance||'accepted');save();render();toast(next?(role.critical?'Ответственный назначен':'Назначение отправлено на подтверждение'):'Назначение снято')}});
document.querySelectorAll('[data-role-unassign-v63]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleUnassignV63);if(!role)return;role.p='';role.acceptance='';save();render();toast('Назначение снято')}});
document.querySelectorAll('[data-role-confirm-v66]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleConfirmV66);if(!role)return;role.acceptance='accepted';save();render();toast('Роль подтверждена')}});
document.querySelectorAll('[data-role-decline-v66]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleDeclineV66);if(!role)return;role.acceptance='declined';save();render();toast('Отказ от роли сохранён')}});
document.querySelectorAll('[data-role-edit-v63]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleEditV63);if(role)roleModalV63(role)}});
document.querySelectorAll('[data-role-delete-v63]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleDeleteV63);if(role)deleteRoleV63(role)}})};
rolesPage=rolesPageV63;
function patchWorkspacePermissionsV65(){
if(!window.HikeWorkspace||window.HikeWorkspace.__rolesV65Permissions)return;
const baseCan=typeof window.HikeWorkspace.can==='function'?window.HikeWorkspace.can.bind(window.HikeWorkspace):()=>false;
window.HikeWorkspace.can=function(area){
if(baseCan(area))return true;
if(window.HikePreviewV48?.active)return false;
if(window.HikeSession?.signed&&!window.HikeSession.approved)return false;
const actor=S.current;
return(S.roles||[]).some(role=>role.p===actor&&ensureRoleResponsibilitiesV65(role).responsibilities.includes(area));
};
window.HikeWorkspace.__rolesV65Permissions=true;
}
patchWorkspacePermissionsV65();
const authBar=document.getElementById('hikeAuthBar');
if(authBar){let lastManageState=canManageRolesV63();new MutationObserver(()=>{const next=canManageRolesV63();if(next!==lastManageState){lastManageState=next;if(tab==='roles')render()}}).observe(authBar,{attributes:true,subtree:true,childList:true,attributeFilter:['hidden','class','style']})}
render();
})();
