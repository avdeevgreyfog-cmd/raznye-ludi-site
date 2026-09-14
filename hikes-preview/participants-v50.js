/* V50 — Participants page: organizer and participant views from the approved reference. */
(() => {
  'use strict';

  if (!document.querySelector('link[data-participants-v50]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './participants-v50.css?v=50-20260914';
    link.dataset.participantsV50 = '1';
    document.head.appendChild(link);
  }

  const safe = v => typeof esc === 'function' ? esc(v) : String(v ?? '');
  const admin = () => !!window.HikeAccessV47?.access?.().admin;
  const people = () => Array.isArray(S?.participants) ? S.participants : [];
  const me = () => people().find(p => p.id === S.current) || people()[0] || null;
  const counts = () => Object.fromEntries(['yes','maybe','no','pending'].map(k => [k, people().filter(p => p.rsvp === k).length]));
  const limit = () => Number(window.HikeEventV49?.event?.participant_limit || S.event?.participantLimit || 0) || 0;
  const free = () => Math.max(0, limit() - counts().yes);
  const team = () => admin() ? people() : people().filter(p => p.rsvp === 'yes' || p.id === S.current);
  const rolesFor = pid => {
    const rows = window.HikeAccessV47?.roles?.(pid);
    if (Array.isArray(rows) && rows.length) return rows.map(r => r.title).filter(Boolean);
    try { return participantRoles(pid) || []; } catch (e) { return []; }
  };
  const ride = pid => { try { return rideLabel(pid, 'there'); } catch (e) { return 'Не указано'; } };
  const prep = pid => { try { return progress(pid); } catch (e) { return [0,0,0]; } };
  const statusLabel = value => ({ yes:'Подтверждён', maybe:'Возможно', pending:'Ожидает подтверждения', no:'Не участвует' }[value] || value);
  const statusClass = value => value === 'pending' ? 'pending' : value === 'maybe' ? 'maybe' : value === 'no' ? 'no' : '';
  const joinLink = () => `${location.origin}${location.pathname}?join=tominsky-lesopark`;

  function icon(type) {
    const map = {
      people:'<circle cx="8" cy="8" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M3.8 19c.4-3.5 2.1-5.5 4.4-5.5s4 2 4.4 5.5M13.7 14.2c.8-.8 1.7-1.2 2.7-1.2 2 0 3.3 1.4 3.7 3.9"/>',
      check:'<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12 2.5 2.5 5.2-5.4"/>',
      wait:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 1.8"/>',
      help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.3a2.3 2.3 0 1 1 3.2 2.1c-.7.4-1 .8-1 1.7M12 16.7h.01"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
      link:'<path d="M10 13.8 8.1 15.7a3.3 3.3 0 0 1-4.7-4.7l3-3a3.3 3.3 0 0 1 4.6 0M14 10.2l1.9-1.9a3.3 3.3 0 1 1 4.7 4.7l-3 3a3.3 3.3 0 0 1-4.6 0"/>',
      car:'<path d="M5 9.5 7 5h10l2 4.5M4 10h16v7H4z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>',
      role:'<circle cx="8" cy="7" r="2.4"/><path d="M4 17c.4-3.2 2-5 4-5s3.6 1.8 4 5M16.5 12v6M13.5 15h6"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${map[type] || map.people}</svg>`;
  }

  function avatar() {
    return `<span class="p50-avatar"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#dfece3"/><path d="M12 43c1.7-9.5 6.4-14.4 12-14.4S34.4 33.5 36 43" fill="#3e775d"/><circle cx="24" cy="20" r="8" fill="#e7b18c"/><path d="M16.5 20.5c.3-7 3.8-10.5 8.3-10.5 4.4 0 7.1 2.8 7.1 7.1 0 1.1-.2 2.1-.5 3-1.9-3.2-5.3-5-9.2-4.9-2.1 0-4 .5-5.7 1.5z" fill="#284d43"/><path d="M18.4 27.5c1.6 1.2 3.5 1.8 5.6 1.8 2.1 0 4-.6 5.6-1.8" fill="none" stroke="#d49273" stroke-width="1.2" stroke-linecap="round"/><path d="M15.6 36.7c2.3-2.7 5-4 8.4-4 3.5 0 6.3 1.3 8.5 4" fill="none" stroke="#6fa083" stroke-width="2.3" stroke-linecap="round"/></svg></span>`;
  }
  function miniAvatar() { return avatar().replace('p50-avatar','p50-mini-avatar'); }

  function roleAssignments() {
    const rows=[];
    if (Array.isArray(S.rolesV36?.roles) && S.rolesV36.roles.length) {
      S.rolesV36.roles.filter(r=>r.p).forEach(r=>rows.push({title:r.title,pid:r.p}));
    } else if (Array.isArray(S.roles)) {
      S.roles.filter(r=>r.p).forEach(r=>rows.push({title:r.title,pid:r.p}));
    }
    return rows;
  }

  function hero() {
    const action = admin() ? `<div class="p50-hero__actions"><button class="p50-btn primary" data-p50-copy>${icon('link')} Пригласить участников</button></div>` : '';
    return `<section class="p50-hero"><div class="p50-hero__copy"><div class="p50-kicker">${admin()?'Командный штаб':'Команда похода'}</div><h1>Участники</h1><div class="p50-meta"><span>${safe(S.event?.short || 'Томинский лесопарк')}</span><span>${safe(S.event?.duration || 'Длительность уточняется')}</span><span>${safe(S.event?.date || 'Дата уточняется')}</span></div></div>${action}</section>`;
  }

  function organizerSummary() {
    const c=counts(), l=limit(), f=free();
    const stat=(type,label,value,detail,tone='')=>`<div class="p50-stat ${tone}"><div class="p50-stat__icon">${icon(type)}</div><div><small>${label}</small><strong>${value}</strong><em>${detail}</em></div></div>`;
    return `<section class="p50-summary">${stat('people','Участники',c.yes,l?`из ${l} мест`:'подтверждено')}${stat('check','Подтверждены',c.yes,'готовы к походу')}${stat('wait','Ожидают решения',c.pending,'нужно решение',c.pending?'warn':'')}${stat('help','Возможно',c.maybe,'ещё думают',c.maybe?'warn':'')}${stat('plus','Свободных мест',l?f:'—',l?'можно приглашать':'лимит не задан')}</section>`;
  }

  function participantSummary() {
    const c=counts(), l=limit(), f=free();
    const item=(type,label,value,detail)=>`<div class="p50-friendly"><div class="p50-friendly__icon">${icon(type)}</div><div><small>${label}</small><strong>${value}</strong><span class="p50-sub">${detail}</span></div></div>`;
    return `<section class="p50-participant-summary">${item('people','Команда',`Нас уже ${c.yes}`,c.yes===1?'участник подтвердил участие':'участников подтвердили участие')}${item('plus','Набор',l?`${f} свободных мест`:'Регистрация открыта',l?'можно пригласить друзей':'лимит участников не задан')}</section>`;
  }

  function participantRows() {
    const rows=team();
    return rows.map(p=>{
      const pr=prep(p.id), rs=rolesFor(p.id), role=rs.join(' · ')||'Участник', transport=ride(p.id), isMe=p.id===S.current;
      if(admin()) {
        return `<div class="p50-row" data-p50-person data-name="${safe(p.name).toLowerCase()}" data-status="${safe(p.rsvp)}"><div class="p50-person">${avatar()}<div class="p50-person-copy"><div class="p50-name"><span>${safe(p.name)}</span>${isMe?'<span class="p50-me">Вы</span>':''}</div><span class="p50-sub">${safe(rs[0]||'Участник')}</span></div></div><div class="p50-cell"><select class="p50-status-select" data-rsvp="${safe(p.id)}" aria-label="Статус ${safe(p.name)}">${['yes','pending','maybe','no'].map(v=>`<option value="${v}" ${p.rsvp===v?'selected':''}>${statusLabel(v)}</option>`).join('')}</select></div><div class="p50-cell"><strong>${safe(role)}</strong><small>зона ответственности</small></div><div class="p50-cell"><strong>${safe(transport)}</strong><small>туда</small></div><div class="p50-progress-cell"><span class="p50-ring" style="--p:${pr[2]}"></span><div class="p50-cell"><strong>${pr[0]}/${pr[1]}</strong><small>${pr[2]>=100?'готов':'подготовка'}</small></div></div></div>`;
      }
      return `<div class="p50-row ${isMe?'is-me':''}" data-p50-person data-name="${safe(p.name).toLowerCase()}"><div class="p50-person">${avatar()}<div class="p50-person-copy"><div class="p50-name"><span>${safe(p.name)}</span>${isMe?'<span class="p50-me">Это вы</span>':''}</div><span class="p50-sub">${safe(role)}</span></div></div><div class="p50-cell"><strong>${safe(role)}</strong><small>${rs.length?'роль в походе':'без отдельной роли'}</small></div><div class="p50-cell"><strong>${safe(transport)}</strong><small>транспорт туда</small></div><div class="p50-progress-cell"><span class="p50-ring" style="--p:${pr[2]}"></span><div class="p50-cell"><strong>${pr[0]}/${pr[1]}</strong><small>${pr[2]>=100?'готов':'подготовка'}</small></div></div><div class="p50-cell"><strong>${isMe?'Мой профиль':'Участник'}</strong><small>${isMe?'ваши данные':'в составе группы'}</small></div></div>`;
    }).join('') || '<div class="p50-empty">Участники пока не добавлены.</div>';
  }

  function mainCard() {
    const filter=admin()?`<select class="p50-filter" id="p50Filter"><option value="all">Все статусы</option><option value="yes">Подтверждены</option><option value="pending">Ожидают подтверждения</option><option value="maybe">Возможно</option><option value="no">Не участвуют</option></select>`:'';
    const head=admin()?'<span>Участник</span><span>Статус</span><span>Роль</span><span>Транспорт</span><span>Готовность</span>':'<span>Участник</span><span>Роль</span><span>Транспорт</span><span>Готовность</span><span></span>';
    const invite=admin()?`<div class="p50-invite-footer"><div class="p50-invite-box"><strong>Пригласить по ссылке</strong><span>Любой, у кого есть ссылка, сможет войти и подать заявку.</span><button class="p50-btn" data-p50-copy>Скопировать ссылку</button></div><div class="p50-invite-box"><strong>Пригласить по почте</strong><span>Откроется письмо с готовой ссылкой на поход.</span><button class="p50-btn primary" data-p50-mail>${icon('mail')} Почта</button></div></div>`:'';
    return `<section class="p50-card p50-main"><div class="p50-card-head"><div><h2>${admin()?'Список участников':'Наша команда'}</h2><small>${admin()?'Управление составом и готовностью':'Только подтверждённые участники и полезная информация'}</small></div><div class="p50-tools"><input class="p50-search" id="p50Search" type="search" placeholder="Найти участника…" aria-label="Найти участника">${filter}</div></div><div class="p50-table-head">${head}</div><div id="p50Rows">${participantRows()}</div>${invite}</section>`;
  }

  function compositionCard() {
    const c=counts(), l=limit(), total=l||Math.max(c.yes,1), fill=Math.max(0,Math.min(100,Math.round(c.yes/total*100)));
    if(!admin()) return '';
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Состав группы</h3><span>${c.yes}/${l||c.yes}</span></div><div class="p50-compose"><div class="p50-donut" style="--fill:${fill}%"><b>${c.yes}/${l||c.yes}</b></div><div class="p50-legend"><div><span><i class="p50-dot"></i>Подтверждены</span><b>${c.yes}</b></div><div><span><i class="p50-dot warn"></i>Ожидают</span><b>${c.pending+c.maybe}</b></div><div><span><i class="p50-dot muted"></i>Свободно</span><b>${l?free():'—'}</b></div></div></div></section>`;
  }

  function rolesCard() {
    const rows=roleAssignments();
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>${admin()?'Роли в команде':'Кто за что отвечает'}</h3><span>${rows.length}</span></div><div class="p50-role-list">${rows.length?rows.slice(0,7).map(r=>`<div class="p50-role-item"><div><strong>${safe(r.title)}</strong><small>${safe(pn(r.pid))}</small></div><em>${safe(pn(r.pid))}</em></div>`).join(''):'<div class="p50-empty">Роли пока не распределены.</div>'}</div></section>`;
  }

  function requestsCard() {
    if(!admin())return '';
    const rows=people().filter(p=>p.rsvp==='pending');
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Новые заявки</h3><span>${rows.length}</span></div>${rows.length?rows.map(p=>`<div class="p50-request"><div class="p50-request__name">${miniAvatar()}<div><b>${safe(p.name)}</b><small>Хочет присоединиться к походу</small></div></div><div class="p50-request-actions"><button class="p50-btn success" data-p50-status="yes" data-pid="${safe(p.id)}">Принять</button><button class="p50-btn danger" data-p50-status="no" data-pid="${safe(p.id)}">Отклонить</button></div></div>`).join(''):'<div class="p50-empty">Новых заявок нет.</div>'}</section>`;
  }

  function myCard() {
    if(admin())return '';
    const p=me();if(!p)return '';
    const pr=prep(p.id), rs=rolesFor(p.id);
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Моё участие</h3><span>${safe(statusLabel(p.rsvp))}</span></div><div class="p50-my-status"><div class="p50-my-line"><span>Роль</span><strong>${safe(rs.join(' · ')||'Участник')}</strong></div><div class="p50-my-line"><span>Транспорт</span><strong>${safe(ride(p.id))}</strong></div><div class="p50-my-line"><span>Снаряжение</span><strong>${pr[0]}/${pr[1]}</strong></div></div></section>`;
  }

  function inviteCard() {
    if(admin())return '';
    return `<section class="p50-side-card"><div class="p50-side-title"><h3>Пригласить друга</h3><span>по ссылке</span></div><div class="p50-invite"><p>Если набор открыт, можно поделиться ссылкой. Новый человек сначала подаст заявку, а организатор её подтвердит.</p><div class="p50-invite-row"><input value="${safe(joinLink())}" readonly><button class="p50-btn" data-p50-copy>Копировать</button></div></div></section>`;
  }

  function participantsV50() {
    document.body.classList.add('p50-active');
    const summary=admin()?organizerSummary():participantSummary();
    return `<div class="p50-shell">${hero()}${summary}<div class="p50-grid">${mainCard()}<aside class="p50-side">${compositionCard()}${rolesCard()}${requestsCard()}${myCard()}${inviteCard()}</aside></div></div>`;
  }

  participantsPage = participantsV50;

  function applyFilter() {
    const q=(document.getElementById('p50Search')?.value||'').trim().toLowerCase();
    const status=document.getElementById('p50Filter')?.value||'all';
    document.querySelectorAll('[data-p50-person]').forEach(row=>{
      const matchName=!q||(row.dataset.name||'').includes(q);
      const matchStatus=status==='all'||row.dataset.status===status;
      row.hidden=!(matchName&&matchStatus);
    });
  }

  function bindV50() {
    if(tab!=='participants')return;
    document.getElementById('p50Search')?.addEventListener('input',applyFilter);
    document.getElementById('p50Filter')?.addEventListener('change',applyFilter);
    document.querySelectorAll('[data-p50-copy]').forEach(button=>button.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(joinLink());toast('Ссылка на поход скопирована')}catch(e){toast('Не удалось скопировать ссылку')}
    }));
    document.querySelectorAll('[data-p50-mail]').forEach(button=>button.addEventListener('click',()=>{
      const subject=encodeURIComponent(`Приглашение: ${S.event?.short||'поход'}`),body=encodeURIComponent(`Присоединяйся к походу:\n${joinLink()}`);location.href=`mailto:?subject=${subject}&body=${body}`;
    }));
    document.querySelectorAll('[data-p50-status]').forEach(button=>button.addEventListener('click',()=>{
      const pid=button.dataset.pid,value=button.dataset.p50Status,select=document.querySelector(`select[data-rsvp="${CSS.escape(pid)}"]`);
      if(select){select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));return}
      const p=people().find(x=>x.id===pid);if(p){p.rsvp=value;save();render()}
    }));
  }

  const baseRender=render;
  render=function renderV50(){
    document.body.classList.toggle('p50-active',tab==='participants');
    const result=baseRender();
    if(tab==='participants')bindV50();
    const build=document.querySelector('.build-label');if(build&&tab==='participants')build.textContent='V50 · участники и роли';
    return result;
  };

  if(tab==='participants')render();
})();
