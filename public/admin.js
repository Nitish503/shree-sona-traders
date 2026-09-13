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


// =========================
// LOAD ALL CHAT MESSAGES
// =========================

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


// =========================
// DISPLAY CUSTOMERS
// =========================

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


// =========================
// DISPLAY CONVERSATION
// =========================

function displayConversation(customerId) {

  if (!selectedCustomer || !adminChatMessages) {
    return;
  }

  const customerMessages = allChatMessages.filter(
    message =>
      Number(message.customer_id) === Number(customerId)
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


    // DELETE BUTTON

    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-chat-message";

    deleteButton.textContent = "Delete";


    deleteButton.addEventListener("click", async function () {

      const confirmDelete = confirm(
        "Are you sure you want to delete this message?"
      );

      if (!confirmDelete) {
        return;
      }

      try {

        const response = await fetch(
          `${CHAT_API}/chat/delete/${message.id}`,
          {
            method: "DELETE"
          }
        );

        const data = await response.json();

        if (!data.success) {

          alert(
            data.message ||
            "Unable to delete message."
          );

          return;
        }

        await loadAdminChat();

      } catch (error) {

        console.error(
          "Delete Message Error:",
          error
        );

        alert(
          "Unable to connect to server."
        );

      }

    });


    wrapper.appendChild(div);
    wrapper.appendChild(deleteButton);

    adminChatMessages.appendChild(wrapper);

  });


  adminChatMessages.scrollTop =
    adminChatMessages.scrollHeight;

}


// =========================
// SEND ADMIN REPLY
// =========================

async function sendAdminMessage() {

  if (!selectedCustomerId) {

    alert(
      "Please select a customer first."
    );

    return;
  }

  const message =
    adminMessageInput.value.trim();

  if (!message) {
    return;
  }

  try {

    const response =
      await fetch(
        `${CHAT_API}/chat/admin-send`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            customerId:
              selectedCustomerId,
            message: message
          })
        }
      );


    const data =
      await response.json();


    if (!data.success) {

      alert(
        data.message ||
        "Unable to send reply."
      );

      return;
    }


    adminMessageInput.value = "";

    await loadAdminChat();

  } catch (error) {

    console.error(
      "Admin Reply Error:",
      error
    );

    alert(
      "Unable to connect to server."
    );

  }

}


// =========================
// SEND BUTTON
// =========================

if (adminSendButton) {

  adminSendButton.addEventListener(
    "click",
    sendAdminMessage
  );

}


// =========================
// ENTER KEY
// =========================

if (adminMessageInput) {

  adminMessageInput.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        sendAdminMessage();
      }

    }
  );

}


// =========================
// INITIAL LOAD
// =========================

loadAdminChat();


// =========================
// REFRESH EVERY 5 SECONDS
// =========================

setInterval(
  loadAdminChat,
  5000
);