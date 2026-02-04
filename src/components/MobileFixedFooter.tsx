'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

interface Offer {
  id: number;
  name: string;
  event_url: string;
  status: number;
  created_at: number;
}

const MobileFixedFooter: React.FC = () => {
  const { state, toggleCheckoutModal } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Fetch offers from API
  const fetchOffers = async () => {
    setOffersLoading(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Handle different API response structures
        const events = Array.isArray(data.data)
          ? data.data
          : data.data.events || [];
        // Filter only active offers (status = 1)
        const activeOffers = events.filter((offer: Offer) => offer.status === 1);
        setOffers(activeOffers);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch offers on component mount
  useEffect(() => {
    fetchOffers();
  }, []);
  
  return (
    <div 
      className="mobile-fixed-footer"
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: isMobile ? 'block' : 'none',
        borderTop: '4px solid transparent',
        borderImage: 'linear-gradient(to right, var(--color-yellow), var(--color-green), var(--color-yellow)) 1',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >

      
      <div 
        className="mobile-fixed-footer-content"
        style={{
          display: 'flex',
          justifyContent: offers.length <= 4 ? 'space-around' : 'flex-start',
          alignItems: 'center',
          gap: offers.length <= 4 ? '0' : '8px',
          overflowX: offers.length > 4 ? 'auto' : 'visible',
          padding: '0 10px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div 
            className="item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: offers.length <= 4 ? '6px' : '4px',
              fontSize: offers.length <= 4 ? '12px' : '10px',
              color: 'var(--color-black)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: offers.length <= 4 ? '8px 12px' : '6px 8px',
              borderRadius: '6px',
              flexShrink: offers.length > 4 ? 0 : 1,
              minWidth: offers.length > 4 ? '60px' : 'auto',
              flex: offers.length <= 4 ? '1' : 'none'
            }}
          >
            <i className="fa-solid fa-house" style={{ fontSize: '18px' }}></i>
            <span style={{ fontWeight: '500' }}>Home</span>
          </div>
        </Link>

        {/* Dynamic Offers from API */}
        {offersLoading ? (
          <div 
            className="item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-black)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: '8px 12px',
              borderRadius: '8px',
              opacity: 0.7
            }}
          >
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '18px' }}></i>
            <span style={{ fontWeight: '500' }}>Loading...</span>
          </div>
        ) : offers.length > 0 ? (
          offers.map((offer) => (
            <Link key={offer.id} href={`/offer/${offer.event_url}`} style={{ textDecoration: 'none' }}>
              <div 
                className="item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--color-black)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: '8px 12px',
                  borderRadius: '8px'
                }}
              >
                <i className="fa-solid fa-gift" style={{ fontSize: '18px' }}></i>
                <span style={{ fontWeight: '500' }}>{offer.name}</span>
              </div>
            </Link>
          ))
        ) : (
          <Link href="/offers" style={{ textDecoration: 'none' }}>
            <div 
              className="item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--color-black)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              <i className="fa-solid fa-gift" style={{ fontSize: '18px' }}></i>
              <span style={{ fontWeight: '500' }}>Offers</span>
            </div>
          </Link>
        )}


        <div 
           className="item cart-item" 
           onClick={() => toggleCheckoutModal(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--color-black)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            padding: '8px 12px',
            borderRadius: '8px',
            position: 'relative'
          }}
        >
          <i className="fa-solid fa-cart-shopping" style={{ fontSize: '18px' }}></i>
          <button 
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: 'inherit',
              fontWeight: '500',
              cursor: 'pointer',
              padding: 0
            }}
          >
            Cart
          </button>
          {state.count > 0 && (
            <span 
              style={{
                position: 'absolute',
                top: '2px',
                right: '8px',
                background: 'var(--color-yellow)',
                color: 'var(--color-black)',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                border: '2px solid white'
              }}
            >
              {state.count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFixedFooter;