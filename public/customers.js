async function loadCustomers() {
  try {
    const res = await fetch("/customers"); // calls backend API
    const customers = await res.json();

    const container = document.getElementById("customerList");
    container.innerHTML = "";

    if (customers.length === 0) {
      container.innerHTML = "<p>No customers registered yet.</p>";
      return;
    }

    customers.forEach(c => {
      const div = document.createElement("div");
      div.className = "customer-card";
      div.innerHTML = `
        <h3>${c.name}</h3>
        <p>Email: ${c.email}</p>
        <p>Phone: ${c.phone}</p>
        <p>Address: ${c.address || "N/A"}</p>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading customers:", err);
    document.getElementById("customerList").innerHTML =
      "<p>Error loading customer data.</p>";
  }
}

// Load customers on page load
loadCustomers();