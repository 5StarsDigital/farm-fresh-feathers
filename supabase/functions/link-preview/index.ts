// Deno Edge Function: Fetch basic Open Graph preview for a URL
// - Input: { url: string }
// - Output: { image?: string; title?: string; description?: string }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

function normalizeUrl(u: string) {
  try {
    if (!/^https?:\/\//i.test(u)) return new URL(`https://${u}`).href;
    return new URL(u).href;
  } catch {
    return "";
  }
}

function extractMeta(html: string, prop: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(re)?.[1] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  try {
    const { url } = await req.json();
    const href = normalizeUrl(String(url || ""));
    if (!href) return new Response(JSON.stringify({ error: "Invalid url" }), { status: 400, headers });

    const res = await fetch(href, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const html = await res.text();

    let image = extractMeta(html, "og:image") || extractMeta(html, "twitter:image") || null;
    const title = extractMeta(html, "og:title") || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || null;
    const description = extractMeta(html, "og:description") || extractMeta(html, "description") || null;

    if (image) {
      try {
        image = new URL(image, href).href;
      } catch {
        // ignore
      }
    }

    return new Response(JSON.stringify({ image, title, description }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
