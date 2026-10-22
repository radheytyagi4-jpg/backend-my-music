
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import pool from "./db/index.js";

const PORT = process.env.PORT || 4000;

try {
  await pool.query("SELECT 1");
  console.log("Supabase PostgreSQL connected!");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("Database connection failed:");
  console.error(error)
  process.exit(1);
}
