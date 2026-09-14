require("dotenv").config();
const { Pool } = require("pg");

// Use your Neon connection string from Render environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  try {
    // Items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        description TEXT,
        category VARCHAR(50)
      );
    `);

    // Customers table
await pool.query(`
  CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20)
  );
`);

// Add password column for customer login
await pool.query(`
  ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password VARCHAR(255);
`);

    // Admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(200)
      );
    `);

    // Notice Board table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notice_board (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        is_enabled BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // =========================
// SLIDER IMAGES
// =========================

await pool.query(`
  CREATE TABLE IF NOT EXISTS slider_images (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    position INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

    console.log("Tables created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating tables:", err);
    process.exit(1);
  }
}

createTables();