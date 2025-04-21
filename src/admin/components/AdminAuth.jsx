import React, { useState } from 'react';
import AdminApiService from '../services/AdminApiService';
import '../styles/AdminAuth.css';

function AdminAuth({ onLogin, onMessage }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await AdminApiService.login({ username, password });
      onLogin(true);
      onMessage && onMessage('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid credentials. Please try again.');
      onMessage && onMessage('Login failed: ' + (error.message || 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        {error && <p className="message error">{error}</p>}
        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default AdminAuth;
