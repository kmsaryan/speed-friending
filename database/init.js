// This script initializes the SQLite database for the speed friending app.
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./speed_friending.db');

const schema = fs.readFileSync('./database/schema.sql', 'utf-8');

db.exec(schema, (err) => {
    if (err) {
        console.error('Error initializing database:', err.message);
    } else {
        console.log('Database initialized successfully.');
        
        db.get(`SELECT COUNT(*) AS count FROM GameConfig`, (err, row) => {
            if (err) {
                console.error('Error checking GameConfig:', err.message);
            } else if (row.count === 0) {
                db.run(
                    `INSERT INTO GameConfig (round_time, themes) VALUES (5, 'Casual Talk,Deep Discussions,Humor,Debate')`,
                    (err) => {
                        if (err) console.error('Error inserting default GameConfig:', err.message);
                        else console.log('Default GameConfig inserted.');
                    }
                );
            }
        });
    }
    db.close();
});
