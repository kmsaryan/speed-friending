-- This SQL script creates the necessary tables for the matchmaking game database.
-- It includes tables for players, matches, ratings, and game configuration.
-- Each table has its own primary key and necessary foreign keys to maintain relationships between them.
CREATE TABLE Players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT,
    interests TEXT,
    preferences TEXT
);

CREATE TABLE Matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    UNIQUE(player1_id, player2_id, round),
    FOREIGN KEY(player1_id) REFERENCES Players(id),
    FOREIGN KEY(player2_id) REFERENCES Players(id)
);

CREATE TABLE Ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    rater_id INTEGER NOT NULL,
    ratee_id INTEGER NOT NULL,
    enjoyment INTEGER NOT NULL,
    depth INTEGER NOT NULL,
    would_chat_again BOOLEAN NOT NULL,
    FOREIGN KEY(match_id) REFERENCES Matches(id),
    FOREIGN KEY(rater_id) REFERENCES Players(id),
    FOREIGN KEY(ratee_id) REFERENCES Players(id)
);

CREATE TABLE GameConfig (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round_time INTEGER DEFAULT 5,
    themes TEXT
);

INSERT INTO GameConfig (round_time, themes) VALUES (5, 'Casual Talk,Deep Discussions,Humor,Debate');
