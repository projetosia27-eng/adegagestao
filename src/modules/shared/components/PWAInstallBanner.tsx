import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-gradient-to-r from-wine-950 to-slate-900 border border-wine-700/50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-wine-700/40 rounded-xl text-wine-300">
          <Download className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">Instalar AdegaHub PWA</h4>
          <p className="text-xs text-slate-300">Acesse sua adega offline e receba alertas de pedidos.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-wine-600 hover:bg-wine-500 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
