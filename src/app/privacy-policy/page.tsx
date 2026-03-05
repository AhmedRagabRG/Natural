'use client';

import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Privacy Policy Content */}
      <main className="privacy-policy">
        <h1>Privacy Policy</h1>

        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy describes how Natural Spices UAE ("we," "our,"
          or "us") collects, uses, and shares your personal information when
          you visit our website. By using our website, you agree to the
          collection and use of information in accordance with this policy.
        </p>

        <h2>2. Information We Collect</h2>
        <p>
          We collect several types of information from and about users of our
          website, including:
        </p>
        <ul>
          <li>
            Personal identification information (name, email address, phone
            number, delivery address)
          </li>
          <li>Order and transaction information</li>
          <li>
            Technical information about your device and internet connection
          </li>
          <li>Usage information about how you interact with our website</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Process and fulfill your orders</li>
          <li>Communicate with you about your orders and our services</li>
          <li>Improve our website and services</li>
          <li>Send you marketing communications (with your consent)</li>
          <li>Comply with our legal obligations</li>
        </ul>

        <h2>4. Information Sharing and Disclosure</h2>
        <p>We may share your personal information with:</p>
        <ul>
          <li>Service providers who assist in our operations</li>
          <li>Law enforcement when required by law</li>
          <li>Professional advisers and insurers</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal
          information. However, no method of transmission over the internet is
          100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Object to processing of your information</li>
          <li>Withdraw consent for marketing communications</li>
        </ul>

        <h2>7. Contact Information</h2>
        <p>
          For any questions about this Privacy Policy, please contact us at:
        </p>
        <p>
          Email: order@naturalspicesuae.com<br />
          Phone: 0527176007<br />
          Address: Dubai, UAE
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new Privacy Policy on this page.
          Changes are effective immediately upon posting.
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

export default PrivacyPolicyPage;