/* V52 — make role preview available in the local organizer demo as well as authenticated organizer mode. */
(() => {
  'use strict';

  function hasSession() {
    try { return !!JSON.parse(localStorage.getItem('rl_hike_auth_v42') || 'null')?.access_token; }
    catch (e) { return false; }
  }

  function isLocalOrganizerDemo() {
    if (hasSession()) return false;
    if (!window.S || !Array.isArray(S.participants)) return false;
    const current = S.participants.find(person => person.id === S.current) || S.participants[0];
    if (!current) return false;
    if (current.id === 'p1') return true;
    try {
      const roles = typeof participantRoles === 'function' ? participantRoles(current.id) : [];
      return Array.isArray(roles) && roles.includes('Руководитель');
    } catch (e) {
      return false;
    }
  }

  function enable() {
    if (!isLocalOrganizerDemo()) return;
    document.body.classList.add('hike-organizer');
    document.body.dataset.previewDemo = 'organizer';
  }

  enable();
  document.addEventListener('DOMContentLoaded', enable, { once: true });
})();
