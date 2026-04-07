import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log("Iniciando o seed...");

  const senha_hash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@defesacilvil.com' },
    update: {},
    create: {
      nome: 'Administrador do Sistema',
      email: 'admin@defesacilvil.com',
      senha_hash: senha_hash,
      cargo: 'ADMIN',
      ativo: true,
    },
  });

  console.log("Seed finalizado com sucesso!");
  console.log("Admin criado:", admin.email);
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