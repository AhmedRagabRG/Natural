import { MetadataRoute } from 'next';
import pool from '../lib/db';
import { RowDataPacket } from 'mysql2';

const BASE_URL = 'https://naturalspicesuae.com';

export const revalidate = 86400; // Regenerate sitemap every 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-conditions`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic: Categories
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const [categories] = await pool.execute(
      'SELECT category_url, updated_at FROM af_category WHERE status = 1'
    ) as [RowDataPacket[], unknown];
    categoryPages = categories
      .filter((c) => c.category_url)
      .map((c) => ({
        url: `${BASE_URL}/category/${c.category_url}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch (e) {
    console.error('Sitemap: failed to fetch categories', e);
  }

  // Dynamic: Products (only non-parent, active products with a product_url)
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const [products] = await pool.execute(
      'SELECT product_url, updated_at FROM af_products WHERE status = 1 AND (is_parent = 0 OR is_parent IS NULL) AND product_url IS NOT NULL AND product_url != \'\''
    ) as [RowDataPacket[], unknown];
    productPages = products.map((p) => ({
      url: `${BASE_URL}/product/${p.product_url}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error('Sitemap: failed to fetch products', e);
  }

  // Dynamic: Events/Offers
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const [events] = await pool.execute(
      'SELECT event_url, created_at FROM af_events WHERE status = 1'
    ) as [RowDataPacket[], unknown];
    eventPages = events
      .filter((ev) => ev.event_url)
      .map((ev) => ({
        url: `${BASE_URL}/offer/${ev.event_url}`,
        lastModified: ev.created_at ? new Date(ev.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch (e) {
    console.error('Sitemap: failed to fetch events', e);
  }

  // Dynamic: Blog articles
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const [blogs] = await pool.execute(
      'SELECT id, updated_at FROM af_blogs WHERE status = 1'
    ) as [RowDataPacket[], unknown];
    blogPages = blogs.map((b) => ({
      url: `${BASE_URL}/article/${b.id}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch (e) {
    console.error('Sitemap: failed to fetch blogs', e);
  }

  return [...staticPages, ...categoryPages, ...productPages, ...eventPages, ...blogPages];
}
