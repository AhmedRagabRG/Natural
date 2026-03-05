import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/order-success', '/review'],
      },
    ],
    sitemap: 'https://naturalspicesuae.com/sitemap.xml',
  };
}
