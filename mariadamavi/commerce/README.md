# Loja mariadamavi

Destino definido: **https://store.mariadamavi.com.br**. Ainda não publicado.

WordPress + WooCommerce, com tema filho do Storefront. A landing Vite continua independente. A pasta `theme/` contém o código publicável; `.local/` contém somente a demonstração e suas credenciais, ignoradas pelo Git.

## Prévia local

Endereço: http://127.0.0.1:8088. Execute `./commerce/scripts/start-local.ps1` na pasta do projeto. O script sincroniza o tema antes de iniciar o servidor. PHP padrão: `C:\tools\php82\php.exe`; outro caminho pode ser passado em `-Php`.

Instalação utilizada: WordPress 7.1.3, WooCommerce 11.2.1, Storefront 4.6.2 e o plugin oficial SQLite Database Integration. SQLite é apenas para esta prévia; produção precisa da hospedagem WordPress com MySQL/MariaDB. Traduções oficiais pt_BR em wp-content/languages e languages/plugins.

Para reconstruir: extrair WordPress em `.local/wordpress`, WooCommerce e SQLite Database Integration em `wp-content/plugins`, Storefront em `wp-content/themes`; copiar `theme` para `wp-content/themes/mariadamavi-store`. Rodar `bootstrap-local.php` e `seed-local.php` com PHP e extensões `pdo_sqlite`, `sqlite3`. Os scripts só configuram a demonstração local. Credenciais geradas ficam em `.local/access.json`; não as publique.

Catálogo fictício: oito categorias, oito produtos, iPhone com duas capacidades. Valores e frete são exemplos, imagens são ilustrativas. Checkout de teste usa BACS sem dados bancários, identificado como sem cobrança. PIX/cartão reais ainda não foram integrados. E-mails estão bloqueados pelo plugin local. Não migre a base demonstrativa para a loja real.

## Publicação

1. Definir hospedagem WordPress com HTTPS e banco MySQL/MariaDB; apontar o registro DNS `store` conforme a hospedagem. Não alterar o domínio raiz da landing.
2. Instalar WordPress em pt_BR, WooCommerce e Storefront; instalar e ativar o ZIP do tema filho. Criar página inicial estática, loja, sacola, checkout e minha conta pelo WooCommerce.
3. Cadastrar produtos reais, fotos correspondentes, preços, variações, estoque e prazos. O hero usa imagem genérica de MacBook, ilustrativa.
4. Configurar conta de pagamentos e plugin oficial do provedor escolhido para PIX/cartão; validar sandbox, webhooks e mudança de status de pedidos antes de habilitar produção. Nunca colocar chaves no tema ou Git.
5. Configurar frete real, dados da empresa, privacidade, termos e política de troca/devolução. Validar mensagens transacionais e backups.
6. Testar compra completa, pagamento recusado, estoque, entrega e pedido no painel. Só então ativar os links públicos da landing para a loja.

O tema não embute credenciais nem gateway de demonstração. O plugin de segurança local e banco SQLite não fazem parte do ZIP. Não deixe produtos de exemplo à venda.

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
- Método exclusivo enquanto habilitado. Para retomar checkout online: WooCommerce → Configurações → Pagamentos → desativar Mavi WhatsApp e configurar gateway PIX/cartão.
- Compatível com o checkout clássico usado nesta loja; não trocar a página por Checkout Blocks sem implementar integração de blocos.
- Teste: commerce/scripts/test-whatsapp-local.php validou destino, variação, quantidade, total, status não pago e privacidade; pedido de teste cancelado ao terminar. Nenhuma mensagem enviada.
- Hospedagem e publicação continuam pendentes. Instalar e ativar este plugin além do tema na produção; habilitar o método em Pagamentos.
