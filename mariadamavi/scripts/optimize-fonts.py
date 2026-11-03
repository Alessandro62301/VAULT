"""Keep the existing designs, glyphs and used axes; reduce unused variation data.
Optional regeneration: pip install fonttools brotli, then run this file from the app.
The generated fonts are versioned, so normal npm/Docker builds do not need Python.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import sys

sys.path.insert(0, str(Path('../tools/font-subset').resolve()))
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont

output = Path('public/optimized')
output.mkdir(exist_ok=True)
assets = [
    ('archivo', 'Archivo Variable', 'standard-normal', 'normal', {'wdth': (62, 100, 100), 'wght': (300, 400, 900)}, '300 900', '62% 100%'),
    ('caveat', 'Caveat Variable', 'wght-normal', 'normal', {}, '400 700', 'normal'),
    ('bodoni-moda', 'Bodoni Moda Variable', 'standard-normal', 'normal', {'wght': 500}, '500', 'normal'),
    ('bodoni-moda', 'Bodoni Moda Variable', 'standard-italic', 'italic', {'wght': 500}, '500', 'normal'),
]
css, manifest = [], []
for name, family, filename, style, axes, weight, stretch in assets:
    package = Path('node_modules/@fontsource-variable') / name
    source = package / 'files' / f'{name}-latin-{filename}.woff2'
    font = TTFont(source)
    original_cmap = font.getBestCmap()
    if axes:
        instantiateVariableFont(font, axes, inplace=True)
    if 'gvar' in font:
        # Some empty glyphs have no variation entry after axis instancing.
        for glyph in font.getGlyphOrder():
            if glyph not in font['gvar'].variations:
                font['gvar'].variations[glyph] = []
    # Keep every encoded character and standard shaping. Drop unused stylistic
    # alternate features (the site does not opt into discretionary font features).
    options = subset.Options()
    optimizer = subset.Subsetter(options=options)
    optimizer.populate(unicodes=original_cmap.keys())
    optimizer.subset(font)
    font.flavor = 'woff2'
    import io
    data = io.BytesIO()
    font.save(data)
    content = data.getvalue()
    assert font.getBestCmap() == original_cmap
    digest = hashlib.sha256(content).hexdigest()[:10]
    url = f'/optimized/{name}-{filename}-{digest}.woff2'
    Path('public' + url).write_bytes(content)
    shutil.copyfile(package / 'LICENSE', output / f'{name}-OFL.txt')
    css.append(f"@font-face {{ font-family: '{family}'; font-style: {style}; font-weight: {weight}; font-stretch: {stretch}; font-display: swap; src: url('{url}') format('woff2'); }}")
    manifest.append({'family': family, 'source': str(source), 'axes': axes, 'url': url, 'originalBytes': source.stat().st_size, 'bytes': len(content)})
Path('src/styles/fonts.css').write_text('\n'.join(css) + '\n', encoding='utf8')
Path('_briefing/performance-fonts.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf8')
html_path = Path('index.html')
html = html_path.read_text(encoding='utf8')
html = re.sub(r'<link rel="preload" as="font"[^>]+>', f'<link rel="preload" as="font" href="{manifest[0]["url"]}" type="font/woff2" crossorigin />', html)
html_path.write_text(html, encoding='utf8')
print(json.dumps(manifest, indent=2))
