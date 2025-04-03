CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT,
    interests TEXT,
    preferences TEXT
);

CREATE TABLE ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    rated_player_id INTEGER NOT NULL,
    enjoyment INTEGER,
    depth INTEGER,
    would_chat_again BOOLEAN,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (rated_player_id) REFERENCES players(id)
);

CREATE TABLE matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    matched_player_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (matched_player_id) REFERENCES players(id)
);
