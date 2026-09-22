"""Brand tokens and frame geometry for every Lompoc Locals video.

One place. Every format imports from here, so a palette change is one edit
instead of twenty-two.
"""

GOLD = "#efc618"
GREEN = "#0b992f"
PURPLE = "#650c75"
INK = "#241629"
BG = "#140a17"
CREAM = "#f2ead9"

FONT = "Plus Jakarta Sans"
FONT_WOFF2 = "public/fonts/plus-jakarta-sans-latin.woff2"
GSAP_CDN = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"

# 9:16 is the master. Every other shape is produced by re-rendering the
# composition at that size, never by cropping the 9:16 export: a caption safe
# zoned for a phone frame sits in the middle of a 16:9 letterbox.
SIZES = {
    "9x16": (1080, 1920),
    "4x5": (1080, 1350),
    "1x1": (1080, 1080),
    "16x9": (1920, 1080),
}

# Default scene crossfade, in seconds. Matches the hand-built generators.
X = 0.22

# Caption safe zone. Instagram's own UI covers the bottom ~18% of a Reel and
# TikTok covers ~22%, so burned-in text never goes below this line.
SAFE_BOTTOM_PCT = 24
SAFE_SIDE_PX = 84

# The caption band occupies roughly this much height starting at SAFE_BOTTOM_PCT,
# so a scene's own bottom-anchored text has to start above the sum of the two or
# the two text blocks collide. `hyperframes check` fails the render when they do.
CAPTION_BAND_PCT = 11
SCENE_BOTTOM_PCT = SAFE_BOTTOM_PCT + CAPTION_BAND_PCT

# How much of the bottom of the frame the host covers, by shape. A vertical feed
# video sits under a caption, an account name and a row of buttons; a square or
# landscape export is watched in a player with none of that, so its text can sit
# far lower. These are the numbers that make a master set look composed for each
# shape rather than squeezed out of the phone one.
_CHROME_PCT = {"9x16": 24, "4x5": 16, "1x1": 12, "16x9": 8}


def ratio_name(size) -> str:
    for name, wh in SIZES.items():
        if tuple(wh) == tuple(size):
            return name
    return "9x16"


def geom(size) -> dict:
    """Safe zones, margins and mark size for one frame shape.

    Everything positional in a format reads from here, so adding a shape to
    SIZES is all it takes for the next member spotlight to get that shape too.
    """
    w, h = size
    name = ratio_name(size)
    chrome = _CHROME_PCT.get(name, 24)
    band = CAPTION_BAND_PCT if h >= w else 10
    short = min(w, h)
    return {
        "name": name, "w": w, "h": h, "wide": w > h,
        "side": round(w * 0.078),              # side margin, proportional to width
        "safe_bottom_pct": chrome,
        "scene_bottom_pct": chrome + band,
        "mark_top": round(h * 0.078),
        "mark_w": round(short * 0.089),
        # Type is measured against the short edge, so a headline keeps its weight
        # in the frame whichever way round the frame is.
        "type": short / 1080.0,
    }

# Loudness target for the mastered file, in LUFS.
LUFS = -15.0

# How the town's name must be spelled for text-to-speech. Locals say LOM-poke;
# every engine tested says LOM-pock when given the real spelling.
TTS_RESPELL = {"Lompoc": "Lompoke"}


def for_tts(text: str) -> str:
    """Rewrite display text into something a TTS voice pronounces correctly."""
    for real, spoken in TTS_RESPELL.items():
        text = text.replace(real, spoken)
    return text


def venue_name(venue: str) -> str:
    """"Huyck Stadium, 515 W College Ave" -> "Huyck Stadium".

    The football table stores a full address and an away game stores
    "Paso Robles (away)". Neither belongs in a headline or a spoken line.
    """
    name = (venue or "").split(",")[0].strip()
    return name.replace("(away)", "").replace("(home)", "").strip() or "Lompoc"


def spoken_record(record: str, subject: str) -> str:
    """"4-0" -> "The Braves are 4 and 0." so a voice never reads the dash."""
    if not record:
        return ""
    parts = record.split("-")
    if len(parts) == 3:
        w, l, t = parts
        tie = "one tie" if t == "1" else f"{t} ties"
        return f"{subject} are {w} and {l}, with {tie}."
    if len(parts) == 2:
        return f"{subject} are {parts[0]} and {parts[1]}."
    return f"{subject} are {record}."


def spoken_url(url: str) -> str:
    """"lompoclocals.com/football" -> "Lompoke Locals dot com, slash football."

    A URL handed to a voice engine gets read character by character or skipped.
    Every spoken reference to the site has to go through here.
    """
    u = url.replace("https://", "").replace("http://", "").replace("www.", "").rstrip("/")
    host, _, path = u.partition("/")
    said = host.replace("lompoclocals.com", "Lompoke Locals dot com").replace(".com", " dot com")
    for part in [p for p in path.split("/") if p]:
        said += f", slash {part}"
    return said
