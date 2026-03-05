import type { Metadata } from "next";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface Props {
  params: Promise<{ product_url: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product_url } = await params;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT name, description, price, special_price, images FROM af_products WHERE product_url = ? AND status = 1 LIMIT 1",
      [product_url]
    );

    if (rows.length > 0) {
      const product = rows[0];
      const price = product.special_price || product.price;
      const title = product.name;
      const description =
        product.description
          ? product.description.replace(/<[^>]*>/g, "").substring(0, 160)
          : `Buy ${product.name} online at Natural Spices UAE. AED ${price} with UAE-wide delivery.`;

      // Try to get first image
      let imageUrl: string | undefined;
      if (product.images) {
        try {
          const images = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
          if (Array.isArray(images) && images.length > 0) {
            imageUrl = `https://dashboard.naturalspicesuae.com/uploads/products/${images[0]}`;
          }
        } catch {}
      }

      return {
        title,
        description,
        openGraph: {
          title: `${title} | Natural Spices UAE`,
          description,
          type: "website",
          ...(imageUrl && { images: [{ url: imageUrl, width: 600, height: 600, alt: title }] }),
        },
      };
    }
  } catch (error) {
    console.error("Error generating product metadata:", error);
  }

  return {
    title: "Product",
    description:
      "Premium quality spices, herbs, and grocery products at Natural Spices UAE with UAE-wide delivery.",
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
