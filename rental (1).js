// Rental services
const rentalItems = [
  { name: "Hourly Rental", description: "Rent a JCB machine on an hourly basis." },
  { name: "Daily Rental", description: "Affordable daily rental packages." },
  { name: "Weekly Rental", description: "Best value weekly rental for large projects." },
  { name: "monthly rental", description: " cheap value monthly rental for very large project." }
];

// Render cards dynamically
function renderRentalCards() {
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "";
  rentalItems.forEach(service => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <h3>${service.name}</h3>
      <p>${service.description}</p>
      <button class="btn" onclick="openOrderForm('${service.name}')">Place Order</button>
    `;
    container.appendChild(card);
  });
}

function openOrderForm(serviceName) {
  document.getElementById("orderForm").style.display = "block";
  document.getElementById("item").value = serviceName;
  document.getElementById("formTitle").innerText = "Place Order - " + serviceName;
}

function closeOrderForm() {
  document.getElementById("orderForm").style.display = "none";
}

window.onload = renderRentalCards;