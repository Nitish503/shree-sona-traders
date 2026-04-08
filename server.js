const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

// DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Upload config
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Init DB
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

// Static
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.get("/stock", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "stock.html"))
);

// GET items
app.get("/items/:category", async (req, res) => {
  const { category } = req.params;

  const result = await pool.query(
    "SELECT * FROM items WHERE LOWER(category)=LOWER($1) ORDER BY id DESC",
    [category]
  );

  res.json(result.rows);
});

// ADD item
app.post("/items", upload.single("image"), async (req, res) => {
  const { name, description, category } = req.body;
  const image = req.file ? "/uploads/" + req.file.filename : null;

  const result = await pool.query(
    `INSERT INTO items (name, description, category, status, image)
     VALUES ($1,$2,LOWER($3),'available',$4) RETURNING *`,
    [name, description || null, category, image]
  );

  res.json(result.rows[0]);
});

// UPDATE item
app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, category } = req.body;

  const result = await pool.query(
    `UPDATE items SET name=$1, description=$2, category=LOWER($3)
     WHERE id=$4 RETURNING *`,
    [name, description, category, id]
  );

  res.json(result.rows[0]);
});

// STATUS
app.put("/items/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await pool.query(
    "UPDATE items SET status=$1 WHERE id=$2 RETURNING *",
    [status, id]
  );

  res.json(result.rows[0]);
});

// DELETE
app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM items WHERE id=$1", [id]);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 Server running on port " + PORT));