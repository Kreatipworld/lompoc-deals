"""THE LOMPOC MORNING — the Monday "grab your coffee, here's your week" edition.

Owner (Sep 28 2026): a beginning-of-the-week video with the news and the things
coming to Lompoc, every Monday at 9:15, "be creative and change" — keep the
fresh direction of the Sunday lunch reel. So: a morning paper on a café table.
Cream newsprint, a masthead, headlines set like a front page, sticky notes,
a week-at-a-glance strip and football ticket stubs. Tactile and bright; no dark
field, no big yellow number.

    python3 _kit/make.py monday-paper --data @week.json --out out/<project> --vo out/<project>/public

Data contract (all copy passed in; photos only where the photo IS the subject):

    slug, date_line ("MONDAY · SEPT 28, 2026")
    assets   staged filename -> URL/path
    open     {say}
    stories  [ {kind:"lead"|"note", kicker, head, sub, photo?, badge?, say} ]
    week     {days:[{d:"WED", n:"30", items:["Trivia · Hangar 7"]}], say}
    friday   {tickets:[{team, line, when}], note:{head, sub}, say}
    weekend  {notes:[{head, sub}], say}
    end      {line, url, say}
"""
from .. import brand as B
from .. import scene as S
from ..compose import Audio, Scene, Sub, Video
from .member_spotlight import _media_src

PAPER = "#F4EDE0"
INK = "#231a24"


def _css(cid, size):
    s = f'[data-composition-id="{cid}"]'
    return f"""
      @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces.ttf") format("truetype"); font-weight:100 900; font-style:normal; }}
      @font-face {{ font-family:"Fraunces"; src:url("public/Fraunces-Italic.ttf") format("truetype"); font-weight:100 900; font-style:italic; }}
      {s} .vig, {s} .mark {{ display:none; }}
      {s} .grain {{ opacity:0.07; }}
      {s} .paper {{ position:absolute; inset:0; background:{PAPER}; }}
      {s} .tint {{ position:absolute; inset:0; background:radial-gradient(70% 40% at 90% 5%, #f7dcb0 0%, rgba(247,220,176,0) 60%), radial-gradient(60% 35% at 0% 95%, #e6efd9 0%, rgba(230,239,217,0) 60%); }}
      {s} .rule {{ position:absolute; left:70px; right:70px; height:4px; background:{INK}; }}
      {s} .thin {{ position:absolute; left:70px; right:70px; height:1.5px; background:{INK}; opacity:0.6; }}
      {s} .mast {{ position:absolute; left:60px; right:60px; text-align:center; font-family:"Fraunces", serif; font-weight:900; color:{INK}; letter-spacing:-3px; line-height:0.9; }}
      {s} .dateline {{ position:absolute; left:70px; right:70px; text-align:center; font-weight:800; letter-spacing:6px; font-size:26px; color:{INK}; }}
      {s} .kicker {{ position:absolute; left:84px; font-weight:800; letter-spacing:8px; font-size:28px; color:{B.GREEN}; text-transform:uppercase; }}
      {s} .head {{ position:absolute; left:80px; right:80px; font-family:"Fraunces", serif; font-weight:900; color:{INK}; letter-spacing:-4px; line-height:0.95; }}
      {s} .sub {{ position:absolute; left:84px; right:90px; font-size:40px; font-weight:600; line-height:1.25; color:#4d3f50; }}
      {s} .print {{ position:absolute; border:12px solid #fff; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 26px 60px rgba(40,20,40,0.25); }}
      {s} .print img {{ width:100%; height:100%; object-fit:cover; display:block; }}
      {s} .badge {{ position:absolute; width:210px; height:210px; object-fit:contain; filter:drop-shadow(0 16px 26px rgba(0,0,0,0.3)); }}
      {s} .note {{ position:absolute; background:#FBE38B; padding:40px 44px; box-shadow:0 22px 44px rgba(60,40,0,0.22); }}
      {s} .note.pink {{ background:#F8C9D4; }} {s} .note.green {{ background:#CFE8C6; }} {s} .note.blue {{ background:#CFE0F5; }}
      {s} .nh {{ font-family:"Fraunces", serif; font-weight:800; font-size:64px; line-height:1.1; letter-spacing:-2px; color:{INK}; }}
      {s} .ns {{ margin-top:22px; font-size:34px; font-weight:700; color:#4d3f50; line-height:1.25; }}
      {s} .tape {{ position:absolute; left:50%; top:-22px; width:170px; height:46px; margin-left:-85px; background:rgba(255,255,255,0.6); transform:rotate(-3deg); }}
      {s} .days {{ position:absolute; left:60px; right:60px; top:420px; display:grid; grid-template-columns:repeat(2, 1fr); gap:22px; }}
      {s} .day {{ background:#fff; border-radius:22px; padding:24px 28px; min-height:196px; box-shadow:0 12px 28px rgba(40,20,40,0.10); }}
      {s} .day .dd {{ font-weight:800; letter-spacing:5px; font-size:26px; color:{B.GREEN}; }}
      {s} .day .dn {{ font-family:"Fraunces", serif; font-weight:900; font-size:58px; color:{B.PURPLE}; line-height:1; }}
      {s} .day .di {{ margin-top:10px; font-size:30px; font-weight:700; color:{INK}; line-height:1.25; }}
      {s} .ticket {{ position:absolute; left:80px; right:80px; height:230px; background:#fff; border-radius:26px; display:flex; box-shadow:0 20px 46px rgba(40,20,40,0.18); overflow:hidden; }}
      {s} .ticket .stub {{ width:230px; display:flex; align-items:center; justify-content:center; border-right:5px dashed #e7dccb; }}
      {s} .ticket .stub img {{ width:170px; height:170px; object-fit:contain; }}
      {s} .ticket .body {{ padding:30px 36px; display:flex; flex-direction:column; justify-content:center; }}
      {s} .ticket .team {{ font-weight:800; letter-spacing:6px; font-size:28px; color:{B.GREEN}; }}
      {s} .ticket .line {{ font-family:"Fraunces", serif; font-weight:900; font-size:62px; color:{INK}; letter-spacing:-2px; line-height:1; margin-top:6px; }}
      {s} .ticket .when {{ font-size:32px; font-weight:700; color:#5b4b5e; margin-top:10px; }}
      {s} .cup {{ position:absolute; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle at 50% 50%, #6b3f25 0 44%, #a0714f 45% 50%, #fff 51% 64%, #efe6d6 65% 100%); box-shadow:0 30px 60px rgba(40,20,20,0.3); }}
      {s} .ring {{ position:absolute; width:340px; height:340px; border-radius:50%; border:10px solid rgba(120,80,50,0.18); }}
      {s} .pill {{ display:inline-block; background:{B.PURPLE}; color:#fff; font-weight:800; font-size:46px; padding:24px 44px; border-radius:999px; }}
      {s} .logo {{ position:absolute; width:200px; height:auto; }}
    """


def build(d):
    assets = dict(d.get("assets") or {})
    scenes, subs = [], []

    def src(k):
        return _media_src(assets, k)[0]

    def styled(html):
        return lambda cid, dur, size: f"<style>{_css(cid, size)}</style>\n      " + html(cid, dur, size)

    def add(cid, dur, html, js, say):
        scenes.append(Scene(cid, 0.0, dur, styled(html), js, lines=(len(subs),)))
        subs.append(Sub(0.0, dur, say, say=say))

    base = '<div class="paper"></div><div class="tint"></div>'

    # s0 — the masthead. Frame 0 is the thumbnail, so it is composed at t=0.
    def open_html(cid, dur, size):
        return (f'{base}<div class="rule" style="top:190px"></div>'
                f'<div class="mast" style="top:220px; font-size:150px">The Lompoc<br>Morning</div>'
                f'<div class="thin" style="top:520px"></div><div class="dateline" style="top:540px">{d["date_line"]}</div><div class="thin" style="top:590px"></div>'
                f'<div class="head" style="top:680px; font-size:120px; text-align:left">Grab your<br><span style="color:{B.PURPLE}; font-style:italic; font-weight:600">coffee.</span></div>'
                f'<div class="sub" style="top:960px">Here\'s your week in Lompoc.</div>'
                f'<div class="ring" style="left:640px; top:1080px"></div><div class="cup" id="{cid}-c" style="left:660px; top:1100px"></div>'
                f'<img class="logo" src="{src("logo")}" style="left:84px; top:1110px" />')
    def open_js(cid, dur, size=None):
        return f'tl.to("#{cid}-c", {{ rotation:14, duration:{dur:.2f}, ease:"none" }}, 0);'
    add("s0-mast", 3.2, open_html, open_js, d["open"]["say"])

    # stories — a lead with a print, or a sticky note
    for i, st in enumerate(d["stories"]):
        def st_html(cid, dur, size, st=st, i=i):
            h = f'{base}<div class="rule" style="top:130px"></div><div class="dateline" style="top:150px; font-size:22px">THE LOMPOC MORNING · {d["date_line"]}</div><div class="thin" style="top:196px"></div>'
            h += f'<div class="kicker" id="{cid}-k" style="top:250px">{st["kicker"]}</div>'
            if st["kind"] == "lead":
                h += (f'<div class="head" id="{cid}-h" style="top:300px; font-size:{st.get("size", 128)}px">{st["head"]}</div>'
                      f'<div class="sub" id="{cid}-s" style="top:{st.get("sub_top", 560)}px">{st["sub"]}</div>')
                if st.get("photo"):
                    h += f'<div class="print" id="{cid}-p" style="left:90px; right:90px; top:{st.get("photo_top", 780)}px; height:520px; transform:rotate({-1.6 if i % 2 else 1.4}deg)"><img id="{cid}-im" src="{src(st["photo"])}" /></div>'
                if st.get("badge"):
                    h += f'<img class="badge" id="{cid}-b" src="{src(st["badge"])}" style="right:70px; top:{st.get("photo_top", 780) + 400}px" />'
            else:
                h += (f'<div class="note {st.get("color", "")}" id="{cid}-n" style="left:110px; right:110px; top:420px; transform:rotate(-2.5deg)">'
                      f'<div class="tape"></div><div class="nh" style="font-size:96px">{st["head"]}</div><div class="ns" style="font-size:44px">{st["sub"]}</div></div>')
            return h
        def st_js(cid, dur, size=None, st=st):
            if st["kind"] == "lead":
                out = S.rise(cid, "k", 0.05, dy=12, dur=0.35) + S.rise(cid, "h", 0.15, dy=30, dur=0.5) + S.rise(cid, "s", 0.45, dy=14, dur=0.4)
                if st.get("photo"):
                    out += (f'tl.fromTo("#{cid}-p", {{ autoAlpha:0, y:80, rotation:6 }}, {{ autoAlpha:1, y:0, rotation:{-1.6 if int(cid[1]) % 2 == 0 else 1.4}, duration:0.6, ease:"expo.out" }}, 0.35);'
                            f'tl.fromTo("#{cid}-im", {{ scale:1.0 }}, {{ scale:1.07, duration:{dur:.2f}, ease:"none" }}, 0);')
                if st.get("badge"):
                    out += S.pop(cid, "b", 0.7, scale=1.5, dur=0.45)
                return out
            return S.rise(cid, "k", 0.05, dy=12, dur=0.35) + (f'tl.fromTo("#{cid}-n", {{ autoAlpha:0, y:-120, rotation:-10 }}, {{ autoAlpha:1, y:0, rotation:-2.5, duration:0.7, ease:"back.out(1.6)" }}, 0.15);')
        add(f"s{i + 1}-story", 4.0, st_html, st_js, st["say"])

    n0 = len(d["stories"]) + 1

    # week at a glance
    w = d["week"]
    def week_html(cid, dur, size):
        tiles = "".join(f'<div class="day" id="{cid}-d{k}" style="opacity:0"><div class="dd">{x["d"]}</div><div class="dn">{x["n"]}</div><div class="di">{"<br>".join(x["items"])}</div></div>'
                        for k, x in enumerate(w["days"]))
        return (f'{base}<div class="kicker" style="top:250px">This week</div>'
                f'<div class="head" style="top:300px; font-size:96px">Coming up</div><div class="days">{tiles}</div>')
    def week_js(cid, dur, size=None):
        return "".join(f'tl.fromTo("#{cid}-d{k}", {{ autoAlpha:0, y:40, scale:0.96 }}, {{ autoAlpha:1, y:0, scale:1, duration:0.45, ease:"expo.out" }}, {0.15 + 0.18 * k:.2f});' for k in range(len(w["days"])))
    add(f"s{n0}-week", 5.0, week_html, week_js, w["say"])

    # friday: tickets + a note
    f = d["friday"]
    def fri_html(cid, dur, size):
        h = f'{base}<div class="kicker" style="top:250px">Friday</div><div class="head" style="top:300px; font-size:110px">Game night.</div>'
        for k, t in enumerate(f["tickets"]):
            h += (f'<div class="ticket" id="{cid}-t{k}" style="top:{470 + k * 260}px; opacity:0"><div class="stub"><img src="{src(t["badge"])}" /></div>'
                  f'<div class="body"><div class="team">{t["team"]}</div><div class="line">{t["line"]}</div><div class="when">{t["when"]}</div></div></div>')
        n = f["note"]
        h += (f'<div class="note pink" id="{cid}-n" style="left:150px; right:150px; top:1020px; transform:rotate(2deg); opacity:0"><div class="tape"></div>'
              f'<div class="nh">{n["head"]}</div><div class="ns">{n["sub"]}</div></div>')
        return h
    def fri_js(cid, dur, size=None):
        out = "".join(f'tl.fromTo("#{cid}-t{k}", {{ autoAlpha:0, x:{-140 if k % 2 == 0 else 140} }}, {{ autoAlpha:1, x:0, duration:0.55, ease:"expo.out" }}, {0.2 + 0.25 * k:.2f});' for k in range(len(f["tickets"])))
        return out + f'tl.fromTo("#{cid}-n", {{ autoAlpha:0, y:-100, rotation:10 }}, {{ autoAlpha:1, y:0, rotation:2, duration:0.7, ease:"back.out(1.6)" }}, 0.9);'
    add(f"s{n0 + 1}-friday", 4.6, fri_html, fri_js, f["say"])

    # weekend notes
    we = d["weekend"]
    def we_html(cid, dur, size):
        h = f'{base}<div class="kicker" style="top:250px">This weekend</div><div class="head" style="top:300px; font-size:110px">Out &amp; about</div>'
        colors = ["", "green", "blue"]
        rots = [-3, 2.5, -1.5]
        for k, n in enumerate(we["notes"]):
            h += (f'<div class="note {colors[k % 3]}" id="{cid}-n{k}" style="left:{110 if k % 2 == 0 else 190}px; right:{190 if k % 2 == 0 else 110}px; top:{470 + k * 290}px; transform:rotate({rots[k % 3]}deg); opacity:0">'
                  f'<div class="tape"></div><div class="nh">{n["head"]}</div><div class="ns">{n["sub"]}</div></div>')
        return h
    def we_js(cid, dur, size=None):
        return "".join(f'tl.fromTo("#{cid}-n{k}", {{ autoAlpha:0, y:-90, rotation:{-10 if k % 2 == 0 else 10} }}, {{ autoAlpha:1, y:0, rotation:{[-3, 2.5, -1.5][k % 3]}, duration:0.6, ease:"back.out(1.6)" }}, {0.15 + 0.3 * k:.2f});' for k in range(len(we["notes"])))
    add(f"s{n0 + 2}-weekend", 4.6, we_html, we_js, we["say"])

    # sign-off
    e = d["end"]
    def end_html(cid, dur, size):
        return (f'{base}<div class="ring" id="{cid}-r" style="left:370px; top:260px; opacity:0"></div>'
                f'<div class="head" id="{cid}-h" style="top:700px; font-size:112px; text-align:center; opacity:0">{e["line"]}</div>'
                f'<div id="{cid}-u" style="position:absolute; left:0; right:0; top:1010px; text-align:center; opacity:0"><span class="pill">{e["url"]}</span></div>'
                f'<img class="logo" src="{src("logo")}" style="left:440px; top:1200px" />')
    def end_js(cid, dur, size=None):
        return S.pop(cid, "r", 0.05, scale=1.3, dur=0.6) + S.rise(cid, "h", 0.3, dy=26, dur=0.5) + S.pop(cid, "u", 0.7, scale=1.12, dur=0.45)
    add(f"s{n0 + 3}-end", 3.4, end_html, end_js, e["say"])

    at = 0.0
    for sc in scenes:
        sc.start = round(at, 2); at = round(at + sc.dur - B.X, 2)
    total = round(scenes[-1].start + scenes[-1].dur, 2)
    return Video(slug=d["slug"], title="THE LOMPOC MORNING", total=total, size=B.SIZES["9x16"], scenes=scenes, subs=subs,
                 vo_lines=[B.for_tts(x.spoken) for x in subs], assets=assets, captions=False,
                 audio=[Audio("public/vo.wav", "voiceover", 0.0, total, volume=0.80, fade_in=0.05, fade_out=0.2),
                        Audio("public/bed.wav", "music", 0.0, total, volume=0.20, fade_in=0.2, fade_out=1.2)],
                 note="Monday paper look. Photos only where they are the subject. No captions; bed 0.20.")
