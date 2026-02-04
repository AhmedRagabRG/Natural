'use client';

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { formatPrice, calculateRewardPoints } from "../utils/price";
import { gtmBeginCheckout, gtmApplyCoupon } from '../utils/gtm';

const CheckoutModal: React.FC = () => {
  const { 
    state, 
    toggleCheckoutModal, 
    setCheckoutStep, 
    updateCheckoutForm, 
    placeOrder: originalPlaceOrder,
    removeItem,
    updateQuantity,
    redeemPoints,
    undoRedeemPoints
  } = useCart();
  const router = useRouter();

  const [captcha, setCaptcha] = useState({
    num1: Math.floor(Math.random() * 10) + 1,
    num2: Math.floor(Math.random() * 10) + 1,
    userAnswer: '',
    error: false
  });
  const [showCaptcha, setShowCaptcha] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [showCouponError, setShowCouponError] = useState(false);
  const [couponErrorMessage, setCouponErrorMessage] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    coupon_id: number;
    name: string;
    description: string;
    discount: number;
    coupon_code: string;
    numberoftime: string;
    numberoftimeused: string;
    expire_date: string | null;
    status: number;
    created_at: string;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [lastSearchedMobile, setLastSearchedMobile] = useState('');
  const [userRewardPoints, setUserRewardPoints] = useState(0);
  const [userRewardValue, setUserRewardValue] = useState(0);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showShippingInfo, setShowShippingInfo] = useState(false);
  const [showReturnInfo, setShowReturnInfo] = useState(false);
  const [dubaiError, setDubaiError] = useState(false);

  // Check if any item in cart is Dubai only
  const hasDubaiOnlyItems = React.useMemo(() => {
    return state.items.some(item => item.dubai_only === 1);
  }, [state.items]);

  // Handle city change with validation
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = e.target.value;
    
    if (hasDubaiOnlyItems && selectedCity && selectedCity !== 'Dubai') {
      setDubaiError(true);
      // Determine invalid items names for better message
      // const invalidItems = state.items.filter(item => item.dubai_only === 1).map(item => item.name).join(', ');
      setTimeout(() => setDubaiError(false), 5000); // Hide error after 5 seconds
      return; // Prevent change
    }
    
    setDubaiError(false);
    updateCheckoutForm({ city: selectedCity });
  };

  // Calculate payment method fees
  const getPaymentMethodFee = () => {
    switch (state.checkout.form.paymentMethod) {
      case 'cash':
        return 2.5; // COD charge
      case 'card':
        return 1; // PayLink charge
      default:
        return 0;
    }
  };

  // Fetch user reward points from the new API endpoints - IMPROVED VERSION
  const fetchUserRewardPoints = async (mobileNumber: string) => {
    try {
      const normalizedMobile = (mobileNumber || '').replace(/\D/g, '');
      if (!normalizedMobile || normalizedMobile.length < 8) {
        setUserRewardPoints(0);
        setUserRewardValue(0);
        return;
      }

      // Get all point transactions from our new API
      const pointsResponse = await fetch(`/api/points?mobile=${encodeURIComponent(normalizedMobile)}`);
      let totalEarnedPoints = 0;
      let totalRedeemedPoints = 0;
      
      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        if (pointsData.data && Array.isArray(pointsData.data)) {
          pointsData.data.forEach((record: { redeemPoints?: number }) => {
            const points = record.redeemPoints || 0;
            if (points > 0) {
              // Positive values are redeemed (spent) points
              totalRedeemedPoints += points;
            } else if (points < 0) {
              // Negative values are earned points
              totalEarnedPoints += Math.abs(points);
            }
          });
        }
      }

      // // Backward compatibility: only use legacy orders API if we DON'T have any earned records in our points DB
      // if (totalEarnedPoints === 0) {
      //   try {
      //     const ordersApiUrl = `/api/orders/guest?page=1&limit=100&sort=created_at&order=DESC&mobile=${encodeURIComponent(normalizedMobile)}`;
      //     const ordersResponse = await fetch(ordersApiUrl);
      //     const ordersData = await ordersResponse.json();
          
      //     if (ordersData.success && ordersData.data && ordersData.data.length > 0) {
      //       ordersData.data.forEach((order: { amount?: number | string }) => {
      //         let amountNum = 0;
      //         if (order.amount !== undefined && order.amount !== null) {
      //           const n = Number(order.amount);
      //           if (!Number.isNaN(n)) amountNum = n;
      //         }
      //         // Calculate points earned: 3 points per AED spent
      //         totalEarnedPoints += Math.floor(amountNum * 3);
      //       });
      //     }
      //   } catch (legacyErr) {
      //     console.warn('Legacy orders API unavailable, skipping legacy points calc', legacyErr);
      //   }
      // }
      
      // Available points = earned points - redeemed points
      const availablePoints = Math.max(0, totalEarnedPoints - totalRedeemedPoints);
      const pointsValue = parseFloat((availablePoints * 0.01).toFixed(2));
      
      setUserRewardPoints(availablePoints);
      setUserRewardValue(pointsValue);
      
    } catch (error) {
      console.error('❌ Error fetching user reward points:', error);
      setUserRewardPoints(0);
      setUserRewardValue(0);
    }
  };

  // Auto-fill user data based on mobile number
  const searchUserByMobile = async (mobileNumber: string) => {
    const normalized = (mobileNumber || '').replace(/\D/g, '');
    if (normalized.length < 8) {
      return;
    }

    // Always update points even if we already searched this number before
    await fetchUserRewardPoints(normalized);

    // Only skip autofill duplication; allow points refresh above
    if (normalized === lastSearchedMobile) {
      return;
    }

    setIsAutoFilling(true);
    setLastSearchedMobile(normalized);

    try {
      // Search for user by mobile number using the orders endpoint
      const apiUrl = `/api/orders/guest?page=1&limit=1&sort=created_at&order=DESC&mobile=${encodeURIComponent(normalized)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const latestOrder = data.data[0];
        // Prepare address without duplicating city if it's appended previously
        let autofillAddress = latestOrder.address || '';
        const latestCity = latestOrder.user_city || '';
        if (autofillAddress && latestCity) {
          const escapedCity = latestCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\s*,\\s*${escapedCity}\\s*$`, 'i');
          autofillAddress = autofillAddress.replace(regex, '');
        }
        
        // Auto-fill the form with the found user data
        const formData = {
          name: latestOrder.user_name || '',
          email: latestOrder.email || '',
          whatsapp: latestOrder.whatsapp_number ? latestOrder.whatsapp_number.replace(`+${state.checkout.form.mobileCountryCode}`, '') : '',
          whatsappCountryCode: latestOrder.whatsapp_number ? state.checkout.form.mobileCountryCode : '',
          city: latestOrder.user_city || '',
          address: autofillAddress
        };
        
        updateCheckoutForm(formData);
      } else {
      }
    } catch (error) {
      console.error('Error searching user by mobile:', error);
      // Don't reset points here; points were already fetched above
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Handle mobile number change with auto-fill
  const handleMobileChange = (value: string) => {
    updateCheckoutForm({ mobile: value });
    
    // Trigger auto-fill when user types 8 or more digits
    const normalized = (value || '').replace(/\D/g, '');
    if (normalized.length >= 8) {
      searchUserByMobile(value);
    }
  };

  // Auto-fetch points when modal opens and mobile already present
  React.useEffect(() => {
    if (state.checkout.showModal) {
      // Reset lastSearchedMobile when modal opens to allow re-fetching for same number
      setLastSearchedMobile('');
      
      // Auto-fill form from last checkout if form is empty
      if (!state.checkout.form.name && !state.checkout.form.mobile) {
        try {
          const lastCheckoutFormStr = localStorage.getItem('lastCheckoutForm');
          if (lastCheckoutFormStr) {
            const lastCheckoutForm = JSON.parse(lastCheckoutFormStr);
            updateCheckoutForm(lastCheckoutForm);
          }
        } catch (error) {
          console.error('Error loading last checkout form:', error);
        }
      }
      
      if (state.checkout.form.mobile && state.checkout.form.mobile.length >= 8) {
        fetchUserRewardPoints(state.checkout.form.mobile);
      }
      
      // Fire GTM begin_checkout event when checkout modal opens
      if (state.items.length > 0) {
        const couponCode = appliedCoupon?.coupon_code;
        gtmBeginCheckout(state.items, state.total, couponCode);
      }
    }
  }, [state.checkout.showModal, state.checkout.form.mobile]);

  // Calculate total product savings based on originalPrice vs sale price
  const totalProductSavings = React.useMemo(() => {
    try {
      return state.items.reduce((sum, item) => {
        const original = typeof item.originalPrice === 'number' ? item.originalPrice : item.price;
        const diff = Math.max(0, original - item.price);
        return sum + diff * (item.quantity || 1);
      }, 0);
    } catch {
      return 0;
    }
  }, [state.items]);

  if (!state.checkout.showModal) {
    return null;
  }

  // In verifyCaptcha, ensure we fetch updated points after order success
  const verifyCaptcha = async () => {
    const correctAnswer = captcha.num1 + captcha.num2;
    if (parseInt(captcha.userAnswer) === correctAnswer) {
      setIsProcessingOrder(true);
      setCaptcha({ ...captcha, error: false });

      // Generate unique order ID
      const orderId = 'N-AE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('lastOrderId', orderId);
      
      // Save checkout form data for future orders
      const checkoutFormData = {
        name: state.checkout.form.name,
        email: state.checkout.form.email,
        mobileCountryCode: state.checkout.form.mobileCountryCode,
        mobile: state.checkout.form.mobile,
        whatsappCountryCode: state.checkout.form.whatsappCountryCode,
        whatsapp: state.checkout.form.whatsapp,
        city: state.checkout.form.city,
        address: state.checkout.form.address,
        paymentMethod: state.checkout.form.paymentMethod,
      };
      localStorage.setItem('lastCheckoutForm', JSON.stringify(checkoutFormData));
      
      // Save order data for GTM purchase event
      const gtmOrderData = {
        items: state.items,
        total: state.subtotal + state.shipping + state.overWeightFee + getPaymentMethodFee() - 
               (appliedCoupon ? (state.subtotal * appliedCoupon.discount) / 100 : 0) - 
               (isRedeemed ? (userRewardValue || 0) : 0),
        subtotal: state.subtotal,
        shipping: state.shipping,
        discount: appliedCoupon ? (state.subtotal * appliedCoupon.discount) / 100 : 0,
        coupon: appliedCoupon?.coupon_code || null,
        redeemAmount: isRedeemed ? userRewardValue : 0
      };
      localStorage.setItem('lastOrderData', JSON.stringify(gtmOrderData));

      // Create order data for the POST request (send only available fields)
      const onlyDigits = (s: string | undefined) => (s ? s.replace(/\D/g, '') : undefined);
      const paymentTypeCode =
        state.checkout.form.paymentMethod === 'card' ? 2 : 1;
      const rawOrderData: Record<string, string | number | undefined> = {
        user_name: state.checkout.form.name,
        user_city: state.checkout.form.city,
        email: state.checkout.form.email,
        mobile: onlyDigits(state.checkout.form.mobile),
        whatsapp_number: state.checkout.form.whatsapp
          ? onlyDigits(state.checkout.form.whatsapp)
          : onlyDigits(state.checkout.form.mobile),
        amount: state.subtotal,
        delivery_charges: state.shipping,
        discount: appliedCoupon ? (state.subtotal * appliedCoupon.discount) / 100 : 0,
        service_fee: getPaymentMethodFee(),
        redeem_amount: isRedeemed ? userRewardValue : 0,
        shipping_charges: state.shipping,
        // Remove over_weight_fee as it doesn't exist in database
        total:
          state.subtotal +
          state.shipping +
          state.overWeightFee +
          getPaymentMethodFee() -
          (appliedCoupon ? (state.subtotal * appliedCoupon.discount) / 100 : 0) -
          (isRedeemed ? (userRewardValue || 0) : 0),
        address: state.checkout.form.address || undefined,
        payment_type: paymentTypeCode,
        delivery_type: paymentTypeCode,
        payment_status: 0,
        status: 1,
        awb_id: orderId,
        // order_status intentionally omitted
      };

      // Filter out undefined or empty string values (keep 0 values)
      const orderData = Object.entries(rawOrderData).reduce<Record<string, string | number>>((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          !(typeof value === 'string' && value.trim() === '')
        ) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | number>);

      // Process order in background (don't wait for completion)
      const processOrder = async () => {
        try {
          // Send POST request to create order with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const orderResponse = await fetch('/api/orders/guest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!orderResponse.ok) {
            const errText = await orderResponse.text().catch(() => '');
            console.error('Order creation failed:', orderResponse.status, errText);
            throw new Error(`Order API ${orderResponse.status}: ${errText}`);
          }

          const orderResult = await orderResponse.json();
          // Save the actual database order_id for referrals and order success page
          if (orderResult && orderResult.data && orderResult.data.order_id) {
            localStorage.setItem('lastOrderDbId', orderResult.data.order_id.toString());
            // Also save for order success page with N-AE format
            localStorage.setItem('lastOrderId', `N-AE-${orderResult.data.order_id}`);
            try {
              const onlyDigits = (s: string | undefined) => (s ? s.replace(/\D/g, '') : undefined);
              
              const rawOrderData = {
                order_id: orderResult.data.order_id,
                user_name: state.checkout.form.name,
                user_city: state.checkout.form.city,
                email: state.checkout.form.email,
                mobile: onlyDigits(state.checkout.form.mobile),
                whatsapp_number: state.checkout.form.whatsapp
                  ? onlyDigits(state.checkout.form.whatsapp)
                  : onlyDigits(state.checkout.form.mobile),
                address: state.checkout.form.address,
                items: JSON.stringify(state.items.map(item => ({
                  product_id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  weight: item.weight || 0
                })))
              };
              
              const rawOrderResponse = await fetch('/api/orders/raw', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(rawOrderData)
              });
              
              if (rawOrderResponse.ok) {
                console.log('send order mail')
                await sendOrderEmail(orderResult.data.order_id);
                
                // Send WhatsApp notification after email
                console.log('send order whatsapp', orderResult.data.order_id)
                await sendOrderWhatsApp(orderResult.data.order_id);
              } else {
                console.error('❌ Failed to create raw order after successful order');
              }
            } catch (rawOrderError) {
              console.error('❌ Error creating raw order after successful order:', rawOrderError);
            }
            
            // Create individual order items
            try {
              for (const item of state.items) {
                const orderItemData = {
                  order_id: orderResult.data.order_id,
                  product_id: parseInt(item.id),
                  price: item.price,
                  quantity: item.quantity,
                  total: item.price * item.quantity,
                  tracking_id: orderId,
                  item_status: 0,
                  is_paid: 0,
                  pay_vendor: 0,
                  pay_vendor_status: 0
                };
                
                const itemResponse = await fetch('/api/orders/items', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(orderItemData)
                });
                
                if (!itemResponse.ok) {
                  console.error(`❌ Failed to create order item for product ${item.id}`);
                }
              }
            } catch (itemsError) {
              console.error('❌ Error creating order items:', itemsError);
            }
          }

          // UPDATED: Record points redemption (spent) in database using new API
          if (isRedeemed && userRewardPoints > 0) {
            try {
              const mobile = onlyDigits(state.checkout.form.mobile);
              if (mobile) {
                const redemptionData = {
                  mobile: mobile,
                  redeem_points: userRewardPoints, // Positive value indicates spent points
                  status: 1 // 1 = redemption/spent
                };

                const pointsRedemptionResponse = await fetch('/api/points', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(redemptionData)
                });

                if (pointsRedemptionResponse.ok) {
                } else {
                  console.error('❌ Failed to record points redemption');
                }
              }
            } catch (pointsError) {
              console.error('❌ Error recording points redemption:', pointsError);
            }
          }

          // NEW: Add earned points for current order to our database via new API
          try {
            const mobile = onlyDigits(state.checkout.form.mobile);
            if (mobile && state.subtotal > 0) {
              // Calculate the actual amount paid (after redeeming points)
              const actualAmountPaid = state.subtotal - (isRedeemed ? (userRewardValue || 0) : 0);
              
              // Only earn points on the actual amount paid, not on redeemed points
              if (actualAmountPaid > 0) {
                // Calculate points earned for this order: 3 points per AED actually paid
                const pointsEarned = Math.floor(actualAmountPaid * 3);
                
                // Record earned points as negative value (to distinguish from spent)
                const earnedPointsData = {
                  mobile: mobile,
                  redeem_points: -pointsEarned, // Negative value indicates earned points
                  status: 2 // 2 = earned record
                };

                const earnedPointsResponse = await fetch('/api/points', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(earnedPointsData)
                });

                if (earnedPointsResponse.ok) {
                  console.log(`✅ Earned ${pointsEarned} points for AED ${actualAmountPaid.toFixed(2)} paid`);
                } else {
                  console.error('❌ Failed to record earned points');
                }
              } else {
                console.log('ℹ️ No points earned - order fully paid with redeemed points');
              }
            }
          } catch (earnedPointsError) {
            console.error('❌ Error recording earned points:', earnedPointsError);
          }

          // If coupon is applied, mark it as used
          if (appliedCoupon) {
            try {
              await fetch(`/api/coupons/use/${appliedCoupon.coupon_code}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
            } catch (couponError) {
              console.error('Failed to mark coupon as used:', couponError);
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.error('Order creation timed out - possible network issue');
            } else if (error.message.includes('Failed to fetch')) {
              console.error('Network error - unable to reach order server:', error);
            } else {
              console.error('Error processing order:', error);
            }
          } else {
            console.error('Unknown error processing order:', error);
          }
        }
      };

      // Start background processing
      await processOrder();

      // Reset states
      setShowCaptcha(false);
      setAppliedCoupon(null);
      setIsRedeemed(false);
      
      // Refresh points from new API after order completion
      if (state.checkout.form.mobile && state.checkout.form.mobile.replace(/\D/g, '').length >= 8) {
        // Wait a moment for the order to be processed, then refresh points
        setTimeout(() => {
          fetchUserRewardPoints(state.checkout.form.mobile);
        }, 1000);
      }

      // Clear cart and close modal
      originalPlaceOrder();

      // Redirect to order success page
      router.push('/order-success');
    } else {
      setCaptcha({
        num1: Math.floor(Math.random() * 10) + 1,
        num2: Math.floor(Math.random() * 10) + 1,
        userAnswer: '',
        error: true,
      });
    }
    setIsProcessingOrder(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for Dubai-only items validation before proceeding
    if (hasDubaiOnlyItems && state.checkout.form.city && state.checkout.form.city !== 'Dubai') {
      setDubaiError(true);
      // Scroll to error if needed (optional, but good for UX)
      return;
    }
    
    if (state.checkout.currentStep === 0) {
      // Save customer data to raw orders database
      try {
        const rawOrderData = {
          // order_id: Math.floor(Date.now() / 1000), // Unix timestamp as order ID
          user_name: state.checkout.form.name,
          user_city: state.checkout.form.city,
          email: state.checkout.form.email,
          mobile: `${state.checkout.form.mobileCountryCode}${state.checkout.form.mobile}`,
          whatsapp_number: state.checkout.form.whatsapp ? `${state.checkout.form.whatsappCountryCode}${state.checkout.form.whatsapp}` : null,
          address: `${state.checkout.form.area ? `[${state.checkout.form.area}] ` : ''}${state.checkout.form.address}`,
          items: JSON.stringify(state.items.map(item => ({
            product: item.name,
            quantity: item.quantity.toString()
          })))
        };

        const response = await fetch('/api/orders/raw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rawOrderData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Customer data saved to raw orders:', result);
        } else {
          console.error('❌ Failed to save customer data to raw orders');
        }
      } catch (error) {
        console.error('❌ Error saving customer data to raw orders:', error);
      }

      setCheckoutStep(1);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setShowCouponError(true);
      setCouponErrorMessage('Please enter a coupon code.');
      return;
    }

    setIsApplyingCoupon(true);
    setShowCouponError(false);
    setCouponErrorMessage('');

    try {
      // Validate coupon first
      const validateResponse = await fetch(`/api/coupons/validate/${couponCode}`);
      const validateData = await validateResponse.json();

      if (!validateData.success) {
        setShowCouponError(true);
        setCouponErrorMessage(validateData.message || 'Invalid coupon code.');
        setIsApplyingCoupon(false);
        return;
      }

      // Apply the coupon
      setAppliedCoupon(validateData.data);
      setCouponCode('');
      setShowCouponError(false);
      
      // Fire GTM apply_coupon event
      const discountAmount = (state.subtotal * validateData.data.discount) / 100;
      gtmApplyCoupon(couponCode, discountAmount);
      
      // You can also call the use endpoint here if needed
      // await fetch(`/api/coupons/use/${couponCode}`, { method: 'POST' });
      
    } catch (error) {
      console.error('Error applying coupon:', error);
      setShowCouponError(true);
      setCouponErrorMessage('Failed to apply coupon. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const redeemRewards = () => {
    if (userRewardPoints > 0 && !isRedeemed) {
      const discountValue = userRewardValue;
      redeemPoints(userRewardPoints, discountValue);
      setIsRedeemed(true);
    }
  };

  const undoRedeem = () => {
    if (isRedeemed) {
      undoRedeemPoints(userRewardPoints, userRewardValue);
      setIsRedeemed(false);
    }
  };

  const placeOrder = () => {
    // Validate payment method is selected
    if (!state.checkout.form.paymentMethod || (state.checkout.form.paymentMethod !== 'cash' && state.checkout.form.paymentMethod !== 'card')) {
      alert('Please select a payment method (Cash or Card)');
      return;
    }
    
    // Show captcha verification before processing order
    // Raw order will be created only after successful captcha verification
    setShowCaptcha(true);
    setCaptcha({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1,
      userAnswer: '',
      error: false
    });
  };

  const sendOrderEmail = async (orderId: string) => {
    try {
      const orderData = {
        receiverName: state.checkout.form.name || 'N/A',
        area: state.checkout.form.city || 'N/A', // Keeping this as city based on existing structure, but maybe should include area?
        orderNumber: orderId,
        deliveryType: state.checkout.form.paymentMethod || 'cash',
        address: `${state.checkout.form.area ? `[${state.checkout.form.area}] ` : ''}${state.checkout.form.address || ''}, ${state.checkout.form.city || ''}${state.checkout.form.groundFloorPickup ? ' (Ground Floor Pickup)' : ''}`.trim().replace(/^,\s*/, ''),
        contactNumber: state.checkout.form.mobile || 'N/A',
        whatsappNumber: state.checkout.form.whatsapp || state.checkout.form.mobile || 'N/A',
        subtotal: state.subtotal || 0,
        discount: appliedCoupon ? ((state.subtotal * (appliedCoupon.discount || 0)) / 100) : 0,
        redeemAmount: isRedeemed ? (userRewardValue || 0) : 0,
        shipping: state.shipping || 0,
        overWeightFee: state.overWeightFee || 0,
        transactionFee: getPaymentMethodFee(),
        grandTotal: (state.subtotal || 0) + (state.shipping || 0) + (state.overWeightFee || 0) + getPaymentMethodFee() - 
          (appliedCoupon ? ((state.subtotal * (appliedCoupon.discount || 0)) / 100) : 0) - 
          (isRedeemed ? (userRewardValue || 0) : 0),
        items: state.items.map(item => ({
          name: item.name || 'Unknown Product',
          sku: item.id || 'N/A',
          quantity: item.quantity || 1,
          price: item.price || 0
        }))
      };

      const response = await fetch('/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderData,
          customerEmail: state.checkout.form.email
        })
      });

      console.log('📧 Email API Response Status:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully:', result);
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Email sending failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorResult
        });
      }

    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      // Don't throw - let the order complete even if email fails
    }
  };

  const sendOrderWhatsApp = async (orderNumber: string) => {
    try {
      const orderData = {
        orderId: orderNumber,
        customerName: state.checkout.form.name || 'N/A',
        customerPhone: state.checkout.form.whatsapp || state.checkout.form.mobile || 'N/A',
        total: (state.subtotal || 0) + (state.shipping || 0) + (state.overWeightFee || 0) + getPaymentMethodFee() - 
          (appliedCoupon ? ((state.subtotal * (appliedCoupon.discount || 0)) / 100) : 0) - 
          (isRedeemed ? (userRewardValue || 0) : 0),
        paymentMethod: state.checkout.form.paymentMethod || 'cash',
        address: `${state.checkout.form.area ? `[${state.checkout.form.area}] ` : ''}${state.checkout.form.address || ''}, ${state.checkout.form.city || ''}${state.checkout.form.groundFloorPickup ? ' (Ground Floor Pickup)' : ''}`.trim().replace(/^,\s*/, ''),
        items: state.items.map(item => ({
          name: item.name || 'Unknown Product',
          quantity: item.quantity || 1,
          price: item.price || 0
        })),
        deliveryCharges: state.shipping || 0,
        discount: appliedCoupon ? ((state.subtotal * (appliedCoupon.discount || 0)) / 100) : 0
      };

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'order_confirmation',
          to: state.checkout.form.whatsapp || state.checkout.form.mobile,
          orderData
        })
      });

      console.log('📱 WhatsApp API Response Status:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ WhatsApp message sent successfully:', result);
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ WhatsApp message sending failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorResult
        });
      }

    } catch (error) {
      console.error('Failed to send WhatsApp order confirmation:', error);
      // Don't throw - let the order complete even if WhatsApp fails
    }
  };

  const getStepTitle = () => {
    if (showCaptcha) return 'Security Verification';
    switch (state.checkout.currentStep) {
      case 0: return 'Delivery Information';
      case 1: return 'Review & Payment';
      default: return 'Checkout';
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => toggleCheckoutModal(false)}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '6px',
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
            color: '#333'
          }}>
            <i className="fas fa-credit-card"></i>
            {getStepTitle()}
          </h3>
          <button
            onClick={() => toggleCheckoutModal(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '6px' }}>
          {/* Captcha Verification Modal */}
          {showCaptcha && (
            <div style={{ textAlign: 'center' }}>
              <h4 style={{
                color: '#22c55e',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <i className="fas fa-shield-alt"></i>
                Security Verification
              </h4>
              <p style={{
                marginBottom: '25px',
                color: '#666'
              }}>
                Please solve this simple math problem to complete your order
              </p>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                <span>{captcha.num1}</span>
                <span>+</span>
                <span>{captcha.num2}</span>
                <span>=</span>
                <input 
                  type="number" 
                  value={captcha.userAnswer}
                  onChange={(e) => setCaptcha({ ...captcha, userAnswer: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && verifyCaptcha()}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '20px'
                  }}
                  placeholder="?"
                  required
                />
              </div>
              
              {captcha.error && (
                <div style={{
                  color: '#ef4444',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}>
                  <i className="fas fa-exclamation-triangle"></i>
                  Incorrect answer. Please try again.
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                    if (showCaptcha) {
                      setShowCaptcha(false);
                    } else {
                      setCheckoutStep(0);
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={verifyCaptcha}
                  disabled={!captcha.userAnswer || isProcessingOrder}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (!captcha.userAnswer || isProcessingOrder) ? '#ccc' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (!captcha.userAnswer || isProcessingOrder) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isProcessingOrder ? 0.7 : 1
                  }}
                >
                  {isProcessingOrder ? (
                    <>
                      Processing...
                      <i className="fas fa-spinner fa-spin"></i>
                    </>
                  ) : (
                    <>
                      Complete Order
                      <i className="fas fa-check"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 0: Customer Information */}
          {!showCaptcha && state.checkout.currentStep === 0 && (
            <form onSubmit={handleFormSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: '500',
                color: '#22c55e',
                fontSize: '16px'
              }}>
                <input 
                  type="checkbox" 
                  id="auto-save" 
                  checked={state.checkout.form.checkbox}
                  onChange={(e) => updateCheckoutForm({ checkbox: e.target.checked })}
                />
                <label htmlFor="auto-save">Auto-Saved for Future Use</label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>
                  Mobile Number *
                  {isAutoFilling && (
                    <span style={{ marginLeft: '10px', color: '#22c55e', fontSize: '0.8rem' }}>
                      <i className="fas fa-spinner fa-spin"></i> Auto-filling...
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', fontWeight: '500' }}>+</span>
                  <input 
                    type="tel" 
                    value={state.checkout.form.mobileCountryCode}
                    onChange={(e) => updateCheckoutForm({ mobileCountryCode: e.target.value })}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '80px'
                    }}
                    placeholder="971"
                    required
                  />
                  <input 
                    type="tel" 
                    value={state.checkout.form.mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    style={{
                      padding: '10px',
                      border: isAutoFilling ? '2px solid #22c55e' : '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      flex: 1,
                      backgroundColor: isAutoFilling ? '#f0fdf4' : 'white'
                    }}
                    pattern="[0-9]{8,10}"
                    placeholder="5xxxxxxxx"
                    required
                  />
                </div>
                {state.checkout.form.mobile.length >= 8 && !isAutoFilling && (
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                    <i className="fas fa-info-circle"></i> Auto-fill will search for existing customer data
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>WhatsApp Number (if different)</label>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', fontWeight: '500' }}>+</span>
                  <input 
                    type="tel" 
                    value={state.checkout.form.whatsappCountryCode}
                    onChange={(e) => updateCheckoutForm({ whatsappCountryCode: e.target.value })}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '80px'
                    }}
                    placeholder="971"
                  />
                  <input 
                    type="tel" 
                    value={state.checkout.form.whatsapp}
                    onChange={(e) => {
                      // Remove leading zeros from the input
                      const value = e.target.value.replace(/^0+/, '');
                      updateCheckoutForm({ whatsapp: value });
                    }}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      flex: 1
                    }}
                    pattern="[0-9]{8,10}"
                    placeholder="5xxxxxxxx"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>Full Name *</label>
                <input 
                  type="text" 
                  value={state.checkout.form.name}
                  onChange={(e) => updateCheckoutForm({ name: e.target.value })}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>Email Address *</label>
                <input 
                  type="email" 
                  value={state.checkout.form.email}
                  onChange={(e) => updateCheckoutForm({ email: e.target.value })}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>City *</label>
                <select 
                  value={state.checkout.form.city}
                  onChange={handleCityChange}
                  style={{
                    padding: '10px',
                    border: dubaiError ? '1px solid #c0392b' : '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                >
                  <option value="">Select a city</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Dubai">Dubai</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                  <option value="Umm Al Quwain">Umm Al Quwain</option>
                  <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  <option value="Fujairah">Fujairah</option>
                </select>
                {dubaiError && (
                  <div style={{ 
                    color: '#c0392b', 
                    fontSize: '0.8rem', 
                    background: 'rgba(231, 76, 60, 0.1)', 
                    padding: '8px 10px', 
                    borderRadius: '6px',
                    border: '1px solid rgba(231, 76, 60, 0.2)',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '8px',
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}>
                    <i className="fas fa-exclamation-circle" style={{ marginTop: '2px', flexShrink: 0 }}></i>
                    <span>
                      So sorry! Some products in your cart are available for <strong>Dubai Delivery Only</strong>. Please select Dubai or remove those items.
                    </span>
                  </div>
                )}
              </div>

              {/* Area Dropdown - Shows only for Dubai */}
              {state.checkout.form.city === 'Dubai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>Area *</label>
                  <select 
                    value={state.checkout.form.area}
                    onChange={(e) => updateCheckoutForm({ area: e.target.value })}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                  >
                    <option value="">Select an area</option>
                    <option value="Nahda">Nahda</option>
                    <option value="Qusais">Qusais</option>
                    <option value="Deira">Deira</option>
                    <option value="Karama">Karama</option>
                    <option value="Bur Dubai">Bur Dubai</option>
                    <option value="Mankhool">Mankhool</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>Delivery Address *</label>
                <textarea 
                  value={state.checkout.form.address}
                  onChange={(e) => updateCheckoutForm({ address: e.target.value })}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  rows={3}
                  required
                />
              </div>

              <div style={{ marginTop: '20px' }}>
                <button 
                  type="submit" 
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Next Step
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </form>
          )}

          {/* Step 1: Review & Payment */}
          {!showCaptcha && state.checkout.currentStep === 1 && (
            <div>
              {/* Payment Method */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>Payment</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cash" 
                      checked={state.checkout.form.paymentMethod === 'cash'}
                      onChange={(e) => updateCheckoutForm({ paymentMethod: e.target.value })}
                      required
                    />
                    <span>Cash on Delivery (COD Charge: <span className='aed'></span>2.5)</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="card" 
                      checked={state.checkout.form.paymentMethod === 'card'}
                      onChange={(e) => updateCheckoutForm({ paymentMethod: e.target.value })}
                      required
                    />
                    <span>Card (PayLink Charge: <span className='aed'></span>1)</span>
                  </label>
                </div>
              </div>

              {/* Shipping & Return toggles (side by side) */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', background: '#fafafa' }}>
                  <span style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem' }}>Shipping Charges</span>
                  <button type="button" onClick={() => setShowShippingInfo(!showShippingInfo)} style={{ border: '1px solid #d1d5db', background: showShippingInfo ? '#22c55e' : '#fff', color: showShippingInfo ? '#fff' : '#111827', borderRadius: '9999px', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                    {showShippingInfo ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', background: '#fafafa' }}>
                  <span style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem' }}>Return & Refund Policy</span>
                  <button type="button" onClick={() => setShowReturnInfo(!showReturnInfo)} style={{ border: '1px solid #d1d5db', background: showReturnInfo ? '#22c55e' : '#fff', color: showReturnInfo ? '#fff' : '#111827', borderRadius: '9999px', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                    {showReturnInfo ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Ground Floor Pickup Discount Checkbox - Only for Dubai non-Others */}
              {state.checkout.form.city === 'Dubai' && state.checkout.form.area && state.checkout.form.area !== 'Others' && (
                <div style={{ 
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #22c55e',
                  borderRadius: '8px',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: '#15803d'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={state.checkout.form.groundFloorPickup}
                      onChange={(e) => updateCheckoutForm({ groundFloorPickup: e.target.checked })}
                      style={{ accentColor: '#22c55e', width: '18px', height: '18px' }}
                    />
                    <span>Ground Floor Pick Up (50% OFF Delivery Fee)</span>
                  </label>
                </div>
              )}

              {showShippingInfo && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px', marginBottom: '16px', background: '#ffffff' }}>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#374151', fontSize: '0.92rem', lineHeight: 1.5 }}>
                    <li><strong>AED 10</strong> : Orders up to <strong>AED 75</strong></li>
                    <li><strong>AED 5</strong> : Orders from <strong>AED 75.01</strong> to <strong>AED 150</strong></li>
                    <li><strong>FREE</strong> : Orders above <strong>AED 150</strong></li>
                  </ul>
                  <p style={{ margin: '10px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Above 10Kg, <strong>1 AED per kg</strong> will be charged.</p>
                </div>
              )}

              {showReturnInfo && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px', marginBottom: '16px', background: '#ffffff' }}>
                  <p style={{ margin: 0, color: '#374151', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    If it is our fault, please dont worry we will compensate with refund or discount next order. Collecting back items or re-delivering will cost delivery charge to the customer at a fixed rate of <strong>AED 12</strong>.
                  </p>
                </div>
              )}

              {/* Coupon Section */}
              <div style={{
                marginBottom: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button 
                    onClick={applyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isApplyingCoupon || !couponCode.trim() ? '#9ca3af' : '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isApplyingCoupon || !couponCode.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isApplyingCoupon ? 'Applying...' : 'Apply Coupon'}
                  </button>
                </div>
                {showCouponError && (
                  <div style={{ color: '#ef4444', fontSize: '14px' }}>
                    {couponErrorMessage || 'This coupon code is not valid.'}
                  </div>
                )}
                {appliedCoupon && (
                  <div style={{ 
                    color: '#22c55e', 
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #22c55e'
                  }}>
                    <span>✓ Coupon &quot;{appliedCoupon.coupon_code}&quot; applied! Discount: {appliedCoupon.discount}%</span> 
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0 4px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Redeem Rewards */}
              {state.checkout.form.mobile && state.checkout.form.mobile.replace(/\D/g, '').length >= 8 && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px',
                  backgroundColor: userRewardPoints > 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(75, 85, 99, 0.05)',
                  borderRadius: '8px',
                  border: userRewardPoints > 0 ? '1px dashed rgba(34, 197, 94, 0.3)' : '1px dashed rgba(75, 85, 99, 0.3)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '15px'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: '#333'
                    }}>
                      You have <strong style={{ color: userRewardPoints > 0 ? '#22c55e' : '#6b7280' }}>{userRewardPoints}</strong> points 
                      (<strong style={{ color: userRewardPoints > 0 ? '#22c55e' : '#6b7280' }}>{formatPrice(userRewardValue)}</strong> value). 
                      {userRewardPoints > 0 ? 'Click "YES" to redeem now or keep collecting.' : 'Start shopping to earn points!'}
                    </p>
                    {userRewardPoints > 0 && (
                      <button 
                        onClick={isRedeemed ? undoRedeem : redeemRewards}
                        style={{
                          padding: '5px 15px',
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap',
                          backgroundColor: isRedeemed ? '#e5e7eb' : '#fbbf24',
                          color: '#000',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          opacity: 1
                        }}
                      >
                        {isRedeemed ? 'UNDO' : 'YES'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: window.innerWidth <= 768 ? '0px' : '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  margin: '0 0 20px',
                  color: '#333',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  paddingBottom: '15px',
                  borderBottom: '1px solid #eee'
                }}>Order Summary</h4>

                {/* Items Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: window.innerWidth <= 768 ? '10px' : '15px',
                  alignItems: 'center',
                  padding: window.innerWidth <= 768 ? '6px 0' : '8px 0',
                  borderBottom: '2px solid #eee',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  <div style={{ textAlign: 'left' }}>Product</div>
                  <div style={{ textAlign: 'left' }}>Price</div>
                  <div style={{ textAlign: 'center' }}>Qty</div>
                </div>

                {/* Items */}
                {state.items.map((item) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
                    gap: window.innerWidth <= 768 ? '10px' : '15px',
                    alignItems: 'start',
                    padding: window.innerWidth <= 768 ? '10px 0' : '12px 0',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: window.innerWidth <= 768 ? '8px' : '10px',
                      textAlign: 'left'
                    }}>
                      <button 
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: window.innerWidth <= 768 ? '4px' : '6px',
                          cursor: 'pointer',
                          color: '#ef4444',
                          fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem',
                          borderRadius: '4px',
                          backgroundColor: '#fef2f2',
                          minWidth: 'auto',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <div style={{ 
                        fontWeight: '500', 
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        maxHeight: '3.9em',
                        flex: 1,
                        wordBreak: 'break-word'
                      }}>
                        {item.name}
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: 'left', 
                      fontSize: '0.9rem', 
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      minWidth: window.innerWidth <= 768 ? '60px' : '80px',
                      width: '100%',
                      paddingTop: '2px'
                    }}> 
                      <span className="price-inline"><span className='aed'></span><span className='amount'>{formatPrice(item.price)}</span></span>
                    </div>
                    <div style={{ 
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      minWidth: window.innerWidth <= 768 ? '80px' : '110px',
                      width: '100%'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        width: 'fit-content'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: window.innerWidth <= 768 ? '6px' : '8px'
                        }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: window.innerWidth <= 768 ? '6px' : '8px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            padding: window.innerWidth <= 768 ? '3px 6px' : '4px 8px'
                          }}>
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: window.innerWidth <= 768 ? '3px' : '4px',
                                cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                color: item.quantity <= 1 ? '#ccc' : '#333',
                                fontSize: window.innerWidth <= 768 ? '0.8rem' : '1rem'
                              }}
                            >
                              <i className="fas fa-minus"></i>
                            </button>
                            <span style={{
                              minWidth: '20px',
                              textAlign: 'center',
                              fontWeight: '500',
                              fontSize: window.innerWidth <= 768 ? '0.9rem' : '1rem'
                            }}>{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: window.innerWidth <= 768 ? '3px' : '4px',
                                cursor: 'pointer',
                                color: '#333',
                                fontSize: window.innerWidth <= 768 ? '0.8rem' : '1rem'
                              }}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#22c55e',
                          fontWeight: '600',
                          marginTop: '6px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          Total:<span className='aed'></span>{formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div style={{ 
                  marginTop: '20px',
                  paddingTop: '15px',
                  borderTop: '2px solid #f0f0f0'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                    fontSize: '0.95rem'
                  }}>
                    <span style={{ fontWeight: '500' }}>Subtotal</span>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: '600', 
                      color: '#333',
                      minWidth: '70px',
                      textAlign: 'left',
                      justifyContent: "flex-start",
                    }}>
                      <span className='aed' style={{ marginRight: '4px' }}></span>
                      <span>{formatPrice(state.subtotal)}</span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                    fontSize: '0.95rem'
                  }}>
                    <span style={{ fontWeight: '500' }}>Delivery Charges</span>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: '600', 
                      color: '#333',
                      minWidth: '70px',
                      textAlign: 'left',
                      justifyContent: "flex-start",
                    }}>
                      <span className='aed' style={{ marginRight: '4px' }}></span>
                      <span>{formatPrice(state.shipping)}</span>
                    </div>
                  </div>
                  {state.overWeightFee > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f5f5f5',
                      fontSize: '0.95rem'
                    }}>
                      <span style={{ fontWeight: '500' }}>Over Weight Fee</span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: '600', 
                        color: '#333',
                        minWidth: '70px',
                        textAlign: 'left',
                        justifyContent: "flex-start",
                      }}>
                        <span className='aed' style={{ marginRight: '4px' }}></span>
                        <span>{formatPrice(state.overWeightFee)}</span>
                      </div>
                    </div>
                  )}
                  {isRedeemed && userRewardValue > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f5f5f5',
                      fontSize: '0.95rem'
                    }}>
                      <span style={{ fontWeight: '500', color: '#ef4444' }}>Redeem Amount</span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: '600', 
                        color: '#ef4444',
                        minWidth: '70px',
                        textAlign: 'left',
                      justifyContent: "flex-start", 
                      }}>
                        <span style={{ marginRight: '0px' }}>-</span>
                        <span className='aed' style={{ marginRight: '4px' }}></span>
                        <span>{formatPrice(userRewardValue)}</span>
                      </div>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f5f5f5',
                      fontSize: '0.95rem'
                    }}>
                      <span style={{ fontWeight: '500', color: '#22c55e' }}>Coupon Discount ({appliedCoupon.coupon_code})</span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: '600', 
                        color: '#22c55e',
                        minWidth: '70px',
                        textAlign: 'left',
                      justifyContent: "flex-start", 

                      }}>
                        <span style={{ marginRight: '4px' }}>-</span>
                        <span className='aed' style={{ marginRight: '4px' }}></span>
                        <span>{formatPrice((state.subtotal * appliedCoupon.discount) / 100)}</span>
                      </div>
                    </div>
                  )}
                  {state.checkout.form.paymentMethod && getPaymentMethodFee() > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f5f5f5',
                      fontSize: '0.95rem'
                    }}>
                      <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>Payment Fee ({state.checkout.form.paymentMethod === 'cash' ? 'COD' : 'Link'})</span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontWeight: '600', 
                        color: '#333',
                        minWidth: '70px',
                        textAlign: 'left',
                      justifyContent: "flex-start", 
                      }}>
                        <span className='aed' style={{ marginRight: '4px' }}></span>
                        <span>{formatPrice(getPaymentMethodFee())}</span>
                      </div>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 0',
                    fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.2rem',
                    fontWeight: '700',
                    color: '#333',
                    borderTop: '2px solid #22c55e',
                    marginTop: '15px',
                    backgroundColor: '#f8fffe'
                  }}>
                    <span>Grand Total</span>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: '700', 
                      color: 'var(--color-primary)',
                      minWidth: '70px',
                      textAlign: 'left',
                      justifyContent: "flex-start", 
                    }}>
                      <span className='aed' style={{ marginRight: '4px' }}></span>
                      <span>{formatPrice(
                        state.subtotal + state.shipping + state.overWeightFee + getPaymentMethodFee() - (appliedCoupon ? (state.subtotal * appliedCoupon.discount) / 100 : 0) - (isRedeemed ? (userRewardValue || 0) : 0)
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'space-between'
              }}>
                <button 
                  onClick={() => {
                    if (showCaptcha) {
                      setShowCaptcha(false);
                    } else {
                      setCheckoutStep(0);
                    }
                  }}
                   style={{
                     padding: '12px 24px',
                     backgroundColor: '#6b7280',
                     color: 'white',
                     border: 'none',
                     borderRadius: '8px',
                     fontSize: '16px',
                     fontWeight: '600',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px'
                   }}
                 >
                   <i className="fas fa-arrow-left"></i>
                   Back
                 </button>
                {state.subtotal >= 30 ? (
                  <button 
                    onClick={placeOrder}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Place Order
                    <i className="fas fa-check"></i>
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '12px 24px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      background: '#f8f9fa',
                      color: '#6c757d',
                      fontWeight: '600',
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
        
        {/* Rewards Summary Section */}
        {!showCaptcha && state.checkout.currentStep === 1 && (
          <div style={{
            padding: '10px 4px',
            borderTop: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'nowrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#22c55e',
              fontWeight: '600',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}>
              <i className="fas fa-piggy-bank" style={{ fontSize: '0.9rem' }}></i>
              <span>Amount Saved: AED {formatPrice(totalProductSavings)}</span>
            </div>
            <div style={{
               display: 'flex',
               alignItems: 'center',
               gap: '6px',
               color: '#3b82f6',
               fontWeight: '600',
               fontSize: '0.85rem',
               whiteSpace: 'nowrap'
             }}>
               <i className="fas fa-star" style={{ fontSize: '0.9rem' }}></i>
               <span>Earn {calculateRewardPoints(Math.max(0, state.subtotal - (isRedeemed ? (userRewardValue || 0) : 0)))} Points</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;