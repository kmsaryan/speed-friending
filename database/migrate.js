const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = process.env.DATABASE_URL || './speed-friending.sqlite';
const schemaPath = path.join(__dirname, 'schema.sql');

async function migrateDatabase() {
  console.log('Starting database migration...');
  
  // Create the database directory if it doesn't exist
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Read schema file
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Connect to database
  const db = new sqlite3.Database(dbPath);
  
  // Enable logging for SQL commands
  if (process.env.NODE_ENV !== 'production') {
    db.on('trace', (sql) => {
      console.log('[SQL]:', sql);
    });
  }
  
  // Begin transaction
  db.serialize(() => {
    console.log('Running schema script...');
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = OFF');
    
    // Run the schema script which has CREATE TABLE IF NOT EXISTS statements
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error applying schema:', err.message);
        return;
      }
      
      console.log('Schema applied successfully.');
      
      // Check if players table exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='players'", (err, table) => {
        if (err) {
          console.error('Error checking for players table:', err.message);
          return;
        }
        
        if (!table) {
          console.log('Players table does not exist. It will be created by the schema.');
          return;
        }
        
        // Check if status column exists
        db.all("PRAGMA table_info(players)", (err, rows) => {
          if (err) {
            console.error('Error checking columns:', err.message);
            return;
          }
          
          const hasStatusColumn = rows.some(row => row.name === 'status');
          
          if (!hasStatusColumn) {
            console.log('Adding status column to players table...');
            db.run('ALTER TABLE players ADD COLUMN status TEXT DEFAULT "available"', (err) => {
              if (err) {
                console.error('Error adding status column:', err.message);
              } else {
                console.log('Status column added successfully.');
              }
            });
          } else {
            console.log('Status column already exists in players table.');
          }
        });
      });
    });
  });
  
  // Wait for operations to complete and close the connection
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database migration completed.');
      }
    });
  }, 1000); // Give some time for async operations to complete
}

// Run the migration
migrateDatabase().catch(console.error);
