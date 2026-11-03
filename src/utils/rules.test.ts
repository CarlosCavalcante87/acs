import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDataJS,
  fmtData,
  diasEntre,
  somarDias,
  somarMeses,
  calcularIdade,
  idadeEmAnos,
  classificarIMC,
  avaliarVisitasC2,
  avaliarVisitas30,
  linkWhatsApp,
  calcularStatusIndicadores,
  extrairDescricaoImportacao
} from './rules';
import { Cidadao } from '../types';

test('parseDataJS parses Brazilian DD/MM/YYYY and ISO YYYY-MM-DD correctly', () => {
  const d1 = parseDataJS('15/08/2026');
  assert.ok(d1);
  assert.equal(d1?.getDate(), 15);
  assert.equal(d1?.getMonth(), 7); // August is month 7 (0-indexed)
  assert.equal(d1?.getFullYear(), 2026);

  const d2 = parseDataJS('2026-11-03');
  assert.ok(d2);
  assert.equal(d2?.getDate(), 3);
  assert.equal(d2?.getMonth(), 10); // November
  assert.equal(d2?.getFullYear(), 2026);

  assert.equal(parseDataJS('-'), null);
  assert.equal(parseDataJS(''), null);
});

test('classificarIMC correctly separates Adult (WHO) and Elderly (SISVAN / Lipschitz)', () => {
  // Adult (under 60)
  assert.equal(classificarIMC(23.5, 30).texto, 'Peso adequado');
  assert.equal(classificarIMC(17.5, 30).texto, 'Baixo peso');
  assert.equal(classificarIMC(28.0, 30).texto, 'Sobrepeso');
  assert.equal(classificarIMC(32.0, 30).texto, 'Obesidade grau I');

  // Elderly (60+): Lipschitz cutoff is 22 for underweight, 27 for adequate
  assert.equal(classificarIMC(21.5, 68).texto, 'Baixo peso');
  assert.equal(classificarIMC(24.0, 68).texto, 'Peso adequado');
  assert.equal(classificarIMC(28.5, 68).texto, 'Sobrepeso');
});

test('avaliarVisitasC2 verifies 1st visit within 30 days and 2nd visit between 31 days and 6 months', () => {
  const nasc = new Date(2026, 0, 1); // 01/01/2026
  const v1 = new Date(2026, 0, 15); // 14 days of life -> OK
  const v2 = new Date(2026, 2, 10); // ~68 days of life (between 31d and 6m) -> OK

  const resOk = avaliarVisitasC2(nasc, v1, v2, 2);
  assert.equal(resOk.ok1, true);
  assert.equal(resOk.ok2, true);
  assert.equal(resOk.ok, true);

  // Failure: 2nd visit done too early (e.g. at 20 days)
  const v2Precoce = new Date(2026, 0, 20);
  const resFail = avaliarVisitasC2(nasc, v1, v2Precoce, 2);
  assert.equal(resFail.ok2, false);
  assert.equal(resFail.ok, false);
});

test('avaliarVisitas30 ensures 2 visits in 12 months have at least 30 days interval', () => {
  // Two visits with 45 days interval -> OK
  const textOk = '10/01/2026 25/02/2026';
  const resOk = avaliarVisitas30(textOk, 2, 'Pessoa com diabetes');
  assert.equal(resOk.ok, true);

  // Two visits with only 10 days interval -> NOT OK
  const textFail = '10/01/2026 20/01/2026';
  const resFail = avaliarVisitas30(textFail, 2, 'Pessoa com diabetes');
  assert.equal(resFail.ok, false);
  assert.match(resFail.pend || '', /intervalo insuficiente/i);
});

test('linkWhatsApp creates a properly formatted link for Brazil', () => {
  const link = linkWhatsApp('(87) 99988-7766', 'Maria');
  assert.ok(link);
  assert.ok(link?.startsWith('https://wa.me/5587999887766'));
  assert.ok(link?.includes('Maria'));

  // Invalid or zeroed numbers
  assert.equal(linkWhatsApp('00000000000'), null);
  assert.equal(linkWhatsApp(''), null);
});

test('calcularStatusIndicadores computes totals, percentage and status accurately', () => {
  const mockCidadaos: Record<string, Cidadao> = {
    '1': {
      chave: '1',
      nome: 'José da Silva',
      cpf: '12345678901',
      rua: 'Rua Central',
      numero: '10',
      bolsaFamilia: false,
      indicadores: { C1: true, C4: true },
      pendencias: [],
      c1Ok: true,
      c4Ok: true
    },
    '2': {
      chave: '2',
      nome: 'Maria de Souza',
      cpf: '98765432100',
      rua: 'Rua Central',
      numero: '20',
      bolsaFamilia: true,
      indicadores: { C1: true, C4: true },
      pendencias: ['C4: Busca Ativa - Exame de Hemoglobina Glicada'],
      c1Ok: true,
      c4Ok: false
    }
  };

  const status = calcularStatusIndicadores(mockCidadaos);
  assert.equal(status.C1.total, 2);
  assert.equal(status.C1.ok, 2);
  assert.equal(status.C1.porcentagem, 100);

  assert.equal(status.C4.total, 2);
  assert.equal(status.C4.ok, 1);
  assert.equal(status.C4.pendentes, 1);
  assert.equal(status.C4.porcentagem, 50);

  assert.equal(status.BF.total, 1);
});

test('extrairDescricaoImportacao extracts timestamp from PEC filenames correctly', () => {
  // Case with date and time: busca-ativa-vacinacao_2026-11-03-09-33
  const res1 = extrairDescricaoImportacao('busca-ativa-vacinacao_2026-11-03-09-33_7cbe1258.csv');
  assert.ok(res1);
  assert.equal(res1?.trecho, '2026-11-03-09-33');
  assert.equal(res1?.formatada, '03/11/2026 às 09:33');

  // Case with date only: lista-geral_2026-11-03.xlsx
  const res2 = extrairDescricaoImportacao('lista-geral_2026-11-03.xlsx');
  assert.ok(res2);
  assert.equal(res2?.trecho, '2026-11-03');
  assert.equal(res2?.formatada, '03/11/2026');

  // Case without date
  assert.equal(extrairDescricaoImportacao('planilha_sem_data.csv'), null);
});
