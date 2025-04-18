import React from 'react';
import '../styles/Dashboard.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import AdminApiService from '../services/AdminApiService';

function Dashboard({ playerStats, ratings, round, gameStatus, onStatusChange, onRoundChange, onRefresh, onMessage }) {
  const COLORS = ['#0088FE', '#00C49F'];

  const playerTypeData = [
    { name: 'Stationary', value: playerStats.stationary },
    { name: 'Moving', value: playerStats.moving }
  ];

  const averageRatings = [
    { name: 'Enjoyment', average: ratings.length ? ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length : 0 },
    { name: 'Depth', average: ratings.length ? ratings.reduce((acc, r) => acc + r.depth, 0) / ratings.length : 0 }
  ];

  const handleStartGame = async () => {
    try {
      await AdminApiService.startGame(round);
      onStatusChange('running');
      onMessage('Game started successfully!');
    } catch (error) {
      console.error('Error starting game:', error);
      onMessage(error.message || 'Failed to start game.');
    }
  };

  const handleStopGame = async () => {
    try {
      await AdminApiService.stopGame();
      onStatusChange('stopped');
      onMessage('Game stopped successfully!');
    } catch (error) {
      console.error('Error stopping game:', error);
      onMessage(error.message || 'Failed to stop game.');
    }
  };

  const handleNextRound = async () => {
    try {
      await AdminApiService.nextRound();
      onRoundChange(round + 1);
      onMessage(`Advanced to round ${round + 1}!`);
    } catch (error) {
      console.error('Error advancing round:', error);
      onMessage(error.message || 'Failed to advance to next round.');
    }
  };

  const handleFormTeams = async () => {
    try {
      const { teams } = await AdminApiService.formTeams(round);
      onMessage(`${teams.length} teams formed successfully!`);
    } catch (error) {
      console.error('Error forming teams:', error);
      onMessage(error.message || 'Failed to form teams.');
    }
  };

  return (
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
          <button className="refresh-button" onClick={onRefresh}>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
