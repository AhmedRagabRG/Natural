import mysql, { RowDataPacket } from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'app',
  port: Number(process.env.MYSQL_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0
});
// Database connection retry utility
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a connection-related error that we should retry
      const shouldRetry = 
        error instanceof Error && (
          error.message.includes('ECONNRESET') ||
          error.message.includes('Queue limit reached') ||
          error.message.includes('Connection lost') ||
          error.message.includes('PROTOCOL_CONNECTION_LOST') ||
          error.message.includes('ETIMEDOUT')
        );
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Exponential backoff delay
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError!;
}

// Enhanced connection getter with retry logic
export async function getConnectionWithRetry() {
  return executeWithRetry(async () => {
    const connection = await pool.getConnection();
    
    // Test the connection
    await connection.ping();
    
    return connection;
  });
}

export default pool;

export interface Blog {
  id: number;
  blog_title: string;
  blog_url: string;
  description: string;
  images?: string;
  status: number;
  created_at: number;
  updated_at: number;
  estimated_reading_time?: number;
  title?: string;
  content?: string;
  image?: string;
}

export interface Category {
  id: number;
  name: string;
  category_url?: string;
  cat_priority?: number;
  meta_title?: string;
  meta_keywords?: string;
  meta_description?: string;
  file_extension?: string;
  status: number;
  created_at: number;
  subcategories?: SubCategory[];
  product_count?: number;
}

export interface SubCategory {
  id: number;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category_name: string;
  category_url?: string;
  cat_priority?: number;
  image?: string;
  status: number;
  sort_order?: number;
  created_at?: number;
  updated_at?: number;
}

export interface Event {
  id: number;
  name: string;
  event_url: string;
  status: number;
  created_at: number;
}

export interface FileData {
  id: number;
  file_path: string;
  file_name: string;
  file_type: string;
}

export interface Coupon {
  coupon_id: number;
  name: string;
  description: string;
  discount: number;
  coupon_code: string;
  numberoftime?: string;
  numberoftimeused?: string;
  expire_date?: string;
  status: number;
  created_at: string;
}

export interface Product {
  product_id: number;
  product_code: string;
  category_id: number;
  sub_category_id?: number;
  event_id?: string;
  event_det?: number;
  name: string;
  name_ar?: string;
  product_url?: string;
  brand_name?: string;
  product_unit: string;
  price: number;
  special_price?: number;
  meta_title?: string;
  meta_keywords?: string;
  meta_description?: string;
  product_description?: string;
  quantity: number;
  min_quantity?: string;
  max_quantity?: string;
  images?: string;
  checkout_page?: string;
  status: number;
  created_at: number;
  updated_at: number;
  discount_percentage?: number;
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
}

export class BlogService {
  static async getAllBlogs(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    status?: string;
    category_id?: number;
    search?: string;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'DESC',
        status = 'published',
        category_id,
        search
      } = params;

      const offset = (page - 1) * limit;
      const statusMap: { [key: string]: number } = { 'published': 1, 'draft': 0, 'archived': 2 };
      const statusValue = statusMap[status] || 1;

      let whereClause = 'WHERE status = ?';
      const queryParams: (string | number)[] = [statusValue];

      if (category_id) {
        whereClause += ' AND category_id = ?';
        queryParams.push(category_id);
      }

      if (search) {
        whereClause += ' AND (blog_title LIKE ? OR description LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const countQuery = `SELECT COUNT(*) as total FROM af_blogs ${whereClause}`;
      const [countResult] = await connection.execute(countQuery, queryParams);
      const total = (countResult as { total: number }[])[0].total;

      // Validate sort column to prevent SQL injection
      const allowedSortColumns = ['id', 'blog_title', 'created_at', 'updated_at', 'status'];
      const validSort = allowedSortColumns.includes(sort) ? sort : 'created_at';
      const validOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
      
      const dataQuery = `SELECT * FROM af_blogs ${whereClause} ORDER BY ${validSort} ${validOrder} LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await connection.execute(dataQuery, queryParams);
      const blogs = rows as Blog[];

      // Add reading time estimation
      const blogsWithReadingTime = blogs.map(blog => {
        const textContent = blog.description || '';
        const wordsPerMinute = 200;
        const wordCount = textContent.split(' ').length;
        const estimated_reading_time = Math.ceil(wordCount / wordsPerMinute) || 1;
        
        return {
          ...blog,
          estimated_reading_time,
          title: blog.blog_title,
          content: blog.description,
          image: blog.images
        };
      });

      return {
        blogs: blogsWithReadingTime,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      };
    } finally {
      connection.release();
    }
  }

  static async getBlogById(id: number) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_blogs WHERE id = ? AND status = 1';
      const [rows] = await connection.execute(query, [id]);
      const blogs = rows as Blog[];
      
      if (blogs.length === 0) {
        return null;
      }

      const blog = blogs[0];
      const textContent = blog.description || '';
      const wordsPerMinute = 200;
      const wordCount = textContent.replace(/<[^>]*>/g, '').split(' ').length;
      const estimated_reading_time = Math.ceil(wordCount / wordsPerMinute) || 1;

      return {
        ...blog,
        estimated_reading_time
      };
    } finally {
      connection.release();
    }
  }

  static async getBlogBySlug(slug: string) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_blogs WHERE blog_url = ? AND status = 1';
      const [rows] = await connection.execute(query, [slug]);
      const blogs = rows as Blog[];
      
      if (blogs.length === 0) {
        return null;
      }

      const blog = blogs[0];
      const textContent = blog.description || '';
      const wordsPerMinute = 200;
      const wordCount = textContent.replace(/<[^>]*>/g, '').split(' ').length;
      const estimated_reading_time = Math.ceil(wordCount / wordsPerMinute) || 1;

      return {
        ...blog,
        estimated_reading_time
      };
    } finally {
      connection.release();
    }
  }

  static async getFeaturedBlogs(limit: number = 5) {
    const connection = await pool.getConnection();
    
    try {
      const query = `SELECT * FROM af_blogs WHERE status = 1 ORDER BY created_at DESC LIMIT ${Number(limit)}`;
      const [rows] = await connection.execute(query);
      const blogs = rows as Blog[];

      const blogsWithReadingTime = blogs.map(blog => {
        const textContent = blog.description || '';
        const wordsPerMinute = 200;
        const wordCount = textContent.split(' ').length;
        const estimated_reading_time = Math.ceil(wordCount / wordsPerMinute) || 1;
        
        return {
          ...blog,
          estimated_reading_time,
          title: blog.blog_title,
          content: blog.description,
          image: blog.images
        };
      });

      return blogsWithReadingTime;
    } finally {
      connection.release();
    }
  }

  static async getRecentBlogs(limit: number = 10) {
    const connection = await pool.getConnection();
    
    try {
      const query = `SELECT id, blog_title, blog_url, description, images, status, created_at, updated_at FROM af_blogs WHERE status = 1 ORDER BY created_at DESC LIMIT ${Number(limit)}`;
      const [rows] = await connection.execute(query);
      const blogs = rows as Blog[];

      const blogsWithReadingTime = blogs.map(blog => {
        const textContent = blog.description || '';
        const wordsPerMinute = 200;
        const wordCount = textContent.split(' ').length;
        const estimated_reading_time = Math.ceil(wordCount / wordsPerMinute) || 1;
        
        return {
          ...blog,
          estimated_reading_time
        };
      });

      return blogsWithReadingTime;
    } finally {
      connection.release();
    }
  }

  static async getRelatedBlogs(id: number, limit: number = 5) {
    const connection = await pool.getConnection();
    
    try {
      // Get current blog to find related ones
      const currentBlogQuery = 'SELECT * FROM af_blogs WHERE id = ? AND status = 1';
      const [currentRows] = await connection.execute(currentBlogQuery, [id]);
      const currentBlogs = currentRows as Blog[];
      
      if (currentBlogs.length === 0) {
        return null;
      }

      // For now, just get recent blogs excluding current one
      const query = `SELECT id, blog_title, blog_url, description, images, status, created_at, updated_at FROM af_blogs WHERE status = 1 AND id != ? ORDER BY created_at DESC LIMIT ${Number(limit)}`;
      const [rows] = await connection.execute(query, [id]);
      const blogs = rows as Blog[];

      const blogsWithReadingTime = blogs.map(blog => {
        const textContent = blog.description || '';
        const wordsPerMinute = 200;
        const wordCount = textContent.split(' ').length;
        const estimated_reading_time = Math.ceil(wordCount / wordsPerMinute) || 1;
        
        return {
          ...blog,
          estimated_reading_time
        };
      });

      return blogsWithReadingTime;
    } finally {
      connection.release();
    }
  }
}

export class CouponService {
  static async getAllCoupons(params: {
    page?: number;
    limit?: number;
    status?: number;
    search?: string;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search
      } = params;

      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const queryParams: (string | number)[] = [];

      // Filter by status
      if (status !== undefined) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }

      // Search by name or coupon code
      if (search) {
        whereClause += ' AND (name LIKE ? OR coupon_code LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const countQuery = `SELECT COUNT(*) as total FROM af_coupon ${whereClause}`;
      const [countResult] = await connection.execute(countQuery, queryParams);
      const total = (countResult as { total: number }[])[0].total;

      const dataQuery = `SELECT * FROM af_coupon ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await connection.execute(dataQuery, queryParams);
      const coupons = rows as Coupon[];

      return {
        coupons,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      };
    } finally {
      connection.release();
    }
  }

  static async getCouponById(id: number) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_coupon WHERE coupon_id = ?';
      const [rows] = await connection.execute(query, [id]);
      const coupons = rows as Coupon[];
      
      if (coupons.length === 0) {
        return null;
      }

      return coupons[0];
    } finally {
      connection.release();
    }
  }

  static async validateCoupon(code: string) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_coupon WHERE coupon_code = ? AND status = 1';
      const [rows] = await connection.execute(query, [code]);
      const coupons = rows as Coupon[];
      
      if (coupons.length === 0) {
        return { valid: false, message: 'Invalid coupon code' };
      }

      const coupon = coupons[0];

      // Check if coupon is expired
      if (coupon.expire_date && new Date(coupon.expire_date) < new Date()) {
        return { valid: false, message: 'Coupon has expired' };
      }

      // Check usage limit
      const timesUsed = parseInt(coupon.numberoftimeused || '0');
      const maxTimes = parseInt(coupon.numberoftime || '0');

      if (maxTimes > 0 && timesUsed >= maxTimes) {
        return { valid: false, message: 'Coupon usage limit exceeded' };
      }

      return {
        valid: true,
        coupon: {
          coupon_id: coupon.coupon_id,
          name: coupon.name,
          discount: coupon.discount,
          coupon_code: coupon.coupon_code,
          remaining_uses: maxTimes > 0 ? maxTimes - timesUsed : 'unlimited'
        }
      };
    } finally {
      connection.release();
    }
  }

  static async createCoupon(data: {
    name: string;
    description: string;
    discount: number;
    coupon_code: string;
    numberoftime?: string;
    expire_date?: string;
    status?: number;
  }) {
    const connection = await pool.getConnection();
    
    try {
      // Check if coupon code already exists
      const existingQuery = 'SELECT coupon_id FROM af_coupon WHERE coupon_code = ?';
      const [existingRows] = await connection.execute(existingQuery, [data.coupon_code]);
      
      if ((existingRows as unknown[]).length > 0) {
        throw new Error('Coupon code already exists');
      }

      const insertQuery = `
        INSERT INTO af_coupon (name, description, discount, coupon_code, numberoftime, numberoftimeused, expire_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, '0', ?, ?, NOW())
      `;
      
      const [result] = await connection.execute(insertQuery, [
        data.name,
        data.description,
        data.discount,
        data.coupon_code,
        data.numberoftime || null,
        data.expire_date || null,
        data.status || 1
      ]);

      const insertId = (result as { insertId: number }).insertId;
      return await this.getCouponById(insertId);
    } finally {
      connection.release();
    }
  }

  static async updateCoupon(id: number, data: Partial<Coupon>) {
    const connection = await pool.getConnection();
    
    try {
      // Check if coupon exists
      const coupon = await this.getCouponById(id);
      if (!coupon) {
        return null;
      }

      // Check if coupon code is being updated and already exists
      if (data.coupon_code && data.coupon_code !== coupon.coupon_code) {
        const existingQuery = 'SELECT coupon_id FROM af_coupon WHERE coupon_code = ? AND coupon_id != ?';
        const [existingRows] = await connection.execute(existingQuery, [data.coupon_code, id]);
        
        if ((existingRows as unknown[]).length > 0) {
          throw new Error('Coupon code already exists');
        }
      }

      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(data)) {
        if (key !== 'coupon_id' && key !== 'created_at' && value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length === 0) {
        return coupon;
      }

      updateValues.push(id);
      const updateQuery = `UPDATE af_coupon SET ${updateFields.join(', ')} WHERE coupon_id = ?`;
      
      await connection.execute(updateQuery, updateValues);
      return await this.getCouponById(id);
    } finally {
      connection.release();
    }
  }

  static async deleteCoupon(id: number) {
    const connection = await pool.getConnection();
    
    try {
      const coupon = await this.getCouponById(id);
      if (!coupon) {
        return false;
      }

      const deleteQuery = 'DELETE FROM af_coupon WHERE coupon_id = ?';
      await connection.execute(deleteQuery, [id]);
      return true;
    } finally {
      connection.release();
    }
  }

  static async useCoupon(code: string) {
    const connection = await pool.getConnection();
    
    try {
      const validation = await this.validateCoupon(code);
      if (!validation.valid) {
        return validation;
      }

      const query = 'SELECT * FROM af_coupon WHERE coupon_code = ? AND status = 1';
      const [rows] = await connection.execute(query, [code]);
      const coupon = (rows as Coupon[])[0];

      const timesUsed = parseInt(coupon.numberoftimeused || '0');
      const newUsageCount = timesUsed + 1;

      const updateQuery = 'UPDATE af_coupon SET numberoftimeused = ? WHERE coupon_code = ?';
      await connection.execute(updateQuery, [newUsageCount.toString(), code]);

      const maxTimes = parseInt(coupon.numberoftime || '0');
      return {
        valid: true,
        coupon: {
          coupon_id: coupon.coupon_id,
          discount: coupon.discount,
          remaining_uses: maxTimes > 0 ? maxTimes - newUsageCount : 'unlimited'
        }
      };
    } finally {
      connection.release();
    }
  }
}

export class ProductService {
  static async getAllProducts(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    category_id?: number;
    subcategory_id?: number;
    featured?: boolean;
    status?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    lang?: string;
    include_children?: boolean;
  }) {
    return executeWithRetry(async () => {
      const {
        page,
        limit,
        sort = 'product_id',
        order = 'ASC',
        category_id,
        subcategory_id,
        featured,
        status = 'active',
        search,
        min_price,
        max_price,
        lang = 'en',
        include_children = false
      } = params;

      // Only apply pagination if both page and limit are provided
      const shouldPaginate = page !== undefined && limit !== undefined;
      const offset = shouldPaginate ? (page - 1) * limit : 0;
      const whereConditions: string[] = [];
      const queryParams: unknown[] = [];

      // Status filter
      if (status) {
        let statusValue;
        if (status === 'active') {
          statusValue = 1;
        } else if (status === 'inactive') {
          statusValue = 0;
        } else {
          // If status is already a number, use it directly
          statusValue = parseInt(status);
        }
        
        if (!isNaN(statusValue)) {
          whereConditions.push('p.status = ?');
          queryParams.push(statusValue);
        }
      }

      // Exclude child products - only show parent products or standalone products
      if (!include_children) {
        whereConditions.push('(p.parent_product_id IS NULL OR p.parent_product_id = 0)');
      }

      // Category filter
      if (category_id) {
        whereConditions.push('p.category_id = ?');
        queryParams.push(category_id);
      }

      // Subcategory filter
      if (subcategory_id) {
        whereConditions.push('p.sub_category_id = ?');
        queryParams.push(subcategory_id);
      }

      // Price range filter
      if (min_price) {
        whereConditions.push('p.price >= ?');
        queryParams.push(min_price);
      }
      if (max_price) {
        whereConditions.push('p.price <= ?');
        queryParams.push(max_price);
      }

      // Search filter
      if (search) {
        const searchField = lang === 'ar' ? 'p.name_ar' : 'p.name';
        whereConditions.push(`(${searchField} LIKE ? OR p.product_description LIKE ?)`);
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM af_products p
        ${whereClause}
      `;

      const [countResult] = await pool.execute(countQuery, queryParams) as [unknown[], unknown];
      const total = (countResult as { total: number }[])[0].total;

      // Validate sort column to prevent SQL injection
      const allowedSortColumns = ['product_id', 'name', 'price', 'created_at', 'status'];
      const validSort = allowedSortColumns.includes(sort) ? sort : 'product_id';
      const validOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

      // Build the complete query with parameters
      const limitClause = shouldPaginate && limit ? `LIMIT ${limit} OFFSET ${offset}` : '';
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          sc.name as subcategory_name
        FROM af_products p
        LEFT JOIN af_category c ON p.category_id = c.id
        LEFT JOIN af_subcategory sc ON p.sub_category_id = sc.id
        ${whereClause}
        ORDER BY p.${validSort} ${validOrder}
        ${limitClause}
      `;
      
      const [rows] = await pool.execute(query, queryParams) as [unknown[], unknown];
      const products = rows as Product[];

      // Calculate discount percentage for each product
      const productsWithDiscount = products.map(product => {
        const productData = { ...product };
        if (productData.special_price && productData.price > productData.special_price) {
          productData.discount_percentage = Math.round(
            ((productData.price - productData.special_price) / productData.price) * 100
          );
        }
        
        // Parse images if stored as JSON string
        if (productData.images) {
          try {
            productData.images = JSON.parse(productData.images);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }

        return productData;
      });

      // Build image_url for first image via bulk lookup
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

      const productsWithImageUrl = productsWithDiscount.map(p => {
        const fid = getFirstImageId(p.images);
        const image_url = fid ? idToUrl.get(fid) : undefined;
        return { ...p, image_url } as Product & { image_url?: string };
      });

      return {
        success: true,
        data: {
          products: productsWithImageUrl,
          pagination: shouldPaginate ? {
            current_page: page!,
            total_pages: Math.ceil(total / limit!),
            total_items: total,
            items_per_page: limit!
          } : {
            total_items: total
          }
        }
      };
    });
  }

  static async getProductById(id: number) {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          sc.name as subcategory_name
        FROM af_products p
        LEFT JOIN af_category c ON p.category_id = c.id
        LEFT JOIN af_subcategory sc ON p.sub_category_id = sc.id
        WHERE p.product_id = ?
      `;

      const [rows] = await pool.execute(query, [id]) as [unknown[], unknown];
      const products = rows as Product[];

      if (products.length === 0) {
        return null;
      }

      const product = products[0];
      
      // Calculate discount percentage
      if (product.special_price && product.price > product.special_price) {
        product.discount_percentage = Math.round(
          ((product.price - product.special_price) / product.price) * 100
        );
      }

      // Parse images if stored as JSON string
      if (product.images) {
        try {
          product.images = JSON.parse(product.images);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      // Attach image_url (first image)
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
      const fid = getFirstImageId(product.images as unknown);
      if (fid) {
        const [fileRows] = await pool.execute<RowDataPacket[]>('SELECT file_path, file_name FROM af_files WHERE id = ? LIMIT 1', [fid]);
        if (fileRows.length > 0) {
          (product as Product & { image_url?: string }).image_url = `${fileRows[0].file_path}${fileRows[0].file_name}`;
        }
      }

      return product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  static async getChildProducts(parentId: number) {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          sc.name as subcategory_name
        FROM af_products p
        LEFT JOIN af_category c ON p.category_id = c.id
        LEFT JOIN af_subcategory sc ON p.sub_category_id = sc.id
        WHERE p.parent_product_id = ? AND p.status = 1
        ORDER BY p.price ASC
      `;

      const [rows] = await pool.execute(query, [parentId]) as [unknown[], unknown];
      const products = rows as Product[];

      // Calculate discount percentage and parse images for each child product
      const productsWithDiscount = products.map(product => {
        const productData = { ...product };
        
        if (productData.special_price && productData.price > productData.special_price) {
          productData.discount_percentage = Math.round(
            ((productData.price - productData.special_price) / productData.price) * 100
          );
        }

        // Parse images if stored as JSON string
        if (productData.images) {
          try {
            productData.images = JSON.parse(productData.images);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }

        return productData;
      });

      return productsWithDiscount;
    } catch (error) {
      console.error('Error fetching child products:', error);
      throw error;
    }
  }

  static async getFeaturedProducts(limit: number = 10, lang: string = 'en') {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name
        FROM af_products p
        LEFT JOIN af_category c ON p.category_id = c.id
        WHERE p.status = 1
        ORDER BY p.created_at DESC
        LIMIT ${Number(limit)}
      `;

      const [rows] = await pool.execute(query) as [unknown[], unknown];
      const products = rows as Product[];

      const productsWithDiscount = products.map(product => {
        const productData = { ...product };
        if (productData.special_price && productData.price > productData.special_price) {
          productData.discount_percentage = Math.round(
            ((productData.price - productData.special_price) / productData.price) * 100
          );
        }
        return productData;
      });

      // Attach image_url via bulk lookup
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
        return { ...p, image_url } as Product & { image_url?: string };
      });

      return withUrl;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  static async getProductsByCategory(categoryId: number, params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    lang?: string;
  }) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'product_id',
        order = 'ASC',
        lang = 'en'
      } = params;

      const offset = (page - 1) * limit;

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM af_products p
        WHERE p.category_id = ? AND p.status = 1
      `;

      const [countResult] = await pool.execute(countQuery, [categoryId]) as [unknown[], unknown];
      const total = (countResult as { total: number }[])[0].total;

      // Main query
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          sc.name as subcategory_name
        FROM af_products p
        LEFT JOIN af_category c ON p.category_id = c.id
        LEFT JOIN af_subcategory sc ON p.sub_category_id = sc.id
        WHERE p.category_id = ? AND p.status = 1
        ORDER BY p.${sort} ${order.toUpperCase()}
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `;

      const [rows] = await pool.execute(query, [categoryId]) as [unknown[], unknown];
      const products = rows as Product[];

      const productsWithDiscount = products.map(product => {
        const productData = { ...product };
        if (productData.special_price && productData.price > productData.special_price) {
          productData.discount_percentage = Math.round(
            ((productData.price - productData.special_price) / productData.price) * 100
          );
        }
        return productData;
      });
      // Attach image_url via bulk lookup
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
        return { ...p, image_url } as Product & { image_url?: string };
      });

      return {
        success: true,
        data: {
          products: withUrl,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: limit
          }
        }
      };
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }

  static async getTopSellers(limit: number = 8, lang: string = 'en') {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          sc.name as subcategory_name,
          SUM(oi.quantity) as total_sold
        FROM af_products p
        LEFT JOIN af_category c ON p.category_id = c.id
        LEFT JOIN af_subcategory sc ON p.sub_category_id = sc.id
        INNER JOIN af_guestorder_items oi ON p.product_id = oi.product_id
        WHERE p.status = 1
        GROUP BY p.product_id
        ORDER BY total_sold DESC
        LIMIT ${Number(limit)}
      `;

      const [rows] = await pool.execute(query) as [unknown[], unknown];
      const products = rows as (Product & { total_sold: number })[];

      const productsWithDiscount = products.map(product => {
        const productData = { ...product };
        if (productData.special_price && productData.price > productData.special_price) {
          productData.discount_percentage = Math.round(
            ((productData.price - productData.special_price) / productData.price) * 100
          );
        }
        
        // Parse images if stored as JSON string
        if (productData.images) {
          try {
            productData.images = JSON.parse(productData.images);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }

        return productData;
      });

      // Attach image_url via bulk lookup
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
        return { ...p, image_url } as Product & { image_url?: string };
      });

      return withUrl;
    } catch (error) {
      console.error('Error fetching top sellers:', error);
      throw error;
    }
  }
}

export class EventService {
  static async getAllEvents(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    status?: number;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'DESC',
        status = 1
      } = params;

      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const queryParams: (string | number)[] = [];

      // Filter by status
      if (status !== undefined) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }

      // Validate sort column to prevent SQL injection
      const allowedSortColumns = ['id', 'name', 'event_url', 'status', 'created_at'];
      const validSort = allowedSortColumns.includes(sort) ? sort : 'created_at';
      const validOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

      const countQuery = `SELECT COUNT(*) as total FROM af_events ${whereClause}`;
      const [countResult] = await connection.execute(countQuery, queryParams);
      const total = (countResult as { total: number }[])[0].total;

      const dataQuery = `SELECT * FROM af_events ${whereClause} ORDER BY ${validSort} ${validOrder} LIMIT ${limit} OFFSET ${offset}`;
      
      const [rows] = await connection.execute(dataQuery, queryParams);
      const events = rows as Event[];

      return {
        events,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      };
    } finally {
      connection.release();
    }
  }

  static async getEventById(id: number) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_events WHERE id = ? AND status = 1';
      const [rows] = await connection.execute(query, [id]);
      const events = rows as Event[];
      
      if (events.length === 0) {
        return null;
      }

      return events[0];
    } finally {
      connection.release();
    }
  }

  static async getFeaturedEvents(limit: number = 5) {
    const connection = await pool.getConnection();
    
    try {
      const query = `SELECT * FROM af_events WHERE status = 1 ORDER BY created_at DESC LIMIT ${Number(limit)}`;
      const [rows] = await connection.execute(query);
      return rows as Event[];
    } finally {
      connection.release();
    }
  }

  static async getActiveEvents(params: {
    page?: number;
    limit?: number;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page = 1,
        limit = 10
      } = params;

      const offset = (page - 1) * limit;

      const countQuery = 'SELECT COUNT(*) as total FROM af_events WHERE status = 1';
      const [countResult] = await connection.execute(countQuery);
      const total = (countResult as { total: number }[])[0].total;

      const dataQuery = `SELECT * FROM af_events WHERE status = 1 ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await connection.execute(dataQuery);
      const events = rows as Event[];

      return {
        events,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      };
    } finally {
      connection.release();
    }
  }

  static async getUpcomingEvents(params: {
    page?: number;
    limit?: number;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page = 1,
        limit = 10
      } = params;

      const offset = (page - 1) * limit;

      const countQuery = 'SELECT COUNT(*) as total FROM af_events WHERE status = 1';
      const [countResult] = await connection.execute(countQuery);
      const total = (countResult as { total: number }[])[0].total;

      const dataQuery = `SELECT * FROM af_events WHERE status = 1 ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await connection.execute(dataQuery);
      const events = rows as Event[];

      return {
        events,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      };
    } finally {
      connection.release();
    }
  }
}

export interface GuestOrder {
  order_id: number;
  user_name: string;
  user_city?: string;
  email: string;
  mobile: string;
  whatsapp_number?: string;
  amount: number;
  delivery_charges?: number;
  discount?: number;
  service_fee?: number;
  redeem_amount?: number;
  shipping_charges?: number;
  over_weight_fee?: number;
  total: number;
  address?: string;
  delivery_type?: string;
  card_type?: string;
  payment_type?: string;
  payment_status?: string;
  vat_number?: string;
  awb_id?: string;
  status?: string;
  order_status?: string;
  created_at?: number;
  updated_at?: number;
}

export class OrderService {
  static async getAllGuestOrders(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    status?: string;
    payment_status?: string;
    order_status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page,
        limit,
        sort = 'order_id',
        order = 'DESC',
        status,
        payment_status,
        order_status,
        search,
        start_date,
        end_date
      } = params;

      const shouldPaginate = page !== undefined && limit !== undefined;
      const offset = shouldPaginate ? (page! - 1) * limit! : 0;
      
      let whereClause = 'WHERE 1=1';
      const queryParams: (string | number)[] = [];

      // Filter by status
      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }

      // Filter by payment status
      if (payment_status) {
        whereClause += ' AND payment_status = ?';
        queryParams.push(payment_status);
      }

      // Filter by order status
      if (order_status) {
        whereClause += ' AND order_status = ?';
        queryParams.push(order_status);
      }

      // Search functionality
      if (search) {
        whereClause += ' AND (user_name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Date range filter
      if (start_date) {
        whereClause += ' AND created_at >= ?';
        queryParams.push(Math.floor(new Date(start_date).getTime() / 1000));
      }

      if (end_date) {
        whereClause += ' AND created_at <= ?';
        queryParams.push(Math.floor(new Date(end_date).getTime() / 1000));
      }

      // Validate sort column
      const allowedSortColumns = ['order_id', 'user_name', 'email', 'total', 'created_at', 'status', 'payment_status', 'order_status'];
      const validSort = allowedSortColumns.includes(sort) ? sort : 'order_id';
      const validOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

      let query = `SELECT * FROM af_guestorders ${whereClause} ORDER BY ${validSort} ${validOrder}`;
      
      if (shouldPaginate) {
        query += ` LIMIT ${Number(limit!)} OFFSET ${Number(offset)}`;
      }

      const [rows] = await connection.execute(query, queryParams);
      
      let totalCount = 0;
      if (shouldPaginate) {
        const countQuery = `SELECT COUNT(*) as count FROM af_guestorders ${whereClause}`;
        const [countRows] = await connection.execute(countQuery, queryParams);
        totalCount = (countRows as { count: number }[])[0].count;
      }

      return {
        data: rows,
        pagination: shouldPaginate ? {
          page: page!,
          limit: limit!,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit!)
        } : null
      };
    } catch (error) {
      console.error('Error fetching guest orders:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getGuestOrderById(id: number) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_guestorders WHERE order_id = ?';
      const [rows] = await connection.execute(query, [id]);
      return (rows as GuestOrder[])[0] || null;
    } catch (error) {
      console.error('Error fetching guest order by id:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createGuestOrder(data: Omit<GuestOrder, 'order_id' | 'created_at' | 'updated_at'>) {
    const connection = await pool.getConnection();
    
    try {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const query = `
        INSERT INTO af_guestorders (${fields}, created_at) 
        VALUES (${placeholders}, NOW())
      `;
      
      const [result] = await connection.execute(query, values);
      const insertId = (result as { insertId: number }).insertId;
      
      return await this.getGuestOrderById(insertId);
    } catch (error) {
      console.error('Error creating guest order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateGuestOrder(id: number, data: Partial<GuestOrder>) {
    const connection = await pool.getConnection();
    
    try {
      const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const query = `UPDATE af_guestorders SET ${fields} WHERE order_id = ?`;
      await connection.execute(query, values);
      
      return await this.getGuestOrderById(id);
    } catch (error) {
      console.error('Error updating guest order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteGuestOrder(id: number) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'DELETE FROM af_guestorders WHERE order_id = ?';
      const [result] = await connection.execute(query, [id]);
      return (result as { affectedRows: number }).affectedRows > 0;
    } catch (error) {
      console.error('Error deleting guest order:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

export class FileService {
  static async getFileById(id: number) {
    try {
      const connection = await pool.getConnection();
      
      try {
        const [rows] = await connection.execute<RowDataPacket[]>(
          'SELECT id, file_path, file_name, file_type FROM af_files WHERE id = ?',
          [id]
        );

        if (rows.length === 0) {
          return null;
        }

        return {
          id: rows[0].id,
          file_path: rows[0].file_path,
          file_name: rows[0].file_name,
          file_type: rows[0].file_type
        } as FileData;
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  }

  static async getAllFiles(params: {
    page?: number;
    limit?: number;
    filetype?: string;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;
      
      const connection = await pool.getConnection();
      
      try {
        let query = 'SELECT id, file_path, file_name, file_type FROM af_files';
        let countQuery = 'SELECT COUNT(*) as total FROM af_files';
        const queryParams: (string | number)[] = [];
        
        if (params.filetype) {
          query += ' WHERE file_type = ?';
          countQuery += ' WHERE file_type = ?';
          queryParams.push(params.filetype);
        }
        
        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
        
        const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams);
        const [countRows] = await connection.execute<RowDataPacket[]>(countQuery, params.filetype ? [params.filetype] : []);
        
        const files = rows.map(row => ({
          id: row.id,
          file_path: row.file_path,
          file_name: row.file_name,
          file_type: row.file_type
        }));
        
        return {
          files,
          pagination: {
            page,
            limit,
            total: countRows[0].total,
            totalPages: Math.ceil(countRows[0].total / limit)
          }
        };
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }
}

export class CategoryService {
  static async getAllCategories(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
    status?: string;
    include_subcategories?: boolean;
    parent_id?: number;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page,
        limit,
        sort = 'cat_priority',
        order = 'ASC',
        status,
        include_subcategories = false,
        parent_id
      } = params;

      const shouldPaginate = page !== undefined && limit !== undefined;
      const offset = shouldPaginate ? (page! - 1) * limit! : 0;
      
      let whereClause = 'WHERE 1=1';
      const queryParams: (string | number)[] = [];

      // Only filter by status if explicitly provided
      if (status) {
        let statusValue;
        if (status === 'active') {
          statusValue = 1;
        } else if (status === 'inactive') {
          statusValue = 0;
        }
        if (statusValue !== undefined) {
          whereClause += ' AND status = ?';
          queryParams.push(statusValue);
        }
      }

      // Filter by parent_id if provided
      if (parent_id !== undefined) {
        whereClause += ' AND parent_id = ?';
        queryParams.push(parent_id);
      }

      // Validate sort column to prevent SQL injection
      const allowedSortColumns = ['id', 'name', 'cat_priority', 'created_at', 'status'];
      const validSort = allowedSortColumns.includes(sort) ? sort : 'cat_priority';
      const validOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

      const countQuery = `SELECT COUNT(*) as total FROM af_category ${whereClause}`;
      const [countResult] = await connection.execute(countQuery, queryParams);
      const total = (countResult as { total: number }[])[0].total;

      let dataQuery = `SELECT * FROM af_category ${whereClause} ORDER BY ${validSort} ${validOrder}`;
      if (shouldPaginate) {
        dataQuery += ` LIMIT ${limit} OFFSET ${offset}`;
      }
      
      const [rows] = await connection.execute(dataQuery, queryParams);
      const categories = rows as Category[];

      // Include subcategories if requested
      if (include_subcategories) {
        for (const category of categories) {
          const subcategoriesQuery = 'SELECT * FROM af_subcategory WHERE category_name = ? AND status = 1 ORDER BY cat_priority ASC';
          const [subRows] = await connection.execute(subcategoriesQuery, [category.name]);
          category.subcategories = subRows as SubCategory[];
        }
      }

      if (shouldPaginate) {
        return {
          categories,
          pagination: {
            current_page: page!,
            total_pages: Math.ceil(total / limit!),
            total_items: total,
            items_per_page: limit!
          }
        };
      } else {
        return {
          categories,
          pagination: {
            total_items: total
          }
        };
      }
    } finally {
      connection.release();
    }
  }

  static async getCategoryById(id: number, include_subcategories: boolean = false) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_category WHERE id = ? AND status = 1';
      const [rows] = await connection.execute(query, [id]);
      const categories = rows as Category[];
      
      if (categories.length === 0) {
        return null;
      }

      const category = categories[0];

      if (include_subcategories) {
        const subcategoriesQuery = 'SELECT * FROM af_subcategory WHERE category_name = ? AND status = 1 ORDER BY cat_priority ASC';
        const [subRows] = await connection.execute(subcategoriesQuery, [category.name]);
        category.subcategories = subRows as SubCategory[];
      }

      return category;
    } finally {
      connection.release();
    }
  }

  static async getCategoryByUrl(categoryUrl: string, include_subcategories: boolean = false) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_category WHERE category_url = ? AND status = 1';
      const [rows] = await connection.execute(query, [categoryUrl]);
      const categories = rows as Category[];
      
      if (categories.length === 0) {
        return null;
      }

      const category = categories[0];

      if (include_subcategories) {
        const subcategoriesQuery = 'SELECT * FROM af_subcategory WHERE category_name = ? AND status = 1 ORDER BY cat_priority ASC';
        const [subRows] = await connection.execute(subcategoriesQuery, [category.name]);
        category.subcategories = subRows as SubCategory[];
      }

      return category;
    } finally {
      connection.release();
    }
  }

  static async getCategoryHierarchy() {
    const connection = await pool.getConnection();
    
    try {
      const categoriesQuery = 'SELECT * FROM af_category WHERE status = 1 ORDER BY cat_priority ASC';
      const [categoryRows] = await connection.execute(categoriesQuery);
      const categories = categoryRows as Category[];
      
      // Get subcategories separately
      const subcategoriesQuery = 'SELECT * FROM af_subcategory WHERE status = 1 ORDER BY cat_priority ASC';
      const [subRows] = await connection.execute(subcategoriesQuery);
      const subcategories = subRows as SubCategory[];
      
      // Manually associate subcategories with categories based on category_name
      const categoriesWithSubcategories = categories.map(category => {
        const categorySubcategories = subcategories.filter(sub => 
          sub.category_name === category.name
        );
        return {
          ...category,
          subcategories: categorySubcategories
        };
      });

      return categoriesWithSubcategories;
    } finally {
      connection.release();
    }
  }

  static async getCategoriesWithProductCount() {
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT c.*, COUNT(p.product_id) as product_count
        FROM af_category c
        LEFT JOIN af_products p ON p.category = c.name AND p.status = 'active'
        WHERE c.status = 1
        GROUP BY c.id
        ORDER BY c.cat_priority ASC
      `;
      
      const [rows] = await connection.execute(query);
      return rows as (Category & { product_count: number })[];
    } finally {
      connection.release();
    }
  }

  static async getSubcategoriesByCategory(categoryId: number, params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  }) {
    const connection = await pool.getConnection();
    
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'cat_priority',
        order = 'ASC'
      } = params;

      const offset = (page - 1) * limit;

      // First get the category name to match with subcategories
      const categoryQuery = 'SELECT name FROM af_category WHERE id = ?';
      const [categoryRows] = await connection.execute(categoryQuery, [categoryId]);
      const categories = categoryRows as { name: string }[];
      
      if (categories.length === 0) {
        return null;
      }

      const categoryName = categories[0].name;

      // Validate sort column
      const allowedSortColumns = ['id', 'name', 'cat_priority', 'sort_order', 'created_at'];
      const validSort = allowedSortColumns.includes(sort) ? sort : 'cat_priority';
      const validOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

      const countQuery = 'SELECT COUNT(*) as total FROM af_subcategory WHERE category_name = ? AND status = 1';
      const [countResult] = await connection.execute(countQuery, [categoryName]);
      const total = (countResult as { total: number }[])[0].total;

      const dataQuery = `SELECT * FROM af_subcategory WHERE category_name = ? AND status = 1 ORDER BY ${validSort} ${validOrder} LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await connection.execute(dataQuery, [categoryName]);
      const subcategories = rows as SubCategory[];

      return {
        subcategories,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      };
    } finally {
      connection.release();
    }
  }

  static async getSubcategoryById(id: number) {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_subcategory WHERE id = ? AND status = 1';
      const [rows] = await connection.execute(query, [id]);
      const subcategories = rows as SubCategory[];
      
      if (subcategories.length === 0) {
        return null;
      }

      return subcategories[0];
    } finally {
      connection.release();
    }
  }

  static async getAllCategoriesDebug() {
    const connection = await pool.getConnection();
    
    try {
      const query = 'SELECT * FROM af_category ORDER BY cat_priority ASC';
      const [rows] = await connection.execute(query);
      const categories = rows as Category[];

      return {
        categories,
        total_items: categories.length
      };
    } finally {
      connection.release();
    }
  }
}