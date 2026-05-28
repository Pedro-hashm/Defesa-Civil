import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Replica o que o frontend faz: SHA-256(PREFIXO + senha + SUFIXO)
function hashFront(senha: string): string {
  const prefixo = process.env.SEED_SENHA_PREFIXO ?? 'dc@';
  const sufixo  = process.env.SEED_SENHA_SUFIXO  ?? '@dc';
  return crypto.createHash('sha256').update(`${prefixo}${senha}${sufixo}`).digest('hex');
}
import { Prisma } from '@prisma/client';

/** Estrutura canônica FIDE (8 seções) para o front validar, pré-preencher e orientar o aluno. */
const estruturaFidePadrao: Prisma.InputJsonValue = {
  documento: 'FIDE',
  versao: '2026.1',
  origem: 'SEDEC/MIDR',
  metadados_cenario: {
    municipio_referencia: 'Araripina',
    uf: 'PE',
    codigo_ibge_sugerido: '2601102',
    cobrade_foco: '1.3.2.1.4',
    evento_foco: 'Tempestade Local/Convectiva - Chuvas Intensas',
    possui_ocp: false,
  },
  secoes_fide: [
    {
      id: '1',
      titulo: 'Identificação',
      campos_esperados: [
        'uf',
        'municipio',
        'codigo_ibge',
        'populacao',
        'pib_anual',
        'orcamento_anual',
        'arrecadacao_anual',
        'receita_mensal',
        'receita_anual',
      ],
    },
    {
      id: '2',
      titulo: 'Tipificação',
      campos_esperados: ['cobrade', 'denominacao'],
    },
    {
      id: '3',
      titulo: 'Data da Ocorrência do Desastre',
      campos_esperados: ['dia', 'mes', 'ano', 'horario'],
    },
    {
      id: '4',
      titulo: 'Área com População Afetada',
      campos_esperados: [
        'matriz_ocupacao',
        'mapa_selecao',
        'descricao_areas_afetadas',
      ],
    },
    {
      id: '5',
      titulo: 'Causas e Efeitos do Desastre',
      campos_esperados: ['descricao_causas_efeitos'],
    },
    {
      id: '6',
      titulo: 'Danos Humanos, Materiais ou Ambientais',
      blocos: {
        humanos: [
          'mortos',
          'feridos',
          'enfermos',
          'desabrigados',
          'desalojados',
          'desaparecidos',
          'outros',
          'total',
          'descricao',
        ],
        materiais: ['tabela_instalacoes', 'descricao'],
        ambientais: ['matriz_poluicao', 'descricao'],
      },
    },
    {
      id: '7',
      titulo: 'Prejuízos Econômicos Públicos e Privados',
      blocos: {
        publicos: [
          'tabela_servicos_essenciais',
          'valor_total',
          'descricao',
        ],
        privados: [
          'agricultura',
          'pecuaria',
          'industria',
          'comercio',
          'servicos',
          'valor_total',
          'descricao',
        ],
      },
    },
    {
      id: '8',
      titulo: 'Instituição Informante',
      campos_esperados: [
        'nome',
        'cargo',
        'telefone',
        'email',
        'data_preenchimento',
      ],
    },
  ],
  extras: {
    permite_anexos_fotograficos: true,
    exige_parecer_defesa_civil: false,
    exige_decreto_municipal: false,
    orientacoes_professor:
      'Atenção: O aluno deve justificar corretamente os danos materiais com base na área afetada.',
  },
};

/** Template DMATE — incapacidade gerencial e recursos mobilizados (paralelo ao FIDE no simulado). */
const estruturaDmatePadrao: Prisma.InputJsonValue = {
  documento: 'DMATE',
  versao: '2026.1',
  origem: 'SEDEC/MIDR',
  secoes_dmate: [
    {
      id: '1',
      titulo: 'Caracterização de Situação de Emergência',
      campos_esperados: [
        'capacidade_superada',
        'capacidade_resposta_comprometida',
        'prejuizos_causados_desastre',
        'prejuizos_separados',
        'informe_resumido',
      ],
    },
    {
      id: '2',
      titulo: 'Informações Relevantes sobre o Desastre',
      campos_esperados: [
        'evento_ocorreu_anteriormente',
        'evento_anual',
        'acoes_preventivas_justificativa',
      ],
    },
    {
      id: '3',
      titulo: 'Capacidade Gerencial do Município',
      campos_esperados: [
        'mapeamento_areas',
        'orgao_defesa_civil',
        'plano_contingencia',
        'previsao_loa',
        'inclusao_ppa',
        'simulados_realizados',
        'apoio_estadual',
        'dificuldades_gestao',
      ],
    },
    {
      id: '4',
      titulo: 'Medidas e Ações em Curso',
      blocos: {
        recursos_humanos: [
          'ajuda_humanitaria',
          'apoio_saude',
          'avaliacao_danos',
          'busca_salvamento',
          'descricao_outros',
        ],
        recursos_materiais: [
          'agua_alimentos',
          'equipamentos',
          'helicopteros_barcos',
          'material_limpeza',
        ],
        recursos_financeiros: [
          'fonte_municipal',
          'fonte_extra',
          'doacoes',
          'outras_fontes',
          'valor_financeiro_empregado',
        ],
      },
    },
    {
      id: '5',
      titulo: 'Instituição Informante',
      campos_esperados: ['nome', 'cargo', 'telefone', 'data'],
    },
  ],
};

async function upsertFormulario(
  titulo: string,
  descricao: string,
  estrutura: Prisma.InputJsonValue
) {
  const existente = await prisma.formulario.findFirst({ where: { titulo } });
  if (existente) {
    await prisma.formulario.update({
      where: { id: existente.id },
      data: { descricao, estrutura, ativo: true },
    });
    console.log('Formulario atualizado:', titulo);
  } else {
    await prisma.formulario.create({
      data: { titulo, descricao, estrutura, ativo: true },
    });
    console.log('Formulario criado:', titulo);
  }
}

async function main() {
  console.log("Iniciando o seed...");

  const senhaRaw = 'Admin@123'; // atende as regras: maiúscula, minúscula, número e especial
  const prefixoServidor = process.env.PASSWORD_PREFIXO ?? '';
  const sufixoServidor  = process.env.PASSWORD_SUFIXO  ?? '';

  console.log(prefixoServidor, senhaRaw, sufixoServidor);

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

  await upsertFormulario(
    'FIDE — Padrão (SEDEC/MIDR)',
    'Formulário de Informações do Desastre (FIDE) — estrutura em 8 seções. Cenário exemplo nos metadados: Araripina/PE. Área afetada: use GeoJSON em respostas (mapa_selecao), sem colunas espaciais no banco.',
    estruturaFidePadrao
  );

  await upsertFormulario(
    'DMATE — Padrão (SEDEC/MIDR)',
    'Declaração Municipal de Atuação Emergencial (DMATE) — caracterização da emergência, capacidade gerencial e medidas em curso. Complementa o FIDE no mesmo simulado.',
    estruturaDmatePadrao
  );

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

