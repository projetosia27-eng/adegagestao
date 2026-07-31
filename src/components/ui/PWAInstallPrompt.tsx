import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from './Button';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIphoneOrIpad && !isStandalone) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt && !isIOS) return null;

  return (
    <>
      {showPrompt && (
        <div className="bg-gradient-to-r from-amber-500/20 via-gold/15 to-purple-900/30 border-b border-gold/30 p-3 px-4 flex items-center justify-between text-xs sm:text-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gold text-zinc-950 rounded-lg shrink-0 font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">Instale o App AdegaHub</span>
              <span className="hidden md:inline text-zinc-300 ml-1.5">
                — Acesse mais rápido direto da sua tela inicial!
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-gold hover:bg-gold/90 text-zinc-950 font-bold h-7 text-xs px-3"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Instalar
            </Button>
            <button
              onClick={() => setShowPrompt(false)}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal for iOS step-by-step instructions */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instalar no iPhone / iPad</h3>
            <ol className="text-sm text-zinc-300 text-left space-y-2 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
              <li className="flex items-start gap-2">
                <span className="font-bold text-gold">1.</span>
                <span>Toque no botão de <strong>Compartilhar</strong> no Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-gold">2.</span>
                <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-gold">3.</span>
                <span>Confirme em <strong>Adicionar</strong> no canto superior direito.</span>
              </li>
            </ol>
            <Button className="w-full" onClick={() => setShowIOSModal(false)}>
              Entendi
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
