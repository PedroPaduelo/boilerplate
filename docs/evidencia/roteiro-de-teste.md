# Roteiro de teste — composição da resposta

As mesmas cinco perguntas rodam ANTES e DEPOIS. Cada uma existe para exercitar
uma regra específica do `docs/composicao-da-resposta.md` — não são perguntas
aleatórias, são casos de teste.

| # | Pergunta | O que está sendo testado | Aprovado quando |
|---|---|---|---|
| 1 | "Quantos contatos temos?" | Resposta curta continua curta (§2) | Uma ou duas frases, com o número em negrito. Sem arco, sem seções, sem tabela |
| 2 | "Como as mensagens evoluíram nos últimos 30 dias?" | Evolução → linha (§3); recorte declarado (§6) | Gráfico de linha em card, com período no subtítulo; conclusão ANTES do gráfico |
| 3 | "Qual a composição das mensagens por status?" | Composição → donut (§3) | Donut (≤5 fatias) ou barra empilhada; valores como contagem, não moeda |
| 4 | "Monte um painel de atendimento do WhatsApp" | Múltiplos gráficos (§6); trilha (§5) | Todos os gráficos em cards alinhados; trilha recolhida ao fim; sem narração no corpo |
| 5 | "Por que os eventos de webhook são muito mais numerosos que as mensagens?" | Arco completo (§2); interpretação, não número (§1) | Conclusão no topo, 3-5 bullets de leitura, premissas, próximos passos |

## Vícios a procurar em toda resposta

Checklist derivado do diagnóstico — cada item já foi visto acontecendo:

- [ ] Texto de raciocínio colado na resposta (`…dashboards.Assumi que…`)
- [ ] Narração de progresso no corpo (`Agora vou consultar…`)
- [ ] Qualquer trecho em inglês
- [ ] Emoji fazendo papel de título (`## 📊`)
- [ ] Identificador técnico no corpo (`cms4h…`)
- [ ] Jargão do sistema (`kpi`, `bar_chart`, `PUBLISHED`, `schema`, `JOIN`)
- [ ] Tabela markdown malformada
- [ ] Contagem formatada como dinheiro ("R$ 11,19 mil")
- [ ] Gráfico fora de card ou sem recorte declarado
- [ ] Mais de duas perguntas de qualificação, ou pergunta sem default
