import urllib.request, gzip, sys
def get(u, raw=False, extra=None):
    hd={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36","Accept-Language":"ko-KR,ko;q=0.9","Accept-Encoding":"gzip","Accept":"*/*"}
    if extra: hd.update(extra)
    r=urllib.request.urlopen(urllib.request.Request(u,headers=hd),timeout=40); b=r.read()
    if r.headers.get("Content-Encoding")=="gzip": b=gzip.decompress(b)
    return b if raw else b.decode("utf-8","replace")
