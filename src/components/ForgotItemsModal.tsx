'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, calculateRewardPoints } from '../utils/price';

interface Product {
  product_id: number;
  name: string;
  price: number;
  special_price?: number;
  discount_percentage?: number;
  image_url?: string;
  weight?: number;
  product_url?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface ForgotItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: number[]; // Array of product IDs that were in the order
}

export const ForgotItemsModal: React.FC<ForgotItemsModalProps> = ({ 
  isOpen, 
  onClose, 
  orderItems 
}) => {
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { state, addItem, increaseQuantity, decreaseQuantity, toggleCheckoutModal, clearCart } = useCart();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth <= 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestedProducts();
    }
  }, [isOpen]);

  const fetchSuggestedProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products where checkout_page = true
      const response = await fetch('/api/products/checkout-page');
      const data = await response.json();

      if (data.success && data.data) {
        // Filter out products that were in the order
        const filteredProducts = data.data.filter(
          (product: Product) => !orderItems.includes(product.product_id)
        );
        setSuggestedProducts(filteredProducts);
      } else {
        setSuggestedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching checkout page products:', error);
      setSuggestedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const price = product.special_price || product.price;
    addItem({
      id: product.product_id.toString(),
      name: product.name,
      price: price,
      originalPrice: product.price !== price ? product.price : undefined,
      image: product.image_url,
      weight: product.product_unit ? parseFloat(product.product_unit) : 0,
    });
  };

  const getCartQuantity = (productId: number) => {
    const cartItem = state.items.find(item => item.id === productId.toString());
    return cartItem ? cartItem.quantity : 0;
  };

  const handlePlaceOrder = async () => {
    if (state.items.length === 0) {
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Get the last order ID from localStorage
      const lastOrderDbId = localStorage.getItem('lastOrderDbId');
      
      if (!lastOrderDbId) {
        alert('Order ID not found. Please contact support.');
        setIsPlacingOrder(false);
        return;
      }

      // Prepare items data
      const itemsToAdd = state.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        weight: item.weight
      }));

      // Call API to add items to existing order
      const response = await fetch('/api/orders/add-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: parseInt(lastOrderDbId),
          items: itemsToAdd
        })
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        alert(`✅ ${result.data.itemsAdded} item(s) added to your current order!\nAdditional Amount: AED ${result.data.additionalAmount.toFixed(2)}\nNew Total: AED ${result.data.newTotal.toFixed(2)}\nBonus Points: ${result.data.pointsEarned}`);
        
        // Clear cart
        clearCart();
        
        // Close modal
        onClose();
        
        // Reload the page to show updated order
        window.location.reload();
      } else {
        alert('Error adding items to order: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error adding items to order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredProducts = suggestedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="search-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: window.innerWidth <= 768 ? "10px" : "20px",
      }}
    >
      <div
        className="search-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "95%",
          maxWidth: "600px",
          height: "80vh",
          maxHeight: "600px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          margin: "10px",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: window.innerWidth <= 768 ? "15px 10px" : "20px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "60px",
          }}
        >
          <h3
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: window.innerWidth <= 768 ? "16px" : "18px",
              fontWeight: "bold",
            }}
          >
            <i className="fas fa-lightbulb" style={{ color: "#ff6b35" }}></i>
            Did you forget to add these items?
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Search Box */}
        <div
          style={{
            padding: window.innerWidth <= 768 ? "10px" : "15px 20px",
            borderBottom: "1px solid #eee",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <i
              className="fas fa-search"
              style={{
                position: "absolute",
                left: "12px",
                color: "#999",
              }}
            ></i>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 10px 10px 35px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "0",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                color: "#999",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px", marginBottom: "10px" }}></i>
                <p>Loading suggestions...</p>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {filteredProducts.map((product) => {
                const currentPrice = product.special_price || product.price;
                const originalPrice = product.price;
                const cartQty = getCartQuantity(product.product_id);

                return (
                  <div
                    key={product.product_id}
                    style={{
                      borderBottom: "1px solid #f0f0f0",
                      padding: window.innerWidth <= 768 ? "12px 10px" : "15px 20px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: window.innerWidth <= 768 ? "10px" : "15px",
                      backgroundColor: "white",
                      transition: "background-color 0.2s",
                    }}
                  >
                    {/* Product Image */}
                    <div className="search-result-image" style={{ flexShrink: 0 }}>
                      <Image
                        src={product.image_url || '/assets/du.png'}
                        alt=""
                        width={50}
                        height={50}
                        style={{
                          borderRadius: "8px",
                          objectFit: "cover",
                          border: "1px solid #e0e0e0"
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                      }}
                    >
                      <Link
                        href={`/product/${product.product_url || product.product_id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                        onClick={onClose}
                      >
                        <div className="search-result-name">
                          {product.name}
                        </div>
                      </Link>

                      {/* Points Display */}
                      <div
                        className="search-result-points"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: isMobileViewport ? "10px" : "12px",
                          color: "#ff6b35",
                        }}
                      >
                        <i
                          className="fas fa-star"
                          style={{ color: "#ff6b35" }}
                        ></i>
                        <span>
                          Earn {calculateRewardPoints(currentPrice)} points
                        </span>
                      </div>
                    </div>

                    {/* Price and Add Button */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "flex-start",
                        gap: window.innerWidth <= 768 ? "8px" : "15px",
                        minWidth: window.innerWidth <= 768 ? "80px" : "200px",
                        paddingTop: "5px",
                      }}
                    >
                      <div className="price-container">
                        {originalPrice && originalPrice > currentPrice ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            <span
                              className="search-result-price original-price"
                              style={{
                                textDecoration: "line-through",
                                color: "#999",
                                fontSize: "0.85em",
                              }}
                            >
                              <i className="aed"> </i>
                              <span>{formatPrice(originalPrice)}</span>
                            </span>
                            <span
                              className="search-result-price special-price"
                              style={{
                                color: "#28a745",
                                fontSize: "1em",
                                fontWeight: "bold",
                              }}
                            >
                              <i className="aed" aria-hidden="true" style={{ visibility: "hidden" }}> </i>
                              <span>{formatPrice(currentPrice)}</span>
                            </span>
                          </div>
                        ) : (
                          <span
                            className="search-result-price"
                            style={{
                              color: "#28a745",
                              fontSize: "1em",
                              fontWeight: "bold",
                            }}
                          >
                            <i className="aed"> </i>
                            <span>{formatPrice(currentPrice)}</span>
                          </span>
                        )}
                      </div>

                      {/* Add to Cart / Quantity Controls */}
                      <div className="cart-controls" style={{ minWidth: window.innerWidth <= 768 ? "60px" : "80px" }}>
                        {cartQty > 0 ? (
                          <div
                            className="quantity-box"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                              background: "#28a745",
                              borderRadius: "25px",
                              padding: "4px 6px",
                              minWidth: window.innerWidth <= 768 ? "60px" : "80px",
                            }}
                          >
                            <button
                              onClick={() => decreaseQuantity(product.product_id.toString())}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "14px",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                transition: "background-color 0.2s",
                              }}
                            >
                              <i className="fas fa-minus"></i>
                            </button>
                            <span
                              style={{
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "13px",
                                minWidth: "20px",
                                textAlign: "center",
                              }}
                            >
                              {cartQty}
                            </span>
                            <button
                              onClick={() => increaseQuantity(product.product_id.toString())}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "14px",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                transition: "background-color 0.2s",
                              }}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="search-result-add"
                            style={{
                              background: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "25px",
                              padding: window.innerWidth <= 768 ? "6px 12px" : "8px 16px",
                              cursor: "pointer",
                              fontSize: window.innerWidth <= 768 ? "12px" : "13px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              transition: "background-color 0.2s, transform 0.1s",
                              whiteSpace: "nowrap",
                              minWidth: window.innerWidth <= 768 ? "60px" : "80px",
                            }}
                          >
                            <i className="fas fa-cart-plus"></i>
                            {!isMobileViewport && "Add"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                color: "#999",
              }}
            >
              <i className="fas fa-box-open" style={{ fontSize: "48px", marginBottom: "10px" }}></i>
              <p>No products found</p>
            </div>
          )}
        </div>

        {/* Footer with Place Order Button */}
        {state.items.length > 0 && (
          <div
            style={{
              padding: window.innerWidth <= 768 ? "10px" : "15px 20px",
              borderTop: "1px solid #eee",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              style={{
                background: isPlacingOrder ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 30px',
                cursor: isPlacingOrder ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              {isPlacingOrder ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Adding Items...
                </>
              ) : (
                <>
                  <i className="fas fa-shopping-bag"></i>
                  Add to Current Order ({state.count} {state.count === 1 ? 'item' : 'items'})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
