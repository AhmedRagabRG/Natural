'use client';

import React from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/price';

const CartModal: React.FC = () => {
  const { state, removeItem, updateQuantity, clearCart, toggleModal, toggleCheckoutModal } = useCart();

  if (!state.showModal) {
    return null;
  }

  return (
    <div 
      className="cart-modal-backdrop" 
      onClick={() => toggleModal(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        className="cart-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative'
          }}>
            <i className="fas fa-shopping-cart"></i>
            Shopping Cart
            {state.count > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--color-yellow)',
                color: 'var(--color-black)',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}>
                {state.count}
              </span>
            )}
          </h3>
          <button
            onClick={() => toggleModal(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--color-grey)',
              padding: '5px',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {state.items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--color-grey)'
            }}>
              <i className="fas fa-shopping-cart" style={{
                fontSize: '3rem',
                marginBottom: '20px',
                opacity: 0.3
              }}></i>
              <h4 style={{ margin: '0 0 10px 0' }}>Your cart is empty</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Add some delicious spices to get started!</p>
            </div>
          ) : (
            <>
              {state.items.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  {item.image && (
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <Image 
                        src={item.image || '/assets/du.png'} 
                        alt={item.name}
                        fill
                        style={{
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        sizes="60px"
                      />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      margin: '0 0 5px 0',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>{item.name}</h5>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                      fontSize: '0.9rem'
                    }}>
                      {item.originalPrice && item.originalPrice > item.price ? (
                        <div className='flex ' style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span
                            style={{
                              textDecoration: 'line-through',
                              color: '#999',
                              fontSize: '0.85em'
                            }}
                          >
                            <i className="aed"> </i>
                            <span>{formatPrice(item.originalPrice)}</span>
                          </span>
                          <span
                            style={{
                              color: '#28a745',
                              fontSize: '1em',
                              fontWeight: 'bold'
                            }}
                          >
                            <span>{formatPrice(item.price)}</span>
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-primary)' }}>
                          <i className="aed"> </i>
                          <span>{formatPrice(item.price)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{
                        background: 'none',
                        border: '1px solid #ddd',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span style={{
                      minWidth: '30px',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{
                        background: 'none',
                        border: '1px solid #ddd',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        padding: '5px',
                        marginLeft: '10px'
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #eee',
            background: '#f9f9f9'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <span style={{ fontWeight: '600' }}>Subtotal:</span>
              <span style={{ fontWeight: '600' }} className="price-inline"><i className="aed"> </i><span className="amount">{formatPrice(state.subtotal)}</span></span>
            </div>
            
            {state.discount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                color: 'var(--color-primary)'
              }}>
                <span>Discount:</span>
                <span className="price-inline">-<i className="aed"> </i><span className="amount">{formatPrice(state.discount)}</span></span>
              </div>
            )}
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <span>Shipping:</span>
              <span>{state.shipping === 0 ? 'Free' : <span className="price-inline"><i className="aed"> </i><span className="amount">{formatPrice(state.shipping)}</span></span> }</span>
            </div>
            {state.overWeightFee > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <span>Over Weight Fee</span>
                <span className="price-inline"><i className="aed"> </i><span className="amount">{formatPrice(state.overWeightFee)}</span></span>
              </div>
            )}
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              fontSize: '1.2rem',
              fontWeight: '700',
              borderTop: '1px solid #ddd',
              paddingTop: '15px'
            }}>
              <span>Total:</span>
              <span style={{ color: 'var(--color-primary)' }} className="price-inline"><i className="aed"> </i><span className="amount">{formatPrice(state.total)}</span></span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={() => toggleModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #dc3545',
                  borderRadius: '25px',
                  background: 'transparent',
                  color: '#dc3545',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Go Back
              </button>
              {state.subtotal >= 30 ? (
                <button
                  onClick={() => {
                    toggleModal(false);
                    toggleCheckoutModal(true);
                  }}
                  style={{
                    flex: 2,
                    padding: '12px',
                    border: '2px solid var(--color-yellow)',
                    borderRadius: '25px',
                    background: 'var(--color-yellow)',
                    color: 'var(--color-black)',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="fas fa-credit-card" style={{ marginRight: '8px' }}></i>
                  Checkout
                </button>
              ) : (
                <div
                  style={{
                    flex: 2,
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '25px',
                    background: '#f8f9fa',
                    color: '#6c757d',
                    fontWeight: '500',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div>Min order 30<i className="aed"> </i></div>
                  <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>Add more to proceed</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;