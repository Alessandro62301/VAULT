// Painel interno da Maria da Mavi: lê estoque, vendas e crediário do Mercado Phone
// e mostra um resumo. Só leitura: nada é criado ou alterado no Mercado Phone.
// Sem dependências: rode com `node --env-file=.env server.js`.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarSessao, lerSessao, conferirSenha, cookieSessao, cookieSaida, limitarTentativas } from './lib/auth.js';
import { comCache, limparCache } from './lib/cache.js';
import { criarFonte } from './lib/fontes.js';
import { montarResumo, montarEstoque, montarVendas, montarFiado } from './lib/calculos.js';

const raiz = dirname(fileURLToPath(import.meta.url));
const publico = join(raiz, 'public');
const PORT = Number(process.env.PORT || 3030);
const HOST = process.env.HOST || '127.0.0.1';
const fonte = criarFonte(process.env);
const cacheMs = Number(process.env.CACHE_MINUTOS || 5) * 60_000;

const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const dados = {
  estoque: () => comCache('estoque', cacheMs, () => fonte.estoque()),
  vendas: () => comCache('vendas', cacheMs, () => fonte.vendas()),
  parcelas: () => comCache('parcelas', cacheMs, () => fonte.parcelas()),
};

async function tudo() {
  const [estoque, vendas, parcelas] = await Promise.all([dados.estoque(), dados.vendas(), dados.parcelas()]);
  return { estoque, vendas, parcelas, hoje: new Date() };
}

const rotas = {
  'GET /api/sessao': async () => ({ ok: true, fonte: fonte.nome }),
  'GET /api/resumo': async () => montarResumo(await tudo()),
  'GET /api/estoque': async () => montarEstoque(await tudo()),
  'GET /api/vendas': async (url) => montarVendas(await tudo(), { de: url.searchParams.get('de'), ate: url.searchParams.get('ate') }),
  'GET /api/fiado': async () => montarFiado(await tudo()),
  'POST /api/atualizar': async () => { limparCache(); return { ok: true }; },
};

function json(res, status, corpo, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(corpo));
}

async function lerCorpo(req) {
  let texto = '';
  for await (const parte of req) {
    texto += parte;
    if (texto.length > 10_000) throw new Error('corpo grande demais');
  }
  return texto ? JSON.parse(texto) : {};
}

async function servirArquivo(res, caminho) {
  const alvo = normalize(join(publico, caminho === '/' ? 'index.html' : caminho));
  if (!alvo.startsWith(publico)) return json(res, 404, { erro: 'não encontrado' });
  try {
    const conteudo = await readFile(alvo);
    res.writeHead(200, { 'Content-Type': tipos[extname(alvo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(conteudo);
  } catch {
    json(res, 404, { erro: 'não encontrado' });
  }
}

const servidor = createServer(async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const url = new URL(req.url, 'http://painel');

  try {
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const ip = req.headers['x-real-ip'] || req.socket.remoteAddress;
      if (!limitarTentativas(ip)) return json(res, 429, { erro: 'Muitas tentativas. Espere 15 minutos.' });
      const { senha } = await lerCorpo(req);
      if (!conferirSenha(String(senha || ''))) return json(res, 401, { erro: 'Senha incorreta.' });
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookieSessao(criarSessao()) });
    }
    if (req.method === 'POST' && url.pathname === '/api/logout') {
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookieSaida() });
    }

    const rota = rotas[`${req.method} ${url.pathname}`];
    if (rota) {
      if (!lerSessao(req.headers.cookie)) return json(res, 401, { erro: 'Entre de novo.' });
      return json(res, 200, await rota(url));
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { erro: 'não encontrado' });
    if (req.method !== 'GET') return json(res, 405, { erro: 'método não permitido' });
    return servirArquivo(res, url.pathname);
  } catch (erro) {
    console.error(`[painel] ${req.method} ${url.pathname}:`, erro);
    return json(res, 502, { erro: 'Não consegui falar com o Mercado Phone agora. Tente de novo em instantes.' });
  }
});

servidor.listen(PORT, HOST, () => {
  console.log(`[painel] rodando em http://${HOST}:${PORT} (fonte: ${fonte.nome})`);
});
