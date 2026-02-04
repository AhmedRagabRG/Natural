"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useProduct } from "../../../context/ProductContext";
import { getFirstImageUrl } from "../../../utils/imageUtils";
import { useProductUpdates } from "../../../hooks/useProductUpdates";
import { gtmViewItemList } from "../../../utils/gtm";
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
  unit?: string;
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
  category_url?: string;
  status: number;
}

export default function CategoryPage() {
  const params = useParams();
  const { setProduct } = useProduct();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const categoryUrl = params?.category_url as string;

  // Use product updates hook for real-time updates
  const { isConnected } = useProductUpdates({
    onUpdate: (event) => {
      console.log('Product update received in category page:', event);
      // Reload products when they are updated, especially if they belong to current category
      if (event.type === 'product_updated' || event.type === 'product_created' || event.type === 'product_deleted') {
        // If the update is for current category or no specific category, reload
        if (!event.data?.category_id || event.data.category_id === currentCategory?.id) {
          loadProducts();
        }
      }
    }
  });

  // Load category data
  const loadCategoryData = async () => {
    try {
      const response = await fetch(
        `/api/category/${categoryUrl}?include_subcategories=true`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setCurrentCategory(data.data);
        document.title = `${data.data.name} - Natural Spices`;
      }
    } catch (error) {
      console.error("Error loading category data:", error);
    }
  };

  // Load products for this category
  const loadProducts = async () => {
    if (!currentCategory) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/products?category_id=${currentCategory.id}&status=active`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const productsData = Array.isArray(data.data)
          ? data.data
          : data.data.products || data.data || [];
        
        // Map products with calculated prices and discount
        const mappedProducts = productsData.map((product: Product) => ({
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

        // Sort by discount percentage (highest first), then by name
        productsWithImages.sort((a: Product, b: Product) => {
          const discountDiff = (b.discountPercentage || 0) - (a.discountPercentage || 0);
          if (discountDiff !== 0) return discountDiff;
          return a.name.localeCompare(b.name);
        });

        setProducts(productsWithImages);
        
        // Fire GTM view_item_list event for category page
        if (productsWithImages.length > 0 && currentCategory) {
          const gtmProducts = productsWithImages.map((product: Product) => ({
            id: product.product_id.toString(),
            name: product.name,
            price: product.currentPrice || product.price,
            category: currentCategory.name,
            quantity: 1
          }));
          
          gtmViewItemList(gtmProducts, `Category: ${currentCategory.name}`);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Save product data when navigating to product page
  const handleProductNavigation = (product: Product) => {
    setProduct(product.product_id.toString(), {
      product_id: product.product_id,
      name: product.name,
      price: product.currentPrice || product.special_price,
      special_price: product.originalPrice || product.price,
      category_name: currentCategory?.name || "Category Product",
      product_unit: product.product_unit,
      id: product.product_id.toString(),
      currentPrice: product.currentPrice || product.special_price,
      originalPrice: product.originalPrice || product.price,
      image: product.icon,
      weight: product.weight
    });
  };

  useEffect(() => {
    if (categoryUrl) {
      loadCategoryData();
    }
  }, [categoryUrl]);

  useEffect(() => {
    if (currentCategory) {
      loadProducts();
    }
  }, [currentCategory]);

  return (
    <>
      <div key="main-content" className="category-page">
        <main className="category-page">
          <div className="container">
            {/* Category Header */}
            <div
              className="featured-products-header"
              style={{ padding: "25px 20px", paddingTop: "30px" }}
            >
              <div className="header-content">
                <h2 className="section-title">
                  <div className="title-with-count">
                    <span key="title" className="title-text">
                      {currentCategory ? currentCategory.name : "Category Products"}
                    </span>
                    <span key="count" className="collection-count">
                      ({products.length} Items)
                    </span>
                  </div>
                </h2>
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
                {products.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "#666",
                      fontSize: "18px",
                    }}
                  >
                    <i className="fa-solid fa-box-open" style={{ fontSize: "48px", marginBottom: "20px", display: "block" }}></i>
                    No products found in this category.
                  </div>
                ) : (
                  products.map((product) => (
                    <ProductCard
                      key={product.product_id}
                      id={product.product_id.toString()}
                      name={product.name}
                      currentPrice={product.currentPrice || product.price}
                      originalPrice={product.originalPrice}
                      imageUrl={product.imageUrl}
                      product_url={product.product_url}
                      is_parent={product.is_parent}
                      dubai_only={product.dubai_only}
                      onProductClick={() => handleProductNavigation(product)}
                    />
                  ))
                )}
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