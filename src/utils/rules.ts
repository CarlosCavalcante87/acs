import { Cidadao, IndicadorId, IndicadorStatus, AlertaAcao, AniversarianteItem, PerfilACS, HistoricoItem } from '../types';

export function parseDataJS(dStr: string | null | undefined): Date | null {
  if (!dStr || dStr === '-' || dStr === 'Sem registro') return null;
  const s = dStr.trim();
  if (s.includes('/')) {
    const p = s.split('/');
    if (p.length === 3) {
      const dia = parseInt(p[0], 10);
      const mes = parseInt(p[1], 10) - 1;
      let ano = parseInt(p[2], 10);
      if (ano < 100) ano += 2000;
      const d = new Date(ano, mes, dia);
      if (!isNaN(d.getTime())) return d;
    }
  } else if (s.includes('-')) {
    const p = s.split('-');
    if (p.length === 3) {
      const ano = parseInt(p[0], 10);
      const mes = parseInt(p[1], 10) - 1;
      const dia = parseInt(p[2], 10);
      const d = new Date(ano, mes, dia);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const timestamp = Date.parse(s);
  return isNaN(timestamp) ? null : new Date(timestamp);
}

export function fmtData(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function dataBR(iso: string): string {
  if (!iso) return '';
  return iso.split('-').reverse().join('/');
}

export function diasEntre(d1: Date, d2: Date): number {
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  return Math.round((t2 - t1) / 86400000);
}

/**
 * Extrai e formata o trecho de data/hora da importação (ex: 2026-11-03-09-33 -> 03/11/2026 às 09:33)
 */
export function extrairDescricaoImportacao(nomeArquivo: string): { trecho: string; formatada: string } | null {
  if (!nomeArquivo) return null;
  // Padrão com data e hora: YYYY-MM-DD-HH-MM
  const mCompleto = nomeArquivo.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/);
  if (mCompleto) {
    const [trecho, ano, mes, dia, hora, min] = mCompleto;
    return {
      trecho,
      formatada: `${dia}/${mes}/${ano} às ${hora}:${min}`
    };
  }
  // Padrão apenas data: YYYY-MM-DD
  const mData = nomeArquivo.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (mData) {
    const [trecho, ano, mes, dia] = mData;
    return {
      trecho,
      formatada: `${dia}/${mes}/${ano}`
    };
  }
  return null;
}

export function somarDias(d: Date, dias: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + dias);
  return r;
}

export function somarMeses(d: Date, meses: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + meses);
  return r;
}

export function iniDia(d: Date | string | number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function normalizarTexto(txt: string | null | undefined): string {
  if (!txt) return '';
  return txt
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function idadeEmAnos(dtStr: string | null | undefined): number | null {
  const n = parseDataJS(dtStr);
  if (!n || isNaN(n.getTime())) return null;
  const hoje = new Date();
  let a = hoje.getFullYear() - n.getFullYear();
  if (hoje.getMonth() < n.getMonth() || (hoje.getMonth() === n.getMonth() && hoje.getDate() < n.getDate())) {
    a--;
  }
  return a;
}

export function calcularIdade(dtStr: string | null | undefined): string {
  const n = parseDataJS(dtStr);
  if (!n || isNaN(n.getTime())) return '';
  const hoje = new Date();
  let anos = hoje.getFullYear() - n.getFullYear();
  let meses = hoje.getMonth() - n.getMonth();
  if (hoje.getDate() < n.getDate()) meses--;
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  if (anos < 0) return '';
  const a = anos === 1 ? '1 ano' : `${anos} anos`;
  const m = meses === 1 ? '1 mês' : `${meses} meses`;
  if (anos === 0) return meses === 0 ? 'Menos de 1 mês' : m;
  return meses === 0 ? a : `${a} e ${m}`;
}

export function extrairDatas(txt: string | null | undefined): Date[] {
  if (!txt) return [];
  const re = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
  const out: Date[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(txt)) !== null) {
    const dia = parseInt(m[1], 10);
    const mes = parseInt(m[2], 10) - 1;
    let ano = parseInt(m[3], 10);
    if (ano < 100) ano += 2000;
    const d = new Date(ano, mes, dia);
    if (!isNaN(d.getTime())) out.push(d);
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

export function datasUnicas12m(txt: string | null | undefined): Date[] {
  const janela = somarMeses(new Date(), -12);
  const unicas: Date[] = [];
  extrairDatas(txt)
    .filter(d => d >= janela)
    .forEach(d => {
      if (!unicas.some(u => u.getTime() === d.getTime())) {
        unicas.push(d);
      }
    });
  return unicas;
}

/**
 * Classificação do IMC conforme padrão do Ministério da Saúde:
 * - Adultos (19-59 anos): OMS
 * - Idosos (60+ anos): SISVAN / Lipschitz
 */
export function classificarIMC(imc: number, anos: number | null): { texto: string; nivel: 'ok' | 'alerta' | 'perigo' } {
  if (anos !== null && anos >= 60) {
    if (imc < 22) return { texto: 'Baixo peso', nivel: 'alerta' };
    if (imc <= 27) return { texto: 'Peso adequado', nivel: 'ok' };
    return { texto: 'Sobrepeso', nivel: 'alerta' };
  }
  if (imc < 18.5) return { texto: 'Baixo peso', nivel: 'alerta' };
  if (imc < 25) return { texto: 'Peso adequado', nivel: 'ok' };
  if (imc < 30) return { texto: 'Sobrepeso', nivel: 'alerta' };
  if (imc < 35) return { texto: 'Obesidade grau I', nivel: 'perigo' };
  if (imc < 40) return { texto: 'Obesidade grau II', nivel: 'perigo' };
  return { texto: 'Obesidade grau III (grave)', nivel: 'perigo' };
}

/**
 * Avaliação das visitas do C2 (Desenvolvimento infantil):
 * - 1ª visita até 30 dias de vida
 * - 2ª visita entre o 31º dia e 6 meses de vida
 */
export function avaliarVisitasC2(
  nasc: Date | null,
  v1: Date | null,
  v2: Date | null,
  qtd: number
): { ok: boolean; pend: string[]; tempo: string; tempoOk: boolean; ok1: boolean; ok2: boolean } {
  const hoje = new Date();
  const r = { ok: false, pend: [] as string[], tempo: '', tempoOk: false, ok1: false, ok2: false };

  if (!nasc || isNaN(nasc.getTime())) {
    r.ok = qtd >= 2;
    r.tempoOk = r.ok;
    if (!r.ok) r.pend.push(`Visita Domiciliar pendente (${qtd}/2 visitas)`);
    return r;
  }

  const lim1 = somarDias(nasc, 30);
  const ini2 = somarDias(nasc, 31);
  const lim2 = somarMeses(nasc, 6);
  const fim24 = somarMeses(nasc, 24);

  const d1 = v1 ? diasEntre(nasc, v1) : null;
  const d2 = v2 ? diasEntre(nasc, v2) : null;

  const ok1 = !!v1 && d1 !== null && d1 >= 0 && d1 <= 30;
  const ok2 = !!v2 && d2 !== null && d2 > 30 && v2 <= lim2;
  r.ok1 = ok1;
  r.ok2 = ok2;

  const partes: string[] = [];
  const marca = (ok: boolean) => (hoje > fim24 ? '' : ok ? ' ✓' : ' ✗');
  if (v1 && d1 !== null) partes.push(`1ª aos ${d1} dias${marca(ok1)}`);
  if (v2 && d2 !== null) partes.push(`2ª aos ${d2} dias${marca(ok2)}`);
  if (v1 && v2) partes.push(`${diasEntre(v1, v2)} dias entre elas`);
  r.tempo = partes.length ? '⏱ ' + partes.join(' · ') : '⏱ Sem visitas registradas';

  if (hoje > fim24) {
    r.ok = qtd >= 2;
    r.tempoOk = r.ok;
    return r;
  }

  r.ok = ok1 && ok2;
  r.tempoOk = r.ok;

  const nota = qtd > 2 ? ` — há ${qtd} visitas: confira se alguma cai nesse período` : '';
  const janela2 = `entre ${fmtData(ini2)} e ${fmtData(lim2)}`;

  if (!ok1) {
    if (!v1) {
      r.pend.push(
        hoje <= lim1
          ? `1ª visita ("Recém-nascido"): fazer até ${fmtData(lim1)} (30 dias de vida)`
          : `1ª visita não consta no relatório (prazo de 30 dias terminou em ${fmtData(lim1)})`
      );
    } else {
      r.pend.push(`1ª visita foi aos ${d1} dias de vida, fora do prazo (até 30 dias)`);
    }
  }

  if (!ok2) {
    if (!v2) {
      r.pend.push(
        hoje <= lim2
          ? `2ª visita ("Criança"): fazer ${janela2} (depois dos 30 dias e até 6 meses)${nota}`
          : `2ª visita não consta e o prazo terminou em ${fmtData(lim2)}${nota}`
      );
    } else if (d2 !== null && d2 <= 30) {
      r.pend.push(
        hoje <= lim2
          ? `2ª visita aos ${d2} dias (antes do 31º dia não conta): fazer outra ${janela2}${nota}`
          : `2ª visita aos ${d2} dias e o prazo terminou em ${fmtData(lim2)}${nota}`
      );
    } else {
      r.pend.push(`2ª visita aos ${d2} dias de vida, após 6 meses (fora do prazo)${nota}`);
    }
  }

  return r;
}

/**
 * Avaliação das visitas com regra de 2 visitas em 12 meses e 30+ dias de intervalo (C4, C5, C6)
 */
export function avaliarVisitas30(
  texto: string | null | undefined,
  qtdInformada: number,
  motivoNome: string
): { ok: boolean; tempo: string; tempoOk: boolean; pend?: string } {
  const datas = datasUnicas12m(texto);
  const qtdReal = Math.max(datas.length, qtdInformada);

  if (datas.length < 2) {
    const falta = 2 - qtdReal;
    const txtQtd = `${qtdReal}/2 visita(s) nos últimos 12 meses`;
    if (datas.length === 1) {
      const dias = diasEntre(datas[0], new Date());
      const espera = 30 - dias;
      const quando2 =
        espera > 0
          ? ` (a 2ª visita só conta após ${espera} dia(s), a partir de ${fmtData(somarDias(datas[0], 30))})`
          : ` (intervalo de 30+ dias já atingido)`;
      return {
        ok: false,
        tempo: `⏱ Última visita há ${dias} dia(s) · ${txtQtd}`,
        tempoOk: false,
        pend: `Visitas domiciliares pendentes: falta ${Math.max(falta, 1)} visita${quando2}`
      };
    }
    return {
      ok: false,
      tempo: `⏱ Sem visitas registradas nos últimos 12 meses`,
      tempoOk: false,
      pend: `Visitas domiciliares pendentes: falta(m) ${Math.max(falta, 2)} visita(s) (motivo: "${motivoNome}")`
    };
  }

  // Há 2 ou mais datas nos últimos 12 meses
  let maiorIntervalo = 0;
  for (let i = 1; i < datas.length; i++) {
    const diff = diasEntre(datas[i - 1], datas[i]);
    if (diff > maiorIntervalo) maiorIntervalo = diff;
  }

  const ult = datas[datas.length - 1];
  const diasUlt = diasEntre(ult, new Date());
  const intervaloOk = maiorIntervalo >= 30;

  if (intervaloOk) {
    return {
      ok: true,
      tempo: `⏱ ${datas.length} visitas nos últimos 12 meses (intervalo de ${maiorIntervalo} dias) · Última há ${diasUlt} dias`,
      tempoOk: true
    };
  }

  const faltam = 30 - maiorIntervalo;
  return {
    ok: false,
    tempo: `⏱ ${datas.length} visitas nos últimos 12 meses (intervalo de apenas ${maiorIntervalo} dias — menor que 30) · Última há ${diasUlt} dias`,
    tempoOk: false,
    pend: `Visitas com intervalo insuficiente (${maiorIntervalo} dias entre elas). Realizar nova visita com intervalo mínimo de 30 dias da anterior.`
  };
}

export function linkWhatsApp(tel: string | undefined, nome?: string): string | null {
  if (!tel) return null;
  let d = tel.replace(/\D/g, '').replace(/^0+/, '');
  if (d.length < 10 || d.slice(-8) === '00000000') return null;
  if (d.length <= 11) d = '55' + d;
  const saudacao = nome ? `Olá, ${nome}! ` : 'Olá! ';
  const msg = encodeURIComponent(`${saudacao}Aqui é da equipe de Saúde da Família / ACS. Gostaria de conversar com você.`);
  return `https://wa.me/${d}?text=${msg}`;
}

export function gerarAlertas(cidadaos: Record<string, Cidadao>, limite: number): AlertaAcao[] {
  const hoje = iniDia(new Date());
  const out: AlertaAcao[] = [];

  Object.entries(cidadaos).forEach(([chave, c]) => {
    const ind = c.indicadores || {};
    const nasc = c.dt_nascimento ? parseDataJS(c.dt_nascimento) : null;
    const temNasc = !!nasc && !isNaN(nasc.getTime());

    const add = (data: Date, tipo: AlertaAcao['tipo'], indic: string, texto: string) => {
      const dias = diasEntre(hoje, iniDia(data));
      if (dias < 0 || dias > limite) return;
      out.push({ chave, cidadao: c, dias, data: iniDia(data), tipo, ind: indic, texto });
    };

    const pend = (pref: string, txt: string) => (c.pendencias || []).some(p => p.startsWith(pref + ':') && p.includes(txt));

    // Retornos agendados pelo ACS (atrasados até 60 dias continuam aparecendo)
    (c.retornos || []).forEach((r, ri) => {
      if (r.feito || !r.d) return;
      const dt = new Date(r.d + 'T12:00:00');
      const dias = diasEntre(hoje, iniDia(dt));
      if (dias > limite || dias < -60) return;
      out.push({
        chave,
        cidadao: c,
        dias: Math.max(0, dias),
        data: iniDia(dt),
        tipo: 'retorno',
        ind: 'Retorno',
        retornoIndex: ri,
        atrasado: dias < 0,
        texto: (dias < 0 ? `Retorno atrasado (era dia ${dataBR(r.d)}).` : `Retorno agendado para ${dataBR(r.d)}.`) + (r.nota ? ' ' + r.nota : '')
      });
    });

    // C1: cadastro vale 1 ano
    [
      ['dt_cadastral', 'individual'],
      ['dt_cad_dom', 'domiciliar']
    ].forEach(([campo, nomeC]) => {
      const valor = c[campo as 'dt_cadastral' | 'dt_cad_dom'];
      const d = valor ? parseDataJS(valor) : null;
      if (d && !isNaN(d.getTime())) {
        add(somarMeses(d, 12), 'prazo', 'C1', `Cadastro ${nomeC} (de ${valor}) completa 1 ano: atualizar para não vencer.`);
      }
    });

    // C2: crianças
    if (ind.C2 && temNasc && nasc) {
      const lim1 = somarDias(nasc, 30);
      const ini2 = somarDias(nasc, 31);
      const lim2 = somarMeses(nasc, 6);
      const fim24 = somarMeses(nasc, 24);

      if (c.c2_ok1 === false && hoje <= lim1) {
        add(lim1, 'prazo', 'C2', `1ª visita (motivo "Recém-nascido") até ${fmtData(lim1)}, quando completa 30 dias de vida.`);
      }
      if (c.c2_ok2 === false) {
        if (hoje <= lim2) {
          add(lim2, 'prazo', 'C2', `2ª visita (motivo "Criança") até ${fmtData(lim2)}, quando completa 6 meses de vida.`);
        }
        if (hoje < ini2) {
          add(ini2, 'janela', 'C2', `2ª visita já pode ser feita a partir de ${fmtData(ini2)} (31º dia de vida).`);
        }
      }
      if (c.c2Ok !== true && hoje <= fim24) {
        add(fim24, 'faixa', 'C2', `Completa 24 meses em ${fmtData(fim24)}: encerra o prazo das visitas do C2.`);
      }
    }

    // C3: gestantes
    if (ind.C3 && c.c3_dpp) {
      const dpp = extrairDatas(c.c3_dpp)[0];
      if (dpp) {
        const visPn = (c.c3_pn_ef !== undefined ? c.c3_pn_ef : c.c3_vis_pn) || 0;
        const visPu = (c.c3_pu_ef !== undefined ? c.c3_pu_ef : c.c3_vis_puerp) || 0;
        if (visPn < 3) {
          add(dpp, 'prazo', 'C3', `DPP em ${fmtData(dpp)}: faltam ${3 - visPn} visita(s) de pré-natal (motivo "Gestante").`);
        }
        if (visPu < 1) {
          add(somarDias(dpp, 7), 'prazo', 'C3', `Puérpera: visita domiciliar até o 7º dia pós-parto (DPP ${fmtData(dpp)}).`);
          add(somarDias(dpp, 42), 'prazo', 'C3', `Puérpera: consulta de puerpério na UBS até 42 dias após o parto (DPP ${fmtData(dpp)}).`);
        }
      }
    }

    // C4, C5, C6: prazo de 12 meses
    [['C4', 'Diabetes'], ['C5', 'Hipertensão'], ['C6', 'Idoso']].forEach(([k, nomeInd]) => {
      if (!ind[k as IndicadorId]) return;
      const unicas = datasUnicas12m(c[(k.toLowerCase() + '_vis_txt') as keyof Cidadao] as string);
      if (!unicas.length) return;
      const ult = unicas[unicas.length - 1];
      const pen = unicas.length >= 2 ? unicas[0] : null;
      if (pen && diasEntre(pen, ult) >= 30) {
        add(somarMeses(pen, 12), 'prazo', k, `${nomeInd}: a visita de ${fmtData(pen)} sai da janela de 12 meses; realizar nova visita.`);
      } else {
        add(somarMeses(ult, 12), 'prazo', k, `${nomeInd}: a visita de ${fmtData(ult)} perderá a validade de 12 meses.`);
        add(somarDias(ult, 30), 'janela', k, `${nomeInd}: 2ª visita passa a valer a partir de ${fmtData(somarDias(ult, 30))} (30 dias de intervalo).`);
      }
    });

    // Mudanças de faixa etária
    if (temNasc && nasc) {
      const aniv = (anos: number) => somarMeses(nasc, anos * 12);
      add(aniv(60), 'faixa', 'C6', `Completa 60 anos em ${fmtData(aniv(60))}: acompanhamento como pessoa idosa (C6).`);
      if (pend('C7', 'HPV')) add(aniv(15), 'faixa', 'C7', `Completa 15 anos em ${fmtData(aniv(15))}: encerra faixa da vacina HPV (9 a 14 anos).`);
      if (pend('C7', 'Preventivo')) add(aniv(65), 'faixa', 'C7', `Completa 65 anos em ${fmtData(aniv(65))}: sai da faixa do preventivo (25 a 64 anos).`);
      if (pend('C7', 'Mamografia')) add(aniv(70), 'faixa', 'C7', `Completa 70 anos em ${fmtData(aniv(70))}: sai da faixa da mamografia (50 a 69 anos).`);
      if (ind.C7) {
        add(aniv(25), 'faixa', 'C7', `Completa 25 anos em ${fmtData(aniv(25))}: entra na faixa do preventivo (25 a 64 anos).`);
        add(aniv(50), 'faixa', 'C7', `Completa 50 anos em ${fmtData(aniv(50))}: entra na faixa da mamografia (50 a 69 anos).`);
      }
    }
  });

  return out;
}

export function gerarAniversarios(cidadaos: Record<string, Cidadao>, limite: number): AniversarianteItem[] {
  const hoje = iniDia(new Date());
  const out: AniversarianteItem[] = [];

  Object.entries(cidadaos).forEach(([chave, c]) => {
    const nasc = c.dt_nascimento ? parseDataJS(c.dt_nascimento) : null;
    if (!nasc || isNaN(nasc.getTime())) return;
    let prox = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
    if (prox < hoje) {
      prox = new Date(hoje.getFullYear() + 1, nasc.getMonth(), nasc.getDate());
    }
    const dias = diasEntre(hoje, prox);
    if (dias > limite) return;
    const anos = prox.getFullYear() - nasc.getFullYear();
    const dd = String(prox.getDate()).padStart(2, '0') + '/' + String(prox.getMonth() + 1).padStart(2, '0');
    out.push({ chave, cidadao: c, dias, data: prox, anos, dd });
  });

  out.sort((a, b) => a.dias - b.dias || (a.cidadao.nome || '').localeCompare(b.cidadao.nome || '', 'pt-BR', { sensitivity: 'base' }));
  return out;
}

export function calcularStatusIndicadores(cidadaos: Record<string, Cidadao>): Record<IndicadorId, IndicadorStatus> {
  const lista = Object.values(cidadaos);
  const status: Record<IndicadorId, IndicadorStatus> = {
    C1: {
      id: 'C1',
      nome: 'Cadastros',
      titulo: 'C1 · Cadastros',
      icone: '📋',
      cor: '#0284c7',
      metaDesc: 'Cadastro individual atualizado (até 1 ano)',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    },
    C2: {
      id: 'C2',
      nome: 'Crianças',
      titulo: 'C2 · Crianças (0 a 4 anos)',
      icone: '👶',
      cor: '#8b5cf6',
      metaDesc: '2 Visitas (até 30d e 31d-6m) + Vacinas (Penta e Pólio)',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    },
    C3: {
      id: 'C3',
      nome: 'Pré-Natal',
      titulo: 'C3 · Gestantes e Puérperas',
      icone: '🤰',
      cor: '#ec4899',
      metaDesc: 'Captação precoce (<12s) + 3 Visitas PN + Visita Puerpério até 7º dia + Consulta UBS até 42d',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    },
    C4: {
      id: 'C4',
      nome: 'Diabetes',
      titulo: 'C4 · Diabéticos',
      icone: '🩸',
      cor: '#f59e0b',
      metaDesc: '2 Visitas (30+ dias intervalo) + HbA1c + Avaliação dos pés',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    },
    C5: {
      id: 'C5',
      nome: 'Hipertensão',
      titulo: 'C5 · Hipertensos',
      icone: '❤️',
      cor: '#ef4444',
      metaDesc: '2 Visitas (30+ dias intervalo) + Aferição PA semestral + Consulta',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    },
    C6: {
      id: 'C6',
      nome: 'Pessoas Idosas',
      titulo: 'C6 · Idosos (60+ anos)',
      icone: '👴',
      cor: '#10b981',
      metaDesc: '2 Visitas (30+ dias intervalo) + Vacina Influenza + Consulta anual',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    },
    C7: {
      id: 'C7',
      nome: 'Saúde da Mulher',
      titulo: 'C7 · Mulheres',
      icone: '👩',
      cor: '#db2777',
      metaDesc: 'Preventivo (25-64a) · HPV (9-14a) · Consulta (14-69a) · Mamografia (50-69a)',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    },
    BF: {
      id: 'BF',
      nome: 'Bolsa Família',
      titulo: 'BF · Bolsa Família',
      icone: '💰',
      cor: '#ca8a04',
      metaDesc: 'Famílias beneficiárias em acompanhamento social',
      total: 0,
      ok: 0,
      pendentes: 0,
      porcentagem: 0
    }
  };

  lista.forEach(c => {
    // C1: todos os cidadãos cadastrados
    status.C1.total++;
    if (c.c1Ok) status.C1.ok++;

    // C2
    if (c.indicadores.C2) {
      status.C2.total++;
      if (c.c2Ok) status.C2.ok++;
    }

    // C3
    if (c.indicadores.C3) {
      status.C3.total++;
      if (c.c3Ok) status.C3.ok++;
    }

    // C4
    if (c.indicadores.C4) {
      status.C4.total++;
      if (c.c4Ok) status.C4.ok++;
    }

    // C5
    if (c.indicadores.C5) {
      status.C5.total++;
      if (c.c5Ok) status.C5.ok++;
    }

    // C6
    if (c.indicadores.C6) {
      status.C6.total++;
      if (c.c6Ok) status.C6.ok++;
    }

    // C7
    if (c.indicadores.C7) {
      status.C7.total++;
      if (c.c7Ok) status.C7.ok++;
    }

    // Bolsa Família
    if (c.bolsaFamilia) {
      status.BF.total++;
      // se não tem pendências em outros indicadores, considera em dia
      const semPend = (c.pendencias || []).length === 0;
      if (semPend) status.BF.ok++;
    }
  });

  (Object.keys(status) as IndicadorId[]).forEach(k => {
    const s = status[k];
    s.pendentes = s.total - s.ok;
    s.porcentagem = s.total > 0 ? Math.round((s.ok / s.total) * 100) : 0;
  });

  return status;
}

export function montarTextoResumo(
  cidadaos: Record<string, Cidadao>,
  perfil: PerfilACS,
  historico: HistoricoItem[],
  incluirNomes: boolean
): string {
  const hoje = iniDia(new Date());
  const ini = somarDias(hoje, -7);
  const status = calcularStatusIndicadores(cidadaos);

  let ref: HistoricoItem | null = null;
  const lim = isoLocal(ini);
  historico.forEach(x => {
    if (x.d <= lim) ref = x;
  });
  if (!ref && historico.length > 1) ref = historico[0];
  const refHoje = isoLocal(hoje);
  if (ref && ref.d === refHoje) ref = null;

  const L: string[] = [];
  L.push(`*Resumo Semanal de Indicadores e Visitas · ${perfil.micro ? 'Microárea ' + perfil.micro : 'Microárea'}*`);
  if (perfil.nome) L.push(`ACS: ${perfil.nome}`);
  if (perfil.ubs) L.push(`UBS: ${perfil.ubs}`);
  L.push(`Período: ${fmtData(ini)} a ${fmtData(hoje)}`, '');

  L.push('*Progresso das Metas de Saúde*');
  const indLista: IndicadorId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'BF'];
  indLista.forEach(k => {
    const s = status[k];
    if (!s || s.total === 0) return;
    let varStr = '';
    if (ref && ref.st && ref.st[k] && ref.st[k].tot > 0) {
      const pcRef = Math.round((ref.st[k].ok / ref.st[k].tot) * 100);
      const delta = s.porcentagem - pcRef;
      varStr = delta === 0 ? ' (igual)' : delta > 0 ? ` (▲ +${delta}%)` : ` (▼ ${delta}%)`;
    }
    const pendStr = s.pendentes > 0 ? ` · ${s.pendentes} pendente(s)` : ' ✓ Meta atingida';
    L.push(`• ${s.titulo}: ${s.porcentagem}% (${s.ok}/${s.total})${varStr}${pendStr}`);
  });

  if (ref) {
    const dRef = parseDataJS(ref.d);
    if (dRef) L.push(`(Comparativo com a importação de ${fmtData(dRef)})`);
  }

  // Visitas registradas no aplicativo
  let nVis = 0;
  let pessoasVis = 0;
  Object.values(cidadaos).forEach(c => {
    const n = (c.visitasApp || []).filter(v => {
      const d = parseDataJS(v.d);
      return d && d >= ini && d <= hoje;
    }).length;
    if (n) {
      nVis += n;
      pessoasVis++;
    }
  });

  L.push('');
  L.push('*Visitas Registradas no App esta semana*');
  L.push(nVis ? `• ${nVis} visita(s) em ${pessoasVis} cidadão(s)` : '• Nenhuma visita manual registrada nesta semana.');

  // Retornos
  let atrasados = 0;
  let proximos = 0;
  let concluidos = 0;
  const listaAtrasados: string[] = [];

  Object.values(cidadaos).forEach(c => {
    (c.retornos || []).forEach(r => {
      if (r.feito) {
        if (r.d >= isoLocal(ini)) concluidos++;
        return;
      }
      const dt = new Date(r.d + 'T12:00:00');
      const dias = diasEntre(hoje, iniDia(dt));
      if (dias < 0) {
        atrasados++;
        listaAtrasados.push(c.nome);
      } else if (dias <= 7) {
        proximos++;
      }
    });
  });

  L.push('');
  L.push('*Retornos e Acompanhamentos*');
  L.push(`• Atrasados: ${atrasados} | Próximos 7 dias: ${proximos} | Realizados na semana: ${concluidos}`);
  if (incluirNomes && listaAtrasados.length > 0) {
    L.push(`• Retornos em atraso: ${listaAtrasados.join(', ')}`);
  }

  const alertas = gerarAlertas(cidadaos, 7);
  const unicosAlerta = new Set(alertas.filter(a => a.tipo !== 'retorno').map(a => a.chave));
  L.push('');
  L.push(`*Ações dos Próximos 7 Dias*`);
  L.push(`• ${unicosAlerta.size} cidadão(s) com prazos de visitas ou transição de faixa etária.`);

  if (incluirNomes) {
    L.push('');
    L.push('*Cidadãos com Pendências por Indicador*');
    indLista.forEach(k => {
      const pendentes = Object.values(cidadaos)
        .filter(c => c.indicadores[k] && (k === 'C1' ? !c.c1Ok : k === 'C2' ? !c.c2Ok : k === 'C3' ? !c.c3Ok : k === 'C4' ? !c.c4Ok : k === 'C5' ? !c.c5Ok : k === 'C6' ? !c.c6Ok : k === 'C7' ? !c.c7Ok : false))
        .map(c => c.nome);
      if (pendentes.length > 0) {
        L.push(`${k} (${pendentes.length}): ${pendentes.slice(0, 10).join(', ')}${pendentes.length > 10 ? ' e mais ' + (pendentes.length - 10) : ''}`);
      }
    });
  }

  return L.join('\n');
}
