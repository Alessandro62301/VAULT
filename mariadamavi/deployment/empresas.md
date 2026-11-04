# Empresas e WeSales — entrega local, 04/11/2026

Página: `/empresas/`; `/empresas` redireciona preservando os parâmetros. Sem commit, deploy ou publicação. A referência visual B2B enviada foi aplicada à seção Empresas da home, com título centralizado, fotografia real da MaviBag e quatro diferenciais. A página /empresas/ preserva a primeira versão: hero em duas colunas, imagem de MacBook e bloco de três diferenciais. Não foram usados texto, imagens, logos de clientes ou alegações comerciais da Wave. O mural de feedbacks fica para uma etapa futura, com material real da Mavi.

## Arquivos desta etapa

- `empresas/index.html`: página, SEO, JSON-LD, formulário e rodapé reaproveitado.
- `src/empresas/main.js`, `src/empresas/style.css`: interações mínimas, lazy loading do helper e apresentação responsiva.
- `index.html`, `src/main.js`, `src/styles/business-link.css`: resumo B2B, links no menu/rodapé e acesso à página. Mensagens de WhatsApp preservadas.
- `src/js/wesales.js`, `src/js/measurement.js`: carregamento condicionado ao consentimento e domínio, política Trusted Types com duas URLs exatas, evento `lead_form_open`.
- `simular-upgrade/index.html`: explicação dos dois provedores no banner.
- `v2/index.html`, `src/v2/main.js`, `src/v2/privacy.css`: mesmo consentimento e rastreamento também na versão alternativa pública.
- `vite.config.js`, `nginx.conf`, `scripts/serve-production.mjs`: entrada multipágina, redirecionamentos e preview.
- `scripts/finalize-build.mjs`, `deployment/security-headers.conf`, `deployment/security-headers.json`: hashes e CSP do build de quatro páginas.
- `public/sitemap.xml`: nova rota.
- `tests/wesales.test.js`: proteção de consentimento/domínios, duplicidade de scripts, eventos sem dados pessoais e recusa posterior.
- `deployment/empresas.md`: este relatório.

As alterações anteriores do simulador, sua tabela e seus testes foram preservadas; não fazem parte desta nova etapa.

## CSP — adições

| Origem | Diretiva | Motivo |
| --- | --- | --- |
| `https://api.leadconnectorhq.com` | `frame-src` | Formulário fornecido pelo usuário. Carregou no preview sem violação de CSP. |
| `https://link.msgsndr.com` | `script-src` | `form_embed.js` para altura automática e `external-tracking.js` após consentimento em produção. |
| `https://backend.leadconnectorhq.com` | `connect-src` | Endpoint de produção declarado no código público do rastreamento WeSales consultado nesta etapa. Necessário para configuração e eventos do rastreador. Não foi exercitado por tráfego real no preview, onde o rastreador permanece desativado. |

Nenhum wildcard novo. As origens Google já existentes foram mantidas. Não houve liberação adicional de `img-src`. Os domínios internos ao iframe, incluindo o Cloudflare, não precisam ser adicionados à CSP da página hospedeira.

`require-trusted-types-for 'script'`, `strict-dynamic` e os hashes permanecem ativos. A política adicional `mavi-wesales` só aceita as duas URLs exatas de scripts informadas. Não existe política padrão que aceite HTML. No layout INLINE do fornecedor, `allowMinimize: true` evita a construção desnecessária do ícone de fechar com `innerHTML`; não adiciona botão nem altera o formulário, e mantém a proteção Trusted Types.

## Afirmações e fontes

| Afirmação na página | Fonte existente |
| --- | --- |
| Apple para equipes, escolha por uso/quantidade/prazo | Seção Empresas e FAQ da home; PRODUCT.md, Users e Product Principles. |
| Modelos MacBook, iPhone e iPad | Catálogo da home e PRODUCT.md, Product Purpose. |
| Atendimento direto com Maria | Home e PRODUCT.md, Positioning. |
| Nota fiscal, contrato; valores e prazos por escrito | Seção Empresas e jornada da home; PRODUCT.md, Capabilities and Constraints. |
| Lacrados: 1 ano com Apple; seminovos: 6 meses com Mavi | FAQ, rodapé e PRODUCT.md, Capabilities and Constraints. |
| Frete segurado, rastreio pelo WhatsApp e pós-venda | Jornada e rodapé da home; PRODUCT.md, Operating Context. |
| CNPJ, contato, atendimento 24h, até 18x com juros, encomendas 2–14 dias úteis após pagamento, regras de troca | Rodapé integral reaproveitado e PRODUCT.md; nenhum dado novo. |
| Fotografia e cuidado da MaviBag | Foto real já usada na home, `public/optimized/mavibag-900-1356d15f4d.webp`; PRODUCT.md, Brand Commitments. |

Nenhuma promessa de desconto por volume, pagamento especial B2B, embalagem corporativa personalizada, cliente parceiro ou depoimento foi adicionada.

## Validação e limites

- `npm test`: 33 testes aprovados.
- `npm run build`: aprovado, quatro páginas incluídas nos hashes e gzip.
- `npm run preview:production`: validação com CSP, desktop de 1280px e celular de 390px; página sem transbordamento horizontal. Link da home e mensagens corporativas de WhatsApp conferidos.
- `/empresas` respondeu 301; `/empresas/` respondeu 200 com `no-cache` e a mesma CSP gerada. Hashes das quatro páginas conferidos.
- Formulário externo visível; helper redimensionou o iframe (aproximadamente 1032px no desktop e 1072px no celular durante a conferência). Contêiner reserva 1180/1240px para absorver o ajuste, sem esconder conteúdo nem criar rolagem interna deliberada.
- Nenhum bloqueio de CSP ou Trusted Types encontrado. O Turnstile/Cloudflare interno do fornecedor produziu mensagens de console próprias. Não foi resolvido CAPTCHA nem enviado um lead.
- Antes e depois de permitir no preview: nenhum script de rastreamento WeSales ou Google carregado. Isso é intencional: localhost/preview jamais são autorizados. O fluxo real do módulo foi exercitado em teste isolado com hostname de produção, incluindo concessão, recusa salva e ausência de consentimento.
- O teste de produção não publica código nem confirma recebimento na conta WeSales/GA4. Essa confirmação depende de futura publicação autorizada e da conferência no CRM.
- O comportamento HTTP foi validado no servidor Node de preview com os cabeçalhos gerados. Não foi executado `nginx -t` em uma imagem Docker nesta etapa; a validação do Nginx na imagem continua no Dockerfile existente.
- `lead_form_open` usa `section: empresas`, só após consentimento. Não há evento `lead_form_submit`: o iframe é de outro domínio e não foi adotado um sinal documentado e confiável de sucesso. Não se interpreta load/resize como conversão.
- Ao revogar consentimento após carregar o rastreador, a escolha é salva e a página recarrega: isso remove os listeners automáticos do fornecedor, que não oferece teardown documentado. No novo carregamento, não se instala o rastreador.

## Confirmações e etapa futura

Nenhum dado comercial novo ficou pendente ou foi presumido. Para o futuro mural, enviar prints/depoimentos reais da Mavi autorizados para publicação. Para contabilizar envios reais no GA4, será necessário um sinal de sucesso documentado do WeSales ou integração de backend; por enquanto só abertura é medida.
