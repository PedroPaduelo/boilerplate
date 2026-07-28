/**
 * Sugestões de partida para uma conversa vazia.
 *
 * Interface conversacional sofre do "blank slate": a caixa de texto aceita
 * qualquer coisa, então o usuário não sabe o que a ferramenta consegue fazer e
 * trava. Cada cartão abaixo demonstra UMA das quatro capacidades do agente
 * (explorar o schema, agregar, visualizar e auditar integridade) já no tom de
 * auditoria do produto — e o texto do cartão é a pergunta que será enviada,
 * porque um clique já envia: o usuário precisa ver exatamente o que vai pedir.
 *
 * As perguntas falam em "conexões" no plural: quem usa o produto costuma ter
 * várias, e o singular fazia o agente parecer limitado a uma.
 */
import { BarChart3, Database, ShieldCheck, Sigma } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SuggestedPrompt {
  icon: LucideIcon;
  title: string;
  prompt: string;
}

export const SUGGESTED_PROMPTS: readonly SuggestedPrompt[] = [
  {
    icon: Database,
    title: 'Explorar o schema',
    prompt:
      'Quais tabelas existem nas minhas conexões e o que cada uma registra? Comece pela conexão com mais dados.',
  },
  {
    icon: Sigma,
    title: 'Somar e comparar',
    prompt:
      'Some os valores por mês nos últimos 12 meses e compare com o mesmo período do ano anterior.',
  },
  {
    icon: BarChart3,
    title: 'Gerar um gráfico',
    prompt: 'Monte um gráfico de barras com o total por mês no último ano.',
  },
  {
    icon: ShieldCheck,
    title: 'Auditar integridade',
    prompt:
      'Procure registros duplicados e campos obrigatórios vazios. Mostre a contagem por tabela e o SQL usado.',
  },
];
