//server.js
//Description: This code sets up an Express server with modular routes for a matchmaking application. It includes endpoints for player registration, fetching matches, submitting ratings, and team formation. The server handles errors gracefully and provides JSON responses for better client-side handling.
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

dotenv.config();

// Run database migration before starting the server
console.log('Running database migration...');
try {
  execSync('node ' + path.join(__dirname, 'database', 'migrate.js'), { stdio: 'inherit' });
  console.log('Database migration completed successfully.');
} catch (error) {
  console.error('Error running database migration:', error.message);
}

const initializeSocketServer = require('./socketServer');

const app = express();
const server = http.createServer(app);
const io = initializeSocketServer(server);

app.use(bodyParser.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Import modular routes
const registerRoutes = require('./routes/register');
const matchRoutes = require('./routes/match');
const ratingsRoutes = require('./routes/ratings');
const teamsRoutes = require('./routes/teams');
const playerCountRoutes = require('./routes/playerCount');

// Use modular routes
app.use('/api', registerRoutes);
app.use('/api', matchRoutes);
app.use('/api', ratingsRoutes);
app.use('/api', teamsRoutes);
app.use('/api', playerCountRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
