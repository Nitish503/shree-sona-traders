let selectedItems = [];

async function loadItems(category = "all") {
  let items = [];
  if (category === "all") {
    const res1 = await fetch("/items/construction");
    const res2 = await fetch("/items/rental");
    const res3 = await fetch("/items/fuel");
    items = [...await res1.json(), ...await res2.json(), ...await res3.json()];
  } else {
    const res = await fetch(`/items/${category}`);
    items = await res.json();
  }

  const container = document.getElementById("item-list");
  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item-card";
    div.innerHTML = `
      <input type="checkbox" onchange="toggleSelect(${item.id}, this.checked)">
      <h4>${item.name}</h4>
      <p>${item.description}</p>
      <p>Category: ${item.category}</p>
      <p>Status: ${item.status}</p>
      <button onclick="editItem(${item.id}, '${item.name}', '${item.description}', '${item.category}')">Edit</button>
      <button onclick="deleteItem(${item.id})">Delete</button>
      <button onclick="toggleStatus(${item.id}, '${item.status}')">
        ${item.status === "available" ? "Mark Out of Stock" : "Mark Available"}
      </button>
    `;
    container.appendChild(div);
  });
}

function toggleSelect(id, checked) {
  if (checked) {
    selectedItems.push(id);
  } else {
    selectedItems = selectedItems.filter(itemId => itemId !== id);
  }
}

async function deleteItem(id) {
  await fetch(`/items/${id}`, { method: "DELETE" });
  loadItems(document.getElementById("filter-category").value);
}

async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === "available" ? "out_of_stock" : "available";
  await fetch(`/items/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  });
  loadItems(document.getElementById("filter-category").value);
}

function editItem(id, name, description, category) {
  const newName = prompt("Edit Name:", name);
  const newDesc = prompt("Edit Description:", description);
  const newCat = prompt("Edit Category (construction/rental/fuel):", category);

  if (newName && newDesc && newCat) {
    fetch(`/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc, category: newCat })
    }).then(() => loadItems(document.getElementById("filter-category").value));
  }
}

async function bulkDelete() {
  if (selectedItems.length === 0) return alert("No items selected");
  await fetch("/items/bulk/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: selectedItems })
  });
  selectedItems = [];
  loadItems(document.getElementById("filter-category").value);
}

async function bulkUpdate(status) {
  if (selectedItems.length === 0) return alert("No items selected");
  await fetch("/items/bulk/status", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: selectedItems, status })
  });
  selectedItems = [];
  loadItems(document.getElementById("filter-category").value);
}

document.getElementById("add-item-form").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const category = document.getElementById("category").value;

  await fetch("/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, category })
  });

  e.target.reset();
  loadItems(document.getElementById("filter-category").value);
});

document.getElementById("filter-category").addEventListener("change", e => {
  loadItems(e.target.value);
});

loadItems();