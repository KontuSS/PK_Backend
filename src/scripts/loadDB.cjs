const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'yourpassword',
  database: 'yourdbname'
});

async function loadSqlFile() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, '../../database.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('Loading SQL file...');
    await client.query(sql);
    console.log('Database loaded successfully!');
  } catch (error) {
    console.error('Error loading database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

loadSqlFile();