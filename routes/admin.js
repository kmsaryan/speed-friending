const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcrypt');

// Admin Registration
router.post('/admin/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('[ADMIN REGISTER]: Received request with body:', { username, hasPassword: !!password });

  if (!username || !password) {
    console.error('[ADMIN REGISTER]: Missing username or password');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check if username already exists
    db.get('SELECT username FROM admins WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('[ADMIN REGISTER]: Database error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        console.error('[ADMIN REGISTER]: Username already exists:', username);
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(`[ADMIN REGISTER]: Generated hash for ${username}:`, hashedPassword);

      // Insert the new admin into the database
      db.run(
        'INSERT INTO admins (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function (err) {
          if (err) {
            console.error('[ADMIN REGISTER]: Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
          }

          console.log('[ADMIN REGISTER]: Admin registered successfully with ID:', this.lastID);
          res.status(201).json({ message: 'Admin registered successfully' });
        }
      );
    });
  } catch (error) {
    console.error('[ADMIN REGISTER]: Error hashing password:', error.message);
    res.status(500).json({ error: 'Error registering admin' });
  }
});

// Admin Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, admin.password, (err, match) => {
      if (err) return res.status(500).json({ error: 'Error during password verification' });
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      res.status(200).json({ message: 'Login successful' });
    });
  });
});

// Get player statistics
router.get('/admin/player-stats', (req, res) => {
  // First check if status column exists
  db.all("PRAGMA table_info(players)", (err, columns) => {
    if (err) {
      console.error('Error checking table columns:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const hasStatusColumn = columns.some(col => col.name === 'status');
    console.log(`Status column exists: ${hasStatusColumn}`);
    
    // Use a query that works with or without the status column
    const query = hasStatusColumn ? 
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN playerType = 'stationary' THEN 1 ELSE 0 END) as stationary,
         SUM(CASE WHEN playerType = 'moving' THEN 1 ELSE 0 END) as moving,
         SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) as matched,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available
       FROM players` :
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN playerType = 'stationary' THEN 1 ELSE 0 END) as stationary,
         SUM(CASE WHEN playerType = 'moving' THEN 1 ELSE 0 END) as moving,
         0 as matched,
         COUNT(*) as available
       FROM players`;
    
    db.get(query, (err, stats) => {
      if (err) {
        console.error('[Admin] Database error fetching player stats:', err.message); // Add logging
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('[Admin] Player stats fetched:', stats); // Add logging
      res.status(200).json(stats || { total: 0, stationary: 0, moving: 0, matched: 0, available: 0 });
    });
  });
});

// Get all ratings
router.get('/admin/ratings', (req, res) => {
  db.all(
    `SELECT * FROM ratings`,
    (err, ratings) => {
      if (err) {
        console.error('Database error fetching ratings:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json(ratings);
    }
  );
});

// Get all players
router.get('/admin/players', (req, res) => {
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

// Delete a player
router.delete('/admin/players/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Player ID is required' });
  }

  db.get('SELECT * FROM players WHERE id = ?', [id], (err, player) => {
    if (err) {
      console.error('[ADMIN]: Error checking player:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Delete player's matches
    db.run(
      'DELETE FROM matches WHERE player_id = ? OR matched_player_id = ?',
      [id, id],
      (err) => {
        if (err) {
          console.error('[ADMIN]: Error deleting player matches:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }

        // Delete player's ratings
        db.run(
          'DELETE FROM ratings WHERE player_id = ? OR rated_player_id = ?',
          [id, id],
          (err) => {
            if (err) {
              console.error('[ADMIN]: Error deleting player ratings:', err.message);
              return res.status(500).json({ error: 'Database error' });
            }

            // Finally, delete the player
            db.run('DELETE FROM players WHERE id = ?', [id], function(err) {
              if (err) {
                console.error('[ADMIN]: Error deleting player:', err.message);
                return res.status(500).json({ error: 'Database error' });
              }

              console.log(`[ADMIN]: Player with ID ${id} deleted successfully`);
              res.status(200).json({ message: 'Player deleted successfully' });

              // Notify clients about player deletion if Socket.IO is initialized
              if (global.io) {
                global.io.emit('player_deleted', { playerId: id });
              }
            });
          }
        );
      }
    );
  });
});

// Update a player
router.put('/admin/players/:id', (req, res) => {
  const { id } = req.params;
  const { name, gender, interests, preferences, playerType, tableNumber } = req.body;

  if (!id || !name || !playerType) {
    return res.status(400).json({ error: 'Player ID, name, and type are required' });
  }

  db.get('SELECT * FROM players WHERE id = ?', [id], (err, player) => {
    if (err) {
      console.error('[ADMIN]: Error checking player:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update the player
    db.run(
      `UPDATE players 
       SET name = ?, gender = ?, interests = ?, preferences = ?, playerType = ?, tableNumber = ? 
       WHERE id = ?`,
      [name, gender, interests, preferences, playerType, tableNumber, id],
      function(err) {
        if (err) {
          console.error('[ADMIN]: Error updating player:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }

        console.log(`[ADMIN]: Player with ID ${id} updated successfully`);
        res.status(200).json({
          message: 'Player updated successfully',
          player: {
            id,
            name,
            gender,
            interests,
            preferences,
            playerType,
            tableNumber
          }
        });

        // Notify clients about player update if Socket.IO is initialized
        if (global.io) {
          global.io.emit('player_updated', {
            playerId: id,
            playerData: {
              name,
              gender,
              interests,
              preferences,
              playerType,
              tableNumber
            }
          });
        }
      }
    );
  });
});

// Clear all data
router.post('/admin/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM ratings');
    db.run('DELETE FROM matches');
    db.run('DELETE FROM players');
    db.run('UPDATE sqlite_sequence SET seq = 0 WHERE name IN ("players", "matches", "ratings")');
  }, (err) => {
    if (err) {
      console.error('Error clearing database:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'All data cleared successfully' });
  });
});

// Clear only player data
router.post('/admin/clear-players', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM ratings');
    db.run('DELETE FROM matches');
    db.run('DELETE FROM players');
    db.run('UPDATE sqlite_sequence SET seq = 0 WHERE name IN ("players", "matches", "ratings")');
  }, (err) => {
    if (err) {
      console.error('Error clearing player data:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Player data cleared successfully' });
  });
});

// Clear only match data
router.post('/admin/clear-matches', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM matches');
    db.run('UPDATE players SET status = "available"');
    db.run('UPDATE sqlite_sequence SET seq = 0 WHERE name = "matches"');
  }, (err) => {
    if (err) {
      console.error('Error clearing match data:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Match data cleared successfully' });
  });
});

// Clear only rating data
router.post('/admin/clear-ratings', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM ratings');
    db.run('UPDATE sqlite_sequence SET seq = 0 WHERE name = "ratings"');
  }, (err) => {
    if (err) {
      console.error('Error clearing rating data:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Rating data cleared successfully' });
  });
});

// Get game status
router.get('/admin/game-status', (req, res) => {
  // First check if game_state table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='game_state'", (err, table) => {
    if (err) {
      console.error('[ADMIN]: Error checking for game_state table:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!table) {
      console.log('[ADMIN]: Creating game_state table');
      // Create the game_state table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          status TEXT NOT NULL DEFAULT 'stopped',
          current_round INTEGER NOT NULL DEFAULT 1,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, function(err) {
        if (err) {
          console.error('[ADMIN]: Error creating game_state table:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Insert default values
        db.run(
          'INSERT OR IGNORE INTO game_state (id, status, current_round) VALUES (1, ?, ?)',
          ['stopped', 1],
          function(err) {
            if (err) {
              console.error('[ADMIN]: Error inserting default game state:', err.message);
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Return default state
            res.status(200).json({ status: 'stopped', round: 1 });
          }
        );
      });
      return;
    }
    
    // Get the current game status
    db.get('SELECT status, current_round FROM game_state WHERE id = 1', [], (err, state) => {
      if (err) {
        console.error('[ADMIN]: Error getting game status:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!state) {
        // Initialize default state if missing
        return res.status(200).json({ status: 'stopped', round: 1 });
      }
      
      console.log('[ADMIN]: Retrieved game status:', state);
      res.status(200).json({
        status: state.status,
        round: state.current_round
      });
    });
  });
});

// Start game
router.post('/admin/start-game', (req, res) => {
  // Handle missing round parameter with default value of 1
  const round = parseInt(req.body.round, 10) || 1;
  
  // Create the game_state table if it doesn't exist and update it
  db.run(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status TEXT NOT NULL DEFAULT 'stopped',
      current_round INTEGER NOT NULL DEFAULT 1,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, function(err) {
    if (err) {
      console.error('[ADMIN]: Error creating game_state table:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Insert or update the game state
    db.run(
      'INSERT OR REPLACE INTO game_state (id, status, current_round, last_updated) VALUES (1, ?, ?, CURRENT_TIMESTAMP)',
      ['running', round],
      function(err) {
        if (err) {
          console.error('[ADMIN]: Error starting game:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('[ADMIN]: Game started successfully. Round:', round);
        
        // Broadcast to all connected clients that the game has started
        if (global.io) {
          console.log('[ADMIN]: Broadcasting game start to all clients');
          global.io.emit('game_status_change', { status: 'running', round });
        } else {
          console.log('[ADMIN]: Socket.io not initialized, unable to broadcast');
        }
        
        res.status(200).json({ message: 'Game started successfully', status: 'running', round });
      }
    );
  });
});

// Stop game
router.post('/admin/stop-game', (req, res) => {
  // Create the game_state table if it doesn't exist and update it
  db.run(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status TEXT NOT NULL DEFAULT 'stopped',
      current_round INTEGER NOT NULL DEFAULT 1,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, function(err) {
    if (err) {
      console.error('[ADMIN]: Error creating game_state table:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Insert or update the game state
    db.run(
      'INSERT OR REPLACE INTO game_state (id, status, last_updated) VALUES (1, ?, CURRENT_TIMESTAMP)',
      ['stopped'],
      function(err) {
        if (err) {
          console.error('[ADMIN]: Error stopping game:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('[ADMIN]: Game stopped successfully');
        
        // Broadcast to all connected clients that the game has stopped
        if (global.io) {
          console.log('[ADMIN]: Broadcasting game stop to all clients');
          global.io.emit('game_status_change', { status: 'stopped' });
        } else {
          console.log('[ADMIN]: Socket.io not initialized, unable to broadcast');
        }
        
        res.status(200).json({ message: 'Game stopped successfully', status: 'stopped' });
      }
    );
  });
});

// Next round
router.post('/admin/next-round', (req, res) => {
  // Get current round first
  db.get('SELECT current_round FROM game_state WHERE id = 1', [], (err, state) => {
    if (err) {
      console.error('[ADMIN]: Error getting current round:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const currentRound = state ? state.current_round : 1;
    const nextRound = currentRound + 1;
    
    // Update the round
    db.run(
      'UPDATE game_state SET current_round = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1',
      [nextRound],
      function(err) {
        if (err) {
          console.error('[ADMIN]: Error advancing round:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('[ADMIN]: Advanced to round:', nextRound);
        
        // Broadcast to all connected clients that the round has changed
        if (global.io) {
          console.log('[ADMIN]: Broadcasting round change to all clients');
          global.io.emit('game_status_change', { round: nextRound });
        } else {
          console.log('[ADMIN]: Socket.io not initialized, unable to broadcast');
        }
        
        res.status(200).json({ 
          message: `Advanced to round ${nextRound}`, 
          round: nextRound 
        });
      }
    );
  });
});

// Reset round
router.post('/admin/reset-round', (req, res) => {
  console.log('[ADMIN RESET]: Route accessed successfully');
  
  // Reset the round to 1
  db.run(
    'UPDATE game_state SET current_round = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1',
    [1],
    function(err) {
      if (err) {
        console.error('[ADMIN RESET]: Error resetting round:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('[ADMIN RESET]: Round reset to 1');
      
      // Broadcast to all connected clients that the round has been reset
      if (global.io) {
        global.io.emit('game_status_change', { round: 1, message: 'Round has been reset to 1' });
      }
      
      res.status(200).json({ message: 'Round reset to 1', round: 1 });
    }
  );
});

// Get match history for a specific player
router.get('/admin/player-matches/:playerId', (req, res) => {
  const { playerId } = req.params;
  const { round } = req.query;
  
  let query = `
    SELECT m.*, 
           p1.name as player1_name, p1.playerType as player1_type,
           p2.name as player2_name, p2.playerType as player2_type
    FROM matches m
    JOIN players p1 ON m.player_id = p1.id
    JOIN players p2 ON m.matched_player_id = p2.id
    WHERE (m.player_id = ? OR m.matched_player_id = ?)
  `;
  
  const params = [playerId, playerId];
  
  if (round) {
    query += ' AND m.round = ?';
    params.push(round);
  }
  
  query += ' ORDER BY m.id DESC';
  
  db.all(query, params, (err, matches) => {
    if (err) {
      console.error('Database error fetching player matches:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(200).json(matches);
  });
});

// Get all players with their match counts
router.get('/admin/players-with-match-counts', (req, res) => {
  db.all(
    `SELECT p.*,
            (SELECT COUNT(*) FROM matches m 
             WHERE m.player_id = p.id OR m.matched_player_id = p.id) as match_count
     FROM players p
     ORDER BY match_count DESC, p.id ASC`,
    (err, players) => {
      if (err) {
        console.error('Database error fetching players with match counts:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(200).json(players);
    }
  );
});

module.exports = router;
