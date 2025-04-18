const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const readline = require('readline');

// Initialize readline interface for command-line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to the database
const dbPath = path.join(__dirname, '..', 'speed-friending.sqlite');
const db = new sqlite3.Database(dbPath);

console.log(`Connected to database at ${dbPath}`);

// Ask for admin credentials
rl.question('Enter admin username: ', (username) => {
  rl.question('Enter admin password: ', async (password) => {
    try {
      // Check if username already exists
      db.get('SELECT username FROM admins WHERE username = ?', [username], async (err, user) => {
        if (err) {
          console.error('Database error:', err.message);
          closeAndExit(1);
        }

        if (user) {
          console.log(`Admin user '${username}' already exists. Do you want to update the password?`);
          rl.question('Update password? (y/n): ', async (answer) => {
            if (answer.toLowerCase() === 'y') {
              await updateAdminPassword(username, password);
            } else {
              console.log('Operation cancelled.');
              closeAndExit(0);
            }
          });
        } else {
          await createAdmin(username, password);
        }
      });
    } catch (error) {
      console.error('Error:', error.message);
      closeAndExit(1);
    }
  });
});

async function createAdmin(username, password) {
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`Generated hash: ${hashedPassword}`);

    // Insert the new admin
    db.run(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function (err) {
        if (err) {
          console.error('Error creating admin:', err.message);
          closeAndExit(1);
        }

        console.log(`Admin '${username}' created successfully with ID: ${this.lastID}`);
        closeAndExit(0);
      }
    );
  } catch (error) {
    console.error('Error hashing password:', error.message);
    closeAndExit(1);
  }
}

async function updateAdminPassword(username, password) {
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`Generated hash: ${hashedPassword}`);

    // Update the admin password
    db.run(
      'UPDATE admins SET password = ? WHERE username = ?',
      [hashedPassword, username],
      function (err) {
        if (err) {
          console.error('Error updating admin password:', err.message);
          closeAndExit(1);
        }

        console.log(`Password for admin '${username}' updated successfully`);
        closeAndExit(0);
      }
    );
  } catch (error) {
    console.error('Error hashing password:', error.message);
    closeAndExit(1);
  }
}

function closeAndExit(code) {
  db.close();
  rl.close();
  process.exit(code);
}
