# Roadmap — auditorIA

Ideias avaliadas durante a revisão de produto/UX e **ainda não implementadas**,
com a justificativa de cada uma. Ordenado por relação valor × esforço.

Legenda: 🔴 essencial para o MVP · 🟡 valioso · 🟢 diferencial

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

### 2. Explicabilidade da resposta ("como cheguei nisso")

**Problema.** Os `tool steps` aparecem durante o streaming e **desaparecem** ao
final (fade-out de 600 ms). Depois disso não há como auditar como um número foi
produzido — justamente o que um auditor precisa.

**Proposta.** Persistir por mensagem: SQL executado, conexão usada, linhas
retornadas e tempo. Expor num disclosure "Ver como foi calculado" e carregar
isso junto do gráfico salvo.

**Impacto.** Transforma o gráfico de "output de IA" em **evidência auditável**.

---

### 3. Fixar a incompatibilidade do provider do agente

**Problema observado.** O provider retorna blocos `thinking` sem `signature` e
o parser do `@ai-sdk/anthropic` rejeita com `Invalid JSON response` (HTTP 200) —
o chat quebra no primeiro turno com tool use.

**Proposta.** Normalizar a resposta antes do parse (ou fixar a versão do SDK
compatível com o proxy). A UI já degrada com mensagem amigável e botão de
retentar, mas o fluxo em si continua bloqueado.

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

### 6. Ligar a exportação em PDF na interface

O backend tem o módulo `export` completo (Playwright + fila + storage), mas a UI
ainda responde `toast.info('Exportação em PDF chega em breve')` nos menus de
dashboards e gráficos. É integração de frontend sobre capacidade já pronta —
provavelmente o melhor retorno por esforço da lista.

### 7. Busca global (⌘K)

Uma paleta de comandos que busca dashboards, gráficos, conexões e tabelas, e
permite disparar uma pergunta ao agente. O público é técnico e navega por
teclado; a dependência `cmdk` já está instalada.

### 8. Estados vazios das telas restantes

`ArtifactListView` agora distingue "sem nada ainda" de "sem resultado para o
filtro". Falta aplicar o mesmo cuidado em **Conexões** (que ainda cai numa grade
vazia sem orientação) e no **workbench** de uma conexão sem tabelas.

---

## 🟢 Diferenciais

### 9. Trilha de auditoria da própria plataforma

Registrar quem perguntou o quê, quem publicou e quem acessou um link público.
Numa ferramenta de auditoria, auditar o auditor é requisito de compliance — e
vira argumento de venda para o setor público.

### 10. Respostas verificadas

Permitir que um analista marque uma resposta como *verificada*. Perguntas
semelhantes passam a exibir o selo e a definição aprovada, criando um efeito de
composição em que o uso melhora a confiabilidade.

### 11. Anotações colaborativas no dashboard

Comentar num ponto específico de um gráfico ("este pico é reclassificação
contábil, não erro"). O contexto de auditoria vive dessas justificativas, que
hoje se perdem em e-mail e WhatsApp.

### 12. Agendamento de relatórios

Enviar um dashboard em PDF por e-mail/WhatsApp num cronograma. A fila, o gerador
de PDF e o canal de WhatsApp já existem — falta o agendador e a UI.

---

## Dívidas técnicas observadas

| Item | Observação |
| --- | --- |
| **Nome dos diretórios** | `backend-boilerplate` / `frontend-boilerplate` não descrevem mais o que contêm. Renomear exige tocar Dockerfiles, CI e o link `file:../shared/contracts`. |
| **Divergência de Zod** | Frontend em Zod v4, backend em v3 (já documentado no README do frontend). Bloqueia compartilhar schemas entre as pontas. |
| **`PlaceholderPage`** | Componente "Fase 0" ainda presente em `shared/components`; verificar se alguma rota ainda o usa. |
| **`useTheme`** | O contexto tem `initialState` como valor padrão, então a checagem `context === undefined` nunca dispara: fora do provider o toggle falharia **em silêncio** em vez de lançar. Trocar o default por `undefined`. |
