"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useProduct } from "../../../context/ProductContext";
import { getFirstImageUrl } from "../../../utils/imageUtils";
import { useProductUpdates } from "../../../hooks/useProductUpdates";
import { ProductCard } from "../../../components";

interface Product {
  product_id: number;
  name: string;
  price: number;
  special_price: number;
  icon: string;
  category_id: number;
  event_id: string | null;
  status: number;
  stock: number;
  currentPrice?: number;
  originalPrice?: number;
  discountPercentage?: number;
  product_unit?: string;
  weight?: number;
  product_url?: string;
  images?: string | number;
  imageUrl?: string;
  parent_product_id?: number | null;
  is_parent?: number;
  dubai_only?: number;
}

interface Category {
  id: number;
  name: string;
  status: number;
}

interface Event {
  id: number;
  name: string;
  event_url: string;
  status: number;
  created_at: string;
}

export default function OfferPage() {
  const params = useParams();
  const { setProduct } = useProduct();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  const eventUrl = params?.event_url as string;

  // Use product updates hook for real-time updates
  const { isConnected } = useProductUpdates({
    onUpdate: (event) => {
      console.log('Product update received in offer page:', event);
      // Reload products when they are updated
      if (event.type === 'product_updated' || event.type === 'product_created' || event.type === 'product_deleted') {
        loadProducts();
      }
    }
  });



  // Load event data
  const loadEventData = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();

      if (data.success && data.data) {
        // Handle different API response structures
        const events = Array.isArray(data.data)
          ? data.data
          : data.data.events || [];
        const event = events.find((e: Event) => e.event_url === eventUrl);
        if (event) {
          setCurrentEvent(event);
          // Update page title dynamically
          document.title = `${event.name} - Natural Spices`;
        }
      }
    } catch (error) {
      console.error("Error loading event data:", error);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch(
        "/api/category?status=active"
      );
      const data = await response.json();

      if (data.success && data.data) {
        // Handle different API response structures
        const categoriesData = Array.isArray(data.data)
          ? data.data
          : data.data || [];
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]); // Set empty array on error
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/products?status=active"
      );
      const data = await response.json();

      if (data.success && data.data) {
        // Handle different API response structures
        const productsData = Array.isArray(data.data)
          ? data.data
          : data.data.products || data.data || [];
        let filteredProducts = [];

        if (currentEvent && currentEvent.id) {
          // Filter products by event_id matching current event id
          filteredProducts = productsData.filter(
            (product: Product) =>
              product.event_id === currentEvent.id.toString() ||
              product.event_id === eventUrl
          );
        } else {
          // If no event, show products with special_price
          filteredProducts = productsData.filter(
            (product: Product) =>
              product.special_price && product.special_price > 0
          );
        }

        // Map products with calculated prices and discount
        const mappedProducts = filteredProducts.map((product: Product) => ({
          ...product,
          currentPrice: product.special_price || product.price,
          originalPrice: product.price,
          discountPercentage: product.special_price
            ? Math.round((1 - product.special_price / product.price) * 100)
            : 0,
          weight: product.product_unit ? parseFloat(product.product_unit) : 0,
        }));

        // Load images for all products
        const productsWithImages = await Promise.all(
          mappedProducts.map(async (product: Product) => {
            const imageUrl = await getFirstImageUrl(product.images);
            return {
              ...product,
              imageUrl
            };
          })
        );

        // Sort by discount percentage (highest first)
        productsWithImages.sort(
          (a: Product, b: Product) =>
            (b.discountPercentage || 0) - (a.discountPercentage || 0)
        );

        setAllProducts(productsWithImages);
        setProducts(productsWithImages);
        setFilteredProducts(productsWithImages);
        
        // Update available categories based on products
        updateAvailableCategories(mappedProducts);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update available categories based on current products
  const updateAvailableCategories = (currentProducts: Product[]) => {
    const productCategoryIds = new Set(
      currentProducts.map(product => product.category_id)
    );
    
    const filteredCategories = categories.filter(category => 
      productCategoryIds.has(category.id)
    );
    
    setAvailableCategories(filteredCategories);
  };

  // Filter products by category (client-side filtering)
  const filterProducts = (categoryId: string) => {
    if (categoryId === "all") {
      setProducts(allProducts);
    } else {
      const filtered = allProducts.filter(
        (product) => product.category_id.toString() === categoryId
      );
      setProducts(filtered);
    }
  };

  // Handle category change with immediate filtering
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    filterProducts(categoryId);
    // Scroll to top of page when category changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save product data when navigating to product page
  const handleProductNavigation = (product: Product) => {
    setProduct(product.product_id.toString(), {
      product_id: product.product_id,
      name: product.name,
      price: product.currentPrice || product.special_price,
      special_price: product.originalPrice || product.price,
      category_name: "Offer Product",
      product_unit: product.product_unit,
      id: product.product_id.toString(),
      currentPrice: product.currentPrice || product.special_price,
      originalPrice: product.originalPrice || product.price,
      image: product.icon,
      weight: product.weight
    });
  };

  useEffect(() => {
    loadEventData();
    loadCategories();
  }, [eventUrl]);

  useEffect(() => {
    if (currentEvent !== null) {
      loadProducts();
    }
  }, [currentEvent]);

  useEffect(() => {
    // Apply initial filter when products are loaded
    if (allProducts.length > 0) {
      filterProducts(selectedCategory);
    }
  }, [allProducts]);

  useEffect(() => {
    // Update available categories when categories or products change
    if (categories.length > 0 && allProducts.length > 0) {
      updateAvailableCategories(allProducts);
    }
  }, [categories, allProducts]);

  return (
    <>
      <div key="main-content" className="offers-page">
        <main className="offers-page">
          <div className="container">
            {/* Event Banner */}
            {currentEvent && (
              <div style={{
                width: '100%',
                maxHeight: '350px',
                overflow: 'hidden',
                borderRadius: '12px',
                marginTop: '16px',
                marginBottom: '8px',
              }}>
                <Image
                  src={`https://dashboard.naturalspicesuae.com/uploads/events/${currentEvent.id}.jpg`}
                  alt={currentEvent.name}
                  width={1200}
                  height={350}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
                  priority
                  onError={(e) => {
                    // Hide banner if image doesn't exist
                    (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Featured Products Header */}
            <div
              className="featured-products-header"
              style={{ padding: "25px 20px", paddingTop: "30px" }}
            >
              <div className="header-content">
                <h2 className="section-title">
                  <div className="title-with-count">
                    <span key="title" className="title-text">
                      {currentEvent ? currentEvent.name : "Special Offers"}
                    </span>
                    <span key="count" className="collection-count">
                      ({products.length} Items)
                    </span>
                  </div>
                </h2>
              </div>
            </div>

            {/* Filter Dropdown */}
            <div
              className="filter-section"
              style={{ 
                margin: "20px 0", 
                padding: "10px",
                position: "sticky",
                top: "94px",
                backgroundColor: "white",
                zIndex: 10,
                borderBottom: "1px solid #eee"
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <label
                  htmlFor="categoryFilter"
                  className="filter-label"
                  style={{ fontWeight: 600, color: "#2c3e50" }}
                >
                  Filter by Category:
                </label>
                <style jsx>{`
                  @media (max-width: 768px) {
                    .filter-label {
                      display: none !important;
                    }
                  }
                `}</style>
                <select
                  id="categoryFilter"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    background: "white",
                    fontSize: "14px",
                    minWidth: "200px",
                  }}
                  value={selectedCategory}
                  onChange={(e) => {
                    handleCategoryChange(e.target.value);
                  }}
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading Spinner */}
            {loading && (
              <div
                className="loading-container"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "300px",
                  flexDirection: "column",
                }}
              >
                <div
                  className="spinner"
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #27ae60",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                <p
                  style={{ marginTop: "15px", color: "#666", fontSize: "16px" }}
                >
                  Loading...
                </p>
              </div>
            )}

            {/* Products Grid */}
            {!loading && (
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    id={product.product_id.toString()}
                    name={product.name}
                    currentPrice={product.currentPrice || product.special_price}
                    originalPrice={product.originalPrice || product.price}
                    imageUrl={product.imageUrl}
                    product_url={product.product_url}
                    is_parent={product.is_parent}
                    dubai_only={product.dubai_only}
                    onProductClick={() => handleProductNavigation(product)}
                  />
                ))}
              </div>
            )}

            {/* Product Validations */}
            <div style={{ margin: "60px auto" }}>
              <div className="product-validations">
                <div key="rating" className="validation-item">
                  <div className="icon-wrapper">
                    <i className="fa-solid fa-star"></i>
                  </div>
                  <div className="validation-content">
                    <div className="rating">4.8/5</div>
                    <div className="label">Customer Ratings</div>
                  </div>
                </div>

                <div key="customers" className="validation-item">
                  <div className="icon-wrapper">
                    <i className="fa-solid fa-face-smile"></i>
                  </div>
                  <div className="validation-content">
                    <div className="rating">1000+</div>
                    <div className="label">Happy Customers</div>
                  </div>
                </div>

                <div key="guarantee" className="validation-item">
                  <div className="icon-wrapper">
                    <i className="fa-solid fa-thumbs-up"></i>
                  </div>
                  <div className="validation-content">
                    <div className="rating">100%</div>
                    <div className="label">Quality Guarantee</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
