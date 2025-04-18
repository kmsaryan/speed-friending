CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT,
    interests TEXT,
    preferences TEXT,
    playerType TEXT NOT NULL, -- Column to differentiate between stationary and moving players
    tableNumber TEXT, -- Column to store the table number for stationary players
    status TEXT DEFAULT 'available' -- Column to track player availability (e.g., 'available', 'matched')
);

CREATE INDEX IF NOT EXISTS idx_playerType ON players (playerType);
CREATE INDEX IF NOT EXISTS idx_status ON players (status);

CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL, -- The player giving the rating
    rated_player_id INTEGER NOT NULL, -- The player being rated
    enjoyment REAL, -- Rating for enjoyment (e.g., 4.5)
    depth REAL, -- Rating for depth of conversation (e.g., 3.5)
    would_chat_again BOOLEAN, -- Whether the player would chat again (1 = yes, 0 = no)
    round INTEGER NOT NULL, -- The round in which the rating was given
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (rated_player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    matched_player_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (matched_player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);
