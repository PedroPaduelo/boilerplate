/**
 * Anatomia do card da galeria — a do `demo.html` da referência de gráficos:
 * AÇÕES no topo, depois cabeçalho (título → subtítulo → etiqueta de código) e
 * por último o palco do preview.
 *
 * O que este arquivo trava:
 * 1. ORDEM DAS ZONAS — o card é lido de cima para baixo; se o cabeçalho subir
 *    acima das ações (ou o palco entrar no meio), a leitura quebra.
 * 2. AS DUAS AÇÕES — copiar o tipo e ver detalhes, sem que uma dispare a outra.
 * 3. NOMES ACESSÍVEIS DISTINTOS — o cartão inteiro já é um alvo de clique;
 *    dois interativos com o mesmo nome fariam o leitor de tela anunciar o
 *    mesmo destino duas vezes.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { getCatalogEntryByType } from '../../lib/catalog-entries';
import { BlockPreviewCard } from '../block-preview-card';

/** Uma entrada real do registry — o card não inventa dado nenhum. */
function entradaDonut() {
  const entry = getCatalogEntryByType('donut');
  if (!entry) throw new Error('bloco `donut` fora do registry');
  return entry;
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('card da galeria — anatomia', () => {
  it('desenha as três zonas na ordem: ações, cabeçalho, palco', () => {
    const { container } = renderWithProviders(
      <BlockPreviewCard entry={entradaDonut()} onDetails={vi.fn()} />,
    );

    const zonas = [...container.querySelectorAll('[data-slot]')]
      .map((node) => node.getAttribute('data-slot'))
      .filter(
        (slot) =>
          slot === 'catalog-card-actions' ||
          slot === 'catalog-card-header' ||
          slot === 'catalog-preview-stage',
      );

    expect(zonas).toEqual([
      'catalog-card-actions',
      'catalog-card-header',
      'catalog-preview-stage',
    ]);
  });

  it('o cabeçalho traz título, descrição e a etiqueta de código', () => {
    const entry = entradaDonut();
    const { container } = renderWithProviders(
      <BlockPreviewCard entry={entry} onDetails={vi.fn()} />,
    );

    const header = container.querySelector('[data-slot="catalog-card-header"]');
    expect(header).not.toBeNull();

    const zona = within(header as HTMLElement);
    expect(
      zona.getByRole('heading', { name: entry.definition.manifest.name }),
    ).toBeInTheDocument();
    expect(zona.getByText(entry.definition.manifest.description)).toBeInTheDocument();
    // Etiqueta no formato da referência: `<tipo> · <n> props`.
    expect(zona.getByText(`donut · ${entry.propsCount} props`)).toBeInTheDocument();
  });

  it('bloco sem dados avisa isso na própria etiqueta', () => {
    const narrativo = getCatalogEntryByType('title');
    if (!narrativo) throw new Error('bloco `title` fora do registry');

    renderWithProviders(<BlockPreviewCard entry={narrativo} onDetails={vi.fn()} />);
    expect(screen.getByText('title · sem dados')).toBeInTheDocument();
  });
});

describe('card da galeria — ações do topo', () => {
  it('copiar leva o TIPO para a área de transferência, sem abrir o playground', async () => {
    const onDetails = vi.fn();
    renderWithProviders(
      <BlockPreviewCard entry={entradaDonut()} onDetails={onDetails} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /copiar o tipo donut/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('donut');
    expect(onDetails).not.toHaveBeenCalled();
  });

  it('ver detalhes abre o playground', async () => {
    const onDetails = vi.fn();
    const entry = entradaDonut();
    renderWithProviders(<BlockPreviewCard entry={entry} onDetails={onDetails} />);

    await userEvent.click(screen.getByRole('button', { name: /ver detalhes de/i }));

    expect(onDetails).toHaveBeenCalledWith(entry);
  });

  it('o cartão e o botão de abrir têm nomes acessíveis diferentes', () => {
    renderWithProviders(<BlockPreviewCard entry={entradaDonut()} onDetails={vi.fn()} />);

    // Um só alvo com o nome do cartão — o botão de ação usa outro verbo.
    expect(screen.getAllByRole('button', { name: /^Abrir playground de/ })).toHaveLength(
      1,
    );
    expect(screen.getAllByRole('button', { name: /^Ver detalhes de/ })).toHaveLength(1);
  });
});
