const API = window.location.origin;
let allBills = [];

// =====================
// ADD ROW
// =====================
async function addRow() {
  const res = await fetch(`${API}/items`);
  const data = await res.json();

  const row = document.createElement("tr");

  row.innerHTML = `
  <td>
    <select>${options}</select>
  </td>

  <td>
    <input type="number" oninput="calculateTotal(this)">
  </td>

  <!-- ✅ ADD UNIT FIELD -->
  <td>
    <input type="text" class="unit" placeholder="Unit">
  </td>

  <td>
    <input type="number" oninput="calculateTotal(this)">
  </td>

  <td class="total">0</td>

  <td>
    <button onclick="this.closest('tr').remove()">❌</button>
  </td>
`;

  document.getElementById("itemsTable").appendChild(row);
}

// =====================
// AUTO SET RATE
// =====================
function setRate(select) {
  const row = select.closest("tr");
  row.children[2].children[0].value = select.value;
  calcRow(select);
}

// =====================
// CALCULATE ROW
// =====================
function calcRow(el) {
  const row = el.closest("tr");

  const qty = row.children[1].children[0].value || 0;
  const rate = row.children[2].children[0].value || 0;

  row.querySelector(".rowTotal").innerText = qty * rate;

  calcTotal();
}

// =====================
// TOTAL CALCULATION
// =====================
function calcTotal() {
  let total = 0;

  document.querySelectorAll(".rowTotal").forEach(el => {
    total += Number(el.innerText);
  });

  document.getElementById("total").innerText = total;
}

// =====================
// REMOVE ROW
// =====================
function removeRow(btn) {
  btn.closest("tr").remove();
  calcTotal();
}

// =====================
// CREATE BILL (FINAL FIXED)
// =====================
async function createBill() {
  const phone = document.getElementById("phone").value;
  const paid = document.getElementById("paid").value || 0;

  // ✅ NEW LINE (GET METHOD)
  const method = document.getElementById("paymentMethod").value;

  const rows = document.querySelectorAll("#itemsTable tr");

  if (!phone || rows.length === 0) {
    alert("Enter phone and add items");
    return;
  }

  let items = [];

  rows.forEach(row => {
const name = row.querySelector("select").selectedOptions[0].text;
const qty = row.children[1].children[0].value;
const unit = row.children[2].children[0].value;   // ✅ NEW
const rate = row.children[3].children[0].value;

    if (!qty || !rate) return;

    items.push({
  name,
  quantity: Number(qty),
  unit: unit,          // ✅ ADD THIS
  rate: Number(rate)
});
  });

  if (items.length === 0) {
    alert("Add valid items");
    return;
  }

  try {
    const res = await fetch(`${API}/bill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        items,
        paid: Number(paid),
        method   // ✅ NEW (SEND METHOD)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("✅ Bill Generated");

    document.getElementById("itemsTable").innerHTML = "";
    document.getElementById("total").innerText = "0";
    document.getElementById("paid").value = "";
    document.getElementById("phone").value = "";

    loadAllBills();

  } catch (err) {
    alert("❌ Network error");
  }
}


// =====================
// LOAD ALL BILLS
// =====================
async function loadAllBills() {
  try {
    const p = await fetch(`${API}/bills/pending`).then(r => r.json());
    const c = await fetch(`${API}/bills/completed`).then(r => r.json());

    allBills = [...p, ...c];

    renderBills();
  } catch (err) {
    console.error("Load error:", err);
  }
}

// =====================
// RENDER BILLS (FINAL WITH PAYMENT METHOD)
// =====================
function renderBills() {
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const status = document.getElementById("statusFilter")?.value || "all";
  const date = document.getElementById("dateFilter")?.value || "";

  const pendingDiv = document.getElementById("pendingList");
  const completedDiv = document.getElementById("completedList");

  pendingDiv.innerHTML = "";
  completedDiv.innerHTML = "";

  allBills.forEach(b => {

    const billStatus = (b.status || "").trim().toLowerCase();

    const matchSearch =
      (b.customer_name || "").toLowerCase().includes(search) ||
      (b.phone || "").includes(search);

    const matchStatus =
      status === "all" || billStatus === status;

    const matchDate =
      !date || new Date(b.created_at).toISOString().slice(0, 10) === date;

    if (!matchSearch || !matchStatus || !matchDate) return;

    const card = `
      <div class="card ${billStatus}">
        <h3>${b.customer_name || "Customer"}</h3>
        <p><b>Phone:</b> ${b.phone}</p>
        <p><b>Total:</b> ₹${b.total}</p>
        <p><b>Paid:</b> ₹${b.paid}</p>

        <!-- ACTION BUTTONS -->
        <div class="actions">
          <button onclick="viewInvoice(${b.id})">🧾 View</button>
          <button onclick="viewHistory('${b.phone}')">📜 History</button>
          <button onclick="openLedger('${b.phone}')">📊 Ledger</button>
          <button onclick="deleteBill(${b.id})" class="delete">🗑 Delete</button>
        </div>

        ${
          billStatus === "pending"
            ? `
          <p><b>Due:</b> ₹${b.total - b.paid}</p>

          <input type="number" id="pay_${b.id}" placeholder="Enter amount">

          <!-- 🔥 NEW PAYMENT METHOD DROPDOWN -->
          <select id="method_${b.id}" style="margin-top:6px;">
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank">Bank</option>
            <option value="Card">Card</option>
          </select>

          <button onclick="payNow(${b.id})">💵 Pay</button>
        `
            : `<p style="color:lightgreen;">✅ Completed</p>`
        }
      </div>
    `;

    if (billStatus === "pending") {
      pendingDiv.innerHTML += card;
    } else {
      completedDiv.innerHTML += card;
    }
  });
}

// =====================
// APPLY FILTERS
// =====================
function applyFilters() {
  renderBills();
}

// =====================
// PAY FUNCTION (WITH METHOD)
// =====================
async function payNow(id) {
  const amount = document.getElementById(`pay_${id}`).value;

  // 🔥 NEW (GET METHOD)
  const method = document.getElementById(`method_${id}`)?.value || "Cash";

  if (!amount) return alert("Enter amount");

  try {
    const res = await fetch(`${API}/bills/${id}/pay`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        amount: Number(amount),
        method   // ✅ NEW
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Payment updated");
      loadAllBills();
    } else {
      alert(data.error);
    }

  } catch (err) {
    alert("❌ Network error");
  }
}

// =====================
// DELETE BILL
// =====================
async function deleteBill(id) {
  if (!confirm("Delete this invoice?")) return;

  await fetch(`${API}/bills/${id}`, {
    method: "DELETE"
  });

  alert("🗑 Invoice deleted");
  loadAllBills();
}

// =====================
// VIEW HISTORY (INSTALLMENTS + METHOD)
// =====================
async function viewHistory(phone) {
  try {
    const res = await fetch(`${API}/bills/customer/${phone}`);
    const bills = await res.json();

    let html = `<h3>Payment History</h3>`;

    for (let b of bills) {

      const payRes = await fetch(`${API}/payments/${b.id}`);
      let payments = await payRes.json();

      // 🔥 SORT (IMPORTANT)
      payments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      html += `
        <div class="history-card">
          <p><b>Invoice:</b> ${b.id}</p>
          <p>Total: ₹${b.total}</p>
          <p><b>Payments:</b></p>
      `;

      if (payments.length === 0) {
        html += `<p>No payments yet</p>`;
      }

      payments.forEach((p, i) => {

        const order =
          i === 0 ? "1st" :
          i === 1 ? "2nd" :
          i === 2 ? "3rd" :
          (i + 1) + "th";

        html += `
          <p>
            ${order} Payment → ₹${p.amount} 
            (${p.method || "Cash"}) → 
            ${new Date(p.created_at).toLocaleString()}
          </p>
        `;
      });

      html += `
          <p><b>Total Paid:</b> ₹${b.paid}</p>
          <p><b>Due:</b> ₹${b.total - b.paid}</p>
        </div>
      `;
    }

    document.getElementById("historyModalContent").innerHTML = html;
    document.getElementById("historyModal").style.display = "flex";

  } catch (err) {
    alert("Error loading history");
  }
}

// =====================
// VIEW INVOICE (🔥 FINAL)
// =====================
function viewInvoice(id) {
  window.open(`/invoice.html?bill_id=${id}`, "_blank");
}

// ✅ UPDATED (payment_id instead of amount)
function viewPaymentInvoice(billId, index) {
  window.open(`/invoice.html?bill_id=${billId}&paymentIndex=${index}`, "_blank");
}



// =====================
// OPEN LEDGER (WITH METHOD + ORDER)
// =====================
async function openLedger(phone) {
  try {
    const res = await fetch(`${API}/ledger/${phone}`);
    const data = await res.json();

    let html = `
      <h2>Customer Ledger</h2>
      <p><b>Total Purchase:</b> ₹${data.totalPurchase}</p>
      <p><b>Total Paid:</b> ₹${data.totalPaid}</p>
      <p><b>Due:</b> ₹${data.remaining}</p>
      <hr>
    `;

    let grouped = {};

    data.ledger.forEach(l => {
      if (!grouped[l.bill_id]) {
        grouped[l.bill_id] = [];
      }
      grouped[l.bill_id].push(l);
    });

    Object.keys(grouped).forEach(billId => {

      let entries = grouped[billId];

      entries.forEach(l => {

        if (l.type === "bill") {
          html += `
            <div class="ledger-row">
              🧾 Bill #${l.bill_id} → ₹${l.amount}

              <button onclick="viewInvoice(${l.bill_id})">
                View Bill
              </button>
            </div>
          `;
        }

      });

      let payments = entries.filter(e => e.type === "payment");

      payments.forEach((l, index) => {

        const order =
          index === 0 ? "1st" :
          index === 1 ? "2nd" :
          index === 2 ? "3rd" :
          (index + 1) + "th";

        html += `
          <div class="ledger-row">
            💵 ${order} Payment (${l.method || "Cash"}) → ₹${l.amount}

            <button onclick="viewPaymentInvoice(${l.bill_id}, ${index})">
              View Receipt
            </button>
          </div>
        `;
      });

    });

    document.getElementById("historyModalContent").innerHTML = html;
    document.getElementById("historyModal").style.display = "flex";

  } catch (err) {
    alert("Ledger load error");
  }
}

// =====================
// CLOSE HISTORY / LEDGER
// =====================
function closeHistory() {
  document.getElementById("historyModal").style.display = "none";
}

// =====================
// INITIAL LOAD
// =====================
loadAllBills();