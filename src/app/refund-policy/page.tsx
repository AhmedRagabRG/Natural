'use client';

import React from 'react';

const RefundPolicyPage: React.FC = () => {
  return (
    <>
      <main className="container policy-container">
        <div className="policy-content">
          <div className="policy-header">
            <h1 className="policy-title">Refund Policy</h1>
            <p className="policy-subtitle">
              We strive to provide the best service possible. Our refund policy is designed to be fair and transparent.
            </p>
          </div>
          
          <div className="policy-box">
            <div className="policy-section">
              <h2 className="section-title">
                <i className="fas fa-shield-alt"></i>
                Our Commitment
              </h2>
              <p className="policy-text">
                If it is our fault, please don&apos;t worry we will compensate with refund or discount next order.
              </p>
            </div>

            <div className="policy-section">
              <h2 className="section-title">
                <i className="fas fa-truck-loading"></i>
                Collection & Redelivery
              </h2>
              <p className="policy-text">
                Collecting back items or re-delivering will cost delivery charge to the customer at a fixed rate of AED 12.
              </p>
            </div>

            <div className="info-box">
              <div className="info-box-title">
                <i className="fas fa-info-circle"></i>
                Important Note
              </div>
              <div className="info-box-content">
                To ensure a smooth refund process, please keep your order number and receipt handy when contacting our customer service team.
              </div>
            </div>

            <div className="contact-section">
              <p className="contact-text">Have questions about our refund policy?</p>
              <a href="https://wa.me/+971527176007" className="contact-button" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-whatsapp"></i>
                Contact Us on WhatsApp
              </a>
            </div>
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

export default RefundPolicyPage;