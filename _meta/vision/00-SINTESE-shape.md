# Síntese do "shape" dos relatórios maduros (análise visual das 9 imagens via MiniMax-VL)

> Objetivo: a IA precisa compor **relatórios ricos com HIERARQUIA** (seção dentro
> de seção), encapsulando componentes elementares em cards e contando uma
> história (storytelling), em vez de soltar gráficos soltos e desalinhados.

## 1. Padrão de ENCAPSULAMENTO universal (shell visual recorrente)

TODO componente vive dentro de um "card/painel" com:
- borda sutil + raio arredondado (`rounded-xl border border-border`)
- fundo levemente diferente do fundo da tela (`bg-card`)
- **header**: título (+ subtítulo opcional, + badge no canto, + ação/botão à direita)
- **body**: o conteúdo (gráfico/tabela/kpi/texto)
- **footer opcional**: ex. query SQL truncada + duração (`· 42ms`) — padrão `chart-widget`

Referência exata: `chart-widget.tsx` (header com divisória + body + footer).

## 2. HIERARQUIA / ANINHAMENTO (o ponto-chave)

Os relatórios têm **seções de nível 1** (painéis grandes com fundo/borda próprios)
que **CONTÊM** sub-seções/sub-cards num grid interno. Exemplos reais das imagens:

- **"Sumário Executivo"** (seção) → 4 KPI cards + bloco de texto + grid de 2 donuts (PF×PJ).
- **"Distribuição, evolução temporal e inscrições em DA"** (seção) → 3 sub-cards lado a lado (donut + bar + line).
- **"Funil de Cobrança"** → linha de 8 KPIs + pipeline N1→N2→N3 (8/12) + funil donut (4/12).
- **"Rating IGR"** → painel "V-Dev" (6/12) + painel "V-Deb" (6/12), cada um com lista de fatores+pesos; embaixo, 4 cards de faixa (A/B/C/D).
- **"Análise para Transação"** → Sumário (4 KPIs) → Padrão da carteira (4 KPIs) → Perfil PF×PJ (2 donuts) → callout de insight.

➡️ Conclusão: o layout precisa ser **recursivo** — um bloco-container (section/group)
que contém um sub-grid de blocos. Composição em árvore, não lista flat.

## 3. GRID de 12 colunas (recorrente)

- Linhas de KPIs: **4, 6 ou 8** cards lado a lado (span 3 / 2 / 1.5).
- Gráficos: **8/12 + 4/12**, **6/12 + 6/12**, ou **3 × 4/12**.
- Tabelas e funis: **12/12** (largura cheia).
- Cards de recomendação/faixa: **4 × 3/12** coloridos.

## 4. STORYTELLING (ordem da narrativa, top-down)

1. **Header do relatório**: título + subtítulo + (callout "como ler").
2. **KPIs gerais** — a "foto" (linha de stat cards).
3. **Detalhamento** — gráficos (barras, linha, área).
4. **Composição/distribuição** — donuts (PF×PJ, status, faixas).
5. **Detalhamento granular** — tabelas (top N, contribuintes).
6. **Recomendações/ações** — cards coloridos por faixa de valor.

## 5. Componentes elementares usados (já temos ~todos no catálogo de 48)

KPI/stat card · barras horizontais · barras verticais · donut · linha · área ·
tabela · título de seção · texto descritivo (rich_text) · badge/chip · callout/alert ·
barra de progresso · "funil/pipeline" (barras de largura proporcional ao % do total).

Faltando como bloco de dados: **funnel/pipeline** (barra cuja largura = participação),
e o **container/section recursivo** (composição).

## 6. GAP atual (o que impede a IA de fazer isso hoje)

1. **Contrato de layout é FLAT** (`rows → blocks`), sem aninhamento. `block` tem
   `additionalProperties: false` e não aceita filhos.
2. **Render** (BlockRenderer) renderiza o bloco "pelado", sem o shell `chart-widget`.
3. **Catálogo** não tem um bloco `section`/`group` que componha filhos, nem `funnel`.
4. **MCP** só cria layout flat; sem tool pra montar seções aninhadas.
5. **Skill** orienta layout flat (rows+blocks), não composição hierárquica.

Tudo precisa ser coordenado: contrato → render → catálogo → MCP → skill.
