import * as XLSX from 'xlsx';
import { Cidadao, PerfilACS, IndicadorId } from '../types';
import {
  normalizarTexto,
  parseDataJS,
  extrairDatas,
  avaliarVisitasC2,
  avaliarVisitas30,
  idadeEmAnos,
  extrairDescricaoImportacao
} from './rules';

export interface PlanilhaStatus {
  id: string;
  icone: string;
  titulo: string;
  desc: string;
  carregada: boolean;
  totalRegistros: number;
}

export const PLANILHAS_ESPERADAS: Array<Omit<PlanilhaStatus, 'carregada' | 'totalRegistros'>> = [
  { id: 'cadastros', icone: '📋', titulo: 'Cadastros', desc: 'PEC: Acompanhamentos → Cidadãos vinculados' },
  { id: 'lista_geral', icone: '📊', titulo: 'Lista Geral', desc: 'PEC: Condições de saúde → Lista temática' },
  { id: 'diabeticos', icone: '🩸', titulo: 'Diabéticos', desc: 'PEC: Condições de saúde → Diabetes' },
  { id: 'hipertensos', icone: '❤️', titulo: 'Hipertensos', desc: 'PEC: Condições de saúde → Hipertensão' },
  { id: 'gestantes', icone: '🤰', titulo: 'Gestantes e Puérperas', desc: 'PEC: Condições de saúde → Gestação e Puerpério' },
  { id: 'idosos', icone: '👴', titulo: 'Pessoas Idosas', desc: 'PEC: Condições de saúde → Pessoa idosa' },
  { id: 'mulher', icone: '👩', titulo: 'Saúde da Mulher', desc: 'PEC: Condições de saúde → Saúde da mulher' },
  { id: 'criancas', icone: '👶', titulo: 'Crianças (Puericultura)', desc: 'PEC: Condições de saúde → Desenvolvimento infantil' },
  { id: 'territorio', icone: '🗺️', titulo: 'Território / Famílias', desc: 'PEC: Território → Cadastro domiciliar' },
  { id: 'vacinacao', icone: '💉', titulo: 'Busca Ativa de Vacinação', desc: 'PEC: Imunização → Busca ativa de vacinas (CSV e Excel)' }
];

function limpaValor(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/^"|"$/g, '').trim();
}

function numBR(v: unknown): number | null {
  const t = String(v ?? '').trim().replace(',', '.');
  const n = parseFloat(t);
  return t === '' || t === '-' || isNaN(n) ? null : n;
}

export async function processarArquivosImportados(
  arquivos: File[],
  baseAtual: Record<string, Cidadao>,
  ruasAtuais: Set<string>,
  perfilAtual: PerfilACS
): Promise<{
  cidadaos: Record<string, Cidadao>;
  ruas: Set<string>;
  perfil: PerfilACS;
  statusPlanilhas: Record<string, boolean>;
  totalProcessados: number;
  dataImportacao?: string;
  dataImportacaoFormatada?: string;
}> {
  const cidadaos: Record<string, Cidadao> = { ...baseAtual };
  const ruas: Set<string> = new Set(ruasAtuais);
  const perfilDetectado: Partial<PerfilACS> = { ...perfilAtual };
  const cpfToChave: Record<string, string> = {};
  const nomeToChave: Record<string, string> = {};
  const statusPlanilhas: Record<string, boolean> = {};

  // Mapear cidadãos existentes para evitar duplicatas por CPF ou Nome
  Object.values(cidadaos).forEach(c => {
    if (c.cpf) {
      const cpfLimpo = c.cpf.replace(/\D/g, '');
      if (cpfLimpo.length === 11) cpfToChave[cpfLimpo] = c.chave;
    }
    if (c.nome) {
      nomeToChave[c.nome.trim().toUpperCase()] = c.chave;
    }
  });

  const detectarPerfil = (chaveBruta: string, valorBruto: string) => {
    const k = normalizarTexto(chaveBruta);
    const v = limpaValor(valorBruto);
    if (!v || v === '-' || v.length > 80) return;
    if (!perfilDetectado.micro && (k.includes('microarea') || k.includes('micro-area') || k.includes('micro area'))) {
      perfilDetectado.micro = v;
    }
    if (!perfilDetectado.nome && (k.includes('agente comunitario') || k === 'acs' || k.includes('nome do acs') || k.includes('profissional'))) {
      perfilDetectado.nome = v;
    }
    if (!perfilDetectado.ubs && (k.includes('unidade') || k.includes('cnes') || k.includes('estabelecimento'))) {
      perfilDetectado.ubs = v;
    }
    if (!perfilDetectado.equipe && (k.includes('equipe responsavel') || k.includes('equipe'))) {
      perfilDetectado.equipe = v.split(',')[0].trim();
    }
  };

  let totalRegistrosGerais = 0;

  for (const file of arquivos) {
    let linhas: string[][] = [];
    const nomeArquivo = file.name.toLowerCase();

    // 1. Extração da data/hora do nome do arquivo (ex.: busca-ativa-vacinacao_2026-11-03-09-33)
    const infoData = extrairDescricaoImportacao(file.name);
    if (infoData && !perfilDetectado.dataImportacao) {
      perfilDetectado.dataImportacao = infoData.trecho;
      perfilDetectado.dataImportacaoFormatada = infoData.formatada;
    }

    // Leitura: suporta .csv, .xlsx, .xls
    if (nomeArquivo.endsWith('.xlsx') || nomeArquivo.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      linhas = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, raw: false });
    } else {
      // CSV com decodificação inteligente: tenta UTF-8 com fatal: true, e se falhar (padrão PEC), usa ISO-8859-1 / Latin1
      const buffer = await file.arrayBuffer();
      let texto = '';
      try {
        const decoderUtf8 = new TextDecoder('utf-8', { fatal: true });
        texto = decoderUtf8.decode(buffer);
      } catch {
        const decoderLatin1 = new TextDecoder('iso-8859-1');
        texto = decoderLatin1.decode(buffer);
      }

      const linhasRaw = texto.split(/\r?\n/);
      linhas = linhasRaw.map(l => {
        const sep = l.includes(';') ? ';' : ',';
        return l.split(sep).map(c => limpaValor(c));
      });
    }

    if (!linhas.length) continue;

    // Detecta tema, metadados do PEC e cabeçalho nas primeiras 35 linhas
    let tema = '';
    let cabIdx = -1;

    for (let i = 0; i < Math.min(linhas.length, 35); i++) {
      const colunas = linhas[i];
      if (!colunas || !colunas.length) continue;

      const linhaBruta = colunas.join(';');
      const linhaNorm = normalizarTexto(linhaBruta);

      // Detecta UBS em linhas como "UNIDADE DE SAÚDE UNIDADE BASICA..."
      if (linhaNorm.includes('unidade de saude') && !perfilDetectado.ubs) {
        const partes = linhaBruta.split(';');
        const nomeUbs = partes.find(p => normalizarTexto(p).includes('unidade'));
        if (nomeUbs) {
          perfilDetectado.ubs = nomeUbs.replace(/unidade de sa[uú]de/i, '').trim();
        }
      }

      if (colunas.length >= 2) {
        detectarPerfil(colunas[0], colunas[1]);
        if (colunas[0].includes('Lista temática')) {
          tema = colunas[1]?.trim() || '';
        }
      }

      // Procura indicador de ACS "Gerado em ... por ... Carlos Evaristo Cavalcante Filho"
      colunas.forEach((cel, idx) => {
        if (normalizarTexto(cel) === 'por' && colunas[idx + 1]) {
          const candidato = colunas[idx + 1].trim();
          if (candidato && candidato !== '-' && !perfilDetectado.nome) {
            perfilDetectado.nome = candidato;
          }
        }
      });

      // Detecta linha do cabeçalho de colunas (deve ter pelo menos 5 colunas para não confundir com filtros)
      const primColuna = normalizarTexto(colunas[0]);
      if (
        colunas.length >= 5 &&
        (primColuna.includes('nome do cidadao') ||
          primColuna.includes('nome cidadao') ||
          primColuna === 'nome' ||
          primColuna.includes('nome equipe') ||
          primColuna.includes('tipo de logradouro'))
      ) {
        cabIdx = i;
        break;
      }
    }

    // Identifica o ID da planilha
    let matchedId = 'lista_geral';
    const isBuscaAtivaVacinacao =
      nomeArquivo.includes('busca-ativa') ||
      nomeArquivo.includes('vacin') ||
      nomeArquivo.includes('imuniz') ||
      linhas.slice(0, 15).some(l => normalizarTexto(l.join(';')).includes('busca ativa de vacina'));

    if (isBuscaAtivaVacinacao) matchedId = 'vacinacao';
    else if (tema === 'Desenvolvimento infantil') matchedId = 'criancas';
    else if (tema === 'Gestação e puerpério') matchedId = 'gestantes';
    else if (tema === 'Diabetes') matchedId = 'diabeticos';
    else if (tema === 'Hipertensão') matchedId = 'hipertensos';
    else if (tema === 'Pessoa idosa') matchedId = 'idosos';
    else if (tema === 'Saúde da mulher') matchedId = 'mulher';
    else if (nomeArquivo.includes('cidadao') || nomeArquivo.includes('cadastro')) matchedId = 'cadastros';
    else if (nomeArquivo.includes('territorio') || nomeArquivo.includes('domiciliar') || nomeArquivo.includes('familia')) matchedId = 'territorio';

    statusPlanilhas[matchedId] = true;

    if (cabIdx === -1) continue;

    const cabecalho = linhas[cabIdx].map(c => limpaValor(c));

    for (let i = cabIdx + 1; i < linhas.length; i++) {
      const vals = linhas[i];
      if (!vals || vals.length === 0) continue;

      const reg: Record<string, string> = {};
      cabecalho.forEach((col, idx) => {
        reg[col] = vals[idx] || '';
      });

      const nome = (
        reg['Nome do cidadão'] ||
        reg['NOME DO CIDADÃO'] ||
        reg['Nome'] ||
        reg['NOME CIDADÃO'] ||
        reg['NOME'] ||
        ''
      ).trim().toUpperCase();

      if (!nome || nome === '-' || nome === 'SEM MORADORES' || nome.length < 3) continue;

      totalRegistrosGerais++;

      const cpfLimpo = (reg['CPF'] || reg['CPF/CNS'] || '').replace(/\D/g, '');
      const cpfValido = cpfLimpo.length === 11 ? cpfLimpo : '';
      let chave = '';

      if (cpfValido && cpfToChave[cpfValido]) {
        chave = cpfToChave[cpfValido];
      } else if (nomeToChave[nome]) {
        chave = nomeToChave[nome];
      } else {
        chave = cpfValido ? cpfValido : `cid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      if (cpfValido) cpfToChave[cpfValido] = chave;
      if (nome) nomeToChave[nome] = chave;

      let ruaBruta = (reg['Rua'] || reg['LOGRADOURO'] || reg['Logradouro'] || '').trim().toUpperCase();
      if (ruaBruta.includes('SÃO FRANCISCO') || ruaBruta.includes('SAO FRANCISCO')) ruaBruta = 'RUA SÃO FRANCISCO';
      else if (ruaBruta.includes('SÃO PEDRO') || ruaBruta.includes('SAO PEDRO')) ruaBruta = 'RUA SÃO PEDRO';
      else if (ruaBruta && !ruaBruta.startsWith('RUA ') && !ruaBruta.startsWith('AVENIDA ') && !ruaBruta.startsWith('TRAVESSA ')) {
        ruaBruta = 'RUA ' + ruaBruta;
      }

      if (!cidadaos[chave]) {
        cidadaos[chave] = {
          chave,
          nome,
          cpf: reg['CPF'] || reg['CPF/CNS'] || '',
          rua: ruaBruta || 'Sem logradouro informado',
          numero: reg['Número'] || reg['NÚMERO'] || 'S/N',
          telefone: reg['Telefone celular'] || reg['Telefone de contato'] || reg['Telefone'] || '',
          bolsaFamilia: false,
          indicadores: { C1: true },
          pendencias: []
        };
      }

      const cid = cidadaos[chave];
      cid.indicadores.C1 = true;

      if (!cid.nome) cid.nome = nome;
      if (ruaBruta) {
        cid.rua = ruaBruta;
        ruas.add(ruaBruta);
      }

      // Detecção de Microárea
      const microVal = reg['Microárea'] || reg['Microarea'] || reg['MICROÁREA'];
      if (microVal && microVal !== '-' && !perfilDetectado.micro) {
        perfilDetectado.micro = microVal;
      }

      // Detecção de medidas físicas
      cid.med = cid.med || {};
      const peso = numBR(reg['Última medição de peso']);
      const alt = numBR(reg['Última medição de altura']);
      const dPA_ = reg['Data da última medição de peso e altura'];
      if (peso || alt) {
        if (peso) cid.med.peso = peso;
        if (alt) cid.med.altura = alt;
        if (dPA_) cid.med.dtPeso = dPA_;
      }

      const pa = (reg['Última medição de pressão arterial'] || '').trim();
      const dPr = reg['Data da última medição de pressão arterial'];
      if (/\d/.test(pa)) {
        cid.med.pa = pa;
        if (dPr) cid.med.dtPa = dPr;
      }

      const hg = numBR(reg['Hemoglobina glicada']);
      const dHg = reg['Data da última avaliação de hemoglobina glicada'];
      if (hg !== null) {
        cid.med.hg = hg;
        if (dHg) cid.med.dtHg = dHg;
      }

      // Data de nascimento e idade
      for (const k in reg) {
        const kn = normalizarTexto(k);
        if (kn.includes('nascimento') && reg[k] && reg[k] !== '-') {
          cid.dt_nascimento = reg[k];
        }
        if ((kn === 'numero' || kn === 'no' || kn === 'n°') && (!cid.numero || cid.numero === 'S/N')) {
          cid.numero = reg[k];
        }
        if ((kn === 'telefone' || kn === 'telefone celular' || kn === 'telefone de contato') && !cid.telefone) {
          cid.telefone = reg[k];
        }
        if (kn === 'cns' && !cid.cns && reg[k] && reg[k] !== '-') {
          cid.cns = reg[k].replace(/"/g, '').trim();
        }
      }
      if (reg['Idade'] && reg['Idade'] !== '-') cid.idade_txt = reg['Idade'];

      // Bolsa Família
      for (const k in reg) {
        const kl = k.toLowerCase();
        const vl = (reg[k] || '').toLowerCase();
        if (kl.includes('bolsa') || kl.includes('auxílio') || kl.includes('benefício')) {
          if (vl === 'sim' || vl === 's' || vl === 'true' || vl === '1') cid.bolsaFamilia = true;
        }
        if (vl.includes('bolsa família') || vl.includes('bolsa familia') || vl.includes('auxílio brasil')) {
          cid.bolsaFamilia = true;
        }
      }

      // C1: Validade do cadastro (1 ano)
      if (reg['Última atualização cadastral'] && reg['Última atualização cadastral'] !== '-') {
        cid.dt_cadastral = reg['Última atualização cadastral'];
      }
      for (const k in reg) {
        const kn = normalizarTexto(k);
        const v = (reg[k] || '').trim();
        if (kn.includes('atualiza') && kn.includes('cadastr') && (kn.includes('domicil') || kn.includes('famili')) && /\d/.test(v)) {
          cid.dt_cad_dom = v;
        }
      }

      const dCad = parseDataJS(cid.dt_cadastral);
      const diasCad = dCad ? Math.floor((Date.now() - dCad.getTime()) / 86400000) : null;
      const indVenceu = diasCad === null || diasCad > 365;
      cid.c1Ok = !indVenceu;

      cid.pendencias = (cid.pendencias || []).filter(p => !p.startsWith('C1:'));
      if (indVenceu) {
        cid.pendencias.push(
          diasCad === null
            ? 'C1: Cadastro individual sem data de atualização registrada'
            : `C1: Cadastro individual desatualizado (última em ${cid.dt_cadastral}, há mais de 1 ano)`
        );
      }

      // =========================================================================
      // BUSCA ATIVA DE VACINAÇÃO (linhas com Status da vacina, Imunobiológico, Dose)
      // =========================================================================
      const imuno = (reg['Imunobiológico'] || reg['IMUNOBIOLÓGICO'] || reg['Imunobiologico'] || '').trim();
      const dose = (reg['Dose'] || reg['DOSE'] || '').trim();
      const statusVacina = (reg['Status da vacina'] || reg['STATUS DA VACINA'] || '').trim();

      if (imuno) {
        cid.vacinasAtrasadas = cid.vacinasAtrasadas || [];
        const isAtrasada = statusVacina.toLowerCase().includes('atras') || statusVacina.toLowerCase().includes('pend') || !statusVacina;

        if (isAtrasada) {
          if (!cid.vacinasAtrasadas.some(v => v.vacina === imuno && v.dose === dose)) {
            cid.vacinasAtrasadas.push({ vacina: imuno, dose, status: statusVacina || 'Atrasada' });
          }

          const imunoNorm = normalizarTexto(imuno);
          const anosCid = idadeEmAnos(cid.dt_nascimento);

          if (imunoNorm.includes('hpv') || imunoNorm.includes('papiloma')) {
            cid.indicadores.C7 = true;
            cid.c7_hpv_du = 'Atrasada';
            cid.c7Ok = false;
            const msgHpv = `C7: Vacina HPV (${dose || 'DU'}) 💉 Atrasada no PEC`;
            if (!cid.pendencias.some(p => p.includes('HPV'))) {
              cid.pendencias.push(msgHpv);
            }
          } else if (imunoNorm.includes('polio')) {
            cid.indicadores.C2 = true;
            cid.c2_vacinasOk = false;
            cid.c2Ok = false;
            const msgPolio = `C2: Vacina Pólio (${dose || 'Dose'}) 💉 Atrasada no PEC`;
            if (!cid.pendencias.some(p => p.includes('Pólio'))) {
              cid.pendencias.push(msgPolio);
            }
          } else if (imunoNorm.includes('penta')) {
            cid.indicadores.C2 = true;
            cid.c2_vacinasOk = false;
            cid.c2Ok = false;
            const msgPenta = `C2: Vacina Penta (${dose || 'Dose'}) 💉 Atrasada no PEC`;
            if (!cid.pendencias.some(p => p.includes('Penta'))) {
              cid.pendencias.push(msgPenta);
            }
          } else if (imunoNorm.includes('influenza') && anosCid !== null && anosCid >= 60) {
            cid.indicadores.C6 = true;
            cid.c6Ok = false;
            const msgInf = `C6: Vacina Influenza (${dose || 'Dose'}) 💉 Atrasada no PEC`;
            if (!cid.pendencias.some(p => p.includes('Influenza'))) {
              cid.pendencias.push(msgInf);
            }
          } else {
            const msgGeral = `Vacina em atraso 💉 ${imuno} (${dose || 'Dose'})`;
            if (!cid.pendencias.some(p => p.includes(imuno))) {
              cid.pendencias.push(msgGeral);
            }
          }
        }
      }

      // =========================================================================
      // COLUNA ESPECÍFICA "HPV DU" (em qualquer planilha, ex: Saúde da Mulher ou Busca Ativa)
      // =========================================================================
      for (const colKey in reg) {
        const colNorm = normalizarTexto(colKey);
        if (colNorm === 'hpv du' || colNorm === 'hpv' || (colNorm.includes('hpv') && colNorm.includes('du'))) {
          const valHpv = reg[colKey].trim();
          const valNorm = normalizarTexto(valHpv);
          cid.indicadores.C7 = true;

          const ehAtrasada =
            valNorm.includes('atras') ||
            valNorm.includes('pend') ||
            valNorm.includes('nao') ||
            valNorm.includes('não') ||
            valNorm.includes('sem registro') ||
            valHpv === '' ||
            valHpv === '-';

          if (ehAtrasada) {
            cid.c7_hpv_du = 'Atrasada';
            cid.c7Ok = false;
            const msg = 'C7: Vacina HPV DU 💉 (Atrasada / Pendente no PEC)';
            if (!cid.pendencias.some(p => p.includes('HPV'))) {
              cid.pendencias.push(msg);
            }
          } else if (
            valNorm.includes('em dia') ||
            valNorm.includes('sim') ||
            valNorm.includes('aplicad') ||
            valNorm.includes('tomad') ||
            /\d{1,2}\/\d{1,2}/.test(valHpv)
          ) {
            cid.c7_hpv_du = valHpv || 'Em dia';
            cid.pendencias = cid.pendencias.filter(p => !p.includes('HPV'));
          }
        }
      }

      // C2: Desenvolvimento infantil
      const temColunasC2 = 'Quantidade de visitas domiciliares até os 24 meses de idade' in reg || 'Poliomielite' in reg;
      if (temColunasC2 || tema === 'Desenvolvimento infantil') {
        cid.indicadores.C2 = true;
        cid.c2Detalhado = true;
        const visInf = parseInt(reg['Quantidade de visitas domiciliares até os 24 meses de idade'], 10) || 0;
        const v1 = extrairDatas(reg['Data da primeira visita domiciliar'])[0] || null;
        const v2 = extrairDatas(reg['Data da segunda visita domiciliar'])[0] || null;
        const av2 = avaliarVisitasC2(parseDataJS(cid.dt_nascimento), v1, v2, visInf);

        const penta = reg['Difteria, Tétano, Pertusis, Hepatite B, Haemophilus Influenza B'] || '';
        const polio = reg['Poliomielite'] || '';
        const pentaPendente = penta === '' || penta === '-' || penta.toLowerCase().includes('não') || penta.toLowerCase().includes('atras');
        const polioPendente = polio === '' || polio === '-' || polio.toLowerCase().includes('não') || polio.toLowerCase().includes('atras');

        cid.c2_visitas = visInf;
        const temVacinaAtrasadaC2 =
          pentaPendente || polioPendente || (cid.vacinasAtrasadas && cid.vacinasAtrasadas.some(v => normalizarTexto(v.vacina).includes('polio') || normalizarTexto(v.vacina).includes('penta')));

        cid.c2_vacinasOk = !temVacinaAtrasadaC2;
        cid.c2Ok = av2.ok && cid.c2_vacinasOk;
        cid.c2_tempo = { texto: av2.tempo, ok: av2.tempoOk };
        cid.c2_ok1 = av2.ok1;
        cid.c2_ok2 = av2.ok2;

        cid.pendencias = cid.pendencias.filter(p => !p.startsWith('C2:') || p.includes('Atrasada no PEC'));
        av2.pend.forEach(p => cid.pendencias.push('C2: ' + p));
        if (pentaPendente && !cid.pendencias.some(p => p.includes('Penta'))) cid.pendencias.push(`C2: Vacina Penta 💉 (${penta || 'Pendente'})`);
        if (polioPendente && !cid.pendencias.some(p => p.includes('Pólio'))) cid.pendencias.push(`C2: Vacina Pólio 💉 (${polio || 'Pendente'})`);
        cid.ex = cid.ex || {};
        cid.ex.C2 = { okExtra: cid.c2_vacinasOk, pend: cid.pendencias.filter(p => p.startsWith('C2: Vacina')) };
      }

      // C3: Gestação e puerpério
      if (tema === 'Gestação e puerpério') {
        cid.indicadores.C3 = true;
        const visPn = parseInt(reg['Quantidade de visitas domiciliares no pré-natal'], 10) || 0;
        const visPuerp = parseInt(reg['Quantidade de visitas domiciliares no puerpério'], 10) || 0;
        const consPn = parseInt(reg['Quantidade de atendimentos no pré-natal'], 10) || 0;
        const cons12sem = parseInt(reg['Quantidade de atendimentos até 12 semanas no pré-natal'], 10) || 0;
        const odonto = parseInt(reg['Quantidade de atendimentos odontológicos no pré-natal'], 10) || 0;

        cid.c3_vis_pn = visPn;
        cid.c3_vis_puerp = visPuerp;
        cid.c3_dpp = extrairDatas(reg['DPP (DUM)']).length ? reg['DPP (DUM)'] : reg['DPP (ecografia obstétrica)'] || '';
        cid.c3Ok = visPn >= 3 && visPuerp >= 1 && consPn >= 6 && odonto >= 1 && cons12sem >= 1;

        cid.pendencias = cid.pendencias.filter(p => !p.startsWith('C3:'));
        if (visPn < 3) cid.pendencias.push(`C3: Visitas Pré-Natal pendentes (${visPn}/3)`);
        if (visPuerp < 1) cid.pendencias.push('C3: Visita no Puerpério pendente (visitar mãe e bebê até o 7º dia)');
        if (cons12sem === 0) cid.pendencias.push('C3: Busca Ativa - Captação precoce (<12 semanas)');
        if (consPn < 6) cid.pendencias.push(`C3: Busca Ativa - Consultas Pré-Natal (${consPn}/6)`);
        if (odonto < 1) cid.pendencias.push('C3: Busca Ativa - Avaliação Odontológica pendente');
        cid.ex = cid.ex || {};
        cid.ex.C3 = { okExtra: consPn >= 6 && odonto >= 1 && cons12sem >= 1, pend: cid.pendencias.filter(p => p.startsWith('C3: Busca Ativa')) };
      }

      // C4: Diabetes
      if (tema === 'Diabetes') {
        cid.indicadores.C4 = true;
        const visDia = parseInt(reg['Quantidade de visitas domiciliares'], 10) || 0;
        const av4 = avaliarVisitas30(reg['Últimas visitas domiciliares'], visDia, 'Pessoa com diabetes');
        const hgVal = reg['Hemoglobina glicada'] || '';
        const dtHgVal = reg['Data da última avaliação de hemoglobina glicada'] || '';
        const dtPes = reg['Data da avaliação dos pés'] || '';
        const hgOk = (hgVal !== '' && hgVal !== '-') || (dtHgVal !== '' && dtHgVal !== '-');
        const pesOk = dtPes !== '' && dtPes !== '-';

        cid.c4_visitas = visDia;
        cid.c4_vis_txt = reg['Últimas visitas domiciliares'] || '';
        cid.c4_tempo = { texto: av4.tempo, ok: av4.tempoOk };
        cid.c4Ok = av4.ok && hgOk && pesOk;

        cid.pendencias = cid.pendencias.filter(p => !p.startsWith('C4:'));
        if (av4.pend) cid.pendencias.push(`C4: ${av4.pend}`);
        if (!hgOk) cid.pendencias.push('C4: Busca Ativa - Exame de Hemoglobina Glicada');
        if (!pesOk) cid.pendencias.push('C4: Busca Ativa - Avaliação periódica dos pés');
        cid.ex = cid.ex || {};
        cid.ex.C4 = { okExtra: hgOk && pesOk, pend: cid.pendencias.filter(p => p.startsWith('C4: Busca Ativa')) };
      }

      // C5: Hipertensão
      if (tema === 'Hipertensão') {
        cid.indicadores.C5 = true;
        const visHip = parseInt(reg['Quantidade de visitas domiciliares'], 10) || 0;
        const av5 = avaliarVisitas30(reg['Últimas visitas domiciliares'], visHip, 'Pessoa com hipertensão');
        const paQtd = parseInt(reg['Quantidade de medições de pressão arterial'], 10) || 0;
        const consQtd = parseInt(reg['Quantidade de consultas'], 10) || 0;

        cid.c5_visitas = visHip;
        cid.c5_vis_txt = reg['Últimas visitas domiciliares'] || '';
        cid.c5_tempo = { texto: av5.tempo, ok: av5.tempoOk };
        cid.c5Ok = av5.ok && paQtd >= 1 && consQtd >= 1;

        cid.pendencias = cid.pendencias.filter(p => !p.startsWith('C5:'));
        if (av5.pend) cid.pendencias.push(`C5: ${av5.pend}`);
        if (paQtd === 0) cid.pendencias.push('C5: Busca Ativa - Aferição de PA no semestre');
        if (consQtd === 0) cid.pendencias.push('C5: Busca Ativa - Agendar Consulta semestral');
        cid.ex = cid.ex || {};
        cid.ex.C5 = { okExtra: paQtd >= 1 && consQtd >= 1, pend: cid.pendencias.filter(p => p.startsWith('C5: Busca Ativa')) };
      }

      // C6: Pessoa idosa
      if (tema === 'Pessoa idosa' || tema.toLowerCase().includes('idoso')) {
        cid.indicadores.C6 = true;
        const visIdo = parseInt(reg['Quantidade de visitas domiciliares'], 10) || 0;
        const av6 = avaliarVisitas30(reg['Últimas visitas domiciliares'], visIdo, 'Pessoa idosa');
        const inf = reg['Influenza (últimos 12 meses)'] || reg['Vacina influenza'] || reg['Influenza'] || '';
        const infPendente = inf === '' || inf === '-' || inf.toLowerCase().includes('não') || inf.toLowerCase().includes('atras');
        const mMed = parseInt(reg['Meses desde o último atendimento médico'], 10) || 99;
        const mEnf = parseInt(reg['Meses desde o último atendimento de enfermagem'], 10) || 99;
        const consAnual = mMed <= 12 || mEnf <= 12;

        cid.c6_visitas = visIdo;
        cid.c6_tempo = { texto: av6.tempo, ok: av6.tempoOk };
        cid.c6_vis_txt = reg['Últimas visitas domiciliares'] || '';
        cid.c6Ok = av6.ok && !infPendente && consAnual;

        cid.pendencias = cid.pendencias.filter(p => !p.startsWith('C6:'));
        if (av6.pend) cid.pendencias.push(`C6: ${av6.pend}`);
        if (infPendente) cid.pendencias.push(`C6: Vacina Influenza 💉 (${inf || 'Não realizada'})`);
        if (!consAnual) cid.pendencias.push('C6: Busca Ativa - Consulta anual pendente (>12 meses)');
        cid.ex = cid.ex || {};
        cid.ex.C6 = { okExtra: !infPendente && consAnual, pend: cid.pendencias.filter(p => p.startsWith('C6:')) };
      }

      // C7: Saúde da mulher
      if (tema === 'Saúde da mulher') {
        const anos = idadeEmAnos(cid.dt_nascimento);
        const precisaColo = anos === null || (anos >= 25 && anos <= 64);
        const precisaHpv = anos !== null && anos >= 9 && anos <= 14;
        const precisaConsulta = anos === null || (anos >= 14 && anos <= 69);
        const precisaMama = anos !== null && anos >= 50 && anos <= 69;

        cid.pendencias = cid.pendencias.filter(p => !p.startsWith('C7:'));
        if (precisaColo || precisaHpv || precisaConsulta || precisaMama) {
          cid.indicadores.C7 = true;
          let coloOk = false;
          let hpvOk = cid.c7_hpv_du === 'Em dia';
          let mamaOk = false;

          for (const k in reg) {
            const kn = normalizarTexto(k);
            const vn = normalizarTexto(reg[k]);
            if (kn.includes('colo') && (vn.includes('em dia') || vn.includes('sim') || /\d/.test(vn))) coloOk = true;
            if (kn.includes('hpv') && (vn.includes('em dia') || vn.includes('sim') || /\d/.test(vn))) hpvOk = true;
            if (kn.includes('mama') && (vn.includes('em dia') || vn.includes('sim') || /\d/.test(vn))) mamaOk = true;
          }

          if (precisaColo && !coloOk) cid.pendencias.push('C7: Exame Citopatológico / Preventivo do colo do útero (25 a 64 anos)');
          if (precisaHpv && !hpvOk && !cid.pendencias.some(p => p.includes('HPV'))) {
            cid.pendencias.push('C7: Vacina HPV DU 💉 (9 a 14 anos)');
          }
          if (precisaMama && !mamaOk) cid.pendencias.push('C7: Mamografia de rastreamento (50 a 69 anos)');

          cid.c7Ok = (!precisaColo || coloOk) && (!precisaHpv || hpvOk) && (!precisaMama || mamaOk);
        }
      }
    }
  }

  return {
    cidadaos,
    ruas,
    perfil: {
      nome: perfilDetectado.nome || perfilAtual.nome || 'Agente Comunitário de Saúde',
      micro: perfilDetectado.micro || perfilAtual.micro || '01',
      ubs: perfilDetectado.ubs || perfilAtual.ubs || 'Unidade Básica de Saúde',
      equipe: perfilDetectado.equipe || perfilAtual.equipe || '',
      dataImportacao: perfilDetectado.dataImportacao || perfilAtual.dataImportacao,
      dataImportacaoFormatada: perfilDetectado.dataImportacaoFormatada || perfilAtual.dataImportacaoFormatada
    },
    statusPlanilhas,
    totalProcessados: totalRegistrosGerais,
    dataImportacao: perfilDetectado.dataImportacao,
    dataImportacaoFormatada: perfilDetectado.dataImportacaoFormatada
  };
}
