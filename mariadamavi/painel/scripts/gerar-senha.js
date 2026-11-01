// Gera as linhas PAINEL_SENHA_HASH e SESSION_SECRET para colar no .env.
// Uso: npm run senha -- "sua senha"
import { randomBytes, scryptSync } from 'node:crypto';

const senha = process.argv[2];
if (!senha || senha.length < 10) {
  console.error('Use uma senha com pelo menos 10 caracteres: npm run senha -- "sua senha"');
  process.exit(1);
}
const sal = randomBytes(16).toString('hex');
console.log(`PAINEL_SENHA_HASH=scrypt$${sal}$${scryptSync(senha, sal, 32).toString('hex')}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString('hex')}`);
