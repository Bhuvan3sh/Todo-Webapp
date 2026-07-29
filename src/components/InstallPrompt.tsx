import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Smartphone, Share, Plus, X, CheckCircle2, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPromptModal: React.FC = () => {
  const { isInstallModalOpen, setIsInstallModalOpen, showToast } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iosDevice);

    // Check if running in standalone display mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!isPWA);

    // Listen for Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isInstallModalOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('Task Buddy app installed successfully!', 'success');
      }
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md neu-raised rounded-neu-card p-6 shadow-2xl relative transition-all">
        
        {/* Close button */}
        <button
          onClick={() => setIsInstallModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full neu-raised neu-button flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full neu-raised flex items-center justify-center text-[#6C63FF]">
            <Smartphone className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Install Task Buddy App
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Shortcut for Android, iOS & Desktop
            </p>
          </div>
        </div>

        {isStandalone ? (
          <div className="p-4 rounded-neu-btn bg-emerald-500/10 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            Task Buddy is already installed and running as a standalone app on your device!
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Install Task Buddy on your device for fast, 1-tap access right from your home screen with offline support.
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full neu-accent-button py-3 rounded-neu-btn text-xs font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4 stroke-[3]" />
              Install App Shortcut Now
            </button>
          </div>
        ) : isIOS ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-600 font-medium">
              Follow these simple steps in Safari to add Task Buddy to your iPhone or iPad home screen:
            </p>

            <div className="space-y-3 pt-1">
              <div className="neu-sunken p-3 rounded-neu-btn flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                  Tap the <span className="font-bold flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-200 text-gray-800"><Share className="w-3.5 h-3.5" /> Share</span> button in Safari toolbar
                </div>
              </div>

              <div className="neu-sunken p-3 rounded-neu-btn flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                  Scroll down and tap <span className="font-bold flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-200 text-gray-800"><Plus className="w-3.5 h-3.5" /> Add to Home Screen</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="w-full mt-2 neu-raised neu-button py-2.5 rounded-neu-btn text-xs font-semibold text-gray-700"
            >
              Got it!
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              To install Task Buddy on Android or Desktop:
            </p>
            <div className="neu-sunken p-3 rounded-neu-btn space-y-2 text-xs text-gray-700">
              <p className="font-semibold flex items-center gap-1.5 text-gray-800">
                <Monitor className="w-4 h-4 text-[#6C63FF]" /> Browser Menu Instructions:
              </p>
              <p>• <strong>Chrome / Edge:</strong> Click the <strong>Install</strong> icon in the address bar or open menu (⋮) → <strong>Install Task Buddy</strong>.</p>
              <p>• <strong>Android Chrome:</strong> Open browser menu (⋮) → <strong>Add to Home screen</strong>.</p>
            </div>
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="w-full neu-accent-button py-2.5 rounded-neu-btn text-xs font-bold"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
