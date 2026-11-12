"""Generates the app icon + splash source images in ./assets (needs Pillow)."""
from PIL import Image, ImageDraw

BG = (21, 24, 38, 255)        # solid navy
GRID = (242, 243, 247, 255)
X_COL = (255, 107, 129, 255)
O_COL = (77, 210, 255, 255)
SS = 3  # supersampling for smooth edges


def symbol(size, span):
    """Transparent RGBA canvas with the # grid + X / O drawn in the centre."""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    g = span * SS                  # grid span in px
    x0 = (s - g) / 2
    cell = g / 3
    t = g * 0.065                  # line thickness

    def line(a, b, col, w):
        d.line([a, b], fill=col, width=int(w))
        r = w / 2
        for p in (a, b):
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=col)

    for k in (1, 2):               # grid
        line((x0 + k * cell, x0), (x0 + k * cell, x0 + g), GRID, t)
        line((x0, x0 + k * cell), (x0 + g, x0 + k * cell), GRID, t)

    def centre(r, c):
        return x0 + (c + 0.5) * cell, x0 + (r + 0.5) * cell

    def draw_x(r, c):
        cx, cy = centre(r, c)
        a = cell * 0.27
        line((cx - a, cy - a), (cx + a, cy + a), X_COL, t * 1.15)
        line((cx - a, cy + a), (cx + a, cy - a), X_COL, t * 1.15)

    def draw_o(r, c):
        cx, cy = centre(r, c)
        rad = cell * 0.29
        w = t * 1.15
        d.ellipse([cx - rad - w / 2, cy - rad - w / 2, cx + rad + w / 2, cy + rad + w / 2], fill=O_COL)
        d.ellipse([cx - rad + w / 2, cy - rad + w / 2, cx + rad - w / 2, cy + rad - w / 2], fill=(0, 0, 0, 0))

    draw_x(0, 0); draw_o(1, 1); draw_x(2, 2); draw_o(0, 2); draw_o(2, 0)
    return img.resize((size, size), Image.LANCZOS)


def solid(size):
    return Image.new("RGBA", (size, size), BG)


# Full-bleed icon (iOS needs no transparency; Android legacy icon)
icon = solid(1024)
icon.alpha_composite(symbol(1024, 640))
icon.convert("RGB").save("assets/icon-only.png")

# Adaptive-icon layers for Android (symbol stays inside the 66% safe zone)
symbol(1024, 520).save("assets/icon-foreground.png")
solid(1024).convert("RGB").save("assets/icon-background.png")

# Splash screens
for name in ("splash.png", "splash-dark.png"):
    sp = solid(2732)
    sp.alpha_composite(symbol(2732, 780))
    sp.convert("RGB").save("assets/" + name)

# Favicon for the web build
os_icon = icon.convert("RGB").resize((256, 256), Image.LANCZOS)
os_icon.save("public_favicon.png")
