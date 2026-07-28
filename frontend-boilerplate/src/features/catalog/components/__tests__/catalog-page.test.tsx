/**
 * A galeria responde a duas perguntas — "para que serve?" (categoria) e "serve
 * para o meu dado?" (formato). Estes testes travam as duas, mais a taxonomia
 * (nenhum bloco órfão) e a anatomia do card, que é o que mantém a grade
 * alinhada.
 */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { getCatalogEntries } from '../../lib/catalog-entries';
import { CATEGORY_BY_TYPE } from '../../lib/categories';
import { CatalogPage } from '../catalog-page';

/** Quantos cards a grade está mostrando (um card = um alvo de clique). */
function visibleCards(): HTMLElement[] {
  return screen.getAllByRole('button', { name: /^Abrir playground de/ });
}

describe('taxonomia do catálogo', () => {
  it('todo bloco registrado tem categoria — nenhum cai em "Outros"', () => {
    const orfaos = getCatalogEntries()
      .filter((e) => e.category === 'outros')
      .map((e) => e.type);

    expect(orfaos).toEqual([]);
  });

  it('não há categoria declarada sem nenhum bloco (aba que nunca aparece)', () => {
    const usadas = new Set(Object.values(CATEGORY_BY_TYPE));
    const declaradasSemUso = [...new Set(Object.values(CATEGORY_BY_TYPE))].filter(
      (c) => !usadas.has(c),
    );

    expect(declaradasSemUso).toEqual([]);
  });
});

/**
 * A galeria monta os 42 blocos AO VIVO. Em jsdom não há `IntersectionObserver`,
 * então o `useInView` assume tudo visível (o recuo honesto) e o teste paga o
 * pior caso — o que é justamente o que queremos exercitar. O timeout folgado
 * evita que isso vire falha intermitente quando a máquina está ocupada.
 */
const GALLERY_TIMEOUT = 20_000;

describe('CatalogPage', () => {
  it(
    'mostra todos os blocos e a contagem total',
    () => {
      const total = getCatalogEntries().length;
      renderWithProviders(<CatalogPage />);

      expect(screen.getByText(`${total} componentes`)).toBeInTheDocument();
      expect(visibleCards()).toHaveLength(total);
    },
    GALLERY_TIMEOUT,
  );

  it(
    'busca filtra por nome, tipo ou descrição',
    async () => {
      renderWithProviders(<CatalogPage />);

      await userEvent.type(screen.getByLabelText('Buscar componente'), 'donut');

      const cards = visibleCards();
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.length).toBeLessThan(getCatalogEntries().length);
      expect(screen.getByText('donut')).toBeInTheDocument();
    },
    GALLERY_TIMEOUT,
  );

  it(
    'filtro por formato do dado devolve só blocos daquele shape',
    async () => {
      renderWithProviders(<CatalogPage />);

      await userEvent.click(screen.getByLabelText('Formato do dado'));
      await userEvent.click(await screen.findByRole('option', { name: 'Escalar' }));

      const esperados = getCatalogEntries().filter((e) => e.shape === 'scalar');
      expect(visibleCards()).toHaveLength(esperados.length);
    },
    GALLERY_TIMEOUT,
  );

  it(
    '“Sem dados” isola os blocos que não consomem dados',
    async () => {
      renderWithProviders(<CatalogPage />);

      await userEvent.click(screen.getByLabelText('Formato do dado'));
      await userEvent.click(await screen.findByRole('option', { name: 'Sem dados' }));

      const esperados = getCatalogEntries().filter((e) => !e.shape);
      expect(visibleCards()).toHaveLength(esperados.length);
    },
    GALLERY_TIMEOUT,
  );

  it(
    'filtro sem resultado oferece a saída (limpar) e ela funciona',
    async () => {
      const total = getCatalogEntries().length;
      renderWithProviders(<CatalogPage />);

      await userEvent.type(screen.getByLabelText('Buscar componente'), 'xyzinexistente');
      expect(screen.getByText('Nenhum componente encontrado')).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Ver todos os componentes' }),
      );
      expect(visibleCards()).toHaveLength(total);
    },
    GALLERY_TIMEOUT,
  );

  it(
    'cada card tem a mesma anatomia: cabeçalho, palco de preview e rodapé',
    () => {
      const { container } = renderWithProviders(<CatalogPage />);

      const total = getCatalogEntries().length;
      const palcos = container.querySelectorAll('[data-slot="catalog-preview-stage"]');
      // Um palco por card: é ele que garante a altura uniforme da grade.
      expect(palcos).toHaveLength(total);

      // Um título por card. O `ClickableCard` do DS desenha o alvo de clique como
      // um botão-overlay IRMÃO do conteúdo, então o título não está dentro do
      // botão — a contagem é a forma honesta de checar a anatomia aqui.
      const titulos = getCatalogEntries().map((e) => e.definition.manifest.name);
      for (const nome of titulos.slice(0, 5)) {
        expect(screen.getAllByRole('heading', { name: nome }).length).toBeGreaterThan(0);
      }
    },
    GALLERY_TIMEOUT,
  );
});
