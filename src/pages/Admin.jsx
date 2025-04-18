import React, { useState, useEffect } from 'react';
import '../styles/Admin.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function Admin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [registerCredentials, setRegisterCredentials] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
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
  
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  // Fetch player stats when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchPlayerStats();
      fetchRatings();
    }
  }, [isLoggedIn]);
  
  const fetchPlayerStats = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/player-stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlayerStats(data);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };
  
  const fetchRatings = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/ratings`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterCredentials({ ...registerCredentials, [name]: value });
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) {
        setMessage('Login successful.');
        setIsLoggedIn(true);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Login failed.');
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleRegister = async () => {
    try {
      console.log('Sending registration request:', registerCredentials);
      const response = await fetch(`${backendUrl}/api/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerCredentials),
      });
      
      console.log('Registration response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        setMessage('Admin registered successfully.');
        setShowRegisterForm(false);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorData = { error: `Failed with status: ${response.status}` };
        }
        console.error('Registration failed:', errorData);
        setMessage(errorData.error || `Registration failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error during admin registration:', error);
      setMessage(`Registration error: ${error.message}`);
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/start-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round }),
      });
      
      if (response.ok) {
        setGameStatus('running');
        setMessage('Game started successfully!');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to start game.');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setMessage('An error occurred. Please try again.');
    }
  };
  
  const handleStopGame = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/stop-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setGameStatus('stopped');
        setMessage('Game stopped successfully!');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to stop game.');
      }
    } catch (error) {
      console.error('Error stopping game:', error);
      setMessage('An error occurred. Please try again.');
    }
  };
  
  const handleNextRound = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setRound(round + 1);
        setMessage(`Advanced to round ${round + 1}!`);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to advance to next round.');
      }
    } catch (error) {
      console.error('Error advancing round:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) {
        setMessage('Database cleared successfully.');
        fetchPlayerStats();
        fetchRatings();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to clear the database.');
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleClearMatches = async () => {
    if (!window.confirm('Are you sure you want to clear all match data?')) {
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/clear-matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setMessage('Match data cleared successfully.');
        fetchPlayerStats();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to clear match data.');
      }
    } catch (error) {
      console.error('Error clearing match data:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleClearPlayers = async () => {
    if (!window.confirm('Are you sure you want to clear all player data?')) {
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/clear-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) {
        setMessage('Player data cleared successfully.');
        fetchPlayerStats();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to clear player data.');
      }
    } catch (error) {
      console.error('Error clearing player data:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleClearRatings = async () => {
    if (!window.confirm('Are you sure you want to clear all rating data?')) {
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/clear-ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setMessage('Rating data cleared successfully.');
        fetchRatings();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to clear rating data.');
      }
    } catch (error) {
      console.error('Error clearing rating data:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleFormTeams = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/form-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Teams formed:', data.teams);
        setMessage(`${data.teams.length} teams formed successfully!`);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to form teams.');
      }
    } catch (error) {
      console.error('Error forming teams:', error);
      setMessage('An error occurred. Please try again.');
    }
  };
  
  // Player type distribution chart data
  const playerTypeData = [
    { name: 'Stationary', value: playerStats.stationary },
    { name: 'Moving', value: playerStats.moving }
  ];
  
  const COLORS = ['#0088FE', '#00C49F'];

  // Rating distribution chart data
  const averageRatings = [
    { name: 'Enjoyment', average: ratings.length ? ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length : 0 },
    { name: 'Depth', average: ratings.length ? ratings.reduce((acc, r) => acc + r.depth, 0) / ratings.length : 0 }
  ];
  
  // If not logged in, show login form
  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        {!showRegisterForm ? (
          <div className="login-card">
            <h2>Admin Login</h2>
            {message && <p className={`message ${message.includes("failed") || message.includes("error") ? "error" : ""}`}>{message}</p>}
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
            <button className="primary-button" onClick={handleLogin}>Login</button>
            <button className="secondary-button" onClick={() => {
              setShowRegisterForm(true);
              setMessage('');
            }}>
              Register Admin
            </button>
          </div>
        ) : (
          <div className="login-card">
            <h2>Register Admin</h2>
            {message && <p className={`message ${message.includes("failed") || message.includes("error") ? "error" : "success"}`}>{message}</p>}
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={registerCredentials.username}
                onChange={handleRegisterChange}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={registerCredentials.password}
                onChange={handleRegisterChange}
              />
            </div>
            <div className="button-group">
              <button className="primary-button" onClick={handleRegister}>Register</button>
              <button className="secondary-button" onClick={() => {
                setShowRegisterForm(false);
                setMessage('');
              }}>
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
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
          <div className="admin-section">
            <h2>Dashboard</h2>
            
            <div className="stat-cards">
              <div className="stat-card">
                <div className="stat-value">{playerStats.total}</div>
                <div className="stat-label">Total Players</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{playerStats.stationary}</div>
                <div className="stat-label">Stationary Players</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{playerStats.moving}</div>
                <div className="stat-label">Moving Players</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{playerStats.matched}</div>
                <div className="stat-label">Currently Matched</div>
              </div>
            </div>
            
            <div className="charts-container">
              <div className="chart-card">
                <h3>Player Distribution</h3>
                <PieChart width={300} height={200}>
                  <Pie
                    data={playerTypeData}
                    cx={150}
                    cy={100}
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {playerTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>
              <div className="chart-card">
                <h3>Average Ratings</h3>
                <BarChart width={300} height={200} data={averageRatings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#66FCF1" />
                </BarChart>
              </div>
            </div>
            
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className={`game-button ${gameStatus === 'running' ? 'stop' : 'start'}`}
                  onClick={gameStatus === 'running' ? handleStopGame : handleStartGame}
                >
                  {gameStatus === 'running' ? 'Stop Game' : 'Start Game'}
                </button>
                <button className="next-round-button" onClick={handleNextRound}>
                  Next Round
                </button>
                <button className="teams-button" onClick={handleFormTeams}>
                  Form Teams
                </button>
                <button 
                  className="battle-button" 
                  onClick={() => window.location.href = `/team-battles/${round}`}
                >
                  Start Team Battles
                </button>
                <button className="refresh-button" onClick={() => { fetchPlayerStats(); fetchRatings(); }}>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'game-control' && (
          <div className="admin-section">
            <h2>Game Control</h2>
            
            <div className="control-card">
              <h3>Game Status</h3>
              <div className="game-controls">
                <div className="game-status-display">
                  <span className="status-label">Current Status:</span>
                  <span className={`status-value ${gameStatus}`}>{gameStatus.toUpperCase()}</span>
                </div>
                <div className="game-buttons">
                  <button 
                    className="start-button" 
                    onClick={handleStartGame}
                    disabled={gameStatus === 'running'}
                  >
                    Start Game
                  </button>
                  <button 
                    className="stop-button" 
                    onClick={handleStopGame}
                    disabled={gameStatus === 'stopped'}
                  >
                    Stop Game
                  </button>
                </div>
              </div>
            </div>
            
            <div className="control-card">
              <h3>Round Management</h3>
              <div className="round-controls">
                <div className="round-display">
                  <span className="round-label">Current Round:</span>
                  <span className="round-value">{round}</span>
                </div>
                <button onClick={handleNextRound} className="next-button">
                  Advance to Next Round
                </button>
              </div>
            </div>
            
            <div className="control-card">
              <h3>Team Formation</h3>
              <p>Form teams based on player ratings and preferences from the current round.</p>
              <button onClick={handleFormTeams} className="teams-button">
                Form Teams
              </button>
            </div>
          </div>
        )}

        {activeTab === 'player-stats' && (
          <div className="admin-section">
            <h2>Player Statistics</h2>
            
            <div className="control-card">
              <h3>Current Players</h3>
              <div className="player-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Players:</span>
                  <span className="stat-value">{playerStats.total}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Stationary Players:</span>
                  <span className="stat-value">{playerStats.stationary}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Moving Players:</span>
                  <span className="stat-value">{playerStats.moving}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Available Players:</span>
                  <span className="stat-value">{playerStats.available}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Currently Matched:</span>
                  <span className="stat-value">{playerStats.matched}</span>
                </div>
              </div>
              <button onClick={fetchPlayerStats} className="refresh-button">
                Refresh Stats
              </button>
            </div>
            
            <div className="chart-container">
              <PieChart width={400} height={300}>
                <Pie
                  data={playerTypeData}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {playerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="admin-section">
            <h2>Ratings Dashboard</h2>
            
            <div className="control-card">
              <h3>Rating Statistics</h3>
              <div className="rating-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Ratings:</span>
                  <span className="stat-value">{ratings.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Enjoyment:</span>
                  <span className="stat-value">
                    {ratings.length 
                      ? (ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length).toFixed(1) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Depth:</span>
                  <span className="stat-value">
                    {ratings.length 
                      ? (ratings.reduce((acc, r) => acc + r.depth, 0) / ratings.length).toFixed(1) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Would Chat Again:</span>
                  <span className="stat-value">
                    {ratings.length 
                      ? `${ratings.filter(r => r.would_chat_again).length} (${((ratings.filter(r => r.would_chat_again).length / ratings.length) * 100).toFixed(0)}%)` 
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <button onClick={fetchRatings} className="refresh-button">
                Refresh Ratings
              </button>
            </div>
            
            <div className="chart-container">
              <BarChart width={500} height={300} data={averageRatings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" name="Average Rating" fill="#66FCF1" />
              </BarChart>
            </div>
          </div>
        )}

        {activeTab === 'data-management' && (
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
        )}
      </div>
    </div>
  );
}

export default Admin;
