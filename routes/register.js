const express = require('express');
const router = express.Router();
const db = require('../database'); // Import the database connection

router.post('/register', (req, res) => {
  console.log('Incoming registration request:', req.body);

  const { name, gender, interests, preferences, playerType, tableNumber } = req.body;

  if (!name || name.trim() === '' || name === 'mm') {
    console.error('Validation error: Valid name is required');
    return res.status(400).json({ error: 'A valid name is required' });
  }

  // Clean the name - trim whitespace
  const cleanName = name.trim();

  db.run(
    'INSERT INTO players (name, gender, interests, preferences, playerType, tableNumber, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [cleanName, gender, interests, preferences, playerType, tableNumber, 'available'],
    function (err) {
      if (err) {
        console.error('Database error during registration:', err.message);
        return res.status(500).json({ error: 'Failed to register player', details: err.message });
      }
      console.log('Player registered successfully with ID:', this.lastID);
      res.status(200).json({ id: this.lastID, name: cleanName });
    }
  );
});

module.exports = router;
