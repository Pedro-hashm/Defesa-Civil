import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

/** Metadados do modelo FIDE (SINPDEC): núcleo comum aos PDFs dos processos analisados. */
function estruturaFideMunicipio(
  municipio: string,
  codigoIbge: string,
  observacaoExtras: string
): Prisma.InputJsonValue {
  return {
    documento: 'FIDE',
    origem: 'SINPDEC',
    municipioReferencia: municipio,
    codigoIbge,
    camposComuns: [
      'identificacao',
      'tipificacao',
      'dataOcorrencia',
      'areaPopulacaoAfetada',
      'causasEfeitos',
      'danosHumanos',
      'danosMateriais',
      'danosAmbientais',
      'prejuizosEconomicosPublicos',
      'prejuizosEconomicosPrivados',
      'instituicaoInformante',
    ],
    extrasOpcionais: [
      'dmate',
      'relatorioFotografico',
      'solicitacaoRecursosFederais',
      'folhaVerificacaoDocumental',
    ],
    observacaoExtras,
  };
}

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

  const formularios: Array<{
    titulo: string;
    descricao: string;
    estrutura: Prisma.InputJsonValue;
  }> = [
    {
      titulo: 'FIDE — Vertentes (PE)',
      descricao:
        'Formulario de Informacoes do Desastre — Municipio de Vertentes / IBGE 2616209. Processo exemplo: estiagem COBRADE 14110; extras frequentes: DMATE, relatorio fotografico, solicitacao OCP (carro-pipa).',
      estrutura: estruturaFideMunicipio(
        'Vertentes',
        '2616209',
        'Neste municipio, solicitações posteriores podem listar localidades e quantidades (Operação Carro-pipa) em respostas.extras.'
      ),
    },
    {
      titulo: 'FIDE — Garanhuns (PE)',
      descricao:
        'Formulario de Informacoes do Desastre — Municipio de Garanhuns / IBGE 2606002. Processo exemplo: tempestade/chuvas intensas COBRADE 13214.',
      estrutura: estruturaFideMunicipio(
        'Garanhuns',
        '2606002',
        'Inclua relatos de enchentes, FVD e documentacao complementar em respostas.extras quando aplicavel.'
      ),
    },
    {
      titulo: 'FIDE — Limoeiro (PE)',
      descricao:
        'Formulario de Informacoes do Desastre — Municipio de Limoeiro / IBGE 2608909. Processo exemplo: estiagem COBRADE 14110.',
      estrutura: estruturaFideMunicipio(
        'Limoeiro',
        '2608909',
        'Como Vertentes, pode haver meta OCP com escolas e sitios em respostas.extras.'
      ),
    },
    {
      titulo: 'FIDE — Araripina (PE)',
      descricao:
        'Formulario de Informacoes do Desastre — Municipio de Araripina / IBGE 2601102. Processo exemplo: chuvas intensas COBRADE 13214.',
      estrutura: estruturaFideMunicipio(
        'Araripina',
        '2601102',
        'Processos podem incluir metas de assistencia (kits, combustivel, etc.) em respostas.extras.'
      ),
    },
  ];

  for (const f of formularios) {
    const existe = await prisma.formulario.findFirst({
      where: { titulo: f.titulo },
    });
    if (!existe) {
      await prisma.formulario.create({
        data: {
          titulo: f.titulo,
          descricao: f.descricao,
          estrutura: f.estrutura,
          ativo: true,
        },
      });
      console.log('Formulario disponibilizado:', f.titulo);
    }
  }

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