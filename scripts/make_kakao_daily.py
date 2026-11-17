"""Generate a bold, mobile-readable 1200x630 Kakao preview each day (KST)."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
now = datetime.now(ZoneInfo("Asia/Seoul"))
day = now.strftime("%Y-%m-%d")
weekday = "월화수목금토일"[now.weekday()]
date_label = f"{now.year}년 {now.month}월 {now.day}일 {weekday}요일"

font_candidates = [
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
]
font_path = next((p for p in font_candidates if Path(p).is_file()), None)
if not font_path:
    raise RuntimeError("Korean bold font missing (install fonts-nanum)")
def font(size):
    return ImageFont.truetype(font_path, size)

W, H = 1200, 630
im = Image.new("RGB", (W, H), "#ffffff")
d = ImageDraw.Draw(im)
red = "#d80935"
navy = "#091d43"
ink = "#271014"
yellow = "#ffe61b"

# Clean, high-contrast backdrop; safe margins for link-card cropping.
d.polygon([(0, 0), (330, 0), (0, 165)], fill="#ffe2e8")
d.polygon([(0, 0), (210, 0), (0, 105)], fill="#ff9ab0")
d.polygon([(1200, 630), (835, 630), (1200, 455)], fill="#ffe1e8")
d.polygon([(1200, 630), (985, 630), (1200, 525)], fill="#ff7c9b")

# Brand header.
d.arc((465, 6, 745, 80), 194, 345, fill=red, width=12)
d.text((600, 83), "하모니렌트카", font=font(55), fill="#141414", anchor="mm")
d.text((600, 125), "Harmony Rentcar", font=font(22), fill="#333333", anchor="mm")

# Main message: large enough to remain legible in a compact Kakao card.
d.text((360, 222), "신차·중고차", font=font(91), fill=ink, anchor="mm")
d.rounded_rectangle((660, 165, 1137, 280), radius=24, fill="#bd0629")
d.text((898, 220), "리스트 현황", font=font(82), fill=yellow, anchor="mm")
d.text((600, 316), "지금 바로 최신 재고를 확인하세요!", font=font(41), fill="#141414", anchor="mm")

# Three feature blocks.
features = [
    (55, 365, 405, 455, "✓ 실시간 재고현황", "#ffd1dc", "#84001d"),
    (425, 365, 775, 455, "◆ 차종별 리스트", "#fff0c2", "#6a3500"),
    (795, 365, 1145, 455, "★ 최신 프로모션", "#e8dcff", "#4d217d"),
]
for x1, y1, x2, y2, label, bg, fg in features:
    d.rounded_rectangle((x1, y1, x2, y2), radius=26, fill=bg)
    d.text(((x1+x2)//2, (y1+y2)//2), label, font=font(32), fill=fg, anchor="mm")

# Prominent call to action, within the artwork (not an actual clickable control).
d.rounded_rectangle((65, 475, 1135, 566), radius=45, fill="#b6002b")
d.rounded_rectangle((73, 482, 1127, 550), radius=35, fill=red)
d.text((600, 520), "하모니렌트카 재고현황 바로가기  ›", font=font(49), fill="#ffffff", anchor="mm")

# Automatically refreshed Korean date, large and distinct.
d.rounded_rectangle((335, 566, 865, 621), radius=24, fill=navy)
d.text((600, 594), date_label, font=font(34), fill="#ffffff", anchor="mm")

out = ROOT / "kakao-daily" / f"{day}.jpg"
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, quality=95, optimize=True)
print(f"Created {out}: {date_label} ({W}x{H})")
