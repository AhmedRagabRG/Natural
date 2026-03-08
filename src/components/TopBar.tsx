import React from 'react';
import './TopBar.css';

const TopBar: React.FC = () => {
  return (
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
  );
};

export default TopBar;