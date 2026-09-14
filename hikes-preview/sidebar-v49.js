/* V55 — sidebar grouping + deterministic current workspace modules. */
(() => {
  'use strict';
  const RELEASE='55-20260914b';
  [['access-v47'],['preview-v48'],['preview-v51']].forEach(([name])=>{
    const key=`data-${name}`;
    if(document.querySelector(`link[${key}]`))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=`./${name}.css?r=${RELEASE}`;link.setAttribute(key,'1');document.head.appendChild(link);
  });
  const GROUPS=[['Поход',['overview','participants','roles']],['Подготовка',['gear','food','transport','documents']],['На местности',['route','plan']]];
  const ICONS={
    overview:'<circle cx="12" cy="12" r="8.5"/><path d="M14.9 9.1 13 13l-3.9 1.9L11 11z"/><path d="M12 2.5v1.2M12 20.3v1.2M2.5 12h1.2M20.3 12h1.2"/>',
    participants:'<circle cx="9" cy="8" r="2.4"/><circle cx="16.3" cy="9.1" r="1.8"/><path d="M4.8 17.8c.3-3 2-4.8 4.2-4.8s3.9 1.8 4.2 4.8"/><path d="M13.9 14.2c.8-.9 1.6-1.3 2.5-1.3 1.8 0 3 1.3 3.3 3.6"/>',
    roles:'<circle cx="8.5" cy="7.5" r="2.4"/><path d="M4.2 17.5c.35-3.2 2.1-5 4.3-5 1.35 0 2.45.55 3.2 1.55"/><circle cx="16.7" cy="15.6" r="2.1"/><path d="M16.7 11.9v1M16.7 18.2v1M13 15.6h1M19.4 15.6h1M14.1 13l.7.7M18.6 17.5l.7.7M19.3 13l-.7.7M14.8 17.5l-.7.7"/>',
    gear:'<path d="M8.5 6V5a3.5 3.5 0 0 1 7 0v1"/><rect x="6.3" y="5.8" width="11.4" height="14.2" rx="3.2"/><path d="M8.2 10.2h7.6M8.8 14.1h6.4v3H8.8z"/><path d="M6.3 10.2H5.1v5.2h1.2M17.7 10.2h1.2v5.2h-1.2"/>',
    food:'<path d="M6.5 3v5.2M4.7 3v3.2M8.3 3v3.2M4.7 6.2c0 1.5.7 2.3 1.8 2.3s1.8-.8 1.8-2.3M6.5 8.5V21"/><path d="M15.1 3v18M15.1 3c3.2 1.6 4.2 5.1 4.2 8.3h-4.2"/>',
    transport:'<path d="M5.2 6.2h10.5c1.2 0 2 .4 2.7 1.5l1.5 2.4c.4.6.6 1.3.6 2v4.3H3.5V8c0-1 .7-1.8 1.7-1.8Z"/><path d="M5.8 8.3h8v4h-8zM14.8 8.3h2.2l1.8 3.9h-4z"/><circle cx="7" cy="17.3" r="1.6"/><circle cx="17.2" cy="17.3" r="1.6"/><path d="M3.5 13.2h17"/>',
    documents:'<path d="M6 3.5h8.3L18.5 7v13.5H6z"/><path d="M14.3 3.5V7h4.2M8.8 11h6.8M8.8 14.2h6.8M8.8 17.4h4.5"/>',
    route:'<path d="M3.5 5.2 8.5 3l7 2.2 5-2.2v15.8l-5 2.2-7-2.2-5 2.2z"/><path d="M8.5 3v15.8M15.5 5.2V21"/><path d="M6.5 15.2c1.1-2 2.3-2.8 3.5-2.8 1.8 0 2.3 1.5 3.7 1.5 1.2 0 2.1-1 3.1-2.6" stroke-dasharray="1.6 2.2"/><path d="M17.1 7.5c0 1.5-1.7 3.6-1.7 3.6s-1.7-2.1-1.7-3.6a1.7 1.7 0 1 1 3.4 0Z"/>',
    plan:'<path d="M6 3.5h8.2L18 7.3v13.2H6z"/><path d="M14.2 3.5v3.8H18M8.8 11h6.4M8.8 14.5h6.4M8.8 18h4.2"/>'
  };
  const iconFor=id=>`<span class="sidebar-v43-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[id]||'<circle cx="12" cy="12" r="7"/>'}</svg></span>`;
  function decorateNav(){
    const nav=document.getElementById('nav');if(!nav)return;const buttons=Array.from(nav.querySelectorAll('button[data-tab]'));if(!buttons.length)return;
    const map=new Map(buttons.map(button=>[button.dataset.tab,button])),used=new Set(),fragment=document.createDocumentFragment();
    GROUPS.forEach(([title,ids])=>{const available=ids.map(id=>map.get(id)).filter(Boolean);if(!available.length)return;const group=document.createElement('div');group.className='sidebar-nav-group';const heading=document.createElement('div');heading.className='sidebar-nav-group__title';heading.textContent=title;const items=document.createElement('div');items.className='sidebar-nav-group__items';available.forEach(button=>{const id=button.dataset.tab;used.add(id);button.querySelector('.sidebar-v43-icon')?.remove();button.insertAdjacentHTML('afterbegin',iconFor(id));items.appendChild(button)});group.append(heading,items);fragment.appendChild(group)});
    buttons.filter(button=>!used.has(button.dataset.tab)).forEach(button=>{button.querySelector('.sidebar-v43-icon')?.remove();button.insertAdjacentHTML('afterbegin',iconFor(button.dataset.tab));fragment.appendChild(button)});nav.replaceChildren(fragment);nav.dataset.v43Decorated='1';
  }
  function decorateSidebar(){document.getElementById('sidebar')?.classList.add('sidebar-v43-ready');decorateNav()}
  const originalRenderNav=window.renderNav;if(typeof originalRenderNav==='function')window.renderNav=function(){originalRenderNav.apply(this,arguments);decorateNav()};requestAnimationFrame(decorateSidebar);
  window.addEventListener('load',()=>{
    const modules=['access-v47-docs','access-v47-core','access-v47-cloud','preview-v48','event-v49','participants-v50','participants-v50-actions','preview-v51'];
    const next=index=>{
      if(index>=modules.length){
        window.V47Cloud?.load?.();
        if(typeof render==='function')render();
        const build=document.querySelector('.build-label');if(build)build.textContent='V55 · стабильная сборка';
        return;
      }
      const script=document.createElement('script');script.src=`./${modules[index]}.js?r=${RELEASE}`;script.async=false;script.onload=()=>next(index+1);script.onerror=()=>{console.warn('Workspace module failed:',modules[index]);next(index+1)};document.body.appendChild(script);
    };
    next(0);
  },{once:true});
})();
