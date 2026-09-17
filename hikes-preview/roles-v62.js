/* V62: roles page aligned with Overview / Participants + organizer CRUD */
(() => {
  const roleIconV62 = title => {
    const t = String(title || '').toLowerCase();
    if (t.includes('навиг')) return '⌖';
    if (t.includes('помощ') || t.includes('аптеч')) return '+';
    if (t.includes('замык')) return '↘';
    if (t.includes('связ')) return '◫';
    if (t.includes('снаряж')) return '▣';
    if (t.includes('питан')) return '◒';
    if (t.includes('транспорт')) return '◇';
    if (t.includes('фото') || t.includes('видео')) return '◎';
    if (t.includes('эколог')) return '⌁';
    if (t.includes('летопис')) return '≡';
    if (t.includes('руковод')) return '★';
    return '•';
  };

  const canManageRolesV62 = () => {
    const settings = document.getElementById('hikeSettingsButton');
    return !!settings && !settings.hidden;
  };

  const rolePersonV62 = r => {
    if (!r.p) return `<div class="role-person-v62 empty"><span class="role-avatar-v62 empty">+</span><span><b>Не назначено</b><small>Нужен ответственный</small></span></div>`;
    const p = S.participants.find(x => x.id === r.p);
    if (!p) return `<div class="role-person-v62 empty"><span class="role-avatar-v62 empty">+</span><span><b>Не назначено</b><small>Участник недоступен</small></span></div>`;
    return `<div class="role-person-v62"><span class="role-avatar-v62">${esc(initials(p.name))}</span><span><b>${esc(p.name)}</b><small>${r.critical ? 'Ключевая ответственность' : 'Дополнительная роль'}</small></span></div>`;
  };

  const roleStatusV62 = r => r.p
    ? `<span class="role-status-v62 ok"><i>✓</i> Назначено</span>`
    : `<span class="role-status-v62 free"><i></i> Свободно</span>`;

  const roleRowV62 = (r, manage) => {
    const options = `<option value="">Не назначено</option>${S.participants.filter(p => p.rsvp !== 'no').map(p => `<option value="${p.id}" ${r.p === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}`;
    return `<div class="role-row-v62 ${!r.p ? 'is-free' : ''}">
      <div class="role-icon-v62">${roleIconV62(r.title)}</div>
      <div class="role-copy-v62"><strong>${esc(r.title)}</strong><small>${esc(r.desc || 'Описание роли пока не заполнено.')}</small></div>
      <div class="role-owner-v62">${rolePersonV62(r)}</div>
      <div class="role-status-cell-v62">${roleStatusV62(r)}</div>
      <div class="role-actions-v62">
        ${manage ? `<select class="role-select-v62" data-role="${r.id}" aria-label="Ответственный за ${esc(r.title)}">${options}</select>
          ${r.p ? `<button class="btn alt sm role-unassign-v62" type="button" data-role-unassign-v62="${r.id}">Снять</button>` : ''}
          <button class="icon-btn" type="button" data-role-edit-v62="${r.id}" title="Редактировать роль">✎</button>
          <button class="icon-btn danger-v62" type="button" data-role-delete-v62="${r.id}" title="Удалить роль">×</button>` : ''}
      </div>
    </div>`;
  };

  const roleSectionV62 = (title, desc, rows, manage, tone = '') => {
    if (!rows.length) return '';
    const assignedCount = rows.filter(r => r.p).length;
    return `<section class="roles-group-v62 ${tone}">
      <div class="roles-group-head-v62">
        <div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div>
        <span>${assignedCount} из ${rows.length} назначены</span>
      </div>
      <div class="roles-list-v62">${rows.map(r => roleRowV62(r, manage)).join('')}</div>
    </section>`;
  };

  function rolesPageV62(){
    const manage = canManageRolesV62();
    const total = S.roles.length;
    const assigned = S.roles.filter(r => r.p).length;
    const free = total - assigned;
    const pct = total ? Math.round(assigned / total * 100) : 100;
    const critical = S.roles.filter(r => r.critical);
    const additional = S.roles.filter(r => !r.critical && r.p);
    const open = S.roles.filter(r => !r.critical && !r.p);

    return `${pageHead('Ответственность','Роли','Кто за что отвечает в походе.', manage ? `<button class="btn sand" id="addRoleV62" type="button">+ Добавить роль</button>` : '')}
      <div class="roles-summary-v62">
        <div class="roles-summary-item-v62"><span class="roles-summary-icon-v62">●</span><div><strong>${total}</strong><small>ролей всего</small></div></div>
        <div class="roles-summary-item-v62"><span class="roles-summary-icon-v62">✓</span><div><strong>${assigned}</strong><small>назначено</small></div></div>
        <div class="roles-summary-item-v62"><span class="roles-summary-icon-v62 hollow">○</span><div><strong>${free}</strong><small>свободно</small></div></div>
        <div class="roles-progress-v62"><div><span>Распределено ${assigned} из ${total}</span><b>${pct}%</b></div><div class="roles-progress-track-v62"><i style="width:${pct}%"></i></div></div>
      </div>
      ${roleSectionV62('Ключевые роли','Обязательные зоны ответственности для безопасного и управляемого похода.', critical, manage, 'critical')}
      ${roleSectionV62('Дополнительные роли','Полезные обязанности, которые делают подготовку и сам поход удобнее.', additional, manage, 'additional')}
      ${roleSectionV62('Свободные роли','Можно назначить, когда в команде появится подходящий ответственный.', open, manage, 'free')}
      ${manage ? `<div class="roles-organizer-note-v62"><span>i</span><div><strong>Режим организатора</strong><p>Можно назначать и снимать участников, создавать новые роли, менять описание и переводить роль между ключевыми и дополнительными.</p></div></div>` : `<div class="roles-organizer-note-v62 viewer"><span>i</span><div><strong>Роли команды</strong><p>Здесь видно, к кому обращаться по конкретному вопросу во время подготовки и похода.</p></div></div>`}`;
  }

  function roleModalV62(item = null){
    const r = item || {title:'',desc:'',critical:false};
    openModal(item ? 'Редактировать роль' : 'Новая роль', `<div class="form-grid">
      <div class="field full"><label>Название роли</label><input id="roleTitleV62" value="${esc(r.title)}" placeholder="Например, Фотограф"></div>
      <div class="field full"><label>Что входит в ответственность</label><textarea id="roleDescV62" placeholder="Коротко и понятно: за что отвечает человек">${esc(r.desc || '')}</textarea></div>
      <div class="field full"><label class="role-check-v62"><input id="roleCriticalV62" type="checkbox" ${r.critical ? 'checked' : ''}><span><b>Ключевая роль</b><small>Незакрытая роль будет считаться важным вопросом подготовки</small></span></label></div>
    </div>`, layer => {
      const title = layer.querySelector('#roleTitleV62').value.trim();
      const desc = layer.querySelector('#roleDescV62').value.trim();
      const critical = layer.querySelector('#roleCriticalV62').checked;
      if (!title) { toast('Укажи название роли'); return false; }
      if (item) Object.assign(item, {title, desc, critical});
      else S.roles.push({id:'r'+Date.now(), title, desc, critical, p:''});
      save(); render(); toast(item ? 'Роль обновлена' : 'Роль добавлена');
    });
  }

  function deleteRoleV62(role){
    openModal('Удалить роль?', `<div class="delete-role-copy-v62"><strong>${esc(role.title)}</strong><p>Роль будет удалена из текущего похода${role.p ? ` вместе с назначением ${esc(pn(role.p))}` : ''}. Остальные данные участника не изменятся.</p></div>`, () => {
      S.roles = S.roles.filter(r => r.id !== role.id);
      save(); render(); toast('Роль удалена');
    });
  }

  const baseBindV62 = bind;
  bind = function(){
    baseBindV62();
    if (tab !== 'roles') return;
    document.getElementById('addRoleV62')?.addEventListener('click', () => roleModalV62());
    document.querySelectorAll('[data-role-unassign-v62]').forEach(b => b.onclick = () => {
      const r = S.roles.find(x => x.id === b.dataset.roleUnassignV62);
      if (!r) return;
      r.p = '';
      save(); render(); toast('Назначение снято');
    });
    document.querySelectorAll('[data-role-edit-v62]').forEach(b => b.onclick = () => {
      const r = S.roles.find(x => x.id === b.dataset.roleEditV62);
      if (r) roleModalV62(r);
    });
    document.querySelectorAll('[data-role-delete-v62]').forEach(b => b.onclick = () => {
      const r = S.roles.find(x => x.id === b.dataset.roleDeleteV62);
      if (r) deleteRoleV62(r);
    });
  };

  rolesPage = rolesPageV62;

  const settings = document.getElementById('hikeSettingsButton');
  if (settings) {
    let last = !settings.hidden;
    new MutationObserver(() => {
      const now = !settings.hidden;
      if (now !== last) {
        last = now;
        if (tab === 'roles') render();
      }
    }).observe(settings, {attributes:true, attributeFilter:['hidden','style','class']});
  }

  render();
})();
