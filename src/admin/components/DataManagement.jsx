import React from 'react';
import AdminApiService from '../services/AdminApiService';

function DataManagement({ onRefresh, onMessage }) {
  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      return;
    }
    
    try {
      await AdminApiService.clearDatabase();
      onMessage('Database cleared successfully.');
      onRefresh();
    } catch (error) {
      console.error('Error clearing database:', error);
      onMessage(error.message || 'Failed to clear the database.');
    }
  };

  const handleClearMatches = async () => {
    if (!window.confirm('Are you sure you want to clear all match data?')) {
      return;
    }
    
    try {
      await AdminApiService.clearMatches();
      onMessage('Match data cleared successfully.');
      onRefresh();
    } catch (error) {
      console.error('Error clearing match data:', error);
      onMessage(error.message || 'Failed to clear match data.');
    }
  };

  const handleClearPlayers = async () => {
    if (!window.confirm('Are you sure you want to clear all player data?')) {
      return;
    }
    
    try {
      await AdminApiService.clearPlayers();
      onMessage('Player data cleared successfully.');
      onRefresh();
    } catch (error) {
      console.error('Error clearing player data:', error);
      onMessage(error.message || 'Failed to clear player data.');
    }
  };

  const handleClearRatings = async () => {
    if (!window.confirm('Are you sure you want to clear all rating data?')) {
      return;
    }
    
    try {
      await AdminApiService.clearRatings();
      onMessage('Rating data cleared successfully.');
      onRefresh();
    } catch (error) {
      console.error('Error clearing rating data:', error);
      onMessage(error.message || 'Failed to clear rating data.');
    }
  };

  return (
    <div className="admin-section">
      <h2>Data Management</h2>
      
      <div className="data-card danger">
        <h3>Clear All Data</h3>
        <p>This will permanently delete all players, matches, and ratings. Use with caution!</p>
        <button onClick={handleClearDatabase} className="danger-button">
          Clear All Data
        </button>
      </div>
      
      <div className="data-card warning">
        <h3>Clear Player Data</h3>
        <p>This will remove all player registrations from the database.</p>
        <button onClick={handleClearPlayers} className="warning-button">
          Clear Player Data
        </button>
      </div>
      
      <div className="data-card warning">
        <h3>Clear Match Data</h3>
        <p>This will clear all match history, but keep player registrations.</p>
        <button onClick={handleClearMatches} className="warning-button">
          Clear Match Data
        </button>
      </div>
      
      <div className="data-card warning">
        <h3>Clear Rating Data</h3>
        <p>This will delete all player ratings, but keep player and match data.</p>
        <button onClick={handleClearRatings} className="warning-button">
          Clear Rating Data
        </button>
      </div>
    </div>
  );
}

export default DataManagement;
