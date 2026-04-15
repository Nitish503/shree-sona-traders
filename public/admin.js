// =====================
// TOGGLE SIDEBAR
// =====================
function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");
}

// =====================
// CLOSE MENU ON OUTSIDE CLICK
// =====================
document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.querySelector(".menu-toggle");

  if (
    sidebar &&
    menuBtn &&
    !sidebar.contains(event.target) &&
    !menuBtn.contains(event.target)
  ) {
    sidebar.classList.remove("active");
  }
});

// =====================
// UPLOAD SIGNATURE (CLOUDINARY)
// =====================
async function uploadSignature() {

  const fileInput = document.getElementById("signatureFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a signature image");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("/upload-signature", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.url) {
      document.getElementById("signaturePreview").src = data.url;
      alert("✅ Signature uploaded successfully");
    } else {
      alert("Upload failed");
    }

  } catch (err) {
    console.error(err);
    alert("❌ Upload failed");
  }
}