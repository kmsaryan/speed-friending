import React, { useState } from 'react';

function Admin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) {
        setMessage('Login successful. You can now clear the database.');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Login failed.');
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleClearDatabase = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) {
        setMessage('Database cleared successfully.');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to clear the database.');
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h1>Admin Page</h1>
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={credentials.username}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={credentials.password}
        onChange={handleChange}
      />
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleClearDatabase}>Clear Database</button>
      <p>{message}</p>
    </div>
  );
}

export default Admin;
