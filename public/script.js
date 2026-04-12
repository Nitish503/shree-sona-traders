const menu = document.getElementById("menu");
const btn = document.getElementById("menuBtn");
const overlay = document.getElementById("overlay");

btn.onclick = () => {
  menu.classList.toggle("active");
  overlay.classList.toggle("show");
};

overlay.onclick = () => {
  menu.classList.remove("active");
  overlay.classList.remove("show");
};

// SLIDER
let index = 0;
const slides = document.getElementById("slides");

setInterval(() => {
  index = (index + 1) % slides.children.length;
  slides.style.transform = `translateX(-${index * 100}%)`;
}, 3000);