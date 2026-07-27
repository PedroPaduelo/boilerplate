/**
 * COMPONENTE PRÓPRIO — o `Text` do Astryx trunca no FIM (`maxLines`), o que
 * destrói justamente a parte que identifica um caminho de arquivo, um nome de
 * tabela ou um id (`…/relatorios/2024/fechamento.sql`). Este componente corta no
 * MEIO, preservando início e fim.
 *
 * O texto completo continua disponível de duas formas: `Tooltip` para quem vê e
 * `VisuallyHidden` para leitor de tela — o trecho visual fica `aria-hidden`
 * para não ser lido com as reticências no meio.
 */
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { truncateMiddle } from './truncate-middle';

/** Tipos de texto aceitos — subconjunto semântico do `Text` do DS. */
export type MiddleTruncationType = 'body' | 'supporting' | 'label' | 'code';

export interface MiddleTruncationProps {
  /** Texto completo. */
  text: string;
  /** Comprimento máximo exibido, em caracteres. */
  maxLength?: number;
  /** Marca de corte. */
  ellipsis?: string;
  /** Mínimo de caracteres preservados no fim (ex.: `4` mantém `.sql`). */
  minEnd?: number;
  /** Tooltip com o texto completo no hover/foco. */
  hasTooltip?: boolean;
  /** Tipo semântico do `Text`. */
  type?: MiddleTruncationType;
}

/** Texto truncado no meio, com o valor completo acessível. */
export function MiddleTruncation({
  text,
  maxLength = 20,
  ellipsis = '…',
  minEnd,
  hasTooltip = true,
  type = 'body',
}: MiddleTruncationProps) {
  const truncated = truncateMiddle(text, maxLength, ellipsis, minEnd);
  const isTruncated = truncated !== text;

  const visible = (
    <Text
      type={type}
      aria-hidden={isTruncated ? true : undefined}
      data-slot="middle-truncation"
    >
      {truncated}
    </Text>
  );

  if (!isTruncated) return visible;

  return (
    <>
      {hasTooltip ? <Tooltip content={text}>{visible}</Tooltip> : visible}
      <VisuallyHidden>{text}</VisuallyHidden>
    </>
  );
}
