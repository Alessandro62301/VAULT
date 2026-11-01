# Finalização da landing padrão

Revisão de 01/11/2026. A página principal continua em `/`; a experiência alternativa está em `/v2/` com `noindex, nofollow` e fora do sitemap. As mudanças foram feitas localmente, sem publicar.

## Implementado

- Menu compacto para 320 px e folha de navegação rolável em telas baixas.
- Prévia do configurador sem posição fixa no celular; opções por toque, sem alças de arrastar nessa largura.
- Jornada direta com sete etapas no celular, em telas baixas e com preferência por movimento reduzido. Mapa preservado no desktop, com rolagem menor, alvos de 44 px e atalho para continuar.
- Foto real da Maria reaproveitada do unboxing no mural e nos avatares que apontavam para arquivo inexistente.
- Vídeo otimizado separado do original, com início progressivo e carregamento apenas após clique.
- Título e descrição incluindo lacrados e seminovos, URL canônica, metadados sociais, cartão de compartilhamento, robots.txt e sitemap.
- Eventos preparados em `window.dataLayer`: `whatsapp_click` (origin, section), `product_select` (product), `configuration_change` (option), `video_start`.

## O que ainda depende do negócio

- Fotos recebidas: Maria na Odontologia, atividade coletiva, Maria e Junior, Maria com MacBook e registros da sacola rosa original. Mural atualizado; imagens de banco removidas. Restaurantes e barco seguem apenas mencionados no texto, sem fotografia substituta.
- Depoimentos reais, com autorização de uso e dados pessoais desnecessários removidos.
- Confirmado pelo usuário: CNPJ 65.798.444/0001-60 (corrigido e dígitos conferidos), WhatsApp (21) 92018-4210, atendimento 24h, até 18x com juros, prazo de 2 a 14 dias úteis após pagamento. Lacrados: 1 ano direto com a Apple; seminovos: 6 meses com a mariadamavi. Falta razão social e textos de privacidade, troca e cancelamento; não foram criadas regras não informadas.
- Regras e validade do cupom de 3%. Valores das taxas do cartão são informados na proposta; a página deixa claro que há juros.
- Linhas M5/M6 confirmadas pelo usuário. Configurador de MacBook Pro agora distingue M5, M5 Pro, M5 Max e M6, limita M5/M6 a 14″ e ajusta RAM/SSD conforme as especificações Apple. M5 Pro usa variante de GPU de 20 núcleos; M5 Max determina GPU de 32/40 conforme memória. Outros Macs são tratados no atendimento.
- Conta/provedor de analytics. A fila de eventos está pronta, mas **não existe coleta externa nem painel de métricas ativo**. Conectar o provedor escolhido e definir o tratamento de consentimento antes de ativá-lo.
- Hospedagem, DNS e HTTPS do domínio confirmado `mariadamavi.com.br`. Validar redirecionamento de www, metadados no domínio público, links sociais e desempenho em aparelho/rede reais após deploy.

## Conferência local

`node --test tests/*.test.js` e `npm run build`. Conferir menu em 320 px, catálogo por teclado, configurador, jornada mobile/desktop, navegação para FAQ e reprodução do vídeo.

Validação realizada: seis testes passaram, build aprovado e console sem avisos/erros nos fluxos percorridos. Conferidas larguras de 320, 390, 768 e 1440 px; menu em 320 px, troca de produto por teclado, ajuste de Max para Pro e mensagem final do WhatsApp, navegação à última fase do mapa e atalho para a próxima seção. Vídeo otimizado reproduzido em 720 × 1280, com duração de 80,27 s: 11.413.757 bytes (original: 14.833.732, redução de 23%). Preferência por movimento reduzido tratada em CSS/JS; ainda não validada com leitor de tela nem em aparelho físico.

O cartão raster em `public/social/share.png` vem da arte vetorial `public/social/share.svg`, renderizada em 1200 × 630. Se mudar o SVG, atualizar também o PNG antes do build.

## Coleção Mavi

Logo oficial fornecida pelo usuário em 01/11/2026: `_briefing/refs/marca/logo-mavi-original.png` (original de `Downloads/logo-mavi.png`). Wordmark MARIADAMAVI rosa em orientação vertical, com amplas margens. Referência oficial para futuras aplicações; o envio foi para uso quando necessário e não solicitou mudança imediata do layout. Preservar desenho e proporções ao aplicar.

Seção adicionada imediatamente após o hero, com título em Archivo condensada, sem serifa, em caixa alta e Mavi em rosa. Bodoni Moda permanece apenas nas capas de próximas edições. Capas enviadas preservadas na ordem: iVogue de outubro, depois Rock in Rio (edição anterior). As propostas «Origens» e «Seu próximo capítulo» foram substituídas por dois cards de próximas edições: «Em construção» (rosa, grade de rascunho e silhueta) e «Desbloqueando» (escuro, halo e silhueta de perfil). Os cards são estáticos, sem falsa interação de desbloqueio. Carrossel por toque, setas e teclado; apenas as duas capas disponíveis abrem em diálogo nativo com Escape. O link vai ao perfil do Instagram enquanto não há URLs individuais. Nenhum conteúdo foi publicado no Instagram.

Arquivos recebidos preservados em `public/colecao/`; o ícone rosa passa a ser o favicon. A sacola rosa segue no mural como arquivo histórico, mantendo a MaviBag atual na seção de embalagem.

Referências técnicas consultadas em 01/11/2026: https://www.apple.com/macbook-pro/liquid-retina-xdr-display/specs/ e https://support.apple.com/en-us/125405. O CNPJ foi validado apenas quanto aos dígitos; não houve consulta cadastral.

Após as fotos e condições comerciais: nove testes aprovados e build concluído. Carrossel, ampliação de capa, fechamento por Escape e restauração de foco verificados no navegador; sem transbordamento da página em 320 e 390 px. Configuração M6 validada na interface com ajuste para 14″ e mensagem correspondente no WhatsApp. Console sem erros. Prévia salva em `../outputs/landing-review/colecao-mavi-desktop.png`.

## Simplificação do MacBook
O configurador completo saiu da landing por ocupar espaço demais. A seção #sob-medida agora usa mac-guide.css e apresenta três links de orientação por uso, com mensagens prontas via whatsapp.js (origem macbook). FAQ atualizado. custom.js, custom-config.js e custom.css permanecem como referência, mas não são importados pela landing; as regras técnicas anteriores não aparecem mais na interface.

## Modalidades da jornada
Seletor acessível Pronta entrega / Encomenda, com encomenda inicialmente selecionada. Pronta entrega: Conversa, Contrato, Pagamento, MaviBag, Envio, Na sua casa; percurso local sem avião/barco e sem promessa de 2–14 dias. Encomenda mantém as sete fases e o prazo após pagamento. Lista móvel, mapa, numeração, texto e mensagem do WhatsApp mudam juntos. A troca reinicia o percurso no desktop. Em telas de até 740px de altura é usada a lista estática para acomodar o seletor.
