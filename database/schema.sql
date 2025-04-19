CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT,
    interests TEXT,
    preferences TEXT,
    playerType TEXT NOT NULL, -- Column to differentiate between stationary and moving players
    tableNumber TEXT, -- Column to store the table number for stationary players
    status TEXT DEFAULT 'available', -- Column to track player availability (e.g., 'available', 'matched')
    interaction_count INTEGER DEFAULT 0 -- Column to track the number of interactions
);

-- Indexes for faster player lookups and matching
CREATE INDEX IF NOT EXISTS idx_playerType ON players (playerType);
CREATE INDEX IF NOT EXISTS idx_status ON players (status);
CREATE INDEX IF NOT EXISTS idx_player_type_status ON players (playerType, status); -- New index for faster queries

CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL, -- The player giving the rating
    rated_player_id INTEGER NOT NULL, -- The player being rated
    enjoyment REAL, -- Rating for enjoyment (e.g., 4.5)
    depth REAL, -- Rating for depth of conversation (e.g., 3.5)
    would_chat_again BOOLEAN, -- Whether the player would chat again (1 = yes, 0 = no)
    round INTEGER NOT NULL DEFAULT 1, -- The round in which the rating was given
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (rated_player_id) REFERENCES players(id)
);

-- Index for faster rating lookups by round and player pairs
CREATE INDEX IF NOT EXISTS idx_ratings_players ON ratings (player_id, rated_player_id);
CREATE INDEX IF NOT EXISTS idx_ratings_round ON ratings (round);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    matched_player_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    rated INTEGER DEFAULT 0, -- Flag to indicate if this match has been rated (0=no, 1=yes)
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (matched_player_id) REFERENCES players(id)
);

-- Indexes for faster match lookups and to avoid immediate rematches
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches (round);
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches (player_id, matched_player_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_round ON matches (player_id, round);
CREATE INDEX IF NOT EXISTS idx_matches_matched_round ON matches (matched_player_id, round);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Create a default admin user if none exists
INSERT OR IGNORE INTO admins (username, password) 
VALUES ('admin', '$2b$10$yVlq.b5yW7r9kAJ9oIQfBeY4WV3YFdMc0GwluM1PxoLUD9UMVwn2O');
-- This is bcrypt hash for 'password' - change in production!

CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    compatibility_score REAL,
    battle_score INTEGER DEFAULT 0,
    FOREIGN KEY (player1_id) REFERENCES players(id),
    FOREIGN KEY (player2_id) REFERENCES players(id)
);

-- Index for faster team lookups by round
CREATE INDEX IF NOT EXISTS idx_teams_round ON teams (round);
CREATE INDEX IF NOT EXISTS idx_teams_players ON teams (player1_id, player2_id);

CREATE TABLE IF NOT EXISTS team_battles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team1_id INTEGER NOT NULL,
    team2_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    winner_id INTEGER,
    battle_type TEXT,
    FOREIGN KEY (team1_id) REFERENCES teams(id),
    FOREIGN KEY (team2_id) REFERENCES teams(id),
    FOREIGN KEY (winner_id) REFERENCES teams(id)
);

-- Create game_state table to track game status and current round
CREATE TABLE IF NOT EXISTS game_state (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensures only one game state record
    status TEXT NOT NULL DEFAULT 'stopped', -- 'running' or 'stopped'
    current_round INTEGER NOT NULL DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default game state if none exists
INSERT OR IGNORE INTO game_state (id, status, current_round) 
VALUES (1, 'stopped', 1);
