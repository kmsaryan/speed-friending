const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use a simple file path that's writable in the Render environment
const dbPath = './speed-friending.sqlite';

console.log(`Opening database at path: ${dbPath}`);
let db;

try {
  // Create a new database connection
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
} catch (error) {
  console.error('Exception during database connection:', error);
}

module.exports = db;
