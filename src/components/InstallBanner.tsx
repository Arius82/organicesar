import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Download, X, Share, PlusSquare, Smartphone, Sparkles, Bell, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlarms } from '@/context/AlarmContext';

const SHOW_DELAY_MS = 5000; // Show after 5 seconds of usage

const InstallBanner = () => {
  const { canInstall, isIOS, isAndroid, hasNativePrompt, promptInstall, dismissInstall } = useInstallPrompt();
  const { notificationPermission, requestNotificationPermission } = useAlarms();
  const [visible, setVisible] = useState(false);
  const [showNotifHint, setShowNotifHint] = useState(false);

  // Delay appearance so the user has settled in
  useEffect(() => {
    if (!canInstall) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [canInstall]);

  // Show notification permission hint if user hasn't granted it yet
  useEffect(() => {
    if (notificationPermission === 'default') {
      const timer = setTimeout(() => setShowNotifHint(true), 12000);
      return () => clearTimeout(timer);
    }
  }, [notificationPermission]);

  // Notification permission reminder (separate from install banner)
  if (showNotifHint && notificationPermission === 'default' && !visible) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in lg:left-auto lg:right-6 lg:max-w-sm">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 shadow-2xl shadow-primary/20 ring-1 ring-white/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold text-white mb-1">Ative as notificações</p>
              <p className="text-xs text-white/80 leading-relaxed">
                Receba alertas de tarefas mesmo com o app fechado. Nunca perca um compromisso!
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    requestNotificationPermission();
                    setShowNotifHint(false);
                  }}
                  className="flex-1 bg-white text-primary hover:bg-white/90 font-bold h-8 text-xs"
                >
                  Permitir Alertas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotifHint(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10 h-8 text-xs px-2"
                >
                  Agora não
                </Button>
              </div>
            </div>
            <button onClick={() => setShowNotifHint(false)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!visible || !canInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in lg:left-auto lg:right-6 lg:max-w-md">
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-2xl p-5 shadow-2xl shadow-emerald-900/30 ring-1 ring-white/10 relative overflow-hidden">
        {/* Decorative sparkle */}
        <div className="absolute top-2 right-12 opacity-30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        {/* Close button */}
        <button
          onClick={dismissInstall}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/10">
            <Smartphone className="w-7 h-7 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-base font-display font-bold text-white mb-1.5 tracking-tight">
              Instale o OrganiCésar
            </p>

            {isIOS ? (
              /* iOS: Step-by-step instructions */
              <div className="space-y-2">
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Para a melhor experiência no seu iPhone:
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">1</div>
                    <span>Toque em <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <strong>Compartilhar</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">2</div>
                    <span>Escolha <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <strong>Tela de Início</strong></span>
                  </div>
                </div>
              </div>
            ) : hasNativePrompt ? (
              /* Android/Chrome with native prompt available */
              <div className="space-y-3">
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Acesse direto da tela inicial — mais rápido, com alarmes e tela cheia!
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={promptInstall}
                    className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-lg shadow-black/10 h-9 px-5 text-xs"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Instalar Agora
                  </Button>
                  <button
                    onClick={dismissInstall}
                    className="text-xs text-white/50 hover:text-white/80 transition-colors"
                  >
                    Talvez depois
                  </button>
                </div>
              </div>
            ) : (
              /* Android/other without native prompt: manual instructions */
              <div className="space-y-2">
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Adicione à tela inicial para acesso rápido:
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">1</div>
                    <span>Toque em <MoreVertical className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <strong>menu do navegador</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">2</div>
                    <span><strong>Adicionar à tela inicial</strong> ou <strong>Instalar app</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="text-[10px] text-white/70 bg-white/10 px-2.5 py-1 rounded-full font-medium">⚡ Acesso rápido</span>
          <span className="text-[10px] text-white/70 bg-white/10 px-2.5 py-1 rounded-full font-medium">🔔 Alarmes ativos</span>
          <span className="text-[10px] text-white/70 bg-white/10 px-2.5 py-1 rounded-full font-medium">📱 Tela cheia</span>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
