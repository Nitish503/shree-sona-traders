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
      <select onchange="setRate(this)">
        <option value="">Select Item</option>
        ${data.map(i => `<option value="${i.rate}">${i.name}</option>`).join("")}
      </select>
    </td>
    <td><input type="number" min="1" oninput="calcRow(this)"></td>
    <td><input type="number" value="0" oninput="calcRow(this)"></td>
    <td class="rowTotal">0</td>
    <td><button onclick="removeRow(this)">X</button></td>
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
// CREATE BILL
// =====================
async function createBill() {
  const phone = document.getElementById("phone").value;
  const paid = document.getElementById("paid").value || 0;

  const rows = document.querySelectorAll("#itemsTable tr");

  if (!phone || rows.length === 0) {
    alert("Enter phone and add items");
    return;
  }

  let items = [];

  rows.forEach(row => {
    const name = row.querySelector("select").selectedOptions[0].text;
    const qty = row.children[1].children[0].value;
    const rate = row.children[2].children[0].value;

    if (!qty || !rate) return;

    items.push({
      name,
      quantity: Number(qty),
      rate: Number(rate)
    });
  });

  if (items.length === 0) {
    alert("Add valid items");
    return;
  }

  const res = await fetch(`${API}/bill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, items, paid: Number(paid) })
  });

  const data = await res.json();

  if (res.ok) {
    alert("✅ Bill Generated");

    document.getElementById("itemsTable").innerHTML = "";
    document.getElementById("total").innerText = "0";

    loadAllBills();
  } else {
    alert(data.error);
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
// RENDER BILLS
// =====================
function renderBills() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const date = document.getElementById("dateFilter").value;

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
        <h3>${b.customer_name}</h3>
        <p>Phone: ${b.phone}</p>
        <p>Total: ₹${b.total}</p>
        <p>Paid: ₹${b.paid}</p>

        ${billStatus === "pending" ? `
          <p>Remaining: ₹${b.total - b.paid}</p>
          <input type="number" id="pay_${b.id}" placeholder="Pay amount">
          <button onclick="payNow(${b.id})">Pay</button>
        ` : `<p class="completed-text">✅ Completed</p>`}

        <!-- 🔥 NEW BUTTONS -->
        <div class="actions">
          <button onclick="viewInvoice(${b.id})">View</button>
          <button onclick="deleteBill(${b.id})" class="delete">Delete</button>
        </div>
      </div>
    `;

    if (billStatus === "pending") {
      pendingDiv.innerHTML += card;
    } else if (billStatus === "completed") {
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
// PAY FUNCTION
// =====================
async function payNow(id) {
  const amount = document.getElementById(`pay_${id}`).value;

  if (!amount) return alert("Enter amount");

  try {
    const res = await fetch(`${API}/bills/${id}/pay`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) })
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
// VIEW INVOICE (🔥 FINAL)
// =====================
function viewInvoice(id) {
  window.open(`/invoice.html?bill_id=${id}`, "_blank");
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
// INITIAL LOAD
// =====================
loadAllBills();