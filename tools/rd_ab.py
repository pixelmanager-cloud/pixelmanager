#!/usr/bin/env python3
"""A/B quality test for portraits: same prompt+seed across 3 styles, compare the SHIPPED (downscaled) result.
Columns: rd_fast__default (current) | rd_fast__portrait (same price) | rd_plus__default (2x). Writes a
labelled side-by-side sheet to /tmp/portrait_ab.png. Nothing is saved into the game — this is a comparison only."""
import os, sys, json, base64, io, time, urllib.request
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location("rp", os.path.join(os.path.dirname(os.path.abspath(__file__)), "rd_portraits.py"))
rp = importlib.util.module_from_spec(spec); spec.loader.exec_module(rp)

ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
GEN, FINAL = 64, 48
SUBJECTS = [("prime", 0), ("prime", 7), ("youth", 3), ("veteran", 5)]
STYLES = ["rd_fast__default", "rd_fast__portrait", "rd_plus__default"]

def request(key, prompt, seed, style, retries=4):
    body = json.dumps({"prompt": prompt, "prompt_style": style, "width": GEN, "height": GEN,
                       "num_images": 1, "seed": seed, "remove_bg": True}).encode()
    last = None
    for a in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                         headers={"X-RD-Token": key, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as r:
                res = json.loads(r.read())
            if res.get("base64_images"): return res
            last = res.get("error", res)
        except Exception as e:
            last = e
        time.sleep(2 + a * 2)
    raise RuntimeError(f"failed: {last}")

def main():
    key = rp.api_key()
    view = 144  # 48px shipped result shown at 3x nearest-neighbour
    cellw, pad, hdr, lbl = view, 10, 16, 12
    sheet = Image.new("RGB", (len(STYLES) * (cellw + pad) + pad + 70, len(SUBJECTS) * (view + pad) + pad + hdr), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 11)
        fsm = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 9)
    except Exception:
        font = fsm = ImageFont.load_default()
    for c, style in enumerate(STYLES):
        d.text((70 + pad + c * (cellw + pad), 2), style, fill=(230, 230, 120), font=font)
    for r, (band, i) in enumerate(SUBJECTS):
        prompt = rp.band_desc(band, i); seed = rp.SEED0[band] + i * 17
        y = hdr + pad + r * (view + pad)
        d.text((6, y + view // 2), f"{band}-{i}", fill=(210, 210, 215), font=fsm)
        for c, style in enumerate(STYLES):
            try:
                res = request(key, prompt, seed, style)
                im = Image.open(io.BytesIO(base64.b64decode(res["base64_images"][0])))
                ship = rp.pixelate(im).resize((view, view), Image.NEAREST)  # final 48px shown at 3x
                x = 70 + pad + c * (cellw + pad)
                sheet.paste(ship, (x, y), ship)
                print(f"  {band}-{i} / {style}  (balance {res.get('remaining_balance')})")
            except Exception as e:
                print(f"  {band}-{i} / {style} ERROR:", e)
    sheet.save("/tmp/portrait_ab.png")
    print("sheet -> /tmp/portrait_ab.png")

if __name__ == "__main__":
    main()
