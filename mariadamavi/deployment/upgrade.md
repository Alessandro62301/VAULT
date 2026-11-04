# Simulador de upgrade

Rota pública: `/simular-upgrade/` (o Nginx também atende `/simular-upgrade` com redirecionamento de diretório). O Vite gera HTML independente da landing. O Dockerfile e o gerador de CSP incluem essa página.

O formulário é contínuo. Começa sem um modelo selecionado; ao escolher o usado, revela memória, conservação e destino na mesma página. Os dois seletores de modelo são comboboxes próprios, com busca, lista rolável, teclado, Escape e fechamento ao clicar fora. O campo oculto armazena apenas a seleção confirmada: digitar uma busca ou fechá-la não troca o modelo nem a estimativa. O componente está em `src/upgrade/model-picker.js` e seu visual em `src/styles/model-picker.css`.

## Dados e regras

`public/config/upgrade.json` é o contrato público de configuração, carregado sem cache de aplicação. Ele contém modelos, capacidades, valores-base em centavos, avarias, aparência, preços de destino, bônus e taxas. Não contém credenciais nem dados internos de clientes. Só informações que possam ser vistas pelos visitantes devem entrar neste arquivo.

Os 92 valores-base são os da tabela pública sugerida do QuantoPega para iPhones 11 em diante, consultada em 04/11/2026 em https://quantopega.com.br/quanto-vale. Os descontos vêm da tabela fornecida pelo usuário em 04/11/2026, com alinhamento de campos incompletos conferido na interface pública. Foram aplicados 1.003 descontos numéricos e 9 campos sem valor nas 92 combinações do catálogo atual. A extração completa está em `tests/fixtures/upgrade-discounts.json`; o script `scripts/extract-upgrade-discounts.mjs` reproduz a extração. O hash da tabela original está em `source.providedTableSha256`. Os valores importados são um snapshot; não há dependência de rede do QuantoPega em tempo de uso.

O contrato usa `schemaVersion: 2`. Cada capacidade de cada usado contém `deductions` com todas as 11 condições, em centavos inteiros ou `null`. Não existe desconto genérico de reserva: uma tabela parcial é rejeitada. `null` significa que não foi informado um valor; zero explícito significa ausência de desconto. As definições de aparência e avarias contêm apenas metadados. Aparência é uma escolha exclusiva para evitar cobrar duas vezes pelo mesmo desgaste. As outras avarias são somadas, sem duplicar IDs, e o valor do usado nunca fica abaixo de zero. Selecionar uma condição com preço `null`, informar que o aparelho não liga ou que tem bloqueio de iCloud exige avaliação individual, sem cotação automática ou diferença calculada. O WhatsApp informa os itens sem valor tabelado.

Preços de venda em `targets[].capacities[].prices.sealed/used` estão `null` até a Mavi informar sua tabela. Não se usa o preço de compra de usado como preço de venda. Sem preço de destino, o simulador calcula o usado e pede a diferença à Maria. Taxas `cardRatesBasisPoints` também ficam `null`: parcelas ficam sob consulta. Quando preenchidas, a taxa representa acréscimo total em pontos-base (1200 = 12% sobre a diferença), não juros mensais. A UI mostra parcela aproximada e total.

O bônus da referência está modelado, mas desativado, pois não foi confirmado como condição de venda da Mavi.

## Futuro painel

`src/upgrade/calculator.js` é independente do DOM e da origem da configuração. `src/upgrade/main.js` carrega a configuração, controla o formulário e monta o resumo do WhatsApp. O próximo passo pode trocar o carregador por uma API sem reescrever os cálculos. O painel deverá publicar uma configuração validada e versionada, com autorização no servidor, histórico de alterações e separação de dados públicos e internos. Esta etapa não cria autenticação, banco de dados, persistência de leads nem editor público de preços.

## Validação e publicação

`npm test` cobre valores de referência, avarias, bloqueios, piso zero, taxas ausentes, bônus, arredondamento e entradas inválidas. `npm run build` compila as três páginas e gera a CSP do conjunto. Publique o build e os cabeçalhos juntos. O link da seção de troca na landing leva ao simulador; o sitemap inclui a nova rota. A saída pelo WhatsApp abre apenas uma conversa com resumo pré-preenchido; não envia mensagem automaticamente.
