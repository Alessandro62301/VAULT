# mariadamavi · landing page

Landing page da mariadamavi (Apple lacrado direto dos EUA, atendimento da Maria). Vite + JS puro + GSAP.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático, pronto para Vercel)
```

- Contexto completo do projeto: `_briefing/HANDOFF.md` e `PRODUCT.md`
- Mapa do "Como funciona": `assets-src/map/generate_map.py` (Python com Pillow, numpy e scipy) gera `public/como-funciona/*.png` e `src/js/map-data.js`
- Filme do hero: roteiro e cena em `film/` (os vídeos finais já estão em `public/hero/`)
