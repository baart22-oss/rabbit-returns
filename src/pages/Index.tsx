import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const packages = [
  { name: 'Bunny Starter', amount: 200 },
  { name: 'Rabbit Runner', amount: 500 },
  { name: 'Hare Hustler', amount: 1000 },
  { name: 'Warren Winner', amount: 2000 },
  { name: 'Burrow Boss', amount: 5000 },
  { name: 'Colony King', amount: 10000 },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <div className="flex gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Grow Your Money with Rabbit Returns</h1>
          <p className="text-lg md:text-xl text-green-100 mb-8">
            Earn 2% daily returns over 180 days. Join thousands of investors already growing their wealth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="bg-white text-green-700 font-semibold px-8 py-3 rounded-xl hover:bg-green-50 transition"
            >
              Start Investing
            </Link>
            <Link
              to="/raffle"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-700 transition"
            >
              Enter Raffle
            </Link>
          </div>
        </div>
      </section>

      {/* Investment Packages */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Investment Packages</h2>
          <p className="text-center text-gray-500 mb-10">Choose a package that suits you. All packages earn 2% daily over 180 days.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border border-green-100 hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-green-700 mb-1">{pkg.name}</h3>
                <p className="text-3xl font-extrabold text-gray-800 mb-1">R{pkg.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mb-1">2% daily · 180 days</p>
                <p className="text-green-600 font-semibold mb-4">
                  Total return: R{(pkg.amount * 0.02 * 180).toLocaleString()}
                </p>
                <button
                  onClick={() => navigate('/invest')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full"
                >
                  Invest Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="bg-green-50 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Earn More with Referrals</h2>
          <p className="text-gray-500 mb-6">Invite friends and earn commissions on their investments.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <div className="bg-white rounded-xl shadow p-5 flex-1">
              <p className="text-2xl font-bold text-green-600">5%</p>
              <p className="text-gray-600 font-medium">Level 1</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 flex-1">
              <p className="text-2xl font-bold text-green-500">3%</p>
              <p className="text-gray-600 font-medium">Level 2</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 flex-1">
              <p className="text-2xl font-bold text-green-400">2%</p>
              <p className="text-gray-600 font-medium">Level 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-4 text-center">
        <p className="text-green-400 font-bold text-lg mb-1">🐰 Rabbit Returns</p>
        <p className="text-sm">© {new Date().getFullYear()} Rabbit Returns. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;