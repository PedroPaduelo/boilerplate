/**
 * Manifesto do bloco `progress_circle` (shape 'scalar') — anel de progresso.
 * Vive na aba "Gráficos" e recebe a moldura do bloco (título no header).
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * iguais. O anel é pintado por TOM semântico (`variant`) ou pela COR DE SÉRIE
 * pedida em `accent` — que vence o tom, como manda a regra de precedência
 * publicada em `shared/ui/chart-accent.ts`.
 *
 * `accent` NÃO declara default de propósito: o `BlockRenderer` mescla
 * `defaultProps` em toda renderização, então um default de fábrica chegaria
 * aqui indistinguível de uma escolha do autor — e, como acento vence tom,
 * `variant` nunca mais teria efeito. Ausência precisa significar "não
 * escolheram cor".
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'progress_circle',
  kind: 'chart',
  name: 'Anel de Progresso',
  description: 'Progresso circular de um valor sobre uma escala (percentual no centro).',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: {
        type: 'number',
        default: 100,
        description:
          'Valor máximo da escala (o 100% do anel). Default 100 — nesse caso o `value` já É um percentual. Com max diferente de 100, o anel mostra value/max e a leitura explicita "X de Y".',
      },
      variant: {
        type: 'string',
        enum: ['default', 'neutral', 'warning', 'error', 'success'],
        default: 'default',
        description:
          'Tom semântico do anel: default = destaque (verde do produto), neutral = cinza, warning = âmbar, error = vermelho, success = verde de sucesso. Cada valor pinta o arco com uma cor diferente. É SOBRESCRITO quando `accent` está preenchido — use um ou outro, não os dois.',
      },
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor do arco, escolhida na paleta de dados. Quando preenchida SOBRESCREVE o `variant` e o anel é pintado com a cor de série correspondente (chart-1..5 mapeiam para as cores categóricas do tema, na mesma ordem da paleta; `primary` é sinônimo de `chart-1` — as duas são a 1ª cor, e por isso desenham igual). Valores antigos (classe utilitária, cor CSS) continuam aceitos e caem na paleta quando não descrevem uma cor do sistema. VAZIO = usa o `variant`, que é o jeito de pintar por SIGNIFICADO (atenção, erro, sucesso).',
      },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
    },
    example: { value: 75, label: 'Conclusão' },
  },
  defaultProps: { max: 100, variant: 'default' },
  // 1.1.0: `accent` passou a pintar a COR DE SÉRIE pedida (antes qualquer valor
  // virava o mesmo tom de destaque, e os seis do enum desenhavam igual).
  version: '1.1.0',
} satisfies BlockManifest;
