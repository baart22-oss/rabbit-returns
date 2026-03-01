import React from 'react';
import './Index.css';

const Index = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: 'url(/path-to-your-background-image.jpg)' }}>
        <div className="hero-content">
          <h1>Welcome to Rabbit Returns</h1>
          <p>Your gateway to smart investments.</p>
        </div>
      </section>

      {/* Investment Packages Grid */}
      <section className="investment-packages">
        <h2>Investment Packages</h2>
        <div className="packages-grid">
          <div className="package">
            <h3>Basic Package</h3>
            <p>Details about the basic package.</p>
          </div>
          <div className="package">
            <h3>Standard Package</h3>
            <p>Details about the standard package.</p>
          </div>
          <div className="package">
            <h3>Premium Package</h3>
            <p>Details about the premium package.</p>
          </div>
        </div>
      </section>

      {/* Raffle Section */}
      <section className="raffle">
        <h2>Join Our Raffle</h2>
        <p>Participate for a chance to win exciting prizes!</p>
      </section>

      {/* Payment Details Card */}
      <section className="payment-details">
        <h2>Payment Details</h2>
        <p>Information about payment options.</p>
      </section>

      {/* WhatsApp Support Button */}
      <section className="whatsapp-support">
        <a href="https://wa.me/your-whatsapp-number" className="whatsapp-button">Support on WhatsApp</a>
      </section>

      {/* Footer */}
      <footer>
        <p>&copy; {new Date().getFullYear()} Rabbit Returns. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
