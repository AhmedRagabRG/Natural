"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "../../../context/CartContext";
import { formatPrice, calculateRewardPoints } from "../../../utils/price";
import { getFirstImageUrl, getSecondImageUrl } from "../../../utils/imageUtils";
import { useProductUpdates } from "../../../hooks/useProductUpdates";
import { gtmViewItem } from "../../../utils/gtm";
import ProductCard from "../../../components/ProductCard";
import './page.css'

// Helper function to format weight display
const formatWeight = (weight: string | number, unit?: string): string => {
  const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
  
  if (isNaN(weightNum)) return '';
  
  // If unit is kg or Kg
  if (unit?.toLowerCase() === 'kg') {
    // Convert to whole number if possible
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

interface Product {
  product_id: number;
  name: string;
  price: number;
  special_price?: number;
  category_name?: string;
  product_unit?: string;
  unit?: string;
  category_id?: number;
  product_description?: string;
  product_url?: string;
  images?: string | number;
  parent_product_id?: number | null;
  is_parent?: number;
  dubai_only?: number;
}

interface RecentProduct {
  id: string;
  name: string;
  icon: string;
  currentPrice: number;
  originalPrice: number;
  category_id: number;
  product_url: string;
  imageUrl?: string;
  is_parent?: number;
  dubai_only?: number;
}

const ProductPage = ({ params }: { params: Promise<{ product_url: string }> }) => {
  const { product_url } = React.use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string>("/assets/du.png");
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [recentProductsLoading, setRecentProductsLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<RecentProduct[]>([]);
  const [topSellersLoading, setTopSellersLoading] = useState(true);
  const [childProducts, setChildProducts] = useState<Product[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<Product | null>(null);
  const { addItem, removeItem, updateQuantity, decreaseQuantity, increaseQuantity, state } = useCart();

  // Function to fetch child products
  const fetchChildProducts = async (parentId: number) => {
    try {
      const response = await fetch(`/api/products/${parentId}/children`);
      const data = await response.json();
      
      if (data.success && data.children) {
        setChildProducts(data.children);
        // Set first child as selected variation by default
        if (data.children.length > 0) {
          setSelectedVariation(data.children[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching child products:", error);
      setChildProducts([]);
    }
  };

  // Function to fetch product data
  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?status=active`);
      const data = await response.json();

      if (data.success && data.data) {
        const productsData = Array.isArray(data.data)
          ? data.data
          : data.data.products || [];

        // Decode the URL parameter and find product by product_url
        const decodedProductUrl = decodeURIComponent(product_url);
        const foundProduct = productsData.find((p: Product) =>
          p.product_url === product_url ||
          p.product_url === decodedProductUrl
        );

        if (foundProduct) {
          setProduct(foundProduct);
          // Load product image (use second image for main product)
          const imageUrl = await getSecondImageUrl(foundProduct.images);
          setProductImageUrl(imageUrl);

          // If this is a parent product, fetch its children
          if (foundProduct.is_parent === 1) {
            await fetchChildProducts(foundProduct.product_id);
          } else {
            // Reset child products if switching to non-parent product
            setChildProducts([]);
            setSelectedVariation(null);
          }

          if (foundProduct.category_id) {
            await fetchSimilarProducts(foundProduct.category_id, foundProduct.product_id);
          }

          // Fire GTM view_item event
          const currentPrice = foundProduct.special_price && parseFloat(foundProduct.special_price.toString()) > 0
            ? parseFloat(foundProduct.special_price.toString())
            : parseFloat(foundProduct.price.toString());

          gtmViewItem({
            id: foundProduct.product_id.toString(),
            name: foundProduct.name,
            price: currentPrice,
            category: foundProduct.category_name || 'Spices'
          });
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use product updates hook for real-time updates
  const { isConnected } = useProductUpdates({
    onUpdate: (event) => {
      console.log('Product update received in product page:', event);
      // Reload current product if it's updated
      if (event.type === 'product_updated' && event.data?.product_id === product?.product_id) {
        loadProduct();
      }
      // Reload similar products if any product is updated/created/deleted
      if (event.type === 'product_updated' || event.type === 'product_created' || event.type === 'product_deleted') {
        if (product?.category_id) {
          fetchSimilarProducts(product.category_id, product.product_id);
        }
      }
    }
  });



  // Fetch similar products from the same category
  const fetchSimilarProducts = async (categoryId: number, currentProductId: number) => {
    try {
      setRecentProductsLoading(true);
      const response = await fetch(
        `/api/products?category_id=${categoryId}&status=active`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const productsData = Array.isArray(data.data)
          ? data.data
          : data.data.products || [];

        // Filter out the current product and limit to 8 products
        const filteredProducts = await Promise.all(
          productsData
            .filter((p: Product) => p.product_id !== currentProductId)
            .slice(0, 8)
            .map(async (product: Product) => {
              const imageUrl = await getFirstImageUrl(product.images);
              return {
                id: product.product_id.toString(),
                name: product.name,
                icon: "🌿",
                currentPrice: product.special_price || product.price,
                originalPrice: product.price,
                category_id: product.category_id,
                product_url: product.product_url,
                imageUrl,
                is_parent: product.is_parent,
                dubai_only: product.dubai_only
              };
            })
        );

        setRecentProducts(filteredProducts);
      }
    } catch (error) {
      console.error("Error fetching similar products:", error);
      setRecentProducts([]);
    } finally {
      setRecentProductsLoading(false);
    }
  };

  // Fetch top selling products
  const fetchTopSellers = async () => {
    try {
      setTopSellersLoading(true);
      const response = await fetch('/api/products/top-sellers?limit=8');
      const data = await response.json();

      if (data.success && data.data) {
        const productsData = Array.isArray(data.data)
          ? data.data
          : data.data.products || [];

        // Get top 8 products and format them
        const topSellingProducts = await Promise.all(
          productsData
            .slice(0, 8)
            .map(async (product: Product) => {
              const imageUrl = await getFirstImageUrl(product.images);
              return {
                id: product.product_id.toString(),
                name: product.name,
                icon: "🏆",
                currentPrice: product.special_price || product.price,
                originalPrice: product.price,
                category_id: product.category_id,
                product_url: product.product_url,
                imageUrl,
                is_parent: product.is_parent,
                dubai_only: product.dubai_only
              };
            })
        );

        setTopSellers(topSellingProducts);
      }
    } catch (error) {
      console.error("Error fetching top sellers:", error);
      setTopSellers([]);
    } finally {
      setTopSellersLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    fetchTopSellers();
  }, [product_url]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Product not found</p>
      </div>
    );
  }

  // Get the effective product (either selected variation or main product)
  const effectiveProduct = selectedVariation || product;
  
  const hasSpecialPrice = effectiveProduct.special_price && parseFloat(effectiveProduct.special_price.toString()) > 0;
  const currentPrice = hasSpecialPrice ? parseFloat(effectiveProduct.special_price!.toString()) : parseFloat(effectiveProduct.price.toString());
  const originalPrice = hasSpecialPrice ? parseFloat(effectiveProduct.price.toString()) : undefined;
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const rewardPoints = calculateRewardPoints(currentPrice);

  // Cart functions
  const isInCart = () => {
    return state.items.find(cartItem => cartItem.id === effectiveProduct.product_id.toString());
  };

  const getQuantity = () => {
    const cartItem = isInCart();
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = () => {
    // If product is parent and we have a selected variation, add the variation
    const productToAdd = selectedVariation || effectiveProduct;
    
    addItem({
      id: productToAdd.product_id.toString(),
      name: productToAdd.name,
      price: currentPrice,
      originalPrice: originalPrice,
      weight: productToAdd.product_unit ? parseFloat(productToAdd.product_unit) : 0,
      unit: productToAdd.unit,
      parentProductId: product.is_parent === 1 ? product.product_id : undefined,
      parentProductName: product.is_parent === 1 ? product.name : undefined,
    });
  };

  const handleQuantityChange = (change: number) => {
    const cartItem = isInCart();
    if (cartItem) {
      if (change === -1 && cartItem.quantity <= 1) {
        removeItem(effectiveProduct.product_id.toString());
      } else {
        updateQuantity(effectiveProduct.product_id.toString(), change);
      }
    }
  };

  const handleVariationSelect = (variation: Product) => {
    setSelectedVariation(variation);
  };

  return (
    <div className="product-container">
      <div className="product-layout">
        <div className="product-image">
          {hasDiscount && (
            <span className="discount-badge">
              {Math.round((1 - currentPrice / originalPrice!) * 100)}% OFF
            </span>
          )}
          <Image
            src={productImageUrl}
            alt={product.name}
            width={400}
            height={400}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "8px"
            }}
          />
        </div>

        <div className="product-info">
          <div className="product-collection">
            <i className="fas fa-tag"></i>
            <span>{product.category_name || "Product"}</span>
          </div>

          <h1 className="product-title">{product.name}</h1>

          {/* Dubai Only Badge */}
          {(product.dubai_only === 1 || selectedVariation?.dubai_only === 1) && (
            <div style={{ marginBottom: '16px', marginTop: '-8px' }}>
              <span style={{
                fontSize: '12px',
                color: '#c0392b',
                background: 'rgba(231, 76, 60, 0.08)',
                border: '1px solid rgba(231, 76, 60, 0.2)',
                padding: '6px 10px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fas fa-map-marker-alt" style={{ fontSize: '11px' }}></i>
                Dubai Delivery Only
              </span>
            </div>
          )}

          {product.product_description && (
            <div className="product-description" style={{
              margin: "16px 0",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              fontSize: "0.95rem",
              lineHeight: "1.5",
              color: "#666"
            }}>
              <i className="fas fa-info-circle" style={{ marginRight: "8px", color: "#007bff" }}></i>
              {product.product_description}
            </div>
          )}

          {/* Weight/Size selector for parent products */}
          {product.is_parent === 1 && childProducts.length > 0 && (
            <div style={{
              margin: "16px 0",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px"
            }}>
              <div style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "10px",
                color: "#555"
              }}>
                <i className="fas fa-weight-hanging" style={{ marginRight: "6px", color: "#28a745", fontSize: "0.8rem" }}></i>
                Select Size:
              </div>
              <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap"
              }}>
                {childProducts.map((child) => {
                  const childHasSpecialPrice = child.special_price && parseFloat(child.special_price.toString()) > 0;
                  const childCurrentPrice = childHasSpecialPrice 
                    ? parseFloat(child.special_price!.toString()) 
                    : parseFloat(child.price.toString());
                  const isSelected = selectedVariation?.product_id === child.product_id;
                  
                  return (
                    <button
                      key={child.product_id}
                      onClick={() => handleVariationSelect(child)}
                      style={{
                        padding: "8px 14px",
                        border: isSelected ? "2px solid var(--color-green)" : "1.5px solid #dee2e6",
                        borderRadius: "6px",
                        background: isSelected ? "var(--color-green)" : "white",
                        color: isSelected ? "white" : "#333",
                        fontSize: "13px",
                        fontWeight: isSelected ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "3px",
                        minWidth: "70px"
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>
                        {child.unit}
                      </span>
                      <span style={{ fontSize: "11px", opacity: 0.9 }}>
                        {formatPrice(childCurrentPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="price-section">
            {hasDiscount && (
              <span className="original-price">
                <i className="aed"></i>
                <span>{formatPrice(originalPrice!)}</span>
              </span>
            )}
            <span className="current-price">
              <i className="aed"></i>
              <span>{formatPrice(currentPrice)}</span>
            </span>
          </div>

          {hasDiscount && (
            <div
              className="cart-item-discount"
              style={{ fontSize: "0.95rem", fontWeight: 500 }}
            >
              <i className="fas fa-tag"></i>
              Save <i className="aed"></i>
              <span>{formatPrice(originalPrice! - currentPrice)}</span>
              ({Math.round((1 - currentPrice / originalPrice!) * 100)}% OFF)
            </div>
          )}

          <div className="reward-points">
            <i className="fa-solid fa-gift"></i>
            Earn <span>{rewardPoints}</span> points
          </div>

          <div className="cart-section">
            <div className="cart-controls">
              {!isInCart() ? (
                <button
                  className="add-to-cart"
                  onClick={handleAddToCart}
                >
                  <i className="fa-solid fa-cart-plus"></i>
                  Add to Cart
                </button>
              ) : (
                <div className="quantity-box">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    title="Decrease Quantity"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <span className="quantity">
                    {getQuantity()}
                  </span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={getQuantity() >= 10}
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

      <div className="hot-selling-items-section">
        <div className="section-header">
          <h2>
            <i className="fas fa-layer-group"></i>
            Similar Products
          </h2>
          <p>Products from the same category</p>
        </div>

        <div className="products-grid">
          {recentProductsLoading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
              <p>Loading similar products...</p>
            </div>
          ) : recentProducts.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              <p>No similar products found</p>
            </div>
          ) : (
            recentProducts.map((recentProduct) => (
              <ProductCard
                key={recentProduct.id}
                id={recentProduct.id}
                name={recentProduct.name}
                currentPrice={recentProduct.currentPrice}
                originalPrice={recentProduct.originalPrice}
                imageUrl={recentProduct.imageUrl}
                product_url={recentProduct.product_url}
                is_parent={recentProduct.is_parent}
                dubai_only={recentProduct.dubai_only}
              />
            ))
          )}
        </div>
      </div>

      {/* Top Sellers Section */}
      <div className="hot-selling-items-section">
        <div className="section-header">
          <h2>
            <i className="fas fa-trophy"></i>
            Top Sellers
          </h2>
          <p>Our best selling products</p>
        </div>

        <div className="products-grid">
          {topSellersLoading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
              <p>Loading top sellers...</p>
            </div>
          ) : topSellers.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              <p>No top sellers found</p>
            </div>
          ) : (
            topSellers.map((topSeller) => (
              <ProductCard
                key={topSeller.id}
                id={topSeller.id}
                name={topSeller.name}
                currentPrice={topSeller.currentPrice}
                originalPrice={topSeller.originalPrice}
                imageUrl={topSeller.imageUrl}
                product_url={topSeller.product_url}
                is_parent={topSeller.is_parent}
                dubai_only={topSeller.dubai_only}
              />
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductPage;