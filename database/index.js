const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use absolute path in production
const getDbPath = () => {
  const dbPath = process.env.DATABASE_URL || './speed-friending.sqlite';
  // If it's a relative path, make it absolute
  if (!path.isAbsolute(dbPath) && !dbPath.startsWith(':memory:')) {
    return path.join(process.cwd(), dbPath);
  }
  return dbPath;
};

const db = new sqlite3.Database(getDbPath(), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

module.exports = db;
