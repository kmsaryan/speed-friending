const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

dotenv.config();

const db = new sqlite3.Database(process.env.DATABASE_URL, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

module.exports = db;
