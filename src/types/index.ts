export type IndicadorId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'BF';

export interface MedidasCidadao {
  peso?: number;
  altura?: number;
  dtPeso?: string;
  dtPesoMs?: number;
  pa?: string;
  dtPa?: string;
  dtPaMs?: number;
  hg?: number;
  dtHg?: string;
  dtHgMs?: number;
}

export interface VisitaApp {
  id: string;
  d: string; // ISO YYYY-MM-DD
  inds: string[]; // ['C2', 'C4', etc.]
  base?: Record<string, number>;
  timestamp: number;
}

export interface RetornoCidadao {
  id: string;
  d: string; // ISO YYYY-MM-DD
  nota?: string;
  feito: boolean;
}

export interface Cidadao {
  chave: string;
  nome: string;
  cpf: string;
  cns?: string;
  dt_nascimento?: string;
  idade_txt?: string;
  rua: string;
  numero: string;
  telefone?: string;
  anotacao?: string;
  bolsaFamilia: boolean;
  indicadores: Partial<Record<IndicadorId, boolean>>;
  pendencias: string[];
  
  // Status dos indicadores
  c1Ok?: boolean;
  c1_ind_ok?: boolean;
  c1_dom_ok?: boolean | null;
  dt_cadastral?: string;
  dt_cad_dom?: string;

  c2Ok?: boolean;
  c2_visitas?: number;
  c2_vacinasOk?: boolean;
  c2_v1?: string;
  c2_v2?: string;
  c2_ok1?: boolean;
  c2_ok2?: boolean;
  c2_tempo?: { texto: string; ok: boolean };
  c2Detalhado?: boolean;

  c3Ok?: boolean;
  c3_vis_pn?: number;
  c3_vis_puerp?: number;
  c3_pn_ef?: number;
  c3_pu_ef?: number;
  c3_dpp?: string;
  c3_ult?: string;
  c3_ultDias?: number | null;
  c3_tempo?: { texto: string; ok: boolean };
  c3_tempo_rep?: { texto: string; ok: boolean };

  c4Ok?: boolean;
  c4_visitas?: number;
  c4_vis_txt?: string;
  c4_tempo?: { texto: string; ok: boolean };

  c5Ok?: boolean;
  c5_visitas?: number;
  c5_vis_txt?: string;
  c5_tempo?: { texto: string; ok: boolean };

  c6Ok?: boolean;
  c6_visitas?: number;
  c6_vis_txt?: string;
  c6_tempo?: { texto: string; ok: boolean };

  c7Ok?: boolean;
  c7_tempo?: { texto: string; ok: boolean };

  med?: MedidasCidadao;
  visitasApp?: VisitaApp[];
  retornos?: RetornoCidadao[];
  vacinasAtrasadas?: Array<{ vacina: string; dose: string; status: string }>;
  c7_hpv_du?: string;
  ex?: Record<string, { okExtra: boolean; pend: string[] }>;
}

export interface IndicadorStatus {
  id: IndicadorId;
  nome: string;
  titulo: string;
  icone: string;
  cor: string;
  metaDesc: string;
  total: number;
  ok: number;
  pendentes: number;
  porcentagem: number;
}

export interface PerfilACS {
  nome: string;
  micro: string;
  ubs?: string;
  equipe?: string;
  dataImportacao?: string;
  dataImportacaoFormatada?: string;
}

export interface HistoricoItem {
  d: string; // YYYY-MM-DD
  st: Record<string, { tot: number; ok: number }>;
}

export interface AlertaAcao {
  chave: string;
  cidadao: Cidadao;
  dias: number;
  data: Date;
  tipo: 'prazo' | 'janela' | 'faixa' | 'retorno';
  ind: string;
  texto: string;
  atrasado?: boolean;
  retornoIndex?: number;
}

export interface AniversarianteItem {
  chave: string;
  cidadao: Cidadao;
  dias: number;
  data: Date;
  anos: number;
  dd: string;
}

export interface BaseDados {
  cidadaos: Record<string, Cidadao>;
  ruas: string[];
  perfil: PerfilACS;
  historico: HistoricoItem[];
  dataImportacao?: string;
  dataImportacaoFormatada?: string;
}
