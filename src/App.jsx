import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Matching from './pages/Matching';
import TeamBattle from './pages/TeamBattle';
import TeamBattles from './pages/TeamBattles';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/matching/:playerType" element={<Matching />} />
        <Route path="/team-battle/:teamId" element={<TeamBattle />} />
        <Route path="/team-battles/:round" element={<TeamBattles />} />
      </Routes>
    </Router>
  );
}

export default App;