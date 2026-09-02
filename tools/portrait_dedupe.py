#!/usr/bin/env python3
"""Find near-duplicate portraits.

Distinct prompts and distinct seeds make duplicates unlikely, not impossible, and a pool that contains
twins undoes the point of enlarging it.

THE METRIC MATTERS AND THE OBVIOUS ONE IS WRONG. Average-hash — the usual choice — flagged 176 of 656 pairs
in the existing hand-picked library. Every portrait here is a head and shoulders on a plain ground, so an
ahash mostly measures the shared silhouette and calls them all alike. What actually distinguishes these
faces at 64x64 is COLOUR: skin tone, hair colour, shirt. So the signature is a 16x16 RGB thumbnail and the
distance is mean per-channel absolute difference.

Calibrated against the existing library rather than guessed: across its 276 prime pairs the closest
GENUINE pair sits at 13.4, the 5th percentile at 19.8 and the median at 35.2. A cutoff of 12 therefore sits
just below anything the shipped art considers distinct.

Compared WITHIN a band only. The same identity is deliberately generated three times across youth/prime/
veteran and those SHOULD look alike — flagging them would be flagging the feature.

Run:  python3 tools/portrait_dedupe.py [dir] [--cutoff N] [--delete]
"""
import argparse, itertools, os, sys
from PIL import Image

# CROP TO THE FACE. Comparing whole frames measures what these images have in COMMON — the dark ground and
# the blue-ish shirt every portrait wears — which drags genuinely different men together. Cropping to the
# central face box pushes the distribution apart (median 22.4 -> 28.8, closest pair 4.6 -> 9.0 across 120
# generated youths) and is what the comparison is supposed to be about anyway.
FACE_BOX = (14, 8, 50, 44)   # in 64x64 source pixels

def signature(path, n=16):
    im = Image.open(path).convert('RGB')
    if im.size == (64, 64): im = im.crop(FACE_BOX)
    return list(im.resize((n, n), Image.LANCZOS).getdata())

def distance(a, b):
    return sum(abs(p[0]-q[0]) + abs(p[1]-q[1]) + abs(p[2]-q[2]) for p, q in zip(a, b)) / (len(a) * 3)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir", nargs="?", default="client/public/portraits")
    # CALIBRATED TWICE, BOTH TIMES BY LOOKING. Average-hash flagged 176 of 656 pairs in the hand-picked
    # library, because every portrait is a head on a plain ground and an ahash mostly sees that shared
    # silhouette. Switching to colour and taking the shipped library's closest pair (13.4) as the floor gave
    # a cutoff of 12 — which then flagged 712 of 13,041 generated pairs. Rendering the three tightest of
    # those settled it: at distance 9.0 they are still visibly different men. So the generated set simply
    # has no duplicates, and a cutoff at 6 catches only near-copies rather than "two young men with dark
    # hair". A metric nobody has eyeballed is a metric that invents work.
    ap.add_argument("--cutoff", type=float, default=6.0,
                    help="face-crop colour distance below which two portraits are the same person "
                         "(default 6; the closest genuine pair observed across 7,140 generated pairs is 9.0)")
    ap.add_argument("--delete", action="store_true", help="remove the later file of each flagged pair")
    a = ap.parse_args()

    by_band = {}
    for f in sorted(os.listdir(a.dir)):
        if f.endswith(".png") and f.startswith("portrait-"):
            by_band.setdefault(f.split("-")[1], []).append(f)

    flagged = compared = 0
    for band, files in sorted(by_band.items()):
        sigs = {f: signature(os.path.join(a.dir, f)) for f in files}
        removed = set()
        for x, y in itertools.combinations(files, 2):
            if x in removed or y in removed: continue
            compared += 1
            d = distance(sigs[x], sigs[y])
            if d < a.cutoff:
                flagged += 1
                print(f"  {band}: {x}  ==  {y}   (distance {d:.1f})")
                if a.delete:
                    try:
                        os.remove(os.path.join(a.dir, y)); removed.add(y)
                        print(f"    removed {y}")
                    except OSError: pass
        print(f"  {band}: {len(files)} portraits, {len(files)*(len(files)-1)//2} pairs")
    print(f"\n{'✗' if flagged else '✓'} {flagged} near-duplicate pair(s) across {compared} comparisons "
          f"(cutoff {a.cutoff})")
    if flagged and not a.delete: print("Re-run with --delete to drop the later file of each pair.")
    return 1 if flagged else 0

if __name__ == "__main__":
    sys.exit(main())
