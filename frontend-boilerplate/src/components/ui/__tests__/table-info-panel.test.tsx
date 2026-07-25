/**
 * Regressão do TableInfoPanel — inspetor de largura fixa (280px).
 *
 * O painel estava CORTANDO conteúdo na borda da tela: identificadores longos de
 * banco (`conversations_assigned_to_user_id_users_id_fk`, `timestamp with time
 * zone`) esticavam o bloco interno para 386px dentro de um painel de 279px, e
 * como o viewport tem overflow-x hidden o excedente sumia — sem scroll e sem
 * reticências.
 *
 * jsdom não calcula layout, então aqui travamos os INVARIANTES que causaram o
 * corte e que são invisíveis em review:
 *
 *  1. `shrink-0` e `truncate` não podem coexistir: `shrink-0` impede o
 *     encolhimento, então o truncate nunca tem o que cortar e o elemento passa
 *     a exigir a largura inteira do texto.
 *  2. Todo texto truncável precisa de `title` — truncar sem tooltip apaga a
 *     informação, e num inspetor de schema o nome completo é o dado.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TableInfoPanel, type TableInfoTable } from '../table-info-panel';

const tabelaComNomesLongos: TableInfoTable = {
  name: 'conversations',
  rowCount: 1234,
  sizeMB: 12.5,
  columns: [
    { name: 'id', type: 'uuid', isPrimary: true },
    { name: 'assigned_to_user_id', type: 'uuid', isForeign: true },
    { name: 'last_message_at', type: 'timestamp with time zone' },
    {
      name: 'muitissimo_longo_nome_de_coluna_que_nao_cabe',
      type: 'character varying(255)',
    },
  ],
  indexes: [
    {
      name: 'conversations_organization_id_status_idx',
      type: 'btree',
      columns: ['a', 'b'],
    },
  ],
  foreignKeys: [
    {
      name: 'conversations_assigned_to_user_id_users_id_fk',
      references: { schema: 'public', table: 'users', column: 'id' },
    },
  ],
};

function montar() {
  const { container } = render(
    <TableInfoPanel table={tabelaComNomesLongos} schemaName="public" />,
  );
  return container.querySelector("[data-slot='table-info-panel']")!;
}

describe('TableInfoPanel — não pode cortar conteúdo', () => {
  it('nunca combina shrink-0 com truncate (se anulam e forçam a largura do texto)', () => {
    const painel = montar();

    const conflitantes = [...painel.querySelectorAll('*')]
      .map((e) => e.className.toString())
      .filter((c) => /\bshrink-0\b/.test(c) && /\btruncate\b/.test(c));

    expect(conflitantes).toEqual([]);
  });

  it('todo rótulo truncável carrega o valor completo em title', () => {
    const painel = montar();

    const truncadosSemTitle = [...painel.querySelectorAll('*')].filter((e) => {
      const c = e.className.toString();
      if (!/\btruncate\b/.test(c)) return false;
      // vale o title do próprio elemento ou de um ancestral (linha clicável)
      return !e.getAttribute('title') && !e.closest('[title]');
    });

    expect(truncadosSemTitle.map((e) => e.textContent?.slice(0, 40))).toEqual([]);
  });

  it('neutraliza o display:table do Radix, que estica o bloco além do painel', () => {
    const painel = montar();
    const scrollArea = painel.querySelector("[data-slot='scroll-area']")!;

    // Sem isto o wrapper interno faz shrink-to-fit até o min-content do maior
    // identificador e o conteúdo é cortado pela borda do painel.
    expect(scrollArea.className).toContain('scroll-area-viewport');
    expect(scrollArea.className).toContain('block!');
  });

  it('mostra o estado vazio quando não há tabela selecionada', () => {
    const { container } = render(<TableInfoPanel table={null} />);
    expect(container.textContent).toMatch(/Nenhuma tabela selecionada/i);
  });
});
