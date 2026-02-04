// Google Tag Manager Data Layer Utilities for Ecommerce Tracking

// Extend Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Ensure dataLayer exists
const ensureDataLayer = () => {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = [];
  }
};

// Product interface for consistent data structure
export interface GTMProduct {
  item_id: string;
  item_name: string;
  category?: string;
  quantity: number;
  price: number;
  currency: string;
  item_variant?: string;
  item_brand?: string;
}

// Convert cart item to GTM product format
export const formatProductForGTM = (item: any): GTMProduct => {
  return {
    item_id: item.id?.toString() || '',
    item_name: item.name || 'Unknown Product',
    category: item.category || 'Spices', // Default category for Natural Spices
    quantity: item.quantity || 1,
    price: parseFloat(item.price?.toString() || '0'),
    currency: 'AED',
    item_variant: item.variant || undefined,
    item_brand: 'Natural Spices'
  };
};

// 1. Add to Cart Event
export const gtmAddToCart = (item: any) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const gtmProduct = formatProductForGTM(item);
  
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'AED',
      value: gtmProduct.price * gtmProduct.quantity,
      items: [gtmProduct]
    }
  });
  
  console.log('GTM: Add to Cart event fired', gtmProduct);
};

// 2. Remove from Cart Event
export const gtmRemoveFromCart = (item: any) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const gtmProduct = formatProductForGTM(item);
  
  window.dataLayer.push({
    event: 'remove_from_cart',
    ecommerce: {
      currency: 'AED',
      value: gtmProduct.price * gtmProduct.quantity,
      items: [gtmProduct]
    }
  });
  
  console.log('GTM: Remove from Cart event fired', gtmProduct);
};

// 3. View Cart Event
export const gtmViewCart = (items: any[], totalValue: number) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const gtmProducts = items.map(formatProductForGTM);
  
  window.dataLayer.push({
    event: 'view_cart',
    ecommerce: {
      currency: 'AED',
      value: totalValue,
      items: gtmProducts
    }
  });
  
  console.log('GTM: View Cart event fired', { totalValue, items: gtmProducts });
};

// 4. Begin Checkout Event
export const gtmBeginCheckout = (items: any[], totalValue: number, coupon?: string) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const gtmProducts = items.map(formatProductForGTM);
  
  const eventData: any = {
    event: 'begin_checkout',
    ecommerce: {
      currency: 'AED',
      value: totalValue,
      items: gtmProducts
    }
  };
  
  if (coupon) {
    eventData.ecommerce.coupon = coupon;
  }
  
  window.dataLayer.push(eventData);
  
  console.log('GTM: Begin Checkout event fired', eventData);
};

// 5. Purchase Event
export const gtmPurchase = (
  orderId: string,
  items: any[],
  totalValue: number,
  shippingCost: number = 0,
  taxAmount: number = 0,
  coupon?: string,
  discountAmount: number = 0
) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const gtmProducts = items.map(formatProductForGTM);
  
  const eventData: any = {
    event: 'purchase',
    ecommerce: {
      transaction_id: orderId,
      value: totalValue,
      currency: 'AED',
      shipping: shippingCost,
      tax: taxAmount,
      items: gtmProducts
    }
  };
  
  if (coupon) {
    eventData.ecommerce.coupon = coupon;
  }
  
  if (discountAmount > 0) {
    eventData.ecommerce.discount = discountAmount;
  }
  
  window.dataLayer.push(eventData);
  
  console.log('GTM: Purchase event fired', eventData);
};

// 6. View Item Event (for product pages)
export const gtmViewItem = (item: any, listName?: string) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const gtmProduct = formatProductForGTM(item);
  
  const eventData: any = {
    event: 'view_item',
    ecommerce: {
      currency: 'AED',
      value: gtmProduct.price,
      items: [gtmProduct]
    }
  };
  
  if (listName) {
    eventData.ecommerce.item_list_name = listName;
  }
  
  window.dataLayer.push(eventData);
  
  console.log('GTM: View Item event fired', gtmProduct);
};

// 7. View Item List Event (for category/search pages)
export const gtmViewItemList = (items: any[], listName: string) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const gtmProducts = items.map(formatProductForGTM);
  
  window.dataLayer.push({
    event: 'view_item_list',
    ecommerce: {
      item_list_name: listName,
      currency: 'AED',
      items: gtmProducts
    }
  });
  
  console.log('GTM: View Item List event fired', { listName, items: gtmProducts });
};

// 8. Search Event
export const gtmSearch = (searchTerm: string, results?: number) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const eventData: any = {
    event: 'search',
    search_term: searchTerm
  };
  
  if (results !== undefined) {
    eventData.search_results = results;
  }
  
  window.dataLayer.push(eventData);
  
  console.log('GTM: Search event fired', eventData);
};

// 9. Apply Coupon Event
export const gtmApplyCoupon = (couponCode: string, discountAmount: number) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  window.dataLayer.push({
    event: 'apply_coupon',
    coupon_code: couponCode,
    discount_amount: discountAmount,
    currency: 'AED'
  });
  
  console.log('GTM: Apply Coupon event fired', { couponCode, discountAmount });
};

// 10. Custom Event for testing
export const gtmCustomEvent = (eventName: string, parameters: any = {}) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  window.dataLayer.push({
    event: eventName,
    ...parameters
  });
  
  console.log(`GTM: Custom event '${eventName}' fired`, parameters);
};

// Utility to get current user data for enhanced tracking
export const gtmSetUserData = (userId?: string, userType?: string) => {
  ensureDataLayer();
  
  if (typeof window === 'undefined') return;
  
  const userData: any = {
    event: 'user_data_set'
  };
  
  if (userId) {
    userData.user_id = userId;
  }
  
  if (userType) {
    userData.user_type = userType;
  }
  
  window.dataLayer.push(userData);
  
  console.log('GTM: User data set', userData);
};

export default {
  addToCart: gtmAddToCart,
  removeFromCart: gtmRemoveFromCart,
  viewCart: gtmViewCart,
  beginCheckout: gtmBeginCheckout,
  purchase: gtmPurchase,
  viewItem: gtmViewItem,
  viewItemList: gtmViewItemList,
  search: gtmSearch,
  applyCoupon: gtmApplyCoupon,
  customEvent: gtmCustomEvent,
  setUserData: gtmSetUserData
};
