"""Generate LW-owned placeholder media used to prove replace-ability.

These files are NOT FredTalk footage and are never presented as upstream
assets.  They are deterministic LW test inputs: a UI screenshot and a small
portfolio set.  Re-run to reproduce byte-identical renders on the same Pillow
version.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

VS = Path(__file__).resolve().parents[2]
OUT = VS / "public" / "fredtalk" / "media"
FONT = VS / "public" / "fredtalk" / "SmileySans-Oblique.ttf"


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT), size)


def screenshot(w: int = 3024, h: int = 1712) -> Image.Image:
    img = Image.new("RGB", (w, h), "#f4f2ec")
    d = ImageDraw.Draw(img)
    # top bar
    d.rectangle([0, 0, w, 140], fill="#ffffff")
    d.line([0, 140, w, 140], fill="#e6e2d8", width=3)
    for i, c in enumerate(["#f06a5e", "#f2c14e", "#69c47a"]):
        cx = 60 + i * 46
        d.ellipse([cx, 60, cx + 28, 88], fill=c)
    d.text((260, 52), "LW Studio · 用户自有界面", font=font(46), fill="#5a5a62")
    d.text((w - 520, 56), "1920 × 1080 · placeholder", font=font(36), fill="#9a9aa2")
    # sidebar
    d.rectangle([0, 140, 480, h], fill="#ffffff")
    d.line([480, 140, 480, h], fill="#e6e2d8", width=3)
    d.text((70, 210), "LW Studio", font=font(64), fill="#19191c")
    for i, s in enumerate(["项目", "素材", "时间轴", "导出"]):
        y = 340 + i * 120
        if i == 1:
            d.rounded_rectangle([56, y - 18, 420, y + 78], 22, fill="#efe9fb")
            d.text((92, y), s, font=font(46), fill="#6f3fd0")
        else:
            d.text((92, y), s, font=font(46), fill="#4d4d55")
    # search box
    d.rounded_rectangle([560, 210, 1450, 320], 28, fill="#ffffff", outline="#e6e2d8", width=2)
    d.text((610, 238), "搜索素材、镜头、组件…", font=font(40), fill="#9a9aa2")
    # cards
    labels = ["镜头 A · 开场", "镜头 B · 讲解", "镜头 C · 收尾"]
    for i, lab in enumerate(labels):
        x = 560 + i * 620
        d.rounded_rectangle([x, 400, x + 560, 900], 30, fill="#ffffff", outline="#e6e2d8", width=2)
        d.rounded_rectangle([x + 24, 424, x + 536, 700], 20, fill=["#ded7f7", "#d7ece6", "#f5e2cf"][i])
        d.text((x + 40, 740), lab, font=font(40), fill="#19191c")
        d.text((x + 40, 800), "可替换为你自己的素材", font=font(30), fill="#8b8b93")
    # input
    d.rounded_rectangle([560, 1010, 2200, 1170], 44, fill="#ffffff", outline="#e6e2d8", width=2)
    d.text((620, 1050), "描述你想做的镜头…", font=font(42), fill="#a5a5ad")
    d.rounded_rectangle([2030, 1030, 2170, 1150], 30, fill="#8554E8")
    d.text((2072, 1058), "生成", font=font(36), fill="#ffffff")
    # progress card
    d.rounded_rectangle([560, 1250, 2200, 1580], 34, fill="#ffffff", outline="#e6e2d8", width=2)
    d.text((620, 1300), "渲染队列", font=font(40), fill="#19191c")
    for i, (lab, pct) in enumerate([("开场 · 已完成", 1.0), ("讲解 · 渲染中", 0.62), ("收尾 · 等待", 0.0)]):
        y = 1380 + i * 64
        d.text((620, y), lab, font=font(30), fill="#5a5a62")
        d.rounded_rectangle([980, y + 8, 2080, y + 26], 9, fill="#eae7df")
        d.rounded_rectangle([980, y + 8, 980 + int(1100 * pct), y + 26], 9, fill="#8554E8")
    # footer
    d.text((620, 1620), "LW placeholder screenshot · not upstream media", font=font(26), fill="#a5a5ad")
    return img


def work(index: int, w: int = 1600, h: int = 1200) -> Image.Image:
    palettes = [
        ("#1c1b22", "#5b4a8a", "#c9b7ff"),
        ("#181f1c", "#2f6b5b", "#bfe6d6"),
        ("#241d18", "#8a5a3b", "#f0cfae"),
        ("#1a1e24", "#3a5a7a", "#cfe0f0"),
        ("#211c24", "#7a3a63", "#f0cfe4"),
        ("#1e221a", "#5f7a3a", "#dfeac2"),
    ]
    bg, mid, hi = palettes[index % len(palettes)]
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    for i in range(26):
        r = 120 + i * 46
        cx = int(w * (0.32 + 0.36 * math.sin(i * 0.7 + index)))
        cy = int(h * (0.48 + 0.28 * math.cos(i * 0.5 + index)))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=mid, width=2)
    d.rounded_rectangle([90, 90, w - 90, h - 260], 40, fill=mid)
    d.rounded_rectangle([130, 130, w - 130, h - 300], 30, fill=hi)
    d.text((180, h - 210), f"LW 作品占位 {index + 1:02d}", font=font(64), fill="#ffffff")
    d.text((180, h - 130), "replace with your own image", font=font(30), fill="#d8d8de")
    return img


def background(w: int = 1920, h: int = 1080) -> Image.Image:
    img = Image.new("RGB", (w, h), "#f5f3eb")
    d = ImageDraw.Draw(img)
    for i in range(140):
        x = (i * 97) % w
        y = (i * 61) % h
        r = 30 + (i % 7) * 18
        d.ellipse([x - r, y - r, x + r, y + r], fill="#e7e2d3")
    d.text((120, 900), "LW 背景占位", font=font(64), fill="#b7b1a1")
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    screenshot().save(OUT / "lw-ui-screenshot.png", optimize=True)
    for i in range(6):
        work(i).save(OUT / f"lw-work-{i + 1:02d}.jpg", quality=88)
    background().save(OUT / "lw-workspace-bg.jpg", quality=88)
    print(f"wrote {len(list(OUT.glob('lw-*')))} placeholder assets to {OUT}")


if __name__ == "__main__":
    main()
