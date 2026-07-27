/**
 * Cards de exemplo da GALERIA do catálogo — o bloco também é exibido sem
 * filhos reais, e um container vazio não comunicaria o comportamento de
 * "expandir". Ficam fora de `component.tsx` para o arquivo do bloco não passar
 * do limite de tamanho.
 *
 * A tarja de cada miniatura é decorativa (`aria-hidden`) e pinta com a rampa
 * SEQUENCIAL de data-viz do tema — antes era um gradiente `primary/20` em
 * classe do tema legado. A pintura vai em utility com token (regra 2.3), não
 * em `style`: a rampa é escolhida numa lista fechada, então cada classe existe
 * inteira no código e o Tailwind consegue gerá-la.
 */
import { Text } from '@astryxdesign/core/Text';
import type { ExpandableCardItem } from './types';

/** Rampas sequenciais usadas pelos exemplos. */
type SwatchRamp = 'blue' | 'teal' | 'purple';

/** Tarja: 3 passos de `--spacing-8` de altura e gradiente da rampa escolhida. */
const SWATCH_CLASS = 'block h-[calc(var(--spacing-8)_*_3)] rounded-[var(--radius-inner)]';

const RAMP_CLASS: Record<SwatchRamp, string> = {
  blue: 'bg-[image:linear-gradient(135deg,var(--color-data-blue-2),var(--color-data-blue-4))]',
  teal: 'bg-[image:linear-gradient(135deg,var(--color-data-teal-2),var(--color-data-teal-4))]',
  purple:
    'bg-[image:linear-gradient(135deg,var(--color-data-purple-2),var(--color-data-purple-4))]',
};

function Swatch({ ramp }: { ramp: SwatchRamp }) {
  return <span aria-hidden="true" className={`${SWATCH_CLASS} ${RAMP_CLASS[ramp]}`} />;
}

export const EXAMPLE_ITEMS: ExpandableCardItem[] = [
  {
    id: 'exemplo-arrecadacao',
    title: 'Relatório de Arrecadação',
    subtitle: 'Bar Chart',
    preview: <Swatch ramp="blue" />,
    content: (
      <Text type="body">
        Aqui o sub-bloco (por exemplo, um gráfico de barras) é renderizado em tamanho
        completo. Adicione filhos em <Text type="code">block.blocks</Text> para preencher
        os cards.
      </Text>
    ),
  },
  {
    id: 'exemplo-divida',
    title: 'Dívida Ativa',
    subtitle: 'Donut',
    preview: <Swatch ramp="teal" />,
    content: (
      <Text type="body">
        Cada card abre o seu próprio conteúdo num modal. Feche pelo botão, pela tecla Esc
        ou clicando fora.
      </Text>
    ),
  },
  {
    id: 'exemplo-despesas',
    title: 'Despesas por Órgão',
    subtitle: 'Tabela',
    preview: <Swatch ramp="purple" />,
    content: (
      <Text type="body">
        Use a prop <Text type="code">columns</Text> (1 a 4) para controlar quantos cards
        por linha aparecem na grade colapsada.
      </Text>
    ),
  },
];
