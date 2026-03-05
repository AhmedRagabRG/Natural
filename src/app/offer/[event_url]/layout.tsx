import type { Metadata } from "next";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface Props {
  params: Promise<{ event_url: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { event_url } = await params;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT name FROM af_events WHERE event_url = ? AND status = 1 LIMIT 1",
      [event_url]
    );

    if (rows.length > 0) {
      const event = rows[0];
      const title = event.name;
      const description = `${event.name} – Shop special offers and discounts at Natural Spices UAE. Limited-time deals with UAE-wide delivery.`;

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
    console.error("Error generating offer metadata:", error);
  }

  return {
    title: "Special Offers",
    description:
      "Exclusive deals and special offers on premium spices and groceries at Natural Spices UAE.",
  };
}

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
