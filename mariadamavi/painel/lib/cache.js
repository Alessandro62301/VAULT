// Guarda as respostas do Mercado Phone por alguns minutos para o painel abrir rápido
// e não estourar o limite de requisições da API.
const guardados = new Map();

export async function comCache(chave, validadeMs, buscar) {
  const atual = guardados.get(chave);
  if (atual && Date.now() - atual.em < validadeMs) return atual.valor;
  const valor = buscar();
  guardados.set(chave, { em: Date.now(), valor });
  try {
    return await valor;
  } catch (erro) {
    guardados.delete(chave);
    throw erro;
  }
}

export function limparCache() {
  guardados.clear();
}
