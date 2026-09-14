/* V59 — selectable participant avatars. Uses the supplied 10-image team set. */
(() => {
  'use strict';

  const RELEASE = '59-20260914f';
  const AVATARS = [
    { id:'field-cap', label:'Аватар 1', src:`./assets/avatars-v59/avatar-01.svg?r=${RELEASE}` },
    { id:'watch-cap', label:'Аватар 2', src:`./assets/avatars-v59/avatar-02.svg?r=${RELEASE}` },
    { id:'boonie', label:'Аватар 3', src:`./assets/avatars-v59/avatar-03.svg?r=${RELEASE}` },
    { id:'headset', label:'Аватар 4', src:`./assets/avatars-v59/avatar-04.svg?r=${RELEASE}` },
    { id:'hood', label:'Аватар 5', src:`./assets/avatars-v59/avatar-05.svg?r=${RELEASE}` },
    { id:'avatar-06', label:'Аватар 6', src:`./assets/avatars-v59/avatar-06.svg?r=${RELEASE}` },
    { id:'avatar-07', label:'Аватар 7', src:`./assets/avatars-v59/avatar-07.svg?r=${RELEASE}` },
    { id:'avatar-08', label:'Аватар 8', src:`./assets/avatars-v59/avatar-08.svg?r=${RELEASE}` },
    { id:'avatar-09', label:'Аватар 9', src:`./assets/avatars-v59/avatar-09.svg?r=${RELEASE}` },
    { id:'avatar-10', label:'Аватар 10', src:`./assets/avatars-v59/avatar-10.svg?r=${RELEASE}` }
  ];

  const byId = Object.fromEntries(AVATARS.map(a => [a.id, a]));
  const participants = () => Array.isArray(S?.participants) ? S.participants : [];
  const current = () => participants().find(p => p.id === S.current) || participants()[0] || null;
  const isAdmin = () => !!window.HikeAccessV47?.access?.().admin;
  const team = () => isAdmin() ? participants() : participants().filter(p => p.rsvp === 'yes' || p.id === S.current);
  const img = p => `<img class="v56-avatar-img" src="${byId[p?.avatarKey]?.src || AVATARS[0].src}" alt="">`;

  function assignDemoAvatars() {
    let changed = false;
    participants().forEach((p, index) => {
      if (!byId[p.avatarKey]) {
        const seed = [...String(p.id || index)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        p.avatarKey = AVATARS[(seed + index * 3) % AVATARS.length].id;
        changed = true;
      }
    });
    if (changed && typeof save === 'function') save();
  }

  function fill(host, p) {
    if (!host || !p) return;
    host.innerHTML = img(p);
  }

  function decorateParticipants() {
    if (typeof tab !== 'undefined' && tab !== 'participants') return;
    const list = team();
    document.querySelectorAll('.p50-row[data-p50-person]').forEach((row, index) => fill(row.querySelector('.p50-avatar'), list[index]));
    document.querySelectorAll('.p50-request').forEach(card => {
      const p = participants().find(person => card.textContent.includes(person.name));
      fill(card.querySelector('.p50-mini-avatar'), p);
    });
  }

  function pickerMarkup(p) {
    return `<section class="v38-profile-card v56-avatar-card" id="v56AvatarCard"><div class="v38-profile-card-head"><div><h2>Аватар</h2><p>Выберите иконку, которая будет показываться в профиле и списке участников.</p></div></div><div class="v38-profile-card-body"><div class="v56-avatar-picker">${AVATARS.map(a => `<button type="button" class="v56-avatar-option ${p.avatarKey===a.id?'is-selected':''}" data-v56-avatar="${a.id}" aria-label="${a.label}"><img src="${a.src}" alt=""><span>${a.label}</span></button>`).join('')}</div><p class="v56-avatar-note">10 вариантов для команды. Выбор сохраняется вместе с профилем участника.</p></div></section>`;
  }

  function decorateProfile() {
    const p = current();
    if (!p) return;
    fill(document.querySelector('.v38-profile-summary .avatar'), p);
    fill(document.querySelector('.v38-profile-nav .avatar'), p);
    fill(document.querySelector('.v38-profile-top .avatar'), p);
    fill(document.querySelector('.ov44-person .avatar'), p);
    if (typeof tab !== 'undefined' && tab === 'profile' && !document.getElementById('v56AvatarCard')) {
      const firstStack = document.querySelector('.v38-profile-stack');
      const firstCard = firstStack?.querySelector('.v38-profile-card');
      if (firstStack && firstCard) firstCard.insertAdjacentHTML('afterend', pickerMarkup(p));
    }
  }

  function decorate() {
    assignDemoAvatars();
    decorateParticipants();
    decorateProfile();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-v56-avatar]');
    if (!button) return;
    const p = current();
    const key = button.dataset.v56Avatar;
    if (!p || !byId[key]) return;
    p.avatarKey = key;
    if (typeof save === 'function') save();
    if (typeof toast === 'function') toast('Аватар выбран');
    if (typeof render === 'function') render();
  });

  assignDemoAvatars();
  if (typeof render === 'function' && !render.__v56AvatarWrapped) {
    const base = render;
    const wrapped = function () {
      const result = base.apply(this, arguments);
      queueMicrotask(decorate);
      return result;
    };
    wrapped.__v56AvatarWrapped = true;
    render = wrapped;
  }
  queueMicrotask(decorate);
  window.HikeAvatarsV56 = { avatars: AVATARS, decorate, src: key => byId[key]?.src || AVATARS[0].src };
})();
