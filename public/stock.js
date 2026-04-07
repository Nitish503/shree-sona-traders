// Load items on page load
document.addEventListener("DOMContentLoaded", () => {
  loadItems();

  // Handle Add Item form
  document.getElementById("add-item-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;

    if (!name || !description || !category) {
      alert("Please fill all fields");
      return;
    }

    try {
      await fetch("http://localhost:5000/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category })
      });

      // Clear form
      document.getElementById("add-item-form").reset();

      // Refresh item list
      loadItems();
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item");
    }
  });

  // Handle filter dropdown
  document.getElementById("filter-category").addEventListener("change", loadItems);
});

// --------------------
// Load Items
// --------------------
async function loadItems() {
  const category = document.getElementById("filter-category").value;
  let url = "http://localhost:5000/items";
  if (category !== "all") {
    url = `http://localhost:5000/items/${category}`;
  }

  try {
    const res = await fetch(url);
    const items = await res.json();

    const itemList = document.getElementById("item-list");
    itemList.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <h4>${item.name}</h4>
        <p>${item.description}</p>
        <p><strong>Category:</strong> ${item.category}</p>
        <p><strong>Status:</strong> ${item.status}</p>
        <button onclick="markStatus(${item.id}, 'available')">Mark Available</button>
        <button onclick="markStatus(${item.id}, 'out_of_stock')">Mark Out of Stock</button>
        <button onclick="deleteItem(${item.id})">Delete</button>
      `;
      itemList.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading items:", err);
  }
}

// --------------------
// Update Item Status
// --------------------
async function markStatus(id, status) {
  try {
    await fetch(`http://localhost:5000/items/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    loadItems();
  } catch (err) {
    console.error("Error updating status:", err);
  }
}

// --------------------
// Delete Item
// --------------------
async function deleteItem(id) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  try {
    await fetch(`http://localhost:5000/items/${id}`, { method: "DELETE" });
    loadItems();
  } catch (err) {
    console.error("Error deleting item:", err);
  }
}

// --------------------
// Bulk Actions
// --------------------
async function bulkDelete() {
  // Example: implement later with checkboxes
  alert("Bulk delete not yet implemented");
}

async function bulkUpdate(status) {
  // Example: implement later with checkboxes
  alert(`Bulk update to ${status} not yet implemented`);
}