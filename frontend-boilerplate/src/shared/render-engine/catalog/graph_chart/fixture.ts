/**
 * Fixture do bloco `graph_chart` — casa com o dataContract (shape 'table').
 *
 * É um FUNIL DE CAMADAS de verdade (o caso que motivou o bloco): o crédito
 * nasce no lançamento e se abre em desfechos, camada a camada, com o volume de
 * cada caminho na aresta. Serve para os três layouts — em `force` vira a rede,
 * em `layered` vira o funil da esquerda para a direita, em `radial` vira os
 * anéis — e é o dado que a galeria do catálogo mostra.
 *
 * A coluna `camada` está declarada de propósito, para servir de exemplo
 * copiável. Sem ela, o bloco deduz a mesma coisa a partir das arestas.
 */
import type { TableData } from '@dashboards/contracts';

export const fixture: TableData = {
  columns: [
    { key: 'tipo', label: 'tipo', type: 'string' },
    { key: 'id', label: 'id', type: 'string' },
    { key: 'rotulo', label: 'rotulo', type: 'string' },
    { key: 'grupo', label: 'grupo', type: 'string' },
    { key: 'camada', label: 'camada', type: 'number' },
    { key: 'origem', label: 'origem', type: 'string' },
    { key: 'destino', label: 'destino', type: 'string' },
    { key: 'valor', label: 'valor', type: 'number' },
  ],
  rows: [
    // --- nós -------------------------------------------------------------
    {
      tipo: 'no',
      id: 'lancado',
      rotulo: 'Lançado',
      grupo: 'N1 · Lançamento',
      camada: 0,
      valor: 10835362,
    },
    {
      tipo: 'no',
      id: 'pago',
      rotulo: 'Pago',
      grupo: 'N2 · Cobrança',
      camada: 1,
      valor: 8060686,
    },
    {
      tipo: 'no',
      id: 'inscrito',
      rotulo: 'Inscrito em DA',
      grupo: 'N2 · Cobrança',
      camada: 1,
      valor: 2774676,
    },
    {
      tipo: 'no',
      id: 'parcelado',
      rotulo: 'Parcelado',
      grupo: 'N3 · Desfecho',
      camada: 2,
      valor: 900000,
    },
    {
      tipo: 'no',
      id: 'ajuizado',
      rotulo: 'Ajuizado',
      grupo: 'N3 · Desfecho',
      camada: 2,
      valor: 1200000,
    },
    {
      tipo: 'no',
      id: 'prescrito',
      rotulo: 'Prescrito',
      grupo: 'N3 · Desfecho',
      camada: 2,
      valor: 674676,
    },
    {
      tipo: 'no',
      id: 'quitado',
      rotulo: 'Quitado',
      grupo: 'N4 · Situação',
      camada: 3,
      valor: 600000,
    },
    {
      tipo: 'no',
      id: 'estoque',
      rotulo: 'Em estoque',
      grupo: 'N4 · Situação',
      camada: 3,
      valor: 1500000,
    },
    // --- arestas ---------------------------------------------------------
    { tipo: 'aresta', origem: 'lancado', destino: 'pago', valor: 8060686 },
    { tipo: 'aresta', origem: 'lancado', destino: 'inscrito', valor: 2774676 },
    { tipo: 'aresta', origem: 'inscrito', destino: 'parcelado', valor: 900000 },
    { tipo: 'aresta', origem: 'inscrito', destino: 'ajuizado', valor: 1200000 },
    { tipo: 'aresta', origem: 'inscrito', destino: 'prescrito', valor: 674676 },
    { tipo: 'aresta', origem: 'parcelado', destino: 'quitado', valor: 600000 },
    { tipo: 'aresta', origem: 'parcelado', destino: 'estoque', valor: 300000 },
    { tipo: 'aresta', origem: 'ajuizado', destino: 'estoque', valor: 1200000 },
  ],
};
