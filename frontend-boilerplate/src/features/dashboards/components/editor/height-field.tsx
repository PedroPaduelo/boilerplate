/**
 * O controle de ALTURA — a decisão que faltava no editor.
 *
 * Até aqui a altura de um bloco era 100% derivada do TIPO (um gráfico de série
 * pede 500px, um KPI pede 160px). É um bom padrão e continua sendo o default —
 * mas era também uma parede: quem montava o dashboard não tinha como dizer
 * "esta linha aqui precisa ser mais alta", que é exatamente a queixa que
 * originou este componente.
 *
 * O desenho copia deliberadamente o editor de painéis do Grafana ("Row height:
 * Standard | Short | Tall | Custom"), porque ele resolve a tensão certa: a
 * maioria das pessoas quer um TAMANHO, não um número — e uma minoria quer o
 * número exato. Daí a lista de degraus com uma saída para pixels, e não um
 * campo numérico solto.
 *
 * Por que o degrau vem primeiro na lista: ele é uma REFERÊNCIA à calibragem do
 * motor (`block-sizing`, medida no navegador), então acompanha qualquer
 * recalibragem futura. Um número gravado no JSON congela para sempre — inclusive
 * o erro.
 */
import { useState } from 'react';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import type { SelectorOptionData } from '@astryxdesign/core/Selector';
import { VStack } from '@astryxdesign/core/Layout';
import {
  BLOCK_HEIGHT_PX_MAX,
  BLOCK_HEIGHT_PX_MIN,
  BLOCK_ROW_HEIGHT,
} from '@/shared/render-engine';
import type { BlockHeight } from '../../lib/layout-editor';

/** Valor do seletor quando o autor quer digitar o número. */
const CUSTOM = '__custom';
/** Valor do seletor quando NADA está declarado (o motor decide). */
const INHERIT = '__inherit';

/** Altura sugerida ao entrar no modo personalizado, se não havia número antes. */
const CUSTOM_SEED = BLOCK_ROW_HEIGHT.default;

export interface HeightFieldProps {
  label: string;
  /** Altura declarada; `undefined` = nada declarado. */
  value: BlockHeight | undefined;
  /**
   * Rótulo da opção "nada declarado". Muda com o contexto e a diferença
   * importa: na LINHA, ausência significa "derive dos tipos"; no BLOCO,
   * significa "herde a altura da linha".
   */
  inheritLabel: string;
  /** Explicação da opção de ausência — vira `description` do campo. */
  inheritDescription: string;
  onChange: (height: BlockHeight | undefined) => void;
}

/** Degraus nomeados, com o px MEDIDO ao lado: a escolha deixa de ser às cegas. */
const STEP_OPTIONS: SelectorOptionData[] = [
  { value: 'auto', label: 'Ajustar ao conteúdo' },
  { value: 'compact', label: `Compacta — ${BLOCK_ROW_HEIGHT.compact} px` },
  { value: 'default', label: `Padrão — ${BLOCK_ROW_HEIGHT.default} px` },
  { value: 'tall', label: `Alta — ${BLOCK_ROW_HEIGHT.tall} px` },
];

export function HeightField({
  label,
  value,
  inheritLabel,
  inheritDescription,
  onChange,
}: HeightFieldProps) {
  const isCustom = typeof value === 'number';
  /**
   * O modo personalizado precisa sobreviver ao clique que o ativa: entre
   * escolher "Personalizada…" e digitar o primeiro número, `value` ainda não é
   * um número. Sem este estado o seletor voltaria sozinho para a opção
   * anterior — o campo "pularia" na frente do usuário.
   */
  const [wantsCustom, setWantsCustom] = useState(false);
  const showNumber = isCustom || wantsCustom;

  const selectValue = showNumber ? CUSTOM : (value ?? INHERIT);

  const options: SelectorOptionData[] = [
    { value: INHERIT, label: inheritLabel },
    ...STEP_OPTIONS,
    { value: CUSTOM, label: 'Personalizada…' },
  ];

  const handleSelect = (next: string) => {
    if (next === CUSTOM) {
      setWantsCustom(true);
      // Já grava um número: o preview reage na hora, e o campo abaixo nasce
      // preenchido em vez de vazio esperando um palpite.
      onChange(typeof value === 'number' ? value : CUSTOM_SEED);
      return;
    }
    setWantsCustom(false);
    onChange(next === INHERIT ? undefined : (next as BlockHeight));
  };

  return (
    <VStack gap={2}>
      <Selector
        label={label}
        size="sm"
        width="100%"
        value={selectValue}
        options={options}
        description={selectValue === INHERIT ? inheritDescription : undefined}
        onChange={handleSelect}
      />
      {showNumber ? (
        <NumberInput
          label={`${label} em pixels`}
          size="sm"
          width={160}
          min={BLOCK_HEIGHT_PX_MIN}
          max={BLOCK_HEIGHT_PX_MAX}
          step={20}
          isIntegerOnly
          value={typeof value === 'number' ? value : CUSTOM_SEED}
          description={`Entre ${BLOCK_HEIGHT_PX_MIN} e ${BLOCK_HEIGHT_PX_MAX} px.`}
          onChange={(next: number) => onChange(next)}
        />
      ) : null}
    </VStack>
  );
}
