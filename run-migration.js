const path = require('path');
const { execSync } = require('child_process');

try {
  console.log('Running team_battles status column migration...');
  const migrationScript = path.join(__dirname, 'database', 'add-status-column.js');
  execSync(`node ${migrationScript}`, { stdio: 'inherit' });
  console.log('Migration completed successfully');
} catch (error) {
  console.error('Error running migration:', error.message);
}
