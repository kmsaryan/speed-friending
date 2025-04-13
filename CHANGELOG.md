# Changelog

## Initial Commit
- **Project Setup**:
  - Initialized the Speed Friending project with React for the frontend and Express for the backend.
  - Installed dependencies: `react`, `react-router-dom`, `express`, `sqlite3`, `bcrypt`, `dotenv`, and `cors`.
  - Created the basic project structure:
    - `/src` for frontend components and pages.
    - `/database` for database schema.
    - `server.js` for backend logic.

---

## Features Implemented

### Frontend
- **Home Page**:
  - Displays a welcome message and a player registration form.
- **Post-Registration Page**:
  - Allows players to select their type: `Stationary` or `Moving`.
- **Matching Page**:
  - Dynamically matches players based on their type.
  - Includes a timer for each interaction and a rating system.
- **Admin Page**:
  - Provides admin login functionality.
  - Allows admins to clear player data and reset the database.

### Backend
- **Player Registration**:
  - Players can register with their name, gender, interests, and preferences.
- **Dynamic Matching**:
  - Matches players based on their type while avoiding immediate re-matches.
- **Rating System**:
  - Players can rate their interactions after each match.
- **Admin Operations**:
  - Admins can log in and clear player data or reset the database.

---

## Database Schema

### Tables
- **`players`**:
  - Stores player details (name, gender, interests, preferences).
- **`ratings`**:
  - Stores ratings submitted by players after interactions.
- **`matches`**:
  - Tracks matches between players to avoid immediate re-matches.
- **`admins`**:
  - Stores admin credentials (username and hashed password).

### Schema File
- Located at `/database/schema.sql`.
- Automatically creates tables if they do not exist.

---

## Backend Functionality

### Express Server
- Handles API requests for player registration, matching, rating, and admin operations.
- Uses `dotenv` for environment variables and `cors` for cross-origin requests.

### Endpoints
- **Player Operations**:
  - `/api/register`: Registers a new player.
  - `/api/match/:playerType`: Fetches a match for a player based on their type.
  - `/api/rate`: Submits a rating for an interaction.
- **Admin Operations**:
  - `/api/admin/login`: Authenticates admin credentials.
  - `/api/admin/clear`: Clears all data from the database.
  - `/api/admin/clear-players`: Clears only player data.

---

## Admin Page and Database Maintenance

### Admin Page
- Accessible at `/admin`.
- Features:
  - Login form for admin authentication.
  - Buttons for clearing the database or player data.
  - Displays success or error messages based on operations.

### Database Maintenance
- Admins can log in to manage the database.
- Operations include:
  - Clearing all data (`players`, `matches`, `ratings`).
  - Clearing only player data (`players` table).

---

## Future Enhancements
- Add analytics to track player engagement and interaction statistics.
- Improve the admin dashboard with more detailed controls and insights.
- Enhance the rating system with additional metrics.
