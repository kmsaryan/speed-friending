# Speed Friending Game

Speed Friending is a structured social interaction game where players are matched randomly to engage in short conversations, fostering new connections in a dynamic, gamified format. This project implements the game using React for the frontend, Express for the backend, and SQLite for the database.

---

## Game Concept

1. **Player Registration**:
   - Players register by providing their name, gender (optional), interests, and conversation preferences.
   - The data is stored in the SQLite database.

2. **Player Type Selection**:
   - After registration, players select their type:
     - **Stationary Participant**: Remains at a table and interacts with moving participants.
     - **Moving Participant**: Moves between tables to interact with stationary participants.

3. **Matching Process**:
   - Players are dynamically matched with others based on their type.
   - The system ensures diversity and avoids immediate re-matches.

4. **Conversation Timer**:
   - Each round has a fixed time limit (e.g., 3 minutes).
   - Players interact during this time, after which the next match is fetched.

5. **Rating System**:
   - Players can rate their interactions based on enjoyment, depth, and willingness to chat again.

6. **Admin Dashboard**:
   - Admins can manage the game, view player statistics, track live matches, and clear data.

---

## Directory Structure

```
speed-friending/
├── database/
│   ├── schema.sql                # SQLite database schema
│   ├── migrate.js                # Migration script for database updates
├── public/
│   ├── index.html                # Entry point for the React app
├── src/
│   ├── admin/
│   │   ├── components/           # Admin dashboard components
│   │   ├── services/             # Admin API service
│   │   ├── styles/               # Admin-specific styles
│   ├── asserts/                  # SVG assets for icons
│   ├── components/               # Shared components
│   ├── pages/                    # Main pages of the app
│   ├── styles/                   # Global and component-specific styles
│   ├── utils/                    # Utility functions (e.g., socket connection)
├── tools/
│   ├── create-admin.js           # Script to create admin users
├── server.js                     # Express server for backend APIs
├── socketServer.js               # Socket.IO server for real-time features
├── package.json                  # Project dependencies and scripts
├── README.md                     # Project documentation
```

---

## Features

### Player Features
- **Dynamic Matching**: Players are matched randomly while avoiding immediate re-matches.
- **Conversation Timer**: Each interaction is time-limited to ensure quick and engaging conversations.
- **Player Roles**: Players can choose to be stationary or moving participants.
- **Rating System**: After each interaction, players can rate their experience based on enjoyment, depth, and willingness to chat again.

### Admin Features
- **Game Control**: Start, stop, and advance game rounds.
- **Player Statistics**: View statistics such as total players, matched players, and available players.
- **Live Match Tracking**: Monitor ongoing matches in real-time.
- **Data Management**: Clear player, match, and rating data as needed.

### Real-Time Features
- **Socket.IO Integration**: Enables real-time updates for matches, timer synchronization, and game status changes.

---

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- SQLite

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd speed-friending
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   - Ensure SQLite is installed.
   - Run the schema file to create the database:
     ```bash
     sqlite3 speed-friending.sqlite < database/schema.sql
     ```

4. Run the migration script:
   ```bash
   npm run migrate
   ```

5. Create an admin user:
   ```bash
   node tools/create-admin.js
   ```

6. Configure environment variables:
   - Create a `.env` file in the root directory:
     ```plaintext
     DATABASE_URL=./speed-friending.sqlite
     PORT=5000
     FRONTEND_URL=http://localhost:3000
     REACT_APP_BACKEND_URL=http://localhost:5000
     ```

7. Start the backend server:
   ```bash
   npm run server
   ```

8. Start the frontend development server:
   ```bash
   npm start
   ```

9. Open the app in your browser:
   ```
   http://localhost:3000
   ```

---

## Database Schema and Management

### Tables
- **`players`**:
  - Stores player details (name, gender, interests, preferences, type, table number, status).
- **`ratings`**:
  - Stores ratings submitted by players after interactions.
- **`matches`**:
  - Tracks matches between players to avoid immediate re-matches.
- **`admins`**:
  - Stores admin credentials (username and hashed password).
- **`teams`**:
  - Stores team information for team battles.
- **`game_state`**:
  - Tracks the current game status and round.
  
### **Initialize the Database**
Run the following command to initialize the database using the schema:
```bash
sqlite3 speed-friending.sqlite < database/schema.sql
```

### **Basic Database Operations**

1. **Open the Database**:
   ```bash
   sqlite3 speed-friending.sqlite
   ```

2. **View All Tables**:
   Inside the SQLite CLI, run:
   ```sql
   .tables
   ```

3. **View the Structure of a Table**:
   To view the structure of the `players` table:
   ```sql
   PRAGMA table_info(players);
   ```

4. **View All Entries in a Table**:
   To view all entries in the `players` table:
   ```sql
   SELECT * FROM players;
   ```

5. **Clear All Entries in a Table**:
   To delete all entries from the `players` table:
   ```sql
   DELETE FROM players;
   ```

6. **Exit the SQLite CLI**:
   To exit the SQLite CLI:
   ```bash
   .exit
   ```
---

## Future Enhancements

- **Analytics**: Add detailed analytics to track player engagement and interaction statistics.
- **Enhanced Matching**: Improve the matching algorithm to consider player preferences and ratings.
- **Mobile Support**: Optimize the UI for mobile devices.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgments

- **React**: For building the frontend.
- **Express**: For creating the backend APIs.
- **SQLite**: For lightweight database management.
- **Socket.IO**: For enabling real-time communication.