'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '../utils/price';

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  weight?: number;
  unit?: string;
}

interface UpsellModalProps {
  isOpen: boolean;
  items: CartItem[];
  onConfirm: (upsellItems: { id: string; extraQty: number; discountPerUnit: number }[]) => void;
  onSkip: () => void;
}

const REQUIRED_EXTRA_QTY = 2;
const DISCOUNT_PERCENT = 10;

const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, items, onConfirm, onSkip }) => {
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setExtraQuantities({});
    }
  }, [isOpen]);

  const totalExtra = useMemo(() => {
    return Object.values(extraQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [extraQuantities]);

  const totalSavings = useMemo(() => {
    return Object.entries(extraQuantities).reduce((sum, [id, qty]) => {
      const item = items.find(i => i.id === id);
      if (!item || qty === 0) return sum;
      return sum + (item.price * qty * DISCOUNT_PERCENT) / 100;
    }, 0);
  }, [extraQuantities, items]);

  const totalExtraCost = useMemo(() => {
    return Object.entries(extraQuantities).reduce((sum, [id, qty]) => {
      const item = items.find(i => i.id === id);
      if (!item || qty === 0) return sum;
      return sum + item.price * qty;
    }, 0);
  }, [extraQuantities, items]);

  const handleAdd = (itemId: string) => {
    if (totalExtra >= REQUIRED_EXTRA_QTY) return;
    setExtraQuantities(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleRemove = (itemId: string) => {
    setExtraQuantities(prev => {
      const current = prev[itemId] || 0;
      if (current <= 0) return prev;
      const updated = { ...prev, [itemId]: current - 1 };
      if (updated[itemId] === 0) delete updated[itemId];
      return updated;
    });
  };

  const handleConfirm = () => {
    const upsellItems = Object.entries(extraQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, extraQty]) => {
        const item = items.find(i => i.id === id);
        const discountPerUnit = item ? (item.price * DISCOUNT_PERCENT) / 100 : 0;
        return { id, extraQty, discountPerUnit };
      });
    onConfirm(upsellItems);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onSkip}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '12px' : '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '520px',
          maxHeight: isMobile ? '85vh' : '75vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            padding: isMobile ? '12px' : '16px 24px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: 700 }}>
            Save 10% – Add 2 More!
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: isMobile ? '11px' : '12px', opacity: 0.95 }}>
            Add 2 extra items from your cart and get 10% off on them
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '12px 20px 4px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: totalExtra === REQUIRED_EXTRA_QTY ? '#16a34a' : '#6b7280',
          }}>
            <span>{totalExtra} / {REQUIRED_EXTRA_QTY} items added</span>
            {totalExtra === REQUIRED_EXTRA_QTY && (
              <span style={{ color: '#16a34a' }}>✓ You save AED {formatPrice(totalSavings)}!</span>
            )}
          </div>
          <div style={{
            height: '6px',
              backgroundColor: totalExtra >= REQUIRED_EXTRA_QTY ? '#86efac' : '#e5e7eb',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
            <div style={{
              height: '100%',
              width: `${(totalExtra / REQUIRED_EXTRA_QTY) * 100}%`,
              backgroundColor: totalExtra === REQUIRED_EXTRA_QTY ? '#16a34a' : '#22c55e',
              borderRadius: '3px',
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }} />
          </div>
        </div>

        {/* Items list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px 16px',
          }}
        >
          {items.map(item => {
            const extra = extraQuantities[item.id] || 0;
            const discountedPrice = item.price * (1 - DISCOUNT_PERCENT / 100);
            const imageUrl = item.image
              ? item.image.startsWith('http')
                ? item.image
                : `https://dashboard.naturalspicesuae.com/uploads/${item.image}`
              : null;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  backgroundColor: extra > 0 ? '#f0fdf4' : '#f9fafb',
                  borderRadius: '10px',
                  border: extra > 0 ? '1.5px solid #86efac' : '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Product image */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#f3f4f6',
                }}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}>📦</div>
                  )}
                </div>

                {/* Product info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 600,
                    color: '#1f2937',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      In cart: {item.quantity}
                    </span>
                    {extra > 0 && (
                      <span style={{
                        fontSize: '11px',
                        color: '#16a34a',
                        fontWeight: 600,
                        backgroundColor: '#dcfce7',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}>
                        +{extra} @ AED {formatPrice(discountedPrice)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>
                      AED {formatPrice(item.price)}
                    </span>
                    {extra > 0 && (
                      <span style={{
                        fontSize: '12px',
                        color: '#16a34a',
                        fontWeight: 600,
                      }}>
                        → AED {formatPrice(discountedPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add/Remove buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}>
                  {extra > 0 && (
                    <button
                      onClick={() => handleRemove(item.id)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#fff',
                        color: '#ef4444',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                  )}
                  <button
                    onClick={() => handleAdd(item.id)}
                    disabled={totalExtra >= REQUIRED_EXTRA_QTY}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: totalExtra >= REQUIRED_EXTRA_QTY
                        ? (extra > 0 ? '#86efac' : '#e5e7eb')
                        : '#22c55e',
                      color: totalExtra >= REQUIRED_EXTRA_QTY
                        ? (extra > 0 ? '#166534' : '#9ca3af')
                        : '#fff',
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: totalExtra >= REQUIRED_EXTRA_QTY ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            padding: '16px 20px',
            backgroundColor: '#fafafa',
          }}
        >
          {/* Summary when items selected */}
          {totalExtra > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              fontSize: '13px',
            }}>
              <div>
                <div style={{ color: '#6b7280' }}>
                  Extra items cost: <strong>AED {formatPrice(totalExtraCost)}</strong>
                </div>
                {totalExtra === REQUIRED_EXTRA_QTY && (
                  <div style={{ color: '#16a34a', fontWeight: 600 }}>
                    Your discount: <strong>−AED {formatPrice(totalSavings)}</strong>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#1f2937', fontWeight: 700, fontSize: '15px' }}>
                  AED {formatPrice(
                    totalExtra === REQUIRED_EXTRA_QTY
                      ? totalExtraCost - totalSavings
                      : totalExtraCost
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onSkip}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid #d1d5db',
                backgroundColor: '#fff',
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              No Thanks
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalExtra !== REQUIRED_EXTRA_QTY}
              style={{
                flex: 1.5,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: totalExtra === REQUIRED_EXTRA_QTY ? '#16a34a' : '#d1d5db',
                color: totalExtra === REQUIRED_EXTRA_QTY ? '#fff' : '#9ca3af',
                fontSize: '14px',
                fontWeight: 700,
                cursor: totalExtra === REQUIRED_EXTRA_QTY ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              {totalExtra === REQUIRED_EXTRA_QTY
                ? `Add & Save AED ${formatPrice(totalSavings)}`
                : `Add ${REQUIRED_EXTRA_QTY - totalExtra} more to save`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsellModal;
