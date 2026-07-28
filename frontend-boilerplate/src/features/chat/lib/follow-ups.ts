/**
 * Continuações clicáveis derivadas da PRÓPRIA resposta.
 *
 * O agente costuma fechar oferecendo próximos passos ("Se quiser, posso te
 * ajudar a: criar um dashboard…, analisar…") — e essa oferta chega como texto
 * morto: o usuário lê, concorda e ainda precisa redigir a pergunta na mão.
 * Aqui a lista final vira botão.
 *
 * A regra é conservadora de propósito: só vira sugestão uma lista que TERMINA a
 * resposta e vem precedida de uma linha que OFERECE ("posso", "quer que eu",
 * "próximos passos"). Uma lista qualquer — as tabelas encontradas, os dez
 * maiores devedores — não é oferta de continuação, e transformá-la em botão
 * poria na boca do agente algo que ele não disse. Sem oferta confiável o
 * retorno é vazio e a faixa não aparece: nenhuma sugestão é melhor do que uma
 * inventada.
 *
 * Função pura (sem React, sem DOM) para poder ser testada direto — é aqui que
 * mora o risco da feature, não no botão.
 */

/** Teto do que cabe numa faixa; acima disso vira menu, não escolha rápida. */
export const MAX_FOLLOW_UPS = 4;

/** Abaixo de dois não é escolha: é um botão solto no meio da conversa. */
const MIN_FOLLOW_UPS = 2;

/** Item comprido é explicação, não oferta — e não cabe num botão. */
const MAX_ITEM_LENGTH = 100;
const MIN_ITEM_LENGTH = 4;

/** Um fecho curto pode vir depois da lista ("Qual desses interessa?"). */
const MAX_CLOSING_LENGTH = 160;

/** Item de lista markdown (`-`, `*`, `+`, `1.`, `1)`), sem sub-item indentado. */
const LIST_ITEM = /^ {0,3}(?:[-*+]|\d+[.)])\s+(\S.*)$/;

/**
 * A linha que ANTECEDE a lista precisa oferecer algo. É o único sinal barato e
 * confiável que separa "posso te ajudar a:" de "as tabelas encontradas foram:".
 */
const OFFER =
  /\b(posso|podemos|poderia|quer|queira|deseja|gostaria|sugiro|sugestoes|proximos? passos?|se quiser|se preferir)\b/;

/** Compara sem acento e sem caixa — o agente escreve em português. */
function deaccent(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Uma lista dentro de ``` é código (ex.: um SQL comentado), não oferta. */
function stripFences(markdown: string): string {
  return markdown.replace(/```[\s\S]*?(?:```|$)/g, '\n');
}

function listItemOf(line: string): string | null {
  const match = LIST_ITEM.exec(line);
  return match ? match[1].trim() : null;
}

/**
 * Tira a sintaxe do markdown e a pontuação final — sobra o pedido em si, que é
 * o texto que vai ser ENVIADO ao clicar (por isso não pode ser truncado).
 * `_` fica de fora da limpeza de propósito: `nota_fiscal` é nome de tabela.
 */
function toPrompt(item: string): string {
  const plain = item
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.;,:]+$/, '')
    .trim();

  if (!plain) return '';
  return plain.charAt(0).toUpperCase() + plain.slice(1);
}

/**
 * Extrai de 2 a {@link MAX_FOLLOW_UPS} continuações do markdown da resposta.
 * Devolve `[]` quando não há oferta reconhecível — e o chamador não renderiza.
 */
export function deriveFollowUps(markdown: string): string[] {
  if (!markdown || !markdown.trim()) return [];

  const lines = stripFences(markdown).replace(/\r\n?/g, '\n').split('\n');
  let cursor = lines.length - 1;

  const skipBlank = () => {
    while (cursor >= 0 && !lines[cursor].trim()) cursor--;
  };

  skipBlank();
  if (cursor < 0) return [];

  // Fecho curto depois da lista ("Qual desses interessa?") não invalida a oferta.
  if (!listItemOf(lines[cursor]) && lines[cursor].trim().length <= MAX_CLOSING_LENGTH) {
    cursor--;
    skipBlank();
  }
  if (cursor < 0) return [];

  // A lista precisa terminar a resposta: subimos enquanto houver itens.
  const items: string[] = [];
  while (cursor >= 0) {
    const item = listItemOf(lines[cursor]);
    if (item) {
      items.unshift(item);
      cursor--;
      continue;
    }
    // Lista "solta": uma linha em branco ENTRE itens não encerra o bloco.
    if (
      !lines[cursor].trim() &&
      items.length > 0 &&
      listItemOf(lines[cursor - 1] ?? '')
    ) {
      cursor--;
      continue;
    }
    break;
  }
  if (items.length === 0) return [];

  skipBlank();
  const leadIn = cursor >= 0 ? lines[cursor] : '';
  if (!OFFER.test(deaccent(leadIn))) return [];

  const seen = new Set<string>();
  const prompts: string[] = [];
  for (const item of items) {
    const prompt = toPrompt(item);
    if (prompt.length < MIN_ITEM_LENGTH || prompt.length > MAX_ITEM_LENGTH) continue;
    const key = deaccent(prompt);
    if (seen.has(key)) continue;
    seen.add(key);
    prompts.push(prompt);
    if (prompts.length === MAX_FOLLOW_UPS) break;
  }

  return prompts.length >= MIN_FOLLOW_UPS ? prompts : [];
}
