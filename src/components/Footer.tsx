'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Offer {
  id: number;
  name: string;
  event_url: string;
  status: number;
  created_at: number;
}

const Footer: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Fetch offers from API
  const fetchOffers = async () => {
    setOffersLoading(true);
    try {
      const response = await fetch("/api/events");
      const data = await response.json();

      if (data.success && data.data) {
        // Handle different API response structures
        const events = Array.isArray(data.data)
          ? data.data
          : data.data.events || [];
        // Filter only active offers (status = 1)
        const activeOffers = events.filter(
          (offer: Offer) => offer.status === 1
        );
        setOffers(activeOffers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  // Fetch offers on component mount
  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <footer className="main-footer">
      <nav className="footer-nav">
        <Link href="/blogs">Blogs</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-conditions">Terms & Conditions</Link>
        <Link href="/shipping-policy">Shipping Policy</Link>
        <Link href="/refund-policy">Refund Policy</Link>
      </nav>

      <p className="copyright">&copy; 2025 Natural Spices UAE. All rights reserved.</p>
    </footer>
  );
};

export default Footer;