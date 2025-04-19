const express = require('express');
const router = express.Router();
const db = require('../database'); // Import the database connection

router.post('/register', (req, res) => {
  console.log('Incoming registration request:', req.body);

  const { name, gender, interests, preferences, playerType, tableNumber } = req.body;

  if (!name) {
    console.error('Validation error: Name is required');
    return res.status(400).json({ error: 'Name is required' });
  }

  db.run(
    'INSERT INTO players (name, gender, interests, preferences, playerType, tableNumber) VALUES (?, ?, ?, ?, ?, ?)',
    [name, gender, interests, preferences, playerType, tableNumber],
    function (err) {
      if (err) {
        console.error('Database error during registration:', err.message);
        return res.status(500).json({ error: 'Failed to register player', details: err.message });
      }
      console.log('Player registered successfully with ID:', this.lastID);
      res.status(200).json({ id: this.lastID });
    }
  );
});

router.post('/register', (req, res) => {
  const { playerType } = req.body;

  if (!playerType) {
    return res.status(400).json({ error: 'Player type is required' });
  }

  db.run(
    `INSERT INTO players (playerType, status) VALUES (?, 'available')`,
    [playerType],
    function(err) {
      if (err) {
        console.error('[REGISTER]: Error registering player:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({ playerId: this.lastID });
    }
  );
});

module.exports = router;
