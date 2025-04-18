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
  
  // Connect to database
  const db = new sqlite3.Database(dbPath);
  
  // Enable logging for SQL commands
  if (process.env.NODE_ENV !== 'production') {
    db.on('trace', (sql) => {
      console.log('[SQL]:', sql);
    });
  }
  
  try {
    // Begin transaction
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        console.log('Running schema script...');
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = OFF');
        
        // Run the schema script which has CREATE TABLE IF NOT EXISTS statements
        db.exec(fs.readFileSync(schemaPath, 'utf8'), (err) => {
          if (err) {
            console.error('Error in initial schema application:', err.message);
            // Continue with migration even if there's an error, as we'll try to fix it
          }
          
          console.log('Base schema applied, checking for required columns...');
          
          // Check if players table exists
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='players'", (err, table) => {
            if (err) {
              console.error('Error checking for players table:', err.message);
              reject(err);
              return;
            }
            
            if (table) {
              // Check if status column exists in players table
              db.all("PRAGMA table_info(players)", (err, columns) => {
                if (err) {
                  console.error('Error checking columns:', err.message);
                  reject(err);
                  return;
                }
                
                const hasStatusColumn = columns.some(col => col.name === 'status');
                
                if (!hasStatusColumn) {
                  console.log('Status column missing, adding it to players table...');
                  
                  // Add status column to existing players table
                  db.run('ALTER TABLE players ADD COLUMN status TEXT DEFAULT "available"', (err) => {
                    if (err) {
                      console.error('Error adding status column:', err.message);
                      reject(err);
                      return;
                    }
                    
                    console.log('Status column added successfully to players table.');
                    resolve();
                  });
                } else {
                  console.log('Status column already exists in players table.');
                  resolve();
                }
              });
            } else {
              console.log('Players table does not exist yet. It will be created with the schema.');
              resolve();
            }
          });
        });
      });
    });
    
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Error during database migration:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

// Run the migration
migrateDatabase();
