import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface IncomingPost {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
}

export async function POST(request: NextRequest) {
  const { posts } = (await request.json()) as { posts: IncomingPost[] };

  if (!posts?.length) {
    return NextResponse.json({ results: [] });
  }

  const results = await Promise.all(
    posts.map(async (post) => {
      const imgUrl = post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;

      const content: Anthropic.MessageParam["content"] = [];

      if (imgUrl) {
        content.push({
          type: "image",
          source: { type: "url", url: imgUrl },
        });
      }

      const captionText = post.caption
        ? `Instagram caption:\n"${post.caption}"`
        : "No caption provided — extract product info from the image only.";

      content.push({
        type: "text",
        text: `You are extracting product information from an Instagram post for a small business.

${captionText}

Return a JSON object with these fields:
- "name": concise product name (string, max 60 chars, required)
- "selling_price": numeric price if mentioned in caption or visible on image, otherwise null
- "description": clean 1-2 sentence product description suitable for an online store (string)

Rules:
- Remove hashtags, @mentions, emojis, and promotional filler from descriptions
- Extract currency-stripped number for price (e.g. "₦5,000" → 5000)
- If price range, use the lower bound
- Return raw JSON only, no markdown`,
      });

      try {
        const msg = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content }],
        });

        const text = (msg.content[0] as { type: "text"; text: string }).text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? text);

        return {
          id: post.id,
          name: String(parsed.name ?? "").trim(),
          selling_price: parsed.selling_price != null ? Number(parsed.selling_price) : null,
          description: String(parsed.description ?? "").trim(),
        };
      } catch {
        return { id: post.id, name: "", selling_price: null, description: "" };
      }
    })
  );

  return NextResponse.json({ results });
}
