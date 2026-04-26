import { NextRequest, NextResponse } from "next/server";

async function tryOpenFacts(domain: string, barcode: string) {
  try {
    const res = await fetch(
      `https://${domain}/api/v0/product/${barcode}.json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const name = p.product_name || p.abbreviated_product_name || p.generic_name;
    if (!name) return null;
    return {
      name: name.trim(),
      brand: p.brands?.split(",")[0]?.trim() || null,
      description: p.generic_name?.trim() || null,
      imageUrl: p.image_url ?? null,
    };
  } catch {
    return null;
  }
}

async function tryUPCitemdb(barcode: string) {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "OK" || !data.items?.length) return null;
    const item = data.items[0];
    if (!item.title) return null;
    return {
      name: item.title.trim(),
      brand: item.brand || null,
      description: item.description?.trim() || null,
      imageUrl: item.images?.[0] ?? null,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get("barcode");
  if (!barcode) return NextResponse.json({ error: "No barcode provided" }, { status: 400 });

  // Run all lookups in parallel for speed
  const [upc, food, beauty, products] = await Promise.all([
    tryUPCitemdb(barcode),
    tryOpenFacts("world.openfoodfacts.org", barcode),
    tryOpenFacts("world.openbeautyfacts.org", barcode),
    tryOpenFacts("world.openproductsfacts.org", barcode),
  ]);

  const result = upc || food || beauty || products;

  if (result) {
    return NextResponse.json({ ...result, barcode });
  }

  return NextResponse.json({ error: "Product not found in database" }, { status: 404 });
}
