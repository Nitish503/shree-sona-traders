// Add Item
async function addItem() {
  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;

  if (!name) return alert("Enter item name");

  await fetch(`/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, category })
  });

  document.getElementById("name").value = "";
  loadItems(category);
}


// Load Items
async function loadItems(category = "construction") {
  const res = await fetch(`/items/${category}`);
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

      <div>
        <button onclick="toggleStatus(${item.id}, '${item.status}')">
          Toggle
        </button>

        <button onclick="deleteItem(${item.id})">
          Delete
        </button>
      </div>
    `;

    list.appendChild(li);
  });
}


// Toggle Status
async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === "available" ? "out" : "available";

  await fetch(`/items/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: newStatus })
  });

  loadItems();
}


// Delete Item
async function deleteItem(id) {
  await fetch(`/items/${id}`, {
    method: "DELETE"
  });

  loadItems();
}

// Initial load
loadItems();