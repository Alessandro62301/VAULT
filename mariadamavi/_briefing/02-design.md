# 02 — Design

Base: o sistema visual da Wave (dark, premium, botões com gradiente radial, cards de vidro,
headlines em caixa alta). Troca: o violeta da Wave vira o **rosa/magenta da Mavi** (média do
Instagram: fundo preto/vinho, palavra-chave em rosa, iluminação neon rosa nos vídeos).

## Paleta (proposta)

| Token | Hex | Uso | Na Wave era |
|---|---|---|---|
| `--bg` | `#0A0208` | Fundo principal (preto com fundo vinho) | `#02000D` |
| `--bg-2` | `#14060F` | Seções alternadas | — |
| `--surface` | `rgba(255,255,255,0.04)` | Cards "vidro" | igual |
| `--border` | `rgba(255,255,255,0.08)` | Bordas finas de card/pill | igual |
| `--text` | `#FFFFFF` | Títulos | igual |
| `--text-2` | `rgba(255,255,255,0.7)` | Corpo | igual |
| `--accent` | `#E8197F` | Rosa Mavi (CTA, destaque) | `#664FE8` |
| `--accent-soft` | `#FFB8DA` | Topo do gradiente / textos claros | `#C1BDF2` |
| `--accent-glow` | `rgba(232,25,127,0.22)` | Brilhos de fundo | `rgba(102,79,232,0.22)` |
| `--light` | `#F6EEF2` | Seções claras (se usar) | `#EEEEF5` |

Gradiente do botão principal (igual à lógica da Wave):
```css
background: radial-gradient(75% 75% at 50% 100%, #FFB8DA 0%, #E8197F 100%);
```
Fade de fim de seção: `linear-gradient(rgba(10,2,8,0) 70%, #0A0208 95%)`.

> Ajustar os hex depois de pegar a cor exata do logo/feed da Mavi.

## Tipografia

A Wave usa **Vinila** (Bold/ExtraBold, paga) + Inter. Alternativas gratuitas:

- **Títulos:** `Archivo` (eixo de largura — usar Expanded/SemiExpanded, 700–800), CAIXA ALTA,
  tracking levemente negativo. Alternativa: `Unbounded`.
- **Palavra de destaque em itálico** (como o *APPLE.* da Wave) → na Mavi, itálico + rosa.
- **Corpo/UI:** `Inter` 400/500.

Escala: H1 hero 56–72 px desktop / 32–36 px mobile · H2 40 px / 28 px · eyebrow 12 px caixa alta
com espaçamento largo, dentro de uma pill com borda.

## Componentes (copiar o "jeitão" Wave)

- **Navbar pill flutuante**, centralizada, fundo vidro + blur, CTA rosa à direita.
- **Eyebrow pill**: ícone 🍎 + "ECOSSISTEMA APPLE" com borda fina.
- **Botão primário**: pill, gradiente radial rosa, ícone WhatsApp. **Secundário**: pill escura com borda.
- **Cards vidro**: `--surface`, borda 1 px, raio 20–24 px.
- **Glow**: elipse rosa desfocada atrás do hero e de produtos.
- **Carrossel infinito** de avatares/clientes.
- **Mural arrastável** de prints de feedback (leve rotação aleatória).
- **Steps numerados** grandes (`01.` `02.` `03.`) em ExtraBold.
- **Contador animado** de números ao entrar na tela.

## Quadro de avisos 3D (Quem somos)

Referência: `refs/mural/quadro-referencia.png`.

- Cortiça **clara/natural** com textura real e grão, moldura de madeira média com espessura
  (borda chanfrada + sombra interna). Centralizado, ~90% da largura até ~1200 px, proporção 16:10.
- Fora do quadro, o fundo escuro do site com um glow rosa atrás dele.
- 3D: `perspective` no container + `rotateX/rotateY` seguindo o mouse (máx. ~6°), com
  suavização. Papéis e fotos em camadas com `translateZ` diferente → paralaxe.
- Papéis: post-it amarelo `#F7E26B`, rosa (`--accent-soft` / `#F48FB1`), azul `#A9C1F5`,
  folha pautada branca, quadriculada amarela, papel rasgado de caderno, cantos dobrados.
- Fixação: tachinhas (algumas com cabeça rosa `--accent`) e fita adesiva translúcida.
- Fotos polaroid mockadas (borda off-white), rotação aleatória de -6° a 6°, sombra suave.
- Texto manuscrito: `Caveat` ou `Nanum Pen Script` (Google Fonts), em grafite/azul de caneta.
- Entrada: o quadro sobe e se endireita; depois os itens pregam um por um (leve passada do
  ponto + tranco da tachinha). Desktop: itens arrastáveis.
- `prefers-reduced-motion`: sem tilt, itens já no lugar.

## Hero com scroll

- Vídeo da máquina de MaviBags fixo (sticky) enquanto o scroll avança uns 300–400vh.
- O scroll controla o tempo do vídeo (scrub) ou uma sequência de frames em `<canvas>`
  (mais suave e confiável que `video.currentTime` em celular).
- Textos do hero entram e saem por etapa, por cima do vídeo.
- No fim, a MaviBag sai da esteira e desce para a próxima seção (transição contínua).

## Movimento

- Fade + sobe 16 px ao entrar na tela (escalonado).
- Hero com vídeo em loop, sem som, com degradê escuro por cima.
- Hover nos produtos: leve zoom + glow rosa.
- Respeitar `prefers-reduced-motion`.

## Tom visual da Mavi (Instagram)

- Fundo escuro com **luz neon rosa** (setup/escritório da Maria).
- Headlines grossas em branco, **1–2 palavras em rosa**.
- Maria em close, falando para a câmera → usar vídeos verticais dela na LP.
- Produto + texto escrito à mão (post do iPad) → dá pra usar como textura nos bilhetes.

## Tema claro (implementado)

- Botão sol/lua na navbar (no celular, dentro do menu). Começa no escuro; a escolha fica salva no navegador.
- Claro: fundo `#fbf5f8`, texto `#1d0c15`, rosa de texto pequeno `#c40d68`, linhas em vinho translúcido.
- O hero fica sempre escuro (vídeo). Os favos de produto e o cartão do quadro também ficam escuros nos dois temas.
- A conversa vira o Direct claro (fundo branco, balões cinza `#efefef`).
