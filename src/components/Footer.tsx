'use client';

import React from 'react';
import Link from 'next/link';
import './Footer.css';
import { useOffers } from '../context/OffersContext';

const Footer: React.FC = () => {
  const { offers } = useOffers();

  return (
    <footer className="main-footer">
      <nav className="footer-nav">
        <Link href="/blogs">Blogs</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-conditions">Terms & Conditions</Link>
        <Link href="/shipping-policy">Shipping Policy</Link>
        <Link href="/refund-policy">Refund Policy</Link>
      </nav>

      <div className="footer-social">
        <a href="https://www.instagram.com/naturalspicesuae/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <i className="fa-brands fa-instagram"></i>
        </a>
        <a href="https://www.facebook.com/naturalspicesuae" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <i className="fa-brands fa-facebook-f"></i>
        </a>
        <a href="https://www.tiktok.com/@naturalspicesuae" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <i className="fa-brands fa-tiktok"></i>
        </a>
        <a href="https://www.linkedin.com/company/naturalspicesuae/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <i className="fa-brands fa-linkedin-in"></i>
        </a>
      </div>

      <div className="footer-payment">
        <i className="fa-brands fa-cc-visa" aria-label="Visa"></i>
        <i className="fa-brands fa-cc-mastercard" aria-label="Mastercard"></i>
      </div>

      <p className="copyright">&copy; 2026 Natural Spices and Foodstuff Trading LLC. All rights reserved.</p>
    </footer>
  );
};

export default Footer;