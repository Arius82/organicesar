import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InstallBanner = () => {
  const { canInstall, promptInstall, dismissInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in lg:left-auto lg:right-6 lg:max-w-sm">
      <div className="gradient-primary rounded-xl p-4 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary-foreground">Instale o OrganiCésar</p>
          <p className="text-xs text-primary-foreground/80">Acesso rápido direto da sua tela inicial</p>
        </div>
        <Button
          size="sm"
          onClick={promptInstall}
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 flex-shrink-0"
        >
          Instalar
        </Button>
        <button onClick={dismissInstall} className="text-primary-foreground/60 hover:text-primary-foreground flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
