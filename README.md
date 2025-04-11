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

5. **Rating System** (Future Scope):
   - Players can rate their interactions based on enjoyment, depth, and willingness to chat again.

---

## Directory Structure

```
speed-friending/
├── database/
│   ├── schema.sql                # SQLite database schema
├── public/
│   ├── index.html                # Entry point for the React app
├── src/
│   ├── components/
│   │   ├── MovingParticipant.jsx # Component for moving participants
│   │   ├── StationaryParticipant.jsx # Component for stationary participants
│   ├── pages/
│   │   ├── Home.jsx              # Landing page with player registration
│   │   ├── PostRegistration.jsx  # Page for player type selection
│   │   ├── Matching.jsx          # Page for matching and conversation flow
│   ├── styles.css                # Global styles for the app
│   ├── index.js                  # React app entry point
├── .env                          # Environment variables
├── .gitignore                    # Files to ignore in Git
├── package.json                  # Project dependencies and scripts
├── server.js                     # Express server for backend APIs
```

---

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

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

4. Configure environment variables:
   - Create a `.env` file in the root directory:
     ```plaintext
      DATABASE_URL=./speed-friending.sqlite
      PORT=5000
      FRONTEND_URL=http://localhost:3000
      REACT_APP_BACKEND_URL=http://localhost:5000

     ```

5. Start the backend server:
   ```bash
   node server.js
   ```

6. Start the frontend development server:
   ```bash
   npm start
   ```

7. Open the app in your browser:
   ```
   http://localhost:3000
   ```

---

## Features

- **Dynamic Matching**: Players are matched randomly while avoiding immediate re-matches.
- **Conversation Timer**: Each interaction is time-limited to ensure quick and engaging conversations.
- **Player Roles**: Players can choose to be stationary or moving participants.
- **Rating System**: After each interaction, players can rate their experience based on enjoyment, depth, and willingness to chat again.
- **Database Integration**: Player data, matches, and ratings are stored in an SQLite database.

---

## Future Enhancements

- **Rating System**: Allow players to rate their interactions.
- **Admin Dashboard**: Provide an interface for managing players and matches.
- **Analytics**: Track player engagement and interaction statistics.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgments

- **React**: For building the frontend.
- **Express**: For creating the backend APIs.
- **SQLite**: For lightweight database management.