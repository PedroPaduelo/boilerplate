/**
 * O CORPO da resposta do agente: texto e gráficos intercalados.
 *
 * Antes, a resposta era um bloco de texto seguido de todos os gráficos. Numa
 * pergunta que rende sete, o usuário lia a análise inteira e só então recebia
 * sete cartões empilhados, sem saber qual sustentava qual afirmação — o texto
 * dizia "a queda se concentra em um canal" e a evidência disso estava a três
 * rolagens de distância. Anexo, não narrativa.
 *
 * Aqui o gráfico entra no ponto em que o texto fala dele, guiado pelas marcas
 * `[[grafico:N]]` que o agente escreve (ver `lib/response-composition.ts`).
 * O que não foi ancorado continua indo para o fim: uma resposta sem marca
 * nenhuma se desenha exatamente como antes.
 */
import { useMemo } from 'react';
import { Markdown } from '@astryxdesign/core/Markdown';
import { VStack } from '@astryxdesign/core/Stack';
import type { ChatChartPayload } from '../transport';
import { comporResposta } from '../lib/response-composition';
import { InlineChart, InlineCharts } from './inline-chart';

export interface ResponseBodyProps {
  /** Markdown da resposta, possivelmente com marcas de gráfico. */
  text: string;
  charts: readonly ChatChartPayload[];
  messageId: string;
  isStreaming?: boolean;
}

export function ResponseBody({
  text,
  charts,
  messageId,
  isStreaming = false,
}: ResponseBodyProps) {
  const { segmentos, graficosSoltos } = useMemo(
    () => comporResposta(text, charts.length, isStreaming),
    [text, charts.length, isStreaming],
  );

  return (
    <VStack gap={3}>
      {segmentos.map((segmento, posicao) =>
        segmento.tipo === 'texto' ? (
          /* `headingLevelStart={3}` mantém a hierarquia: o título da conversa é
             o h1 da tela e os cabeçalhos da resposta vêm abaixo dele.
             `isStreaming` só no ÚLTIMO trecho — é onde o texto ainda cresce. */
          <Markdown
            key={`t${posicao}`}
            density="compact"
            headingLevelStart={3}
            isStreaming={isStreaming && posicao === segmentos.length - 1}
          >
            {segmento.conteudo}
          </Markdown>
        ) : (
          <InlineChart
            key={`c${segmento.indice}`}
            chart={charts[segmento.indice]!}
            isEntering={isStreaming}
          />
        ),
      )}

      {/* Sobras: material de apoio que o texto não ancorou. Vão juntas para o
          fim, onde o agrupamento de cartões compactos ainda vale a pena. */}
      {graficosSoltos.length > 0 ? (
        <InlineCharts
          charts={graficosSoltos.map((indice) => charts[indice]!)}
          messageId={messageId}
          isEntering={isStreaming}
        />
      ) : null}
    </VStack>
  );
}
