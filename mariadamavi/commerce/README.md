# Loja mariadamavi

Destino definido: **https://store.mariadamavi.com.br**. Ainda não publicado.

WordPress + WooCommerce, com tema filho do Storefront. A landing Vite continua independente. A pasta `theme/` contém o código publicável; `.local/` contém somente a demonstração e suas credenciais, ignoradas pelo Git.

## Prévia local

Endereço: http://127.0.0.1:8088. Execute `./commerce/scripts/start-local.ps1` na pasta do projeto. O script sincroniza o tema antes de iniciar o servidor. PHP padrão: `C:\tools\php82\php.exe`; outro caminho pode ser passado em `-Php`.

Instalação utilizada: WordPress 7.1.3, WooCommerce 11.2.1, Storefront 4.6.2 e o plugin oficial SQLite Database Integration. SQLite é apenas para esta prévia; produção precisa da hospedagem WordPress com MySQL/MariaDB. Traduções oficiais pt_BR em wp-content/languages e languages/plugins.

Para reconstruir: extrair WordPress em `.local/wordpress`, WooCommerce e SQLite Database Integration em `wp-content/plugins`, Storefront em `wp-content/themes`; copiar `theme` para `wp-content/themes/mariadamavi-store`. Rodar `bootstrap-local.php` e `seed-local.php` com PHP e extensões `pdo_sqlite`, `sqlite3`. Os scripts só configuram a demonstração local. Credenciais geradas ficam em `.local/access.json`; não as publique.

Catálogo fictício com oito categorias, oito produtos e iPhone com duas capacidades. Os valores e o frete são exemplos. O Checkout Pro do Mercado Pago pode ser usado na prévia em modo de teste. Até o gateway estar disponível, o checkout usa WhatsApp ou o método demonstrativo sem cobrança. E-mails estão bloqueados pelo plugin local. Não migre a base demonstrativa para a loja real.

### Mercado Pago Checkout Pro

Instale o plugin oficial **Mercado Pago payments for WooCommerce** e abra **WooCommerce → Mercado Pago**. Vincule uma conta de teste de vendedor e confira as credenciais de teste na integração. A prévia local só exibe o Checkout Pro em **Modo teste**, com credenciais válidas. O checkout redireciona para o Mercado Pago, onde o cliente seleciona Pix ou cartão parcelado conforme a conta e os meios habilitados. O limite local de teste foi configurado em 12 parcelas.

Para validar a notificação que atualiza o pedido, use um ambiente de homologação com HTTPS e um endpoint de notificação acessível ao Mercado Pago. A prévia em `127.0.0.1` não recebe notificações externas. Cadastre credenciais pelo painel do WordPress e mantenha os dados de teste separados dos de produção.

[Plugin oficial](https://wordpress.org/plugins/woocommerce-mercadopago/) · [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/woocommerce/payments-configuration/checkout-pro) · [Teste no WooCommerce](https://www.mercadopago.com.br/developers/pt/docs/woocommerce/integration-test)

## Publicação na VPS da Hostinger

O `compose.yaml` cria o projeto `mariadamavi-store` com WordPress, MariaDB e volumes persistentes próprios. O Traefik existente recebe apenas a rota HTTPS da loja. O banco fica em uma rede interna e o Compose usa os arquivos do tema e do plugin em modo de leitura.

1. Envie `compose.yaml`, `compose.shared-proxy.yaml`, `.env.example`, `theme/` e `plugins/` para um diretório próprio na VPS, por exemplo `/opt/mariadamavi-store`. Os caminhos relativos dos arquivos precisam estar presentes na VPS. A instalação começa com um banco vazio.
2. Aponte o registro DNS `store` ao IP público da VPS. Use o proxy existente com os nomes `websecure` e `letsencrypt`, conforme o Compose da landing. Durante a instalação e os testes, o Traefik deve receber seu IP diretamente. Se houver CDN na frente, deixe o registro `store` no modo somente DNS durante essa etapa.
3. No diretório da loja, crie `.env` a partir do exemplo com `umask 077; cp -n .env.example .env`. Gere duas senhas distintas com `openssl rand -hex 32` e preencha `STORE_DB_PASSWORD` e `STORE_DB_ROOT_PASSWORD`. Use seu IP público com `/32` para IPv4 ou `/128` para IPv6 em `STORE_ALLOWED_IPS`. Guarde o `.env` no servidor com acesso restrito.
4. Use os comandos abaixo se o Traefik existente estiver em `network_mode: host`, como no cenário descrito no Compose da landing. Se ele estiver em uma rede Docker compartilhada, defina `STORE_PROXY_NETWORK` com o nome dessa rede (por exemplo, `traefik-proxy`) e inclua `-f compose.yaml -f compose.shared-proxy.yaml` depois de `docker compose` em todos os comandos.

```sh
docker compose config --quiet
docker compose up -d --wait
docker compose ps
```

5. Abra `https://store.mariadamavi.com.br` a partir do IP autorizado, instale o WordPress em português e crie o administrador. Pelo painel, instale o Storefront e o WooCommerce oficiais, ative o tema **mariadamavi Store** e configure a página inicial estática, loja, sacola, checkout e minha conta. Em **Configurações → Links permanentes**, salve **Nome do post**.
6. Instale o plugin oficial do Mercado Pago pelo painel e configure o **Checkout Pro**. Habilite Pix, com uma chave Pix cadastrada na conta, e cartão, com o limite de parcelas escolhido pela loja. Valide o checkout e a atualização de pedidos em homologação antes de conectar a conta de produção. Se quiser manter o WhatsApp como fallback, use o shortcode `[woocommerce_checkout]` na página de finalização e ative **Mavi — finalizar pelo WhatsApp** em Plugins e em **WooCommerce → Configurações → Pagamentos**.
7. Cadastre produtos reais, preços, estoque e frete. Configure dados da empresa, políticas, e-mails e backups do banco e do volume WordPress. Teste produto, sacola, checkout e pedido no painel antes de abrir o acesso.
8. Para liberar a loja ao público, ajuste `STORE_ALLOWED_IPS=0.0.0.0/0,::/0` no `.env` e reaplique `docker compose up -d --wait`. Valide o domínio e o certificado fora do IP usado na instalação. Depois disso, os links da landing para a loja podem ser publicados.

Para atualizar o tema ou o plugin, atualize suas pastas no servidor. Antes de atualizar o WordPress, o WooCommerce ou o MariaDB, faça backup do banco e do volume WordPress. Preserve os volumes ao recriar os contêineres.

[Guia da Hostinger para projetos Compose atrás do Traefik](https://www.hostinger.com/support/connecting-multiple-docker-compose-projects-using-traefik-in-hostinger-docker-manager/)

## Assets

Imagens em `theme/assets/*.webp` reutilizam as imagens Apple já documentadas em `_briefing/05-assets.md`, apenas para ilustrar categorias. Archivo vem do pacote `@fontsource-variable/archivo` do projeto, licença OFL incluída. Storefront é distribuído separadamente pelo WordPress.org.

### Refinamento visual da loja — 28/10/2026
- Miniaturas sem corte quadrado, fundo suave e espaço para o produto inteiro.
- Busca com foco único, ícone e autocomplete de histórico desativado no formulário.
- Capacidades em botões sincronizados com as variações nativas WooCommerce, com fallback select sem JS.
- Quantidade com menos/mais e limites nativos. Inputs/selects e Select2 estilizados.
- Testados preço por variação, limpar seleção, teclado, quantidade e inclusão de iPhone 256 GB no carrinho; visual revisado em 390px.

### Conteúdo da home — 28/10/2026
- Hero complementado por banners de iPhone (categoria) e MacBook sob medida (WhatsApp com mensagem própria).
- Prova de 500+ pedidos conforme PRODUCT.md; banner MaviBag usa foto real já presente em public/quem-somos/mavibag.jpg.
- Guia de escolha, prazo de encomenda e acompanhamento após catálogo. Sem ofertas ou estoques inventados.
- Revisão visual desktop/390px; link de categoria e mensagens dos banners verificados.

### Checkout temporário pelo WhatsApp — 30/10/2026
- Plugin separado: commerce/plugins/mavi-whatsapp. Instalável: commerce/dist/mavi-whatsapp.zip.
- Ativado na prévia. Checkout clássico registra pedido como on-hold (aguardando confirmação, não pago) e redireciona ao WhatsApp 5521920184210 com número, itens, variações, quantidades, frete estimado e total.
- Cliente precisa tocar em Enviar no WhatsApp. Abrir a conversa não comprova envio ou pagamento. Endereço, email, telefone e chave privada do pedido não vão no link.
- O Checkout Pro tem preferência quando está disponível. O método WhatsApp continua exclusivo enquanto estiver habilitado e o Checkout Pro estiver indisponível.
- Compatível com o checkout clássico usado nesta loja; não trocar a página por Checkout Blocks sem implementar integração de blocos.
- Teste: commerce/scripts/test-whatsapp-local.php validou destino, variação, quantidade, total, status não pago e privacidade; pedido de teste cancelado ao terminar. Nenhuma mensagem enviada.
- Hospedagem e publicação continuam pendentes. Instalar e ativar este plugin além do tema na produção; habilitar o método em Pagamentos.
