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
import PlayerManagement from '../admin/components/PlayerManagement';
import TeamBattleAdmin from '../admin/components/TeamBattleAdmin';
import MatchManagement from '../admin/components/MatchManagement';
import TeamBattleLanding from '../admin/components/TeamBattleLanding';
import LoadingSpinner from '../components/LoadingSpinner'; // Import LoadingSpinner
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
  const [teamBattlesRound, setTeamBattlesRound] = useState(1);
  const [matchView, setMatchView] = useState('current'); // For match history view
  const [loading, setLoading] = useState(true); // Add loading state
  
  // Function to change active tab
  const changeTab = (tabName) => {
    setActiveTab(tabName);
  };

  // Fetch player stats when logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log('[Admin] User is logged in. Fetching data...');
      setLoading(true);
      fetchData()
        .then(() => console.log('[Admin] Data fetched successfully'))
        .catch((error) => console.error('[Admin] Error during data fetch:', error))
        .finally(() => setLoading(false));
    }
  }, [isLoggedIn]);
  
  const fetchData = async () => {
    try {
      console.log('[Admin] Fetching game status...');
      const gameStatus = await AdminApiService.getGameStatus();
      console.log('[Admin] Game status:', gameStatus);
      setGameStatus(gameStatus.status);
      setRound(gameStatus.round);

      console.log('[Admin] Fetching player stats...');
      const stats = await AdminApiService.getPlayerStats();
      console.log('[Admin] Player stats:', stats);
      setPlayerStats(stats);

      console.log('[Admin] Fetching ratings...');
      const ratingsData = await AdminApiService.getRatings();
      console.log('[Admin] Ratings:', ratingsData);
      setRatings(ratingsData);
    } catch (error) {
      console.error('[Admin] Error fetching data:', error);
      setMessage('Error fetching data. Please check your connection and try again.');
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

  const handleLogin = async (username, password) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        setIsLoggedIn(true);
        setMessage('Login successful');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Login failed.');
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      setMessage('An error occurred. Please check your connection and try again.');
    }
  };

  const handleResetRound = async () => {
    try {
      const response = await AdminApiService.resetRound();
      setMessage(response.message || 'Round reset successfully');
      setRound(1); // Update the round state to 1
    } catch (error) {
      console.error('Error resetting round:', error);
      setMessage('Failed to reset round. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (gameStatus === 'stopped') {
    return (
      <div className="admin-dashboard">
        <h1>Game is currently stopped</h1>
        <p>Please start the game from the Game Control tab.</p>
      </div>
    );
  }

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
            Match Management
          </li>
          <li 
            className={activeTab === 'match-history' ? 'active' : ''} 
            onClick={() => setActiveTab('match-history')}
          >
            Match History
          </li>
          <li 
            className={activeTab === 'team-battles-dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('team-battles-dashboard')}
          >
            Team Battle Dashboard
          </li>
          <li 
            className={activeTab === 'team-battles' ? 'active' : ''} 
            onClick={() => {
              setActiveTab('team-battles');
              setTeamBattlesRound(round); // Use current round for team battles
            }}
          >
            Manage Team Battles
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
          <li 
            className={activeTab === 'player-management' ? 'active' : ''} 
            onClick={() => setActiveTab('player-management')}
          >
            Player Management
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
            onTeamBattlesClick={() => {
              setActiveTab('team-battles');
              setTeamBattlesRound(round);
            }}
          />
        )}

        {activeTab === 'game-control' && (
          <GameControl 
            gameStatus={gameStatus}
            round={round}
            onStatusChange={setGameStatus}
            onRoundChange={setRound}
            onMessage={setMessage}
            onResetRound={handleResetRound} // Pass the reset handler
            onTabChange={changeTab}
          />
        )}
        
        {activeTab === 'live-matches' && (
          <LiveMatchTable />
        )}

        {activeTab === 'match-history' && (
          <div className="admin-section">
            <h2>Player Match History</h2>
            <MatchManagement 
              initialRound={round}
              onMessage={setMessage}
            />
          </div>
        )}

        {activeTab === 'team-battles-dashboard' && (
          <TeamBattleLanding 
            round={round}
            onMessage={setMessage}
          />
        )}

        {activeTab === 'team-battles' && (
          <TeamBattleAdmin 
            round={teamBattlesRound}
            onMessage={setMessage}
            onBack={() => setActiveTab('team-battles-dashboard')}
          />
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

        {activeTab === 'player-management' && (
          <PlayerManagement />
        )}
      </div>
    </div>
  );
}

export default Admin;