async function loadOrders() {
  try {
    const res = await fetch("/orders");

    if (!res.ok) {
      const err = await res.json();
      console.error("Server Error:", err);
      alert("Error loading orders");
      return;
    }

    const data = await res.json();

    const container = document.getElementById("ordersContainer");
    container.innerHTML = "";

    data.forEach(order => {
      const card = document.createElement("div");
      card.className = "order-card";

      div.innerHTML = `
  <h3>${order.item_name}</h3>
  <p><b>Name:</b> ${order.customer_name}</p>
  <p><b>Phone:</b> ${order.phone}</p>
  <p><b>Qty:</b> ${order.quantity} ${order.unit}</p>
  <p><b>Address:</b> ${order.delivery_address}</p>

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
  }
}

loadOrders();

// UPDATE STATUS
async function updateStatus(id, status) {
  await fetch(`/orders/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  alert("Status updated");
}

// DELETE ORDER
async function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;

  await fetch(`/orders/${id}`, {
    method: "DELETE"
  });

  alert("Order deleted");
  loadOrders(); // reload list
}