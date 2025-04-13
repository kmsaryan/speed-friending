// File: src/pages/Home.jsx
// This file defines the Home component, which serves as the landing page for the application.
import React from 'react';
import PlayerRegistration from '../components/PlayerRegistration';

function Home() {
  return (
    <div>
      <h1>Welcome to Speed Friending</h1>
      <PlayerRegistration />
    </div>
  );
}

export default Home;
