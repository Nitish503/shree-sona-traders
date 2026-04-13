
const urlParams = new URLSearchParams(window.location.search);
const payment = urlParams.get("payment");
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
// RENDER FROM DB (FINAL FIXED)
// =====================
function renderInvoice(data) {

  const API = window.location.origin;

  // 🔥 GET URL PARAM
  const urlParams = new URLSearchParams(window.location.search);
  const payment = Number(urlParams.get("payment")) || 0;

  // =====================
  // BASIC DETAILS
  // =====================
  document.getElementById("custName").innerText = data.customer_name || "-";
  document.getElementById("custPhone").innerText = data.phone || "-";
  document.getElementById("billNo").innerText = data.bill_no || "-";

  document.getElementById("billDate").innerText =
    data.bill_date
      ? new Date(data.bill_date).toLocaleString()
      : "-";

  // =====================
  // ITEMS TABLE
  // =====================
  let rowsHTML = "";

  data.items.forEach((i, index) => {
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
  // PAYMENT RECEIPT LOGIC (🔥 MAIN FIX)
  // =====================

  if (payment > 0) {

    document.getElementById("title").innerText = "Payment Receipt";

    // 🔥 FETCH ALL PAYMENTS OF THIS BILL
    fetch(`${API}/payments/${data.id}`)
      .then(res => res.json())
      .then(payments => {

        let cumulativePaid = 0;
        let installmentNumber = 0;

        // 🔥 SORT BY DATE
        payments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        payments.forEach((p, index) => {
          cumulativePaid += Number(p.amount);

          // 🔥 MATCH CURRENT PAYMENT
          if (Number(p.amount) === payment && installmentNumber === 0) {
            installmentNumber = index + 1;
          }
        });

        const remaining = data.total - cumulativePaid;

        // ✅ CORRECT VALUES
        document.getElementById("total").innerText = data.total;
        document.getElementById("paid").innerText = payment;
        document.getElementById("remaining").innerText = remaining;

        // 🔥 ADD EXTRA INFO (Installment + Bill)
        const extra = document.createElement("p");
        extra.innerHTML = `
          <b>Installment:</b> ${installmentNumber}<br>
          <b>Bill No:</b> ${data.bill_no}
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

  const itemsParam = params.get("items");

  let rowsHTML = "";

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