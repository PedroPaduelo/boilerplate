/**
 * CNPJ — formatação e geração com dígito verificador VÁLIDO.
 *
 * O DV correto não é preciosismo: auditor fiscal reconhece CNPJ inválido de
 * relance (e costuma conferir um ou outro na consulta pública). Uma lista de
 * números aleatórios entrega na hora que a tela não fala com a base real.
 */

/** Pesos do cálculo do 1º e do 2º dígito verificador (regra da Receita). */
const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function digitoVerificador(digitos: number[], pesos: number[]): number {
  const soma = digitos.reduce((acc, digito, i) => acc + digito * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Monta um CNPJ completo (14 dígitos) a partir dos 8 dígitos da raiz.
 * A ordem/filial fica em `0001` — o padrão da matriz, que é o caso comum de
 * optante do Simples.
 */
export function cnpjDaRaiz(raiz: number): string {
  const base = String(raiz).padStart(8, '0').slice(0, 8) + '0001';
  const digitos = base.split('').map(Number);
  const dv1 = digitoVerificador(digitos, PESOS_DV1);
  const dv2 = digitoVerificador([...digitos, dv1], PESOS_DV2);
  return `${base}${dv1}${dv2}`;
}

/** `12345678000195` → `12.345.678/0001-95`. */
export function formatCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Só os dígitos — usado na busca, que aceita com ou sem pontuação. */
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}
