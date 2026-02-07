"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { useProduct } from "../context/ProductContext";
import { formatPrice, calculateRewardPoints } from "../utils/price";
import { cache, CACHE_KEYS } from "../utils/cache";
import { useProductUpdates } from "../hooks/useProductUpdates";
import { getFirstImageUrl } from "../utils/imageUtils";

interface Product {
  id: string;
  name: string;
  currentPrice: number;
  originalPrice?: number;
  special_price?: number;
  images?: number;
  weight?: number;
  product_url?: string;
  imageUrl?: string;
  parent_product_id?: number | null;
  is_parent?: number;
  dubai_only?: number;
  unit?: string;
}

interface Offer {
  id: number;
  name: string;
  event_url: string;
  status: number;
  created_at: number;
}

const Header: React.FC = () => {
  const { state, addItem, toggleModal, toggleCheckoutModal, increaseQuantity, decreaseQuantity } =
    useCart();
  const { setProduct } = useProduct();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Use product updates hook for real-time updates
  const { isConnected } = useProductUpdates({
    onUpdate: (event) => {
      // Re-search if there's an active search query
      if (searchQuery && (event.type === 'product_updated' || event.type === 'product_created' || event.type === 'product_deleted')) {
        searchProducts(searchQuery);
      }
    }
  });

  // Unified cart controls sizing (mobile vs desktop)
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setIsMobileViewport(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cartUIStyle = useMemo(() => {
    const buttonSize = isMobileViewport ? 21 : 22;
    const quantityFontPx = isMobileViewport ? 11 : 12;
    const quantityMinWidthPx = isMobileViewport ? 16 : 18;
    const cartControlsMinWidthPx = isMobileViewport ? 60 : 80;

    return {
      cartControls: {
        minWidth: `${cartControlsMinWidthPx}px`,
        width: "auto",
      } as React.CSSProperties,
      qtyBtn: {
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: `${Math.max(10, Math.min(14, quantityFontPx))}px`,
      } as React.CSSProperties,
      qtyText: {
        minWidth: `${quantityMinWidthPx}px`,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: `${quantityFontPx}px`,
      } as React.CSSProperties,
    };
  }, [isMobileViewport]);

  // Fetch all products once on component mount - use cache to avoid API spam
  const fetchAllProducts = async () => {
    setProductsLoading(true);
    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.PRODUCTS_ALL;
      const cachedProducts = cache.get<Product[]>(cacheKey);
      
      // Validate cache has required fields (is_parent, parent_product_id) and includes child products
      const hasParents = cachedProducts && cachedProducts.some(p => p.is_parent === 1);
      const hasChildren = cachedProducts && cachedProducts.some(p => !!p.parent_product_id);
      
      const isCacheValid = cachedProducts && cachedProducts.length > 0 && 
                           'is_parent' in cachedProducts[0] &&
                           (!hasParents || hasChildren);
      
      if (isCacheValid && cachedProducts) {
        // If cached products are missing image URLs, hydrate them now
        const needsImageHydration = cachedProducts.some((p) => !p.imageUrl || p.imageUrl === "");
        if (needsImageHydration) {
          const hydratedProducts = await Promise.all(
            cachedProducts.map(async (p) => ({
              ...p,
              imageUrl: await getFirstImageUrl(p.images),
            }))
          );
          cache.set(cacheKey, hydratedProducts, 5 * 60 * 1000);
          setAllProducts(hydratedProducts);
        } else {
          setAllProducts(cachedProducts);
        }
        setProductsLoading(false);
        return;
      }

      const response = await fetch("/api/products?include_children=true");
      const data = await response.json();

      if (data.success && data.data && data.data.products) {
        const baseProducts: Product[] = data.data.products.map(
          (product: {
            product_id: number;
            name: string;
            price: number;
            special_price?: number;
            images?: number;
            product_unit?: string;
            product_url?: string;
            image_url?: string;
            parent_product_id?: number | null;
            is_parent?: number;
          }) => {
            const hasSpecial =
              typeof product.special_price === "number" &&
              product.special_price > 0 &&
              product.special_price !== product.price;

            return {
              id: product.product_id.toString(),
              name: product.name,
              currentPrice: hasSpecial
                ? Number(product.special_price)
                : Number(product.price),
              originalPrice: hasSpecial ? Number(product.price) : undefined,
              special_price: product.special_price,
              images: product.images,
              imageUrl: product.image_url || '',
              weight: product.product_unit ? parseFloat(product.product_unit) : 0,
              unit: product.product_unit,
              product_url: product.product_url,
              parent_product_id: product.parent_product_id,
              is_parent: product.is_parent,
              dubai_only: product.dubai_only,
            } as Product;
          }
        );
        // If server provided image_url use it, otherwise resolve first image URL
        const products = await Promise.all(
          baseProducts.map(async (p: Product) => {
            if (p.imageUrl && p.imageUrl.length > 0) return p;
            return { ...p, imageUrl: await getFirstImageUrl(p.images) };
          })
        );
        
        // Cache products for 5 minutes
        cache.set(cacheKey, products, 5 * 60 * 1000);
        setAllProducts(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Local search function with word-based priority algorithm
  const searchProducts = (query: string) => {
    if (query.length === 0) {
      setSearchResults([]);
      return;
    }

    // Split query into individual words and clean them
    const queryWords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.trim());

    const scoredProducts = allProducts.map(product => {
      // Exclude child products from search results, they will be accessed via their parent
      if (product.parent_product_id) {
        return {
          product,
          matchCount: 0,
          totalScore: 0,
          hasAnyMatch: false
        };
      }

      const productName = product.name.toLowerCase();
      let matchCount = 0;
      let totalScore = 0;

      // Count how many query words match in the product name
      queryWords.forEach(word => {
        if (productName.includes(word)) {
          matchCount++;
          // Give higher score for exact word matches vs partial matches
          const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
          if (wordRegex.test(productName)) {
            totalScore += 10; // Exact word match
          } else {
            totalScore += 5; // Partial match
          }
        }
      });

      // Bonus score for complete query match
      if (productName.includes(query.toLowerCase())) {
        totalScore += 20;
      }

      return {
        product,
        matchCount,
        totalScore,
        hasAnyMatch: matchCount > 0
      };
    });

    // Filter products that have at least one word match
    const filteredProducts = scoredProducts
      .filter(item => item.hasAnyMatch)
      .sort((a, b) => {
        // Primary sort: by number of matching words (descending)
        if (a.matchCount !== b.matchCount) {
          return b.matchCount - a.matchCount;
        }
        
        // Secondary sort: by total score (descending)
        if (a.totalScore !== b.totalScore) {
          return b.totalScore - a.totalScore;
        }
        
        // Tertiary sort: by product name (ascending)
        return a.product.name.localeCompare(b.product.name);
      })
      .map(item => item.product);

    setSearchResults(filteredProducts);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchProducts(value); // Now uses local search - much faster!
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      setShowSearchModal(true);
      setShowDropdown(false);
    }
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  // Keep mobile dropdown full-width and anchored under the input
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (!showDropdown) return;
      if (typeof window === "undefined") return;

      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        setDropdownStyle({});
        return;
      }

      const container = searchRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      setDropdownStyle({
        position: "fixed",
        top: `${Math.round(rect.bottom)}px`,
        left: 0,
        right: 0,
        width: "100vw",
        marginTop: 0,
        zIndex: 1000,
      });
    };

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, { passive: true });
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [showDropdown, searchQuery]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.currentPrice,
      originalPrice: product.originalPrice,
      image: product.images?.toString(),
      weight: product.weight,
      dubai_only: product.dubai_only,
    });
  };

  // Check if product is in cart
  const isInCart = (productId: string) => {
    return state.items.find((item) => item.id === productId);
  };

  // Get quantity of product in cart
  const getQuantity = (productId: string) => {
    const cartItem = isInCart(productId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Save product data when navigating to product page
  const handleProductNavigation = (product: Product) => {
    setProduct(product.id, {
      product_id: parseInt(product.id),
      name: product.name,
      price: product.currentPrice,
      special_price: product.originalPrice,
      category_name: "Product",
      product_unit: product.weight?.toString(),
      id: product.id,
      currentPrice: product.currentPrice,
      originalPrice: product.originalPrice,
      image: product.images?.toString(),
      weight: product.weight
    });
  };

  // Fetch offers from API
  const fetchOffers = async () => {
    setOffersLoading(true);
    try {
      const response = await fetch("/api/events");
      const data = await response.json();

      if (data.success && data.data) {
        // Handle different API response structures
        const events = Array.isArray(data.data)
          ? data.data
          : data.data.events || [];
        // Filter only active offers (status = 1)
        const activeOffers = events.filter(
          (offer: Offer) => offer.status === 1
        );
        setOffers(activeOffers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch offers and products on component mount
  useEffect(() => {
    fetchOffers();
    fetchAllProducts();
  }, []);

  return (
    <div className="header-container">
      <div className="container-fluid">
        <header className="main-header">
          <div className="brand">
            <div>
              <span className="a-holder"></span>
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="Natural Spices & Foodstuff Trading"
                  width={110}
                  height={110}
                  priority
                />
              </Link>
            </div>

            <span className="brand-name">
              <strong>
                Natural Spices <span>Foodstuff Trading</span>
              </strong>
              <br />
              <span> Foodstuff Trading </span>
            </span>
          </div>

          <div className="end-side">
            <div className="input-group" ref={searchRef}>
              <div className="input-container" style={{ position: "relative" }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={handleSearchFocus}
                  onKeyPress={handleSearchKeyPress}
                />
                <i className="input-icon fas fa-search"></i>

                {showDropdown && searchQuery.length > 0 && (
                  <div
                    className="search-dropdown"
                    style={{ display: "block", ...dropdownStyle }}
                  >
                    {searchResults.length > 0 ? (
                      <div>
                        {searchResults.map((product) => {
                          const children = product.is_parent === 1 
                            ? allProducts.filter(p => p.parent_product_id === parseInt(product.id)).sort((a, b) => a.currentPrice - b.currentPrice)
                            : [];
                          
                          const selectedChildId = selectedVariants[product.id];
                          const activeChild = children.length > 0 ? (children.find(c => c.id === selectedChildId) || children[0]) : null;
                          const displayProduct = activeChild || product;

                          return (
                          <div key={product.id} className="search-result">
                            <div className="search-result-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              {/* Product Image */}
                              <div className="search-result-image" style={{ flexShrink: 0 }}>
                                <Image
                                  src={displayProduct.imageUrl || '/assets/du.png'}
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
                              
                              {/* Product Details */}
                              <div className="search-result-details" style={{ flex: 1, minWidth: 0 }}>
                                <Link
                                  href={`/product/${product.product_url || product.id}`}
                                  className="search-result-name"
                                  style={{ textDecoration: "none", color: "inherit" }}
                                  onClick={() => {
                                    handleProductNavigation(product);
                                    setShowDropdown(false);
                                  }}
                                >
                                  {product.name}
                                </Link>

                                {children.length > 0 && (
                                  <div onClick={e => e.stopPropagation()} style={{ marginTop: '4px' }}>
                                    <select
                                      style={{
                                        width: '100%',
                                        padding: '2px 4px',
                                        fontSize: '11px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: '#f9f9f9',
                                        cursor: 'pointer'
                                      }}
                                      value={activeChild?.id}
                                      onChange={(e) => setSelectedVariants({...selectedVariants, [product.id]: e.target.value})}
                                    >
                                      {children.map(child => (
                                        <option key={child.id} value={child.id}>
                                          {child.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div
                                  className="search-result-points"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontSize: isMobileViewport ? "10px" : "12px",
                                    color: "#ff6b35",
                                    marginTop: "4px",
                                  }}
                                >
                                  <i
                                    className="fas fa-star"
                                    style={{ color: "#ff6b35" }}
                                  ></i>
                                  <span>
                                    Earn {calculateRewardPoints(
                                      typeof displayProduct.special_price === "number" &&
                                        displayProduct.special_price > 0 &&
                                        displayProduct.special_price !== displayProduct.currentPrice
                                        ? displayProduct.special_price
                                        : displayProduct.currentPrice
                                    )} points
                                  </span>
                                </div>
                              </div>
                              
                              {/* Price and Cart Controls */}
                              <div className="search-result-meta" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                                <div className="price-container">
                                  {product.dubai_only === 1 && (
                                    <div style={{
                                      color: '#e74c3c',
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      marginBottom: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      justifyContent: 'flex-end'
                                    }}>
                                      <i className="fa-solid fa-location-dot"></i>
                                      Dubai Only
                                    </div>
                                  )}
                                    <>
                                      {displayProduct.originalPrice &&
                                      displayProduct.originalPrice > displayProduct.currentPrice ? (
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-end",
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
                                            <span>{formatPrice(displayProduct.originalPrice)}</span>
                                          </span>
                                          <span
                                            className="search-result-price special-price"
                                            style={{
                                              color: "#28a745",
                                              fontSize: "1em",
                                              fontWeight: "bold",
                                            }}
                                          >
                                            {/* Invisible AED icon to align numbers with the line above */}
                                            <i className="aed" aria-hidden="true" style={{ visibility: "hidden" }}> </i>
                                            <span>{formatPrice(displayProduct.currentPrice)}</span>
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="search-result-price current-price">
                                          <span>{formatPrice(displayProduct.currentPrice)}</span>
                                        </span>
                                      )}
                                    </>
                                </div>
                                <div
                                  className="cart-controls"
                                  style={cartUIStyle.cartControls}
                                >
                                  {!isInCart(displayProduct.id) ? (
                                    <button
                                      className="search-result-add"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleAddToCart(displayProduct);
                                      }}
                                    >
                                      <i className="fa-solid fa-cart-plus"></i>
                                      ADD
                                    </button>
                                  ) : (
                                    <div
                                      className="quantity-box"
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                      }}
                                    >
                                      <button
                                        className="quantity-btn"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          decreaseQuantity(displayProduct.id);
                                        }}
                                        style={cartUIStyle.qtyBtn}
                                        title="Decrease Quantity"
                                      >
                                        <i className="fas fa-minus"></i>
                                      </button>
                                      <span
                                        className="quantity"
                                        style={cartUIStyle.qtyText}
                                      >
                                        {getQuantity(displayProduct.id)}
                                      </span>
                                      <button
                                        className="quantity-btn"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          increaseQuantity(displayProduct.id);
                                        }}
                                        style={cartUIStyle.qtyBtn}
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
                        );
                        })}
                      </div>
                    ) : (
                      searchQuery && (
                        <div className="no-results">No products found</div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <nav className="main-nav hide-on-mobile">
              <div className="btn-container">
                <Link href="/" className="btn btn-primary">
                  <i className="fas fa-home"></i>
                  Home
                </Link>
              </div>

              {/* Dynamic Offers from API */}
              {offersLoading ? (
                <div className="btn-container">
                  <span className="btn btn-primary" style={{ opacity: 0.7 }}>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Loading...
                  </span>
                </div>
              ) : (
                offers.map((offer) => (
                  <div key={offer.id} className="btn-container">
                    <Link
                      href={`/offer/${offer.event_url}`}
                      className="btn btn-primary"
                    >
                      <i className="fa-solid fa-gift"></i>
                      {offer.name}
                    </Link>
                  </div>
                ))
              )}

              {/* Fallback if no offers */}
              {!offersLoading && offers.length === 0 && (
                <div className="btn-container">
                  <Link href="/offers" className="btn btn-primary">
                    <i className="fa-solid fa-gift"></i>
                    Offers
                  </Link>
                </div>
              )}

              <span
                className="hide-on-mobile"
                style={{ color: "white", fontSize: "1.2rem" }}
              >
                |
              </span>

              <div className="btn-container hide-on-mobile">
                {state.count > 0 && (
                  <span className="btn-badge">{state.count}</span>
                )}
                <button
                  onClick={() => toggleCheckoutModal(true)}
                  className="btn btn-primary"
                  style={{
                    borderRadius: "50%",
                    fontSize: "0.9rem",
                    width: "50px",
                    height: "50px",
                    borderColor: "var(--color-yellow)",
                    borderWidth: "3px",
                  }}
                >
                  <i className="fas fa-shopping-cart"></i>
                </button>
              </div>
            </nav>
          </div>
        </header>
      </div>

      {/* Search Results Modal */}
      {showSearchModal && (
        <div
          className="search-modal-backdrop"
          onClick={() => setShowSearchModal(false)}
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
                <i className="fas fa-search"></i>
                Search Results for &quot;{searchQuery}&quot;
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
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

            {/* Modal Body */}
            <div
              style={{
                padding: "0",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {searchResults.map((product) => {
                  const children = product.is_parent === 1 
                    ? allProducts.filter(p => p.parent_product_id === parseInt(product.id)).sort((a, b) => a.currentPrice - b.currentPrice)
                    : [];
                  
                  const selectedChildId = selectedVariants[product.id];
                  const activeChild = children.length > 0 ? (children.find(c => c.id === selectedChildId) || children[0]) : null;
                  const displayProduct = activeChild || product;

                  const discountPercentage =
                    displayProduct.originalPrice &&
                      displayProduct.originalPrice !== displayProduct.currentPrice
                      ? Math.round(
                        ((displayProduct.originalPrice - displayProduct.currentPrice) /
                          displayProduct.originalPrice) *
                        100
                      )
                      : 0;

                  return (
                    <div
                      key={product.id}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        padding:
                          window.innerWidth <= 768 ? "12px 10px" : "15px 20px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: window.innerWidth <= 768 ? "10px" : "15px",
                        backgroundColor: "white",
                        transition: "background-color 0.2s",
                      }}
                    >
                      {/* Product Image (match dropdown style) */}
                      <div className="search-result-image" style={{ flexShrink: 0 }}>
                        <Image
                          src={displayProduct.imageUrl || '/assets/du.png'}
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
                          href={`/product/${product.product_url || product.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                          onClick={() => {
                            handleProductNavigation(product);
                            setShowSearchModal(false);
                          }}
                        >
                          <div className="search-result-name">
                            {product.name}
                          </div>
                        </Link>
                        
                        {children.length > 0 && (
                          <div onClick={e => e.stopPropagation()} style={{ marginTop: '5px' }}>
                            <select
                              style={{
                                width: '100%',
                                maxWidth: '200px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: '#f9f9f9',
                                cursor: 'pointer'
                              }}
                              value={activeChild?.id}
                              onChange={(e) => setSelectedVariants({...selectedVariants, [product.id]: e.target.value})}
                            >
                              {children.map(child => (
                                <option key={child.id} value={child.id}>
                                  {child.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Points Display (same as dropdown) */}
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
                            Earn {calculateRewardPoints(
                              typeof displayProduct.special_price === "number" &&
                                displayProduct.special_price > 0 &&
                                displayProduct.special_price !== displayProduct.currentPrice
                                ? displayProduct.special_price
                                : displayProduct.currentPrice
                            )} points
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
                          minWidth:
                            window.innerWidth <= 768 ? "80px" : "200px",
                          paddingTop: "5px",
                        }}
                      >
                        <div className="price-container">
                          {product.dubai_only === 1 && (
                            <div style={{
                              color: '#e74c3c',
                              fontSize: '10px',
                              fontWeight: '700',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <i className="fa-solid fa-location-dot"></i>
                              Dubai Only
                            </div>
                          )}
                          {displayProduct.originalPrice &&
                          displayProduct.originalPrice > displayProduct.currentPrice ? (
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
                                <span>{formatPrice(displayProduct.originalPrice)}</span>
                              </span>
                              <span
                                className="search-result-price special-price"
                                style={{
                                  color: "#28a745",
                                  fontSize: "1em",
                                  fontWeight: "bold",
                                }}
                              >
                                {/* Invisible AED icon to align numbers with the line above */}
                                <i className="aed" aria-hidden="true" style={{ visibility: "hidden" }}> </i>
                                <span>{formatPrice(displayProduct.currentPrice)}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="search-result-price current-price">
                              <span>{formatPrice(displayProduct.currentPrice)}</span>
                            </span>
                          )}
                        </div>

                        <div
                                    className="cart-controls"
                                    style={cartUIStyle.cartControls}
                                  >
                                    {!isInCart(displayProduct.id) ? (
                                      <button
                                        className="search-result-add"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleAddToCart(displayProduct);
                                        }}
                                      >
                                        <i className="fa-solid fa-cart-plus"></i>
                                        ADD
                                      </button>
                                    ) : (
                                      <div
                                        className="quantity-box"
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}
                                      >
                                        <button
                                          className="quantity-btn"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            decreaseQuantity(displayProduct.id);
                                          }}
                                          style={cartUIStyle.qtyBtn}
                                          title="Decrease Quantity"
                                        >
                                          <i className="fas fa-minus"></i>
                                        </button>
                                        <span
                                          className="quantity"
                                          style={cartUIStyle.qtyText}
                                        >
                                          {getQuantity(displayProduct.id)}
                                        </span>
                                        <button
                                          className="quantity-btn"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            increaseQuantity(displayProduct.id);
                                          }}
                                          style={cartUIStyle.qtyBtn}
                                          title="Increase Quantity"
                                        >
                                          <i className="fas fa-plus"></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
