/**
 * `catalogType` → nome de gente.
 *
 * A tabela mostra o tipo cru (`bar_chart`) porque ali a coluna é técnica e
 * comparável. No CARD, que é leitura visual, o mesmo dado precisa soar como
 * legenda da miniatura ("Barras"), não como identificador de banco.
 *
 * A fonte é o próprio registry do render-engine — o manifesto do bloco já
 * carrega o nome de exibição, então não existe uma segunda tabela de tradução
 * para sair de sincronia quando um bloco novo é registrado. Tipo que não está
 * no registry cai no `catalogType` cru: é feio, mas é verdade.
 */
import { getBlock } from '@/shared/render-engine';

export function chartTypeLabel(catalogType: string): string {
  return getBlock(catalogType)?.manifest.name ?? catalogType;
}
