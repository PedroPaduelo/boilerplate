/**
 * Contrato entre os overrides do DS e o DOM do Astryx.
 *
 * Por que este teste existe: um override de componente é um SELETOR. Se o
 * nome da classe estiver errado, nada quebra — o CSS é gerado, o build passa,
 * e a regra só não casa com nada. O bug aparece como "o botão não ficou com a
 * cara do design", meses depois.
 *
 * O `astryx theme build` avisa "Unknown component text-input, did you mean
 * textinput?" para metade destes overrides. O aviso está ERRADO: a lista
 * embutida no CLI 0.1.8 está defasada em relação às classes que os
 * componentes realmente renderizam. Este teste é a prova — ele renderiza os
 * componentes de verdade e confirma que cada seletor do tema casa com o DOM.
 *
 * Também trava regressão: se um upgrade do Astryx renomear uma classe, aqui
 * quebra, em vez de o estilo sumir em silêncio.
 */
import { describe, expect, it } from 'vitest';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Switch } from '@astryxdesign/core/Switch';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import { generateThemeRulesSplit } from '@astryxdesign/core/theme';

import { renderWithProviders } from '@/test/render';
import { auditoriaTheme } from '../auditoria-theme';
import { dsComponentOverrides } from '../component-overrides';

/**
 * As regras de componente geradas a partir do tema — pelo MESMO gerador que o
 * `astryx theme build` usa. Testar contra ele (em vez de ler o .css do disco)
 * mantém o teste válido mesmo com o artefato desatualizado.
 */
const { component } = generateThemeRulesSplit(auditoriaTheme);
const generatedCss = component.join('\n');

describe('overrides do DS ↔ DOM do Astryx', () => {
  /**
   * Cada caso: um seletor que o tema gera e o componente que deveria casar
   * com ele. `variant="soft"` é a variante criada pelo projeto — o tipo vem
   * da augmentation que o `astryx theme build` gera.
   */
  const cases: { selector: string; ui: React.ReactElement }[] = [
    { selector: '.astryx-button', ui: <Button label="Salvar" /> },
    {
      selector: '.astryx-button.primary',
      ui: <Button label="Salvar" variant="primary" />,
    },
    { selector: '.astryx-button.soft', ui: <Button label="Salvar" variant="soft" /> },
    {
      selector: '.astryx-button.ghost.sm',
      ui: <Button label="Salvar" variant="ghost" size="sm" />,
    },
    {
      selector: '.astryx-text-input',
      ui: <TextInput label="Nome" value="" onChange={() => {}} />,
    },
    {
      selector: '.astryx-text-input.error',
      ui: (
        <TextInput
          label="Nome"
          value=""
          onChange={() => {}}
          status={{ type: 'error', message: 'Obrigatório' }}
        />
      ),
    },
    { selector: '.astryx-card', ui: <Card>conteúdo</Card> },
    { selector: '.astryx-badge.success', ui: <Badge label="Ativo" variant="success" /> },
    { selector: '.astryx-token.md', ui: <Token label="filtro" size="md" /> },
    {
      selector: '.astryx-switch',
      ui: <Switch label="Notificações" value={false} onChange={() => {}} />,
    },
    {
      selector: '.astryx-switch-thumb.checked',
      ui: <Switch label="Notificações" value onChange={() => {}} />,
    },
  ];

  it.each(cases)('$selector casa com o componente renderizado', ({ selector, ui }) => {
    const { container } = renderWithProviders(ui);
    expect(container.querySelector(selector)).not.toBeNull();
  });

  it('todo componente declarado vira regra CSS de verdade', () => {
    for (const name of Object.keys(dsComponentOverrides)) {
      expect(generatedCss, `.astryx-${name} não gerou regra`).toContain(
        `.astryx-${name}`,
      );
    }
  });

  it('nenhuma cor literal escapou para as regras de componente', () => {
    // Os hex da paleta vivem no bloco de tokens (`:scope { … }`), que é o
    // lugar deles. Regra de componente só pode referenciar var().
    const componentRules = generatedCss.slice(generatedCss.indexOf('.astryx-'));
    expect(componentRules).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
});
