import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface ProductResult {
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
}

async function tryLocalDB(barcode: string): Promise<ProductResult | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("barcode_products")
      .select("name, brand, description, image_url")
      .eq("barcode", barcode)
      .single();
    if (!data) return null;
    return {
      name: data.name,
      brand: data.brand,
      description: data.description,
      imageUrl: data.image_url,
    };
  } catch {
    return null;
  }
}

async function saveToLocalDB(barcode: string, result: ProductResult) {
  try {
    const supabase = createServiceClient();
    await supabase.from("barcode_products").upsert(
      {
        barcode,
        name: result.name,
        brand: result.brand,
        description: result.description,
        image_url: result.imageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barcode", ignoreDuplicates: false }
    );
  } catch {}
}

async function tryOpenFacts(domain: string, barcode: string): Promise<ProductResult | null> {
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
    if (!name?.trim()) return null;
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

async function tryUPCitemdb(barcode: string): Promise<ProductResult | null> {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "OK" || !data.items?.length) return null;
    const item = data.items[0];
    if (!item.title?.trim()) return null;
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

  // 1. Check local DB first — fastest, covers local/regional products
  const local = await tryLocalDB(barcode);
  if (local) {
    return NextResponse.json({ ...local, barcode, source: "local" });
  }

  // 2. Try all external databases in parallel
  const [upc, food, beauty, products] = await Promise.all([
    tryUPCitemdb(barcode),
    tryOpenFacts("world.openfoodfacts.org", barcode),
    tryOpenFacts("world.openbeautyfacts.org", barcode),
    tryOpenFacts("world.openproductsfacts.org", barcode),
  ]);

  const external = upc || food || beauty || products;

  if (external) {
    // Save to local DB so future lookups are instant
    await saveToLocalDB(barcode, external);
    return NextResponse.json({ ...external, barcode, source: "external" });
  }

  return NextResponse.json({ error: "Product not found in database" }, { status: 404 });
}
