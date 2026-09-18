/* V70 — canonical hero for all primary hike modules. */
(()=>{
'use strict';

const CONFIG={
  overview:{group:'hike',kicker:'Поход',title:'Обзор'},
  participants:{group:'hike',kicker:'Поход',title:'Участники'},
  roles:{group:'hike',kicker:'Поход',title:'Роли'},
  gear:{group:'prep',kicker:'Подготовка',title:'Снаряжение'},
  food:{group:'prep',kicker:'Подготовка',title:'Питание'},
  transport:{group:'prep',kicker:'Подготовка',title:'Транспорт'},
  documents:{group:'prep',kicker:'Подготовка',title:'Документы'},
  route:{group:'field',kicker:'На местности',title:'Маршрут'},
  plan:{group:'field',kicker:'На местности',title:'План'}
};
const bodyClasses=['module-hero-v70-active','module-hero-v70-hike','module-hero-v70-prep','module-hero-v70-field'];

function heroParts(current){
  if(current==='overview'){
    const hero=document.querySelector('.ov44-hero-head');
    return hero?{hero,copy:hero.querySelector('.ov44-hero-copy'),kicker:hero.querySelector('.page-kicker'),title:hero.querySelector('h1'),desc:hero.querySelector('p'),actions:null}:null;
  }
  if(current==='participants'){
    const hero=document.querySelector('.p50-hero');
    return hero?{hero,copy:hero.querySelector('.p50-hero__copy'),kicker:hero.querySelector('.p50-kicker'),title:hero.querySelector('h1'),desc:hero.querySelector('.p50-meta'),actions:hero.querySelector('.p50-hero__actions')}:null;
  }
  const hero=document.querySelector('.page-head');
  return hero?{hero,copy:hero.querySelector('.page-head__copy'),kicker:hero.querySelector('.page-kicker'),title:hero.querySelector('h1'),desc:hero.querySelector('.page-head__copy > p'),actions:hero.querySelector('.page-head__actions')}:null;
}

function canonicalize(){
  bodyClasses.forEach(c=>document.body.classList.remove(c));
  const current=typeof tab==='string'?tab:'';
  const cfg=CONFIG[current];
  if(!cfg)return;

  const parts=heroParts(current);
  if(!parts?.hero)return;

  document.body.classList.add('module-hero-v70-active',`module-hero-v70-${cfg.group}`);
  parts.hero.classList.add('module-hero-v70');
  parts.copy?.classList.add('module-hero-copy-v70');
  parts.actions?.classList.add('module-hero-actions-v70');

  if(parts.kicker)parts.kicker.textContent=cfg.kicker;
  if(parts.title)parts.title.textContent=cfg.title;

  if(parts.desc){
    parts.desc.classList.add('module-hero-desc-v70');
    parts.desc.hidden=true;
    parts.desc.setAttribute('aria-hidden','true');
  }

  // Old V69 classes are harmless but their metadata must not reappear.
  parts.hero.querySelectorAll('.module-hero-meta-v69').forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true')});
}

if(typeof render==='function'&&!render.__moduleHeroV70){
  const base=render;
  const wrapped=function(){
    const result=base.apply(this,arguments);
    queueMicrotask(canonicalize);
    return result;
  };
  wrapped.__moduleHeroV70=true;
  render=wrapped;
}
queueMicrotask(canonicalize);
window.ModuleHeroV70={apply:canonicalize,config:CONFIG};
})();