# COMPOSIÇÃO DO CATÁLOGO

> Como combinar os blocos para que **um único pedido em linguagem natural**
> resulte num gráfico bonito e num dashboard bonito, consistente e navegável.
>
> Público: o agente de IA que monta dashboards (e quem escreve o prompt dele).
> O inventário completo — todo bloco, toda propriedade, todo valor aceito —
> está em [`MAPA.md`](./MAPA.md), que é **gerado** do código.

---

## 1. A regra que resolve 80% dos casos

**Escolha o bloco pelo FORMATO DO DADO, não pela vontade estética.** O
`dataContract.shape` do manifesto é o filtro; dentro dele, a pergunta que o
leitor quer responder decide o resto.

| tenho…                        | quero responder                    | use                                                     |
| ----------------------------- | ---------------------------------- | ------------------------------------------------------- |
| um número                     | "como estamos?"                    | `kpi`                                                   |
| um número + meta              | "quanto falta?"                    | `progress_bar` (linear) ou `progress_circle` (destaque) |
| um número + faixa             | "em que zona caiu?"                | `radial_gauge`                                          |
| um número + tendência         | "como estamos e para onde vai?"    | `signal_card` (número + mini-gráfico)                   |
| série temporal                | "como evoluiu?"                    | `line_chart`                                            |
| série temporal + volume       | "como evoluiu e quanto pesa?"      | `area_chart`                                            |
| série temporal, espaço mínimo | "a direção, sem ler valor"         | `spark_chart`                                           |
| categorias, poucas            | "quem é maior?"                    | `bar_chart`                                             |
| categorias, rótulo longo      | "quem é maior, com o nome legível" | `h_bar_chart`                                           |
| categorias, ranking com valor | "top N"                            | `bar_list` / `leaderboard`                              |
| categorias, partes de um todo | "qual a composição?"               | `donut`                                                 |
| duas medidas por item         | "há correlação?"                   | `scatter_chart`                                         |
| tabela                        | "quais são os registros?"          | `table` / `data_table` / `invoice_table`                |

**Anti-regra:** rosca com mais de 5 fatias não responde nada — vira arco-íris.
Acima disso, `bar_list` ordenado responde melhor a mesma pergunta.

---

## 2. Hierarquia: o dashboard tem três níveis, não mais

1. **Título da aba/seção** — o assunto. Um por tela.
2. **Título da linha** (`Row.title`) — o agrupamento (`"Receita"`, `"Operação"`).
3. **Título do bloco** — o que aquele desenho mede.

Se você sentir falta de um quarto nível, o problema é que a tela tem dois
assuntos: separe em duas abas.

**Texto de apoio** (`rich_text`, `callout`, `alert`) entra **antes** do que
explica, nunca depois — quem lê o gráfico primeiro e a explicação depois já
tirou a conclusão errada.

---

## 3. Cor: o dado escolhe, não o gosto

O catálogo tem **uma paleta de 9 cores** (`chart-theme.ts`), na ordem da
referência de design. As regras:

- **Uma série → cor do produto.** Não escolha `accent` sem motivo. Um dashboard
  onde cada gráfico tem uma cor diferente não tem hierarquia: tem confusão.
- **`accent` serve para CATEGORIZAR**, não para enfeitar: use quando o bloco
  representa uma dimensão que se repete pela tela (receita sempre verde,
  despesa sempre âmbar).
- **`palette: 'multi'`** (uma cor por categoria) só em bloco onde a categoria
  **é** a informação — ranking, composição. Num gráfico de evolução, ele
  quebra a leitura temporal.
- **Precedência** (corrigida nesta revisão): `accent` explícito **vence sempre**;
  `palette: 'multi'` só liga o modo multicolorido quando não há `accent`. Antes,
  `accent` só funcionava se `palette` fosse `'single'` — e como o default não
  era esse, **oito gráficos ignoravam a cor pedida em silêncio**.
- **Status é semântico, não decorativo**: verde/âmbar/vermelho só quando
  significam bom/atenção/ruim. Um gráfico vermelho "porque ficou bonito"
  mente para quem dá plantão.

---

## 4. Espessura e tamanho: escolha o degrau, não o número

A espessura da marca que carrega o dado é uma **escala em pixel** (base 4 do
tema). Nenhum bloco inventa medida:

| degrau | onde                                       |
| ------ | ------------------------------------------ |
| 2px    | traço de mini-gráfico (`spark_chart`)      |
| 2,5px  | traço de linha/área com eixo               |
| 6px    | marcador (diâmetro)                        |
| 12px   | barra de LISTA (ranking, progresso, funil) |
| 24px   | anel de circular; teto da barra horizontal |
| 32px   | teto da coluna                             |

Alturas: **320px** para todo gráfico com eixo, **240px** para circulares,
**56px** para mini-gráfico. Quem precisa de outra coisa passa `height`
explícito — o tema só publica os degraus que o sistema usa.

Detalhe e histórico em [`../charts/NOTAS.md`](../charts/NOTAS.md).

---

## 5. Receitas prontas

As composições abaixo cobrem a maioria dos pedidos. O agente pode copiá-las e
trocar só os dados.

> ⚠️ **Esta seção é preenchida ao final da revisão do sistema de layout** — as
> receitas usam a API de grid definida lá, e publicá-las antes seria documentar
> um contrato que vai mudar na semana seguinte.

---

## 6. Erros que o catálogo não impede (e por que evitá-los)

| erro                                           | por que dói                                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Gráficos de tamanhos diferentes na mesma linha | O olho lê tamanho como importância; tamanhos aleatórios inventam uma hierarquia que o dado não tem.        |
| Rosca com 8 fatias                             | Acima de ~5 partes ninguém compara ângulos. Use ranking.                                                   |
| Eixo Y começando fora do zero em barras        | A barra codifica COMPRIMENTO; cortar a base multiplica a diferença visual. (Em linha, cortar é aceitável.) |
| Um `accent` diferente por bloco                | Cor vira ruído e o leitor para de associar cor a significado.                                              |
| Título do bloco repetindo o título da linha    | Duas vezes a mesma palavra ocupa o lugar da informação que faltava.                                        |
| KPI sem comparação                             | "R$ 1,2 mi" não diz nada sozinho: acompanhe de variação ou meta.                                           |
