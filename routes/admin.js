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
  
  console.log(`[ADMIN LOGIN]: Attempting login for username: ${username}`);

  if (!username || !password) {
    console.error('[ADMIN LOGIN]: Missing username or password');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM admins WHERE username = ?',
    [username],
    (err, admin) => {
      if (err) {
        console.error('[ADMIN LOGIN]: Database error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        console.error('[ADMIN LOGIN]: Admin not found for username:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log(`[ADMIN LOGIN]: Found admin record for ${username}`);
      console.log(`[ADMIN LOGIN]: Stored password hash: ${admin.password}`);
      
      // Compare the provided password with the stored hash
      bcrypt.compare(password, admin.password, (err, match) => {
        if (err) {
          console.error('[ADMIN LOGIN]: Error during bcrypt comparison:', err.message);
          return res.status(500).json({ error: 'Error during password verification' });
        }

        console.log(`[ADMIN LOGIN]: Password match result: ${match}`);

        if (!match) {
          console.error('[ADMIN LOGIN]: Password mismatch for username:', username);
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('[ADMIN LOGIN]: Login successful for username:', username);
        res.status(200).json({ message: 'Login successful' });
      });
    }
  );
});

// Get player statistics
router.get('/admin/player-stats', (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN playerType = 'stationary' THEN 1 ELSE 0 END) as stationary,
      SUM(CASE WHEN playerType = 'moving' THEN 1 ELSE 0 END) as moving,
      SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) as matched,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available
    FROM players`,
    (err, stats) => {
      if (err) {
        console.error('Database error fetching player stats:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json(stats);
    }
  );
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

// Start game
router.post('/admin/start-game', (req, res) => {
  // In a real app, you might update a game_state table or broadcast to connected clients
  res.status(200).json({ message: 'Game started successfully' });
});

// Stop game
router.post('/admin/stop-game', (req, res) => {
  // In a real app, you might update a game_state table or broadcast to connected clients
  res.status(200).json({ message: 'Game stopped successfully' });
});

// Next round
router.post('/admin/next-round', (req, res) => {
  // In a real app, you might update rounds in the database and notify clients
  res.status(200).json({ message: 'Advanced to next round' });
});

module.exports = router;
