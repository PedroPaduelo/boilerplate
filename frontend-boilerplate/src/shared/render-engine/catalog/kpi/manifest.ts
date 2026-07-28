/**
 * Manifesto do bloco `kpi` — métrica única (escalar). Alinhado ao
 * `kpiManifest`/`baseManifests` de @dashboards/contracts (fonte da verdade).
 * PURO (sem React): é o objeto que o `build:catalog` (BE) coleta.
 *
 * Props canônicas (MCP-ready — cada uma com `description`):
 *  - `label`         → sobrescreve o rótulo vindo do dado (`data.label`).
 *  - `valueFormat`   → ENUM com `auto` + os 5 formatos canônicos do DS.
 *                      `auto` (default) mantém o `formatKpiValue` (escolhe o
 *                      melhor display pela unidade/magnitude); os demais
 *                      FORÇAM o formato via `formatValueByEnum()`.
 *  - `accent`        → cor de categorização do card, resolvida para uma
 *                      variante de cor do design system no component.tsx.
 *  - `icon`          → nome de ícone lucide (PascalCase ou kebab-case).
 *  - `showDelta`     → mostra/esconde a variação.
 *  - `deltaPolarity` → `up-good` (subir = verde) | `up-bad` (subir = vermelho).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { CATALOG_ICONS } from '../../lib/icons';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'kpi',
  kind: 'chart',
  name: 'KPI',
  description: 'Métrica única (escalar) com rótulo e variação opcional.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Rótulo — sobrescreve `data.label` quando presente.
      label: {
        type: 'string',
        description:
          'Rótulo da métrica. Sobrescreve o rótulo vindo do dado (data.label).',
      },
      // Formato do valor — ENUM FECHADO: 'auto' (default) + 5 canônicos do DS.
      valueFormat: {
        type: 'string',
        enum: ['auto', ...VALUE_FORMATS],
        default: 'auto',
        description:
          'Formato PT-BR do valor exibido. "auto" (default) escolhe o melhor display pela unidade/magnitude (formatKpiValue); os demais FORÇAM o formato. ENUM FECHADO (sem input livre).',
        oneOf: [
          {
            const: 'auto',
            description:
              'formatKpiValue — escolhe automático: moeda compacta p/ unit BRL/USD/EUR, número compacto p/ magnitude ≥ 10 mil, número cheio caso contrário. DEFAULT. Quando o dado traz `unit: "BRL"`, "auto" e "compactBRL" produzem a MESMA saída — é a definição do automático, não um empate por acaso.',
          },
          {
            const: 'BRL',
            description: 'formatBRL — moeda BRL completa (ex.: "R$ 1.284.000,00").',
          },
          {
            const: 'compactBRL',
            description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 1,28 mi").',
          },
          {
            const: 'number',
            description: 'formatNumberBR — número PT-BR com milhar (ex.: "1.284.000").',
          },
          {
            const: 'compactNumber',
            description: 'formatCompactNumberBR — número compacto (ex.: "1,28 mi").',
          },
          {
            const: 'percent',
            description:
              'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").',
          },
        ],
      },
      // COR de categorização — enum do catálogo; o componente resolve para
      // uma variante de cor do design system.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor de CATEGORIZAÇÃO do card. O valor é resolvido para uma variante de cor do design system (chart-1..5 mapeiam para as cores de dado, na mesma ordem da paleta; `primary` é sinônimo de `chart-1` — as duas são a 1ª cor, e por isso pintam o card igual). Valores fora do enum são aceitos por compatibilidade; quando não descrevem uma cor do sistema, o card fica no visual padrão. Use para agrupar KPIs por tema, não para sinalizar status.',
      },
      // Ícone lucide — ENUM CURADO (set relevante p/ dashboards). A IA/MCP lê
      // o enum p/ saber QUAIS ícones existem. PascalCase (chave do lucide).
      icon: {
        type: 'string',
        enum: [...CATALOG_ICONS],
        description:
          'Ícone exibido acima do rótulo do card. ENUM CURADO (set relevante p/ dashboards: financeiro/métricas/pessoas/status). Ex.: "DollarSign", "TrendingUp", "Users", "Landmark". Todos os 30 nomes desenham um ícone diferente — os que o lucide aposentou (BarChart3, LineChart, PieChart, AlertTriangle, CheckCircle2) são traduzidos para o nome atual em `lib/lucide-resolver.ts`. Vazio = sem ícone.',
      },
      // Variação.
      showDelta: {
        type: 'boolean',
        default: true,
        description: 'Mostra a variação (delta) vs. período anterior. false = esconde.',
      },
      // Texto de apoio sob o número. NOVO na 1.1.0: o card escrevia
      // "vs. período anterior" SEMPRE, cravado no componente — inclusive em
      // KPI que não compara período nenhum (saldo do dia, total do contrato).
      // O autor não tinha como corrigir nem esconder, embora o `stat_tile`,
      // que usa o MESMO card, já expusesse a prop.
      hint: {
        type: 'string',
        description:
          'Texto de apoio exibido sob o número (ex.: "vs. mês anterior", "acumulado no ano"). Ausente = "vs. período anterior". String VAZIA esconde a linha — use quando a métrica não compara períodos.',
      },
      // Polaridade do delta — controla a cor (verde/vermelho).
      deltaPolarity: {
        type: 'string',
        enum: ['up-good', 'up-bad'],
        default: 'up-good',
        description:
          'Polaridade da variação: "up-good" (default) = subir é bom (delta positivo verde); "up-bad" = subir é ruim (delta positivo vermelho, ex.: inadimplência, custo).',
      },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      delta: { type: 'number', required: false },
    },
    example: { value: 1284000, label: 'Total arrecadado', unit: 'BRL', delta: 0.12 },
  },
  // `hint` fica FORA dos defaults de propósito: o `BlockRenderer` mescla
  // `defaultProps` em toda renderização, e um default aqui tiraria do card a
  // capacidade de distinguir "não escolheram texto de apoio" (usa o do
  // componente) de "escolheram vazio" (esconde a linha).
  defaultProps: {
    showDelta: true,
    valueFormat: 'auto',
    accent: 'chart-1',
    deltaPolarity: 'up-good',
  },
  // 1.1.0: `hint` exposta (o texto de apoio era fixo no componente).
  version: '1.1.0',
} satisfies BlockManifest;
