import React from 'react';
import '../styles/Matching.css';

function Matching() {
  return (
    <div className="container">
      <h2>Matching in Progress</h2>
      <p>Finding the best match for you...</p>
      <button onClick={() => alert('Retry Match')}>Retry</button>
    </div>
  );
}

export default Matching;
