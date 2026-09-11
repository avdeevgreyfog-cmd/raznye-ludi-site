/* V34 — Yandex Maps JavaScript API as the interactive city basemap under Leaflet editing overlays. */
(() => {
  'use strict';

  const RL_YANDEX_JS_API_KEY = 'ec183557-30ee-4662-86c4-c363798c6092';
  const state = {
    loader: null,
    map: null,
    host: null,
    status: null,
    raf: 0,
    failed: false
  };

  function setStatus(text = '', type = '') {
    const el = state.status || document.getElementById('studioYandexStatusV34');
    if (!el) return;
    state.status = el;
    el.textContent = text;
    el.className = `studio-yandex-status-v34${text ? ' is-visible' : ''}${type ? ` is-${type}` : ''}`;
  }

  function ensureHost() {
    const wrap = document.querySelector('.studio-map-wrap-v21');
    const leaflet = document.getElementById('studioMapV21');
    if (!wrap || !leaflet) return null;

    let host = document.getElementById('studioYandexV34');
    if (!host) {
      host = document.createElement('div');
      host.id = 'studioYandexV34';
      host.className = 'studio-yandex-v34';
      host.setAttribute('aria-hidden', 'true');
      wrap.insertBefore(host, leaflet);
    }

    let status = document.getElementById('studioYandexStatusV34');
    if (!status) {
      status = document.createElement('div');
      status.id = 'studioYandexStatusV34';
      status.className = 'studio-yandex-status-v34';
      wrap.appendChild(status);
    }

    state.host = host;
    state.status = status;
    return { wrap, host, status };
  }

  function loadYandex() {
    if (window.ymaps3?.ready) return window.ymaps3.ready.then(() => window.ymaps3);
    if (state.loader) return state.loader;

    state.loader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-rl-yandex-v34]');
      const finish = () => {
        if (!window.ymaps3?.ready) {
          reject(new Error('Yandex Maps API did not expose ymaps3'));
          return;
        }
        window.ymaps3.ready.then(() => resolve(window.ymaps3)).catch(reject);
      };

      if (existing) {
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.dataset.rlYandexV34 = '1';
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(RL_YANDEX_JS_API_KEY)}&lang=ru_RU`;
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => reject(new Error('Yandex Maps API failed to load')), { once: true });
      document.head.appendChild(script);
    });

    return state.loader;
  }

  function currentLeafletLocation() {
    if (typeof studioV21 === 'undefined' || !studioV21.map) return null;
    const c = studioV21.map.getCenter();
    return { center: [c.lng, c.lat], zoom: studioV21.map.getZoom() };
  }

  function syncYandexNow() {
    state.raf = 0;
    if (!state.map || typeof studioV21 === 'undefined' || studioV21.base !== 'city') return;
    const location = currentLeafletLocation();
    if (!location) return;
    try {
      state.map.setLocation({ ...location, duration: 0 });
    } catch (error) {
      console.warn('Yandex basemap sync failed', error);
    }
  }

  function scheduleSync() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(syncYandexNow);
  }

  async function ensureYandexMap() {
    const shell = ensureHost();
    if (!shell) return;
    setStatus('Загрузка Яндекс Карт…', 'loading');

    try {
      const ymaps3 = await loadYandex();
      if (!document.getElementById('studioYandexV34')) return;

      if (!state.map) {
        const location = currentLeafletLocation() || { center: [37.93, 55.59], zoom: 13 };
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;
        state.map = new YMap(shell.host, {
          location,
          behaviors: [],
          mode: 'raster',
          theme: 'light',
          zoomRange: { min: 3, max: 20 }
        }, [
          new YMapDefaultSchemeLayer(),
          new YMapDefaultFeaturesLayer()
        ]);
      }

      state.failed = false;
      setStatus('');
      scheduleSync();
    } catch (error) {
      state.failed = true;
      console.error('Yandex Maps initialization failed', error);
      setStatus('Яндекс Карты не загрузились. Проверьте HTTP Referer ключа.', 'error');
    }
  }

  function removeLeafletTile() {
    if (typeof studioV21 === 'undefined' || !studioV21.map || !studioV21.tile) return;
    try {
      if (studioV21.map.hasLayer(studioV21.tile)) studioV21.map.removeLayer(studioV21.tile);
    } catch (error) {
      console.warn('Leaflet tile cleanup failed', error);
    }
    studioV21.tile = null;
  }

  function enableYandex() {
    const shell = ensureHost();
    if (!shell || typeof studioV21 === 'undefined') return;
    shell.wrap.classList.add('is-yandex-v34');
    removeLeafletTile();
    ensureYandexMap();
  }

  function disableYandex() {
    const wrap = document.querySelector('.studio-map-wrap-v21');
    wrap?.classList.remove('is-yandex-v34');
    setStatus('');
  }

  function destroyYandex() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    try { state.map?.destroy(); } catch (error) { console.warn('Yandex map destroy failed', error); }
    state.map = null;
    state.host = null;
    state.status = null;
  }

  if (typeof MAP_BASES_V21 !== 'undefined' && MAP_BASES_V21.city) {
    MAP_BASES_V21.city.label = 'Яндекс';
    MAP_BASES_V21.city.hint = 'Яндекс Карты · JavaScript API';
  }
  if (typeof ATLAS_SOURCES_V20 !== 'undefined' && ATLAS_SOURCES_V20.yandex) {
    ATLAS_SOURCES_V20.yandex.label = 'Яндекс · схема (Tiles API)';
  }

  if (typeof setStudioBaseV21 === 'function') {
    const setStudioBaseOriginal = setStudioBaseV21;
    setStudioBaseV21 = function setStudioBaseWithYandexV34(kind) {
      if (kind !== 'city') {
        disableYandex();
        return setStudioBaseOriginal(kind);
      }
      if (typeof studioV21 === 'undefined' || !studioV21.map) return;
      studioV21.base = 'city';
      try { saveStudioPrefsV21(); } catch (error) {}
      document.querySelectorAll('[data-studio-base]').forEach((button) => {
        button.classList.toggle('active', button.dataset.studioBase === 'city');
      });
      enableYandex();
      try { renderStudioInspectorV21(); } catch (error) {}
    };
  }

  if (typeof mountStudioMapV21 === 'function') {
    const mountStudioMapOriginal = mountStudioMapV21;
    mountStudioMapV21 = function mountStudioMapWithYandexV34() {
      mountStudioMapOriginal();
      if (typeof studioV21 === 'undefined' || !studioV21.map) return;
      if (!studioV21.__yandexV34Bound) {
        studioV21.__yandexV34Bound = true;
        studioV21.map.on('move zoom moveend zoomend resize', scheduleSync);
      }
      if (studioV21.base === 'city') enableYandex();
    };
  }

  if (typeof closeStudioV21 === 'function') {
    const closeStudioOriginal = closeStudioV21;
    closeStudioV21 = function closeStudioWithYandexV34(force = false) {
      const result = closeStudioOriginal(force);
      if (typeof studioV21 === 'undefined' || !studioV21.open) destroyYandex();
      return result;
    };
  }

  const build = document.querySelector('.build-label');
  if (build) build.textContent = 'V34 · Яндекс Карты подключены';
})();
