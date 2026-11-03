import React from 'react';
import { PerfilACS } from '../types';
import { Sun, Moon, Eye, Volume2, VolumeX, Lock, Unlock, User, Calendar } from 'lucide-react';

interface HeaderProps {
  perfil: PerfilACS;
  tema: 'claro' | 'escuro' | 'alto-contraste';
  fonteEscala: '0' | '1' | '2';
  vozAtiva: boolean;
  travado: boolean;
  temSenha: boolean;
  onMudarTema: (tema: 'claro' | 'escuro' | 'alto-contraste') => void;
  onMudarFonte: (escala: '0' | '1' | '2') => void;
  onAlternarVoz: () => void;
  onAbrirPerfil: () => void;
  onBloquearApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  perfil,
  tema,
  fonteEscala,
  vozAtiva,
  travado,
  temSenha,
  onMudarTema,
  onMudarFonte,
  onAlternarVoz,
  onAbrirPerfil,
  onBloquearApp
}) => {
  return (
    <header className="bg-sky-700 text-white shadow-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Marca & Identificação */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl border border-white/20">
            🩺
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight flex items-center gap-2">
              Guia de Visitas TACS
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-800 text-sky-200 border border-sky-600">
                Acessível
              </span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <button
                onClick={onAbrirPerfil}
                className="text-xs text-sky-100 hover:text-white flex items-center gap-1.5 transition-colors text-left"
                aria-label="Editar dados do ACS e Microárea"
              >
                <User size={13} aria-hidden="true" />
                <span>
                  {perfil.nome || 'ACS'} {perfil.micro ? `· Micro ${perfil.micro}` : ''}
                </span>
                <span className="underline text-sky-200">Editar</span>
              </button>

              {perfil.dataImportacaoFormatada && (
                <span
                  className="text-[11px] font-semibold text-sky-100 bg-sky-900/60 px-2 py-0.5 rounded-md border border-sky-600/50 flex items-center gap-1"
                  title={`Data da importação do PEC: ${perfil.dataImportacao}`}
                >
                  <Calendar size={11} aria-hidden="true" />
                  <span>Importação: {perfil.dataImportacaoFormatada}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Ferramentas de Acessibilidade */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Ajuste de Tamanho de Fonte */}
          <div
            className="flex items-center bg-sky-800/80 rounded-lg p-0.5 border border-sky-600/50"
            role="group"
            aria-label="Tamanho da fonte"
          >
            <button
              onClick={() => onMudarFonte('0')}
              className={`px-2.5 py-1 text-xs font-bold rounded min-h-[36px] transition-colors ${
                fonteEscala === '0' ? 'bg-white text-sky-900 shadow-sm' : 'text-sky-100 hover:bg-sky-700'
              }`}
              title="Fonte Normal (16px)"
              aria-label="Tamanho de fonte normal"
            >
              A
            </button>
            <button
              onClick={() => onMudarFonte('1')}
              className={`px-2.5 py-1 text-sm font-bold rounded min-h-[36px] transition-colors ${
                fonteEscala === '1' ? 'bg-white text-sky-900 shadow-sm' : 'text-sky-100 hover:bg-sky-700'
              }`}
              title="Fonte Grande (18px)"
              aria-label="Tamanho de fonte grande"
            >
              A+
            </button>
            <button
              onClick={() => onMudarFonte('2')}
              className={`px-2.5 py-1 text-base font-bold rounded min-h-[36px] transition-colors ${
                fonteEscala === '2' ? 'bg-white text-sky-900 shadow-sm' : 'text-sky-100 hover:bg-sky-700'
              }`}
              title="Fonte Maior (20px)"
              aria-label="Tamanho de fonte extragrande"
            >
              A++
            </button>
          </div>

          {/* Seletor de Tema / Contraste */}
          <div
            className="flex items-center bg-sky-800/80 rounded-lg p-0.5 border border-sky-600/50"
            role="group"
            aria-label="Modo visual e contraste"
          >
            <button
              onClick={() => onMudarTema('claro')}
              className={`p-2 rounded min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors ${
                tema === 'claro' ? 'bg-white text-sky-900 shadow-sm' : 'text-sky-100 hover:bg-sky-700'
              }`}
              title="Tema Claro"
              aria-label="Ativar tema claro"
            >
              <Sun size={16} aria-hidden="true" />
            </button>
            <button
              onClick={() => onMudarTema('escuro')}
              className={`p-2 rounded min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors ${
                tema === 'escuro' ? 'bg-white text-sky-900 shadow-sm' : 'text-sky-100 hover:bg-sky-700'
              }`}
              title="Tema Escuro"
              aria-label="Ativar tema escuro"
            >
              <Moon size={16} aria-hidden="true" />
            </button>
            <button
              onClick={() => onMudarTema('alto-contraste')}
              className={`px-2 py-1 text-xs font-bold rounded min-h-[36px] flex items-center gap-1 transition-colors ${
                tema === 'alto-contraste'
                  ? 'bg-yellow-400 text-black shadow-sm font-extrabold'
                  : 'text-sky-100 hover:bg-sky-700'
              }`}
              title="Alto Contraste / Modo Sol para campo"
              aria-label="Ativar modo alto contraste para leitura sob sol forte"
            >
              <Eye size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Sol</span>
            </button>
          </div>

          {/* Leitor de Voz Assistivo */}
          <button
            onClick={onAlternarVoz}
            className={`p-2 rounded-lg border min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors ${
              vozAtiva
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-sky-800/80 text-sky-100 border-sky-600/50 hover:bg-sky-700'
            }`}
            title={vozAtiva ? 'Leitura em voz alta ativada' : 'Ativar leitura em voz alta'}
            aria-label={vozAtiva ? 'Desativar áudio assistivo' : 'Ativar áudio assistivo de voz'}
          >
            {vozAtiva ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
          </button>

          {/* Bloqueio de Segurança */}
          {temSenha && (
            <button
              onClick={onBloquearApp}
              className="p-2 rounded-lg bg-sky-800/80 text-sky-100 border border-sky-600/50 hover:bg-sky-700 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
              title="Bloquear aplicativo agora"
              aria-label="Bloquear aplicativo com senha"
            >
              <Lock size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
