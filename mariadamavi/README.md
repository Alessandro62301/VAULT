# mariadamavi · landing page

Landing page da mariadamavi (Apple lacrado direto dos EUA, atendimento da Maria). Vite + JS puro + GSAP.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/, gzip e cabeçalhos com hashes da versão
npm run preview:production # validação local em http://127.0.0.1:4175
```

- Contexto completo do projeto: `_briefing/HANDOFF.md` e `PRODUCT.md`
- Mapa do "Como funciona": `assets-src/map/generate_map.py` (Python com Pillow, numpy e scipy) gera `public/como-funciona/*.png` e `src/js/map-data.js`
- Filme do hero: roteiro e cena em `film/` (os vídeos finais já estão em `public/hero/`)
- Publicação na VPS com Docker/Easypanel: `deployment/README.md`.
- Otimização das fotos: `npm run images:optimize`; originais preservados e variantes registradas em `_briefing/performance-images.json`.
- Fontes locais otimizadas: `scripts/optimize-fonts.py` (opcional, requer Python + fonttools + brotli); arquivos gerados já versionados, sem Python no build normal.
- Auditoria e limites da validação: `_briefing/PERFORMANCE.md`.
