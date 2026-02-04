"use client";

import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useProduct } from "../context/ProductContext";
import { formatPrice, calculateRewardPoints } from "../utils/price";
import { getFirstImageUrl } from "../utils/imageUtils";
import { useProductUpdates } from "../hooks/useProductUpdates";
import { gtmViewItemList } from "../utils/gtm";
import { ProductCard } from "../components";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  special_price?: number;
  description?: string;
  category_id: number;
  product_id: number;
  quantity?: number;
  product_unit?: string;
  unit?: string;
  product_url?: string;
  images?: string | number;
  parent_product_id?: number | null;
  is_parent?: number;
  dubai_only?: number;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  category_url?: string;
  file_extension?: string;
}

interface Collection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  discount: string;
  itemCount: number;
  items: CollectionItem[];
  category_url?: string;
  imageUrl?: string;
}

interface CollectionItem {
  id: string;
  name: string;
  icon: string;
  currentPrice: number;
  originalPrice?: number;
  rewardPoints: number;
  weight?: number;
  product_url?: string;
  imageUrl?: string;
  is_parent?: number;
  dubai_only?: number;
}

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const { state } = useCart();
  const { setProduct } = useProduct();

  // Use product updates hook for real-time updates
  const { isConnected, lastUpdate } = useProductUpdates({
    onUpdate: (event) => {
      console.log('Product update received:', event);
      // Reload collections when products are updated
      if (event.type === 'product_updated' || event.type === 'product_created' || event.type === 'product_deleted') {
        setLastUpdateTime(Date.now());
        loadCollections();
      }
    },
    onConnect: () => {
      console.log('Connected to product updates');
    },
    onDisconnect: () => {
      console.log('Disconnected from product updates');
    }
  });



  const handleProductNavigation = (item: CollectionItem) => {
    setProduct(item.id, {
      product_id: parseInt(item.id),
      name: item.name,
      price: item.currentPrice,
      special_price: item.originalPrice,
      id: item.id,
      currentPrice: item.currentPrice,
      originalPrice: item.originalPrice,
      image: item.icon,
      weight: item.weight
    });
  };

  const loadCollections = async () => {
    setLoading(true);
    try {
      // Fetch only categories from API (without products)
      const categoriesResponse = await fetch(
        "/api/category?status=active"
      );
      const categoriesData = await categoriesResponse.json();

      // Transform categories to collections format (without loading products yet)
      const collectionsData = (categoriesData.data || []).map(
        (category: Category) => {
          // Create image URL using category ID and file extension
          const imageUrl = category.file_extension
            ? `https://dashboard.naturalspicesuae.com/uploads/category/${category.id}.${category.file_extension}`
            : null;

          return {
            id: category.id.toString(),
            title: category.name,
            subtitle: category.description || "Natural Products",
            icon: "🌿", // Keep as fallback
            discount: "",
            itemCount: 0,
            items: [],
            category_url: category.category_url,
            imageUrl: imageUrl,
          };
        }
      );

      // Fetch item counts and calculate real discount for each collection
      const collectionsWithCounts: Collection[] = await Promise.all(
        collectionsData.map(async (col: Collection) => {
          try {
            const productsResponse = await fetch(
              `/api/products?category_id=${col.id}&status=active`
            );
            const productsData = await productsResponse.json();

            const products = productsData.data && productsData.data.products
              ? productsData.data.products
              : [];

            const count = products.length;

            // Calculate average discount percentage for this category
            let totalDiscount = 0;
            let discountedProductsCount = 0;

            products.forEach((product: Product) => {
              if (product.special_price && product.special_price > 0 && product.special_price < product.price) {
                const discountPercentage = Math.round((1 - product.special_price / product.price) * 100);
                totalDiscount += discountPercentage;
                discountedProductsCount++;
              }
            });

            const averageDiscount = discountedProductsCount > 0
              ? Math.round(totalDiscount / discountedProductsCount)
              : 0;

            const discountText = averageDiscount > 0 ? `${averageDiscount}%` : "";

            return { ...col, itemCount: count, discount: discountText };
          } catch (e) {
            console.error(`Error fetching count for category ${col.id}:`, e);
            return { ...col, itemCount: 0, discount: "" };
          }
        })
      );

      setCollections(collectionsWithCounts);

      // Fire GTM view_item_list event for homepage collections
      if (collectionsWithCounts.length > 0) {
        const allProducts = collectionsWithCounts.reduce((acc: any[], collection: Collection) => {
          const collectionProducts = collection.items.slice(0, 10).map((item: CollectionItem) => ({
            id: item.id,
            name: item.name,
            price: item.currentPrice,
            category: collection.title,
            quantity: 1
          }));
          return acc.concat(collectionProducts);
        }, []);

        if (allProducts.length > 0) {
          gtmViewItemList(allProducts, 'Homepage Featured Collections');
        }
      }
    } catch (error) {
      console.error("Error loading collections from API:", error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionProducts = async (collection: Collection) => {
    try {
      // Fetch products for the selected category only
      const productsResponse = await fetch(
        `/api/products?category_id=${collection.id}&status=active`
      );
      const productsData = await productsResponse.json();

      const items =
        productsData.data && productsData.data.products
          ? await Promise.all(
            productsData.data.products.map(async (product: Product & { image_url?: string }) => {
              const hasSpecialPrice =
                product.special_price &&
                parseFloat(product.special_price.toString()) > 0;

              // Prefer server-provided image_url, fallback to helper
              const imageUrl = product.image_url || await getFirstImageUrl(product.images);

              return {
                id: product.product_id.toString(),
                name: product.name,
                icon: "🌿",
                currentPrice: hasSpecialPrice
                  ? parseFloat(product.special_price!.toString())
                  : parseFloat(product.price.toString()),
                originalPrice: hasSpecialPrice
                  ? parseFloat(product.price.toString())
                  : undefined,
                rewardPoints: Math.floor(
                  hasSpecialPrice
                    ? parseFloat(product.special_price!.toString())
                    : parseFloat(product.price.toString())
                ),
                weight: product.product_unit ? parseFloat(product.product_unit) : 0,
                product_url: product.product_url,
                imageUrl: imageUrl,
                is_parent: product.is_parent,
                dubai_only: product.dubai_only,
              };
            })
          )
          : [];

      // Update the collection with loaded products
      const updatedCollection = {
        ...collection,
        itemCount: items.length,
        items: items,
      };

      // Update collections state
      setCollections((prev) =>
        prev.map((col) => (col.id === collection.id ? updatedCollection : col))
      );

      return updatedCollection;
    } catch (error) {
      console.error(
        `Error loading products for category ${collection.id}:`,
        error
      );
      return collection;
    }
  };

  const selectCollection = async (collection: Collection) => {
    // If collection already has products loaded, just select it
    if (collection.items.length > 0) {
      setSelectedCollection(collection);
    } else {
      // Show loading state
      setSelectedCollection({ ...collection, itemCount: -1 }); // -1 indicates loading

      // Load products for this collection
      const updatedCollection = await loadCollectionProducts(collection);
      setSelectedCollection(updatedCollection);
    }

    // Scroll to featured products section
    setTimeout(() => {
      const productsSection = document.getElementById("featured-products");
      if (productsSection) {
        const headerOffset = 80;
        const elementPosition = productsSection.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  useEffect(() => {
    loadCollections();
  }, []);

  return (
    <main>
      <div className="main-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Loading indicator */}
        {loading && (
          <div className="loading-indicator">
            <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
            <p className="loading-text">Loading categories...</p>
          </div>
        )}

        {/* Collections Grid */}
        {!loading && (
          <div className="collections-grid">
            {collections.map((collection) => (
              <div
                key={collection.id}
                data-collection-id={collection.id}
                className="collection-card"
              >
                <div className="card-header">
                  {collection.imageUrl ? (
                    <Image
                      src={collection.imageUrl}
                      alt={collection.title}
                      width={300}
                      height={200}
                      className="category-image"
                      style={{
                        // width: '100%', 
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'inline';
                      }}
                    />
                  ) : null}
                  <span style={{ display: collection.imageUrl ? 'none' : 'inline' }}>{collection.icon}</span>
                  {collection.discount && (
                    <span className="discount">{collection.discount}</span>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-content">
                    <Link
                      href={`/category/${collection.category_url || collection.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <h5 className="card-title" style={{ cursor: "pointer" }}>{collection.title}</h5>
                    </Link>

                  </div>
                  <button
                    className="card-btn"
                    onClick={() => selectCollection(collection)}
                  >
                    <i className="fa-solid fa-layer-group"></i>
                    View All
                    <div className="right">
                      ({collection.itemCount} item)
                    </div>

                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured Products Section */}
        {selectedCollection && (
          <div id="featured-products" className="featured-products">
            <div className="featured-products-content">
              <div
                className="featured-products-header"
                style={{ padding: "25px 4px", paddingTop: "30px" }}
              >
                <div className="header-content">
                  <h2>
                    <div className="title-row">
                      <span>{selectedCollection.title}</span>
                    </div>
                  </h2>
                  <div>
                    <button
                      className="btn btn-secondary btn-rounded close-collection-btn"
                      onClick={() => {
                        const collectionCard = document.querySelector(
                          `[data-collection-id='${selectedCollection.id}']`
                        );
                        const cardPosition = collectionCard
                          ? collectionCard.getBoundingClientRect().top +
                          window.pageYOffset
                          : 0;

                        setSelectedCollection(null);

                        setTimeout(() => {
                          if (collectionCard) {
                            const headerOffset = 80;
                            window.scrollTo({
                              top: cardPosition - headerOffset,
                              behavior: "smooth",
                            });
                          }
                        }, 100);
                      }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {selectedCollection.itemCount === -1 ? (
                <div
                  className="loading-indicator"
                  style={{ padding: "40px", textAlign: "center" }}
                >
                  <i className="fa-solid fa-spinner fa-spin loading-spinner"></i>
                  <p className="loading-text">Loading products...</p>
                </div>
              ) : (
                <div className="products-grid">
                  {selectedCollection.items.map((item) => (
                    <ProductCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      currentPrice={item.currentPrice}
                      originalPrice={item.originalPrice}
                      imageUrl={item.imageUrl}
                      product_url={item.product_url}
                      is_parent={item.is_parent}
                      dubai_only={item.dubai_only}
                      onProductClick={() => handleProductNavigation(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Validations */}
        <div className="product-validations">
          <div className="validation-item">
            <div className="icon-wrapper">
              <i className="fa-solid fa-star"></i>
            </div>
            <div className="validation-content">
              <div className="rating">4.8/5</div>
              <div className="label">Customer Ratings</div>
            </div>
          </div>

          <div className="validation-item">
            <div className="icon-wrapper">
              <i className="fa-solid fa-face-smile"></i>
            </div>
            <div className="validation-content">
              <div className="rating">1000+</div>
              <div className="label">Happy Customers</div>
            </div>
          </div>

          <div className="validation-item">
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

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/+971527176007"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        title="Contact us on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>
    </main>
  );
}
