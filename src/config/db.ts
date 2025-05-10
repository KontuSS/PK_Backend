import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'app',
  password: 'secret',
  database: 'appdb',
});

export const db = drizzle(pool);