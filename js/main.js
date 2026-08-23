// Shared site interactions

document.addEventListener('DOMContentLoaded',()=>{
 const header=document.querySelector('.header');
 if(header){
  window.addEventListener('scroll',()=>{
   header.classList.toggle('scrolled',window.scrollY>40);
  });
 }

 const links=document.querySelectorAll('.nav-item');
 links.forEach(item=>{
  item.addEventListener('mouseenter',()=>item.classList.add('open'));
  item.addEventListener('mouseleave',()=>item.classList.remove('open'));
 });
});
