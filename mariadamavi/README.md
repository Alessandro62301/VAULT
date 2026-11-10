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

Ao selecionar um novo produto ou confirmar um nome digitado, o lucro recebe o padrão de `src/catalog/profit-rules.js`: iPhone lacrado R$ 1.000, seminovo R$ 700; MacBook Air 13/15 com 16/512 R$ 1.000 ou 24/1 TB R$ 1.500; Neo R$ 700; Pro R$ 2.000; Pro Max R$ 2.500; iPad 11 R$ 500, Air R$ 1.200 e Pro R$ 2.000. O lucro permanece editável. Trocar de produto aplica o novo padrão; mudar custo, logística ou desconto preserva o lucro ajustado. Produtos sem regra começam em zero. Rascunhos já salvos mantêm seus valores.

Entrega/logística e desconto são definidos por produto em reais, com valor inicial zero. O preço final é `custo + logística + lucro desejado − desconto`. O lucro após desconto é `lucro desejado − desconto`, podendo indicar prejuízo. O desconto deve deixar o preço final maior que zero. As parcelas e a mensagem usam esse preço final. Rascunhos anteriores recebem zero nos novos campos.

Com `npm run dev`, abra `/catalogo-interno/`. Informe produto, cor opcional, custo total e lucro desejado em reais. Preço de venda = custo + logística + lucro − desconto. É possível adicionar vários produtos e copiar a mensagem com a formatação do WhatsApp. Custo e lucro não são incluídos na mensagem. Rascunhos ficam somente no `localStorage` deste navegador. Não há envio automático, analytics nem gravação de preços na loja.

O campo produto aceita texto livre e sugestões de nomes de `src/catalog/catalog.json`. Nenhum preço JMS é usado como custo. Os coeficientes iniciais 12x `0,09528` e 18x `0,06717` foram inferidos dos exemplos de orçamento e podem ser alterados na tela. As parcelas são calculadas sobre o preço de venda final. Custo deve ser maior que zero e lucro pode ser zero. Campos ausentes ou inválidos bloqueiam a cópia.

A imagem Docker inclui `/catalogo-interno/` com autenticação no Nginx. Para liberar o acesso, monte no Easypanel o arquivo de senhas no caminho `/etc/nginx/catalogo-interno.htpasswd`, conforme o [guia de publicação](deployment/README.md). Os rascunhos são locais ao navegador usado para acessar a rota.
