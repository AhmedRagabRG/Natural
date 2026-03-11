'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { formatPrice } from '../utils/price';
import { gtmAddToCart, gtmRemoveFromCart, gtmViewCart } from '../utils/gtm';

// Delivery settings interface (matches af_settings DB table)
interface DeliverySettings {
  delivery_cost_under_100: number;
  delivery_cost_100_to_200: number;
  delivery_cost_over_200: number;
  free_delivery_threshold: number;
  standard_shipping_weight_limit: number;
  extra_weight_charge_per_kg: number;
  cod_fee: number;
  card_fee: number;
  delivery_tier1_max: number;
  delivery_tier2_max: number;
}

// Default settings (fallback if API fails)
const DEFAULT_SETTINGS: DeliverySettings = {
  delivery_cost_under_100: 10,
  delivery_cost_100_to_200: 4,
  delivery_cost_over_200: 0,
  free_delivery_threshold: 201,
  standard_shipping_weight_limit: 8,
  extra_weight_charge_per_kg: 1,
  cod_fee: 2.5,
  card_fee: 1,
  delivery_tier1_max: 100,
  delivery_tier2_max: 200,
};

// Module-level settings used by the reducer's calculateTotals
let currentSettings: DeliverySettings = DEFAULT_SETTINGS;

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  weight?: number; // weight per unit in kg
  dubai_only?: number;
  parentProductId?: number;
  parentProductName?: string;
  unit?: string;
}

interface CheckoutForm {
  name: string;
  email: string;
  mobileCountryCode: string;
  mobile: string;
  whatsappCountryCode: string;
  whatsapp: string;
  city: string;
  area: string;
  address: string;
  paymentMethod: string;
  checkbox: boolean;
  groundFloorPickup: boolean;
}

interface CartState {
  items: CartItem[];
  showModal: boolean;
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  overWeightFee: number;
  total: number;
  rewardPoints: number;
  rewardValue: number;
  totalWeight: number;
  checkout: {
    showModal: boolean;
    currentStep: number;
    form: CheckoutForm;
  };
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; change: number } }
  | { type: 'DECREASE_QUANTITY'; payload: string }
  | { type: 'INCREASE_QUANTITY'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_MODAL'; payload?: boolean }
  | { type: 'REDEEM_POINTS'; payload: { points: number; value: number } }
  | { type: 'UNDO_REDEEM_POINTS'; payload: { points: number; value: number } }
  | { type: 'TOGGLE_CHECKOUT_MODAL'; payload?: boolean }
  | { type: 'SET_CHECKOUT_STEP'; payload: number }
  | { type: 'UPDATE_CHECKOUT_FORM'; payload: Partial<CheckoutForm> }
  | { type: 'LOAD_CART'; payload: { items: CartItem[]; discount: number; rewardPoints: number; rewardValue: number } }
  | { type: 'RECALCULATE_TOTALS' };

const initialState: CartState = {
  items: [],
  showModal: false,
  count: 0,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  overWeightFee: 0,
  total: 0,
  rewardPoints: 0,
  rewardValue: 0,
  totalWeight: 0,
  checkout: {
    showModal: false,
    currentStep: 0,
    form: {
      name: '',
      email: '',
      mobileCountryCode: '971',
      mobile: '',
      whatsappCountryCode: '971',
      whatsapp: '',
      city: '',
      area: '',
      address: '',
      paymentMethod: 'cash',
      checkbox: true,
      groundFloorPickup: false,
    },
  },
};

const calculateTotals = (items: CartItem[], discount: number = 0, groundFloorPickup: boolean = false): Partial<CartState> => {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Total weight in kg (sum of item.weight * quantity), default 0 if weight not provided
    // Sanitize: cap individual item weight at 25kg to prevent bugs from display unit parsing
    const totalWeight = items.reduce((sum, item) => {
      const w = item.weight && item.weight > 25 ? item.weight / 1000 : (item.weight || 0);
      return sum + (w * item.quantity);
    }, 0);
    
    // Calculate shipping based on subtotal using DB settings
    const s = currentSettings;
    let shipping = 0;
    if (subtotal <= s.delivery_tier1_max) {
      shipping = s.delivery_cost_under_100;
    } else if (subtotal <= s.delivery_tier2_max) {
      shipping = s.delivery_cost_100_to_200;
    } else {
      shipping = s.delivery_cost_over_200; // 0 = free delivery above tier2
    }
    
  // Over weight fee using DB settings
  let overWeightFee = totalWeight > s.standard_shipping_weight_limit 
    ? Math.floor(totalWeight - s.standard_shipping_weight_limit) * s.extra_weight_charge_per_kg 
    : 0;
  
  // Apply 50% discount on shipping and overweight fee if ground floor pickup is selected
  if (groundFloorPickup) {
    shipping = shipping * 0.5;
    // Over weight fee excluded from discount per requirement
    // overWeightFee = overWeightFee * 0.5;
  }
  
  // Calculate reward points (3 points per AED)
  // If points were redeemed (discount > 0), no new points are earned for this order
  const rewardPoints = discount > 0 ? 0 : Math.floor(subtotal * 3);
  const rewardValue = discount > 0 ? 0 : parseFloat(formatPrice(rewardPoints * 0.01));
  
  // Calculate final total (include shipping and overweight fee)
  const total = subtotal + shipping + overWeightFee - discount;

  return {
    count,
    subtotal,
    shipping,
    overWeightFee,
    total,
    rewardPoints,
    rewardValue,
    totalWeight,
  };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let newItems: CartItem[];
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      
      const totals = calculateTotals(newItems, state.discount, state.checkout.form.groundFloorPickup);
      return { ...state, items: newItems, ...totals };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const totals = calculateTotals(newItems, state.discount, state.checkout.form.groundFloorPickup);
      return { ...state, items: newItems, ...totals };
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          const newQuantity = item.quantity + action.payload.change;
          return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
      
      const totals = calculateTotals(newItems, state.discount, state.checkout.form.groundFloorPickup);
      return { ...state, items: newItems, ...totals };
    }
    
    case 'DECREASE_QUANTITY': {
      const newItems = state.items.map(item => {
        if (item.id === action.payload) {
          const newQuantity = item.quantity - 1;
          return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
      
      const totals = calculateTotals(newItems, state.discount, state.checkout.form.groundFloorPickup);
      return { ...state, items: newItems, ...totals };
    }
    
    case 'INCREASE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      
      const totals = calculateTotals(newItems, state.discount, state.checkout.form.groundFloorPickup);
      return { ...state, items: newItems, ...totals };
    }
    
    case 'CLEAR_CART': {
      const totals = calculateTotals([], 0, false);
      return { ...state, items: [], discount: 0, ...totals };
    }
    
    case 'TOGGLE_MODAL': {
      return { ...state, showModal: action.payload ?? !state.showModal };
    }
    
    case 'REDEEM_POINTS': {
      const newDiscount = state.discount + action.payload.value;
      const totals = calculateTotals(state.items, newDiscount, state.checkout.form.groundFloorPickup);
      return {
        ...state,
        ...totals,
        discount: newDiscount,
        // When points are redeemed, this order earns 0 new points
        rewardPoints: 0,
        rewardValue: 0,
      };
    }

    case 'UNDO_REDEEM_POINTS': {
      const newDiscount = Math.max(0, state.discount - action.payload.value);
      const totals = calculateTotals(state.items, newDiscount, state.checkout.form.groundFloorPickup);
      return {
        ...state,
        discount: newDiscount,
        rewardPoints: action.payload.points,
        rewardValue: action.payload.value,
        ...totals,
      };
    }

    case 'TOGGLE_CHECKOUT_MODAL': {
      return {
        ...state,
        checkout: {
          ...state.checkout,
          showModal: action.payload !== undefined ? action.payload : !state.checkout.showModal,
        },
      };
    }

    case 'SET_CHECKOUT_STEP': {
      return {
        ...state,
        checkout: {
          ...state.checkout,
          currentStep: action.payload,
        },
      };
    }

    case 'UPDATE_CHECKOUT_FORM': {
      const newState = {
        ...state,
        checkout: {
          ...state.checkout,
          form: {
            ...state.checkout.form,
            ...action.payload,
          },
        },
      };

      // Recalculate totals if groundFloorPickup changed
      if (action.payload.groundFloorPickup !== undefined) {
        const totals = calculateTotals(
          state.items, 
          state.discount, 
          action.payload.groundFloorPickup
        );
        return { ...newState, ...totals };
      }

      return newState;
    }

    case 'LOAD_CART': {
      const { items, discount, rewardPoints, rewardValue } = action.payload;
      const totals = calculateTotals(items, discount, state.checkout.form.groundFloorPickup);
      return {
        ...state,
        items,
        discount,
        rewardPoints: discount > 0 ? 0 : rewardPoints,
        rewardValue: discount > 0 ? 0 : rewardValue,
        ...totals,
      };
    }

    case 'RECALCULATE_TOTALS': {
      const totals = calculateTotals(state.items, state.discount, state.checkout.form.groundFloorPickup);
      return { ...state, ...totals };
    }
    
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  settings: DeliverySettings;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, change: number) => void;
  decreaseQuantity: (id: string) => void;
  increaseQuantity: (id: string) => void;
  clearCart: () => void;
  toggleModal: (show?: boolean) => void;
  redeemPoints: (points: number, value: number) => void;
  undoRedeemPoints: (points: number, value: number) => void;
  toggleCheckoutModal: (show?: boolean) => void;
  setCheckoutStep: (step: number) => void;
  updateCheckoutForm: (formData: Partial<CheckoutForm>) => void;
  nextStep: () => void;
  placeOrder: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper functions for localStorage
const CART_STORAGE_KEY = 'naturalSpicesCart';

const saveToLocalStorage = (state: CartState) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        items: state.items,
        discount: state.discount,
        rewardPoints: state.rewardPoints,
        rewardValue: state.rewardValue
      }));
    }
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const loadFromLocalStorage = (): Partial<CartState> => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sanitize item weights: any weight > 25 kg per unit is clearly a bug
        // (was parsed from display unit like "500g" → 500 instead of 0.5 kg)
        const sanitizedItems = (parsed.items || []).map((item: CartItem) => ({
          ...item,
          weight: item.weight && item.weight > 25 ? item.weight / 1000 : item.weight
        }));
        return {
          items: sanitizedItems,
          discount: parsed.discount || 0,
          rewardPoints: parsed.rewardPoints || 0,
          rewardValue: parsed.rewardValue || 0
        };
      }
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return {};
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  
  // Fetch delivery settings from DB on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.delivery_cost_under_100 !== undefined) {
          currentSettings = data;
          setSettings(data);
          // Recalculate totals with new settings
          dispatch({ type: 'RECALCULATE_TOTALS' });
        }
      })
      .catch(err => console.error('Failed to fetch delivery settings:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load from localStorage after hydration
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData.items && savedData.items.length > 0) {
      // Use LOAD_CART to restore items with correct quantities
      dispatch({
        type: 'LOAD_CART',
        payload: {
          items: savedData.items as CartItem[],
          discount: savedData.discount || 0,
          rewardPoints: savedData.rewardPoints || 0,
          rewardValue: savedData.rewardValue || 0,
        },
      });
    }
    setIsHydrated(true);
  }, []);
  
  // Save to localStorage whenever state changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveToLocalStorage(state);
    }
  }, [state.items, state.discount, state.rewardPoints, state.rewardValue, isHydrated]);
  
  
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    
    // Fire GTM add_to_cart event
    gtmAddToCart({
      ...item,
      quantity: 1 // Always 1 for add_to_cart event
    });
  };
  
  const removeItem = (id: string) => {
    // Get item details before removing for GTM event
    const itemToRemove = state.items.find(item => item.id === id);
    
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    
    // Fire GTM remove_from_cart event
    if (itemToRemove) {
      gtmRemoveFromCart(itemToRemove);
    }
  };
  
  const updateQuantity = (id: string, change: number) => {
    // Get current item details for GTM events
    const currentItem = state.items.find(item => item.id === id);
    
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, change } });
    
    // Fire GTM events based on quantity change
    if (currentItem) {
      if (change > 0) {
        // Increasing quantity - fire add_to_cart
        gtmAddToCart({
          ...currentItem,
          quantity: 1 // Always 1 for each add event
        });
      } else if (change < 0) {
        // Decreasing quantity - fire remove_from_cart
        gtmRemoveFromCart({
          ...currentItem,
          quantity: 1 // Always 1 for each remove event
        });
      }
    }
  };
  
  const decreaseQuantity = (id: string) => {
    // Get current item details for GTM event
    const currentItem = state.items.find(item => item.id === id);
    
    dispatch({ type: 'DECREASE_QUANTITY', payload: id });
    
    // Fire GTM remove_from_cart event
    if (currentItem) {
      gtmRemoveFromCart({
        ...currentItem,
        quantity: 1 // Always 1 for each remove event
      });
    }
  };
  
  const increaseQuantity = (id: string) => {
    // Get current item details for GTM event
    const currentItem = state.items.find(item => item.id === id);
    
    dispatch({ type: 'INCREASE_QUANTITY', payload: id });
    
    // Fire GTM add_to_cart event
    if (currentItem) {
      gtmAddToCart({
        ...currentItem,
        quantity: 1 // Always 1 for each add event
      });
    }
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    // Also clear localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };
  
  const toggleModal = (show?: boolean) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: show });
    
    // Fire GTM view_cart event when opening cart modal
    if (show === true && state.items.length > 0) {
      gtmViewCart(state.items, state.total);
    }
  };
  
  const redeemPoints = (points: number, value: number) => {
    dispatch({ type: 'REDEEM_POINTS', payload: { points, value } });
  };

  const undoRedeemPoints = (points: number, value: number) => {
    dispatch({ type: 'UNDO_REDEEM_POINTS', payload: { points, value } });
  };

  const toggleCheckoutModal = (show?: boolean) => {
    dispatch({ type: 'TOGGLE_CHECKOUT_MODAL', payload: show });
  };

  const setCheckoutStep = (step: number) => {
    dispatch({ type: 'SET_CHECKOUT_STEP', payload: step });
  };

  const updateCheckoutForm = (formData: Partial<CheckoutForm>) => {
    dispatch({ type: 'UPDATE_CHECKOUT_FORM', payload: formData });
  };

  const nextStep = () => {
    if (state.checkout.currentStep < 2) {
      setCheckoutStep(state.checkout.currentStep + 1);
    }
  };

  const placeOrder = () => {
    // Close modal and clear cart
    toggleCheckoutModal(false);
    clearCart();
  };

  return (
    <CartContext.Provider value={{
      state,
      settings,
      addItem,
      removeItem,
      updateQuantity,
      decreaseQuantity,
      increaseQuantity,
      clearCart,
      toggleModal,
      redeemPoints,
      undoRedeemPoints,
      toggleCheckoutModal,
      setCheckoutStep,
      updateCheckoutForm,
      nextStep,
      placeOrder,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export type { CartItem, CartState };