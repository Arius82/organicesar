import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InstallBanner = () => {
  const { canInstall, isIOS, promptInstall, dismissInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in lg:left-auto lg:right-6 lg:max-w-md">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl p-4 shadow-xl shadow-emerald-900/20 flex flex-col sm:flex-row items-start sm:items-center gap-4 ring-1 ring-white/20">
        <div className="flex w-full sm:w-auto items-center justify-between">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Download className="w-6 h-6 text-white" />
          </div>
          <button onClick={dismissInstall} className="sm:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-base font-display font-bold text-white mb-1 tracking-tight">Instale o OrganiCésar</p>
          {isIOS ? (
             <p className="text-xs text-emerald-50 leading-relaxed font-medium">
               Toque em <Share className="inline w-3 h-3 mx-1" /> Compartilhar e depois escolha <PlusSquare className="inline w-3 h-3 mx-1" /> <strong>Adicionar à Tela de Início</strong>.
             </p>
          ) : (
             <p className="text-xs text-emerald-50 leading-relaxed font-medium">
               Acesso rápido e nativo direto da tela inicial do seu celular!
             </p>
          )}
        </div>
        
        <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 items-center justify-end">
          {!isIOS && (
            <Button
              size="sm"
              onClick={promptInstall}
              className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-md h-8"
            >
              Instalar Agora
            </Button>
          )}
          <button onClick={dismissInstall} className="hidden sm:flex self-start text-white/50 hover:text-white mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
