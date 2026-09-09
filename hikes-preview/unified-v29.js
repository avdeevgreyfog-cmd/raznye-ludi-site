/* V23 — keep one visual shell across every hike tab. */
(function(){
  document.body.classList.add('rl-unified-shell');
  const build=document.querySelector('.build-label');
  if(build)build.textContent='V23 · единый интерфейс всех вкладок';
})();
