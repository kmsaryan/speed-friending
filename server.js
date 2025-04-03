//server.js
//Description: This code sets up an Express server with SQLite database integration for a matchmaking application. It includes endpoints for player registration and fetching matches based on player type or ID. The server handles errors gracefully and provides JSON responses for better client-side handling.
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const db = new sqlite3.Database(process.env.DATABASE_URL);

app.use(bodyParser.json());

app.post('/api/register', (req, res) => {
  const { name, gender, interests, preferences } = req.body;
  db.run(
    'INSERT INTO players (name, gender, interests, preferences) VALUES (?, ?, ?, ?)',
    [name, gender, interests, preferences],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.status(200).send({ id: this.lastID });
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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
