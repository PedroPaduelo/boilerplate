import type { ReactNode, SVGProps } from 'react';

export interface IconBaseProps extends SVGProps<SVGSVGElement> {
  /** Os `path`/`circle`/`g` copiados sem alteração do SVG do pacote. */
  children: ReactNode;
}

/**
 * O `<svg>` de todo ícone deste módulo. Existe para que os 36 arquivos de
 * desenho contenham APENAS o traçado — nenhum deles repete viewBox, namespace
 * ou regra de acessibilidade, então não há como um ícone novo nascer diferente
 * dos outros.
 *
 * Decisões que valem para todos:
 *
 * - **`viewBox="0 0 24 24"`**: a grade nativa das coleções `solar` e `eva`
 *   (`register-icons.ts:42-43` da origem). Redesenhar em outra grade
 *   desalinharia o traço em relação ao pacote.
 * - **sem `width`/`height`**: quem dimensiona é o consumidor — o `Icon` do
 *   Astryx aplica `1.25rem`/`1.5rem` por classe, e o CSS da navegação aplica
 *   24px (raiz) ou 22px (mini). Fixar tamanho aqui obrigaria todo consumidor a
 *   sobrescrever, e `width="100%"` faria o ícone inchar em contêiner sem
 *   tamanho definido.
 * - **`focusable="false"`**: sem isso o SVG entra na ordem de tabulação no IE/
 *   Edge legado e no Chrome com certas versões; ícone não é ponto de parada.
 * - **`aria-hidden` por padrão**: ícone é decoração ao lado de um rótulo. Mas
 *   ele é suprimido quando o consumidor nomeia o ícone (`aria-label`,
 *   `aria-labelledby` ou `role="img"`) — é exatamente o que o `Icon` do Astryx
 *   faz ao receber `label`, e emitir `aria-hidden` junto apagaria esse nome da
 *   árvore de acessibilidade.
 *
 * `{...props}` vem por último de propósito: qualquer atributo (inclusive
 * `className`, `style`, `ref` e os próprios ARIA) que o consumidor passe vence
 * o padrão daqui.
 */
export function IconBase({ children, ...props }: IconBaseProps) {
  const isNamed =
    props['aria-label'] != null ||
    props['aria-labelledby'] != null ||
    props.role === 'img';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      focusable="false"
      aria-hidden={isNamed ? undefined : true}
      {...props}
    >
      {children}
    </svg>
  );
}
