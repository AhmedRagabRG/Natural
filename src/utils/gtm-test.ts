// Google Tag Manager Test Functions
// Use these functions in the browser console to test GTM events

import {
  gtmAddToCart,
  gtmRemoveFromCart,
  gtmViewCart,
  gtmBeginCheckout,
  gtmPurchase,
  gtmViewItem,
  gtmViewItemList,
  gtmApplyCoupon,
  gtmCustomEvent
} from './gtm';

// Test data
const testProduct = {
  id: 'test-123',
  name: 'Test Cumin Powder',
  price: 25.00,
  category: 'Spices',
  quantity: 1
};

const testProducts = [
  {
    id: 'test-123',
    name: 'Test Cumin Powder',
    price: 25.00,
    category: 'Spices',
    quantity: 2
  },
  {
    id: 'test-456',
    name: 'Test Turmeric Powder',
    price: 18.00,
    category: 'Spices',
    quantity: 1
  }
];

// Test functions - call these in browser console
export const testGTMEvents = {
  
  // Test add to cart
  testAddToCart: () => {
    console.log('🛒 Testing GTM Add to Cart Event');
    gtmAddToCart(testProduct);
  },

  // Test remove from cart
  testRemoveFromCart: () => {
    console.log('🗑️ Testing GTM Remove from Cart Event');
    gtmRemoveFromCart(testProduct);
  },

  // Test view cart
  testViewCart: () => {
    console.log('👁️ Testing GTM View Cart Event');
    gtmViewCart(testProducts, 61.00);
  },

  // Test begin checkout
  testBeginCheckout: () => {
    console.log('🛍️ Testing GTM Begin Checkout Event');
    gtmBeginCheckout(testProducts, 61.00, 'SAVE10');
  },

  // Test purchase
  testPurchase: () => {
    console.log('💳 Testing GTM Purchase Event');
    gtmPurchase('N-AE-TEST-123', testProducts, 61.00, 10.00, 0, 'SAVE10', 5.00);
  },

  // Test view item
  testViewItem: () => {
    console.log('🔍 Testing GTM View Item Event');
    gtmViewItem(testProduct, 'Product Page');
  },

  // Test view item list
  testViewItemList: () => {
    console.log('📋 Testing GTM View Item List Event');
    gtmViewItemList(testProducts, 'Category: Spices');
  },

  // Test apply coupon
  testApplyCoupon: () => {
    console.log('🎫 Testing GTM Apply Coupon Event');
    gtmApplyCoupon('SAVE10', 6.10);
  },

  // Test custom event
  testCustomEvent: () => {
    console.log('⚡ Testing GTM Custom Event');
    gtmCustomEvent('newsletter_signup', {
      email: 'test@example.com',
      source: 'homepage'
    });
  },

  // Test all events
  testAll: () => {
    console.log('🚀 Testing All GTM Events');
    setTimeout(() => testGTMEvents.testViewItemList(), 100);
    setTimeout(() => testGTMEvents.testViewItem(), 200);
    setTimeout(() => testGTMEvents.testAddToCart(), 300);
    setTimeout(() => testGTMEvents.testViewCart(), 400);
    setTimeout(() => testGTMEvents.testApplyCoupon(), 500);
    setTimeout(() => testGTMEvents.testBeginCheckout(), 600);
    setTimeout(() => testGTMEvents.testPurchase(), 700);
    setTimeout(() => testGTMEvents.testCustomEvent(), 800);
    setTimeout(() => testGTMEvents.testRemoveFromCart(), 900);
  },

  // Check data layer
  checkDataLayer: () => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      console.log('📊 Current dataLayer contents:', window.dataLayer);
      return window.dataLayer;
    } else {
      console.error('❌ dataLayer not found');
      return null;
    }
  }
};

// Make test functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testGTM = testGTMEvents;
}

export default testGTMEvents;
