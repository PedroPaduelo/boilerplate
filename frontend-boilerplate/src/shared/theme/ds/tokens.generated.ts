/**
 * ARQUIVO GERADO — NÃO EDITE À MÃO.
 *
 * Origem : src/shared/theme/ds/ds-tokens.source.json
 * Gerador: scripts/generate-ds-theme.mjs  (`npm run ds:tokens`)
 *
 * Design system do AuditorIA (Minimal Kit (Minimals) v7.0.0, MUI 7.0.1),
 * extraído por leitura de código + tema computado em Node + medição em runtime.
 *
 * ⚠️ Tipografia em **px real medido**, não no `rem` nominal do tema de origem:
 * lá `html` é 14px e os `rem` foram gerados sobre 16, então todo `rem`
 * renderiza a 87,5%. Ver docs/design-system/99-inconsistencias.md §1.
 */

/** Valor de token: fixo, ou [claro, escuro] quando muda por esquema. */
export type DsTokenValue = string | [light: string, dark: string];

/** Par claro/escuro. O Astryx compila para `light-dark(claro, escuro)`. */
export const duo = (light: string, dark: string): [string, string] => [light, dark];

/* -------------------------------------------------------------------------- *
 * Paleta — todos os tons do DS, incluindo os que o Astryx não tem slot
 * (`lighter`/`darker`, os 10 cinzas, os overlays de ação).
 * -------------------------------------------------------------------------- */
export const dsColorTokens: Record<string, DsTokenValue> = {
  "--ds-color-primary-lighter": "#C8FAD6",
  "--ds-channel-primary-lighter": "200 250 214",
  "--ds-color-primary-light": "#5BE49B",
  "--ds-channel-primary-light": "91 228 155",
  "--ds-color-primary-main": "#00A76F",
  "--ds-channel-primary-main": "0 167 111",
  "--ds-color-primary-dark": "#007867",
  "--ds-channel-primary-dark": "0 120 103",
  "--ds-color-primary-darker": "#004B50",
  "--ds-channel-primary-darker": "0 75 80",
  "--ds-color-primary-contrast-text": "#FFFFFF",
  "--ds-channel-primary-contrast-text": "255 255 255",
  "--ds-color-secondary-lighter": "#EFD6FF",
  "--ds-channel-secondary-lighter": "239 214 255",
  "--ds-color-secondary-light": "#C684FF",
  "--ds-channel-secondary-light": "198 132 255",
  "--ds-color-secondary-main": "#8E33FF",
  "--ds-channel-secondary-main": "142 51 255",
  "--ds-color-secondary-dark": "#5119B7",
  "--ds-channel-secondary-dark": "81 25 183",
  "--ds-color-secondary-darker": "#27097A",
  "--ds-channel-secondary-darker": "39 9 122",
  "--ds-color-secondary-contrast-text": "#FFFFFF",
  "--ds-channel-secondary-contrast-text": "255 255 255",
  "--ds-color-info-lighter": "#CAFDF5",
  "--ds-channel-info-lighter": "202 253 245",
  "--ds-color-info-light": "#61F3F3",
  "--ds-channel-info-light": "97 243 243",
  "--ds-color-info-main": "#00B8D9",
  "--ds-channel-info-main": "0 184 217",
  "--ds-color-info-dark": "#006C9C",
  "--ds-channel-info-dark": "0 108 156",
  "--ds-color-info-darker": "#003768",
  "--ds-channel-info-darker": "0 55 104",
  "--ds-color-info-contrast-text": "#FFFFFF",
  "--ds-channel-info-contrast-text": "255 255 255",
  "--ds-color-success-lighter": "#D3FCD2",
  "--ds-channel-success-lighter": "211 252 210",
  "--ds-color-success-light": "#77ED8B",
  "--ds-channel-success-light": "119 237 139",
  "--ds-color-success-main": "#22C55E",
  "--ds-channel-success-main": "34 197 94",
  "--ds-color-success-dark": "#118D57",
  "--ds-channel-success-dark": "17 141 87",
  "--ds-color-success-darker": "#065E49",
  "--ds-channel-success-darker": "6 94 73",
  "--ds-color-success-contrast-text": "#ffffff",
  "--ds-channel-success-contrast-text": "255 255 255",
  "--ds-color-warning-lighter": "#FFF5CC",
  "--ds-channel-warning-lighter": "255 245 204",
  "--ds-color-warning-light": "#FFD666",
  "--ds-channel-warning-light": "255 214 102",
  "--ds-color-warning-main": "#FFAB00",
  "--ds-channel-warning-main": "255 171 0",
  "--ds-color-warning-dark": "#B76E00",
  "--ds-channel-warning-dark": "183 110 0",
  "--ds-color-warning-darker": "#7A4100",
  "--ds-channel-warning-darker": "122 65 0",
  "--ds-color-warning-contrast-text": "#1C252E",
  "--ds-channel-warning-contrast-text": "28 37 46",
  "--ds-color-error-lighter": "#FFE9D5",
  "--ds-channel-error-lighter": "255 233 213",
  "--ds-color-error-light": "#FFAC82",
  "--ds-channel-error-light": "255 172 130",
  "--ds-color-error-main": "#FF5630",
  "--ds-channel-error-main": "255 86 48",
  "--ds-color-error-dark": "#B71D18",
  "--ds-channel-error-dark": "183 29 24",
  "--ds-color-error-darker": "#7A0916",
  "--ds-channel-error-darker": "122 9 22",
  "--ds-color-error-contrast-text": "#FFFFFF",
  "--ds-channel-error-contrast-text": "255 255 255",
  "--ds-color-grey-50": "#FCFDFD",
  "--ds-channel-grey-50": "252 253 253",
  "--ds-color-grey-100": "#F9FAFB",
  "--ds-channel-grey-100": "249 250 251",
  "--ds-color-grey-200": "#F4F6F8",
  "--ds-channel-grey-200": "244 246 248",
  "--ds-color-grey-300": "#DFE3E8",
  "--ds-channel-grey-300": "223 227 232",
  "--ds-color-grey-400": "#C4CDD5",
  "--ds-channel-grey-400": "196 205 213",
  "--ds-color-grey-500": "#919EAB",
  "--ds-channel-grey-500": "145 158 171",
  "--ds-color-grey-600": "#637381",
  "--ds-channel-grey-600": "99 115 129",
  "--ds-color-grey-700": "#454F5B",
  "--ds-channel-grey-700": "69 79 91",
  "--ds-color-grey-800": "#1C252E",
  "--ds-channel-grey-800": "28 37 46",
  "--ds-color-grey-900": "#141A21",
  "--ds-channel-grey-900": "20 26 33",
  "--ds-color-grey-A100": "#f5f5f5",
  "--ds-channel-grey-A100": "245 245 245",
  "--ds-color-grey-A200": "#eeeeee",
  "--ds-channel-grey-A200": "238 238 238",
  "--ds-color-grey-A400": "#bdbdbd",
  "--ds-channel-grey-A400": "189 189 189",
  "--ds-color-grey-A700": "#616161",
  "--ds-channel-grey-A700": "97 97 97",
  "--ds-color-common-black": "#000000",
  "--ds-color-common-white": "#FFFFFF",
  "--ds-color-text-primary": duo("#1C252E", "#FFFFFF"),
  "--ds-color-text-secondary": duo("#637381", "#919EAB"),
  "--ds-color-text-disabled": duo("#919EAB", "#637381"),
  "--ds-color-background-default": duo("#FFFFFF", "#141A21"),
  "--ds-color-background-paper": duo("#FFFFFF", "#1C252E"),
  "--ds-color-background-neutral": duo("#F4F6F8", "#28323D"),
  "--ds-color-action-hover": "rgba(145 158 171 / 0.08)",
  "--ds-color-action-selected": "rgba(145 158 171 / 0.16)",
  "--ds-color-action-focus": "rgba(145 158 171 / 0.24)",
  "--ds-color-action-disabled": "rgba(145 158 171 / 0.8)",
  "--ds-color-action-disabledBackground": "rgba(145 158 171 / 0.24)",
  "--ds-color-action-active": duo("#637381", "#919EAB"),
  "--ds-color-divider": "rgba(145 158 171 / 0.2)",
  "--ds-color-border-paper-outlined": "rgba(145 158 171 / 0.16)",
  "--ds-color-border-input-rest": "rgba(145 158 171 / 0.2)",
  "--ds-color-border-input-focus": duo("#1C252E", "#FFFFFF"),
  "--ds-color-border-input-error": "#FF5630",
  "--ds-color-border-input-disabled": "rgba(145 158 171 / 0.24)",
  "--ds-color-border-button-outlined-inherit": "rgba(145 158 171 / 0.32)",
  "--ds-color-border-nav-sidebar": duo("rgba(145 158 171 / 0.12)", "rgba(145 158 171 / 0.08)"),
  "--ds-color-border-toggle-group": "rgba(145 158 171 / 0.08)",
  "--ds-color-border-pagination-outlined": "rgba(145 158 171 / 0.24)",
};

/* -------------------------------------------------------------------------- *
 * Elevação — `customShadows` (card/dropdown/dialog/coloridas) + escala 0..24.
 * A base é #919EAB no claro e #000000 no escuro: sombras FRIAS, não pretas.
 * -------------------------------------------------------------------------- */
export const dsShadowTokens: Record<string, DsTokenValue> = {
  "--ds-shadow-tint-0_12": duo("rgba(145 158 171 / 0.12)", "rgba(0 0 0 / 0.12)"),
  "--ds-shadow-tint-0_14": duo("rgba(145 158 171 / 0.14)", "rgba(0 0 0 / 0.14)"),
  "--ds-shadow-tint-0_16": duo("rgba(145 158 171 / 0.16)", "rgba(0 0 0 / 0.16)"),
  "--ds-shadow-tint-0_2": duo("rgba(145 158 171 / 0.2)", "rgba(0 0 0 / 0.2)"),
  "--ds-shadow-tint-0_24": duo("rgba(145 158 171 / 0.24)", "rgba(0 0 0 / 0.24)"),
  "--ds-shadow-z1": "0 1px 2px 0 var(--ds-shadow-tint-0_16)",
  "--ds-shadow-z4": "0 4px 8px 0 var(--ds-shadow-tint-0_16)",
  "--ds-shadow-z8": "0 8px 16px 0 var(--ds-shadow-tint-0_16)",
  "--ds-shadow-z12": "0 12px 24px -4px var(--ds-shadow-tint-0_16)",
  "--ds-shadow-z16": "0 16px 32px -4px var(--ds-shadow-tint-0_16)",
  "--ds-shadow-z20": "0 20px 40px -4px var(--ds-shadow-tint-0_16)",
  "--ds-shadow-z24": "0 24px 48px 0 var(--ds-shadow-tint-0_16)",
  "--ds-shadow-dialog": "-40px 40px 80px -8px rgba(0 0 0 / 0.24)",
  "--ds-shadow-card": "0 0 2px 0 var(--ds-shadow-tint-0_2), 0 12px 24px -4px var(--ds-shadow-tint-0_12)",
  "--ds-shadow-dropdown": "0 0 2px 0 var(--ds-shadow-tint-0_24), -20px 20px 40px -4px var(--ds-shadow-tint-0_24)",
  "--ds-shadow-primary": "0 8px 16px 0 rgba(var(--ds-channel-primary-main) / 0.24)",
  "--ds-shadow-secondary": "0 8px 16px 0 rgba(var(--ds-channel-secondary-main) / 0.24)",
  "--ds-shadow-info": "0 8px 16px 0 rgba(var(--ds-channel-info-main) / 0.24)",
  "--ds-shadow-success": "0 8px 16px 0 rgba(var(--ds-channel-success-main) / 0.24)",
  "--ds-shadow-warning": "0 8px 16px 0 rgba(var(--ds-channel-warning-main) / 0.24)",
  "--ds-shadow-error": "0 8px 16px 0 rgba(var(--ds-channel-error-main) / 0.24)",
  "--ds-elevation-0": "none",
  "--ds-elevation-1": "0px 2px 1px -1px var(--ds-shadow-tint-0_2),0px 1px 1px 0px var(--ds-shadow-tint-0_14),0px 1px 3px 0px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-2": "0px 3px 1px -2px var(--ds-shadow-tint-0_2),0px 2px 2px 0px var(--ds-shadow-tint-0_14),0px 1px 5px 0px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-3": "0px 3px 3px -2px var(--ds-shadow-tint-0_2),0px 3px 4px 0px var(--ds-shadow-tint-0_14),0px 1px 8px 0px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-4": "0px 2px 4px -1px var(--ds-shadow-tint-0_2),0px 4px 5px 0px var(--ds-shadow-tint-0_14),0px 1px 10px 0px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-5": "0px 3px 5px -1px var(--ds-shadow-tint-0_2),0px 5px 8px 0px var(--ds-shadow-tint-0_14),0px 1px 14px 0px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-6": "0px 3px 5px -1px var(--ds-shadow-tint-0_2),0px 6px 10px 0px var(--ds-shadow-tint-0_14),0px 1px 18px 0px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-7": "0px 4px 5px -2px var(--ds-shadow-tint-0_2),0px 7px 10px 1px var(--ds-shadow-tint-0_14),0px 2px 16px 1px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-8": "0px 5px 5px -3px var(--ds-shadow-tint-0_2),0px 8px 10px 1px var(--ds-shadow-tint-0_14),0px 3px 14px 2px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-9": "0px 5px 6px -3px var(--ds-shadow-tint-0_2),0px 9px 12px 1px var(--ds-shadow-tint-0_14),0px 3px 16px 2px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-10": "0px 6px 6px -3px var(--ds-shadow-tint-0_2),0px 10px 14px 1px var(--ds-shadow-tint-0_14),0px 4px 18px 3px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-11": "0px 6px 7px -4px var(--ds-shadow-tint-0_2),0px 11px 15px 1px var(--ds-shadow-tint-0_14),0px 4px 20px 3px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-12": "0px 7px 8px -4px var(--ds-shadow-tint-0_2),0px 12px 17px 2px var(--ds-shadow-tint-0_14),0px 5px 22px 4px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-13": "0px 7px 8px -4px var(--ds-shadow-tint-0_2),0px 13px 19px 2px var(--ds-shadow-tint-0_14),0px 5px 24px 4px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-14": "0px 7px 9px -4px var(--ds-shadow-tint-0_2),0px 14px 21px 2px var(--ds-shadow-tint-0_14),0px 5px 26px 4px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-15": "0px 8px 9px -5px var(--ds-shadow-tint-0_2),0px 15px 22px 2px var(--ds-shadow-tint-0_14),0px 6px 28px 5px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-16": "0px 8px 10px -5px var(--ds-shadow-tint-0_2),0px 16px 24px 2px var(--ds-shadow-tint-0_14),0px 6px 30px 5px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-17": "0px 8px 11px -5px var(--ds-shadow-tint-0_2),0px 17px 26px 2px var(--ds-shadow-tint-0_14),0px 6px 32px 5px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-18": "0px 9px 11px -5px var(--ds-shadow-tint-0_2),0px 18px 28px 2px var(--ds-shadow-tint-0_14),0px 7px 34px 6px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-19": "0px 9px 12px -6px var(--ds-shadow-tint-0_2),0px 19px 29px 2px var(--ds-shadow-tint-0_14),0px 7px 36px 6px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-20": "0px 10px 13px -6px var(--ds-shadow-tint-0_2),0px 20px 31px 3px var(--ds-shadow-tint-0_14),0px 8px 38px 7px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-21": "0px 10px 13px -6px var(--ds-shadow-tint-0_2),0px 21px 33px 3px var(--ds-shadow-tint-0_14),0px 8px 40px 7px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-22": "0px 10px 14px -6px var(--ds-shadow-tint-0_2),0px 22px 35px 3px var(--ds-shadow-tint-0_14),0px 8px 42px 7px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-23": "0px 11px 14px -7px var(--ds-shadow-tint-0_2),0px 23px 36px 3px var(--ds-shadow-tint-0_14),0px 9px 44px 8px var(--ds-shadow-tint-0_12)",
  "--ds-elevation-24": "0px 11px 15px -7px var(--ds-shadow-tint-0_2),0px 24px 38px 3px var(--ds-shadow-tint-0_14),0px 9px 46px 8px var(--ds-shadow-tint-0_12)",
};

/* -------------------------------------------------------------------------- *
 * Layout — dimensões do chrome (header 72px, sidebar 300px, nav mini 88px…).
 * -------------------------------------------------------------------------- */
export const dsLayoutTokens = {
  "--ds-layout-header-height-mobile": "64px",
  "--ds-layout-header-height-desktop": "72px",
  "--ds-layout-header-blur": "8px",
  "--ds-layout-header-z-index": "1101",
  "--ds-layout-nav-vertical-width": "300px",
  "--ds-layout-nav-mini-width": "88px",
  "--ds-layout-nav-mobile-width": "288px",
  "--ds-layout-nav-horizontal-height": "64px",
  "--ds-layout-nav-z-index": "1201",
  "--ds-layout-nav-breakpoint": "1200px",
  "--ds-layout-content-padding-top": "8px",
  "--ds-layout-content-padding-top-horizontal-nav": "40px",
  "--ds-layout-content-padding-bottom": "64px",
  "--ds-layout-content-padding-x": "40px",
  "--ds-layout-content-max-width": "none",
  "--ds-layout-nav-item-vertical-gap": "4px",
  "--ds-layout-nav-item-vertical-radius": "8px",
  "--ds-layout-nav-item-vertical-padding": "4px 8px 4px 12px",
  "--ds-layout-nav-item-vertical-root-height": "44px",
  "--ds-layout-nav-item-vertical-sub-height": "36px",
  "--ds-layout-nav-item-vertical-icon-size": "24px",
  "--ds-layout-nav-item-vertical-icon-margin": "0 12px 0 0",
  "--ds-layout-nav-item-vertical-bullet-size": "12px",
  "--ds-layout-nav-item-mini-gap": "4px",
  "--ds-layout-nav-item-mini-radius": "8px",
  "--ds-layout-nav-item-mini-root-height": "56px",
  "--ds-layout-nav-item-mini-root-padding": "8px 4px 6px 4px",
  "--ds-layout-nav-item-mini-sub-height": "34px",
  "--ds-layout-nav-item-mini-sub-padding": "0 8px",
  "--ds-layout-nav-item-mini-icon-size": "22px",
  "--ds-layout-nav-item-mini-icon-root-margin": "0 0 6px 0",
  "--ds-layout-nav-item-mini-icon-sub-margin": "0 8px 0 0",
  "--ds-layout-nav-item-horizontal-gap": "6px",
  "--ds-layout-nav-item-horizontal-nav-height": "56px",
  "--ds-layout-nav-item-horizontal-radius": "6px",
  "--ds-layout-nav-item-horizontal-root-height": "32px",
  "--ds-layout-nav-item-horizontal-root-padding": "0 6px",
  "--ds-layout-nav-item-horizontal-sub-height": "34px",
  "--ds-layout-nav-item-horizontal-sub-padding": "0 8px",
  "--ds-layout-nav-item-horizontal-icon-size": "22px",
  "--ds-layout-container-gutter-xs": "16px",
  "--ds-layout-container-gutter-sm": "24px",
  "--ds-layout-container-max-width-xs": "444px",
  "--ds-layout-container-max-width-sm": "600px",
  "--ds-layout-container-max-width-md": "900px",
  "--ds-layout-container-max-width-lg": "1200px",
  "--ds-layout-container-max-width-xl": "1536px",
  "--ds-layout-class-prefix": "minimal"
} as const;

/* -------------------------------------------------------------------------- *
 * Tamanhos de controle (botão, campo, chip, ícone, switch, slider…).
 * -------------------------------------------------------------------------- */
export const dsSizeTokens = {
  "--ds-size-button-small-height": "30px",
  "--ds-size-button-small-padding-x": "8px",
  "--ds-size-button-small-padding-x-text": "4px",
  "--ds-size-button-small-font-size": "11.375px",
  "--ds-size-button-medium-height": "33px",
  "--ds-size-button-medium-padding-x": "12px",
  "--ds-size-button-medium-padding-x-text": "8px",
  "--ds-size-button-medium-font-size": "12.25px",
  "--ds-size-button-large-height": "48px",
  "--ds-size-button-large-padding-x": "16px",
  "--ds-size-button-large-padding-x-text": "10px",
  "--ds-size-button-large-font-size": "13.125px",
  "--ds-size-button-min-width": "64px",
  "--ds-size-button-radius": "8px",
  "--ds-size-fab-extended-height": "48px",
  "--ds-size-fab-extended-radius": "24px",
  "--ds-size-fab-extended-gap": "8px",
  "--ds-size-fab-extended-padding": "0 16px",
  "--ds-size-fab-extended-medium-height": "40px",
  "--ds-size-fab-extended-medium-radius": "20px",
  "--ds-size-fab-extended-small-height": "34px",
  "--ds-size-fab-extended-small-radius": "17px",
  "--ds-size-fab-extended-small-gap": "4px",
  "--ds-size-fab-extended-small-padding": "0 8px",
  "--ds-size-input-outlined-medium-height": "51.8594px",
  "--ds-size-input-outlined-small-height": "35.8594px",
  "--ds-size-input-filled-medium-height": "51.8594px",
  "--ds-size-input-filled-small-height": "34.6094px",
  "--ds-size-input-standard-medium-height": "27.8594px",
  "--ds-size-input-standard-small-height": "24.8594px",
  "--ds-size-input-radius": "8px",
  "--ds-size-input-font-size": "13.125px",
  "--ds-size-input-font-size-below-sm": "14px",
  "--ds-size-chip-medium-height": "32px",
  "--ds-size-chip-medium-radius": "10px",
  "--ds-size-chip-medium-label-padding-x": "12px",
  "--ds-size-chip-small-height": "24px",
  "--ds-size-chip-small-radius": "8px",
  "--ds-size-chip-avatar-size": "24px",
  "--ds-size-chip-avatar-font-size": "10.5px",
  "--ds-size-chip-avatar-margin-left": "5px",
  "--ds-size-chip-delete-icon-size": "22px",
  "--ds-size-chip-delete-icon-margin-right": "5px",
  "--ds-size-chip-delete-icon-opacity": "0.48",
  "--ds-size-label-height": "24px",
  "--ds-size-label-min-width": "24px",
  "--ds-size-label-padding": "0 6px",
  "--ds-size-label-gap": "6px",
  "--ds-size-label-radius": "6px",
  "--ds-size-label-font-size": "10.5px",
  "--ds-size-label-font-weight": "700",
  "--ds-size-label-line-height": "0",
  "--ds-size-label-icon-size": "16px",
  "--ds-size-icon-iconify-default": "20px",
  "--ds-size-icon-svg-icon-small": "17.5px",
  "--ds-size-icon-svg-icon-medium": "21px",
  "--ds-size-icon-svg-icon-large": "32px",
  "--ds-size-icon-select-arrow": "18px",
  "--ds-size-icon-data-grid": "20px",
  "--ds-size-switch-medium-track-height": "20px",
  "--ds-size-switch-medium-thumb-size": "14px",
  "--ds-size-switch-small-track-height": "16px",
  "--ds-size-switch-small-thumb-size": "10px",
  "--ds-size-switch-track-radius": "10px",
  "--ds-size-slider-medium-rail-height": "10px",
  "--ds-size-slider-medium-thumb-size": "20px",
  "--ds-size-slider-medium-mark-height": "6px",
  "--ds-size-slider-small-rail-height": "6px",
  "--ds-size-slider-small-thumb-size": "16px",
  "--ds-size-slider-small-mark-height": "4px",
  "--ds-size-rating-small": "20px",
  "--ds-size-rating-medium": "24px",
  "--ds-size-rating-large": "28px",
  "--ds-size-avatar-group-compact-container": "40px",
  "--ds-size-avatar-group-compact-avatar": "28px",
  "--ds-size-badge-dot-size": "10px",
  "--ds-size-tab-min-width": "48px",
  "--ds-size-tab-min-height": "48px",
  "--ds-size-table-pagination-toolbar-height": "64px",
  "--ds-size-logo-single": "40px",
  "--ds-size-logo-full": "102px x 36px",
  "--ds-size-loading-screen-bar-max-width": "360px",
  "--ds-size-progress-bar-height": "2.5px"
} as const;

export const dsOpacityTokens = {
  "--ds-opacity-hover": "0.08",
  "--ds-opacity-disabled": "0.48",
  "--ds-opacity-selected": "0.08",
  "--ds-opacity-focus": "0.12",
  "--ds-opacity-activated": "0.12",
  "--ds-opacity-chip-delete-icon": "0.48",
  "--ds-opacity-scrollbar": "0.48",
  "--ds-opacity-header-shadow-on-scroll": "0.48",
  "--ds-opacity-paper-surface": "0.9",
  "--ds-opacity-header-backdrop": "0.8",
  "--ds-opacity-slider-rail": "0.12",
  "--ds-opacity-slider-thumb-before": "0.4"
} as const;

/* -------------------------------------------------------------------------- *
 * Espaçamento — base 8px. `--ds-spacing-1_5` = 12px (multiplicador 1.5).
 * -------------------------------------------------------------------------- */
export const dsSpacingTokens = {
  "--ds-spacing-0": "0px",
  "--ds-spacing-1": "8px",
  "--ds-spacing-2": "16px",
  "--ds-spacing-3": "24px",
  "--ds-spacing-4": "32px",
  "--ds-spacing-5": "40px",
  "--ds-spacing-6": "48px",
  "--ds-spacing-7": "56px",
  "--ds-spacing-8": "64px",
  "--ds-spacing-9": "72px",
  "--ds-spacing-10": "80px",
  "--ds-spacing-11": "88px",
  "--ds-spacing-12": "96px",
  "--ds-spacing-0_25": "2px",
  "--ds-spacing-0_5": "4px",
  "--ds-spacing-0_75": "6px",
  "--ds-spacing-1_25": "10px",
  "--ds-spacing-1_5": "12px",
  "--ds-spacing-1_75": "14px",
  "--ds-spacing-2_25": "18px",
  "--ds-spacing-2_5": "20px",
  "--ds-spacing-2_75": "22px",
  "--ds-spacing-3_25": "26px",
  "--ds-spacing-3_5": "28px",
  "--ds-spacing-3_75": "30px",
  "--ds-spacing-4_5": "36px"
} as const;

/* -------------------------------------------------------------------------- *
 * Espessura de borda — ficha `08-elevacao-bordas-zindex.md` §4.1.
 * -------------------------------------------------------------------------- */
export const dsBorderWidthTokens = {
  "--ds-border-width-thin": "1px",
  "--ds-border-width-thick": "2px",
  "--ds-border-width-ring": "0.75px"
} as const;

/* -------------------------------------------------------------------------- *
 * Tipografia — 13 variantes do DS. `size` em px real.
 * -------------------------------------------------------------------------- */
export const dsFontFamilies = {
  "primary": "\"Public Sans Variable\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"",
  "secondary": "\"Barlow\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"",
  "primaryName": "Public Sans Variable",
  "secondaryName": "Barlow"
} as const;

export const dsFontWeights = {
  "light": "300",
  "regular": "400",
  "medium": "500",
  "semiBold": "600",
  "bold": "700",
  "extraBold": "800"
} as const;

export const dsTypography = {
  "h1": {
    "family": "secondary",
    "weight": "800",
    "size": 35,
    "lineHeight": 1.25,
    "lineHeightPx": 43.75,
    "textTransform": "none",
    "responsive": {
      "sm": {
        "minWidth": "600px",
        "size": 45.5
      },
      "md": {
        "minWidth": "900px",
        "size": 50.75
      },
      "lg": {
        "minWidth": "1200px",
        "size": 56
      }
    },
    "source": "frontend/src/theme/core/typography.ts:54"
  },
  "h2": {
    "family": "secondary",
    "weight": "800",
    "size": 28,
    "lineHeight": 1.3333333333333333,
    "lineHeightPx": 37.3333,
    "textTransform": "none",
    "responsive": {
      "sm": {
        "minWidth": "600px",
        "size": 35
      },
      "md": {
        "minWidth": "900px",
        "size": 38.5
      },
      "lg": {
        "minWidth": "1200px",
        "size": 42
      }
    },
    "source": "frontend/src/theme/core/typography.ts:61"
  },
  "h3": {
    "family": "secondary",
    "weight": "700",
    "size": 21,
    "lineHeight": 1.5,
    "lineHeightPx": 31.5,
    "textTransform": "none",
    "responsive": {
      "sm": {
        "minWidth": "600px",
        "size": 22.75
      },
      "md": {
        "minWidth": "900px",
        "size": 26.25
      },
      "lg": {
        "minWidth": "1200px",
        "size": 28
      }
    },
    "source": "frontend/src/theme/core/typography.ts:68"
  },
  "h4": {
    "family": "primary",
    "weight": "700",
    "size": 17.5,
    "lineHeight": 1.5,
    "lineHeightPx": 26.25,
    "textTransform": "none",
    "responsive": {
      "md": {
        "minWidth": "900px",
        "size": 21
      }
    },
    "source": "frontend/src/theme/core/typography.ts:75"
  },
  "h5": {
    "family": "primary",
    "weight": "700",
    "size": 15.75,
    "lineHeight": 1.5,
    "lineHeightPx": 23.625,
    "textTransform": "none",
    "responsive": {
      "sm": {
        "minWidth": "600px",
        "size": 16.625
      }
    },
    "source": "frontend/src/theme/core/typography.ts:81"
  },
  "h6": {
    "family": "primary",
    "weight": "600",
    "size": 14.875,
    "lineHeight": 1.5555555555555556,
    "lineHeightPx": 23.1389,
    "textTransform": "none",
    "responsive": {
      "sm": {
        "minWidth": "600px",
        "size": 15.75
      }
    },
    "source": "frontend/src/theme/core/typography.ts:87"
  },
  "subtitle1": {
    "family": "primary",
    "weight": "600",
    "size": 14,
    "lineHeight": 1.5,
    "lineHeightPx": 21,
    "textTransform": "none",
    "responsive": null,
    "source": "frontend/src/theme/core/typography.ts:93"
  },
  "subtitle2": {
    "family": "primary",
    "weight": "600",
    "size": 12.25,
    "lineHeight": 1.5714285714285714,
    "lineHeightPx": 19.25,
    "textTransform": "none",
    "responsive": null,
    "source": "frontend/src/theme/core/typography.ts:98"
  },
  "body1": {
    "family": "primary",
    "weight": "400",
    "size": 14,
    "lineHeight": 1.5,
    "lineHeightPx": 21,
    "textTransform": "none",
    "responsive": null,
    "source": "frontend/src/theme/core/typography.ts:103"
  },
  "body2": {
    "family": "primary",
    "weight": "400",
    "size": 12.25,
    "lineHeight": 1.5714285714285714,
    "lineHeightPx": 19.25,
    "textTransform": "none",
    "responsive": null,
    "source": "frontend/src/theme/core/typography.ts:107"
  },
  "caption": {
    "family": "primary",
    "weight": "400",
    "size": 10.5,
    "lineHeight": 1.5,
    "lineHeightPx": 15.75,
    "textTransform": "none",
    "responsive": null,
    "source": "frontend/src/theme/core/typography.ts:111"
  },
  "overline": {
    "family": "primary",
    "weight": "700",
    "size": 10.5,
    "lineHeight": 1.5,
    "lineHeightPx": 15.75,
    "textTransform": "uppercase",
    "responsive": null,
    "source": "frontend/src/theme/core/typography.ts:115"
  },
  "button": {
    "family": "primary",
    "weight": "700",
    "size": 12.25,
    "lineHeight": 1.7142857142857142,
    "lineHeightPx": 21,
    "textTransform": "unset",
    "responsive": null,
    "source": "frontend/src/theme/core/typography.ts:121"
  }
} as const;

export type DsTypographyVariant = keyof typeof dsTypography;

/* -------------------------------------------------------------------------- *
 * Forma, espaçamento, motion, z-index, breakpoints.
 * -------------------------------------------------------------------------- */
export const dsRadius = {
  base: 8,
  multipliers: {
    "1": "8px",
    "2": "16px",
    "0.75": "6px",
    "1.25": "10px",
    "1.5": "12px"
  },
} as const;

export const dsSpacing = {
  "0": "0px",
  "1": "8px",
  "2": "16px",
  "3": "24px",
  "4": "32px",
  "5": "40px",
  "6": "48px",
  "7": "56px",
  "8": "64px",
  "9": "72px",
  "10": "80px",
  "11": "88px",
  "12": "96px",
  "0.25": "2px",
  "0.5": "4px",
  "0.75": "6px",
  "1.25": "10px",
  "1.5": "12px",
  "1.75": "14px",
  "2.25": "18px",
  "2.5": "20px",
  "2.75": "22px",
  "3.25": "26px",
  "3.5": "28px",
  "3.75": "30px",
  "4.5": "36px"
} as const;

export const dsMotion = {
  "duration": {
    "shortest": "150ms",
    "shorter": "200ms",
    "short": "250ms",
    "standard": "300ms",
    "complex": "375ms",
    "enteringScreen": "225ms",
    "leavingScreen": "195ms"
  },
  "easing": {
    "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)",
    "easeOut": "cubic-bezier(0.0, 0, 0.2, 1)",
    "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
    "sharp": "cubic-bezier(0.4, 0, 0.6, 1)"
  },
  "layout": {
    "duration": "120ms",
    "easing": "linear"
  }
} as const;

export const dsZIndex = {
  "mobileStepper": 1000,
  "fab": 1050,
  "speedDial": 1050,
  "appBar": 1100,
  "drawer": 1200,
  "modal": 1300,
  "snackbar": 1400,
  "tooltip": 1500,
  "layoutNav": 1201,
  "layoutHeader": 1101,
  "nprogress": 9999,
  "badgeDot": 9,
  "card": 0,
  "headerBackdrop": -1,
  "headerShadow": -2
} as const;

export const dsBreakpoints = {
  "xs": "0px",
  "sm": "600px",
  "md": "900px",
  "lg": "1200px",
  "xl": "1536px"
} as const;

/* -------------------------------------------------------------------------- *
 * Rastreabilidade — arquivo:linha de origem de cada token de cor.
 * Mantido em runtime de propósito: é o que permite auditar uma cor sem sair
 * do código ("de onde veio esse verde?").
 * -------------------------------------------------------------------------- */
export const dsTokenProvenance: Readonly<Record<string, string>> = {
  "--ds-color-primary-lighter": "frontend/src/theme/theme-config.ts:49",
  "--ds-color-primary-light": "frontend/src/theme/theme-config.ts:50",
  "--ds-color-primary-main": "frontend/src/theme/theme-config.ts:51",
  "--ds-color-primary-dark": "frontend/src/theme/theme-config.ts:52",
  "--ds-color-primary-darker": "frontend/src/theme/theme-config.ts:53",
  "--ds-color-primary-contrast-text": "frontend/src/theme/theme-config.ts:54",
  "--ds-color-secondary-lighter": "frontend/src/theme/theme-config.ts:57",
  "--ds-color-secondary-light": "frontend/src/theme/theme-config.ts:58",
  "--ds-color-secondary-main": "frontend/src/theme/theme-config.ts:59",
  "--ds-color-secondary-dark": "frontend/src/theme/theme-config.ts:60",
  "--ds-color-secondary-darker": "frontend/src/theme/theme-config.ts:61",
  "--ds-color-secondary-contrast-text": "frontend/src/theme/theme-config.ts:62",
  "--ds-color-info-lighter": "frontend/src/theme/theme-config.ts:65",
  "--ds-color-info-light": "frontend/src/theme/theme-config.ts:66",
  "--ds-color-info-main": "frontend/src/theme/theme-config.ts:67",
  "--ds-color-info-dark": "frontend/src/theme/theme-config.ts:68",
  "--ds-color-info-darker": "frontend/src/theme/theme-config.ts:69",
  "--ds-color-info-contrast-text": "frontend/src/theme/theme-config.ts:70",
  "--ds-color-success-lighter": "frontend/src/theme/theme-config.ts:73",
  "--ds-color-success-light": "frontend/src/theme/theme-config.ts:74",
  "--ds-color-success-main": "frontend/src/theme/theme-config.ts:75",
  "--ds-color-success-dark": "frontend/src/theme/theme-config.ts:76",
  "--ds-color-success-darker": "frontend/src/theme/theme-config.ts:77",
  "--ds-color-success-contrast-text": "frontend/src/theme/theme-config.ts:78",
  "--ds-color-warning-lighter": "frontend/src/theme/theme-config.ts:81",
  "--ds-color-warning-light": "frontend/src/theme/theme-config.ts:82",
  "--ds-color-warning-main": "frontend/src/theme/theme-config.ts:83",
  "--ds-color-warning-dark": "frontend/src/theme/theme-config.ts:84",
  "--ds-color-warning-darker": "frontend/src/theme/theme-config.ts:85",
  "--ds-color-warning-contrast-text": "frontend/src/theme/theme-config.ts:86",
  "--ds-color-error-lighter": "frontend/src/theme/theme-config.ts:89",
  "--ds-color-error-light": "frontend/src/theme/theme-config.ts:90",
  "--ds-color-error-main": "frontend/src/theme/theme-config.ts:91",
  "--ds-color-error-dark": "frontend/src/theme/theme-config.ts:92",
  "--ds-color-error-darker": "frontend/src/theme/theme-config.ts:93",
  "--ds-color-error-contrast-text": "frontend/src/theme/theme-config.ts:94",
  "--ds-color-grey-50": "frontend/src/theme/theme-config.ts:97",
  "--ds-color-grey-100": "frontend/src/theme/theme-config.ts:98",
  "--ds-color-grey-200": "frontend/src/theme/theme-config.ts:99",
  "--ds-color-grey-300": "frontend/src/theme/theme-config.ts:100",
  "--ds-color-grey-400": "frontend/src/theme/theme-config.ts:101",
  "--ds-color-grey-500": "frontend/src/theme/theme-config.ts:102",
  "--ds-color-grey-600": "frontend/src/theme/theme-config.ts:103",
  "--ds-color-grey-700": "frontend/src/theme/theme-config.ts:104",
  "--ds-color-grey-800": "frontend/src/theme/theme-config.ts:105",
  "--ds-color-grey-900": "frontend/src/theme/theme-config.ts:106",
  "--ds-color-grey-A100": "default MUI 7.0.1",
  "--ds-color-grey-A200": "default MUI 7.0.1",
  "--ds-color-grey-A400": "default MUI 7.0.1",
  "--ds-color-grey-A700": "default MUI 7.0.1",
  "--ds-color-text-primary": "frontend/src/theme/core/palette.ts:92",
  "--ds-color-text-secondary": "frontend/src/theme/core/palette.ts:92",
  "--ds-color-text-disabled": "frontend/src/theme/core/palette.ts:92",
  "--ds-color-background-default": "frontend/src/theme/core/palette.ts:98",
  "--ds-color-background-paper": "frontend/src/theme/core/palette.ts:98",
  "--ds-color-background-neutral": "frontend/src/theme/core/palette.ts:98",
  "--ds-color-action-hover": "frontend/src/theme/core/palette.ts:104",
  "--ds-color-action-selected": "frontend/src/theme/core/palette.ts:105",
  "--ds-color-action-focus": "frontend/src/theme/core/palette.ts:106",
  "--ds-color-action-disabled": "frontend/src/theme/core/palette.ts:107",
  "--ds-color-action-disabledBackground": "frontend/src/theme/core/palette.ts:108",
  "--ds-color-action-active": "frontend/src/theme/core/palette.ts:115",
  "--ds-color-divider": "frontend/src/theme/core/palette.ts:131",
  "--ds-color-border-paper-outlined": "frontend/src/theme/core/components/paper.tsx:19",
  "--ds-color-border-input-rest": "frontend/src/theme/core/components/textfield.tsx:70",
  "--ds-color-border-input-focus": "frontend/src/theme/core/components/textfield.tsx:55 (resolvido como text.primary nos dois esquemas)",
  "--ds-color-border-input-error": "frontend/src/theme/core/components/textfield.tsx:60",
  "--ds-color-border-input-disabled": "frontend/src/theme/core/components/textfield.tsx:65",
  "--ds-color-border-button-outlined-inherit": "frontend/src/theme/core/components/button.tsx:125",
  "--ds-color-border-nav-sidebar": "frontend/src/layouts/dashboard/css-vars.ts:40",
  "--ds-color-border-toggle-group": "frontend/src/theme/core/components/button-toggle.tsx:82",
  "--ds-color-border-pagination-outlined": "frontend/src/theme/core/components/pagination.tsx:103"
};

export const dsMeta = {
  "project": "AuditorIA — frontend",
  "generatedFrom": "tema MUI 7.0.1 computado em Node + medicoes em runtime (Chrome, viewport 1911x898)",
  "baseTemplate": "Minimal Kit (Minimals) v7.0.0",
  "mui": "7.0.1",
  "emotion": "11.14.0",
  "react": "19.1.0",
  "colorScheme": "light (default)",
  "remBase": {
    "value": "14px",
    "warning": "CRITICO: html { font-size: 14px }. Todo valor em rem renderiza a rem x 14. Os rem do tema foram gerados com divisor 16."
  },
  "colorSyntax": "O projeto emite rgba(R G B / A) (CSS Color 4). Cada token traz tambem a forma rgba(R, G, B, A).",
  "docs": "docs/design-system/*.md"
} as const;
