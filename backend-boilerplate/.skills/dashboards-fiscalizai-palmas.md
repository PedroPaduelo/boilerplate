---
name: dashboards-fiscalizai-palmas
description: Skill MESTRA do banco SCH (Palmas, TO) - FiscalizaIA. Cobre o dataset canonico da receita tributaria municipal: DUAM, CDA, protesto, parcelamentos, PESSOA, SIGFACIL, encoding LATIN1, maquina de estados do credito tributario e as 15 armadilhas criticas mais importantes. Use como ponto de entrada; chame as 3 sub-skills (banco-sch, cobranca, cda-protesto) pelo slug para o detalhe de cada frente.
---

# Banco SCH (Palmas) - Skill MESTRA

> Esta e a skill mestra do banco SCH (Palmas) - Prefeitura Municipal de Palmas (TO).
> E o dataset canonico do FiscalizaIA: receita tributaria, DUAM, CDA, protesto,
> parcelamentos, PESSOA, SIGFACIL, CONTROLE_PROTESTO_ITENS, LIVRO1, ARQ1033.
>
> Use esta mestra para entender o MODELO, as ARMADILHAS CRITICAS e a MAQUINA DE
> ESTADOS do credito tributario municipal. Para o detalhe de cada frente, abra
> a sub-skill especializada pelo slug (a IA pode ativar ate 1 skill por turno).

## 0. Indice das sub-skills

| Frente | Sub-skill (slug) | Cobre |
|---|---|---|
| Schema, encoding, qualidade de dado | `dashboards-fiscalizai-banco-sch` | PESSOA, SIGFACIL, INSC_MUNICIPAL, LATIN1, snapshots, decisoes estruturais |
| Funil, DUAM, parcelamentos, inadimplencia | `dashboards-fiscalizai-cobranca` | N1/N2/N3, DUAM_IT, SMCALCREPAC, REFIS, inadimplencia por safra, maturação |
| CDA, protesto, divida ativa, eficacia de canais | `dashboards-fiscalizai-cda-protesto` | LIVRO1, ARQ1033, PROC_FORUM, Certidao, Demonstrativo, Taxa de Recuperacao |

## 1. Encoding do banco: LATIN1 (regra #1 - inegociavel)

O schema `SCH` (e quase todo o banco da Prefeitura de Palmas) e `ENCODING 'LATIN1'`,
NAO UTF-8. Isso significa:

- Caracteres ASCII (a-z, A-Z, 0-9, pontuacao basica, aspas retas) sao seguros.
- Acentos pt-BR (`a e i o u a e i o u a o c a a e o`) sao validos em LATIN1.
- **PROIBIDO** em literais SQL: travessao `-`, en-dash `-`, reticencias `...`,
  seta `->`, aspas curvas `" "`, bullet `*` e simbolos matematicos
  (`!=`, `>=`, `<=`, `~=`, `^`, etc) - eles quebram com
  `has no equivalent in encoding "LATIN1"`.

Em qualquer query que a IA escrever para rodar contra o banco SCH, use SEMPRE:
- aspas retas `"texto"` (NUNCA aspas curvas),
- `-` (hifen ASCII) em vez de travessao/en-dash Unicode,
- `...` (3 pontos ASCII) em vez de reticencias Unicode,
- `->` (hifen + maior) em vez de seta Unicode,
- os simbolos Unicode `!=`, `>=`, `<=` em literais SQL (eles quebram com `has no equivalent in encoding "LATIN1"`). Use SEMPRE a forma ASCII.

Esta regra vale para LITERALS dentro de SQL. Nos arquivos de SKILL.md `.skills/`,
tambem aplicamos (a IA pode COPIAR trechos da skill para queries).

## 2. Maquina de estados do credito tributario (valida no banco)

Toda DUAM percorre um ciclo canonico. Este e o modelo conceitual que TODA query
do FiscalizaIA precisa respeitar:

```
LANCAMENTO  ->  PAGO  ->  LIQUIDADO
     |             |          ^
     v             v          |
 PARCELADO   ->  DIVIDA ATIVA (DA)
                  |
                  +--> COM CDA (certidao da divida ativa - titulo executivo)
                  +--> COM PROTESTO (certidao de protesto em cartorio)
                  +--> COM EXECUCAO FISCAL (LIVRO1.PROC_FORUM)
```

Definicoes (c/ origem no banco):
- **Lancamento** = DUAM/DUAM_IT com `DATA_PGTO IS NULL AND DATA_DIV_ATI IS NULL`.
  (NAO migrou para DA; NAO foi pago.)
- **Pago** = `DATA_PGTO IS NOT NULL` (parcela ou total).
- **Liquidado** = `DATA_PGTO IS NOT NULL` E `FLAG_PG_TOTAL = 1` (documento inteiro).
  ATENCAO: FLAG_PG_TOTAL e flag de DOCUMENTO, NAO garante todas as DUAM_IT
  quitadas (ver `dashboards-fiscalizai-cobranca`).
- **Divida Ativa (DA)** = `DATA_DIV_ATI IS NOT NULL`. E o ESTADO administrativo.
  NAO significa "tem CDA emitida" (CDA e o documento; ver CDA x DA).
- **Com CDA** = existe registro em `LIVRO1` com aquela `INSCRICAO` (que e o
  numero da CDA no formato `NR_LIVRO.PAG.LINHA.DUAM_IT.PARCELA`, ex:
  `20180.100.1.2443773.0`).
- **Com Protesto** = existe registro em `ARQ1033` com `NR_CERTIDAO` (formato
  numerico, ex: `20180015730`). NR_CERTIDAO e diferente de LIVRO1.INSCRICAO.
- **Execucao Fiscal** = `LIVRO1.PROC_FORUM` nao nulo (mas aceita 5+ formatos +
  string sentinela - ver sub-skill CDA/Protesto).

## 3. Armadilhas criticas (resumo executivo - O QUE NAO ESQUECER)

Lista compacta das 15 armadilhas mais criticas. Cada uma esta expandida em
alguma sub-skill:

1. **INSC_MUNICIPAL = 0 no join PESSOA x SIGFACIL_EMPRESA** - 123.613 registros
   orfaos quebram o cross-check PF/PJ. SEMPRE filtrar `INSCRICAO > 0`.
2. **Predicados do N3 do funil incompletos** - a regra de particao exclusiva
   dos 5 sub-marcadores NAO funciona com predicados simples; precisa de
   priorizacao ORDER BY.
3. **VL_DIVIDA vs VALOR_PAGO** - DUAM_IT.VALOR = principal original (NAO
   somavel), DUAM_IT.VL_DIVIDA = valor a pagar com encargos (SOMAVEL).
4. **DUAM_IT.DATA_DIV_ATI NAO e data de inscricao confiavel** - usar EXISTS em
   LIVRO1 para "em DA".
5. **FLAG_PG_TOTAL=1 e flag de DOCUMENTO** - NAO garante DUAM_IT quitadas.
6. **LIVRO1.DUAM_IT = DUAM_IT.DUAM (NAO RECNUM)** - juncao errada infla
   metricas.
7. **PROC_FORUM aceita 5+ formatos + sentinela** - nao fazer `= 'N'` literal;
   usar `IS NULL OR TRIM(...) IN (...)`.
8. **CERTIDAO tem 2 colunas-pivo** - LIVRO1.INSCRICAO (CDA de DA) vs
   ARQ1033.NR_CERTIDAO (certidao de protesto). NAO misturar.
9. **"Otimizacao de query de brinde" muda semantica** - CTEs/LEFT JOIN
   "otimizados" podem trocar `com_cda` por `em_cda` e quebrar o dashboard
   "Analise para Transacao".
10. **AUTO.VALOR_ORIGINAL = 100% zerado** - caminho REAL do valor:
    AUTO -> DUAM -> LIVRO1 (NAO usar AUTO direto).
11. **Inadimplencia de parcelamento e MATURACAO** - 38% em 2026 NAO e calote,
    e efeito de parcela recem-vencida ainda nao paga (curva monotona por tempo
    desde vencimento).
12. **Proibido usar views pre-existentes do banco** - decisao do usuario;
    sempre reescrever como subqueries em cima de tabelas-base.
13. **Diferenciar PF x PJ por PESSOA.TP_PESSOA** (NUNCA por digitos do CGC).
14. **Backend crashando com ETIMEDOUT no pg-pool** - connectionTimeoutMillis=2s
    derrubava BoundPool sem handler. Ja corrigido (15s + listener).
15. **Inconsistencia VL_DIVIDA > 0 com VALOR_PAGO > 0** - existe em duplicidade;
    NAO assumir que `VALOR_PAGO > 0 AND VL_DIVIDA = 0` significa liquidado.

## 4. Como usar esta skill na pratica

1. Antes de QUALQUER query ao banco SCH: revisar encoding LATIN1 (regra #1).
2. Antes de QUALQUER funil/cobranca: revisar a maquina de estados (regra #2).
3. Para o detalhe de uma frente, ABRIR a sub-skill especifica pelo slug:
   - `dashboards-fiscalizai-banco-sch` - schema, integridade, decisoes estruturais.
   - `dashboards-fiscalizai-cobranca` - funil N1/N2/N3, DUAM, parcelamentos.
   - `dashboards-fiscalizai-cda-protesto` - CDA, protesto, demonstrativo.
4. Para snapshots/valores canonicos: ver memoria SNAPSHOT ESTRUTURAL DO BANCO
   SCH (na sub-skill banco-sch).
5. Para metodologias de Taxa de Recuperacao / Eficacia dos Canais / Inadimplencia
   por safra: ver sub-skill CDA/Protesto (Taxa) e cobranca (Inadimplencia).

## 5. Conexao com a skill `construtor-dashboards`

Esta mestra complementa a skill `construtor-dashboards` com CONHECIMENTO DE
DOMINIO do banco SCH. Para construir DASHBOARDS sobre estes dados, a IA deve:

1. Ativar `construtor-dashboards` para o fluxo MCP (list_connections,
   create_chart, add_chart_to_dashboard, publish_dashboard).
2. Ativar ESTA mestra + a sub-skill relevante para o DOMINIO especifico
   (cobranca, CDA/protesto, ou schema).
3. SEMPRE testar a query com `run_query` ANTES de criar o chart.
4. SEMPRE fazer `preview_chart_data` ANTES de `publish_chart`.

## 6. Indice das 45 memorias canonicas (jun/2026)

A mestra contem 0 memorias inline; TODAS estao expandidas nas 3 sub-skills.
Aqui o indice completo (por sub-skill):

### Em `dashboards-fiscalizai-banco-sch` (14 memorias)
- [01] [!] ARMADILHA CRÍTICA - `INSC_MUNICIPAL = 0` no join PESSOA <-> SIGFACIL_EMPRESA (jun/2026)- [09] RESUMO OPERACIONAL - conversa cmqh0fzu5009lof0i6lgwfh39 (jun/2026)- [12] ARMADILHA: "otimização de query de brinde" muda semântica e quebra dashboard em produção (jun/2026)- [14] Valores de referência VL_DIVIDA / VALOR_PAGO (snapshot do banco em 11/06/2026)- [17] DECISÃO DO USUÁRIO (jun/2026): régua oficial do banco = foto de 31/05/2026- [18] Estoque devedor - quadro fechado dos 4 estados (atualizado jun/2026, tabelas-base, SEM views do banco)- [26] REGRA DURA - Diferenciar PF × PJ pelo campo SCH.PESSOA.TP_PESSOA (NUNCA por dígitos do CGC)- [30] REGRA DURA - Proibido usar views pré-existentes do banco (decisão do usuário, jun/2026)- [36] Backend crashando com ETIMEDOUT no pg-pool (jun/2026)- [37] Cold cache do /api/analise-receita/:cd/kpis é LENTO - não confundir com bug do frontend- [39] ARMADILHA: `node --watch` pode resetar o working tree durante validação (jun/2026)- [42] [!] BUG CRÍTICO DE METODOLOGIA - DUAM.REC = TIPOAVIS.CD_TIPOAVI, NÃO CONTA_CONTABIL (jun/2026)- [43] VALIDAÇÃO OBRIGATÓRIA: contar alterações com `git diff`/`grep` após cada `apply_edit`- [44] SNAPSHOT ESTRUTURAL DO BANCO SCH (baseline - jun/2026)- [02] BUG CRÍTICO - Predicados do N3 do Funil estão incompletos (jun/2026)- [03] N3 do Funil - 2 métricas, 2 recortes (jun/2026)- [04] 2 achados de qualidade de dado em valores monetários (DUAM_IT.VL_DIVIDA / VALOR_PAGO) - jun/2026- [05] Ciclo de vida do crédito tributário - máquina de estados validada no banco (jun/2026)- [06] ERRO NUMÉRICO NO RELATÓRIO "Eficácia dos Canais" - Parcelamento 96,65% (jun/2026)- [15] VALOR_PAGO também é replicado em quitação antecipada - usar VALOR nominal (validado jun/2026)- [16] FÓRMULA CANÔNICA do índice de inadimplência por safra (ref. jun/2026)- [19] REGRAS DURAS - DUAM / DUAM_IT / "documento liquidado" (jun/2026)- [20] FLAG_PG_TOTAL=1 é flag de DOCUMENTO, NÃO garante parcelas quitadas na DUAM_IT (validado ao vivo jun/2026)- [21] [!] CORREÇÃO CRÍTICA: DUAM_IT.DATA_DIV_ATI NÃO é data de inscrição confiável (jun/2026)- [27] DUAM_IT: VALOR = principal original; VL_DIVIDA = VALOR A PAGAR (com encargos), SOMÁVEL. [!] corrige erro- [28] SALDO A RECEBER DE PARCELAMENTO = R$ 132,8 mi (VL_DIVIDA = valor a pagar). CORRIGE erro anterior- [29] SMCALCREPAC_ORIGEM - semântica das colunas e ARMADILHAS de query (validado ao vivo jun/2026)- [31] Inconsistência de dados: VL_DIVIDA > 0 com VALOR_PAGO > 0 (DUAM_IT)- [32] Regras de Negócio - SMCALCREPAC / DUAM_IT (parcelamentos)- [35] Inadimplência de parcelamentos é MATURAÇÃO, não calote - curva por tempo de vencimento (banco estático, ref. 10/06/2026)- [40] [!] ARMADILHA CRÍTICA - JOIN correto de LIVRO1.DUAM_IT (jun/2026)- [41] JOIN LIVRO1.DUAM_IT = DUAM_IT.DUAM (NÃO RECNUM) - armadilha crítica- [45] Padrões SQL para análise de parcelamentos (FiscalizaIA)- [07] INVENTÁRIO DE COLUNAS COMO CONTROLE DE PAGAMENTO EM ARQ1033 e LIVRO1 (jun/2026)- [08] REVISÃO METODOLÓGICA - Taxa de Recuperação do Protesto (jun/2026)- [10] Dashboard "Análise para Transação" agora é GENÉRICO por receita (rotas /api/analise-receita/:cd/*) - jun/2026- [11] Diferença semântica entre `com_cda` e `com_protesto` no dashboard "Análise para Transação"- [13] Auditoria CDAs com VL_CONVERTIDO=0 no LIVRO1 (jun/2026)- [22] DIRETRIZ DE FORMATO (jun/2026) - Demonstrativo de contribuinte (FiscalizaIA)- [23] CD 92327 (MULTA LOTEAMENTO) - 4 CCPs com status "Lançamento" (sem DA, sem CDA) e R$ 35 mi em aberto- [24] Dívida Ativa != CDA - distinção canônica corrigida a partir do DER 1 (jun/2026)- [25] ARMADILHA - `LIVRO1.PROC_FORUM` aceita 5+ formatos + string sentinela (jun/2026)- [33] STATUS/SITUAÇÃO: CDA de Dívida Ativa × Certidão de Protesto (jun/2026, validado ao vivo)- [34] ARMADILHA - "Certidão" tem 2 colunas-pivô diferentes (jun/2026)- [38] AUTO.VALOR_ORIGINAL = 100% zerado - caminho REAL do valor: AUTO -> DUAM -> LIVRO1 (jun/2026)
Para o conteudo de cada uma, abra a sub-skill correspondente (a IA pode ativar
ate 1 skill por turno, entao abra a que cobre a sua duvida atual).
