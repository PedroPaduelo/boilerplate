/**
 * MOVIMENTO — o gráfico pode animar a entrada AGORA?
 *
 * `02-configuracao-base.md` §3 manda todo desenho entrar em 360ms, com 120ms de
 * cascata entre séries. A duração e o atraso vivem no `chart-theme` e chegam
 * pelos props de `chart-axes`; o que falta é a pergunta anterior a eles: **este
 * usuário, neste ambiente, quer movimento?**
 *
 * ---------------------------------------------------------------------------
 * 1. ACESSIBILIDADE — `prefers-reduced-motion`
 * ---------------------------------------------------------------------------
 * Movimento não é decoração neutra: para quem tem sensibilidade vestibular,
 * enxaqueca com aura ou transtorno de atenção, uma tela em que dez barras
 * crescem ao mesmo tempo é um problema real (WCAG 2.3.3, "Animation from
 * Interactions"). O sistema operacional já expõe essa preferência, e o CSS do
 * app a respeita — os gráficos, que são a parte mais animada do produto, não
 * respeitavam.
 *
 * A consulta é `(prefers-reduced-motion: no-preference)`, e não a negação de
 * `reduce`, de propósito: assim MOVIMENTO É OPT-IN. Ambiente que não sabe
 * responder (SSR, ambiente de teste, navegador antigo) não recebe animação —
 * o que é a escolha segura, porque animação sem quadro seguinte é justamente
 * um gráfico que aparece vazio.
 *
 * ---------------------------------------------------------------------------
 * 2. EFEITO COLATERAL BEM-VINDO — o primeiro quadro passa a existir
 * ---------------------------------------------------------------------------
 * O recharts anima BARRA pela GEOMETRIA: no quadro 0 a barra tem largura (ou
 * altura) zero, e um retângulo de lado zero não é desenhado. Ou seja: durante
 * o primeiro quadro, um gráfico de barras não tem barra nenhuma no DOM.
 *
 * Isso não incomoda em tela — o quadro seguinte chega em 16ms —, mas incomoda
 * em toda leitura SÍNCRONA do desenho: a auditoria de inércia do catálogo
 * (`render-engine/catalog/__audit__`) renderizava, lia o HTML na hora e
 * concluía que `palette` e `accent` da barra horizontal "não mudam a tela" —
 * quando o que não existia ainda era a barra. Com movimento desligado nesses
 * ambientes, o desenho nasce completo e a leitura passa a ser sobre o gráfico,
 * não sobre o momento em que se olhou.
 *
 * Em navegador, para quem não pediu redução, NADA muda: a entrada continua
 * sendo os 360ms da referência.
 */
import { useMediaQuery } from '@astryxdesign/core/hooks';

/**
 * Consulta que descreve "o usuário não pediu para reduzir movimento".
 *
 * Usada na afirmativa (e não `(prefers-reduced-motion: reduce)` negada) para
 * que o desconhecido caia no lado sem movimento — ver o cabeçalho.
 */
const MOTION_ALLOWED = '(prefers-reduced-motion: no-preference)';

/**
 * O gráfico deve animar a entrada?
 *
 * Passe o resultado para `isAnimationActive` DEPOIS de espalhar
 * `chartAnimationProps(palette, index)` — a duração e a cascata continuam sendo
 * as da referência; esta é só a chave geral.
 *
 * @example
 * const isAnimationActive = useChartMotion();
 * <Bar {...chartAnimationProps(palette, index)} isAnimationActive={isAnimationActive} />
 */
export function useChartMotion(): boolean {
  return useMediaQuery(MOTION_ALLOWED);
}
