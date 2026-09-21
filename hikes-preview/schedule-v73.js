/* V73 — normalize the agreed Tominsky schedule for old local copies and preview mode. */
(()=>{
'use strict';

function meetingWithTime(raw,time='09:00'){
  const text=String(raw||'').trim();
  const place=text.replace(/^\s*\d{1,2}:\d{2}\s*(?:[·—–-]\s*)?/,'').trim();
  return place?`${time} · ${place}`:time;
}
function normalize(){
  if(typeof S==='undefined'||!S?.event)return false;
  S.event.date='10–11 октября 2026';
  S.event.durationDays=2;
  S.event.overnight=true;
  S.event.duration='2 дня · 1 ночь';
  S.event.start='10:00';
  S.event._previewStart='2026-10-10T10:00';
  S.event.meeting=meetingWithTime(S.event.meeting,'09:00');
  return true;
}
if(typeof render==='function'&&!render.__scheduleV73){
  const base=render;
  const wrapped=function(){
    normalize();
    return base.apply(this,arguments);
  };
  wrapped.__scheduleV73=true;
  render=wrapped;
}
normalize();
queueMicrotask(()=>{normalize();if(typeof render==='function')render()});
window.HikeScheduleV73={normalize};
})();