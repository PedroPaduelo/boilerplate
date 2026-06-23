# Organização do catálogo em ABAS (quebra FECHADA com o usuário)

7 abas, categorização SEMÂNTICA (o `kind` técnico — chart/text/title/layout — NÃO serve como aba: mistura KPI/medidor/tabela em "chart" e background/tooltip/container em "layout").

Decisões do usuário:
- Medidores (radial_gauge, progress_circle, progress_bar): delegado ao dev → ficam em **Cards, Métricas & Indicadores** (são escalares, igual KPI).
- Aba "Listas & Conteúdo": manter tudo junto (inclui seções de landing).
- 7 abas, como proposto.

## Abas (48 blocos)

### 1. 📊 Gráficos (8)
line_chart · area_chart · bar_chart · h_bar_chart · donut · scatter_chart · spark_chart · bar_list

### 2. 🔔 Cards, Métricas & Indicadores (9)
kpi · stat_tile · metric_glow · signal_card · radial_gauge · progress_circle · progress_bar · alert · callout

### 3. 🧮 Tabelas & Rankings (4)
table · data_table · invoice_table · leaderboard

### 4. 🗂️ Listas & Conteúdo (7)
connection_list · favorites_list · user_list · query_history · team_section · work_experience · features_section

### 5. 🧱 Layout & Containers (8) — aceitam children
section · collapsible_block · resizable_panels · dashboard_panel · bento_grid · sheet · expandable_cards · divider

### 6. ✨ Efeitos & Decorativos (9)
background_beams · background_boxes · glowing_effect · mobius_loop · pin_3d · hover_card · tooltip_card · tooltip_fluid · card_hover

### 7. 🔤 Texto & Títulos (3)
title · rich_text · flip_words

Total: 8+9+4+7+8+9+3 = 48 ✓ (__example = template, fora)

## Plano de implementação (aplicar na conciliação, depois dos subs fecharem)
- Definir uma `category` por bloco (mecanismo a confirmar via codebase-explorer: campo novo opcional no manifest.ts vs mapa central type→categoria fora do manifest).
- A UI da galeria/picker agrupa por `category` em abas, na ordem acima.
- Fazer DEPOIS que os 6 subs fecharem (eles tocam component.tsx/manifest de alguns blocos) pra evitar colisão de escrita nos manifests.
- Ordem das abas e rótulos exatos: conforme tabela acima.
