const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --------------------
// Connect to Neon DB
// --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --------------------
// Initialize DB
// --------------------
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        status VARCHAR(20) DEFAULT 'available'
      );
    `);

    console.log("✅ Items table ready");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
  }
}
initDB();

// --------------------
// Serve static files
// --------------------
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.get("/stock", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "stock.html"))
);

// --------------------
// ITEMS API
// --------------------

// 🔹 Get all items
app.get("/items", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM items ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).send(err.message);
  }
});

// 🔹 Get by category
app.get("/items/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM items WHERE LOWER(category) = LOWER($1) ORDER BY id DESC",
      [category]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Category Fetch Error:", err.message);
    res.status(500).send(err.message);
  }
});

// 🔹 Add item
app.post("/items", async (req, res) => {
  const { name, category } = req.body;

  if (!name || !category) {
    return res.status(400).send("Name and category required");
  }

  try {
    const result = await pool.query(
      `INSERT INTO items (name, description, category, status)
       VALUES ($1, $2, LOWER($3), 'available')
       RETURNING *`,
      [name, null, category]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Insert Error:", err.message);
    res.status(500).send(err.message);
  }
});

// 🔹 Update status
app.put("/items/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      "UPDATE items SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Status Update Error:", err.message);
    res.status(500).send(err.message);
  }
});

// 🔹 Delete item
app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM items WHERE id=$1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).send(err.message);
  }
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});