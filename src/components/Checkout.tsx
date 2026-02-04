'use client';

import React from 'react';

interface CheckoutProps {
  onCartClick?: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ onCartClick }) => {
  return (
    <>
      <style jsx>{`
        .checkout-container {
          position: relative;
          padding-bottom: 70px; /* Height of the footer */
        }

        .checkout-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--color-white);
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          z-index: 50;
          height: 70px;
          padding: 0.75rem 1rem;
        }

        .cart-trigger-btn {
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 1rem;
          font-weight: 600;
          background: linear-gradient(145deg, #2ecc71, #27ae60);
          border: none;
          border-radius: 25px;
          color: white;
          padding: 12px 24px;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cart-trigger-btn:hover {
          background: linear-gradient(145deg, #27ae60, #2ecc71);
          transform: translateY(-2px);
          box-shadow: 0 7px 14px rgba(46, 204, 113, 0.25),
            0 3px 6px rgba(0, 0, 0, 0.12);
        }

        .cart-trigger-btn i {
          font-size: 1.1rem;
        }

        .cart-count {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--color-yellow);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: cartBadgePulse 0.5s ease;
        }

        @keyframes cartBadgePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        @media (max-width: 640px) {
          .checkout-footer {
            padding: 0.5rem 0.75rem;
          }

          .cart-trigger-btn {
            max-width: none;
            font-size: 0.875rem;
          }

          .cart-trigger-btn i {
            font-size: 1rem;
          }
        }
      `}</style>
      
      <div className="checkout-container">
        <div className="checkout-footer">
          <button
            onClick={onCartClick}
            className="cart-trigger-btn"
            type="button"
            aria-label="View Cart and Checkout (Earn points on every order and redeem them!)"
            title="Earn points on every order and redeem them!"
          >
            <i className="fas fa-shopping-cart"></i>
            View Cart & Checkout
          </button>
        </div>
      </div>
    </>
  );
};

export default Checkout;