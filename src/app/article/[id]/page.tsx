'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getFirstImageUrl } from '../../../utils/imageUtils';

interface Article {
  id: number;
  title?: string;
  blog_title?: string;
  content?: string;
  description?: string;
  image?: string;
  images?: string;
  imageUrl?: string;
  created_at?: string | number;
  date?: string | number;
}

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const loadArticle = async (id: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/blogs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.blogs) {
        throw new Error('Invalid response format');
      }
      
      const articles = data.data.blogs;
      
      if (id) {
        const foundArticle = articles.find((a: Article) => a.id === parseInt(id));
        if (!foundArticle) {
          setError(true);
        } else {
          // Map API fields to expected format and load image
          const imageUrl = await getFirstImageUrl(foundArticle.images || foundArticle.image);
          const mappedArticle = {
            ...foundArticle,
            title: foundArticle.blog_title || foundArticle.title,
            content: foundArticle.description || foundArticle.content,
            date: foundArticle.created_at || foundArticle.date,
            image: foundArticle.image || foundArticle.images || '/assets/default-blog.jpg',
            imageUrl: imageUrl
          };
          setArticle(mappedArticle);
          document.title = `${mappedArticle.title} - Natural Spices UAE`;
          // Scroll to top when new article loads
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setError(true);
      }

      // Get recent articles excluding current article with images
      const recentArticlesWithImages = await Promise.all(
        articles
          .filter((a: Article) => a.id !== parseInt(id))
          .slice(0, 4)
          .map(async (article: Article) => {
            const imageUrl = await getFirstImageUrl(article.images || article.image);
            return {
              ...article,
              title: article.blog_title || article.title,
              content: article.description || article.content,
              date: article.created_at || article.date,
              image: article.image || article.images || '/assets/default-blog.jpg',
              imageUrl: imageUrl
            };
          })
      );
      
      const recentArticlesList = recentArticlesWithImages
        .sort((a: Article, b: Article) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      
      setRecentArticles(recentArticlesList);
    } catch (err) {
      console.error('Error loading article:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (articleId: number, event: React.MouseEvent) => {
    event.preventDefault();
    if (articleId === article?.id) return;
    
    // Update URL without full page reload
    window.history.pushState({}, '', `/article/${articleId}`);
    loadArticle(articleId.toString());
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = article ? article.title : 'Check out this article';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text || '')}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = article ? `${article.title}\n${shareUrl}` : shareUrl;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatDate = (dateString: string | number) => {
    if (!dateString) return '';
    const timestamp = typeof dateString === 'number' ? dateString * 1000 : dateString;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  useEffect(() => {
    if (articleId) {
      setShareUrl(window.location.href);
      loadArticle(articleId);
    }
  }, [articleId]);

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className={`article-loading ${loading ? 'show' : ''}`}>
          <div className="article-loading-spinner"></div>
        </div>
      )}
      <main key="main-content">
        <div className="article-container">
          {/* Error State */}
          {error && (
            <div className="error-container">
              <div className="error-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h1 className="error-title">Article Not Found</h1>
              <p className="error-message">Sorry, we couldnt find the article youre looking for.</p>
              <Link href="/" className="back-home">
                <i className="fas fa-home"></i>
                Back to Home
              </Link>
            </div>
          )}

          {/* Article Content with Sidebar */}
          {article && !error && (
            <div className="article-layout">
              <div className="article-content">
                <header className="article-header">
                  <h1 className="article-title">{article.title}</h1>
                  <div className="article-meta">
                    <div className="article-date">
                      <i className="far fa-calendar"></i>
                      <span>{formatDate(article.date || '')}</span>
                    </div>
                  </div>
                </header>

                {/* Only show image if it exists and is not the default fallback */}
                {article.imageUrl && article.imageUrl !== '/assets/du.png' && (
                  <div className="article-image-container">
                    <Image 
                      src={article.imageUrl} 
                      alt={article.title || 'Article image'} 
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                      priority
                    />
                  </div>
                )}

                <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content || '' }}></div>

                {/* Social Share Section */}
                <div className="social-share">
                  <h3 className="social-share-title">Share this article</h3>
                  <div className="social-buttons">
                    <button onClick={shareOnFacebook} className="social-button facebook">
                      <i className="fab fa-facebook-f"></i>
                      <span>Facebook</span>
                    </button>
                    <button onClick={shareOnTwitter} className="social-button twitter">
                      <i className="fab fa-x-twitter"></i>
                      <span>X (Twitter)</span>
                    </button>
                    <button onClick={shareOnLinkedIn} className="social-button linkedin">
                      <i className="fab fa-linkedin-in"></i>
                      <span>LinkedIn</span>
                    </button>
                    <button onClick={shareOnWhatsApp} className="social-button whatsapp">
                      <i className="fab fa-whatsapp"></i>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar with Recent Articles */}
              <aside className="sidebar">
                <h2 className="sidebar-title">
                  <i className="fas fa-newspaper"></i>
                  Recent Articles
                </h2>
                <div className="recent-articles">
                  {recentArticles.map((recentArticle) => (
                    <Link 
                      key={recentArticle.id}
                      href={`/article/${recentArticle.id}`} 
                      className="recent-article"
                      onClick={(e) => handleArticleClick(recentArticle.id, e)}
                    >
                      {/* Only show image if it exists and is not the default fallback */}
                      {recentArticle.imageUrl && recentArticle.imageUrl !== '/assets/du.png' && (
                        <div className="recent-article-image-container">
                          <Image 
                            src={recentArticle.imageUrl} 
                            alt={recentArticle.title || 'Article image'} 
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="150px"
                          />
                        </div>
                      )}
                      <div className="recent-article-content">
                        <h3 className="recent-article-title">{recentArticle.title}</h3>
                        <div className="recent-article-date">
                          <i className="far fa-calendar"></i>
                          <span>{formatDate(recentArticle.date || '')}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
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