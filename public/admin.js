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
function saveSignature() {
  const fileInput = document.getElementById("signatureInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a signature image");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const base64 = e.target.result;

    // 💾 Save in localStorage
    localStorage.setItem("signature", base64);

    // Preview
    const preview = document.getElementById("previewSignature");
    preview.src = base64;
    preview.style.display = "block";

    alert("✅ Signature saved");
  };

  reader.readAsDataURL(file);
}