import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StationaryParticipant from '../components/StationaryParticipant'; // Updated path
import MovingParticipant from '../components/MovingParticipant'; // Updated path

function Matching() {
  const { playerType } = useParams(); // Get player type (moving or stationary) from URL
  const [match, setMatch] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes (180 seconds)
  const [showRating, setShowRating] = useState(false); // State to toggle rating form
  const [rating, setRating] = useState({ enjoyment: 0, depth: 0, wouldChatAgain: false }); // Rating data
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`Player type: ${playerType}`); // Debugging statement

    // Fetch the matched player
    const fetchMatch = async () => {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; // Fallback to default URL
      try {
        const response = await fetch(`${backendUrl}/api/match/${playerType}`); // Use backend URL
        console.log(`API response status: ${response.status}`); // Debugging statement

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json(); // Parse JSON response
          if (response.ok) {
            console.log('Match data:', data); // Debugging statement
            setMatch(data);
          } else {
            console.error('Error from API:', data); // Debugging statement
            alert(data.error || 'An error occurred while fetching the match.');
            navigate('/');
          }
        } else {
          console.error('Non-JSON response received'); // Debugging statement
          const text = await response.text(); // Read the response as text
          console.error('Raw response:', text); // Debugging statement
          alert('Invalid response from server. Redirecting to home.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching match:', error); // Debugging statement
        alert('An error occurred while fetching the match. Redirecting to home.');
        navigate('/');
      }
    };

    fetchMatch();
  }, [playerType, navigate]);

  useEffect(() => {
    // Timer logic
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Time is up, fetch the next match
      console.log('Time is up! Fetching the next match...'); // Debugging statement
      setMatch(null); // Clear the current match
      setTimeLeft(180); // Reset the timer
      fetchNextMatch();
    }
  }, [timeLeft]);

  const fetchNextMatch = async () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; // Fallback to default URL
    try {
      const response = await fetch(`${backendUrl}/api/match/${playerType}`); // Use backend URL
      console.log(`Next match API response status: ${response.status}`); // Debugging statement

      const text = await response.text(); // Read the response as text
      console.log('Raw API response for next match:', text); // Debugging statement

      try {
        const data = JSON.parse(text); // Parse the response as JSON
        if (response.ok) {
          console.log('Next match data:', data); // Debugging statement
          setMatch(data);
        } else {
          console.error('Error from API:', data); // Debugging statement
          alert(data.error || 'No more matches available. Redirecting to home.');
          navigate('/');
        }
      } catch (parseError) {
        console.error('Error parsing JSON for next match:', parseError); // Debugging statement
        alert('Invalid response from server. Redirecting to home.');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching next match:', error); // Debugging statement
      alert('An error occurred while fetching the next match. Redirecting to home.');
      navigate('/');
    }
  };

  const handleRatingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRating({ ...rating, [name]: type === 'checkbox' ? checked : value });
  };

  const submitRating = async () => {
    try {
      const response = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rating, ratedPlayerId: match.id }),
      });
      if (response.ok) {
        console.log('Rating submitted successfully.');
        setShowRating(false);
        setMatch(null); // Clear current match
        setTimeLeft(180); // Reset timer
        fetchNextMatch(); // Fetch the next match
      } else {
        alert('Failed to submit rating. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('An error occurred while submitting the rating.');
    }
  };

  if (!match) {
    console.log('No match data available yet.'); // Debugging statement
    return <div>Loading match...</div>;
  }

  return (
    <div>
      {showRating ? (
        <div>
          <h2>Rate Your Conversation</h2>
          <label>
            Enjoyment:
            <input type="number" name="enjoyment" min="1" max="5" onChange={handleRatingChange} />
          </label>
          <label>
            Depth:
            <input type="number" name="depth" min="1" max="5" onChange={handleRatingChange} />
          </label>
          <label>
            Would Chat Again:
            <input type="checkbox" name="wouldChatAgain" onChange={handleRatingChange} />
          </label>
          <button onClick={submitRating}>Submit Rating</button>
        </div>
      ) : (
        <>
          {playerType === 'moving' ? (
            <MovingParticipant match={match} timeLeft={timeLeft} />
          ) : (
            <StationaryParticipant match={match} timeLeft={timeLeft} />
          )}
          <button onClick={() => setShowRating(true)}>End Conversation</button>
        </>
      )}
    </div>
  );
}

export default Matching;
