import React, { useState } from 'react';
import { BaseDados, IndicadorId } from '../types';
import {
  TrendingUp,
  FileText,
  Copy,
  Share2,
  Check,
  Volume2,
  Lock,
  Calendar
} from 'lucide-react';
import { montarTextoResumo, fmtData, parseDataJS } from '../utils/rules';

interface EvolutionViewProps {
  base: BaseDados;
  vozAtiva: boolean;
  onFalarTexto: (texto: string) => void;
  onCopiarTexto: (texto: string) => void;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({
  base,
  vozAtiva,
  onFalarTexto,
  onCopiarTexto
}) => {
  const [incluirNomes, setIncluirNomes] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [indicadoresVisiveis, setIndicadoresVisiveis] = useState<Set<IndicadorId>>(
    new Set(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'])
  );

  const coresInd: Record<IndicadorId, string> = {
    C1: '#0284c7',
    C2: '#8b5cf6',
    C3: '#ec4899',
    C4: '#f59e0b',
    C5: '#ef4444',
    C6: '#10b981',
    C7: '#db2777',
    BF: '#ca8a04'
  };

  const alternarLinha = (id: IndicadorId) => {
    const s = new Set(indicadoresVisiveis);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setIndicadoresVisiveis(s);
  };

  const resumoTexto = montarTextoResumo(
    base.cidadaos,
    base.perfil,
    base.historico,
    incluirNomes
  );

  const handleCopiar = () => {
    onCopiarTexto(resumoTexto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleCompartilharWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(resumoTexto)}`;
    window.open(url, '_blank');
  };

  // Renderização do gráfico SVG de evolução
  const historico = base.historico || [];
  const W = 580;
  const H = 240;
  const L = 40;
  const R = 20;
  const T = 20;
  const B = 35;

  return (
    <div className="space-y-6">
      {/* Bloco 1: Gráfico de Evolução dos Indicadores */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 card-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="text-sky-600" size={22} aria-hidden="true" />
              <span>Evolução das Metas ao Longo do Tempo</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe a variação percentual dos indicadores entre as importações das planilhas PEC.
            </p>
          </div>
        </div>

        {/* Chips de Indicadores para ligar/desligar linhas no gráfico */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'] as IndicadorId[]).map(id => {
            const visivel = indicadoresVisiveis.has(id);
            return (
              <button
                key={id}
                onClick={() => alternarLinha(id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border min-h-[36px] flex items-center gap-1.5 ${
                  visivel
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
                style={{
                  borderLeftColor: coresInd[id],
                  borderLeftWidth: '4px'
                }}
              >
                <span>{id}</span>
                <span className="text-[10px]">{visivel ? '✓' : '—'}</span>
              </button>
            );
          })}
        </div>

        {/* Gráfico SVG */}
        {historico.length < 2 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Calendar size={32} className="text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Há {historico.length} importação registrada.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              A linha de evolução temporal será desenhada assim que você importar uma nova planilha em data diferente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <svg
              className="w-full min-w-[500px] h-[240px]"
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label="Gráfico de linha com evolução dos indicadores"
            >
              {/* Linhas de Grade de 0%, 25%, 50%, 75%, 100% */}
              {[0, 25, 50, 75, 100].map(pct => {
                const y = T + ((100 - pct) / 100) * (H - T - B);
                return (
                  <g key={pct}>
                    <line
                      x1={L}
                      x2={W - R}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="1"
                    />
                    <text
                      x={L - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-semibold"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Linhas de Cada Indicador */}
              {(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'] as IndicadorId[])
                .filter(id => indicadoresVisiveis.has(id))
                .map(id => {
                  const pts = historico
                    .map((item, idx) => {
                      const st = item.st[id];
                      if (!st || st.tot === 0) return null;
                      const pct = Math.round((st.ok / st.tot) * 100);
                      const x = L + (idx / (historico.length - 1)) * (W - L - R);
                      const y = T + ((100 - pct) / 100) * (H - T - B);
                      return { x, y, pct, data: item.d };
                    })
                    .filter(Boolean) as Array<{ x: number; y: number; pct: number; data: string }>;

                  if (pts.length < 2) return null;

                  const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

                  return (
                    <g key={id}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={coresInd[id]}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {pts.map((p, pIdx) => (
                        <circle
                          key={pIdx}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill={coresInd[id]}
                          className="hover:r-6 transition-all"
                        >
                          <title>{`${id}: ${p.pct}% em ${fmtData(parseDataJS(p.data))}`}</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}

              {/* Rótulos das Datas nos extremos */}
              <text x={L} y={H - 10} textAnchor="start" className="text-[10px] fill-slate-400 font-semibold">
                {fmtData(parseDataJS(historico[0].d))}
              </text>
              <text x={W - R} y={H - 10} textAnchor="end" className="text-[10px] fill-slate-400 font-semibold">
                {fmtData(parseDataJS(historico[historico.length - 1].d))}
              </text>
            </svg>
          </div>
        )}
      </div>

      {/* Bloco 2: Gerador de Resumo Semanal para a Equipe */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 card-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="text-emerald-600" size={22} aria-hidden="true" />
              <span>Resumo Semanal para Enfermagem / Equipe</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gera automaticamente um relatório sintetizado pronto para enviar à enfermeira responsável ou no grupo de WhatsApp da UBS.
            </p>
          </div>

          {vozAtiva && (
            <button
              onClick={() => onFalarTexto(resumoTexto)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-semibold text-xs border border-sky-300 dark:border-sky-800"
              aria-label="Ouvir o resumo semanal completo"
            >
              <Volume2 size={16} aria-hidden="true" />
              <span>Ouvir Resumo</span>
            </button>
          )}
        </div>

        {/* Opção de Privacidade / LGPD */}
        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={incluirNomes}
            onChange={e => setIncluirNomes(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Lock size={13} aria-hidden="true" />
              Incluir nomes dos cidadãos pendentes no texto
            </span>
            <span className="text-slate-500 block">
              Por padrão, apenas números consolidados são exibidos para preservar a privacidade do paciente (LGPD).
            </span>
          </div>
        </label>

        {/* Caixa de Texto do Resumo formatado */}
        <div>
          <label htmlFor="textoResumo" className="sr-only">
            Texto do Resumo Semanal
          </label>
          <textarea
            id="textoResumo"
            value={resumoTexto}
            readOnly
            rows={12}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm leading-relaxed resize-y focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        {/* Botões de Ação para Envio */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopiar}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px]"
            aria-label="Copiar resumo semanal para a área de transferência"
          >
            {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            <span>{copiado ? 'Copiado com Sucesso!' : 'Copiar Texto'}</span>
          </button>

          <button
            onClick={handleCompartilharWhatsApp}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px]"
            aria-label="Compartilhar resumo semanal diretamente no WhatsApp"
          >
            <Share2 size={16} aria-hidden="true" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
