'use client';

import { useState, useEffect } from 'react';
import { getFirstImageUrl } from '../../utils/imageUtils';

interface Blog {
  id: number;
  title?: string;
  blog_title?: string;
  content?: string;
  description?: string;
  image?: string;
  images?: string;
  imageUrl?: string;
  created_at?: string | number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalBlogs: number;
  limit: number;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    limit: 6
  });

  const loadBlogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blogs?page=${page}&limit=${pagination.limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.data && data.data.blogs) {
        // Load images for all blogs
        const blogsWithImages = await Promise.all(
          data.data.blogs.map(async (blog: Blog) => {
            const imageUrl = await getFirstImageUrl(blog.images || blog.image);
            return {
              ...blog,
              imageUrl: imageUrl
            };
          })
        );
        setBlogs(blogsWithImages);
        setPagination({
          currentPage: data.data.pagination?.current_page || page,
          totalPages: data.data.pagination?.total_pages || 1,
          totalBlogs: data.data.pagination?.total_items || data.data.blogs.length,
          limit: data.data.pagination?.items_per_page || pagination.limit
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      setError('Failed to load blogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      loadBlogs(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getExcerpt = (content: string) => {
    if (!content) return '';
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.textContent?.slice(0, 200) + '...' || '';
  };

  const formatDate = (dateString: string | number) => {
    if (!dateString) return '';
    const timestamp = typeof dateString === 'number' ? dateString * 1000 : dateString;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  return (
    <>
      <main key="main-content">
        {/* Blogs Header */}
        <div className="blogs-header">
          <h1>Our Blog</h1>
          <p>Stay updated with the latest news, tips, and insights about natural spices, organic food, and healthy living.</p>
        </div>

        <div className="container">
          {/* Loading State */}
          {loading && (
            <div className="text-center" style={{ padding: '40px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--color-green)' }}></i>
              <p style={{ marginTop: '15px', color: 'var(--color-grey)' }}>Loading blogs...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center" style={{ padding: '40px' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#e74c3c' }}></i>
              <p style={{ marginTop: '15px', color: '#e74c3c' }}>{error}</p>
              <button onClick={() => loadBlogs()} className="btn btn-primary" style={{ marginTop: '15px' }}>Try Again</button>
            </div>
          )}

          {/* Blogs Grid */}
          {!loading && !error && (
            <div className="blogs-grid">
              {blogs.map((blog) => (
                <div key={blog.id} className="blog-card">
                  <div 
                    className="blog-card-image" 
                    style={{ 
                      backgroundImage: blog.imageUrl && blog.imageUrl !== '/assets/du.png' 
                        ? `url(${blog.imageUrl})` 
                        : 'none'
                    }}
                  ></div>
                  <div className="blog-card-content">
                    <h2 className="blog-card-title">{blog.title || blog.blog_title}</h2>
                    <p className="blog-card-excerpt">{getExcerpt(blog.content || blog.description || '')}</p>
                  </div>
                  <div className="blog-card-footer">
                    <span className="blog-card-date">{formatDate(blog.created_at || '')}</span>
                    <a href={`/article/${blog.id}`} className="blog-card-link">
                      Read More
                      <i className="fas fa-arrow-right"></i>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && blogs.length === 0 && (
            <div className="text-center" style={{ padding: '40px' }}>
              <i className="fas fa-newspaper" style={{ fontSize: '2rem', color: 'var(--color-grey)' }}></i>
              <p style={{ marginTop: '15px', color: 'var(--color-grey)' }}>No blogs available at the moment.</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination">
                {/* Previous Button */}
                <button 
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`pagination-btn pagination-prev ${pagination.currentPage === 1 ? 'disabled' : ''}`}
                >
                  <i className="fas fa-chevron-left"></i>
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button 
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`pagination-btn pagination-number ${page === pagination.currentPage ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Button */}
                <button 
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`pagination-btn pagination-next ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}
                >
                  Next
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              {/* Pagination Info */}
              <div className="pagination-info">
                <span>
                  {`Showing ${(pagination.currentPage - 1) * pagination.limit + 1}-${Math.min(pagination.currentPage * pagination.limit, pagination.totalBlogs)} of ${pagination.totalBlogs} blogs`}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/+971527176007"
        target="_blank"
        className="whatsapp-float"
        title="Contact us on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>
    </>
  );
}