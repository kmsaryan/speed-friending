import React, { useState } from 'react';
import '../styles/AdminAuth.css';
import AdminApiService from '../services/AdminApiService';

function AdminAuth({ onLogin, onMessage }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [registerCredentials, setRegisterCredentials] = useState({ username: '', password: '' });
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [message, setMessage] = useState('');

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
      await AdminApiService.login(credentials);
      setMessage('Login successful.');
      onLogin(true);
      if (onMessage) onMessage('Login successful.');
    } catch (error) {
      console.error('Error during admin login:', error);
      setMessage(error.message || 'Login failed.');
    }
  };

  const handleRegister = async () => {
    try {
      console.log('Sending registration request:', registerCredentials);
      await AdminApiService.register(registerCredentials);
      setMessage('Admin registered successfully.');
      setShowRegisterForm(false);
    } catch (error) {
      console.error('Error during admin registration:', error);
      setMessage(error.message || 'Registration failed.');
    }
  };

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

export default AdminAuth;
