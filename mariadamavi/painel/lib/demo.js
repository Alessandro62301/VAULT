// Dados fictícios no formato do Mercado Phone, com datas relativas a hoje.
// Nomes, telefones e IMEIs são inventados.
import { isoLocal } from './calculos.js';

function sorteador(semente) {
  let s = semente;
  return () => ((s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
}

const dia = (base, delta) => {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return isoLocal(d);
};

const MODELOS = [
  ['IPHONE 13', '128GB', 'Celular', 1700, 2250],
  ['IPHONE 14', '256GB', 'Celular', 1900, 2400],
  ['IPHONE 15', '128GB', 'Celular', 2600, 3300],
  ['IPHONE 15 PRO MAX', '256GB', 'Celular', 3000, 3900],
  ['IPHONE 16 PRO', '256GB', 'Celular', 4300, 5300],
  ['IPHONE 16 PRO MAX', '256GB', 'Celular', 4700, 5600],
  ['IPHONE 17', '256GB', 'Celular', 4900, 6000],
  ['IPHONE 17 PRO MAX', '256GB', 'Celular', 6900, 7900],
  ['MACBOOK AIR (13-INCH, M4)', '512GB', 'MACBOOK', 6200, 7400],
  ['IPAD AIR M3', '128GB', 'Tablet', 3300, 4100],
];
const CORES = ['PRETO', 'BRANCO', 'AZUL', 'PRATEADO', 'LAVANDA', 'TITÂNIO NATURAL'];
const CLIENTES = ['Ana Ribeiro', 'Bruno Tavares', 'Carla Menezes', 'Diego Prado', 'Elisa Fontes', 'Fábio Rocha', 'Gabriela Lins', 'Heitor Campos', 'Isabela Nunes', 'João Pedro Alves', 'Larissa Moura', 'Marcelo Dias', 'Natália Brito', 'Otávio Reis', 'Paula Siqueira', 'Rafael Lemos'];
const ORIGENS = ['Indicação', 'Instagram', 'Cliente Recorrente', 'WhatsApp'];
const FORNECEDORES = ['Fornecedor A', 'Fornecedor B', 'Troca de cliente'];

export function gerarDemo(hoje) {
  const r = sorteador(42);
  const escolher = (lista) => lista[Math.floor(r() * lista.length)];
  const imei = () => '35' + Array.from({ length: 13 }, () => Math.floor(r() * 10)).join('');
  let proximoId = 9_000_000;

  const novoAparelho = (entrada, vendido) => {
    const [modelo, gb, tipo, custo, preco] = escolher(MODELOS);
    const ajuste = Math.round((r() - 0.5) * 300 / 50) * 50;
    return {
      id: proximoId++,
      quantidade: vendido ? 0 : 1,
      aparelhoDescricao: modelo,
      gbDescricao: gb,
      corDescricao: escolher(CORES),
      estadoProdutoDescricao: r() < 0.65 ? 'SEMINOVO' : 'NOVO',
      tipoProdutoDescricao: tipo,
      imei: tipo === 'Celular' ? imei() : null,
      saudeBateria: 78 + Math.floor(r() * 23),
      valorCusto: custo + ajuste,
      valorVenda: preco + ajuste,
      fornecedorNome: escolher(FORNECEDORES),
      dataEntrada: entrada,
      snAcessorio: 0,
    };
  };

  const estoque = [];
  for (let i = 0; i < 14; i++) estoque.push(novoAparelho(dia(hoje, -Math.floor(r() * 75)), false));
  estoque.push(
    { id: proximoId++, quantidade: 15, aparelhoDescricao: 'AIRPODS PRO 3', tipoProdutoDescricao: 'Acessório', valorCusto: 45, valorVenda: 299.99, dataEntrada: dia(hoje, -50), snAcessorio: 1 },
    { id: proximoId++, quantidade: 22, aparelhoDescricao: 'FONTE 20W APPLE', tipoProdutoDescricao: 'Acessório', valorCusto: 35, valorVenda: 180, dataEntrada: dia(hoje, -40), snAcessorio: 1 },
    { id: proximoId++, quantidade: 3, aparelhoDescricao: 'CAPA MAGSAFE', tipoProdutoDescricao: 'Acessório', valorCusto: 30, valorVenda: 149.9, dataEntrada: dia(hoje, -20), snAcessorio: 1 },
  );

  const vendas = [];
  const parcelas = [];
  let proximaVenda = 8_100_000;
  let proximaParcela = 2_700_000;
  for (let d = -170; d <= 0; d += 1 + Math.floor(r() * 5)) {
    const aparelho = novoAparelho(dia(hoje, d - 10 - Math.floor(r() * 20)), true);
    estoque.push(aparelho);
    const desconto = r() < 0.3 ? 100 * (1 + Math.floor(r() * 4)) : 0;
    const total = aparelho.valorVenda - desconto;
    const cliente = escolher(CLIENTES);
    const venda = {
      id: proximaVenda++,
      dataVenda: `${dia(hoje, d)} ${String(10 + Math.floor(r() * 10)).padStart(2, '0')}:00:00`,
      status: 'concluido',
      totalVenda: total,
      clienteId: CLIENTES.indexOf(cliente) + 1,
      clienteNome: cliente,
      vendedorNome: 'Loja',
      tipoVendaDescricao: escolher(ORIGENS),
      itens: [{ produtoId: aparelho.id, produtoNome: `${aparelho.aparelhoDescricao} - ${aparelho.gbDescricao} - ${aparelho.corDescricao}`, quantidade: 1, valorUnitario: aparelho.valorVenda, desconto, valorTotal: total }],
      cliente: { nome: cliente, telefone: `(21) 9${Math.floor(1000 + r() * 8999)}-${Math.floor(1000 + r() * 8999)}` },
    };
    vendas.push(venda);

    // Cerca de 1 em cada 3 vendas é no crediário (PIX parcelado).
    if (r() < 0.35) {
      const n = escolher([3, 4, 5, 6, 8, 10]);
      const valor = Math.round((total / n) * 100) / 100;
      for (let p = 1; p <= n; p++) {
        const vencimento = dia(hoje, d + 30 * p);
        const venceu = vencimento <= dia(hoje, 0);
        const pago = venceu && r() < 0.82;
        parcelas.push({
          id: proximaParcela++,
          titulo: `Crediário da venda #${venda.id} (${p} de ${n})`,
          valor,
          dataVencimento: vencimento,
          dataUltimoPagamento: pago ? vencimento : null,
          situacaoId: pago ? 2 : 1,
          pessoaId: venda.clienteId,
          flagTipoMovimentacao: 1,
          numeroParcela: p,
          valorTotalPagamento: pago ? valor : 0,
          deletedAt: null,
        });
      }
    }
  }

  return { estoque, vendas, parcelas };
}
