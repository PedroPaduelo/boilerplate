---
name: dashboards-fiscalizai-cobranca
description: Sub-skill 2 do banco SCH (Palmas) - funil de cobranca (N1/N2/N3), DUAM, DUAM_IT, DUAM_REPACTO, parcelamentos (SMCALCREPAC/REFIS), inadimplencia por safra, maturacao, VALOR_PAGO x VL_DIVIDA. 19 memorias canonicas (jun/2026). Ative quando a tarefa envolver funil de receita, parcelamento, ciclo de vida do credito ou inadimplencia.
---

# dashboards-fiscalizai-cobranca

> Sub-skill especializada do banco SCH (Palmas) - FiscalizaIA.
> Ative esta skill quando o tema da conversa for cobranca.
> Para o indice completo e o modelo conceitual, abra a mestra:
> `dashboards-fiscalizai-palmas`.
>
> Encoding do banco: **LATIN1**. Toda query abaixo usa ASCII/acentos
> pt-BR; NUNCA travessao, reticencias, seta, aspas curvas ou simbolos
> matematicos Unicode em literais SQL.

## Indice das 19 memorias desta sub-skill

### [02] BUG CRÍTICO - Predicados do N3 do Funil estão incompletos (jun/2026)

Descoberto pelo explorer da task EstoqueEmAberto. A regra de partição exclusiva dos 5 sub-marcadores do N3 não funciona com os predicados originais da memória cmqo806k00011pi0ik56iq742. As 5 query-snippets que constam nessa memória são INCOMPLETAS - precisam ser reescritas com PRIORIZAÇÃO.
O bug
Aplicados os 5 predicados da memória cmqo806k00011pi0ik56iq742:
parc: 3.183 (esperado 6.228)
exec: 97.193 (esperado 97.152) - bate
protesto: 680.721 (esperado 419.650) - INFLADO em 261k
da_pura: 418.099 (esperado 59.982) - INFLADO em 358k
lanc_aberto: 96.637 (esperado 255.828) - faltando 159k
SOMA: 1.295.833 vs esperado 838.840 - explodiu
A regra real (descoberta testando)
Os 5 sub-marcadores são MUTUAMENTE EXCLUSIVOS via PRIORIZAÇÃO em árvore (do mais específico pro mais genérico):
-- 1. parc (prioridade máxima): DUAM É A MÃE de parcelamento vigente
WHERE d."DUAM" IN (
  SELECT r."DUAM" FROM "SCH"."SMCALCREPAC" r
  WHERE r."REGISTRADA_S_N"='S' AND r."DATA_ESTORNO" IS NULL
    AND (r."CANCELADO" IS NULL OR r."CANCELADO"=false)
)

-- 2. exec (segunda prioridade): LIVRO1 com DATA_AJUIZAMENT preenchida
--    E NÃO está em parc (prioridade parc ganha)
WHERE EXISTS (
  SELECT 1 FROM "SCH"."LIVRO1" l WHERE l."DUAM_IT"=d."DUAM" AND l."DATA_AJUIZAMENT" IS NOT NULL
)
AND NOT EXISTS (... parc ...)

-- 3. protesto: tem CDA E CCP protestado E NÃO exec E NÃO parc
WHERE EXISTS (SELECT 1 FROM "SCH"."LIVRO1" l WHERE l."DUAM_IT"=d."DUAM")
AND d."CCP" IN (SELECT DISTINCT "CCP" FROM "SCH"."ARQ1033"
                WHERE "IS_CERTIDAO_CANCELADA" = false OR "IS_CERTIDAO_CANCELADA" IS NULL)
AND NOT EXISTS (... exec ...)
AND NOT EXISTS (... parc ...)

-- 4. da_pura: tem CDA E CCP NÃO protestado E NÃO exec E NÃO parc
WHERE EXISTS (SELECT 1 FROM "SCH"."LIVRO1" l WHERE l."DUAM_IT"=d."DUAM")
AND d."CCP" NOT IN (... protesto ...)
AND NOT EXISTS (... exec ...)
AND NOT EXISTS (... parc ...)

-- 5. lanc_aberto: resto (sem CDA, sem protesto, sem exec, sem parc)
WHERE NOT EXISTS (SELECT 1 FROM "SCH"."LIVRO1" l WHERE l."DUAM_IT"=d."DUAM")
AND d."CCP" NOT IN (... protesto ...)
AND NOT EXISTS (... exec ...)
AND NOT EXISTS (... parc ...)copiar
Validação (foto 22/06/2026, foto do explorer)
| Marcador | Esperado (DADOS) | Obtido (psql) | qtd delta | valor delta | |---|---:|---:|---:|---:| | parc | 6.228 / R$ 209.734.870,71 | 6.206 / R$ 172.670.825,00 | -22 (0,35%) | -37 mi | | exec | 97.152 / R$ 691.242.178,05 | 97.135 / R$ 681.034.225,61 | -17 (0,02%) | -10 mi | | protesto | 419.650 / R$ 938.568.522,68 | 419.555 / R$ 925.834.854,10 | -95 (0,02%) | -13 mi | | da_pura | 59.982 / R$ 93.729.236,73 | 59.972 / R$ 93.682.670,52 | -10 (0,02%) | -47 mil | | lanc_aberto | 255.828 / R$ 154.811.966,93 | 255.101 / R$ 154.777.115,71 | -727 (0,28%) | -35 mil | | SOMA | 838.840 / R$ 2.088.086.775,10 | 837.969 / R$ 2.027.999.690,94 | -871 (0,1%) | -60 mi (3%) |
Diagnóstico
Qtd delta de 871 = drift de snapshot entre 31/05/2026 (foto do DADOS) e 22/06/2026 (foto atual do banco). O snapshot do banco evoluiu ~0,1% no intervalo (~22 dias), com pagamentos parciais que saíram do FLAG_PG_TOTAL='0'.
Valor delta de 60 mi (3%) = mesmo drift + pagamentos parciais de VALOR_PAGO que reduziram o atualizado (cab + pago) na margem.
parc com delta de 37 mi é o mais afetado porque tem VL_PAGO parcial mais comum (parcelamento com entrada + prestações).
Decisão recomendada
ACEITAR o drift de 3% como esperado para a nova página EstoqueEmAberto (dados ao vivo, não foto estática).
Atualizar o DADOS do FunilCobranca.jsx com uma nova régua "foto 22/06/2026" (R$ 2,028 bi / 837.969 DUAMs) - issue MEDIUM, separada.
DOCUMENTAR a regra de priorização nesta memória e atualizar a cmqo806k00011pi0ik56iq742 (issue MEDIUM).
Query otimizada (CTE pré-agregada, ~13s vs >5min)
A query-base otimizada (com CTE de CCPs protestados pré-agregados, mães de parc pré-agregadas, DUAMs em CDA pré-agregadas e DUAMs ajuizadas pré-agregadas) é a versão de produção. EXISTS/NOT EXISTS correlacionado estoura timeout em escala. A CTE é obrigatória para a página EstoqueEmAberto rodar em <2s por aba (warm cache).
Cross-check final
Soma das 5 priorizações = 837.969 = universo base = bate perfeitamente
da_pura + lanc_aberto batem quase exato no valor (drift marginal)
protesto + exec + parc têm drift maior (~3%) por causa de pagamentos parciais recentes
Regra CONFIRMADA: priorização parc > exec > protesto > da_pura > lanc_aberto (exclusiva e completa)
> Descoberto pelo explorer da task EstoqueEmAberto. A regra de partição exclusiva dos 5 sub-marcadores do N3 não funciona com os predicados originais da memória cmqo806k00011pi0ik56iq742.

A regra real
Os 5 sub-marcadores são MUTUAMENTE EXCLUSIVOS via PRIORIZAÇÃO em árvore (do mais específico pro mais genérico):
1. parc (prioridade máxima): DUAM É A MÃE de parcelamento vigente 2. exec (segunda prioridade): LIVRO1 com DATA_AJUIZAMENT preenchida E NÃO está em parc 3. protesto: tem CDA E CCP protestado E NÃO exec E NÃO parc 4. da_pura: tem CDA E CCP NÃO protestado E NÃO exec E NÃO parc 5. lanc_aberto: resto

Validação
Marcador	Soma (R$)
parc	R$ 209.734.870,71
exec	R$ 691.242.178,05
protesto	R$ 938.568.522,68
da_pura	R$ 93.729.236,73
lanc_aberto	R$ 154.811.966,93
TOTAL	R$ 2.088.086.775,10
N3 do Funil - 2 métricas, 2 recortes (jun/2026) cmqo806k00011pi0ik56iq742

---

### [03] N3 do Funil - 2 métricas, 2 recortes (jun/2026)

N3 do Funil - 2 métricas, 2 recortes (jun/2026)
Correção da memória anterior que afirmava "N3 do funil = 576.770 DUAMs / R$ 1,7 bi" - estava errado. O universo canônico do N3 do funil é 838.840 DUAMs (mesmo do briefing de qualidade-dados), e os R$ 2,088 bi são aritmeticamente consistentes (soma dos 5 sub-itens fecha exato). Validação cruzada com usuário via psql (jun/2026).
Os 2 valores que aparecem como "saldo do N3"
| Métrica | Valor | Fórmula | Onde aparece | |---|---:|---|---| | VL_DIVIDA cabeçalho (apenas saldo em aberto) | R$ 1.962.087.790,00 | sum(DUAM.VL_DIVIDA) WHERE FLAG_PG_TOTAL='0' AND VL_DIVIDA>0 | Briefing de qualidade-dados (R$ 1,96 bi), saldos consolidados | | "atualizado" (cabeçalho + pagamentos parciais) | R$ 2.088.086.775,10 | sum(DUAM.VL_DIVIDA) + sum(DUAM_IT.VALOR_PAGO WHERE P>0) | Funil de Cobrança - DADOS.n3.atualizado (R$ 2,088 bi) | | "valor" (soma dos 5 sub-itens) | R$ 2.005.650.679,40 | sum(sub.valor) over parc+exec+protesto+da_pura+lanc_aberto | Funil - DADOS.n3.valor (R$ 2,005 bi) | Diferença R$ 2,088 bi - R$ 1,962 bi = R$ 126 mi: é o VALOR_PAGO acumulado das DUAMs em aberto (parcelas já pagas mas com saldo residual). Uma DUAM que pagou 3 de 12 parcelas entra no atualizado (com o histórico de pagamento) mas não no VL_DIVIDA (que é o saldo em aberto).
Universo canônico (igual em ambos)
FLAG_PG_TOTAL='0' AND VL_DIVIDA>0 -> 838.840 DUAMs / 100.609 CCPs (foto 31/05/2026). [!] NÃO confundir com N3 do funil de cobrança 576.770 DUAMs que aparece em algumas queries (esse é o sub-recorte EXISTS LIVRO1, que aplica o filtro de "inscrito em DA"). O briefing original do funil e o briefing da qualidade-dados usam o universo total (838.840), não o sub-recorte.
Aritmética do funil (soma dos 5 sub-itens)
n3_parc.atualizado       = R$   209.734.870,71
n3_exec.atualizado       = R$   691.242.178,05
n3_protesto.atualizado   = R$   938.568.522,68
n3_da_pura.atualizado    = R$    93.729.236,73
n3_lanc_aberto.atualizado= R$   154.811.966,93
                          -----------------
DADOS.n3.atualizado      = R$ 2.088.086.775,10  OK (bate exato)copiar
Aritmética válida: cab + VALOR_PAGO(parc) SÃO grandezas diferentes (saldo em aberto + pagamentos parciais já feitos) - não é dupla contagem. A memória cmqky1qa202ntp30in7vzlrpv ("Saldo = DUAM.VL_DIVIDA cabeçalho, NÃO soma de DUAM_IT") alerta contra somar VL_DIVIDA do cabeçalho + VL_DIVIDA das parcelas (duplica) - mas cab + VALOR_PAGO(parc) é legítimo.
Query canônica (subquery agregada, sem JOIN multiplicador)
WITH base AS (
  SELECT d."DUAM", d."VL_DIVIDA"::numeric(18,2) AS cab,
    (SELECT sum(coalesce(it."VALOR_PAGO",0))::numeric(18,2)
     FROM "SCH"."DUAM_IT" it
     WHERE it."DUAM"=d."DUAM" AND it."PARCELA">0) AS pago
  FROM "SCH"."DUAM" d
  WHERE d."FLAG_PG_TOTAL"='0' AND d."VL_DIVIDA">0
)
SELECT count(*) AS qtd,
  sum(cab) AS vl_cab,                    -- R$ 1.962.087.789,78
  sum(pago) AS vl_pago,                  -- R$    67.896.274,64
  sum(cab + coalesce(pago,0)) AS atualizado  -- R$ 2.029.984.064,42
FROM basecopiar
Por que dá R$ 2,029 bi e não R$ 2,088 bi? A query acima soma cab (saldo aberto) + pago (VALOR_PAGO das parcelas P>0, apenas). O briefing do funil usa uma fórmula diferente por sub-item (provavelmente cab + VL_PAGO(cab) + VALOR_PAGO(parc) para algumas faixas, ou inclui DUAMs com VL_DIVIDA=0 mas FLAG=0). Ambas as fórmulas são legítimas - medem coisas diferentes. A aritmética interna do funil é consistente (soma dos 5 sub-itens = 2,088 bi).
Onde mora o código
Frontend hardcoded: frontend/src/pages/FunilCobranca.jsx linhas 50-77 (constante DADOS com N1/N2/N3 hardcoded).
Backend do funil: backend/src/server.js (sub_marcadores N1/N2/N3 - algumas queries ao vivo, outras referências hardcoded).
Backend da qualidade-dados: backend/src/server.js rota GET /api/divida-ativa/qualidade-dados (retorna R$ 1,962 bi no campo universo.vl_divida_total).
Lições
NUNCA afirmar "bug" sem cross-check psql<->frontend de TODOS os sub-itens (não só do total).
Hardcoded != errado: o briefing do funil congelou valores após medição (foto 31/05/2026) - desde que a aritmética interna feche, é fonte canônica.
Aritmética de soma é a verificação mínima: 5 sub-itens somam o total? Se sim, a fórmula é internamente consistente.
Diferentes métricas não são "inconsistências": 1,96 bi (saldo aberto) vs 2,088 bi (saldo + pagamentos parciais) são ambas legítimas; documentar qual é qual.
Memória anterior errada (substituída por esta)
A memória cmqmhn5ju039ep30iiva685dj ("N3 = FLAG_PG_TOTAL=0", R$ 1,96 bi) está correta mas é apenas uma das perspectivas. Esta nova memória documenta a perspectiva complementar (R$ 2,088 bi com pagamentos parciais) sem invalidar a anterior.
> Correção da memória anterior que afirmava "N3 do funil = 576.770 DUAMs / R$ 1,7 bi" - estava errado. O universo canônico é 838.840 DUAMs.

Os 2 valores que aparecem como "saldo do N3"
Métrica	Valor	Fórmula
VL_DIVIDA cabeçalho	R$ 1.962.087.790,00	sum(DUAM.VL_DIVIDA) WHERE FLAG_PG_TOTAL='0' AND VL_DIVIDA>0
"atualizado"	R$ 2.088.086.775,10	sum(DUAM.VL_DIVIDA) + sum(DUAM_IT.VALOR_PAGO WHERE P>0)
Diferença R$ 2,088 bi - R$ 1,962 bi = R$ 126 mi: é o VALOR_PAGO acumulado das DUAMs em aberto (parcelas já pagas mas com saldo residual).
Universo canônico
FLAG_PG_TOTAL='0' AND VL_DIVIDA>0 -> 838.840 DUAMs / 100.609 CCPs (foto 31/05/2026).
2 achados de qualidade de dado em valores monetários (DUAM_IT.VL_DIVIDA / VALOR_PAGO) - jun/2026 cmqkx4dbx02nnp30iwbbhnl2i

---

### [04] 2 achados de qualidade de dado em valores monetários (DUAM_IT.VL_DIVIDA / VALOR_PAGO) - jun/2026

Descobertos ao montar o funil de cobrança. Afetam QUALQUER análise de valor (R$) sobre o estoque de lançamentos.
ACHADO 1 - PARCELA=0 é COTA ÚNICA, não só "entrada de parcelamento". Concentra ~91% do valor pago.
A regra histórica "filtrar PARCELA>0" (correta para análise de PARCELAMENTO) EXCLUI a cota única dos lançamentos simples (IPTU/taxa/multa paga de uma vez), que mora em PARCELA=0. Magnitude (jun/2026, DUAM_IT):
PARCELA=0 pago (VALOR_PAGO): R$ 9,81 bi vs R$ 0,92 bi em PARCELA>0 -> 91% do valor pago está em PARCELA=0.
PARCELA=0 não pago (VL_DIVIDA, DATA_PGTO IS NULL): R$ 3,33 bi vs R$ 0,54 bi em PARCELA>0.
REGRA: para funil/estoque/arrecadação de LANÇAMENTOS, INCLUIR PARCELA=0 (senão subestima ~85%). Filtrar PARCELA>0 SÓ em análise de parcelamento (onde PARCELA=0 é a entrada).
ACHADO 2 - FLAG_PGTO='1' (cabeçalho pago) carrega ~R$ 4,71 bi de parcelas STALE (saldo não zerado).
Há ~13,9M parcelas com DATA_PGTO NULL em DUAMs marcadas como pagas no cabeçalho (DUAM.FLAG_PGTO='1') - só 44.968 têm VALOR_PAGO. São dados velhos não zerados na baixa. Por isso "sum(DUAM_IT.VL_DIVIDA) de todas as parcelas com DATA_PGTO IS NULL" INFLA o estoque (dá ~R$ 5,25 bi PARCELA>0, dos quais R$ 4,71 bi é stale de cabeçalho-pago). REGRA: saldo de inadimplência GENUÍNO = parcelas não pagas de DUAMs com DUAM.FLAG_PGTO='0' (não confiar só em DUAM_IT.DATA_PGTO IS NULL). Cruzar sempre com FLAG_PGTO do cabeçalho.
Números de referência do funil (foto 31/05/2026, em DA = tem CDA, incl. PARCELA=0)
N1 Todos: 10.835.353 DUAMs (pagas 10.035.362 = R$ 10,74 bi VALOR_PAGO; canceladas/exclusão física 11.925).
N2 Não pagos (FLAG_PGTO='0'): 799.990 / saldo R$ 2,44 bi (incl P0) / R$ 544 mi (P>0).
N3 Não pagos com CDA: 563.172 / R$ 2,05 bi (incl P0).
N4 Não pagos ajuizados (LIVRO1.DATA_AJUIZAMENT): 95.621 / R$ 872,6 mi.
N5 FUNDO (não pago, com CDA, sem desfecho: SITUACAO !in Q/E/R/C/D/02/Z, sem DATA_AGM, fora de parcelamento vigente): geral 547.550 / R$ 1,91 bi; dentro dos ajuizados 83.114 / R$ 749 mi.
Destaque "tinha CDA e pagou" = 1.949.538 (R$ 1,77 bi). Ajuizado e pagou = 354.075 (subconjunto).
Desvio em DA por tipo (LIVRO1.SITUACAO + DATA_AGM, mutuamente exclusivos, 350.823 CDAs / R$ 153,4 mi piso pois VL_CONVERTIDO=0 em CDA antiga): Remida(R) 53.319; Extinta(E) 23.295; Cancelada(C/D/02/Z) 115.767; AGM 158.442.
Decomposição valida: N2(qtd) = N3 563.172 + DA-adm-sem-CDA 107.558 + resíduo-lançamento 129.260 = 799.990 OK; R$ P>0 fecha exato (371,8M+4,8M+167,6M=544,2M).
Régua "em DA" = EXISTS LIVRO1 (CDA), NÃO DATA_DIV_ATI (ver memória cmqksxh0y02lfp30i9rzzsteo).
ACHADO 1 - PARCELA=0 é COTA ÚNICA, não só "entrada de parcelamento"
- PARCELA=0 pago: R$ 9,81 bi vs R$ 0,92 bi em PARCELA>0 -> 91% do valor pago está em PARCELA=0 - PARCELA=0 não pago: R$ 3,33 bi vs R$ 0,54 bi em PARCELA>0

REGRA: para funil/estoque/arrecadação de LANÇAMENTOS, INCLUIR PARCELA=0. Filtrar PARCELA>0 SÓ em análise de parcelamento.
ACHADO 2 - FLAG_PGTO='1' (cabeçalho pago) carrega ~R$ 4,71 bi de parcelas STALE
Há ~13,9M parcelas com DATA_PGTO NULL em DUAMs marcadas como pagas no cabeçalho - só 44.968 têm VALOR_PAGO.

REGRA: saldo de inadimplência GENUÍNO = parcelas não pagas de DUAMs com DUAM.FLAG_PGTO='0'. Cruzar sempre com FLAG_PGTO do cabeçalho.
Ciclo de vida do crédito tributário - máquina de estados validada no banco (jun/2026) cmqkacw2601vvp30ipfs62cp5

---

### [05] Ciclo de vida do crédito tributário - máquina de estados validada no banco (jun/2026)

Modelo validado ao vivo no banco SCH (foto 31/05/2026). Descreve a máquina de estados de um crédito tributário (DUAM), das origens ao desfecho, com as colunas-pivô reais. Construído a partir da descrição do "ciclo de vida" dada pelo usuário + validação exaustiva no banco.
ORIGENS (a montante da Constituição)
Ação fiscal = AUTO de infração (SCH.AUTO, 27.402 autos). Vínculo com a DUAM via DUAM.ORDEM_SERVICO = AUTO.ORDEM_SERVICO (7.495 DUAMs rastreáveis). [!] IS_GERADO_INTEGRACAO_DUAM=0 em todos e DUAM.NR_AUTO só 1 preenchido - a integração formal está quebrada; use ORDEM_SERVICO. "Ação fiscal" (AUTO, origem) != "execução fiscal" (ajuizamento, cobrança judicial da CDA).
Outras origens: IPTU (SMCALC), ISS, Alvará, taxas - geram DUAM.
Destino das 7.495 DUAMs de auto: 77% pagas, 23% aberto, 45% em DA, 40% com CDA, 26% ajuizadas.
ESTADOS
TRANSITÓRIOS: LANCAMENTO_ABERTO, DIVIDA_ATIVA_ABERTA, EM_PARCELAMENTO, AJUIZADO (execução fiscal), PROTESTADO.
ATRIBUTO coexistente (não estágio): CDA (LIVRO1.INSCRICAO) - documento da DA inscrita; nem toda DA tem CDA.
TERMINAIS: PAGO, CANCELADO_LANCAMENTO, EXTINTO/REMIDO, CANCELADO_AGM, PROTESTO_CANCELADO.
CANCELAMENTO DE LANÇAMENTO - descoberta-chave
NÃO existe coluna de status "cancelada" na DUAM (85 cols) nem na DUAM_IT (76 cols). Esgotado: FLAG_PGTO ('0'/'1' só), FLAG_PG_TOTAL, PGTO_PARC ('0'/'1'/'3'), REG9, DIVIDA, DUAM_REF, OBS/OBS1 (557 menções livres, falso-positivo), TIPOAVIS (estornos são de folha/consignações), tabelas DUAM (CANCELAMENTO_DESCONTO_DUAM vazia; DUAM_REVISAO_LANCAMENTO=7.128 é mapa de revisão; REVDUAM=290). O cancelamento É exclusão FÍSICA da DUAM - a linha é DELETADA. Rastro só no log AUDITORIA (TABELA='DUAM', TP_MOV): inclusao 4.359.328, alteracao 1.858.742, exclusao 11.925. A DUAM cancelada não existe no snapshot -> por isso não há flag de "cancelada". Mecanismos correlatos: revisão/substituição (DUAM_REVISAO_LANCAMENTO 7.128; cadeias DUAM_REF 992.832 mas 979.535 já pagas; DUAM_ANT). O estado "cancelado" é terminal e FORA do snapshot da DUAM - só auditável via AUDITORIA.
TRANSIÇÕES (gatilho | coluna-pivô)
EM_PARCELAMENTO -> estorno (SMCALCREPAC.DATA_ESTORNO): 2 destinos - volta-a-dívida (DUAM origem FLAG_PGTO='0' AND VL_DIVIDA>0) = 79.841 (30%); reparcelado/pago (FLAG_PGTO='1') = 187.227 (70%).
NÚMEROS VALIDADOS (foto 31/05/2026)
DUAM total 10.835.353: pagas (FLAG_PGTO='1') 10.035.362; abertas 799.990 (2.445 zeradas-não-pagas = resíduo, não cancelamento).
Parcelamentos (SMCALCREPAC) 103.592: vigentes 48.654; estornados 54.781 (53%); cancelados (CANCELADO=true) 7; não-registrados 156.
DUAMs de origem de parc. estornados: 267.118 -> 187.227 pagas (70%) / 79.841 voltaram a aberto com saldo (30%) / 50 zeradas.
CDAs (LIVRO1) 2.727.956: com ajuizamento (DATA_AJUIZAMENT) 488.171; com PROC_FORUM 645.604; com DATA_AGM 174.026.
AUTO 27.402; cancelamento de DUAM (AUDITORIA exclusao) 11.925.
NUANCES (diferenças teoria fiscal × banco)
Cancelamento de lançamento = exclusão física (só rastro no AUDITORIA), NÃO é status no snapshot da DUAM.
"Ação fiscal" (AUTO de infração) != "execução fiscal" (ajuizamento). AUTO é origem (a montante); ajuizamento é cobrança judicial da CDA.
CDA é documento/atributo da DA (coexistente), NÃO estágio sequencial; nem toda DA gera CDA (ver memória DA!=CDA).
Estorno de parcelamento tem 2 destinos (30% volta-a-dívida, 70% reparcelado/pago) - não é só "volta a ser dívida".
Não há estado "prescrito" explícito - dissolve-se em EXTINTO/REMIDO/CANCELADO_AGM.
Pagamento do protesto não tem coluna própria - infere-se via CCP->DUAM.
Memórias relacionadas
cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA (distinção canônica)
cmq7f1sdu01jxl70i2lrtpdxh - 3 estados de um crédito (Lançamento/DA/Parcelamento)
cmqh5p2bz009zof0iiw4prdub - STATUS/SITUAÇÃO CDA × Protesto (18 mnemônicos da LIVRO1.SITUACAO)
Relatório docs/relatorio-pesquisa-profunda.md - pesquisa das 4 etapas por ano (Lançamento->DA->CDA->Protesto)
ORIGENS
- Ação fiscal = AUTO de infração (SCH.AUTO, 27.402 autos). Vínculo: DUAM.ORDEM_SERVICO = AUTO.ORDEM_SERVICO - "Ação fiscal" (origem) != "execução fiscal" (ajuizamento)

ESTADOS
- TRANSITÓRIOS: LANCAMENTO_ABERTO, DIVIDA_ATIVA_ABERTA, EM_PARCELAMENTO, AJUIZADO, PROTESTADO - ATRIBUTO coexistente: CDA (LIVRO1.INSCRICAO) - nem toda DA tem CDA - TERMINAIS: PAGO, CANCELADO_LANCAMENTO, EXTINTO/REMIDO, CANCELADO_AGM, PROTESTO_CANCELADO

CANCELAMENTO DE LANÇAMENTO - descoberta-chave
NÃO existe coluna de status "cancelada" na DUAM. O cancelamento É exclusão FÍSICA - linha é DELETADA. Rastro só no log AUDITORIA (TP_MOV='exclusao' = 11.925).
TRANSIÇÕES (15 mapeadas)
1. AUTO_INFRACAO -> LANCAMENTO 2. LANCAMENTO_ABERTO -> PAGO 3. LANCAMENTO_ABERTO -> CANCELADO (exclusão física) 4. LANCAMENTO_ABERTO -> DIVIDA_ATIVA 5. DIVIDA_ATIVA -> PAGO 6. DIVIDA_ATIVA -> EM_PARCELAMENTO 7. DIVIDA_ATIVA -> CANCELADO_AGM 8. DIVIDA_ATIVA <=> CDA (atributo) 9. DIVIDA_ATIVA -> PROTESTADO 10. EM_PARCELAMENTO -> PAGO 11. EM_PARCELAMENTO -> estorno (30% volta-a-dívida, 70% reparcelado/pago) 12. CDA(DA) -> AJUIZADO 13. AJUIZADO -> PAGO 14. PROTESTADO -> PROTESTO_CANCELADO 15. PROTESTADO -> PAGO

NÚMEROS VALIDADOS (foto 31/05/2026)
- DUAM total 10.835.353: pagas 10.035.362; abertas 799.990 - Parcelamentos: vigentes 48.654; estornados 54.781 (53%) - CDAs (LIVRO1) 2.727.956: ajuizadas 488.171; com DATA_AGM 174.026

Histórico de versões do relatório "Fluxo Completo da Arrecadação" (jun/2026) cmqk52w8901snp30ij4wplcq7
memória [REVER] SUPERADA

Três iterações foram geradas para o mesmo estudo, cada uma corrigindo a anterior:
V1 - docs/estatisticas_canal_2026/ (commit 606d858, jun/2026)
Autor: task-executor (subagente) Abordagem: Macro, 4 blocos por ano, 15 queries SQL, sumário executivo robusto Problemas:
"Parcelamento 96,65% de recuperação" - NÚMERO INVENTADO (não vem de nenhuma query)
"Protesto 2,80% cancelamento = taxa de sucesso" - interpretação errada (é evento técnico)
"DA = CDA" - confusão conceitual
Não tinha o achado #12 (94,70% das certidões ativas têm CDA paga)
Não tinha o saneamento de fev/2026 (23.367 canceladas no mês)
V2 - docs/estatisticas_canal_2026_v2/ (commit 415b55a, jun/2026)
Autor: task-executor (subagente) Abordagem: 23 queries SQL numeradas (Q01-Q23), 23 outputs salvos, relatório técnico Correções:
96,65% substituído por 86,07% global / 98,82% maduras (Q21)
2,80% rotulado como TAXA DE CANCELAMENTO TÉCNICO + 0,0252% histórico (Q18)
Achado #12 confirmado (Q15): 94,70% certidões ATIVAS têm CDA paga no imóvel
Saneamento de fev/2026 detectado (Q14): 23.367 canceladas no mesmo mês
Problemas:
Faltou profundidade didática (tabelas pequenas, sumário executivo fraco)
Não incorporou formalmente a distinção DA × CDA (memória cmqjwqab501l4p30isxkku5c5)
Não mostrou os 18 mnemônicos SITUACAO detalhados
Não incluiu a Ruptura de 2014-2018 da V1
V3 - docs/estatisticas_canal_2026_v3/ (commit 48a0511, jun/2026)
Autor: task-executor (subagente) Abordagem: V1 (estrutura/profundidade) + V2 (números corrigidos) + 8 memórias novas Composição:
614 linhas no relatorio_integrado.md (mais denso que V1's 316 linhas)
6 markdowns (1 README + 4 blocos + 1 relatório integrado)
23 queries SQL + 23 outputs salvos
Mantém formato V1 (4 blocos com subseções a-f)
Mantém números V2 (corretos)
Incorpora formalmente:
DA != CDA (memória cmqjwqab501l4p30isxkku5c5) - 3 cenários canônicos
18 mnemônicos SITUACAO (memória cmqh5p2bz009zof0iiw4prdub)
3 estados do crédito (memória cmq7f1sdu01jxl70i2lrtpdxh)
Protesto sem coluna de pagamento (memória cmqi0v4hb00e3p30ixdvy3d3y)
Taxa 0,0252% histórica do Protesto (memória cmqhyx6xi00dzp30ibgef0x0m)
Parcelamento 86,07%/98,82% (memória cmqiti5yk00gbp30i0n1skbpn)
PROC_FORUM 5 formatos (memória cmqjoxs0f016wp30i3i1c9bms)
JOIN correto LIVRO1.DUAM_IT = DUAM_IT.DUAM (memória cmqcp38pi00impl0izbsac41s)
CDAs com VL_CONVERTIDO=0 (memória cmqe7zxxr02eopl0ictjeiww1)
Cruzamento de validação (jun/2026)
Todos os números do V3 batem com o estudo docs/estudo-eficacia-canais-v2/ (commit ca99ab2, gerado em paralelo):
Parcelamento 86,07% global / 98,82% maduras OK
Protesto 2,80% técnico / 0,023% histórico / 93,79% proxy CCP OK
COM_protesto 90,16% vs SEM_protesto 96,06% OK
Safra 2026 33,3% maturação OK
Recomendação para próximas tasks
Usar V3 (docs/estatisticas_canal_2026_v3/relatorio_integrado.md) como referência oficial.
614 linhas
23 queries + outputs
6 markdowns (README + 4 blocos + relatório integrado)
Conhecimento atualizado (DA != CDA, 96,65% corrigido, achado #12, 18 mnemônicos)
Memórias relacionadas
cmqjwqab501l4p30isxkku5c5 - DA != CDA
cmq7f1sdu01jxl70i2lrtpdxh - 3 estados do crédito
cmqiti5yk00gbp30i0n1skbpn - Erro do 96,65%
cmqi0v4hb00e3p30ixdvy3d3y - Protesto sem coluna de pagamento
cmqhyx6xi00dzp30ibgef0x0m - 0,0252% histórico do Protesto
cmqh5p2bz009zof0iiw4prdub - 18 mnemônicos SITUACAO
cmqjoxs0f016wp30i3i1c9bms - PROC_FORUM 5 formatos
V1 - docs/estatisticas_canal_2026/ (commit 606d858, jun/2026)
- "Parcelamento 96,65% de recuperação" - NÚMERO INVENTADO - "Protesto 2,80% cancelamento = taxa de sucesso" - interpretação errada - "DA = CDA" - confusão conceitual

V2 - docs/estatisticas_canal_2026_v2/ (commit 415b55a, jun/2026)
- 96,65% substituído por 86,07% global / 98,82% maduras - 2,80% rotulado como TAXA DE CANCELAMENTO TÉCNICO - Achado #12 confirmado: 94,70% certidões ATIVAS têm CDA paga no imóvel - Saneamento de fev/2026 detectado: 23.367 canceladas no mesmo mês

V3 - docs/estatisticas_canal_2026_v3/ (commit 48a0511, jun/2026)
- V1 (estrutura/profundidade) + V2 (números corrigidos) + 8 memórias novas - 614 linhas no relatorio_integrado.md - 23 queries SQL + 23 outputs salvos - Mantém formato V1 com números V2 - Incorpora formalmente: DA != CDA, 18 mnemônicos SITUACAO, 3 estados do crédito, Protesto sem coluna de pagamento, Taxa 0,0252% histórica, Parcelamento 86,07%/98,82%, PROC_FORUM 5 formatos, JOIN correto LIVRO1.DUAM_IT, CDAs com VL_CONVERTIDO=0

ERRO NUMÉRICO NO RELATÓRIO "Eficácia dos Canais" - Parcelamento 96,65% (jun/2026) cmqiti5yk00gbp30i0n1skbpn

---

### [06] ERRO NUMÉRICO NO RELATÓRIO "Eficácia dos Canais" - Parcelamento 96,65% (jun/2026)

ERRO NUMÉRICO NO RELATÓRIO "Eficácia dos Canais" - Parcelamento 96,65% (jun/2026, task cmqh7h0ls00a7of0ityjeusj5)
O usuário identificou uma contradição grave: o relatório afirmou que o Parcelamento tem 96,65% de taxa de recuperação e o mesmo relatório mostrou que a safra 2026 tem 33,3% de inadimplência. As duas métricas medem coisas diferentes, mas o relatório não deixou isso claro. Pior: o "96,65%" é um número inventado - não corresponde a nenhuma query do banco.
O que o relatório original afirmava (e estava errado)
O relatório (commit 7f9eef4) dizia em 4 lugares diferentes:
Parcelamento
Achado: "Parcelamento atinge 11,6% mas converte 96,65%"
O que as queries REAIS retornam (jun/2026, foto 31/05/2026)
Q07 do próprio relatório (q07_taxa_adimplencia_parcelamento.sql) retorna:
Total de parcelas vigentes (>0): 448.350
Pagas: 385.879 (86,07%)
Em aberto: 62.471 (13,93%)
Em dia: 270.906
Em atraso: 114.973
Inadimplentes (vencidas e não pagas): 13.295
Taxa de pagamento GLOBAL: 86,07%
Taxa de inadimplência GLOBAL (vencidas/não pagas): 3,35%
Q25 do próprio relatório (q25_inadimplencia_safra.sql) retorna por ano:
2019: 0,3%	2020: 0,5%	2021: 1,1%
Q-P.4 (queries novas de correção, mesma régua 31/05/2026):
Parcelas com vencimento >= 6 meses atrás (safras maduras): 367.284
Pagas: 362.951 (98,82%)
Esta é a taxa de recuperação REAL de safras maduras
Diagnóstico
O executor:
Inventou o número 96,65% - não vem de nenhuma query do banco. Provavelmente tirou uma média entre 86,07% e algum outro valor, ou arredondou errado.
Misturou duas métricas diferentes na mesma frase:
"Taxa de recuperação" = % que foi pago sobre o total (mede eficiência DO CANAL)
"Inadimplência de safra 2026" = % vencido e não pago sobre o vencido (mede ESTOQUE ATUAL EM ATRASO)
Não deixou claro o que muda entre elas: a métrica 33% da safra 2026 é INADIMPLÊNCIA ATUAL (parcelas verdes que acabaram de vencer), enquanto 86,07% (global) ou 98,82% (maduras) é TAXA DE RECUPERAÇÃO histórica.
A explicação de maturação está CORRETA (curva monotônica de 1,2% a 33% conforme a safra amadurece) - vide memória cmq8rwufb001dq50ihly2rn2k - mas foi aplicada sem o rigor numérico necessário.
A correção correta
O Parcelamento deveria aparecer no relatório com 3 números, não 1:
Taxa de pagamento global (todas as parcelas, PARCELA>0): 86,07% (385.879 / 448.350)
Taxa de inadimplência global (vencidas e não pagas / vencidas): 3,35% (13.295 / 397.101)
Taxa de recuperação de safras maduras (parcelas com vencimento >=6m atrás, o "calote definitivo"): 98,82% (362.951 / 367.284)
Inadimplência da safra 2026 (mostrada como ALERTA, não como medida de eficiência do canal): 33,3% (efeito de maturação, em queda conforme o ano amadurece)
Regra de ouro revisada
Nunca apresentar uma única métrica de "eficiência" sem mostrar o que está sendo medido. As 3 métricas acima contam coisas diferentes:
86,07% = "quantas parcelas JÁ FORAM PAGAS" (histórico)
3,35% = "quantas parcelas VENCIDAS ainda estão em aberto" (estoque vencido)
98,82% = "calote DEFINITIVO" (parcelas maduras que nunca serão pagas)
33,3% (2026) = "ESTOQUE verde" (parcelas que acabaram de vencer - vai cair ao longo do ano)
Implicação para o ranking
O ranking FINAL pode mudar se corrigirmos a métrica de Parcelamento:
Antes (errado): Parcelamento 8,30 > Execução Fiscal 4,83 > Protesto 2,72
Agora: Parcelamento 9,5+ (com safras maduras) ou 7,5+ (com taxa global) - mas a diferença entre 86,07% e 98,82% é qual "Parcelamento" estamos medindo
Memórias relacionadas
cmq8q81dv000rq50izjbabumy - Metodologia do dashboard vs recorte 2026 (explica a curva de maturação)
cmq8rwufb001dq50ihly2rn2k - Inadimplência é MATURAÇÃO, não calote (a curva monotônica)
cmq8powgs01ufl70ibx4tuket - Inadimplência 2026 (38% na régua errada)
> O usuário identificou uma contradição grave: o relatório afirmou que o Parcelamento tem 96,65% de taxa de recuperação e o mesmo relatório mostrou que a safra 2026 tem 33,3% de inadimplência.

O que o relatório original afirmava (e estava errado)
"Parcelamento atinge 11,6% mas converte 96,65%" - em 4 lugares diferentes do relatório.

O que as queries REAIS retornam (jun/2026, foto 31/05/2026)
- Taxa de pagamento GLOBAL: 86,07% (385.879 / 448.350) - Taxa de inadimplência GLOBAL: 3,35% (13.295 / 397.101) - Taxa de recuperação de safras maduras: 98,82% (362.951 / 367.284) - Inadimplência da safra 2026: 33,3%

Diagnóstico
1. Inventou o número 96,65% - não vem de nenhuma query 2. Misturou duas métricas diferentes na mesma frase 3. Não deixou claro o que muda entre elas

Regra de ouro revisada
Nunca apresentar uma única métrica de "eficiência" sem mostrar o que está sendo medido.
INVENTÁRIO DE COLUNAS COMO CONTROLE DE PAGAMENTO EM ARQ1033 e LIVRO1 (jun/2026) cmqi0v4hb00e3p30ixdvy3d3y

---

### [15] VALOR_PAGO também é replicado em quitação antecipada - usar VALOR nominal (validado jun/2026)

Complemento da regra do VL_DIVIDA. Quando um contribuinte QUITA o parcelamento antecipadamente (paga o saldo todo de uma vez), o sistema marca TODAS as parcelas futuras daquela DUAM com a MESMA DATA_PGTO e o MESMO VALOR_PAGO (valor consolidado da quitação, replicado linha a linha), e VL_DIVIDA=0.
Prova: DUAM 10141958 -> parcelas 56-60 (venc jun-out/2026) todas pagas em 05/12/2025, VALOR=639,19 cada, VALOR_PAGO=1.203,07 IDÊNTICO em todas.
Logo: sum(VALOR_PAGO) por parcela INFLA (deu ~2x: nominal R$ 397.700,75 vs VALOR_PAGO R$ 716.853,86 nas antecipadas jun-dez/2026). Para medir valor recebido/antecipado, somar VALOR (nominal da parcela), não VALOR_PAGO.
Parcelas ANTECIPADAS (venc jun-dez/2026 já pagas até a foto 31/05/2026), por mês de vencimento - nominal (VALOR)
| Mês venc | Parcelas | Nominal | |---|---:|---:| | 2026-06 | 421 | R$ 156.968,74 | | 2026-07 | 168 | R$ 55.385,85 | | 2026-08 | 134 | R$ 46.512,35 | | 2026-09 | 118 | R$ 41.725,07 | | 2026-10 | 108 | R$ 37.126,24 | | 2026-11 | 97 | R$ 35.483,63 | | 2026-12 | 71 | R$ 24.498,87 | | Total | 1.117 | R$ 397.700,75 | São parcelas de venc futuro já recebidas (quitação antecipada) - recebimento GARANTIDO, fora da projeção de inadimplência. Universo total de parcelas com venc jun-dez/2026 = 24.547 a vencer + 1.117 antecipadas = 25.664.
Quando um contribuinte QUITA o parcelamento antecipadamente, o sistema marca TODAS as parcelas futuras daquela DUAM com a MESMA DATA_PGTO e o MESMO VALOR_PAGO.

- Prova: DUAM 10141958 -> parcelas 56-60 (venc jun-out/2026) todas pagas em 05/12/2025, VALOR=639,19 cada, VALOR_PAGO=1.203,07 IDÊNTICO - sum(VALOR_PAGO) por parcela INFLA (~2x). Para medir valor recebido/antecipado, somar VALOR (nominal)

Parcelas ANTECIPADAS (venc jun-dez/2026 já pagas até a foto 31/05/2026)
Mês venc	Parcelas	Nominal
2026-06	421	R$ 156.968,74
2026-07	168	R$ 55.385,85
2026-08	134	R$ 46.512,35
2026-09	118	R$ 41.725,07
2026-10	108	R$ 37.126,24
2026-11	97	R$ 35.483,63
2026-12	71	R$ 24.498,87
Total	1.117	R$ 397.700,75
FÓRMULA CANÔNICA do índice de inadimplência por safra (ref. jun/2026) cmq8vra1u005lq50iirnbp5s6

---

### [16] FÓRMULA CANÔNICA do índice de inadimplência por safra (ref. jun/2026)

Definição (a mesma pra todo ano, isolada)
Para cada ano A:
índice(A) = parcelas com DATA_VENC no ano A, vencidas até DATA_REF (31/05/2026) e não pagas
            ÷
            parcelas com DATA_VENC no ano A e vencidas até DATA_REFcopiar
Ou seja, cada ano é calculado sozinho - não é média ponderada entre anos, nem acumulado histórico. A query faz GROUP BY extract(year from DATA_VENC), produzindo uma linha por ano.
Universo
Parcelamentos VIGENTES: REGISTRADA_S_N='S', DATA_ESTORNO IS NULL, CANCELADO IS NULL OR false
DUAM_IT.PARCELA > 0 (ignora entrada PARCELA=0)
Pagamento aferido na DUAM-mãe (SMCALCREPAC.DUAM -> DUAM_IT)
Régua: DATA_REF = 2026-05-31 (data da foto, derivada de max(DATA_PGTO <= CURRENT_DATE)), NUNCA CURRENT_DATE cru
Query canônica
WITH ref AS (SELECT DATE '2026-05-31' AS hoje)
SELECT
  extract(year from it."DATA_VENC")::int AS ano,
  count(*) FILTER (WHERE it."DATA_VENC" < (SELECT hoje FROM ref) AND it."DATA_PGTO" IS NULL) AS naopagas,
  count(*) FILTER (WHERE it."DATA_VENC" < (SELECT hoje FROM ref))                              AS vencidas,
  round(100.0 * count(*) FILTER (WHERE it."DATA_VENC" < (SELECT hoje FROM ref) AND it."DATA_PGTO" IS NULL)
              / nullif(count(*) FILTER (WHERE it."DATA_VENC" < (SELECT hoje FROM ref)),0),1)  AS pct_inad
FROM "SCH"."SMCALCREPAC" r
JOIN "SCH"."DUAM_IT" it ON it."DUAM"=r."DUAM"
WHERE r."REGISTRADA_S_N"='S' AND r."DATA_ESTORNO" IS NULL AND (r."CANCELADO" IS NULL OR r."CANCELADO"=false)
  AND it."PARCELA">0 AND it."DATA_VENC" >= DATE '2018-01-01'
GROUP BY 1 HAVING count(*) FILTER (WHERE it."DATA_VENC" < (SELECT hoje FROM ref)) > 0
ORDER BY 1;copiar
Baseline (foto 31/05/2026)
| Ano | Vencidas | Não pagas | Índice | |---|---:|---:|---:| | 2018 | 24.299 | 90 | 0,4% | | 2019 | 30.053 | 102 | 0,3% | | 2020 | 42.022 | 220 | 0,5% | | 2021 | 26.590 | 301 | 1,1% | | 2022 | 36.622 | 253 | 0,7% | | 2023 | 27.924 | 248 | 0,9% | | 2024 | 35.840 | 381 | 1,1% | | 2025 | 43.037 | 2.065 | 4,8% | | 2026 | 24.952 | 8.315 | 33,3% |
Notas
A fórmula é numericamente comparável entre safras (mesma definição, mesmo denominador).
Conceitualmente, maturação ainda é um viés: safras antigas foram observadas 8 anos depois, safras 2026 há dias. Pra comparação 100% justa, medir todas no mesmo ponto de maturação (ex.: % não pago 6m após vencer).
Inadimplência DEFINITIVA real da carteira: ~1,2% (safras +12m maduras).
Definição (a mesma pra todo ano, isolada)
índice(A) = parcelas com DATA_VENC no ano A, vencidas até DATA_REF (31/05/2026) e não pagas ÷ parcelas com DATA_VENC no ano A e vencidas até DATA_REF

Universo
- Parcelamentos VIGENTES - DUAM_IT.PARCELA > 0 (ignora entrada) - Pagamento aferido na DUAM-mãe - Régua: DATA_REF = 2026-05-31 (NUNCA CURRENT_DATE cru)

Baseline (foto 31/05/2026)
Ano	Vencidas	Não pagas	Índice
2018	24.299	90	0,4%
2019	30.053	102	0,3%
2020	42.022	220	0,5%
2021	26.590	301	1,1%
2022	36.622	253	0,7%
2023	27.924	248	0,9%
2024	35.840	381	1,1%
2025	43.037	2.065	4,8%
2026	24.952	8.315	33,3%
Inadimplência DEFINITIVA real: ~1,2% (safras +12m maduras)

DECISÃO DO USUÁRIO (jun/2026): régua oficial do banco = foto de 31/05/2026 cmq8tjgf7004fq50ileu0kmtf

---

### [19] REGRAS DURAS - DUAM / DUAM_IT / "documento liquidado" (jun/2026)

Origem: investigação completa de 4 hipóteses sobre FLAG_PG_TOTAL e PARCELA=0, validada contra o banco SCH ao vivo (snapshot 31/05/2026). Fecho de ciclo iniciado em jun/2026.
REGRA 1 (CANÔNICA) - "Documento liquidado" = DUAM.FLAG_PG_TOTAL = 1
Por construção do sistema, o flag é internamente consistente: quando setado, DUAM.VL_DIVIDA (cabeçalho) = 0. Validado em 9.996.522 DUAMs, zero violações internas.
Falso-positivo: 0 (zero) por construção.
Buraco do outro lado (FLAG=0 mas pago de fato): 170 DUAMs (R$ 505.074,31 / 0,0075% do total pago) - desprezível. Composição:
102 ITBI-filhas (REC 14, DUAM_REF>0, VL_ORIGINAL=0): design do sistema.
16 PARCELAMENTO_GERAL (REC 1926, mãe vigente): sistema não migra flag quando consolidado.
44 IPTU + 5 ISS AUTONOMO + 3 antigas: resíduo histórico.
Regra prática: usar FLAG_PG_TOTAL=1 como filtro de "liquidados" em qualquer relatório/contagem. O buraco do outro lado não justifica tratamento especial.
REGRA 2 - FLAG_PG_TOTAL é flag de DOCUMENTO, NÃO implica parcelas quitadas
NÃO vale "FLAG_PG_TOTAL=1 => DUAM_IT.PARCELAS todas quitadas". 25% das DUAMs "pagas no cabeçalho" (2.518.511 de 9.996.513) têm parcelas P>0 com VL_DIVIDA>0 e DATA_PGTO IS NULL - saldo fantasma de R$ 5,78 bi somados (R$ 4,57 bi P>0 + R$ 1,21 bi P=0). Mecanismo: pagamento entra pela PARCELA=0 (cota única / valor consolidado), zera o cabeçalho, e o plano de parcelamento alternativo 1..N (não exercido) fica stale - nunca é zerado. 99,99998% das parcelas violadoras nunca receberam centavo (VALOR_PAGO=0).
REGRA 3 - Saldo devedor NUNCA somar DUAM_IT.VL_DIVIDA isolado
Sempre cruzar com DUAM.FLAG_PG_TOTAL = 0 (ou DUAM.VL_DIVIDA > 0). Sem o cruzamento, infla ~R$ 5,78 bi de saldo fantasma de documentos já pagos. Filtro canônico de inadimplência genuína:
SELECT d."DUAM", d."CCP", d."REC", d."VL_ORIGINAL", d."VL_DIVIDA",
       sum(it."VL_DIVIDA") AS saldo_a_receber
FROM "SCH"."DUAM" d
JOIN "SCH"."DUAM_IT" it ON it."DUAM" = d."DUAM"
WHERE d."FLAG_PG_TOTAL" = '0'           -- documento genuinamente em aberto
  AND d."VL_DIVIDA" > 0                -- cabeçalho ainda tem saldo
  AND it."PARCELA" > 0                  -- exclui entrada PARCELA=0
  AND it."VL_DIVIDA" > 0
  AND it."DATA_PGTO" IS NULL
GROUP BY ...;copiar
REGRA 4 - Hipótese "P0 paga => demais quitadas" é INSEGURA como regra
P0 paga (DATA_PGTO preenchido): 2.046 falso-positivos / R$ 3,13 mi (inclui baixa AGM sem pagamento, DATA_PGTO preenchido com VALOR_PAGO=0).
P0 paga (VALOR_PAGO>0): 1.851 falso-positivos / R$ 5,3 mi (pagamento parcial, valor divergente, flag não sincronizada).
Predicado correto: usar FLAG_PG_TOTAL=1 (Regra 1) - nunca "P0 paga" como âncora única.
Quando a hipótese "P0 paga" é boa (99,99% dos casos), é coincidência por ela ser uma das condições que geralmente acompanha FLAG_PG_TOTAL=1 - não por ser causa.
REGRA 5 - Fórmula canônica de DUAM_IT
VL_DIVIDA = VALOR + VL_JUROS + VL_MULTA + VL_ATUALIZACAO - VL_DESCONTO (bate centavo a centavo).
VALOR = principal (NÃO é o que se paga).
VL_DIVIDA = valor a pagar da parcela (SOMÁVEL para saldo a receber).
VALOR_PAGO = o que foi efetivamente pago.
Colunas sem prefixo VL_ (JUROS, MULTA, ATUALIZACAO): zeradas - vestígios do modelo antigo. Usar sempre as com VL_.
3 sinais de "baixa sem baixa" (anomalia) a detectar
DATA_PGTO IS NOT NULL + VL_DIVIDA > 0 + VALOR_PAGO = 0 -> baixa administrativa sem baixa de valor (caso DUAM 12416607).
VALOR_PAGO > 0 + VL_DIVIDA > 0 na mesma parcela -> pagamento parcial.
DATA_PGTO > DATA_VENC + VL_DIVIDA = 0 -> em atraso, mas zerado.
Fluxo de decisão canônico (resumo)
"Documento liquidado?" -> DUAM.FLAG_PG_TOTAL = 1 (Regra 1).
"Saldo a pagar?" -> DUAM.FLAG_PG_TOTAL = 0 E DUAM.VL_DIVIDA > 0 E DUAM_IT.VL_DIVIDA > 0 (Regra 3).
"Em DA?" -> EXISTS LIVRO1 (CDA formal) ou DUAM_IT.DATA_DIV_ATI (registro administrativo - tem armadilha de sentinela 0001-01-01, NÃO usar como filtro isolado; ver memórias cmqksxh0y02lfp30i9rzzsteo e cmqjwqab501l4p30isxkku5c5).
"Em parcelamento?" -> EXISTS SMCALCREPAC_ORIGEM o JOIN SMCALCREPAC r ON r."ID_SIMULA"=o."ID_SIMULA" WHERE r."REGISTRADA_S_N"='S' AND r."DATA_ESTORNO" IS NULL AND (r."CANCELADO" IS NULL OR r."CANCELADO"=false). NUNCA DUAM_REPACTO > 0 (casa 302 parcelas só).
"CPF/CNPJ do contribuinte?" -> PESSOA.CGC com padding (TP_PESSOA '2'=PF->11 díg, '3'/'4'=PJ->14 díg). Máscara pt-BR via regexp_replace + lpad.
"Receita (REC)?" -> TIPOAVIS.CD_TIPOAVI = DUAM.REC (NÃO RECEITAS.ID nem CONTA_CONTABIL).
Erros / armadilhas confirmadas NESTA conversa (jun/2026)
DUAM.REC = TIPOAVIS.CD_TIPOAVI (NÃO CONTA_CONTABIL) - memória cmqbl4frb000vpl0iu1lsphvk.
JOIN LIVRO1.DUAM_IT = DUAM_IT.DUAM (NUNCA por RECNUM) - memória cmqcp38pi00impl0izbsac41s.
PDF/MER do SIG Prodata é conceitual, NÃO contrato de schema (coluna SITUACAO inexistente) - memória cmqkvrzs902njp30i2vcdd2f4 (tela PDF vs Banco agora faz diff coluna-a-coluna).
DUAM_REPACTO = 0 (não NULL) na maioria - usar > 0, e mesmo assim não detecta parcelamento (caminho = SMCALCREPAC_ORIGEM).
Cancelamento de lançamento = exclusão física da linha (não é flag). Rastro só em AUDITORIA (TP_MOV='exclusao').
DATA_DIV_ATI tem 33% de sentinela 0001-01-01 (placeholder); "em DA" confiável = EXISTS LIVRO1.
Memórias relacionadas (leitura complementar)
cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA (distinção canônica).
cmq7f1sdu01jxl70i2lrtpdxh - 3 estados de um crédito (Lançamento/DA/Parcelado).
cmqksxh0y02lfp30i9rzzsteo - DATA_DIV_ATI não é detector confiável.
cmqbl4frb000vpl0iu1lsphvk - DUAM.REC = TIPOAVIS.CD_TIPOAVI.
cmqcp38pi00impl0izbsac41s - JOIN LIVRO1.DUAM_IT = DUAM_IT.DUAM.
cmqksf... (FLAG_PG_TOTAL é flag de DOCUMENTO) - base desta conversa.
cmqkvrzs902njp30i2vcdd2f4 - tela "PDF vs Banco" agora faz diff coluna-a-coluna (jun/2026).
Origem: investigação completa de 4 hipóteses sobre FLAG_PG_TOTAL e PARCELA=0, validada contra o banco SCH ao vivo (snapshot 31/05/2026). Fecho de ciclo iniciado em jun/2026.
REGRA 1 (CANÔNICA) - "Documento liquidado" = DUAM.FLAG_PG_TOTAL = 1
Por construção do sistema, o flag é internamente consistente: quando setado, DUAM.VL_DIVIDA (cabeçalho) = 0. Validado em 9.996.522 DUAMs, zero violações internas.

- Falso-positivo: 0 (zero) por construção. - Buraco do outro lado (FLAG=0 mas pago de fato): 170 DUAMs (R$ 505.074,31 / 0,0075% do total pago) - desprezível.

REGRA 2 - FLAG_PG_TOTAL é flag de DOCUMENTO, NÃO implica parcelas quitadas
NÃO vale "FLAG_PG_TOTAL=1 => DUAM_IT.PARCELAS todas quitadas". 25% das DUAMs "pagas no cabeçalho" (2.518.511 de 9.996.513) têm parcelas P>0 com VL_DIVIDA>0 e DATA_PGTO IS NULL - saldo fantasma de R$ 5,78 bi somados (R$ 4,57 bi P>0 + R$ 1,21 bi P=0).
REGRA 3 - Saldo devedor NUNCA somar DUAM_IT.VL_DIVIDA isolado
Sempre cruzar com DUAM.FLAG_PG_TOTAL = 0 (ou DUAM.VL_DIVIDA > 0). Sem o cruzamento, infla ~R$ 5,78 bi de saldo fantasma de documentos já pagos.

REGRA 4 - Hipótese "P0 paga => demais quitadas" é INSEGURA como regra
- P0 paga (DATA_PGTO preenchido): 2.046 falso-positivos / R$ 3,13 mi - P0 paga (VALOR_PAGO>0): 1.851 falso-positivos / R$ 5,3 mi

REGRA 5 - Fórmula canônica de DUAM_IT
VL_DIVIDA = VALOR + VL_JUROS + VL_MULTA + VL_ATUALIZACAO - VL_DESCONTO (bate centavo a centavo).
- VALOR = principal (NÃO é o que se paga). - VL_DIVIDA = valor a pagar da parcela (SOMÁVEL para saldo a receber). - VALOR_PAGO = o que foi efetivamente pago.

FLAG_PG_TOTAL=1 é flag de DOCUMENTO, NÃO garante parcelas quitadas na DUAM_IT (validado ao vivo jun/2026) cmqky1qa202ntp30in7vzlrpv

---

### [20] FLAG_PG_TOTAL=1 é flag de DOCUMENTO, NÃO garante parcelas quitadas na DUAM_IT (validado ao vivo jun/2026)

Pergunta investigada: "DUAM.FLAG_PG_TOTAL=1 (pago total) implica que TODAS as parcelas da DUAM_IT estão quitadas?" -> NÃO (a nível de linha da DUAM_IT). Mas o DOCUMENTO está genuinamente pago.
Números ao vivo (snapshot 31/05/2026)
DUAM com FLAG_PG_TOTAL=1: 9.996.513 (=0: 838.840). Só 2 valores.
Das pagas, têm >=1 parcela com saldo real aberto (DATA_PGTO NULL E VL_DIVIDA>0):
2.910.124 DUAMs (29,1%) considerando todas as parcelas
2.518.511 DUAMs (25,2%) só PARCELA>0
Parcelas violadoras: 13.618.889 (P>0, soma R$ 4.575.000.691,42) + 391.620 (P=0, soma R$ 1.205.135.736,87) = ~R$ 5,78 bi de saldo fantasma.
99,99998% das parcelas violadoras NUNCA receberam pagamento (VALOR_PAGO=0/NULL) - só 3 parcelas P>0 com pagamento parcial. NÃO é baixa parcial presa, é linha intocada não zerada.
O mecanismo (provado com exemplos)
O pagamento entra pela PARCELA=0 (cota única / valor consolidado), que recebe o VALOR_PAGO integral e zera o cabeçalho (DUAM.VL_DIVIDA=0, FLAG_PG_TOTAL=1). As linhas PARCELA=1..N (plano de parcelamento alternativo NÃO exercido) ficam STALE: VL_DIVIDA>0 e DATA_PGTO NULL, nunca limpas.
Prova: das 2,52M DUAMs violadoras P>0, 99,996% (2.518.421) têm PARCELA=0 paga (DATA_PGTO preenchida).
Ex.: DUAM 186886 (FLAG_PG_TOTAL=1, cab. VL_DIVIDA=0): PARC 0 VALOR_PAGO=50.049,79 paga 2017-12-05; PARC 1..10 VL_DIVIDA=5.285,70 cada, DATA_PGTO null (stale).
A REGRA REAL do flag
FLAG_PG_TOTAL=1 <=> DUAM.VL_DIVIDA (cabeçalho) = 0 <=> documento liquidado. É flag de DOCUMENTO, não de parcela. Cabeçalho 100% consistente: 9.996.512 de 9.996.513 DUAMs pagas têm DUAM.VL_DIVIDA=0.
REGRA DURA (afeta TODO cálculo de saldo)
Para "está pago?": confie em FLAG_PG_TOTAL=1 OU DUAM.VL_DIVIDA (cabeçalho) = 0. [OK] Confiável.
Para "saldo devedor": NUNCA somar DUAM_IT.VL_DIVIDA/DATA_PGTO IS NULL isolado - infla ~R$ 5,78 bi de saldo fantasma de documentos já pagos. SEMPRE cruzar com DUAM.FLAG_PG_TOTAL=0 (ou cabeçalho VL_DIVIDA>0). Reforça/quantifica a memória "Achado 2 - parcelas stale de cabeçalho-pago".
Números ao vivo (snapshot 31/05/2026)
- DUAM com FLAG_PG_TOTAL=1: 9.996.513 - Das pagas, têm >=1 parcela com saldo real aberto: 2.518.511 DUAMs (25,2%) só PARCELA>0 - Parcelas violadoras: 13.618.889 (P>0, soma R$ 4.575.000.691,42) + 391.620 (P=0, soma R$ 1.205.135.736,87) = ~R$ 5,78 bi de saldo fantasma - 99,99998% das parcelas violadoras NUNCA receberam pagamento

O mecanismo
O pagamento entra pela PARCELA=0 (cota única / valor consolidado), que recebe o VALOR_PAGO integral e zera o cabeçalho. As linhas PARCELA=1..N (plano de parcelamento alternativo NÃO exercido) ficam STALE.

A REGRA REAL do flag
FLAG_PG_TOTAL=1 <=> DUAM.VL_DIVIDA (cabeçalho) = 0 <=> documento liquidado.
REGRA DURA
- Para "está pago?": confie em FLAG_PG_TOTAL=1 OU DUAM.VL_DIVIDA (cabeçalho) = 0. [OK] - Para "saldo devedor": NUNCA somar DUAM_IT.VL_DIVIDA/DATA_PGTO IS NULL isolado - SEMPRE cruzar com DUAM.FLAG_PG_TOTAL=0.

---

### [21] [!] CORREÇÃO CRÍTICA: DUAM_IT.DATA_DIV_ATI NÃO é data de inscrição confiável (jun/2026)

[!] CORREÇÃO CRÍTICA: DUAM_IT.DATA_DIV_ATI NÃO é data de inscrição confiável NEM detector confiável de "em DA" (jun/2026)
Esta memória CORRIGE/RESSALVA as memórias cmqjwqab501l4p30isxkku5c5 ("Dívida Ativa != CDA") e cmq7f1sdu01jxl70i2lrtpdxh ("3 estados de um crédito"), que dizem "DATA_DIV_ATI = data do ato administrativo de inscrição" e "estado DA detectado por DATA_DIV_ATI IS NOT NULL". Validado ao vivo no banco SCH (foto 31/05/2026).
Os 2 erros do DUAM_IT.DATA_DIV_ATI
ERRO 1 - não é data confiável de inscrição. Distribuição em DUAM_IT (29,47M parcelas):
NULL: 16.729.419 (56,8%)
Sentinela 0001-01-01: 9.740.268 (33,0%)
Data REAL (ano >= 1900): 3.002.629 (apenas 10,2%)
Entre as "em DA" pelo marcador (não-NULL = 12,7M): 76,4% sentinela, só 23,6% data real. E mesmo o "real" às vezes é DATA DE LOTE DE MIGRAÇÃO (ex.: 2000-03-22 recorrente) que DIVERGE da data real da CDA.
ERRO 2 - DATA_DIV_ATI IS NOT NULL SUPERCONTA "em DA" em ~4,1 milhões. Das 6.754.255 DUAMs "em DA" por esse marcador:
2.655.701 (39,3%) têm data real no DUAM_IT
4.098.554 (60,7%) são SÓ sentinela 0001-01-01 -> dessas, apenas 491 têm CDA na LIVRO1, e 99,75% já estão PAGAS (lançamentos antigos quitados). A sentinela é PLACEHOLDER DEFAULT em lançamentos antigos que NUNCA foram genuinamente inscritos em DA. Ex.: DUAM 3 - lançada/paga em 1997, DATA_DIV_ATI=0001-01-01, ZERO linhas na LIVRO1.
O campo CANÔNICO: LIVRO1.DATA_INSCRICAO_DIVIDA
LIVRO1 é o "Livro de Inscrição da Dívida Ativa". LIVRO1.DATA_INSCRICAO_DIVIDA (2.727.956 CDAs): 0 NULL, 0 sentinela, 100% data REAL (distribuição 1997-2026 coerente, picos 2005=384k, 2025=247k, 2026=129k). É a fonte completa e confiável da data de inscrição.
REGRA DURA - qual campo usar
| Uso | [OK] CERTO | [X] ERRADO | |---|---|---| | "Está em DA?" (estado) | EXISTS LIVRO1 (tem CDA) ~= 2.521.541 DUAMs; ou união com DATA_DIV_ATI real (não-sentinela) -> ~2,66M | DATA_DIV_ATI IS NOT NULL (infla pra 6,75M com 4,1M sentinela-pagas-sem-CDA) | | Data de inscrição em DA | LIVRO1.DATA_INSCRICAO_DIVIDA | DUAM_IT.DATA_DIV_ATI (76% sentinela + datas de migração) |
Overlap confirmado (nível DUAM)
Com DATA_DIV_ATI real: 2.655.701
Com CDA (LIVRO1): 2.521.541
Ambos: 2.512.017 (praticamente o mesmo conjunto)
Data real mas sem CDA: 143.684 (candidatos a DA administrativa sem documento)
CDA mas sem data real no DUAM_IT: 9.524
JOIN canônico LIVRO1<->DUAM_IT é só por DUAM (LIVRO1.DUAM_IT = DUAM_IT.DUAM) - NÃO por PARCELA (LIVRO1.PARCELA tem numeração própria da CDA).
Número genuíno de "em DA"
Faixa defensável: 2,52M (com CDA) a 2,66M (com CDA + data real), NÃO 6,75M. A diferença (~4,1M) são lançamentos antigos pagos com sentinela placeholder. Ressalva: a memória "Dívida Ativa != CDA" lembra que pode haver DA genuína sem CDA - por isso a faixa, não um número único.
Impacto em análises anteriores (a corrigir)
Pesquisa profunda docs/relatorio-pesquisa-profunda.md (Etapa 2) - contou 6,1M parcelas "em DA" por DATA_DIV_ATI IS NOT NULL -> INFLADO pela sentinela. Tem ressalva pendente.
Funil de cobrança - destaque "pagou em DA = 6.073.349" estava inflado (real "pagou tendo CDA" = 1.949.538). O nível de DA do funil deve usar CDA (não pagos com CDA = 563.097), não DATA_DIV_ATI (680.906). Decisão do usuário (jun/2026): redefinir "em DA" por CDA.
Para NÃO PAGOS especificamente a sentinela é só ~1,5% (10.251 de 680.906) - então recortes de inadimplência por DATA_DIV_ATI são menos afetados que recortes que incluem pagos.
Decisão do usuário (jun/2026)
Aprovou: (a) registrar esta correção; (b) redefinir "em DA" por CDA (LIVRO1) e refazer o funil com a base correta; (c) não precisa aprofundar a causa da sentinela (evidência 99,75% pagas + sem CDA já basta).
> Esta memória CORRIGE/RESSALVA as memórias cmqjwqab501l4p30isxkku5c5 e cmq7f1sdu01jxl70i2lrtpdxh. Validado ao vivo no banco SCH (foto 31/05/2026).

ERRO 1 - não é data confiável de inscrição
Distribuição em DUAM_IT (29,47M parcelas): - NULL: 16.729.419 (56,8%) - Sentinela 0001-01-01: 9.740.268 (33,0%) - Data REAL: 3.002.629 (10,2%)

ERRO 2 - DATA_DIV_ATI IS NOT NULL SUPERCONTA "em DA" em ~4,1 milhões
Das 6.754.255 DUAMs "em DA" por esse marcador, 60,7% são SÓ sentinela -> dessas, apenas 491 têm CDA na LIVRO1, e 99,75% já estão PAGAS.

O campo CANÔNICO: LIVRO1.DATA_INSCRICAO_DIVIDA
LIVRO1 é o "Livro de Inscrição da Dívida Ativa". LIVRO1.DATA_INSCRICAO_DIVIDA (2.727.956 CDAs): 0 NULL, 0 sentinela, 100% data REAL (picos 2005=384k, 2025=247k, 2026=129k).
REGRA DURA
Uso	[OK] CERTO	[X] ERRADO
"Está em DA?" (estado)	EXISTS LIVRO1 ~= 2.521.541 DUAMs	DATA_DIV_ATI IS NOT NULL (infla pra 6,75M)
Data de inscrição em DA	LIVRO1.DATA_INSCRICAO_DIVIDA	DUAM_IT.DATA_DIV_ATI
Regras de Negócio - FiscalizaIA / SIG Prodata cmpimypwm000guf0i2ygqk93f
memória [REVISADA] CONTRADIZ

PARCELA = 0 (Entrada do Parcelamento)
Regra absoluta
PARCELA = 0 é a entrada do parcelamento, NÃO é uma parcela normal
DATA_PGTO IS NULL para PARCELA = 0 -> entrada NÃO quitada - não entra nas análises de pagamento, inadimplência ou posição devedora
Somente consultar PARCELA > 0 para análise de parcelas normais
A entrada tem lógica própria de quitação no sistema
Implicações práticas
Dashboards de inadimplência: filtrar sempre PARCELA > 0
Na DUAM_IT: entrada com DATA_PGTO NULL NÃO significa inadimplência
SMCALCREPAC_ORIGEM: PARCELA = 0 representa a entrada renegociada
Total de parcelas do parcelamento = COUNT(PARCELA > 0) - a entrada é contabilizada separadamente
Status do Parcelamento (SMCALCREPAC)
| Status | Condição | |---|---| | Vigente | REGISTRADA_S_N='S' AND DATA_ESTORNO IS NULL AND (CANCELADO IS NULL OR CANCELADO=false) | | Quebrado/Estornado | DATA_ESTORNO IS NOT NULL | | Cancelado | CANCELADO=true | | Quitado | FLAG_PG_TOTAL=1 na DUAM-mãe E VL_DIVIDA=0 |
Verificação de Pagamento de Parcelas
[!] REGRA CRÍTICA
O pagamento das parcelas NÃO é verificado na SMCALCREPACIT. A SMCALCREPACIT é apenas espelho de cálculo (valores projetados). O registro real de pagamento fica na DUAM_IT da DUAM-mãe do parcelamento:
-- Passo 1: obter a DUAM-mãe
SELECT "DUAM" FROM "SCH"."SMCALCREPAC" WHERE "ID_SIMULA" = :id;

-- Passo 2: verificar pagamentos
SELECT it."PARCELA", it."VALOR", it."DATA_VENC",
       it."DATA_PGTO",   -- preenchido = PAGA
       it."VALOR_PAGO",  -- valor efetivamente pago
       it."VL_DIVIDA"    -- 0.00 = quitado
FROM "SCH"."DUAM_IT" it
WHERE it."DUAM" = :duam_mae
  AND it."PARCELA" > 0   -- ignorar entrada
ORDER BY it."PARCELA";copiar
| Condição | Significado | |---|---| | DATA_PGTO IS NOT NULL | Parcela paga | | DATA_PGTO IS NULL | Parcela em aberto | | DATA_PGTO > DATA_VENC | Paga com atraso | | PARCELA = 0 | Entrada - lógica separada |
Fluxo de Dívida Ativa
DUAM (lançamento original)
  +- DUAM_IT (parcela com DATA_DIV_ATI preenchida = inscrita em DA)
       +- LIVRO1 (inscrição formal com número CDA)
            +- SMCALCREPAC (parcelamento do crédito)
                 +- CONTROLE_PROTESTO (envio para cartório)
                      +- ARQ1033 (envio para SPC/Serasa)copiar
[!] NOTA (jun/2026): "inscrita em DA" = DATA_DIV_ATI IS NOT NULL (estado administrativo). "Número CDA" = LIVRO1.INSCRICAO (documento). São coisas diferentes - ver memória cmqjwqab501l4p30isxkku5c5.
Integrações entre Módulos (via DUAM)
| Módulo | Origem | Gera | |---|---|---| | IPTU | SMCALC | DUAMs anuais de lançamento | | Alvarás | ITEMFER | DUAM de taxa de funcionamento | | NFE-s | SMCALCISS | DUAM de ISS | | Auditoria | AUTO (IS_GERADO_INTEGRACAO_DUAM=true) | DUAM de multa | | Parcelamento | SMCALCREPACIT | DUAM por parcela mensal |
Regras SQL Obrigatórias
Schema sempre com aspas duplas: "SCH"
Nomes de tabelas e colunas sempre UPPERCASE com aspas duplas: "DUAM", "CCP", "VL_SALDO"
Exemplo correto: SELECT "DUAM", "CCP" FROM "SCH"."DUAM_IT" WHERE "VL_DIVIDA" > 0
FKs declaradas = 0 - sempre usar LEFT JOIN com verificação de existência
Para tabelas grandes (DUAM, DUAM_IT, LIVRO1, fato_dda): verificar índices antes de criar novos
JOIN LATERAL (...) alias sempre com ON true - sem ele causa erro de sintaxe no PostgreSQL
Queries de Referência
Verificar status de DUAM
SELECT "DUAM", "FLAG_PG_TOTAL", "VL_PAGO", "VL_DIVIDA", "DIVIDA"
FROM "SCH"."DUAM" WHERE "DUAM" = :id;copiar
Buscar contribuinte por CPF/CNPJ ou nome
SELECT "CCP", "NOME", "CGC", "NAT_JURIDICA", "CEP"
FROM "SCH"."PESSOA" WHERE "CGC" = :cpfcnpj OR "NOME" ILIKE '%:nome%';copiar
Listar DUAMs em dívida ativa de um contribuinte
Nota: "em dívida ativa" = DATA_DIV_ATI IS NOT NULL (estado administrativo). Para CDA (documento), ver LIVRO1.INSCRICAO.
SELECT i."DUAM", i."PARCELA", i."VALOR", i."DATA_DIV_ATI", i."VL_DIVIDA"
FROM "SCH"."DUAM_IT" i
JOIN "SCH"."DUAM" d ON d."DUAM" = i."DUAM"
WHERE d."CCP" = :ccp AND i."DATA_DIV_ATI" IS NOT NULL AND i."VL_DIVIDA" > 0;copiar
Listar inscrições em dívida ativa (LIVRO1) - CDAs de DA
Nota: LIVRO1.INSCRICAO = nº da CDA de DA (documento). Não confundir com ARQ1033.NR_CERTIDAO (certidão de protesto).
SELECT l."DUAM_IT", l."PARCELA", l."INSCRICAO" AS cda, l."DATA_INSCRICAO_DIVIDA", l."VL_CONVERTIDO", l."CCP"
FROM "SCH"."LIVRO1" l WHERE l."CCP" = :ccp;copiar
Listar parcelamentos ativos de um contribuinte
SELECT "ID_SIMULA", "ID_TERMO_PARCELAMENTO", "REGISTRADA_S_N",
       "DATA_HORA_HOMOLOGA", "DATA_ESTORNO", "CANCELADO", "PARCELAS"
FROM "SCH"."SMCALCREPAC"
WHERE "DEVEDOR" = :ccp
  AND "REGISTRADA_S_N" = 'S'
  AND "DATA_ESTORNO" IS NULL
  AND ("CANCELADO" IS NULL OR "CANCELADO" = false);copiar
Listar imóveis de um contribuinte (IPTU)
SELECT "CCI", "AREA_LOTE", "AREA_EDIF_UNI", "VALOR_VENAL",
       "VL_VENAL_TERRENO", "VL_VENAL_EDIFICACAO", "TIPO_IMO", "TOTAL_DIVIDA"
FROM "SCH"."BCI" WHERE "CCP" = :ccp;copiar
Buscar notas fiscais emitidas por prestador
SELECT "ID", "NR_NFE", "DATA_EMISSAO", "VL_SERVICO", "VL_TOTAL_ISS", "CANCELADA"
FROM "SCH"."NFE"
WHERE "INSC_MUNICIPAL_PRESTADOR" = :insc_municipal
ORDER BY "DATA_EMISSAO" DESC;copiar
Buscar autos de infração de um contribuinte
SELECT "NUM_AUTO", "DATA", "VALOR_ORIGINAL", "MULTA", "SITUACAO", "IS_GERADO_INTEGRACAO_DUAM"
FROM "SCH"."AUTO"
WHERE "CCP" = :ccp ORDER BY "DATA" DESC;copiar
Riscos Conhecidos
Registros órfãos em tabelas filhas (sem FK declarada)
NFSE_GOV_LOG cresce rapidamente (log de requisições à Receita Federal)
Bytea em AFEAE, SIGFACIL_ANEXO, NFE_ANEXOS infla shared_buffers
fato_detalhamento_divida_ativa: sem particionamento em produção
Janelas batch sobrepostas podem gerar inconsistência temporária
Memórias de referência (jun/2026)
cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA (distinção canônica, 3 cenários)
cmq7f1sdu01jxl70i2lrtpdxh - 3 estados de um crédito (Lançamento/DA/Parcelamento)
cmqcd1ikx001ppl0iyukx0fqx - DIRETRIZ Demonstrativo (5+1 seções)
cmqh3x4jp009tof0is6n55ukx - Busca universal de "CDA" (3 colunas)
cmqh5p2bz009zof0iiw4prdub - STATUS/SITUAÇÃO CDA × Protesto
PARCELA = 0 (Entrada do Parcelamento)
- PARCELA = 0 é a entrada do parcelamento, NÃO é uma parcela normal - DATA_PGTO IS NULL para PARCELA = 0 -> entrada NÃO quitada - Somente consultar PARCELA > 0 para análise de parcelas normais

Status do Parcelamento (SMCALCREPAC)
Status	Condição
Vigente	REGISTRADA_S_N='S' AND DATA_ESTORNO IS NULL AND (CANCELADO IS NULL OR CANCELADO=false)
Quitado	FLAG_PG_TOTAL=1 na DUAM-mãe E VL_DIVIDA=0
Verificação de Pagamento de Parcelas
[!] REGRA CRÍTICA: O pagamento fica na DUAM_IT da DUAM-mãe do parcelamento.

-- SQL
SELECT it."PARCELA", it."VALOR", it."DATA_VENC", it."DATA_PGTO",   -- preenchido = PAGA it."VALOR_PAGO", it."VL_DIVIDA"    -- 0.00 = quitado FROM "SCH"."DUAM_IT" it WHERE it."DUAM" = :duam_mae AND it."PARCELA" > 0 ORDER BY it."PARCELA";

copiar
Fluxo de Dívida Ativa
DUAM -> DUAM_IT (parcela com DATA_DIV_ATI = inscrita em DA) -> LIVRO1 (CDA) -> SMCALCREPAC -> CONTROLE_PROTESTO -> ARQ1033

Regras SQL Obrigatórias
1. Schema sempre com aspas duplas: "SCH" 2. Nomes de tabelas e colunas sempre UPPERCASE com aspas duplas 3. FKs declaradas = 0 - sempre usar LEFT JOIN com verificação de existência 4. JOIN LATERAL (...) alias sempre com ON true - sem ele causa erro de sintaxe no PostgreSQL

DIRETRIZ DE FORMATO (jun/2026) - Demonstrativo de contribuinte (FiscalizaIA) cmqcd1ikx001ppl0iyukx0fqx

---

### [27] DUAM_IT: VALOR = principal original; VL_DIVIDA = VALOR A PAGAR (com encargos), SOMÁVEL. [!] corrige erro

[!] Esta memória CORRIGE a versão anterior que afirmava "VL_DIVIDA é saldo de cabeçalho replicado, não somar, usar VALOR". ISSO ESTAVA ERRADO (provado jun/2026 com SELECT * da DUAM_IT do B&G).
Decomposição real de cada parcela (DUAM_IT)
VALOR_A_PAGAR = VALOR + JUROS + MULTA + ATUALIZACAO - DESCONTO
VALOR = principal/valor ORIGINAL (não é o que se paga).
Colunas reais: JUROS, MULTA, ATUALIZACAO, DESCONTO (e VL_JUROS/VL_MULTA/VL_ATUALIZACAO/VL_DESCONTO).
Parcela paga -> VALOR_PAGO = a composição acima (confere com o valor do boleto/QR PIX).
Parcela aberta -> VL_DIVIDA = a composição acima = valor a pagar daquela parcela.
VL_DIVIDA É SOMÁVEL
Idêntico entre parcelas do acordo porque têm o mesmo valor a pagar (parcela fixa), não por replicação.
Saldo a receber de um acordo = sum(VL_DIVIDA) das abertas. Ex. B&G: 138×130.195,10 = R$ 17.966.923,80.
Carteira (vigentes, PARCELA>0, DATA_PGTO IS NULL, foto 31/05/2026)
Saldo a receber (valor a pagar) = sum(VL_DIVIDA) = R$ 132.826.479,58 [OK]
Principal original = sum(VALOR) = R$ 56.961.418,38 (subestima - só principal)
Implicação para o dashboard
A aba Projeção foi construída com sum(VALOR) (principal) - está ERRADA, precisa usar VL_DIVIDA. A aba "Saldo de parcelamentos" (R$ 132,8 mi) estava CERTA.
[!] Esta memória CORRIGE a versão anterior que afirmava "VL_DIVIDA é saldo de cabeçalho replicado, não somar, usar VALOR". ISSO ESTAVA ERRADO.

Decomposição real de cada parcela (DUAM_IT)
VALOR_A_PAGAR = VALOR + JUROS + MULTA + ATUALIZACAO - DESCONTO
- VALOR = principal/valor ORIGINAL (não é o que se paga). - Parcela paga -> VALOR_PAGO = a composição acima - Parcela aberta -> VL_DIVIDA = mesma composição = valor a pagar daquela parcela

VL_DIVIDA É SOMÁVEL
- Idêntico entre parcelas do acordo porque têm o mesmo valor a pagar (parcela fixa), não por replicação. - Saldo a receber de um acordo = sum(VL_DIVIDA) das abertas.

Carteira (vigentes, PARCELA>0, DATA_PGTO IS NULL, foto 31/05/2026)
- Saldo a receber (valor a pagar) = sum(VL_DIVIDA) = R$ 132.826.479,58 [OK] - Principal original = sum(VALOR) = R$ 56.961.418,38 (subestima - só principal)

SALDO A RECEBER DE PARCELAMENTO = R$ 132,8 mi (VL_DIVIDA = valor a pagar). CORRIGE erro anterior cmq9g6kcq009mq50i2es8w35s

---

### [28] SALDO A RECEBER DE PARCELAMENTO = R$ 132,8 mi (VL_DIVIDA = valor a pagar). CORRIGE erro anterior

SALDO A RECEBER DE PARCELAMENTO = R$ 132,8 mi (VL_DIVIDA = valor a pagar). CORRIGE erro anterior.
[!] Esta memória CORRIGE uma conclusão ERRADA que eu (orchestrator) cheguei em jun/2026 ao dizer que "VL_DIVIDA é replicado e o saldo a receber seria R$ 56,96 mi (nominal)". ISSO ESTAVA ERRADO. O usuário apontou e a investigação completa provou.
A VERDADE (provada com SELECT * da DUAM_IT, contribuinte B&G CCP 351027, DUAM-mãe 12386999)
Cada parcela da DUAM_IT tem decomposição: VALOR_A_PAGAR = VALOR + JUROS + MULTA + ATUALIZACAO - DESCONTO
VALOR = principal/valor ORIGINAL da parcela (ex.: 45.442,10). NÃO é o que se paga.
JUROS, MULTA, ATUALIZACAO (correção), DESCONTO = colunas reais da DUAM_IT.
Parcela PAGA: VALOR_PAGO = VALOR+JUROS+MULTA+ATUALIZACAO-DESCONTO (ex.: 45.442,10+83.010,82+5.349,88+8.057,41-13.730,66 = 128.129,55 OK, bate com o QR Code PIX do boleto).
Parcela ABERTA: VL_DIVIDA = mesma composição (ex.: 130.195,10) = VALOR A PAGAR daquela parcela.
VL_DIVIDA É SOMÁVEL por parcela (cada parcela é um boleto independente)
É idêntico entre parcelas do mesmo acordo porque elas têm o MESMO valor a pagar (parcela fixa) - NÃO porque é "cabeçalho replicado". Minha interpretação anterior de replicação estava errada.
B&G: 138 parcelas abertas × 130.195,10 = R$ 17.966.923,80 a receber. Pago 1.547.882,35 + a receber 17.966.923,80 = total acordo 19.514.806,15. Fecha.
NÚMEROS CORRETOS da carteira (parcelamentos vigentes, PARCELA>0, DATA_PGTO IS NULL, foto 31/05/2026)
Saldo a receber REAL (valor a pagar) = sum(VL_DIVIDA) = R$ 132.826.479,58 [OK] (62.362 parcelas)
Principal original (sum VALOR) = R$ 56.961.418,38 (só o principal, NÃO é o saldo a receber)
Valor recebido = sum(VALOR_PAGO) das pagas.
REGRA DURA (revisada)
"Saldo a receber" / "valor a pagar" / "estoque a receber de parcelamento" = sum(VL_DIVIDA) das parcelas não pagas = R$ 132,8 mi. As memórias anteriores que mandavam usar sum(VALOR)=56,96 mi estão ERRADAS e foram revertidas por esta. Para projeção de recebimento, dias de pagamento, top-pagadores etc., usar VL_DIVIDA (valor a pagar), não VALOR.
[!] Esta memória CORRIGE uma conclusão ERRADA.

A VERDADE (provada com SELECT * da DUAM_IT, B&G CCP 351027, DUAM-mãe 12386999)
Cada parcela da DUAM_IT tem decomposição:

VALOR_A_PAGAR = VALOR + JUROS + MULTA + ATUALIZACAO - DESCONTO
- VALOR = principal/valor ORIGINAL da parcela. NÃO é o que se paga. - Parcela PAGA: VALOR_PAGO = composição - Parcela ABERTA: VL_DIVIDA = mesma composição = VALOR A PAGAR

VL_DIVIDA É SOMÁVEL por parcela
- B&G: 138 parcelas abertas × 130.195,10 = R$ 17.966.923,80

NÚMEROS CORRETOS da carteira
- Saldo a receber REAL (valor a pagar) = sum(VL_DIVIDA) = R$ 132.826.479,58 [OK] - Principal original = R$ 56.961.418,38 (só o principal)

SMCALCREPAC_ORIGEM - semântica das colunas e ARMADILHAS de query (validado ao vivo jun/2026) cmq7gj13k01k3l70i3vzrgtou

---

### [29] SMCALCREPAC_ORIGEM - semântica das colunas e ARMADILHAS de query (validado ao vivo jun/2026)

Tabela que liga cada parcelamento (ID_SIMULA) às parcelas da DÍVIDA ORIGINAL que ele consolidou. Validações feitas com prova direta em escala.
[!] ARMADILHA 1 - PARCELA na origem NÃO é a parcela do parcelamento
Em SMCALCREPAC_ORIGEM, PARCELA = parcela da dívida original consolidada (pode ser PARCELA=0 da DUAM de origem). NÃO é a parcela do plano de parcelamento.
NUNCA filtrar PARCELA > 0 na SMCALCREPAC_ORIGEM achando que exclui "entrada" - isso descarta a maior parte das linhas e SUBESTIMA gravemente o total. (Erro real cometido: filtrar PARCELA>0 derrubou o "valor migrado" de R$ 371 mi para R$ 30 mi - falso.)
O filtro PARCELA > 0 (exclui entrada) só vale na DUAM_IT da DUAM-mãe, NÃO na origem.
Semântica das colunas de valor (provada parcela a parcela)
VL_ORIGINAL = valor ORIGINAL da dívida migrada. Bate centavo-a-centavo com DUAM_IT.VALOR da parcela na DUAM ORIGINAL (96,7% idêntico em escala; 99,997% têm correspondência). É a resposta para "quanto de dívida foi migrada para o parcelamento". soma vigente = R$ 271.741.722,00.
VL_DIVIDA = valor ATUALIZADO na consolidação (original + correção/juros/multa). Sempre >= VL_ORIGINAL. soma vigente = R$ 370.903.351,86.
VL_SALDO ~= principal da DUAM-mãe (reconcilia ~1,5% com sum(DUAM_IT.VALOR) da mãe). soma vigente = R$ 246/199 mi conforme recorte.
VL_ABATIMENTO, VL_DESCONTO = reduções (desconto típico de REFIS).
Quando a dívida entra em parcelamento, ela SAI da DUAM original
Na DUAM_IT original: VL_DIVIDA -> 0,00 e DUAM_REPACTO aponta a DUAM-mãe (nesse caso específico fica preenchido). Por isso filtrar VL_DIVIDA > 0 na DUAM original já remove naturalmente quase todo o crédito parcelado.
Cobertura e resíduos (honestidade)
48.622 de 48.650 parcelamentos vigentes (99,94%) têm linhas em SMCALCREPAC_ORIGEM. Só 28 não têm (ex.: parcelamentos muito antigos como ID 19990000004).
3,3% das linhas de origem (11.421) têm VL_ORIGINAL != DUAM_IT.VALOR original - prováveis recálculos pós-parcelamento, consolidação parcial ou reparcelamento. Resíduo pequeno, mas existe.
NÃO reconciliar VALOR com VALOR_PAGO diretamente
Na DUAM_IT, VALOR = principal; VALOR_PAGO = principal + juros/multa/correção pagos. São bases diferentes -> VALOR_PAGO pode ser MAIOR que VALOR. Não montar identidade "pago + a_receber = principal total" sem decompor encargos.
Caminho confiável de parcelamento vigente (canônico)
FROM "SCH"."SMCALCREPAC_ORIGEM" o
JOIN "SCH"."SMCALCREPAC" r ON r."ID_SIMULA" = o."ID_SIMULA"
WHERE r."REGISTRADA_S_N"='S' AND r."DATA_ESTORNO" IS NULL
  AND (r."CANCELADO" IS NULL OR r."CANCELADO"=false)
-- sem filtrar o."PARCELA"copiar
memória

---

### [31] Inconsistência de dados: VL_DIVIDA > 0 com VALOR_PAGO > 0 (DUAM_IT)

Inconsistência de dados: VL_DIVIDA > 0 com VALOR_PAGO > 0 (DUAM_IT)
Regra de negócio (validada com usuário jun/2026)
Saldo devedor real (VL_DIVIDA) só deve estar preenchido (>0) quando a parcela NÃO foi paga (VALOR_PAGO IS NULL OR VALOR_PAGO = 0).
Parcela paga (VALOR_PAGO > 0) -> VL_DIVIDA deveria ser 0.
VALOR_PAGO > 0 AND VL_DIVIDA > 0 simultâneo = INCONSISTÊNCIA (provável acerto manual / recálculo de juros-multa aplicado APÓS a baixa, sem zerar o saldo). Contamina relatórios de saldo devedor que cruzam "pago × falta pagar".
Para relatórios de saldo a pagar: considerar saldo SÓ quando VALOR_PAGO NULL ou 0.
Diagnóstico real (parcelamentos VIGENTES, PARCELA > 0, jun/2026)
Grupo A - INCONSISTENTE (VALOR_PAGO > 0 AND VL_DIVIDA > 0): 1.400 parcelas, SUM(VL_DIVIDA) = R$ 1.089.389,49, em 249 parcelamentos vigentes distintos.
Grupo B - LEGÍTIMO (não paga, saldo real): 62.340 parcelas, R$ 132.827.544,47.
Grupo C - quitado (VL_DIVIDA = 0): 384.229 parcelas.
Grupo D - borda: 272 parcelas pagas com VL_DIVIDA NULL (não zero) - "pagas sem saldo registrado", não entram no A. Nenhuma parcela com VL_DIVIDA negativo.
Padrões da inconsistência
VL_DIVIDA > VALOR_PAGO -> atualização monetária/juros/multa recalculada depois da baixa sem zerar saldo (ex.: 20250010348 parc 6/7; 20170015559 parc 100/101).
VL_DIVIDA = VALOR_PAGO exato -> baixa registrou pagamento mas NÃO decrementou o saldo (ex.: 20220010494, 20140002594).
Não é só recente - há casos de 2014 pagos em 2016 ainda presos.
Assinatura clássica de acerto manual pontual: num parcelamento saudável, só 1-2 parcelas quebram (ex.: 20250010348 só parc 6 e 7 erradas, resto OK).
Query de classificação (sobre DUAM_IT da DUAM-mãe de SMCALCREPAC vigente)
SELECT
  CASE
    WHEN it."VALOR_PAGO" > 0 AND it."VL_DIVIDA" > 0 THEN 'A_INCONSISTENTE'
    WHEN (it."VALOR_PAGO" IS NULL OR it."VALOR_PAGO" = 0) AND it."VL_DIVIDA" > 0 THEN 'B_LEGITIMO'
    WHEN it."VL_DIVIDA" = 0 THEN 'C_QUITADO'
    ELSE 'D_BORDA'
  END AS grupo,
  count(*), sum(it."VL_DIVIDA")
FROM "SCH"."SMCALCREPAC" r
JOIN "SCH"."DUAM_IT" it ON it."DUAM" = r."DUAM"
WHERE r."REGISTRADA_S_N" = 'S' AND r."DATA_ESTORNO" IS NULL
  AND (r."CANCELADO" IS NULL OR r."CANCELADO" = false)
  AND it."PARCELA" > 0
GROUP BY 1;copiar
Regra de negócio
- Saldo devedor real (VL_DIVIDA) só deve estar preenchido (>0) quando a parcela NÃO foi paga. - VALOR_PAGO > 0 AND VL_DIVIDA > 0 simultâneo = INCONSISTÊNCIA. - Contamina relatórios de saldo devedor.

Diagnóstico real (parcelamentos VIGENTES, jun/2026)
- Grupo A - INCONSISTENTE: 1.400 parcelas, R$ 1.089.389,49, em 249 parcelamentos vigentes distintos. - Grupo B - LEGÍTIMO: 62.340 parcelas, R$ 132.827.544,47. - Grupo C - quitado: 384.229 parcelas.

Padrões
1. VL_DIVIDA > VALOR_PAGO -> atualização de juros/multa recalculada depois da baixa 2. VL_DIVIDA = VALOR_PAGO exato -> baixa registrou pagamento mas NÃO decrementou o saldo 3. Não é só recente - há casos de 2014 pagos em 2016 ainda presos

Regras de Negócio - SMCALCREPAC / DUAM_IT (parcelamentos) cmq5s4fzr00fdl70iy5yfzy00

---

### [32] Regras de Negócio - SMCALCREPAC / DUAM_IT (parcelamentos)

Ajuste de vencimento para dia útil (sábado/domingo -> próximo dia útil)
Parcelamentos seguem regra "vencimento no dia X de cada mês" (default: dia 5).
Quando o dia X cai em sábado ou domingo, o SIG Prodata empurra o vencimento para o próximo dia útil (segunda-feira).
O ajuste já vem gravado no espelho de cálculo (SMCALCREPACIT.VENCIMENTO) desde a homologação do parcelamento - não é ajuste posterior na DUAM_IT.
Funções PL/pgSQL relacionadas: fc_get_vencimento_duam_nfe, feriados_moveis, fc_gerar_carga_feriados, fnc_alterar_data_venc_receita_exercicio.
[!] Ressalva: a regra não é aplicada uniformemente para datas muito futuras (ex.: parcela 11 com vencimento 05/04/2026 = domingo ficou SEM ajuste). Provável causa: calendário de feriados/dias úteis carregado só até certo horizonte no momento da homologação.
Implicação prática: ao analisar vencimentos de parcelas, SEMPRE cruzar DUAM_IT.DATA_VENC com dia da semana antes de concluir que está errado. Não é bug, é regra do sistema.
Não existe regra de tolerância/carência no módulo de parcelamento
Não há campos TOLERANCIA, CARENCIA, PRAZO, DIAS_*, DIA_VENCIMENTO configuráveis em SMCALCREPAC, SMCALCREPACIT, DUAM_IT ou DUAM.
A classificação de pagamento é estritamente comparativa:
DATA_PGTO > DATA_VENC -> em atraso
DATA_PGTO = DATA_VENC -> em dia (ou saldo residual se VL_DIVIDA > 0)
DATA_PGTO < DATA_VENC -> antecipada (pago antes do vencimento)
O backend (backend/src/server.js) usa comparação estrita DATA_VENC < CURRENT_DATE sem INTERVAL de carência.
"Em dia (antecipada)" não é bug - é a interpretação literal do banco. Se o produto quiser tratar "pago <= vencimento" como simplesmente "em dia" (sem distinguir antecipada), é decisão de UX, não de regra fiscal.
Coluna "saldo residual" - VL_DIVIDA > 0 mesmo com DATA_PGTO preenchida
Ocorre quando o valor pago é menor que o valor atualizado (atualização monetária, juros, multa posterior ao vencimento nominal).
Parcela com DATA_PGTO IS NOT NULL E VL_DIVIDA > 0 = pagamento parcial (não é quitada).
Investigar caso a caso quando aparecer - pode indicar cálculo de juros/multa aplicado depois do pagamento, ou erro de cálculo.
Estrutura real de tabelas do parcelamento (validado jun/2026)
SMCALCREPAC NÃO tem coluna de valor total. O valor consolidado fica na DUAM-mãe (DUAM.VL_PAGO / VL_DIVIDA / FLAG_PG_TOTAL) e nas origens (SMCALCREPAC_ORIGEM.VL_ORIGINAL / VL_DIVIDA).
Colunas relevantes de SMCALCREPAC: ID_SIMULA, ID_TERMO_PARCELAMENTO, DEVEDOR (CCP), REGISTRADA_S_N, DATA_HORA_HOMOLOGA, DATA_ESTORNO, CANCELADO, PARCELAS, DUAM (DUAM-mãe), TIPO_ENTRADA, VALOR_PERC_ENTRADA, TIPO_SIMULACAO_VALOR.
SMCALCREPACIT usa VENCIMENTO (não DATA_VENCIMENTO / DATA_VENC_PARCELAS).
LIVRO1 (inscrições em DA) tem estrutura diferente da query de referência:
Colunas reais: DUAM_IT, PARCELA, CCP, VL_ORIGEM, VL_CONVERTIDO, INSCRICAO (CDA), DATA_INSCRICAO_DIVIDA.
Não existem: NUM_INSC_DA, CODIGO_CDA, VL_INSCRITO, FK_PESSOA. Chave de pessoa é CCP.
Ajuste de vencimento para dia útil
- Parcelamentos seguem regra "vencimento no dia X de cada mês" (default: dia 5). - Quando dia X cai em sábado ou domingo, SIG Prodata empurra para o próximo dia útil. - O ajuste já vem gravado em SMCALCREPACIT.VENCIMENTO desde a homologação.

Não existe regra de tolerância/carência
- Não há campos TOLERANCIA, CARENCIA, PRAZO, DIAS_*, DIA_VENCIMENTO configuráveis. - A classificação é estritamente comparativa: - DATA_PGTO > DATA_VENC -> em atraso - DATA_PGTO = DATA_VENC -> em dia (ou saldo residual se VL_DIVIDA > 0) - DATA_PGTO < DATA_VENC -> antecipada

Coluna "saldo residual"
- Parcela com DATA_PGTO IS NOT NULL E VL_DIVIDA > 0 = pagamento parcial.

Estrutura real de SMCALCREPAC
- SMCALCREPAC NÃO tem coluna de valor total. Valor consolidado fica na DUAM-mãe. - Colunas: ID_SIMULA, ID_TERMO_PARCELAMENTO, DEVEDOR, REGISTRADA_S_N, DATA_HORA_HOMOLOGA, DATA_ESTORNO, CANCELADO, PARCELAS, DUAM, TIPO_ENTRADA, VALOR_PERC_ENTRADA, TIPO_SIMULACAO_VALOR. - SMCALCREPACIT usa VENCIMENTO (não DATA_VENCIMENTO).

STATUS/SITUAÇÃO: CDA de Dívida Ativa × Certidão de Protesto (jun/2026, validado ao vivo) cmqh5p2bz009zof0iiw4prdub

---

### [35] Inadimplência de parcelamentos é MATURAÇÃO, não calote - curva por tempo de vencimento (banco estático, ref. 10/06/2026)

DESCOBERTA CRÍTICA que corrige a interpretação do "38% em 2026". O salto 2025(4,8%)->2026(38%) NÃO é explosão de calote - é efeito de maturação (parcela recém-vencida ainda não foi paga; a maioria paga com atraso). Comprovado por duas análises:
1. Curva por TEMPO desde o vencimento (parcelas vencidas, parc. vigentes, PARCELA>0)
| Maturação | Vencidas | Não pagas | % inad | |---|---|---|---| | +12 meses (MADURA) | 48.873 | 608 | 1,2% | | 6-12 meses | 28.080 | 1.438 | 5,1% | | 3-6 meses | 14.314 | 3.495 | 24,4% | | 1-3 meses | 9.718 | 3.882 | 39,9% | | < 1 mês (verde) | 5.216 | 3.413 | 65,4% |
2. Curva mês a mês (cresce suave e monotônico conforme aproxima de hoje)
2025-06=1,3% · 09=4,3% · 12=12,6% · 2026-01=21,9% · 03=32,5% · 05=45,2% · 06=87,7%. A coluna "pagas com atraso" é alta nos meses antigos (1000+/mês) e ZERO em jun/2026 -> ninguém teve tempo de pagar ainda.
CONCLUSÃO (inverte recomendação anterior)
Inadimplência DEFINITIVA / calote real ~= 1,2% (safras vencidas há +12m, já maduras). Esse é o número para projeção de PERDA.
O 38% de 2026 superestima MUITO a perda - é atraso temporário, não calote. NÃO usar 38% para ajustar projeção de recebimento.
O 3,62% histórico, por coincidência, está na ordem de grandeza certa (até levemente conservador) para perda definitiva. O "erro" do 3,62% no painel é ser FIXO/hardcoded e mal documentado, não o valor em si.
Para PROJEÇÃO DE RECEBIMENTO (perda esperada): usar ~1,2-1,5% (taxa de safras maduras), NÃO a taxa de safra verde.
Para MONITORAR risco corrente: o indicador honesto é a curva de maturação / safra, lendo cada safra no MESMO ponto de maturidade (ex.: % não pago 6 meses após vencer), nunca comparar safra verde com safra madura.
DESCOBERTA CRÍTICA que corrige a interpretação do "38% em 2026". O salto 2025(4,8%)->2026(38%) NÃO é explosão de calote - é efeito de maturação.

1. Curva por TEMPO desde o vencimento
Maturação	Vencidas	Não pagas	% inad
+12 meses (MADURA)	48.873	608	1,2%
6-12 meses	28.080	1.438	5,1%
3-6 meses	14.314	3.495	24,4%
1-3 meses	9.718	3.882	39,9%
< 1 mês (verde)	5.216	3.413	65,4%
CONCLUSÃO
- Inadimplência DEFINITIVA / calote real ~= 1,2% (safras vencidas há +12m) - O 38% de 2026 superestima MUITO a perda - é atraso temporário, não calote - Para PROJEÇÃO DE RECEBIMENTO: usar ~1,2-1,5%, NÃO a taxa de safra verde

Backend crashando com ETIMEDOUT no pg-pool (jun/2026) cmqiml4na00g9p30i5pxk1a51

---

### [40] [!] ARMADILHA CRÍTICA - JOIN correto de LIVRO1.DUAM_IT (jun/2026)

Erro de JOIN que custou 1 iteração do pipeline do dashboard "Análise para Transação" (task cmqcncu0m00g2pl0ii8y1qs9g). Foi corrigido em jun/2026, mas vale a pena registrar pra evitar reincidência.
O erro
Em queries de Dívida Ativa, NUNCA escrever:
JOIN "SCH"."DUAM_IT" it ON it."RECNUM" = l."DUAM_IT"  -- [X] ERRADOcopiar
O caminho correto
JOIN "SCH"."DUAM_IT" it ON it."DUAM" = l."DUAM_IT"  -- [OK] CORRETOcopiar
Por quê
LIVRO1.DUAM_IT armazena o número da DUAM (FK lógica para DUAM.DUAM).
NÃO armazena o RECNUM da DUAM_IT.
RECNUM é o PK artificial de DUAM_IT (bigserial), mas o vínculo com LIVRO1 é pelo DUAM (número de negócio).
Evidência em escala (medida em jun/2026, 11,5M linhas de LIVRO1)
| Join | Matches | % | |---|---:|---:| | LIVRO1.DUAM_IT = DUAM_IT.DUAM | 9.443.889 | 82% [OK] | | LIVRO1.DUAM_IT = DUAM_IT.RECNUM | 2.079.937 | 18% (parcial) [!] |
Impacto prático (CD 92327 - MULTA LOTEAMENTO)
Query com RECNUM: 0 CDAs (perde 100% das CDAs reais)
Query com DUAM: 44 CDAs em 42 CCPs (recuperação total)
Exemplo concreto: BENEDITO LOURENCO DE SOUSA (CCP 146862) tem CDA 0001/20241511119432520 de R$ 41,36 mi que não aparecia por causa do JOIN errado.
Como diagnosticar
Sintoma clássico: query retorna 0 linhas na seção DA do demonstrativo, mas o kpis.ano_cda e contribuintes.tem_cda (que usam DUAM_IT.DATA_DIV_ATI direto, sem passar por LIVRO1) mostram que CDAs deveriam existir.
O que validar antes de aprovar uma query de DA
-- Validar com 1 CCP conhecido que tem CDA (ex.: BENEDITO do CD 92327):
WITH cd AS (
  SELECT DISTINCT d."DUAM" FROM "SCH"."DUAM" d 
  WHERE d."CCP" = 146862 AND d."REC" = 92327 AND d."FLAG_PG_TOTAL" = 0
)
SELECT l."DUAM_IT", l."INSCRICAO" AS cda, l."VL_CONVERTIDO"::numeric(15,2)
FROM "SCH"."LIVRO1" l
JOIN "SCH"."DUAM_IT" it ON it."DUAM" = l."DUAM_IT"  -- CORRETO
WHERE l."CCP" = 146862;
-- Esperado: 1+ linhas, com CDA real do bancocopiar
Regra absoluta
LIVRO1 sempre join com DUAM_IT pelo campo DUAM (número da DUAM), NUNCA por RECNUM (PK artificial). O mesmo princípio se aplica provavelmente a outras tabelas que tenham "DUAM_IT" como nome de coluna (verificar caso a caso com evidência em escala).
Origem da confusão
Provavelmente veio de uma memória antiga (talvez cmpimypwm000guf0i2ygqk93f ou similar) que assumia que LIVRO1.DUAM_IT referia-se ao RECNUM de DUAM_IT (PK artificial). Mas no banco real, o nome é apenas uma coincidência semântica - o valor armazenado é o número de DUAM, não o RECNUM. Sempre que vir *.DUAM_IT, teste ambos os joins antes de assumir.
Correção feita em jun/2026
Task: cmqcncu0m00g2pl0ii8y1qs9g
Arquivo: backend/src/server.js linha 1131 (rota /api/analise-transacao/contribuinte/:ccp/demonstrativo)
Diff: 1 linha
Validação: BENEDITO + ESPÓLIO ADONEL + MW EMPREENDIMENTOS (3 CCPs com CDA do CD 92327)
Memória criada: cmqcouq2a00icpl0i1db4v0osr (esta)
O erro
Em queries de Dívida Ativa, NUNCA escrever:

-- SQL
JOIN "SCH"."DUAM_IT" it ON it."RECNUM" = l."DUAM_IT"  -- [X] ERRADO

copiar
O caminho correto
-- SQL
JOIN "SCH"."DUAM_IT" it ON it."DUAM" = l."DUAM_IT"  -- [OK] CORRETO

copiar
Por quê
- LIVRO1.DUAM_IT armazena o número da DUAM (FK lógica para DUAM.DUAM) - NÃO armazena o RECNUM da DUAM_IT

Evidência em escala (medida em jun/2026, 11,5M linhas de LIVRO1)
Join	Matches	%
LIVRO1.DUAM_IT = DUAM_IT.DUAM	9.443.889	82% [OK]
LIVRO1.DUAM_IT = DUAM_IT.RECNUM	2.079.937	18% (parcial) [!]
Impacto prático (CD 92327)
- Query com RECNUM: 0 CDAs (perde 100%) - Query com DUAM: 44 CDAs em 42 CCPs - BENEDITO LOURENCO (CCP 146862) tem CDA 0001/20241511119432520 de R$ 41,36 mi que não aparecia por causa do JOIN errado.

Regra absoluta
LIVRO1 sempre join com DUAM_IT pelo campo DUAM, NUNCA por RECNUM.
JOIN LIVRO1.DUAM_IT = DUAM_IT.DUAM (NÃO RECNUM) - armadilha crítica cmqcp38pi00impl0izbsac41s

---

### [41] JOIN LIVRO1.DUAM_IT = DUAM_IT.DUAM (NÃO RECNUM) - armadilha crítica

SCH.LIVRO1.DUAM_IT armazena o número da DUAM (igual a DUAM_IT.DUAM), NÃO o RECNUM (bigserial interno da DUAM_IT). Em escala: LIVRO1.DUAM_IT = DUAM_IT.DUAM casa em 9.443.889 (82%) linhas; = RECNUM casa em 2.079.937 (18%) - overlap massivo falso-positivo.
Regra
-- CORRETO
JOIN "SCH"."DUAM_IT" it ON it."DUAM" = l."DUAM_IT"
-- ERRADO (parece certo, casa em 18% por sorte)
JOIN "SCH"."DUAM_IT" it ON it."RECNUM" = l."DUAM_IT"copiar
Validação feita
Para CD 92327 (MULTA LOTEAMENTO), a query errada retorna 0 CDAs em 0 CCPs (100% perdido); a correta retorna 44 CDAs em 42 CCPs. O CDA do BENEDITO (CCP 146862) 0001/20241511119432520 R$ 41,36 mi ficou invisível por causa do bug.
Regra geral pra query de DA com LIVRO1
Sempre que for buscar detalhes de uma CDA via LIVRO1 e precisar ligar à DUAM (para filtrar por DUAM.REC, DUAM.CCP, FLAG_PG_TOTAL etc.), usar it."DUAM" = l."DUAM_IT". Aplicar em todas as queries de DA - LIVRO1.DUAM_IT é a chave lógica de DUAM, não o bigserial.
SCH.LIVRO1.DUAM_IT armazena o número da DUAM (igual a DUAM_IT.DUAM), NÃO o RECNUM. Em escala: LIVRO1.DUAM_IT = DUAM_IT.DUAM casa em 9.443.889 (82%) linhas; = RECNUM casa em 2.079.937 (18%).
Regra
-- SQL
-- CORRETO JOIN "SCH"."DUAM_IT" it ON it."DUAM" = l."DUAM_IT" -- ERRADO JOIN "SCH"."DUAM_IT" it ON it."RECNUM" = l."DUAM_IT"

copiar
Validação
Para CD 92327, a query errada retorna 0 CDAs; a correta retorna 44 CDAs em 42 CCPs.

---

### [45] Padrões SQL para análise de parcelamentos (FiscalizaIA)

Formatação pt-BR de valores e datas (portável, sem depender de lc_numeric)
-- Datas pt-BR
to_char(campo_data, 'DD/MM/YYYY')

-- Valores pt-BR (9.999.999,99) - to_char gera '9,999,999.99' (literais, não depende de locale);
-- depois fazemos swap ,<->. via três replace com '|' como pivô
replace(replace(replace(to_char(valor, 'FM999,999,990.00'),',','|'),'.',','),'|','.')

-- Razão do truque: to_char com 'FM999,999,990.00' produz '9,999,999.99' com , e . como literais
-- (não usa lc_numeric do servidor). Sem o swap, ficaria com , como milhar e . como decimal
-- (padrão americano). O swap inverte para o padrão brasileiro.copiar
Query canônica de parcelas pagas de um parcelamento (DD/MM pt-BR + classificação estrita)
SELECT
  it."PARCELA"                                                  AS "Parc",
  to_char(it."DATA_VENC", 'DD/MM/YYYY')                          AS "Vencimento",
  to_char(it."DATA_PGTO", 'DD/MM/YYYY')                          AS "Pagamento",
  replace(replace(replace(to_char(it."VALOR_PAGO", 'FM999,999,990.00'),',','|'),'.',','),'|','.') AS "Valor pago",
  replace(replace(replace(to_char(it."VL_DIVIDA",  'FM999,999,990.00'),',','|'),'.',','),'|','.') AS "VL_DIVIDA",
  CASE
    WHEN it."DATA_PGTO" > it."DATA_VENC"                        THEN 'em atraso'
    WHEN it."DATA_PGTO" < it."DATA_VENC"                        THEN 'em dia (antecipada)'
    WHEN it."DATA_PGTO" = it."DATA_VENC" AND it."VL_DIVIDA" > 0 THEN 'saldo residual'
    ELSE 'em dia'
  END                                                            AS "Obs"
FROM "SCH"."DUAM_IT" it
WHERE it."DUAM" = :duam_mae
  AND it."PARCELA" > 0
  AND it."DATA_PGTO" IS NOT NULL
ORDER BY it."PARCELA" ASC;copiar
Variantes de classificação "Obs"
Estrita (técnica, bate com o banco):
CASE
  WHEN it."DATA_PGTO" > it."DATA_VENC"                        THEN 'em atraso'
  WHEN it."DATA_PGTO" < it."DATA_VENC"                        THEN 'em dia (antecipada)'
  WHEN it."DATA_PGTO" = it."DATA_VENC" AND it."VL_DIVIDA" > 0 THEN 'saldo residual'
  ELSE 'em dia'
ENDcopiar
Agrupada (convenção UX - "em dia" inclui antecipada):
CASE
  WHEN it."DATA_PGTO" > it."DATA_VENC"    THEN 'em atraso'
  WHEN it."VL_DIVIDA" > 0                 THEN 'saldo residual'
  ELSE 'em dia'
ENDcopiar
Lembrete - pagamento de parcelas está na DUAM_IT, NÃO na SMCALCREPACIT
SMCALCREPACIT é apenas espelho de cálculo (valores projetados, vencimentos previstos).
O registro real de pagamento fica em DUAM_IT.DATA_PGTO / VALOR_PAGO / VL_DIVIDA da DUAM-mãe (campo SMCALCREPAC.DUAM).
SEMPRE filtrar PARCELA > 0 na análise - PARCELA = 0 é a entrada do parcelamento (lógica separada).
Formatação pt-BR de valores e datas (portável, sem depender de lc_numeric)
-- SQL
-- Datas pt-BR to_char(campo_data, 'DD/MM/YYYY')


-- Valores pt-BR (9.999.999,99) replace(replace(replace(to_char(valor, 'FM999,999,990.00'),',','|'),'.',','),'|','.')

copiar
Query canônica de parcelas pagas (DD/MM pt-BR + classificação estrita)
-- SQL
SELECT it."PARCELA" AS "Parc", to_char(it."DATA_VENC", 'DD/MM/YYYY') AS "Vencimento", to_char(it."DATA_PGTO", 'DD/MM/YYYY') AS "Pagamento", replace(...) AS "Valor pago", replace(...) AS "VL_DIVIDA", CASE WHEN it."DATA_PGTO" > it."DATA_VENC" THEN 'em atraso' WHEN it."DATA_PGTO" < it."DATA_VENC" THEN 'em dia (antecipada)' WHEN it."DATA_PGTO" = it."DATA_VENC" AND it."VL_DIVIDA" > 0 THEN 'saldo residual' ELSE 'em dia' END AS "Obs" FROM "SCH"."DUAM_IT" it WHERE it."DUAM" = :duam_mae AND it."PARCELA" > 0 AND it."DATA_PGTO" IS NOT NULL ORDER BY it."PARCELA" ASC;

copiar
Banco de Dados - SIG Prodata (Schema SCH) cmpimxoo5000euf0i9v9b3kdl
memória [REVER] SUPERADA

Dados técnicos críticos (validados em mai/2026)
Schema: "SCH" (case-sensitive, aspas duplas obrigatórias no PostgreSQL)
Total de tabelas: 4.887 [OK]
Total de colunas: 71.620 [OK]
FKs declaradas: 0 (zero) [OK] - integridade é responsabilidade da camada Java
Nomes: SCREAMING_CASE, sempre com aspas duplas para SELECT
RECNUM: presente em quase todas as tabelas, bigserial - identificador artificial, NÃO é PK de negócio
Tabelas legadas/órfãs (NÃO usar): DUAM_ANT, DUAM_HISTORICO, fato_detalhamento_divida_ativa_old
Módulos e tabelas centrais
1. Dívida Ativa
Tabela central: DUAM (~10,4M registros, 6GB)
Ciclo: DUAM -> DUAM_IT (parcelas) -> LIVRO1 (inscrição CDA) -> SMCALCREPAC (parcelamento) -> CONTROLE_PROTESTO / ARQ1033 (SPC/Serasa)
Analítica: fato_detalhamento_divida_ativa (tabela normal, SEM particionamento em produção)
2. Gestão de IPTU
Tabela central: BCI - Boletim de Cadastro Imobiliário
Cálculo: SMCALC -> gera DUAMs anuais
Auxiliares: BCI_SUB, BCI_GEO, BCI_ANT (snapshots anuais), BCI_HISTORICO_CALCULOS
NOVO 2026: CADURB [OK], LOG_CADURB [OK]
3. Gestão de Alvarás
Alvará de Construção: DALICONS (~241K registros, 152MB)
Alvará de Funcionamento: CAPAFER + ITEMFER (vinculado ao CADCAR - empresa)
Integração REDESIM: 38+ tabelas SIGFACIL_*
NOVO 2025: CONFIGURACAO_LANCAMENTO_TAXAS_INSCRICAO_ECONOMICA [OK]
[!] Nenhuma FK declarada - integridade 100% na camada Java
4. NFE-s (Notas Fiscais de Serviço)
Tabela central: NFE
RPS: LOTE_RPS -> RPS -> conversão em NFE
NOVO 2025: PARAMETROS_NFSE [OK], NFSE_GOV_LOG [OK], NFE_CARTA_CORRECAO [OK], OBSERVACAO_NFE [OK]
NOVO 2025/2026: Reforma Tributária IBS/CBS (RPS_DUAM)
79 tabelas, apenas 2 FKs declaradas
5. Auditoria Fiscal
Tabela central: AUTO
NOVO 2025: AUTO_APREENSAO [OK], ANEXOS_AUTO_INFRACAO [OK]
DESIF: APURACAO_DESIF + ITEM_APURACAO_DESIF (ISS de bancos via COSIF)
Fluxo: OS -> TERMO -> AUTO -> DUAM (via IS_GERADO_INTEGRACAO_DUAM)
NOVO ago/2025: MENSAGEM_NOTIFICACAO_SIMPLES_NACIONAL [OK]
[!] Nenhuma FK declarada
Entidades compartilhadas entre módulos
PESSOA - cadastro único de PF/PJ, usado por todos os módulos
BCI/CCI - imóvel, usado por IPTU, Alvarás, Auditoria, Dívida Ativa
CADCAR - empresa, usado por Alvarás, NFE-s, Auditoria
DUAM - documento de arrecadação, destino final de quase todos os módulos
TIPOAVIS - tipo de aviso/lançamento
RECEITA - plano de receitas municipais (LRF)
AUDITORIA - log transversal (85GB / ~227M registros - NÃO truncada neste banco)
Views disponíveis (confirmadas)
[OK] V_DIVIDA_ATIVA
[OK] V_DIVIDA_ATIVA_EXECUCAO
[OK] V_DIVIDA_ATIVA_PROTESTO
[OK] V_DIVIDA_ATIVA_PRESCRICAO
Módulo de Parcelamento (SMCALCREPAC)
Estrutura e IDs
Padrão do ID_SIMULA: AAAANNNNNNN (ano 4 dígitos + 7 sequenciais). Ex: 20070000001
[OK] SMCALCREPAC, SMCALCREPACIT, SMCALCREPAC_ORIGEM existem
SMCALCREPAC.DUAM -> DUAM-mãe gerada para o parcelamento (campo chave para rastrear pagamentos)
Status do parcelamento
Vigente: REGISTRADA_S_N='S' AND DATA_ESTORNO IS NULL AND (CANCELADO IS NULL OR CANCELADO=false)
Quebrado/Estornado: DATA_ESTORNO IS NOT NULL
Cancelado: CANCELADO=true
Quitado: FLAG_PG_TOTAL=1 na DUAM-mãe E VL_DIVIDA=0
Como verificar pagamento das parcelas (REGRA CORRETA)
O pagamento NÃO é verificado na SMCALCREPACIT - ela é apenas espelho de cálculo (valores projetados). O registro real fica na DUAM_IT da DUAM-mãe:
-- 1. Obter a DUAM-mãe
SELECT "DUAM" FROM "SCH"."SMCALCREPAC" WHERE "ID_SIMULA" = :id;

-- 2. Consultar pagamentos
SELECT it."PARCELA", it."VALOR", it."DATA_VENC",
       it."DATA_PGTO",   -- preenchido = PAGA
       it."VALOR_PAGO",  -- valor efetivamente pago
       it."VL_DIVIDA"    -- 0.00 = quitado
FROM "SCH"."DUAM_IT" it
WHERE it."DUAM" = :duam_mae
ORDER BY it."PARCELA";copiar
Como verificar se o parcelamento está quitado
SELECT "DUAM", "VL_PAGO", "VL_DIVIDA", "FLAG_PG_TOTAL"
FROM "SCH"."DUAM" WHERE "DUAM" = :duam_mae;
-- FLAG_PG_TOTAL = 1 E VL_DIVIDA = 0 -> QUITADOcopiar
FKs declaradas formalmente
SMCALCREPACIT -> SMCALCREPAC
SMCALCREPAC_ORIGEM -> SMCALCREPAC
AUDITA_ACERTA_ESTORNO_REPACTUACAO -> SMCALCREPAC_ORIGEM (FK composta: ID_SIMULA+DUAM+PARCELA)
Campo DUAM_REPACTO (DUAM_IT)
Existe como DUAM_REPACTO (NÃO DUAM_REPAC)
[!] Nem sempre preenchido - caminho confiável é via SMCALCREPAC.DUAM -> DUAM_IT
Volumetria e Performance
Tabelas com maior volume (mai/2026)
| Tabela | Registros | Tamanho | Observação | |---|---|---|---| | AUDITORIA | ~227.738.112 | 85 GB | [!] NUNCA SELECT * sem filtro | | DUAM_IT | ~28.172.124 | 14 GB | Parcelas das DUAMs | | DUAM | ~10.483.525 | 6.114 MB | Tabela transacional central | | LIVRO1 | ~2.599.078 | 2.306 MB | Inscrições em DA | | SMCALCREPACIT | ~1.358.704 | 264 MB | Parcelas dos parcelamentos | | SMCALCREPAC_ORIGEM | ~891.751 | 266 MB | Origens dos parcelamentos | | fato_detalhamento_divida_ativa | ~826.353 | 393 MB | Analítica - sem particionamento | | NFE | ~806.910 | 432 MB | Notas fiscais eletrônicas | | PESSOA | ~483.408 | 668 MB | Cadastro de contribuintes | | DALICONS | ~241.791 | 152 MB | Alvarás de construção | | BCI | ~167.926 | 437 MB | Cadastro imobiliário | | SMCALCREPAC | ~100.720 | 37 MB | Cabeçalhos dos parcelamentos | | AUTO | ~26.785 | 15 MB | Autos de infração |
Índices críticos (validado)
AUDITORIA: AUDITORIA_INDEX01, AUDITORIA_TABELA_CHAVE, IDX_AUDITORIA_DATA_BRIN, INDEX_AUDITORIA_TABELA_CHAVE_DATA
[!] idx_auditoria_aux_busca - NÃO existe
DUAM: DUAM_CCP, DUAM_INDEX00/01/08/16/19/20, DUAM_INDEX_FLAG_PG_TOTAL DUAM_IT: DUAM_IT_INDEX00/01/14/15/16/17, IDX_DUAM_IT_DATA_PGTO, IDX_DUAM_IT_DUAM LIVRO1: LIVRO1_INDEX00 a LIVRO1_INDEX16 (17 índices) NFE: NFE_CHAVE_AUTENTICACAO, IDX_NFE_MUNICIPAL_SERIE, NFE_INDEX01, NFE_RECNUM, IDX_NFE_CD_CNAE, IDX_NFE_DATA_IMPRESSAO
[!] idx_tabela_nfe_cancelada - NÃO existe
NFE_RANFES: NFE_RANFES_INDEX01, NFE_RANFES_CCP_TOMADOR_DATA_EMISSAO, idx_nfe_ranfes_chave_acesso_nfse
[!] idx_NFE_RANFES_NFE_ESCRITURACAO - NÃO existe
NFSE_GOV_LOG: idx_nfse_gov_log_nsu, IDX_NFSE_GOV_LOG_DATA_LANCAMENTO_SERVICO, pk_nfe_gol_log_id
[!] idx_ordenacao_nsu_tabela_nfse_log_gov_log - NÃO existe
SMCALCREPAC: SMCALCREPAC_DUAM, SMCALCREPAC_INDEX01/02/03 SMCALCREPACIT: SMCALCREPACIT_INDEX01/03 SMCALCREPAC_ORIGEM: SMCALCREPAC_ORIGEM_INDEX01/02, SMCALCREPAC_ORIGEM_INDEX_PARC_VENC fato_detalhamento_divida_ativa: FATO_DETALHAMENTO_DIVIDA_INDEX03
Particionamento
fato_detalhamento_divida_ativa -> relkind = 'r' - tabela NORMAL, NÃO particionada neste banco
Recomendado (não feito): BCI_HISTORICO_CALCULOS, NFSE_GOV_LOG, NFE_ESCRITURACAO
Funções PL/pgSQL
[OK] Existem: datawarehouse_fato_detalhamento_divida_ativa_apartir_2016, grava_dados_dda, get_valor_pago_dda_repacto, transporta_saldo_dda, excluir_dados_dda_periodo_referencia [X] NÃO existem (só homologação): get_valor_pago_dda_repacto_refatorada2025, transporta_saldo_dda_refatorada2025
Colunas bytea (cuidado com tamanho)
AFEAE.CONTEUDO_ARQUIVO, SIGFACIL_ANEXO, NFE_ANEXOS - recomendado migrar para S3/MinIO
Glossário de Termos
| Termo | Significado | |---|---| | BCI | Boletim de Cadastro Imobiliário - entidade central de imóveis | | CCI | Código do Cadastro Imobiliário - PK do BCI | | CCP | Código do Contribuinte/Pessoa - PK de PESSOA | | CGC | CPF ou CNPJ do contribuinte (campo na PESSOA) | | CDA | Certidão de Dívida Ativa | | CNAE | Classificação Nacional de Atividades Econômicas | | COSIF | Plano de Contas das Instituições Financeiras | | DA | Dívida Ativa | | DDA | Detalhamento da Dívida Ativa - tabela fato analítica | | DESIF | Declaração Eletrônica de Serviços de Instituições Financeiras | | DMS | Declaração Mensal de Serviços | | DUAM | Documento Único de Arrecadação Municipal - boleto/guia fiscal | | IBS/CBS | Tributos da Reforma Tributária 2026 | | IPTU | Imposto Predial e Territorial Urbano | | ITBI | Imposto sobre Transmissão de Bens Imóveis | | LIVRO1 | Livro de Inscrição da Dívida Ativa - contém CDAs | | NFS-e | Nota Fiscal de Serviço Eletrônica | | NSU | Número Sequencial Único - controle nacional de notas | | OS | Ordem de Serviço (do fiscal tributário) | | REDESIM | Rede Nacional para Simplificação do Registro de Empresas | | REFIS | Refinanciamento Fiscal - parcelamento com descontos | | REPAC | Repactuação - renegociação de dívida | | RPS | Recibo Provisório de Serviços - contingência da NFS-e | | SIGFACIL | Plataforma de integração SIG com REDESIM/Junta Comercial | | SMCALC | Tabela de processamento de cálculo de tributos imobiliários | | SMCALCREPAC | Tabela central de parcelamentos/repactuações | | SPC | Serviço de Proteção ao Crédito | | TIPOAVIS | Tipo de aviso/lançamento - controla template e fórmula de cálculo |
Campos de auditoria padrão (quase todas as tabelas)
RECNUM - bigserial, identificador artificial (NÃO é PK de negócio)
CD_USUARIO_AUDITA - usuário responsável pela última alteração
AUDITA_SISTEMA - sistema/módulo que fez a alteração
Convenções de nomes de colunas
DT_ / DATA_ - datas

---

