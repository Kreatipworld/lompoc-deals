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

# 9:16 is the master. 4:5 is produced by re-rendering with SIZES["4x5"].
SIZES = {"9x16": (1080, 1920), "4x5": (1080, 1350)}

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
