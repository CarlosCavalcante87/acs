import React from 'react';
import { IndicadorId, IndicadorStatus } from '../types';
import { ChevronRight, CheckCircle2, AlertCircle, Volume2, Calendar } from 'lucide-react';

interface IndicatorsViewProps {
  status: Record<IndicadorId, IndicadorStatus>;
  dataImportacao?: string;
  dataImportacaoFormatada?: string;
  vozAtiva: boolean;
  onSelecionarIndicador: (id: IndicadorId) => void;
  onFalarTexto: (texto: string) => void;
}

export const IndicatorsView: React.FC<IndicatorsViewProps> = ({
  status,
  dataImportacao,
  dataImportacaoFormatada,
  vozAtiva,
  onSelecionarIndicador,
  onFalarTexto
}) => {
  const listaIndicadores: IndicadorId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'BF'];

  // Resumo de conformidade geral
  const totalCidadaos = status.C1.total;
  const metasCompletas = listaIndicadores.filter(k => status[k].total > 0 && status[k].porcentagem >= 100).length;

  return (
    <div className="space-y-6">
      {/* Banner Resumo de Desempenho e Acessibilidade */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm card-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Painel de Metas e Indicadores de Saúde
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {totalCidadaos > 0
                ? `${totalCidadaos} cidadãos cadastrados na sua microárea · ${metasCompletas} de ${listaIndicadores.length} metas atingidas (100%).`
                : 'Nenhum dado importado ainda. Importe os relatórios do PEC ou carregue a demonstração.'}
            </p>

            {dataImportacaoFormatada && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-800 dark:text-sky-300">
                <Calendar size={13} aria-hidden="true" />
                <span>Última importação PEC: <strong>{dataImportacaoFormatada}</strong> ({dataImportacao})</span>
              </div>
            )}
          </div>

          {vozAtiva && (
            <button
              onClick={() => {
                const texto = `Painel de indicadores. Você tem ${totalCidadaos} cidadãos cadastrados. C1 cadastros está em ${status.C1.porcentagem}%. C2 crianças em ${status.C2.porcentagem}%. C3 gestantes em ${status.C3.porcentagem}%. C4 diabéticos em ${status.C4.porcentagem}%. C5 hipertensos em ${status.C5.porcentagem}%. C6 idosos em ${status.C6.porcentagem}%. C7 saúde da mulher em ${status.C7.porcentagem}%.`;
                onFalarTexto(texto);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-semibold text-xs rounded-xl hover:bg-sky-200 transition-colors border border-sky-300 dark:border-sky-800"
              aria-label="Ouvir resumo de todos os indicadores em voz alta"
            >
              <Volume2 size={16} aria-hidden="true" />
              <span>Ouvir resumo em voz alta</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Cards dos Indicadores C1 a C7 + Bolsa Família */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Indicadores">
        {listaIndicadores.map(id => {
          const item = status[id];
          const atingiuMeta = item.total > 0 && item.porcentagem >= 100;
          const temPendencias = item.pendentes > 0;

          return (
            <div
              key={id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group card-surface"
              style={{
                borderLeftWidth: '6px',
                borderLeftColor: item.cor
              }}
            >
              <div className="p-4 sm:p-5">
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" role="img" aria-label={item.nome}>
                      {item.icone}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                        {item.id} · {item.nome}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {item.total} {item.total === 1 ? 'pessoa' : 'pessoas'}
                      </span>
                    </div>
                  </div>

                  {vozAtiva && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const fala = `${item.titulo}. Total de ${item.total} cadastrados. ${item.ok} em dia e ${item.pendentes} pendentes. Progresso de ${item.porcentagem} porcento.`;
                        onFalarTexto(fala);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={`Ouvir dados de ${item.nome}`}
                      aria-label={`Ouvir status do indicador ${item.id}`}
                    >
                      <Volume2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Valor Principal & Status Visual */}
                <div className="flex items-baseline justify-between mt-2 mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {item.porcentagem}%
                    </span>
                    <span className="text-xs text-slate-500 font-medium">atingido</span>
                  </div>

                  <div className="text-right">
                    {atingiuMeta ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        100% Em Dia
                      </span>
                    ) : temPendencias ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <AlertCircle size={14} aria-hidden="true" />
                        {item.pendentes} pendente(s)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Sem pendências</span>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso Acessível */}
                <div
                  className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3"
                  role="progressbar"
                  aria-valuenow={item.porcentagem}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progresso de ${item.nome}: ${item.porcentagem}%`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(item.porcentagem, 100)}%`,
                      backgroundColor: item.cor
                    }}
                  />
                </div>

                {/* Regra do Indicador para o ACS */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  <strong className="text-slate-700 dark:text-slate-300">Meta:</strong> {item.metaDesc}
                </p>
              </div>

              {/* Botão de Ação Acessível */}
              <button
                onClick={() => onSelecionarIndicador(id)}
                className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors min-h-[44px]"
                aria-label={`Ver lista de cidadãos do indicador ${item.id} - ${item.nome}`}
              >
                <span>Ver {item.total} cidadãos deste indicador</span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
