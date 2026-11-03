import React, { useState, useMemo } from 'react';
import { Cidadao, IndicadorId } from '../types';
import {
  Search,
  X,
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  ClipboardList,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Volume2,
  Filter,
  Activity,
  Heart
} from 'lucide-react';
import {
  normalizarTexto,
  classificarIMC,
  idadeEmAnos,
  linkWhatsApp,
  dataBR
} from '../utils/rules';

interface CitizensViewProps {
  cidadaos: Record<string, Cidadao>;
  ruas: string[];
  filtroIndicadorInicial?: IndicadorId | 'TODOS';
  vozAtiva: boolean;
  onFalarTexto: (texto: string) => void;
  onAbrirVisita: (chave: string) => void;
  onAbrirRetorno: (chave: string) => void;
  onAbrirAnotacao: (chave: string) => void;
}

export const CitizensView: React.FC<CitizensViewProps> = ({
  cidadaos,
  ruas,
  filtroIndicadorInicial = 'TODOS',
  vozAtiva,
  onFalarTexto,
  onAbrirVisita,
  onAbrirRetorno,
  onAbrirAnotacao
}) => {
  const [busca, setBusca] = useState('');
  const [ruaSelecionada, setRuaSelecionada] = useState('');
  const [filtroPendencia, setFiltroPendencia] = useState<'todos' | 'pendentes' | 'emdia'>('todos');
  const [indicadorAtivo, setIndicadorAtivo] = useState<IndicadorId | 'TODOS'>(filtroIndicadorInicial);

  const chipsIndicadores: Array<{ id: IndicadorId | 'TODOS'; rotulo: string; icone: string }> = [
    { id: 'TODOS', rotulo: 'Todos os Cidadãos', icone: '👥' },
    { id: 'C1', rotulo: 'C1 Cadastros', icone: '📋' },
    { id: 'C2', rotulo: 'C2 Crianças', icone: '👶' },
    { id: 'C3', rotulo: 'C3 Gestantes', icone: '🤰' },
    { id: 'C4', rotulo: 'C4 Diabéticos', icone: '🩸' },
    { id: 'C5', rotulo: 'C5 Hipertensos', icone: '❤️' },
    { id: 'C6', rotulo: 'C6 Idosos', icone: '👴' },
    { id: 'C7', rotulo: 'C7 Mulheres', icone: '👩' },
    { id: 'BF', rotulo: 'Bolsa Família', icone: '💰' }
  ];

  const listaFiltrada = useMemo(() => {
    const termo = normalizarTexto(busca);

    return Object.values(cidadaos).filter(c => {
      // Filtro de Indicador
      if (indicadorAtivo !== 'TODOS') {
        if (indicadorAtivo === 'BF') {
          if (!c.bolsaFamilia) return false;
        } else {
          if (!c.indicadores[indicadorAtivo]) return false;
        }
      }

      // Filtro de Rua
      if (ruaSelecionada && c.rua !== ruaSelecionada) {
        return false;
      }

      // Filtro de Pendência
      const temPendencia = (c.pendencias || []).length > 0;
      if (filtroPendencia === 'pendentes' && !temPendencia) return false;
      if (filtroPendencia === 'emdia' && temPendencia) return false;

      // Filtro de Busca Textual (Nome, CPF ou Número da Casa)
      if (termo) {
        const nomeNorm = normalizarTexto(c.nome);
        const cpfLimpo = (c.cpf || '').replace(/\D/g, '');
        const numNorm = normalizarTexto(c.numero);
        const ruaNorm = normalizarTexto(c.rua);

        const bateu =
          nomeNorm.includes(termo) ||
          cpfLimpo.includes(termo) ||
          numNorm === termo ||
          ruaNorm.includes(termo);

        if (!bateu) return false;
      }

      return true;
    }).sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
  }, [cidadaos, busca, ruaSelecionada, filtroPendencia, indicadorAtivo]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca de Alta Acessibilidade */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 card-surface">
        {/* Carrossel de Chips de Indicadores */}
        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
          role="tablist"
          aria-label="Filtrar por grupo de saúde ou indicador"
        >
          {chipsIndicadores.map(chip => {
            const ativo = indicadorAtivo === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setIndicadorAtivo(chip.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all min-h-[44px] border ${
                  ativo
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                role="tab"
                aria-selected={ativo}
              >
                <span role="img" aria-hidden="true">{chip.icone}</span>
                <span>{chip.rotulo}</span>
              </button>
            );
          })}
        </div>

        {/* Campo de Busca Principal com Botão de Limpeza */}
        <div className="relative">
          <label htmlFor="buscaCidadao" className="sr-only">
            Buscar por nome, CPF ou número da casa
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} aria-hidden="true" />
          </div>
          <input
            id="buscaCidadao"
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou número da casa..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-900 transition-colors min-h-[48px]"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Limpar campo de busca"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filtros Secundários: Rua e Situação de Pendências */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="filtroRua" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Filtrar por Logradouro / Rua
            </label>
            <select
              id="filtroRua"
              value={ruaSelecionada}
              onChange={e => setRuaSelecionada(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            >
              <option value="">Todas as Ruas e Avenidas</option>
              {ruas.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtroPendencia" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Situação da Meta
            </label>
            <select
              id="filtroPendencia"
              value={filtroPendencia}
              onChange={e => setFiltroPendencia(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            >
              <option value="todos">Todos os Cidadãos</option>
              <option value="pendentes">⚠️ Apenas com Pendências</option>
              <option value="emdia">✓ Apenas Em Dia (Sem Pendências)</option>
            </select>
          </div>
        </div>

        {/* Contador de Resultados Acessível (aria-live) */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          <span>
            Mostrando <strong>{listaFiltrada.length}</strong> cidadão(s)
            {indicadorAtivo !== 'TODOS' && ` no indicador ${indicadorAtivo}`}
            {ruaSelecionada && ` na ${ruaSelecionada}`}
          </span>
          {(busca || ruaSelecionada || filtroPendencia !== 'todos' || indicadorAtivo !== 'TODOS') && (
            <button
              onClick={() => {
                setBusca('');
                setRuaSelecionada('');
                setFiltroPendencia('todos');
                setIndicadorAtivo('TODOS');
              }}
              className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Cidadãos */}
      {listaFiltrada.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center card-surface">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl mb-3">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Nenhum cidadão encontrado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tente mudar os filtros de busca, selecionar outra rua ou verificar a ortografia do nome/CPF.
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="feed" aria-label="Lista de Cidadãos Cadastrados">
          {listaFiltrada.map(c => {
            const anos = idadeEmAnos(c.dt_nascimento);
            const imc =
              c.med?.peso && c.med?.altura && c.med.altura > 50
                ? c.med.peso / Math.pow(c.med.altura / 100, 2)
                : null;
            const imcInfo = imc ? classificarIMC(imc, anos) : null;
            const linkWa = linkWhatsApp(c.telefone, c.nome);
            const temPendencias = (c.pendencias || []).length > 0;

            return (
              <article
                key={c.chave}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all card-surface"
              >
                {/* Linha Superior: Nome, Idade, Bolsa Família e Leitor de Voz */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                        {c.nome}
                      </h3>
                      {c.bolsaFamilia && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          💰 Bolsa Família
                        </span>
                      )}
                    </div>

                    {/* Idade e Nascimento */}
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      {c.idade_txt && <span>Idade: <strong>{c.idade_txt}</strong></span>}
                      {c.dt_nascimento && <span>· Nasc.: {c.dt_nascimento}</span>}
                      {c.cpf && <span className="tabular-nums">· CPF: {c.cpf}</span>}
                    </div>
                  </div>

                  {/* Botão de Leitura Assistiva em Voz Alta */}
                  {vozAtiva && (
                    <button
                      onClick={() => {
                        const pendText =
                          c.pendencias && c.pendencias.length > 0
                            ? `Atenção para as pendências: ${c.pendencias.join('. ')}`
                            : 'Cidadão em dia, sem pendências registradas.';
                        const fala = `${c.nome}, residente na ${c.rua}, número ${c.numero}. ${pendText}`;
                        onFalarTexto(fala);
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Ouvir dados e pendências deste cidadão"
                      aria-label={`Ouvir situação de ${c.nome}`}
                    >
                      <Volume2 size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Endereço e Contato */}
                <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin size={15} className="text-sky-600 shrink-0" aria-hidden="true" />
                    <span>
                      {c.rua}, Nº {c.numero || 'S/N'}
                    </span>
                  </div>

                  {c.telefone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${c.telefone.replace(/\D/g, '')}`}
                        className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:underline"
                        aria-label={`Ligar para ${c.nome}: ${c.telefone}`}
                      >
                        <Phone size={13} className="text-slate-400" aria-hidden="true" />
                        <span>{c.telefone}</span>
                      </a>

                      {linkWa && (
                        <a
                          href={linkWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition-colors min-h-[36px]"
                          aria-label={`Conversar com ${c.nome} no WhatsApp`}
                        >
                          <MessageCircle size={14} aria-hidden="true" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Medidas Físicas e Sinais Vitais (se houver) */}
                {c.med && (c.med.peso || c.med.pa || c.med.hg) && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 flex-wrap text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Activity size={14} className="text-sky-600" aria-hidden="true" />
                      Medidas:
                    </span>

                    {c.med.peso && (
                      <span className="tabular-nums">
                        ⚖️ {c.med.peso.toFixed(1)} kg {c.med.altura ? `· 📏 ${c.med.altura} cm` : ''}
                      </span>
                    )}

                    {imcInfo && (
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          imcInfo.nivel === 'ok'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        IMC {imc?.toFixed(1)} ({imcInfo.texto})
                      </span>
                    )}

                    {c.med.pa && (
                      <span className="tabular-nums font-semibold flex items-center gap-1">
                        <Heart size={13} className="text-red-500" aria-hidden="true" />
                        PA: {c.med.pa} {c.med.dtPa ? `(${c.med.dtPa})` : ''}
                      </span>
                    )}

                    {c.med.hg !== undefined && (
                      <span className="tabular-nums font-semibold text-amber-800 dark:text-amber-300">
                        🩸 HbA1c: {c.med.hg}% {c.med.dtHg ? `(${c.med.dtHg})` : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Indicadores Ativos */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(c.indicadores) as IndicadorId[]).map(ind => (
                    <span
                      key={ind}
                      className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold"
                    >
                      {ind}
                    </span>
                  ))}

                  {c.c7_hpv_du && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                        c.c7_hpv_du.toLowerCase().includes('atras') || c.c7_hpv_du.toLowerCase().includes('pend')
                          ? 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      💉 HPV DU: {c.c7_hpv_du}
                    </span>
                  )}
                </div>

                {/* Lista Detalhada de Vacinas em Atraso (Busca Ativa do PEC) */}
                {c.vacinasAtrasadas && c.vacinasAtrasadas.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-900 dark:text-red-200">
                      <span role="img" aria-hidden="true">💉</span>
                      <span>{c.vacinasAtrasadas.length} Vacina(s) em atraso no PEC (Busca Ativa):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.vacinasAtrasadas.map((v, vIdx) => (
                        <span
                          key={vIdx}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                        >
                          <strong>{v.vacina}</strong>
                          {v.dose && <span className="text-slate-500">({v.dose})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alerta de Pendências (em destaque acessível) */}
                {temPendencias ? (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" aria-hidden="true" />
                      <span>{c.pendencias.length} pendência(s) a resolver:</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-amber-950 dark:text-amber-300 space-y-1 pl-1">
                      {c.pendencias.map((p, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600" aria-hidden="true" />
                    <span>Em dia · Nenhuma pendência para este cidadão</span>
                  </div>
                )}

                {/* Retornos Agendados (se houver) */}
                {c.retornos && c.retornos.length > 0 && (
                  <div className="mt-2.5 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
                    <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1 mb-1">
                      <Calendar size={13} aria-hidden="true" />
                      <span>Retornos Agendados:</span>
                    </div>
                    {c.retornos.map(r => (
                      <div key={r.id} className="flex items-center justify-between gap-2 text-purple-950 dark:text-purple-200 py-0.5">
                        <span>
                          {dataBR(r.d)} - {r.nota || 'Acompanhamento de rotina'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${r.feito ? 'bg-emerald-200 text-emerald-900' : 'bg-purple-200 text-purple-900'}`}>
                          {r.feito ? '✓ Concluído' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Anotação do ACS */}
                {c.anotacao && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 italic">
                    <strong>Observação do ACS:</strong> "{c.anotacao}"
                  </div>
                )}

                {/* Botões de Ação para o Trabalho em Campo */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => onAbrirVisita(c.chave)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors min-h-[44px]"
                    aria-label={`Registrar visita domiciliar para ${c.nome}`}
                  >
                    <ClipboardList size={15} aria-hidden="true" />
                    <span>Registrar Visita</span>
                  </button>

                  <button
                    onClick={() => onAbrirRetorno(c.chave)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-colors min-h-[44px]"
                    aria-label={`Agendar retorno para ${c.nome}`}
                  >
                    <Calendar size={15} aria-hidden="true" />
                    <span>Agendar Retorno</span>
                  </button>

                  <button
                    onClick={() => onAbrirAnotacao(c.chave)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors min-h-[44px]"
                    aria-label={`Editar anotações para ${c.nome}`}
                  >
                    <Edit3 size={15} aria-hidden="true" />
                    <span>{c.anotacao ? 'Editar Nota' : 'Anotar'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
