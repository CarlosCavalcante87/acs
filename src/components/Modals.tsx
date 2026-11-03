import React, { useState, useEffect } from 'react';
import { Cidadao, PerfilACS } from '../types';
import { X, Check, Lock, Calendar, ClipboardList, Edit3, User, ShieldAlert } from 'lucide-react';

// ==========================================
// 1. Modal de Registro de Visita Domiciliar
// ==========================================
interface VisitModalProps {
  cidadao: Cidadao | null;
  onFechar: () => void;
  onSalvar: (chave: string, data: string, motivos: string[]) => void;
}

export const VisitModal: React.FC<VisitModalProps> = ({ cidadao, onFechar, onSalvar }) => {
  if (!cidadao) return null;

  const hojeIso = new Date().toISOString().split('T')[0];
  const [dataVisita, setDataVisita] = useState(hojeIso);
  const [motivos, setMotivos] = useState<string[]>([]);

  // Motivos disponíveis baseados nas condições do cidadão
  const opcoesDisponiveis: Array<{ id: string; label: string }> = [];
  if (cidadao.indicadores.C2) opcoesDisponiveis.push({ id: 'C2', label: 'Criança (C2 - Desenvolvimento infantil)' });
  if (cidadao.indicadores.C3) {
    opcoesDisponiveis.push({ id: 'C3PN', label: 'Gestante, Pré-Natal (C3)' });
    opcoesDisponiveis.push({ id: 'C3PU', label: 'Puérpera até 7º dia (C3)' });
  }
  if (cidadao.indicadores.C4) opcoesDisponiveis.push({ id: 'C4', label: 'Pessoa com Diabetes (C4)' });
  if (cidadao.indicadores.C5) opcoesDisponiveis.push({ id: 'C5', label: 'Pessoa com Hipertensão (C5)' });
  if (cidadao.indicadores.C6) opcoesDisponiveis.push({ id: 'C6', label: 'Pessoa Idosa (C6)' });
  if (opcoesDisponiveis.length === 0) {
    opcoesDisponiveis.push({ id: 'C1', label: 'Visita de Acompanhamento Geral / Cadastro' });
  }

  useEffect(() => {
    if (opcoesDisponiveis.length > 0) {
      setMotivos([opcoesDisponiveis[0].id]);
    }
  }, [cidadao]);

  const toggleMotivo = (id: string) => {
    if (motivos.includes(id)) {
      if (motivos.length > 1) setMotivos(motivos.filter(m => m !== id));
    } else {
      setMotivos([...motivos, id]);
    }
  };

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataVisita) return;
    onSalvar(cidadao.chave, dataVisita, motivos);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tituloModalVisita"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 id="tituloModalVisita" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="text-sky-600" size={20} aria-hidden="true" />
            <span>Registrar Visita Domiciliar</span>
          </h2>
          <button
            onClick={onFechar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Fechar janela"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <span className="text-xs text-slate-500 block">Cidadão visitado:</span>
          <strong className="text-base text-slate-900 dark:text-slate-100">{cidadao.nome}</strong>
          <span className="text-xs text-slate-500 block mt-0.5">
            {cidadao.rua}, Nº {cidadao.numero}
          </span>
        </div>

        <form onSubmit={handleConfirmar} className="space-y-4">
          <div>
            <label htmlFor="inputDataVisita" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Data em que a visita foi realizada
            </label>
            <input
              id="inputDataVisita"
              type="date"
              value={dataVisita}
              max={hojeIso}
              onChange={e => setDataVisita(e.target.value)}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Motivo da visita (indicador acompanhado)
            </label>
            <div className="space-y-2">
              {opcoesDisponiveis.map(op => {
                const selecionado = motivos.includes(op.id);
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => toggleMotivo(op.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors min-h-[44px] ${
                      selecionado
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{op.label}</span>
                    {selecionado && <Check size={16} className="text-sky-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 bg-sky-50/50 dark:bg-sky-950/30 p-2.5 rounded-lg border border-sky-100 dark:border-sky-900/40">
            💡 A visita atualiza os cálculos agora. Registre também no aplicativo de campo do PEC: ao reimportar os dados, o sistema funde as duas datas sem duplicar.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors min-h-[44px]"
            >
              Confirmar e Salvar Visita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. Modal de Agendamento de Retorno
// ==========================================
interface ReturnModalProps {
  cidadao: Cidadao | null;
  onFechar: () => void;
  onSalvar: (chave: string, data: string, nota: string) => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ cidadao, onFechar, onSalvar }) => {
  if (!cidadao) return null;

  const hojeIso = new Date().toISOString().split('T')[0];
  const proximaSemana = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const [dataRetorno, setDataRetorno] = useState(proximaSemana);
  const [nota, setNota] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataRetorno) return;
    onSalvar(cidadao.chave, dataRetorno, nota.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tituloModalRetorno"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 id="tituloModalRetorno" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-purple-600" size={20} aria-hidden="true" />
            <span>Agendar Retorno / Lembrete</span>
          </h2>
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600" aria-label="Fechar janela">
            <X size={20} />
          </button>
        </div>

        <div>
          <span className="text-xs text-slate-500 block">Cidadão:</span>
          <strong className="text-base text-slate-900 dark:text-slate-100">{cidadao.nome}</strong>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inputDataRetorno" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Data prevista para retornar
            </label>
            <input
              id="inputDataRetorno"
              type="date"
              value={dataRetorno}
              min={hojeIso}
              onChange={e => setDataRetorno(e.target.value)}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="inputNotaRetorno" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Motivo ou lembrete para a visita (opcional)
            </label>
            <input
              id="inputNotaRetorno"
              type="text"
              value={nota}
              onChange={e => setNota(e.target.value)}
              maxLength={120}
              placeholder="Ex.: Conferir resultado de exame de sangue"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            O retorno aparecerá na aba <strong>Ações do Dia</strong> quando a data estiver próxima.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors min-h-[44px]"
            >
              Agendar Retorno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. Modal de Anotações do ACS
// ==========================================
interface NotesModalProps {
  cidadao: Cidadao | null;
  onFechar: () => void;
  onSalvar: (chave: string, anotacao: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ cidadao, onFechar, onSalvar }) => {
  if (!cidadao) return null;

  const [texto, setTexto] = useState(cidadao.anotacao || '');

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(cidadao.chave, texto.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tituloModalNotas"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 id="tituloModalNotas" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="text-sky-600" size={20} aria-hidden="true" />
            <span>Anotações de Campo do ACS</span>
          </h2>
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600" aria-label="Fechar janela">
            <X size={20} />
          </button>
        </div>

        <div>
          <span className="text-xs text-slate-500 block">Cidadão:</span>
          <strong className="text-base text-slate-900 dark:text-slate-100">{cidadao.nome}</strong>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label htmlFor="inputNotas" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observações particulares do ACS sobre a família / saúde
            </label>
            <textarea
              id="inputNotas"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={5}
              placeholder="Ex.: Mora sozinho; prefere ser visitado no período da tarde; possui cão bravo..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors min-h-[44px]"
            >
              Salvar Anotação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. Modal de Perfil do ACS
// ==========================================
interface ProfileModalProps {
  aberto: boolean;
  perfil: PerfilACS;
  onFechar: () => void;
  onSalvar: (perfil: PerfilACS) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ aberto, perfil, onFechar, onSalvar }) => {
  if (!aberto) return null;

  const [nome, setNome] = useState(perfil.nome || '');
  const [micro, setMicro] = useState(perfil.micro || '');
  const [ubs, setUbs] = useState(perfil.ubs || '');
  const [equipe, setEquipe] = useState(perfil.equipe || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar({
      nome: nome.trim(),
      micro: micro.trim(),
      ubs: ubs.trim(),
      equipe: equipe.trim()
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tituloModalPerfil"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 id="tituloModalPerfil" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="text-sky-600" size={20} aria-hidden="true" />
            <span>Dados do Agente Comunitário (ACS)</span>
          </h2>
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600" aria-label="Fechar janela">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="perfilNome" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome do ACS
            </label>
            <input
              id="perfilNome"
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex.: Maria da Silva Santos"
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="perfilMicro" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Microárea
            </label>
            <input
              id="perfilMicro"
              type="text"
              value={micro}
              onChange={e => setMicro(e.target.value)}
              placeholder="Ex.: 04"
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="perfilUbs" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Unidade de Saúde (UBS / USF)
            </label>
            <input
              id="perfilUbs"
              type="text"
              value={ubs}
              onChange={e => setUbs(e.target.value)}
              placeholder="Ex.: USF Central"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors min-h-[44px]"
            >
              Salvar Dados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5. Modal de Senha / PIN do App
// ==========================================
interface PasswordModalProps {
  aberto: boolean;
  modo: 'definir' | 'alterar' | 'remover';
  onFechar: () => void;
  onConfirmar: (senhaAtual: string, novaSenha: string) => Promise<boolean>;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  aberto,
  modo,
  onFechar,
  onConfirmar
}) => {
  if (!aberto) return null;

  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [nova2, setNova2] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (modo !== 'definir' && !atual) {
      setErro('Informe a senha atual.');
      return;
    }
    if (modo !== 'remover') {
      if (nova.length < 4) {
        setErro('A senha deve ter pelo menos 4 caracteres ou dígitos.');
        return;
      }
      if (nova !== nova2) {
        setErro('As senhas digitadas não conferem.');
        return;
      }
    }

    const ok = await onConfirmar(atual, nova);
    if (!ok) {
      setErro('A senha atual está incorreta.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tituloModalSenha"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 id="tituloModalSenha" className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="text-amber-500" size={20} aria-hidden="true" />
            <span>
              {modo === 'definir'
                ? 'Definir Senha do Aplicativo'
                : modo === 'alterar'
                ? 'Alterar Senha do Aplicativo'
                : 'Remover Senha de Bloqueio'}
            </span>
          </h2>
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600" aria-label="Fechar janela">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {modo !== 'definir' && (
            <div>
              <label htmlFor="senhaAtual" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Senha Atual
              </label>
              <input
                id="senhaAtual"
                type="password"
                value={atual}
                onChange={e => setAtual(e.target.value)}
                required
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
              />
            </div>
          )}

          {modo !== 'remover' && (
            <>
              <div>
                <label htmlFor="senhaNova" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nova Senha (mínimo 4 dígitos ou letras)
                </label>
                <input
                  id="senhaNova"
                  type="password"
                  value={nova}
                  onChange={e => setNova(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="senhaNova2" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirme a Nova Senha
                </label>
                <input
                  id="senhaNova2"
                  type="password"
                  value={nova2}
                  onChange={e => setNova2(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
                />
              </div>
            </>
          )}

          {erro && (
            <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
              {erro}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-colors min-h-[44px] ${
                modo === 'remover' ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {modo === 'remover' ? 'Confirmar Remoção' : 'Salvar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 6. Tela de Bloqueio Seguro (LockScreen)
// ==========================================
interface LockScreenProps {
  onDestravar: (senha: string) => Promise<boolean>;
  onEsqueciSenha: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onDestravar, onEsqueciSenha }) => {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha) return;
    setVerificando(true);
    setErro('');

    const ok = await onDestravar(senha);
    setVerificando(false);
    if (!ok) {
      setErro('Senha incorreta. Tente novamente.');
      setSenha('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900 text-white flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tela de bloqueio com senha"
    >
      <div className="bg-slate-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-700 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-sky-600/30 text-sky-400 border border-sky-500/40 mx-auto flex items-center justify-center">
          <Lock size={32} aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">Guia de Visitas TACS</h2>
          <p className="text-xs text-slate-400 mt-1">
            Digite a senha para acessar as informações de saúde.
          </p>
        </div>

        <form onSubmit={handleEntrar} className="space-y-4">
          <div>
            <label htmlFor="inputBloqSenha" className="sr-only">
              Senha de acesso
            </label>
            <input
              id="inputBloqSenha"
              type="password"
              autoFocus
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite sua senha..."
              className="w-full text-center tracking-widest text-lg py-3 px-4 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 min-h-[48px]"
            />
          </div>

          {erro && (
            <p className="text-xs text-red-400 font-semibold bg-red-950/60 p-2.5 rounded-lg border border-red-800">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={verificando || !senha}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all min-h-[48px]"
          >
            {verificando ? 'Conferindo...' : '🔓 Desbloquear Aplicativo'}
          </button>

          <button
            type="button"
            onClick={onEsqueciSenha}
            className="text-xs text-slate-400 hover:text-sky-300 underline block mx-auto pt-2"
          >
            Esqueci minha senha
          </button>
        </form>
      </div>
    </div>
  );
};
