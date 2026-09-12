require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    const result = await pool.query(
      "SELECT id, name, phone, password IS NULL AS password_missing FROM customers WHERE phone=$1",
      ["9546027510"]
    );

    console.log(result.rows);
  } catch (error) {
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

test();
