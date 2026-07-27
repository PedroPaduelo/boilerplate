/**
 * Manifesto do bloco `alert` (narrativo, sem dados) — aviso/destaque. Renderiza
 * com o `Banner` do Astryx (mensagem persistente em contexto).
 *
 * Props de COR/ÍCONE: `variant` é um ENUM FECHADO de 6 variantes semânticas
 * (default/info/success/warning/error/destructive) — cada uma carrega sua
 * própria `description` via `oneOf`/`const` (padrão h_bar_chart) p/ o MCP/IA
 * ver a documentação por opção no autocomplete. `enum` puro coexiste com o
 * `oneOf` (AJV aceita ambos) p/ retrocompat com validadores simples.
 *
 * A variante NÃO define uma cor: ela define a SEVERIDADE (status do design
 * system), e é o DS que resolve cor + ícone a partir dela.
 *
 * Todas as props têm `description` (MCP-ready).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'alert',
  kind: 'text',
  name: 'Alerta',
  description:
    'Aviso/observação em destaque (título + descrição), com variante semântica (cor + ícone vêm do design system), ícone opcional e botão de fechar opcional.',
  source: 'astryx:banner',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      // Variante semântica (cor + ícone). ENUM FECHADO de 6 valores.
      variant: {
        type: 'string',
        enum: ['default', 'info', 'success', 'warning', 'error', 'destructive'],
        default: 'default',
        description:
          'Variante semântica: define a SEVERIDADE da mensagem; cor e ícone vêm do design system. ENUM FECHADO (sem input livre).',
        oneOf: [
          {
            const: 'default',
            description:
              'Neutro — severidade informativa do DS. Aviso genérico, sem conotação.',
          },
          {
            const: 'info',
            description: 'Informativo — severidade informativa do DS. Contexto/dica.',
          },
          {
            const: 'success',
            description:
              'Sucesso — severidade de sucesso do DS. Operação concluída/meta atingida.',
          },
          {
            const: 'warning',
            description: 'Atenção — severidade de alerta do DS. Algo requer cuidado.',
          },
          {
            const: 'error',
            description:
              'Erro — severidade de erro do DS. Falha/valor crítico. Alias semântico de destructive.',
          },
          {
            const: 'destructive',
            description:
              'Destrutivo — mesma severidade de erro do DS. Ação irreversível/alerta forte.',
          },
        ],
      },
      title: {
        type: 'string',
        description: 'Título do alerta (obrigatório).',
      },
      description: {
        type: 'string',
        description: 'Texto do corpo do alerta (opcional).',
      },
      showIcon: {
        type: 'boolean',
        default: true,
        description:
          'Mostra o ícone semântico que o design system associa à variante. false oculta o ícone.',
      },
      dismissible: {
        type: 'boolean',
        default: false,
        description:
          'Quando true, exibe um botão X no canto que fecha o alerta (estado local — ao fechar, o bloco some da tela).',
      },
    },
  },
  defaultProps: {
    variant: 'default',
    title: 'Atenção',
    description: 'A inadimplência da zona Leste ultrapassou 30% no período.',
    showIcon: true,
    dismissible: false,
  },
  version: '1.0.0',
} satisfies BlockManifest;
