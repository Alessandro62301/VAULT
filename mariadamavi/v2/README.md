# mariadamavi — segunda versão

Direção visual baseada na captura Human Academy fornecida pelo Junior em 30/10/2026: abertura centralizada com objetos flutuantes, filme em largura total, três cards de produto, seções claras espaçosas, seção de conversão escura e rodapé tipográfico. A paleta foi adaptada para o rosa e o vinho da Mavi, usando a fonte Archivo já instalada.

## Abrir

Na pasta `mariadamavi`, executar `npm run dev` e acessar `/v2/`. A primeira versão continua em `/`.

`npm run build` gera as duas páginas: `dist/index.html` e `dist/v2/index.html`. A configuração multipágina está em `vite.config.js`.

## Arquivos

- `v2/index.html`: conteúdo e estrutura da segunda versão.
- `src/v2/style.css`: estilos exclusivos, com ajustes para celular, tablet e desktop.
- `src/v2/main.js`: seletor de produto, mensagens de WhatsApp, menu, revelação no scroll e vídeos.
- `src/js/whatsapp.js`: número e mensagens compartilhadas. Mensagens específicas da V2 são aplicadas localmente em `src/v2/main.js`.
- `public/v2/`: filme provisório e capa. Origem e licença em `MEDIA-SOURCES.md`.

## Vídeos e substituição futura

O filme panorâmico é o mockup **Person Working Using Macbook**, de Distill/Pexels. Está identificado como filme de referência na interface. Substitua `public/v2/studio-mockup.mp4` e `public/v2/studio-poster.jpg` para usar material próprio sem mudar o layout. Recomendação: MP4 H.264, 16:9, 1080p, com início otimizado para streaming. Se os nomes mudarem, atualize `poster` e `data-src` no elemento `.cinema-video`.

O filme só carrega ao entrar em cena, roda sem som, tem controle de pausa e pausa fora da área visível ou em aba inativa. Com movimento reduzido ou economia de dados, espera uma ação do visitante.

O unboxing da Maria é o vídeo real existente em `public/hero/maria-unboxing.mp4`. Só carrega após o clique, em um diálogo com controles nativos; Escape fecha, pausa o áudio e devolve o foco ao botão.

## Imagens existentes reutilizadas

- `public/produtos/apple/*.webp`: recortes de produto já presentes no projeto; origem documentada em `_briefing/05-assets.md`.
- `public/quem-somos/mavibag.jpg`: fotografia real da embalagem, já presente no projeto.
- `public/hero/maria-unboxing-poster.jpg`: quadro real do vídeo fornecido pelo Junior, sem alteração facial.
- `public/instagram/*.jpg`: imagens existentes de publicações da marca, vinculadas às respectivas publicações originais.

## Conteúdo e interações

Os fatos comerciais vêm de `PRODUCT.md`: mais de 500 encomendas, nota fiscal e contrato, garantia de 1 ano nos lacrados/6 meses nos seminovos, encomenda em 2 a 14 dias úteis, avaliação de iPhone 11+ e MacBook M1+ para troca. Não há preços ou depoimentos inventados. A conversa visual é identificada como exemplo.

O seletor oferece MacBook, iPhone, iPad, Watch e AirPods, com imagem, descrição e mensagem específica para o WhatsApp. É operável pelas setas, Home e End. O FAQ usa elementos `details` nativos. Menu, âncoras, links sociais e contato funcionam sem enviar mensagens automaticamente.

## Revisão de acabamento

Revisão visual feita no navegador em desktop e celular: abertura, filme, cards, MaviBag, processo, unboxing, seleção de produto e navegação. Confirmados vídeo panorâmico carregado e reproduzindo, pausa manual, diálogo do unboxing, fechamento por Escape, retorno de foco, alteração de produto por clique e teclado, FAQ e fechamento do menu ao navegar.

A versão é uma alternativa local para revisão. Ainda não foi publicada no domínio da marca.
