'use client';

import React from 'react';

const TopBar: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .top-bar {
          background: linear-gradient(90deg, #151515, #2a2a2a);
          color: var(--color-white);
          padding: 8px 0;
          font-size: 13px;
          position: relative;
          overflow: hidden;
        }

        .top-bar::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, var(--color-green), var(--color-yellow));
          animation: progress 12s linear infinite;
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .top-bar .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .top-bar .info-side,
        .top-bar .contact-side {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .top-bar span {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .top-bar i {
          font-size: 13px;
          color: var(--color-green);
        }

        .top-bar a {
          color: var(--color-white);
          text-decoration: none;
          transition: 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .top-bar a:hover {
          color: var(--color-yellow);
        }

        .top-bar .highlight {
          background: rgba(239, 146, 24, 0.15);
          color: var(--color-yellow);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .top-bar {
            font-size: 12px;
            padding: 6px 0;
          }

          .top-bar .container {
            justify-content: center;
            gap: 15px;
          }

          .top-bar .info-side,
          .top-bar .contact-side {
            gap: 15px;
          }

          .top-bar i {
            font-size: 12px;
          }

          .top-bar .email {
            display: none;
          }
        }

        @media (max-width: 576px) {
          .top-bar {
            font-size: 11px;
            padding: 5px 0;
          }

          .top-bar .info-side,
          .top-bar .contact-side {
            gap: 12px;
          }

          .top-bar i {
            font-size: 11px;
          }

          .top-bar .working-hours {
            display: none;
          }
        }
      `}</style>
      
      <div className="top-bar">
        <div className="container">
          <div className="info-side">
            <span className="min-order">
              <i className="fas fa-shopping-bag"></i>
              Min: <span className="highlight">30 <i className="aed"></i></span>
            </span>
            <span className="delivery">
              <i className="fas fa-truck"></i>
              UAE Wide Delivery
            </span>
            <span className="working-hours">
              <i className="fas fa-money-bill-wave"></i>
              COD Available
            </span>
          </div>

          <div className="contact-side">
            <span className="phone-number">
              <i className="fa-solid fa-phone"></i>
              0527176007
            </span>
            <span className="email">
              <a href="mailto:order@naturalspicesuae.com">
                <i className="fas fa-envelope"></i>
                order@naturalspicesuae.com
              </a>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopBar;