require("dotenv").config(); // 🔥 ENV support
const bcrypt = require("bcryptjs");

const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const multer = require("multer");
const crypto = require("crypto");

// 🔥 Cloudinary
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
// 🔥 CAPTCHA STORE
let captchaStore = {};

app.use(cors());
app.use(express.json());

// =====================
// ADMIN LOGIN
// =====================
app.post("/admin/login", (req, res) => {
  const { phone, pin } = req.body;

  const allowedNumbers = (process.env.ADMIN_NUMBERS || "")
    .split(",")
    .map(n => n.trim());

  if (!allowedNumbers.includes(phone)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized number"
    });
  }

  if (pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({
      success: false,
      message: "Invalid PIN"
    });
  }

  res.json({
    success: true,
    message: "Admin login successful"
  });
});

// =====================
// ADMIN ACCESS CHECK
// =====================
app.get("/check-admin", (req, res) => {
  const phone = req.query.phone;

  const adminNumbers = (process.env.ADMIN_NUMBERS || "")
    .split(",")
    .map(n => n.trim())
    .filter(Boolean);

  if (adminNumbers.includes(phone)) {
    return res.json({ authorized: true });
  }

  res.json({ authorized: false });
});

// --------------------
// DB CONNECTION
// --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --------------------
// 🔥 CLOUDINARY CONFIG (SECURE)
// --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔥 Extract public_id from Cloudinary URL
function getPublicId(url) {
  if (!url) return null;

  const parts = url.split("/");
  const file = parts.slice(-2).join("/"); // sona-trader/abc123.jpg

  return file.split(".")[0]; // sona-trader/abc123
}

// --------------------
// 🔥 CLOUDINARY STORAGE
// --------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sona-trader",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

const upload = multer({ storage });

// --------------------
// INIT DATABASE
// --------------------
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'available',
        image TEXT
      );
    `);

    console.log("✅ DB Ready");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
  }
}
initDB();

// --------------------
// CAPTCHA FUNCTION
// --------------------
function generateCaptcha() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// --------------------
// STATIC FILES
// --------------------
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// ROUTES
// --------------------
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.get("/stock", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "stock.html"))
);

// GET CAPTCHA
app.get("/captcha", (req, res) => {
  const captcha = generateCaptcha();
  const id = Date.now().toString();

  captchaStore[id] = captcha;

  res.json({ captcha, id });
});

// --------------------
// ITEMS API
// --------------------

// GET items by category
app.get("/items/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const result = await pool.query(
      "SELECT * FROM items WHERE LOWER(category)=LOWER($1) ORDER BY id DESC",
      [category]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).send(err.message);
  }
});

// GET all items (for rate management)
app.get("/items", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM items ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch All Error:", err.message);
    res.status(500).send(err.message);
  }
});

// ADD item (🔥 Cloudinary image)
app.post("/items", upload.single("image"), async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name || !category) {
      return res.status(400).send("Name and category required");
    }

    const image = req.file ? req.file.path : null;

    console.log("Uploaded file:", req.file); // debug

    const result = await pool.query(
      `INSERT INTO items (name, description, category, status, image)
       VALUES ($1,$2,LOWER($3),'available',$4) RETURNING *`,
      [name, description || null, category, image]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Insert Error:", err.message);
    res.status(500).send(err.message);
  }
});

// UPDATE item
app.put("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    const result = await pool.query(
      `UPDATE items 
       SET name=$1, description=$2, category=LOWER($3)
       WHERE id=$4 RETURNING *`,
      [name, description, category, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Update Error:", err.message);
    res.status(500).send(err.message);
  }
});

// UPDATE STATUS
app.put("/items/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE items SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Status Error:", err.message);
    res.status(500).send(err.message);
  }
});

// UPDATE rate
app.put("/items/:id/rate", async (req, res) => {
  try {
    const { id } = req.params;
    const { rate } = req.body;

    const result = await pool.query(
      "UPDATE items SET rate=$1 WHERE id=$2 RETURNING *",
      [rate, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Rate Update Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Get image URL from DB
    const item = await pool.query(
      "SELECT image FROM items WHERE id=$1",
      [id]
    );

    const imageUrl = item.rows[0]?.image;

    // 🔥 Delete image from Cloudinary
    if (imageUrl) {
      const publicId = getPublicId(imageUrl);

      await cloudinary.uploader.destroy(publicId);
      console.log("🗑 Deleted from Cloudinary:", publicId);
    }

    // 🔹 Delete item from DB
    await pool.query("DELETE FROM items WHERE id=$1", [id]);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).send(err.message);
  }
});

// UPDATE ORDER STATUS
app.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE orders SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("❌ Status Update Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE ORDER
app.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM orders WHERE id=$1", [id]);

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// REGISTER CUSTOMER
// --------------------
app.post("/register", async (req, res) => {
  try {
    const { name, phone, password, captcha, captchaId } = req.body;

    // ✅ VALIDATION
    if (!name || !phone || !password || !captcha || !captchaId) {
      return res.status(400).json({ error: "All fields required" });
    }

    // 🔐 CAPTCHA CHECK
    if (
      !captchaStore[captchaId] ||
      captchaStore[captchaId].toString().trim() !== captcha.toString().trim()
    ) {
      return res.status(400).json({ error: "Invalid captcha" });
    }

    // 🧹 DELETE CAPTCHA AFTER USE
    delete captchaStore[captchaId];

    // 🔍 CHECK IF CUSTOMER EXISTS
    const existing = await pool.query(
      "SELECT * FROM customers WHERE phone=$1",
      [phone]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: "already_registered"
      });
    }

    // 🔐 HASH CUSTOMER PASSWORD
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ INSERT NEW CUSTOMER
const result = await pool.query(
  "INSERT INTO customers (name, phone, password) VALUES ($1,$2,$3) RETURNING id, name, phone",
  [name, phone, hashedPassword]
);

    res.status(200).json({
      message: "registered",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// CREATE ORDER API
// --------------------
app.post("/order", async (req, res) => {
  try {
    const {
      item_id,
      phone,
      permanent_address,
      delivery_address,
      quantity,
      unit
    } = req.body;

    // 🔍 1. CHECK CUSTOMER EXISTS
    const customer = await pool.query(
      "SELECT * FROM customers WHERE phone=$1",
      [phone]
    );

    if (customer.rows.length === 0) {
      return res.status(400).json({
        error: "❌ You are not registered. Please register first."
      });
    }

    const customerData = customer.rows[0];

    // 🔍 2. CHECK ITEM STOCK
    const item = await pool.query(
      "SELECT * FROM items WHERE id=$1",
      [item_id]
    );

    if (item.rows.length === 0) {
      return res.status(400).json({ error: "Item not found" });
    }

    if (item.rows[0].status !== "available") {
      return res.status(400).json({
        error: "❌ Item is out of stock"
      });
    }

    // ✅ INSERT ORDER
    const result = await pool.query(
      `INSERT INTO orders 
      (customer_id, item_id, quantity, unit, permanent_address, delivery_address)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        customerData.id,
        item_id,
        quantity,
        unit,
        permanent_address,
        delivery_address
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("❌ ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
// --------------------
// GET ALL ORDERS
// --------------------
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id,
        i.name AS item_name,
        c.name AS customer_name,
        c.phone,
        o.quantity,
        o.unit,
        o.permanent_address,
        o.delivery_address,
        o.status,
        o.order_date
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN items i ON o.item_id = i.id
      ORDER BY o.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Orders Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// CREATE BILL (FINAL WITH METHOD)
// --------------------
app.post("/bill", async (req, res) => {
  try {
    // ✅ ADD method
    const { phone, items, paid, method } = req.body;

    if (!phone || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required data" });
    }

    const customer = await pool.query(
      "SELECT * FROM customers WHERE phone=$1",
      [phone]
    );

    if (customer.rows.length === 0) {
      return res.status(400).json({
        error: "Customer not registered"
      });
    }

    const customerData = customer.rows[0];

    let total = 0;

    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      total += qty * rate;
    });

    const paidAmount = Number(paid) || 0;
    const remaining = total - paidAmount;

    const status = remaining > 0 ? "pending" : "completed";

    const billNo = "INV-" + Date.now();

    const result = await pool.query(
      `INSERT INTO bills
      (customer_id, customer_name, phone, items, total, paid, remaining, status, bill_no)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        customerData.id,
        customerData.name,
        phone,
        JSON.stringify(items),
        total,
        paidAmount,
        remaining,
        status,
        billNo
      ]
    );

    const newBill = result.rows[0];

    // 🔥 UPDATED HERE
    if (paidAmount > 0) {
      await pool.query(
        "INSERT INTO payments (bill_id, amount, method) VALUES ($1, $2, $3)",
        [newBill.id, paidAmount, method || "Cash"] // ✅ dynamic method
      );
    }

    res.json({
      message: "Bill created",
      bill_no: billNo,
      customer_name: customerData.name,
      phone,
      total,
      paid: paidAmount,
      remaining
    });

  } catch (err) {
    console.error("❌ BILL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// --------------------
// GET ALL BILLS
// --------------------
app.get("/bills", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bills ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET PENDING BILLS
// --------------------
app.get("/bills/pending", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bills WHERE status='pending' ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Pending Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET COMPLETED BILLS
// --------------------
app.get("/bills/completed", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM bills 
      WHERE TRIM(LOWER(status)) = 'completed'
      ORDER BY id DESC
    `);

    console.log("Completed Bills:", result.rows); // 🔥 debug

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Completed Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================
// GET PAYMENT HISTORY
// =====================
app.get("/payments/:bill_id", async (req, res) => {
  const { bill_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM payments WHERE bill_id = $1 ORDER BY created_at ASC",
      [bill_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching payments" });
  }
});

// =====================
// GET PAYMENTS BY BILL
// =====================
app.get("/payments/:bill_id", async (req, res) => {
  const { bill_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        id AS payment_id,   -- ✅ IMPORTANT FIX
        bill_id,
        amount,
        method,
        created_at
       FROM payments 
       WHERE bill_id=$1 
       ORDER BY created_at ASC`,
      [bill_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Payment Fetch Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// CUSTOMER HISTORY API
// =====================
app.get("/bills/customer/:phone", async (req, res) => {
  const { phone } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM bills WHERE phone = $1 ORDER BY id DESC",
      [phone]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// PAY / REBILL AMOUNT (FINAL WITH METHOD)
// --------------------
app.put("/bills/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method } = req.body;

    // 🔹 VALIDATION
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // 🔹 GET BILL
    const bill = await pool.query(
      "SELECT * FROM bills WHERE id=$1",
      [id]
    );

    if (bill.rows.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const current = bill.rows[0];

    const currentPaid = Number(current.paid) || 0;
    const total = Number(current.total) || 0;

    const newPaid = currentPaid + payAmount;
    const remaining = total - newPaid;

    const status = newPaid >= total ? "completed" : "pending";

    // 🔥 SAVE PAYMENT WITH METHOD
    await pool.query(
      "INSERT INTO payments (bill_id, amount, method) VALUES ($1, $2, $3)",
      [id, payAmount, method || "Cash"]
    );

    // 🔥 UPDATE BILL
    const updated = await pool.query(
      `UPDATE bills 
       SET paid=$1, remaining=$2, status=$3 
       WHERE id=$4 RETURNING *`,
      [newPaid, remaining, status, id]
    );

    res.json(updated.rows[0]);

  } catch (err) {
    console.error("❌ Payment Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET CUSTOMER INVOICES
// --------------------
app.get("/bills/customer/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    const result = await pool.query(
      `SELECT * FROM bills 
       WHERE phone=$1 
       ORDER BY id DESC`,
      [phone]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Fetch Customer Bills Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// DELETE BILL
// --------------------
app.delete("/bills/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM bills WHERE id=$1", [id]);

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ Delete Bill Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET SINGLE BILL (FINAL FIXED)
// --------------------
app.get("/bills/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM bills WHERE id=$1",
      [id]
    );

    // 🔥 SAFETY CHECK (NEW)
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const bill = result.rows[0];

    // 🔥 IMPORTANT FIX (items parsing)
    bill.items = typeof bill.items === "string"
      ? JSON.parse(bill.items)
      : bill.items;

    // 🔥 OPTIONAL SAFE DEFAULTS (no break)
    bill.total = Number(bill.total) || 0;
    bill.paid = Number(bill.paid) || 0;
    bill.remaining = Number(bill.remaining) || 0;

    res.json(bill);

  } catch (err) {
    console.error("❌ Fetch Bill Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================
// CUSTOMER LEDGER API (FINAL WITH METHOD)
// =====================
app.get("/ledger/:phone", async (req, res) => {
  const { phone } = req.params;

  try {
    const billsResult = await pool.query(
      `SELECT id, total, bill_date 
       FROM bills 
       WHERE phone=$1 
       ORDER BY id ASC`,
      [phone]
    );

    const bills = billsResult.rows;

    let ledger = [];
    let totalPurchase = 0;
    let totalPaid = 0;

    for (const bill of bills) {

      const billTotal = Number(bill.total) || 0;
      totalPurchase += billTotal;

      // 🧾 BILL ENTRY (UNCHANGED)
      ledger.push({
        type: "bill",
        bill_id: bill.id,
        amount: billTotal,
        date: bill.bill_date || new Date()
      });

      // 💵 PAYMENTS
      const payResult = await pool.query(
        `SELECT id AS payment_id, amount, created_at, method   -- ✅ ONLY CHANGE
         FROM payments 
         WHERE bill_id=$1 
         ORDER BY created_at ASC`,
        [bill.id]
      );

      for (const p of payResult.rows) {
        const amt = Number(p.amount) || 0;
        totalPaid += amt;

        ledger.push({
          type: "payment",
          bill_id: bill.id,
          payment_id: p.payment_id,   // ✅ ONLY ADD THIS LINE
          amount: amt,
          method: p.method || "Cash",
          date: p.created_at || new Date()
        });
      }
    }

    // 🔥 FINAL SORT (UNCHANGED)
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      ledger,
      totalPurchase,
      totalPaid,
      remaining: totalPurchase - totalPaid
    });

  } catch (err) {
    console.error("❌ LEDGER ERROR:", err.message);
    res.status(500).json({ error: "Ledger failed" });
  }
});

// =====================
// PAYMENT RECEIPT API (FINAL FIX)
// =====================
app.get("/payment-invoice/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;

    // 1. CURRENT PAYMENT
    const paymentRes = await pool.query(
      "SELECT * FROM payments WHERE id=$1",
      [paymentId]
    );

    const payment = paymentRes.rows[0];

    // 2. BILL
    const billRes = await pool.query(
      "SELECT * FROM bills WHERE id=$1",
      [payment.bill_id]
    );

    const bill = billRes.rows[0];

    // 3. ALL PAYMENTS OF THIS BILL
    const paymentsRes = await pool.query(
      "SELECT * FROM payments WHERE bill_id=$1 ORDER BY created_at ASC",
      [payment.bill_id]
    );

    const payments = paymentsRes.rows;

    // 4. FIND INDEX
    const index = payments.findIndex(p => p.id == paymentId);

    // 5. CUMULATIVE PAID
    let cumulativePaid = 0;
    for (let i = 0; i <= index; i++) {
      cumulativePaid += Number(payments[i].amount);
    }

    // 6. REMAINING
    const remaining = bill.total - cumulativePaid;

    // 7. INSTALLMENT
    const installment = index + 1;

    res.json({
      customer_name: bill.customer_name,
      phone: bill.phone,
      bill_no: bill.bill_no,
      total: bill.total,
      paid: payment.amount,
      remaining,
      installment,
      method: payment.method,
      date: payment.created_at,
      items: bill.items
    });

  } catch (err) {
    console.error("❌ Receipt Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// --------------------
// GET ALL CUSTOMERS
// --------------------
app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        phone
      FROM customers
      ORDER BY id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Customers Fetch Error FULL:", err); // 🔥 important
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// DELETE CUSTOMER
// --------------------
app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM customers WHERE id=$1", [id]);

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ Delete Customer Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================
// SAVE / REPLACE SIGNATURE
// =====================
app.post("/upload-signature", upload.single("image"), async (req, res) => {
  try {
    const imageUrl = req.file.path;

    // 🔍 GET OLD SIGNATURE
    const old = await pool.query(
      "SELECT signature FROM settings WHERE id=1"
    );

    const oldUrl = old.rows[0]?.signature;

    // 🔥 DELETE OLD IMAGE FROM CLOUDINARY
    if (oldUrl) {
      const publicId = getPublicId(oldUrl);
      await cloudinary.uploader.destroy(publicId);
      console.log("🗑 Old signature deleted:", publicId);
    }

    // 🔄 UPDATE OR INSERT
    if (old.rows.length > 0) {
      await pool.query(
        "UPDATE settings SET signature=$1 WHERE id=1",
        [imageUrl]
      );
    } else {
      await pool.query(
        "INSERT INTO settings (id, signature) VALUES (1, $1)",
        [imageUrl]
      );
    }

    res.json({ success: true, url: imageUrl });

  } catch (err) {
    console.error("❌ Signature Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =====================
// GET SIGNATURE
// =====================
app.get("/signature", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT signature FROM settings ORDER BY id DESC LIMIT 1"
    );

    res.json({ signature: result.rows[0]?.signature || null });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// SAVE COMPANY DETAILS
// =====================
app.post("/company", async (req, res) => {
  try {
    const { name, address, phone, gst, email, state } = req.body;

    const existing = await pool.query("SELECT * FROM company WHERE id=1");

    if (existing.rows.length > 0) {

      await pool.query(
        `UPDATE company 
         SET name=$1, address=$2, phone=$3, gst=$4, email=$5, state=$6 
         WHERE id=1`,
        [name, address, phone, gst, email, state]
      );

    } else {

      await pool.query(
        `INSERT INTO company 
         (id, name, address, phone, gst, email, state) 
         VALUES (1, $1, $2, $3, $4, $5, $6)`,
        [name, address, phone, gst, email, state]
      );

    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ COMPANY SAVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// =====================
// GET COMPANY DETAILS
// =====================
app.get("/company", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM company WHERE id=1");

    res.json(result.rows[0] || {});

  } catch (err) {
    console.error("❌ COMPANY FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// =====================
// UPLOAD COMPANY LOGO
// =====================
app.post("/upload-logo", upload.single("image"), async (req, res) => {
  try {
    const imageUrl = req.file.path;

    const existing = await pool.query("SELECT logo FROM company WHERE id=1");

    const oldUrl = existing.rows[0]?.logo;

    // 🔥 delete old logo from Cloudinary
    if (oldUrl) {
      const publicId = getPublicId(oldUrl);
      await cloudinary.uploader.destroy(publicId);
    }

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE company SET logo=$1 WHERE id=1",
        [imageUrl]
      );
    } else {
      await pool.query(
        "INSERT INTO company (id, logo) VALUES (1, $1)",
        [imageUrl]
      );
    }

    res.json({ success: true, url: imageUrl });

  } catch (err) {
    console.error("Logo upload error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =====================
// UPLOAD SLIDER IMAGE
// =====================
app.post("/upload-slider", upload.single("image"), async (req, res) => {
  try {

    const imageUrl = req.file.path;
    const position = Number(req.body.position);

    if (!position) {
      return res.status(400).json({
        success: false,
        message: "Slider position is required"
      });
    }

    // Find existing image at this position
    const existing = await pool.query(
      "SELECT id, image_url FROM slider_images WHERE position=$1",
      [position]
    );

    // Delete old image from Cloudinary
    if (existing.rows.length > 0) {

      const oldUrl = existing.rows[0].image_url;

      if (oldUrl) {
        const publicId = getPublicId(oldUrl);
        await cloudinary.uploader.destroy(publicId);
      }

      // Update existing slider image
      await pool.query(
        `UPDATE slider_images
         SET image_url=$1,
             updated_at=CURRENT_TIMESTAMP
         WHERE position=$2`,
        [imageUrl, position]
      );

    } else {

      // Add new slider image
      await pool.query(
        `INSERT INTO slider_images
         (image_url, position, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [imageUrl, position]
      );

    }

    res.json({
      success: true,
      url: imageUrl,
      position: position
    });

  } catch (err) {

    console.error("Slider upload error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});
// =====================
// CUSTOMER LOGIN
// =====================
app.post("/customer/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required"
      });
    }

    // Find customer by phone number
    const result = await pool.query(
      "SELECT id, name, phone, password FROM customers WHERE phone=$1",
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password"
      });
    }

    const customer = result.rows[0];
    // Check whether customer has a password
if (!customer.password) {
  return res.status(401).json({
    success: false,
    message: "Invalid phone number or password"
  });
}

    // Compare entered password with bcrypt password
    const passwordMatch = await bcrypt.compare(
      password,
      customer.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone
      }
    });

  } catch (err) {
    console.error("Customer Login Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// Admin sends a reply to a customer
app.post("/chat/admin-send", async (req, res) => {
  try {
    const { customerId, message } = req.body;

    if (!customerId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and message are required"
      });
    }

    // Make sure the customer exists
    const customer = await pool.query(
      "SELECT id FROM customers WHERE id=$1",
      [customerId]
    );

    if (customer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const result = await pool.query(
      `INSERT INTO chat_messages
       (customer_id, sender, message)
       VALUES ($1, 'admin', $2)
       RETURNING id, customer_id, sender, message, created_at`,
      [customerId, message.trim()]
    );

    res.json({
      success: true,
      message: result.rows[0]
    });

  } catch (err) {
    console.error("Admin Chat Send Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Delete chat message
app.delete("/chat/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required"
      });
    }

    const result = await pool.query(
      "DELETE FROM chat_messages WHERE id=$1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.json({
      success: true,
      message: "Message deleted successfully"
    });

  } catch (err) {
    console.error("Chat Delete Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// =========================
// NOTICE BOARD
// =========================

// Get current notice
app.get("/notice", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, message, is_enabled, updated_at
       FROM notice_board
       ORDER BY id DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        notice: null
      });
    }

    res.json({
      success: true,
      notice: result.rows[0]
    });

  } catch (err) {
    console.error("Notice Get Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// Save / update notice
app.post("/notice", async (req, res) => {
  try {
    const { message, is_enabled } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Notice message is required"
      });
    }

    const existing = await pool.query(
      `SELECT id FROM notice_board
       ORDER BY id DESC
       LIMIT 1`
    );

    let result;

    if (existing.rows.length === 0) {

      result = await pool.query(
        `INSERT INTO notice_board
         (message, is_enabled, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         RETURNING id, message, is_enabled, updated_at`,
        [message.trim(), Boolean(is_enabled)]
      );

    } else {

      result = await pool.query(
        `UPDATE notice_board
         SET message = $1,
             is_enabled = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, message, is_enabled, updated_at`,
        [
          message.trim(),
          Boolean(is_enabled),
          existing.rows[0].id
        ]
      );

    }

    res.json({
      success: true,
      notice: result.rows[0]
    });

  } catch (err) {
    console.error("Notice Save Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// Turn notice off
app.post("/notice/off", async (req, res) => {
  try {

    const result = await pool.query(
      `UPDATE notice_board
       SET is_enabled = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = (
         SELECT id
         FROM notice_board
         ORDER BY id DESC
         LIMIT 1
       )
       RETURNING id, message, is_enabled, updated_at`
    );

    res.json({
      success: true,
      notice: result.rows[0] || null
    });

  } catch (err) {
    console.error("Notice Off Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// =========================
// SLIDER IMAGES
// =========================

// Get slider images
app.get("/slider-images", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, image_url, position
       FROM slider_images
       ORDER BY position ASC`
    );

    res.json({
      success: true,
      images: result.rows
    });

  } catch (err) {
    console.error("Slider Images Error:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// --------------------
// SERVER START (FIXED FOR RENDER)
// --------------------
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});