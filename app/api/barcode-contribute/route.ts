import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { barcode, name, brand, description, imageUrl } = await req.json();
    if (!barcode?.trim() || !name?.trim()) {
      return NextResponse.json({ error: "barcode and name are required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    await supabase.from("barcode_products").upsert(
      {
        barcode: barcode.trim(),
        name: name.trim(),
        brand: brand?.trim() || null,
        description: description?.trim() || null,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barcode", ignoreDuplicates: false }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
