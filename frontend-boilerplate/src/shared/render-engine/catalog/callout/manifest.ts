/**
 * Manifesto do bloco `callout` (narrativo, sem dados) — banner de destaque com
 * variante semântica. Usa o Vitrine `CalloutTremor`.
 *
 * ===== COR DA CAIXA × COR DO TEXTO (separadas) =====
 *  - `variant` define o PRESET semântico (cores base de caixa + texto + ícone).
 *  - `boxColor` sobrescreve SÓ a cor da CAIXA (fundo).
 *  - `textColor` sobrescreve SÓ a cor do TEXTO (título + corpo + ícone).
 *  As duas são INDEPENDENTES: a caixa pode ser turquesa e o texto branco.
 *  Ambas aceitam enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500)
 *  ou cor CSS crua (#40E0D0, rgb(), gradient) — resolvidas por `resolveAccent()`.
 *  Os sufixos `Color` fazem o playground exibir o ColorFieldEditor.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'callout',
  kind: 'text',
  name: 'Callout',
  description: 'Banner de destaque semântico (info/sucesso/aviso/erro) com título e texto.',
  source: 'vitrine:callout-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      variant: {
        type: 'string',
        enum: ['default', 'info', 'success', 'warning', 'error'],
        description:
          'Preset semântico que define as cores base da caixa, do texto e do ícone (default | info=azul | success=verde | warning=amarelo | error=vermelho). boxColor/textColor sobrescrevem por cima.',
      },
      title: {
        type: 'string',
        description: 'Título em destaque (linha 1, ao lado do ícone). Obrigatório.',
      },
      description: {
        type: 'string',
        description: 'Corpo do banner (linha 2, abaixo do título).',
      },
      boxColor: {
        type: 'string',
        description:
          'Cor da CAIXA (fundo). Sobrescreve a cor do variant. INDEPENDENTE do texto. Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500) ou cor CSS (#40E0D0, rgb(), gradient). Vazio = usa a cor do variant.',
      },
      textColor: {
        type: 'string',
        description:
          'Cor do TEXTO (título + corpo + ícone). Sobrescreve a cor do variant. INDEPENDENTE da caixa. Mesmo formato de boxColor (enum DS, classe Tailwind ou cor CSS). Vazio = herda a cor do variant.',
      },
      showIcon: {
        type: 'boolean',
        description: 'Mostra o ícone semântico à esquerda do título. Default: true.',
      },
    },
  },
  defaultProps: {
    variant: 'success',
    title: 'Meta atingida',
    description: 'A arrecadação do trimestre superou a meta em 8%.',
    showIcon: true,
  },
  version: '1.1.0',
} satisfies BlockManifest;
