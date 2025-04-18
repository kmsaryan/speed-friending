import React, { useState, useEffect } from 'react';
import '../styles/global.css'; 
import '../styles/Admin.css';
import AdminAuth from '../admin/components/AdminAuth';
import Dashboard from '../admin/components/Dashboard';
import GameControl from '../admin/components/GameControl';
import PlayerStats from '../admin/components/PlayerStats';
import RatingsDashboard from '../admin/components/RatingsDashboard';
import DataManagement from '../admin/components/DataManagement';
import LiveMatchTable from '../admin/components/LiveMatchTable';

// Import API Service
import AdminApiService from '../admin/services/AdminApiService';

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [playerStats, setPlayerStats] = useState({ 
    stationary: 0, 
    moving: 0, 
    total: 0, 
    matched: 0, 
    available: 0 
  });
  const [ratings, setRatings] = useState([]);
  const [gameStatus, setGameStatus] = useState('stopped');
  const [round, setRound] = useState(1);
  
  // Fetch player stats when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);
  
  const fetchData = async () => {
    try {
      await fetchPlayerStats();
      await fetchRatings();
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error fetching data. Please try again.');
    }
  };
  
  const fetchPlayerStats = async () => {
    try {
      const data = await AdminApiService.getPlayerStats();
      setPlayerStats(data);
      return data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  };
  
  const fetchRatings = async () => {
    try {
      const data = await AdminApiService.getRatings();
      setRatings(data);
      return data;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }
  };

  // If not logged in, show login form
  if (!isLoggedIn) {
    return <AdminAuth onLogin={setIsLoggedIn} onMessage={setMessage} />;
  }

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <ul className="nav-links">
          <li 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </li>
          <li 
            className={activeTab === 'game-control' ? 'active' : ''} 
            onClick={() => setActiveTab('game-control')}
          >
            Game Control
          </li>
          <li 
            className={activeTab === 'live-matches' ? 'active' : ''} 
            onClick={() => setActiveTab('live-matches')}
          >
            Live Matching
          </li>
          <li 
            className={activeTab === 'player-stats' ? 'active' : ''} 
            onClick={() => setActiveTab('player-stats')}
          >
            Player Statistics
          </li>
          <li 
            className={activeTab === 'ratings' ? 'active' : ''} 
            onClick={() => setActiveTab('ratings')}
          >
            Ratings
          </li>
          <li 
            className={activeTab === 'data-management' ? 'active' : ''} 
            onClick={() => setActiveTab('data-management')}
          >
            Data Management
          </li>
        </ul>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>Speed Friending Administration</h1>
          <div className="admin-controls">
            <span>Current Round: {round}</span>
            <span className={`game-status ${gameStatus}`}>
              Game Status: {gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
            </span>
            <button onClick={() => setIsLoggedIn(false)} className="logout-button">Logout</button>
          </div>
        </div>

        {message && <div className="message-banner">{message}</div>}

        {activeTab === 'dashboard' && (
          <Dashboard 
            playerStats={playerStats}
            ratings={ratings}
            round={round}
            gameStatus={gameStatus}
            onStatusChange={setGameStatus}
            onRoundChange={setRound}
            onRefresh={fetchData}
            onMessage={setMessage}
          />
        )}

        {activeTab === 'game-control' && (
          <GameControl 
            gameStatus={gameStatus}
            round={round}
            onStatusChange={setGameStatus}
            onRoundChange={setRound}
            onMessage={setMessage}
          />
        )}
        
        {activeTab === 'live-matches' && (
          <LiveMatchTable />
        )}

        {activeTab === 'player-stats' && (
          <PlayerStats 
            playerStats={playerStats}
            onRefresh={fetchPlayerStats}
          />
        )}

        {activeTab === 'ratings' && (
          <RatingsDashboard 
            ratings={ratings}
            onRefresh={fetchRatings}
          />
        )}

        {activeTab === 'data-management' && (
          <DataManagement 
            onRefresh={fetchData}
            onMessage={setMessage}
          />
        )}
      </div>
    </div>
  );
}

export default Admin;
