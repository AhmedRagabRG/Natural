import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { cache, CACHE_KEYS } from '@/utils/cache';

interface Product {
  product_id: number;
  product_code: string;
  category_id: number;
  sub_category_id?: number;
  name: string;
  name_ar?: string;
  product_url?: string;
  brand_name?: string;
  product_unit: string;
  price: number;
  special_price?: number;
  quantity: number;
  images?: string;
  checkout_page?: string;
  status: number;
  created_at: number;
  updated_at: number;
  discount_percentage?: number;
  image_url?: string;
  weight?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    // Create cache key
    const cacheKey = `${CACHE_KEYS.PRODUCTS_FEATURED}:checkout-page:${lang}`;
    
    // Check cache first
    const cachedProducts = cache.get(cacheKey);
    if (cachedProducts) {
      return NextResponse.json(cachedProducts);
    }

    // Query to fetch products where checkout_page is true (1, '1', 'true', or true)
    const query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM af_products p
      LEFT JOIN af_category c ON p.category_id = c.id
      WHERE p.status = 1 
        AND (
          p.checkout_page = 1 
          OR p.checkout_page = '1' 
          OR p.checkout_page = 'true'
          OR p.checkout_page = TRUE
        )
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

    const [rows] = await pool.execute(query) as [RowDataPacket[], unknown];
    const products = rows as Product[];

    // Calculate discount percentage
    const productsWithDiscount = products.map(product => {
      const productData = { ...product };
      if (productData.special_price && productData.price > productData.special_price) {
        productData.discount_percentage = Math.round(
          ((productData.price - productData.special_price) / productData.price) * 100
        );
      }
      return productData;
    });

    // Attach image URLs
    const getFirstImageId = (images?: unknown): number | null => {
      if (!images) return null;
      if (typeof images === 'number') return images;
      if (Array.isArray(images)) {
        const first = images[0];
        const idNum = typeof first === 'number' ? first : parseInt(String(first), 10);
        return isNaN(idNum) ? null : idNum;
      }
      if (typeof images === 'string') {
        const firstToken = images.split(',')[0]?.trim();
        const idNum = parseInt(firstToken || '', 10);
        return isNaN(idNum) ? null : idNum;
      }
      return null;
    };

    const uniqueIds = Array.from(new Set(
      productsWithDiscount
        .map(p => getFirstImageId(p.images))
        .filter((v): v is number => v !== null)
    ));

    let idToUrl = new Map<number, string>();
    if (uniqueIds.length > 0) {
      const placeholders = uniqueIds.map(() => '?').join(',');
      const filesQuery = `SELECT id, file_path, file_name FROM af_files WHERE id IN (${placeholders})`;
      const [fileRows] = await pool.execute(filesQuery, uniqueIds) as [RowDataPacket[], unknown];
      for (const row of fileRows) {
        const url = `${row.file_path}${row.file_name}`;
        idToUrl.set(row.id as number, url);
      }
    }

    const withUrl = productsWithDiscount.map(p => {
      const fid = getFirstImageId(p.images);
      const image_url = fid ? idToUrl.get(fid) : undefined;
      return { ...p, image_url };
    });

    const result = {
      success: true,
      data: withUrl
    };

    // Cache for 10 minutes
    cache.set(cacheKey, result, 10 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching checkout page products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
