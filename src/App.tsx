import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Invest from './pages/Invest'
import Raffle from './pages/Raffle'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invest" element={<Invest />} />
        <Route path="/raffle" element={<Raffle />} />
      </Routes>
    </Router>
  )
}

export default App