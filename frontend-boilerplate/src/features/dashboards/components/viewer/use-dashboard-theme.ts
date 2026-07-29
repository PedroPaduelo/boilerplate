/**
 * Aplica a PREFERÊNCIA DE TEMA declarada pelo dashboard (`layout.theme`).
 *
 * ---------------------------------------------------------------------------
 * A REGRA, E ELA É CURTA: A PESSOA VENCE
 * ---------------------------------------------------------------------------
 * Um dashboard pode dizer como quer nascer — o painel de sala de controle nasce
 * escuro, o relatório para impressão nasce claro. Mas isso é um PONTO DE
 * PARTIDA, não uma ordem: se quem está lendo já escolheu um tema alguma vez, a
 * escolha dele manda. Um app que troca o tema por baixo de quem acabou de
 * clicar no botão de tema é um app discutindo com o usuário.
 *
 * "Já escolheu alguma vez" é lido do MESMO lugar em que o `ColorModeProvider`
 * persiste (`localStorage`), e não de um estado nosso: são a mesma verdade, e
 * duas cópias divergiriam na primeira aba aberta em paralelo.
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA VEZ SÓ (`useRef` de aplicado)
 * ---------------------------------------------------------------------------
 * Sem a trava, o efeito reaplicaria o tema do dashboard a cada re-render em que
 * as dependências mudassem — inclusive DEPOIS de a pessoa clicar no toggle
 * dentro desta mesma tela. O resultado seria um botão que "não funciona" em uma
 * tela específica, que é o tipo de bug que ninguém consegue reproduzir contando.
 */
import { useEffect, useRef } from 'react';
import { resolveDashboardTheme } from '@dashboards/contracts';
import type { DashboardLayout } from '@dashboards/contracts';
import { COLOR_MODE_STORAGE_KEY, useColorMode } from '@/shared/theme';

/** A pessoa já escolheu um tema explicitamente, em qualquer momento? */
function hasUserPreference(): boolean {
  try {
    return localStorage.getItem(COLOR_MODE_STORAGE_KEY) != null;
  } catch {
    // localStorage bloqueado (modo privado): trate como "não escolheu" — o
    // dashboard decide, que é o melhor palpite disponível.
    return false;
  }
}

export function useDashboardThemePreference(layout: unknown): void {
  const { setMode } = useColorMode();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    const { colorMode } = resolveDashboardTheme(layout as DashboardLayout);
    if (!colorMode) return;
    applied.current = true;
    if (hasUserPreference()) return;
    setMode(colorMode);
  }, [layout, setMode]);
}
