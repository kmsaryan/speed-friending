const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'speed-friending.sqlite');
const db = new sqlite3.Database(dbPath);

console.log(`Connected to database at ${dbPath}`);
console.log('Running emergency fixes for team_battles table...');

// Check if team_battles table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='team_battles'", (err, table) => {
  if (err) {
    console.error('Error checking for team_battles table:', err.message);
    db.close();
    return;
  }
  
  if (!table) {
    console.log('team_battles table does not exist, creating it');
    createTeamBattlesTable();
  } else {
    // Table exists, check if status column exists
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
      } else {
        console.log('Adding status column to team_battles table');
        addStatusColumn();
      }
    });
  }
});

function createTeamBattlesTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS team_battles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team1_id INTEGER NOT NULL,
      team2_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      winner_id INTEGER,
      battle_type TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (team1_id) REFERENCES teams(id),
      FOREIGN KEY (team2_id) REFERENCES teams(id),
      FOREIGN KEY (winner_id) REFERENCES teams(id)
    )
  `, function(err) {
    if (err) {
      console.error('Error creating team_battles table:', err.message);
    } else {
      console.log('Successfully created team_battles table with status column');
    }
    db.close();
  });
}

function addStatusColumn() {
  db.run('ALTER TABLE team_battles ADD COLUMN status TEXT DEFAULT "pending"', (err) => {
    if (err) {
      console.error('Error adding status column:', err.message);
      
      // Alternative approach: create a new table and migrate data
      console.log('Attempting alternative migration approach...');
      migrateTableWithStatus();
    } else {
      console.log('Successfully added status column to team_battles table');
      db.close();
    }
  });
}

function migrateTableWithStatus() {
  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Rename the existing table
    db.run('ALTER TABLE team_battles RENAME TO team_battles_old', (err) => {
      if (err) {
        console.error('Error renaming table:', err.message);
        db.run('ROLLBACK');
        db.close();
        return;
      }
      
      // Create a new table with the status column
      db.run(`
        CREATE TABLE team_battles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team1_id INTEGER NOT NULL,
          team2_id INTEGER NOT NULL,
          round INTEGER NOT NULL,
          winner_id INTEGER,
          battle_type TEXT,
          status TEXT DEFAULT 'pending',
          FOREIGN KEY (team1_id) REFERENCES teams(id),
          FOREIGN KEY (team2_id) REFERENCES teams(id),
          FOREIGN KEY (winner_id) REFERENCES teams(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating new table:', err.message);
          db.run('ROLLBACK');
          db.close();
          return;
        }
        
        // Copy data from the old table to the new table
        db.run(`
          INSERT INTO team_battles (id, team1_id, team2_id, round, winner_id, battle_type, status)
          SELECT id, team1_id, team2_id, round, winner_id, battle_type,
                 CASE WHEN winner_id IS NOT NULL THEN 'completed' ELSE 'pending' END
          FROM team_battles_old
        `, (err) => {
          if (err) {
            console.error('Error copying data:', err.message);
            db.run('ROLLBACK');
            db.close();
            return;
          }
          
          // Drop the old table
          db.run('DROP TABLE team_battles_old', (err) => {
            if (err) {
              console.error('Error dropping old table:', err.message);
              db.run('ROLLBACK');
              db.close();
              return;
            }
            
            // Commit the transaction
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                db.run('ROLLBACK');
              } else {
                console.log('Successfully migrated team_battles table with status column');
              }
              db.close();
            });
          });
        });
      });
    });
  });
}
