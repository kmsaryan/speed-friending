//server.js
//Description: This code sets up an Express server with modular routes for a matchmaking application. It includes endpoints for player registration, fetching matches, submitting ratings, team formation, and admin functionalities. The server handles errors gracefully and provides JSON responses for better client-side handling.
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const db = require('./database'); // Add this import for database

dotenv.config();

// Make sure the database directory exists before migration
const dbDir = path.dirname(process.env.DATABASE_URL || './speed-friending.sqlite');
if (!dbDir.startsWith('/')) {
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    } catch (err) {
      console.error(`Error creating database directory: ${err.message}`);
    }
  }
}

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

const { initializeSocketServer } = require('./socketServer');

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
const playerRoutes = require('./routes/player');

// Explicitly check for reset-round route and log result
console.log('Checking admin routes for reset-round:');
const hasResetRoute = adminRoutes.stack && adminRoutes.stack.some(
  r => r.route && r.route.path && r.route.path.includes('reset-round')
);
console.log(`Reset route exists in admin routes: ${hasResetRoute ? 'Yes' : 'No'}`);

// Use modular routes
app.use('/api', registerRoutes);
app.use('/api', matchRoutes);
app.use('/api', ratingsRoutes);
app.use('/api', teamsRoutes);
app.use('/api', battlesRoutes); 
app.use('/api', playerCountRoutes);
app.use('/api', adminRoutes); // This registers all admin routes
app.use('/api', playerRoutes);

// Register reset-round route directly to ensure it works
app.post('/api/admin/reset-round', (req, res) => {
  console.log('[SERVER]: Direct reset-round route called');
  
  // Forward to the handler in admin routes if it exists
  if (hasResetRoute) {
    console.log('[SERVER]: Forwarding to admin route handler');
    // Let the request continue to be handled by adminRoutes
    return next();
  }
  
  // Fallback implementation if the admin route is not properly registered
  db.run(
    'UPDATE game_state SET current_round = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1',
    [1],
    function(err) {
      if (err) {
        console.error('[SERVER]: Error resetting round:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('[SERVER]: Round reset to 1 via fallback handler');
      
      // Update players' round if player table has a current_round column
      db.all("PRAGMA table_info(players)", (err, columns) => {
        if (!err) {
          const hasRoundColumn = columns.some(col => col.name === 'current_round');
          if (hasRoundColumn) {
            db.run('UPDATE players SET current_round = ? WHERE 1=1', [1], (err) => {
              if (err) {
                console.error('[SERVER]: Error updating player rounds:', err.message);
              } else {
                console.log('[SERVER]: Updated players to round 1');
              }
            });
          }
        }
      });
      
      // Broadcast to all connected clients that the round has been reset
      if (global.io) {
        console.log('[SERVER]: Broadcasting round reset to all clients');
        global.io.emit('game_status_change', { 
          round: 1,
          message: 'Round has been reset to 1' 
        });
        
        global.io.emit('round_reset', { round: 1 });
      }
      
      res.status(200).json({ 
        message: 'Round reset to 1', 
        round: 1 
      });
    }
  );
});

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

// Add this section before the last app.use() (the 404 handler)
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode - serving static files');
  
  // Check if build directory exists
  try {
    const buildPath = path.join(__dirname, 'build');
    if (fs.existsSync(buildPath)) {
      console.log(`Found build directory at ${buildPath}`);
      
      // Serve static files from the React build folder
      app.use(express.static(buildPath));
      
      // Serve the React app for all other routes
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.url.startsWith('/api/') || req.url.startsWith('/socket.io/')) {
          return next();
        }
        
        const indexPath = path.join(buildPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error(`Index file not found at ${indexPath}`);
          res.status(404).send('Frontend not built. Index.html not found.');
        }
      });
    } else {
      console.warn(`Build directory not found at ${buildPath}`);
      
      // Try serving from public directory as fallback
      const publicPath = path.join(__dirname, 'public');
      if (fs.existsSync(publicPath)) {
        console.log(`Serving from public directory at ${publicPath}`);
        app.use(express.static(publicPath));
      } else {
        console.warn('Public directory also not found');
      }
    }
  } catch (err) {
    console.error('Error setting up static file serving:', err);
  }
}

// Add more debug logging for routes
app.use((req, res, next) => {
  const route = `${req.method} ${req.path}`;
  console.log(`[SERVER]: Route accessed: ${route}`);
  next();
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
