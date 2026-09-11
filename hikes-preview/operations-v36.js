/* V36 — operational planner: editable gear, compact roles, recipe/water planning and Yandex on the route map. */
(() => {
  'use strict';

  const BUILD = 'V36 · планировщик снаряжения, питания и воды';
  const YANDEX_KEY = 'ec183557-30ee-4662-86c4-c363798c6092';
  const STATUS = {
    ready: ['Готово', 'ok'],
    check: ['Проверить', 'warn'],
    borrow: ['Нужно одолжить', 'risk'],
    missing: ['Нет / не готово', 'risk'],
    unset: ['Не отмечено', '']
  };
  const PRIORITY = { required: 'Обязательно', weather: 'По погоде', recommended: 'Рекомендуется' };
  const DEFAULT_CATS = {
    pack: ['Рюкзак и упаковка', 'Укладка, защита вещей и переноска.'],
    clothing: ['Одежда и обувь', 'Слои, обувь и защита по погоде.'],
    food: ['Вода и питание', 'Личный запас воды и ходовой еды.'],
    light: ['Свет и инструмент', 'Фонарь и минимальный бытовой инструмент.'],
    nav: ['Навигация и связь', 'Телефон, офлайн-карта, питание электроники.'],
    health: ['Аптечка и здоровье', 'Личные лекарства и мелкая первая помощь.'],
    hygiene: ['Гигиена', 'Минимум для маршрута и ночёвки.'],
    docs: ['Документы', 'Документы, деньги и офлайн-контакты.'],
    other: ['Прочее', 'Дополнительные вещи этого похода.']
  };
  const ROLE_DEFS = [
    ['lead', 'Руководитель', 'Общее решение по мероприятию: состав, сроки, старт, остановка и изменение плана.'],
    ['nav', 'Навигатор', 'Маршрут, карта, контрольные точки, ориентиры и запасной вариант движения.'],
    ['safety', 'Замыкающий / безопасность', 'Целостность группы, темп, состояние участников и базовая безопасность на маршруте.'],
    ['logistics', 'Логистика и снабжение', 'Транспорт, питание, вода, закупки и распределение группового имущества.']
  ];
  const SKILLS = [
    ['firstAid', 'Первая помощь'],
    ['driver', 'Водитель'],
    ['cook', 'Готовка'],
    ['radio', 'Радиосвязь']
  ];

  let gearMode36 = 'mine';
  let foodMode36 = 'plan';
  const openGearCats36 = new Set(['pack']);
  let yandexLoader36 = null;
  let routeYandex36 = { map: null, host: null, status: null, leaflet: null, raf: 0, active: false };

  const copy = (v) => JSON.parse(JSON.stringify(v));
  const num = (v, fallback = 0) => Number.isFinite(+v) ? +v : fallback;
  const fmt = (v, digits = 2) => {
    const n = Math.round((+v || 0) * (10 ** digits)) / (10 ** digits);
    return String(n).replace('.', ',');
  };
  const activePeople36 = () => (S.participants || []).filter(p => p.rsvp === 'yes');
  const allRelevantPeople36 = () => (S.participants || []).filter(p => p.rsvp !== 'no');

  function ensureRoles36() {
    if (!S.rolesV36) {
      const old = copy(S.roles || []);
      const find = (...names) => old.find(r => names.includes(r.title) && r.p)?.p || '';
      const roles = ROLE_DEFS.map(([id, title, desc]) => ({ id, title, desc, p: '' }));
      roles.find(r => r.id === 'lead').p = find('Руководитель');
      roles.find(r => r.id === 'nav').p = find('Навигатор');
      roles.find(r => r.id === 'safety').p = find('Замыкающий', 'Первая помощь');
      roles.find(r => r.id === 'logistics').p = find('Транспорт', 'Снаряжение', 'Питание', 'Связь');
      const skills = {};
      (S.participants || []).forEach(p => skills[p.id] = []);
      const addSkill = (pid, skill) => { if (pid && skills[pid] && !skills[pid].includes(skill)) skills[pid].push(skill); };
      old.filter(r => r.title === 'Первая помощь').forEach(r => addSkill(r.p, 'firstAid'));
      old.filter(r => r.title === 'Связь').forEach(r => addSkill(r.p, 'radio'));
      Object.values(S.cars || {}).flat().forEach(c => addSkill(c.driver, 'driver'));
      (S.foodV31?.meals || []).flatMap(m => m.cooks || []).forEach(pid => addSkill(pid, 'cook'));
      S.rolesV36 = { version: 1, roles, skills, legacy: old };
    }
    const r = S.rolesV36;
    r.roles = Array.isArray(r.roles) ? r.roles : [];
    ROLE_DEFS.forEach(([id, title, desc]) => {
      let row = r.roles.find(x => x.id === id);
      if (!row) { row = { id, title, desc, p: '' }; r.roles.push(row); }
      row.title = title;
      row.desc = desc;
    });
    r.roles = r.roles.filter(x => ROLE_DEFS.some(([id]) => id === x.id));
    r.skills ||= {};
    (S.participants || []).forEach(p => { if (!Array.isArray(r.skills[p.id])) r.skills[p.id] = []; });
    S.roles = r.roles.map(x => ({ id: `v36_${x.id}`, title: x.title, p: x.p || '', critical: true, desc: x.desc }));
  }

  function ensureGear36() {
    if (!S.gearV36) {
      const categories = {};
      Object.entries(DEFAULT_CATS).forEach(([id, [title, desc]]) => categories[id] = { id, title, desc });
      const source = Array.isArray(S.personal) ? S.personal : [];
      const items = source.map((i, idx) => ({
        id: i.id || `gi_${idx}`,
        title: i.title || 'Предмет',
        category: i.category || 'other',
        priority: PRIORITY[i.priority] ? i.priority : 'recommended',
        help: i.help || '',
        weightKg: num(i.weightKg, 0)
      }));
      const status = copy(S.gearV30?.status || {});
      (S.participants || []).forEach(p => {
        status[p.id] ||= {};
        items.forEach(i => {
          if (!STATUS[status[p.id][i.id]]) status[p.id][i.id] = (S.checks?.[p.id] || []).includes(i.id) ? 'ready' : 'unset';
        });
      });
      S.gearV36 = { version: 1, categories, items, status };
    }
    const g = S.gearV36;
    g.categories ||= {};
    Object.entries(DEFAULT_CATS).forEach(([id, [title, desc]]) => { if (!g.categories[id]) g.categories[id] = { id, title, desc }; });
    g.items = Array.isArray(g.items) ? g.items : [];
    g.status ||= {};
    (S.participants || []).forEach(p => {
      g.status[p.id] ||= {};
      g.items.forEach(i => { if (!STATUS[g.status[p.id][i.id]]) g.status[p.id][i.id] = 'unset'; });
    });
    g.items.forEach(i => { if (!g.categories[i.category]) g.categories[i.category] = { id: i.category, title: i.category, desc: '' }; });
    syncGear36(false);
  }

  function syncGear36(write = true) {
    const g = S.gearV36;
    if (!g) return;
    S.personal = g.items.map(i => ({ id: i.id, title: i.title, category: i.category, priority: i.priority, help: i.help, weightKg: i.weightKg || 0 }));
    S.checks ||= {};
    (S.participants || []).forEach(p => {
      S.checks[p.id] = g.items.filter(i => g.status[p.id]?.[i.id] === 'ready').map(i => i.id);
    });
    if (write) save();
  }

  function ensureFood36() {
    const f31 = S.foodV31 ||= { version: 2, meals: [], ingredients: [], mealChecks: {}, attendance: {}, personNotes: {} };
    f31.meals = Array.isArray(f31.meals) ? f31.meals : [];
    f31.ingredients = Array.isArray(f31.ingredients) ? f31.ingredients : [];
    f31.mealChecks ||= {}; f31.attendance ||= {}; f31.personNotes ||= {};
    if (!S.foodV36) {
      S.foodV36 = {
        version: 1,
        reservePct: 10,
        water: { drinkPerPerson: 2, cookingLiters: 2, reservePct: 10, refillLiters: 0, assignments: {} }
      };
    }
    const f = S.foodV36;
    f.reservePct = Math.max(0, num(f.reservePct, 10));
    f.water ||= { drinkPerPerson: 2, cookingLiters: 2, reservePct: 10, refillLiters: 0, assignments: {} };
    f.water.assignments ||= {};
    (S.participants || []).forEach(p => { if (!Number.isFinite(+f.water.assignments[p.id])) f.water.assignments[p.id] = 0; });
    f31.meals.forEach(m => {
      m.mode = ['self', 'common', 'hybrid'].includes(m.mode) ? m.mode : 'self';
      m.day ||= 'День 1'; m.time ||= '12:00'; m.title ||= 'Приём пищи';
      f31.mealChecks[m.id] ||= {};
      f31.attendance[m.id] ||= {};
      (S.participants || []).forEach(p => {
        f31.mealChecks[m.id][p.id] ||= { food: false, water: false };
        if (!['eat', 'skip'].includes(f31.attendance[m.id][p.id])) f31.attendance[m.id][p.id] = p.rsvp === 'yes' ? 'eat' : 'skip';
      });
    });
    f31.ingredients.forEach(i => {
      const m = f31.meals.find(x => x.id === i.mealId);
      if (!m) return;
      if (!Number.isFinite(+i.perPerson)) {
        const p = mealPortions36(m);
        const reserve = 1 + f.reservePct / 100;
        i.perPerson = p > 0 && reserve > 0 ? num(i.need, 0) / p / reserve : 0;
      }
      i.home = Math.max(0, num(i.home));
      i.purchased = Math.max(0, num(i.purchased));
      i.price = Math.max(0, num(i.price));
      i.bring = Array.isArray(i.bring) ? i.bring : [];
      i.unit ||= 'шт.';
      i.title ||= 'Продукт';
    });
    syncFood36(false);
  }

  function mealPortions36(m) {
    if (num(m.portions) > 0) return Math.max(1, Math.round(num(m.portions)));
    const attendees = (S.participants || []).filter(p => p.rsvp !== 'no' && S.foodV31?.attendance?.[m.id]?.[p.id] !== 'skip');
    return Math.max(1, attendees.length || activePeople36().length || 1);
  }

  function ingredientNeed36(i) {
    const m = S.foodV31?.meals?.find(x => x.id === i.mealId);
    if (!m) return 0;
    return Math.max(0, num(i.perPerson) * mealPortions36(m) * (1 + num(S.foodV36?.reservePct, 0) / 100));
  }

  function bringQty36(i) { return (i.bring || []).reduce((n, x) => n + Math.max(0, num(x.qty)), 0); }
  function ingredientCovered36(i) { return Math.max(0, num(i.home)) + Math.max(0, num(i.purchased)) + bringQty36(i); }
  function ingredientBuy36(i) { return Math.max(0, ingredientNeed36(i) - ingredientCovered36(i)); }

  function syncFood36(write = true) {
    if (!S.foodV31 || !S.foodV36) return;
    S.foodV31.ingredients.forEach(i => { i.need = ingredientNeed36(i); });
    if (write) save();
  }

  function ensure36(write = false) {
    ensureRoles36();
    ensureGear36();
    ensureFood36();
    if (write) save();
  }

  function organizer36() {
    const roles = S.rolesV36?.roles || [];
    const lead = roles.find(r => r.id === 'lead')?.p;
    const logistics = roles.find(r => r.id === 'logistics')?.p;
    return S.current === 'p1' || S.current === lead || S.current === logistics;
  }

  function progress36(pid) {
    ensureGear36();
    const req = S.gearV36.items.filter(i => i.priority === 'required');
    const done = req.filter(i => S.gearV36.status[pid]?.[i.id] === 'ready').length;
    return [done, req.length, req.length ? Math.round(done / req.length * 100) : 100];
  }

  function rolePage36() {
    ensureRoles36();
    const roles = S.rolesV36.roles;
    const skills = S.rolesV36.skills;
    const roleCards = roles.map(r => `<article class="v36-role-card">
      <div><span class="v36-role-index">${String(roles.indexOf(r) + 1).padStart(2, '0')}</span><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p></div>
      <label>Ответственный<select data-v36-role="${r.id}"><option value="">Не назначено</option>${allRelevantPeople36().map(p => `<option value="${p.id}" ${r.p === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    </article>`).join('');
    const skillRows = allRelevantPeople36().map(p => `<div class="v36-skill-row"><span><b>${esc(p.name)}</b><small>Дополнительные компетенции, не отдельные роли</small></span><div>${SKILLS.map(([id, label]) => `<button type="button" data-v36-skill="${p.id}:${id}" class="${skills[p.id]?.includes(id) ? 'active' : ''}">${esc(label)}</button>`).join('')}</div></div>`).join('');
    return `${pageHead('Ответственность', 'Роли', 'Четыре основные роли закрывают управление походом. Отдельные умения отмечаются как компетенции, а не раздувают список ролей.')}
      <div class="v36-role-grid">${roleCards}</div>
      ${section('Дополнительные компетенции', `<div class="v36-skill-list">${skillRows}</div>`, 'Первая помощь, вождение, готовка и связь могут быть у любого участника независимо от основной роли.')}`;
  }

  function gearStatus36(pid, id) { return S.gearV36.status[pid]?.[id] || 'unset'; }
  function gearItemWeight36(item) { return Math.max(0, num(item.weightKg)); }
  function personalWeight36(pid, onlyReady = false) {
    return S.gearV36.items.reduce((n, i) => n + ((!onlyReady || gearStatus36(pid, i.id) === 'ready') ? gearItemWeight36(i) : 0), 0);
  }
  function sharedMeta36(id) {
    S.gearV30 ||= { meta: {}, kits: {}, status: {}, final: {} };
    S.gearV30.meta ||= {};
    S.gearV30.meta[id] ||= { unit: 'шт.', cat: 'other', type: 'item', desc: '', kit: [], weightKg: 0 };
    return S.gearV30.meta[id];
  }
  function sharedAssigned36(x) { return (x.a || []).reduce((n, a) => n + num(a[1]), 0); }
  function sharedAssignedWeight36(pid) {
    return (S.shared || []).reduce((sum, x) => {
      const q = num((x.a || []).find(a => a[0] === pid)?.[1]);
      return sum + q * Math.max(0, num(sharedMeta36(x.id).weightKg));
    }, 0);
  }

  function priorityChip36(i) { return `<span class="v36-chip ${i.priority}">${esc(PRIORITY[i.priority] || 'Рекомендуется')}</span>`; }
  function statusSelect36(pid, item) {
    const v = gearStatus36(pid, item.id);
    return `<select class="v36-status ${STATUS[v]?.[1] || ''}" data-v36-gear-status="${item.id}" aria-label="Статус ${esc(item.title)}">${Object.entries(STATUS).map(([k, [label]]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
  }

  function gearMine36() {
    const g = S.gearV36, pid = S.current;
    const req = g.items.filter(i => i.priority === 'required');
    const readyReq = req.filter(i => gearStatus36(pid, i.id) === 'ready').length;
    const attention = g.items.filter(i => ['check', 'borrow', 'missing'].includes(gearStatus36(pid, i.id))).length;
    const groups = Object.values(g.categories).map(cat => {
      const items = g.items.filter(i => i.category === cat.id);
      if (!items.length) return '';
      const ready = items.filter(i => gearStatus36(pid, i.id) === 'ready').length;
      const issues = items.filter(i => ['borrow', 'missing'].includes(gearStatus36(pid, i.id))).length;
      const rows = items.map(i => `<div class="v36-gear-row ${gearStatus36(pid, i.id)}"><div class="v36-gear-copy"><b>${esc(i.title)}</b><div>${priorityChip36(i)}${i.weightKg ? `<span class="v36-weight">${fmt(i.weightKg, 2)} кг</span>` : ''}</div><small>${esc(i.help || '')}</small></div><button class="v36-ready ${gearStatus36(pid, i.id) === 'ready' ? 'active' : ''}" data-v36-gear-ready="${i.id}" type="button">${gearStatus36(pid, i.id) === 'ready' ? '✓ Готово' : 'Отметить готово'}</button>${statusSelect36(pid, i)}</div>`).join('');
      return `<details class="v36-gear-group" data-v36-cat="${cat.id}" ${openGearCats36.has(cat.id) ? 'open' : ''}><summary><span><b>${esc(cat.title)}</b><small>${esc(cat.desc || '')}</small></span><span class="v36-group-stat"><strong>${ready}/${items.length}</strong>${issues ? `<em>${issues} проблем</em>` : '<em>готовность</em>'}</span></summary><div>${rows}</div></details>`;
    }).join('');
    return `<div class="v36-summary v36-summary-4"><div><small>Обязательное</small><strong>${readyReq}/${req.length}</strong><span>готово</span></div><div><small>Требует внимания</small><strong>${attention}</strong><span>проверить / одолжить</span></div><div><small>Личный вес</small><strong>${fmt(personalWeight36(pid), 1)} кг</strong><span>по заполненным весам</span></div><div><small>Общее на мне</small><strong>${fmt(sharedAssignedWeight36(pid), 1)} кг</strong><span>распределённое имущество</span></div></div><div class="v36-gear-groups">${groups}</div>`;
  }

  function gearTemplate36() {
    const g = S.gearV36;
    const groups = Object.values(g.categories).map(cat => {
      const items = g.items.filter(i => i.category === cat.id);
      return `<section class="v36-template-group"><div class="v36-template-head"><div><b>${esc(cat.title)}</b><small>${esc(cat.desc || '')}</small></div><button class="btn alt sm" type="button" data-v36-edit-cat="${cat.id}">Изменить раздел</button></div>${items.length ? items.map(i => `<div class="v36-template-row"><span><b>${esc(i.title)}</b><small>${esc(i.help || 'Без подсказки')}</small></span><div>${priorityChip36(i)}${i.weightKg ? `<span class="v36-weight">${fmt(i.weightKg)} кг</span>` : ''}</div><div class="row-actions"><button class="btn alt sm" data-v36-edit-item="${i.id}">Изменить</button><button class="btn ghost sm" data-v36-delete-item="${i.id}">Удалить</button></div></div>`).join('') : '<div class="v36-empty">В этом разделе пока нет предметов.</div>'}</section>`;
    }).join('');
    return `<div class="v36-template-toolbar"><div><b>Шаблон этого похода</b><small>Изменения применяются ко всем участникам, но их отметки готовности сохраняются.</small></div><div><button class="btn alt" id="v36AddCat">+ Раздел</button><button class="btn sand" id="v36AddGear">+ Предмет</button></div></div>${groups}`;
  }

  function sharedState36(x) {
    const assigned = sharedAssigned36(x), need = Math.max(0, num(x.need));
    const confirmed = (x.confirmed || []).filter(pid => (x.a || []).some(a => a[0] === pid)).length;
    if (!assigned) return ['Не распределено', 'risk'];
    if (assigned < need) return [`Не хватает ${fmt(need - assigned)}`, 'warn'];
    if (confirmed < (x.a || []).length) return ['Нужно подтвердить', 'warn'];
    return ['Готово', 'ok'];
  }

  function gearShared36() {
    const list = S.shared || [];
    const rows = list.map(x => {
      const meta = sharedMeta36(x.id), st = sharedState36(x);
      const owners = (x.a || []).map(a => `${pn(a[0])} · ${fmt(a[1])} ${meta.unit || 'шт.'}${(x.confirmed || []).includes(a[0]) ? ' ✓' : ''}`).join(' · ') || 'пока не назначено';
      const mine = num((x.a || []).find(a => a[0] === S.current)?.[1]);
      return `<article class="v36-shared-row ${st[1]}"><div><span class="v36-chip ${st[1]}">${st[0]}</span><h3>${esc(x.title)}</h3><p>${esc(meta.desc || '')}</p><small>${esc(owners)}</small></div><div class="v36-shared-numbers"><span><small>Нужно</small><b>${fmt(x.need)} ${esc(meta.unit || 'шт.')}</b></span><span><small>Распределено</small><b>${fmt(sharedAssigned36(x))}</b></span><span><small>Вес / ед.</small><b>${meta.weightKg ? `${fmt(meta.weightKg)} кг` : '—'}</b></span></div><div class="v36-shared-actions">${mine ? `<button class="btn alt sm" data-v36-shared-confirm="${x.id}">${(x.confirmed || []).includes(S.current) ? '✓ Подтверждено' : 'Подтвердить'}</button>` : ''}${organizer36() ? `<button class="btn alt sm" data-v36-shared-assign="${x.id}">Распределить</button><button class="btn ghost sm" data-v36-shared-edit="${x.id}">Изменить</button>` : ''}</div></article>`;
    }).join('');
    return `${organizer36() ? '<div class="v36-inline-toolbar"><div><b>Групповое имущество</b><small>Сначала задаём потребность, затем распределяем между участниками.</small></div><button class="btn sand" id="v36AddShared">+ Общее имущество</button></div>' : ''}<div class="v36-shared-list">${rows || '<div class="v36-empty">Групповое имущество пока не добавлено.</div>'}</div>`;
  }

  function gearTeam36() {
    const req = S.gearV36.items.filter(i => i.priority === 'required');
    return `<div class="v36-team-list">${allRelevantPeople36().map(p => {
      const done = req.filter(i => gearStatus36(p.id, i.id) === 'ready').length;
      const problems = S.gearV36.items.filter(i => ['borrow', 'missing'].includes(gearStatus36(p.id, i.id)));
      return `<div class="v36-team-row"><span class="v36-person"><span class="avatar">${initials(p.name)}</span><span><b>${esc(p.name)}</b><small>${p.rsvp === 'yes' ? 'Участвует' : p.rsvp === 'maybe' ? 'Возможно' : 'Нет ответа'}</small></span></span><span><small>Обязательное</small><b>${done}/${req.length}</b></span><span><small>Вес</small><b>${fmt(personalWeight36(p.id) + sharedAssignedWeight36(p.id), 1)} кг</b></span><span class="v36-team-problems">${problems.length ? problems.slice(0, 3).map(i => `<em>${esc(i.title)}</em>`).join('') : '<em class="ok">Критичных проблем нет</em>'}</span></div>`;
    }).join('')}</div>`;
  }

  function gearPage36() {
    ensureGear36();
    if (!organizer36() && ['template', 'team'].includes(gearMode36)) gearMode36 = 'mine';
    const tabs = [['mine', 'Моё снаряжение'], ['shared', 'Групповое']];
    if (organizer36()) tabs.push(['team', 'Команда'], ['template', 'Шаблон похода']);
    return `${pageHead('Подготовка', 'Снаряжение', 'Сначала определяем, что нужно взять, затем отмечаем личную готовность и распределяем общее имущество.')}
      <div class="v36-tabs">${tabs.map(([id, label]) => `<button type="button" data-v36-gear-mode="${id}" class="${gearMode36 === id ? 'active' : ''}">${label}</button>`).join('')}</div>
      <div class="v36-content">${gearMode36 === 'mine' ? gearMine36() : gearMode36 === 'shared' ? gearShared36() : gearMode36 === 'team' ? gearTeam36() : gearTemplate36()}</div>`;
  }

  function foodMealChecks36(m) {
    const c = S.foodV31.mealChecks?.[m.id]?.[S.current] || { food: false, water: false };
    return `<div class="v36-self-check"><button data-v36-meal-check="${m.id}:food" class="${c.food ? 'active' : ''}">${c.food ? '✓ ' : ''}Еда собрана</button><button data-v36-meal-check="${m.id}:water" class="${c.water ? 'active' : ''}">${c.water ? '✓ ' : ''}Вода собрана</button></div>`;
  }

  function foodPlan36() {
    const meals = [...S.foodV31.meals].sort((a, b) => String(a.day).localeCompare(String(b.day), 'ru', { numeric: true }) || String(a.time).localeCompare(String(b.time)));
    const groups = {};
    meals.forEach(m => (groups[m.day] ||= []).push(m));
    const open = S.foodV31.ingredients.filter(i => ingredientBuy36(i) > 0).length;
    const common = meals.filter(m => m.mode !== 'self').length;
    const summary = `<div class="v36-summary v36-summary-4"><div><small>Приёмов пищи</small><strong>${meals.length}</strong><span>${Object.keys(groups).length || 0} дн.</span></div><div><small>Общих</small><strong>${common}</strong><span>требуют расчёта</span></div><div><small>Докупить</small><strong>${open}</strong><span>позиций</span></div><div><small>Резерв продуктов</small><strong>${fmt(S.foodV36.reservePct, 0)}%</strong><span>добавляется к норме</span></div></div>`;
    const days = Object.entries(groups).map(([day, list]) => `<section class="v36-food-day"><div class="v36-food-day-head"><div><b>${esc(day)}</b><small>${list.length} ${list.length === 1 ? 'приём' : 'приёма'} пищи</small></div>${organizer36() ? `<button class="btn alt sm" data-v36-add-meal-day="${esc(day)}">+ добавить</button>` : ''}</div>${list.map(m => foodMealCard36(m)).join('')}</section>`).join('');
    return `${summary}${organizer36() ? `<div class="v36-reserve"><label>Общий резерв продуктов <input id="v36FoodReserve" type="number" min="0" max="50" step="1" value="${num(S.foodV36.reservePct, 10)}"> %</label><small>Норма каждого ингредиента считается на человека × число порций + резерв.</small></div>` : ''}${days || '<div class="v36-empty">План питания пока пуст.</div>'}`;
  }

  function foodMealCard36(m) {
    const common = m.mode !== 'self';
    const ingredients = S.foodV31.ingredients.filter(i => i.mealId === m.id);
    const needBuy = ingredients.filter(i => ingredientBuy36(i) > 0).length;
    return `<article class="v36-meal ${common ? 'common' : 'self'}"><div class="v36-meal-time"><b>${esc(m.time || '—')}</b><small>${esc(m.location || '')}</small></div><div class="v36-meal-main"><div class="v36-meal-head"><div><h3>${esc(m.title)}</h3><span class="v36-chip ${common ? 'ok' : ''}">${common ? (m.mode === 'hybrid' ? 'Общее + личное' : 'Общее') : 'Самостоятельно'}</span></div>${organizer36() ? `<div><button class="btn alt sm" data-v36-edit-meal="${m.id}">Изменить</button></div>` : ''}</div><p>${esc(m.menu || (common ? 'Меню не заполнено' : 'Каждый отвечает за свою еду.'))}</p>${m.note ? `<small class="v36-note">${esc(m.note)}</small>` : ''}${common ? `<div class="v36-meal-meta"><span><small>Порций</small><b>${mealPortions36(m)}</b></span><span><small>Продуктов</small><b>${ingredients.length}</b></span><span><small>Докупить</small><b>${needBuy}</b></span></div><div class="v36-recipe">${ingredients.length ? ingredients.map(i => `<div class="v36-recipe-row"><span><b>${esc(i.title)}</b><small>${fmt(i.perPerson)} ${esc(i.unit)} / чел.</small></span><span><small>Всего</small><b>${fmt(ingredientNeed36(i))} ${esc(i.unit)}</b></span><span class="${ingredientBuy36(i) > 0 ? 'warn' : 'ok'}"><small>${ingredientBuy36(i) > 0 ? 'Докупить' : 'Закрыто'}</small><b>${ingredientBuy36(i) > 0 ? `${fmt(ingredientBuy36(i))} ${esc(i.unit)}` : '✓'}</b></span>${organizer36() ? `<button class="icon-btn" data-v36-edit-ing="${i.id}" title="Изменить">✎</button>` : ''}</div>`).join('') : '<div class="v36-empty compact">Рецепт пока не заполнен.</div>'}${organizer36() ? `<button class="v36-add-line" data-v36-add-ing="${m.id}">+ продукт в рецепт</button>` : ''}</div>` : foodMealChecks36(m)}</div></article>`;
  }

  function foodAggregates36() {
    const map = new Map();
    S.foodV31.ingredients.forEach(i => {
      const meal = S.foodV31.meals.find(m => m.id === i.mealId);
      if (!meal || meal.mode === 'self') return;
      const key = `${String(i.title).trim().toLowerCase()}|${String(i.unit).trim().toLowerCase()}`;
      if (!map.has(key)) map.set(key, { key, title: i.title, unit: i.unit, need: 0, home: 0, purchased: 0, bring: 0, price: 0, lines: [], buyers: new Set() });
      const a = map.get(key);
      a.need += ingredientNeed36(i); a.home += num(i.home); a.purchased += num(i.purchased); a.bring += bringQty36(i); a.price = Math.max(a.price, num(i.price)); a.lines.push(i); if (i.buyer) a.buyers.add(i.buyer);
    });
    return [...map.values()].map(a => ({ ...a, toBuy: Math.max(0, a.need - a.home - a.purchased - a.bring) })).sort((a, b) => b.toBuy - a.toBuy || a.title.localeCompare(b.title, 'ru'));
  }

  function foodProducts36() {
    const a = foodAggregates36();
    const open = a.filter(x => x.toBuy > 0);
    const estimate = open.reduce((n, x) => n + x.toBuy * x.price, 0);
    return `<div class="v36-summary v36-summary-3"><div><small>Позиций</small><strong>${a.length}</strong><span>по всем общим меню</span></div><div><small>Нужно докупить</small><strong>${open.length}</strong><span>после запасов группы</span></div><div><small>Оценка</small><strong>${Math.round(estimate).toLocaleString('ru-RU')} ₽</strong><span>по указанным ценам</span></div></div><div class="v36-products"><div class="v36-products-head"><span>Продукт</span><span>Нужно</span><span>Есть / принесут</span><span>Докупить</span><span>Ответственный</span><span></span></div>${a.map(x => `<div class="v36-product-row ${x.toBuy > 0 ? 'warn' : 'ok'}"><span><b>${esc(x.title)}</b><small>${esc(x.unit)}</small></span><span><b>${fmt(x.need)}</b></span><span><b>${fmt(x.home + x.bring + x.purchased)}</b></span><span><b>${x.toBuy > 0 ? fmt(x.toBuy) : '✓'}</b></span><span><select data-v36-product-buyer="${encodeURIComponent(x.key)}"><option value="">Не назначен</option>${allRelevantPeople36().map(p => `<option value="${p.id}" ${x.buyers.has(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></span><span><button class="btn alt sm" data-v36-product-purchased="${encodeURIComponent(x.key)}">${x.toBuy > 0 ? 'Отметить куплено' : 'Вернуть в закупку'}</button></span></div>`).join('') || '<div class="v36-empty">В общих меню пока нет продуктов.</div>'}</div>`;
  }

  function waterCalc36() {
    const w = S.foodV36.water, people = activePeople36();
    const base = Math.max(0, num(w.drinkPerPerson)) * people.length + Math.max(0, num(w.cookingLiters));
    const total = Math.max(0, base * (1 + Math.max(0, num(w.reservePct)) / 100) - Math.max(0, num(w.refillLiters)));
    const assigned = people.reduce((n, p) => n + Math.max(0, num(w.assignments[p.id])), 0);
    return { people, base, total, assigned, delta: total - assigned };
  }

  function foodWater36() {
    const w = S.foodV36.water, c = waterCalc36();
    return `<div class="v36-summary v36-summary-4"><div><small>Участников</small><strong>${c.people.length}</strong><span>подтвердили участие</span></div><div><small>Питьё</small><strong>${fmt(w.drinkPerPerson, 1)} л</strong><span>на человека</span></div><div><small>На старте</small><strong>${fmt(c.total, 1)} л</strong><span>с учётом готовки и резерва</span></div><div><small>Распределено</small><strong>${fmt(c.assigned, 1)} л</strong><span class="${Math.abs(c.delta) < .05 ? 'ok' : 'warn'}">${Math.abs(c.delta) < .05 ? 'баланс сходится' : `${c.delta > 0 ? 'осталось' : 'лишнее'} ${fmt(Math.abs(c.delta), 1)} л`}</span></div></div>
      <section class="v36-water-settings"><div><h2>Расчёт воды</h2><p>Питьевая вода + вода на готовку + резерв − подтверждённое пополнение на маршруте.</p></div><div class="v36-water-fields"><label>Л/чел.<input data-v36-water="drinkPerPerson" type="number" min="0" step="0.1" value="${num(w.drinkPerPerson)}"></label><label>На готовку, л<input data-v36-water="cookingLiters" type="number" min="0" step="0.1" value="${num(w.cookingLiters)}"></label><label>Резерв, %<input data-v36-water="reservePct" type="number" min="0" step="1" value="${num(w.reservePct)}"></label><label>Пополнение, л<input data-v36-water="refillLiters" type="number" min="0" step="0.1" value="${num(w.refillLiters)}"></label></div></section>
      <section class="v36-water-distribution"><div class="v36-inline-toolbar"><div><b>Кто сколько несёт на старте</b><small>Можно распределить автоматически и затем вручную поправить нагрузку.</small></div><button class="btn alt" id="v36AutoWater">Распределить поровну</button></div>${c.people.map(p => `<label class="v36-water-row"><span><span class="avatar">${initials(p.name)}</span><b>${esc(p.name)}</b></span><span><input data-v36-water-person="${p.id}" type="number" min="0" step="0.1" value="${num(w.assignments[p.id])}"> л</span></label>`).join('') || '<div class="v36-empty">Нет подтверждённых участников.</div>'}</section>`;
  }

  function foodPage36() {
    ensureFood36();
    const tabs = [['plan', 'Меню и приёмы'], ['products', 'Продукты'], ['water', 'Вода']];
    const actions = organizer36() ? '<button class="btn alt" id="v36FoodIo">Импорт / экспорт</button><button class="btn sand" id="v36AddMeal">+ Приём пищи</button>' : '';
    return `${pageHead('Подготовка', 'Питание', 'Планируем меню, считаем продукты по числу людей и отдельно распределяем воду.', actions)}<div class="v36-tabs">${tabs.map(([id, label]) => `<button data-v36-food-mode="${id}" class="${foodMode36 === id ? 'active' : ''}">${label}</button>`).join('')}</div><div class="v36-content">${foodMode36 === 'plan' ? foodPlan36() : foodMode36 === 'products' ? foodProducts36() : foodWater36()}</div>`;
  }

  function openModal36(title, body, footer = '') {
    const l = document.getElementById('modalLayer');
    if (!l) return null;
    l.innerHTML = `<div class="v36-backdrop" data-v36-close></div><div class="v36-modal"><div class="v36-modal-head"><b>${title}</b><button type="button" data-v36-close>×</button></div><div class="v36-modal-body">${body}</div><div class="v36-modal-foot">${footer}</div></div>`;
    l.classList.add('open'); l.setAttribute('aria-hidden', 'false');
    l.querySelectorAll('[data-v36-close]').forEach(b => b.onclick = closeModal36);
    return l;
  }
  function closeModal36() { const l = document.getElementById('modalLayer'); if (!l) return; l.classList.remove('open'); l.setAttribute('aria-hidden', 'true'); l.innerHTML = ''; }

  function gearItemModal36(id = '') {
    const edit = !!id, g = S.gearV36, item = edit ? g.items.find(i => i.id === id) : { title: '', category: Object.keys(g.categories)[0] || 'other', priority: 'recommended', help: '', weightKg: 0 };
    if (!item) return;
    const body = `<label>Название<input id="v36GiTitle" value="${esc(item.title)}"></label><label>Раздел<select id="v36GiCat">${Object.values(g.categories).map(c => `<option value="${c.id}" ${item.category === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></label><div class="v36-form-row"><label>Приоритет<select id="v36GiPriority">${Object.entries(PRIORITY).map(([k, v]) => `<option value="${k}" ${item.priority === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>Вес, кг<input id="v36GiWeight" type="number" min="0" step="0.05" value="${num(item.weightKg)}"></label></div><label>Подсказка<textarea id="v36GiHelp" rows="3">${esc(item.help || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить предмет' : 'Добавить предмет', body, `<button class="btn alt" data-v36-close>Отмена</button><button class="btn sand" id="v36GiSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36GiSave').onclick = () => {
      const title = document.getElementById('v36GiTitle').value.trim(); if (!title) return toast('Укажи название');
      const patch = { title, category: document.getElementById('v36GiCat').value, priority: document.getElementById('v36GiPriority').value, weightKg: Math.max(0, num(document.getElementById('v36GiWeight').value)), help: document.getElementById('v36GiHelp').value.trim() };
      if (edit) Object.assign(item, patch); else { const ni = { id: `gi36_${Date.now()}`, ...patch }; g.items.push(ni); (S.participants || []).forEach(p => g.status[p.id][ni.id] = 'unset'); }
      syncGear36(); closeModal36(); render();
    };
  }

  function gearCategoryModal36(id = '') {
    const edit = !!id, g = S.gearV36, cat = edit ? g.categories[id] : { id: '', title: '', desc: '' };
    if (!cat) return;
    const body = `<label>Название раздела<input id="v36CatTitle" value="${esc(cat.title || '')}"></label><label>Описание<textarea id="v36CatDesc" rows="3">${esc(cat.desc || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить раздел' : 'Добавить раздел', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit && !g.items.some(i => i.category === id) ? '<button class="btn risk" id="v36CatDelete">Удалить</button>' : ''}<button class="btn sand" id="v36CatSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36CatDelete')?.addEventListener('click', () => { delete g.categories[id]; save(); closeModal36(); render(); });
    document.getElementById('v36CatSave').onclick = () => {
      const title = document.getElementById('v36CatTitle').value.trim(); if (!title) return toast('Укажи название раздела');
      if (edit) { cat.title = title; cat.desc = document.getElementById('v36CatDesc').value.trim(); }
      else { const key = `cat_${Date.now()}`; g.categories[key] = { id: key, title, desc: document.getElementById('v36CatDesc').value.trim() }; }
      save(); closeModal36(); render();
    };
  }

  function sharedModal36(id = '') {
    const edit = !!id, x = edit ? (S.shared || []).find(g => g.id === id) : { title: '', need: 1, a: [], confirmed: [] }, meta = edit ? sharedMeta36(id) : { unit: 'шт.', cat: 'other', type: 'item', desc: '', weightKg: 0, kit: [] };
    if (!x) return;
    const body = `<label>Название<input id="v36ShTitle" value="${esc(x.title)}"></label><div class="v36-form-row"><label>Нужно<input id="v36ShNeed" type="number" min="0" step="0.1" value="${num(x.need, 1)}"></label><label>Единица<input id="v36ShUnit" value="${esc(meta.unit || 'шт.')}"></label></div><label>Вес одной единицы, кг<input id="v36ShWeight" type="number" min="0" step="0.05" value="${num(meta.weightKg)}"></label><label>Описание<textarea id="v36ShDesc" rows="3">${esc(meta.desc || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить групповое имущество' : 'Добавить групповое имущество', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit ? '<button class="btn risk" id="v36ShDelete">Удалить</button>' : ''}<button class="btn sand" id="v36ShSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36ShDelete')?.addEventListener('click', () => { if (!confirm(`Удалить «${x.title}»?`)) return; S.shared = S.shared.filter(g => g.id !== id); if (S.gearV30?.meta) delete S.gearV30.meta[id]; save(); closeModal36(); render(); });
    document.getElementById('v36ShSave').onclick = () => {
      const title = document.getElementById('v36ShTitle').value.trim(); if (!title) return toast('Укажи название');
      const need = Math.max(0, num(document.getElementById('v36ShNeed').value));
      if (!edit) { id = `sh36_${Date.now()}`; x.id = id; S.shared ||= []; S.shared.push(x); }
      x.title = title; x.need = need; x.a = (x.a || []).map(a => [a[0], Math.min(num(a[1]), need)]).filter(a => a[1] > 0); x.confirmed = (x.confirmed || []).filter(pid => x.a.some(a => a[0] === pid));
      Object.assign(sharedMeta36(id), { unit: document.getElementById('v36ShUnit').value.trim() || 'шт.', desc: document.getElementById('v36ShDesc').value.trim(), weightKg: Math.max(0, num(document.getElementById('v36ShWeight').value)) });
      save(); closeModal36(); render();
    };
  }

  function sharedAssignModal36(id) {
    const x = (S.shared || []).find(g => g.id === id); if (!x) return;
    const meta = sharedMeta36(id);
    const body = `<div class="v36-assign-list">${allRelevantPeople36().map(p => `<label><span><b>${esc(p.name)}</b><small>${p.rsvp === 'yes' ? 'участвует' : p.rsvp === 'maybe' ? 'возможно' : 'нет ответа'}</small></span><span><input data-v36-assign-person="${p.id}" type="number" min="0" step="0.1" value="${num((x.a || []).find(a => a[0] === p.id)?.[1])}"> ${esc(meta.unit || 'шт.')}</span></label>`).join('')}</div><small>Нужно распределить: ${fmt(x.need)} ${esc(meta.unit || 'шт.')}. После изменения подтверждения участников сбрасываются.</small>`;
    const l = openModal36(`Распределить: ${esc(x.title)}`, body, `<button class="btn alt" data-v36-close>Отмена</button><button class="btn sand" id="v36AssignSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36AssignSave').onclick = () => {
      x.a = [...document.querySelectorAll('[data-v36-assign-person]')].map(inp => [inp.dataset.v36AssignPerson, Math.max(0, num(inp.value))]).filter(a => a[1] > 0);
      x.confirmed = [];
      save(); closeModal36(); render();
    };
  }

  function mealModal36(id = '', presetDay = '') {
    const edit = !!id, f = S.foodV31, m = edit ? f.meals.find(x => x.id === id) : { day: presetDay || 'День 1', time: '12:00', title: '', mode: 'self', location: '', menu: '', note: '', portions: 0, cooks: [], equipment: [] };
    if (!m) return;
    const body = `<div class="v36-form-row"><label>День<input id="v36MealDay" value="${esc(m.day)}"></label><label>Время<input id="v36MealTime" type="time" value="${esc(m.time || '12:00')}"></label></div><label>Название<input id="v36MealTitle" value="${esc(m.title)}" placeholder="Обед / ужин / завтрак"></label><div class="v36-form-row"><label>Формат<select id="v36MealMode"><option value="self" ${m.mode === 'self' ? 'selected' : ''}>Самостоятельно</option><option value="common" ${m.mode === 'common' ? 'selected' : ''}>Общее</option><option value="hybrid" ${m.mode === 'hybrid' ? 'selected' : ''}>Общее + личное</option></select></label><label>Порций (0 = автоматически)<input id="v36MealPortions" type="number" min="0" step="1" value="${num(m.portions)}"></label></div><label>Место<input id="v36MealLocation" value="${esc(m.location || '')}"></label><label>Меню<textarea id="v36MealMenu" rows="2">${esc(m.menu || '')}</textarea></label><label>Комментарий<textarea id="v36MealNote" rows="2">${esc(m.note || '')}</textarea></label>`;
    const l = openModal36(edit ? 'Изменить приём пищи' : 'Добавить приём пищи', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit ? '<button class="btn risk" id="v36MealDelete">Удалить</button>' : ''}<button class="btn sand" id="v36MealSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36MealDelete')?.addEventListener('click', () => { if (!confirm(`Удалить «${m.title}»?`)) return; f.meals = f.meals.filter(x => x.id !== m.id); f.ingredients = f.ingredients.filter(i => i.mealId !== m.id); delete f.mealChecks[m.id]; delete f.attendance[m.id]; syncFood36(); closeModal36(); render(); });
    document.getElementById('v36MealSave').onclick = () => {
      const title = document.getElementById('v36MealTitle').value.trim(); if (!title) return toast('Укажи название');
      const patch = { day: document.getElementById('v36MealDay').value.trim() || 'День 1', time: document.getElementById('v36MealTime').value || '12:00', title, mode: document.getElementById('v36MealMode').value, location: document.getElementById('v36MealLocation').value.trim(), menu: document.getElementById('v36MealMenu').value.trim(), note: document.getElementById('v36MealNote').value.trim(), portions: Math.max(0, Math.round(num(document.getElementById('v36MealPortions').value))) };
      if (edit) Object.assign(m, patch); else { const nm = { id: `fm36_${Date.now()}`, cooks: [], equipment: [], ...patch }; f.meals.push(nm); f.mealChecks[nm.id] = {}; f.attendance[nm.id] = {}; (S.participants || []).forEach(p => { f.mealChecks[nm.id][p.id] = { food: false, water: false }; f.attendance[nm.id][p.id] = p.rsvp === 'yes' ? 'eat' : 'skip'; }); }
      syncFood36(); closeModal36(); render();
    };
  }

  function ingredientModal36(mealId, id = '') {
    const f = S.foodV31, edit = !!id, i = edit ? f.ingredients.find(x => x.id === id) : { mealId, title: '', perPerson: 0.1, unit: 'кг', home: 0, purchased: 0, price: 0, buyer: '', bring: [] };
    if (!i) return;
    const body = `<label>Продукт<input id="v36IngTitle" value="${esc(i.title || '')}"></label><div class="v36-form-row"><label>На человека<input id="v36IngPer" type="number" min="0" step="0.01" value="${fmt(num(i.perPerson), 3).replace(',', '.')}"></label><label>Единица<input id="v36IngUnit" value="${esc(i.unit || 'шт.')}"></label></div><div class="v36-form-row"><label>Уже есть у группы<input id="v36IngHome" type="number" min="0" step="0.01" value="${num(i.home)}"></label><label>Цена за единицу, ₽<input id="v36IngPrice" type="number" min="0" step="1" value="${num(i.price)}"></label></div><label>Кто покупает<select id="v36IngBuyer"><option value="">Не назначено</option>${allRelevantPeople36().map(p => `<option value="${p.id}" ${i.buyer === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><small>Итоговая потребность пересчитается автоматически по числу порций и общему резерву.</small>`;
    const l = openModal36(edit ? 'Изменить продукт' : 'Добавить продукт', body, `<button class="btn alt" data-v36-close>Отмена</button>${edit ? '<button class="btn risk" id="v36IngDelete">Удалить</button>' : ''}<button class="btn sand" id="v36IngSave">Сохранить</button>`);
    if (!l) return;
    document.getElementById('v36IngDelete')?.addEventListener('click', () => { f.ingredients = f.ingredients.filter(x => x.id !== i.id); syncFood36(); closeModal36(); render(); });
    document.getElementById('v36IngSave').onclick = () => {
      const title = document.getElementById('v36IngTitle').value.trim(); if (!title) return toast('Укажи продукт');
      const patch = { mealId, title, perPerson: Math.max(0, num(document.getElementById('v36IngPer').value)), unit: document.getElementById('v36IngUnit').value.trim() || 'шт.', home: Math.max(0, num(document.getElementById('v36IngHome').value)), price: Math.max(0, num(document.getElementById('v36IngPrice').value)), buyer: document.getElementById('v36IngBuyer').value };
      if (edit) Object.assign(i, patch); else f.ingredients.push({ id: `fi36_${Date.now()}`, purchased: 0, bring: [], ...patch });
      syncFood36(); closeModal36(); render();
    };
  }

  function foodIOModal36() {
    const payload = { format: 'raznye-ludi-food-v36', version: 1, reservePct: S.foodV36.reservePct, meals: copy(S.foodV31.meals), ingredients: copy(S.foodV31.ingredients), water: copy(S.foodV36.water) };
    const body = `<p class="v36-modal-copy">Этот JSON можно сохранить, отредактировать вручную или передать ChatGPT. При импорте текущий план питания и воды будет заменён.</p><textarea id="v36FoodJson" rows="18">${esc(JSON.stringify(payload, null, 2))}</textarea>`;
    const l = openModal36('Импорт / экспорт питания', body, `<button class="btn alt" data-v36-close>Закрыть</button><button class="btn alt" id="v36FoodCopy">Копировать</button><button class="btn sand" id="v36FoodImport">Импортировать JSON</button>`);
    if (!l) return;
    document.getElementById('v36FoodCopy').onclick = async () => { const t = document.getElementById('v36FoodJson').value; try { await navigator.clipboard.writeText(t); toast('JSON скопирован'); } catch (e) { document.getElementById('v36FoodJson').select(); toast('Текст выделен — скопируй вручную'); } };
    document.getElementById('v36FoodImport').onclick = () => {
      try {
        const p = JSON.parse(document.getElementById('v36FoodJson').value);
        if (!p || !Array.isArray(p.meals) || !Array.isArray(p.ingredients)) throw new Error('bad format');
        S.foodV31.meals = p.meals; S.foodV31.ingredients = p.ingredients; S.foodV31.mealChecks ||= {}; S.foodV31.attendance ||= {};
        if (Number.isFinite(+p.reservePct)) S.foodV36.reservePct = Math.max(0, +p.reservePct);
        if (p.water && typeof p.water === 'object') S.foodV36.water = { ...S.foodV36.water, ...p.water, assignments: { ...(p.water.assignments || {}) } };
        ensureFood36(); syncFood36(); closeModal36(); render(); toast('План питания импортирован');
      } catch (e) { toast('Не удалось прочитать JSON'); }
    };
  }

  function autoWater36() {
    const c = waterCalc36(); if (!c.people.length) return;
    const raw = c.total / c.people.length;
    let left = c.total;
    c.people.forEach((p, idx) => {
      const v = idx === c.people.length - 1 ? left : Math.round(raw * 10) / 10;
      S.foodV36.water.assignments[p.id] = Math.max(0, v); left -= v;
    });
    save(); render();
  }

  function setAggregatePurchased36(encoded) {
    const key = decodeURIComponent(encoded), a = foodAggregates36().find(x => x.key === key); if (!a) return;
    const done = a.toBuy <= 0.0001;
    a.lines.forEach(i => { i.purchased = done ? 0 : Math.max(0, ingredientNeed36(i) - num(i.home) - bringQty36(i)); });
    syncFood36(); render();
  }
  function setAggregateBuyer36(encoded, pid) {
    const key = decodeURIComponent(encoded), a = foodAggregates36().find(x => x.key === key); if (!a) return;
    a.lines.forEach(i => i.buyer = pid); syncFood36(); render();
  }

  function bind36() {
    ensure36(false);
    if (tab === 'roles') {
      document.querySelectorAll('[data-v36-role]').forEach(s => s.onchange = () => { const r = S.rolesV36.roles.find(x => x.id === s.dataset.v36Role); if (r) r.p = s.value; ensureRoles36(); save(); render(); });
      document.querySelectorAll('[data-v36-skill]').forEach(b => b.onclick = () => { const [pid, skill] = b.dataset.v36Skill.split(':'); const a = S.rolesV36.skills[pid] ||= []; const i = a.indexOf(skill); if (i >= 0) a.splice(i, 1); else a.push(skill); save(); render(); });
    }
    if (tab === 'gear') {
      document.querySelectorAll('[data-v36-gear-mode]').forEach(b => b.onclick = () => { gearMode36 = b.dataset.v36GearMode; render(); });
      document.querySelectorAll('.v36-gear-group').forEach(d => d.addEventListener('toggle', () => { const id = d.dataset.v36Cat; if (d.open) openGearCats36.add(id); else openGearCats36.delete(id); }));
      document.querySelectorAll('[data-v36-gear-ready]').forEach(b => b.onclick = () => { const id = b.dataset.v36GearReady, current = gearStatus36(S.current, id); S.gearV36.status[S.current][id] = current === 'ready' ? 'unset' : 'ready'; syncGear36(); render(); });
      document.querySelectorAll('[data-v36-gear-status]').forEach(s => s.onchange = () => { S.gearV36.status[S.current][s.dataset.v36GearStatus] = s.value; syncGear36(); render(); });
      document.getElementById('v36AddGear')?.addEventListener('click', () => gearItemModal36());
      document.getElementById('v36AddCat')?.addEventListener('click', () => gearCategoryModal36());
      document.querySelectorAll('[data-v36-edit-item]').forEach(b => b.onclick = () => gearItemModal36(b.dataset.v36EditItem));
      document.querySelectorAll('[data-v36-edit-cat]').forEach(b => b.onclick = () => gearCategoryModal36(b.dataset.v36EditCat));
      document.querySelectorAll('[data-v36-delete-item]').forEach(b => b.onclick = () => { const id = b.dataset.v36DeleteItem, x = S.gearV36.items.find(i => i.id === id); if (!x || !confirm(`Удалить «${x.title}» из шаблона похода?`)) return; S.gearV36.items = S.gearV36.items.filter(i => i.id !== id); Object.values(S.gearV36.status).forEach(s => delete s[id]); syncGear36(); render(); });
      document.getElementById('v36AddShared')?.addEventListener('click', () => sharedModal36());
      document.querySelectorAll('[data-v36-shared-edit]').forEach(b => b.onclick = () => sharedModal36(b.dataset.v36SharedEdit));
      document.querySelectorAll('[data-v36-shared-assign]').forEach(b => b.onclick = () => sharedAssignModal36(b.dataset.v36SharedAssign));
      document.querySelectorAll('[data-v36-shared-confirm]').forEach(b => b.onclick = () => { const x = (S.shared || []).find(g => g.id === b.dataset.v36SharedConfirm); if (!x) return; x.confirmed ||= []; const i = x.confirmed.indexOf(S.current); if (i >= 0) x.confirmed.splice(i, 1); else x.confirmed.push(S.current); save(); render(); });
    }
    if (tab === 'food') {
      document.querySelectorAll('[data-v36-food-mode]').forEach(b => b.onclick = () => { foodMode36 = b.dataset.v36FoodMode; render(); });
      document.getElementById('v36AddMeal')?.addEventListener('click', () => mealModal36());
      document.querySelectorAll('[data-v36-add-meal-day]').forEach(b => b.onclick = () => mealModal36('', b.dataset.v36AddMealDay));
      document.querySelectorAll('[data-v36-edit-meal]').forEach(b => b.onclick = () => mealModal36(b.dataset.v36EditMeal));
      document.querySelectorAll('[data-v36-add-ing]').forEach(b => b.onclick = () => ingredientModal36(b.dataset.v36AddIng));
      document.querySelectorAll('[data-v36-edit-ing]').forEach(b => b.onclick = () => { const i = S.foodV31.ingredients.find(x => x.id === b.dataset.v36EditIng); if (i) ingredientModal36(i.mealId, i.id); });
      document.querySelectorAll('[data-v36-meal-check]').forEach(b => b.onclick = () => { const [mid, k] = b.dataset.v36MealCheck.split(':'); S.foodV31.mealChecks[mid][S.current][k] = !S.foodV31.mealChecks[mid][S.current][k]; save(); render(); });
      const reserve = document.getElementById('v36FoodReserve'); if (reserve) reserve.onchange = () => { S.foodV36.reservePct = Math.max(0, num(reserve.value)); syncFood36(); render(); };
      document.querySelectorAll('[data-v36-product-purchased]').forEach(b => b.onclick = () => setAggregatePurchased36(b.dataset.v36ProductPurchased));
      document.querySelectorAll('[data-v36-product-buyer]').forEach(s => s.onchange = () => setAggregateBuyer36(s.dataset.v36ProductBuyer, s.value));
      document.getElementById('v36FoodIo')?.addEventListener('click', foodIOModal36);
      document.querySelectorAll('[data-v36-water]').forEach(i => i.onchange = () => { S.foodV36.water[i.dataset.v36Water] = Math.max(0, num(i.value)); save(); render(); });
      document.querySelectorAll('[data-v36-water-person]').forEach(i => i.onchange = () => { S.foodV36.water.assignments[i.dataset.v36WaterPerson] = Math.max(0, num(i.value)); save(); render(); });
      document.getElementById('v36AutoWater')?.addEventListener('click', autoWater36);
    }
    if (tab === 'route') requestAnimationFrame(setupRouteYandex36);
  }

  function loadYandex36() {
    if (window.ymaps3?.ready) return window.ymaps3.ready.then(() => window.ymaps3);
    if (yandexLoader36) return yandexLoader36;
    yandexLoader36 = new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src?.includes('api-maps.yandex.ru/v3/'));
      const ready = () => window.ymaps3?.ready ? window.ymaps3.ready.then(() => resolve(window.ymaps3)).catch(reject) : reject(new Error('ymaps3 unavailable'));
      if (existing) {
        if (window.ymaps3?.ready) return ready();
        existing.addEventListener('load', ready, { once: true }); existing.addEventListener('error', reject, { once: true }); return;
      }
      const s = document.createElement('script'); s.async = true; s.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(YANDEX_KEY)}&lang=ru_RU`; s.addEventListener('load', ready, { once: true }); s.addEventListener('error', reject, { once: true }); document.head.appendChild(s);
    });
    return yandexLoader36;
  }

  function routeLocation36() {
    if (typeof routeMapV11 === 'undefined' || !routeMapV11) return null;
    const c = routeMapV11.getCenter(); return { center: [c.lng, c.lat], zoom: routeMapV11.getZoom() };
  }
  function routeYandexStatus36(text = '', error = false) {
    const el = routeYandex36.status; if (!el) return; el.textContent = text; el.classList.toggle('show', !!text); el.classList.toggle('error', !!error);
  }
  function syncRouteYandex36() {
    routeYandex36.raf = 0; if (!routeYandex36.active || !routeYandex36.map) return;
    const location = routeLocation36(); if (!location) return;
    try { routeYandex36.map.setLocation({ ...location, duration: 0 }); } catch (e) {}
  }
  function scheduleRouteYandex36() { if (routeYandex36.raf) cancelAnimationFrame(routeYandex36.raf); routeYandex36.raf = requestAnimationFrame(syncRouteYandex36); }

  async function enableRouteYandex36(button) {
    const mapEl = document.getElementById('routeMapFinal'); if (!mapEl || typeof routeMapV11 === 'undefined' || !routeMapV11) return;
    const shell = mapEl.parentElement; if (!shell) return;
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    let host = shell.querySelector('.route-yandex-v36'); if (!host) { host = document.createElement('div'); host.className = 'route-yandex-v36'; shell.insertBefore(host, mapEl); }
    let status = shell.querySelector('.route-yandex-status-v36'); if (!status) { status = document.createElement('div'); status.className = 'route-yandex-status-v36'; shell.appendChild(status); }
    routeYandex36.host = host; routeYandex36.status = status; routeYandex36.leaflet = mapEl; routeYandex36.active = true;
    shell.classList.add('route-yandex-active-v36'); routeYandexStatus36('Загрузка Яндекс Карт…');
    const controls = button?.parentElement?.querySelectorAll('button') || []; controls.forEach(b => b.classList.toggle('active', b === button)); if (button) button.textContent = 'Яндекс';
    try {
      const ymaps3 = await loadYandex36();
      if (!routeYandex36.map) {
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;
        routeYandex36.map = new YMap(host, { location: routeLocation36() || { center: [37.93, 55.59], zoom: 13 }, behaviors: [], mode: 'raster', theme: 'light' }, [new YMapDefaultSchemeLayer(), new YMapDefaultFeaturesLayer()]);
      }
      if (!routeMapV11.__v36YandexBound) { routeMapV11.__v36YandexBound = true; routeMapV11.on('move zoom moveend zoomend resize', scheduleRouteYandex36); }
      routeYandexStatus36(''); scheduleRouteYandex36();
    } catch (e) { console.error('Yandex route map failed', e); routeYandexStatus36('Яндекс Карты не загрузились. Проверьте ограничения ключа и обновите страницу.', true); }
  }

  function disableRouteYandex36() {
    routeYandex36.active = false;
    document.querySelector('.map-shell-v11.route-yandex-active-v36, .route-yandex-active-v36')?.classList.remove('route-yandex-active-v36');
    routeYandexStatus36('');
  }

  function routeMapButton36() {
    const mapEl = document.getElementById('routeMapFinal'); if (!mapEl) return null;
    const region = mapEl.closest('.route-map') || mapEl.parentElement?.parentElement || document;
    const buttons = [...region.querySelectorAll('button')];
    let b = buttons.find(x => ['город', 'яндекс'].includes(x.textContent.trim().toLowerCase()));
    if (!b) {
      const sw = region.querySelector('.map-layer-switch-v11, .route-map-head-v11 div:last-child');
      if (sw) { b = document.createElement('button'); b.type = 'button'; b.textContent = 'Яндекс'; b.dataset.v36YandexRoute = '1'; sw.appendChild(b); }
    } else { b.textContent = 'Яндекс'; b.dataset.v36YandexRoute = '1'; }
    return b;
  }

  function setupRouteYandex36() {
    const b = routeMapButton36(); if (!b) return;
    const mapEl = document.getElementById('routeMapFinal'); const region = mapEl?.closest('.route-map') || mapEl?.parentElement?.parentElement;
    if (region) [...region.querySelectorAll('button')].filter(x => ['карта', 'спутник'].includes(x.textContent.trim().toLowerCase())).forEach(x => {
      if (!x.dataset.v36YandexOff) { x.dataset.v36YandexOff = '1'; x.addEventListener('click', disableRouteYandex36, true); }
    });
    if (!b.dataset.v36Bound) { b.dataset.v36Bound = '1'; b.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); enableRouteYandex36(b); }, true); }
  }

  ensure36(true);
  progress = progress36;
  rolesPage = rolePage36;
  gearPage = gearPage36;

  const renderBefore36 = render;
  render = function renderV36() {
    ensure36(false);
    if (tab !== 'food') return renderBefore36();
    renderNav();
    const who = document.getElementById('who');
    if (who) who.innerHTML = (S.participants || []).map(p => `<option value="${p.id}" ${p.id === S.current ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    document.getElementById('app').innerHTML = foodPage36();
    bind();
  };

  const bindBefore36 = bind;
  bind = function bindV36() { bindBefore36(); bind36(); };

  document.addEventListener('click', e => {
    if (tab !== 'route') return;
    const b = e.target.closest('button'); if (!b) return;
    const t = b.textContent.trim().toLowerCase();
    if (['город', 'яндекс'].includes(t) && document.getElementById('routeMapFinal') && (b.closest('.route-map') || b.closest('.map-layer-switch-v11'))) {
      e.preventDefault(); e.stopImmediatePropagation(); enableRouteYandex36(b);
    }
  }, true);

  const build = document.querySelector('.build-label'); if (build) build.textContent = BUILD;
  render();
})();
