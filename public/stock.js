async function addItem() {
  const name = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const category = document.getElementById("category").value;
  const image = document.getElementById("image").files[0];

  if (!name) return alert("Enter item name");

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("category", category);
  if (image) formData.append("image", image);

  await fetch("/items", {
    method: "POST",
    body: formData
  });

  document.getElementById("name").value = "";
  document.getElementById("description").value = "";
  document.getElementById("image").value = "";

  loadItems(category);
}

// Load items
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
        <small>${item.description || "No description"}</small><br>
        ${item.image ? `<img src="${item.image}" width="80">` : ""}<br>

        <span style="color:${item.status === "available" ? "green" : "red"}">
          ${item.status}
        </span>
      </div>

      <div>
        <button onclick="editItem(${item.id}, '${item.name}', '${item.description}', '${item.category}')">
          Edit
        </button>

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

// Edit item
async function editItem(id, name, description, category) {
  const newName = prompt("Edit name", name);
  const newDesc = prompt("Edit description", description);

  if (!newName) return;

  await fetch(`/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: newName,
      description: newDesc,
      category
    })
  });

  loadItems(category);
}

// Toggle status
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

// Delete item
async function deleteItem(id) {
  await fetch(`/items/${id}`, {
    method: "DELETE"
  });

  loadItems();
}

// Initial load
loadItems();