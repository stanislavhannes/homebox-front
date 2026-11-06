import sys, re, json
src = open(sys.argv[1]).read()
cfg = dict(h0=450, L=1000, D=600, R=260, t0=0.10, t1=0.86, n=5, c1="#ea7a35", c2="#f6f6f6", side="#c25a1c",
           win_gap=230, win_h=1200, w0=0.2, w1=0.8, shadow=True)
cfg.update(json.loads(sys.argv[3]) if len(sys.argv) > 3 else {})
g = type("C", (), cfg)
# Original-Etikett entfernen (grüne Fläche + schwarzer Rahmen)
src = re.sub(r'\s*<path d="M8951\.41 4102\.72[^>]*/>', "", src)
P0 = (5472.0, 4774.0); U = (3829.0, -2188.0); N = (0.866, 0.5)
def F(t, down):  # Punkt auf der rechten Wand: t entlang der Oberkante, down = senkrecht nach unten
    return (P0[0] + t*U[0], P0[1] + t*U[1] + down)
def T(t): return F(t, g.h0)
def B(t):
    x, y = T(t); return (x + N[0]*g.L, y + N[1]*g.L + g.D)
def pt(p): return f"{p[0]:.0f} {p[1]:.0f}"
out = []
stroke = "stroke:#000;stroke-width:206px;stroke-linejoin:round;stroke-linecap:round"
# Fenster
wt = g.h0 + g.D + g.L*N[1] + 2*g.R + g.win_gap
a, b, c, d = F(g.w0, wt), F(g.w1, wt), F(g.w1, wt + g.win_h), F(g.w0, wt + g.win_h)
out.append(f'<path d="M{pt(a)}L{pt(b)}L{pt(c)}L{pt(d)}Z" style="fill:#567f67;{stroke}"/>')
# Spiegelung im Fenster
ra, rb = F(g.w0 + 0.08, wt + g.win_h*0.72), F(g.w0 + 0.2, wt + g.win_h*0.22)
out.append(f'<path d="M{pt(ra)}L{pt(rb)}" style="fill:none;stroke:#8fb59f;stroke-width:150px;stroke-linecap:round"/>')
# Tür (optional): rechts neben dem Fenster, bis kurz über den Boden
if cfg.get("door"):
    d0, d1 = cfg["door"]
    dt, db = wt, wt + g.win_h + 520
    p1, p2, p3, p4 = F(d0, dt), F(d1, dt), F(d1, db), F(d0, db)
    out.append(f'<path d="M{pt(p1)}L{pt(p2)}L{pt(p3)}L{pt(p4)}Z" style="fill:#3f5f4c;{stroke}"/>')
    k = F(d0 + (d1-d0)*0.25, dt + (db-dt)*0.55)
    out.append(f'<circle cx="{k[0]:.0f}" cy="{k[1]:.0f}" r="85" style="fill:#f6f6f6"/>')
# Schatten unter der Markise
if g.shadow:
    s0, s1 = F(g.t0, g.h0), F(g.t1, g.h0)
    s2, s3 = F(g.t1, g.h0 + g.D + 420), F(g.t0, g.h0 + g.D + 420)
    out.append(f'<path d="M{pt(s0)}L{pt(s1)}L{pt(s2)}L{pt(s3)}Z" style="fill:#000;fill-opacity:.16"/>')
# Streifen
ts = [g.t0 + (g.t1 - g.t0)*i/g.n for i in range(g.n+1)]
def scallop(p, q):
    m = ((p[0]+q[0])/2, (p[1]+q[1])/2 + 2*g.R); return f"Q{pt(m)} {pt(q)}"
# Umriss Dachfläche
o = f"M{pt(T(g.t0))}L{pt(T(g.t1))}L{pt(B(g.t1))}"
for i in range(g.n, 0, -1):
    o += scallop(B(ts[i]), B(ts[i-1]))
o += "Z"
# Nahtlos: eine Grundfläche in Orange, weiße Streifen darüber (keine Stoßkanten zwischen Flächen)
out.append(f'<path d="{o}" style="fill:{g.c1}"/>')
for i in range(1, g.n, 2):
    ta, tb, ba, bb = T(ts[i]), T(ts[i+1]), B(ts[i]), B(ts[i+1])
    out.append(f'<path d="M{pt(ta)}L{pt(tb)}L{pt(bb)}{scallop(bb, ba)}Z" style="fill:{g.c2}"/>')
out.append(f'<path d="{o}" style="fill:none;{stroke}"/>')
# Seitenwange links (zeigt zum Betrachter)
w = F(g.t0, g.h0 + g.D)
out.append(f'<path d="M{pt(T(g.t0))}L{pt(B(g.t0))}L{pt(w)}Z" style="fill:{g.side};{stroke}"/>')
res = src.replace("</svg>", "  " + "\n  ".join(out) + "\n</svg>")
res = res.replace('viewBox="0 0 10817 9730"', 'viewBox="857 -7 9562 9562"').replace(' xml:space="preserve"', "")
open(sys.argv[2], "w").write(res)
