'use client';

import React from 'react';
import Image from 'next/image';

export default function ReviewPage() {
  const handleFacebookClick = () => {
    window.open('https://www.facebook.com/naturalspicesuae/reviews', '_blank');
  };

  const handleGoogleClick = () => {
    window.open('https://g.page/r/CQJaatybmJIREBM/review', '_blank');
  };

  const handleReviewUsClick = () => {
    window.open('https://g.page/r/CQJaatybmJIREBM/review', '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          height: 100%;
          overflow: hidden;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
      
      {/* Background Image */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/assets/reviewcover.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem'
      }}>
        {/* Buttons Layout */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          maxWidth: '32rem',
          width: '100%'
        }}>
          {/* Review Us Button - Top */}
          <button
            onClick={handleReviewUsClick}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '2rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '24rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ width: '5rem', height: '5rem', position: 'relative' }}>
                <Image
                  src="/assets/review-icon.svg"
                  alt="Review Us"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <span style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '1.25rem'
              }}>
                Review Us
              </span>
            </div>
          </button>

          {/* Facebook and Google Buttons - Bottom Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            width: '100%'
          }}>
            {/* Facebook Button */}
            <button
              onClick={handleFacebookClick}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '2rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ width: '5rem', height: '5rem', position: 'relative' }}>
                  <Image
                    src="/assets/fac.png"
                    alt="Facebook"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <span style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1.25rem'
                }}>
                  Facebook
                </span>
              </div>
            </button>

            {/* Google Button */}
            <button
              onClick={handleGoogleClick}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '2rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ width: '5rem', height: '5rem', position: 'relative' }}>
                  <Image
                    src="/assets/google.png"
                    alt="Google"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <span style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1.25rem'
                }}>
                  Google
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}