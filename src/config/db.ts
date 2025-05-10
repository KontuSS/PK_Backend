import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../models/schema.js';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'app',
  password: 'secret',
  database: 'appdb',
});

export const db = drizzle(pool, { schema });
export type DbType = typeof db;