import type { Metadata } from "next";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface Props {
  params: Promise<{ category_url: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category_url } = await params;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT name, description FROM af_category WHERE category_url = ? AND status = 1 LIMIT 1",
      [category_url]
    );

    if (rows.length > 0) {
      const category = rows[0];
      const title = category.name;
      const description =
        category.description ||
        `Shop premium ${category.name} online at Natural Spices UAE. Fresh quality products with UAE-wide delivery.`;

      return {
        title,
        description,
        openGraph: {
          title: `${title} | Natural Spices UAE`,
          description,
          type: "website",
        },
      };
    }
  } catch (error) {
    console.error("Error generating category metadata:", error);
  }

  return {
    title: "Category Products",
    description:
      "Browse our wide selection of premium spices, herbs, and grocery products at Natural Spices UAE.",
  };
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
