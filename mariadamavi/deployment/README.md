# Publicação da landing — Docker / Easypanel

Preparado em 02/11/2026. As correções estão no projeto local; ainda não foram publicadas na VPS.

## Easypanel com Git/GitHub

1. Envie as alterações deste projeto à origem já utilizada pelo serviço da landing, incluindo `public/optimized/`, `src/styles/fonts.css` e `scripts/`. Nenhum commit/push foi realizado por esta tarefa.
2. No serviço existente, confira Source e Build Path: deve apontar à pasta que contém este `package.json` e `Dockerfile` (`/mariadamavi` se a raiz do repositório for a pasta acima).
3. Em Build, use **Dockerfile**, caminho `Dockerfile`. Mantenha a porta interna **80** e os domínios/HTTPS existentes.
4. Execute Deploy. O build gera o site e os hashes da CSP juntos, copia ambos ao Nginx e executa `nginx -t` antes de concluir a imagem.
5. Confira o log e valide o domínio público conforme a lista abaixo. O Docker local estava sem daemon ativo; a construção da imagem e `nginx -t` ainda precisam passar no servidor.

## Easypanel com Upload

O pacote `mariadamavi-pagespeed-2026-11-02.zip`, entregue em `../outputs/landing-review/`, contém uma versão já compilada: `dist/`, configuração do Nginx, cabeçalhos e Dockerfile próprio. Use esse ZIP no serviço existente, Build Path `/`, builder Dockerfile e porta 80. O Dockerfile do pacote serve exatamente o build auditado, sem recompilar com npm. Ele também roda `nginx -t`.

Não misture HTML/JS de um build com `security-headers.conf` de outro: os hashes devem corresponder. Publique a imagem inteira. Para voltar à versão anterior, use a imagem/deployment anterior preservada pelo seu fluxo de publicação.

## Docker Compose pelo terminal, se esse for o fluxo atual

Execute a partir desta pasta, após atualizar seus arquivos. Confirme o projeto existente `mariadamavi-landing` e preserve a imagem anterior para reversão:

```sh
docker compose config --quiet
docker compose build site
docker compose run --rm --no-deps site nginx -t
docker compose up -d --no-deps site
docker compose logs --tail=60 site
```

O Compose existente utiliza Traefik, sem porta publicada no host. Não crie um segundo serviço pelo Compose se a aplicação já for gerenciada como App no Easypanel.

## Conferência após publicar

- Abrir o site em janela anônima: menu móvel, catálogo, duas capas ampliadas, vídeo sob clique, MaviBag e seletor Pronta entrega / Encomenda.
- Na resposta HTML, verificar CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, COOP e HSTS. HSTS aplica-se ao domínio atual, sem `includeSubDomains`/preload.
- Arquivos `/assets/` e `/optimized/`: cache de um ano. HTML: revalidação. Conteúdo textual: gzip quando aceito pelo cliente. AVIF/WebP devem retornar MIME de imagem; fontes WOFF2 devem retornar MIME de fonte.
- Não pode haver erros de CSP no console, erros de carregamento ou arquivos 404 da própria página.
- Rodar novamente o PageSpeed no endereço público. A medição local não substitui a rede, proxy e CPU do teste público.

Se a hospedagem utilizar Nginx fora do container, `nginx-performance.conf` é apenas um fragmento para mesclar ao servidor HTTPS existente. Nesse caso, copie o arquivo gerado de segurança para o caminho indicado, preserve certificados e os demais sites e valide com `nginx -t` antes do reload. Não é necessário aplicar esse fragmento separadamente quando usar o Dockerfile entregue.

## Manutenção

- `npm run build` é obrigatório a cada alteração de HTML/JS; ele atualiza integridade, CSP e gzip.
- `npm run images:optimize` regenera as imagens responsivas sem alterar os originais.
- `npm test` executa os testes existentes. `npm run preview:production` reproduz localmente os cabeçalhos e a compressão; não substitui o teste do Nginx real.
- As fontes preservam os caracteres latinos existentes e os eixos usados pela landing. Novos idiomas/eixos/pesos fora desses intervalos exigem rever `scripts/optimize-fonts.py`; licenças SIL OFL acompanham os arquivos.

Referências: [Builders do Easypanel](https://easypanel.io/docs/builders), [herança de cabeçalhos do Nginx](https://nginx.org/en/docs/http/ngx_http_headers_module.html).
