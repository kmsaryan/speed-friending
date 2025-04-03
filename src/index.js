import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';
import Home from './pages/Home';
import PostRegistration from './pages/PostRegistration';
import Matching from './pages/Matching';
import StationaryParticipant from './components/StationaryParticipant'; // Updated path
import MovingParticipant from './components/MovingParticipant'; // Updated path

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post-registration" element={<PostRegistration />} />
        <Route path="/stationary-participant" element={<StationaryParticipant />} />
        <Route path="/moving-participant" element={<MovingParticipant />} />
        <Route path="/matching/:playerType" element={<Matching />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
