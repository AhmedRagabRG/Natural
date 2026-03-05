import { CategoryService } from "../lib/db";
import HomeClient, { ServerCollection } from "./HomeClient";

// Revalidate the homepage data every 60 seconds (ISR)
export const revalidate = 60;

export default async function Home() {
  /* ---- server-side data fetch (single SQL query) ---- */
  let collections: ServerCollection[] = [];

  try {
    const rows = await CategoryService.getCategoriesForHomepage();

    collections = rows.map((row) => ({
      id: row.id.toString(),
      title: row.name,
      subtitle: "Natural Products",
      discount: row.avg_discount ? `${Math.round(row.avg_discount)}%` : "",
      itemCount: Number(row.product_count) || 0,
      category_url: row.category_url ?? undefined,
      imageUrl: row.file_extension
        ? `https://dashboard.naturalspicesuae.com/uploads/category/${row.id}.${row.file_extension}`
        : undefined,
    }));
  } catch (e) {
    console.error("Failed to load homepage categories:", e);
  }

  /* ---- render ---- */
  return (
    <main>
      <div
        className="main-container"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}
      >
        <h1 className="sr-only">
          Natural Spices UAE – Premium Spices, Herbs &amp; Groceries Delivered
          Across UAE
        </h1>

        {/* Interactive client island – receives pre-fetched data */}
        <HomeClient initialCollections={collections} />

        {/* Product Validations – fully static, server-rendered */}
        <div className="product-validations">
          <div className="validation-item">
            <div className="icon-wrapper">
              <i className="fa-solid fa-star"></i>
            </div>
            <div className="validation-content">
              <div className="rating">4.8/5</div>
              <div className="label">Customer Ratings</div>
            </div>
          </div>

          <div className="validation-item">
            <div className="icon-wrapper">
              <i className="fa-solid fa-face-smile"></i>
            </div>
            <div className="validation-content">
              <div className="rating">1000+</div>
              <div className="label">Happy Customers</div>
            </div>
          </div>

          <div className="validation-item">
            <div className="icon-wrapper">
              <i className="fa-solid fa-thumbs-up"></i>
            </div>
            <div className="validation-content">
              <div className="rating">100%</div>
              <div className="label">Quality Guarantee</div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/+971527176007"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        title="Contact us on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>
    </main>
  );
}
