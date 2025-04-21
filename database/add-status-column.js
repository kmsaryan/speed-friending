const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, '..', 'speed-friending.sqlite');
const db = new sqlite3.Database(dbPath);

console.log(`Adding status column to team_battles table in database at ${dbPath}`);

// Check if the column already exists
db.all("PRAGMA table_info(team_battles)", (err, columns) => {
  if (err) {
    console.error('Error checking table columns:', err.message);
    db.close();
    return;
  }
  
  const hasStatusColumn = columns.some(col => col.name === 'status');
  
  if (hasStatusColumn) {
    console.log('Status column already exists in team_battles table');
    db.close();
    return;
  }
  
  // Add the status column
  db.run('ALTER TABLE team_battles ADD COLUMN status TEXT DEFAULT "pending"', (err) => {
    if (err) {
      console.error('Error adding status column:', err.message);
    } else {
      console.log('Successfully added status column to team_battles table');
    }
    db.close();
  });
});
