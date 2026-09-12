/* V42 — authenticated team access for the Hikes workspace. No privileged key is shipped to the browser. */
(() => {
  'use strict';

  const PROJECT_URL = 'https://qmnjsvifwcutjailxdug.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_R1n0gwDrWkKn0-D5nuaz3Q_jRjTFwTD';
  const EVENT_SLUG = 'tominsky-lesopark';
  const AUTH_KEY = 'rl_hike_auth_v42';
  const REVISION_KEY = 'rl_hike_cloud_revision_v42';
  let session = null, event = null, membership = null, isOrganizer = false, cloudReady = false, writeTimer = 0, lastRevision = '';

  const headers = extra => {
    const result = { apikey: PUBLISHABLE_KEY, ...extra };
    if (session?.access_token) result.Authorization = `Bearer ${session.access_token}`;
    return result;
  };
  async function request(path, options = {}) {
    const response = await fetch(`${PROJECT_URL}${path}`, { method: options.method || 'GET', headers: headers({ 'Content-Type': 'application/json', ...(options.headers || {}) }), body: options.body === undefined ? undefined : JSON.stringify(options.body) });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || body?.error_description || body?.hint || `Ошибка сервера (${response.status})`);
    return body;
  }
  function saveSession(next) { session = next || null; try { session ? localStorage.setItem(AUTH_KEY, JSON.stringify(session)) : localStorage.removeItem(AUTH_KEY); } catch (e) {} }
  function loadSession() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (e) { return null; } }
  function extractHashSession() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (!hash.get('access_token')) return null;
    const next = { access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token'), expires_at: Math.floor(Date.now() / 1000) + Number(hash.get('expires_in') || 3600), user: { id: hash.get('user_id') || '' } };
    history.replaceState({}, document.title, `${location.pathname}${location.search}`);
    return next;
  }
  async function refreshSession() {
    if (!session?.refresh_token) return false;
    try {
      const response = await fetch(`${PROJECT_URL}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }) });
      const next = await response.json();
      if (!response.ok || !next.access_token) return false;
      saveSession({ ...next, expires_at: Math.floor(Date.now() / 1000) + Number(next.expires_in || 3600) });
      return true;
    } catch (e) { return false; }
  }
  async function ensureSession() {
    saveSession(extractHashSession() || loadSession());
    if (!session) return false;
    if ((session.expires_at || 0) < Math.floor(Date.now() / 1000) + 60 && !(await refreshSession())) { saveSession(null); return false; }
    const user = await request('/auth/v1/user').catch(() => null);
    if (!user?.id) { saveSession(null); return false; }
    session.user = user; saveSession(session); return true;
  }
  function modal(title, body, onConfirm) { openModal(title, body, async layer => { try { return await onConfirm(layer); } catch (error) { toast(error.message || 'Не удалось выполнить действие'); return false; } }); }
  const appUrl = () => `${location.origin}${location.pathname}`;
  async function requestMagicLink(email) { await request(`/auth/v1/otp?redirect_to=${encodeURIComponent(appUrl())}`, { method: 'POST', body: { email, create_user: true } }); }
  function authModal() {
    modal('Войти в поход', '<div class="hike-auth-copy"><p>Укажи email. Придёт одноразовая ссылка: пароль придумывать не нужно.</p><label class="field"><span>Email</span><input id="hikeEmail" type="email" autocomplete="email" placeholder="name@example.com" required></label></div>', async layer => {
      const email = layer.querySelector('#hikeEmail').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Укажи корректный email'); return false; }
      await requestMagicLink(email); toast('Ссылка для входа отправлена на email'); return true;
    });
  }
  async function getEvent() { const rows = await request(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(EVENT_SLUG)}&select=*`); event = rows?.[0] || null; if (!event) throw new Error('Мероприятие в базе не найдено'); }
  async function getMembership() { const rows = await request(`/rest/v1/hike_members?event_id=eq.${event.id}&user_id=eq.${session.user.id}&select=*`); membership = rows?.[0] || null; isOrganizer = membership?.role === 'organizer'; }
  async function ensureProfileAndRequest() {
    if (membership) return;
    modal('Присоединиться к походу', '<div class="hike-auth-copy"><p>Представься команде. После отправки организатор подтвердит участие.</p><label class="field"><span>Имя</span><input id="hikeDisplayName" autocomplete="name" placeholder="Как тебя показать в списке" required></label></div>', async layer => {
      const name = layer.querySelector('#hikeDisplayName').value.trim();
      if (name.length < 2) { toast('Укажи имя'); return false; }
      await request(`/rest/v1/profiles?id=eq.${session.user.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { display_name: name } });
      const created = await request('/rest/v1/hike_members', { method: 'POST', headers: { Prefer: 'return=representation' }, body: { event_id: event.id, user_id: session.user.id, status: 'requested', role: 'participant' } });
      membership = created?.[0] || { event_id: event.id, user_id: session.user.id, status: 'requested', role: 'participant' };
      ensureCurrentParticipant(name, false); updateAuthUI(); toast('Заявка отправлена организатору'); return true;
    });
  }
  function russianDate(value) { if (!value) return 'Дата уточняется'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Дата уточняется' : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
  function applyEventToApp() {
    if (!event || !S?.event) return;
    S.event.date = russianDate(event.starts_at); S.event.meeting = event.meeting_label || 'Время и точка уточняются';
    S.event.replyDeadline = event.reply_deadline ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(event.reply_deadline)) : 'не задан';
    S.event.status = ({ planning: 'Подготовка', open: 'Регистрация открыта', closed: 'Набор закрыт', cancelled: 'Отменён' })[event.status] || 'Подготовка';
  }
  function cloudKeys() { const values = {}; for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (key && key.startsWith('rl_hike_') && key !== AUTH_KEY) values[key] = localStorage.getItem(key); } return values; }
  function restoreCloudKeys(values) { Object.entries(values || {}).forEach(([key, value]) => { if (key.startsWith('rl_hike_') && key !== AUTH_KEY && typeof value === 'string') localStorage.setItem(key, value); }); }
  function ensureCurrentParticipant(displayName, forceOrganizer) {
    if (!S || !session?.user?.id) return;
    const id = forceOrganizer ? 'p1' : session.user.id, name = displayName || session.user.email?.split('@')[0] || 'Участник';
    let person = S.participants?.find(p => p.id === id);
    if (!person) { person = { id, name, rsvp: forceOrganizer ? 'yes' : 'pending' }; S.participants.push(person); } else if (displayName) person.name = displayName;
    S.current = id; S.checks ||= {}; S.checks[id] ||= []; S.rides ||= { there: {}, back: {} }; S.rides.there ||= {}; S.rides.back ||= {}; S.rides.there[id] ||= 'unset'; S.rides.back[id] ||= 'unset';
  }
  async function syncOrganizerRoster() {
    if (!isOrganizer) return;
    const members = await request(`/rest/v1/hike_members?event_id=eq.${event.id}&select=user_id,status,role`);
    const profiles = await request('/rest/v1/profiles?select=id,display_name');
    const names = new Map((profiles || []).map(profile => [profile.id, profile.display_name]));
    (members || []).forEach(member => { if (member.role === 'organizer') return; if (!S.participants.find(person => person.id === member.user_id)) S.participants.push({ id: member.user_id, name: names.get(member.user_id) || 'Участник', rsvp: member.status === 'approved' ? 'yes' : member.status === 'declined' ? 'no' : 'pending' }); });
  }
  async function loadCloudDocument() {
    if (!membership) return;
    const rows = await request(`/rest/v1/hike_documents?event_id=eq.${event.id}&select=payload,updated_at`), document = rows?.[0];
    if (!document?.payload?.app) return;
    lastRevision = document.updated_at || '';
    if (sessionStorage.getItem(REVISION_KEY) === lastRevision) return;
    restoreCloudKeys(document.payload.local); localStorage.setItem(STORAGE, JSON.stringify(document.payload.app)); sessionStorage.setItem(REVISION_KEY, lastRevision); location.reload();
  }
  window.scheduleCloudSync = function scheduleCloudSync(now = false) {
    if (!cloudReady || !isOrganizer || !event || !S) return;
    clearTimeout(writeTimer); writeTimer = setTimeout(async () => { try {
      const payload = { app: S, local: cloudKeys(), version: 42 };
      const rows = await request(`/rest/v1/hike_documents?event_id=eq.${event.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { payload, updated_by: session.user.id } });
      lastRevision = rows?.[0]?.updated_at || lastRevision; if (lastRevision) sessionStorage.setItem(REVISION_KEY, lastRevision);
    } catch (error) { console.warn('Hike cloud sync failed', error); } }, now ? 0 : 700);
  };
  function wrapStorage() {
    const nativeSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) { nativeSet.call(this, key, value); if (this === localStorage && key?.startsWith('rl_hike_') && key !== AUTH_KEY) window.scheduleCloudSync?.(); };
  }
  function updateAuthUI() {
    const label = document.getElementById('hikeAuthLabel'), login = document.getElementById('hikeAuthButton'), settings = document.getElementById('hikeSettingsButton'), signout = document.getElementById('hikeSignoutButton'), selector = document.getElementById('who');
    if (!session?.user) { label.textContent = 'Гость'; login.hidden = false; settings.hidden = true; signout.hidden = true; selector.hidden = true; return; }
    label.textContent = membership?.status === 'requested' ? 'Заявка отправлена' : session.user.email; login.hidden = true; settings.hidden = !isOrganizer; signout.hidden = false; selector.hidden = true; document.body.classList.toggle('hike-organizer', isOrganizer);
  }
  function settingsModal() {
    const start = event?.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : '', deadline = event?.reply_deadline ? new Date(event.reply_deadline).toISOString().slice(0, 16) : '';
    modal('Настройки похода', `<div class="form-grid hike-settings-form"><div class="field full"><label>Название<input id="hsTitle" value="${esc(event.title || '')}"></label></div><div class="field"><label>Дата и время старта<input id="hsStart" type="datetime-local" value="${start}"></label></div><div class="field"><label>Дедлайн ответа<input id="hsDeadline" type="datetime-local" value="${deadline}"></label></div><div class="field full"><label>Сбор<input id="hsMeeting" value="${esc(event.meeting_label || '')}" placeholder="Например: 07:30 · метро ..."></label></div><div class="field"><label>Лимит участников<input id="hsLimit" type="number" min="1" value="${event.participant_limit || ''}"></label></div><div class="field"><label>Статус<select id="hsStatus"><option value="planning" ${event.status === 'planning' ? 'selected' : ''}>Подготовка</option><option value="open" ${event.status === 'open' ? 'selected' : ''}>Регистрация открыта</option><option value="closed" ${event.status === 'closed' ? 'selected' : ''}>Набор закрыт</option><option value="cancelled" ${event.status === 'cancelled' ? 'selected' : ''}>Отменён</option></select></label></div></div>`, async layer => {
      const value = id => layer.querySelector(id).value.trim(), title = value('#hsTitle');
      if (!title) { toast('Укажи название похода'); return false; }
      const starts = value('#hsStart'), deadlineValue = value('#hsDeadline'), limit = value('#hsLimit');
      const rows = await request(`/rest/v1/hike_events?id=eq.${event.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { title, starts_at: starts ? new Date(starts).toISOString() : null, reply_deadline: deadlineValue ? new Date(deadlineValue).toISOString() : null, meeting_label: value('#hsMeeting') || null, participant_limit: limit ? Number(limit) : null, status: value('#hsStatus') } });
      event = rows?.[0] || event; applyEventToApp(); save(); render(); updateAuthUI(); toast('Параметры похода сохранены для всей команды'); return true;
    });
  }
  function attachControls() {
    document.getElementById('hikeAuthButton').onclick = authModal; document.getElementById('hikeSettingsButton').onclick = settingsModal;
    document.getElementById('hikeSignoutButton').onclick = () => { saveSession(null); sessionStorage.removeItem(REVISION_KEY); location.reload(); };
    document.getElementById('eventSwitcher').onclick = () => isOrganizer ? settingsModal() : toast('Сейчас открыт один поход. Войти можно по ссылке из письма.');
    document.getElementById('reset').onclick = () => toast('Данные похода не сбрасываются с устройства: рабочая версия хранится у команды централизованно.');
  }
  function wireMembershipActions() {
    document.querySelectorAll('.status-select[data-rsvp]').forEach(control => {
      control.disabled = !isOrganizer;
      if (!isOrganizer) return;
      control.addEventListener('change', async () => {
        const userId = control.dataset.rsvp;
        if (!/^[0-9a-f-]{36}$/i.test(userId)) return;
        const status = control.value === 'yes' ? 'approved' : control.value === 'no' ? 'declined' : 'requested';
        try {
          await request(`/rest/v1/hike_members?event_id=eq.${event.id}&user_id=eq.${userId}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { status } });
          toast(status === 'approved' ? 'Участие подтверждено' : status === 'declined' ? 'Заявка отклонена' : 'Заявка оставлена на рассмотрении');
        } catch (error) { toast('Не удалось обновить заявку: ' + error.message); }
      });
    });
  }
  const baseRenderWithMembership = render;
  render = function renderWithMembership() {
    const result = baseRenderWithMembership();
    wireMembershipActions();
    return result;
  };
  async function start() {
    wrapStorage(); attachControls(); if (!(await ensureSession())) { updateAuthUI(); return; }
    await getEvent(); await getMembership(); if (!membership) { updateAuthUI(); await ensureProfileAndRequest(); return; }
    await loadCloudDocument();
    const profileRows = await request(`/rest/v1/profiles?id=eq.${session.user.id}&select=display_name`), displayName = profileRows?.[0]?.display_name || session.user.email?.split('@')[0];
    ensureCurrentParticipant(displayName, isOrganizer); await syncOrganizerRoster(); applyEventToApp(); cloudReady = true; if (isOrganizer) window.scheduleCloudSync(true); updateAuthUI(); render(); wireMembershipActions();
    setInterval(async () => { if (!membership || isOrganizer || document.hidden) return; try { const rows = await request(`/rest/v1/hike_documents?event_id=eq.${event.id}&select=updated_at`); if (rows?.[0]?.updated_at && rows[0].updated_at !== lastRevision) location.reload(); } catch (e) {} }, 45000);
  }
  start().catch(error => { console.error(error); toast('Не удалось подключить командные данные: ' + (error.message || 'проверь соединение')); updateAuthUI(); });
})();
