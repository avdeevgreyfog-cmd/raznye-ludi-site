document.addEventListener('DOMContentLoaded',()=>{
 const header=document.querySelector('.site-header');
 window.addEventListener('scroll',()=>{
  if(window.scrollY>40){header?.classList.add('scrolled')}
  else{header?.classList.remove('scrolled')}
 });
});
