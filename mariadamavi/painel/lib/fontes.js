// De onde vêm os dados. As duas fontes devolvem os registros no formato do Mercado Phone
// (mesmos nomes de campo), e lib/calculos.js transforma isso no que as telas mostram.
//
// FONTE=demo          dados fictícios, para testar sem chave.
// FONTE=mercadophone  API REST do Mercado Phone.
import { gerarDemo } from './demo.js';

export function criarFonte(env) {
  if ((env.FONTE || 'demo') === 'demo') {
    const demo = gerarDemo(new Date());
    return {
      nome: 'demo',
      estoque: async () => demo.estoque,
      vendas: async () => demo.vendas,
      parcelas: async () => demo.parcelas,
    };
  }
  return criarFonteMercadoPhone(env);
}

// Cliente da API REST do Mercado Phone.
// Endereço, cabeçalho de autenticação e caminhos vêm do .env, porque dependem da
// documentação que o Mercado Phone libera para a sua conta. Os nomes de campo dos
// registros (dataVenda, totalVenda, valorCusto, dataVencimento...) são os mesmos que
// a conta já devolve hoje.
function criarFonteMercadoPhone(env) {
  const base = (env.MP_API_BASE || '').replace(/\/$/, '');
  const token = env.MP_API_TOKEN || '';
  if (!base || !token) throw new Error('Defina MP_API_BASE e MP_API_TOKEN no .env (veja painel/README.md).');

  const cabecalhos = {
    Accept: 'application/json',
    [env.MP_AUTH_HEADER || 'Authorization']: `${env.MP_AUTH_PREFIX ?? 'Bearer '}${token}`,
  };
  const caminho = {
    estoque: env.MP_PATH_ESTOQUE || '/estoque',
    vendas: env.MP_PATH_VENDAS || '/vendas',
    financeiro: env.MP_PATH_FINANCEIRO || '/financeiro',
  };
  const porPagina = Number(env.MP_POR_PAGINA || 100);
  const mesesHistorico = Number(env.MESES_HISTORICO || 18);

  async function pedir(rota, params) {
    const url = new URL(base + rota);
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
    for (let tentativa = 0; ; tentativa++) {
      const res = await fetch(url, { headers: cabecalhos, signal: AbortSignal.timeout(20_000) });
      if (res.status === 429 && tentativa < 3) {
        const espera = Number(res.headers.get('retry-after') || 5);
        await new Promise((r) => setTimeout(r, espera * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`Mercado Phone respondeu ${res.status} em ${rota}`);
      return res.json();
    }
  }

  // Aceita as formas comuns de lista paginada: {items,total}, {data,total}, {content} ou um array.
  async function todasAsPaginas(rota, params = {}) {
    const itens = [];
    for (let page = 1; page <= 200; page++) {
      const resposta = await pedir(rota, { ...params, page, limit: porPagina });
      const lote = Array.isArray(resposta) ? resposta : resposta.items || resposta.data || resposta.content || [];
      itens.push(...lote);
      const total = resposta.total ?? resposta.totalElements;
      if (lote.length < porPagina || (total != null && itens.length >= total)) break;
    }
    return itens;
  }

  const desde = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - mesesHistorico);
    return d.toISOString().slice(0, 10);
  };

  return {
    nome: 'mercadophone',
    // Itens em estoque e também os zerados (vendidos): o custo deles é usado no lucro das vendas.
    estoque: async () => {
      const [disponiveis, zerados] = await Promise.all([
        todasAsPaginas(caminho.estoque),
        todasAsPaginas(caminho.estoque, { [env.MP_PARAM_ZERADOS || 'zero_or_negative_stock']: 'true' }),
      ]);
      return [...disponiveis, ...zerados];
    },
    vendas: () => todasAsPaginas(caminho.vendas, { dataVendaInicial: desde() }),
    parcelas: () => todasAsPaginas(caminho.financeiro, { dataVencimentoInicial: desde() }),
  };
}
