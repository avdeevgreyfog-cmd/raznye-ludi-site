/* V21.1 — small interaction fixes after the reference redesign. */
(function(){
  const bindBeforeV271=bind;
  bind=function(){
    bindBeforeV271();
    if(tab!=='transport')return;
    const editButtons=[...document.querySelectorAll('#tv24EditArrival')];
    editButtons.slice(1).forEach(b=>{b.onclick=()=>arrivalModalV24()});
  };
  const build=document.querySelector('.build-label');if(build)build.textContent='V21.1 · транспорт · референс доведён';
  if(tab==='transport')render();
})();
