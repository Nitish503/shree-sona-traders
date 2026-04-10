const API = window.location.origin;

async function loadOrders() {
  const res = await fetch(`${API}/orders`);
  const orders = await res.json();

  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";

  orders.forEach(order => {
    const div = document.createElement("div");
    div.className = "order-card";

    const date = new Date(order.created_at).toLocaleString();

    div.innerHTML = `
      <h3>${order.item_name}</h3>
      <p><b>Customer:</b> ${order.customer_name}</p>
      <p><b>Phone:</b> ${order.phone}</p>
      <p><b>Address:</b> ${order.address}</p>
      <p><b>Date:</b> ${date}</p>
    `;

    container.appendChild(div);
  });
}

loadOrders();