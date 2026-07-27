/**
 * Manifesto do bloco `callout` (narrativo, sem dados) — banner de destaque com
 * variante semântica. Renderiza com o `Banner` do Astryx.
 *
 * ===== TOM DA CAIXA × TOM DO TEXTO (separados) =====
 *  - `variant` define o PRESET semântico (severidade: caixa + texto + ícone).
 *  - `boxColor` sobrescreve SÓ o tom da CAIXA.
 *  - `textColor` sobrescreve SÓ o tom do TEXTO (título + corpo).
 *  As duas são INDEPENDENTES. Os valores são TONS do design system
 *  (info/success/warning/error para a caixa; primary/secondary/accent para o
 *  texto), não cores cruas: o bloco não pinta hex/gradiente na tela. Nomes de
 *  cor legados (ex.: "red", "green") ainda são aceitos e caem no tom
 *  equivalente; o que não tem tom equivalente é ignorado e o `variant` vale.
 *  Os sufixos `Color` fazem o playground exibir o ColorFieldEditor.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'callout',
  kind: 'text',
  name: 'Callout',
  description:
    'Banner de destaque semântico (info/sucesso/aviso/erro) com título e texto.',
  source: 'astryx:banner',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      variant: {
        type: 'string',
        enum: ['default', 'info', 'success', 'warning', 'error'],
        description:
          'Preset semântico: define a SEVERIDADE do destaque (default e info = informativo | success = sucesso | warning = atenção | error = erro). Cor da caixa, do texto e do ícone vêm do design system. boxColor/textColor sobrescrevem o tom por cima.',
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
          'TOM da CAIXA (fundo + ícone). Sobrescreve o tom do variant. INDEPENDENTE do texto. Valores: info | success | warning | error (tons do design system). Nomes de cor legados são mapeados para o tom equivalente. Vazio (ou sem tom equivalente) = usa o tom do variant.',
      },
      textColor: {
        type: 'string',
        description:
          'TOM do TEXTO (título + corpo). Sobrescreve o tom do variant. INDEPENDENTE da caixa. Valores: primary | secondary | accent | disabled (tons de texto do design system). Nomes de cor legados são mapeados para o tom equivalente. Vazio (ou sem tom equivalente) = herda o tom da caixa.',
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
