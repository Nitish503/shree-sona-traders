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

// =========================
// NOTICE BOARD
// =========================

const NOTICE_API = "https://shree-sona-traders.onrender.com";

const noticeOverlay = document.getElementById("noticeOverlay");
const noticeText = document.getElementById("noticeText");
const closeNotice = document.getElementById("closeNotice");


// Load notice when home page opens
async function loadNotice() {
  try {

    const response = await fetch(
      `${NOTICE_API}/notice`
    );

    const data = await response.json();

    if (
      data.success &&
      data.notice &&
      data.notice.is_enabled === true &&
      data.notice.message
    ) {

      noticeText.textContent =
        data.notice.message;

      noticeOverlay.style.display = "flex";
    }

  } catch (error) {

    console.error(
      "Notice Board Error:",
      error
    );

  }
}


// Close notice
if (closeNotice) {

  closeNotice.addEventListener(
    "click",
    function () {

      noticeOverlay.style.display = "none";

    }
  );

}


// Load notice
loadNotice();