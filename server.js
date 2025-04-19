//server.js
//Description: This code sets up an Express server with modular routes for a matchmaking application. It includes endpoints for player registration, fetching matches, submitting ratings, team formation, and admin functionalities. The server handles errors gracefully and provides JSON responses for better client-side handling.
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');
const db = require('./database'); // Add this import for database

dotenv.config();

// Run database migration before starting the server
console.log('Running database migration...');
try {
  const migrateScript = path.join(__dirname, 'database', 'migrate.js');
  console.log(`Executing migration script at: ${migrateScript}`);
  
  execSync(`node ${migrateScript}`, { stdio: 'inherit' });
  console.log('Database migration completed successfully.');
} catch (error) {
  console.error('Error running database migration:', error.message);
  console.error('Continuing with server startup, but some features may not work correctly.');
}

const initializeSocketServer = require('./socketServer');

const app = express();
const server = http.createServer(app);
const io = initializeSocketServer(server);

app.use(bodyParser.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Add debugging for routes registration
console.log('Registering API routes...');

// Import modular routes
const registerRoutes = require('./routes/register');
const matchRoutes = require('./routes/match');
const ratingsRoutes = require('./routes/ratings');
const teamsRoutes = require('./routes/teams');
const battlesRoutes = require('./routes/battles'); 
const playerCountRoutes = require('./routes/playerCount');
const adminRoutes = require('./routes/admin');
const roundRoutes = require('./routes/round'); // Add this line

// Print available routes in admin (for debugging)
console.log('Available admin routes:');
adminRoutes.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(`Route: ${r.route.path}`);
  }
});

// Use modular routes
app.use('/api', registerRoutes);
app.use('/api', matchRoutes);
app.use('/api', ratingsRoutes);
app.use('/api', teamsRoutes);
app.use('/api', battlesRoutes); 
app.use('/api', playerCountRoutes);
app.use('/api', adminRoutes);
app.use('/api', roundRoutes); // Add this line

// Add new routes for enhanced admin functionality
app.get('/api/admin/players', (req, res) => {
  db.all(
    `SELECT p.*, 
            (SELECT COUNT(*) FROM matches m 
             WHERE (m.player_id = p.id OR m.matched_player_id = p.id)) as interaction_count 
     FROM players p
     ORDER BY p.id`,
    (err, players) => {
      if (err) {
        console.error('Database error fetching players:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json(players);
    }
  );
});

app.get('/api/admin/matches', (req, res) => {
  const { round = 1 } = req.query;
  
  db.all(
    `SELECT m.id, m.player_id as player1_id, m.matched_player_id as player2_id, 
            p1.name as player1_name, p2.name as player2_name,
            p1.playerType as player1_type, p2.playerType as player2_type,
            m.round
     FROM matches m
     JOIN players p1 ON m.player_id = p1.id
     JOIN players p2 ON m.matched_player_id = p2.id
     WHERE m.round = ?
     ORDER BY m.id DESC`,
    [round],
    (err, matches) => {
      if (err) {
        console.error('Database error fetching matches:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json(matches);
    }
  );
});

app.post('/api/admin/end-match/:id', (req, res) => {
  const { id } = req.params;
  
  // Get match details first
  db.get('SELECT player_id, matched_player_id FROM matches WHERE id = ?', [id], (err, match) => {
    if (err) {
      console.error('Database error ending match:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Update players status if status column exists
    db.all("PRAGMA table_info(players)", (err, columns) => {
      if (err) {
        console.error('Error checking players table:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const hasStatusColumn = columns.some(col => col.name === 'status');
      
      if (hasStatusColumn) {
        db.run('UPDATE players SET status = "available" WHERE id IN (?, ?)', 
          [match.player_id, match.matched_player_id]);
      }
      
      // Remove the match
      db.run('DELETE FROM matches WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting match:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(200).json({ message: 'Match ended successfully' });
      });
    });
  });
});

app.post('/api/admin/create-match', (req, res) => {
  const { player1Id, player2Id, round = 1 } = req.body;
  
  if (!player1Id || !player2Id) {
    return res.status(400).json({ error: 'Both player IDs are required' });
  }
  
  // Update players status if status column exists
  db.all("PRAGMA table_info(players)", (err, columns) => {
    if (err) {
      console.error('Error checking players table:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const hasStatusColumn = columns.some(col => col.name === 'status');
    
    // Create the match
    db.run(
      'INSERT INTO matches (player_id, matched_player_id, round) VALUES (?, ?, ?)',
      [player1Id, player2Id, round],
      function(err) {
        if (err) {
          console.error('Error creating match:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (hasStatusColumn) {
          db.run('UPDATE players SET status = "matched" WHERE id IN (?, ?)', 
            [player1Id, player2Id]);
        }
        
        res.status(201).json({ 
          id: this.lastID,
          player1Id,
          player2Id,
          round,
          message: 'Match created successfully'
        });
      }
    );
  });
});

// Add a catch-all route handler for debugging
app.use((req, res, next) => {
  console.log(`[404]: Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found', path: req.path });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
