import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';
import './styles/Home.css';
import './styles/Matching.css';
import './styles/TeamBattles.css';
import './styles/global.css';
import Home from './pages/Home';
import Matching from './pages/Matching';
import TeamBattles from './pages/TeamBattles';
import StationaryParticipant from './components/StationaryParticipant';
import MovingParticipant from './components/MovingParticipant';
import Admin from './pages/Admin';

// Add error boundary for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#1f2833', color: '#c5c6c7', margin: '20px', borderRadius: '8px' }}>
          <h2 style={{ color: '#66fcf1' }}>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Click for details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
          <button 
            style={{ marginTop: '15px', background: '#45a29e', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stationary-participant" element={<StationaryParticipant />} />
          <Route path="/moving-participant" element={<MovingParticipant />} />
          <Route path="/matching/:playerType" element={<Matching />} />
          <Route path="/team-battles/:round" element={<TeamBattles />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);
