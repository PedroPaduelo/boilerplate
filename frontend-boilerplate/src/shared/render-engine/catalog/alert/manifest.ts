/**
 * Manifesto do bloco `alert` (narrativo, sem dados) — aviso/destaque. Usa o
 * Vitrine `Alert` + `AlertTitle`/`AlertDescription`.
 *
 * Props de COR/ÍCONE: `variant` é um ENUM FECHADO de 6 variantes semânticas
 * (default/info/success/warning/error/destructive) — cada uma carrega sua
 * própria `description` via `oneOf`/`const` (padrão h_bar_chart) p/ o MCP/IA
 * ver a documentação por opção no autocomplete. `enum` puro coexiste com o
 * `oneOf` (AJV aceita ambos) p/ retrocompat com validadores simples.
 *
 * Todas as props têm `description` (MCP-ready).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'alert',
  kind: 'text',
  name: 'Alerta',
  description: 'Aviso/observação em destaque (título + descrição), com variante de cor + ícone, ícone opcional e botão de fechar opcional.',
  source: 'vitrine:alert',
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
        description: 'Variante semântica (define cor da borda/texto + ícone). ENUM FECHADO (sem input livre).',
        oneOf: [
          { const: 'default',     description: 'Neutro (card) — ícone ℹ Info. Aviso genérico sem conotação.' },
          { const: 'info',        description: 'Informativo (azul/sky) — ícone ℹ Info. Contexto/dica.' },
          { const: 'success',     description: 'Sucesso (verde/emerald) — ícone ✓ CircleCheck. Operação concluída/meta atingida.' },
          { const: 'warning',     description: 'Atenção (âmbar/amber) — ícone ⚠ TriangleAlert. Algo requer cuidado.' },
          { const: 'error',       description: 'Erro (vermelho) — ícone ✕ CircleX. Falha/valor crítico. Alias semântico de destructive.' },
          { const: 'destructive', description: 'Destrutivo (vermelho, token --destructive do DS) — ícone CircleAlert. Ação irreversível/alerta forte.' },
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
        description: 'Mostra o ícone semântico (ℹ/✓/⚠/✕) conforme a variante. false oculta o ícone.',
      },
      dismissible: {
        type: 'boolean',
        default: false,
        description: 'Quando true, exibe um botão X no canto que fecha o alerta (estado local — ao fechar, o bloco some da tela).',
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
