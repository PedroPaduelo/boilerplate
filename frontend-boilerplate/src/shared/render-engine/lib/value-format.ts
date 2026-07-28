/**
 * Política de FORMATO DE VALOR do catálogo — o que um bloco faz quando o autor
 * (agente/backend) NÃO declarou `valueFormat`.
 *
 * Por que existe: o default histórico dos blocos de gráfico era `compactBRL`,
 * então todo bloco que não declarasse formato virava dinheiro. Contagem de
 * eventos de webhook aparecia como "R$ 11,19 mil" (doc `composicao-da-resposta`
 * §1, sintoma 8) — o número certo com a unidade errada, que é pior do que
 * número nenhum: quem lê acredita, e a tela some com a única pista de que
 * aquilo não é dinheiro.
 *
 * A regra (doc §6): o formato acompanha a NATUREZA da medida — contagem é
 * número ("15.254"), dinheiro é moeda ("R$ 2,6 mi"), proporção é percentual.
 * Só quem escreveu a consulta sabe a natureza do que mediu; logo o default
 * seguro é o mais neutro (número), e MOEDA VIRA ESCOLHA EXPLÍCITA. A assimetria
 * é intencional: declarar `valueFormat: 'BRL'` custa uma linha, enquanto
 * desmentir um "R$" que ninguém pediu custa a confiança no dado.
 *
 * Vive no render-engine, e não em `shared/lib/format`, porque é política do
 * CATÁLOGO e não da formatação: `formatValueByEnum` continua um tradutor puro
 * de enum → string, sem opinião sobre o que fazer quando não lhe dizem nada.
 * Por isso todo bloco resolve o formato AQUI antes de chamar o tradutor — em
 * vez de deixá-lo cair no default interno dele.
 */
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';

/**
 * Formato usado quando o bloco não declara `valueFormat`.
 *
 * `number` (e não `compactNumber`) porque o doc §6 exemplifica contagem como
 * "15.254": em um card de resposta, a contagem exata é a informação; abreviar
 * para "15,3 mil" joga fora precisão que ninguém pediu para perder. Quem tem
 * eixo apertado ou grandeza de bilhões escolhe `compactNumber`.
 */
export const CATALOG_VALUE_FORMAT_DEFAULT: ValueFormat = 'number';

/** Formatos que carregam símbolo de moeda — os que exigem escolha explícita. */
const CURRENCY_FORMATS = new Set<ValueFormat>(['BRL', 'compactBRL']);

/**
 * Resolve o `valueFormat` declarado no bloco para o formato efetivo.
 *
 * Aceita `unknown` porque o valor vem do payload do agente: a AJV valida na
 * borda, mas um bloco antigo (ou um agente novo) pode mandar qualquer coisa —
 * e um formato desconhecido deve degradar para o default neutro, nunca derrubar
 * o render nem reintroduzir moeda por acidente.
 */
export function resolveValueFormat(raw: unknown): ValueFormat {
  return typeof raw === 'string' && isValueFormat(raw)
    ? raw
    : CATALOG_VALUE_FORMAT_DEFAULT;
}

/** Formata um valor aplicando a política de default do catálogo. */
export function formatCatalogValue(value: unknown, raw: unknown): string {
  return formatValueByEnum(value, resolveValueFormat(raw));
}

/** O formato efetivo deste bloco é monetário? */
export function isCurrencyFormat(raw: unknown): boolean {
  return CURRENCY_FORMATS.has(resolveValueFormat(raw));
}

/**
 * Unidade legível do formato, para o subtítulo de recorte do card ("valores em
 * R$"). Contagem devolve `undefined` DE PROPÓSITO: "em números" não informa
 * nada e ainda ocuparia a linha que deveria dizer período ou filtro.
 */
export function describeValueFormat(raw: unknown): string | undefined {
  switch (resolveValueFormat(raw)) {
    case 'BRL':
    case 'compactBRL':
      return 'valores em R$';
    case 'percent':
      return 'valores em %';
    default:
      return undefined;
  }
}

/** `true` se a string é um dos formatos canônicos do design system. */
function isValueFormat(raw: string): raw is ValueFormat {
  return (
    raw === 'BRL' ||
    raw === 'compactBRL' ||
    raw === 'number' ||
    raw === 'compactNumber' ||
    raw === 'percent'
  );
}
