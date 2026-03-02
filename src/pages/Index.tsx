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
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-green-700">🐰 Rabbit Returns</span>
          <div className="flex gap-3">
            {!loading && (
              user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition"
                >
                  Dashboard
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition"
                >
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Grow Your Wealth with Rabbit Returns
          </h1>
          <p className="text-lg md:text-xl mb-8 text-green-100">
            Invest smarter. Earn daily returns. Enter exclusive raffles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition"
            >
              Start Investing
            </Link>
            <Link
              to="/raffle"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-green-600 transition"
            >
              Enter Raffle
            </Link>
          </div>
        </div>
      </section>

      {/* Investment Packages */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-10">
            Investment Packages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-1">{pkg.name}</h3>
                <p className="text-3xl font-extrabold text-green-600 mb-2">
                  R{pkg.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mb-1">2% daily for 180 days</p>
                <p className="text-xs text-gray-400 mb-4">
                  Total: R{(pkg.amount * 0.02 * 180).toLocaleString()}
                </p>
                <Link
                  to="/invest"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition"
                >
                  Invest Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="bg-green-50 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Referral Programme</h2>
          <p className="text-gray-600 mb-6">
            Earn commissions when you refer friends to Rabbit Returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white rounded-xl shadow px-8 py-5">
              <p className="text-lg font-bold text-green-600">Level 1</p>
              <p className="text-2xl font-extrabold text-gray-800">5%</p>
            </div>
            <div className="bg-white rounded-xl shadow px-8 py-5">
              <p className="text-lg font-bold text-green-500">Level 2</p>
              <p className="text-2xl font-extrabold text-gray-800">3%</p>
            </div>
            <div className="bg-white rounded-xl shadow px-8 py-5">
              <p className="text-lg font-bold text-green-400">Level 3</p>
              <p className="text-2xl font-extrabold text-gray-800">2%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 text-center">
        <p className="font-bold text-white mb-1">🐰 Rabbit Returns</p>
        <p className="text-sm">© {new Date().getFullYear()} Rabbit Returns. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;