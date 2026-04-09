const API = window.location.origin;

// 🔥 Format ₹ (Indian format)
function formatRupee(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(value || 0);
}

// Load all items
async function loadItems() {
  const res = await fetch(`${API}/items`);
  const items = await res.json();

  const container = document.getElementById("itemsContainer");
  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div>
        <b>${item.name}</b><br>
        <small>${item.category}</small>
      </div>

      <div class="rate-box">
        <input 
          type="number" 
          value="${item.rate || 0}" 
          id="rate-${item.id}"
          oninput="updateDisplay(${item.id})"
        >

        <span id="display-${item.id}">
          ${formatRupee(item.rate)}
        </span>

        <button onclick="updateRate(${item.id})">
          Save
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}

// Live ₹ update
function updateDisplay(id) {
  const value = document.getElementById(`rate-${id}`).value;
  document.getElementById(`display-${id}`).innerText = formatRupee(value);
}

// Save rate
async function updateRate(id) {
  const rate = document.getElementById(`rate-${id}`).value;

  await fetch(`${API}/items/${id}/rate`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ rate })
  });

  alert("Rate updated ✅");
}

loadItems();