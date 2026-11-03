import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { processarArquivosImportados } from './importer';
import { BASE_DEMO } from './demoData';

test('processarArquivosImportados correctly parses busca-ativa-vacinacao_2026-11-03-09-33', async () => {
  const filePath = 'public/assets/aistudio/busca-ativa-vacinacao_2026-11-03-09-33_7cbe1258.csv';
  if (!fs.existsSync(filePath)) {
    console.log('Skipping file test, file not found:', filePath);
    return;
  }

  const buffer = fs.readFileSync(filePath);
  // Create File-like object
  const file = new File([buffer], 'busca-ativa-vacinacao_2026-11-03-09-33_7cbe1258.csv', {
    type: 'text/csv'
  });

  const res = await processarArquivosImportados([file], {}, new Set(), { nome: '', micro: '', ubs: '' });

  // Verify extracted timestamp
  assert.equal(res.dataImportacao, '2026-11-03-09-33');
  assert.equal(res.dataImportacaoFormatada, '03/11/2026 às 09:33');

  // Verify extracted profile
  assert.equal(res.perfil.micro, '91');
  assert.equal(res.perfil.nome, 'Carlos Evaristo Cavalcante Filho');
  assert.equal(res.perfil.equipe, 'VILA SANTA');
  assert.ok(res.perfil.ubs?.includes('CENTRO'));

  // Verify citizens parsed
  const cidadaosList = Object.values(res.cidadaos);
  assert.equal(cidadaosList.length, 24);

  // Check AGATHA RIANA DE SOUSA BASILIO
  const agatha = cidadaosList.find(c => c.nome.includes('AGATHA RIANA'));
  assert.ok(agatha);
  assert.equal(agatha?.cpf, '628.439.503-50');
  assert.equal(agatha?.rua, 'RUA SÃO PEDRO');
  assert.equal(agatha?.numero, '2');
  assert.ok((agatha?.vacinasAtrasadas || []).length > 10);
  assert.ok(agatha?.pendencias.some(p => p.includes('Pólio')));
  assert.ok(agatha?.pendencias.some(p => p.includes('Penta')));

  // Verify sheet was recognized as vacinacao
  assert.equal(res.statusPlanilhas.vacinacao, true);
});
