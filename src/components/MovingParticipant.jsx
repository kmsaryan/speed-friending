//MovingParticipant.jsx
// File: src/components/MovingParticipant.jsx
import React from 'react';

function MovingParticipant({ match, timeLeft }) {
  return (
    <div>
      <h1>Moving Participant</h1>
      <h2>You are matched with {match.name}</h2>
      <p>Gender: {match.gender}</p>
      <p>Interests: {match.interests}</p>
      <p>Preferences: {match.preferences}</p>
      <p>Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</p>
    </div>
  );
}

export default MovingParticipant;
