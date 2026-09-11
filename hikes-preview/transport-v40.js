/* V40 — transport workspace: profile is the single source of driver/car data, event rides keep only event-specific settings, Yandex JS API powers transport maps and pickup-point selection. */
(() => {
  'use strict';

  const YANDEX_KEY_V40 = 'ec183557-30ee-4662-86c4-c363798c6092';
  const COLORS_V40 = ['#2f6b4f','#3b74a8','#9a6a2b','#7557a6','#5f7d70','#a35454'];
  const mapState40 = { map: null, entities: [], points: new Map(), host: null, status: null };
  const pickerState40 = { map: null, marker: null, listener: null };
  const requestMapState40 = { map: null, markers: [], points: new Map() };
  let yandexPromise40 = null;

  function organizer40() {
    const roles = S.rolesV36?.roles || [];
    const lead = roles.find(r => r.id === 'lead')?.p;
    const logistics = roles.find(r => r.id === 'logistics')?.p;
    return S.current === 'p1' || S.current === lead || S.current === logistics;
  }

  function profile40(pid = S.current) {
    return transportProfileV24(pid) || { driver:false, defaultSeats:0, phone:'', vehicle:'', color:'', plate:'' };
  }

  function rideVehicle40(r) {
    const p = profile40(r.driver);
    return {
      vehicle: p.vehicle || r.vehicle || 'Автомобиль не указан',
      color: p.color || r.color || '',
      plate: p.plate || r.plate || ''
    };
  }

  function syncRideProfile40(r) {
    if (!r) return;
    const p = profile40(r.driver);
    if (p.vehicle) r.vehicle = p.vehicle;
    if (p.color) r.color = p.color;
    if (p.plate) r.plate = p.plate;
  }

  function openProfile40() {
    tab = 'profile';
    render();
  }

  function loadYandex40() {
    if (window.ymaps3?.ready) return window.ymaps3.ready.then(() => window.ymaps3);
    if (yandexPromise40) return yandexPromise40;
    yandexPromise40 = new Promise((resolve, reject) => {
      const ready = () => {
        if (!window.ymaps3?.ready) return reject(new Error('Yandex Maps API is unavailable'));
        window.ymaps3.ready.then(() => resolve(window.ymaps3)).catch(reject);
      };
      const existing = [...document.scripts].find(s => s.src?.includes('api-maps.yandex.ru/v3/'));
      if (existing) {
        if (window.ymaps3?.ready) return ready();
        existing.addEventListener('load', ready, { once:true });
        existing.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once:true });
        setTimeout(() => { if (window.ymaps3?.ready) ready(); }, 1200);
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.dataset.rlTransportYandexV40 = '1';
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(YANDEX_KEY_V40)}&lang=ru_RU`;
      script.addEventListener('load', ready, { once:true });
      script.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once:true });
      document.head.appendChild(script);
    });
    return yandexPromise40;
  }

  function carSvg40() {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8.5 22.5 11 16.8c.7-1.7 2.1-2.8 3.9-3.1l8.7-1.3c1.7-.2 3.3.4 4.4 1.7l4.3 5.1 1.6.5c1.3.4 2.1 1.6 2.1 2.9v5.1h-2.8a4.5 4.5 0 0 1-8.7 0h-9a4.5 4.5 0 0 1-8.7 0H4v-3.2c0-1.1.7-2.1 1.8-2.5l2.7-.9Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m12 20 2-4.1 9.8-1.4c.9-.1 1.8.2 2.4.9l3.7 4.6H12Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="11.2" cy="27.4" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="28.8" cy="27.4" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`;
  }

  function yMarkerElement40(kind, label, title, subtitle = '') {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `tv40-y-marker ${kind}`;
    el.innerHTML = `<span>${esc(label)}</span><em><b>${esc(title)}</b>${subtitle ? `<small>${esc(subtitle)}</small>` : ''}</em>`;
    return el;
  }

  function destroyYandexMap40(state = mapState40) {
    try { state.map?.destroy?.(); } catch (e) {}
    state.map = null;
    if (state.entities) state.entities.length = 0;
    if (state.markers) state.markers.length = 0;
    state.points?.clear?.();
  }

  function allTransportPoints40() {
    const out = [];
    const a = tv24().arrival;
    if (hasCoordV24(a)) out.push({ key:'arrival', kind:'arrival', label:'★', title:a.title || 'Место мероприятия', subtitle:dir === 'there' ? (a.time || '') : (a.returnTime || ''), lon:+a.lon, lat:+a.lat });
    tv24().rides[dir].forEach((r, ri) => {
      (r.stops || []).forEach((s, si) => {
        if (!hasCoordV24(s)) return;
        out.push({ key:`${r.id}:${s.id}`, kind:'pickup', label:String(si + 1), title:s.title || stopKindV24(dir), subtitle:`${pn(r.driver)}${s.time ? ` · ${s.time}` : ''}`, lon:+s.lon, lat:+s.lat, rideId:r.id, stopId:s.id, color:COLORS_V40[ri % COLORS_V40.length] });
      });
    });
    return out;
  }

  function bounds40(points) {
    if (!points.length) return null;
    if (points.length === 1) return { center:[points[0].lon, points[0].lat], zoom:15 };
    const lons = points.map(p => p.lon), lats = points.map(p => p.lat);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
    if (Math.abs(maxLon - minLon) < .0001 && Math.abs(maxLat - minLat) < .0001) return { center:[minLon, minLat], zoom:15 };
    return { bounds:[[minLon, minLat],[maxLon, maxLat]] };
  }

  function setMapStatus40(text = '', error = false) {
    const el = document.getElementById('tv40MapStatus');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('show', !!text);
    el.classList.toggle('error', !!error);
  }

  async function mountTransportMap40() {
    const host = document.getElementById('transportMapV24');
    if (!host) return;
    destroyYandexMap40(mapState40);
    mapState40.host = host;
    mapState40.status = document.getElementById('tv40MapStatus');
    setMapStatus40('Загрузка Яндекс Карт…');
    try {
      const ymaps3 = await loadYandex40();
      if (!document.getElementById('transportMapV24')) return;
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;
      const points = allTransportPoints40();
      const location = bounds40(points) || { center:[37.93,55.59], zoom:11 };
      const map = new YMap(host, { location, mode:'raster', theme:'light', zoomRange:{min:3,max:20} }, [new YMapDefaultSchemeLayer(), new YMapDefaultFeaturesLayer()]);
      mapState40.map = map;
      points.forEach(p => {
        const el = yMarkerElement40(p.kind, p.label, p.title, p.subtitle);
        el.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); focusTransportPoint40(p.key); };
        if (p.color) el.style.setProperty('--ride-color', p.color);
        const marker = new YMapMarker({ coordinates:[p.lon,p.lat], zIndex:p.kind === 'arrival' ? 50 : 30 }, el);
        map.addChild(marker);
        mapState40.entities.push(marker);
        mapState40.points.set(p.key, p);
      });
      setMapStatus40('');
    } catch (error) {
      console.error('Transport Yandex map failed', error);
      setMapStatus40('Не удалось загрузить Яндекс Карту. Проверьте доступ ключа и обновите страницу.', true);
    }
  }

  function fitTransportMap40() {
    const points = [...mapState40.points.values()];
    const loc = bounds40(points);
    if (mapState40.map && loc) mapState40.map.setLocation({ ...loc, duration:250 });
  }

  function focusTransportPoint40(key) {
    const p = mapState40.points.get(key) || allTransportPoints40().find(x => x.key === key);
    if (!p) return;
    mapState40.map?.setLocation?.({ center:[p.lon,p.lat], zoom:16, duration:260 });
    document.querySelectorAll('[data-tv40-point-key]').forEach(el => el.classList.toggle('is-focused', el.dataset.tv40PointKey === key));
    const row = document.querySelector(`[data-tv40-point-key="${CSS.escape(key)}"]`);
    row?.scrollIntoView?.({ block:'nearest', behavior:'smooth' });
  }

  function summary40() {
    const s = transportSummaryV24(dir);
    const unresolved = s.unset + s.pending;
    const metrics = [
      ['all','Участников',s.total,'подтвердили участие'],
      ['incars','В машинах',s.inCars,'подтверждённые места'],
      ['free','Свободных мест',s.free,s.drivers ? `${s.drivers} водител${s.drivers === 1 ? 'ь' : 'я'}` : 'рейсов пока нет'],
      ['unresolved','Без решения',unresolved,s.pending ? `${s.pending} ждут ответа` : 'нужно выбрать транспорт']
    ];
    return `<div class="tv40-summary">${metrics.map(([filter,label,value,note]) => `<button type="button" data-tv40-people="${filter}" class="${filter === 'unresolved' && unresolved ? 'warn' : ''}"><small>${label}</small><strong>${value}</strong><span>${note}</span></button>`).join('')}</div>`;
  }

  function destination40() {
    const a = tv24().arrival;
    const time = dir === 'there' ? a.time : a.returnTime;
    return `<section class="tv40-destination" data-tv40-point-key="arrival"><div class="tv40-dest-pin">★</div><div class="tv40-dest-copy"><small>${dir === 'there' ? 'МЕСТО ПРИБЫТИЯ' : 'ТОЧКА ОБРАТНОГО ВЫЕЗДА'}</small><h2>${esc(a.title || 'Место мероприятия')}</h2><p>${esc(a.note || 'Точка транспорта задаётся отдельно от пешего маршрута.')}</p><div><span>${time ? `${dir === 'there' ? 'Быть к' : 'Выезд'} ${esc(time)}` : 'Время уточняется'}</span><code>${esc(fmtCoordV24(a.lat,a.lon))}</code></div></div><div class="tv40-dest-actions"><button class="btn alt sm" type="button" data-tv40-focus="arrival">Показать на карте</button>${hasCoordV24(a) ? '<button class="btn alt sm" type="button" data-tv24-yandex-point="arrival">Открыть в Яндекс</button>' : ''}${organizer40() ? '<button class="btn alt sm" type="button" id="tv40EditArrival">Изменить</button>' : ''}</div></section>`;
  }

  function profileReference40() {
    const p = profile40();
    const ride = transportDriverRideV24(S.current, dir);
    const vehicle = p.vehicle ? `${p.vehicle}${p.color ? ` · ${p.color}` : ''}` : 'Автомобиль не указан';
    return `<div class="tv40-profile-ref"><div class="avatar">${initials(pn(S.current))}</div><div><small>ДАННЫЕ ИЗ МОЕГО ПРОФИЛЯ</small><strong>${p.driver ? 'Я водитель' : 'Я не водитель'}</strong><span>${p.driver ? `${esc(vehicle)} · обычно ${Math.max(0,+p.defaultSeats||0)} пассажирских мест` : 'Чтобы создавать рейсы, включите водителя в личном профиле.'}</span></div><div class="tv40-profile-actions"><button type="button" class="btn alt sm" id="tv40OpenProfile">Мой профиль</button>${p.driver && !ride ? '<button type="button" class="btn sand sm" id="tv40CreateRide">+ Создать рейс</button>' : ''}</div></div>`;
  }

  function myTrip40() {
    const active = transportRequestV24();
    const c = transportChoiceV24();
    const own = transportDriverRideV24();
    if (own) return `<section class="tv40-mytrip driver"><div><small>МОЙ РЕЙС · ${directionLabelV24(dir).toUpperCase()}</small><strong>${(own.passengers||[]).length}/${+own.seats||0} пассажиров</strong><span>${transportFreeV24(own)} свободных мест · ${(own.stops||[]).length} ${dir === 'there' ? 'точек посадки' : 'точек высадки'}</span></div><div class="row-actions"><button class="btn sand sm" data-tv40-add-stop="${own.id}">+ ${dir === 'there' ? 'Точка посадки' : 'Точка высадки'}</button><button class="btn alt sm" data-tv40-edit-ride="${own.id}">Параметры рейса</button>${dir === 'there' ? `<button class="btn alt sm" data-tv40-copy-back="${own.id}">Скопировать обратно</button>` : ''}</div></section>`;
    if (c.mode === 'self') return `<section class="tv40-mytrip self"><div><small>МОЙ ТРАНСПОРТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Добираюсь самостоятельно</strong><span>Ориентируйтесь на место и время мероприятия.</span></div><button class="btn alt sm" data-tv40-unset-self>Изменить</button></section>`;
    if (active) {
      const r = active.ride, q = active.request, stop = (r.stops||[]).find(s => s.id === q.pickupId), approved = q.status === 'approved', prof = profile40(r.driver), car = rideVehicle40(r);
      return `<section class="tv40-mytrip ${approved ? 'approved' : 'pending'}"><div><small>${approved ? 'МЕСТО ПОДТВЕРЖДЕНО' : 'ЗАЯВКА У ВОДИТЕЛЯ'}</small><strong>${esc(pn(r.driver))} · ${esc(car.vehicle)}</strong><span>${esc(stop?.title || stopKindV24(dir))}${stop?.time ? ` · ${dir === 'there' ? 'быть к' : 'высадка'} ${esc(stop.time)}` : ''}</span>${approved && prof.phone ? `<a href="tel:${esc(prof.phone)}">${esc(prof.phone)}</a>` : ''}</div><div class="row-actions">${stop && hasCoordV24(stop) ? `<button class="btn sand sm" data-tv40-focus="${r.id}:${stop.id}">Показать точку</button><button class="btn alt sm" data-tv24-yandex-stop="${r.id}:${stop.id}">Открыть в Яндекс</button>` : ''}<button class="btn alt sm" data-tv40-cancel="${q.id}">${approved ? 'Отказаться от места' : 'Отменить заявку'}</button></div></section>`;
    }
    return `<section class="tv40-mytrip unset"><div><small>МОЙ ТРАНСПОРТ · ${directionLabelV24(dir).toUpperCase()}</small><strong>Транспорт пока не выбран</strong><span>Выберите подходящий рейс ниже или отметьте самостоятельную поездку.</span></div><button class="btn alt sm" data-tv40-self>Поеду самостоятельно</button></section>`;
  }

  function stopRows40(r) {
    const stops = r.stops || [];
    if (!stops.length) return `<div class="tv40-empty-inline">${r.driver === S.current ? `Добавьте ${dir === 'there' ? 'точку посадки' : 'точку высадки'} на Яндекс Карте.` : `Водитель пока не указал ${dir === 'there' ? 'точку посадки' : 'точку высадки'}.`}</div>`;
    return stops.map((s, i) => `<button type="button" class="tv40-stop ${hasCoordV24(s) ? '' : 'missing'}" data-tv40-focus="${r.id}:${s.id}" data-tv40-point-key="${r.id}:${s.id}"><i>${i + 1}</i><span><b>${esc(s.title || stopKindV24(dir))}</b><small>${s.time ? esc(s.time) : 'время уточняется'}${s.note ? ` · ${esc(s.note)}` : ''}</small></span><em>На карте</em></button>`).join('');
  }

  function pendingRequests40(r) {
    const pending = pendingForRideV24(r);
    if (r.driver !== S.current || !pending.length) return '';
    return `<div class="tv40-requests"><div class="tv40-requests-head"><b>Заявки пассажиров</b><span>${pending.length}</span></div>${pending.map(q => { const st = (r.stops||[]).find(s => s.id === q.pickupId); return `<div class="tv40-request"><span><strong>${esc(pn(q.pid))}</strong><small>${esc(st?.title || 'Точка не выбрана')}${st?.time ? ` · ${esc(st.time)}` : ''}</small></span><button class="btn sand sm" data-tv40-approve="${r.id}:${q.id}">Подтвердить</button><button class="btn alt sm" data-tv40-decline="${r.id}:${q.id}">Отказать</button></div>`; }).join('')}</div>`;
  }

  function rideCard40(r, index) {
    syncRideProfile40(r);
    const me = r.driver === S.current, free = transportFreeV24(r), car = rideVehicle40(r), active = transportRequestV24(), blocked = active && active.ride.id !== r.id, full = free <= 0;
    return `<div class="tv40-ride-wrap"><article class="tv40-ride ${me ? 'mine' : ''}"><header><div class="tv40-driver"><div class="tv40-car-icon">${carSvg40()}</div><div><small>${me ? 'МОЙ РЕЙС' : 'ВОДИТЕЛЬ'}</small><h3>${esc(pn(r.driver))}</h3><p>${esc(car.vehicle)}${car.color ? ` · ${esc(car.color)}` : ''}${car.plate ? ` · ${esc(car.plate)}` : ''}</p></div></div><div class="tv40-capacity ${full ? 'full' : ''}"><strong>${free}</strong><span>свободно из ${+r.seats||0}</span></div></header><div class="tv40-stops">${stopRows40(r)}</div>${r.comment ? `<div class="tv40-comment">${esc(r.comment)}</div>` : ''}<div class="tv40-passengers"><div><small>ПАССАЖИРЫ</small><span>${(r.passengers||[]).length ? (r.passengers||[]).map(pid => `<b title="${esc(pn(pid))}">${esc(initials(pn(pid)))}</b>`).join('') : '<em>Пока никого</em>'}</span></div><div class="row-actions">${me ? `<button class="btn sand sm" data-tv40-add-stop="${r.id}">+ ${dir === 'there' ? 'Посадка' : 'Высадка'}</button><button class="btn alt sm" data-tv40-edit-ride="${r.id}">Параметры</button>` : `<button class="btn sand sm" data-tv40-request="${r.id}" ${full || blocked || active?.ride.id === r.id ? 'disabled' : ''}>${active?.ride.id === r.id ? 'Заявка отправлена' : full ? 'Мест нет' : 'Попроситься'}</button>`}<button class="btn alt sm" data-tv24-yandex-ride="${r.id}">Маршрут в Яндекс</button></div></div></article>${pendingRequests40(r)}</div>`;
  }

  function rides40() {
    const rides = tv24().rides[dir] || [];
    return `<section class="tv40-panel"><div class="tv40-panel-head"><div><div class="page-kicker">${dir === 'there' ? 'Туда' : 'Обратно'}</div><h2>${dir === 'there' ? 'Рейсы и точки посадки' : 'Обратные рейсы и высадки'}</h2><p>${dir === 'there' ? 'Пассажир выбирает водителя и конкретную точку. Водитель подтверждает заявку.' : 'Обратный путь ведётся отдельно: состав и точки можно изменить независимо.'}</p></div></div><div class="tv40-rides">${rides.length ? rides.map(rideCard40).join('') : `<div class="tv40-empty"><div class="tv40-empty-icon">${carSvg40()}</div><strong>Рейсов пока нет</strong><span>${profile40().driver ? 'Создайте первый рейс и отметьте точку посадки на карте.' : 'Когда водитель создаст рейс, он появится здесь.'}</span>${profile40().driver ? '<button class="btn sand sm" id="tv40CreateRideEmpty">+ Создать рейс</button>' : ''}</div>`}</div></section>`;
  }

  function mapPanel40() {
    return `<aside class="tv40-map-panel"><div class="tv40-map-head"><div><div class="page-kicker">Яндекс Карты</div><h2>Точки транспорта</h2><p>Место мероприятия и все точки ${dir === 'there' ? 'посадки' : 'высадки'} на одной карте.</p></div><button class="btn alt sm" type="button" id="tv40FitMap">Все точки</button></div><div class="tv40-map-wrap"><div id="transportMapV24" class="tv40-map"></div><div class="tv40-map-status" id="tv40MapStatus"></div></div><div class="tv40-map-foot"><span><i class="arrival"></i>Место мероприятия</span><span><i class="pickup"></i>${dir === 'there' ? 'Посадка' : 'Высадка'}</span><small>Маршрут по дорогам открывается отдельной кнопкой в Яндекс Картах.</small></div></aside>`;
  }

  function transportPage40() {
    ensureTransportV24();
    (tv24().rides[dir] || []).forEach(syncRideProfile40);
    return `${pageHead('Логистика','Транспорт','Рейсы, точки посадки и заявки пассажиров. Данные водителя и автомобиля редактируются только в личном профиле.', '<button class="btn alt" type="button" id="tv40ProfileTop">Мой профиль</button>')}
      <div class="tv40-shell">
        <div class="tv40-toolbar"><div class="segmented tv40-directions tv24-dir"><button class="${dir === 'there' ? 'active' : ''}" data-tv40-dir="there">Туда</button><button class="${dir === 'back' ? 'active' : ''}" data-tv40-dir="back">Обратно</button></div><span>${dir === 'there' ? 'Дорога к мероприятию' : 'Возвращение после мероприятия'}</span></div>
        ${summary40()}
        ${profileReference40()}
        ${destination40()}
        ${myTrip40()}
        <div class="tv40-workgrid">${rides40()}${mapPanel40()}</div>
      </div>`;
  }

  function peopleStatus40(pid) {
    const c = transportChoiceV24(pid,dir);
    if (c.mode === 'driver') {
      const r = transportDriverRideV24(pid,dir);
      return { label:'Водитель', tone:'ok', detail:r ? `${transportFreeV24(r)} свободных мест` : 'рейс не создан' };
    }
    if (c.mode === 'ride') {
      const r = transportRideV24(c.rideId,dir), st = (r?.stops||[]).find(s => s.id === c.pickupId);
      return { label:'Место подтверждено', tone:'ok', detail:r ? `${pn(r.driver)}${st ? ` · ${st.title}` : ''}` : 'машина выбрана' };
    }
    if (c.mode === 'request') return { label:'Ждёт ответа', tone:'warn', detail:'заявка у водителя' };
    if (c.mode === 'self') return { label:'Самостоятельно', tone:'', detail:'без машины команды' };
    return { label:'Без решения', tone:'risk', detail:'нужно выбрать транспорт' };
  }

  function openPeople40(filter = 'all') {
    const rides = tv24().rides[dir] || [];
    let people = (S.participants||[]).filter(p => p.rsvp === 'yes');
    if (filter === 'incars') people = people.filter(p => transportChoiceV24(p.id,dir).mode === 'ride');
    if (filter === 'unresolved') people = people.filter(p => ['unset','request'].includes(transportChoiceV24(p.id,dir).mode));
    if (filter === 'free') {
      const freeDrivers = new Set(rides.filter(r => transportFreeV24(r) > 0).map(r => r.driver));
      people = people.filter(p => freeDrivers.has(p.id));
    }
    const title = filter === 'incars' ? 'Пассажиры в машинах' : filter === 'free' ? 'Водители со свободными местами' : filter === 'unresolved' ? 'Без решения / ждут ответа' : 'Транспорт участников';
    openModal(title, `<div class="tv40-people">${people.length ? people.map(p => { const s = peopleStatus40(p.id), pr = profile40(p.id); return `<div class="tv40-person"><span class="avatar">${initials(p.name)}</span><span><b>${esc(p.name)}</b><small>${esc(s.detail)}</small></span><em class="${s.tone}">${esc(s.label)}</em>${pr.driver && pr.vehicle ? `<small>${esc(pr.vehicle)}</small>` : ''}</div>`; }).join('') : '<div class="tv40-empty-inline">По этому фильтру никого нет.</div>'}</div>`, () => true);
    const saveBtn = document.getElementById('modalSave'); if (saveBtn) saveBtn.textContent = 'Закрыть';
    document.getElementById('modalCancel')?.remove();
  }

  function rideModal40(ride = null, d = dir) {
    const p = profile40();
    if (!p.driver) return openProfile40();
    const existing = ride || { seats:Math.max(0,+p.defaultSeats||0), comment:'' };
    const carText = p.vehicle ? `${p.vehicle}${p.color ? ` · ${p.color}` : ''}${p.plate ? ` · ${p.plate}` : ''}` : 'Автомобиль не заполнен в профиле';
    openModal(ride ? 'Параметры рейса' : `Новый рейс · ${directionLabelV24(d)}`, `<div class="tv40-ride-editor"><div class="tv40-readonly-car"><div class="tv40-car-icon">${carSvg40()}</div><div><small>АВТОМОБИЛЬ ИЗ ПРОФИЛЯ</small><b>${esc(carText)}</b><span>Изменить машину можно только в «Моём профиле».</span></div><button class="btn alt sm" type="button" id="tv40ProfileFromRide">Профиль</button></div><div class="form-grid"><div class="field"><label>Пассажирских мест на этот рейс</label><input id="tv40RideSeats" type="number" min="0" max="12" value="${Math.max(0,+existing.seats||0)}"></div><div class="field full"><label>Комментарий пассажирам</label><textarea id="tv40RideComment" placeholder="Например: без крупного багажа; позвоните за 5 минут">${esc(existing.comment||'')}</textarea></div></div>${ride ? '<div class="tv40-danger"><button class="btn alt sm" type="button" id="tv40DeleteRide">Удалить рейс</button></div>' : ''}</div>`, layer => {
      const seats = Math.max(0,+layer.querySelector('#tv40RideSeats').value||0);
      if (ride && seats < (ride.passengers||[]).length) { toast('Мест не может быть меньше подтверждённых пассажиров'); return false; }
      let target = ride;
      if (!target) {
        if (transportDriverRideV24(S.current,d)) { toast('В этом направлении у вас уже есть рейс'); return false; }
        target = { id:`ride_${d}_${Date.now()}`, driver:S.current, seats, vehicle:p.vehicle||'', color:p.color||'', plate:p.plate||'', comment:'', stops:[], passengers:[], requests:[] };
        tv24().rides[d].push(target);
        tv24().choices[d][S.current] = { mode:'driver', rideId:target.id };
      }
      target.seats = seats;
      target.comment = layer.querySelector('#tv40RideComment').value.trim();
      syncRideProfile40(target);
      transportSaveV24(target.stops.length ? 'Рейс сохранён' : 'Рейс создан — добавьте точку на карте');
    });
    setTimeout(() => {
      document.getElementById('tv40ProfileFromRide')?.addEventListener('click', () => { document.getElementById('modalCancel')?.click(); openProfile40(); });
      document.getElementById('tv40DeleteRide')?.addEventListener('click', () => {
        if (!ride) return;
        if ((ride.passengers||[]).length || pendingForRideV24(ride).length) return toast('Сначала закройте заявки и освободите пассажиров');
        if (!confirm('Удалить этот рейс?')) return;
        tv24().rides[d] = tv24().rides[d].filter(x => x.id !== ride.id);
        tv24().choices[d][ride.driver] = { mode:'unset' };
        document.getElementById('modalCancel')?.click();
        transportSaveV24('Рейс удалён');
      });
    }, 0);
  }

  function pickerInitial40(v) {
    if (hasCoordV24(v)) return [ +v.lon, +v.lat ];
    const a = tv24().arrival;
    if (hasCoordV24(a)) return [ +a.lon, +a.lat ];
    return [37.93,55.59];
  }

  function setPickerCoords40(coords, center = false) {
    const [lon,lat] = coords;
    const latInput = document.getElementById('tv40PointLat'), lonInput = document.getElementById('tv40PointLon'), label = document.getElementById('tv40PickerCoords');
    if (latInput) latInput.value = (+lat).toFixed(6);
    if (lonInput) lonInput.value = (+lon).toFixed(6);
    if (label) label.textContent = `${(+lat).toFixed(6)}, ${(+lon).toFixed(6)}`;
    pickerState40.marker?.update?.({ coordinates:[+lon,+lat] });
    if (center) pickerState40.map?.setLocation?.({ center:[+lon,+lat], zoom:16, duration:180 });
  }

  async function mountPickerMap40(v) {
    const el = document.getElementById('tv40PointMap');
    if (!el) return;
    try { pickerState40.map?.destroy?.(); } catch (e) {}
    pickerState40.map = null; pickerState40.marker = null; pickerState40.listener = null;
    const status = document.getElementById('tv40PickerStatus');
    if (status) status.textContent = 'Загрузка Яндекс Карт…';
    try {
      const ymaps3 = await loadYandex40();
      if (!document.getElementById('tv40PointMap')) return;
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = ymaps3;
      const initial = pickerInitial40(v);
      const map = new YMap(el, { location:{center:initial,zoom:hasCoordV24(v)?16:13}, mode:'raster', theme:'light', zoomRange:{min:3,max:20} }, [new YMapDefaultSchemeLayer(),new YMapDefaultFeaturesLayer()]);
      const markerEl = document.createElement('div'); markerEl.className = 'tv40-picker-marker'; markerEl.innerHTML = '<span></span>';
      const marker = new YMapMarker({ coordinates:initial, draggable:true, mapFollowsOnDrag:true, onDragEnd:(coords) => setPickerCoords40(coords,false) }, markerEl);
      const listener = new YMapListener({ layer:'any', onClick:(object,event) => { const c = event?.coordinates; if (Array.isArray(c) && c.length >= 2) setPickerCoords40(c,true); } });
      map.addChild(marker); map.addChild(listener);
      pickerState40.map = map; pickerState40.marker = marker; pickerState40.listener = listener;
      setPickerCoords40(initial,false);
      if (status) status.textContent = '';
      const syncManual = () => { const lat = +document.getElementById('tv40PointLat')?.value, lon = +document.getElementById('tv40PointLon')?.value; if (Number.isFinite(lat) && Number.isFinite(lon)) setPickerCoords40([lon,lat],true); };
      document.getElementById('tv40PointLat')?.addEventListener('change', syncManual);
      document.getElementById('tv40PointLon')?.addEventListener('change', syncManual);
    } catch (error) {
      console.error('Yandex point picker failed', error);
      if (status) { status.textContent = 'Карта не загрузилась. Координаты можно ввести вручную.'; status.classList.add('error'); }
    }
  }

  function pointModal40({ title, value = {}, kind = 'stop', onSave }) {
    const v = { title:value.title||'', lat:value.lat, lon:value.lon, time:value.time||'', note:value.note||'' };
    openModal(title, `<div class="tv40-picker"><div class="tv40-picker-side"><div class="field"><label>Название точки</label><input id="tv40PointTitle" value="${esc(v.title)}" placeholder="Например, парковка у метро"></div><div class="field"><label>Время</label><input id="tv40PointTime" type="time" value="${esc(v.time)}"></div><div class="field"><label>Комментарий / ориентир</label><textarea id="tv40PointNote" placeholder="Выход из метро, парковка, магазин, шлагбаум">${esc(v.note)}</textarea></div><div class="tv40-coords"><div class="field"><label>Широта</label><input id="tv40PointLat" type="number" step="0.000001" value="${hasCoordV24(v)?(+v.lat).toFixed(6):''}"></div><div class="field"><label>Долгота</label><input id="tv40PointLon" type="number" step="0.000001" value="${hasCoordV24(v)?(+v.lon).toFixed(6):''}"></div></div><div class="tv40-picker-note"><b>Как выбрать точку</b><span>Кликните по Яндекс Карте или перетащите зелёную метку. Название и ориентир заполните так, чтобы пассажир без звонка понял, куда идти.</span></div></div><div class="tv40-picker-map-wrap"><div id="tv40PointMap" class="tv40-picker-map"></div><div class="tv40-picker-status" id="tv40PickerStatus"></div><div class="tv40-picker-coordinate" id="tv40PickerCoords">${hasCoordV24(v)?esc(fmtCoordV24(v.lat,v.lon)):'Выберите точку'}</div></div></div>`, layer => {
      const obj = { title:layer.querySelector('#tv40PointTitle').value.trim(), time:layer.querySelector('#tv40PointTime').value, lat:+layer.querySelector('#tv40PointLat').value, lon:+layer.querySelector('#tv40PointLon').value, note:layer.querySelector('#tv40PointNote').value.trim() };
      if (!obj.title) { toast('Укажите название точки'); return false; }
      if (!Number.isFinite(obj.lat) || !Number.isFinite(obj.lon)) { toast('Выберите точку на карте или укажите координаты'); return false; }
      onSave(obj);
    });
    const modal = document.querySelector('#modalLayer .modal'); modal?.classList.add('tv40-point-modal');
    setTimeout(() => mountPickerMap40(v), 60);
  }

  function stopModal40(r, stop = null) {
    pointModal40({ title:stop ? `Изменить · ${stopKindV24(dir)}` : `Добавить · ${stopKindV24(dir)}`, value:stop||{}, kind:'stop', onSave:o => { if (stop) Object.assign(stop,o); else (r.stops||(r.stops=[])).push({id:`stop_${Date.now()}`,...o}); transportSaveV24(stop?'Точка обновлена':'Точка добавлена'); } });
    if (stop) setTimeout(() => {
      const body = document.querySelector('#modalLayer .modal-body'); if (!body) return;
      const active = (r.requests||[]).filter(q => q.pickupId === stop.id && ['pending','approved'].includes(q.status));
      const del = document.createElement('div'); del.className = 'tv40-danger'; del.innerHTML = `<button class="btn alt sm" type="button" id="tv40DeleteStop" ${active.length?'disabled':''}>Удалить точку</button>${active.length?`<small>Эту точку используют ${active.length} активных пассажиров / заявок.</small>`:''}`; body.querySelector('.tv40-picker-side')?.appendChild(del);
      document.getElementById('tv40DeleteStop')?.addEventListener('click', () => { if (active.length) return; r.stops = (r.stops||[]).filter(s => s.id !== stop.id); document.getElementById('modalCancel')?.click(); transportSaveV24('Точка удалена'); });
    },80);
  }

  function arrivalModal40() {
    const a = tv24().arrival, value = { ...a, time:dir === 'there' ? (a.time||'') : (a.returnTime||'') };
    pointModal40({ title:dir === 'there' ? 'Место прибытия мероприятия' : 'Место и время обратного выезда', value, kind:'arrival', onSave:o => { const next = {...a,title:o.title,lat:o.lat,lon:o.lon,note:o.note}; if (dir === 'there') next.time = o.time; else next.returnTime = o.time; tv24().arrival = next; transportSaveV24('Точка мероприятия обновлена'); } });
  }

  function requestMapPoints40(r) {
    return (r.stops||[]).filter(hasCoordV24).map((s,i) => ({key:s.id,title:s.title||stopKindV24(dir),subtitle:s.time||'',lon:+s.lon,lat:+s.lat,label:String(i+1)}));
  }

  async function mountRequestMap40(r) {
    const host = document.getElementById('tv40RequestMap'); if (!host) return;
    destroyYandexMap40(requestMapState40);
    try {
      const ymaps3 = await loadYandex40();
      if (!document.getElementById('tv40RequestMap')) return;
      const {YMap,YMapDefaultSchemeLayer,YMapDefaultFeaturesLayer,YMapMarker} = ymaps3;
      const pts = requestMapPoints40(r), loc = bounds40(pts) || {center:[37.93,55.59],zoom:12};
      const map = new YMap(host,{location:loc,mode:'raster',theme:'light',zoomRange:{min:3,max:20}},[new YMapDefaultSchemeLayer(),new YMapDefaultFeaturesLayer()]);
      requestMapState40.map = map;
      pts.forEach(p => { const el = yMarkerElement40('pickup',p.label,p.title,p.subtitle); el.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); const radio = document.querySelector(`[name="tv40Pickup"][value="${CSS.escape(p.key)}"]`); if (radio) { radio.checked = true; requestFocus40(p.key); } }; const m = new YMapMarker({coordinates:[p.lon,p.lat]},el); map.addChild(m); requestMapState40.markers.push(m); requestMapState40.points.set(p.key,p); });
    } catch(e) { console.error('Request map failed',e); host.innerHTML = '<div class="tv40-map-fallback">Карта недоступна. Точки можно выбрать по списку.</div>'; }
  }

  function requestFocus40(stopId) {
    const p = requestMapState40.points.get(stopId); if (!p) return;
    requestMapState40.map?.setLocation?.({center:[p.lon,p.lat],zoom:16,duration:180});
    document.querySelectorAll('.tv40-pickup-option').forEach(x => x.classList.toggle('active', x.dataset.stopId === stopId));
  }

  function requestModal40(r) {
    if (transportRequestV24()) return toast('Сначала отмените текущую заявку или освободите подтверждённое место');
    const stops = (r.stops||[]);
    if (!stops.length) return toast('Водитель ещё не указал точку посадки');
    openModal('Попроситься в машину', `<div class="tv40-request-picker"><div class="tv40-request-options"><p>Выберите, где ${dir === 'there' ? 'вас забрать' : 'вас высадить'}:</p>${stops.map((s,i) => `<label class="tv40-pickup-option ${i===0?'active':''}" data-stop-id="${s.id}"><input type="radio" name="tv40Pickup" value="${s.id}" ${i===0?'checked':''}><i>${i+1}</i><span><b>${esc(s.title||stopKindV24(dir))}</b><small>${s.time?esc(s.time):'время уточняется'}${s.note?` · ${esc(s.note)}`:''}</small><em>${esc(fmtCoordV24(s.lat,s.lon))}</em></span></label>`).join('')}</div><div class="tv40-request-map" id="tv40RequestMap"></div></div>`, layer => {
      if (transportFreeV24(r) <= 0) { toast('Свободных мест уже нет'); return false; }
      const pickupId = layer.querySelector('[name="tv40Pickup"]:checked')?.value; if (!pickupId) { toast('Выберите точку'); return false; }
      const q = {id:`req_${Date.now()}`,pid:S.current,pickupId,status:'pending',createdAt:Date.now()}; (r.requests||(r.requests=[])).push(q); tv24().choices[dir][S.current] = {mode:'request',rideId:r.id,requestId:q.id,pickupId}; transportSaveV24('Заявка отправлена водителю');
    });
    document.querySelector('#modalLayer .modal')?.classList.add('tv40-request-modal');
    setTimeout(() => {
      document.querySelectorAll('[name="tv40Pickup"]').forEach(radio => radio.addEventListener('change', () => requestFocus40(radio.value)));
      mountRequestMap40(r).then(() => { const checked = document.querySelector('[name="tv40Pickup"]:checked'); if (checked) requestFocus40(checked.value); });
    },60);
  }

  function bindTransport40() {
    document.querySelectorAll('[data-tv40-dir]').forEach(b => b.onclick = () => { dir = b.dataset.tv40Dir; render(); });
    document.getElementById('tv40OpenProfile')?.addEventListener('click', openProfile40);
    document.getElementById('tv40ProfileTop')?.addEventListener('click', openProfile40);
    document.getElementById('tv40CreateRide')?.addEventListener('click', () => rideModal40(null,dir));
    document.getElementById('tv40CreateRideEmpty')?.addEventListener('click', () => rideModal40(null,dir));
    document.getElementById('tv40EditArrival')?.addEventListener('click', arrivalModal40);
    document.querySelectorAll('[data-tv40-edit-ride]').forEach(b => b.onclick = () => rideModal40(transportRideV24(b.dataset.tv40EditRide),dir));
    document.querySelectorAll('[data-tv40-add-stop]').forEach(b => b.onclick = () => stopModal40(transportRideV24(b.dataset.tv40AddStop)));
    document.querySelectorAll('[data-tv40-request]').forEach(b => b.onclick = () => requestModal40(transportRideV24(b.dataset.tv40Request)));
    document.querySelectorAll('[data-tv40-approve]').forEach(b => b.onclick = () => { const [rid,qid] = b.dataset.tv40Approve.split(':'); approveRequestV24(rid,qid); });
    document.querySelectorAll('[data-tv40-decline]').forEach(b => b.onclick = () => { const [rid,qid] = b.dataset.tv40Decline.split(':'); declineRequestV24(rid,qid); });
    document.querySelectorAll('[data-tv40-cancel]').forEach(b => b.onclick = () => cancelRequestV24(b.dataset.tv40Cancel));
    document.querySelectorAll('[data-tv40-self]').forEach(b => b.onclick = setSelfV24);
    document.querySelectorAll('[data-tv40-unset-self]').forEach(b => b.onclick = unsetSelfV24);
    document.querySelectorAll('[data-tv40-copy-back]').forEach(b => b.onclick = () => copyRideBackV24(b.dataset.tv40CopyBack));
    document.querySelectorAll('[data-tv40-focus]').forEach(b => b.onclick = () => focusTransportPoint40(b.dataset.tv40Focus));
    document.getElementById('tv40FitMap')?.addEventListener('click', fitTransportMap40);
    document.querySelectorAll('[data-tv40-people]').forEach(b => b.onclick = () => openPeople40(b.dataset.tv40People));
    document.querySelectorAll('[data-tv24-yandex-ride]').forEach(b => b.onclick = () => openYandexRideV24(transportRideV24(b.dataset.tv24YandexRide),dir));
    document.querySelectorAll('[data-tv24-yandex-point]').forEach(b => b.onclick = () => { const a = tv24().arrival; if (hasCoordV24(a)) window.open(yandexPointV24(a.lat,a.lon),'_blank','noopener'); });
    document.querySelectorAll('[data-tv24-yandex-stop]').forEach(b => b.onclick = () => { const [rid,sid] = b.dataset.tv24YandexStop.split(':'), r = transportRideV24(rid), s = r?.stops.find(x => x.id === sid); if (hasCoordV24(s)) window.open(yandexPointV24(s.lat,s.lon),'_blank','noopener'); });
    requestAnimationFrame(mountTransportMap40);
  }

  /* Override the legacy transport render/binders without touching shared transport state. */
  transportPage = transportPage40;
  transportRideModalV24 = rideModal40;
  stopModalV24 = stopModal40;
  arrivalModalV24 = arrivalModal40;
  requestModalV24 = requestModal40;
  mountTransportMapV24 = mountTransportMap40;
  bindTransportV24 = bindTransport40;

  const build = document.querySelector('.build-label');
  if (build) build.textContent = 'V40 · транспорт на Яндекс Картах';
  render();
})();
