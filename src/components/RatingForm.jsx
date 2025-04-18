import React from 'react';
import '../styles/RatingForm.css';
import ratingsIcon from '../asserts/ratings.svg';

const RatingForm = ({ match, ratings, onRatingChange, onSubmit }) => {
  return (
    <div className="rating-container">
      <h2 className="rating-header">Rate Your Interaction</h2>
      <div className="rating-card">
        <div className="rating-header-section">
          <img src={ratingsIcon} alt="Rating" className="rating-icon" />
          <h3>How was your conversation with {match.name}?</h3>
        </div>
        
        <div className="rating-item">
          <label>How enjoyable was your conversation? (1-5)</label>
          <div className="rating-slider-container">
            <input
              type="range"
              name="enjoyment"
              min="1"
              max="5"
              step="0.5"
              value={ratings.enjoyment}
              onChange={onRatingChange}
              className="rating-slider"
            />
            <div className="rating-value">{ratings.enjoyment}</div>
          </div>
          <div className="rating-scale">
            <span>Not enjoyable</span>
            <span>Very enjoyable</span>
          </div>
        </div>
        
        <div className="rating-item">
          <label>How deep was your conversation? (1-5)</label>
          <div className="rating-slider-container">
            <input
              type="range"
              name="depth"
              min="1"
              max="5"
              step="0.5"
              value={ratings.depth}
              onChange={onRatingChange}
              className="rating-slider"
            />
            <div className="rating-value">{ratings.depth}</div>
          </div>
          <div className="rating-scale">
            <span>Surface level</span>
            <span>Very deep</span>
          </div>
        </div>
        
        <div className="rating-item checkbox">
          <label>
            <input
              type="checkbox"
              name="wouldChatAgain"
              checked={ratings.wouldChatAgain}
              onChange={onRatingChange}
            />
            Would you chat with this person again?
          </label>
        </div>
        
        <button onClick={onSubmit} className="submit-rating">
          Submit Rating
        </button>
      </div>
    </div>
  );
};

export default RatingForm;
