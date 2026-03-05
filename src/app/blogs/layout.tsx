import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest articles about spices, herbs, cooking tips, and healthy recipes from Natural Spices UAE.",
  openGraph: {
    title: "Blog | Natural Spices UAE",
    description:
      "Read the latest articles about spices, herbs, cooking tips, and healthy recipes from Natural Spices UAE.",
    type: "website",
  },
};

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
