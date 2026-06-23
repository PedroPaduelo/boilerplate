/**
 * Bloco `radial_gauge` (shape 'scalar') — medidor radial. Usa o Vitrine
 * `RadialGauge`. O `value`/`label`/`unit` vêm dos dados; `max`/`min`/`unit`/
 * `accent` das props.
 *
 * Formato de GRÁFICO (Turno catálogo): o bloco saiu do SELF_CONTAINED e agora
 * recebe a MOLDURA `ChartWidget` (título no header, footer técnico). Por isso
 * o componente NÃO desenha mais título próprio — só o medidor centralizado
 * dentro do corpo da moldura (sem padding duplicado). O `data.label` vira a
 * sublabel do dado, exibida no miolo do medidor.
 *
 * Prop de COR (canônico — igual aos 8 gráficos): `accent` (string) é resolvido
 * por `resolveAccent()` de `lib/accent.ts` e convertido numa COR CSS aplicada
 * ao ARCO do medidor (stroke), ao número central e ao drop-shadow:
 *   - enum DS (chart-1..5 | 'primary') → `var(--color-chart-N)`;
 *   - classe Tailwind (`bg-purple-500`) → `var(--color-purple-500)`;
 *   - cor CSS crua (`#40E0D0`, rgb(), gradient) → usada direto.
 * A UI base aceita a cor via `color` (CSS string) — a fonte única que mantém
 * arco + texto + sombra consistentes. (Há também `arcClassName`/`arcStyle` na
 * UI base para usos avançados.)
 *
 * `deriveTakeaway` (canônico): 1 insight curto com o valor formatado PT-BR +
 * a unidade e o rótulo do dado (ex.: "Cobertura da meta: 72%").
 */
import type { ScalarData } from '@dashboards/contracts';
import { RadialGauge } from '@/components/ui/radial-gauge';
import {
  formatNumberBR,
  formatPercentPointsBR,
  toNumber,
} from '@/shared/lib/format';
import { resolveAccent } from '../../lib/accent';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type GaugeProps = {
  max?: number;
  min?: number;
  unit?: string;
  accent?: string;
};

/**
 * Converte o `accent` (string livre) numa COR CSS concreta para o arco do
 * medidor. Usa `resolveAccent()`:
 *  - `{ kind: 'style' }` (cor CSS crua) → devolve o `background` direto;
 *  - `{ kind: 'class' }` (`bg-chart-1`, `bg-purple-500`) → devolve
 *    `var(--color-<token>)` (Tailwind v4 expõe `--color-*`; o tema do DS
 *    expõe `--color-chart-N`/`--color-primary`).
 * Uma cor CSS (e não classe) é o que o `RadialGauge` precisa para o STROKE
 * do arco + cor do número + drop-shadow ficarem consistentes.
 */
function resolveArcColor(accent: string | undefined): string {
  const resolved = resolveAccent(accent);
  if (resolved.kind === 'style') {
    const bg = resolved.style.background;
    return typeof bg === 'string' && bg.trim() !== ''
      ? bg
      : 'var(--color-chart-1)';
  }
  const token = resolved.className.replace(/^bg-/, '').trim();
  return `var(--color-${token || 'chart-1'})`;
}

export const Component: BlockComponent<GaugeProps, ScalarData> = ({ props, data }) => {
  const value = toNumber(data?.value) ?? 0;
  const unit = props.unit ?? data?.unit;
  const arcColor = resolveArcColor(props.accent);
  return (
    <div className="flex h-full min-h-[180px] w-full items-center justify-center">
      <RadialGauge
        value={value}
        max={props.max ?? 100}
        min={props.min ?? 0}
        label={data?.label}
        unit={unit}
        color={arcColor}
        size={160}
        thickness={14}
      />
    </div>
  );
};

/**
 * Insight de rodapé (canônico): 1 frase curta com o valor do medidor já
 * formatado em PT-BR + a unidade e (se houver) o rótulo do dado.
 *  - unit "%"     → "Cobertura: 72%" (formatPercentPointsBR);
 *  - unit qualquer→ "Meta: 1.234 km" (formatNumberBR + unidade);
 *  - sem unit     → "Meta: 1.234".
 * Retorno `string[]` (o BlockRenderer normaliza). `undefined` se o valor for
 * inválido.
 */
function deriveTakeaway(data: ScalarData): string[] | undefined {
  const value = toNumber(data?.value);
  if (value == null) return undefined;

  const label = data?.label?.trim();
  const unit = data?.unit?.trim();

  let valueStr: string;
  if (unit === '%') {
    valueStr = formatPercentPointsBR(value);
  } else if (unit) {
    valueStr = `${formatNumberBR(value)} ${unit}`;
  } else {
    valueStr = formatNumberBR(value);
  }

  const prefix = label ? `${label}: ` : '';
  return [`${prefix}${valueStr}`];
}

export const definition = defineBlock<GaugeProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
