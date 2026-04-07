'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PublishSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

export function PublishSuccessModal({ open, onOpenChange, classId }: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const viewerLink = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}/classes/${classId}/viewer`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(viewerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">¡Clase publicada!</DialogTitle>
          <DialogDescription>
            La clase ahora está disponible para conectar. Comparte este link con tus estudiantes:
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Input 
            readOnly 
            value={viewerLink} 
            className="flex-1 text-sm bg-muted/50 font-mono"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button type="button" size="icon" onClick={copyToClipboard} variant="outline" title="Copiar enlace">
            {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" onClick={() => window.open(viewerLink, '_blank')}>
            <ExternalLink className="mr-2 size-4" />
            Abrir Viewer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
