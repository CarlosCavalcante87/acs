import { BaseDados, Cidadao, PerfilACS } from '../types';

export const PERFIL_DEMO: PerfilACS = {
  nome: 'Maria Silva Santos',
  micro: '04',
  ubs: 'ESF Esperança',
  equipe: 'Equipe Azul'
};

export const RUAS_DEMO: string[] = [
  'RUA SÃO FRANCISCO',
  'RUA SÃO PEDRO',
  'RUA DAS FLORES',
  'AVENIDA BRASIL',
  'TRAVESSA DA PAZ'
];

export const CIDADAOS_DEMO: Record<string, Cidadao> = {
  'cid_01': {
    chave: 'cid_01',
    nome: 'ANA CLARA ALBUQUERQUE',
    cpf: '123.456.789-01',
    cns: '789123456780001',
    dt_nascimento: '14/05/2026',
    idade_txt: '5 meses',
    rua: 'RUA SÃO FRANCISCO',
    numero: '142',
    telefone: '87988776655',
    bolsaFamilia: true,
    indicadores: { C1: true, C2: true, BF: true },
    pendencias: ['C2: 2ª visita ("Criança"): fazer até 14/11/2026 (depois dos 30 dias e até 6 meses)', 'C2: Vacina Pólio 💉 (Pendente)'],
    c1Ok: true,
    dt_cadastral: '10/01/2026',
    c2Ok: false,
    c2_visitas: 1,
    c2_v1: '28/05/2026',
    c2_v2: '',
    c2_ok1: true,
    c2_ok2: false,
    c2_vacinasOk: false,
    c2_tempo: { texto: '⏱ 1ª aos 14 dias ✓', ok: false },
    med: {
      peso: 6.8,
      altura: 64,
      dtPeso: '15/09/2026'
    },
    retornos: [
      { id: 'ret_1', d: '2026-11-08', nota: 'Conferir aplicação da vacina pólio na UBS', feito: false }
    ],
    anotacao: 'Mãe relata boa amamentação exclusiva.'
  },

  'cid_02': {
    chave: 'cid_02',
    nome: 'BEATRIZ MENDONÇA LIMA',
    cpf: '234.567.890-12',
    cns: '789123456780002',
    dt_nascimento: '22/03/1998',
    idade_txt: '28 anos',
    rua: 'RUA SÃO PEDRO',
    numero: '58',
    telefone: '87999881122',
    bolsaFamilia: false,
    indicadores: { C1: true, C3: true, C7: true },
    pendencias: [
      'C3: Visitas Pré-Natal pendentes (2/3)',
      'C3: Busca Ativa - Avaliação Odontológica pendente'
    ],
    c1Ok: true,
    dt_cadastral: '05/02/2026',
    c3Ok: false,
    c3_vis_pn: 2,
    c3_vis_puerp: 0,
    c3_dpp: '28/11/2026',
    c3_ult: '1 mês e 10 dias',
    c3_tempo: { texto: '⏱ Última visita há 1 mês e 10 dias', ok: false },
    c7Ok: true,
    med: {
      peso: 68.5,
      altura: 162,
      dtPeso: '10/08/2026',
      pa: '110/70',
      dtPa: '10/08/2026'
    },
    retornos: [
      { id: 'ret_2', d: '2026-11-12', nota: '3ª visita domiciliar de pré-natal', feito: false }
    ],
    anotacao: 'Gestação de risco habitual. Encaminhada para odontologia.'
  },

  'cid_03': {
    chave: 'cid_03',
    nome: 'CARLOS EDUARDO OLIVEIRA',
    cpf: '345.678.901-23',
    cns: '789123456780003',
    dt_nascimento: '10/11/1961',
    idade_txt: '64 anos',
    rua: 'RUA SÃO FRANCISCO',
    numero: '310',
    telefone: '87981234567',
    bolsaFamilia: false,
    indicadores: { C1: true, C4: true, C5: true, C6: true },
    pendencias: [
      'C4: Busca Ativa - Exame de Hemoglobina Glicada',
      'C6: Vacina Influenza 💉 (Não realizada)'
    ],
    c1Ok: true,
    dt_cadastral: '20/03/2026',
    c4Ok: false,
    c4_visitas: 2,
    c4_vis_txt: '15/04/2026 20/07/2026',
    c4_tempo: { texto: '⏱ 2 visitas nos últimos 12 meses (intervalo de 96 dias)', ok: true },
    c5Ok: true,
    c5_visitas: 2,
    c5_vis_txt: '15/04/2026 20/07/2026',
    c5_tempo: { texto: '⏱ 2 visitas nos últimos 12 meses (intervalo de 96 dias)', ok: true },
    c6Ok: false,
    c6_visitas: 2,
    c6_vis_txt: '15/04/2026 20/07/2026',
    c6_tempo: { texto: '⏱ 2 visitas nos últimos 12 meses', ok: true },
    med: {
      peso: 82.0,
      altura: 171,
      dtPeso: '20/07/2026',
      pa: '135/85',
      dtPa: '20/07/2026',
      hg: 7.8,
      dtHg: '15/12/2025' // venceu
    },
    retornos: [
      { id: 'ret_3', d: '2026-11-06', nota: 'Solicitar exame de HbA1c e orientar vacina influenza', feito: false }
    ],
    anotacao: 'Paciente hipertenso e diabético tipo 2 em uso de Losartana e Metformina.'
  },

  'cid_04': {
    chave: 'cid_04',
    nome: 'DONA FRANCISCA DAS CHAGAS',
    cpf: '456.789.012-34',
    cns: '789123456780004',
    dt_nascimento: '04/09/1949',
    idade_txt: '77 anos',
    rua: 'RUA DAS FLORES',
    numero: '75',
    telefone: '87987654321',
    bolsaFamilia: false,
    indicadores: { C1: true, C5: true, C6: true },
    pendencias: [],
    c1Ok: true,
    dt_cadastral: '12/04/2026',
    c5Ok: true,
    c5_visitas: 2,
    c5_vis_txt: '10/03/2026 15/06/2026',
    c5_tempo: { texto: '⏱ 2 visitas nos últimos 12 meses', ok: true },
    c6Ok: true,
    c6_visitas: 2,
    c6_vis_txt: '10/03/2026 15/06/2026',
    c6_tempo: { texto: '⏱ 2 visitas nos últimos 12 meses', ok: true },
    med: {
      peso: 61.0,
      altura: 156,
      dtPeso: '15/06/2026',
      pa: '120/80',
      dtPa: '15/06/2026'
    },
    anotacao: 'Idosa lúcida e ativa. Mora com a filha.'
  },

  'cid_05': {
    chave: 'cid_05',
    nome: 'EMANUELE SANTOS COSTA',
    cpf: '567.890.123-45',
    cns: '789123456780005',
    dt_nascimento: '18/11/1990',
    idade_txt: '35 anos',
    rua: 'AVENIDA BRASIL',
    numero: '520',
    telefone: '87991239876',
    bolsaFamilia: true,
    indicadores: { C1: true, C7: true, BF: true },
    pendencias: [
      'C7: Exame Citopatológico / Preventivo do colo do útero (25 a 64 anos)'
    ],
    c1Ok: true,
    dt_cadastral: '22/01/2026',
    c7Ok: false,
    med: {
      peso: 65.0,
      altura: 164,
      dtPeso: '22/01/2026',
      pa: '115/75',
      dtPa: '22/01/2026'
    },
    retornos: [
      { id: 'ret_4', d: '2026-11-18', nota: 'Aniversariante (completa 36 anos) + agendar preventivo', feito: false }
    ],
    anotacao: 'Beneficiária do Bolsa Família. Pede agendamento de preventivo no sábado.'
  },

  'cid_06': {
    chave: 'cid_06',
    nome: 'GABRIEL HENRIQUE MOREIRA',
    cpf: '678.901.234-56',
    cns: '789123456780006',
    dt_nascimento: '02/08/2026',
    idade_txt: '3 meses',
    rua: 'TRAVESSA DA PAZ',
    numero: '19',
    telefone: '87988112233',
    bolsaFamilia: true,
    indicadores: { C1: true, C2: true, BF: true },
    pendencias: [],
    c1Ok: true,
    dt_cadastral: '10/08/2026',
    c2Ok: true,
    c2_visitas: 2,
    c2_v1: '16/08/2026',
    c2_v2: '20/09/2026',
    c2_ok1: true,
    c2_ok2: true,
    c2_vacinasOk: true,
    c2_tempo: { texto: '⏱ 1ª aos 14 dias ✓ · 2ª aos 49 dias ✓', ok: true },
    med: {
      peso: 5.9,
      altura: 60,
      dtPeso: '20/09/2026'
    },
    anotacao: 'Caderneta da criança totalmente em dia.'
  },

  'cid_07': {
    chave: 'cid_07',
    nome: 'HELIO MATHEUS SILVEIRA',
    cpf: '789.012.345-67',
    cns: '789123456780007',
    dt_nascimento: '25/11/1966',
    idade_txt: '59 anos',
    rua: 'RUA SÃO PEDRO',
    numero: '215',
    telefone: '87996543210',
    bolsaFamilia: false,
    indicadores: { C1: true, C5: true },
    pendencias: [
      'C1: Cadastro individual desatualizado (última em 15/10/2025, há mais de 1 ano)',
      'C5: Busca Ativa - Aferição de PA no semestre'
    ],
    c1Ok: false,
    dt_cadastral: '15/10/2025',
    c5Ok: false,
    c5_visitas: 1,
    c5_vis_txt: '10/05/2026',
    c5_tempo: { texto: '⏱ Última visita há 177 dias · 1/2 visita', ok: false },
    med: {
      pa: '140/90',
      dtPa: '10/05/2026'
    },
    anotacao: 'Completa 60 anos em 25/11/2026 e passará a ser acompanhado também pelo C6 (idosos).'
  },

  'cid_08': {
    chave: 'cid_08',
    nome: 'JULIANA TAVARES CORREIA',
    cpf: '890.123.456-78',
    cns: '789123456780008',
    dt_nascimento: '12/11/2011',
    idade_txt: '14 anos',
    rua: 'AVENIDA BRASIL',
    numero: '330',
    telefone: '87981122445',
    bolsaFamilia: false,
    indicadores: { C1: true, C7: true },
    pendencias: [
      'C7: Vacina HPV 💉 (9 a 14 anos)'
    ],
    c1Ok: true,
    dt_cadastral: '14/03/2026',
    c7Ok: false,
    retornos: [
      { id: 'ret_5', d: '2026-11-10', nota: 'Última oportunidade da vacina HPV antes de completar 15 anos!', feito: false }
    ],
    anotacao: 'Completa 15 anos nos próximos dias. Urgência para aplicação da vacina HPV.'
  }
};

export const BASE_DEMO: BaseDados = {
  cidadaos: CIDADAOS_DEMO,
  ruas: RUAS_DEMO,
  perfil: PERFIL_DEMO,
  historico: [
    {
      d: '2026-10-15',
      st: {
        C1: { tot: 8, ok: 6 },
        C2: { tot: 2, ok: 1 },
        C3: { tot: 1, ok: 0 },
        C4: { tot: 1, ok: 0 },
        C5: { tot: 3, ok: 1 },
        C6: { tot: 2, ok: 1 },
        C7: { tot: 3, ok: 1 },
        BF: { tot: 3, ok: 1 }
      }
    },
    {
      d: '2026-11-03',
      st: {
        C1: { tot: 8, ok: 7 },
        C2: { tot: 2, ok: 1 },
        C3: { tot: 1, ok: 0 },
        C4: { tot: 1, ok: 0 },
        C5: { tot: 3, ok: 2 },
        C6: { tot: 2, ok: 1 },
        C7: { tot: 3, ok: 1 },
        BF: { tot: 3, ok: 2 }
      }
    }
  ]
};
