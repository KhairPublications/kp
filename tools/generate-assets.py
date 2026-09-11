"""
Derives generated image assets from the source artwork.

Run after changing the logo or a book cover:

    python tools/generate-assets.py

Produces:
  - src/assets/favicon/*            favicon set built from the brand logo
  - src/assets/images/books/hayat-e-murshid.png
                                    book render with its transparent margin
                                    trimmed so it matches the other covers

Requires Pillow (`pip install Pillow`).
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "src/assets/images/brand"
BOOKS = ROOT / "src/assets/images/books"
FAVICON_DIR = ROOT / "src/assets/favicon"

LOGO = BRAND / "khair-logo.png"
BOOK_SOURCE = ROOT / "src/assets/images/_originals/newbook.png"
BOOK_OUTPUT = BOOKS / "hayat-e-murshid.png"

# Brand green, used where a transparent icon needs an opaque backdrop.
BRAND_GREEN = (17, 88, 2, 255)


def content_bbox(image: Image.Image, alpha_threshold: int = 8):
    """Bounding box of the non-transparent pixels."""
    rgba = image.convert("RGBA")
    mask = rgba.getchannel("A").point(lambda v: 255 if v > alpha_threshold else 0)
    return mask.getbbox()


def trim(image: Image.Image, pad_ratio: float = 0.0) -> Image.Image:
    """Crop away the transparent margin, optionally leaving a little padding."""
    box = content_bbox(image)
    if box is None:
        return image

    left, top, right, bottom = box
    if pad_ratio:
        pad_x = int((right - left) * pad_ratio)
        pad_y = int((bottom - top) * pad_ratio)
        left = max(0, left - pad_x)
        top = max(0, top - pad_y)
        right = min(image.width, right + pad_x)
        bottom = min(image.height, bottom + pad_y)

    return image.crop((left, top, right, bottom))


def square(image: Image.Image, background=None) -> Image.Image:
    """Centre the image on a square canvas without distorting it."""
    side = max(image.size)
    canvas = Image.new("RGBA", (side, side), background or (0, 0, 0, 0))
    canvas.paste(
        image,
        ((side - image.width) // 2, (side - image.height) // 2),
        image if image.mode == "RGBA" else None,
    )
    return canvas


def build_favicons() -> None:
    FAVICON_DIR.mkdir(parents=True, exist_ok=True)

    logo = Image.open(LOGO).convert("RGBA")
    # The crest sits inside a wide margin; trim it so the mark still reads at
    # 16 pixels, then square it up rather than stretching the oval.
    mark = square(trim(logo, pad_ratio=0.02))

    # Multi-resolution .ico: what desktop browsers reach for first.
    ico_path = FAVICON_DIR / "favicon.ico"
    mark.save(ico_path, sizes=[(16, 16), (32, 32), (48, 48)])

    for size in (16, 32, 48, 192, 512):
        mark.resize((size, size), Image.LANCZOS).save(
            FAVICON_DIR / f"icon-{size}.png", optimize=True
        )

    # iOS ignores transparency and composites on black, so bake in the brand
    # green and inset the mark slightly.
    apple = Image.new("RGBA", (180, 180), BRAND_GREEN)
    inner = mark.resize((156, 156), Image.LANCZOS)
    apple.paste(inner, (12, 12), inner)
    apple.convert("RGB").save(FAVICON_DIR / "apple-touch-icon.png", optimize=True)

    print(f"favicons -> {FAVICON_DIR.relative_to(ROOT)}")
    for f in sorted(FAVICON_DIR.iterdir()):
        print(f"  {f.name:24} {f.stat().st_size / 1024:6.1f} KB")


def build_book_image() -> None:
    source = Image.open(BOOK_SOURCE).convert("RGBA")
    trimmed = trim(source)
    trimmed.save(BOOK_OUTPUT, optimize=True)

    before = source.width / source.height
    after = trimmed.width / trimmed.height
    print(f"\n{BOOK_OUTPUT.name}")
    print(f"  {source.size} ratio {before:.3f}  ->  {trimmed.size} ratio {after:.3f}")


if __name__ == "__main__":
    build_favicons()
    build_book_image()
