//StationaryParticipant.jsx
// File: src/components/StationaryParticipant.jsx
// This file defines the StationaryParticipant component, which displays the details of a stationary participant after they have been matched.
import React from 'react';

function StationaryParticipant({ match, timeLeft }) {
  return (
    <div>
      <h1>Stationary Participant</h1>
      <h2>You are matched with {match.name}</h2>
      <p>Gender: {match.gender}</p>
      <p>Interests: {match.interests}</p>
      <p>Preferences: {match.preferences}</p>
      <p>Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</p>
    </div>
  );
}

export default StationaryParticipant;
