const API = window.location.origin;

// =====================
// LOAD INVOICE
// =====================
async function loadInvoice() {
  const params = new URLSearchParams(window.location.search);
  const billId = params.get("bill_id");

  // 🔥 CASE 1: LOAD FROM DATABASE
  if (billId) {
    try {
      const res = await fetch(`${API}/bills/${billId}`);
      const data = await res.json();

      renderInvoice(data);

    } catch (err) {
      alert("❌ Failed to load invoice");
    }
  }

  // 🔥 CASE 2: LOAD FROM URL (fallback)
  else {
    renderFromParams(params);
  }
}

// =====================
// RENDER FROM DB
// =====================
function renderInvoice(data) {

  const urlParams = new URLSearchParams(window.location.search);
  const paymentIndexParam = urlParams.get("paymentIndex");
const paymentIndex = paymentIndexParam !== null ? Number(paymentIndexParam) : null;

// =====================
// LOAD SIGNATURE FROM SERVER
// =====================
fetch(`${API}/signature`)
  .then(res => res.json())
  .then(data => {
    if (data.signature) {
      const img = document.getElementById("signatureImg");
      img.src = data.signature;
      img.style.display = "block";
    }
  });

  // =====================
  // BASIC DETAILS
  // =====================
  document.getElementById("custName").innerText = data.customer_name || "-";
  document.getElementById("custPhone").innerText = data.phone || "-";
  document.getElementById("billNo").innerText = "#" + data.id;

  document.getElementById("billDate").innerText =
    data.bill_date
      ? new Date(data.bill_date).toLocaleString()
      : "-";

  // =====================
  // ITEMS TABLE
  // =====================
  let rowsHTML = "";

  let items = [];

if (Array.isArray(data.items)) {
  items = data.items;
} else if (typeof data.items === "string") {
  try {
    items = JSON.parse(data.items);
  } catch {
    items = [];
  }
}

  items.forEach((i, index) => {

  const qty = Number(i.quantity) || 0;
  const rate = Number(i.rate) || 0;
  const total = qty * rate;

  rowsHTML += `
    <tr>
      <td>${index + 1}</td>
      <td>${i.name || "-"}</td>
      <td>${qty}</td>
      <td>${i.unit || "-"}</td>
      <td>${rate}</td>
      <td>${total}</td>
    </tr>
  `;
});

  document.getElementById("tableBody").innerHTML = rowsHTML;

  // =====================
  // PAYMENT RECEIPT LOGIC
  // =====================
  if (paymentIndex !== null) {

  document.getElementById("title").innerText = "Payment Receipt";

  fetch(`${API}/payments/${data.id}`)
    .then(res => res.json())
    .then(payments => {

      payments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      let paidSoFar = 0;

      payments.forEach((p, i) => {
        if (i <= paymentIndex) {
          paidSoFar += Number(p.amount);
        }
      });

      const currentPayment = payments[paymentIndex];

      const due = data.total - paidSoFar;

      document.getElementById("total").innerText = Number(data.total) || 0;
      document.getElementById("paid").innerText = Number(currentPayment.amount) || 0;
      document.getElementById("remaining").innerText = Number(due) || 0;

      const extra = document.createElement("p");
      extra.innerHTML = `
        <b>Installment:</b> ${paymentIndex + 1}<br>
        <b>Bill No:</b> ${data.bill_no || "#" + data.id}<br>
        <b>Payment Method:</b> ${currentPayment.method || "Cash"}
      `;

      document.querySelector(".summary-box").appendChild(extra);
    });

  } else {
    // =====================
    // NORMAL INVOICE
    // =====================
    document.getElementById("title").innerText = "Invoice";

    document.getElementById("total").innerText = Number(data.total) || 0;
    document.getElementById("paid").innerText = Number(data.paid) || 0;
    document.getElementById("remaining").innerText = Number(data.remaining) || 0;
  }
}

// =====================
// FALLBACK (OLD METHOD)
// =====================
function renderFromParams(params) {

  document.getElementById("custName").innerText = params.get("name");
  document.getElementById("custPhone").innerText = params.get("phone");
  document.getElementById("billNo").innerText = params.get("bill_no");

  document.getElementById("billDate").innerText =
    new Date().toLocaleString();

  let rowsHTML = "";

  const itemsParam = params.get("items");

  if (itemsParam) {
    const items = JSON.parse(decodeURIComponent(itemsParam));

    items.forEach((i, index) => {
      const total = i.quantity * i.rate;

      rowsHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${i.name}</td>
          <td>${i.quantity}</td>
          <td>${i.rate}</td>
          <td>${total}</td>
        </tr>
      `;
    });
  }

  document.getElementById("tableBody").innerHTML = rowsHTML;

  document.getElementById("total").innerText = params.get("total");
  document.getElementById("paid").innerText = params.get("paid");
  document.getElementById("remaining").innerText = params.get("remaining");
}

// =====================
// PRINT
// =====================
function printInvoice() {
  window.print();
}

// INIT
loadInvoice();