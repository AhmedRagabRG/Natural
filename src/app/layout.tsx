import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./base.css";
import "./flex-grids.min.css";
import { CartProvider } from "../context/CartContext";
import { ProductProvider } from "../context/ProductContext";
import { OffersProvider } from "../context/OffersContext";
import { ProductUpdatesProvider } from "../context/ProductUpdatesContext";
import { TopBar, Header, Footer, MobileFixedFooter, CartModal } from "../components";
import CheckoutModal from "../components/CheckoutModal";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://naturalspicesuae.com'),
  title: {
    default: "Online Grocery Shopping in Dubai | Natural Spices UAE – Free Delivery",
    template: "%s | Natural Spices UAE",
  },
  description: "Online grocery shopping with free delivery in Dubai. Fresh Indian spices, organic pulses, dry fruits, nuts, seeds, rice, grains & dals from Natural Spices UAE.",
  keywords: "Natural spices dubai, herbs and spices dubai, fresh pulses in dubai, order nuts online, order herbs online, fresh indian pulses, fresh indian spices, grocery delivery in dubai, dry fruit delivery dubai, quality nuts in dubai, order groceries online, buy grocery online in dubai, dry fruits in dubai, dubai spice souk, spice market dubai",
  authors: [{ name: "Natural Spices UAE" }],
  robots: "index,follow",
  alternates: {
    canonical: '/',
    languages: {
      'en-AE': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: "en_AE",
    url: 'https://naturalspicesuae.com',
    title: "Online Grocery Shopping in Dubai | Natural Spices UAE",
    description: "Fresh Indian spices, organic pulses, dry fruits, nuts, seeds & groceries delivered free in Dubai. Shop online at Natural Spices UAE.",
    images: [
       {
         url: "/logo_header.png",
         width: 512,
         height: 512,
         alt: "Natural Spices UAE Logo"
       }
     ],
    siteName: "Natural Spices UAE"
  },
  twitter: {
    card: 'summary_large_image',
    title: "Online Grocery Shopping in Dubai | Natural Spices UAE",
    description: "Fresh spices, dry fruits, nuts & groceries delivered free in Dubai.",
    images: ["/logo_header.png"],
  },
  other: {
    "Classification": "Online Grocery Store",
    "audience": "All",
    "googlebot": "index,follow",
    "distribution": "Global",
    "Language": "en-ae",
    "doc-type": "Public",
    "facebook-domain-verification": "1f18zvu8inxrx0fnt84aim2q1h3vhw",
    "site_name": "Natural Spices UAE"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Schema.org Structured Data – Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GroceryStore",
              "name": "Natural Spices UAE",
              "url": "https://naturalspicesuae.com",
              "logo": "https://naturalspicesuae.com/logo_header.png",
              "image": "https://naturalspicesuae.com/logo_header.png",
              "description": "Online grocery shopping with free delivery in Dubai. Fresh Indian spices, organic pulses, dry fruits, nuts, seeds, rice, grains & dals.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dubai",
                "addressCountry": "AE"
              },
              "sameAs": [
                "https://www.instagram.com/naturalspicesuae/",
                "https://www.facebook.com/naturalspicesuae",
                "https://www.tiktok.com/@naturalspicesuae",
                "https://www.linkedin.com/company/naturalspicesuae/"
              ],
              "priceRange": "$$"
            }),
          }}
        />
        {/* Schema.org – WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Natural Spices UAE",
              "url": "https://naturalspicesuae.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://naturalspicesuae.com/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />

        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WQSRD52');
            `,
          }}
        />
        {/* End Google Tag Manager */}
        
        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1138245426635278');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}} 
            src="https://www.facebook.com/tr?id=1138245426635278&ev=PageView&noscript=1" 
          />
        </noscript>
        {/* End Meta Pixel Code */}
        
        {/* Preconnect to 3rd-party origins so their TCP/TLS is ready before scripts fire */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://www.facebook.com" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://dashboard.naturalspicesuae.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://dashboard.naturalspicesuae.com" />
        {/* Favicon */}
        <link
          rel="shortcut icon"
          type="image/x-icon"
          href="/logo_header.png"
        />
        {/* Font Awesome - load from head to avoid late icon layout shifts */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-WQSRD52"
            height="0" 
            width="0" 
            style={{display: 'none', visibility: 'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <CartProvider>
          <ProductProvider>
            <OffersProvider>
            <ProductUpdatesProvider>
            <TopBar />
            <LayoutContent>{children}</LayoutContent>
            <Footer />
            <MobileFixedFooter />
            <CartModal />
            <CheckoutModal />
            </ProductUpdatesProvider>
            </OffersProvider>
          </ProductProvider>
        </CartProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
