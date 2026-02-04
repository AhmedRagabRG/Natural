# Google Tag Manager Data Layer Implementation for Natural Spices

## Overview
This implementation adds comprehensive Google Tag Manager (GTM) data layer events for ecommerce tracking on the Natural Spices website. The GTM container `GTM-WQSRD52` is already configured in the layout.

## 🚀 Implemented Events

### 1. **Add to Cart** (`add_to_cart`)
- **Triggered**: When a user adds a product to their cart
- **Location**: `src/context/CartContext.tsx` - `addItem` function
- **Data**: Product details, price, quantity (always 1 for add event)

### 2. **Remove from Cart** (`remove_from_cart`)
- **Triggered**: When a user removes a product from their cart
- **Location**: `src/context/CartContext.tsx` - `removeItem` function
- **Data**: Product details of removed item

### 3. **View Cart** (`view_cart`)
- **Triggered**: When cart modal is opened
- **Location**: `src/context/CartContext.tsx` - `toggleModal` function
- **Data**: All cart items and total value

### 4. **Begin Checkout** (`begin_checkout`)
- **Triggered**: When checkout modal opens
- **Location**: `src/components/CheckoutModal.tsx` - useEffect hook
- **Data**: Cart items, total value, applied coupon code

### 5. **Purchase** (`purchase`)
- **Triggered**: On order success page load
- **Location**: `src/app/order-success/page.tsx` - useEffect hook
- **Data**: Order ID, items, total, shipping, discount, coupon

### 6. **View Item** (`view_item`)
- **Triggered**: When a product page is viewed
- **Location**: `src/app/product/[product_url]/page.tsx`
- **Data**: Product details, price, category

### 7. **View Item List** (`view_item_list`)
- **Triggered**: When category pages or homepage collections are viewed
- **Locations**: 
  - `src/app/category/[category_url]/page.tsx`
  - `src/app/page.tsx` (homepage)
- **Data**: List of products with category name

### 8. **Apply Coupon** (`apply_coupon`)
- **Triggered**: When a coupon is successfully applied
- **Location**: `src/components/CheckoutModal.tsx` - `applyCoupon` function
- **Data**: Coupon code and discount amount

## 📁 File Structure

```
src/
├── utils/
│   ├── gtm.ts              # Main GTM utility functions
│   └── gtm-test.ts         # Testing functions for browser console
├── context/
│   └── CartContext.tsx     # Cart events (add/remove/view cart)
├── components/
│   └── CheckoutModal.tsx   # Checkout and coupon events
├── app/
│   ├── page.tsx           # Homepage view_item_list events
│   ├── order-success/
│   │   └── page.tsx       # Purchase events
│   ├── product/[product_url]/
│   │   └── page.tsx       # Product view events
│   └── category/[category_url]/
│       └── page.tsx       # Category view_item_list events
└── GTM_DATA_LAYER_IMPLEMENTATION.md
```

## 🎯 GTM Data Layer Events Structure

All events follow Google Analytics 4 Enhanced Ecommerce standard format:

```javascript
{
  event: 'event_name',
  ecommerce: {
    currency: 'AED',
    value: 25.00,
    items: [{
      item_id: '123',
      item_name: 'Cumin Powder',
      category: 'Spices',
      quantity: 1,
      price: 25.00,
      currency: 'AED',
      item_brand: 'Natural Spices'
    }]
  }
}
```

## 🧪 Testing

### Browser Console Testing
1. Open browser developer tools
2. Navigate to Console tab
3. Use the test functions:

```javascript
// Test individual events
testGTM.testAddToCart()
testGTM.testBeginCheckout()
testGTM.testPurchase()

// Test all events in sequence
testGTM.testAll()

// Check current dataLayer contents
testGTM.checkDataLayer()
```

### Real User Testing
1. **Add to Cart**: Add any product to cart
2. **View Cart**: Click cart icon or view cart
3. **Begin Checkout**: Click checkout button
4. **Apply Coupon**: Apply a valid coupon code
5. **Purchase**: Complete an order
6. **View Product**: Visit any product page
7. **View Category**: Visit any category page

## 🔍 Monitoring & Verification

### In Browser Developer Tools:
1. Open Console tab
2. Type `dataLayer` to see all fired events
3. Each event shows detailed console logs

### In Google Tag Manager:
1. Use GTM Preview mode
2. Navigate the site and trigger events
3. Check if events appear in the preview panel

### In Google Analytics:
1. Go to Real-time > Events
2. Check if ecommerce events are being tracked
3. Verify Enhanced Ecommerce data

## 📊 Event Data Mapping

| Website Action | GTM Event | Data Included |
|----------------|-----------|---------------|
| Add product to cart | `add_to_cart` | Product details, price |
| Remove from cart | `remove_from_cart` | Removed product details |
| Open cart modal | `view_cart` | All cart items, total |
| Start checkout | `begin_checkout` | Cart items, total, coupon |
| Apply coupon | `apply_coupon` | Coupon code, discount |
| Complete order | `purchase` | Order ID, items, totals |
| View product page | `view_item` | Product details |
| View category/homepage | `view_item_list` | Product list, category |

## 🛠️ Configuration Notes

1. **Currency**: All prices are in AED (UAE Dirhams)
2. **Brand**: All items have "Natural Spices" as item_brand
3. **Categories**: Default to "Spices" if not specified
4. **Order Data**: Saved to localStorage for purchase event
5. **Console Logging**: All events log to console for debugging

## 🔧 Customization

To modify or add new events, edit the functions in `src/utils/gtm.ts`:

```typescript
// Example: Custom event
export const gtmCustomEvent = (eventName: string, parameters: any = {}) => {
  ensureDataLayer();
  window.dataLayer.push({
    event: eventName,
    ...parameters
  });
};
```

## 📋 Checklist for Verification

- [ ] GTM container `GTM-WQSRD52` is loaded
- [ ] Add to cart events fire
- [ ] Cart view events fire
- [ ] Checkout events fire
- [ ] Purchase events fire on order success
- [ ] Product view events fire
- [ ] Category view events fire
- [ ] Coupon apply events fire
- [ ] All events include proper product data
- [ ] Events appear in GTM Preview mode
- [ ] Events show up in Google Analytics

## 🚨 Troubleshooting

**Events not firing?**
1. Check browser console for errors
2. Verify dataLayer exists: `console.log(window.dataLayer)`
3. Check GTM container is loaded
4. Use test functions to verify implementation

**Missing product data?**
1. Check product object structure in components
2. Verify image URLs and categories are available
3. Check for JavaScript errors in console

**Purchase events missing?**
1. Verify order data is saved to localStorage during checkout
2. Check order success page loads correctly
3. Ensure order ID is generated properly

---

✅ **Implementation Complete**: All major ecommerce events are now tracked with Google Tag Manager data layer for Natural Spices website.
