import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const packages = [
  { name: 'Starter Bunny',   amount: 200,   img: '/images/tier-starter-bunny.jpg' },
  { name: 'Junior Hopper',   amount: 500,   img: '/images/tier-junior-hopper.jpg' },
  { name: 'Silver Rabbit',   amount: 1000,  img: '/images/tier-silver-rabbit.jpg' },
  { name: 'Gold Rabbit',     amount: 2000,  img: '/images/tier-gold-rabbit.jpg' },
  { name: 'Platinum Hare',   amount: 5000,  img: '/images/tier-platinum-hare.jpg' },
  { name: 'Diamond Warren',  amount: 10000, img: '/images/tier-diamond-warren.jpg' },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-green-700">
            <img src="/images/hero-rabbit.jpg" alt="Rabbit Returns" className="w-9 h-9 rounded-full object-cover" />
            Rabbit Returns
          </Link>
          <div className="flex gap-3">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">Dashboard</button>
            ) : (
              <>
                <button onClick={() => navigate('/auth')} className="text-green-700 border border-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition">Sign In</button>
                <button onClick={() => navigate('/auth')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Grow Your Money with<br /><span className="text-yellow-300">Rabbit Returns</span></h1>
            <p className="text-lg md:text-xl text-green-100 mb-8">Earn 2% daily returns over 180 days. Refer friends. Enter the raffle. Start growing today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/auth" className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition shadow">Start Investing</Link>
              <Link to="/raffle" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition">🎟️ Enter Raffle</Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img src="/images/hero-rabbit.jpg" alt="Rabbit Returns" className="rounded-3xl shadow-2xl w-full max-w-sm object-cover" />
          </div>
        </div>
      </section>
      <section className="py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="flex-1 rounded-2xl overflow-hidden shadow-md relative group cursor-pointer" onClick={() => navigate('/invest')}> 
            <img src="/images/rabbit-invest.jpg" alt="Invest" className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-green-900/50 flex items-end p-6"><div><h3 className="text-white text-2xl font-bold">Invest Now</h3><p className="text-green-100 text-sm">2% daily · 180 days · 6 tiers</p></div></div>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden shadow-md relative group cursor-pointer" onClick={() => navigate('/raffle')}> 
            <img src="/images/rabbit-raffle.jpg" alt="Raffle" className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-yellow-900/50 flex items-end p-6"><div><h3 className="text-white text-2xl font-bold">Enter Raffle</h3><p className="text-yellow-100 text-sm">R50 per ticket · 500 tickets total</p></div></div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Investment Tiers</h2>
          <p className="text-center text-gray-500 mb-10">All packages earn 2% daily over 180 days. Choose your tier.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className="bg-white rounded-2xl shadow-md overflow-hidden border border-green-100 hover:shadow-xl transition group">
                <div className="overflow-hidden h-44">
                  <img src={pkg.img} alt={pkg.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-green-700 mb-1">{pkg.name}</h3>
                  <p className="text-3xl font-extrabold text-gray-800 mb-1">R{pkg.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mb-1">2% daily · 180 days</p>
                  <p className="text-green-600 font-semibold mb-4">Total return: R{(pkg.amount * 0.02 * 180).toLocaleString()}</p>
                  <button onClick={() => navigate('/invest')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full">Invest Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-green-50 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Earn More with Referrals</h2>
          <p className="text-gray-500 mb-6">Invite friends and earn commissions on their investments — 3 levels deep.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <div className="bg-white rounded-xl shadow p-5 flex-1"><p className="text-3xl font-extrabold text-green-600">5%</p><p className="text-gray-600 font-medium">Level 1</p><p className="text-xs text-gray-400">Direct referrals</p></div>
            <div className="bg-white rounded-xl shadow p-5 flex-1"><p className="text-3xl font-extrabold text-green-500">3%</p><p className="text-gray-600 font-medium">Level 2</p><p className="text-xs text-gray-400">Their referrals</p></div>
            <div className="bg-white rounded-xl shadow p-5 flex-1"><p className="text-3xl font-extrabold text-green-400">2%</p><p className="text-gray-600 font-medium">Level 3</p><p className="text-xs text-gray-400">3rd tier referrals</p></div>
          </div>
        </div>
      </section>
      <footer className="bg-gray-800 text-gray-400 py-8 px-4 text-center">
        <img src="/images/hero-rabbit.jpg" alt="logo" className="w-10 h-10 rounded-full object-cover mx-auto mb-2" />
        <p className="text-green-400 font-bold text-lg mb-1">🐰 Rabbit Returns</p>
        <p className="text-sm">© {new Date().getFullYear()} Rabbit Returns. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
