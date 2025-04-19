// Debug utility to list all registered routes

const express = require('express');
const app = express();

// Import all route modules
const registerRoutes = require('./routes/register');
const matchRoutes = require('./routes/match');
const ratingsRoutes = require('./routes/ratings');
const teamsRoutes = require('./routes/teams');
const battlesRoutes = require('./routes/battles'); 
const playerCountRoutes = require('./routes/playerCount');
const adminRoutes = require('./routes/admin');
const playerRoutes = require('./routes/player');

// Function to print routes from a router
function printRoutes(router, prefix = '') {
  if (!router.stack) {
    console.log('No routes found in router');
    return;
  }

  router.stack.forEach(r => {
    if (r.route && r.route.path) {
      const methods = Object.keys(r.route.methods).join(',').toUpperCase();
      console.log(`${methods} ${prefix}${r.route.path}`);
    } else if (r.name === 'router' && r.handle.stack) {
      // This is a nested router
      printRoutes(r.handle, `${prefix}${r.regexp.source.replace('^\\/','').replace('\\/?(?=\\/|$)', '')}`);
    }
  });
}

// Print all routes
console.log('=== REGISTERED ROUTES ===');
console.log('\n-- Admin Routes --');
printRoutes(adminRoutes, '/api');

console.log('\n-- Register Routes --');
printRoutes(registerRoutes, '/api');

console.log('\n-- Match Routes --');
printRoutes(matchRoutes, '/api');

console.log('\n-- Ratings Routes --');
printRoutes(ratingsRoutes, '/api');

console.log('\n-- Teams Routes --');
printRoutes(teamsRoutes, '/api');

console.log('\n-- Battles Routes --');
printRoutes(battlesRoutes, '/api');

console.log('\n-- Player Count Routes --');
printRoutes(playerCountRoutes, '/api');

console.log('\n-- Player Routes --');
printRoutes(playerRoutes, '/api');

console.log('\n=== END OF ROUTES ===');
