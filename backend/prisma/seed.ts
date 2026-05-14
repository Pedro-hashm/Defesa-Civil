import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Replica o que o frontend faz: SHA-256(PREFIXO + senha + SUFIXO)
function hashFront(senha: string): string {
  const prefixo = process.env.SEED_SENHA_PREFIXO ?? 'dc@';
  const sufixo  = process.env.SEED_SENHA_SUFIXO  ?? '@dc';
  return crypto.createHash('sha256').update(`${prefixo}${senha}${sufixo}`).digest('hex');
}

async function main() {
  console.log("Iniciando o seed...");

  const senhaRaw = 'Admin@123'; // atende as regras: maiúscula, minúscula, número e especial
  const prefixoServidor = process.env.PASSWORD_PREFIXO ?? '';
  const sufixoServidor  = process.env.PASSWORD_SUFIXO  ?? '';

  // Simula o fluxo completo: SHA-256(prefixo+senha+sufixo) do front
  //                          → prefixo_srv + hash + sufixo_srv → bcrypt
  const hashDoFront = hashFront(senhaRaw);
  const textoFinal  = `${prefixoServidor}${hashDoFront}${sufixoServidor}`;
  const senhaHash   = await bcrypt.hash(textoFinal, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@defesacivil.com' },
    update: { senha_hash: senhaHash },
    create: {
      nome: 'Administrador do Sistema',
      email: 'admin@defesacivil.com',
      senha_hash: senhaHash,
      cargo: 'ADMIN',
      ativo: true,
    },
  });

  console.log("Seed finalizado com sucesso!");
  console.log("Admin criado:", admin.email);
  console.log("Senha de acesso: Admin@123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Erro no seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
