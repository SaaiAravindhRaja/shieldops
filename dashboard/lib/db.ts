import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://archestra:archestra@localhost:5432/archestra",
  max: 5,
  connectionTimeoutMillis: 3000,
});

export default pool;
