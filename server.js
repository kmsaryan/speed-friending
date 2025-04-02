// This is a simple Node.js server for a speed friending application.
// It uses Express for routing and SQLite for the database.
// The server provides an API for player registration and retrieves player data.
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./speed_friending.db');

// Middleware
app.use(bodyParser.json());

// Player Registration API
app.post('/register', (req, res) => {
    const { name, gender, interests, preferences } = req.body;
    db.run(
        `INSERT INTO Players (name, gender, interests, preferences) VALUES (?, ?, ?, ?)`,
        [name, gender, interests, preferences],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ playerId: this.lastID });
        }
    );
});

// Matchmaking API
app.post('/match', (req, res) => {
    const { playerId, round } = req.body;
    db.get(
        `SELECT id FROM Players WHERE id != ? AND id NOT IN (
            SELECT player2_id FROM Matches WHERE player1_id = ? AND round = ?
        ) ORDER BY RANDOM() LIMIT 1`,
        [playerId, playerId, round],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'No available match found.' });

            const matchId = row.id;
            db.run(
                `INSERT INTO Matches (player1_id, player2_id, round) VALUES (?, ?, ?)`,
                [playerId, matchId, round],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({ matchId: this.lastID, matchedPlayerId: matchId });
                }
            );
        }
    );
});

// Rating Submission API
app.post('/rate', (req, res) => {
    const { matchId, raterId, rateeId, enjoyment, depth, wouldChatAgain } = req.body;
    db.run(
        `INSERT INTO Ratings (match_id, rater_id, ratee_id, enjoyment, depth, would_chat_again) VALUES (?, ?, ?, ?, ?, ?)`,
        [matchId, raterId, rateeId, enjoyment, depth, wouldChatAgain],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ ratingId: this.lastID });
        }
    );
});

// Game Configuration API
app.get('/config', (req, res) => {
    db.get(`SELECT round_time, themes FROM GameConfig LIMIT 1`, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(row);
    });
});

app.post('/config', (req, res) => {
    const { round_time, themes } = req.body;
    db.run(
        `UPDATE GameConfig SET round_time = ?, themes = ? WHERE id = 1`,
        [round_time, themes],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Configuration updated successfully.' });
        }
    );
});

// Start Server
const PORT = process.env.BACKEND_PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
