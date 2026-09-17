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
const roleStatusV63=role=>role.p?`<span class="role-status-v63 ok"><i>✓</i>Назначено</span>`:`<span class="role-status-v63 free"><i></i>Свободно</span>`;
const participantOptionsV63=role=>`<option value="">Не назначено</option>${S.participants.filter(p=>p.rsvp!=='no').map(p=>`<option value="${p.id}" ${role.p===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;
const roleRowV63=(role,manage)=>`<div class="role-row-v63 ${role.p?'':'is-free'}">
<div class="role-icon-v63">${iconSvgV63(role)}</div>
<div class="role-copy-v63"><strong>${esc(role.title)}</strong><small>${esc(role.desc||'Описание роли пока не заполнено.')}</small></div>
<div class="role-owner-v63">${rolePersonV63(role)}</div>
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
${roleSectionV63('Ключевые роли','Обязательные зоны ответственности для безопасного и управляемого похода.',critical,manage,'critical')}
${roleSectionV63('Дополнительные роли','Полезные обязанности, которые делают подготовку и сам поход удобнее.',additional,manage,'additional')}
${roleSectionV63('Свободные роли','Роли, для которых пока не выбран ответственный.',open,manage,'free')}
${manage?`<div class="roles-organizer-note-v63"><span>i</span><div><strong>Организатор управляет структурой ролей</strong><p>Роль можно добавить, переименовать, сменить иконку, перевести в ключевую или дополнительную, назначить человека, снять назначение или удалить целиком.</p></div></div>`:`<div class="roles-organizer-note-v63 viewer"><span>i</span><div><strong>Роли команды</strong><p>Здесь видно, к кому обращаться по конкретному вопросу во время подготовки и похода.</p></div></div>`}`;}
function iconPickerV63(selected){return`<div class="role-icon-picker-v63">${Object.entries(ICONS_V63).map(([key,item])=>`<label class="role-icon-choice-v63 ${key===selected?'selected':''}"><input type="radio" name="roleIconV63" value="${key}" ${key===selected?'checked':''}><span class="role-icon-choice-svg-v63">${item.svg}</span><small>${esc(item.label)}</small></label>`).join('')}</div>`}
function bindIconPickerV63(layer){layer.querySelectorAll('input[name="roleIconV63"]').forEach(input=>{input.onchange=()=>{layer.querySelectorAll('.role-icon-choice-v63').forEach(label=>label.classList.toggle('selected',label.contains(input)&&input.checked))}})}
function roleModalV63(item=null){
const role=item||{title:'',desc:'',critical:false,p:'',icon:'checklist'},selectedIcon=inferIconV63(role);
openModal(item?'Изменить роль':'Добавить роль',`<div class="form-grid role-form-v63">
<div class="field full"><label>Название роли</label><input id="roleTitleV63" value="${esc(role.title)}" placeholder="Например, Костровой"></div>
<div class="field full"><label>За что отвечает</label><textarea id="roleDescV63" placeholder="Коротко и понятно опиши зону ответственности">${esc(role.desc||'')}</textarea></div>
<div class="field full"><label>Иконка</label>${iconPickerV63(selectedIcon)}</div>
<div class="field"><label>Ответственный</label><select id="rolePersonV63">${participantOptionsV63(role)}</select></div>
<div class="field"><label>Тип роли</label><select id="roleTypeV63"><option value="critical" ${role.critical?'selected':''}>Ключевая</option><option value="additional" ${!role.critical?'selected':''}>Дополнительная</option></select></div>
</div>`,layer=>{
const title=layer.querySelector('#roleTitleV63').value.trim(),desc=layer.querySelector('#roleDescV63').value.trim(),icon=layer.querySelector('input[name="roleIconV63"]:checked')?.value||'checklist',p=layer.querySelector('#rolePersonV63').value,critical=layer.querySelector('#roleTypeV63').value==='critical';
if(!title){toast('Укажи название роли');return false}
const next={title,desc,icon,p,critical};
if(item)Object.assign(item,next);else S.roles.push({id:`r${Date.now()}`,...next});
save();render();toast(item?'Роль обновлена':'Роль добавлена')});
bindIconPickerV63(document.getElementById('modalLayer'))}
function deleteRoleV63(role){
openModal('Удалить роль?',`<div class="delete-role-copy-v63"><div class="delete-role-icon-v63">${iconSvgV63(role)}</div><div><strong>${esc(role.title)}</strong><p>Роль будет удалена из текущего похода${role.p?` вместе с назначением «${esc(pn(role.p))}»`:''}. Сам участник и его остальные данные останутся без изменений.</p></div></div>`,()=>{S.roles=S.roles.filter(r=>r.id!==role.id);save();render();toast('Роль удалена')})}
const baseBindV63=bind;
bind=function(){
baseBindV63();
if(tab!=='roles')return;
const add=()=>roleModalV63();
document.getElementById('addRoleV63')?.addEventListener('click',add);
document.getElementById('addRoleV63Secondary')?.addEventListener('click',add);
document.querySelectorAll('[data-role-unassign-v63]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleUnassignV63);if(!role)return;role.p='';save();render();toast('Назначение снято')}});
document.querySelectorAll('[data-role-edit-v63]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleEditV63);if(role)roleModalV63(role)}});
document.querySelectorAll('[data-role-delete-v63]').forEach(button=>{button.onclick=()=>{const role=S.roles.find(x=>x.id===button.dataset.roleDeleteV63);if(role)deleteRoleV63(role)}})};
rolesPage=rolesPageV63;
const authBar=document.getElementById('hikeAuthBar');
if(authBar){let lastManageState=canManageRolesV63();new MutationObserver(()=>{const next=canManageRolesV63();if(next!==lastManageState){lastManageState=next;if(tab==='roles')render()}}).observe(authBar,{attributes:true,subtree:true,childList:true,attributeFilter:['hidden','class','style']})}
render();
})();
