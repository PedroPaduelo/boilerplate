/**
 * Variações de fixture do bloco `graph_chart` (shape `table`).
 *
 * Um grafo muda de cara conforme a TOPOLOGIA do dado, não conforme a prop:
 * uma rede de vínculos com aglomerados, um funil de camadas e uma rede pequena
 * pedem leituras diferentes do mesmo componente. As três estão aqui para que dê
 * para trocar entre elas no painel "Dados" do playground e ver o layout
 * responder.
 *
 * A variante `default` REUSA a fixture oficial do bloco em vez de copiá-la (a
 * convenção deste arquivo). O motivo é específico: aquela fixture tem ~360
 * linhas GERADAS por uma função determinística; uma cópia literal seria um
 * arquivo de 40 KB que nasceria desatualizado na primeira mudança do gerador.
 * Importar garante a paridade que a cópia só promete.
 */
import {
  fixture as graphFixture,
  funnelFixture,
} from '@/shared/render-engine/catalog/graph_chart/fixture';
import type { FixtureVariant } from './types';

/* -------------------------------------------------------------------------- */
/*  Bloco: graph_chart (shape: table)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Rede pequena — só a lista de ARESTAS, sem declarar um nó sequer. Prova na
 * tela a tolerância do bloco: id citado em `origem`/`destino` vira nó sozinho,
 * então um fluxo simples cabe numa consulta só.
 */
const small = {
  columns: [
    { key: 'origem', label: 'origem', type: 'string' },
    { key: 'destino', label: 'destino', type: 'string' },
    { key: 'valor', label: 'valor', type: 'number' },
  ],
  rows: [
    { origem: 'Auditoria', destino: 'Notificação', valor: 1200 },
    { origem: 'Notificação', destino: 'Defesa', valor: 480 },
    { origem: 'Notificação', destino: 'Pagamento', valor: 610 },
    { origem: 'Defesa', destino: 'Julgamento', valor: 430 },
    { origem: 'Julgamento', destino: 'Inscrição em DA', valor: 260 },
    { origem: 'Julgamento', destino: 'Cancelamento', valor: 170 },
    { origem: 'Inscrição em DA', destino: 'Execução fiscal', valor: 190 },
    { origem: 'Inscrição em DA', destino: 'Parcelamento', valor: 70 },
  ],
};

export const GRAPH_CHART_VARIANTS: FixtureVariant[] = [
  {
    id: 'default',
    label: 'Rede de vínculos',
    description:
      '8 aglomerados de contribuintes (~180 nós) com vínculos cruzados — o cenário de volume, para `layout: "force"`.',
    data: graphFixture,
  },
  {
    id: 'funnel',
    label: 'Funil de camadas',
    description:
      'Lançamento → cobrança → desfecho → situação, com `camada` declarada. Troque o layout para "layered".',
    data: funnelFixture,
  },
  {
    id: 'edges-only',
    label: 'Só arestas',
    description:
      'Nenhum nó declarado: o bloco cria os nós citados em origem/destino. É a consulta mais curta possível.',
    data: small,
  },
];
