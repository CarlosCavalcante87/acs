/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useTransition } from 'react';
import {
  BaseDados,
  Cidadao,
  IndicadorId,
  PerfilACS,
  HistoricoItem
} from './types';
import { BASE_DEMO } from './utils/demoData';
import {
  idb,
  solicitarPersistencia,
  hashSenhaApp,
  verificarSenhaApp,
  PIN_STORAGE_KEY
} from './utils/storage';
import {
  calcularStatusIndicadores,
  gerarAlertas,
  isoLocal,
  iniDia,
  avaliarVisitasC2,
  avaliarVisitas30
} from './utils/rules';
import { processarArquivosImportados } from './utils/importer';

import { Header } from './components/Header';
import { TabNav, TabId } from './components/TabNav';
import { IndicatorsView } from './components/IndicatorsView';
import { CitizensView } from './components/CitizensView';
import { DailyActionsView } from './components/DailyActionsView';
import { EvolutionView } from './components/EvolutionView';
import { SettingsView } from './components/SettingsView';
import {
  VisitModal,
  ReturnModal,
  NotesModal,
  ProfileModal,
  PasswordModal,
  LockScreen
} from './components/Modals';
import { PWAInstallPrompt, OfflineStatusIndicator } from './components/PWAInstall';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [base, setBase] = useState<BaseDados>(BASE_DEMO);
  const [carregado, setCarregado] = useState(false);
  const [statusPlanilhas, setStatusPlanilhas] = useState<Record<string, boolean>>({});

  const [abaAtiva, setAbaAtiva] = useState<TabId>('indicadores');
  const [filtroIndicadorInicial, setFiltroIndicadorInicial] = useState<IndicadorId | 'TODOS'>('TODOS');

  // Acessibilidade
  const [tema, setTema] = useState<'claro' | 'escuro' | 'alto-contraste'>(() => {
    try {
      const salvo = localStorage.getItem('guia_tema');
      if (salvo === 'escuro' || salvo === 'alto-contraste') return salvo;
      if (salvo === 'claro') return 'claro';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'escuro'
        : 'claro';
    } catch {
      return 'claro';
    }
  });

  const [fonteEscala, setFonteEscala] = useState<'0' | '1' | '2'>(() => {
    try {
      const f = localStorage.getItem('guia_fonte');
      if (f === '1' || f === '2') return f;
      return '0';
    } catch {
      return '0';
    }
  });

  const [vozAtiva, setVozAtiva] = useState(false);

  // Segurança / Bloqueio
  const [temSenha, setTemSenha] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(PIN_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [travado, setTravado] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(PIN_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  // Modais
  const [cidadaoVisitaModal, setCidadaoVisitaModal] = useState<Cidadao | null>(null);
  const [cidadaoRetornoModal, setCidadaoRetornoModal] = useState<Cidadao | null>(null);
  const [cidadaoNotasModal, setCidadaoNotasModal] = useState<Cidadao | null>(null);
  const [perfilModalAberto, setPerfilModalAberto] = useState(false);
  const [senhaModal, setSenhaModal] = useState<{
    aberto: boolean;
    modo: 'definir' | 'alterar' | 'remover';
  }>({ aberto: false, modo: 'definir' });

  // Notificações Toast
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'info' | 'erro' } | null>(null);

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'info' | 'erro' = 'sucesso') => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Leitura em voz alta acessível (Web Speech API)
  const falarTexto = (texto: string) => {
    if (!('speechSynthesis' in window)) {
      mostrarToast('Síntese de voz não suportada pelo navegador.', 'info');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Carregamento inicial do IndexedDB
  useEffect(() => {
    solicitarPersistencia();

    async function carregarDados() {
      try {
        const salvo = await idb.get<BaseDados>('base_completa');
        if (salvo && salvo.cidadaos && Object.keys(salvo.cidadaos).length > 0) {
          setBase(salvo);
        } else {
          // Migração de dados do localStorage antigo se houver
          const antigo = localStorage.getItem('gestao_acs_dados');
          if (antigo) {
            try {
              const parseado = JSON.parse(antigo);
              if (parseado && parseado.cidadaos) {
                const baseMigrada: BaseDados = {
                  cidadaos: parseado.cidadaos,
                  ruas: Array.from(new Set(parseado.ruas || [])),
                  perfil: parseado.perfil || BASE_DEMO.perfil,
                  historico: parseado.historico || BASE_DEMO.historico
                };
                setBase(baseMigrada);
                await idb.set('base_completa', baseMigrada);
              }
            } catch (err) {
              console.error('Erro na migração:', err);
            }
          } else {
            // Inicializa com os dados demo para visualização imediata
            setBase(BASE_DEMO);
            await idb.set('base_completa', BASE_DEMO);
          }
        }
      } catch (err) {
        console.error('Erro ao abrir IndexedDB:', err);
      } finally {
        setCarregado(true);
      }
    }

    carregarDados();
  }, []);

  // Salvar alterações no IndexedDB
  useEffect(() => {
    if (!carregado) return;
    idb.set('base_completa', base).catch(err => {
      console.error('Falha ao salvar dados:', err);
    });
  }, [base, carregado]);

  // Aplicar tema e classes visuais na tag <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');

    if (tema === 'escuro') {
      root.classList.add('dark');
    } else if (tema === 'alto-contraste') {
      root.classList.add('high-contrast');
    }

    try {
      localStorage.setItem('guia_tema', tema);
    } catch {}
  }, [tema]);

  // Aplicar escala de fonte na tag <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-lg', 'font-scale-xl');

    if (fonteEscala === '1') {
      root.classList.add('font-scale-lg');
    } else if (fonteEscala === '2') {
      root.classList.add('font-scale-xl');
    }

    try {
      localStorage.setItem('guia_fonte', fonteEscala);
    } catch {}
  }, [fonteEscala]);

  // Status dos Indicadores
  const statusIndicadores = React.useMemo(() => {
    return calcularStatusIndicadores(base.cidadaos);
  }, [base.cidadaos]);

  // Total de Alertas dos próximos 7 dias
  const totalAlertas = React.useMemo(() => {
    return gerarAlertas(base.cidadaos, 7).length;
  }, [base.cidadaos]);

  // Navegar de um card de indicador para a lista de cidadãos filtrada
  const handleSelecionarIndicadorCard = (id: IndicadorId) => {
    setFiltroIndicadorInicial(id);
    setAbaAtiva('cidadaos');
  };

  // Salvar registro de Visita Domiciliar Manual
  const handleSalvarVisita = (chave: string, dataIso: string, motivos: string[]) => {
    const cidadao = base.cidadaos[chave];
    if (!cidadao) return;

    const novaVisita = {
      id: `vis_${Date.now()}`,
      d: dataIso,
      inds: motivos,
      timestamp: Date.now()
    };

    const visitasAppAtual = [...(cidadao.visitasApp || []), novaVisita];

    // Atualiza cópia do cidadão
    const cidAtualizado: Cidadao = {
      ...cidadao,
      visitasApp: visitasAppAtual
    };

    // Recalcula regras de visitas se aplicável
    if (motivos.includes('C2') && cidAtualizado.indicadores.C2) {
      const nasc = cidAtualizado.dt_nascimento ? new Date(cidAtualizado.dt_nascimento) : null;
      const v1 = cidAtualizado.c2_v1 ? new Date(cidAtualizado.c2_v1) : null;
      const v2 = new Date(dataIso);
      const av2 = avaliarVisitasC2(nasc, v1, v2, (cidAtualizado.c2_visitas || 0) + 1);
      cidAtualizado.c2_visitas = (cidAtualizado.c2_visitas || 0) + 1;
      cidAtualizado.c2_v2 = dataIso;
      cidAtualizado.c2Ok = av2.ok && (cidAtualizado.c2_vacinasOk ?? true);
      cidAtualizado.c2_tempo = { texto: av2.tempo, ok: av2.tempoOk };
    }

    if (motivos.includes('C4') && cidAtualizado.indicadores.C4) {
      const txt = `${cidAtualizado.c4_vis_txt || ''} ${dataIso}`;
      const av = avaliarVisitas30(txt, (cidAtualizado.c4_visitas || 0) + 1, 'Pessoa com diabetes');
      cidAtualizado.c4_visitas = (cidAtualizado.c4_visitas || 0) + 1;
      cidAtualizado.c4_vis_txt = txt;
      cidAtualizado.c4_tempo = { texto: av.tempo, ok: av.tempoOk };
      cidAtualizado.c4Ok = av.ok;
    }

    if (motivos.includes('C5') && cidAtualizado.indicadores.C5) {
      const txt = `${cidAtualizado.c5_vis_txt || ''} ${dataIso}`;
      const av = avaliarVisitas30(txt, (cidAtualizado.c5_visitas || 0) + 1, 'Pessoa com hipertensão');
      cidAtualizado.c5_visitas = (cidAtualizado.c5_visitas || 0) + 1;
      cidAtualizado.c5_vis_txt = txt;
      cidAtualizado.c5_tempo = { texto: av.tempo, ok: av.tempoOk };
      cidAtualizado.c5Ok = av.ok;
    }

    if (motivos.includes('C6') && cidAtualizado.indicadores.C6) {
      const txt = `${cidAtualizado.c6_vis_txt || ''} ${dataIso}`;
      const av = avaliarVisitas30(txt, (cidAtualizado.c6_visitas || 0) + 1, 'Pessoa idosa');
      cidAtualizado.c6_visitas = (cidAtualizado.c6_visitas || 0) + 1;
      cidAtualizado.c6_vis_txt = txt;
      cidAtualizado.c6_tempo = { texto: av.tempo, ok: av.tempoOk };
      cidAtualizado.c6Ok = av.ok;
    }

    if (motivos.includes('C3PN') && cidAtualizado.indicadores.C3) {
      cidAtualizado.c3_vis_pn = (cidAtualizado.c3_vis_pn || 0) + 1;
      cidAtualizado.c3_pn_ef = (cidAtualizado.c3_pn_ef || 0) + 1;
      if (cidAtualizado.c3_vis_pn >= 3 && (cidAtualizado.c3_vis_puerp || 0) >= 1) {
        cidAtualizado.c3Ok = true;
      }
    }

    if (motivos.includes('C3PU') && cidAtualizado.indicadores.C3) {
      cidAtualizado.c3_vis_puerp = (cidAtualizado.c3_vis_puerp || 0) + 1;
      cidAtualizado.c3_pu_ef = (cidAtualizado.c3_pu_ef || 0) + 1;
      if ((cidAtualizado.c3_vis_pn || 0) >= 3 && cidAtualizado.c3_vis_puerp >= 1) {
        cidAtualizado.c3Ok = true;
      }
    }

    const novosCidadaos = {
      ...base.cidadaos,
      [chave]: cidAtualizado
    };

    setBase(prev => ({
      ...prev,
      cidadaos: novosCidadaos
    }));

    setCidadaoVisitaModal(null);
    mostrarToast('✅ Visita domiciliar registrada com sucesso!');
  };

  // Salvar agendamento de retorno
  const handleSalvarRetorno = (chave: string, dataIso: string, nota: string) => {
    const cidadao = base.cidadaos[chave];
    if (!cidadao) return;

    const novoRetorno = {
      id: `ret_${Date.now()}`,
      d: dataIso,
      nota,
      feito: false
    };

    const retornosAtualizados = [...(cidadao.retornos || []), novoRetorno];

    setBase(prev => ({
      ...prev,
      cidadaos: {
        ...prev.cidadaos,
        [chave]: {
          ...cidadao,
          retornos: retornosAtualizados
        }
      }
    }));

    setCidadaoRetornoModal(null);
    mostrarToast('✅ Retorno agendado com sucesso!');
  };

  // Marcar retorno como feito
  const handleMarcarRetornoFeito = (chave: string, retornoIndex: number) => {
    const cidadao = base.cidadaos[chave];
    if (!cidadao || !cidadao.retornos || !cidadao.retornos[retornoIndex]) return;

    const retornosCopy = [...cidadao.retornos];
    retornosCopy[retornoIndex] = {
      ...retornosCopy[retornoIndex],
      feito: true
    };

    setBase(prev => ({
      ...prev,
      cidadaos: {
        ...prev.cidadaos,
        [chave]: {
          ...cidadao,
          retornos: retornosCopy
        }
      }
    }));

    mostrarToast('✅ Retorno marcado como concluído.');
  };

  // Salvar Anotação do ACS
  const handleSalvarAnotacao = (chave: string, anotacao: string) => {
    const cidadao = base.cidadaos[chave];
    if (!cidadao) return;

    setBase(prev => ({
      ...prev,
      cidadaos: {
        ...prev.cidadaos,
        [chave]: {
          ...cidadao,
          anotacao
        }
      }
    }));

    setCidadaoNotasModal(null);
    mostrarToast('✅ Anotação salva.');
  };

  // Salvar Perfil do ACS
  const handleSalvarPerfil = (novoPerfil: PerfilACS) => {
    setBase(prev => ({
      ...prev,
      perfil: novoPerfil
    }));
    setPerfilModalAberto(false);
    mostrarToast('✅ Dados do ACS atualizados.');
  };

  // Processar importação de arquivos CSV / XLSX
  const handleImportarArquivos = async (arquivos: File[]) => {
    try {
      const resultado = await processarArquivosImportados(
        arquivos,
        base.cidadaos,
        new Set(base.ruas),
        base.perfil
      );

      // Atualiza o histórico para a data de hoje
      const hojeStr = isoLocal(new Date());
      const stNovo: Record<string, { tot: number; ok: number }> = {};
      const statusCalc = calcularStatusIndicadores(resultado.cidadaos);
      (Object.keys(statusCalc) as IndicadorId[]).forEach(k => {
        stNovo[k] = { tot: statusCalc[k].total, ok: statusCalc[k].ok };
      });

      const historicoAtualizado = [
        ...(base.historico || []).filter(h => h.d !== hojeStr),
        { d: hojeStr, st: stNovo }
      ].sort((a, b) => a.d.localeCompare(b.d));

      setBase({
        cidadaos: resultado.cidadaos,
        ruas: Array.from(resultado.ruas).sort(),
        perfil: resultado.perfil,
        historico: historicoAtualizado,
        dataImportacao: resultado.dataImportacao,
        dataImportacaoFormatada: resultado.dataImportacaoFormatada
      });

      setStatusPlanilhas(prev => ({ ...prev, ...resultado.statusPlanilhas }));
      const msgData = resultado.dataImportacaoFormatada ? ` · Data: ${resultado.dataImportacaoFormatada}` : '';
      mostrarToast(`✅ ${resultado.totalProcessados} registros processados em ${arquivos.length} planilha(s)${msgData}!`);
    } catch (err: any) {
      console.error(err);
      mostrarToast(`Erro ao ler arquivos: ${err.message || 'Formato inválido'}`, 'erro');
    }
  };

  // Exportar backup JSON
  const handleExportarBackup = () => {
    const payload = JSON.stringify(base, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gestao_acs_${isoLocal(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('📥 Backup baixado com sucesso!');
  };

  // Restaurar backup JSON
  const handleRestaurarBackup = async (arquivo: File) => {
    try {
      const texto = await arquivo.text();
      const parseado = JSON.parse(texto);
      if (!parseado.cidadaos) {
        throw new Error('Arquivo de backup inválido.');
      }
      setBase({
        cidadaos: parseado.cidadaos || {},
        ruas: parseado.ruas || [],
        perfil: parseado.perfil || base.perfil,
        historico: parseado.historico || []
      });
      mostrarToast('📤 Backup restaurado com sucesso!');
    } catch (err: any) {
      mostrarToast(`Falha na restauração: ${err.message}`, 'erro');
    }
  };

  // Carregar Demonstração
  const handleCarregarDemo = () => {
    setBase(BASE_DEMO);
    mostrarToast('✨ Dados de demonstração carregados com sucesso!');
  };

  // Limpar Base
  const handleLimparBase = async () => {
    if (!window.confirm('Tem certeza de que deseja apagar todos os dados salvos neste aparelho? Esta ação não pode ser desfeita.')) {
      return;
    }
    const vazia: BaseDados = {
      cidadaos: {},
      ruas: [],
      perfil: { nome: '', micro: '', ubs: '' },
      historico: []
    };
    setBase(vazia);
    await idb.delete('base_completa');
    mostrarToast('🗑️ Todos os dados foram limpos.');
  };

  // Gerenciamento de Senha / PIN
  const handleConfirmarSenha = async (atual: string, nova: string): Promise<boolean> => {
    const modo = senhaModal.modo;
    if (modo === 'definir') {
      const hash = await hashSenhaApp(nova);
      localStorage.setItem(PIN_STORAGE_KEY, hash);
      setTemSenha(true);
      setSenhaModal({ aberto: false, modo: 'definir' });
      mostrarToast('🔒 Senha do app definida com sucesso!');
      return true;
    } else if (modo === 'alterar') {
      const confere = await verificarSenhaApp(atual);
      if (!confere) return false;
      const hash = await hashSenhaApp(nova);
      localStorage.setItem(PIN_STORAGE_KEY, hash);
      setSenhaModal({ aberto: false, modo: 'alterar' });
      mostrarToast('✅ Senha alterada com sucesso!');
      return true;
    } else {
      // remover
      const confere = await verificarSenhaApp(atual);
      if (!confere) return false;
      localStorage.removeItem(PIN_STORAGE_KEY);
      setTemSenha(false);
      setTravado(false);
      setSenhaModal({ aberto: false, modo: 'remover' });
      mostrarToast('🔓 Senha removida.');
      return true;
    }
  };

  const handleDestravarApp = async (senhaDigitada: string): Promise<boolean> => {
    const ok = await verificarSenhaApp(senhaDigitada);
    if (ok) {
      setTravado(false);
      mostrarToast('🔓 Aplicativo desbloqueado.');
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Tela de Bloqueio por Senha se travado */}
      {travado && temSenha && (
        <LockScreen
          onDestravar={handleDestravarApp}
          onEsqueciSenha={() => {
            if (window.confirm('Esqueceu a senha? Para redefinir o acesso, a base protegida terá que ser resetada ou você pode restaurar um backup anterior.')) {
              localStorage.removeItem(PIN_STORAGE_KEY);
              setTemSenha(false);
              setTravado(false);
            }
          }}
        />
      )}

      {/* Indicador de Status Offline */}
      <OfflineStatusIndicator />

      {/* Cabeçalho Acessível */}
      <Header
        perfil={base.perfil}
        tema={tema}
        fonteEscala={fonteEscala}
        vozAtiva={vozAtiva}
        travado={travado}
        temSenha={temSenha}
        onMudarTema={setTema}
        onMudarFonte={setFonteEscala}
        onAlternarVoz={() => {
          const prox = !vozAtiva;
          setVozAtiva(prox);
          falarTexto(prox ? 'Áudio assistivo ativado.' : 'Áudio desativado.');
        }}
        onAbrirPerfil={() => setPerfilModalAberto(true)}
        onBloquearApp={() => setTravado(true)}
      />

      {/* Navegação por Abas com Alta Acessibilidade */}
      <TabNav
        abaAtiva={abaAtiva}
        totalAlertas={totalAlertas}
        totalCidadaos={Object.keys(base.cidadaos).length}
        onSelecionarAba={setAbaAtiva}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5" id="conteudoPrincipal">
        {/* Banner de Instalação PWA se disponível */}
        <div className="mb-4">
          <PWAInstallPrompt />
        </div>
        {abaAtiva === 'indicadores' && (
          <IndicatorsView
            status={statusIndicadores}
            dataImportacao={base.dataImportacao || base.perfil.dataImportacao}
            dataImportacaoFormatada={base.dataImportacaoFormatada || base.perfil.dataImportacaoFormatada}
            vozAtiva={vozAtiva}
            onSelecionarIndicador={handleSelecionarIndicadorCard}
            onFalarTexto={falarTexto}
          />
        )}

        {abaAtiva === 'cidadaos' && (
          <CitizensView
            cidadaos={base.cidadaos}
            ruas={base.ruas}
            filtroIndicadorInicial={filtroIndicadorInicial}
            vozAtiva={vozAtiva}
            onFalarTexto={falarTexto}
            onAbrirVisita={chave => setCidadaoVisitaModal(base.cidadaos[chave] || null)}
            onAbrirRetorno={chave => setCidadaoRetornoModal(base.cidadaos[chave] || null)}
            onAbrirAnotacao={chave => setCidadaoNotasModal(base.cidadaos[chave] || null)}
          />
        )}

        {abaAtiva === 'alertas' && (
          <DailyActionsView
            cidadaos={base.cidadaos}
            vozAtiva={vozAtiva}
            onFalarTexto={falarTexto}
            onAbrirVisita={chave => setCidadaoVisitaModal(base.cidadaos[chave] || null)}
            onMarcarRetornoFeito={handleMarcarRetornoFeito}
          />
        )}

        {abaAtiva === 'evolucao' && (
          <EvolutionView
            base={base}
            vozAtiva={vozAtiva}
            onFalarTexto={falarTexto}
            onCopiarTexto={txt => {
              navigator.clipboard?.writeText(txt);
              mostrarToast('📋 Resumo copiado para a área de transferência!');
            }}
          />
        )}

        {abaAtiva === 'configuracoes' && (
          <SettingsView
            base={base}
            statusPlanilhas={statusPlanilhas}
            tema={tema}
            fonteEscala={fonteEscala}
            temSenha={temSenha}
            onImportarArquivos={handleImportarArquivos}
            onExportarBackup={handleExportarBackup}
            onRestaurarBackupArquivo={handleRestaurarBackup}
            onCarregarDemo={handleCarregarDemo}
            onLimparBase={handleLimparBase}
            onMudarTema={setTema}
            onMudarFonte={setFonteEscala}
            onAbrirModalSenha={modo => setSenhaModal({ aberto: true, modo })}
          />
        )}
      </main>

      {/* Modais Interativos */}
      <VisitModal
        cidadao={cidadaoVisitaModal}
        onFechar={() => setCidadaoVisitaModal(null)}
        onSalvar={handleSalvarVisita}
      />

      <ReturnModal
        cidadao={cidadaoRetornoModal}
        onFechar={() => setCidadaoRetornoModal(null)}
        onSalvar={handleSalvarRetorno}
      />

      <NotesModal
        cidadao={cidadaoNotasModal}
        onFechar={() => setCidadaoNotasModal(null)}
        onSalvar={handleSalvarAnotacao}
      />

      <ProfileModal
        aberto={perfilModalAberto}
        perfil={base.perfil}
        onFechar={() => setPerfilModalAberto(false)}
        onSalvar={handleSalvarPerfil}
      />

      <PasswordModal
        aberto={senhaModal.aberto}
        modo={senhaModal.modo}
        onFechar={() => setSenhaModal({ aberto: false, modo: 'definir' })}
        onConfirmar={handleConfirmarSenha}
      />

      {/* Notificação Toast Flutuante Acessível */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 py-3 px-5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4 ${
            toast.tipo === 'erro'
              ? 'bg-red-600 text-white border-red-700'
              : toast.tipo === 'info'
              ? 'bg-sky-600 text-white border-sky-700'
              : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 dark:border-slate-300'
          }`}
        >
          {toast.tipo === 'erro' ? (
            <AlertCircle size={18} aria-hidden="true" />
          ) : toast.tipo === 'info' ? (
            <Info size={18} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400 dark:text-emerald-600" aria-hidden="true" />
          )}
          <span>{toast.mensagem}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/70 hover:text-white dark:text-slate-500 dark:hover:text-slate-900"
            aria-label="Fechar notificação"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
