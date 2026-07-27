/**
 * Sugestões de partida para uma conversa vazia.
 *
 * Interface conversacional sofre do "blank slate": a caixa de texto aceita
 * qualquer coisa, então o usuário não sabe o que a ferramenta consegue fazer e
 * trava. As sugestões abaixo demonstram as QUATRO capacidades do agente
 * (explorar schema, agregar, visualizar e auditar integridade) já no tom de
 * auditoria do produto.
 */
import { BarChart3, Database, ShieldCheck, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SuggestedPrompt {
  icon: LucideIcon;
  title: string;
  prompt: string;
}

export const SUGGESTED_PROMPTS: readonly SuggestedPrompt[] = [
  {
    icon: Database,
    title: 'Entender os dados',
    prompt: 'Quais tabelas existem na minha conexão e o que cada uma representa?',
  },
  {
    icon: TrendingUp,
    title: 'Achar anomalias',
    prompt:
      'Quais lançamentos fogem do padrão nos últimos 90 dias? Traga os 10 maiores desvios.',
  },
  {
    icon: BarChart3,
    title: 'Gerar um gráfico',
    prompt: 'Monte um gráfico de barras com o total por mês no último ano.',
  },
  {
    icon: ShieldCheck,
    title: 'Checar integridade',
    prompt:
      'Existem registros duplicados ou com campos obrigatórios vazios? Mostre a contagem por tabela.',
  },
];
