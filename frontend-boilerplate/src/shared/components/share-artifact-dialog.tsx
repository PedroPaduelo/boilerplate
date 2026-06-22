import { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  useCreateShare,
  type ShareTargetType,
} from '@/shared/hooks/use-share';

interface ShareArtifactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ShareTargetType;
  targetId: string | null;
  /** Título do artefato (para o texto do diálogo). */
  targetTitle?: string;
}

const DURATIONS: { value: string; label: string }[] = [
  { value: String(60 * 60), label: '1 hora' },
  { value: String(60 * 60 * 24), label: '1 dia' },
  { value: String(60 * 60 * 24 * 7), label: '7 dias' },
  { value: String(60 * 60 * 24 * 30), label: '30 dias' },
];

/**
 * Diálogo genérico de compartilhamento público (dashboards e gráficos). Escolhe
 * a duração, cria o link via `POST /share` e exibe a URL pública para copiar.
 */
export function ShareArtifactDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle,
}: ShareArtifactDialogProps) {
  const createShare = useCreateShare();
  const [duration, setDuration] = useState(DURATIONS[2].value);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // O reset entre alvos é feito pelo `key` no componente pai (remonta limpo),
  // evitando setState dentro de useEffect (regra react-hooks/set-state-in-effect).

  const handleCreate = () => {
    if (!targetId) return;
    createShare.mutate(
      {
        targetType,
        targetId,
        durationSeconds: Number(duration),
      },
      {
        onSuccess: (link) => {
          const absolute = `${window.location.origin}${link.url}`;
          setShareUrl(absolute);
        },
      },
    );
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4" />
            Compartilhar link público
          </DialogTitle>
          <DialogDescription>
            Gere um link de leitura para{' '}
            <span className="font-medium text-foreground">
              {targetTitle ?? 'este artefato'}
            </span>
            . A contagem do tempo de expiração começa na primeira abertura.
          </DialogDescription>
        </DialogHeader>

        {shareUrl ? (
          <div className="space-y-2">
            <Label htmlFor="share-url">Link público</Label>
            <div className="flex gap-2">
              <Input id="share-url" readOnly value={shareUrl} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label="Copiar link"
              >
                {copied ? (
                  <Check className="text-chart-2" />
                ) : (
                  <Copy />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="share-duration">Validade do link</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="share-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          {shareUrl ? (
            <Button onClick={() => onOpenChange(false)}>Concluir</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createShare.isPending || !targetId}
              >
                {createShare.isPending ? 'Gerando...' : 'Gerar link'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
