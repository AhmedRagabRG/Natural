'use client';

import { useEffect, useState } from 'react';
import "./page.css"
import { gtmPurchase } from '../../utils/gtm';
import { ForgotItemsModal } from '@/components/ForgotItemsModal';

interface Product {
  product_id: number;
  name: string;
  price: number;
  special_price?: number;
  discount_percentage?: number;
  category?: {
    id: number;
    name: string;
  };
}

export default function OrderSuccessPage() {
  const [orderNumber, setOrderNumber] = useState('N-AE-309938');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isDiscountSectionOpen, setIsDiscountSectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [existingNumbers, setExistingNumbers] = useState<string[]>([]);
  const [showForgotItemsModal, setShowForgotItemsModal] = useState(false);
  const [orderProductIds, setOrderProductIds] = useState<number[]>([]);

  useEffect(() => {
    // Get order number from localStorage
    const savedOrderId = localStorage.getItem('lastOrderId');
    if (savedOrderId) {
      setOrderNumber(savedOrderId);
    } else {
      setOrderNumber('N-AE-1001');
    }
    setIsLoading(false);
    
    // Get product IDs from last order
    const orderDataStr = localStorage.getItem('lastOrderData');
    if (orderDataStr) {
      try {
        const orderData = JSON.parse(orderDataStr);
        if (orderData.items && Array.isArray(orderData.items)) {
          const productIds = orderData.items.map((item: any) => parseInt(item.id)).filter((id: number) => !isNaN(id));
          setOrderProductIds(productIds);
        }
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    }
    
    // Fetch featured products
    fetchFeaturedProducts();
    
    // Fire GTM purchase event
    firePurchaseEvent(savedOrderId || 'N-AE-1001');
    
    // Check if modal was already shown for this order
    const modalShownKey = `modalShown_${savedOrderId}`;
    const modalAlreadyShown = localStorage.getItem(modalShownKey);
    
    // Show forgot items modal after 2 seconds only if not shown before
    if (!modalAlreadyShown) {
      const timer = setTimeout(() => {
        setShowForgotItemsModal(true);
        // Mark modal as shown for this order
        localStorage.setItem(modalShownKey, 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const firePurchaseEvent = (orderId: string) => {
    try {
      // Get order data from localStorage (saved during checkout)
      const orderDataStr = localStorage.getItem('lastOrderData');
      const orderData = orderDataStr ? JSON.parse(orderDataStr) : null;
      
      if (orderData && orderData.items && orderData.items.length > 0) {
        const couponCode = orderData.coupon || undefined;
        const discountAmount = orderData.discount || 0;
        
        gtmPurchase(
          orderId,
          orderData.items,
          orderData.total || 0,
          orderData.shipping || 0,
          0, // tax (not applicable in UAE)
          couponCode,
          discountAmount
        );
        
        // Clear order data after firing event
        localStorage.removeItem('lastOrderData');
      } else {
        // Fallback: create a basic purchase event without items
        gtmPurchase(orderId, [], 0, 0, 0);
      }
    } catch (error) {
      console.error('Error firing GTM purchase event:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products/featured?limit=10');
      const data = await response.json();
      
      if (data.success && data.data) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const normalizePhone = (val: string) => (val || '').replace(/\D/g, '');

  const getReferralPayloads = () => {
    const entries = [
      { name: (document.getElementById('name-1') as HTMLInputElement)?.value?.trim(), number: (document.getElementById('phone-1') as HTMLInputElement)?.value?.trim() },
      { name: (document.getElementById('name-2') as HTMLInputElement)?.value?.trim(), number: (document.getElementById('phone-2') as HTMLInputElement)?.value?.trim() },
      { name: (document.getElementById('name-3') as HTMLInputElement)?.value?.trim(), number: (document.getElementById('phone-3') as HTMLInputElement)?.value?.trim() },
    ];

    return entries
      .filter(e => e && (e.name || e.number))
      .map(e => ({ name: e.name || '', number: normalizePhone(e.number || '') }));
  };

  const handleValidateAndSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitMessage('');
      setExistingNumbers([]);

      const payloads = getReferralPayloads();
      if (payloads.length === 0) {
        setSubmitMessage('Please enter at least one referral entry');
        return;
      }

      // Require the numeric DB order id. Do not fall back to AWB id.
      const orderDbId = localStorage.getItem('lastOrderDbId');
      if (!orderDbId) {
        setSubmitMessage('Cannot submit referrals currently: order not yet linked to database. Please try again in a few moments or after completing the order.');
        return;
      }
      const numericOrderId = Number(orderDbId);
      if (!Number.isInteger(numericOrderId)) {
        setSubmitMessage('Invalid order ID for referral submission. Please try again later.');
        return;
      }

      // 1) Check if any number already exists
      const existing: string[] = [];
      for (const p of payloads) {
        if (!p.number) continue;
        const res = await fetch(`/api/referrals/${p.number}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            existing.push(p.number);
          }
        }
      }

      if (existing.length > 0) {
        setExistingNumbers(existing);
        setSubmitMessage('Some numbers already exist, please review the fields highlighted in red');
        return;
      }

      // 2) Send POST for each entry
      const results: { ok: boolean; data: unknown }[] = [];
      for (const p of payloads) {
        if (!p.name || !p.number) continue;
        const res = await fetch('/api/referrals', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ order_id: numericOrderId, name: p.name, number: p.number })
         });
        const data = await res.json();
        results.push({ ok: res.ok, data });
      }

      if (results.some(r => !r.ok)) {
        setSubmitMessage('Submitted with some errors, please review your inputs');
      } else {
        setSubmitMessage('Submitted successfully!');
      }
    } catch (e) {
      setSubmitMessage('An unexpected error occurred. Please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="order-success-page">
        <div className="container">
          <div className="thank-you-section">
            <div className="thank-you-header">
              <i className="fas fa-check-circle"></i>
              <h1>Thank you for your order!</h1>
            </div>

            <div className="order-details">
              <div className="order-number">Order Number: {orderNumber}</div>
              <div className="email-note">
                A copy of your order has been sent to your email. If not received, please check your spam folder.
              </div>
            </div>

            <div className="delivery-info">
              <h3>
                <i className="fas fa-truck"></i>
                Delivery Details
              </h3>
              <p>
                Orders placed before 12 PM are dispatched the same day for next-day delivery.
                Orders after 12 PM ship the following day, arriving the day after.
                For urgent requests, please contact us now.
              </p>
            </div>

            <div className="whatsapp-section">
              <div className="whatsapp-content">
                <h3>Please Note</h3>
                <p>For faster assistance, please message us on WhatsApp by clicking the icon below.</p>
                <a href="https://wa.me/+971527176007" target="_blank" className="whatsapp-button">
                  <i className="fab fa-whatsapp"></i>
                  Message us on WhatsApp
                </a>
              </div>
            </div>

            {/* Get Extra 10% OFF */}
            <div className="get-extra-discount">
              <div 
                className={`section-header ${isDiscountSectionOpen ? 'open' : ''}`}
                onClick={() => setIsDiscountSectionOpen(!isDiscountSectionOpen)}
              >
                <h3 className='get-extra-discount-font'>
                  <i className="fas fa-gift"></i>
                  Get Extra 10% OFF on Your Next Order
                </h3>
                <i className="fas fa-chevron-down"></i>
              </div>
              
              {isDiscountSectionOpen && (
                <div className="referral-form">
                <p className="form-description">
                  We request your help to reach out to more people in spreading about our products & services. We thank you in advance for your referral. Your discount coupon will be sent to you shortly :)
                </p>
                
                <div className="referral-group">
                  <div className="referral-header">
                    <div className="referral-number">1</div>
                    <h4 style={{margin: 0, color: '#333', fontSize: '16px'}}>Friend&apos;s Contact Information</h4>
                   </div>
                   <div className="referral-inputs">
                     <div className="input-group">
                       <label htmlFor="name-1">Friend&apos;s Name</label>
                      <input 
                        type="text" 
                        className="input" 
                        id="name-1"
                        placeholder="Enter friend&apos;s name"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="phone-1">Phone Number</label>
                      <input 
                        type="tel" 
                        className="input" 
                        id="phone-1"
                        placeholder="+971 XX XXX XXXX"
                        pattern="[+][0-9]{1,}"
                        style={{ borderColor: existingNumbers.includes((document.getElementById('phone-1') as HTMLInputElement)?.value?.replace(/\D/g, '') || '') ? '#d9534f' : undefined }}
                      />
                    </div>
                  </div>
                </div>

                <div className="referral-group">
                  <div className="referral-header">
                    <div className="referral-number">2</div>
                    <h4 style={{margin: 0, color: '#333', fontSize: '16px'}}>Friend&apos;s Contact Information</h4>
                   </div>
                   <div className="referral-inputs">
                     <div className="input-group">
                       <label htmlFor="name-2">Friend&apos;s Name</label>
                      <input 
                        type="text" 
                        className="input" 
                        id="name-2"
                        placeholder="Enter friend&apos;s name"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="phone-2">Phone Number</label>
                      <input 
                        type="tel" 
                        className="input" 
                        id="phone-2"
                        placeholder="+971 XX XXX XXXX"
                        pattern="[+][0-9]{1,}"
                        style={{ borderColor: existingNumbers.includes((document.getElementById('phone-2') as HTMLInputElement)?.value?.replace(/\D/g, '') || '') ? '#d9534f' : undefined }}
                      />
                    </div>
                  </div>
                </div>

                <div className="referral-group">
                  <div className="referral-header">
                    <div className="referral-number">3</div>
                    <h4 style={{margin: 0, color: '#333', fontSize: '16px'}}>Friend&apos;s Contact Information</h4>
                   </div>
                   <div className="referral-inputs">
                     <div className="input-group">
                       <label htmlFor="name-3">Friend&apos;s Name</label>
                      <input 
                        type="text" 
                        className="input" 
                        id="name-3"
                        placeholder="Enter friend&apos;s name"
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="phone-3">Phone Number</label>
                      <input 
                        type="tel" 
                        className="input" 
                        id="phone-3"
                        placeholder="+971 XX XXX XXXX"
                        pattern="[+][0-9]{1,}"
                        style={{ borderColor: existingNumbers.includes((document.getElementById('phone-3') as HTMLInputElement)?.value?.replace(/\D/g, '') || '') ? '#d9534f' : undefined }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  {submitMessage && (
                    <p style={{ marginBottom: '15px', color: submitMessage.toLowerCase().includes('error') || submitMessage.toLowerCase().includes('exist') ? '#d9534f' : '#28a745', textAlign: 'center', fontWeight: '500' }}>
                      {submitMessage}
                    </p>
                  )}
                  <button type="button" className="btn btn-primary" onClick={handleValidateAndSubmit} disabled={isSubmitting}>
                    <i className="fas fa-check"></i>
                    {isSubmitting ? 'Submitting...' : 'Validate & Submit'}
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/+971527176007"
        target="_blank"
        className="whatsapp-float"
        title="Contact us on WhatsApp"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#25D366',
          color: 'white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* Forgot Items Modal */}
      <ForgotItemsModal
        isOpen={showForgotItemsModal}
        onClose={() => setShowForgotItemsModal(false)}
        orderItems={orderProductIds}
      />
    </>
  );
}