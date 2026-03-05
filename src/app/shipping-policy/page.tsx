'use client';

import React from 'react';

const ShippingPolicyPage: React.FC = () => {
  return (
    <>
      <main className="shipping-info-section">
        <div className="shipping-info-header">
          <h1>UAE Wide Delivery</h1>
          <p>
            We offer Next Day Delivery all over UAE using a local third-party courier partner.
          </p>
        </div>

        <div className="shipping-rates">
          <h2>
            <i className="fas fa-truck"></i>
            For UAE
          </h2>
          <ul className="rate-list">
            <li className="rate-item">
              <div className="rate-price">AED 10</div>
              <div className="rate-description">Orders up to AED 100</div>
            </li>
            <li className="rate-item">
              <div className="rate-price">AED 4</div>
              <div className="rate-description">Orders from AED 101 to AED 200</div>
            </li>
            <li className="rate-item">
              <div className="rate-price free">FREE</div>
              <div className="rate-description">Orders AED 201 and above</div>
            </li>
          </ul>

          <div className="shipping-notes">
            <h3>
              <i className="fas fa-info-circle"></i>
              Important Notes
            </h3>
            <ul>
              <li>
                Orders placed before 12pm are dispatched the same day for next-day delivery. Orders after 12pm are dispatched the following day for delivery the day after.
              </li>
              <li>
                We offer free delivery on orders above. But that is limited to 8KG order. For above 8KG, there will be 1 Dh additional for each additional KG charges for over weight fee.
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/+971527176007"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        title="Contact us on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>
    </>
  );
};

export default ShippingPolicyPage;