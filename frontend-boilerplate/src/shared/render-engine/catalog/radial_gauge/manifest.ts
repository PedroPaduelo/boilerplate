/**
 * Manifesto do bloco `radial_gauge` (shape 'scalar') — medidor radial. Ideal
 * para metas e percentuais (valor sobre uma escala).
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * iguais. A prop de cor (`accent`) é resolvida pelo componente para um token de
 * dado do design system.
 *
 * `variant` foi ACRESCENTADA (opcional, default `semicircle`) na repaginação:
 * a referência tem TRÊS medidores (`03-tipos-de-grafico.md` §11, §12 e §13) e
 * o bloco desenhava só um. Nenhuma prop existente mudou de nome, tipo ou
 * default — decisão registrada em `docs/charts/NOTAS.md` (SUB-06).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'radial_gauge',
  kind: 'chart',
  name: 'Medidor Radial',
  description:
    'Medidor (gauge) de um valor sobre uma escala — ótimo para metas e percentuais.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: {
        type: 'number',
        default: 100,
        description:
          'Valor MÁXIMO da escala do medidor (fim do arco). Ex.: 100 para percentuais. O `value` dos dados é posicionado entre `min` e `max`.',
      },
      min: {
        type: 'number',
        default: 0,
        description:
          'Valor MÍNIMO da escala do medidor (início do arco). Default 0. Define o piso da escala junto com `max`.',
      },
      unit: {
        type: 'string',
        description:
          'Unidade exibida junto do número no miolo (ex.: "%", "km", "pts"). Se ausente, usa a `unit` dos dados (data.unit).',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor do ARCO do medidor (e da leitura central). O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta). No valor PADRÃO (`chart-1`) o medidor usa o par de cores do próprio layout (roxo, no medidor semicircular); qualquer outro valor pinta o arco com a cor escolhida. Valores fora do enum são aceitos por compatibilidade e caem na paleta quando não descrevem uma cor do sistema.',
      },
      // LAYOUT — os três medidores da referência de design.
      variant: {
        type: 'string',
        enum: ['semicircle', 'radial', 'dashed'],
        default: 'semicircle',
        description:
          'Layout do medidor: `semicircle` (meia-lua de -90° a +90°, o padrão), `radial` (barra radial de volta completa, com legenda embaixo) ou `dashed` (arco de 270° com a barra de valor pontilhada). Só muda o desenho — escala, unidade e leitura central são as mesmas.',
      },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      unit: { type: 'string', required: false },
    },
    example: { value: 72, label: 'Cobertura', unit: '%' },
  },
  defaultProps: { max: 100, min: 0, accent: 'chart-1' },
  version: '1.0.0',
} satisfies BlockManifest;
