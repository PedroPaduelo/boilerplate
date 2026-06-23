# 03 — Catálogo de blocos + motor de render por config

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- Layout e gráficos **já vêm prontos**; o que muda é um **arquivo de configuração**.
- A config é cadastrada no banco; o front lê e **renderiza a tela**.
- Catálogo inclui: **gráficos, composições de layout, seções de escrita, títulos**
  e tudo que compõe um dashboard.
- É um dashboard **inovador/narrativo**: o agente pode escrever (markdown), montar
  relatório, não só "tabelão".
- Cada gráfico tem suas **props/configurações**.
- **Documentação rígida**: cada bloco/gráfico documenta quais **dados precisa** para
  ser renderizado — o resultado da query tem que ser **conciliado** com o contrato
  do gráfico.

## Decisões em aberto
- [ ] Lib de gráficos (Recharts / ECharts / visx / outra)?
- [ ] Esquema (schema) da config do dashboard/gráfico — versionado?
- [ ] Contrato de dados por tipo de gráfico (shape de entrada).
- [ ] Catálogo inicial: quais tipos de gráfico/blocos no MVP?
- [ ] Markdown/rich-text: editor e sanitização.

## ✅ Decisão (rodada 6): catálogo é VIVO/aberto
- Não é lista fechada. Plug-and-play de código: pasta do bloco = registro.
- Detalhe completo em `33-catalogo-componentes.md` (anatomia, auto-registro, base inicial,
  receita de extensão). Base inicial: kpi, bar, line, donut, table, title, rich_text.
