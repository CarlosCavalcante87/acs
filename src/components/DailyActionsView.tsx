import React, { useState, useMemo } from 'react';
import { Cidadao, AlertaAcao, AniversarianteItem } from '../types';
import {
  Bell,
  Calendar,
  MapPin,
  Clock,
  Cake,
  CheckCircle,
  Volume2,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { gerarAlertas, gerarAniversarios, dataBR } from '../utils/rules';

interface DailyActionsViewProps {
  cidadaos: Record<string, Cidadao>;
  vozAtiva: boolean;
  onFalarTexto: (texto: string) => void;
  onAbrirVisita: (chave: string) => void;
  onMarcarRetornoFeito: (chave: string, retornoIndex: number) => void;
}

export const DailyActionsView: React.FC<DailyActionsViewProps> = ({
  cidadaos,
  vozAtiva,
  onFalarTexto,
  onAbrirVisita,
  onMarcarRetornoFeito
}) => {
  const [horizonte, setHorizonte] = useState<7 | 15>(7);
  const [modo, setModo] = useState<'urgencia' | 'rua' | 'aniversarios'>('urgencia');

  const alertas = useMemo(() => {
    return gerarAlertas(cidadaos, horizonte);
  }, [cidadaos, horizonte]);

  const aniversariantes = useMemo(() => {
    return gerarAniversarios(cidadaos, horizonte);
  }, [cidadaos, horizonte]);

  // Alertas agrupados por rua para montagem de roteiro geográfico
  const alertasPorRua = useMemo(() => {
    const mapa: Record<string, AlertaAcao[]> = {};
    alertas.forEach(a => {
      const rua = a.cidadao.rua || 'Outros Logradouros';
      if (!mapa[rua]) mapa[rua] = [];
      mapa[rua].push(a);
    });
    return mapa;
  }, [alertas]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho de Controle das Ações do Dia */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 card-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="text-amber-500" size={22} aria-hidden="true" />
              <span>Ações e Prazos do Dia</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Prazos de visitas a vencer, mudanças de faixas etárias e retornos agendados.
            </p>
          </div>

          {vozAtiva && (
            <button
              onClick={() => {
                const fala = `Você tem ${alertas.length} ações prioritárias nos próximos ${horizonte} dias e ${aniversariantes.length} aniversariantes.`;
                onFalarTexto(fala);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-semibold text-xs border border-sky-300 dark:border-sky-800"
              aria-label="Ouvir resumo das ações do dia"
            >
              <Volume2 size={16} aria-hidden="true" />
              <span>Ouvir Ações</span>
            </button>
          )}
        </div>

        {/* Seletores: Horizonte (7 vs 15 dias) & Modo de Visualização */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Horizonte */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setHorizonte(7)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                horizonte === 7
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Próximos 7 dias
            </button>
            <button
              onClick={() => setHorizonte(15)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] ${
                horizonte === 15
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Próximos 15 dias
            </button>
          </div>

          {/* Modos */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setModo('urgencia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px] ${
                modo === 'urgencia'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Clock size={14} aria-hidden="true" />
              <span>Por Urgência ({alertas.length})</span>
            </button>
            <button
              onClick={() => setModo('rua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px] ${
                modo === 'rua'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Navigation size={14} aria-hidden="true" />
              <span>Roteiro por Rua</span>
            </button>
            <button
              onClick={() => setModo('aniversarios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px] ${
                modo === 'aniversarios'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Cake size={14} aria-hidden="true" />
              <span>Aniversários ({aniversariantes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exibição: Modo Urgência */}
      {modo === 'urgencia' && (
        <div className="space-y-3">
          {alertas.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center card-surface">
              <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Tudo em dia para os próximos {horizonte} dias!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Nenhum prazo de visita expirando ou retorno pendente no período.
              </p>
            </div>
          ) : (
            alertas
              .sort((a, b) => a.dias - b.dias)
              .map((al, idx) => {
                const c = al.cidadao;
                const isRetorno = al.tipo === 'retorno';

                return (
                  <div
                    key={`${al.chave}_${idx}`}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm transition-all card-surface ${
                      al.atrasado
                        ? 'border-red-400 dark:border-red-800 bg-red-50/30'
                        : al.dias <= 2
                        ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              al.atrasado
                                ? 'bg-red-600 text-white'
                                : al.dias === 0
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {al.atrasado
                              ? '⚠️ Atrasado'
                              : al.dias === 0
                              ? '🚨 Vence Hoje'
                              : `Em ${al.dias} dia(s)`}
                          </span>

                          <span className="text-xs font-bold text-slate-500">
                            {al.ind}
                          </span>

                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                            {c.nome}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 font-medium leading-relaxed">
                          {al.texto}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <MapPin size={13} className="text-sky-600 shrink-0" aria-hidden="true" />
                          <span>
                            {c.rua}, Nº {c.numero}
                          </span>
                        </div>
                      </div>

                      {/* Botões rápidos de ação */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {isRetorno && al.retornoIndex !== undefined && (
                          <button
                            onClick={() => onMarcarRetornoFeito(al.chave, al.retornoIndex!)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold min-h-[38px] transition-colors flex items-center gap-1"
                            title="Marcar este retorno como concluído"
                          >
                            <CheckCircle size={14} aria-hidden="true" />
                            <span>Concluir</span>
                          </button>
                        )}

                        <button
                          onClick={() => onAbrirVisita(al.chave)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold min-h-[38px] transition-colors"
                        >
                          Visitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Exibição: Modo Roteiro por Rua */}
      {modo === 'rua' && (
        <div className="space-y-4">
          {Object.keys(alertasPorRua).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center card-surface">
              <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Nenhum roteiro pendente para os próximos {horizonte} dias
              </h3>
            </div>
          ) : (
            Object.entries(alertasPorRua).map(([rua, lista]) => (
              <div
                key={rua}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm card-surface"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Navigation size={18} className="text-sky-600" aria-hidden="true" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {rua}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                    {lista.length} visita(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {lista.map((al, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            Nº {al.cidadao.numero} · {al.cidadao.nome}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.2 rounded">
                            {al.ind}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">{al.texto}</p>
                      </div>

                      <button
                        onClick={() => onAbrirVisita(al.chave)}
                        className="px-3 py-1.5 bg-sky-600 text-white font-semibold rounded-lg text-xs min-h-[36px]"
                      >
                        Visitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Exibição: Modo Aniversariantes */}
      {modo === 'aniversarios' && (
        <div className="space-y-3">
          {aniversariantes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center card-surface">
              <Cake size={36} className="text-pink-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Nenhum aniversariante nos próximos {horizonte} dias
              </h3>
            </div>
          ) : (
            aniversariantes.map(aniv => (
              <div
                key={aniv.chave}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 card-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950 text-pink-600 flex flex-col items-center justify-center font-bold text-center border border-pink-200 dark:border-pink-800">
                    <Cake size={18} aria-hidden="true" />
                    <span className="text-[10px] mt-0.5">{aniv.dd}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {aniv.cidadao.nome}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Completa <strong>{aniv.anos} anos</strong> · {aniv.cidadao.rua}, Nº {aniv.cidadao.numero}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950 px-2 py-1 rounded-full border border-pink-200 dark:border-pink-800">
                    {aniv.dias === 0 ? '🎉 Aniversário Hoje!' : `Em ${aniv.dias} dia(s)`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
