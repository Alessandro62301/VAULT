# 05 — Assets (fotos, vídeos, mockups)

Onde não houver material real, usar **mockup temporário** (gerado por IA ou imagem de banco)
e trocar depois. Marcar cada arquivo temporário com o prefixo `tmp-`.

## Lista de necessidades

| Seção | Asset | Real? | Temporário |
|---|---|---|---|
| Hero | Vídeo 3D da máquina produzindo MaviBags (scroll-scrub) | Gerar com motionmaxxing | Ver `06-hero-video-prompt.md` |
| Hero / MaviBag | Fotos da MaviBag real (vários ângulos, aberta e fechada) | Fotografar | — |
| Quem somos | 6–10 fotos para o quadro (Maria, jaleco, Junior, casal, restaurante, barco, MaviBag) | Fotos do casal (depois) | **Mockadas por enquanto** |
| Quem somos | Textura de cortiça + moldura de madeira | — | Gerar/CSS. Ref: `refs/mural/quadro-referencia.png` |
| Quem somos | Foto da Maria (frente) | Instagram/gravar | — |
| Quem somos | Foto do Junior (bastidores, notebook) | Gravar | Mockup IA |
| Produtos | PNG de cada categoria (fundo transparente) | — | Renders de produto |
| Sob medida | MacBook Pro aberto, fundo escuro, glow rosa | — | Mockup IA |
| MaviBag | Foto principal da MaviBag | ✅ `refs/mavibag/mavibag-01.png` | — |
| MaviBag | Close dos cheetos rosa e do cartão "CHEGOU." | Fotografar | Recorte da foto atual |
| Unboxing | 4–6 vídeos verticais de clientes | Pedir aos clientes | Prints de Reels |
| Feedbacks | 10–16 prints de WhatsApp | Destaque "Feedbacks" do IG | — |
| Bastidores | Restaurante, barco de pesca, faculdade | Fotos do casal | — |
| Logo | Logo Mavi em SVG (claro e escuro) | Enviar | — |

## Prompts de mockup (temporário)

**Hero / produto**
> Cinematic product photo of a space black MacBook Pro 16 open on a dark desk, soft magenta
> neon rim light, deep black-burgundy background, subtle pink glow, premium Apple-style
> advertising, shallow depth of field, 16:9.

**Embalagem Mavi**
> Premium black gift box opened on dark velvet surface, an iPhone inside wrapped in a soft pink
> dust bag, handwritten thank-you card, small snacks, magenta accent lighting, luxury unboxing, top view.

**Bastidores (Junior)**
> Young man developer working at night on a MacBook Pro, dark home office, pink neon light
> strip in the background, candid, cinematic, shot from behind over the shoulder.

**Família / barco**
> Small fishing boat at golden hour on calm Brazilian waters, warm documentary photography.

> Rostos reais da Maria e do Junior **não** devem ser gerados por IA — usar fotos de verdade.

## Origem das imagens em uso (provisórias marcadas)

| Arquivo / URL | Onde | Origem |
|---|---|---|
| `public/hero/hero-*.mp4`, `poster-*.jpg` | Hero | Filme gerado com a skill motionmaxxing (`film/`), recomprimido com ffmpeg (CRF 19/20) |
| `public/quem-somos/mavibag.jpg` | Quadro | Foto real da MaviBag (`_briefing/refs/mavibag/mavibag-01.png`) |
| `public/quem-somos/cork.svg`, `wood.svg` | Quadro | Texturas procedurais (SVG feTurbulence), feitas para o site |
| Unsplash `photo-1567359556566` | Quadro: barco | Eduardo Zmievski, Unsplash. **Provisória**: trocar pelo barco de vocês |
| Unsplash `photo-1700760933848` | Quadro: restaurante | Farhad Ibrahimzade, Unsplash. **Provisória**: trocar por prato do restaurante |
| Unsplash `photo-1506478260391` | Quadro: Junior | Ben Kolde, Unsplash. **Provisória**: trocar por foto do Junior |
| `public/maria/avatar.jpg` | Botão flutuante, quadro, rodapé | **Falta**: foto da Maria (quadrada, ~512px). Sem ela, aparece o ícone do WhatsApp |
| Polaroid "foto da Maria em breve" | Quadro | Espaço marcado: trocar pela foto real |

### Produtos (etapa 3)

| Arquivo / URL | Onde | Origem |
|---|---|---|
| `public/produtos/apple/*.webp` | Cards (foto padrão Apple) | Imagens oficiais da Apple (apple.com/br e loja), recortadas com fundo transparente. Uso como revendedora: confirmar se querem manter |
| — | Banner | Trocado por conversa de exemplo com a Maria (sem foto). Avatar usa `public/maria/avatar.jpg` quando existir |
| Unsplash iPhone `1523206489230` · MacBook `1517336714731` · iPad `1544244015` · Watch `1614106765035` · AirPods `1588423771073` · iMac `1612093991429` · Mac mini `1636305152543` · Acessórios `1615526675651` | Foto revelada no scroll | Neil Soni, Dmitry Chernyshov, Francois Hoang, Clément Lauwaert, omid armin, Blvck Paris, Teddy GR, Studio Proper. **Provisórias**: trocar pelas fotos de vocês (uma por categoria, ~1000×850) |

### Como funciona (etapa 6)

| Arquivo | Origem |
|---|---|
| `public/como-funciona/map-*.png` | Gerados por `assets-src/map/generate_map.py` (desenho original no estilo mapa de 16 bits; sem personagens ou elementos da Nintendo) |
| Sprites da MaviBag, barco e avião | Pixel art feita em código (`src/js/journey.js`) |
| Fonte Silkscreen | Google Fonts (OFL), via @fontsource |

### Instagram (etapa 7, conferido em 22/10/2026)

Prévias públicas do perfil, copiadas pelo navegador para evitar URLs temporárias de CDN.
Cada imagem leva ao post original; não são vídeos hospedados nem depoimentos transcritos.
A leitura completa dos posts e dos destaques exigiu login durante a conferência.

| Arquivo | Publicação original |
| --- | --- |
| `public/instagram/macbook-air-ou-pro.jpg` | https://www.instagram.com/mariadamavi/reel/DbAuf7Lxb5A/ |
| `public/instagram/novidades.jpg` | https://www.instagram.com/mariadamavi/p/DcLZrwskRyj/ |
| `public/instagram/nota-fiscal.jpg` | https://www.instagram.com/mariadamavi/reel/DbLEEmVxH6i/ |

Destaques públicos verificados no perfil: Feedbacks `18042009995795719`, Encomendas
`18135006739561804`, Bastidores `18055926983742125`. Links diretos usados no site.
