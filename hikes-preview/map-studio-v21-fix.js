/* V15.1 — interaction safety fixes for fullscreen map studio. */
if(typeof studioV21!=='undefined'&&studioV21.areaPicking===undefined)studioV21.areaPicking=false;

/* Do not try to draw a 200 m grid across huge low-zoom viewports. */
const drawStudioGridBaseV211=drawStudioGridV21;
drawStudioGridV21=function(){
  const z=studioV21.map?.getZoom?.()||0;
  if(z<13)return;
  return drawStudioGridBaseV211();
};

/* Atlas tool is inspection by default. Two-click area editing starts only after the explicit button. */
const clearStudioAreaPickBaseV211=clearStudioAreaPickV21;
clearStudioAreaPickV21=function(){studioV21.areaPicking=false;return clearStudioAreaPickBaseV211()};
const startStudioAreaPickBaseV211=startStudioAreaPickV21;
startStudioAreaPickV21=function(){startStudioAreaPickBaseV211();studioV21.areaPicking=true;renderStudioInspectorV21()};
const handleStudioMapClickBaseV211=handleStudioMapClickV21;
handleStudioMapClickV21=function(e){
  if(studioV21.tool==='atlas'&&!studioV21.areaPicking)return;
  return handleStudioMapClickBaseV211(e);
};

/* Keep Nakarte integration conservative: satellite uses its known S layer code; other modes open at the same place without forcing a layer code. */
openNakarteV21=function(){
  if(!studioV21.map)return;
  const c=studioV21.map.getCenter(),z=Math.round(studioV21.map.getZoom()),layer=studioV21.base==='sat'?'&l=S':'';
  window.open(`https://nakarte.me/#m=${z}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}${layer}`,'_blank','noopener');
};

/* Make the atlas inspector state explicit. */
const inspectorAtlasBaseV211=inspectorAtlasV21;
inspectorAtlasV21=function(){
  const h=inspectorAtlasBaseV211();
  if(!studioV21.areaPicking)return h;
  return h.replace('<div class="studio-help-v21">','<div class="studio-step-v21 ready"><b>•</b><span>Режим выбора области включён: укажи два противоположных угла на карте.</span></div><div class="studio-help-v21">');
};

const buildV211=document.querySelector('.build-label');
if(buildV211)buildV211.textContent='V15.1 · полноэкранная карта · финальный атлас';
