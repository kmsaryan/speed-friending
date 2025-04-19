import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Matching from './pages/Matching';
import Rating from './pages/Rating';
import TeamBattle from './pages/TeamBattle';
import TeamBattles from './pages/TeamBattles';
import Admin from './pages/Admin';
import MatchManagement from './admin/components/MatchManagement';
import TeamBattleAdmin from './admin/components/TeamBattleAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/matching/:playerType" element={<Matching />} />
        <Route path="/rating" element={<Rating />} />
        <Route path="/team-battle/:teamId" element={<TeamBattle />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/matches/:round" element={<MatchManagement />} />
        {/* Keep this route for backward compatibility, but it won't be linked to anymore */}
        <Route path="/admin/team-battles/:round" element={<TeamBattleAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;