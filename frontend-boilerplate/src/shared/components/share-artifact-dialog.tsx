import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import type { SelectorOptionData } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { useCreateShare, type ShareTargetType } from '@/shared/hooks/use-share';

interface ShareArtifactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ShareTargetType;
  targetId: string | null;
  /** Título do artefato (para o texto do diálogo). */
  targetTitle?: string;
}

const DURATIONS: SelectorOptionData[] = [
  { value: String(60 * 60), label: '1 hora' },
  { value: String(60 * 60 * 24), label: '1 dia' },
  { value: String(60 * 60 * 24 * 7), label: '7 dias' },
  { value: String(60 * 60 * 24 * 30), label: '30 dias' },
];

const DEFAULT_DURATION = DURATIONS[2].value;

/**
 * Diálogo de compartilhamento público (dashboards e gráficos): escolhe a
 * validade, cria o link via `POST /share` e mostra a URL para copiar.
 *
 * O link aparece em `CodeBlock` e não em um input "somente leitura": é um
 * valor para ler e copiar, não para editar — um campo editável que não aceita
 * edição é uma promessa quebrada. O reset entre alvos vem do `key` no
 * componente pai (remonta limpo), evitando `setState` dentro de efeito.
 */
export function ShareArtifactDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle,
}: ShareArtifactDialogProps) {
  const toast = useAppToast();
  const createShare = useCreateShare();
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleCreate = () => {
    if (!targetId) return;
    createShare.mutate(
      { targetType, targetId, durationSeconds: Number(duration) },
      {
        onSuccess: (link) => setShareUrl(`${window.location.origin}${link.url}`),
      },
    );
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} width={480}>
      <DialogHeader
        title="Compartilhar link público"
        subtitle={`Link de leitura para ${targetTitle ?? 'este artefato'}. A contagem do tempo de expiração começa na primeira abertura.`}
        startContent={<Icon icon={Link2} />}
        onOpenChange={onOpenChange}
      />

      <VStack gap={4}>
        {createShare.isError ? (
          <Banner
            status="error"
            title="Não foi possível gerar o link"
            description="Verifique sua conexão e tente de novo."
          />
        ) : null}

        {shareUrl ? (
          <VStack gap={2}>
            <Text type="label">Link público</Text>
            <CodeBlock
              code={shareUrl}
              language="plaintext"
              container="section"
              width="100%"
              isWrapped
              hasCopyButton={false}
              data-testid="share-url"
            />
          </VStack>
        ) : (
          <Selector
            label="Validade do link"
            options={DURATIONS}
            value={duration}
            onChange={setDuration}
            width="100%"
          />
        )}

        <HStack gap={2} hAlign="end">
          {shareUrl ? (
            <>
              <Button label="Copiar link" variant="secondary" clickAction={handleCopy} />
              <Button
                label="Concluir"
                variant="primary"
                onClick={() => onOpenChange(false)}
              />
            </>
          ) : (
            <>
              <Button
                label="Cancelar"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              />
              <Button
                label={createShare.isPending ? 'Gerando...' : 'Gerar link'}
                variant="primary"
                isLoading={createShare.isPending}
                isDisabled={!targetId}
                tooltip={targetId ? undefined : 'Selecione um artefato para compartilhar'}
                onClick={handleCreate}
              />
            </>
          )}
        </HStack>
      </VStack>
    </Dialog>
  );
}
