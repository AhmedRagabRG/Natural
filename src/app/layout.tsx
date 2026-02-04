import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./flex-grids.min.css";
import { CartProvider } from "../context/CartContext";
import { ProductProvider } from "../context/ProductContext";
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
  title: "Online Grocery Shopping Offers in Dubai with Free Delivery",
  description: "Online shopping grocery free delivery in Dubai. Fresh food and Natural Organic items from India, Pakistan, fresh paneer, nuts, seeds, rice, spices, grains, dals",
  keywords: "Natural spices dubai, herbs and spices dubai, fresh pulses in dubai, order nuts online, order herbs online, fresh indian pulses, fresh indian spices, grocery delivery in dubai, dry fruit delivery dubai, quality nuts in dubai, order groceries online, buy grocery online in dubai, dry fruits in dubai, dubai spice souk, spice market dubai",
  authors: [{ name: "Natural Spices" }],
  robots: "index,follow",
  openGraph: {
    locale: "en_US",
    title: "Natural Spices",
    description: "Natural Spices",
    images: [
       {
         url: "/logo_header.png",
         alt: "Natural Spices Logo"
       }
     ],
    siteName: "Natural Spices"
  },
  other: {
    "Classification": "Natural Spices",
    "audience": "All",
    "googlebot": "index,follow",
    "distribution": "Global",
    "Language": "en-us",
    "doc-type": "Public",
    "facebook-domain-verification": "1f18zvu8inxrx0fnt84aim2q1h3vhw",
    "site_name": "Natural Spices"
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
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
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
          strategy="afterInteractive"
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
        
        {/* Favicon */}
        <link
          rel="shortcut icon"
          type="image/x-icon"
          href="/logo_header.png"
        />
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
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
            <TopBar />
            <LayoutContent>{children}</LayoutContent>
            <Footer />
            <MobileFixedFooter />
            <CartModal />
            <CheckoutModal />
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
