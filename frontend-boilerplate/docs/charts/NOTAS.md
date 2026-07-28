# NOTAS — decisões, ambiguidades e riscos da repaginação

> Append-only. Cada entrada: `[LOTE] título` + o que foi decidido e por quê.

---

## [BASE] A referência é do modo CLARO; o produto tem modo escuro

Os valores da referência (`#1C252E` de texto, `#F4F6F8` de faixa do tooltip,
`rgba(145,158,171,.2)` de grade) são do tema claro. O produto tem light/dark.

**Decisão:** guardar o NOME DO TOKEN do DS em vez do hexadecimal. No modo claro o
valor resolvido é **idêntico** ao da referência (conferido token a token — as nove
cores e todo o chrome batem 1:1, porque o tema foi gerado da mesma auditoria de
design); no modo escuro adapta sozinho. Fidelidade onde a referência existe,
coerência onde ela não fala.

## [BASE] Rótulo de eixo: 12px da referência × escala do tema

A referência fixa 12px/400 no rótulo de eixo e 13px/500 na legenda nativa. A
escala tipográfica do tema não tem esses dois degraus exatos (tem 11,375 / 12,25 /
13,125). **Decisão:** usar os pixels da referência, declarados **uma vez** em
`chart-theme.ts` (`CHART_TYPOGRAPHY`) e em `chart-theme.css`. São medidas do
DESENHO, não tipografia de interface — e o briefing pede pixel perfect.

## [BASE] Título do card: 15,75px da referência → `Heading level={3}` (16px)

A referência pede 15,75px/600. O degrau equivalente do tema é 16px/600. **Decisão:**
usar o componente `Heading` do DS: 0,25px de diferença é invisível, e um título de
card precisa ser um heading de verdade para quem navega por leitor de tela.

## [BASE] Hover ESCURECE

A referência é explícita: o hover escurece a série (a maioria das libs clareia).
Como o recharts não tem filtro de estado, a base expõe `palette.hoverAt(i)` —
escurecimento de 20% calculado sobre a cor resolvida. Use em `activeBar`/`activeDot`.

## [BASE] Resolução de token em PROFUNDIDADE

Atributo de apresentação de SVG (`fill`, `stroke`) **não aceita `var()`**. Os slots
semânticos do Astryx apontam para os tokens do DS por referência, então a resolução
de um nível devolvia a string `var(--ds-…)` e o texto do eixo saía preto. O
`useChartPalette` agora segue a cadeia de `var()` até um literal. Isso corrige um
defeito silencioso que já existia antes da repaginação.

## [BASE] Interpolação não formata número pequeno

`{{ano}}` de 2026 formatado viraria "2.026". **Decisão:** sem pipe, inteiro com
módulo < 10.000 sai cru; acima disso ganha separador de milhar. Quem quiser outro
formato pede no pipe: `{{total|compactBRL}}`.

## [BASE] Nomes das cores de série mudaram (sem quebrar contrato)

A paleta passou a ser a da referência, na ordem dela. Os nomes internos viraram
`emerald, amber, cyan, red, green, bronze, forest, steel, navy`. Os nomes antigos
(`blue`, `orange`, `purple`, `pink`, `teal`, `brown`, `indigo`, `gray`) continuam
vÁLIDOS como alias, e `accent` (`chart-1`…`chart-5`, `primary`) continua com o mesmo
significado posicional. **Nenhuma prop pública mudou.**
