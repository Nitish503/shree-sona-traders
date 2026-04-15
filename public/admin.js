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

//===============================
// Company details function
//==============================  

async function saveCompany() {

  const data = {
    name: document.getElementById("cName").value,
    address: document.getElementById("cAddress").value,
    phone: document.getElementById("cPhone").value,
    gst: document.getElementById("cGST").value,
    email: document.getElementById("cEmail").value,
    state: document.getElementById("cState").value
  };

  try {
    await fetch("/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    alert("✅ Company details saved");

  } catch (err) {
    alert("❌ Failed");
  }
}

async function uploadLogo() {

  const file = document.getElementById("logoFile").files[0];

  if (!file) {
    alert("Select logo");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("/upload-logo", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    document.getElementById("logoPreview").src = data.url;

    alert("✅ Logo uploaded");

  } catch (err) {
    alert("Upload failed");
  }
}