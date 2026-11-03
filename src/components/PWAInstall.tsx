import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detecta se já está rodando como app instalado (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detecta iPhone / iPad
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstalar = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Se já está instalado e rodando como app nativo, não precisa exibir o banner
  if (isInstalled) {
    return null;
  }

  // Se o navegador disparou beforeinstallprompt (Android / Chrome / Edge)
  if (deferredPrompt) {
    return (
      <div className="bg-sky-50 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-800 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Smartphone size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sky-950 dark:text-sky-100">
              Instalar Aplicativo no Celular
            </h3>
            <p className="text-xs text-sky-800/80 dark:text-sky-300">
              Funciona 100% offline em campo, sem gastar seus dados móveis e abre direto da tela inicial.
            </p>
          </div>
        </div>

        <button
          onClick={handleInstalar}
          className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Download size={16} aria-hidden="true" />
          <span>Instalar Agora</span>
        </button>
      </div>
    );
  }

  // Para iOS Safari
  if (isIOS && !isInstalled) {
    return (
      <>
        <div className="bg-sky-50 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-800 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
              <Smartphone size={22} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sky-950 dark:text-sky-100">
                Usar como Aplicativo no iPhone
              </h3>
              <p className="text-xs text-sky-800/80 dark:text-sky-300">
                Adicione à tela de início para usar offline na rua sem abrir o Safari toda vez.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowIOSModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span>Ver Como Instalar</span>
          </button>
        </div>

        {showIOSModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Como Instalar no iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra inferior do Safari.
                </li>
                <li>Role a lista de opções para baixo.</li>
                <li>
                  Toque em <strong>Adicionar à Tela de Início</strong>.
                </li>
                <li>
                  Confirme tocando em <strong>Adicionar</strong> no canto superior direito.
                </li>
              </ol>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

// Indicador de Conexão Offline
export const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-emerald-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-in fade-in"
    >
      <WifiOff size={15} aria-hidden="true" />
      <span>Modo 100% Offline Ativo · Todos os cidadãos, buscas e visitas continuam funcionando no aparelho!</span>
    </div>
  );
};
