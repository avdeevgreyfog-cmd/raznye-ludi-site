/* V64 hotfix: keep Roles CRUD permissions in sync with the project's existing organizer/preview access model. */
(() => {
  'use strict';

  let applying = false;
  let lastManage = null;

  function previewOrganizerSelected() {
    const api = window.HikePreviewV48;
    if (api?.mode === 'organizer') return true;
    return !!document.querySelector('[data-v51-mode="organizer"].active');
  }

  function canManageRolesV64() {
    try {
      if (window.HikeSession?.organizer) return true;
      if (window.HikeWorkspace?.can?.('roles')) return true;
      if (previewOrganizerSelected()) return true;
      return false;
    } catch (error) {
      return false;
    }
  }

  function applyRolesAccessV64(rerender = true) {
    if (applying) return;
    const next = canManageRolesV64();
    const current = document.body.classList.contains('hike-organizer');
    if (next === current && next === lastManage) return;

    applying = true;
    document.body.classList.toggle('hike-organizer', next);
    lastManage = next;
    applying = false;

    if (rerender && typeof tab !== 'undefined' && tab === 'roles' && typeof render === 'function') {
      render();
    }
  }

  function patchPreviewApiV64() {
    const api = window.HikePreviewV48;
    if (!api || api.__rolesV64Patched || typeof api.set !== 'function') return;
    const baseSet = api.set.bind(api);
    api.set = function rolesPreviewSetV64(next) {
      const result = baseSet(next);
      setTimeout(() => applyRolesAccessV64(true), 0);
      return result;
    };
    api.__rolesV64Patched = true;
  }

  function bootV64() {
    patchPreviewApiV64();
    applyRolesAccessV64(true);
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('[data-v51-mode]')) return;
    setTimeout(() => {
      patchPreviewApiV64();
      applyRolesAccessV64(true);
    }, 0);
  });

  const observer = new MutationObserver(() => {
    patchPreviewApiV64();
    applyRolesAccessV64(false);
  });
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class','hidden','style']});

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootV64, {once:true});
  else bootV64();
  setTimeout(bootV64, 150);
})();
