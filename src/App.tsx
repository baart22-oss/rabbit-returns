import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import InvestPage from './pages/InvestPage';
import RafflePage from './pages/RafflePage';
import WithdrawPage from './pages/WithdrawPage';
import BankingPage from './pages/BankingPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import TopRabbitBanner from './components/TopRabbitBanner';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Show banner across pages (adjust height/interval as needed) */}
        <TopRabbitBanner intervalMs={7000} height="140px" />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invest" element={<InvestPage />} />
          <Route path="/raffle" element={<RafflePage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
          <Route path="/banking" element={<BankingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
