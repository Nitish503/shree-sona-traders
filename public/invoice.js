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

  document.getElementById("custName").innerText = data.customer_name;
  document.getElementById("custPhone").innerText = data.phone;
  document.getElementById("billNo").innerText = data.bill_no;
  document.getElementById("billDate").innerText =
    new Date(data.created_at).toLocaleString();

  let rowsHTML = "";

  data.items.forEach((i, index) => {
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

  document.getElementById("tableBody").innerHTML = rowsHTML;

  document.getElementById("total").innerText = data.total;
  document.getElementById("paid").innerText = data.paid;
  document.getElementById("remaining").innerText = data.remaining;
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