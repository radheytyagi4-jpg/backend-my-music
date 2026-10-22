
import {Pool} from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err.message);
});

export default pool;
