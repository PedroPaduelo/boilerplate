---
name: dashboards-fiscalizai-cda-protesto
description: Sub-skill 3 do banco SCH (Palmas) - CDA (Certidao de Divida Ativa), Protesto, Divida Ativa, LIVRO1, ARQ1033, CONTROLE_PROTESTO_ITENS, PROC_FORUM, Demonstrativo do contribuinte, Taxa de Recuperacao do Protesto, Eficacia dos Canais. 12 memorias canonicas (jun/2026). Ative quando a tarefa envolver CDA, protesto, divida ativa, execucao fiscal ou eficacia de canais de cobranca.
---

# dashboards-fiscalizai-cda-protesto

> Sub-skill especializada do banco SCH (Palmas) - FiscalizaIA.
> Ative esta skill quando o tema da conversa for cda/protesto.
> Para o indice completo e o modelo conceitual, abra a mestra:
> `dashboards-fiscalizai-palmas`.
>
> Encoding do banco: **LATIN1**. Toda query abaixo usa ASCII/acentos
> pt-BR; NUNCA travessao, reticencias, seta, aspas curvas ou simbolos
> matematicos Unicode em literais SQL.

## Indice das 12 memorias desta sub-skill

### [07] INVENTÁRIO DE COLUNAS COMO CONTROLE DE PAGAMENTO EM ARQ1033 e LIVRO1 (jun/2026)

INVENTÁRIO DE COLUNAS COMO CONTROLE DE PAGAMENTO EM ARQ1033 e LIVRO1 (jun/2026, task cmqh7h0ls00a7of0ityjeusj5)
Pergunta do usuário: "As tabelas de certidão de protesto têm algum controle de situação/status que indique pagamento? Tem tipo 'quitada'? Ou a informação vem indiretamente via pagamento da DUAM vinculada?"
Esta memória documenta o inventário completo das 44+42 colunas relevantes e a resposta DEFINITIVA.
ARQ1033 - 44 colunas (NÃO existe controle direto de "pago/quitado")
Inventário completo (jun/2026): | Coluna | Tipo | É controle de pagamento? | Evidência | |---|---|---|---| | IS_CERTIDAO_CANCELADA | boolean | Único controle, mas é evento TÉCNICO (cartório baixou), NÃO financeiro | 32.840 true (2,80%) - mas 99,17% dessas 32.566 foram criadas E canceladas em 2026 (saneamento) | | DT_CIENTE | date | NÃO - é data em que o cliente foi notificado pelo cartório | 99,2% preenchido | | DT_EMISSAO | date | NÃO - data de emissão da certidão pelo cartório | só 7,8% preenchido | | DT_CERTIDAO | date | NÃO - data do protesto | 99,2% preenchido | | DATA_VENCIMENTO | date | NÃO - data em que o protesto expira | pouco preenchido | | DATA_COMPRA | date | NÃO - data em que o cartório comprou o protesto | pouco preenchido | | QTD_DIAS_VALIDA | bigint | NÃO - duração da certidão em cartório | - | | DT_RETIFICACAO | date | NÃO - carta de correção | raro | | RETIFICADA | integer | NÃO - flag de retificação | - | | DATA_ENVIO_SPC | date | Indireto - negativação no SPC/Serasa | só 1,7% preenchido | | DATE_EXCLUSAO_SPC | date | Indireto - exclusão do SPC | raro | | ENVIO_SPC | boolean | Indireto - flag de envio | 90,9% false (sem envio) | | NR_PROCESSO | bigint | NÃO - nº do processo do cartório (176.860 preenchidos, só 2 valores distintos = lote) | não é PK | | DUAM | bigint | VÍNCULO com DUAM | só 93 (0,0079%) preenchidos - caminho inviável | | DUAM_HONORARIOS | integer | NÃO - duam extra de honorários | raro | | VL_EMOLUMENTO_CARTORIO | numeric | NÃO - custo (e está 100% zerado!) | - | | CARTA | text | NÃO - texto da carta | - | | OBSERVACAO | text | NÃO - anotação livre | - | | OBSERVACAO_ALTERACAO | text | NÃO - anotação de alteração | - | | FISCAL | integer | NÃO - FK para o fiscal | - | | CCP/CCI/CGC_CCP/ENDERECO/BAIRRO/... | vários | NÃO - chaves de pessoa/imóvel | - | Conclusão ARQ1033: NÃO existe nenhuma coluna com mnemônico tipo "PAGO", "QUITADO", "LIQUIDADO", "EFETIVADO", "BAIXA_PAGAMENTO", "RECEBIDO". O único controle de estado é IS_CERTIDAO_CANCELADA (boolean), que indica evento técnico no cartório, não financeiro.
LIVRO1 - 42 colunas (tem 3 controles potenciais)
| Coluna | Tipo | É controle de pagamento? | Evidência | |---|---|---|---| | SITUACAO | varchar(2) | SIM - 18 mnemônicos incluindo "Q" (Quitada), "E" (Extinta), "C" (Cancelada), "D" (Devolvida por AGM) | 779.557 CDAs com "Q"; 99,99% têm FLAG_PG_TOTAL='1' na DUAM subjacente | | DATA_AJUIZAMENT | date | Indireto - em execução judicial | 28,4% preenchido | | DATA_AGM | date | SIM - cancelada por Ato da Gestão Municipal | 6,4% preenchido (174.026) | | DATA_RECEBIDO | date | MORTA - 0% preenchido (depreciada) | 0 | | NR_CONTROLE_PROTESTO | bigint | NÃO - é o número do LOTE de protesto (formato AAAANNNNNNNN = ANO+SEQUENCIAL), não ID da certidão | 426.767 com valor > 0, 6.280 distintos; lote com 50.976 CDAs | | IS_CONTROLE_OUTRO_SISTEMA | boolean | NÃO | raro | | IS_IMPRESSO_INFORMATIVO | boolean | NÃO - impressão | - | | DUAM_IT/PARCELA | bigint/int | NÃO - chaves | - | | VL_* | numeric | NÃO - valores | - | | PROC_FORUM | varchar | NÃO - nº do processo judicial | - | Conclusão LIVRO1: a coluna SITUACAO='Q' (= Quitada) É o sinal de "paga" canônico. 99,99% das CDAs "Q" têm FLAG_PG_TOTAL='1' na DUAM. Esta é a medida MAIS RIGOROSA de "CDA paga".
A resposta DEFINITIVA sobre o caminho ARQ1033 -> DUAM
O usuário sugeriu 4 caminhos para responder "o cancelamento do Protesto vem de pagamento?". Investigados: | Caminho | Funciona? | Resultado | |---|---|---| | ARQ1033.DUAM = DUAM.DUAM (FK explícita) | NÃO estatisticamente | só 93 (0,0079%) vínculos; 0 das canceladas | | LIVRO1.NR_CONTROLE_PROTESTO = ARQ1033.RECNUM | NÃO | 0 matches | | LIVRO1.NR_CONTROLE_PROTESTO = ARQ1033.NR_PROCESSO | NÃO | 0 matches; NR_PROCESSO tem só 2 valores distintos (não é PK) | | LIVRO1.CCI = ARQ1033.CCI (vínculo por imóvel) | SIM | 7.622.528 matches; 142.857 canceladas com match; cobre 26,5% das certidões |
A grande revelação (jun/2026): o município MANTÉM certidões ATIVAS após a CDA ter sido paga!
Cruzamento ARQ1033.CCI = LIVRO1.CCI (com CCI preenchido em ambos) + status de quitação da DUAM: | Status certidão | Qtd com CCI | CDA paga no mesmo CCI | % paga | |---|---:|---:|---:| | CANCELADA | 8.130 | 5.403 | 66,46% | | ATIVA | 266.159 | 252.055 | 94,70% | | INICIAL | 36.178 | 27.759 | 76,73% | Achado contraintuitivo #12: certidões ATIVAS têm 94,7% de CDA paga no mesmo imóvel - MAIS que as canceladas (66,5%). Ou seja, o cartório NÃO está sendo notificado de que a dívida foi paga. Mantém o protesto ativo sobre imóvel já quitado. Cruzamento inverso (Q-S.21):
122.838 CCIs têm CDA paga em DA E certidão de protesto
Destes: 2.751 (2,24%) têm a certidão CANCELADA - 97,76% mantêm certidão ativa sobre imóvel pago!
Diagnóstico final
A taxa "2,80%" de certidões canceladas é puramente TÉCNICA - mede o evento operacional de baixar a certidão no cartório. Ela NÃO mede pagamento. E a medição pelo caminho mais rico (CCI) mostra que o canal Protesto tem uma falha operacional grave: quando a CDA é paga, o cartório geralmente não é avisado para cancelar a certidão. Isso é o que a pergunta do usuário estava intuindo.
Query canônica para investigar (a que responde à hipótese do usuário)
WITH cert_cci AS (
  SELECT "RECNUM" AS cert_id, "CCP" AS cert_ccp, "CCI" AS cert_cci,
    "IS_CERTIDAO_CANCELADA" AS canc
  FROM "SCH"."ARQ1033"
  WHERE "CCI" > 0
),
cda_da_paga_por_cci AS (
  SELECT l."CCI", bool_or(d."FLAG_PG_TOTAL" = '1') AS cda_paga
  FROM "SCH"."LIVRO1" l
  JOIN "SCH"."DUAM" d ON d."DUAM" = l."DUAM_IT"
  WHERE EXISTS (
    SELECT 1 FROM "SCH"."DUAM_IT" it
    WHERE it."DUAM" = l."DUAM_IT" AND it."DATA_DIV_ATI" IS NOT NULL
  )
  GROUP BY l."CCI"
)
SELECT
  CASE
    WHEN c.canc = true THEN '1_CANCELADA'
    WHEN c.canc = false THEN '2_ATIVA'
    WHEN c.canc IS NULL THEN '3_INICIAL'
  END AS status_certidao,
  count(*) AS qtd_certidoes_com_cci,
  count(*) FILTER (WHERE p.cda_paga) AS cda_paga_vinculada,
  round(100.0 * count(*) FILTER (WHERE p.cda_paga) / count(*), 2) AS pct_cda_paga
FROM cert_cci c
LEFT JOIN cda_da_paga_por_cci p ON p."CCI" = c.cert_cci
GROUP BY 1 ORDER BY 1;copiar
Memórias relacionadas
cmqh5p2bz009zof0iiw4prdub - STATUS/SITUAÇÃO CDA × Protesto (contexto IS_CERTIDAO_CANCELADA)
cmqcp38pi00impl0izbsac41s - JOIN correto LIVRO1.DUAM_IT = DUAM_IT.DUAM
cmqbl4frb000vpl0iu1lsphvk - DUAM.REC = TIPOAVIS.CD_TIPOAVI
cmqhyx6xi00dzp30ibgef0x0m - REVISÃO METODOLÓGICA - Taxa de Recuperação do Protesto (contexto da revisão anterior)
ARQ1033 - 44 colunas (NÃO existe controle direto de "pago/quitado")
Inventário completo (jun/2026): - IS_CERTIDAO_CANCELADA (boolean) - Único controle, mas é evento TÉCNICO (cartório baixou), NÃO financeiro - 32.840 true (2,80%) - mas 99,17% dessas 32.566 foram criadas E canceladas em 2026 (saneamento) - Nenhuma coluna tipo "PAGO", "QUITADO", "LIQUIDADO", "EFETIVADO"

LIVRO1 - 42 colunas (tem 3 controles potenciais)
- SITUACAO (varchar(2)) - SIM - 18 mnemônicos incluindo "Q" (Quitada) - 99,99% das CDAs "Q" têm FLAG_PG_TOTAL='1' na DUAM subjacente - DATA_AJUIZAMENT - em execução judicial - DATA_AGM - cancelada por Ato da Gestão Municipal - DATA_RECEBIDO - MORTA - 0% preenchido (depreciada)

A grande revelação: o município MANTÉM certidões ATIVAS após a CDA ter sido paga!
- Certidões ATIVAS têm 94,7% de CDA paga no mesmo imóvel - MAIS que as canceladas (66,5%) - 97,76% mantêm certidão ativa sobre imóvel pago! - O canal Protesto tem uma falha operacional grave

A taxa "2,80%" é puramente TÉCNICA - mede o evento operacional de baixar a certidão no cartório. Ela NÃO mede pagamento.
REVISÃO METODOLÓGICA - Taxa de Recuperação do Protesto (jun/2026) cmqhyx6xi00dzp30ibgef0x0m

---

### [08] REVISÃO METODOLÓGICA - Taxa de Recuperação do Protesto (jun/2026)

REVISÃO METODOLÓGICA - Taxa de Recuperação do Protesto (jun/2026, task cmqh7h0ls00a7of0ityjeusj5)
Descoberta crítica: o relatório "Eficácia dos Canais" (jun/2026) usou IS_CERTIDAO_CANCELADA=true (32.840 de 1.172.911 = 2,80%) como proxy de "taxa de sucesso do Protesto". Essa medida é falha - não captura o efeito do protesto sobre a dívida subjacente. Esta memória documenta a crítica do usuário e a métrica correta.
O erro metodológico
A pergunta certa é: "um protesto leva ao pagamento da dívida relacionada?". A medida "certidão cancelada" no cartório é apenas o evento técnico de baixar a certidão, não a recuperação financeira. E no caso do município de Palmas/TO, esse evento técnico está contaminado por um saneamento administrativo em 2026 que invalida qualquer inferência.
Investigação do vínculo ARQ1033 -> DUAM (jun/2026)
1) Vínculo direto ARQ1033.DUAM (a coluna FK explícita):
1.172.911 certidões totais
93 (0,0079%) com ARQ1033.DUAM preenchido - caminho direto inviável estatisticamente
0 das 32.840 canceladas têm DUAM preenchido (é todo dado de certidões ATIVAS)
Hipótese do usuário "taxa = pagamento da DUAM relacionada" só funciona por esse caminho pra 93 casos, não dá pra inferência geral
2) Vínculo por CCP (CCPs protestados × pagamento de QUALQUER DUAM):
94.850 CCPs únicos com protesto
94.777 (99,9%) têm DUAM no cadastro
88.895 (93,79%) pagaram pelo menos 1 DUAM
6.286.993 / 6.976.591 DUAMs (90,16%) estão PAGAS entre CCPs protestados
3) Comparação controlada COM_protesto vs SEM_protesto: | Grupo | CCPs | % pagaram >=1 DUAM | % DUAMs pagas | |---|---:|---:|---:| | COM_protesto | 94.777 | 93,79% | 90,16% | | SEM_protesto | 178.408 | 96,19% | 96,06% | Diferença: ~2,4 p.p. a menos de pagamento em CCPs protestados. Quem é protestado paga MENOS (não mais). Mas é correlação, não causalidade - protesto é aplicado a quem já é devedor contumaz. 4) Por status do protesto: | Status do CCP | CCPs | % pagaram >=1 DUAM | % médio de DUAMs pagas (média por CCP) | |---|---:|---:|---:| | SO_ATIVA (só protesto ativo) | 64.641 | 95,81% | 85,13% | | SO_CANCELADA (só certidões canceladas) | 2.584 | 87,85% | 72,54% | | MISTO ativa+cancelada | 14.207 | 97,78% | 74,26% | | MISTO 3 estados | 13.418 | 80,49% | 53,16% |
A anomalia "saneamento de 2026"
99,17% das certidões canceladas (32.566 de 32.840) foram CRIADAS e CANCELADAS em 2026 (jan-mai). Distribuição por mês de DT_CERTIDAO:
2026-01: 684
2026-02: 23.367
2026-03: 138
2026-04: 4.218
2026-05: 4.159
Impossível como "cancelamento por pagamento": do protesto à quitação da DUAM à comunicação do cartório, são tipicamente semanas a meses. Certidões criadas e canceladas em meses diferentes, mas com pico em fevereiro, é incompatível com pagamento real. Causas prováveis (em ordem de plausibilidade):
Saneamento administrativo - migração, correção de erros de cadastro em massa
Erro de sistema - bug que criou e cancelou automaticamente
Decisão judicial/AGM - cancelamento via Ato da Gestão Municipal (mas não há coluna de "motivo" em ARQ1033)
A métrica CORRETA (mas ainda imperfeita)
A taxa de "sucesso do Protesto" tem 3 leituras possíveis: Leitura A - Conservadora (rigorosa): usar IS_CERTIDAO_CANCELADA = true como proxy
2,80% (32.840 / 1.172.911)
MAS 99% disso é o saneamento de 2026, não pagamento
"Taxa de cancelamento histórico pré-2026" = 274 / 1.172.911 = 0,023% (nenhuma inferência útil)
Leitura B - Proxy CCP (aceita hipótese do usuário): CCP protestado que pagou >=1 DUAM
88.895 / 94.777 = 93,79%
Correlação forte, MAS não é causal - protestado paga menos (90,16%) que não protestado (96,06%)
Mostra que quem é protestado não é "resgatado" pelo protesto - é devedor contumaz que às vezes paga à revelia
Leitura C - Diferencial de pagamento (causal): comparar DUAMs pagas COM protesto vs SEM protesto no mesmo período
90,16% (com protesto) vs 96,06% (sem protesto) - quem tem protesto paga MENOS em 5,9 p.p.
Sugere que o Protesto não tem efeito positivo mensurável sobre a taxa de quitação; se tivesse, esperaríamos o oposto
Conclusão da revisão
A hipótese do usuário está CERTA na intuição (taxa precisa olhar pagamento, não cancelamento técnico) MAS a métrica certa não é "DUAM da certidão" (caminho inviável). A métrica certa é o CCP protestado que pagou DUAM, e essa métrica mostra que:
93,79% dos CCPs protestados pagaram alguma coisa (mas isso é só "são pagadores parciais")
Eles pagam MENOS que os não-protestados (90,16% vs 96,06%) - Protesto NÃO é causa de pagamento
A conclusão do relatório sobre Protesto ("canal de menor eficiência, ranking 3º") se mantém, mas com a ressalva: a medida 2,8% é técnica (cancelamento de certidão), não financeira (recuperação de dívida). As duas medidas contam coisas diferentes, e a financeira (via CCP) corrobora a conclusão: Protesto não é causa de pagamento.
Implicação para o relatório
A taxa "2,80%" deve ser rotulada como "taxa de cancelamento TÉCNICO de certidão", não "taxa de sucesso/recuperação do Protesto"
Adicionar a medida por CCP: 93,79% dos CCPs protestados têm >=1 DUAM paga, e 90,16% das DUAMs desses CCPs estão pagas
MAS contextualizar: CCPs não-protestados têm 96,19%/96,06% - Protesto não está fazendo diferença (correlação, não causa)
A anomalia do "saneamento 2026" precisa de explicação operacional antes de qualquer uso dos dados de cancelamento
Query canônica para re-medir "taxa de recuperação" do Protesto
WITH ccps_protest AS (
  SELECT DISTINCT "CCP" FROM "SCH"."ARQ1033"
),
duam_pag AS (
  SELECT "CCP",
    bool_or("FLAG_PG_TOTAL" = '1') AS pagou,
    count(*) FILTER (WHERE "FLAG_PG_TOTAL" = '1') AS qtd_pagas,
    count(*) AS qtd_total
  FROM "SCH"."DUAM"
  GROUP BY "CCP"
)
SELECT
  CASE WHEN p."CCP" IS NOT NULL THEN 'COM_PROTESTO' ELSE 'SEM_PROTESTO' END AS grupo,
  count(*) AS qtd_ccps,
  count(*) FILTER (WHERE d.pagou) AS ccps_pagaram,
  round(100.0 * count(*) FILTER (WHERE d.pagou) / count(*), 2) AS pct_pagaram,
  sum(d.qtd_total) AS duams_total,
  sum(d.qtd_pagas) AS duams_pagas
FROM duam_pag d
LEFT JOIN ccps_protest p USING("CCP")
GROUP BY 1;copiar
Memórias relacionadas
cmqh5p2bz009zof0iiw4prdub - STATUS/SITUAÇÃO CDA × Protesto (contexto da coluna IS_CERTIDAO_CANCELADA)
cmqcp38pi00impl0izbsac41s - JOIN correto LIVRO1.DUAM_IT = DUAM_IT.DUAM
cmqbl4frb000vpl0iu1lsphvk - DUAM.REC = TIPOAVIS.CD_TIPOAVI (caminho de receita)
> O relatório "Eficácia dos Canais" usou IS_CERTIDAO_CANCELADA=true (2,80%) como proxy de "taxa de sucesso do Protesto". Essa medida é falha.

Investigação do vínculo ARQ1033 -> DUAM
1. Vínculo direto ARQ1033.DUAM - só 93 (0,0079%) vínculos. Caminho inviável. 2. Vínculo por CCP - 93,79% pagaram >=1 DUAM 3. Comparação controlada: - COM_protesto: 90,16% das DUAMs pagas - SEM_protesto: 96,06% das DUAMs pagas 4. Protestados pagam MENOS que não-protestados (correlação, não causa)

A anomalia "saneamento de 2026"
99,17% das certidões canceladas (32.566 de 32.840) foram CRIADAS e CANCELADAS em 2026 (jan-mai). Pico em fevereiro: 23.367 - incompatível com pagamento real (semanas/meses entre protesto e quitação).
A métrica CORRETA
- 93,79% dos CCPs protestados pagaram alguma coisa - 90,16% das DUAMs de CCPs protestados estão pagas (vs 96,06% não-protestados) - Protesto NÃO é causa de pagamento (correlação, não causa)

RESUMO OPERACIONAL - conversa cmqh0fzu5009lof0i6lgwfh39 (jun/2026) cmqh4ub03009vof0ia63urthb

---

### [10] Dashboard "Análise para Transação" agora é GENÉRICO por receita (rotas /api/analise-receita/:cd/*) - jun/2026

O backend do dashboard "Análise para Transação" (antes fixo em CD_ANALISE_TRANSACAO=92327) foi generalizado para QUALQUER receita de multa. Commits 278009c (generalização) + baf0df9 (otimização query status) + 0593943 (correção semântica criticos) + efbdccc (refinamento protesto ativo/cancelado). backend/src/server.js + frontend/src/pages/AnaliseTransacao.jsx.
Rotas novas (parametrizadas por :cd)
GET /api/analise-receita/:cd/kpis - totais + status 1-2-3 + ano-emissão + ano-CDA + protesto + top5 + perfil PF/PJ + padrão universal + devedores críticos
GET /api/analise-receita/:cd/contribuintes?faixa=&statusCda=&protesto=&ano=&limit=&offset= - lista paginada/filtrada
GET /api/analise-receita/:cd/contribuinte/:ccp/demonstrativo - 5+1 seções
GET /api/receitas/multa - lista das 25 CDs de multa (com cd_tipoavi, ds_tipoavi, ds_abreviada) - alimenta o seletor de receita do dashboard
Implementação
Função _computeAnaliseReceitaKpis(cd) (era _computeAnaliseTransacaoKpis()).
Handlers extraídos: handleAnaliseContribuintes(cd, req, reply) e handleAnaliseDemonstrativo(cd, req, reply) - cada um registrado em 2 rotas (antiga /analise-transacao/ com cd=92327 + nova /analise-receita/:cd/).
const RECEITAS_MULTA = new Set([43,59,111,113,134,167,187,200,205,216,266,267,276,292,1680,1681,1734,1735,1810,1911,90581,91020,91021,91481,92327]) + parseCd(req,reply) -> 400 fora da whitelist.
criticos retorna vl_receita (genérico) + alias vl_92327 (o frontend AnaliseTransacao.jsx usa vl_92327 - não quebrar).
Refinamento final: segregação ATIVO/CANCELADO (commit efbdccc)
A coluna ARQ1033.IS_CERTIDAO_CANCELADA (boolean) tem 3 estados: f (ativa), t (cancelada), NULL (estado inicial). A query padrao_universal foi reescrita para segregar:
arq_agg AS (
  SELECT
    "CCP",
    count(*) FILTER (WHERE "IS_CERTIDAO_CANCELADA" = false OR "IS_CERTIDAO_CANCELADA" IS NULL) AS cert_ativas,
    count(*) FILTER (WHERE "IS_CERTIDAO_CANCELADA" = true) AS cert_canceladas
  FROM "SCH"."ARQ1033" GROUP BY "CCP"
)copiar
E o padrao_universal agora retorna 3 campos:
com_protesto_ativo (CCPs com certidões ativas) - alimentou o card "PROTESTADOS"
com_protesto_cancelado (CCPs com certidões canceladas)
qtd_certidoes_canceladas (total de certidões canceladas)
Frontend: card "Protestados" mostra sub-texto laranja opcional "X certidões canceladas · Y CCPs" (renderizado condicionalmente: só quando > 0). Valores observados (jun/2026): | CD | com_protesto_ativo (pct) | com_protesto_cancelado | qtd_certidoes_canceladas | |---|---:|---:|---:| | 92327 | 43/46 = 93,5% | 19 | 23 | | 43 | 227/344 = 66% | 59 | 90 | | 111 | 3/5 = 60% | 0 | 0 | | 267 | 3566/3645 = 97,8% | 892 | 1084 |
Otimizações de query (commits baf0df9 + 0593943)
status 1-2-3 (commit baf0df9): 6× IN (SELECT ...) -> CTE parc + CTE base com bool_or + EXISTS + FILTER (WHERE b.tem_da AND NOT b.em_parc). Cross-check 1:1 validado em 4 CDs. Benchmark CD 267: 1.450ms -> 926ms. protesto (commit baf0df9): subqueries correlacionadas sum((SELECT count(*) FROM ARQ1033 ...)) -> CTE arq_agg pré-agregada + LEFT JOIN + FILTER. Cross-check 1:1 validado em 4 CDs. Benchmark CD 267: 210s -> 575ms (365× speedup). padrao_universal (commit baf0df9, refinado por efbdccc): 4 subqueries correlacionadas (LIVRO1, ARQ1033, SMCALCREPAC_ORIGEM, PESSOA) -> EXISTS + subquery agregada. Benchmark CD 267: 156s -> 2.3s (67× speedup). Semântica aceita (opção 1): padrao_universal.com_cda conta só CDAs de DUAMs em aberto (d."FLAG_PGTO"='0' no JOIN). criticos (commit 0593943): subqueries correlacionadas em LIVRO1 e ARQ1033 POR LINHA -> CTE livro_agg + CTE arq_agg + CTE saldo_por_ccp + LEFT JOIN. CRÍTICO: a semântica é across-receitas (não filtra por REC) - o briefing da task original aplicou FLAG_PGTO por engano e zerou o array; foi corrigido em 0593943. CD 92327 ao vivo retorna 7 críticos (OSVALDO IREMAR 143, CONSTRUTORA RIO JORDÃO 118, RAIMUNDO NONATO 90, CONSTANTINO MAGNO 88, FLOR LOCAÇÃO 60, JOAQUIM ALVES 59, JOSE CARDEAL 57). Benchmark CD 267: ~1.9s.
Performance end-to-end (CD 267, /api/analise-receita/267/kpis)
ANTES: >180s timeout (statement_timeout=180000 estourava - protesto era o vilão)
DEPOIS: ~7-10s (cache frio) / ~2-4s (cache quente). CD 267 agora responde dentro do limite.
[!] Ressalva: race condition no worktree compartilhado
Múltiplas tasks estão sendo editadas em paralelo no mesmo worktree. O pai re-otimizou o padrao_universal e o criticos em paralelo, mas a semântica foi preservada em todas as iterações. Performance pode flutuar entre commits.
Metodologia (CANÔNICA para análise de receita)
Universo: DUAM."REC"=:cd AND DUAM."FLAG_PGTO"='0' (texto '0' = em aberto). NÃO usar FLAG_PG_TOTAL nem soma de DUAM_IT (dão números diferentes - ex.: receita 59 diverge 22%).
Valor: DUAM."VL_DIVIDA" / DUAM."VL_ORIGINAL" do CABEÇALHO.
PF/PJ: PESSOA."TP_PESSOA" ('2'=PF, '3'/'4'=PJ, else NC). NUNCA dígitos do CGC.
Status 1-2-3: 1_Lançamento (sem DATA_DIV_ATI) / 2_Dívida_Ativa (DATA_DIV_ATI) / 3_Parcelado (SMCALCREPAC_ORIGEM vigente).
JOIN LIVRO1: it."DUAM"=l."DUAM_IT".
criticos.cdas_historicas: across-receitas (NÃO filtra por REC - conceito de "reincidência fiscal crônica").
com_cda: por CD (apenas DUAMs do CD em aberto). com_protesto: across-receitas (CCPs com certidão ativa em ARQ1033, qualquer CD). Diferença metodológica documentada e justificada.
com_protesto_ativo (jun/2026, opção B do usuário): segrega certidões ativas (IS_CERTIDAO_CANCELADA = false OR IS NULL) vs canceladas (= true). 3 estados na coluna (f, t, NULL).
Valores validados ao vivo (psql=API, jun/2026)
CD 43 (MULTA FORMAL): 344 CCPs / 606 DUAMs / R$ 8.900.678,72. com_protesto_ativo=227 (66%), 90 certidões canceladas.
CD 111: 5 CCPs / R$ 6.257,77 (PF 4 / PJ 1). com_protesto_ativo=3 (60%), 0 canceladas.
CD 92327 (retrocompat): 46 CCPs, 7 devedores críticos. com_protesto_ativo=43 (93,5%), 23 certidões canceladas em 19 CCPs.
Frontend
Dashboard com seletor de receita no header (Select shadcn estilizado como badge roxo 10px mono). UI do badge commit 613e5a8 (correção do tamanho de texto 12px->10px). Sub-texto de canceladas no card Protestados commit efbdccc. Frontend futuro: /analise-receita/:cd como URL canônica (com /analise-transacao redirecionando para preservar retrocompat + permitir deep-linking).
O backend do dashboard "Análise para Transação" foi generalizado para QUALQUER receita de multa. Commits 278009c + baf0df9 + 0593943 + efbdccc.

Rotas novas (parametrizadas por :cd)
- GET /api/analise-receita/:cd/kpis - GET /api/analise-receita/:cd/contribuintes?faixa=&statusCda=&protesto=&ano=&limit=&offset= - GET /api/analise-receita/:cd/contribuinte/:ccp/demonstrativo - GET /api/receitas/multa - lista das 25 CDs de multa

Implementação
- Função _computeAnaliseReceitaKpis(cd) (era _computeAnaliseTransacaoKpis()) - RECEITAS_MULTA = new Set([43,59,111,113,134,167,187,200,205,216,266,267,276,292,1680,1681,1734,1735,1810,1911,90581,91020,91021,91481,92327]) - Cache por cd

Performance end-to-end (CD 267)
- ANTES: >180s timeout - DEPOIS: ~7-10s (cold) / ~2-4s (warm)

Diferença semântica entre `com_cda` e `com_protesto` no dashboard "Análise para Transação" cmqf2pxu40390pl0itwqcxn42

---

### [11] Diferença semântica entre `com_cda` e `com_protesto` no dashboard "Análise para Transação"

Diferença semântica entre com_cda e com_protesto no dashboard "Análise para Transação" - jun/2026
Investigação ao vivo em 15/06/2026 desmontou uma aparente inconsistência: CD 92327 tem 91,3% "com CDA" e 100% "protestados", e fiscalmente o protesto deveria pressupor CDA.
Descoberta
A query com_cda é POR CD (apenas CD 92327 em aberto) e com_protesto é ACROSS-REC (qualquer CD). Por isso a diferença:
-- com_cda: SÓ do CD 92327, SÓ DUAMs em aberto (FLAG_PGTO='0')
WITH ccps AS (SELECT DISTINCT d."CCP" FROM "DUAM" d WHERE d."REC" = $1 AND d."FLAG_PGTO" = '0'),
livro_agg AS (
  SELECT l."CCP", count(DISTINCT l."INSCRICAO") AS cdas
  FROM "LIVRO1" l JOIN "DUAM" d ON d."DUAM" = l."DUAM_IT"
  WHERE d."REC" = $1 AND d."FLAG_PGTO" = '0'
  GROUP BY l."CCP"
)
SELECT (SELECT count(*) FROM ccps) AS total, (SELECT count(*) FROM livro_agg) AS com_cdacopiar
-- com_protesto: ARQ1033 GLOBAL (sem filtro de REC), e junta com ccps
arq_agg AS (SELECT "CCP", count(*) AS cert FROM "ARQ1033" GROUP BY "CCP")
SELECT (SELECT count(*) FROM arq_agg a JOIN ccps c ON a."CCP" = c."CCP" WHERE a.cert > 0) AS com_protestocopiar
Validação no CD 92327 (jun/2026)
46 CCPs total, 42 com CDA (91,3%), 46 com protesto (100%)
Os 4 CCPs sem CDA do 92327 são: CONSTANTINO MAGNO CASTRO FILHO (CCP 461, R$ 10.973.760,00), CONSTRUTORA RIO JORDÃO (CCP 123951, R$ 594.748,64), ERCIONE DIVINO DOS SANTOS (CCP 23433, R$ 12.097.218,00), LUCY ROMAN BERTOLIN WANDERLEY (CCP 1733, R$ 11.302.972,80)
Esses 4 têm CDAs em outros CDs (88, 118, 23, 22 CDAs respectivamente em 6-9 CDs diferentes) - daí o protesto cruzar com CDA de outro CD
O protesto que aparece é de CDAs antigas (2000-2026) desses outros CDs, e as CDAs do 92327 desses 4 CCPs (se existiram) estão com FLAG_PGTO!='0' (quitadas) ou status cancelado
Conclusão
Não é bug do banco nem do dashboard - a query está semanticamente correta
Conceitualmente "suspeito" do ponto de vista fiscal: esses 4 CCPs têm DUAMs do 92327 em aberto (R$ 35 milhões no total) mas sem CDA ativa do 92327 - a dívida nova do 92327 não foi inscrita em DA, embora protestos de CDAs antigas persistam em cartório
Recomendação operacional: o frontend deveria explicitar a semântica ("CDA do CD X" vs "CDA qualquer") para evitar leitura "91,3% / 100% = inconsistência fiscal". O frontend atual diz "com CDA ativa" e "já foram protestados" - não deixa claro que o protesto é across-receitas.
Regra para futuras análises: sempre que quiser comparar "tem CDA" e "tem protesto" para um CD específico, usar a MESMA base (mesma CTE ccps) E o MESMO escopo (mesma query para CDA e protesto, ou ambas across-receitas, ou ambas filtradas por REC).
Lição metodológica para os outros 4 dashboards
A query com_cda foi implementada com filtro d.REC = $1 AND d.FLAG_PGTO = '0' (escopo do CD). As 3 alternativas semanticamente consistentes são:
Manter como está (atual): "tem CDA do CD X ativa" + "tem protesto (qualquer CD)" - recomendado para mostrar reincidência fiscal
Tornar ambos por CD: filtra com_protesto para protestos do CD X (JOIN com DUAM WHERE d.REC=$1) - mas isso esconde reincidência
Tornar ambos across-receitas: tira o d.REC = $1 do com_cda - vira "tem CDA em algum CD" + "tem protesto em algum CD" - equivalente à definição do frontend (reincidência)
A decisão é de produto (depende do que o usuário final quer ver). Documentar no frontend ("CDA ativa deste CD" vs "protestado em qualquer CD") seria suficiente.
A query com_cda é POR CD (apenas CD 92327 em aberto) e com_protesto é ACROSS-REC (qualquer CD).
Validação no CD 92327
- 46 CCPs total, 42 com CDA (91,3%), 46 com protesto (100%) - 4 CCPs sem CDA do 92327: CONSTANTINO, CONSTRUTORA RIO JORDÃO, ERCIONE, LUCY - Esses 4 têm CDAs em outros CDs (88, 118, 23, 22 CDAs respectivamente em 6-9 CDs diferentes) - O protesto que aparece é de CDAs antigas (2000-2026) desses outros CDs

Conclusão
- Não é bug - a query está semanticamente correta - Conceitualmente "suspeito": esses 4 CCPs têm DUAMs do 92327 em aberto (R$ 35 milhões) mas sem CDA ativa do 92327 - a dívida nova do 92327 não foi inscrita em DA - Recomendação: explicitar a semântica no frontend ("CDA do CD X" vs "CDA qualquer")

ARMADILHA: "otimização de query de brinde" muda semântica e quebra dashboard em produção (jun/2026) cmqehaimq02tupl0irfd3mqm9

---

### [13] Auditoria CDAs com VL_CONVERTIDO=0 no LIVRO1 (jun/2026)

Investigação ao vivo em 12-14/06/2026 desmontou a hipótese de "defeito" ou "estratégia de cálculo" e revelou um modelo tributário antigo (pré-2010) do SIG Prodata.
Magnitude
Total CDAs no LIVRO1: 2.727.956
CDAs com VL_CONVERTIDO IS NULL OR VL_CONVERTIDO = 0: 444.967 (16,31%)
CDAs normais (vl_convertido > 0): 2.282.989 (83,69%)
Distribuição por época de inscrição (chave da explicação)
| Época | CDAs totais | CDAs zero | % zero na época | |---|---:|---:|---:| | < 2005 | 386.498 | 385.957 | 99,86% | | 2005-2009 | 863.900 | 2.383 | 0,28% | | 2010-2014 | 338.280 | 15.617 | 4,62% | | 2015-2019 | 405.821 | 29.402 | 7,25% | | 2020-2022 | 206.115 | 6.652 | 3,23% | | 2023+ | 527.342 | 4.956 | 0,94% | 99,86% das CDAs < 2005 têm vl_convertido=0. O sistema mudou de modelo em algum momento entre 2005 e 2010.
Mediana/medía de VL_CONVERTIDO nas CDAs NORMAIS (>0) por época
| Época | CDAs normais | Mediana | Média | |---|---:|---:|---:| | < 2005 | 541 | R$ 67,98 | R$ 355,98 | | 2005-2009 | 861.517 | R$ 26,39 | R$ 87,77 | | 2010-2014 | 322.663 | R$ 78,40 | R$ 483,28 | | 2015-2019 | 376.415 | R$ 127,20 | R$ 1.150,72 | | 2020-2022 | 199.462 | R$ 315,35 | R$ 1.359,50 | | 2023+ | 522.386 | R$ 105,81 | R$ 1.483,52 | As CDAs normais têm valores reais crescentes ao longo do tempo. O sistema mudou o modelo de cálculo de "DA como título sem valor" para "DA com valor monetário próprio" por volta de 2005-2010.
9 sinais convergentes que confirmam a hipótese
| # | Sinal | Resultado | Conclusão | |---|---|---|---| | 1 | % zero por época | 99,86% em <2005 -> 0,28% em 2005-2009 | Mudança de modelo em ~2005 | | 2 | Top CDs com zero | IPTU (1/242.046), TX SERV CONSERV LOGRADOUROS (5/79.263), TX SERV LIMPEZA PÚBLICA (4/78.891), TX SERV COLETA LIXO (3/74.214) | É TRIBUTÁRIO municipal (IPTU + Taxas), NÃO multa | | 3 | Top CCPs zero | IMOVEL SEM CONTRIBUINTE (85.815), ESTADO DO TOCANTINS (30.377), MUNICIPIO DE PALMAS (8.642) | Pessoa genérica "IMOVEL SEM CONTRIBUINTE - REGULARIZE SEU CADASTRO" - não é cadastro, é placeholder | | 4 | VL_ORIGEM também zero em 49% (219.699 de 444.967) | CDAs realmente zeradas (não só convertido) | Confirma que o sistema inscreveu a DA sem valor | | 5 | CDAs zero com DUAM em aberto | 25.485 / R$ 120,9 mi | O saldo monetário está na DUAM, não no LIVRO1 | | 6 | Total em aberto (R$) | soma_cda_zero = R$ 0 / soma_orig_zero = R$ 48,9 mi (de ORIGEM) / juros zero | Confirma que o valor está em outro lugar | | 7 | Amostra de CDAs antigas do CCP 15 | INSCRICAO=2000.30.0.636.99, dt=2000-03-22, vl_origem=288.10, vl_conv=0, juros=0, multa=0 | CDA inscrita com valor original (288.10) mas convertido=0 - modelo híbrido antigo | | 8 | SANEATINS (CCP 23396) tem vl_conv>0 em 100% das CDAs | 71/71 (91021) e 25/25 (1681) com vl_conv>0 | NÃO é defeito de CDAs, é exclusivo de CDAs tributárias antigas | | 9 | SITUACAO='Q' é a mais comum em CDAs zero (130.083) | mesmo 'Q' é a mais comum em normais (646.438) | Não há correlação entre SITUACAO e vl_conv=0 |
Diagnóstico final
As CDAs com vl_convertido=0 NÃO são defeito do sistema, nem estratégia de cálculo errada, nem bug de migração.

São o modelo tributário antigo do SIG Prodata (anterior a ~2005), onde a Dívida Ativa era inscrita como mero registro/título no LIVRO1, e o valor monetário ficava na DUAM (cabeçalho) e na DUAM_IT (parcelas). A partir de ~2005, o sistema passou a calcular e gravar o VL_CONVERTIDO (valor de origem atualizado em moeda da época) no momento da inscrição.

Hoje (2026), para essas CDAs antigas, o valor monetário real está na DUAM.VL_DIVIDA (cabeçalho) / DUAM_IT.VL_DIVIDA (parcelas) - basta consultar lá.
Implicações operacionais
Análises/dashboards de DA antiga devem usar DUAM.VL_DIVIDA (cabeçalho) ou DUAM_IT.VL_DIVIDA (parcelas) como fonte do valor - não LIVRO1.VL_CONVERTIDO, que está zerado em 99,86% das CDAs < 2005.
Auditoria de estoque antigo: 25.485 CDAs "zeradas" com DUAM em aberto somam R$ 120,9 mi. É o valor real do estoque de IPTU/Taxas antigas do município - está tudo certo no sistema (o valor migrou pra DUAM). Só nunca vai aparecer no vl_convertido da LIVRO1.
Não há "saneamento" a fazer - não é para "preencher" o VL_CONVERTIDO retroativamente (a menos que se queira, mas é trabalho braçal desnecessário).
Como os dashboards lidam com isso (solução atual já está certa)
A query canônica de kpis.ano_cda do dashboard "Análise para Transação" usa:
sum(coalesce(it."VL_CONVERTIDO", it."VL_DIVIDA")) AS vl_inscritocopiar
O COALESCE está lá justamente para tratar CDAs com VL_CONVERTIDO=0 caindo no VL_DIVIDA da parcela. [OK] A regra geral é: VL_CONVERTIDO é a fonte preferida, mas cai para VL_DIVIDA quando for zero (que é exatamente o caso das CDAs tributárias antigas).
Query canônica para qualquer análise de DA (com fallback)
-- Valor de uma CDA, com fallback para VL_DIVIDA quando VL_CONVERTIDO=0 (CDAs antigas)
COALESCE(NULLIF(l."VL_CONVERTIDO", 0), it."VL_DIVIDA") AS vl_cda_realcopiar
Quando AINDA há problema a investigar
Houve um caso interessante: a query de cross-check com DUAM (D) mostrou que apenas 5,7% (25.485) das 444.967 CDAs zero têm DUAM em aberto. O que aconteceu com as outras 419.482 (94,3%)? Hipóteses:
DUAMs já quitadas (pagas ou estornadas) - FLAG_PG_TOTAL=1 ou canceladas
CDAs prescritas/canceladas administrativamente (sem registro disso)
CDAs órfãs (sem DUAM correspondente, erro de cadastro)
CDAs de DUAMs que migraram para parcelamento (e o saldo migrou pra DUAM-mãe)
A query F mostrou que essas CDAs zero se concentram em IPTU + Taxas de serviço - confirma a hipótese 1 (a maioria esmagadora das CDAs zero é de IPTU antigo, onde a DUAM original já foi paga/parcelada/estornada).
Memória errada a NÃO usar
NÃO classificar "CDAs com vl_convertido=0" como "anomalia" ou "defeito" do sistema. É o comportamento esperado do modelo tributário antigo do SIG Prodata.
Magnitude
- Total CDAs no LIVRO1: 2.727.956 - CDAs com VL_CONVERTIDO IS NULL OR VL_CONVERTIDO = 0: 444.967 (16,31%)

Distribuição por época de inscrição (chave da explicação)
Época	CDAs zero	% zero na época
< 2005	385.957	99,86%
2005-2009	2.383	0,28%
2010-2014	15.617	4,62%
2015-2019	29.402	7,25%
2020-2022	6.652	3,23%
2023+	4.956	0,94%
Diagnóstico final
> As CDAs com vl_convertido=0 NÃO são defeito do sistema, nem estratégia de cálculo errada, nem bug de migração. > > São o modelo tributário antigo do SIG Prodata (anterior a ~2005), onde a Dívida Ativa era inscrita como mero registro/título no LIVRO1, e o valor monetário ficava na DUAM (cabeçalho) e na DUAM_IT (parcelas).

Query canônica (com fallback)
-- SQL
COALESCE(NULLIF(l."VL_CONVERTIDO", 0), it."VL_DIVIDA") AS vl_cda_real

copiar
Achado da SANEATINS (CCP 23396) - jun/2026 (CORRIGIDO) cmqe7rk0q02eipl0iki21jqgg
memória [REVER] SUPERADA

Investigação completa ao vivo (jun/2026) desmontou a hipótese de "anomalia/duplicação" entre receitas.
O que pareceu (errado)
Em conversa anterior, supus que SANEATINS (CCP 23396) aparecia em 3 receitas diferentes (92327, 1681, 91021) totalizando R$ 37,4 mi. Isso foi associação incorreta minha.
O que é (correto, provado ao vivo)
A SANEATINS NÃO está no CD 92327. SELECT count(*) FROM "DUAM" WHERE "CCP"=23396 AND "REC"=92327 AND "FLAG_PGTO"='0' = 0 linhas. O CD 92327 tem 46 CCPs distintos e SANEATINS não está entre eles.
Aparece em apenas 2 receitas:
1681 (MULTA MEIO AMBIENTE): 8 DUAMs, R$ 12.596.789,12 (DUAMs de 2017-2019 + 1 de 07/01/2026)
91021 (MULTA FISCAL. SANEAMENTO/ESGOTO): 72 DUAMs, R$ 12.271.394,75 (DUAMs de 08/04/2026 a 25/05/2026 - onda nova)
TOTAL REAL: R$ 24.868.183,87 (não R$ 37,4 mi).
Por que NÃO é duplicação
0 DUAMs repetidas entre as 2 receitas (GROUP BY "DUAM" HAVING count(distinct "REC") > 1 retornou vazio).
0 DUAMs em parcelamento vigente hoje.
Fatos geradores distintos: multa ambiental 2017-2019 (legislação meio ambiente) vs. multa de fiscalização de saneamento 2025-2026 (legislação de operação de saneamento/ESGOTO). Prazos de 7-9 anos de diferença entre as duas ondas.
7 DUAMs da 1681 foram ORIGEM de parcelamentos (mas não vigentes hoje - provavelmente já quitadas/estornadas).
Universo total da SANEATINS no projeto
4.438 DUAMs no total (histórico completo, todos os RECs/status)
98 DUAMs em aberto
R$ 30.825.158,90 em aberto (soma de todas as receitas)
Conclusão
SANEATINS = caso atípico mas legítimo de um único devedor cometendo infrações distintas em legislações diferentes, com nova onda de autuações em 2025-2026 (72 DUAMs só na 91021 em ~2 meses). Merece operação fiscal dedicada. Não é bug do sistema, NÃO é migração, NÃO é duplicação.
Erro metodológico a evitar
Não somar saldos de um mesmo CCP aparecendo em CDs diferentes achando que é duplicação, sem antes verificar (a) se há DUAMs repetidas, (b) se há parcelamento vigente, (c) se as DUAMs têm fatos geradores compatíveis (datas + legislações). Fazer a query de DUAMs repetidas (GROUP BY DUAM HAVING count(distinct REC) > 1) é o teste mínimo.
Memória errada a NÃO usar
Não confiar em briefings consolidados que dizem "top 5 inclui X" sem verificar via DISTINCT "CCP" FROM "DUAM" WHERE "REC"=cd. A memória cmqcskvl400m2pl0i36bo4czs ("Sumário Executivo CD 92327 - perfil") lista "10 PJ" mas o nome SANEATINS não está entre eles (os 10 PJ são SINDICATO RURAL 24665, MW EMPREEND 365651, CONDOMINIO 218782, FLOR LOCAÇÃO 306808, REALIZA 312432, PARAISO DAS AGUAS 124403, SPE TAQUARUÇU 361451, EMPREEND AMANDA 357597, COOP COHAP 79034, CONSTRUTORA RIO JORDÃO 123951 - vide cmqcsjjsk00lypl0i6pylryxo).
O que é (correto, provado ao vivo)
- A SANEATINS NÃO está no CD 92327. 0 linhas para CCP=23396 AND REC=92327 - Aparece em apenas 2 receitas: - 1681 (MULTA MEIO AMBIENTE): 8 DUAMs, R$ 12.596.789,12 - 91021 (MULTA FISCAL. SANEAMENTO/ESGOTO): 72 DUAMs, R$ 12.271.394,75 - TOTAL REAL: R$ 24.868.183,87 (não R$ 37,4 mi)

Por que NÃO é duplicação
1. 0 DUAMs repetidas entre as 2 receitas 2. 0 DUAMs em parcelamento vigente hoje 3. Fatos geradores distintos: multa ambiental 2017-2019 vs multa de fiscalização de saneamento 2025-2026 4. 7-9 anos de diferença entre as duas ondas

Conclusão
SANEATINS = caso atípico mas legítimo de um único devedor cometendo infrações distintas em legislações diferentes, com nova onda de autuações em 2025-2026 (72 DUAMs só na 91021 em ~2 meses). Merece operação fiscal dedicada.

CD 92327 (MULTA LOTEAMENTO) - números REAIS validados no psql (jun/2026) - corrige briefing anterior cmqcskvl100m0pl0i2noy3uta
memória [REVISADA] CONTRADIZ

Ao construir o Sumário Executivo do dashboard "Análise para Transação", a re-validação no banco revelou que vários números do meu relatório anterior (consolidado em conversa) estavam ERRADOS. O banco é a verdade. Números corretos (universo: DUAM.REC=92327 AND FLAG_PG_TOTAL=0):
Universo confirmado
46 CCPs / 48 DUAMs / R$ 570.647.410,47 de VL_DIVIDA OK (esse estava certo)
VL_ORIGINAL R$ 390 mi -> VL_DIVIDA R$ 570,6 mi = +46,3% encargos OK
Padrão universal (CORRIGIDO)
CDA ativa do CD 92327: 42/46 = 91,3% (NÃO 44/46 / 95,7% como eu disse antes). Via LIVRO1 join correto (l.DUAM_IT = d.DUAM).
Protesto: 46/46 = 100% OK
Em parcelamento vigente: 0 OK
Homônimos (CGC repetido entre CCPs): 0 OK
Perfil PF/PJ (CORRIGIDO - eu havia dito 8 PJ / 59,6%)
PF: 36 CCPs (78,3%) -> R$ 359,7 mi (63,0% do saldo)
PJ: 10 CCPs (21,7%) -> R$ 211,0 mi (37,0% do saldo)
Classificação por dígitos do CGC (NAT_JURIDICA está EM BRANCO no banco, não serve).
O insight real: PJs pesam desproporcionalmente (21,7% dos CCPs = 37% do saldo), mas NÃO os 59,6% que eu havia afirmado.
Top 5 = R$ 208,1 mi (36,5%) OK confirmado, MAS #1 (BENEDITO LOURENCO, PF) e #3 (ESPÓLIO ADONEL, PF) são PESSOA FÍSICA - não "todos PJ/condomínio" como eu disse.
Devedores críticos >50 CDAs históricas (CORRIGIDO - eram 7, não 5)
Contagem via LIVRO1 (CDAs de QUALQUER CD do CCP) + ARQ1033 (protestos):
CCP 27771 (Osvaldo Iremar de Lima) - 143 CDAs
CCP 123951 (Construtora Rio Jordão) - 118 CDAs / 86 protestos
CCP 9956 (Raimundo Nonato) - 90 CDAs
CCP 461 (Constantino Magno) - 88 CDAs
CCP 13694 (Joaquim Alves da Costa) - 59 CDAs
+ 2 outros que passaram de 50 (total 7) - checar resultado da query F ao vivo
LIÇÃO
Os números agregados que consolidei em relatórios markdown (especialmente CDA 44/46 e perfil PF/PJ 8 PJ/59,6%) foram estimativas/contagens parciais que NÃO bateram com a query rigorosa. SEMPRE re-validar no psql antes de cravar número em dashboard/relatório formal. Os campos do backend (/api/analise-transacao/kpis: perfil, padrao_universal, criticos) agora têm os números corretos derivados ao vivo.
Universo confirmado
- 46 CCPs / 48 DUAMs / R$ 570.647.410,47 de VL_DIVIDA - VL_ORIGINAL R$ 390 mi -> VL_DIVIDA R$ 570,6 mi = +46,3% encargos

Padrão universal (CORRIGIDO)
- CDA ativa do CD 92327: 42/46 = 91,3% - Protesto: 46/46 = 100% - Em parcelamento vigente: 0 - Homônimos: 0

Perfil PF/PJ (CORRIGIDO)
- PF: 36 CCPs (78,3%) -> R$ 359,7 mi (63,0%) - PJ: 10 CCPs (21,7%) -> R$ 211,0 mi (37,0%) - 10 PJs: SINDICATO RURAL 24665, MW EMPREEND 365651, CONDOMINIO 218782, FLOR LOCAÇÃO 306808, REALIZA 312432, PARAISO DAS AGUAS 124403, SPE TAQUARUÇU 361451, EMPREEND AMANDA 357597, COOP COHAP 79034, CONSTRUTORA RIO JORDÃO 123951

Devedores críticos >50 CDAs históricas
- 7 CCPs: OSVALDO IREMAR 143, CONSTRUTORA RIO JORDÃO 118, RAIMUNDO NONATO 90, CONSTANTINO MAGNO 88, FLOR LOCAÇÃO 60, JOAQUIM ALVES 59, JOSE CARDEAL 57

Sumário Executivo "Análise para Transação" (CD 92327) - números REAIS validados no banco (jun/2026) cmqcsjjsk00lypl0i6pylryxo
memória [REVISADA] CONTRADIZ

Sumário Executivo "Análise para Transação" (CD 92327) - números REAIS validados no banco (jun/2026) CORRIGEM análise anterior
Ao reconstruir o Sumário Executivo do dashboard /analise-transacao, re-validei TODOS os números no psql. Vários divergiram da análise anterior (briefing). O banco é a verdade - valores corretos:
Padrão universal (46 CCPs do CD 92327, FLAG_PGTO='0')
CDA ativa do CD 92327: 42/46 = 91,3% (briefing dizia 44/46=95,7% - ERRADO). Query: EXISTS LIVRO1 l JOIN DUAM d ON d.DUAM=l.DUAM_IT WHERE l.CCP=c.CCP AND d.REC=92327.
Protestados (ARQ1033): 46/46 = 100% OK (310 certidões)
Em parcelamento vigente: 0 OK
Homônimos (CGC repetido entre CCPs): 0 OK
Perfil PF/PJ (classificação por dígitos do CGC - CGC é numérico, perde zeros à esquerda: len 10/11=CPF, 13/14=CNPJ; NAT_JURIDICA está em branco, NÃO usar)
PF: 36 CCPs (78,3%) -> R$ 359.679.459,20 (63,0%)
PJ: 10 CCPs (21,7%) -> R$ 210.967.951,27 (37,0%)
(briefing dizia 38 PF + 8 PJ com PJ=59,6% - ERRADO. As 10 PJ são: SINDICATO RURAL 24665, MW EMPREEND 365651, CONDOMINIO 218782, FLOR LOCAÇÃO 306808, REALIZA 312432, PARAISO DAS AGUAS 124403, SPE TAQUARUÇU 361451, EMPREEND AMANDA 357597, COOP COHAP 79034, CONSTRUTORA RIO JORDÃO 123951.)
Top 5 = R$ 208,14 mi = 36,5% OK (mas #1 BENEDITO e #3 ESPÓLIO ADONEL são PF, não "todos PJ" como dizia o briefing)
Total geral = R$ 570.647.410,47 (PF+PJ fecha).
Devedores críticos >50 CDAs históricas (LIVRO1.CCP, todas as receitas): são 7 (não 5)
| CCP | Nome | CDAs | Protestos | Saldo CD92327 | |---|---|---|---|---| | 27771 | OSVALDO IREMAR DE LIMA | 143 | 29 | R$ 681.030,00 | | 123951 | CONSTRUTORA RIO JORDÃO LTDA | 118 | 86 | R$ 594.748,64 | | 9956 | RAIMUNDO NONATO PIRES DOS SANTOS | 90 | 28 | R$ 7.251.158,65 | | 461 | CONSTANTINO MAGNO CASTRO FILHO | 88 | 13 | R$ 10.973.760,00 | | 306808 | FLOR LOCAÇÃO & SERVIÇOS LTDA | 60 | 11 | R$ 30.016.600,69 | | 13694 | JOAQUIM ALVES DA COSTA | 59 | 14 | R$ 8.385.806,08 | | 1559 | JOSE CARDEAL DOS SANTOS | 57 | 10 | R$ 10.355.520,00 | (briefing listava 5 com protestos "-" em vários - os protestos reais estão acima.)
Onde isso foi implementado
Backend /api/analise-transacao/kpis agora retorna perfil[], padrao_universal{}, criticos[] (além dos campos já existentes - regressão zero). pct calculado em JS.
Frontend frontend/src/pages/AnaliseTransacao.jsx - componente SumarioExecutivo reconstruído em 3 blocos: A) síntese + 4 chips do padrão universal; B) perfil PF×PJ (2 barras empilhadas qtd vs saldo + legenda); C) tabela dos 7 devedores críticos (clicável -> abre o drawer de demonstrativo via setDrawerCcp).
Padrão universal (46 CCPs do CD 92327, FLAG_PGTO='0')
- CDA ativa do CD 92327: 42/46 = 91,3% - Protestados: 46/46 = 100% (310 certidões) - Em parcelamento vigente: 0 - Homônimos: 0

Perfil PF/PJ
- PF: 36 CCPs (78,3%) -> R$ 359.679.459,20 (63,0%) - PJ: 10 CCPs (21,7%) -> R$ 210.967.951,27 (37,0%) - Top 5 = R$ 208,14 mi = 36,5% (mas #1 BENEDITO e #3 ESPÓLIO ADONEL são PF)

Devedores críticos >50 CDAs históricas
CCP	Nome	CDAs	Protestos	Saldo CD92327
27771	OSVALDO IREMAR DE LIMA	143	29	R$ 681.030,00
123951	CONSTRUTORA RIO JORDÃO LTDA	118	86	R$ 594.748,64
9956	RAIMUNDO NONATO PIRES DOS SANTOS	90	28	R$ 7.251.158,65
461	CONSTANTINO MAGNO CASTRO FILHO	88	13	R$ 10.973.760,00
306808	FLOR LOCAÇÃO & SERVIÇOS LTDA	60	11	R$ 30.016.600,69
13694	JOAQUIM ALVES DA COSTA	59	14	R$ 8.385.806,08
1559	JOSE CARDEAL DOS SANTOS	57	10	R$ 10.355.520,00
Dashboard "Análise para Transação" - CD 92327 MULTA LOTEAMENTO (jun/2026) cmqcodr8s00hmpl0i9gh566bm
memória [REVISADA] CONTRADIZ

Feature implementada na task cmqcncu0m00g2pl0ii8y1qs9g (jun/2026). Página dedicada à operação fiscal de maior vulto da carteira: CD 92327 (MULTA LOTEAMENTO), 46 CCPs / 48 DUAMs / R$ 570.647.410,47 em VL_DIVIDA, 100% em Dívida Ativa e/ou Protestados.
Backend (3 rotas em backend/src/server.js)
GET /api/analise-transacao/kpis - totalizadores + status 1/2/3 + ano-emissão + ano-CDA + protesto + top 5
GET /api/analise-transacao/contribuintes?faixa=...&statusCda=...&protesto=...&ano=...&limit=&offset= - tabela paginada/filtrada
GET /api/analise-transacao/contribuinte/:ccp/demonstrativo - 5+1 seções (identificação+homônimos, saldo, status 1-2-3, DA, protesto, autos bônus)
Constante: CD_ANALISE_TRANSACAO = 92327. Todas com db.getClient() + SET statement_timeout=180000.
Frontend (página frontend/src/pages/AnaliseTransacao.jsx)
Hero gradient com badge R$ 570,6 mi + 4 hero-badges (status, protesto, parc, lançamento)
4 StatCards (CCPs/DUAMs/VL_DIVIDA/Certidões)
4 gráficos (Recharts diretos - não wrapper): Rosca status, Barras ano emissão, Linhas CDAs/ano, Top 5 horizontal
Bloco de recomendações operacionais (4 faixas: >5M, 500k-5M, 50k-500k, <50k)
Tabela ordenável (sort client-side) + paginada (20/pág) + 4 filtros (faixa, CDA, protesto, ano)
Drawer lateral (shadcn Sheet) com 5+1 seções padrão + linha "STATUS FINAL: X" + alerta de homônimos
Registro
frontend/src/Layout.jsx: import + NAV (ícone ArrowRightLeft) +
Regras SQL validadas efix
DUAM.REC = 92327 (= TIPOAVIS.CD_TIPOAVI, NÃO CONTA_CONTABIL) -> 48 DUAMs / 46 CCPs / R$ 570.647.410,47
Status 1-2-3: derived em SQL (DATA_DIV_ATI + SMCALCREPAC_ORIGEM)
Protesto (ARQ1033) é a tabela canônica; 46/46 CCPs protestados, 310 certidões
CDAs por ano: usa DUAM_IT.DATA_DIV_ATI (não LIVRO1 que tem 0 inscritos neste CD) - 2+12+30=44 parcelas
Auto-rejoin: LIVRO1.DUAM_IT = DUAM_IT.RECNUM (RECNUM, não DUAM_IT)
Cross-check final
psql=API=UI: 48 DUAMs / 46 CCPs / R$ 570.647.410,47 (todos os 3 confirmam)
0 erros de console no browser
Drawer funcional (abre ao clicar linha, fecha no X)
Screenshots
shots/analise-transacao/01_full_page.jpg - página completa
shots/analise-transacao/02_4graficos.jpg - 4 gráficos lado a lado
shots/analise-transacao/03_drawer_benedito.jpg - drawer aberto (CCP 146862)
shots/analise-transacao/04_filtro_5m_aplicado.jpg - filtro 5M+ aplicado (34 result)
shots/analise-transacao/05_full_view.jpg - full view pós-filtro
Feature implementada na task cmqcncu0m00g2pl0ii8y1qs9g (jun/2026). Página dedicada à operação fiscal de maior vulto da carteira: CD 92327, 46 CCPs / 48 DUAMs / R$ 570.647.410,47.

Backend (3 rotas)
- GET /api/analise-transacao/kpis - totalizadores + status 1/2/3 + ano-emissão + ano-CDA + protesto + top 5 - GET /api/analise-transacao/contribuintes?faixa=&statusCda=&protesto=&ano=&limit=&offset= - GET /api/analise-transacao/contribuinte/:ccp/demonstrativo - 5+1 seções

Frontend (AnaliseTransacao.jsx)
- Hero gradient com badge R$ 570,6 mi + 4 hero-badges - 4 StatCards (CCPs/DUAMs/VL_DIVIDA/Certidões) - 4 gráficos (Recharts diretos) - Bloco de recomendações operacionais (4 faixas: >5M, 500k-5M, 50k-500k, <50k) - Tabela ordenável + paginada (20/pág) + 4 filtros - Drawer lateral (shadcn Sheet) com 5+1 seções

Valores de referência VL_DIVIDA / VALOR_PAGO (snapshot do banco em 11/06/2026) cmq9kxpdr009uq50i7bptympr

---

### [22] DIRETRIZ DE FORMATO (jun/2026) - Demonstrativo de contribuinte (FiscalizaIA)

Aprovada pelo usuário em jun/2026, na conversa sobre o drill-down de CCP 146862 (BENEDITO LOURENCO DE SOUSA). Toda vez que o usuário pedir demonstrativo de um contribuinte específico, usar EXATAMENTE esta estrutura.
[!] DISTINÇÃO FUNDAMENTAL - 2 tipos de "certidão" no banco
| Tipo | Tabela-base | Coluna-pivô | O que é | |---|---|---|---| | CDA de Dívida Ativa | SCH.LIVRO1 | INSCRICAO (= CDA) | Título executivo - dívida vencida e não paga, formalmente inscrita na DA | | Certidão de Protesto | SCH.ARQ1033 | NR_CERTIDAO | Certidão emitida pelo cartório quando o município envia a CDA pra protesto | [!] NÃO CONFUNDIR: o usuário pode dizer "CDA" para se referir a qualquer um dos dois. Antes de responder "não existe", SEMPRE buscar nas 3 colunas: LIVRO1.INSCRICAO, ARQ1033.NR_CERTIDAO, LIVRO1.CEDAM. Memória dedicada: cmqh3x4jp009tof0is6n55ukx.
[!] LEITURA OBRIGATÓRIA: memória canônica cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA. CDA é o documento (nº em LIVRO1.INSCRICAO), Dívida Ativa é o estado administrativo (marcado por DUAM_IT.DATA_DIV_ATI IS NOT NULL). Toda CDA tem DA, mas nem toda DA tem CDA. Use "CDA de DA" para o documento e "Em Dívida Ativa" para o estado.
As 5 seções OBRIGATÓRIAS (nessa ordem)
Identificação
CCP, Nome, CPF/CNPJ
NAT_JURIDICA, CEP (se disponível)
Aviso de homônimos: sempre checar se há outros CCPs com mesmo CPF/CNPJ; listar separadamente pra evitar confusão
Fonte: SCH.PESSOA
Saldo correto (tabela)
Uma linha por DUAM
Colunas: DUAM, Tipo (REC), Emissão, VL_ORIGINAL, VL_DIVIDA (saldo), VL_PAGO, FLAG_PG_TOTAL
Sempre explicar a decomposição (multa original + encargos = total)
Sempre somar e destacar o total a receber (excluindo já pago)
Fonte: SCH.DUAM + SCH.DUAM_IT
Status do crédito (1-2-3 estados)
DATA_DIV_ATI IS NULL/NOT NULL -> Em Dívida Ativa ou não
SMCALCREPAC_ORIGEM -> está em parcelamento vigente?
SMCALCREPAC.DEVEDOR ou SMCALCREPAC.DUAM -> tem parcelamento próprio?
Nota: "Em Dívida Ativa" = DATA_DIV_ATI IS NOT NULL (estado administrativo). CDA (LIVRO1.INSCRICAO) é o documento - a maioria das DA tem CDA, mas são conceitos distintos.
Detalhes da inscrição em DA (se houver)
CDA (INSCRICAO - formato XXXX/YYYY... ou NR.PAG.LINHA.DUAM_IT.PARCELA)
Data de inscrição (DATA_INSCRICAO_DIVIDA)
VL_ORIGEM, VL_CONVERTIDO, VL_JUROS, VL_MULTA, VL_HONORARIOS
Se executada judicialmente (DATA_AJUIZAMENT)
Processo administrativo (PROC_FORUM)
Fonte: SCH.LIVRO1
Protesto / SPC (se houver)
NR_CERTIDAO (= certidão de PROTESTO, NÃO CDA de DA!)
DT_CERTIDAO, DT_EMISSAO
DATA_ENVIO_SPC, ENVIO_SPC
IS_CERTIDAO_CANCELADA (ativa vs cancelada)
VL_EMOLUMENTO_CARTORIO
Fonte: SCH.ARQ1033
Bônus (seção opcional): Imóveis (BCI)
Lista de imóveis vinculados ao CCP, com CCI, área, valor venal, TIPO_IMO, TOTAL_DIVIDA
Fonte: SCH.BCI WHERE CCP = :ccp
Schema de colunas para LIVRO1 (cuidado com nomes antigos)
| Memória antiga (PDF) | Coluna real no banco | |---|---| | NUM_INSC_DA | INSCRICAO | | CODIGO_CDA | INSCRICAO (mesmo) | | VL_INSCRITO | VL_CONVERTIDO | | FK_PESSOA | CCP | | DT_INSCRICAO | DATA_INSCRICAO_DIVIDA | | DUAM (não existe) | DUAM_IT (é por parcela, não por DUAM) | | CDA (coloquial) | INSCRICAO em LIVRO1 - NÃO confundir com NR_CERTIDAO em ARQ1033 |
Schema de colunas para ARQ1033 (Protesto)
CCP (não FK_PESSOA)
NR_CERTIDAO (não NUM_CERTIDAO) - nº da certidão do cartório, não da CDA
DT_CERTIDAO (data do protesto no cartório)
DT_EMISSAO (data de emissão da certidão)
DATA_ENVIO_SPC (data de envio pro SPC/Serasa)
ENVIO_SPC (flag booleano auxiliar)
IS_CERTIDAO_CANCELADA (true = cancelada, false/NULL = ativa)
VL_EMOLUMENTO_CARTORIO (custo do cartório)
[!] REGRA DE OURO - antes de responder "CDA X não existe"
Tentar LIVRO1.INSCRICAO (CDA de DA)
Tentar ARQ1033.NR_CERTIDAO (Certidão de Protesto)
Tentar LIVRO1.CEDAM (outro nº de CDA, convive com INSCRICAO)
Confirmar nos 3 antes de responder "não existe"
Caso concreto (jun/2026): o usuário perguntou "de quem é a CDA 20180015730?" e eu respondi ERRADO que não existia porque busquei só em LIVRO1.INSCRICAO. A CDA em questão era ARQ1033.NR_CERTIDAO do CCP 24665 (SINDICATO RURAL DE PALMAS E REGIÃO).
Aplicar em
Demonstraivos individuais de contribuinte (BENEDITO, B&G, Josiel, etc.)
Análise de listas de contribuintes (CD 92327, top 10, etc.) - nesse caso, cada linha da lista recebe as 5 seções condensadas
Não aplicar em
KPIs agregados
Análises estruturais
Relatórios de estoque
Idioma
pt-BR, números no formato R$ 9.999.999,99
Tabelas em markdown
Tom técnico, sem floreios
> Aprovada pelo usuário em jun/2026, na conversa sobre o drill-down de CCP 146862 (BENEDITO LOURENCO DE SOUSA).

[!] DISTINÇÃO FUNDAMENTAL - 2 tipos de "certidão" no banco
Tipo	Tabela-base	Coluna-pivô	O que é
CDA de Dívida Ativa	SCH.LIVRO1	INSCRICAO	Título executivo
Certidão de Protesto	SCH.ARQ1033	NR_CERTIDAO	Certidão do cartório
As 5 seções OBRIGATÓRIAS (nessa ordem)
1. Identificação - CCP, Nome, CPF/CNPJ, NAT_JURIDICA, CEP, aviso de homônimos 2. Saldo correto (tabela) - uma linha por DUAM 3. Status do crédito (1-2-3 estados) 4. Detalhes da inscrição em DA (se houver) - CDA, DATA_INSCRICAO_DIVIDA, VL_* 5. Protesto / SPC (se houver) - NR_CERTIDAO, DT_CERTIDAO, IS_CERTIDAO_CANCELADA

Schema de colunas para LIVRO1 (cuidado com nomes antigos)
Memória antiga (PDF)	Coluna real no banco
NUM_INSC_DA	INSCRICAO
CODIGO_CDA	INSCRICAO
VL_INSCRITO	VL_CONVERTIDO
FK_PESSOA	CCP
DT_INSCRICAO	DATA_INSCRICAO_DIVIDA
REGRA DE OURO - antes de responder "CDA X não existe"
1. Tentar LIVRO1.INSCRICAO (CDA de DA) 2. Tentar ARQ1033.NR_CERTIDAO (Certidão de Protesto) 3. Tentar LIVRO1.CEDAM (outro nº de CDA) 4. Confirmar nos 3 antes de responder "não existe"

CD 92327 (MULTA LOTEAMENTO) - 4 CCPs com status "Lançamento" (sem DA, sem CDA) e R$ 35 mi em aberto cmqf420w8039qpl0ipwsab1q3

---

### [23] CD 92327 (MULTA LOTEAMENTO) - 4 CCPs com status "Lançamento" (sem DA, sem CDA) e R$ 35 mi em aberto

[!] LEITURA OBRIGATÓRIA ANTES: memória canônica cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA. Esta memória documenta o caso canônico que PROVA que uma DUAM pode estar em lançamento (cobrança corrente, DATA_DIV_ATI IS NULL) SEM ter sido inscrita em DA e SEM ter CDA emitida - é exatamente o cenário 1 dos 3 cenários documentados lá.
Investigação ao vivo em 15/06/2026 (a partir de pergunta do usuário sobre a screenshot do card do ERCIONE DIVINO). O padrao_universal.com_cda=42 (91,3% dos 46 CCPs) deixa 4 CCPs sem CDA ativa do 92327.
Glossário rápido desta memória
DA = Dívida Ativa (estado administrativo, marcado por DUAM_IT.DATA_DIV_ATI IS NOT NULL)
CDA de DA = Certidão de Dívida Ativa (documento, LIVRO1.INSCRICAO)
Em lançamento = parcela vencida mas NÃO inscrita em DA (e portanto SEM CDA) - cobrança administrativa corrente
Os 4 CCPs abaixo estão em lançamento (DATA_DIV_ATI NULL) - não estão nem em DA nem têm CDA do CD 92327. Mas podem ter DA/CDA de OUTROS CDs (vide colunas).
Os 4 CCPs e o estado REAL
| # | CCP | Nome | DUAM 92327 | VL atual 92327 | VL original | Encargos | Emissão | Vencimento | Protestos ativos (ARQ1033) | CDAs outros CDs (LIVRO1) | DUAMs totais (todos CDs) | Já pago (todos CDs) | |---|---|---|---|---|---|---|---|---|---|---|---|---| | 1 | 23433 | ERCIONE DIVINO DOS SANTOS | 11.598.324 | R$ 12.097.218,00 | R$ 7.513.800,00 | +61,0% | 08/02/2024 | 13/12/2023 | 1 | 23 (6 CDs) | 144 | R$ 37.494,58 | | 2 | 1733 | LUCY ROMAN BERTOLIN WANDERLEY | 11.235.301 | R$ 11.302.972,80 | R$ 6.921.600,00 | +63,3% | 23/10/2023 | 19/10/2023 | 0 | 22 (6 CDs) | 92 | R$ 4.693,99 | | 3 | 461 | CONSTANTINO MAGNO CASTRO FILHO | 11.235.342 | R$ 10.973.760,00 | R$ 6.720.000,00 | +63,3% | 23/10/2023 | 18/10/2023 | 3 | 88 (9 CDs) | 141 | R$ 34.809,50 | | 4 | 123951 | CONSTRUTORA RIO JORDÃO LTDA | 11.938.804 | R$ 594.748,64 | R$ 420.000,00 | +41,6% | 29/11/2024 | 18/11/2024 | 85 (todos ativos) | 118 (6 CDs) | 362 | R$ 115.712,79 | | | | | | R$ 34.968.699,44 | R$ 21.575.400,00 | | | | 89 | 251 | 739 | R$ 192.710,86 |
Padrões identificados
Os 3 maiores são "lote" do mesmo dia (23/10/2023) - operação fiscal especial do 92327 (loteamentos irregulares) com vencimento curto (~30 dias depois)
DUAMs relativamente recentes (out/2023 a nov/2024) - não são dívidas antigas
Encargos acima de 60% sobre o valor original (3 dos 4)
CDAs antigas do 92327 (se existiram) já foram quitadas/canceladas (FLAG_PGTO!='0' ou status cancelado)
Sem registro de parcelamento vigente (em_parcelamento=0 no padrao_universal para esses 4)
ATENÇÃO - distinção crucial (jun/2026): esses 4 têm R$ 35 mi em DUAMs do 92327 que NUNCA foram inscritos em DA (DATA_DIV_ATI IS NULL) e portanto NUNCA tiveram CDA emitida para o 92327. MAS têm CDAs de outros CDs (vide coluna 9) e protestos ativos (vide coluna 8) - a cobrança formal só não cobriu o 92327 especificamente.
Implicação operacional
R$ 35 mi em DUAMs do 92327 sem DA / sem CDA - cobrança formal parada há ~2 anos (desde out/2023)
As CDAs dos 4 (de outros CDs) têm protestos persistentes (não cancelados) - mas não cobrem o 92327
ERCIONE é o caso mais urgente (maior saldo, 2 anos e meio de atraso)
CONSTRUTORA RIO JORDÃO é o oposto: 85 protestos ativos (todos de outros CDs), mas 0 do 92327 - fluxo de cobrança parou especificamente no 92327
Recomendação
Inscrever as 4 DUAMs do 92327 em Dívida Ativa (gerar CDA de DA = popular DUAM_IT.DATA_DIV_ATI E inserir linha em LIVRO1 com nº de INSCRICAO) - são R$ 35 mi que estão há ~2 anos em cobrança administrativa corrente (lançamento), sem formalização. A memória cmqf2pxu4... (issue do padrao_universal) tem mais contexto metodológico.
Query SQL para reproduzir
-- Lista dos 4 CCPs com status "Lançamento" no CD 92327 (em DUAMs NÃO inscritas em DA / sem CDA do CD)
SELECT d."CCP", p."NOME", p."CGC", d."DUAM",
  d."VL_ORIGINAL", d."VL_DIVIDA",
  d."DATA_EMISSAO", d."DATA_CALC",
  (SELECT min(it."DATA_VENC") FROM "SCH"."DUAM_IT" it WHERE it."DUAM"=d."DUAM" AND it."DATA_PGTO" IS NULL) venc_1a_parcela,
  -- Confirmação: a parcela NÃO está em DA (DATA_DIV_ATI IS NULL)
  (SELECT bool_and(it."DATA_DIV_ATI" IS NULL) FROM "SCH"."DUAM_IT" it
   WHERE it."DUAM"=d."DUAM" AND it."PARCELA">0 AND it."VL_DIVIDA">0) AS todas_parcelas_em_lancamento
FROM "SCH"."DUAM" d
JOIN "SCH"."PESSOA" p ON p."CCP"=d."CCP"
WHERE d."REC"=92327 AND d."FLAG_PGTO"='0'
  AND (SELECT count(DISTINCT l."INSCRICAO") FROM "SCH"."LIVRO1" l
       JOIN "SCH"."DUAM" du ON du."DUAM"=l."DUAM_IT"
       WHERE l."CCP"=d."CCP" AND du."REC"=92327 AND du."FLAG_PGTO"='0') = 0
ORDER BY d."VL_DIVIDA" DESC;copiar
Lição metodológica
Ter muitos protestos e muita dívida NÃO quer dizer que aquela DUAM específica virou CDA. CDA é por parcela, não por CCP. E "estar em protesto" (ARQ1033) não implica "estar em DA" (LIVRO1) - são universos com vinculações parciais.
Os 4 CCPs e o estado REAL
#	CCP	Nome	VL atual 92327	Protestos ativos	CDAs outros CDs
1	23433	ERCIONE DIVINO DOS SANTOS	R$ 12.097.218,00	1	23 (6 CDs)
2	1733	LUCY ROMAN BERTOLIN WANDERLEY	R$ 11.302.972,80	0	22 (6 CDs)
3	461	CONSTANTINO MAGNO CASTRO FILHO	R$ 10.973.760,00	3	88 (9 CDs)
4	123951	CONSTRUTORA RIO JORDÃO LTDA	R$ 594.748,64	85 (todos ativos)	118 (6 CDs)
R$ 34.968.699,44	89	251
Padrões identificados
- Os 3 maiores são "lote" do mesmo dia (23/10/2023) - operação fiscal especial - DUAMs relativamente recentes (out/2023 a nov/2024) - não são dívidas antigas - Encargos acima de 60% sobre o valor original (3 dos 4) - R$ 35 mi em DUAMs do 92327 NUNCA foram inscritos em DA - cobrança formal parada há ~2 anos - ERCIONE é o caso mais urgente (maior saldo, 2 anos e meio de atraso)

Recomendação
Inscrever as 4 DUAMs do 92327 em Dívida Ativa - são R$ 35 mi que estão há ~2 anos em cobrança administrativa corrente.

Dívida Ativa - os 3 estados de um crédito: Lançamento × Dívida Ativa × Parcelamento (validado ao vivo jun/2026) cmq7f1sdu01jxl70i2lrtpdxh
memória [REVISADA] CONTRADIZ

[!] LEITURA OBRIGATÓRIA ANTES: memória canônica cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA. CDA é o documento (nº em LIVRO1.INSCRICAO), Dívida Ativa é o estado administrativo (marcado por DUAM_IT.DATA_DIV_ATI IS NOT NULL). Toda CDA tem DA, mas nem toda DA tem CDA. Esta memória usa "Em Dívida Ativa" no sentido administrativo (marcado pela data de inscrição), não no sentido de "tem certidão emitida".
Um crédito (parcela da DUAM_IT) atravessa estados. A diferença está em colunas-pivô da DUAM_IT, NÃO num único campo de status. Para análise de DA é OBRIGATÓRIO distinguir os 3.
Os 3 estados e como detectar (na DUAM_IT, sempre PARCELA > 0)
| Estado | Detecção | Significado | Tem CDA de DA? | |---|---|---|---| | 1. Só lançamento | DATA_DIV_ATI IS NULL AND DUAM_REPACTO = 0/NULL | Crédito lançado/vencido mas AINDA NÃO inscrito em dívida ativa (cobrança administrativa, pré-DA). | [X] Não | | 2. Em Dívida Ativa | DATA_DIV_ATI IS NOT NULL (AND DUAM_REPACTO = 0/NULL) | Parcela inscrita em DA naquela data (DATA_DIV_ATI = data do ATO administrativo). Inscrição formal (CDA) registrada em LIVRO1 (com nº próprio em LIVRO1.INSCRICAO). | [OK] Sim (em geral) | | 3. Em Parcelamento | crédito repactuado -> o saldo "real" migrou para a DUAM-mãe do parcelamento | A parcela original foi consolidada num SMCALCREPAC; o saldo a cobrar agora vive nas parcelas da DUAM-mãe. | [!] depende (a CDA original pode ou não existir) |
Detalhe importante (jun/2026): o termo "Em Dívida Ativa" aqui se refere ao estado administrativo (marcado por DATA_DIV_ATI), NÃO à existência de CDA. Na prática, DATA_DIV_ATI preenchida E existência de linha em LIVRO1 andam juntas - mas tecnicamente o estado "Em DA" é definido pela data, e a CDA é a materialização do título. Ver cmqjwqab501l4p30isxkku5c5 para a distinção canônica completa.
[!] ARMADILHA CRÍTICA - DUAM_REPACTO = 0, não NULL
DUAM_IT.DUAM_REPACTO é bigint e na esmagadora maioria das linhas vale 0 (não NULL). 0 = "não repactuada".
NUNCA use DUAM_REPACTO IS NOT NULL para detectar parcelamento - dá falso-positivo em ~15M parcelas (0 != NULL). Use DUAM_REPACTO > 0.
Mesmo com > 0, a DUAM_IT da DUAM ORIGINAL quase nunca tem o repacto preenchido (só ~302 parcelas no banco inteiro). Não dá para detectar "está em parcelamento" olhando só a DUAM original. O caminho CONFIÁVEL é pela tabela de origem do parcelamento (ver abaixo).
Caminho CONFIÁVEL de "está em parcelamento"
SMCALCREPAC_ORIGEM lista as parcelas ORIGINAIS (DUAM + PARCELA + ID_SIMULA) que cada parcelamento consolidou:
-- Uma parcela original (DUAM x PARCELA) está em parcelamento VIGENTE?
SELECT 1
FROM "SCH"."SMCALCREPAC_ORIGEM" o
JOIN "SCH"."SMCALCREPAC" r ON r."ID_SIMULA" = o."ID_SIMULA"
WHERE o."DUAM" = :duam AND o."PARCELA" = :parcela
  AND r."REGISTRADA_S_N" = 'S' AND r."DATA_ESTORNO" IS NULL
  AND (r."CANCELADO" IS NULL OR r."CANCELADO" = false);copiar
Colunas de SMCALCREPAC_ORIGEM: DUAM, PARCELA, ID_SIMULA, VL_ORIGINAL, VL_DIVIDA, VL_SALDO, VL_ABATIMENTO, VL_DESCONTO, percentuais pagos/abatidos por componente (origem/multa/juros/correção).
Distribuição REAL no banco (DUAM_IT, PARCELA>0, VL_DIVIDA>0, jun/2026)
classificação por DUAM_REPACTO > 0 THEN parcelamento; DATA_DIV_ATI NOT NULL THEN DA; else lançamento.
| Estado | Parcelas | DUAMs distintas | soma VL_DIVIDA | |---|---|---|---| | 1. Só lançamento | 10.268.444 | 1.708.678 | R$ 4.541.439.870,34 | | 2. Em Dívida Ativa | 4.884.711 | 1.105.104 | R$ 697.460.633,88 | | 3. Em Parcelamento (via DUAM_REPACTO na orig.) | 302 | 60 | R$ 47.991,34 |
O nº ínfimo de "3" via DUAM_REPACTO confirma: o vínculo de parcelamento NÃO mora na DUAM original - mora em SMCALCREPAC_ORIGEM / na DUAM-mãe. Para medir saldo em parcelamento, ir pela DUAM-mãe (SMCALCREPAC.DUAM -> DUAM_IT), não pela DUAM original.
Colunas-pivô confirmadas
DUAM_IT: DATA_DIV_ATI (date), DUAM_REPACTO (bigint, 0=não), LIVRO (varchar), PARCELA (int), VL_DIVIDA, VALOR_PAGO, DATA_PGTO, DATA_VENC.
DUAM (cabeçalho): DIVIDA (bigint), REFIS_REPAC (varchar), FLAG_PG_TOTAL (smallint), FLAG_PGTO (varchar), VL_DIVIDA, PARCELAS.
LIVRO1 (inscrição CDA): DUAM_IT (bigint), PARCELA, CCP, INSCRICAO (nº CDA de DA), DATA_INSCRICAO_DIVIDA, DATA_AJUIZAMENT, DATA_EMISSAO, VL_ORIGEM, VL_CONVERTIDO, VL_ATUALIZACAO, VL_JUROS, VL_MULTA, VL_HONORARIOS. Não existem NUM_INSC_DA/CODIGO_CDA/VL_INSCRITO/FK_PESSOA - a chave de pessoa é CCP e o nº da CDA é INSCRICAO; o link com a parcela é por DUAM_IT (não DUAM+PARCELA direto).
Implicações para dashboards de DA
"Estoque de Dívida Ativa" = parcelas com DATA_DIV_ATI IS NOT NULL E VL_DIVIDA > 0 (independente de CDA). Mas como DATA_DIV_ATI preenchida geralmente vem acompanhada de CDA, a equivalência prática é: DA formal ~= conjunto de CDAs (LIVRO1) ativas em aberto. Para valor de estoque, usar o VL_CONVERTIDO da LIVRO1 (com fallback em VL_DIVIDA para CDAs antigas, vide cmqe7zxxr02eopl0ictjeiww1).
"Estoque de Dívida Ativa" != "Lançamentos em aberto". Filtrar DATA_DIV_ATI IS NOT NULL para DA formal; senão é só cobrança corrente.
Não somar saldo da DUAM original quando o crédito está em parcelamento vigente - duplicaria (o saldo já migrou pra DUAM-mãe). Usar SMCALCREPAC_ORIGEM para excluir/segregar.
Sempre PARCELA > 0 (PARCELA=0 é entrada, lógica separada).
DUAM_IT tem 28M linhas (14GB) - GROUP BY full table leva ~25s. Filtrar/usar índices (IDX_DUAM_IT_DUAM, IDX_DUAM_IT_DATA_PGTO).
Memória relacionada OBRIGATÓRIA
cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA (jun/2026): distinção canônica entre estado administrativo (DA) e documento (CDA), 3 cenários possíveis, e resposta à pergunta "DUAM inscrita em DA obrigatoriamente tem CDA?".
> [!] LEITURA OBRIGATÓRIA ANTES: memória canônica cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA.

Os 3 estados e como detectar (na DUAM_IT, sempre PARCELA > 0)
Estado	Detecção	Significado	Tem CDA de DA?
1. Só lançamento	DATA_DIV_ATI IS NULL AND DUAM_REPACTO = 0/NULL	Crédito lançado/vencido mas AINDA NÃO inscrito em DA	[X] Não
2. Em Dívida Ativa	DATA_DIV_ATI IS NOT NULL (AND DUAM_REPACTO = 0/NULL)	Parcela inscrita em DA	[OK] Sim (em geral)
3. Em Parcelamento	crédito repactuado	Saldo migrou pra DUAM-mãe	[!] depende
[!] ARMADILHA CRÍTICA - DUAM_REPACTO = 0, não NULL
- DUAM_IT.DUAM_REPACTO é bigint e na esmagadora maioria vale 0 (não NULL). 0 = "não repactuada". - NUNCA use DUAM_REPACTO IS NOT NULL - falso-positivo em ~15M parcelas. Use DUAM_REPACTO > 0. - Mesmo com > 0, a DUAM_IT da DUAM ORIGINAL quase nunca tem o repacto preenchido. O caminho CONFIÁVEL é pela SMCALCREPAC_ORIGEM.

Distribuição REAL no banco (jun/2026)
Estado	Parcelas	soma VL_DIVIDA
1. Só lançamento	10.268.444	R$ 4.541.439.870,34
2. Em Dívida Ativa	4.884.711	R$ 697.460.633,88
Dívida Ativa != CDA - distinção canônica corrigida a partir do DER 1 (jun/2026) cmqjwqab501l4p30isxkku5c5

---

### [24] Dívida Ativa != CDA - distinção canônica corrigida a partir do DER 1 (jun/2026)

Correção conceitual crítica, validada contra o DER 1 reconstruído em frontend/src/components/DerDiagramas.jsx (ComparacaoPDFBanco.jsx + ComparacaoPDFBanco.jsx). O orquestrador vinha usando "Dívida Ativa" e "CDA" como sinônimos - NÃO SÃO.
As 2 coisas diferentes
| Conceito | O que é | Onde mora no banco | Quem emite | |---|---|---|---| | Dívida Ativa (DA) | Estado administrativo de um crédito - o município reconhece formalmente a dívida vencida e a inscreve em cobrança administrativa/judicial | DUAM_IT.DATA_DIV_ATI IS NOT NULL (data da inscrição) | Município (Sefin) | | CDA (Certidão de Dívida Ativa) | Documento/título formal emitido quando a dívida é inscrita - tem número próprio e valor próprio | LIVRO1.INSCRICAO (nº CDA) + LIVRO1.VL_CONVERTIDO (valor) | Município (Sefin) |
Analogia fiscal: Dívida Ativa é o "processo/registro" - CDA é o "número do título" que ele gera. Toda CDA corresponde a uma inscrição em DA, mas nem toda DA gerou (ainda) uma CDA.
DER 1 do PDF e o que ele mostra (jun/2026, página ComparacaoPDFBanco)
Olhando o DER 1 reconstruído com nomes reais do banco:
DUAM --1..N---> DUAM_IT --1..1---> LIVRO1
   |            |              |
   |            +-- DATA_DIV_ATI (data da inscrição em DA) 
   |                              (!= número da CDA; é a DATA do ATO administrativo)
   |                              
   +-- VL_ORIGINAL (cabeçalho)copiar
A cardinalidade DUAM_IT -> LIVRO1 = 1..1 significa apenas: se uma parcela for inscrita em DA, gera no máximo 1 linha em LIVRO1 com o nº da CDA. NÃO significa que toda parcela é inscrita - é só o modelo conceitual das tabelas (relação 1 para 0..1).
Os 3 cenários possíveis (universo DUAM_IT, PARCELA>0, jun/2026)
| Cenário | Detecção SQL | Tem CDA? | Tem DATA_DIV_ATI? | Volume (jun/2026) | Saldo (jun/2026) | |---|---|:---:|:---:|---:|---:| | 1. Só lançamento (cobrança corrente, NÃO inscrito) | DATA_DIV_ATI IS NULL | [X] Não | [X] NULL | 10.268.444 parcelas | R$ 4,54 bi | | 2. Em Dívida Ativa (inscrito, CDA emitida) | DATA_DIV_ATI IS NOT NULL AND não em parcelamento | [OK] Sim | [OK] preenchida | 4.884.711 parcelas | R$ 697,46 mi | | 3. Em Parcelamento (consolidado) | SMCALCREPAC_ORIGEM join | [!] depende | [!] depende | 302 parcelas (na orig.) | R$ 47,99 mil (medido errado; ver mem) | Prova crucial: mais de 2/3 das parcelas em aberto (R$ 4,5 bi / 10,2M parcelas) NUNCA foram inscritas em DA e portanto NUNCA tiveram CDA emitida. São lançamentos "correntes" - o contribuinte deve, mas o município ainda não fez a formalização.
Vocabulário correto a partir de agora
| [X] ERRADO (que eu vinha usando) | [OK] CERTO (jun/2026+) | |---|---| | "CDA 0001/20241510119432490" (tratando como "nº da dívida ativa") | "CDA de DA 0001/20241510119432490" (= nº da certidão que vive em LIVRO1.INSCRICAO) | | "duas CDAs" (misturando LIVRO1.INSCRICAO + ARQ1033.NR_CERTIDAO) | "uma CDA de DA (LIVRO1) + uma Certidão de Protesto (ARQ1033)" - são universos diferentes | | "está em Dívida Ativa" (= "tem CDA") | "está em Dívida Ativa (= DATA_DIV_ATI NOT NULL) E tem CDA (LIVRO1.INSCRICAO)" | | "em lançamento" (= "antes de virar CDA") | "em lançamento (cobrança corrente, NÃO inscrito em DA, SEM CDA)" | | "LIVRO1.INSCRICAO" como "CDA" puro | "CDA de DA (LIVRO1.INSCRICAO)" + "Certidão de Protesto (ARQ1033.NR_CERTIDAO)" |
Quando perguntarem "tem CDA?", sempre perguntar antes:
"É CDA de Dívida Ativa?" -> LIVRO1.INSCRICAO (= nº do título executivo, formal, em cobrança administrativa/judicial)
"É Certidão de Protesto?" -> ARQ1033.NR_CERTIDAO (= nº do cartório, protesto em cartório)
"É CDA antiga (CEDAM)?" -> LIVRO1.CEDAM (outro formato de nº de CDA)
A busca universal está em cmqh3x4jp009tof0is6n55ukx.
Resposta direta à pergunta do usuário (jun/2026)
"Quando uma DUAM vai para o livro, ela obrigatoriamente vai ter uma CDA emitida?"
NÃO. São 3 cenários independentes - vide tabela acima. Mais de 2/3 das DUAMs em aberto (R$ 4,5 bi) NUNCA foram inscritas em DA e portanto NUNCA tiveram CDA. O usuário estava certo ao me questionar.
Caso concreto que prova o ponto (jun/2026, 4 CCPs do CD 92327)
ERCIONE DIVINO (CCP 23433): 1 DUAM do 92327 com DATA_DIV_ATI = NULL -> em lançamento (cobrança corrente), sem CDA do 92327 (cenário 1). MAS tem 23 CDAs em outros CDs e 1 protesto ativo.
Isso é o oposto do que parece: ter muitos protestos e muita dívida não quer dizer que aquela DUAM específica virou CDA. CDA é por parcela, não por CCP.
Implicações para todas as análises/relatórios
Dívida Ativa != CDA != Protesto != Parcelamento - são 4 estados ortogonais (com combinações possíveis).
Detecção da DA = DUAM_IT.DATA_DIV_ATI IS NOT NULL.
Detecção da CDA de DA = existência de linha em LIVRO1 com l.DUAM_IT = it.DUAM.
Detecção do Protesto = existência de linha em ARQ1033 com CCP = ccp.
Detecção do Parcelamento = join com SMCALCREPAC_ORIGEM (o.DUAM = it.DUAM AND o.PARCELA = it.PARCELA) + vigente.
Card "padrão universal" do AnaliseTransacao = com_cda (POR CD, junção LIVRO1.INSCRICAO) != com_protesto (ACROSS-REC, ARQ1033). Documentado em cmqf2pxu40390pl0itwqcxn42.
Demonstrativo do contribuinte tem 3 conceitos separados: CDA de DA (seção 4 do Demonstrativo), Certidão de Protesto (seção 5), Parcelamento (seção 3 do Demonstrativo). Documentado em cmqcd1ikx001ppl0iyukx0fqx v2.
Memórias relacionadas
cmq7f1sdu01jxl70i2lrtpdxh - 3 estados de um crédito (Lançamento / Em Dívida Ativa / Parcelado)
cmq7e4u7q01jpl70i12on12zy - Snapshot estrutural (colsPDF da LIVRO1 = 9, colsBanco = 42)
cmqcp4oy700iqpl0i42ejqa3m - JOIN correto LIVRO1.DUAM_IT = DUAM_IT.DUAM
cmqcd1ikx001ppl0iyukx0fqx v2 - DIRETRIZ Demonstrativo (5+1 seções, com distinção dos 2 tipos de certidão)
cmqh3x4jp009tof0is6n55ukx - Busca universal de "CDA" (3 colunas)
cmqh5p2bz009zof0iiw4prdub - STATUS/SITUAÇÃO da CDA de DA (18 mnemônicos)
cmqf420w8039qpl0ipwsab1q3 - 4 CCPs do 92327 sem CDA do 92327 (caso canônico dos 4 cenários)
cmqf2pxu40390pl0itwqcxn42 - Diferença semântica com_cda (POR CD) vs com_protesto (ACROSS-REC)
cmq7gj13o01k5l70iydzigmdi - Estoque devedor: 4 estados (lançamento / DA / migrado / a receber) e regra dura "#3 + #4 nunca se somam"
cmq7gj13k01k3l70i3vzrgtou - SMCALCREPAC_ORIGEM (caminho confiável de "está em parcelamento")
cmqe2dgrh023epl0ia197t9yk - Dashboard AnaliseTransacao genérico por receita (rotas /api/analise-receita/:cd/*)
Lição do processo
Sempre que o usuário pedir confirmação de uma definição, consultar a documentação canônica (neste caso: ComparacaoPDFBanco.jsx -> DerDiagramas.jsx). A página pública tem a resposta oficial em DER visual.
Não confiar em sinônimos que eu mesmo criei - "CDA" e "Dívida Ativa" soam parecidos mas têm escopo diferente. O DER 1 deixa isso explícito (LIVRO1 fica do lado de fora do DUAM_IT, indicando que nem toda parcela gera CDA).
A cardinalidade 1..1 do DER é semântica (modelo), não comportamental (processo de negócio) - modelo conceitual != obrigatoriedade operacional.
As 2 coisas diferentes
Conceito	O que é	Onde mora no banco	Quem emite
Dívida Ativa (DA)	Estado administrativo	DUAM_IT.DATA_DIV_ATI IS NOT NULL	Município
CDA (Certidão de Dívida Ativa)	Documento/título	LIVRO1.INSCRICAO + LIVRO1.VL_CONVERTIDO	Município
> Toda CDA corresponde a uma inscrição em DA, mas nem toda DA gerou (ainda) uma CDA.

Os 3 cenários possíveis (universo DUAM_IT, PARCELA>0, jun/2026)
Cenário	Tem CDA?	Volume (jun/2026)	Saldo (jun/2026)
1. Só lançamento (cobrança corrente, NÃO inscrito)	[X] Não	10.268.444 parcelas	R$ 4,54 bi
2. Em Dívida Ativa (inscrito, CDA emitida)	[OK] Sim	4.884.711 parcelas	R$ 697,46 mi
3. Em Parcelamento (consolidado)	[!] depende	302 parcelas	R$ 47,99 mil
Prova crucial: mais de 2/3 das parcelas em aberto (R$ 4,5 bi / 10,2M parcelas) NUNCA foram inscritas em DA.
Vocabulário correto
- "está em Dívida Ativa" = DATA_DIV_ATI NOT NULL E tem CDA (LIVRO1.INSCRICAO) - "em lançamento" = cobrança corrente, NÃO inscrito em DA, SEM CDA

ARMADILHA - `LIVRO1.PROC_FORUM` aceita 5+ formatos + string sentinela (jun/2026) cmqjoxs0f016wp30i3i1c9bms

---

### [25] ARMADILHA - `LIVRO1.PROC_FORUM` aceita 5+ formatos + string sentinela (jun/2026)

ARMADILHA - LIVRO1.PROC_FORUM aceita 5+ formatos + string sentinela (jun/2026, task cmqjofjxt015qp30i521zw1fr)
A coluna SCH.LIVRO1.PROC_FORUM (nº do processo judicial de execução fiscal) NÃO segue um único formato. O banco real (jun/2026) tem MUITAS variantes - frontend deve diferenciar visualmente todas as não-CNJ das CNJ reais.
Catálogo empírico (jun/2026, top 20 valores de PROC_FORUM com count)
| # | Valor | Qtd | Categoria | |---|---|---:|---| | 1 | PROTESTADO | 25.181 | String sentinela - CDA protestada, não ajuizada. Tratar como "sentinela". | | 2 | 5003092-78.2013.827.2729 | 17.638 | CNJ novo (5 pontos, J=827 - TRF 1ª Região). | | 3 | 0035212-16.2023.827.2729 | 11.766 | CNJ novo (J=827). | | 4 | 0036481-90.2023.827.2729 | 8.679 | CNJ novo (J=827). | | 5 | 0031254-51.2025.8.27.2729 | 5.154 | CNJ novo (J=8 - TJ-TO). | | 6 | LC279 | 4.801 | Código interno ("LC" + número) - usado em CDAs antigas. | | 7 | 5035261-55.2012.827.2729 | 4.216 | CNJ novo (J=827). | | 8 | 0017725-14.2015.827.2729 | 3.850 | CNJ novo (J=827). | | 9 | PROCESSO COBRANÇA | 3.609 | String sentinela (acentuação quebrada: PROCESSO COBRAN A). | | 10 | 0033267-09.2014.827.2729 | 3.574 | CNJ novo (J=827). | | 11 | 2006.0006.3503-0 | 3.483 | Formato legado (AAAA.NNNN.NNNN-N) - pré-CNJ, ainda usado em CDAs antigas. | | 12 | 5002197-54.2012.827.2729 | 3.235 | CNJ novo (J=827). | | 13 | 0041183-16.2022.827.2729 | 2.612 | CNJ novo (J=827). | | 14 | 2008.0006.5720-0 | 2.205 | Formato legado (AAAA.NNNN.NNNN-N). | | 15 | 0036243-71.2023.827.2729 | 1.973 | CNJ novo (J=827). | | 16 | 2011.0007.9388-0 | 1.961 | Formato legado. | | 17 | 2006.0007.8301-3 | 1.611 | Formato legado. | | 18 | 2006.0006.2485-3 | 1.569 | Formato legado. | | 19 | 5000324-29.2006.827.2729 | 1.451 | CNJ histórico (4 pontos, J=827, omite TR). | | 20 | 2005.0003.9449-3 | 1.316 | Formato legado. |
5 variantes identificadas
Variante 1 - CNJ novo (>=2010, 5 pontos)
NNNNNNN-DD.AAAA.J.TR.OOOO - J pode ser 1 dígito (TJ-TO = 8), 2 dígitos (TRF/TRT = 27), ou 3 dígitos (TRF/TRT antigo como 827).
Ex.: 0027413-19.2023.8.27.2729 (J=8), 0031254-51.2025.8.27.2729 (J=8)
Ex.: 5003092-78.2013.827.2729 (J=827 - TRF 1ª Região)
Variante 2 - CNJ histórico (pré-2010, 4 pontos)
NNNNNNN-DD.AAAA.JTR.OOOO - omite o segmento TR (Tribunal Regional, ex.: 27). JTR fica colado.
Ex.: 5000468-32.2008.827.2729 (JTR=827), 5000324-29.2006.827.2729 (JTR=827)
[!] Qualquer regex que assume 5 pontos REJEITA este formato - grave, são CDAs reais.
Variante 3 - Formato legado (AAAA.NNNN.NNNN-N, pré-CN)
Pontos entre ano/sequencial, traço no final. Não tem equivalência CNJ.
Ex.: 2006.0006.3503-0, 2008.0006.5720-0, 2011.0007.9388-0
[!] Regex CNJ REJEITA este formato também (mas é nº de processo real, só não-CN).
Variante 4 - Códigos internos (LC + número)
Usado pelo sistema antigo do SIG Prodata.
Ex.: LC279 (4.801 ocorrências, CDAs antigas)
Variante 5 - String sentinela
Literal "PROTESTADO" (25.181 ocorrências) ou "PROCESSO COBRANÇA" (3.609, com acentuação quebrada).
[!] NÃO tratar como nº de processo - frontend deve diferenciar visualmente.
Regex que casa APENAS os 2 formatos CNJ (1 e 2)
// Aceita CNJ novo (5 pontos) e histórico (4 pontos).
// REJEITA formato legado (AAAA.NNNN.NNNN-N), LC*, sentinelas, CDA strings.
const re = /^\d{4,7}-\d{2}\.\d{4}\.(\d{1,3}\.\d{2}\.\d{4}|\d{3,5}\.\d{4})$/;
const isCnj = typeof x === 'string' && re.test(x);
// isCnj=true  -> renderizar como nº CNJ puro (mono font, sem decoração)
// isCnj=false -> renderizar como "[!] Sentinela/Formato não-CNJ: <valor>" em italic text-muted-foreground
//               (ou "-" se x for null/undefined)copiar
Renderização sugerida (3 níveis)
isCnj=true -> nº puro, mono font, sem decoração. Tooltip mostra o valor completo.
valor presente mas não-CNJ -> "[!] : " em italic text-muted-foreground com tooltip explicando. Categorias: "Sentinela (não-ajuizado)" para PROTESTADO/PROCESSO COBRANÇA, "Código interno" para LC\d+, "Formato legado (pré-CN)" para ^\d{4}\.\d{4}\.\d{4}-\d$.
valor ausente (null/undefined/'') -> "-" (placeholder do Item helper).
Origem da armadilha
A 1ª tentativa usou /^\d{4,7}-\d{2}\.\d{4}\.\d{1,2}\.\d{2}\.\d{4}$/ (5 pontos, J=1-2). Casava 0027413-19.2023.8.27.2729 mas rejeitava o formato histórico (5000468-32.2008.827.2729 - 4 pontos).
A correção amplia \d{1,2} para \d{1,3}\.\d{2}\.\d{4} (formato novo) E adiciona o ramo \d{3,5}\.\d{4} (formato histórico, JTR+foro concatenado).
Mesmo com o regex corrigido, ainda há CDAs com PROC_FORUM em formato legado (29+ mil no top 20) que serão classificadas como "não-CNJ" - comportamento CORRETO, frontend mostra como "Formato legado" e o usuário vê que o sistema antigo é o culpado.
Onde se aplica
Toda vez que exibir PROC_FORUM da LIVRO1 no frontend (Demonstrativo, dash de execução fiscal, relatório de ajuizamentos etc.).
Backend JÁ entrega a string crua (l."PROC_FORUM" AS processo no SELECT) - não faz normalização. Frontend é responsável.
Não confiar no tipo da coluna: PROC_FORUM é varchar no banco, aceita qualquer string.
Memória relacionada
cmqcd1ikx001ppl0iyukx0fqx v2 - DIRETRIZ Demonstrativo (seção 4 inclui PROC_FORUM como "Processo administrativo")
cmqh5p2bz009zof0iiw4prdub - STATUS/SITUACAO CDA (DATA_AJUIZAMENT + PROC_FORUM são colunas-pivô de execução judicial)
A coluna SCH.LIVRO1.PROC_FORUM NÃO segue um único formato. O banco real (jun/2026) tem MUITAS variantes.

5 variantes identificadas
#### Variante 1 - CNJ novo (>=2010, 5 pontos)

NNNNNNN-DD.AAAA.J.TR.OOOO - ex: 0027413-19.2023.8.27.2729
#### Variante 2 - CNJ histórico (pré-2010, 4 pontos) Omite o segmento TR. Ex: 5000468-32.2008.827.2729

#### Variante 3 - Formato legado

AAAA.NNNN.NNNO-N (pré-CN). Ex: 2006.0006.3503-0
#### Variante 4 - Códigos internos

LC279 (4.801 ocorrências)
#### Variante 5 - String sentinela - PROTESTADO (25.181) - CDA protestada, não ajuizada - PROCESSO COBRANÇA (3.609) - acentuação quebrada

Regex que casa APENAS CNJ
js
const re = /^\\d{4,7}-\\d{2}\\.\\d{4}\\.(\\d{1,3}\\.\\d{2}\\.\\d{4}|\\d{3,5}\\.\\d{4})$/;

copiar
REGRA DURA - Diferenciar PF × PJ pelo campo SCH.PESSOA.TP_PESSOA (NUNCA por dígitos do CGC) cmqdxmyd401pqpl0iid01yggz

---

### [33] STATUS/SITUAÇÃO: CDA de Dívida Ativa × Certidão de Protesto (jun/2026, validado ao vivo)

Pesquisa de jun/2026 sobre os 2 universos de "status" do banco: o que cada mnemônico significa, quais colunas-pivô carregam a informação, e como a coisa evolui. Memória dedicada pra responder perguntas do tipo "essa CDA está cancelada?", "foi protestada?", "qual a diferença entre D e 02?".
PARTE 1 - STATUS DA CDA DE DÍVIDA ATIVA (LIVRO1)
1.1 Coluna-pivô principal: LIVRO1.SITUACAO (varchar(2))
18 valores distintos encontrados no banco (jun/2026, foto 31/05/2026, 2.727.956 CDAs no total): | Código | Qtd | % | Ajuizadas | DATA_AGM | Interpretação (com evidência empírica) | |---|---:|---:|---:|---:|---| | (NULL/`) | 1.071.418 | 39,3% | 4,5% (48.620) | 0,9% (9.364) | CDA ATIVA - estado padrão, sem classificação explícita, em cobrança administrativa/cartório | | Q | 779.557 | 28,6% | 35,4% (276.337) | 14,3% (111.108) | CDA QUITADA - paga (a mais comum entre ajuizadas porque pagamento reverte execução); 99,99% das CDAs Q têm DUAM.FLAG_PG_TOTAL='1'; pode ou não ter passado por AGM | | A | 394.783 | 14,5% | 14,4% (56.696) | 3,6% (14.137) | CDA AJUIZADA - em execução fiscal (DATA_AJUIZAMENT preenchida em 14,3%) | | O | 161.482 | 5,9% | 18,9% (30.491) | 7,5% (12.147) | "Outra fase" - código intermediário, "em origem" / "em outras fases de cobrança" | | Z | 86.777 | 3,2% | 0,8% (715) | 2,2% (1.915) | Cancelada por AGM (Z=Zerada?) - baixíssima ajuizamento, faixa curta 2000-2010 | | R | 53.319 | 2,0% | 0,3% (151) | 10,0% (5.319) | "Remida" / "Remissão" - quase 0 ajuizadas (cobrança encerrada) | | T | 48.689 | 1,8% | 72,3% (35.187) | 9,7% (4.733) | "T" = em Trânsito / Transferida - altíssima taxa de ajuizamento (perfil crítico) | | I | 30.117 | 1,1% | 7,6% (2.292) | 4,5% (1.340) | "I" = Indeferida / Inconsistente - 99,9% quitadas; concentrada em 615 CCPs | | C | 24.605 | 0,9% | 21,0% (5.172) | 6,2% (1.525) | "C" = Cancelada administrativamente | | E | 23.295 | 0,9% | 27,6% (6.436) | 13,5% (3.140) | "E" = Extinta - extinção do crédito (pagamento, decisão judicial ou prescrição); 99,9% quitadas | | N | 19.882 | 0,7% | 74,8% (14.862) | 16,3% (3.246) | "N" = Negociada / Notificada - altíssima ajuizamento E protesto (perfil crítico) | | P | 9.872 | 0,4% | 81,3% (8.024) | 21,5% (2.127) | "P" = Protestada - 81% ajuizada, 63% protestada (perfil mais crítico); grupo pequeno mas crítico | | 0 (zero literal) | 9.822 | 0,4% | 0,1% (10) | 0,2% (17) | "0" = lixo de digitação ("0" lançado em vez de vazio) - CDAs antigas (2000-2008) | | L | 8.692 | 0,3% | 5,8% (508) | 1,1% (98) | "L" = em Litígio / Leilão - concentrado em 114 CCPs (grandes devedores), valor médio R$ 23.357 | | D | 3.501 | 0,1% | 58,0% (2.031) | 84,1% (2.946) | "D" = Devolvida por AGM - 84% com DATA_AGM, é o status de cancelamento administrativo via AGM | | 02 | 884 | 0,03% | 33,7% (297) | 83,6% (739) | "02" = código antigo (2 chars) de Devolvida por AGM - convive com D, mesma correlação | | S | 713 | 0,03% | 48,0% (342) | 17,5% (125) | "S" = Suspensa / Substituída - 48% ajuizadas, valor médio R$ 93; 100% quitadas | | 4  (lixo) | 548 | 0,02% | 0% (0) | 0% (0) | Byte corrompido ('4' + byte extra) - todas com VL_CONVERTIDO=0`, modelo tributário pré-2005; todas com DATA_INSCRICAO_DIVIDA entre 1997-2000 |
1.2 As 4 colunas-pivô de status da CDA (ortogonais entre si)
| Coluna | Tipo | O que registra | % CDAs preenchidas | |---|---|---|---| | LIVRO1.SITUACAO | varchar(2) | Mnemônico do status atual (18 valores) | 60,7% (1.656.538) | | LIVRO1.DATA_AJUIZAMENT | date | Data da execução judicial | 28,4% (775.572) | | LIVRO1.DATA_AGM | date | Data do cancelamento/desconto por AGM | 6,4% (174.026) | | LIVRO1.DATA_RECEBIDO | date | (depreciada, sempre NULL) | 0% (0) | Observação importante: as 4 colunas NÃO são mutuamente excludentes. Uma CDA pode ter SITUACAO='A' (Ajuizada) E DATA_AJUIZAMENT preenchida, E ter sido protestada (via ARQ1033.NR_CERTIDAO), E ter passado por AGM, tudo ao mesmo tempo. A regra é combinar os pivôs, não escolher um.
1.3 Significado da coluna DATA_AGM (junho/2026 - descoberto nesta pesquisa)
AGM = "Ato da Gestão Municipal" - refere-se a atos administrativos da gestão que cancelam/descontam a CDA. É o equivalente em Dívida Ativa do que IS_CERTIDAO_CANCELADA = true é em Protesto.
Evidência que confirma a interpretação:
84% das CDAs com SITUACAO='D' têm DATA_AGM preenchida (alta correlação)
84% das CDAs com SITUACAO='02' também têm (mesma correlação - 02 é código antigo do D)
100% das CDAs com SITUACAO='4 ' (lixo) NÃO têm DATA_AGM (modelo tributário pré-2005, antes do AGM)
A tabela auxiliar ARQ814 (que tem LIVRO='2000' em todas as amostras) tem 178.657 linhas, sendo 80.516 com DATA_AGM (45%) - ARQ814 é a "espelho" do livro 2000 do LIVRO1, com anotações textuais de OBS1/OBS2
Duas tabelas guardam DATA_AGM (jun/2026, psql):
SCH.LIVRO1.DATA_AGM (date) - coluna-pivô na CDA
SCH.ARQ814.DATA_AGM (date) - espelho do livro 2000 (178.657 linhas, 45% com AGM)
1.4 Cruzamento DATA_AGM × ARQ814 (jun/2026)
| Teste | Resultado | |---|---| | CDAs (LIVRO1) com DATA_AGM preenchida | 174.026 (6,4% do total de CDAs) | | CDAs com AGM que estão em ARQ814 | 79.341 (45,6%) | | CDAs com AGM que NÃO estão em ARQ814 | 94.685 (54,4%) | | Linhas em ARQ814 com DATA_AGM | 80.516 (45,0% do total de ARQ814) | Conclusão: DATA_AGM da LIVRO1 é coluna-pivô independente da tabela ARQ814. Metade das CDAs com AGM está em ARQ814 (livro 2000), a outra metade está em outros livros do LIVRO1 (2001-2026).
1.5 Significado de DATA_RECEBIDO (jun/2026)
0 registros preenchidos em todo o banco (2.727.956 linhas).
Coluna depreciada/residual - provavelmente ficou obsoleta com a evolução do sistema. NÃO usar como fonte de "data de recebimento" da CDA.
PARTE 2 - STATUS DA CERTIDÃO DE PROTESTO (ARQ1033)
2.1 Coluna-pivô principal: ARQ1033.IS_CERTIDAO_CANCELADA (boolean)
3 estados (jun/2026, 1.172.911 certidões no total): | Estado | Qtd | % | Observação | |---|---:|---:|---| | ATIVA (false) | 1.087.238 | 92,7% | Protesto vigente - devedor ainda negativado | | ESTADO INICIAL (NULL) | 52.833 | 4,5% | Nunca foi gerenciada (certidão emitida, sem decisão) | | CANCELADA (true) | 32.840 | 2,8% | Protesto baixado (pagamento, acordo ou erro) |
2.2 As 5 colunas-pivô relevantes de ARQ1033
| Coluna | Tipo | O que registra | % preenchido | |---|---|---|---| | IS_CERTIDAO_CANCELADA | boolean | Estado (ativa/cancelada) | 95,5% (false+true), 4,5% NULL | | DATA_ENVIO_SPC | date | Data de envio pra SPC/Serasa | 1,7% (raro!) | | ENVIO_SPC | boolean | Flag booleano complementar | 90,9% (1.066.328 false, 92 NULL, 2 true) | | DT_CERTIDAO | date | Data do protesto no cartório | 99,2% (1.164.045) | | DT_EMISSAO | date | Data de emissão da certidão | 7,8% (91.199) | | RETIFICADA | integer | Se foi retificada (carta de correção) | (não medido) | | DUAM | bigint | FK conceitual -> LIVRO1.DUAM_IT | 0,008% (93 certidões só) |
2.3 Outras colunas úteis de ARQ1033 (esquema completo de 44 colunas)
| Coluna | Tipo | Para que serve | |---|---|---| | NR_CERTIDAO | varchar(25) | Nº da certidão do cartório (= o que aparece na tela como "Certidão 20180015730") | | DT_CERTIDAO | date | Data do protesto no cartório | | DT_EMISSAO | date | Data de emissão (8% preenchido) | | DATA_ENVIO_SPC | date | Data de envio pra SPC/Serasa | | ENVIO_SPC | boolean | Flag booleano (true = enviado) | | DATE_EXCLUSAO_SPC | date | Data de EXCLUSÃO do SPC (complementar) | | NUMERO_ENVIO_SPC | integer | Nº do envio pro SPC | | IS_CERTIDAO_CANCELADA | boolean | Estado (3 valores) | | DT_CIENTE | date | Data em que o cliente foi notificado | | NR_PROCESSO | bigint | Processo do cartório (!= PROC_FORUM da LIVRO1) | | DATA_VENCIMENTO | date | Data de vencimento do protesto | | DATA_COMPRA | date | Data de compra do protesto pelo cartório | | QTD_DIAS_VALIDA | bigint | Quantos dias vale o protesto | | DUAM_HONORARIOS | integer | Duam de honorários (carta extra) | | DT_RETIFICACAO | date | Data de retificação (carta de correção) | | VL_EMOLUMENTO_CARTORIO | numeric | Custo do cartório | | RETIFICADA | integer | Se foi retificada |
2.4 Relação ARQ1033 × LIVRO1
| Teste | Resultado | |---|---| | Total de certidões de protesto (ARQ1033) | 1.172.911 | | Certidões com DUAM preenchido (!= NULL) | 93 (0,008%) | | Certidões com match em LIVRO1 (via l.DUAM_IT = a.DUAM) | 92 | | Total de CDAs no LIVRO1 | 2.727.956 | | DUAMs distintos em ARQ1033 | 93 | | DUAM_IT distintos em LIVRO1 | 2.521.541 | Conclusão: a relação ARQ1033 <-> LIVRO1 é quase inexistente via DUAM - só 93 das 1.172.911 certidões (0,008%) têm link direto. A vinculação é feita via CCP (que está em ambas as tabelas). ARQ1033 é across-receitas (memória cmqf2pxu40390pl0itwqcxn42).
PARTE 3 - TABELA COMPARATIVA (os 2 universos lado a lado)
| Aspecto | CDA de Dívida Ativa | Certidão de Protesto | |---|---|---| | Tabela-base | SCH.LIVRO1 (2.727.956 linhas) | SCH.ARQ1033 (1.172.911 linhas) | | Coluna-pivô do "número" | INSCRICAO (= CDA) | NR_CERTIDAO (nº do cartório) | | Coluna-pivô do "status" | SITUACAO (varchar, 18 valores) | IS_CERTIDAO_CANCELADA (boolean, 3 valores) | | Coluna-pivô de "data de cancelamento" | DATA_AGM (date) | (não há - é só boolean "ativo/cancelado") | | Coluna-pivô de "execução judicial" | DATA_AJUIZAMENT | (não se aplica) | | Coluna-pivô de "envio pra SPC" | (não se aplica) | DATA_ENVIO_SPC + ENVIO_SPC | | Coluna secundária do "número" | CEDAM (varchar) | (não há) | | Vinculação entre as duas | Por CCP (não por DUAM) | (mesma) | | Documento típico | "CDA 0001/20241510119432490" | "Certidão 20180015730" | | Quem emite | Município (Sefin) | Cartório de protestos | | Mnemônico principal | 18 valores (Q, A, O, Z, R, T, I, C, E, N, P, 0, L, D, 02, S, 4 , vazio) | 3 valores (false, true, NULL) | | % em "estado padrão / ativo" | 39,3% (vazio/null) | 92,7% (false) + 4,5% (NULL) = 97,2% |
PARTE 4 - QUERIES CANÔNICAS
4.1 Status de uma CDA específica (todas as 4 colunas-pivô)
SELECT
  l."INSCRICAO"                                                                 AS cda,
  COALESCE(NULLIF(TRIM(l."SITUACAO"), ''), '<vazio>')                          AS situacao_mnemonico,
  to_char(l."DATA_AJUIZAMENT", 'DD/MM/YYYY')                                   AS dt_ajuizamento,
  CASE WHEN l."DATA_AJUIZAMENT" IS NOT NULL THEN 'EM EXECUCAO JUDICIAL' ELSE 'COBRANCA ADMINISTRATIVA' END AS em_execucao,
  to_char(l."DATA_AGM", 'DD/MM/YYYY')                                          AS dt_agm,
  CASE WHEN l."DATA_AGM" IS NOT NULL THEN 'CANCELADA POR AGM' ELSE 'NAO' END  AS cancelada_agm,
  -- E se a DUAM originaria foi paga
  d."FLAG_PG_TOTAL"                                                             AS flag_pg_total_duam,
  CASE WHEN d."FLAG_PG_TOTAL" = '1' THEN 'PAGA' ELSE 'EM ABERTO' END            AS status_pagamento
FROM "SCH"."LIVRO1" l
JOIN "SCH"."DUAM_IT" it ON it."DUAM" = l."DUAM_IT"
JOIN "SCH"."DUAM" d     ON d."DUAM"  = it."DUAM"
WHERE l."INSCRICAO" = '<NUMERO_DA_CDA>';copiar
4.2 Status de protesto de um CCP
SELECT
  count(*)                                                                              AS total_certidoes,
  count(*) FILTER (WHERE "IS_CERTIDAO_CANCELADA" = false)                                AS ativas,
  count(*) FILTER (WHERE "IS_CERTIDAO_CANCELADA" = true)                                 AS canceladas,
  count(*) FILTER (WHERE "IS_CERTIDAO_CANCELADA" IS NULL)                                AS estado_inicial,
  count(*) FILTER (WHERE "DATA_ENVIO_SPC" IS NOT NULL)                                   AS enviadas_ao_spc,
  to_char(min("DT_CERTIDAO"), 'DD/MM/YYYY')                                              AS dt_mais_antiga,
  to_char(max("DT_CERTIDAO"), 'DD/MM/YYYY')                                              AS dt_mais_recente
FROM "SCH"."ARQ1033"
WHERE "CCP" = :ccp;copiar
4.3 Decodificar SITUACAO da LIVRO1 (interpretar os 18 mnemônicos)
-- View ou CTE que decodifica a SITUACAO com base na evidência empírica de jun/2026
WITH decodificador AS (
  SELECT 'Q' AS cod, 'Quitada (paga)'                                  AS descricao UNION ALL
  SELECT 'A',     'Ajuizada (em execucao judicial)'                   UNION ALL
  SELECT 'O',     'Outra fase (em origem / outras fases de cobranca)' UNION ALL
  SELECT 'Z',     'Cancelada por AGM (Z=Zerada?)'                     UNION ALL
  SELECT 'R',     'Remida / Remissao'                                 UNION ALL
  SELECT 'T',     'Em transito / transferida (perfil critico)'         UNION ALL
  SELECT 'I',     'Indeferida / Inconsistente'                        UNION ALL
  SELECT 'C',     'Cancelada administrativamente'                      UNION ALL
  SELECT 'E',     'Extinta (pagamento / decisao judicial / prescricao)' UNION ALL
  SELECT 'N',     'Negociada / Notificada (perfil critico)'            UNION ALL
  SELECT 'P',     'Protestada (perfil mais critico)'                   UNION ALL
  SELECT '0',     'Lixo de digitacao (CDAs antigas 2000-2008)'         UNION ALL
  SELECT 'L',     'Em litigio / leilao (grandes devedores)'            UNION ALL
  SELECT 'D',     'Devolvida por AGM (cancelamento administrativo)'    UNION ALL
  SELECT '02',    'Codigo antigo (2 chars) de Devolvida por AGM'       UNION ALL
  SELECT 'S',     'Suspensa / Substituida'                             UNION ALL
  SELECT '4'||chr(0xB0), 'Byte corrompido (lixo, modelo pre-2005)'    -- exemplo de lixo
  SELECT NULL,    'CDA ATIVA (estado padrao, sem classificacao)'
)
SELECT
  COALESCE(NULLIF(TRIM(l."SITUACAO"), ''), '<vazio>')  AS situacao_banco,
  d.descricao                                         AS interpretacao,
  count(*)                                            AS qtd_cdas
FROM "SCH"."LIVRO1" l
LEFT JOIN decodificador d ON d.cod = COALESCE(NULLIF(TRIM(l."SITUACAO"), ''), '<vazio>')
GROUP BY 1, 2
ORDER BY qtd_cdas DESC;copiar
PARTE 5 - CONCLUSÕES E LIÇÕES
5.1 Por que SITUACAO da LIVRO1 é uma coluna "ruim"
Não tem CHECK constraint (aceita qualquer varchar de até 2 chars)
Não tem FK para uma tabela de domínio
Não tem comentário no schema (pg_description retorna vazio)
Não está documentada no DER 1 do PDF (a memória cmq7e4u7q01jpl70i12on12zy confirma: colsPDF da LIVRO1 = 9, colsBanco = 42)
Tem 18 valores distintos com sobreposição semântica (ex.: D e 02 representam a mesma coisa)
Decisão técnica documentada: o backend do FiscalizaIA não usa SITUACAO da LIVRO1 para montar o status da CDA nas telas. Em vez disso, o status é derivado de:
DATA_AJUIZAMENT (em execução judicial?)
DATA_AGM (cancelada por AGM?)
Cruzamento com ARQ1033.NR_CERTIDAO (em protesto?)
Cruzamento com DUAM.FLAG_PG_TOTAL (paga?)
5.2 Por que IS_CERTIDAO_CANCELADA é "melhor" que SITUACAO
É booleano (3 valores: false, true, NULL) - mais simples
É consistente entre todas as CDAs (independente de Receita, época, formato)
Tem alta correlação com outros campos-pivô (DATA_ENVIO_SPC, RETIFICADA, DT_RETIFICACAO)
5.3 Por que DATA_RECEBIDO está morta
0% de preenchimento no banco
Provavelmente foi substituída por DUAM.FLAG_PG_TOTAL + DUAM.DATA_PGTO (que vivem na DUAM-mãe, não na LIVRO1)
5.4 Regra de ouro consolidada
Quando o usuário perguntar sobre o "status" de uma CDA, nunca confiar em uma única coluna. Responder combinando:
LIVRO1.SITUACAO (mnemônico do status administrativo)
LIVRO1.DATA_AJUIZAMENT (execução judicial?)
LIVRO1.DATA_AGM (cancelamento por AGM?)
ARQ1033.NR_CERTIDAO (em protesto? ativo ou cancelado?)
DUAM.FLAG_PG_TOTAL (paga?)
Memórias relacionadas
cmqcd1ikx001ppl0iyukx0fqx (v2) - DIRETRIZ do Demonstrativo (5+1 seções, com a distinção dos 2 tipos de certidão)
cmqh3x4jp009tof0is6n55ukx - ARMADILHA + busca universal (LIVRO1.INSCRICAO vs ARQ1033.NR_CERTIDAO vs LIVRO1.CEDAM)
cmqh4ub03009vof0ia63urthb - RESUMO OPERACIONAL (memória-índice)
cmq7e4u7q01jpl70i12on12zy - Snapshot estrutural do banco (colsPDF=9, colsBanco=42 para LIVRO1)
cmqe7zxxr02eopl0ictjeiww1 - Auditoria CDAs com VL_CONVERTIDO=0 (modelo tributário antigo)
cmqf2pxu40390pl0itwqcxn42 - Diferença semântica com_cda vs com_protesto
Caso canônico: SINDICATO RURAL DE PALMAS (CCP 24665)
CDA de DA: 0001/20241510119432490 (LIVRO1.INSCRICAO) - SITUACAO vazio (CDA ATIVA), DATA_AJUIZAMENT NULL (não em execução), DATA_AGM NULL, FLAG_PG_TOTAL='0' (em aberto)
12 certidões de protesto (ARQ1033.NR_CERTIDAO) - todas IS_CERTIDAO_CANCELADA=false (ativas), 7 de 2018 + 4 de 2019 + 1 de 2026
CNPJ 10.624.780/0010-9 (filial 010)
PARTE 1 - STATUS DA CDA DE DÍVIDA ATIVA (LIVRO1)
1.1 Coluna-pivô: LIVRO1.SITUACAO (varchar(2))
18 valores distintos (jun/2026, 2.727.956 CDAs):
Código	Qtd	%	Interpretação
(NULL/'')	1.071.418	39,3%	CDA ATIVA - estado padrão
Q	779.557	28,6%	CDA QUITADA - paga (99,99% têm FLAG_PG_TOTAL='1')
A	394.783	14,5%	CDA AJUIZADA - em execução fiscal
O	161.482	5,9%	"Outra fase" - código intermediário
Z	86.777	3,2%	Cancelada por AGM
R	53.319	2,0%	"Remida" / "Remissão"
T	48.689	1,8%	"T" = em Trânsito / Transferida (72% ajuizadas - perfil crítico)
I	30.117	1,1%	"I" = Indeferida / Inconsistente (99,9% quitadas)
C	24.605	0,9%	Cancelada administrativamente
E	23.295	0,9%	"E" = Extinta (99,9% quitadas)
N	19.882	0,7%	Negociada / Notificada (75% ajuizadas - perfil crítico)
P	9.872	0,4%	Protestada (perfil mais crítico)
0 (zero literal)	9.822	0,4%	lixo de digitação
L	8.692	0,3%	em Litígio / Leilão
D	3.501	0,1%	Devolvida por AGM
02	884	0,03%	Código antigo (2 chars) de Devolvida por AGM
S	713	0,03%	Suspensa / Substituída
byte corrompido	548	0,02%	lixo, modelo pré-2005
1.2 As 4 colunas-pivô (ortogonais entre si)
- LIVRO1.SITUACAO (60,7% preenchido) - LIVRO1.DATA_AJUIZAMENT (28,4%) - LIVRO1.DATA_AGM (6,4%) - LIVRO1.DATA_RECEBIDO (0% - MORTA, depreciada)

1.3 DATA_AGM = Ato da Gestão Municipal
84% das CDAs com SITUACAO='D' têm DATA_AGM preenchida.

PARTE 2 - STATUS DA CERTIDÃO DE PROTESTO (ARQ1033)
2.1 ARQ1033.IS_CERTIDAO_CANCELADA (boolean, 3 estados)
Estado	Qtd	%
ATIVA (false)	1.087.238	92,7%
ESTADO INICIAL (NULL)	52.833	4,5%
CANCELADA (true)	32.840	2,8%
ARMADILHA - "Certidão" tem 2 colunas-pivô diferentes (jun/2026) cmqh3x4jp009tof0is6n55ukx

---

### [34] ARMADILHA - "Certidão" tem 2 colunas-pivô diferentes (jun/2026)

ARMADILHA - "Certidão" tem 2 colunas-pivô diferentes (jun/2026, task cmqh0fzu5009lof0i6lgwfh39)
O erro que cometi (jun/2026)
Usuário perguntou "de quem é a CDA 20180015730?". Eu respondi ERRADO que "não existe no banco", porque busquei só em LIVRO1.INSCRICAO. Na verdade, 20180015730 é NR_CERTIDAO em ARQ1033 - a tela do Demonstrativo mostra certidões de protesto, que vivem em ARQ1033, NÃO em LIVRO1.
A confusão que tive
A coluna LIVRO1.INSCRICAO é o nº da CDA de Dívida Ativa (formato NR_LIVRO.PAG.LINHA.DUAM_IT.PARCELA, ex: 20180.100.1.2443773.0). A coluna ARQ1033.NR_CERTIDAO é o nº da certidão de Protesto (formato numérico, ex: 20180015730). São universos diferentes - uma CDA pode existir sem certidão de protesto, e vice-versa.
Como o frontend do AnaliseTransacao secciona isso
Demonstrativo -> Seção 4 (Detalhes DA) consulta LIVRO1.INSCRICAO (CDA de Dívida Ativa)
Demonstrativo -> Seção 5 (Protesto/SPC) consulta ARQ1033.NR_CERTIDAO (Certidão de Protesto)
O que verificar antes de responder "não existe"
Quando o usuário perguntar "de quem é a CDA XXXXX?":
Tentar LIVRO1.INSCRICAO (= CDA de DA)
Tentar ARQ1033.NR_CERTIDAO (= Certidão de Protesto)
Tentar LIVRO1.CEDAM (= outra coluna-pivô de nº de CDA, formato XXXX/YYYY...)
Confirmar nos 3 antes de responder "não existe"
Query de busca universal (todas as tabelas com coluna "certidão" / "inscrição" / "número")
WITH chaves AS (
  SELECT 'LIVRO1.INSCRICAO (CDA DA)' AS origem, "INSCRICAO"::text AS valor, "CCP"
  FROM "SCH"."LIVRO1" WHERE trim("INSCRICAO") <> ''
  UNION ALL
  SELECT 'ARQ1033.NR_CERTIDAO (Certidão Protesto)', "NR_CERTIDAO"::text, "CCP"
  FROM "SCH"."ARQ1033" WHERE trim("NR_CERTIDAO") <> ''
  UNION ALL
  SELECT 'LIVRO1.CEDAM (CDA antiga)', "CEDAM"::text, "CCP"
  FROM "SCH"."LIVRO1" WHERE trim("CEDAM") <> ''
)
SELECT origem, count(*) AS qtd, count(DISTINCT ccp) AS ccp_unicos
FROM chaves
WHERE valor = '<NÚMERO_BUSCADO>' OR valor LIKE '%<NÚMERO_BUSCADO>%'
GROUP BY origem ORDER BY qtd DESC;copiar
Caso concreto (jun/2026, validado)
CDA 20180015730 é ARQ1033.NR_CERTIDAO do CCP 24665 - SINDICATO RURAL DE PALMAS E REGIÃO (CNPJ 10.624.780/0010-9, PJ).
DT_CERTIDAO = 2018-12-12, IS_CERTIDAO_CANCELADA = false (= ATIVA, NÃO cancelada), DATA_ENVIO_SPC = NULL, DT_EMISSAO = NULL, VL_EMOLUMENTO_CARTORIO = NULL.
O SINDICATO RURAL tem 12 certidões de protesto ativas (todas em ARQ1033, todas de 2018-2019 e uma de 2026).
Regra de ouro
NUNCA responda "X não existe" sem antes fazer busca exata E busca por substring nas 3 colunas: LIVRO1.INSCRICAO, ARQ1033.NR_CERTIDAO, LIVRO1.CEDAM. Se o usuário viu o número em uma tela, ele veio de uma dessas 3.
doc/regra-negocio.html
·
19 memórias do cluster "regra-negocio"
·

---

### [38] AUTO.VALOR_ORIGINAL = 100% zerado - caminho REAL do valor: AUTO -> DUAM -> LIVRO1 (jun/2026)

O achado
AUTO.VALOR_ORIGINAL está zerado em 27.402 / 27.402 autos (todos).
AUTO.ALQTA e AUTO.BASE_CALCULO também zerados.
Motivo: SIG Prodata antigo calculava o valor via INFRACAO.QTDE_UFIR × UFIR[ano], não gravava em AUTO.
O valor REAL está em LIVRO1.VL_ORIGEM (e VL_CONVERTIDO, VL_JUROS).
O caminho CORRETO para buscar o valor de um auto (jun/2026)
AUTO a
JOIN DUAM d ON d."CCP" = a."CCP" AND d."REC" = $cd AND d."FLAG_PG_TOTAL" = '0'
JOIN LIVRO1 l ON l."DUAM_IT" = d."DUAM"copiar
Caminho: AUTO.CCP -> DUAM(CPP, REC, FLAG_PG_TOTAL='0') -> LIVRO1.DUAM_IT = DUAM.DUAM.
Armadilhas do caminho (e o que NÃO fazer)
NÃO use LIVRO1.ORIGEM_DIV como FK para AUTO.NUM_AUTO - ORIGEM_DIV é enum/código (0=2.675.092 / 98%, max=3086), não FK. Match perfeito com AUTO.NUM_AUTO=3310311 (do CCP 218782) = 0 linhas.
NÃO existe LIVRO1.NUM_AUTO. A coluna NUM_AUTO só existe em AUTO. Não há FK formal declarada (FKs=0 neste schema).
NÃO faça LEFT JOIN LIVRO1 ON l."CCP"=a."CCP" AND l."DUAM_IT" IS NOT NULL (sugestão original do briefing) - produz CARTESIANO. CCP 461 tem 88 CDAs × 2 autos = 176 linhas. Vai estourar a UI e a memória do backend.
USE CTE pré-filtrada por REC + FLAG_PG_TOTAL (de DUAM) para evitar o cartesian. Pattern:
WITH duam_cda AS (
  SELECT d."CCP", l."INSCRICAO" AS cda, l."VL_ORIGEM" AS vl_origem, l."VL_CONVERTIDO" AS vl_conv, l."VL_JUROS" AS vl_juros
  FROM "SCH"."DUAM" d JOIN "SCH"."LIVRO1" l ON l."DUAM_IT"=d."DUAM"
  WHERE d."FLAG_PG_TOTAL"='0' AND d."REC"=$cd
)
SELECT a."NUM_AUTO", a."DATA", d.cda, d.vl_origem, d.vl_conv, d.vl_juros
FROM "SCH"."AUTO" a LEFT JOIN duam_cda d ON d."CCP"=a."CCP"
WHERE a."CCP"=$1 ORDER BY a."DATA" DESC;copiar
Validação (jun/2026)
218782 (CONDOMINIO ECOLOGICO, AI 23939) -> CDA 2210261133112353330, VL_ORIGEM=R$ 20.498.226,00, VL_JUROS=R$ 614.946,78
461 (CONSTANTINO, 2 autos) -> sem CDA do CD 92327 (LEFT JOIN com cda=null)
23433 (ERCIONE, 1 auto) -> sem CDA do CD 92327
8 (sem auto no CD 43) -> autos.length=0, seção 6 nem aparece
Performance
CTE agrega pequeno (1 receita = 46 CCPs do CD 92327). Medido: ~1.2s cold start com CTE em CCP 218782. Aceitável. Em CCPs com muitas CDAs (ex.: 27771 OSVALDO com 143 CDAs) o tempo continua ~1.2s porque a CTE pré-agrega por CCP.
O achado
- AUTO.VALOR_ORIGINAL está zerado em 27.402 / 27.402 autos (todos) - SIG Prodata antigo calculava o valor via INFRACAO.QTDE_UFIR × UFIR[ano] - O valor REAL está em LIVRO1.VL_ORIGEM (e VL_CONVERTIDO, VL_JUROS)

O caminho CORRETO para buscar o valor de um auto
-- SQL
AUTO a JOIN DUAM d ON d."CCP" = a."CCP" AND d."REC" = $cd AND d."FLAG_PG_TOTAL" = '0' JOIN LIVRO1 l ON l."DUAM_IT" = d."DUAM"

copiar
Armadilhas do caminho
1. NÃO use LIVRO1.ORIGEM_DIV como FK para AUTO.NUM_AUTO - 0 matches 2. NÃO existe LIVRO1.NUM_AUTO. Não há FK formal declarada 3. NÃO faça LEFT JOIN LIVRO1 ON l."CCP"=a."CCP" AND l."DUAM_IT" IS NOT NULL - CARTESIANO

USE CTE pré-filtrada
-- SQL
WITH duam_cda AS ( SELECT d."CCP", l."INSCRICAO" AS cda, l."VL_ORIGEM", l."VL_CONVERTIDO", l."VL_JUROS" FROM "SCH"."DUAM" d JOIN "SCH"."LIVRO1" l ON l."DUAM_IT"=d."DUAM" WHERE d."FLAG_PG_TOTAL"='0' AND d."REC"=$cd ) SELECT a."NUM_AUTO", a."DATA", d.cda, d.vl_origem FROM "SCH"."AUTO" a LEFT JOIN duam_cda d ON d."CCP"=a."CCP" WHERE a."CCP"=$1 ORDER BY a."DATA" DESC;

copiar
ARMADILHA: `node --watch` pode resetar o working tree durante validação (jun/2026) cmqehzkv402v8pl0ij9oivmlz

---

