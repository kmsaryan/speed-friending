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

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
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
  </React.StrictMode>
);
