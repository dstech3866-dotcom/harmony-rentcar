// Render current OG image URL into HTML for Kakao/Facebook crawlers.
const BASE = "https://gaygechqnvehajmsnvfb.supabase.co/storage/v1/object/public/gallery/";
const META = BASE + "inventory/kakao-preview.json";
export default async (request: Request, context: any) => {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") || response.status !== 200) return response;
  let html = await response.text();
  try {
    const freshMeta = META + "?refresh=" + Date.now();
    const r = await fetch(freshMeta, { cache: "no-store", headers: { "cache-control": "no-cache, no-store", "pragma": "no-cache" } });
    if (r.ok) {
      const doc = await r.json();
      if (typeof doc.image === "string" && /^inventory\/kakao-preview\/[0-9]+\.jpg$/.test(doc.image)) {
        const url = BASE + doc.image;
        html = html.replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/, (_m: string,a: string,b: string) => a + url + b);
        html = html.replace(/(<meta\s+name="twitter:card"[^>]*>)/, `<meta name="twitter:image" content="${url}">$1`);
      }
    }
  } catch (_) { /* retain original static OG image if storage is unavailable */ }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store, max-age=0");
  return new Response(html, { status: response.status, headers });
};
export const config = { path: "/" };
