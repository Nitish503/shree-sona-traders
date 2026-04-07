document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const overlay = document.querySelector(".overlay");

  // Toggle menu
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    overlay.style.display = navLinks.classList.contains("active") ? "block" : "none";
  });

  // Auto-close when clicking a link
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      overlay.style.display = "none";
    });
  });

  // Auto-close when clicking outside (overlay)
  overlay.addEventListener("click", () => {
    navLinks.classList.remove("active");
    overlay.style.display = "none";
  });
});