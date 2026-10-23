import dotenv from "dotenv";

dotenv.config();

const { default: app } = await import("./app.js");
const { pool } = await import("./db/index.js");

const PORT = 4000;

try {
  await pool.query("SELECT 1");
  console.log("Supabase PostgreSQL connected!");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("Database connection failed:", error.message);
  process.exit(1);
}