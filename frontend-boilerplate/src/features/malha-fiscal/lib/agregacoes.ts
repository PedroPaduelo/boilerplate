/**
 * Funções PURAS de recorte e agregação.
 *
 * Tudo que a tela mostra sai daqui — e sai da MESMA lista. É o que garante que
 * o número do card, a fatia da rosca e a linha da tabela concordem: não há duas
 * fontes, há uma lista filtrada e várias leituras dela.
 */
import type {
  ContribuinteRetido,
  Desfecho,
  EscopoMalha,
  ItemSerie,
  ResumoMalha,
} from '../types';
import { apenasDigitos } from './cnpj';
import {
  CRITERIOS,
  FAIXAS,
  ORDEM_FUNIL,
  ROTULO_DESFECHO,
  faixaDoValor,
  formatPA,
} from './dominio';

/** Aplica o recorte selecionado nos gráficos. Escopo vazio devolve tudo. */
export function filtrarPorEscopo(
  base: ContribuinteRetido[],
  escopo: EscopoMalha,
): ContribuinteRetido[] {
  return base.filter((c) => {
    if (escopo.criterio && c.criterio !== escopo.criterio) return false;
    if (escopo.competencia && !c.competencias.includes(escopo.competencia)) return false;
    if (escopo.faixa && faixaDoValor(c.diferenca).id !== escopo.faixa) return false;
    if (escopo.risco && c.risco !== escopo.risco) return false;
    return true;
  });
}

/**
 * Busca textual tolerante: ignora acento, caixa e pontuação do CNPJ — quem
 * copia um CNPJ de outro sistema cola com pontos, e quem digita o nome não
 * digita o acento.
 */
export function buscarContribuintes(
  lista: ContribuinteRetido[],
  termo: string,
): ContribuinteRetido[] {
  const alvo = termo.trim();
  if (!alvo) return lista;

  const digitos = apenasDigitos(alvo);
  const texto = normalizar(alvo);

  return lista.filter((c) => {
    if (digitos.length >= 3 && c.cnpj.includes(digitos)) return true;
    return normalizar(c.razaoSocial).includes(texto);
  });
}

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Os números do topo. */
export function resumir(lista: ContribuinteRetido[]): ResumoMalha {
  const diferencaTotal = lista.reduce((total, c) => total + c.diferenca, 0);
  const issTotal = lista.reduce((total, c) => total + c.issDevido, 0);
  const notificados = lista.filter((c) => c.desfecho !== 'aguardando').length;
  const regularizados = lista.filter((c) => c.desfecho === 'regularizado').length;

  return {
    contribuintes: lista.length,
    diferencaTotal,
    issTotal,
    ticketMedio: lista.length > 0 ? diferencaTotal / lista.length : 0,
    // Taxa sobre os NOTIFICADOS, não sobre o total: quem ainda nem recebeu a
    // notificação não teve chance de se regularizar e só diluiria o indicador.
    taxaAutorregularizacao: notificados > 0 ? regularizados / notificados : 0,
    reincidentes: lista.filter((c) => c.reincidente).length,
  };
}

/** Diferença apurada por critério de irregularidade (a rosca). */
export function agregarPorCriterio(lista: ContribuinteRetido[]): ItemSerie[] {
  return CRITERIOS.map((criterio) => {
    const doCriterio = lista.filter((c) => c.criterio === criterio.id);
    return {
      chave: criterio.id,
      rotulo: criterio.nome,
      contribuintes: doCriterio.length,
      valor: doCriterio.reduce((total, c) => total + c.diferenca, 0),
    };
  })
    .filter((item) => item.contribuintes > 0)
    .sort((a, b) => b.valor - a.valor);
}

/**
 * Diferença apurada por competência (as colunas).
 *
 * Um contribuinte com 4 competências entra nas 4, com a diferença rateada —
 * somar o valor cheio em cada mês inflaria o total em 4× e o gráfico deixaria
 * de fechar com o card.
 */
export function agregarPorCompetencia(
  lista: ContribuinteRetido[],
  janela: string[],
): ItemSerie[] {
  const porPA = new Map<string, { contribuintes: number; valor: number }>();
  for (const pa of janela) porPA.set(pa, { contribuintes: 0, valor: 0 });

  for (const contribuinte of lista) {
    const rateio = contribuinte.diferenca / contribuinte.competencias.length;
    for (const pa of contribuinte.competencias) {
      const atual = porPA.get(pa);
      if (!atual) continue;
      atual.contribuintes += 1;
      atual.valor += rateio;
    }
  }

  return janela.map((pa) => {
    const atual = porPA.get(pa) ?? { contribuintes: 0, valor: 0 };
    return {
      chave: pa,
      rotulo: formatPA(pa),
      contribuintes: atual.contribuintes,
      valor: Math.round(atual.valor),
    };
  });
}

/** Contribuintes por faixa de materialidade (as barras horizontais). */
export function agregarPorFaixa(lista: ContribuinteRetido[]): ItemSerie[] {
  return FAIXAS.map((faixa) => {
    const daFaixa = lista.filter((c) => faixaDoValor(c.diferenca).id === faixa.id);
    return {
      chave: faixa.id,
      rotulo: faixa.rotulo,
      contribuintes: daFaixa.length,
      valor: daFaixa.reduce((total, c) => total + c.diferenca, 0),
    };
  });
}

/** O funil de autorregularização, da retenção ao desfecho. */
export function agregarFunil(lista: ContribuinteRetido[]): ItemSerie[] {
  return ORDEM_FUNIL.map((desfecho: Desfecho) => {
    const doDesfecho = lista.filter((c) => c.desfecho === desfecho);
    return {
      chave: desfecho,
      rotulo: ROTULO_DESFECHO[desfecho],
      contribuintes: doDesfecho.length,
      valor: doDesfecho.reduce((total, c) => total + c.diferenca, 0),
    };
  });
}

/** Ordena o lote conforme a priorização escolhida na parametrização. */
export function ordenarLote(
  lista: ContribuinteRetido[],
  ordenacao: 'maior-diferenca' | 'maior-risco' | 'mais-competencias' | 'cnpj',
): ContribuinteRetido[] {
  const pesoRisco = { critico: 4, alto: 3, medio: 2, baixo: 1 } as const;
  const copia = [...lista];

  switch (ordenacao) {
    case 'maior-risco':
      return copia.sort(
        (a, b) => pesoRisco[b.risco] - pesoRisco[a.risco] || b.diferenca - a.diferenca,
      );
    case 'mais-competencias':
      return copia.sort(
        (a, b) => b.competencias.length - a.competencias.length || b.diferenca - a.diferenca,
      );
    case 'cnpj':
      return copia.sort((a, b) => a.cnpj.localeCompare(b.cnpj));
    case 'maior-diferenca':
    default:
      return copia.sort((a, b) => b.diferenca - a.diferenca);
  }
}
