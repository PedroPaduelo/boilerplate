# Roadmap — auditorIA

Ideias avaliadas durante as revisões de produto/UX e **ainda não implementadas**,
com a justificativa de cada uma. Ordenado por relação valor × esforço.

Legenda: 🔴 essencial para o MVP · 🟡 valioso · 🟢 diferencial

> **Concluído desde a última revisão** (sai desta lista, entra no README):
> exportação de dashboard em PDF ligada na interface · gráfico da resposta do
> agente restaurado ao recarregar · pergunta ao agente direto da paleta (⌘K).

---

## 🔴 Essenciais

### 1. Camada semântica (métricas governadas)

**Problema.** Hoje o agente faz text-to-SQL direto sobre o schema cru. Duas
perguntas equivalentes ("faturamento" vs "receita") podem gerar SQLs diferentes
e números divergentes — o que é inaceitável num produto de *auditoria*, onde a
resposta precisa ser defensável.

**Proposta.** Um registro de métricas versionadas (nome, definição SQL, dimensões
permitidas, dono) que o agente é obrigado a usar antes de escrever SQL livre.

**Por que agora.** É o consenso do mercado em 2025/2026: benchmarks de
conversational BI mostram queda expressiva de erro quando o agente consulta uma
camada semântica em vez do schema cru. É também o maior diferencial defensável
do produto.

---

### 2. Fixar a incompatibilidade do provider do agente

**Problema observado.** O provider retorna blocos `thinking` sem `signature` e
o parser do `@ai-sdk/anthropic` rejeita com `Invalid JSON response` (HTTP 200) —
o chat quebra no primeiro turno com tool use.

**Proposta.** Normalizar a resposta antes do parse (ou fixar a versão do SDK
compatível com o proxy). A UI já degrada com mensagem amigável e botão de
retentar, mas o fluxo em si continua bloqueado.

---

### 3. Título de página (`h1`) nas telas autenticadas

**Problema observado nesta revisão.** As listagens (`/dashboards`, `/charts`,
`/connections`) removeram o próprio título com o comentário *"o h1 da topbar do
shell já diz o nome da tela"*. Quando a topbar passou a exibir a marca
(`auditorIA`), essas telas ficaram **sem nenhum `h1`**: não há "você está aqui"
para quem olha, nem nível 1 no documento para quem navega por leitor de tela.

**Proposta.** Decidir de uma vez onde mora o título — topbar (`Heading level={4}
accessibilityLevel={1}` ao lado da marca, no padrão *marca › página*) **ou** o
cabeçalho de cada página — e aplicar nas quatro telas. O importante é que exista
exatamente um, e sempre o mesmo lugar.

---

## 🟡 Valiosas

### 4. Monitoramento proativo de métricas (estilo "Pulse")

Em vez de esperar a pergunta, a plataforma observa métricas publicadas e avisa
sobre desvios ("despesas com combustível 38% acima da média trimestral").
Encaixa perfeitamente em auditoria, que é uma disciplina de *exceções*, e
reaproveita a infraestrutura de filas (BullMQ) e o canal de WhatsApp já
existentes.

### 5. Escopo de dados por conversa ("espaços")

Amarrar cada conversa a uma conexão/domínio, como os *Genie Spaces* do
Databricks. Reduz alucinação (menos schema no contexto), acelera a resposta e
deixa o RBAC mais previsível.

### 6. Exportar um gráfico isolado

O menu de um gráfico **não oferece mais "Exportar"**: o backend só exporta
dashboards, e um item que respondia *"chega em breve"* é promessa no lugar de
função. Duas saídas possíveis, nesta ordem de esforço:

- **PNG no cliente** — serializar o SVG do bloco renderizado. Resolve o caso
  real (colar o gráfico num relatório) sem tocar no backend.
- **PDF de gráfico** — reaproveitar o pipeline do `export` com uma rota
  `/print/charts/:id`. Mais caro; só vale se aparecer demanda de gráfico
  isolado com cabeçalho institucional.

### 7. Estados vazios das telas restantes

`ArtifactListView` e `/connections` já distinguem "sem nada ainda" de "sem
resultado para o filtro". Falta o mesmo cuidado no **workbench** de uma conexão
sem tabelas.

### 8. Ampliar a paleta de comandos

A ⌘K hoje navega, cria e **pergunta ao agente**. Próximos passos, na ordem de
valor:

- **Busca em tabelas e colunas** das conexões — quem investiga costuma procurar
  `nf_itens` antes de procurar um dashboard.
- **Ações contextuais por tela** (publicar/duplicar/compartilhar o artefato
  aberto), no modelo de "páginas" do Raycast.
- **Enviar a pergunta direto** da paleta, sem passar pelo composer — hoje ela
  chega escrita e espera o Enter, decisão deliberada (ver README). Vale medir se
  o passo extra incomoda antes de removê-lo.

### 9. Resposta com vários gráficos mostra só um

Medido numa conversa real da base: um único turno gravou **7 gráficos**
(`toolData.charts`) e a mensagem exibe apenas o último — mesma regra do
streaming, onde cada evento `chart` sobrescreve o anterior. É consistente, mas
perde trabalho que o agente já fez.

Resolver exige trocar `ChatMessage.chart` (singular) por uma lista no modelo da
tela, no reducer e no contrato do socket — e decidir a apresentação (carrossel?
empilhado? um cartão "mais 6 gráficos"?). Vale medir a frequência antes.

### 10. Densidade configurável (confortável / compacta)

A tendência 2026 aponta para alta densidade, mas o ponto ideal varia por
usuário e por tela. Um toggle que ajusta paddings e altura de linha via um
token (`--density`) atende os dois públicos sem bifurcar componentes.

### 11. Progresso do export em segundo plano

Hoje a exportação avisa por toast na largada, no fim e no erro; enquanto roda,
o botão fica em estado de carregamento. Para dashboards muito pesados (ou vários
exports em sequência) faria sentido uma bandeja de tarefas com progresso e
histórico de downloads — o backend já expõe `state` por job.

---

## 🟢 Diferenciais

### 12. Trilha de auditoria da própria plataforma

Registrar quem perguntou o quê, quem publicou e quem acessou um link público.
Numa ferramenta de auditoria, auditar o auditor é requisito de compliance — e
vira argumento de venda para o setor público.

### 13. Respostas verificadas

Permitir que um analista marque uma resposta como *verificada*. Perguntas
semelhantes passam a exibir o selo e a definição aprovada, criando um efeito de
composição em que o uso melhora a confiabilidade.

### 14. Anotações colaborativas no dashboard

Comentar num ponto específico de um gráfico ("este pico é reclassificação
contábil, não erro"). O contexto de auditoria vive dessas justificativas, que
hoje se perdem em e-mail e WhatsApp.

### 15. Agendamento de relatórios

Enviar um dashboard em PDF por e-mail/WhatsApp num cronograma. A fila, o gerador
de PDF e o canal de WhatsApp já existem — e agora a interface também sabe pedir
um export. Falta o agendador e a tela de assinaturas.

### 16. Feedback 👍/👎 persistido

O componente existe e é acessível, mas não é ligado: sem endpoint, o botão
registraria a opinião em lugar nenhum. Precisa de uma coluna em `ChatMessage` e
uma rota — e, aí sim, vira sinal para as *respostas verificadas* (item 13).

### 17. Aprovação prévia de ação destrutiva

O agente tem `delete_chart`, `delete_dashboard` e `unpublish_*`. Hoje o passo
destrutivo é **marcado** na trilha (`isDestructive`), mas não pede confirmação.
Implementar aprovação exige pausar o loop do AI SDK e reter o turno no Redis à
espera da resposta — mudança de arquitetura, não de tela.

---

## Dívidas técnicas observadas

| Item | Observação |
| --- | --- |
| **Nome dos diretórios** | `backend-boilerplate` / `frontend-boilerplate` não descrevem mais o que contêm. Renomear exige tocar Dockerfiles, CI e o link `file:../shared/contracts`. |
| **Divergência de Zod** | Frontend em Zod v4, backend em v3 (já documentado no README do frontend). Bloqueia compartilhar schemas entre as pontas. |
| **Typecheck com erros conhecidos** | `share/public-dashboard-view.tsx` (payload público × contrato do renderer) e `render-engine/catalog/catalog.test.tsx` (variância de `BlockDefinition`). Ambos anteriores a esta revisão; nenhum afeta runtime, mas mascaram erros novos no mesmo comando. |
| **`useTheme`** | O contexto tem `initialState` como valor padrão, então a checagem `context === undefined` nunca dispara: fora do provider o toggle falharia **em silêncio** em vez de lançar. Trocar o default por `undefined`. |
| **Playwright no ambiente de dev** | O worker de export exige o Chromium do Playwright (`npx playwright install chromium`). Sem ele o job falha com "Executable doesn't exist" — a mensagem chega correta à interface, mas o setup deveria estar no README de onboarding do backend. |
