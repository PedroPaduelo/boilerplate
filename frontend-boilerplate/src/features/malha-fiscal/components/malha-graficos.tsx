/**
 * Os quatro ângulos da irregularidade — e a porta de entrada da fiscalização.
 *
 * Cada gráfico responde uma pergunta diferente sobre o MESMO conjunto de
 * contribuintes: por que caiu (critério), quando aconteceu (competência),
 * quanto pesa (faixa) e onde parou (funil). Os três primeiros SELECIONAM: o
 * clique vira recorte, e o recorte vira o lote de fiscalização.
 *
 * O funil não seleciona de propósito — ele descreve o estágio da cobrança dos
 * casos já retidos, que é leitura de acompanhamento, não critério de seleção.
 */
import { Grid } from '@astryxdesign/core/Grid';
import { BarChart, DonutChart, HBarChart } from '@/shared/ui';
import { formatCompactBRL, formatNumberBR } from '@/shared/lib/format';
import type { CriterioId, EscopoMalha, FaixaId, PainelMalha } from '../types';
import { GraficoCard } from './grafico-card';

export interface MalhaGraficosProps {
  painel: PainelMalha | undefined;
  isLoading: boolean;
  /** Aplica (ou remove, se repetido) uma dimensão do recorte. */
  onAlternar: (patch: EscopoMalha) => void;
}

export function MalhaGraficos({ painel, isLoading, onAlternar }: MalhaGraficosProps) {
  const porCriterio = painel?.porCriterio ?? [];
  const porCompetencia = painel?.porCompetencia ?? [];
  const porFaixa = painel?.porFaixa ?? [];
  const funil = painel?.funil ?? [];

  const totalCriterio = porCriterio.reduce((total, item) => total + item.valor, 0);

  return (
    <Grid columns={{ minWidth: 420, max: 2 }} gap={5}>
      <GraficoCard
        titulo="Diferença por critério"
        descricao="Qual irregularidade concentra o valor apurado"
        acao="Clique numa fatia para filtrar"
      >
        <DonutChart
          label="Diferença apurada por critério de irregularidade"
          data={porCriterio.map((item) => ({ label: item.rotulo, value: item.valor }))}
          centerValue={formatCompactBRL(totalCriterio)}
          centerCaption="Diferença apurada"
          valueFormatter={formatCompactBRL}
          isLoading={isLoading}
          emptyMessage="Nenhum contribuinte no recorte selecionado"
          onSelect={(_point, index) => {
            const item = porCriterio[index];
            if (item) onAlternar({ criterio: item.chave as CriterioId });
          }}
        />
      </GraficoCard>

      <GraficoCard
        titulo="Evolução por competência"
        descricao="Diferença rateada entre os períodos de apuração"
        acao="Clique numa coluna para filtrar"
      >
        <BarChart
          label="Diferença apurada por competência"
          series={[
            {
              label: 'Diferença apurada',
              data: porCompetencia.map((item) => item.valor),
            },
          ]}
          labels={porCompetencia.map((item) => item.rotulo)}
          showLegend={false}
          valueFormatter={formatCompactBRL}
          isLoading={isLoading}
          emptyMessage="Nenhum período com diferença apurada"
          onSelect={(_label, index) => {
            const item = porCompetencia[index];
            if (item) onAlternar({ competencia: item.chave });
          }}
        />
      </GraficoCard>

      <GraficoCard
        titulo="Materialidade"
        descricao="Quantos contribuintes há em cada faixa de diferença"
        acao="Clique numa barra para filtrar"
      >
        <HBarChart
          label="Contribuintes por faixa de materialidade"
          data={porFaixa.map((item) => ({ label: item.rotulo, value: item.contribuintes }))}
          categoryWidth={150}
          valueFormatter={(valor) => formatNumberBR(valor, 0)}
          isLoading={isLoading}
          emptyMessage="Nenhum contribuinte no recorte selecionado"
          onSelect={(_point, index) => {
            const item = porFaixa[index];
            if (item) onAlternar({ faixa: item.chave as FaixaId });
          }}
        />
      </GraficoCard>

      <GraficoCard
        titulo="Funil de autorregularização"
        descricao="Em que estágio da cobrança os retidos estão"
      >
        <HBarChart
          label="Contribuintes por estágio da cobrança"
          data={funil.map((item) => ({ label: item.rotulo, value: item.contribuintes }))}
          categoryWidth={170}
          hasColorByCategory
          valueFormatter={(valor) => formatNumberBR(valor, 0)}
          isLoading={isLoading}
          emptyMessage="Nenhum contribuinte no recorte selecionado"
        />
      </GraficoCard>
    </Grid>
  );
}
