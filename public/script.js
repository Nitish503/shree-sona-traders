const menu = document.getElementById("menu");
const btn = document.getElementById("menuBtn");
const overlay = document.getElementById("overlay");

// MENU
btn.onclick = () => {
  menu.classList.toggle("active");
  overlay.classList.toggle("show");
};

overlay.onclick = () => {
  menu.classList.remove("active");
  overlay.classList.remove("show");
};

// NAVIGATION
function goTo(page) {
  window.location.href = page;
}

// SLIDER + DOTS
let index = 0;
const slides = document.getElementById("slides");
const dotsContainer = document.getElementById("dots");
const total = slides.children.length;

// create dots
for (let i = 0; i < total; i++) {
  const dot = document.createElement("span");

  if (i === 0) dot.classList.add("active");

  dot.onclick = () => {
    index = i;
    updateSlider();
  };

  dotsContainer.appendChild(dot);
}

function updateSlider() {
  slides.style.transform = `translateX(-${index * 100}%)`;

  document.querySelectorAll(".dots span").forEach((d, i) => {
    d.classList.toggle("active", i === index);
  });
}

// AUTO SLIDE (SMOOTH)
setInterval(() => {
  index = (index + 1) % total;
  updateSlider();
}, 3500);