import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Cache exchange rates for 1 hour in DB
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const base = searchParams.get("base")?.toUpperCase();
  const target = searchParams.get("target")?.toUpperCase();

  if (!base || !target) {
    return NextResponse.json({ error: "Missing base or target" }, { status: 400 });
  }

  if (base === target) {
    return NextResponse.json({ rate: 1 });
  }

  const supabase = createServiceClient();

  // Check cache (< 1 hour old)
  const { data: cached } = await supabase
    .from("exchange_rate_cache")
    .select("rate, fetched_at")
    .eq("base_currency", base)
    .eq("target_currency", target)
    .single();

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < 3600000) {
      return NextResponse.json({ rate: cached.rate });
    }
  }

  // Fetch from Frankfurter API (free, no key needed)
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${target}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const rate = data.rates?.[target];

    if (!rate) {
      return NextResponse.json({ error: "Currency not supported" }, { status: 400 });
    }

    // Upsert cache
    await supabase.from("exchange_rate_cache").upsert({
      base_currency: base,
      target_currency: target,
      rate,
      fetched_at: new Date().toISOString(),
    }, { onConflict: "base_currency,target_currency" });

    return NextResponse.json({ rate });
  } catch {
    return NextResponse.json({ error: "Failed to fetch rate" }, { status: 500 });
  }
}
