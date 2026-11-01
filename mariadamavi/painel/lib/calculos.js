// Transforma os registros do Mercado Phone no que cada tela do painel mostra.

export const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const somarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const diasEntre = (de, ate) => Math.round((Date.parse(ate) - Date.parse(de)) / 86_400_000);
const centavos = (n) => Math.round(n * 100) / 100;
const agrupar = (lista, f) => lista.reduce((g, x) => ((g[f(x)] ||= []).push(x), g), {});
const soma = (lista, f) => centavos(lista.reduce((t, x) => t + (Number(f(x)) || 0), 0));

function normalizarItemEstoque(p, hoje) {
  const nome = p.aparelhoDescricao || p.nome || String(p.descricao || '').split(' - ')[1] || 'Produto';
  const acessorio = Boolean(p.snAcessorio) || /acess/i.test(p.tipoProdutoDescricao || '');
  return {
    id: p.id,
    nome,
    detalhe: [p.gbDescricao, p.corDescricao].filter(Boolean).join(' · '),
    estado: p.estadoProdutoDescricao || null,
    tipo: acessorio ? 'Acessório' : p.tipoProdutoDescricao || 'Outro',
    acessorio,
    imei: p.imei || p.serialNumber || null,
    bateria: p.saudeBateria ?? null,
    fornecedor: p.fornecedorNome || null,
    quantidade: Number(p.quantidade) || 0,
    custo: Number(p.valorCusto) || 0,
    preco: Number(p.valorVenda) || 0,
    entrada: p.dataEntrada || null,
    diasParado: p.dataEntrada ? diasEntre(p.dataEntrada, hoje) : null,
  };
}

function custosPorProduto(estoque) {
  return new Map(estoque.filter((p) => p.valorCusto != null).map((p) => [p.id, Number(p.valorCusto)]));
}

function normalizarVenda(v, custos) {
  const itens = (v.itens || []).map((i) => {
    const custoUnit = custos.get(i.produtoId);
    return {
      nome: i.produtoNome,
      quantidade: Number(i.quantidade) || 1,
      total: Number(i.valorTotal) || 0,
      desconto: Number(i.desconto) || 0,
      custo: custoUnit == null ? null : custoUnit * (Number(i.quantidade) || 1),
    };
  });
  const custoConhecido = itens.every((i) => i.custo != null);
  const total = Number(v.totalVenda) || soma(itens, (i) => i.total);
  const custo = custoConhecido ? soma(itens, (i) => i.custo) : null;
  return {
    id: v.id,
    data: String(v.dataVenda || '').slice(0, 10),
    hora: String(v.dataVenda || '').slice(11, 16),
    cliente: v.clienteNome || v.cliente?.nome || 'Sem cliente',
    clienteId: v.clienteId ?? null,
    telefone: v.cliente?.telefone || null,
    origem: v.tipoVendaDescricao || 'Sem origem',
    status: v.status || null,
    total,
    desconto: soma(itens, (i) => i.desconto),
    custo,
    lucro: custo == null ? null : centavos(total - custo),
    itens,
  };
}

function normalizarParcela(f, hoje, vendasPorId) {
  const pago = Number(f.valorTotalPagamento) || 0;
  const valor = Number(f.valorTotal ?? f.valor) || 0;
  const restante = centavos(Math.max(valor - pago, 0));
  const vendaId = Number(String(f.titulo || '').match(/#(\d+)/)?.[1]) || null;
  const total = Number(String(f.titulo || '').match(/de (\d+)\)/)?.[1]) || null;
  const venda = vendasPorId.get(vendaId);
  let situacao = 'aberta';
  if (restante === 0) situacao = 'paga';
  else if (f.dataVencimento < hoje) situacao = 'atrasada';
  else if (f.dataVencimento === hoje) situacao = 'hoje';
  return {
    id: f.id,
    titulo: f.titulo,
    vendaId,
    numero: f.numeroParcela ?? null,
    de: total,
    valor,
    restante,
    vencimento: f.dataVencimento,
    pagoEm: f.dataUltimoPagamento || null,
    situacao,
    diasAtraso: situacao === 'atrasada' ? diasEntre(f.dataVencimento, hoje) : 0,
    cliente: venda?.cliente || `Cliente #${f.pessoaId ?? '?'}`,
    chaveCliente: venda?.clienteId ?? f.pessoaId ?? venda?.cliente,
    telefone: venda?.telefone || null,
  };
}

function preparar({ estoque, vendas, parcelas, hoje }) {
  const dataHoje = isoLocal(hoje);
  const custos = custosPorProduto(estoque);
  const listaVendas = vendas
    .filter((v) => !/cancel/i.test(v.status || ''))
    .map((v) => normalizarVenda(v, custos))
    .sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
  const vendasPorId = new Map(listaVendas.map((v) => [v.id, v]));
  const listaParcelas = parcelas
    .filter((f) => !f.deletedAt && (f.flagTipoMovimentacao == null || Number(f.flagTipoMovimentacao) === 1))
    .map((f) => normalizarParcela(f, dataHoje, vendasPorId));
  const listaEstoque = estoque
    .map((p) => normalizarItemEstoque(p, dataHoje))
    .filter((p) => p.quantidade > 0);
  return { dataHoje, listaVendas, listaParcelas, listaEstoque };
}

function totaisVendas(lista) {
  const comCusto = lista.filter((v) => v.lucro != null);
  return {
    quantidade: lista.length,
    total: soma(lista, (v) => v.total),
    ticketMedio: lista.length ? centavos(soma(lista, (v) => v.total) / lista.length) : 0,
    lucro: soma(comCusto, (v) => v.lucro),
    semCusto: lista.length - comCusto.length,
  };
}

function totaisEstoque(lista) {
  const aparelhos = lista.filter((p) => !p.acessorio);
  return {
    aparelhos: soma(aparelhos, (p) => p.quantidade),
    acessorios: soma(lista.filter((p) => p.acessorio), (p) => p.quantidade),
    custo: soma(lista, (p) => p.custo * p.quantidade),
    venda: soma(lista, (p) => p.preco * p.quantidade),
    lucroPotencial: soma(lista, (p) => (p.preco - p.custo) * p.quantidade),
    parados30: aparelhos.filter((p) => p.diasParado > 30).length,
  };
}

function totaisFiado(parcelas, dataHoje) {
  const abertas = parcelas.filter((p) => p.situacao !== 'paga');
  const atrasadas = abertas.filter((p) => p.situacao === 'atrasada');
  const limite = isoLocal(somarDias(new Date(`${dataHoje}T12:00:00`), 7));
  const semana = abertas.filter((p) => p.situacao !== 'atrasada' && p.vencimento <= limite);
  return {
    aReceber: soma(abertas, (p) => p.restante),
    atrasado: soma(atrasadas, (p) => p.restante),
    parcelasAtrasadas: atrasadas.length,
    clientesAtrasados: new Set(atrasadas.map((p) => p.chaveCliente)).size,
    proximos7: soma(semana, (p) => p.restante),
    parcelasProximos7: semana.length,
    recebidoMes: soma(parcelas.filter((p) => p.pagoEm?.slice(0, 7) === dataHoje.slice(0, 7)), (p) => p.valor - p.restante),
  };
}

export function montarResumo(dados) {
  const { dataHoje, listaVendas, listaParcelas, listaEstoque } = preparar(dados);
  const mes = dataHoje.slice(0, 7);
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(dados.hoje.getFullYear(), dados.hoje.getMonth() - 5 + i, 1);
    const chave = isoLocal(d).slice(0, 7);
    const doMes = listaVendas.filter((v) => v.data.startsWith(chave));
    return { mes: chave, ...totaisVendas(doMes) };
  });
  const limite = isoLocal(somarDias(new Date(`${dataHoje}T12:00:00`), 7));
  // Uma linha por cliente, somando as parcelas atrasadas ou que vencem nos próximos 7 dias.
  const urgentes = listaParcelas.filter((p) => p.situacao === 'atrasada' || p.situacao === 'hoje' || (p.situacao === 'aberta' && p.vencimento <= limite));
  const cobrar = Object.values(agrupar(urgentes, (p) => p.chaveCliente))
    .map((lista) => ({
      cliente: lista[0].cliente,
      telefone: lista.find((p) => p.telefone)?.telefone || null,
      valor: soma(lista, (p) => p.restante),
      parcelas: lista.length,
      diasAtraso: Math.max(...lista.map((p) => p.diasAtraso)),
      vencimento: lista.map((p) => p.vencimento).sort()[0],
      situacao: lista.some((p) => p.situacao === 'atrasada') ? 'atrasada' : lista.some((p) => p.situacao === 'hoje') ? 'hoje' : 'aberta',
    }))
    .sort((a, b) => b.diasAtraso - a.diasAtraso || a.vencimento.localeCompare(b.vencimento))
    .slice(0, 8);
  // Compara com o mês passado até o mesmo dia, para o começo do mês não parecer queda.
  const diaHoje = dataHoje.slice(8, 10);
  const mesAnteriorAteHoje = totaisVendas(listaVendas.filter((v) => v.data.startsWith(meses[4].mes) && v.data.slice(8, 10) <= diaHoje));
  const parados = listaEstoque
    .filter((p) => !p.acessorio && p.diasParado > 30)
    .sort((a, b) => b.diasParado - a.diasParado)
    .slice(0, 5);
  return {
    hoje: dataHoje,
    mes: totaisVendas(listaVendas.filter((v) => v.data.startsWith(mes))),
    mesAnterior: meses[4],
    mesAnteriorAteHoje,
    meses,
    estoque: totaisEstoque(listaEstoque),
    fiado: totaisFiado(listaParcelas, dataHoje),
    cobrar,
    parados,
    ultimasVendas: listaVendas.slice(0, 5),
  };
}

export function montarEstoque(dados) {
  const { listaEstoque } = preparar(dados);
  const itens = listaEstoque.sort((a, b) => (b.diasParado ?? 0) - (a.diasParado ?? 0));
  return { totais: totaisEstoque(itens), itens };
}

export function montarVendas(dados, { de, ate }) {
  const { dataHoje, listaVendas } = preparar(dados);
  const valida = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : null);
  const inicio = valida(de) || `${dataHoje.slice(0, 7)}-01`;
  const fim = valida(ate) || dataHoje;
  const itens = listaVendas.filter((v) => v.data >= inicio && v.data <= fim);
  const porOrigem = Object.entries(agrupar(itens, (v) => v.origem))
    .map(([origem, lista]) => ({ origem, quantidade: lista.length, total: soma(lista, (v) => v.total) }))
    .sort((a, b) => b.total - a.total);
  return { de: inicio, ate: fim, totais: totaisVendas(itens), porOrigem, itens };
}

export function montarFiado(dados) {
  const { dataHoje, listaParcelas } = preparar(dados);
  const ordem = { atrasada: 0, hoje: 1, aberta: 2, paga: 3 };
  const clientes = Object.values(agrupar(listaParcelas, (p) => p.chaveCliente))
    .map((parcelas) => {
      const ordenadas = [...parcelas].sort((a, b) => a.vencimento.localeCompare(b.vencimento));
      const abertas = ordenadas.filter((p) => p.situacao !== 'paga');
      return {
        cliente: parcelas[0].cliente,
        telefone: parcelas.find((p) => p.telefone)?.telefone || null,
        devendo: soma(abertas, (p) => p.restante),
        atrasado: soma(abertas.filter((p) => p.situacao === 'atrasada'), (p) => p.restante),
        maiorAtraso: Math.max(0, ...abertas.map((p) => p.diasAtraso)),
        proxima: abertas[0] || null,
        situacao: abertas.length ? abertas.reduce((s, p) => (ordem[p.situacao] < ordem[s] ? p.situacao : s), 'aberta') : 'paga',
        pagas: ordenadas.length - abertas.length,
        parcelas: ordenadas,
      };
    })
    .sort((a, b) => ordem[a.situacao] - ordem[b.situacao] || b.maiorAtraso - a.maiorAtraso || b.devendo - a.devendo);
  return { hoje: dataHoje, totais: totaisFiado(listaParcelas, dataHoje), clientes };
}
