// Login por senha única (hash scrypt no .env) e sessão em cookie assinado com HMAC.
import { scryptSync, timingSafeEqual, createHmac, randomBytes } from 'node:crypto';

const DURACAO_MS = 12 * 60 * 60 * 1000;
const modoDemo = (process.env.FONTE || 'demo') === 'demo';
const segredo = process.env.SESSION_SECRET || (modoDemo ? randomBytes(32).toString('hex') : '');
const hashSenha = process.env.PAINEL_SENHA_HASH || '';
const cookieSeguro = process.env.PAINEL_COOKIE_SECURE === '1';

if (!modoDemo && (!segredo || !hashSenha)) {
  throw new Error('Defina SESSION_SECRET e PAINEL_SENHA_HASH no .env (veja painel/README.md).');
}
if (modoDemo && !hashSenha) {
  console.warn('[painel] modo demonstração sem PAINEL_SENHA_HASH: a senha é "demo".');
}

export function gerarHash(senha) {
  const sal = randomBytes(16).toString('hex');
  return `scrypt$${sal}$${scryptSync(senha, sal, 32).toString('hex')}`;
}

export function conferirSenha(senha) {
  if (!hashSenha) return modoDemo && senha === 'demo';
  const [, sal, esperado] = hashSenha.split('$');
  if (!sal || !esperado) return false;
  const recebido = scryptSync(senha, sal, 32);
  const alvo = Buffer.from(esperado, 'hex');
  return alvo.length === recebido.length && timingSafeEqual(alvo, recebido);
}

function assinar(valor) {
  return createHmac('sha256', segredo).update(valor).digest('base64url');
}

export function criarSessao() {
  const valor = String(Date.now() + DURACAO_MS);
  return `${valor}.${assinar(valor)}`;
}

export function lerSessao(cabecalho = '') {
  const token = cabecalho.split(';').map((c) => c.trim()).find((c) => c.startsWith('painel='))?.slice(7);
  if (!token) return false;
  const [valor, assinatura] = token.split('.');
  if (!valor || !assinatura) return false;
  const esperado = Buffer.from(assinar(valor));
  const recebido = Buffer.from(assinatura);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return false;
  return Number(valor) > Date.now();
}

const atributos = `Path=/; HttpOnly; SameSite=Strict${cookieSeguro ? '; Secure' : ''}`;
export const cookieSessao = (token) => `painel=${token}; Max-Age=${DURACAO_MS / 1000}; ${atributos}`;
export const cookieSaida = () => `painel=; Max-Age=0; ${atributos}`;

// No máximo 5 senhas erradas por IP a cada 15 minutos.
const tentativas = new Map();
export function limitarTentativas(ip) {
  const agora = Date.now();
  const registro = tentativas.get(ip)?.filter((t) => agora - t < 15 * 60_000) || [];
  registro.push(agora);
  tentativas.set(ip, registro);
  return registro.length <= 5;
}
