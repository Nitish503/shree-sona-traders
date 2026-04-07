// Use your deployed Render backend URL
const API_BASE = "https://shree-sona-trader.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  loadItems();

  document.getElementById("add-item-form").addEventListener("submit", async (e) => {
  
  });

  document.getElementById("filter-category").addEventListener("change", loadItems);
});

document.getElementById("bulk-available-btn").addEventListener("click", () => {
  const ids = getSelectedIds();
  if (ids.length) bulkUpdateStatus(ids, "available");
});

document.getElementById("bulk-outofstock-btn").addEventListener("click", () => {
  const ids = getSelectedIds();
  if (ids.length) bulkUpdateStatus(ids, "out_of_stock");
});

document.getElementById("bulk-delete-btn").addEventListener("click", () => {
  const ids = getSelectedIds();
  if (ids.length) bulkDelete(ids);
});

    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;

    if (!name || !description || !category) {
      alert("⚠️ Please fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category })
      });

      if (res.ok) {
        alert("✅ Item added successfully!");
        document.getElementById("add-item-form").reset();
        loadItems();
      } else {
        alert("❌ Failed to add item. Please try again.");
      }
    } catch (err) {
      console.error("Error adding item:", err);
      alert("❌ Server error adding item");
    }
  });

  document.getElementById("filter-category").addEventListener("change", loadItems);
});

async function loadItems() {
  const category = document.getElementById("filter-category").value;
  let url = `${API_BASE}/items`;
  if (category !== "all") {
    url = `${API_BASE}/items/${category}`;
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
  <input type="checkbox" class="item-checkbox" value="${item.id}">
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
    alert("❌ Failed to load items");
  }
}

async function markStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/items/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      alert(`✅ Item marked as ${status}`);
      loadItems();
    } else {
      alert("❌ Failed to update status");
    }
  } catch (err) {
    console.error("Error updating status:", err);
    alert("❌ Server error updating status");
  }
}

async function deleteItem(id) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  try {
    const res = await fetch(`${API_BASE}/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("✅ Item deleted successfully");
      loadItems();
    } else {
      alert("❌ Failed to delete item");
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    alert("❌ Server error deleting item");
  }
}
async function bulkUpdateStatus(ids, status) {
  try {
    const res = await fetch(`${API_BASE}/items/bulk/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status })
    });

    if (res.ok) {
      alert(`✅ Selected items marked as ${status}`);
      loadItems();
    } else {
      alert("❌ Failed to bulk update status");
    }
  } catch (err) {
    console.error("Error bulk updating:", err);
    alert("❌ Server error bulk updating");
  }
}

async function bulkDelete(ids) {
  if (!confirm("Are you sure you want to delete selected items?")) return;
  try {
    const res = await fetch(`${API_BASE}/items/bulk/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });

    if (res.ok) {
      alert("✅ Selected items deleted successfully");
      loadItems();
    } else {
      alert("❌ Failed to bulk delete items");
    }
  } catch (err) {
    console.error("Error bulk deleting:", err);
    alert("❌ Server error bulk deleting");
  }
}
function getSelectedIds() {
  return Array.from(document.querySelectorAll(".item-checkbox:checked"))
              .map(cb => parseInt(cb.value));
}