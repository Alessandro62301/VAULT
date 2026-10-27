# 06 — Prompt do vídeo do hero (para a skill motionmaxxing)

Como usar: abra outro chat com a skill **motionmaxxing** instalada, cole o bloco abaixo e anexe
fotos da MaviBag real e o logo, se tiver. O prompt está em inglês porque a skill e o
vocabulário dela são em inglês; os textos da LP continuam em português.

> Anexe junto `refs/mavibag/mavibag-01.png` (foto real da MaviBag). A descrição no prompt já
> foi feita a partir dela. Se tiver mais fotos (vazia, fechada, de lado), anexe também.

Quando o vídeo ficar pronto, salve em `assets/hero/` com os arquivos pedidos no fim do prompt.

---

```text
Use the motionmaxxing skill. Make a silent 3D product film that will be SCROLL-SCRUBBED
as the hero of a landing page (the page overlays its own headline and buttons in HTML, so
the film must contain NO overlaid text, NO logo end card, NO UI, NO page chrome; only the
type printed on the bag and card, which are physical objects in the scene).

## Brand
- Name: mariadamavi (Instagram @mariadamavi). Apple-ecosystem reseller in Brazil:
  MacBook, iPhone, iPad, Apple Watch, AirPods. Sealed products imported from the USA,
  with invoice, contract and warranty. Custom-order MacBook Pro up to 128 GB RAM.
- Run by a couple: Maria Victória (the face, finishing dental school) and Junior
  (developer, runs everything behind the scenes). 500+ orders delivered.
- Brand look (average of the Instagram feed): near-black background with a deep wine
  tint, hot pink / magenta neon light, bold white type with one word in pink. Premium,
  warm, human, a little playful. Reference for finish and pacing: waveofunboxing.com.br.
- Palette: ground #0A0208, secondary ground #14060F, accent #E8197F,
  accent highlight #FFB8DA, glow rgba(232,25,127,0.22), white #FFFFFF.

## The one true thing
Every order is packed by hand, one at a time, into a MaviBag. Other stores ship boxes;
mariadamavi ships care. The film shows that care as a beautiful production line.

## The MaviBag (real object, reference photo attached: refs/mavibag/mavibag-01.png)
- A large, frosted, translucent plastic zip-seal bag (milky, slightly wrinkled, with soft
  specular highlights), sealed with a zip track across the top.
- Printed on the bag: "MARIADAMAVI" in huge, bold, condensed hot-pink (#E8197F) capitals
  running vertically along the right edge, plus a tiny "MARIADAMAVI" mark at the top-left.
- Inside: the product box in a dark tray at the center, surrounded and fully buried by
  loose-fill packing peanuts in hot pink / magenta (foam "cheetos" shapes, matte, light,
  bouncy) that fill the whole bag.
- On top of the peanuts, pressed against the front of the bag: a black card that reads
  "CHEGOU." in bold condensed pink type, "Seu novo Apple chegou." and a pink block with "3%"
  (a discount coupon for the next order).
- The printed bag and the card are IN-WORLD brand objects, so their type is allowed. They
  are the only text in the film: no overlays, no captions, no logo end card.

## The idea
"The MaviBag production line": a compact, jewel-like 3D assembly line (dark anodized metal,
satin black rollers, soft pink light leaking from inside, precise and quiet, more watchmaker
than factory) that turns one sealed Apple product into one finished MaviBag. The hero moment
is the bag FILLING UP: a stream of pink packing peanuts pouring in and swelling the bag.
The line is a metaphor for the couple: precise like a developer, caring like Maria.

## World
- One continuous space, no scene changes: the line on a dark, slightly reflective surface,
  low-key lighting, pink rim light, subtle haze and film grain, shallow depth of field.
  Real 3D (three.js or equivalent) with physically plausible peanuts (instanced meshes /
  simple physics), not flat vectors.
- Product: a sealed, generic white box in the style of Apple packaging (no real Apple logo
  or trademark text).
- Camera: one continuous, slow move (dolly + slight orbit) following the bag down the line,
  no cuts, because the film is scrubbed by scroll forward AND backward. Every frame must
  look good as a still.

## Storyboard (beats mapped to scroll progress)
1. 0–10%   Establishing: the line at rest, an empty frosted MaviBag hanging open on a clamp,
           the big pink "MARIADAMAVI" print catching the light. The first frame doubles as the
           page poster, so it must be the most beautiful still, with calm negative space at
           the top/center for the headline.
2. 10–25%  A sealed white box glides in on rollers, a soft arm sets it into a dark tray.
           (Page text: "Chega lacrado, direto dos EUA.")
3. 25–35%  A thin pink scan line passes over the box. The tray with the box is lowered into
           the open bag. (Page text: "Conferido, peça por peça.")
4. 35–65%  HERO BEAT: a hopper above opens and a stream of hot-pink packing peanuts pours
           into the bag, tumbling, bouncing, piling up around the box until it is buried and
           the frosted bag swells full and round. Pink light glows through the plastic.
           (Page text: "Cheio de cuidado.")
5. 65–80%  A small arm slides the black "CHEGOU." card in on top, against the front of the
           bag. (Page text: "Com bilhete e mimo pra próxima.")
6. 80–90%  Two rollers press the zip track closed across the top; a tiny settle of the
           peanuts. (Page text: "Fechada. Pronta.")
7. 90–100% Release: the finished MaviBag tips off the end of the line and DROPS out of the
           bottom of the frame, as if falling into the next section of the page. End on the
           next empty bag swinging into the clamp, pink light breathing, ready for the next
           one. (Page text: "+500 MaviBags. A próxima é a sua.")

## Motion rules for scrubbing
- Something moves on every frame (no dead frames), but nothing fast or flashy: it is
  played at the reader's scroll speed, so avoid motion blur streaks and camera shake.
- No cuts, no fades to black, no end card, no held logo. No audio needed.
- Keep the upper-center third relatively calm so HTML headlines stay readable on top.
- Respect the brand: pink is light and accent, not a flat pink background.

## Deliverables
- Duration about 8–10 s at 30 fps.
- Desktop: 1920x1080 MP4 (H.264) encoded for scrubbing with every frame as a keyframe
  (ffmpeg: -g 1 -crf 20 -pix_fmt yuv420p -movflags +faststart -an).
- Mobile: 1080x1920 vertical version of the same film (reframed, same beats and timing),
  same encoding.
- Frame sequences for canvas scrubbing: WebP (quality ~80) of both versions, named
  frame_0001.webp ... in folders desktop/ and mobile/. Desktop also at 1280x720.
- poster.jpg (first frame) for desktop and mobile.
- A NOTE.md with the gate results and the exact timestamp of each beat above,
  so the page can sync the overlaid texts to scroll progress.
```
