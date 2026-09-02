#!/usr/bin/env python3
"""Trailer music via fal.ai (MiniMax Music).

Key from $FAL_KEY or gitignored tools/.fal_key; never printed, never committed — same handling as the
Retro Diffusion key in rd_capsule.py.

The trailer (store/steam/trailer/) is 61 seconds and silent. Its cut is deliberately paced for music: five
slow beats, then a nine-second sequence where the Family Record fills one generation at a time, then a
title card. The prompts below are written against THAT structure rather than as generic "epic trailer"
requests — a track that swells at 0:30 and lands at 0:42 fits the film; one that does not is unusable
however good it sounds.

Run with --dry-run (the default) to print the batch and its cost without spending anything.
Run with --go to actually generate.
"""
import argparse, json, os, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENDPOINT = "https://fal.run/fal-ai/minimax-music"
OUT = os.path.join(ROOT, "store", "steam", "trailer", "music")

# Three directions rather than three variations of one, so the choice is a real one.
PROMPTS = [
    ("terraces",
     "Slow-building instrumental for a football dynasty game trailer. Lone piano over a low string drone, "
     "sparse and unhurried for the first thirty seconds. A quiet timpani pulse enters at 0:30 and the "
     "strings climb in four clear steps, landing on a single sustained brass chord at 0:42. Falls back to "
     "solo piano for the last eight seconds. Restrained, melancholy, proud. No vocals, no drum kit, "
     "no electronic elements."),
    ("heirloom",
     "Instrumental chamber piece for a generational story trailer. Solo cello stating a simple four-note "
     "motif, joined one at a time by viola, violin and double bass so the texture thickens across the "
     "track. The motif repeats in each new voice — the same theme carried by different players. Warm, "
     "wooden, intimate rather than cinematic. Resolves quietly. No vocals, no percussion."),
    ("pixel-hymn",
     "Instrumental that begins as a sparse chiptune arpeggio — clean square wave, no drums — and is "
     "gradually taken over by real strings and a slow choir pad, so the electronic opening becomes an "
     "orchestral close. The handover happens across 0:28 to 0:45. Nostalgic, rising, unhurried. "
     "No vocals with words, no modern drums."),
]

def key():
    k = os.environ.get("FAL_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".fal_key"), os.path.expanduser("~/.fal_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set FAL_KEY or put it in tools/.fal_key")

def generate(k, name, prompt):
    body = json.dumps({"prompt": prompt}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, method="POST", headers={
        "Authorization": f"Key {k}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"{name}: HTTP {e.code} — {e.read().decode()[:300]}")
    url = (data.get("audio") or {}).get("url") or data.get("audio_url")
    if not url: sys.exit(f"{name}: no audio in response — {json.dumps(data)[:300]}")
    os.makedirs(OUT, exist_ok=True)
    dest = os.path.join(OUT, f"{name}.mp3")
    with urllib.request.urlopen(url, timeout=600) as r, open(dest, "wb") as f:
        f.write(r.read())
    print(f"  {name}.mp3  ({os.path.getsize(dest) // 1024} KB)")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--go", action="store_true", help="actually generate (default is a dry run)")
    ap.add_argument("--only", help="generate a single named direction")
    a = ap.parse_args()
    picks = [p for p in PROMPTS if not a.only or p[0] == a.only]
    if not picks: sys.exit(f"no direction named {a.only!r}")
    print(f"{len(picks)} track(s) via MiniMax Music on fal.ai — output to store/steam/trailer/music/\n")
    for name, prompt in picks:
        print(f"  [{name}]\n    {prompt[:150]}...\n")
    if not a.go:
        print("Dry run — nothing generated and nothing charged. Re-run with --go to generate.")
        return
    k = key()
    for name, prompt in picks:
        generate(k, name, prompt)

if __name__ == "__main__":
    main()
