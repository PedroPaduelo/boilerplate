/**
 * Os quatro números que abrem a tela — e que mudam JUNTO com o recorte
 * selecionado nos gráficos.
 *
 * Nenhum deles tem seta de tendência: a base de comparação seria "a mesma
 * malha no mês passado", que não existe para um recorte montado agora. Em vez
 * de uma variação inventada, cada card carrega o denominador no texto de apoio
 * — que é a informação que o auditor de fato usa.
 */
import { Building2, Coins, Landmark, ShieldCheck } from 'lucide-react';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { KpiCard } from '@/shared/ui';
import {
  formatCompactBRL,
  formatNumberBR,
  formatPercentBR,
} from '@/shared/lib/format';
import type { ResumoMalha } from '../types';

export interface MalhaKpisProps {
  resumo: ResumoMalha | undefined;
  isLoading: boolean;
}

export function MalhaKpis({ resumo, isLoading }: MalhaKpisProps) {
  const estado = isLoading || !resumo ? 'loading' : 'success';

  return (
    <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
      <KpiCard
        label="Contribuintes retidos"
        value={resumo?.contribuintes ?? 0}
        icon={<Icon icon={Building2} size="lg" color="inherit" />}
        variant="blue"
        state={estado}
        hint={`${formatNumberBR(resumo?.reincidentes ?? 0, 0)} já caíram em malha anterior`}
        slot="malha-kpi-contribuintes"
      />

      <KpiCard
        label="Diferença apurada"
        value={resumo?.diferencaTotal ?? 0}
        displayValue={formatCompactBRL(resumo?.diferencaTotal ?? 0)}
        icon={<Icon icon={Coins} size="lg" color="inherit" />}
        variant="orange"
        state={estado}
        hint={`Média de ${formatCompactBRL(resumo?.ticketMedio ?? 0)} por contribuinte`}
        slot="malha-kpi-diferenca"
      />

      <KpiCard
        label="ISS a recuperar"
        value={resumo?.issTotal ?? 0}
        displayValue={formatCompactBRL(resumo?.issTotal ?? 0)}
        icon={<Icon icon={Landmark} size="lg" color="inherit" />}
        variant="green"
        state={estado}
        hint="Estimativa sobre a diferença, pela alíquota efetiva"
        slot="malha-kpi-iss"
      />

      <KpiCard
        label="Autorregularização"
        value={(resumo?.taxaAutorregularizacao ?? 0) * 100}
        displayValue={formatPercentBR(resumo?.taxaAutorregularizacao ?? 0)}
        icon={<Icon icon={ShieldCheck} size="lg" color="inherit" />}
        variant="cyan"
        state={estado}
        hint="Retificaram e pagaram, entre os notificados"
        slot="malha-kpi-autorregularizacao"
      />
    </Grid>
  );
}
