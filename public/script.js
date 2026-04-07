const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const overlay = document.querySelector('.overlay');

toggle.addEventListener('click', () => {
  nav.classList.toggle('nav-active');
  overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
  nav.classList.remove('nav-active');
  overlay.classList.remove('active');
});