# Simulador de upgrade

Rota pública: `/simular-upgrade/` (o Nginx também atende `/simular-upgrade` com redirecionamento de diretório). O Vite gera HTML independente da landing. O Dockerfile e o gerador de CSP incluem essa página.

O formulário é contínuo. Começa sem um modelo selecionado; ao escolher o usado, revela memória, conservação e destino na mesma página. Os dois seletores de modelo são comboboxes próprios, com busca, lista rolável, teclado, Escape e fechamento ao clicar fora. O campo oculto armazena apenas a seleção confirmada: digitar uma busca ou fechá-la não troca o modelo nem a estimativa. O componente está em `src/upgrade/model-picker.js` e seu visual em `src/styles/model-picker.css`.

## Dados e regras

`public/config/upgrade.json` é o contrato público de configuração, carregado sem cache de aplicação. Ele contém modelos, capacidades, valores-base em centavos, avarias, aparência, preços de destino, bônus e taxas. Não contém credenciais nem dados internos de clientes. Só informações que possam ser vistas pelos visitantes devem entrar neste arquivo.

Os 92 valores-base são os da tabela pública sugerida do QuantoPega para iPhones 11 em diante, consultada em 04/11/2026 em https://quantopega.com.br/quanto-vale. Os descontos globais iniciais foram observados na demonstração pública do iPhone 13 128GB: marcas leves 178, moderadas 400, bateria 250, tela 350, traseira 225, Face ID 450, conector 250, câmera 400 e alertas de peça câmera 720/bateria 309/tela 309 (reais). Não foram consultados preços privados nem criada conta no serviço. Os valores importados são um snapshot; não há dependência de rede do QuantoPega em tempo de uso.

Cada modelo pode sobrescrever descontos com `deductions: { "battery": 30000 }`. Aparência é uma escolha exclusiva para evitar cobrar duas vezes pelo mesmo desgaste. As outras avarias são somadas, sem duplicar IDs, e o valor do usado nunca fica abaixo de zero. Aparelhos que não ligam ou têm bloqueio de iCloud recebem avaliação individual, sem preço automático.

Preços de venda em `targets[].capacities[].prices.sealed/used` estão `null` até a Mavi informar sua tabela. Não se usa o preço de compra de usado como preço de venda. Sem preço de destino, o simulador calcula o usado e pede a diferença à Maria. Taxas `cardRatesBasisPoints` também ficam `null`: parcelas ficam sob consulta. Quando preenchidas, a taxa representa acréscimo total em pontos-base (1200 = 12% sobre a diferença), não juros mensais. A UI mostra parcela aproximada e total.

O bônus da referência está modelado, mas desativado, pois não foi confirmado como condição de venda da Mavi.

## Futuro painel

`src/upgrade/calculator.js` é independente do DOM e da origem da configuração. `src/upgrade/main.js` carrega a configuração, controla o formulário e monta o resumo do WhatsApp. O próximo passo pode trocar o carregador por uma API sem reescrever os cálculos. O painel deverá publicar uma configuração validada e versionada, com autorização no servidor, histórico de alterações e separação de dados públicos e internos. Esta etapa não cria autenticação, banco de dados, persistência de leads nem editor público de preços.

## Validação e publicação

`npm test` cobre valores de referência, avarias, bloqueios, piso zero, taxas ausentes, bônus, arredondamento e entradas inválidas. `npm run build` compila as três páginas e gera a CSP do conjunto. Publique o build e os cabeçalhos juntos. O link da seção de troca na landing leva ao simulador; o sitemap inclui a nova rota. A saída pelo WhatsApp abre apenas uma conversa com resumo pré-preenchido; não envia mensagem automaticamente.
