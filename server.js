const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// Connect to Neon PostgreSQL
// --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // set in Render environment
  ssl: { rejectUnauthorized: false }
});

// --------------------
// Auto-create tables on startup
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        address TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id),
        item_id INT REFERENCES items(id),
        quantity INT,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(200)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id),
        amount DECIMAL(10,2),
        status VARCHAR(20),
        billing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rates (
        id SERIAL PRIMARY KEY,
        item_id INT REFERENCES items(id),
        price DECIMAL(10,2),
        effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tables verified/created successfully");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  }
}
initDB();

// --------------------
// Serve static frontend files
// --------------------
app.use(express.static(path.join(__dirname, "public")));

// Routes for pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/construction", (req, res) => res.sendFile(path.join(__dirname, "public", "construction.html")));
app.get("/rental", (req, res) => res.sendFile(path.join(__dirname, "public", "rental.html")));
app.get("/fuel", (req, res) => res.sendFile(path.join(__dirname, "public", "fuel.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "public", "about.html")));
app.get("/stock", (req, res) => res.sendFile(path.join(__dirname, "public", "stock.html")));

// --------------------
// Items API
// --------------------
app.get("/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM items ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).send("Error fetching items");
  }
});

app.get("/items/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM items WHERE LOWER(category) = LOWER($1) ORDER BY id DESC",
      [category]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching items by category:", err);
    res.status(500).send("Error fetching items by category");
  }
});

app.post("/items", async (req, res) => {
  const { name, description, category } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO items (name, description, category, status) VALUES ($1, $2, LOWER($3), 'available') RETURNING *",
      [name, description, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).send("Error adding item");
  }
});

app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, category } = req.body;
  try {
    const result = await pool.query(
      "UPDATE items SET name=$1, description=$2, category=LOWER($3) WHERE id=$4 RETURNING *",
      [name, description, category, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error editing item:", err);
    res.status(500).send("Error editing item");
  }
});

app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM items WHERE id=$1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).send("Error deleting item");
  }
});

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
    console.error("Error updating status:", err);
    res.status(500).send("Error updating status");
  }
});
// Bulk update status
app.put("/items/bulk/status", async (req, res) => {
  const { ids, status } = req.body; // ids = array of item IDs
  try {
    const result = await pool.query(
      "UPDATE items SET status=$1 WHERE id = ANY($2::int[]) RETURNING *",
      [status, ids]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error bulk updating:", err);
    res.status(500).send("Error bulk updating");
  }
});

// Bulk delete
app.delete("/items/bulk/delete", async (req, res) => {
  const { ids } = req.body; // ids = array of item IDs
  try {
    await pool.query("DELETE FROM items WHERE id = ANY($1::int[])", [ids]);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error bulk deleting:", err);
    res.status(500).send("Error bulk deleting");
  }
});

// --------------------
// Customers API
// --------------------
app.post("/customers", async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO customers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, address]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error saving customer:", err);
    res.status(500).send("Error saving customer");
  }
});

app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).send("Error fetching customers");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));