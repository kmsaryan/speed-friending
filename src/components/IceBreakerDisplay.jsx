import React, { useState, useEffect } from 'react';
import '../styles/IceBreakerDisplay.css';
import ideaIcon from '../asserts/light-bulb.svg';
import icebreakers from '../data/icebreakers';

function IceBreakerDisplay({ matchId }) {
  const [selectedIcebreakers, setSelectedIcebreakers] = useState([]);

  useEffect(() => {
    if (!icebreakers || icebreakers.length === 0) {
      // Fallback icebreakers in case the imported array is empty
      setSelectedIcebreakers([
        "What's the most interesting place you've ever visited?",
        "If you could have any superpower, what would it be and why?"
      ]);
      return;
    }

    // Use the matchId as a seed for "random" selection to ensure both
    // players in a match see the same icebreakers
    const seed = parseInt(matchId, 10) || Date.now();
    const randomIndexes = getRandomIndexes(icebreakers.length, 2, seed);
    const selected = randomIndexes.map(index => icebreakers[index]);
    setSelectedIcebreakers(selected);
  }, [matchId]);

  // Pseudo-random number generator with seed for consistent results between players
  function getRandomIndexes(max, count, seed) {
    const indexes = new Set();
    let seedRandom = mulberry32(seed);
    
    while (indexes.size < count && indexes.size < max) {
      const randomIndex = Math.floor(seedRandom() * max);
      indexes.add(randomIndex);
    }
    
    return Array.from(indexes);
  }
  
  // Simple seeded random function (Mulberry32)
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  if (selectedIcebreakers.length === 0) {
    return null; // Don't render anything while loading
  }

  return (
    <div className="icebreaker-container">
      <div className="icebreaker-header">
        <img src={ideaIcon} alt="Icebreaker" className="icebreaker-icon" />
        <h3>Conversation Starters</h3>
      </div>
      <ul className="icebreaker-list">
        {selectedIcebreakers.map((icebreaker, index) => (
          <li key={index} className="icebreaker-item">
            {icebreaker}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default IceBreakerDisplay;
