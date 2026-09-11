/* RL workspace shell — keep one visual language across every hike tab. */
(function(){
  document.body.classList.add('rl-unified-shell');
  const build=document.querySelector('.build-label');
  if(build)build.textContent='V35 · читаемая светлая рабочая тема';
})();
