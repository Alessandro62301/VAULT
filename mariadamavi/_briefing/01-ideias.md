# 01 — Ideias e estratégia

## Posicionamento

> Comprar Apple com alguém que você conhece pelo nome.

Lojas de Apple importado vendem preço. A Mavi vende **confiança + atendimento**: tem rosto
(Maria), tem processo (Junior), tem contrato, nota e garantia. A pessoa não fala com "a loja",
fala com a Maria.

## Pilares de comunicação

1. **Gente de verdade** — Maria na frente, Junior nos bastidores. Casal, família empreendedora
   (restaurantes de peixe, barco de pesca). Rostos, não logos.
2. **Segurança** — lacrado, direto dos EUA, nota fiscal, contrato, garantia.
3. **Sob medida** — encomenda de MacBook Pro topo de linha (M-series Max, até 128 GB RAM,
   SSD grande). Ninguém precisa se contentar com o que tem em estoque.
4. **Atendimento consultivo** — "me ajuda a escolher": a gente indica o certo pro seu uso,
   não o mais caro.

## Público

- Profissionais que vivem do Mac/iPhone: criadores, designers, devs, editores de vídeo,
  dentistas/médicos/estudantes (ponte natural com a Maria na odonto).
- Quem quer Apple mais barato que no varejo BR, mas tem medo de importado.
- Empresas que precisam de vários equipamentos (B2B).

## Mapa de seções (baseado na Wave, adaptado)

| # | Seção | Ideia Mavi |
|---|---|---|
| 0 | Navbar flutuante (pill) | Logo · Produtos · Encomenda · Como funciona · Feedbacks · FAQ · [Fazer encomenda] |
| 1 | Hero | **Máquina 3D produzindo MaviBags**, vídeo controlado pelo scroll (ver abaixo e `06-hero-video-prompt.md`) |
| 2 | Faixa de prova social | Clientes/criadores que já compraram (carrossel infinito de avatares) |
| 3 | **Quem somos** | **Quadro de avisos 3D** ocupando a seção inteira (ver abaixo) |
| 4 | Produtos | Grid de categorias: iPhone, MacBook, iPad, Watch, AirPods, iMac, Mac mini, Acessórios. Selos: **Lacrado (1 ano de fábrica)** · **Seminovo (6 meses)** · **Pronta entrega** / **Encomenda 2–14 dias úteis** |
| 5 | **Encomenda sob medida** | Destaque escuro estilo "configurador": MacBook Pro até 128 GB RAM, chips Max, SSD |
| 6 | Números | Contador animado: **+500 encomendas** (outros números se houver) |
| 7 | **MaviBag** | A embalagem da mariadamavi: o que vem dentro, bilhete, cuidado. A bag que saiu da máquina no hero chega aqui |
| 8 | Unboxing de clientes | Vídeos verticais em carrossel |
| 9 | Como funciona | 1 Conversa · 2 Contrato · 3 Pagamento · 4 Compra nos EUA · 5 Envio · 6 Pós-venda |
| 10 | Mural de feedbacks | Prints do WhatsApp arrastáveis (como a Wave) |
| 11 | Troca de aparelho | Seu usado entra na troca: **iPhone 11 ou mais novo, MacBook M1 ou mais novo**. 3 passos |
| 12 | Pagamento & entrega | PIX · Cartão 12x · PIX + cartão · Frete segurado |
| 13 | Para empresas | B2B com nota fiscal e condições especiais |
| 14 | Bastidores (vídeos) | Reels da Maria (comparativos, rotina). A parte da família já está no mural |
| 15 | FAQ | Acordeão |
| 16 | CTA final | "Sua próxima conquista começa aqui" versão Mavi + botão WhatsApp |
| 17 | Footer | Instagram, WhatsApp, CNPJ, Linktree |

Botão flutuante de WhatsApp fixo em todas as telas.

## Hero: a fábrica de MaviBags (ideia principal)

Em vez de falar como loja, o hero mostra **o que torna a mariadamavi diferente: o cuidado com
cada encomenda**. É a mesma linha da WaveBox do Luan, só que com a nossa **MaviBag**.

- Uma **linha de produção** 3D (meio fábrica, meio joia: metal escuro, luz rosa) monta
  MaviBags uma a uma: a caixa lacrada entra, vai para dentro do saco fosco, **o saquinho enche
  de "cheetos" rosa** (o momento principal), o cartão "CHEGOU." entra por cima e o zip fecha.
- A MaviBag real: saco zip fosco translúcido, "MARIADAMAVI" em rosa na vertical, cheio de
  "cheetos" rosa, caixa do produto no meio, cartão preto "CHEGOU." com cupom de 3% para a
  próxima compra. Foto: `refs/mavibag/mavibag-01.png`.
- **O vídeo anda conforme o scroll** (scroll-scrub): rolando para baixo, a máquina trabalha.
  No fim do hero, a MaviBag pronta sai da esteira e "cai" para a próxima seção, ligando o hero
  ao resto da página.
- Os textos (headline, CTAs) ficam no HTML **por cima** do vídeo, não dentro dele.
- No mobile: versão vertical do mesmo vídeo ou sequência de frames mais leve.
- Prompt completo para gerar o vídeo: [06-hero-video-prompt.md](06-hero-video-prompt.md).

## Quem somos: quadro de avisos 3D

Referência: `refs/mural/quadro-referencia.png`.

- A seção inteira é **só o quadro**: cortiça clara com moldura de madeira, centralizado,
  ocupando quase toda a tela, sobre o fundo escuro do site (o quadro "acende" com uma luz
  rosa suave por trás).
- **Estilo 3D**: o quadro tem profundidade (moldura com espessura e sombra) e inclina levemente
  seguindo o mouse (tilt em perspectiva). No scroll, ele entra vindo de baixo e se endireita.
- Em cima dele, como na referência: post-its (amarelo, rosa, azul), folhas pautadas e
  quadriculadas, papel rasgado de caderno, cantos dobrados, tachinhas e fita adesiva.
  Os post-its rosa usam o rosa da marca.
- Entre os papéis, **fotos polaroid mockadas por enquanto** (Maria atendendo, Maria de jaleco,
  Junior no computador, o casal, restaurante, barco de pesca, MaviBag, print de cliente).
  Depois trocamos pelas fotos reais.
- Bilhetes escritos à mão nos papéis (textos em `04-copy.md`).
- Animação: os papéis e fotos "pregam" um por um quando o quadro aparece; cada camada tem
  profundidade diferente, então no tilt eles se movem em paralaxe. No desktop dá para arrastar.
- Mobile: o quadro fica na vertical (papéis reorganizados) e o tilt vem do giroscópio ou é
  desligado.
- Isso substitui a seção separada de bastidores/família: tudo fica no quadro.

## Ideias extras

- **"Me ajuda a escolher"**: mini quiz de 3 perguntas (uso, orçamento, mobilidade) que monta
  uma mensagem pronta pro WhatsApp.
- **Configurador de MacBook Pro**: seletor visual de chip / RAM / SSD / cor → "Quero essa
  configuração" abre WhatsApp com a config preenchida.
- **Selo "Atendido pela Maria"** nos depoimentos.
- Mensagens pré-preenchidas no WhatsApp por seção (cada CTA diz de onde a pessoa veio).
