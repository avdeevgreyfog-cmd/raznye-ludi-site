/* V60 — avatar picker with a neutral default for new participants. */
(()=>{
'use strict';
const R='60-20260914g';
const A=[
{id:'default',label:'Стандарт',src:`./assets/avatars-v59/avatar-default.svg?r=${R}`},
{id:'field-cap',label:'Аватар 1',src:`./assets/avatars-v59/avatar-01.svg?r=${R}`},
{id:'watch-cap',label:'Аватар 2',src:`./assets/avatars-v59/avatar-02.svg?r=${R}`},
{id:'boonie',label:'Аватар 3',src:`./assets/avatars-v59/avatar-03.svg?r=${R}`},
{id:'headset',label:'Аватар 4',src:`./assets/avatars-v59/avatar-04.svg?r=${R}`},
{id:'hood',label:'Аватар 5',src:`./assets/avatars-v59/avatar-05.svg?r=${R}`},
{id:'avatar-06',label:'Аватар 6',src:`./assets/avatars-v59/avatar-06.svg?r=${R}`},
{id:'avatar-07',label:'Аватар 7',src:`./assets/avatars-v59/avatar-07.svg?r=${R}`},
{id:'avatar-08',label:'Аватар 8',src:`./assets/avatars-v59/avatar-08.svg?r=${R}`},
{id:'avatar-09',label:'Аватар 9',src:`./assets/avatars-v59/avatar-09.svg?r=${R}`},
{id:'avatar-10',label:'Аватар 10',src:`./assets/avatars-v59/avatar-10.svg?r=${R}`}
];
const M=Object.fromEntries(A.map(x=>[x.id,x])),D=A[0];
const people=()=>Array.isArray(S?.participants)?S.participants:[];
const current=()=>people().find(p=>p.id===S.current)||people()[0]||null;
const admin=()=>!!window.HikeAccessV47?.access?.().admin;
const team=()=>admin()?people():people().filter(p=>p.rsvp==='yes'||p.id===S.current);
const html=p=>`<img class="v56-avatar-img" src="${M[p?.avatarKey]?.src||D.src}" alt="">`;
function defaults(){let c=false;people().forEach(p=>{if(!M[p.avatarKey]){p.avatarKey=D.id;c=true}});if(c&&typeof save==='function')save()}
function fill(el,p){if(el&&p)el.innerHTML=html(p)}
function participants(){if(typeof tab!=='undefined'&&tab!=='participants')return;const list=team();document.querySelectorAll('.p50-row[data-p50-person]').forEach((row,i)=>fill(row.querySelector('.p50-avatar'),list[i]));document.querySelectorAll('.p50-request').forEach(card=>fill(card.querySelector('.p50-mini-avatar'),people().find(p=>card.textContent.includes(p.name))))}
function picker(p){return `<section class="v38-profile-card v56-avatar-card" id="v56AvatarCard"><div class="v38-profile-card-head"><div><h2>Аватар</h2><p>Выберите иконку, которая будет показываться в профиле и списке участников.</p></div></div><div class="v38-profile-card-body"><div class="v56-avatar-picker">${A.map(a=>`<button type="button" class="v56-avatar-option ${p.avatarKey===a.id?'is-selected':''}" data-v56-avatar="${a.id}" aria-label="${a.label}"><img src="${a.src}" alt=""><span>${a.label}</span></button>`).join('')}</div><p class="v56-avatar-note">Новый участник получает стандартную иконку. При желании её можно заменить на любой из 10 вариантов.</p></div></section>`}
function profile(){const p=current();if(!p)return;fill(document.querySelector('.v38-profile-summary .avatar'),p);fill(document.querySelector('.v38-profile-nav .avatar'),p);fill(document.querySelector('.v38-profile-top .avatar'),p);fill(document.querySelector('.ov44-person .avatar'),p);if(typeof tab!=='undefined'&&tab==='profile'&&!document.getElementById('v56AvatarCard')){const s=document.querySelector('.v38-profile-stack'),c=s?.querySelector('.v38-profile-card');if(s&&c)c.insertAdjacentHTML('afterend',picker(p))}}
function decorate(){defaults();participants();profile()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-v56-avatar]');if(!b)return;const p=current(),k=b.dataset.v56Avatar;if(!p||!M[k])return;p.avatarKey=k;if(typeof save==='function')save();if(typeof toast==='function')toast('Аватар выбран');if(typeof render==='function')render()});
defaults();
if(typeof render==='function'&&!render.__v56AvatarWrapped){const base=render;const wrapped=function(){const r=base.apply(this,arguments);queueMicrotask(decorate);return r};wrapped.__v56AvatarWrapped=true;render=wrapped}
queueMicrotask(decorate);
window.HikeAvatarsV56={avatars:A,decorate,src:k=>M[k]?.src||D.src,defaultKey:D.id};
})();