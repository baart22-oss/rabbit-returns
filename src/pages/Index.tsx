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
              <button
                onClick={() => user ? navigate('/invest') : navigate('/auth')}
                className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition shadow"
              >
                Start Investing
              </button>
              <Link to="/raffle" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition">🎟️ Enter Raffle</Link>
            </div>
          </div>

          <div className="flex-1 hidden md:block">
            <img src="/images/hero-rabbit.jpg" alt="Rabbit Returns hero" className="rounded-lg shadow-xl object-cover w-full h-64" />
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Investment packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {packages.map((p) => (
            <div key={p.name} className="bg-white rounded-xl shadow p-4">
              <img src={p.img} alt={p.name} className="w-full h-36 object-cover rounded mb-3" />
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <p className="text-sm text-gray-600">R{p.amount}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
