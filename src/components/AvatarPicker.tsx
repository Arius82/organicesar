import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const PRESET_AVATARS = [
  { src: '/avatars/chef.png', label: 'Chef' },
  { src: '/avatars/gardener.png', label: 'Jardineiro' },
  { src: '/avatars/house.png', label: 'Casinha' },
  { src: '/avatars/hero.png', label: 'Herói' },
  { src: '/avatars/cat.png', label: 'Gato' },
  { src: '/avatars/dog.png', label: 'Cachorro' },
  { src: '/avatars/star.png', label: 'Estrela' },
  { src: '/avatars/robot.png', label: 'Robô' },
];

interface AvatarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar?: string;
  onSelect: (url: string) => void;
}

const AvatarPicker = ({ open, onOpenChange, currentAvatar, onSelect }: AvatarPickerProps) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string>(currentAvatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setSelected(data.publicUrl);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha seu avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Presets */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Avatares temáticos</p>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.src}
                  onClick={() => setSelected(avatar.src)}
                  className={cn(
                    'relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:bg-accent/10',
                    selected === avatar.src && 'bg-primary/10 ring-2 ring-primary'
                  )}
                >
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={avatar.src} alt={avatar.label} />
                    <AvatarFallback>{avatar.label[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-muted-foreground">{avatar.label}</span>
                  {selected === avatar.src && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Ou envie sua própria foto</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Enviando...' : 'Enviar do computador'}
            </Button>

            {/* Preview of custom upload */}
            {selected && !PRESET_AVATARS.some(a => a.src === selected) && (
              <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/50">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selected} />
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">Foto personalizada</span>
                <Check className="w-4 h-4 text-primary ml-auto" />
              </div>
            )}
          </div>

          <Button onClick={handleConfirm} className="w-full" disabled={!selected}>
            Confirmar Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPicker;
