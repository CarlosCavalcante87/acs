import React from 'react';
import { BarChart3, Users, Bell, TrendingUp, Settings } from 'lucide-react';

export type TabId = 'indicadores' | 'cidadaos' | 'alertas' | 'evolucao' | 'configuracoes';

interface TabNavProps {
  abaAtiva: TabId;
  totalAlertas: number;
  totalCidadaos: number;
  onSelecionarAba: (aba: TabId) => void;
}

export const TabNav: React.FC<TabNavProps> = ({
  abaAtiva,
  totalAlertas,
  totalCidadaos,
  onSelecionarAba
}) => {
  const abas = [
    {
      id: 'indicadores' as TabId,
      rotulo: 'Indicadores',
      subrotulo: 'Metas C1 a C7',
      icone: BarChart3
    },
    {
      id: 'cidadaos' as TabId,
      rotulo: 'Cidadãos',
      subrotulo: `${totalCidadaos} cadastrados`,
      icone: Users
    },
    {
      id: 'alertas' as TabId,
      rotulo: 'Ações do Dia',
      subrotulo: 'Prazos urgentes',
      icone: Bell,
      badge: totalAlertas > 0 ? totalAlertas : undefined
    },
    {
      id: 'evolucao' as TabId,
      rotulo: 'Evolução',
      subrotulo: 'Gráficos & Resumo',
      icone: TrendingUp
    },
    {
      id: 'configuracoes' as TabId,
      rotulo: 'Ajustes',
      subrotulo: 'Importar & Backup',
      icone: Settings
    }
  ];

  return (
    <nav
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-[62px] z-20"
      aria-label="Navegação Principal do Sistema"
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-4 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-1.5">
        {abas.map(aba => {
          const Icone = aba.icone;
          const ativa = abaAtiva === aba.id;

          return (
            <button
              key={aba.id}
              onClick={() => onSelecionarAba(aba.id)}
              className={`flex-1 min-w-[76px] sm:min-w-[120px] py-2 px-2 rounded-xl text-center flex flex-col items-center justify-center transition-all relative border min-h-[50px] ${
                ativa
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 font-bold shadow-sm'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
              }`}
              role="tab"
              aria-selected={ativa}
              aria-label={`${aba.rotulo}${aba.badge ? `, ${aba.badge} pendências` : ''}`}
            >
              <div className="relative flex items-center justify-center">
                <Icone size={20} className={ativa ? 'stroke-[2.5px]' : 'stroke-2'} aria-hidden="true" />
                {aba.badge !== undefined && (
                  <span
                    className="absolute -top-1.5 -right-3.5 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm"
                    aria-hidden="true"
                  >
                    {aba.badge}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm mt-1 leading-none whitespace-nowrap">{aba.rotulo}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block mt-0.5 whitespace-nowrap">
                {aba.subrotulo}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
