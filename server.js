//server.js
//Description: This code sets up an Express server with SQLite database integration for a matchmaking application. It includes endpoints for player registration, fetching matches based on player type or ID, submitting ratings, admin authentication, and clearing data. The server handles errors gracefully and provides JSON responses for better client-side handling.
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const bcrypt = require('bcrypt'); // For password hashing

dotenv.config();
const app = express();
const db = new sqlite3.Database(process.env.DATABASE_URL);

app.use(bodyParser.json());

// Allow requests from the frontend server
app.use(cors({ origin: process.env.FRONTEND_URL }));

app.post('/api/register', (req, res) => {
  console.log('Incoming registration request:', req.body); // Log the request payload

  const { name, gender, interests, preferences } = req.body;

  if (!name) {
    console.error('Validation error: Name is required'); // Log validation error
    return res.status(400).json({ error: 'Name is required' });
  }

  db.run(
    'INSERT INTO players (name, gender, interests, preferences) VALUES (?, ?, ?, ?)',
    [name, gender, interests, preferences],
    function (err) {
      if (err) {
        console.error('Database error during registration:', err.message); // Log database error
        return res.status(500).json({ error: 'Failed to register player', details: err.message });
      }
      console.log('Player registered successfully with ID:', this.lastID); // Log success
      res.status(200).json({ id: this.lastID });
    }
  );
});

// Endpoint to get a match for a player
app.get('/api/match/:playerId', (req, res) => {
  const playerId = req.params.playerId;

  // Find a random player who hasn't been matched with this player in the current round
  db.get(
    `SELECT id, name, gender, interests, preferences 
     FROM players 
     WHERE id != ? AND id NOT IN (
       SELECT matched_player_id FROM matches WHERE player_id = ?
     ) 
     ORDER BY RANDOM() LIMIT 1`,
    [playerId, playerId],
    (err, row) => {
      if (err) return res.status(500).send(err.message);
      if (!row) return res.status(404).send('No match found');
      
      // Insert the match into the matches table
      db.run(
        'INSERT INTO matches (player_id, matched_player_id, round) VALUES (?, ?, ?)',
        [playerId, row.id, 1], // Assuming round 1 for now
        (err) => {
          if (err) return res.status(500).send(err.message);
          res.status(200).send(row);
        }
      );
    }
  );
});

// Endpoint to get a match for a player type
app.get('/api/match/:playerType', (req, res) => {
  const playerType = req.params.playerType;
  console.log(`Matching request for player type: ${playerType}`); // Debugging statement

  // Logic to handle matching based on player type
  db.get(
    `SELECT id, name, gender, interests, preferences 
     FROM players 
     WHERE id NOT IN (
       SELECT matched_player_id FROM matches
     ) 
     ORDER BY RANDOM() LIMIT 1`,
    [],
    (err, row) => {
      if (err) {
        console.error('Database error:', err.message); // Debugging statement
        return res.status(500).json({ error: 'Database error', message: err.message }); // Return JSON error
      }
      if (!row) {
        console.log('No match found in the database.'); // Debugging statement
        return res.status(404).json({ error: 'No match found' }); // Return JSON error
      }

      console.log('Match found:', row); // Debugging statement
      res.status(200).json(row); // Return valid JSON
    }
  );
});

// Endpoint to submit ratings
app.post('/api/rate', (req, res) => {
  const { playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain } = req.body;
  db.run(
    `INSERT INTO ratings (player_id, rated_player_id, enjoyment, depth, would_chat_again) 
     VALUES (?, ?, ?, ?, ?)`,
    [playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain],
    (err) => {
      if (err) {
        console.error('Error inserting rating:', err.message);
        return res.status(500).json({ error: 'Failed to submit rating' });
      }
      res.status(200).json({ message: 'Rating submitted successfully' });
    }
  );
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) {
      console.error('Database error during admin login:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Login successful' });
  });
});

// Endpoint to clear players, matches, and ratings
app.post('/api/admin/clear', (req, res) => {
  const { username, password } = req.body;

  // Authenticate admin
  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) {
      console.error('Database error during admin authentication:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear database entries
    db.serialize(() => {
      db.run('DELETE FROM players', (err) => {
        if (err) console.error('Error clearing players:', err.message);
      });
      db.run('DELETE FROM matches', (err) => {
        if (err) console.error('Error clearing matches:', err.message);
      });
      db.run('DELETE FROM ratings', (err) => {
        if (err) console.error('Error clearing ratings:', err.message);
      });
    });

    res.status(200).json({ message: 'Database cleared successfully' });
  });
});

// Endpoint to clear player data
app.post('/api/admin/clear-players', (req, res) => {
  const { username, password } = req.body;

  // Authenticate admin
  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) {
      console.error('Database error during admin authentication:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear player data
    db.serialize(() => {
      db.run('DELETE FROM players', (err) => {
        if (err) {
          console.error('Error clearing players:', err.message);
          return res.status(500).json({ error: 'Failed to clear player data' });
        }
        res.status(200).json({ message: 'Player data cleared successfully' });
      });
    });
  });
});

const PORT = process.env.PORT || 3000; // Use PORT from .env or default to 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
