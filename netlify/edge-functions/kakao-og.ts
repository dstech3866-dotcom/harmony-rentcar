const BASE = "https://gaygechqnvehajmsnvfb.supabase.co/storage/v1/object/public/gallery/";
const META = BASE + "inventory/kakao-preview.json";

export default async (request: Request, context: any) => {
  const response = await context.next();
  const type = response.headers.get("content-type") || "";

  if (!type.includes("text/html") || response.status !== 200) {
    return response;
  }

  let html = await response.text();
  let imageUrl = "";

  // 1. 한국시간 기준 날짜
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  // 2. 오늘 생성된 이미지 확인
  const dailyUrl =
    new URL(`/kakao-daily/${today}.jpg`, request.url).href;

  try {
    const check = await fetch(dailyUrl, {
      method: "HEAD",
      cache: "no-store"
    });

    if (check.ok &&
        (check.headers.get("content-type") || "")
          .startsWith("image/")) {
      imageUrl = dailyUrl;
    }
  } catch (_) {}

  // 3. 오늘 이미지가 없으면 기존 Supabase 이미지 사용
  if (!imageUrl) {
    try {
      const r = await fetch(
        META + "?refresh=" + Date.now(),
        { cache: "no-store" }
      );

      if (r.ok) {
        const doc = await r.json();

        if (
          typeof doc.image === "string" &&
          /^inventory\/kakao-preview\/[0-9]+\.jpg$/.test(doc.image)
        ) {
          imageUrl = BASE + doc.image;
        }
      }
    } catch (_) {}
  }

  // 4. 카카오톡 및 기타 SNS 미리보기 이미지 변경
  if (imageUrl) {
    html = html.replace(
      /(<meta\s+property="og:image"\s+content=")[^"]*(")/,
      (_m, a, b) => a + imageUrl + b
    );

    html = html.replace(
      /<meta\s+name="twitter:image"[^>]*>/g,
      ""
    );

    html = html.replace(
      /(<meta\s+name="twitter:card"[^>]*>)/,
      `<meta name="twitter:image" content="${imageUrl}">$1`
    );
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store, max-age=0");

  return new Response(html, {
    status: response.status,
    headers
  });
};

export const config = { path: "/" };
