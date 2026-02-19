'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/price';

// Helper function to format weight display
const formatWeight = (weight: string | number, unit?: string): string => {
  const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
  
  if (isNaN(weightNum)) return '';
  
  // If unit is kg or Kg
  if (unit?.toLowerCase() === 'kg') {
    if (weightNum >= 1) {
      return weightNum % 1 === 0 ? `${Math.round(weightNum)}kg` : `${weightNum}kg`;
    }
    // Convert to grams if less than 1kg
    const grams = weightNum * 1000;
    return `${Math.round(grams)}g`;
  }
  
  // If unit is g or grams
  if (unit?.toLowerCase() === 'g' || !unit) {
    if (weightNum >= 1000) {
      const kg = weightNum / 1000;
      return kg % 1 === 0 ? `${Math.round(kg)}kg` : `${kg.toFixed(1)}kg`;
    }
    return `${Math.round(weightNum)}g`;
  }
  
  // For other units, just format the number
  return `${weightNum}${unit}`;
};

interface ChildProduct {
  product_id: number;
  name: string;
  price: number;
  special_price?: number;
  product_unit?: string;
  unit?: string;
  dubai_only?: number;
}

interface ProductCardProps {
  id: string;
  name: string;
  currentPrice: number;
  originalPrice?: number;
  imageUrl?: string;
  product_url?: string;
  is_parent?: number;
  dubai_only?: number;
  product_unit?: string;
  onProductClick?: () => void;
}

export default function ProductCard({
  id,
  name,
  currentPrice,
  originalPrice,
  imageUrl,
  product_url,
  is_parent,
  dubai_only,
  product_unit,
  onProductClick
}: ProductCardProps) {
  const { addItem, decreaseQuantity, increaseQuantity, state } = useCart();
  const [childProducts, setChildProducts] = useState<ChildProduct[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch child products if this is a parent product
  useEffect(() => {
    if (is_parent === 1) {
      fetchChildProducts();
    }
  }, [is_parent, id]);

  const fetchChildProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}/children`);
      const data = await response.json();
      
      if (data.success && data.children && data.children.length > 0) {
        setChildProducts(data.children);
        setSelectedChildId(data.children[0].product_id);
      }
    } catch (error) {
      console.error('Error fetching child products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected child product
  const selectedChild = childProducts.find(c => c.product_id === selectedChildId);

  // Calculate display price
  let displayPrice = currentPrice;
  let displayOriginalPrice = originalPrice;
  
  if (is_parent === 1 && selectedChild) {
    const hasSpecialPrice = selectedChild.special_price && selectedChild.special_price > 0;
    displayPrice = hasSpecialPrice ? selectedChild.special_price! : selectedChild.price;
    displayOriginalPrice = hasSpecialPrice ? selectedChild.price : undefined;
  }

  // Check if product is in cart
  const isInCart = () => {
    if (is_parent === 1 && selectedChildId) {
      return state.items.find(item => item.id === selectedChildId.toString());
    }
    return state.items.find(item => item.id === id);
  };

  const getQuantity = () => {
    const cartItem = isInCart();
    return cartItem ? cartItem.quantity : 0;
  };

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (is_parent === 1 && selectedChild) {
      const hasSpecialPrice = selectedChild.special_price && selectedChild.special_price > 0;
      addItem({
        id: selectedChild.product_id.toString(),
        name: selectedChild.name,
        price: hasSpecialPrice ? selectedChild.special_price! : selectedChild.price,
        originalPrice: hasSpecialPrice ? selectedChild.price : undefined,
        image: imageUrl,
        weight: selectedChild.product_unit ? parseFloat(selectedChild.product_unit) : 0,
        dubai_only: selectedChild.dubai_only,
        parentProductId: parseInt(id),
        parentProductName: name,
        unit: selectedChild.unit,
      });
    } else {
      addItem({
        id,
        name,
        price: currentPrice,
        originalPrice,
        image: imageUrl,
        weight: product_unit ? parseFloat(product_unit) : 0,
        dubai_only,
      });
    }
  };

  // Handle quantity changes
  const handleQuantityDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (is_parent === 1 && selectedChildId) {
      decreaseQuantity(selectedChildId.toString());
    } else {
      decreaseQuantity(id);
    }
  };

  const handleQuantityIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (is_parent === 1 && selectedChildId) {
      increaseQuantity(selectedChildId.toString());
    } else {
      increaseQuantity(id);
    }
  };

  const cartItem = isInCart();
  const quantity = getQuantity();

  return (
    <div className="product-card">
      <Link
        href={`/product/${product_url || id}`}
        style={{ textDecoration: "none", color: "inherit" }}
        onClick={onProductClick}
      >
        <div className="product-image">
          <Image
            src={imageUrl || "/assets/du.png"}
            alt={name}
            width={100}
            height={100}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
          {displayOriginalPrice && displayOriginalPrice > displayPrice && (
            <div className="product-badge">
              {Math.round((1 - displayPrice / displayOriginalPrice) * 100)}% OFF
            </div>
          )}
        </div>
      </Link>

      <div className="product-details">
        <div className="product-title-container">
          <Link
            href={`/product/${product_url || id}`}
            style={{ textDecoration: "none", color: "inherit" }}
            onClick={onProductClick}
          >
            <h3 className="product-title">{name}</h3>
          </Link>
          
          {/* Dubai Only Badge */}
          {(dubai_only === 1 || selectedChild?.dubai_only === 1) && (
            <div style={{ marginTop: '8px', paddingLeft: '8px', paddingBottom: '4px' }}>
              <span style={{
                fontSize: '10px',
                color: '#c0392b',
                background: 'rgba(231, 76, 60, 0.08)',
                border: '1px solid rgba(231, 76, 60, 0.2)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                lineHeight: 1,
                letterSpacing: '0.3px'
              }}>
                <i className="fas fa-map-marker-alt" style={{ fontSize: '9px' }}></i>
                Dubai Delivery Only
              </span>
            </div>
          )}
        </div>

        {/* Weight/Size Options for Parent Products */}
        {is_parent === 1 && childProducts.length > 0 && (
          <div style={{ marginTop: '12px', marginBottom: '8px', paddingLeft: '8px' }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {childProducts.map((child) => {
                const isSelected = selectedChildId === child.product_id;
                return (
                  <button
                    key={child.product_id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedChildId(child.product_id);
                    }}
                    style={{
                      flex: childProducts.length <= 4 ? '1' : 'initial',
                      minWidth: '60px',
                      padding: '8px',
                      border: isSelected 
                        ? '1px solid var(--color-green)' 
                        : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: isSelected 
                        ? '#f0f9f1' // Very light green background
                        : '#fff',
                      color: isSelected 
                        ? 'var(--color-green)' // Green text
                        : '#555',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      lineHeight: 1.2,
                      textAlign: 'center',
                      boxShadow: isSelected ? 'inset 0 0 0 1px var(--color-green)' : 'none'
                    }}
                  >
                    {child.unit}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="product-footer">
          <div className="product-price">
            <div>
              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <span key="original" className="original-price" style={{ fontWeight: 600 }}>
                  <span>{formatPrice(displayOriginalPrice)}</span>
                </span>
              )}
              <span
                key="current"
                className="current-price"
                style={{ color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>{formatPrice(displayPrice)}</span>
                <i className="aed"></i>
              </span>
            </div>

            <div className="cart-section">
              <div className="cart-controls">
                {!cartItem ? (
                  <button
                    className="add-to-cart"
                    onClick={handleAddToCart}
                  >
                    <i className="fa-solid fa-cart-plus"></i>
                    ADD
                  </button>
                ) : (
                  <div className="quantity-box">
                    <button
                      className="quantity-btn"
                      onClick={handleQuantityDecrease}
                      title="Decrease Quantity"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span className="quantity">{quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={handleQuantityIncrease}
                      title="Increase Quantity"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
