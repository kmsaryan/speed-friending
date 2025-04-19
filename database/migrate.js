const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function migrateDatabase() {
  console.log('Starting database migration...');
  
  // Use a relative path that the app has access to
  const dbPath = './speed-friending.sqlite';
  console.log(`Using database path: ${dbPath}`);
  
  // Connect to database directly without creating directories
  let db;
  try {
    db = new sqlite3.Database(dbPath);
    console.log(`Connected to database at: ${dbPath}`);
  } catch (err) {
    console.error(`Failed to open database at ${dbPath}:`, err);
    throw err;
  }
  
  // Enable logging for SQL commands
  if (process.env.NODE_ENV !== 'production') {
    db.on('trace', (sql) => {
      console.log('[SQL]:', sql);
    });
  }
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found at ${schemaPath}`);
    throw new Error(`Schema file not found at ${schemaPath}`);
  }
  
  console.log(`Reading schema from: ${schemaPath}`);
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  try {
    // Begin transaction
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        console.log('Running schema script...');
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = OFF');
        
        // Run the schema script which has CREATE TABLE IF NOT EXISTS statements
        db.exec(schemaSQL, (err) => {
          if (err) {
            console.error('Error in initial schema application:', err.message);
            reject(err);
            return;
          }
          
          console.log('Base schema applied, checking for required columns...');
          
          // Check if players table exists and has necessary columns
          checkPlayersTable(db, resolve, reject);
        });
      });
    });
    
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Error during database migration:', error);
    throw error;
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

// New function to check and fix players table
function checkPlayersTable(db, resolve, reject) {
  console.log('Checking players table...');
  
  db.all("PRAGMA table_info(players)", (err, columns) => {
    if (err) {
      console.error('Error checking players table columns:', err.message);
      reject(err);
      return;
    }
    
    const hasInteractionCountColumn = columns.some(col => col.name === 'interaction_count');
    
    if (!hasInteractionCountColumn) {
      console.log('Adding interaction_count column to players table...');
      
      db.run('ALTER TABLE players ADD COLUMN interaction_count INTEGER DEFAULT 0', (err) => {
        if (err) {
          console.error('Error adding interaction_count column:', err.message);
          reject(err);
          return;
        }
        
        console.log('Successfully added interaction_count column');
        checkRatingsTable(db, resolve, reject);
      });
    } else {
      console.log('interaction_count column already exists');
      checkRatingsTable(db, resolve, reject);
    }
  });
}

// New function to check and fix ratings table
function checkRatingsTable(db, resolve, reject) {
  console.log('Checking ratings table...');
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ratings'", (err, table) => {
    if (err) {
      console.error('Error checking for ratings table:', err.message);
      reject(err);
      return;
    }
    
    if (table) {
      // Check if round column exists
      db.all("PRAGMA table_info(ratings)", (err, columns) => {
        if (err) {
          console.error('Error checking ratings columns:', err.message);
          reject(err);
          return;
        }
        
        const hasRoundColumn = columns.some(col => col.name === 'round');
        
        if (!hasRoundColumn) {
          console.log('Round column missing, adding it to ratings table...');
          
          // Add round column to existing ratings table
          db.run('ALTER TABLE ratings ADD COLUMN round INTEGER DEFAULT 1', (err) => {
            if (err) {
              console.error('Error adding round column to ratings table:', err.message);
              reject(err);
              return;
            }
            
            console.log('Round column added successfully to ratings table.');
            checkMatchesTable(db, resolve, reject);
          });
        } else {
          console.log('Round column already exists in ratings table.');
          checkMatchesTable(db, resolve, reject);
        }
      });
    } else {
      console.log('Ratings table does not exist yet. It will be created with the schema.');
      checkMatchesTable(db, resolve, reject);
    }
  });
}

// New function to check and fix matches table
function checkMatchesTable(db, resolve, reject) {
  console.log('Checking matches table...');
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='matches'", (err, table) => {
    if (err) {
      console.error('Error checking for matches table:', err.message);
      reject(err);
      return;
    }
    
    if (table) {
      // Check if rated column exists
      db.all("PRAGMA table_info(matches)", (err, columns) => {
        if (err) {
          console.error('Error checking matches columns:', err.message);
          reject(err);
          return;
        }
        
        const hasRatedColumn = columns.some(col => col.name === 'rated');
        
        if (!hasRatedColumn) {
          console.log('Rated column missing, adding it to matches table...');
          
          // Add rated column to existing matches table
          db.run('ALTER TABLE matches ADD COLUMN rated INTEGER DEFAULT 0', (err) => {
            if (err) {
              console.error('Error adding rated column to matches table:', err.message);
              reject(err);
              return;
            }
            
            console.log('Rated column added successfully to matches table.');
            resolve();
          });
        } else {
          console.log('Rated column already exists in matches table.');
          resolve();
        }
      });
    } else {
      console.log('Matches table does not exist yet. It will be created with the schema.');
      resolve();
    }
  });
}

// Run the migration
migrateDatabase().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
