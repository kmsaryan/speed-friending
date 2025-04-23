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

// More robust CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, new RegExp(`^https?://${process.env.RENDER_EXTERNAL_HOSTNAME}`)]
    : process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));

// Add debugging for routes registration
console.log('Registering API routes...');

// Import modular routes
const registerRoutes = require('./routes/register');
const matchRoutes = require('./routes/match');
const ratingsRoutes = require('./routes/ratings');
const teamsRoutes = require('./routes/teams');
const battlesRoutes = require('./routes/battles'); 
const teamBattlesRoutes = require('./routes/teamBattles');
const playerCountRoutes = require('./routes/playerCount');
const adminRoutes = require('./routes/admin');
const playerRoutes = require('./routes/player'); // Import playerRoutes

// Print available routes for debugging
console.log('Available admin routes:');
adminRoutes.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(`Route: ${r.route.path}`);
  }
});

console.log('Available battle routes:');
battlesRoutes.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(`Route: ${r.route.path}`);
  }
});

console.log('Available team battle routes:');
teamBattlesRoutes.stack.forEach(r => {
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
app.use('/api', teamBattlesRoutes);
app.use('/api', playerCountRoutes);
app.use('/api', adminRoutes); // This registers all admin routes
app.use('/api', playerRoutes); // Use playerRoutes

// Register reset-round route directly to ensure it works
app.post('/api/admin/reset-round', (req, res, next) => {
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

// Replace with this enhanced static file and route handling section
// This should be placed before any catch-all or 404 handlers
console.log('Setting up static file serving and client-side routing...');

// First serve static files
const buildPath = path.join(__dirname, 'build');
const publicPath = path.join(__dirname, 'public');

// Set cache control for static assets
const staticOptions = {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Cache for 1 day except for index.html
    if (filePath.endsWith('index.html')) {
      // Don't cache HTML
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      // Cache assets for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
};

// Serve static files with proper caching
if (fs.existsSync(buildPath)) {
  console.log(`Found build directory at ${buildPath}`);
  app.use(express.static(buildPath, staticOptions));
} else {
  console.warn(`Build directory not found at ${buildPath}`);
  // Try serving from public directory as fallback
  if (fs.existsSync(publicPath)) {
    console.log(`Serving from public directory at ${publicPath}`);
    app.use(express.static(publicPath, staticOptions));
  } else {
    console.warn('Public directory also not found');
  }
}

// Then add the catch-all route for client-side routing
app.get('*', (req, res, next) => {
  // Skip API and WebSocket routes
  if (req.url.startsWith('/api/') || req.url.startsWith('/socket.io/')) {
    console.log(`[SERVER]: API/WebSocket route: ${req.method} ${req.path}`);
    return next();
  }
  
  console.log(`[SERVER]: Serving React app for: ${req.method} ${req.path}`);
  
  // Try the build directory first
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // Fall back to public directory if build doesn't exist
  const publicIndexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  }
  
  // If no index.html found anywhere, send a simple message
  console.error(`[SERVER]: No index.html found in build or public directories`);
  res.status(404).send('Frontend not built. Index.html not found.');
});

// This should now be the only catch-all for API routes
app.use((req, res) => {
  console.log(`[404]: Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[ERROR]: ${message}`);
  console.error(err.stack);
  
  // Don't expose stack trace in production
  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

// Handle process events for more graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    
    // Close database connection
    if (db) {
      db.close();
    }
  });
});

process.on('uncaughtException', (err) => {
  console.error('[SERVER]: Uncaught exception:', err);
  if (db) db.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER]: Unhandled rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
