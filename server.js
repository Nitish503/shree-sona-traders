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

// DELETE item
app.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM items WHERE id=$1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).send(err.message);
  }
});

// --------------------
// SERVER START
// --------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});