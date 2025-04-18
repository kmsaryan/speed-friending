# Changelog

All notable changes to the Speed Friending project will be documented in this file.

## [1.3.0] - 2025-04-18

### Features
- **Game Status Management**:
  - Added game status checks and updates in the Matching component.
  - Introduced AdminAuth component for admin login and registration functionality.
  - Developed Dashboard component for displaying player stats and game controls.
  - Created DataManagement component for clearing various data types.
  - Built GameControl component for managing game status and rounds.
  - Added MatchManagement component for viewing and controlling matches.
  - Created PlayerStats component for displaying player statistics.
  - Developed RatingsDashboard component for displaying average ratings.
  - Implemented AdminApiService for handling all admin-related API requests.

### Improvements
- **UI Enhancements**:
  - Refactored styles to use a global color palette and removed deprecated color definitions.
  - Updated styles for Admin, Home, Matching, Participant, Player Registration, Rating Form, and Team Battles components.
  - Added consistent theming and responsive design across components.
  - Introduced new styles for LiveMatchTable and other admin components.

### Bug Fixes
- Fixed rating logic in the Matching component.
- Improved timer logic and added no-match handling.

---

## [1.2.0] - 2025-04-18

### Features
- **Matchmaking with Socket.IO**:
  - Implemented real-time matchmaking functionality using Socket.IO.
  - Added modular routes for player registration, matchmaking, player count, ratings, and team formation.
  - Enhanced the Matching page to display match details and loading states.

### Improvements
- **Database Integration**:
  - Added database migration script execution on server start.
  - Updated player registration to include player type and table number.
  - Improved error handling and logging throughout the application.

### Bug Fixes
- Fixed styling inconsistencies in the Matching interface.
- Added loading indicators for better user experience.

---

## [1.1.0] - 2025-04-11

### Features
- **Admin Functionalities**:
  - Added player data clearing functionality.
  - Integrated bcrypt for password hashing.
  - Implemented admin endpoints for managing players and matches.

### Improvements
- **Styling Updates**:
  - Refactored styles for improved layout and consistency.
  - Updated form and button styles.
  - Added admin page styling.

### Bug Fixes
- Enhanced error handling and logging in Admin and Matching components.

---

## [1.0.0] - 2025-04-03

### Features
- **Initial Release**:
  - Added player registration system.
  - Implemented basic matchmaking functionality.
  - Introduced rating system for player interactions.
  - Developed admin functionalities for managing players and matches.

### Technical Architecture
- **Frontend**: React with React Router.
- **Backend**: Express.js with Socket.IO.
- **Database**: SQLite with migration support.
- **Authentication**: Basic admin authentication with bcrypt.
- **Environment Management**: dotenv for environment variables.
- **Real-Time Updates**: Socket.IO for real-time matchmaking and chat.

---

## [0.1.0] - 2025-04-02

### Features
- **Project Setup**:
  - Initialized the Speed Friending project with React for the frontend and Express for the backend.
  - Added environment configuration and npm ignore files.
  - Created the basic project structure:
    - `/src` for frontend components and pages.
    - `/database` for database schema.
    - `server.js` for backend logic.