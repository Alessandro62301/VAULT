# Passagem de contexto (para um chat novo)

Leia este arquivo, `PRODUCT.md`, `_briefing/07-roteiro-dev.md` e `.impeccable/surfaces/index-html.md` antes de mexer.

## O projeto
Landing page da **mariadamavi**: revenda Apple (lacrado direto dos EUA + seminovo), Maria na frente (atende), Junior nos bastidores (dev, é o usuário).
Tudo leva ao WhatsApp **(21) 92018-4210** com mensagem pronta por seção (`src/js/whatsapp.js`, atributo `data-wa`).
Referência de estrutura: waveofunboxing.com.br (loja do Luan). Visual: preto vinho + rosa MaviBag `#E8197F`, Archivo condensado em caixa alta.

## Stack
Vite + JS puro + GSAP/ScrollTrigger. Fontes self-hosted: Archivo (variável), Caveat, Silkscreen. Build estático, Vercel planejada.
- Dev: `npx vite` (porta 5173, config "site" em `.claude/launch.json`)
- Prévia de produção: `npx vite build && npx vite preview --port 4173`
- Túnel temporário: `cloudflared tunnel --url http://localhost:4173` (endereço muda a cada vez)
- Hero atual: `public/hero/maria-unboxing.mp4` (720×1280, ~15 MB), capa extraída aos 72 s; sem autoplay nem carregamento do MP4 antes do clique.
- Skill de design: impeccable, instalada em `.claude/` (hooks de detector ativos)

## Seções (ordem no `index.html`)
| Seção | Arquivos | Estado |
|---|---|---|
| Navbar pill + botão tema sol/lua + WhatsApp flutuante + rodapé | `nav.*`, `theme.js`, `whatsapp.*`, `footer.css` | ok |
| Hero: texto + CTA WhatsApp à esquerda, unboxing real da Maria à direita; vídeo sob demanda | `hero.*`, `public/hero/*.mp4` | ok |
| Quem somos: quadro de cortiça 3D (tilt, arrastar, itens pregando) | `board.*` | fotos provisórias |
| Produtos: vitrine com 8 categorias, imagem Apple em destaque e conversa de exemplo | `products.*` | **nova vitrine implementada; aguardando revisão visual do Junior** |
| Sob medida: blocos arrastáveis para o MacBook, com toque/teclado e regras Pro/Max → WhatsApp | `custom.*`, `custom-config.js` | nova interação aguardando revisão |
| MaviBag | `mavibag.*` | ok |
| Como funciona: mapa pixel art de 7 fases, MaviBag anda no scroll | `journey.*`, `map-data.js`, `assets-src/map/generate_map.py` | ok |
| Instagram, Troca, Empresas, FAQ | `closing.css` | ok |

Tema claro: tokens em `tokens.css` (`[data-theme="light"]`). O hero acompanha o tema escolhido. No celular, texto e CTA vêm antes do vídeo.

## Pendências
- **Etapa 12:** performance, SEO, acessibilidade, revisão final da impeccable (finish reviewer + DESIGN.md), publicação na Vercel e domínio.
- Revisar com o Junior a nova vitrine de produtos: seleção lateral no desktop e faixa horizontal no celular. Substitui a colmeia; fotos Apple locais, CTA específico por produto, teclado e movimento reduzido.
- Fotos reais: Maria (`public/maria/avatar.jpg` ativa o avatar automaticamente), Junior, casal, restaurante, barco, 8 fotos de produto, banner, mais ângulos da MaviBag.
- As fotos provisórias do Unsplash e as imagens da Apple estão listadas em `_briefing/05-assets.md`.

## Preferências do usuário
- Trabalhar **seção por seção** e mostrar antes de seguir.
- Nunca gerar rosto da Maria/Junior com IA. Foto de banco só sem pessoas e marcada como provisória.
- Comunicação humana, não "de loja". Conversa de exemplo sempre rotulada como exemplo.
- O usuário costuma ver pelo celular, fora de casa, via túnel.

## Loja WooCommerce — 27/10/2026
- Domínio escolhido: store.mariadamavi.com.br; ainda não publicado.
- Prévia local http://127.0.0.1:8088, tema filho Storefront em commerce/theme.
- Catálogo e frete fictícios, banners de demonstração, emails bloqueados, pagamento local sem cobrança.
- Pedido de teste #33 concluído via navegador e confirmado no banco (on-hold, R$10.009,90).
- Publicação depende de hospedagem WordPress, catálogo real, frete, dados/políticas e gateway PIX/cartão.
- Tema instalável em commerce/dist/mariadamavi-store.zip. Instruções em commerce/README.md.
- Landing preservada; seus links públicos ainda não apontam para o subdomínio não publicado.

## Checkout — 30/10/2026
A pedido do Junior, finalização temporária pelo WhatsApp, mantendo registro WooCommerce em on-hold. Plugin commerce/plugins/mavi-whatsapp ativado localmente; checkout clássico. Pagamentos online ficam para depois. Instruções de ativação/reversão e teste em commerce/README.md.
