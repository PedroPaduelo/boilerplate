/**
 * A LINGUAGEM DE COMPOSIÇÃO da resposta — o que permite contar uma história.
 *
 * ## O problema que isto resolve
 *
 * A resposta era montada assim: todo o texto, e depois todos os gráficos.
 * Estruturalmente incapaz de narrar. O arco que o produto promete —
 * conclusão, EVIDÊNCIA, leitura do dado — não cabe num layout onde a evidência
 * só pode aparecer no fim: numa resposta com sete gráficos, o usuário lia um
 * texto inteiro e depois recebia sete cartões empilhados, sem saber qual
 * sustentava qual afirmação. Nenhum ajuste de prompt conserta isso, porque o
 * problema não é o que o agente escreve — é onde a tela pode desenhar.
 *
 * ## O contrato
 *
 * O agente escreve `[[grafico:N]]` numa linha própria, no ponto em que aquele
 * gráfico entra na narrativa (N é a ordem de criação, começando em 1):
 *
 *     **As mensagens caíram 32% em julho.**
 *
 *     [[grafico:1]]
 *
 *     O que chama atenção:
 *     - ...
 *
 * A marca é feia de propósito: `[[…]]` não aparece em texto de negócio, então
 * não há risco de o usuário escrever algo que vire gráfico por acidente.
 *
 * ## As três garantias
 *
 * 1. **Nada se perde.** Gráfico que o texto não ancorou vai para o fim, como
 *    antes. Uma resposta sem marca nenhuma se comporta exatamente como se
 *    comportava — o recurso é progressivo, não uma troca de regime.
 * 2. **Nada vira lixo.** Marca apontando para gráfico inexistente (o modelo
 *    errou o número, ou o gráfico falhou) é removida do texto em vez de
 *    aparecer crua na tela.
 * 3. **Nada pisca durante o streaming.** O texto chega em pedaços, então a
 *    marca chega pela metade (`[[gra`). Um fragmento assim é escondido até
 *    fechar, senão o usuário vê `[[gra` surgir e sumir a cada delta.
 */

/** Ordem de criação do gráfico, 1-based, como o agente a enxerga. */
const MARCA = /\[\[\s*gr[áa]fico\s*:\s*(\d+)\s*\]\]/gi;

/**
 * Fragmento de marca ainda incompleto no FIM do texto — só interessa no fim,
 * porque no meio significa que o usuário escreveu `[[` de verdade.
 */
const MARCA_PARCIAL = /\[\[[^\]]{0,20}$/;

export type SegmentoDaResposta =
  | { tipo: 'texto'; conteudo: string }
  | { tipo: 'grafico'; indice: number };

export interface RespostaComposta {
  /** Texto e gráficos na ordem em que devem ser desenhados. */
  segmentos: SegmentoDaResposta[];
  /** Gráficos que o texto não ancorou — vão para o fim, na ordem original. */
  graficosSoltos: number[];
}

/**
 * Divide o texto da resposta nos pontos onde o agente ancorou um gráfico.
 *
 * @param texto Markdown da resposta, possivelmente com marcas.
 * @param totalDeGraficos Quantos gráficos a mensagem tem, para validar as marcas.
 * @param isStreaming Enquanto verdadeiro, esconde marca pela metade no fim.
 */
export function comporResposta(
  texto: string,
  totalDeGraficos: number,
  isStreaming = false,
): RespostaComposta {
  const limpo = isStreaming ? texto.replace(MARCA_PARCIAL, '') : texto;

  const segmentos: SegmentoDaResposta[] = [];
  const ancorados = new Set<number>();
  let cursor = 0;

  // `matchAll` sobre uma regex global: o índice de cada acerto delimita o texto
  // que veio antes dele.
  for (const acerto of limpo.matchAll(MARCA)) {
    const indice = Number(acerto[1]) - 1;
    const posicao = acerto.index ?? 0;

    // Marca inválida (fora do intervalo) ou repetida some junto com o texto que
    // a cerca: repetir o mesmo gráfico duas vezes na mesma resposta é sempre
    // engano do modelo, e desenhar duas cópias confundiria mais que a ausência.
    const ehValida =
      Number.isInteger(indice) &&
      indice >= 0 &&
      indice < totalDeGraficos &&
      !ancorados.has(indice);

    empurrarTexto(segmentos, limpo.slice(cursor, posicao));
    cursor = posicao + acerto[0].length;

    if (!ehValida) continue;
    ancorados.add(indice);
    segmentos.push({ tipo: 'grafico', indice });
  }

  empurrarTexto(segmentos, limpo.slice(cursor));

  const graficosSoltos: number[] = [];
  for (let indice = 0; indice < totalDeGraficos; indice += 1) {
    if (!ancorados.has(indice)) graficosSoltos.push(indice);
  }

  return { segmentos, graficosSoltos };
}

/**
 * Acrescenta um trecho de texto, ignorando o que sobrou só de espaço em branco.
 *
 * Sem isto, a linha em branco que cerca a marca viraria um `Markdown` vazio
 * entre dois gráficos — um buraco de espaçamento no meio da resposta.
 */
function empurrarTexto(segmentos: SegmentoDaResposta[], bruto: string): void {
  const conteudo = bruto.trim();
  if (conteudo === '') return;
  segmentos.push({ tipo: 'texto', conteudo });
}

/** A resposta usa a linguagem de composição? Útil para decidir o espaçamento. */
export function temGraficoAncorado(composta: RespostaComposta): boolean {
  return composta.segmentos.some((segmento) => segmento.tipo === 'grafico');
}
