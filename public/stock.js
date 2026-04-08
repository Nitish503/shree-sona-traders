const API = "https://your-render-url.onrender.com";

let currentCategory = "construction";

// ✅ Add Item
async function addItem() {
  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;

  if (!name) return alert("Enter item name");

  await fetch(`${API}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      category
    })
  });

  document.getElementById("name").value = "";
  loadItems(category);
}

// ✅ Load Items
async function loadItems(category = currentCategory) {
  currentCategory = category;

  const res = await fetch(`${API}/items/${category}`);
  const data = await res.json();

  const list = document.getElementById("stockList");
  list.innerHTML = "";

  data.forEach(item => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        <span style="color:${item.status === "available" ? "green" : "red"}">
          ${item.status}
        </span>
      </div>

      <div class="actions">
        <button class="toggle" onclick="toggleStatus(${item.id}, '${item.status}')">
          Toggle
        </button>

        <button class="delete" onclick="deleteItem(${item.id})">
          Delete
        </button>
      </div>
    `;

    list.appendChild(li);
  });
}

// ✅ Toggle Status
async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === "available" ? "out" : "available";

  await fetch(`${API}/items/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: newStatus })
  });

  loadItems(currentCategory);
}

// ✅ Delete Item
async function deleteItem(id) {
  await fetch(`${API}/items/${id}`, {
    method: "DELETE"
  });

  loadItems(currentCategory);
}

// Initial Load
loadItems();