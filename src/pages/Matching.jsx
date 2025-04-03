import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StationaryParticipant from '../components/StationaryParticipant'; // Updated path
import MovingParticipant from '../components/MovingParticipant'; // Updated path

function Matching() {
  const { playerType } = useParams(); // Get player type (moving or stationary) from URL
  const [match, setMatch] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes (180 seconds)
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`Player type: ${playerType}`); // Debugging statement

    // Fetch the matched player
    const fetchMatch = async () => {
      try {
        const response = await fetch(`/api/match/${playerType}`);
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
    try {
      const response = await fetch(`/api/match/${playerType}`);
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

  if (!match) {
    console.log('No match data available yet.'); // Debugging statement
    return <div>Loading match...</div>;
  }

  return (
    <div>
      {playerType === 'moving' ? (
        <MovingParticipant match={match} timeLeft={timeLeft} />
      ) : (
        <StationaryParticipant match={match} timeLeft={timeLeft} />
      )}
      <button onClick={() => navigate('/')}>End Conversation</button>
    </div>
  );
}

export default Matching;
