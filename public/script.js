// =====================
// MENU TOGGLE
// =====================
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
const overlay = document.querySelector(".overlay");

toggle.onclick = () => {
  nav.classList.toggle("active");
  overlay.classList.toggle("show");
};

overlay.onclick = () => {
  nav.classList.remove("active");
  overlay.classList.remove("show");
};

// =====================
// NAVIGATION
// =====================
function goTo(page) {
  window.location.href = page;
}

// =====================
// SLIDER
// =====================
let index = 0;
const slides = document.getElementById("slides");
const total = slides.children.length;

const dotsContainer = document.getElementById("dots");

// CREATE DOTS
for (let i = 0; i < total; i++) {
  const dot = document.createElement("span");
  dotsContainer.appendChild(dot);
}

function showSlide(i) {
  slides.style.transform = `translateX(-${i * 100}%)`;

  document.querySelectorAll(".dots span").forEach((d, idx) => {
    d.classList.toggle("active", idx === i);
  });
}

// AUTO SLIDE
setInterval(() => {
  index = (index + 1) % total;
  showSlide(index);
}, 3000);

showSlide(0);