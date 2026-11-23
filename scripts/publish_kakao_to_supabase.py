"""Upload validated dated Kakao JPEGs to Supabase public gallery without Git commits."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import os

ROOT = Path(__file__).resolve().parents[1]
URL = "https://gaygechqnvehajmsnvfb.supabase.co"
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TODAY = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")

for folder in ("kakao-daily", "kakao-vertical-daily"):
    for name in (f"{TODAY}.jpg", "latest.jpg"):
        source = ROOT / folder / name
        if not source.is_file():
            raise FileNotFoundError(source)
        dest = f"inventory/{folder}/{name}"
        req = Request(
            f"{URL}/storage/v1/object/gallery/{dest}",
            data=source.read_bytes(),
            method="POST",
            headers={
                "Authorization": f"Bearer {KEY}",
                "apikey": KEY,
                "Content-Type": "image/jpeg",
                "x-upsert": "true",
                "Cache-Control": "no-cache",
            },
        )
        try:
            with urlopen(req, timeout=45) as response:
                print(f"Uploaded {dest}: HTTP {response.status}")
        except HTTPError as exc:
            raise RuntimeError(f"Upload failed for {dest}: HTTP {exc.code}, {exc.read()[:300]!r}") from exc
