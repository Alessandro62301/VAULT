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
- Skill de design: impeccable, instalada em `.claude/` (hooks de detector ativos)

## Seções (ordem no `index.html`)
| Seção | Arquivos | Estado |
|---|---|---|
| Navbar pill + botão tema sol/lua + WhatsApp flutuante + rodapé | `nav.*`, `theme.js`, `whatsapp.*`, `footer.css` | ok |
| Hero: vídeo da linha da MaviBag em loop, título à esquerda, botões à direita (estilo Luan), legenda por etapa | `hero.*`, `public/hero/*.mp4` | ok |
| Quem somos: quadro de cortiça 3D (tilt, arrastar, itens pregando) | `board.*` | fotos provisórias |
| Produtos: conversa estilo Direct do Instagram + grade de 8 produtos (foto Apple, revela foto de uso no scroll) | `products.*` | **grade em colmeia não agradou: revisar formato** |
| Sob medida: configurador MacBook Pro (regras Pro/Max) → WhatsApp | `custom.*` | ok |
| MaviBag | `mavibag.*` | ok |
| Como funciona: mapa pixel art de 7 fases, MaviBag anda no scroll | `journey.*`, `map-data.js`, `assets-src/map/generate_map.py` | ok |
| Instagram, Troca, Empresas, FAQ | `closing.css` | ok |

Tema claro: tokens em `tokens.css` (`[data-theme="light"]`). O hero é forçado escuro com `data-theme="dark"`.

## Pendências
- **Etapa 12:** performance, SEO, acessibilidade, revisão final da impeccable (finish reviewer + DESIGN.md), publicação na Vercel e domínio.
- Revisar o formato da grade de produtos: pastas = igual demais à Wave; colmeia = não gostou.
- Fotos reais: Maria (`public/maria/avatar.jpg` ativa o avatar automaticamente), Junior, casal, restaurante, barco, 8 fotos de produto, banner, mais ângulos da MaviBag.
- As fotos provisórias do Unsplash e as imagens da Apple estão listadas em `_briefing/05-assets.md`.

## Preferências do usuário
- Trabalhar **seção por seção** e mostrar antes de seguir.
- Nunca gerar rosto da Maria/Junior com IA. Foto de banco só sem pessoas e marcada como provisória.
- Comunicação humana, não "de loja". Conversa de exemplo sempre rotulada como exemplo.
- O usuário costuma ver pelo celular, fora de casa, via túnel.
