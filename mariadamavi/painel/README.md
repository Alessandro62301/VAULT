# Painel interno — Maria da Mavi

Painel só de leitura com **estoque, vendas e fiado (crediário)**, puxados do Mercado Phone.
As vendas continuam sendo criadas no Mercado Phone, e os juros continuam sendo calculados por fora e lançados na venda. O painel só lê esses dados e não altera nada lá.

- **Resumo:** vendido e lucro do mês, fiado a receber e atrasado, quem cobrar agora, vendas dos últimos 6 meses, aparelhos parados.
- **Estoque:** custo, preço, margem, bateria, IMEI e há quantos dias cada peça está parada.
- **Vendas:** por período, com lucro de cada venda e a origem (indicação, Instagram...).
- **Fiado:** cliente por cliente, parcelas pagas, em aberto e atrasadas, e um botão para chamar no WhatsApp.

Não usa nenhuma dependência externa: basta Node 20.6 ou mais novo.

## Testar no computador (dados fictícios)

```bash
cd painel
npm run demo
```

Abra http://localhost:3030. A senha é `demo`.

## Instalar na VPS

### 1. Copiar e configurar

```bash
cd /var/www/mariadamavi/painel        # ou onde o projeto estiver
cp .env.example .env
npm run senha -- "uma senha forte aqui"
```

Cole no `.env` as duas linhas que o comando mostrar (`PAINEL_SENHA_HASH` e `SESSION_SECRET`).
Enquanto a API do Mercado Phone não estiver configurada, mantenha `FONTE=demo`.

### 2. Deixar rodando (systemd)

`/etc/systemd/system/painel-mavi.service`:

```ini
[Unit]
Description=Painel interno Maria da Mavi
After=network.target

[Service]
WorkingDirectory=/var/www/mariadamavi/painel
ExecStart=/usr/bin/node --env-file=.env server.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now painel-mavi
```

### 3. Publicar com HTTPS (Nginx)

Use um subdomínio, por exemplo `painel.seudominio.com.br`:

```nginx
server {
  server_name painel.seudominio.com.br;
  location / {
    proxy_pass http://127.0.0.1:3030;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

```bash
sudo certbot --nginx -d painel.seudominio.com.br
```

O painel escuta só em `127.0.0.1`, então ele só pode ser acessado pelo Nginx. Com HTTPS ativo, deixe `PAINEL_COOKIE_SECURE=1`.

## Ligar a API do Mercado Phone

Toda a comunicação com o Mercado Phone fica em `lib/fontes.js`. Quando você tiver o token e a documentação da API:

1. Preencha no `.env`: `MP_API_BASE`, `MP_API_TOKEN` e, se a documentação pedir algo diferente, o cabeçalho de autenticação (`MP_AUTH_HEADER`, `MP_AUTH_PREFIX`) e os caminhos (`MP_PATH_ESTOQUE`, `MP_PATH_VENDAS`, `MP_PATH_FINANCEIRO`).
2. Troque `FONTE=demo` por `FONTE=mercadophone`.
3. Reinicie o painel: `sudo systemctl restart painel-mavi`.

O painel já usa os mesmos nomes de campo que a sua conta devolve hoje (`dataVenda`, `totalVenda`, `valorCusto`, `dataVencimento`, `valorTotalPagamento`...).
Se a API REST usar nomes diferentes, o ajuste é feito em `lib/calculos.js`, nas funções `normalizar*`.

O token **nunca** vai para o navegador nem para o git (`painel/.env` está no `.gitignore`).

## Como os números são calculados

- **Lucro:** valor da venda menos o custo do produto cadastrado no estoque. Vendas sem custo cadastrado aparecem com "—" e ficam fora da soma.
- **Fiado:** lançamentos a receber. Uma parcela está paga quando o valor pago cobre o valor dela; se não estiver paga e o vencimento já passou, está atrasada. O cliente é identificado pelo número da venda que aparece no título do lançamento ("Crediário da venda #…").
- **Cache:** os dados ficam guardados por `CACHE_MINUTOS` (padrão: 5). O botão **Atualizar** busca tudo de novo na hora.
