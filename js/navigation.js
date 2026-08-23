document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.site-nav');
 if(!nav)return;
 window.addEventListener('scroll',()=>{
  nav.classList.toggle('scrolled',window.scrollY>40);
 });
});
