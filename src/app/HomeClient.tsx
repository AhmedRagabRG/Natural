"use client";

import { useState, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { useProduct } from "../context/ProductContext";
import { getFirstImageUrl } from "../utils/imageUtils";
import { useProductUpdates } from "../hooks/useProductUpdates";
import { gtmViewItemList } from "../utils/gtm";
import { ProductCard } from "../components";
import Link from "next/link";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ServerCollection {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  itemCount: number;
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

interface Product {
  id: string;
  name: string;
  price: number;
  special_price?: number;
  category_id: number;
  product_id: number;
  product_unit?: string;
  unit?: string;
  product_url?: string;
  images?: string | number;
  parent_product_id?: number | null;
  is_parent?: number;
  dubai_only?: number;
  image_url?: string;
}

interface SelectedCollection extends ServerCollection {
  items: CollectionItem[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HomeClient({
  initialCollections,
}: {
  initialCollections: ServerCollection[];
}) {
  const [collections, setCollections] = useState<ServerCollection[]>(initialCollections);
  const [selectedCollection, setSelectedCollection] = useState<SelectedCollection | null>(null);
  const { state } = useCart();
  const { setProduct } = useProduct();

  // Real-time product updates – refresh counts via lightweight API
  useProductUpdates({
    onUpdate: (event) => {
      if (
        event.type === "product_updated" ||
        event.type === "product_created" ||
        event.type === "product_deleted"
      ) {
        refreshCounts();
      }
    },
    onConnect: () => {},
    onDisconnect: () => {},
  });

  /** Re-fetch only counts/discounts (single API call) */
  const refreshCounts = async () => {
    try {
      const res = await fetch("/api/category/with-product-count");
      const data = await res.json();
      if (data.success && data.data) {
        const updated: ServerCollection[] = (data.data as any[]).map((c: any) => ({
          id: c.id.toString(),
          title: c.name,
          subtitle: "Natural Products",
          discount: c.avg_discount ? `${Math.round(c.avg_discount)}%` : "",
          itemCount: Number(c.product_count) || 0,
          category_url: c.category_url,
          imageUrl: c.file_extension
            ? `https://dashboard.naturalspicesuae.com/uploads/category/${c.id}.${c.file_extension}`
            : undefined,
        }));
        setCollections(updated);
      }
    } catch {
      /* keep current data */
    }
  };

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
      weight: item.weight,
    });
  };

  /** Load products for a category when user clicks "View All" */
  const selectCollection = useCallback(
    async (col: ServerCollection) => {
      // Show loading placeholder
      setSelectedCollection({ ...col, items: [] });

      try {
        const res = await fetch(
          `/api/products?category_id=${col.id}&status=active`
        );
        const data = await res.json();

        const products: Product[] =
          data.data?.products ?? [];

        const items: CollectionItem[] = await Promise.all(
          products.map(async (p) => {
            const hasSpecial =
              p.special_price &&
              parseFloat(p.special_price.toString()) > 0 &&
              parseFloat(p.special_price.toString()) < p.price;

            const imgUrl =
              p.image_url || (await getFirstImageUrl(p.images));

            return {
              id: p.product_id.toString(),
              name: p.name,
              icon: "🌿",
              currentPrice: hasSpecial
                ? parseFloat(p.special_price!.toString())
                : parseFloat(p.price.toString()),
              originalPrice: hasSpecial
                ? parseFloat(p.price.toString())
                : undefined,
              rewardPoints: Math.floor(
                hasSpecial
                  ? parseFloat(p.special_price!.toString())
                  : parseFloat(p.price.toString())
              ),
              weight: p.product_unit
                ? parseFloat(p.product_unit)
                : 0,
              product_url: p.product_url,
              imageUrl: imgUrl,
              is_parent: p.is_parent,
              dubai_only: p.dubai_only,
            };
          })
        );

        const loaded: SelectedCollection = {
          ...col,
          itemCount: items.length,
          items,
        };
        setSelectedCollection(loaded);

        // Fire GTM event
        if (items.length) {
          gtmViewItemList(
            items.slice(0, 10).map((i) => ({
              id: i.id,
              name: i.name,
              price: i.currentPrice,
              category: col.title,
              quantity: 1,
            })),
            `Homepage – ${col.title}`
          );
        }
      } catch {
        setSelectedCollection(null);
      }

      // Scroll to featured section
      requestAnimationFrame(() => {
        const el = document.getElementById("featured-products");
        if (el) {
          const top =
            el.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      });
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* Collections Grid – always visible (server-rendered HTML) */}
      <div className="collections-grid">
        {collections.map((collection, index) => (
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
                  {...(index < 4 ? { priority: true } : {})}
                  style={{
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback =
                      target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "inline";
                  }}
                />
              ) : null}
              <span
                style={{
                  display: collection.imageUrl ? "none" : "inline",
                }}
              >
                🌿
              </span>
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
                  <h2 className="card-title" style={{ cursor: "pointer" }}>
                    {collection.title}
                  </h2>
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

      {/* Featured Products Section – client only */}
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
                      const card = document.querySelector(
                        `[data-collection-id='${selectedCollection.id}']`
                      );
                      const pos = card
                        ? card.getBoundingClientRect().top +
                          window.pageYOffset
                        : 0;

                      setSelectedCollection(null);

                      requestAnimationFrame(() => {
                        if (card) {
                          window.scrollTo({
                            top: pos - 80,
                            behavior: "smooth",
                          });
                        }
                      });
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                    Close
                  </button>
                </div>
              </div>
            </div>

            {selectedCollection.items.length === 0 ? (
              <div
                className="loading-indicator"
                style={{
                  padding: "40px",
                  textAlign: "center",
                  minHeight: "200px",
                }}
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
                    onProductClick={() =>
                      handleProductNavigation(item)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
