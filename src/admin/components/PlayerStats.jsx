import React from 'react';
import '../styles/PlayerStats.css';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import AdminApiService from '../services/AdminApiService';

function PlayerStats({ playerStats, onRefresh }) {
  const COLORS = ['#0088FE', '#00C49F'];
  
  const playerTypeData = [
    { name: 'Stationary', value: playerStats.stationary },
    { name: 'Moving', value: playerStats.moving }
  ];
  
  const handleRefresh = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  return (
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
        <button onClick={handleRefresh} className="refresh-button">
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
  );
}

export default PlayerStats;
