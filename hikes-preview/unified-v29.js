/* RL workspace shell — keep one visual language across every hike tab. */
(function(){
  const currentScriptSrc=document.currentScript?.src || location.href;
  const systemHref=new URL('../css/rl-system.css',currentScriptSrc).href;
  if(!document.querySelector(`link[href="${systemHref}"]`)){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=systemHref;
    document.head.appendChild(link);
  }
  document.body.classList.add('rl-unified-shell');
  const build=document.querySelector('.build-label');
  if(build)build.textContent='V33 · единая дизайн-система';
})();
