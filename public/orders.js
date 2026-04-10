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

      card.innerHTML = `
        <h3>${order.item_name}</h3>
        <p><b>Name:</b> ${order.customer_name}</p>
        <p><b>Phone:</b> ${order.phone}</p>
        <p><b>Quantity:</b> ${order.quantity} ${order.unit}</p>
        <p><b>Delivery:</b> ${order.delivery_address}</p>
        <p><b>Date:</b> ${new Date(order.order_date).toLocaleString()}</p>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

loadOrders();