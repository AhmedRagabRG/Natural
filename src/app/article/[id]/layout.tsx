import type { Metadata } from "next";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT blog_title, description, images FROM af_blogs WHERE id = ? AND status = 1 LIMIT 1",
      [id]
    );

    if (rows.length > 0) {
      const article = rows[0];
      const title = article.blog_title;
      const description =
        article.description
          ? article.description.replace(/<[^>]*>/g, "").slice(0, 160)
          : `Read ${article.blog_title} on Natural Spices UAE blog.`;

      let imageUrl: string | undefined;
      if (article.images) {
        imageUrl = `https://dashboard.naturalspicesuae.com/uploads/blogs/${article.images}`;
      }

      return {
        title,
        description,
        openGraph: {
          title: `${title} | Natural Spices UAE`,
          description,
          type: "article",
          ...(imageUrl && {
            images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
          }),
        },
      };
    }
  } catch (error) {
    console.error("Error generating article metadata:", error);
  }

  return {
    title: "Article",
    description: "Read articles on spices, herbs, and healthy recipes from Natural Spices UAE.",
  };
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
