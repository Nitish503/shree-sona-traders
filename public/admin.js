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
    const res = await fetch("https://shree-sona-traders.onrender.com/upload-signature", {
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
    await fetch("https://shree-sona-traders.onrender.com/company", {
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
    const res = await fetch("https://shree-sona-traders.onrender.com/upload-logo", {
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

// =========================
// ADMIN CUSTOMER CHAT
// =========================

const CHAT_API = "https://shree-sona-traders.onrender.com";

let allChatMessages = [];
let selectedCustomerId = null;

const customerList = document.getElementById("chatCustomerList");
const selectedCustomer = document.getElementById("selectedCustomer");
const adminChatMessages = document.getElementById("adminChatMessages");
const adminMessageInput = document.getElementById("adminMessageInput");
const adminSendButton = document.getElementById("adminSendButton");


// Load all chat messages
async function loadAdminChat() {
  try {
    const response = await fetch(`${CHAT_API}/chat/messages`);
    const data = await response.json();

    if (!data.success) {
      throw new Error("Unable to load chat");
    }

    allChatMessages = data.messages;

    displayCustomers();

    if (selectedCustomerId) {
      displayConversation(selectedCustomerId);
    }

  } catch (error) {
    console.error("Admin Chat Error:", error);

    if (customerList) {
      customerList.innerHTML =
        "<p>Unable to load customer messages.</p>";
    }
  }
}


// Display customers
function displayCustomers() {

  if (!customerList) {
    return;
  }

  const customers = {};

  allChatMessages.forEach(message => {

    if (!customers[message.customer_id]) {
      customers[message.customer_id] = {
        id: message.customer_id,
        name: message.customer_name || "Unknown Customer",
        phone: message.customer_phone || "No phone"
      };
    }

  });

  customerList.innerHTML = "";

  const customerIds = Object.keys(customers);

  if (customerIds.length === 0) {
    customerList.innerHTML =
      "<p>No customers have sent messages yet.</p>";
    return;
  }

  customerIds.forEach(customerId => {

    const customer = customers[customerId];

    const div = document.createElement("div");

    div.className = "chat-customer";

    div.innerHTML = `
      <strong>${customer.name}</strong><br>
      <small>${customer.phone}</small>
    `;

    div.addEventListener("click", function () {

      selectedCustomerId = customer.id;

      displayConversation(customer.id);

    });

    customerList.appendChild(div);

  });

}


// Display selected customer's conversation
function displayConversation(customerId) {

  if (!selectedCustomer || !adminChatMessages) {
    return;
  }

  const customerMessages = allChatMessages.filter(
    message => Number(message.customer_id) === Number(customerId)
  );

  if (customerMessages.length === 0) {
    return;
  }

  const firstMessage = customerMessages[0];

  selectedCustomer.innerHTML = `
    ${firstMessage.customer_name || "Customer"}
    <small>(${firstMessage.customer_phone || ""})</small>
  `;

  adminChatMessages.innerHTML = "";

  customerMessages.forEach(message => {

    const wrapper = document.createElement("div");

    wrapper.className =
      "admin-chat-message-wrapper " +
      (message.sender === "customer" ? "customer" : "admin");

    const div = document.createElement("div");

    div.className =
      "admin-chat-message " +
      (message.sender === "customer" ? "customer" : "admin");

    div.textContent = message.message;

    wrapper.appendChild(div);

    // Delete button
    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-chat-message";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
      deleteChatMessage(message.id);
    });

    wrapper.appendChild(deleteButton);

    adminChatMessages.appendChild(wrapper);

  });

  adminChatMessages.scrollTop =
    adminChatMessages.scrollHeight;
}

// Delete chat message
async function deleteChatMessage(messageId) {

  const confirmDelete = confirm(
    "Are you sure you want to delete this message?"
  );

  if (!confirmDelete) {
    return;
  }

  try {

    const response = await fetch(
      `${CHAT_API}/chat/delete/${messageId}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Unable to delete message.");
      return;
    }

    await loadAdminChat();

  } catch (error) {

    console.error("Delete Chat Error:", error);

    alert("Unable to connect to server.");

  }
}


// Send Admin reply
async function sendAdminMessage() {

  if (!selectedCustomerId) {
    alert("Please select a customer first.");
    return;
  }

  const message = adminMessageInput.value.trim();

  if (!message) {
    return;
  }

  try {

    const response = await fetch(`${CHAT_API}/chat/admin-send`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        customerId: selectedCustomerId,
        message: message
      })

    });

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Unable to send reply.");
      return;
    }

    adminMessageInput.value = "";

    await loadAdminChat();

  } catch (error) {

    console.error("Admin Reply Error:", error);

    alert("Unable to connect to server.");

  }

}


// Send button
if (adminSendButton) {
  adminSendButton.addEventListener(
    "click",
    sendAdminMessage
  );
}


// Enter key
if (adminMessageInput) {
  adminMessageInput.addEventListener(
    "keydown",
    function(event) {

      if (event.key === "Enter") {
        sendAdminMessage();
      }

    }
  );
}


// Initial load
loadAdminChat();


// Refresh every 5 seconds
setInterval(loadAdminChat, 5000);

// =========================
// NOTICE BOARD ADMIN
// =========================

const noticeMessage = document.getElementById("noticeMessage");
const noticeEnabled = document.getElementById("noticeEnabled");
const saveNoticeButton = document.getElementById("saveNoticeButton");
const turnOffNoticeButton = document.getElementById("turnOffNoticeButton");


// Load current notice
async function loadNoticeSettings() {

  if (!noticeMessage || !noticeEnabled) {
    return;
  }

  try {

    const response = await fetch(
      "https://shree-sona-traders.onrender.com/notice"
    );

    const data = await response.json();

    if (!data.success || !data.notice) {
      return;
    }

    noticeMessage.value = data.notice.message || "";
    noticeEnabled.checked = data.notice.is_enabled === true;

  } catch (error) {

    console.error("Notice Load Error:", error);

  }
}


// Save notice
async function saveNotice() {

  const message = noticeMessage.value.trim();

  if (!message) {
    alert("Please write a notice message.");
    return;
  }

  try {

    const response = await fetch(
      "https://shree-sona-traders.onrender.com/notice",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message,
          is_enabled: noticeEnabled.checked
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Unable to save notice.");
      return;
    }

    alert("✅ Notice saved successfully.");

  } catch (error) {

    console.error("Notice Save Error:", error);

    alert("Unable to connect to server.");

  }
}


// Turn notice off
async function turnOffNotice() {

  try {

    const response = await fetch(
      "https://shree-sona-traders.onrender.com/notice/off",
      {
        method: "POST"
      }
    );

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Unable to turn off notice.");
      return;
    }

    noticeEnabled.checked = false;

    alert("✅ Notice Board turned off.");

  } catch (error) {

    console.error("Notice Off Error:", error);

    alert("Unable to connect to server.");

  }
}


// Button events
if (saveNoticeButton) {
  saveNoticeButton.addEventListener(
    "click",
    saveNotice
  );
}

if (turnOffNoticeButton) {
  turnOffNoticeButton.addEventListener(
    "click",
    turnOffNotice
  );
}


// Load settings when Admin Dashboard opens
loadNoticeSettings();

// =========================
// SLIDER IMAGE ADMIN
// =========================

const SLIDER_API = "https://shree-sona-traders.onrender.com";

async function uploadSliderImage(position) {

  const fileInput = document.getElementById(
    `sliderImage${position}`
  );

  const file = fileInput.files[0];

  if (!file) {
    alert(`Please select Slider Image ${position}.`);
    return;
  }

  const formData = new FormData();

  formData.append("image", file);
  formData.append("position", position);

  try {

    const response = await fetch(
      `${SLIDER_API}/upload-slider`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Unable to upload slider image.");
      return;
    }

    alert(`✅ Slider Image ${position} uploaded successfully.`);

    fileInput.value = "";

  } catch (error) {

    console.error("Slider Upload Error:", error);

    alert("Unable to connect to server.");

  }
}


// Slider 1
const uploadSlider1 =
  document.getElementById("uploadSlider1");

if (uploadSlider1) {
  uploadSlider1.addEventListener(
    "click",
    function () {
      uploadSliderImage(1);
    }
  );
}


// Slider 2
const uploadSlider2 =
  document.getElementById("uploadSlider2");

if (uploadSlider2) {
  uploadSlider2.addEventListener(
    "click",
    function () {
      uploadSliderImage(2);
    }
  );
}


// Slider 3
const uploadSlider3 =
  document.getElementById("uploadSlider3");

if (uploadSlider3) {
  uploadSlider3.addEventListener(
    "click",
    function () {
      uploadSliderImage(3);
    }
  );
}

// ==========================================
// APK UPDATE MANAGEMENT
// ==========================================

const APK_API = "https://shree-sona-traders.onrender.com";

const apkVersionInput = document.getElementById("apkVersion");
const apkMessageInput = document.getElementById("apkMessage");
const apkDownloadUrlInput = document.getElementById("apkDownloadUrl");
const apkUpdateEnabledInput = document.getElementById("apkUpdateEnabled");
const publishApkButton = document.getElementById("publishApkUpdateButton");
const refreshApkHistoryButton = document.getElementById("refreshApkHistoryButton");
const apkUpdateStatus = document.getElementById("apkUpdateStatus");
const apkUpdateHistoryList = document.getElementById("apkUpdateHistoryList");

function getApkAdminToken() {
  return localStorage.getItem("adminToken");
}

async function apkAdminRequest(path, options = {}) {
  const token = getApkAdminToken();

  if (!token) {
    throw new Error("Admin token missing. Please log in again.");
  }

  const response = await fetch(`${APK_API}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
    throw new Error("Your admin session expired. Please log in again.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function setApkStatus(message, isError = false) {
  if (!apkUpdateStatus) return;

  apkUpdateStatus.textContent = message;
  apkUpdateStatus.style.color = isError ? "red" : "green";
}

function createApkHistoryElement(update, isLatest) {
  const card = document.createElement("div");

  card.style.border = "1px solid #ccc";
  card.style.borderRadius = "8px";
  card.style.padding = "12px";
  card.style.margin = "12px 0";

  const title = document.createElement("h4");
  title.textContent = `Version ${update.version || "Unknown"}`;
  card.appendChild(title);

  const message = document.createElement("p");
  message.textContent = update.message || "";
  card.appendChild(message);

  const link = document.createElement("a");
  link.textContent = "Download APK";
  link.href = update.download_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  card.appendChild(link);

  const status = document.createElement("p");
  status.textContent = update.is_enabled
    ? "Status: Active for customers"
    : "Status: Inactive";
  card.appendChild(status);

  const date = document.createElement("p");
  date.textContent = update.updated_at
    ? `Published: ${new Date(update.updated_at).toLocaleString()}`
    : "";
  card.appendChild(date);

  if (isLatest) {
    const note = document.createElement("p");
    note.textContent = "Latest record — cannot be deleted.";
    card.appendChild(note);
  } else {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Old Record";

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Delete the update record for version ${update.version}? This will not delete the hosted APK file.`
      );

      if (!confirmed) return;

      deleteButton.disabled = true;

      try {
        await apkAdminRequest(
          `/api/app-update/${encodeURIComponent(update.id)}`,
          { method: "DELETE" }
        );

        setApkStatus("Old APK update record deleted.");
        await loadApkUpdateHistory();
      } catch (error) {
        setApkStatus(error.message, true);
        deleteButton.disabled = false;
      }
    });

    card.appendChild(deleteButton);
  }

  return card;
}

async function loadApkUpdateHistory() {
  if (!apkUpdateHistoryList) return;

  apkUpdateHistoryList.textContent = "Loading update history...";

  try {
    const data = await apkAdminRequest("/api/app-updates");
    const updates = Array.isArray(data.updates) ? data.updates : [];

    apkUpdateHistoryList.replaceChildren();

    if (updates.length === 0) {
      apkUpdateHistoryList.textContent = "No APK update records found.";
      return;
    }

    updates.forEach((update, index) => {
      apkUpdateHistoryList.appendChild(
        createApkHistoryElement(update, index === 0)
      );
    });
  } catch (error) {
    apkUpdateHistoryList.textContent = error.message;
    setApkStatus(error.message, true);
  }
}

if (publishApkButton) {
  publishApkButton.addEventListener("click", async () => {
    const version = apkVersionInput.value.trim();
    const message = apkMessageInput.value.trim();
    const download_url = apkDownloadUrlInput.value.trim();
    const is_enabled = apkUpdateEnabledInput.checked;

    if (!version || !message || !download_url) {
      setApkStatus(
        "Please enter the app version, update message, and APK download URL.",
        true
      );
      return;
    }

    try {
      const parsedUrl = new URL(download_url);

      if (parsedUrl.protocol !== "https:") {
        setApkStatus("Please use a secure HTTPS download URL.", true);
        return;
      }
    } catch {
      setApkStatus("Please enter a valid APK download URL.", true);
      return;
    }

    publishApkButton.disabled = true;
    publishApkButton.textContent = "Publishing...";

    try {
      await apkAdminRequest("/api/app-update", {
        method: "POST",
        body: JSON.stringify({
          version,
          message,
          download_url,
          is_enabled
        })
      });

      setApkStatus("APK update published successfully.");

      apkVersionInput.value = "";
      apkMessageInput.value = "";
      apkDownloadUrlInput.value = "";
      apkUpdateEnabledInput.checked = false;

      await loadApkUpdateHistory();
    } catch (error) {
      setApkStatus(error.message, true);
    } finally {
      publishApkButton.disabled = false;
      publishApkButton.textContent = "Publish APK Update";
    }
  });
}

if (refreshApkHistoryButton) {
  refreshApkHistoryButton.addEventListener(
    "click",
    loadApkUpdateHistory
  );
}