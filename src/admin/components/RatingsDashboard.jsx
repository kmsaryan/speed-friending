import React from 'react';
import '../styles/RatingsDashboard.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import AdminApiService from '../services/AdminApiService';

function RatingsDashboard({ ratings, onRefresh }) {
  const averageRatings = [
    { name: 'Enjoyment', average: ratings.length ? ratings.reduce((acc, r) => acc + r.enjoyment, 0) / ratings.length : 0 },
    { name: 'Depth', average: ratings.length ? ratings.reduce((acc, r) => acc + r.depth, 0) / ratings.length : 0 }
  ];

  const handleRefresh = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing ratings:', error);
    }
  };

  return (
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
        <button onClick={handleRefresh} className="refresh-button">
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
  );
}

export default RatingsDashboard;
