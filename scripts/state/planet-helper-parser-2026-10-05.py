import re, json, os, time
from fetch import get
CACHE="ph_cache"; os.makedirs(CACHE,exist_ok=True)
def page(kind, id_):
    f=f"{CACHE}/{kind}_{id_}.html"
    if os.path.exists(f): return open(f,encoding="utf-8").read()
    try: h=get(f"https://planet-helper.com/{kind}/{id_}")
    except Exception as e: h=f"ERR {e}"
    open(f,"w",encoding="utf-8").write(h); time.sleep(0.6); return h
def txt(h):
    t=re.sub(r"<(script|style)[^>]*>.*?</\1>","",h,flags=re.S); return re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",t))
def monster(code):
    h=page("monsters",code)
    if h.startswith("ERR"): return None
    t=txt(h)
    out={"code":code,"name":re.search(r"<title>(.*?) \|",h).group(1).strip()}
    for k,pat in [("level",r"LEVEL ([\d,]+)"),("hp",r"HP ([\d,]+)"),("exp",r"EXP ([\d,]+)"),("pdd",r"물리 방어 ([\d,]+)"),("mdd",r"마법 방어 ([\d,]+)"),("watk",r"물리 공격 ([\d,]+)"),("matk",r"마법 공격 ([\d,]+)"),("needAcc",r"필요 명중 ([\d,]+)"),("eva",r"회피율 ([\d,]+)")]:
        m=re.search(pat,t); out[k]=int(m.group(1).replace(",","")) if m else None
    drops=[]
    i=h.find("드롭 아이템")
    for m in re.finditer(r'<a href="/items/(\d+)">(.*?)</a>', h[i:] if i>=0 else "", re.S):
        body=m.group(2)
        nm=re.search(r'alt="([^"]*)"',body)
        pr=re.search(r'tabular-nums"[^>]*>([\d.]+)%<',body)
        drops.append({"itemId":int(m.group(1)),"name":nm.group(1) if nm else "?","prob":float(pr.group(1)) if pr else None,"candidate":"후보</span>" in body})
    out["drops"]=drops
    out["maps"]=sorted(set(re.findall(r'href="/maps/(\d+)"',h)))
    return out
