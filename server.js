require("dotenv").config(); // 🔥 ENV support

const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const multer = require("multer");

// 🔥 Cloudinary
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();
// 🔥 CAPTCHA STORE
let captchaStore = {};

app.use(cors());
app.use(express.json());

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
    const { name, phone, captcha, captchaId } = req.body;

    // ✅ VALIDATION
    if (!name || !phone || !captcha || !captchaId) {
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

    // ✅ INSERT NEW CUSTOMER
    const result = await pool.query(
      "INSERT INTO customers (name, phone) VALUES ($1,$2) RETURNING *",
      [name, phone]
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
// CREATE BILL (MULTI-ITEM) - FINAL FIXED
// --------------------
app.post("/bill", async (req, res) => {
  try {
    const { phone, items, paid } = req.body;

    // --------------------
    // VALIDATION
    // --------------------
    if (!phone || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required data" });
    }

    // --------------------
    // CHECK CUSTOMER
    // --------------------
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

    // --------------------
    // CALCULATE TOTAL
    // --------------------
    let total = 0;

    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      total += qty * rate;
    });

    const paidAmount = Number(paid) || 0;
    const remaining = total - paidAmount;

    const status = remaining > 0 ? "pending" : "completed"; // ✅ FIXED STATUS

    // --------------------
    // GENERATE BILL NUMBER
    // --------------------
    const billNo = "INV-" + Date.now();

    // --------------------
    // INSERT INTO BILLS
    // --------------------
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

    // 🔥🔥🔥 IMPORTANT FIX (ADD THIS BLOCK)
    // --------------------
    // INSERT INITIAL PAYMENT INTO payments TABLE
    // --------------------
    if (paidAmount > 0) {
      await pool.query(
        "INSERT INTO payments (bill_id, amount) VALUES ($1, $2)",
        [newBill.id, paidAmount]
      );
    }

    // --------------------
    // SUCCESS RESPONSE
    // --------------------
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
      "SELECT * FROM payments WHERE bill_id=$1 ORDER BY created_at ASC",
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
// PAY / REBILL AMOUNT (FINAL WITH HISTORY)
// --------------------
app.put("/bills/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

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

    // 🔹 SAFE NUMBER CONVERSION
    const currentPaid = Number(current.paid) || 0;
    const total = Number(current.total) || 0;

    const newPaid = currentPaid + payAmount;
    const remaining = total - newPaid;

    // 🔹 STATUS FIX
    const status = newPaid >= total ? "completed" : "pending";

    // 🔥 STEP 1: SAVE PAYMENT HISTORY
    await pool.query(
      "INSERT INTO payments (bill_id, amount) VALUES ($1, $2)",
      [id, payAmount]
    );

    // 🔥 STEP 2: UPDATE BILL
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
// GET SINGLE BILL
// --------------------
app.get("/bills/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM bills WHERE id=$1",
      [id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("❌ Fetch Bill Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================
// CUSTOMER LEDGER API (FIXED)
// =====================
app.get("/ledger/:phone", async (req, res) => {
  const { phone } = req.params;

  try {
    const billsResult = await pool.query(
      "SELECT * FROM bills WHERE phone=$1 ORDER BY id ASC",
      [phone]
    );

    const bills = billsResult.rows;

    let ledger = [];
    let totalPurchase = 0;
    let totalPaid = 0;

    for (const bill of bills) {

      const billTotal = Number(bill.total) || 0;
      totalPurchase += billTotal;

      // ✅ FIXED: bill_date instead of created_at
      ledger.push({
        type: "bill",
        bill_id: bill.id,
        amount: billTotal,
        date: bill.bill_date   // 🔥 FIX HERE
      });

      // PAYMENTS
      const payResult = await pool.query(
        "SELECT * FROM payments WHERE bill_id=$1 ORDER BY id ASC",
        [bill.id]
      );

      for (const p of payResult.rows) {
        const amt = Number(p.amount) || 0;
        totalPaid += amt;

        ledger.push({
          type: "payment",
          bill_id: bill.id,
          amount: amt,
          date: p.created_at   // ✅ correct
        });
      }
    }

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



// --------------------
// SERVER START
// --------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});