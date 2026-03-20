import React from 'react';

const WhatsAppFloat: React.FC = () => {
  return (
    <a
      href="https://wa.me/+971527176007"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      title="Contact us on WhatsApp"
      aria-label="Contact us on WhatsApp"
    >
      <i className="fab fa-whatsapp"></i>
    </a>
  );
};

export default WhatsAppFloat;
