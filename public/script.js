const menu = document.querySelector(".nav-links");
const toggle = document.querySelector(".menu-toggle");
const overlay = document.querySelector(".overlay");

// MENU TOGGLE
toggle.addEventListener("click", () => {
  menu.classList.add("active");
  overlay.classList.add("show");
});

// CLOSE MENU
overlay.addEventListener("click", () => {
  menu.classList.remove("active");
  overlay.classList.remove("show");
});

// NAVIGATION
function goTo(page) {
  window.location.href = page;
}

/* ===================== */
/* SLIDER */
/* ===================== */
let index = 0;
const slides = document.getElementById("slides");
const dotsContainer = document.getElementById("dots");

const totalSlides = slides.children.length;

// CREATE DOTS
for (let i = 0; i < totalSlides; i++) {
  const dot = document.createElement("span");
  dotsContainer.appendChild(dot);
}

const dots = dotsContainer.children;

function showSlide(i) {
  slides.style.transform = `translateX(-${i * 100}%)`;

  for (let d of dots) d.classList.remove("active");
  dots[i].classList.add("active");
}

function autoSlide() {
  index = (index + 1) % totalSlides;
  showSlide(index);
}

setInterval(autoSlide, 3000);
showSlide(0);