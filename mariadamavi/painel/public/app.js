// Telas do painel. Busca os dados já calculados em /api/* e desenha com HTML simples.

const conteudo = document.getElementById('conteudo');
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCurto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });
const dinheiro = (n) => brl.format(n || 0);
const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
const dataCurta = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const nomeMes = (chave, formato = 'long') => new Date(`${chave}-15T12:00:00`).toLocaleDateString('pt-BR', { month: formato, year: formato === 'long' ? 'numeric' : undefined });
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);

const ROTULOS = { atrasada: 'Atrasada', hoje: 'Vence hoje', aberta: 'Em aberto', paga: 'Paga' };
const etiqueta = (situacao, texto = ROTULOS[situacao]) => `<span class="etiqueta etiqueta--${situacao}">${esc(texto)}</span>`;

function linkWhats(telefone, nome) {
  const digitos = String(telefone || '').replace(/\D/g, '');
  if (digitos.length < 10) return '';
  const numero = digitos.startsWith('55') ? digitos : `55${digitos}`;
  const texto = encodeURIComponent(`Oi, ${String(nome).split(' ')[0]}! Tudo bem?`);
  return `<a class="botao botao--whats" href="https://wa.me/${numero}?text=${texto}" target="_blank" rel="noopener">WhatsApp</a>`;
}

async function api(caminho, opcoes) {
  const res = await fetch(caminho, { credentials: 'same-origin', ...opcoes });
  if (res.status === 401) { mostrarLogin(); throw new Error('sessão'); }
  const corpo = await res.json();
  if (!res.ok) throw new Error(corpo.erro || 'Erro ao carregar.');
  return corpo;
}

/* ---------- Resumo ---------- */

function variacao(atual, anterior) {
  if (!anterior) return '<small class="muted">mês passado sem vendas até este dia</small>';
  const diff = pct(atual - anterior, anterior);
  return `<small class="${diff >= 0 ? 'sobe' : 'desce'}">${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff)}% vs. mesmo período do mês passado</small>`;
}

function itemCobranca(c) {
  const quando = c.situacao === 'atrasada' ? `${c.diasAtraso} dia${c.diasAtraso > 1 ? 's' : ''} de atraso` : c.situacao === 'hoje' ? 'vence hoje' : `vence ${dataCurta(c.vencimento)}`;
  return `<li>
    <div class="lista__principal"><strong>${esc(c.cliente)}</strong><small>${c.parcelas} parcela${c.parcelas > 1 ? 's' : ''} · ${quando}</small></div>
    ${linkWhats(c.telefone, c.cliente)}
    <div class="lista__valor"><strong class="num">${dinheiro(c.valor)}</strong>${etiqueta(c.situacao)}</div>
  </li>`;
}

async function telaResumo() {
  const r = await api('/api/resumo');
  const maior = Math.max(...r.meses.map((m) => m.total), 1);
  const atual = r.meses.at(-1).mes;
  conteudo.innerHTML = `
    <div class="cabecalho"><div><h1>${esc(nomeMes(r.hoje.slice(0, 7)))}</h1><p>Atualizado em ${dataBR(r.hoje)}</p></div></div>

    <section class="indicadores">
      <div class="indicador"><span>Vendido no mês</span><strong>${dinheiro(r.mes.total)}</strong>${variacao(r.mes.total, r.mesAnteriorAteHoje.total)}</div>
      <div class="indicador"><span>Lucro estimado no mês</span><strong>${dinheiro(r.mes.lucro)}</strong><small>${r.mes.quantidade} venda${r.mes.quantidade === 1 ? '' : 's'} · ticket ${dinheiro(r.mes.ticketMedio)}${r.mes.semCusto ? ` · ${r.mes.semCusto} sem custo` : ''}</small></div>
      <div class="indicador"><span>Fiado a receber</span><strong>${dinheiro(r.fiado.aReceber)}</strong><small>${dinheiro(r.fiado.recebidoMes)} recebido este mês</small></div>
      <div class="indicador ${r.fiado.atrasado ? 'indicador--alerta' : ''}"><span>Fiado atrasado</span><strong>${dinheiro(r.fiado.atrasado)}</strong><small>${r.fiado.parcelasAtrasadas} parcela${r.fiado.parcelasAtrasadas === 1 ? '' : 's'} · ${r.fiado.clientesAtrasados} cliente${r.fiado.clientesAtrasados === 1 ? '' : 's'}</small></div>
      <div class="indicador"><span>Estoque (custo)</span><strong>${dinheiro(r.estoque.custo)}</strong><small>${r.estoque.aparelhos} aparelhos · vende por ${dinheiro(r.estoque.venda)}</small></div>
    </section>

    <div class="grade">
      <section class="cartao">
        <div class="cartao__topo"><h2>Cobrar agora</h2><a href="#fiado">Ver fiado</a></div>
        ${r.cobrar.length ? `<ul class="lista">${r.cobrar.map(itemCobranca).join('')}</ul>` : '<p class="cartao__vazio">Nenhuma parcela atrasada ou vencendo nos próximos 7 dias.</p>'}
      </section>

      <section class="cartao">
        <div class="cartao__topo"><h2>Vendas nos últimos 6 meses</h2><a href="#vendas">Ver vendas</a></div>
        <div class="barras" role="img" aria-label="Total vendido por mês">
          ${r.meses.map((m) => `
            <div class="barras__col ${m.mes === atual ? 'barras__col--atual' : ''}" title="${esc(nomeMes(m.mes))}: ${dinheiro(m.total)} em ${m.quantidade} vendas, lucro ${dinheiro(m.lucro)}">
              <span class="barras__valor">${m.total ? brlCurto.format(m.total) : '—'}</span>
              <div class="barras__trilho"><div class="barras__barra" style="height:${pct(m.total, maior)}%"></div></div>
              <span class="barras__mes">${esc(nomeMes(m.mes, 'short').replace('.', ''))}</span>
            </div>`).join('')}
        </div>
      </section>

      <section class="cartao">
        <div class="cartao__topo"><h2>Parados há mais de 30 dias</h2><a href="#estoque">Ver estoque</a></div>
        ${r.parados.length ? `<ul class="lista">${r.parados.map((p) => `<li>
          <div class="lista__principal"><strong>${esc(p.nome)}</strong><small>${esc([p.detalhe, p.estado].filter(Boolean).join(' · '))}</small></div>
          <div class="lista__valor"><strong class="num">${p.diasParado} dias</strong><small class="muted num">${dinheiro(p.custo)} parado</small></div>
        </li>`).join('')}</ul>` : '<p class="cartao__vazio">Nenhum aparelho parado há mais de 30 dias.</p>'}
      </section>

      <section class="cartao">
        <div class="cartao__topo"><h2>Últimas vendas</h2><a href="#vendas">Ver todas</a></div>
        ${r.ultimasVendas.length ? `<ul class="lista">${r.ultimasVendas.map((v) => `<li>
          <div class="lista__principal"><strong>${esc(v.itens.map((i) => i.nome).join(', '))}</strong><small>${esc(v.cliente)} · ${dataCurta(v.data)}</small></div>
          <div class="lista__valor"><strong class="num">${dinheiro(v.total)}</strong><small class="muted num">${v.lucro == null ? 'sem custo' : `lucro ${dinheiro(v.lucro)}`}</small></div>
        </li>`).join('')}</ul>` : '<p class="cartao__vazio">Nenhuma venda ainda.</p>'}
      </section>
    </div>`;
}

/* ---------- Estoque ---------- */

async function telaEstoque() {
  const { totais, itens } = await api('/api/estoque');
  const tipos = [...new Set(itens.map((p) => p.tipo))].sort();
  const estados = [...new Set(itens.map((p) => p.estado).filter(Boolean))].sort();
  conteudo.innerHTML = `
    <div class="cabecalho"><div><h1>Estoque</h1><p>${totais.aparelhos} aparelhos e ${totais.acessorios} acessórios</p></div></div>
    <section class="indicadores">
      <div class="indicador"><span>Investido (custo)</span><strong>${dinheiro(totais.custo)}</strong></div>
      <div class="indicador"><span>Valor de venda</span><strong>${dinheiro(totais.venda)}</strong></div>
      <div class="indicador"><span>Lucro se vender tudo</span><strong>${dinheiro(totais.lucroPotencial)}</strong><small>${pct(totais.lucroPotencial, totais.custo)}% sobre o custo</small></div>
      <div class="indicador ${totais.parados30 ? 'indicador--alerta' : ''}"><span>Parados +30 dias</span><strong>${totais.parados30}</strong><small>aparelhos</small></div>
    </section>
    <div class="filtros">
      <input type="search" id="f-busca" placeholder="Buscar modelo, cor, IMEI…" aria-label="Buscar">
      <select id="f-tipo" aria-label="Tipo"><option value="">Todos os tipos</option>${tipos.map((t) => `<option>${esc(t)}</option>`).join('')}</select>
      <select id="f-estado" aria-label="Estado"><option value="">Novo e seminovo</option>${estados.map((t) => `<option>${esc(t)}</option>`).join('')}</select>
      <label><input type="checkbox" id="f-parados"> Só parados +30 dias</label>
    </div>
    <section class="cartao"><div class="tabela-rolagem"><table>
      <thead><tr><th>Produto</th><th class="esconder-celular">Estado</th><th class="dir esconder-celular">Bateria</th><th class="dir">Custo</th><th class="dir">Preço</th><th class="dir">Margem</th><th class="dir">Parado</th></tr></thead>
      <tbody id="linhas-estoque"></tbody>
    </table></div><div class="rodape-tabela" id="rodape-estoque"></div></section>`;

  const filtrar = () => {
    const busca = document.getElementById('f-busca').value.trim().toLowerCase();
    const tipo = document.getElementById('f-tipo').value;
    const estado = document.getElementById('f-estado').value;
    const parados = document.getElementById('f-parados').checked;
    const lista = itens.filter((p) =>
      (!busca || [p.nome, p.detalhe, p.imei, p.fornecedor].join(' ').toLowerCase().includes(busca)) &&
      (!tipo || p.tipo === tipo) && (!estado || p.estado === estado) && (!parados || p.diasParado > 30));
    document.getElementById('linhas-estoque').innerHTML = lista.map((p) => {
      const margem = p.preco - p.custo;
      return `<tr>
        <td><strong>${esc(p.nome)}</strong>${p.quantidade > 1 ? ` <span class="muted">× ${p.quantidade}</span>` : ''}<small>${esc([p.detalhe, p.imei && `IMEI ${p.imei}`].filter(Boolean).join(' · '))}</small></td>
        <td class="esconder-celular">${p.estado ? etiqueta(p.estado === 'NOVO' ? 'novo' : 'aberta', p.estado.toLowerCase()) : '—'}</td>
        <td class="dir num esconder-celular">${p.bateria != null ? `${p.bateria}%` : '—'}</td>
        <td class="dir num">${dinheiro(p.custo)}</td>
        <td class="dir num">${dinheiro(p.preco)}</td>
        <td class="dir num ${margem < 0 ? 'desce' : ''}">${dinheiro(margem)}<small>${pct(margem, p.custo)}%</small></td>
        <td class="dir num ${p.diasParado > 30 ? 'desce' : ''}">${p.diasParado ?? '—'} d</td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="muted">Nada encontrado com esses filtros.</td></tr>';
    const unidades = lista.reduce((t, p) => t + p.quantidade, 0);
    document.getElementById('rodape-estoque').textContent = `${lista.length} itens · ${unidades} unidades · ${dinheiro(lista.reduce((t, p) => t + p.custo * p.quantidade, 0))} em custo`;
  };
  conteudo.querySelectorAll('.filtros input, .filtros select').forEach((el) => el.addEventListener('input', filtrar));
  filtrar();
}

/* ---------- Vendas ---------- */

const periodoVendas = { de: null, ate: null };

async function telaVendas() {
  const params = new URLSearchParams(Object.entries(periodoVendas).filter(([, v]) => v));
  const v = await api(`/api/vendas?${params}`);
  const hoje = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const atalhos = {
    'Este mês': [iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), iso(hoje)],
    'Mês passado': [iso(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)), iso(new Date(hoje.getFullYear(), hoje.getMonth(), 0))],
    '90 dias': [iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 90)), iso(hoje)],
    'Este ano': [`${hoje.getFullYear()}-01-01`, iso(hoje)],
  };
  conteudo.innerHTML = `
    <div class="cabecalho"><div><h1>Vendas</h1><p>De ${dataBR(v.de)} a ${dataBR(v.ate)}</p></div></div>
    <div class="filtros">
      <div class="chips">${Object.entries(atalhos).map(([nome, [de, ate]]) => `<button class="chip" data-de="${de}" data-ate="${ate}" aria-pressed="${de === v.de && ate === v.ate}">${nome}</button>`).join('')}</div>
      <label>De <input type="date" id="v-de" value="${v.de}"></label>
      <label>Até <input type="date" id="v-ate" value="${v.ate}"></label>
    </div>
    <section class="indicadores">
      <div class="indicador"><span>Vendido</span><strong>${dinheiro(v.totais.total)}</strong><small>${v.totais.quantidade} vendas</small></div>
      <div class="indicador"><span>Lucro estimado</span><strong>${dinheiro(v.totais.lucro)}</strong><small>${pct(v.totais.lucro, v.totais.total)}% do vendido${v.totais.semCusto ? ` · ${v.totais.semCusto} sem custo` : ''}</small></div>
      <div class="indicador"><span>Ticket médio</span><strong>${dinheiro(v.totais.ticketMedio)}</strong></div>
      <div class="indicador"><span>Melhor origem</span><strong>${esc(v.porOrigem[0]?.origem || '—')}</strong><small>${v.porOrigem.slice(0, 3).map((o) => `${esc(o.origem)}: ${o.quantidade}`).join(' · ')}</small></div>
    </section>
    <section class="cartao"><div class="tabela-rolagem"><table>
      <thead><tr><th>Data</th><th>Cliente e itens</th><th class="esconder-celular">Origem</th><th class="dir">Total</th><th class="dir">Lucro</th></tr></thead>
      <tbody>${v.itens.map((x) => `<tr>
        <td class="num">${dataCurta(x.data)}<small>${esc(x.hora)}</small></td>
        <td><strong>${esc(x.cliente)}</strong><small>${esc(x.itens.map((i) => (i.quantidade > 1 ? `${i.quantidade}× ` : '') + i.nome).join(', '))}</small></td>
        <td class="esconder-celular">${esc(x.origem)}</td>
        <td class="dir num">${dinheiro(x.total)}${x.desconto ? `<small>desc. ${dinheiro(x.desconto)}</small>` : ''}</td>
        <td class="dir num ${x.lucro < 0 ? 'desce' : ''}">${x.lucro == null ? '<span class="muted">—</span>' : dinheiro(x.lucro)}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="muted">Nenhuma venda nesse período.</td></tr>'}</tbody>
    </table></div></section>`;

  conteudo.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
    Object.assign(periodoVendas, { de: b.dataset.de, ate: b.dataset.ate });
    mostrar();
  }));
  conteudo.querySelectorAll('input[type="date"]').forEach((el) => el.addEventListener('change', () => {
    Object.assign(periodoVendas, { de: document.getElementById('v-de').value, ate: document.getElementById('v-ate').value });
    mostrar();
  }));
}

/* ---------- Fiado ---------- */

let filtroFiado = 'devendo';

async function telaFiado() {
  const { totais, clientes } = await api('/api/fiado');
  const filtros = {
    atrasados: ['Atrasados', (c) => c.situacao === 'atrasada'],
    devendo: ['Com saldo', (c) => c.devendo > 0],
    quitados: ['Quitados', (c) => c.devendo === 0],
    todos: ['Todos', () => true],
  };
  conteudo.innerHTML = `
    <div class="cabecalho"><div><h1>Fiado</h1><p>Crediário lançado no Mercado Phone</p></div></div>
    <section class="indicadores">
      <div class="indicador"><span>A receber</span><strong>${dinheiro(totais.aReceber)}</strong></div>
      <div class="indicador ${totais.atrasado ? 'indicador--alerta' : ''}"><span>Atrasado</span><strong>${dinheiro(totais.atrasado)}</strong><small>${totais.parcelasAtrasadas} parcelas · ${totais.clientesAtrasados} clientes</small></div>
      <div class="indicador"><span>Vence em 7 dias</span><strong>${dinheiro(totais.proximos7)}</strong><small>${totais.parcelasProximos7} parcelas</small></div>
      <div class="indicador"><span>Recebido este mês</span><strong>${dinheiro(totais.recebidoMes)}</strong></div>
    </section>
    <div class="filtros"><div class="chips">${Object.entries(filtros).map(([k, [nome, f]]) => `<button class="chip" data-filtro="${k}" aria-pressed="${k === filtroFiado}">${nome} (${clientes.filter(f).length})</button>`).join('')}</div></div>
    <div class="clientes">${clientes.filter(filtros[filtroFiado][1]).map(cartaoCliente).join('') || '<p class="cartao__vazio">Ninguém nesse filtro.</p>'}</div>`;

  conteudo.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { filtroFiado = b.dataset.filtro; mostrar(); }));
}

function cartaoCliente(c) {
  const info = c.devendo === 0
    ? `Quitado · ${c.pagas} parcelas pagas`
    : c.situacao === 'atrasada'
      ? `${c.parcelas.filter((p) => p.situacao === 'atrasada').length} atrasada(s) · a mais antiga venceu em ${dataCurta(c.proxima.vencimento)} (${c.maiorAtraso} dias)`
      : `Próxima parcela ${dataCurta(c.proxima.vencimento)} · ${dinheiro(c.proxima.restante)}`;
  return `<details class="cliente cliente--${c.situacao}">
    <summary>
      <span class="cliente__nome">${esc(c.cliente)}</span>
      <span class="cliente__valor"><strong class="num">${dinheiro(c.devendo)}</strong>${c.atrasado ? `<small class="desce num">${dinheiro(c.atrasado)} atrasado</small>` : etiqueta(c.situacao === 'paga' ? 'paga' : c.situacao, c.situacao === 'paga' ? 'Quitado' : undefined)}</span>
      <span class="cliente__info">${info}</span>
    </summary>
    <div class="cliente__corpo"><div class="tabela-rolagem"><table>
      <thead><tr><th>Parcela</th><th>Vencimento</th><th class="dir">Valor</th><th>Situação</th></tr></thead>
      <tbody>${c.parcelas.map((p) => `<tr>
        <td>${p.numero ?? '?'}${p.de ? ` de ${p.de}` : ''}<small>${p.vendaId ? `Venda #${p.vendaId}` : esc(p.titulo)}</small></td>
        <td class="num">${dataBR(p.vencimento)}${p.pagoEm ? `<small>paga em ${dataBR(p.pagoEm)}</small>` : ''}</td>
        <td class="dir num">${dinheiro(p.valor)}${p.restante && p.restante < p.valor ? `<small>falta ${dinheiro(p.restante)}</small>` : ''}</td>
        <td>${etiqueta(p.situacao)}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    ${c.devendo ? `<div class="cliente__acoes">${linkWhats(c.telefone, c.cliente) || '<span class="muted">Sem telefone no cadastro.</span>'}</div>` : ''}
    </div>
  </details>`;
}

/* ---------- Navegação e login ---------- */

const telas = { resumo: telaResumo, estoque: telaEstoque, vendas: telaVendas, fiado: telaFiado };

async function mostrar() {
  const aba = telas[location.hash.slice(1)] ? location.hash.slice(1) : 'resumo';
  document.querySelectorAll('.abas a').forEach((a) => a.removeAttribute('aria-current'));
  document.querySelector(`.abas a[data-aba="${aba}"]`).setAttribute('aria-current', 'page');
  if (!conteudo.children.length) conteudo.innerHTML = '<p class="carregando">Carregando…</p>';
  try {
    await telas[aba]();
  } catch (erro) {
    if (erro.message !== 'sessão') conteudo.innerHTML = `<p class="erro">${esc(erro.message)}</p>`;
  }
}

function mostrarLogin() {
  document.getElementById('app').hidden = true;
  document.getElementById('login').hidden = false;
  document.getElementById('senha').focus();
}

async function iniciar() {
  try {
    const sessao = await api('/api/sessao');
    document.getElementById('login').hidden = true;
    document.getElementById('app').hidden = false;
    document.getElementById('selo-demo').hidden = sessao.fonte !== 'demo';
    mostrar();
  } catch { /* api() já abriu o login */ }
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erro = document.getElementById('login-erro');
  erro.textContent = '';
  const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: document.getElementById('senha').value }) });
  if (res.ok) { document.getElementById('senha').value = ''; conteudo.innerHTML = ''; return iniciar(); }
  erro.textContent = (await res.json().catch(() => ({}))).erro || 'Não foi possível entrar.';
});

document.getElementById('sair').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  mostrarLogin();
});

document.getElementById('atualizar').addEventListener('click', async ({ currentTarget: botao }) => {
  botao.disabled = true;
  try { await api('/api/atualizar', { method: 'POST' }); await mostrar(); } finally { botao.disabled = false; }
});

addEventListener('hashchange', mostrar);
document.getElementById('login-dica').hidden = !['localhost', '127.0.0.1'].includes(location.hostname);
iniciar();
