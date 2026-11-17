"""Harmony Rentcar clean white/red Kakao preview, updated daily in Korea."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
now = datetime.now(ZoneInfo("Asia/Seoul"))
day = now.strftime("%Y-%m-%d")
weekday = "월화수목금토일"[now.weekday()]
date_label = f"{now.year}년 {now.month}월 {now.day}일 {weekday}요일"
fonts = [
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
]
font_file = next((p for p in fonts if Path(p).is_file()), None)
if not font_file:
    raise RuntimeError("Korean bold font not found; install fonts-nanum")
def font(n):
    return ImageFont.truetype(font_file, n)

# The Kakao recommended landscape aspect ratio: 1200 x 630.
im = Image.new("RGB", (1200, 630), "#ffffff")
d = ImageDraw.Draw(im)
navy, red, yellow = "#08162f", "#d60025", "#ffe300"

# Minimal white background with curved red corner accents.
d.polygon([(0,0),(220,0),(0,120)], fill="#d60025")
d.polygon([(0,0),(110,0),(0,60)], fill="#f60031")
d.polygon([(0,630),(0,565),(220,630)], fill="#d60025")
d.polygon([(1200,630),(1040,630),(1200,555)], fill="#d60025")
d.arc((-250,-125,550,330), 200, 275, fill="#e6e7eb", width=9)
d.arc((750,380,1460,880), 10, 85, fill="#e6e7eb", width=9)

# Simple brand wordmark and car roof line.
d.arc((455,0,745,100), 190, 340, fill=red, width=9)
d.text((600,83), "하모니렌트카", font=font(55), anchor="mm", fill=navy)
d.text((600,125), "Harmony Rentcar", font=font(20), anchor="mm", fill=navy)

# High-impact but uncluttered headline.
d.text((343,227), "신차·중고차", font=font(85), anchor="mm", fill=navy)
d.rounded_rectangle((661,170,1152,280), radius=24, fill="#c90023")
d.text((906,223), "리스트 현황", font=font(78), anchor="mm", fill=yellow)
d.text((600,320), "지금 바로 최신 재고를 확인하세요!", font=font(41), anchor="mm", fill=navy)

# Three readable navigation topics.
cards = [
    (44, 365, 406, 447, "✓  실시간 재고현황", "#ffdce4", "#900c1e"),
    (419, 365, 781, 447, "◇  차종별 리스트", "#fff0c1", "#763c0a"),
    (794, 365, 1156, 447, "◉  최신 프로모션", "#e9e1ff", "#44246d"),
]
for x1,y1,x2,y2,title,bg,fg in cards:
    d.rounded_rectangle((x1,y1,x2,y2),radius=30,fill=bg)
    d.text(((x1+x2)//2,(y1+y2)//2),title,font=font(31),anchor="mm",fill=fg)

# Call to action is artwork; actual navigation is the Kakao link preview.
d.rounded_rectangle((75,462,1125,548),radius=43,fill="#c50023")
d.rounded_rectangle((82,467,1118,537),radius=35,fill="#e6002c")
d.text((600,504),"하모니렌트카 재고현황 바로가기  ›",font=font(47),anchor="mm",fill="#ffffff")

# Date changes automatically each morning, without modifying other site content.
d.rounded_rectangle((335,558,865,615),radius=28,fill=navy)
d.text((600,587),date_label,font=font(34),anchor="mm",fill="#ffffff")

output = ROOT / "kakao-daily" / f"{day}.jpg"
output.parent.mkdir(parents=True,exist_ok=True)
im.save(output,quality=94,optimize=True)
print(f"Created {output} at 1200x630: {date_label}")
