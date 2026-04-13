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
  const payment = Number(urlParams.get("payment")) || 0;

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

  const items = Array.isArray(data.items) ? data.items : [];

  items.forEach((i, index) => {
    const total = (i.quantity || 0) * (i.rate || 0);

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

  document.getElementById("tableBody").innerHTML = rowsHTML;

  // =====================
  // PAYMENT RECEIPT LOGIC
  // =====================
  if (payment > 0) {

    document.getElementById("title").innerText = "Payment Receipt";

    fetch(`${API}/payments/${data.id}`)
      .then(res => res.json())
      .then(payments => {

        let cumulativePaid = 0;
        let installmentNumber = 0;
        let paymentMethod = "Cash";

        payments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        payments.forEach((p, index) => {
          cumulativePaid += Number(p.amount);

          if (Number(p.amount) === payment && installmentNumber === 0) {
            installmentNumber = index + 1;
            paymentMethod = p.method || "Cash";
          }
        });

        const remaining = data.total - cumulativePaid;

        document.getElementById("total").innerText = data.total;
        document.getElementById("paid").innerText = payment;
        document.getElementById("remaining").innerText = remaining;

        const extra = document.createElement("p");
        extra.innerHTML = `
          <b>Installment:</b> ${installmentNumber}<br>
          <b>Bill No:</b> ${data.bill_no || "#" + data.id}<br>
          <b>Payment Method:</b> ${paymentMethod}
        `;

        document.querySelector(".summary .box").appendChild(extra);
      });

  } else {
    // =====================
    // NORMAL INVOICE
    // =====================
    document.getElementById("title").innerText = "Invoice";

    document.getElementById("total").innerText = data.total;
    document.getElementById("paid").innerText = data.paid;
    document.getElementById("remaining").innerText = data.remaining;
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