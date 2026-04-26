import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get("barcode");
  if (!barcode) return NextResponse.json({ error: "No barcode provided" }, { status: 400 });

  // Try UPCitemdb first (good for electronics, general retail)
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.code === "OK" && data.items?.length > 0) {
        const item = data.items[0];
        if (item.title) {
          return NextResponse.json({
            name: item.title,
            brand: item.brand || null,
            description: [item.description, item.model].filter(Boolean).join(" — ") || null,
            imageUrl: item.images?.[0] ?? null,
            barcode,
          });
        }
      }
    }
  } catch {}

  // Fallback: Open Food Facts (great for food, beverages, FMCG)
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name || p.abbreviated_product_name || p.generic_name;
        if (name) {
          return NextResponse.json({
            name,
            brand: p.brands || null,
            description: p.generic_name || null,
            imageUrl: p.image_url ?? null,
            barcode,
          });
        }
      }
    }
  } catch {}

  return NextResponse.json({ error: "Product not found in database" }, { status: 404 });
}
