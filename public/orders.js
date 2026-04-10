async function loadOrders() {
  try {
    const res = await fetch("/orders");

    // 🔥 Handle server error properly
    if (!res.ok) {
      let errText = await res.text(); // safer than res.json()
      console.error("Server Error:", errText);
      alert("Error loading orders");
      return;
    }

    const data = await res.json();

    const container = document.getElementById("ordersContainer");
    container.innerHTML = "";

    data.forEach(order => {
      const card = document.createElement("div");
      card.className = "order-card";

      // ✅ FIXED (use card instead of div)
      card.innerHTML = `
        <h3>${order.item_name || "Item"}</h3>
        <p><b>Name:</b> ${order.customer_name || "-"}</p>
        <p><b>Phone:</b> ${order.phone || "-"}</p>
        <p><b>Qty:</b> ${order.quantity || 0} ${order.unit || ""}</p>
        <p><b>Address:</b> ${order.delivery_address || "-"}</p>

        <p>
          <b>Status:</b> 
          <select onchange="updateStatus(${order.id}, this.value)">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </p>

        <button onclick="deleteOrder(${order.id})">Delete</button>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Fetch error:", err);
    alert("Something went wrong while loading orders");
  }
}

loadOrders();

// ✅ UPDATE STATUS
async function updateStatus(id, status) {
  try {
    const res = await fetch(`/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      alert("Failed to update status");
      return;
    }

    alert("✅ Status updated");

  } catch (err) {
    console.error(err);
  }
}

// ✅ DELETE ORDER
async function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;

  try {
    const res = await fetch(`/orders/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    alert("🗑️ Order deleted");
    loadOrders(); // reload list

  } catch (err) {
    console.error(err);
  }
}