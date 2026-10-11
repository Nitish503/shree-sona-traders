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

// APK update table
await pool.query(`
  CREATE TABLE IF NOT EXISTS app_updates (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    download_url TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// SMS message templates
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // SMS sending history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_send_logs (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES sms_templates(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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