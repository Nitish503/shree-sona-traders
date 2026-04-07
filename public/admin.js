// Toggle sidebar for mobile
function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");
}

// Optional: Close menu when clicking outside (better UX)
document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.querySelector(".menu-toggle");

  if (
    !sidebar.contains(event.target) &&
    !menuBtn.contains(event.target)
  ) {
    sidebar.classList.remove("active");
  }
});