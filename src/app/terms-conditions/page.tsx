'use client';

import React from 'react';

const TermsConditionsPage: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Terms & Conditions Content */}
      <main className="terms-conditions">
        <h1>Terms & Conditions</h1>

        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing and using Natural Spices UAE&apos;s website and services,
          you agree to be bound by these Terms and Conditions. If you disagree
          with any part of these terms, you may not access our website or use
          our services.
        </p>

        <h2>2. Use of Our Services</h2>
        <p>When using our services, you agree to:</p>
        <ul>
          <li>
            Provide accurate and complete information when placing orders
          </li>
          <li>Use the website for lawful purposes only</li>
          <li>
            Not interfere with the security or functionality of the website
          </li>
          <li>Maintain the confidentiality of your account information</li>
        </ul>

        <h2>3. Orders and Payments</h2>
        <p>By placing an order, you agree to the following terms:</p>
        <ul>
          <li>Minimum order value is 30 AED</li>
          <li>Payment is accepted through Cash on Delivery (COD)</li>
          <li>Orders are subject to availability and confirmation</li>
          <li>Prices are in UAE Dirhams and may change without notice</li>
          <li>We reserve the right to refuse service to anyone</li>
        </ul>

        <h2>4. Delivery</h2>
        <p>Our delivery terms include:</p>
        <ul>
          <li>Delivery is available across UAE</li>
          <li>Delivery times may vary based on location and order volume</li>
          <li>Accurate delivery address must be provided</li>
          <li>Additional delivery charges may apply based on location</li>
          <li>Customer must be available to receive and pay for the order</li>
        </ul>

        <h2>5. Product Information</h2>
        <p>Regarding our products:</p>
        <ul>
          <li>Product images are for illustration purposes only</li>
          <li>
            We strive to maintain accurate product descriptions and pricing
          </li>
          <li>Product availability is subject to change without notice</li>
          <li>We reserve the right to modify or discontinue products</li>
        </ul>

        <h2>6. Returns and Refunds</h2>
        <p>Our return policy includes:</p>
        <ul>
          <li>Products must be checked at the time of delivery</li>
          <li>Complaints about quality must be reported immediately</li>
          <li>Refunds or replacements are subject to verification</li>
          <li>Opened products cannot be returned unless defective</li>
        </ul>

        <h2>7. Intellectual Property</h2>
        <p>
          All content on this website, including text, graphics, logos, and
          images, is the property of Natural Spices UAE and is protected by
          intellectual property laws. You may not use, reproduce, or
          distribute our content without permission.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          Natural Spices UAE shall not be liable for any indirect, incidental,
          special, or consequential damages resulting from the use or
          inability to use our services. This includes but is not limited to
          damages for loss of profits, data, or other intangible losses.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Changes will
          be effective immediately upon posting to the website. Your continued
          use of our services after changes constitutes acceptance of the
          modified terms.
        </p>

        <h2>10. Contact Information</h2>
        <p>
          For questions about these Terms & Conditions, please contact us at:
        </p>
        <p>
          Email: order@naturalspicesuae.com<br />
          Phone: 0527176007<br />
          Address: Dubai, UAE
        </p>

        <p className="last-updated">Last updated: July 2025</p>
      </main>

      <button onClick={handlePrint} className="print-button">
        <i className="fas fa-print"></i> Print
      </button>
      
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

export default TermsConditionsPage;