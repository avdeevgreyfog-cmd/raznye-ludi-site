/* V38 — participant self-service profile shared by participants, roles and transport. */
(() => {
  'use strict';

  const SKILL_META = [
    ['firstAid', 'Первая помощь', 'Может помочь с базовой первой помощью и аптечкой.'],
    ['cook', 'Готовка', 'Готов участвовать в общей готовке.'],
    ['radio', 'Радиосвязь', 'Умеет работать с рациями и связью группы.']
  ];

  function ensureProfile38() {
    (S.participants || []).forEach(p => {
      if (typeof p.callsign !== 'string') p.callsign = '';
    });
    if (typeof ensureTransportV24 === 'function') ensureTransportV24();
    if (!S.rolesV36) S.rolesV36 = { version: 1, roles: [], skills: {} };
    S.rolesV36.skills ||= {};
    (S.participants || []).forEach(p => {
      if (!Array.isArray(S.rolesV36.skills[p.id])) S.rolesV36.skills[p.id] = [];
    });
  }

  function person38() {
    ensureProfile38();
    return (S.participants || []).find(p => p.id === S.current) || S.participants?.[0];
  }

  function displayName38(p) {
    if (!p) return 'Участник';
    return p.callsign ? `${p.callsign} · ${p.name}` : p.name;
  }

  function profileRoles38(pid) {
    return (S.rolesV36?.roles || []).filter(r => r.p === pid).map(r => r.title);
  }

  function profileSkills38(pid) {
    return S.rolesV36?.skills?.[pid] || [];
  }

  function profilePage38() {
    const p = person38();
    if (!p) return pageHead('Личный профиль', 'Мой профиль', 'Настройки участника пока недоступны.');
    const transport = typeof transportProfileV24 === 'function' ? transportProfileV24(p.id) : { driver: false, defaultSeats: 3, phone: '', vehicle: '', color: '', plate: '' };
    const skills = profileSkills38(p.id);
    const roles = profileRoles38(p.id);
    const rsvp = typeof rsvpLabel === 'function' ? rsvpLabel(p.rsvp) : (p.rsvp || '—');
    const driverLabel = transport.driver ? `Водитель · ${Math.max(0, +transport.defaultSeats || 0)} мест` : 'Не водитель';
    const callsign = p.callsign || 'Не указан';
    const roleLabel = roles.length ? roles.join(' · ') : 'Роль не назначена';
    const skillLabels = SKILL_META.filter(([id]) => skills.includes(id)).map(([, label]) => label);

    return `${pageHead('Личный профиль', 'Мой профиль', 'Постоянные данные участника: имя, позывной, контакты, транспорт и полезные компетенции.', '<button class="btn sand" type="button" data-v38-save>Сохранить изменения</button>')}
      <div class="v38-profile-shell">
        <section class="v38-profile-summary">
          <div class="v38-identity">
            <div class="avatar">${esc(initials(p.callsign || p.name))}</div>
            <div><h2>${esc(p.name)}</h2><p>${p.callsign ? `Позывной · ${esc(p.callsign)}` : 'Позывной пока не указан'}</p><div class="v38-identity-tags">${tag(rsvp, p.rsvp === 'yes' ? 'ok' : p.rsvp === 'pending' ? 'warn' : '')}${transport.driver ? tag('Водитель', 'ok') : tag('Не водитель')}${skillLabels.slice(0, 2).map(x => tag(x)).join('')}</div></div>
          </div>
          <div class="v38-profile-facts">
            <div><small>Позывной</small><b>${esc(callsign)}</b><span>Используется внутри команды</span></div>
            <div><small>Роль в походе</small><b>${esc(roleLabel)}</b><span>Назначается организатором</span></div>
            <div><small>Транспорт</small><b>${esc(driverLabel)}</b><span>${transport.vehicle ? esc(transport.vehicle) : transport.driver ? 'Автомобиль не указан' : 'Личный автомобиль не используется'}</span></div>
          </div>
        </section>

        <div class="v38-profile-grid">
          <div class="v38-profile-stack">
            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Основные данные</h2><p>То, как участник отображается внутри похода и как с ним связаться.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-form-grid">
                  <label class="v38-field"><span>Имя</span><input id="v38Name" autocomplete="name" value="${esc(p.name || '')}" placeholder="Сергей"></label>
                  <label class="v38-field"><span>Позывной</span><input id="v38Callsign" value="${esc(p.callsign || '')}" placeholder="Например, Серый"></label>
                  <label class="v38-field full"><span>Телефон</span><input id="v38Phone" type="tel" autocomplete="tel" value="${esc(transport.phone || '')}" placeholder="+7 ..."><small class="v38-help">Нужен прежде всего для связи с водителем и организатором. Можно оставить пустым.</small></label>
                </div>
              </div>
            </section>

            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Транспорт</h2><p>Один транспортный профиль используется во вкладке «Транспорт» и при создании рейсов.</p></div></div>
              <div class="v38-profile-card-body">
                <label class="v38-driver-toggle"><span><b>Я могу быть водителем</b><small>После включения можно создавать рейсы и брать пассажиров.</small></span><span class="v38-switch"><input id="v38Driver" type="checkbox" ${transport.driver ? 'checked' : ''}><i></i></span></label>
                <div class="v38-form-grid v38-driver-fields ${transport.driver ? '' : 'is-disabled'}" id="v38DriverFields">
                  <label class="v38-field"><span>Пассажирских мест</span><input id="v38Seats" type="number" min="0" max="12" value="${Math.max(0, +transport.defaultSeats || 3)}"></label>
                  <label class="v38-field"><span>Автомобиль</span><input id="v38Vehicle" value="${esc(transport.vehicle || '')}" placeholder="Kia Sportage"></label>
                  <label class="v38-field"><span>Цвет</span><input id="v38Color" value="${esc(transport.color || '')}" placeholder="Серый"></label>
                  <label class="v38-field"><span>Госномер</span><input id="v38Plate" value="${esc(transport.plate || '')}" placeholder="Необязательно"></label>
                </div>
              </div>
            </section>

            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Компетенции</h2><p>Это не роли и не обязанности. Организатор просто видит, на кого можно опереться при необходимости.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-skill-grid">${SKILL_META.map(([id, label, desc]) => `<label class="v38-skill"><input type="checkbox" data-v38-skill="${id}" ${skills.includes(id) ? 'checked' : ''}><b>${esc(label)}</b><small>${esc(desc)}</small></label>`).join('')}</div>
              </div>
            </section>
          </div>

          <div class="v38-profile-stack">
            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>В этом походе</h2><p>Эти параметры относятся уже к мероприятию и меняются в соответствующих вкладках.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-readonly-list">
                  <div class="v38-readonly-row"><span>Участие</span><b>${esc(rsvp)}</b></div>
                  <div class="v38-readonly-row"><span>Основная роль</span><b class="${roles.length ? '' : 'warn'}">${esc(roleLabel)}</b></div>
                  <div class="v38-readonly-row"><span>Транспорт туда</span><b>${esc(typeof rideLabel === 'function' ? rideLabel(p.id, 'there') : '—')}</b></div>
                  <div class="v38-readonly-row"><span>Транспорт обратно</span><b>${esc(typeof rideLabel === 'function' ? rideLabel(p.id, 'back') : '—')}</b></div>
                </div>
                <div class="v38-profile-note">Статус участия, роли, конкретные рейсы, снаряжение и питание специально не редактируются здесь. Так личный профиль остаётся постоянным, а настройки конкретного похода не смешиваются с ним.</div>
              </div>
            </section>

            <section class="v38-profile-card">
              <div class="v38-profile-card-head"><div><h2>Как используются данные</h2><p>Профиль связан с остальными рабочими разделами.</p></div></div>
              <div class="v38-profile-card-body">
                <div class="v38-readonly-list">
                  <div class="v38-readonly-row"><span>Имя и позывной</span><b>Участники и назначения</b></div>
                  <div class="v38-readonly-row"><span>Водитель и машина</span><b>Транспорт</b></div>
                  <div class="v38-readonly-row"><span>Компетенции</span><b>Роли и организация</b></div>
                  <div class="v38-readonly-row"><span>Телефон</span><b>Связь внутри команды</b></div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div class="v38-profile-actions"><button class="btn sand" type="button" data-v38-save>Сохранить изменения</button></div>
      </div>`;
  }

  function toggleDriverFields38() {
    const on = !!document.getElementById('v38Driver')?.checked;
    const box = document.getElementById('v38DriverFields');
    if (box) box.classList.toggle('is-disabled', !on);
    box?.querySelectorAll('input').forEach(i => i.disabled = !on);
  }

  function saveProfile38() {
    ensureProfile38();
    const p = person38();
    if (!p) return;
    const name = document.getElementById('v38Name')?.value.trim() || '';
    if (!name) return toast('Укажи имя');
    const driver = !!document.getElementById('v38Driver')?.checked;
    const hasRide = typeof transportDriverRideV24 === 'function' && ['there', 'back'].some(d => !!transportDriverRideV24(p.id, d));
    if (!driver && hasRide) return toast('Сначала удали созданные рейсы во вкладке «Транспорт»');

    p.name = name;
    p.callsign = document.getElementById('v38Callsign')?.value.trim() || '';

    if (typeof transportProfileV24 === 'function') {
      const t = transportProfileV24(p.id);
      Object.assign(t, {
        driver,
        defaultSeats: Math.max(0, +(document.getElementById('v38Seats')?.value || t.defaultSeats || 0)),
        phone: document.getElementById('v38Phone')?.value.trim() || '',
        vehicle: document.getElementById('v38Vehicle')?.value.trim() || '',
        color: document.getElementById('v38Color')?.value.trim() || '',
        plate: document.getElementById('v38Plate')?.value.trim() || ''
      });
    }

    const skills = S.rolesV36.skills[p.id] ||= [];
    const selected = new Set(SKILL_META.filter(([id]) => document.querySelector(`[data-v38-skill="${id}"]`)?.checked).map(([id]) => id));
    SKILL_META.forEach(([id]) => {
      const i = skills.indexOf(id);
      if (selected.has(id) && i < 0) skills.push(id);
      if (!selected.has(id) && i >= 0) skills.splice(i, 1);
    });
    const driverIndex = skills.indexOf('driver');
    if (driver && driverIndex < 0) skills.push('driver');
    if (!driver && driverIndex >= 0) skills.splice(driverIndex, 1);

    if (typeof syncLegacyTransportV24 === 'function') syncLegacyTransportV24(false);
    save();
    toast('Профиль сохранён');
    render();
  }

  function mountProfileAccess38() {
    const p = person38();
    if (!p) return;
    const nav = document.getElementById('nav');
    if (nav) {
      let wrap = document.getElementById('v38ProfileEntry');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'v38ProfileEntry';
        wrap.className = 'v38-profile-entry';
        nav.insertAdjacentElement('afterend', wrap);
      }
      wrap.innerHTML = `<button type="button" class="v38-profile-nav ${tab === 'profile' ? 'active' : ''}" id="v38ProfileNav"><span class="avatar">${esc(initials(p.callsign || p.name))}</span><span><b>${esc(p.callsign || 'Мой профиль')}</b><small>${esc(p.callsign ? p.name : 'Личные настройки')}</small></span><i>›</i></button>`;
      document.getElementById('v38ProfileNav').onclick = () => { tab = 'profile'; render(); };
    }

    const viewer = document.querySelector('.viewer');
    if (viewer) {
      let top = document.getElementById('v38ProfileTop');
      if (!top) {
        top = document.createElement('button');
        top.type = 'button';
        top.id = 'v38ProfileTop';
        top.className = 'v38-profile-top';
        viewer.appendChild(top);
      }
      top.classList.toggle('active', tab === 'profile');
      top.innerHTML = `<span class="avatar">${esc(initials(p.callsign || p.name))}</span><span>${esc(p.callsign || 'Профиль')}</span>`;
      top.onclick = () => { tab = 'profile'; render(); };
    }
  }

  function decorateProfileNames38() {
    const people = new Map((S.participants || []).map(p => [p.id, p]));
    document.querySelectorAll('select option').forEach(o => {
      const p = people.get(o.value);
      if (p) o.textContent = displayName38(p);
    });
    if (tab === 'participants') {
      const names = document.querySelectorAll('.person-copy .row-title b');
      (S.participants || []).forEach((p, i) => {
        if (!p.callsign || !names[i] || names[i].parentElement?.querySelector('.v38-callsign')) return;
        names[i].insertAdjacentHTML('afterend', `<span class="v38-callsign">${esc(p.callsign)}</span>`);
      });
    }
  }

  function bindProfile38() {
    document.getElementById('v38Driver')?.addEventListener('change', toggleDriverFields38);
    document.querySelectorAll('[data-v38-save]').forEach(b => b.onclick = saveProfile38);
    toggleDriverFields38();
  }

  ensureProfile38();
  const renderBefore38 = render;
  const bindBefore38 = bind;

  bind = function bindV38() {
    bindBefore38();
    if (tab === 'profile') bindProfile38();
    mountProfileAccess38();
    decorateProfileNames38();
  };

  render = function renderV38() {
    ensureProfile38();
    if (tab !== 'profile') {
      const out = renderBefore38();
      mountProfileAccess38();
      decorateProfileNames38();
      const build = document.querySelector('.build-label'); if (build) build.textContent = 'V38 · единый профиль участника';
      return out;
    }
    renderNav();
    const who = document.getElementById('who');
    if (who) who.innerHTML = (S.participants || []).map(p => `<option value="${p.id}" ${p.id === S.current ? 'selected' : ''}>${esc(displayName38(p))}</option>`).join('');
    const app = document.getElementById('app');
    if (app) app.innerHTML = profilePage38();
    bind();
    mountProfileAccess38();
    decorateProfileNames38();
    const build = document.querySelector('.build-label'); if (build) build.textContent = 'V38 · единый профиль участника';
  };

  render();
})();
