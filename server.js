//server.js
//Description: This code sets up an Express server with modular routes for a matchmaking application. It includes endpoints for player registration, fetching matches, submitting ratings, team formation, and admin functionalities. The server handles errors gracefully and provides JSON responses for better client-side handling.
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

// Add debugging for routes registration
console.log('Registering API routes...');

// Import modular routes
const registerRoutes = require('./routes/register');
const matchRoutes = require('./routes/match');
const ratingsRoutes = require('./routes/ratings');
const teamsRoutes = require('./routes/teams');
const battlesRoutes = require('./routes/battles'); 
const playerCountRoutes = require('./routes/playerCount');
const adminRoutes = require('./routes/admin');

// Print available routes in admin (for debugging)
console.log('Available admin routes:');
adminRoutes.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log(`Route: ${r.route.path}`);
  }
});

// Use modular routes
app.use('/api', registerRoutes);
app.use('/api', matchRoutes);
app.use('/api', ratingsRoutes);
app.use('/api', teamsRoutes);
app.use('/api', battlesRoutes); 
app.use('/api', playerCountRoutes);
app.use('/api', adminRoutes);

// Add a catch-all route handler for debugging
app.use((req, res, next) => {
  console.log(`[404]: Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found', path: req.path });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
