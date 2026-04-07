const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg"); // Neon PostgreSQL client

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // set in Render environment
  ssl: { rejectUnauthorized: false }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Routes for specific pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/construction", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "construction.html"));
});

app.get("/rental", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "rental.html"));
});

app.get("/fuel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "fuel.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

// Example API route for items (still works)
app.get("/items", (req, res) => {
  res.json([{ name: "Cement", description: "High quality cement", category: "construction" }]);
});

// --------------------
// Customer Registration API
// --------------------

// Save new customer
app.post("/customers", async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *",
      [name, email, phone]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error saving customer:", err);
    res.status(500).send("Error saving customer");
  }
});

// Fetch all customers (for Admin page)
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));