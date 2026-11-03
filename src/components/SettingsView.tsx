import React, { useState } from 'react';
import { BaseDados } from '../types';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Key,
  Database,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Type
} from 'lucide-react';
import { PLANILHAS_ESPERADAS } from '../utils/importer';

interface SettingsViewProps {
  base: BaseDados;
  statusPlanilhas: Record<string, boolean>;
  tema: 'claro' | 'escuro' | 'alto-contraste';
  fonteEscala: '0' | '1' | '2';
  temSenha: boolean;
  onImportarArquivos: (arquivos: File[]) => void;
  onExportarBackup: () => void;
  onRestaurarBackupArquivo: (arquivo: File) => void;
  onCarregarDemo: () => void;
  onLimparBase: () => void;
  onMudarTema: (tema: 'claro' | 'escuro' | 'alto-contraste') => void;
  onMudarFonte: (escala: '0' | '1' | '2') => void;
  onAbrirModalSenha: (modo: 'definir' | 'alterar' | 'remover') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  base,
  statusPlanilhas,
  tema,
  fonteEscala,
  temSenha,
  onImportarArquivos,
  onExportarBackup,
  onRestaurarBackupArquivo,
  onCarregarDemo,
  onLimparBase,
  onMudarTema,
  onMudarFonte,
  onAbrirModalSenha
}) => {
  const [arrastando, setArrastando] = useState(false);
  const [mensagemImportacao, setMensagemImportacao] = useState('');

  const handleArquivosSelecionados = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMensagemImportacao(`Processando ${e.target.files.length} planilha(s)...`);
      onImportarArquivos(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setMensagemImportacao(`Processando ${e.dataTransfer.files.length} planilha(s)...`);
      onImportarArquivos(Array.from(e.dataTransfer.files));
    }
  };

  const totalCidadaos = Object.keys(base.cidadaos).length;

  return (
    <div className="space-y-6">
      {/* Bloco 1: Importador de Planilhas PEC (CSV e XLSX) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 card-surface">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UploadCloud className="text-sky-600" size={24} aria-hidden="true" />
            <span>Importação de Planilhas do PEC (.csv, .xlsx e Excel)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Selecione todas as planilhas exportadas do PEC de uma só vez. O sistema identifica automaticamente o ACS, a Microárea, a Busca Ativa de Vacinas (incluindo a coluna <strong>HPV DU</strong>) e a data da importação.
          </p>

          {(base.dataImportacaoFormatada || base.perfil.dataImportacaoFormatada) && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center gap-2 text-xs text-sky-900 dark:text-sky-200">
              <span role="img" aria-hidden="true">📅</span>
              <span>
                Última importação registrada: <strong>{base.dataImportacaoFormatada || base.perfil.dataImportacaoFormatada}</strong>
                {base.dataImportacao && <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] ml-1">({base.dataImportacao})</span>}
              </span>
            </div>
          )}
        </div>

        {/* Zona de Arrastar e Soltar (Drag & Drop) */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            arrastando
              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <input
            type="file"
            id="inputUploadPlanilhas"
            multiple
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleArquivosSelecionados}
            className="hidden"
          />

          <FileSpreadsheet size={36} className="text-sky-600 mx-auto mb-2" aria-hidden="true" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            Arraste os arquivos aqui ou clique no botão abaixo
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Suporta planilhas em formato <strong>.csv</strong>, <strong>.xlsx</strong> e <strong>Excel (.xls)</strong> do e-SUS APS / PEC.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <label
              htmlFor="inputUploadPlanilhas"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm cursor-pointer transition-colors min-h-[44px]"
            >
              <UploadCloud size={18} aria-hidden="true" />
              <span>Selecionar Planilhas no Dispositivo</span>
            </label>
          </div>

          {mensagemImportacao && (
            <p className="mt-3 text-xs font-semibold text-sky-700 dark:text-sky-300">
              {mensagemImportacao}
            </p>
          )}
        </div>

        {/* Checklist das 10 Planilhas do PEC */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Checklist de Relatórios Recomendados do PEC
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {PLANILHAS_ESPERADAS.map(p => {
              const carregada = !!statusPlanilhas[p.id];
              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    carregada
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span role="img" aria-hidden="true">{p.icone}</span>
                    <div>
                      <strong className="block leading-tight">{p.titulo}</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.desc}</span>
                    </div>
                  </div>

                  <span className="shrink-0 font-bold text-[11px]">
                    {carregada ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={14} aria-hidden="true" /> Carregada
                      </span>
                    ) : (
                      <span className="text-slate-400">Pendente</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bloco 2: Acessibilidade e Ajustes Visuais */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 card-surface">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Eye className="text-purple-600" size={22} aria-hidden="true" />
            <span>Acessibilidade e Leitura em Campo</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize a visualização para trabalhar confortavelmente em ambientes externos ou sob sol forte.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tamanho da Fonte */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Type size={15} aria-hidden="true" />
              <span>Tamanho das Letras</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onMudarFonte('0')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[40px] ${
                  fonteEscala === '0'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Normal (16px)
              </button>
              <button
                onClick={() => onMudarFonte('1')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors min-h-[40px] ${
                  fonteEscala === '1'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Grande (18px)
              </button>
              <button
                onClick={() => onMudarFonte('2')}
                className={`flex-1 py-2 rounded-lg text-base font-bold border transition-colors min-h-[40px] ${
                  fonteEscala === '2'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Maior (20px)
              </button>
            </div>
          </div>

          {/* Tema Visual */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye size={15} aria-hidden="true" />
              <span>Modo Visual / Contraste</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onMudarTema('claro')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[40px] ${
                  tema === 'claro'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Claro
              </button>
              <button
                onClick={() => onMudarTema('escuro')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[40px] ${
                  tema === 'escuro'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Escuro
              </button>
              <button
                onClick={() => onMudarTema('alto-contraste')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors min-h-[40px] ${
                  tema === 'alto-contraste'
                    ? 'bg-yellow-400 text-black border-yellow-500 font-extrabold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                Alto Contraste (Sol)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bloco 3: Segurança & Bloqueio por Senha/PIN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 card-surface">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Key className="text-amber-500" size={22} aria-hidden="true" />
            <span>Segurança e Bloqueio do Aplicativo</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Proteja os dados sensíveis de saúde dos cidadãos contra acessos não autorizados caso o celular seja deixado desbloqueado.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
              {temSenha ? '🔒 Bloqueio por senha ativo' : '🔓 Nenhum bloqueio ativo'}
            </span>
            <span className="text-xs text-slate-500">
              {temSenha
                ? 'O app exige a senha para abrir e protege os dados salvos.'
                : 'O aplicativo abre diretamente sem solicitar senha.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!temSenha ? (
              <button
                onClick={() => onAbrirModalSenha('definir')}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl min-h-[40px]"
              >
                Definir Senha
              </button>
            ) : (
              <>
                <button
                  onClick={() => onAbrirModalSenha('alterar')}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl min-h-[40px]"
                >
                  Alterar Senha
                </button>
                <button
                  onClick={() => onAbrirModalSenha('remover')}
                  className="px-3 py-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl min-h-[40px]"
                >
                  Remover
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bloco 4: Backup e Restauração de Dados */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 card-surface">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="text-blue-600" size={22} aria-hidden="true" />
            <span>Backup e Restauração</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exporte uma cópia completa dos cidadãos, anotações de campo e histórico para guardar em segurança ou transferir para outro aparelho.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onExportarBackup}
            disabled={totalCidadaos === 0}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors min-h-[44px]"
          >
            <Download size={16} aria-hidden="true" />
            <span>Fazer Backup dos Dados ({totalCidadaos} cidadãos)</span>
          </button>

          <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors min-h-[44px]">
            <input
              type="file"
              accept=".json"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  onRestaurarBackupArquivo(e.target.files[0]);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
            <UploadCloud size={16} aria-hidden="true" />
            <span>Restaurar Arquivo de Backup</span>
          </label>
        </div>
      </div>

      {/* Bloco 5: Dados de Demonstração e Limpeza */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 card-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div>
            <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
              <Sparkles size={16} aria-hidden="true" />
              <span>Experimentar com Dados de Exemplo</span>
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300 mt-0.5">
              Carregue 8 cidadãos com gestantes, bebês, idosos, hipertensos e diabéticos para ver o sistema funcionando na prática.
            </p>
          </div>

          <button
            onClick={onCarregarDemo}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0 min-h-[40px]"
          >
            Carregar Demonstração
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Limpar Todos os Dados
            </span>
            <span className="text-[11px] text-slate-500">
              Apaga permanentemente os dados salvos neste navegador.
            </span>
          </div>

          <button
            onClick={onLimparBase}
            className="px-3 py-2 rounded-xl bg-red-100 dark:bg-red-950 hover:bg-red-200 text-red-700 dark:text-red-300 font-bold text-xs transition-colors flex items-center gap-1 min-h-[38px]"
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Limpar Dados</span>
          </button>
        </div>
      </div>
    </div>
  );
};
