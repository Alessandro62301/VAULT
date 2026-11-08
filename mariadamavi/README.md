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

## Calculadora de venda interna

Entrega/logística e desconto são definidos por produto em reais, com valor inicial zero. O preço final é `custo + logística + lucro desejado − desconto`. O lucro após desconto é `lucro desejado − desconto`, podendo indicar prejuízo. O desconto deve deixar o preço final maior que zero. As parcelas e a mensagem usam esse preço final. Rascunhos anteriores recebem zero nos novos campos.

Com `npm run dev`, abra `/catalogo-interno/`. Informe produto, cor opcional, custo total e lucro desejado em reais. Preço de venda = custo + logística + lucro − desconto. É possível adicionar vários produtos e copiar a mensagem com a formatação do WhatsApp. Custo e lucro não são incluídos na mensagem. Rascunhos ficam somente no `localStorage` deste navegador. Não há envio automático, analytics nem gravação de preços na loja.

O campo produto aceita texto livre e sugestões de nomes de `src/catalog/catalog.json`. Nenhum preço JMS é usado como custo. Os coeficientes iniciais 12x `0,09528` e 18x `0,06717` foram inferidos dos exemplos de orçamento e podem ser alterados na tela. As parcelas são calculadas sobre o preço de venda final. Custo deve ser maior que zero e lucro pode ser zero. Campos ausentes ou inválidos bloqueiam a cópia.

A página não faz parte do build público e não tem link na landing. Para uso hospedado com acesso restrito, será necessário definir autenticação e armazenamento. Não adicione a rota ao build público sem essa definição.
