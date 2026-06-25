---
name: dashboards-fiscalizai-banco-sch
description: Sub-skill 1 do banco SCH (Palmas) - schema, integridade, decisoes estruturais, encoding LATIN1, PESSOA, SIGFACIL, INSC_MUNICIPAL=0, snapshots, baseline. 14 memorias canonicas (jun/2026). Ative quando o tema for estrutura do banco, joins, modelagem de dados ou decisoes metodologicas de snapshot.
---

# dashboards-fiscalizai-banco-sch

> Sub-skill especializada do banco SCH (Palmas) - FiscalizaIA.
> Ative esta skill quando o tema da conversa for banco/sch.
> Para o indice completo e o modelo conceitual, abra a mestra:
> `dashboards-fiscalizai-palmas`.
>
> Encoding do banco: **LATIN1**. Toda query abaixo usa ASCII/acentos
> pt-BR; NUNCA travessao, reticencias, seta, aspas curvas ou simbolos
> matematicos Unicode em literais SQL.

## Indice das 14 memorias desta sub-skill

### [01] [!] ARMADILHA CRÍTICA - `INSC_MUNICIPAL = 0` no join PESSOA <-> SIGFACIL_EMPRESA (jun/2026)

[!] ARMADILHA CRÍTICA - INSC_MUNICIPAL = 0 no join PESSOA <-> SIGFACIL_EMPRESA (jun/2026, descoberto ao vivo)
O caminho de integração PESSOA.INSCRICAO = SIGFACIL_EMPRESA.INSC_MUNICIPAL NÃO é seguro sem filtro adicional. Existe um "buraco" de 123.613 registros órfãos em SIGFACIL_EMPRESA com INSC_MUNICIPAL = 0, e a PESSOA tem CCPs com INSCRICAO = 0 (CCP 461 CONSTANTINO MAGNO CASTRO FILHO é 1 caso real, mas há outros).
O bug demonstrado
Query inocente (sem filtro):
SELECT p."CCP", p."NOME", e."NU_CNPJ", e."DS_NOME_EMPRESARIAL"
FROM "SCH"."PESSOA" p
LEFT JOIN "SCH"."SIGFACIL_EMPRESA" e ON e."INSC_MUNICIPAL" = p."INSCRICAO"
WHERE p."CCP" = 461  -- CONSTANTINO MAGNO CASTRO FILHOcopiar
-> Retornou 1.581 linhas, cada uma com um CNPJ diferente (TIM S.A., BANCO SANTANDER, VOTORANTIM CIMENTOS, ENERGISA, etc.). Isso porque CONSTANTINO tem INSCRICAO=0 na PESSOA, e a SIGFACIL_EMPRESA tem 123.613 empresas com INSC_MUNICIPAL=0. O join casa todas elas.
Por que isso acontece
123.613 empresas em SIGFACIL_EMPRESA têm INSC_MUNICIPAL = 0 (registros órfãos, sem vinculação municipal).
Vários CCPs em PESSOA têm INSCRICAO = 0 (não fizeram cadastro municipal formal, ou são cadastros incompletos).
Quando 0 = 0, o join casa TUDO.
REGRA DURA
SEMPRE usar o filtro AND p."INSCRICAO" > 0 (ou > 0 em ambos os lados) no join PESSOA <-> SIGFACIL_EMPRESA. NUNCA sem esse filtro.
-- CORRETO
FROM "SCH"."PESSOA" p
JOIN "SCH"."SIGFACIL_EMPRESA" e 
  ON e."INSC_MUNICIPAL" = p."INSCRICAO"
  AND p."INSCRICAO" > 0    -- filtro OBRIGATÓRIOcopiar
Caso validado ao vivo (jun/2026, CCP 123951 = CONSTRUTORA RIO JORDÃO LTDA)
Aplicando o filtro INSCRICAO > 0:
PESSOA.CCP=123951, TP_PESSOA='3'=PJ, INSCRICAO=210722
SIGFACIL_EMPRESA.NU_CNPJ=10.251.492/0001-41, DS_NOME_EMPRESARIAL='CONSTRUTORA RIO JORDÃO LTDA'
QSA: 4 sócios (EDUARDO PIRES BORGES E VIEIRA, MANUEL RIBEIRO DA COSTA, MANUEL RIBEIRO DA COSTA NETO, LETICIA CRISTINA SENA SOARES) com CPF, qualificação RFB (17, 22, 5), valor de participação e quotas
CNAE principal: 7111-1/00 (Serviços de arquitetura), 4120-4/00 (Construção de edifícios), 4399-1/03 (Obras de alvenaria) - bate com "Construtora"
Endereço: ARSO 31, nº 15, Lote 19-A, Sala 5-A, Edifício Copacabana, Plano Diretor Sul, CEP 77015400
Impacto na documentação
A memória cmq8r12... ("Mapeamento de Dados Cadastrais PF/PJ") está PARCIALMENTE ERRADA. O diagrama ER mostra PESSOA.INSCRICAO = SIGFACIL_EMPRESA.INSC_MUNICIPAL mas omite o filtro > 0. A documentação precisa ser corrigida (issue aberta).
Caso extra: 5 CCPs do CD 92327 com INSCRICAO > 0 mas SEM match na SIGFACIL_EMPRESA
ERCIONE DIVINO DOS SANTOS (CCP 23433) -> INSCRICAO=33782 -> 0 matches
VALDEMAR DA SILVA (CCP 23550) -> INSCRICAO=35009 -> 0 matches
JOSE MACHADO DOS SANTOS (CCP 24483) -> INSCRICAO=44911 -> 0 matches
SINDICATO RURAL DE PALMAS (CCP 24665) -> INSCRICAO=47031 -> 0 matches
RAIMUNDO MOURA DA SILVA FILHO (CCP 81490) -> INSCRICAO=98337 -> 0 matches
Esses CCPs têm cadastro municipal mas NÃO foram integrados à REDESIM (empresas sem CNPJ na base da RFB, ou cadastros pré-REDESIM). Para esses, não tem como cruzar com a RFB - ficam de fora da integração.
Diagnóstico
O banco SCH tem 3 subconjuntos de pessoas/empresas:
Casos completos (match 1:1): PESSOA com INSCRICAO > 0 + SIGFACIL_EMPRESA com INSC_MUNICIPAL = mesma INSCRICAO. -> Cross-check com RFB funciona.
PESSOA municipal sem REDESIM: PESSOA com INSCRICAO > 0 mas SIGFACIL_EMPRESA vazia para esse código. -> Não cruza com RFB.
PESSOA órfã (INSCRICAO=0): precisa de cadastro municipal; não tem CNPJ na base. -> Integração via CGC (bigint) + LPAD, SEM cruzar com SIGFACIL.
SIGFACIL_EMPRESA órfã (INSC_MUNICIPAL=0): 123.613 empresas importadas da REDESIM sem vinculação municipal (ou cadastros de não-PJ). -> Não cruza com PESSOA.
Queries canônicas corrigidas
Q1. PESSOA -> SIGFACIL_EMPRESA (com filtro):
SELECT p."CCP", p."NOME", p."TP_PESSOA", p."INSCRICAO",
       e."NU_CNPJ", e."DS_NOME_EMPRESARIAL", e."NU_CAPITAL_SOCIAL",
       e."CO_NATUREZA_JURIDICA", e."CO_SITUACAO_EMPRESA"
FROM "SCH"."PESSOA" p
JOIN "SCH"."SIGFACIL_EMPRESA" e 
  ON e."INSC_MUNICIPAL" = p."INSCRICAO" 
  AND p."INSCRICAO" > 0copiar
Q2. QSA da empresa (já validada):
SELECT s."DS_NOME" AS socio, s."NU_CPF_CNPJ" AS cpf_cnpj,
       q."CO_TIPO_QUALIFICACAO_RFB" AS qualif_rfb,
       q."DT_INICIO_QUALIFICACAO" AS dt_entrada,
       q."NU_VALOR_PARTICIPACAO" AS valor_participacao
FROM "SCH"."SIGFACIL_EMPRESA" e
JOIN "SCH"."SIGFACIL_SOCIO" s ON s."ID_CONSULTA" = e."ID_CONSULTA"
LEFT JOIN "SCH"."SIGFACIL_QUALIFICACOES" q ON q."ID_SOCIO" = s."ID"
WHERE e."NU_CNPJ" = :cnpjcopiar
Q3. CNAE principal:
SELECT DISTINCT a."CO_CNAE"
FROM "SCH"."SIGFACIL_EMPRESA" e
JOIN "SCH"."SIGFACIL_ATIVIDADE" a ON a."ID_CONSULTA" = e."ID_CONSULTA"
WHERE e."NU_CNPJ" = :cnpj AND a."IS_ATIVIDADE_PRINCIPAL" = truecopiar
Q4. Endereço fiscal:
SELECT en."DS_TIPO_LOGRADOURO", en."DS_ENDERECO", en."NU_NUMERO",
       en."DS_COMPLEMENTO", en."DS_BAIRRO", en."CO_CEP",
       c."DS_CIDADE", c."CD_UF", c."CD_IBGE"
FROM "SCH"."SIGFACIL_EMPRESA" e
JOIN "SCH"."SIGFACIL_ENDERECO" en ON en."ID_RESPONSAVEL_CONTABIL" = e."ID_CONSULTA"
LEFT JOIN "SCH"."CIDADE" c ON c."CD_CIDADE" = en."CO_MUNICIPIO"
WHERE e."NU_CNPJ" = :cnpj LIMIT 1copiar
Memória relacionada
cmq8r12... ("Mapeamento de Dados Cadastrais PF/PJ") - precisa de correção no diagrama ER
Esta memória é o "fix" dela.
O caminho PESSOA.INSCRICAO = SIGFACIL_EMPRESA.INSC_MUNICIPAL NÃO é seguro sem filtro.

O bug
Query inocente (sem filtro):

-- SQL
SELECT p."CCP", p."NOME", e."NU_CNPJ" FROM "SCH"."PESSOA" p LEFT JOIN "SCH"."SIGFACIL_EMPRESA" e ON e."INSC_MUNICIPAL" = p."INSCRICAO" WHERE p."CCP" = 461

copiar
-> Retornou 1.581 linhas! CONSTANTINO tem INSCRICAO=0, e SIGFACIL_EMPRESA tem 123.613 empresas com INSC_MUNICIPAL=0. Join casa todas.
REGRA DURA
SEMPRE usar filtro AND p."INSCRICAO" > 0 no join PESSOA <-> SIGFACIL_EMPRESA.
Caso validado (CCP 123951 = CONSTRUTORA RIO JORDÃO LTDA)
- INSC_MUNICIPAL=210722, NU_CNPJ=10.251.492/0001-41 - QSA: 4 sócios, capital R$ 240.000 - CNAE: 7111-1/00 (Serviços de arquitetura), 4120-4/00 (Construção de edifícios)

---

### [09] RESUMO OPERACIONAL - conversa cmqh0fzu5009lof0i6lgwfh39 (jun/2026)

Memória-índice rápida pra retomar o contexto de qualquer conversa futura sobre CDA/protesto/Dívida Ativa no FiscalizaIA. As memórias detalhadas são referenciadas por ID no final.
O que aprendemos NESTA conversa (em ordem)
Os 2 tipos de "certidão" no banco - LIVRO1.INSCRICAO (CDA de DA) vs ARQ1033.NR_CERTIDAO (certidão de protesto). Errei ao dizer que "20180015730" não existia porque busquei só em LIVRO1.INSCRICAO. Memória detalhada: cmqh3x4jp009tof0is6n55ukx.
O usuário estava certo em me questionar - registrei esse aprendizado e ajustei a memória de Demonstrativo (cmqcd1ikx001ppl0iyukx0fqx v2) com a regra "buscar nas 3 colunas antes de afirmar que não existe".
DER 1 do PDF NÃO documenta SITUACAO da LIVRO1 - a coluna SITUACAO (18 valores distintos) é evolução do schema pós-PDF, sem FK/CHECK/domínio/comentário. Mnemônicos como "Q", "A", "T" são convenções herdadas.
O status da CDA nas telas é derivado de colunas-pivô distribuídas em 3 tabelas (LIVRO1 + ARQ1033 + SMCALCREPAC), não de um único campo SITUACAO. Tabela detalhada no quadro que atualizei.
O SQL gerado para o Demonstrativo do CCP 461 está em docs/demonstrativo_461.sql (5+1 seções, 215 linhas, testado e validado).
Status completo do 2 universos (jun/2026) - pesquisa detalhada sobre os 18 valores de LIVRO1.SITUACAO e os 3 estados de ARQ1033.IS_CERTIDAO_CANCELADA. Significado da coluna DATA_AGM (Ato da Gestão Municipal) e da tabela auxiliar ARQ814. Por que DATA_RECEBIDO está morta (0% preenchido). Memória dedicada: cmqh5p2bz009zof0iiw4prdub.
Caso canônico: SINDICATO RURAL DE PALMAS (CCP 24665)
CDA de DA: 0001/20241510119432490 (LIVRO1.INSCRICAO) - R$ 32,9 mi, inscrita 20/02/2026, não protestada, não executada judicialmente
12 certidões de protesto (ARQ1033.NR_CERTIDAO) - 7 de 2018 + 4 de 2019 + 1 de 2026, todas ativas
CNPJ 10.624.780/0010-9 (filial 010)
1 das 10 PJs do CD 92327 (lembrar do sumário executivo)
Caso canônico: CONSTANTINO MAGNO CASTRO FILHO (CCP 461)
1 DUAM do 92327 (R$ 10,9 mi) SEM CDA ativa do 92327 (é 1 dos 4 "Lançamentos sem CDA do 92327" - ver cmqf420w8039qpl0ipwsab1q3)
Tem 88 CDAs (LIVRO1) de outros CDs (CD 1, 4, 5, 201, 1681) - 1 parcela cada
13 certidões de protesto (ARQ1033), 12 ativas + 1 cancelada em 20/02/2026
2 autos de infração (27838 e 23940) com VALOR_ORIGINAL zerado (legado SIG Prodata)
Memórias referenciadas (por ID, em ordem de relevância)
| ID | Tópico | Quando consultar | |---|---|---| | cmqh5p2bz009zof0iiw4prdub | STATUS/SITUAÇÃO: CDA de DA × Certidão de Protesto (tabela decodificada dos 18 mnemônicos, AGM, DATA_RECEBIDO morta) | Quando perguntarem "está cancelada?" / "foi protestada?" / "qual a diferença D vs 02?" | | cmqh3x4jp009tof0is6n55ukx | ARMADILHA: 2 tipos de "certidão" - busca universal | Quando o usuário perguntar "de quem é a CDA X" | | cmqcd1ikx001ppl0iyukx0fqx (v2) | DIRETRIZ de Demonstrativo + schema LIVRO1 + ARQ1033 | Para montar qualquer demonstrativo | | cmqe2dgrh023epl0ia197t9yk | Dashboard "Análise para Transação" genérico por receita | Visão geral do backend /api/analise-receita/:cd/* | | cmqf2pxu40390pl0itwqcxn42 | Diferença semântica com_cda vs com_protesto | Quando houver dúvida sobre escopo de CDA/protesto | | cmqbl4frb000vpl0iu1lsphvk | [!] DUAM.REC = TIPOAVIS.CD_TIPOAVI (não CONTA_CONTABIL) | Para mapear receita <-> DUAM | | cmqcskvl100m0pl0i2noy3uta | CD 92327: 46 CCPs / 48 DUAMs / R$ 570 mi | Quando o contexto for MULTA LOTEAMENTO | | cmqf420w8039qpl0ipwsab1q3 | 4 CCPs do 92327 sem CDA do 92327 (incl. CONSTANTINO 461) | Quando ouvir "CCP sem CDA do CD" | | cmq7f1sdu01jxl70i2lrtpdxh | 3 estados de um crédito (Lançamento/DA/Parcelado) | Para classificar status 1-2-3 | | cmq7gj13k01k3l70i3vzrgtou | SMCALCREPAC_ORIGEM - armadilhas | Para queries de parcelamento | | cmqe7zxxr02eopl0ictjeiww1 | Auditoria CDAs com VL_CONVERTIDO=0 (modelo tributário antigo) | Para explicar CDAs com valor zerado | | cmqb9dnxg00q2q50i7xf76632 | TIPOAVIS - mapa TAB_RECEITA -> módulo | Para classificar receita por módulo |
Comandos SQL úteis (rodar via PGPASSWORD='Q(8A{2zo66Gc' psql -h 177.126.90.21 -p 38432 -U FiscalizaIA -d sch)
-- Busca universal de CDA / certidão (REGRA DE OURO - usar ANTES de afirmar que não existe)
WITH chaves AS (
  SELECT 'LIVRO1.INSCRICAO (CDA DA)' AS origem, "INSCRICAO"::text AS valor, "CCP"
  FROM "SCH"."LIVRO1" WHERE trim("INSCRICAO") <> ''
  UNION ALL
  SELECT 'ARQ1033.NR_CERTIDAO (Protesto)', "NR_CERTIDAO"::text, "CCP"
  FROM "SCH"."ARQ1033" WHERE trim("NR_CERTIDAO") <> ''
  UNION ALL
  SELECT 'LIVRO1.CEDAM (CDA antiga)', "CEDAM"::text, "CCP"
  FROM "SCH"."LIVRO1" WHERE trim("CEDAM") <> ''
)
SELECT origem, count(*), count(DISTINCT ccp) AS ccp_unicos
FROM chaves
WHERE valor = '<NÚMERO>' OR valor LIKE '%<NÚMERO>%'
GROUP BY origem ORDER BY count(*) DESC;

-- Verificar se um CCP tem CDA em um CD específico
SELECT count(DISTINCT l."INSCRICAO") AS cdas
FROM "SCH"."LIVRO1" l
JOIN "SCH"."DUAM" d ON d."DUAM" = l."DUAM_IT"
WHERE d."CCP" = :ccp AND d."REC" = :cd AND d."FLAG_PG_TOTAL" = '0';

-- Listar certidões de protesto de um CCP
SELECT "NR_CERTIDAO", "DT_CERTIDAO", "IS_CERTIDAO_CANCELADA", "DATA_ENVIO_SPC"
FROM "SCH"."ARQ1033"
WHERE "CCP" = :ccp
ORDER BY "DT_CERTIDAO" DESC;copiar
Frontend (URLs e DER)
Página do Demonstrativo: https://poc-fe-cmpbfl2z.cloud.serendiped.com/analise-transacao?cd=92327&ccp=
DER 1 reconstruído (com os nomes reais do banco): frontend/src/components/DerDiagramas.jsx (linhas 175-265)
Comparação PDF vs Banco: https://poc-fe-cmpbfl2z.cloud.serendiped.com/comparacao-pdf-banco
Backend: https://poc-be-cmpbfl2z.cloud.serendiped.com/api/analise-receita/:cd/contribuinte/:ccp/demonstrativo
Arquivos úteis no workspace
docs/demonstrativo_461.sql - SQL único que reproduz as 5+1 seções do Demonstrativo (testado no psql)
docs/demonstrativo_461.json - saída JSON do backend para o CCP 461 (gerado em 15/06/2026)
frontend/src/pages/AnaliseTransacao.jsx - página principal do Demonstrativo
frontend/src/components/DerDiagramas.jsx - DER reconstruído
Lições de processo (regras de ouro consolidadas)
NUNCA afirmar "não existe" sem buscar nas 3 colunas (LIVRO1.INSCRICAO, ARQ1033.NR_CERTIDAO, LIVRO1.CEDAM).
SEMPRE rotular explicitamente "CDA de DA" vs "Certidão de Protesto" quando o usuário falar de "CDA" - são coisas diferentes.
Quando o usuário me corrigir, IR DIRETO no banco validar antes de defender a posição original. Eu estava defendendo que "20180015730 não existe" e era só porque busquei no lugar errado.
Memórias de longo prazo são VIVAS - quando aprender algo novo, atualizar a memória relevante em vez de só criar uma nova. A v2 de cmqcd1ikx001ppl0iyukx0fqx reflete esse novo aprendizado.
Para "status" de CDA, NUNCA confiar em uma única coluna - combinar 5 pivôs: LIVRO1.SITUACAO + DATA_AJUIZAMENT + DATA_AGM + ARQ1033.NR_CERTIDAO + DUAM.FLAG_PG_TOTAL. Memória: cmqh5p2bz009zof0iiw4prdub.
SQLs com aspas duplas - Postgres é case-sensitive. Aliases como ident precisam virar ident."NOME" (ou usar identificadores sem aspas que viram lowercase). CTEs de origem com nome em comum (CCP, NOME etc.) colidem entre si.
> Memória-índice rápida pra retomar o contexto de qualquer conversa futura sobre CDA/protesto/Dívida Ativa.

O que aprendemos NESTA conversa
1. Os 2 tipos de "certidão" - LIVRO1.INSCRICAO (CDA de DA) vs ARQ1033.NR_CERTIDAO (certidão de protesto) 2. O usuário estava certo em me questionar - registrei esse aprendizado 3. DER 1 do PDF NÃO documenta SITUACAO da LIVRO1 - a coluna é evolução do schema pós-PDF 4. O status da CDA nas telas é derivado de colunas-pivô distribuídas em 3 tabelas 5. O SQL gerado para o Demonstrativo do CCP 461 está em docs/demonstrativo_461.sql 6. Status completo do 2 universos - pesquisa detalhada sobre os 18 valores de LIVRO1.SITUACAO

Caso canônico: SINDICATO RURAL DE PALMAS (CCP 24665)
- CDA de DA: 0001/20241510119432490 (LIVRO1.INSCRICAO) - R$ 32,9 mi - 12 certidões de protesto (ARQ1033.NR_CERTIDAO) - todas ativas - CNPJ 10.624.780/0010-9 (filial 010) - 1 das 10 PJs do CD 92327

Caso canônico: CONSTANTINO MAGNO CASTRO FILHO (CCP 461)
- 1 DUAM do 92327 (R$ 10,9 mi) SEM CDA ativa do 92327 - 88 CDAs de outros CDs (1, 4, 5, 201, 1681) - 13 certidões de protesto (12 ativas + 1 cancelada) - 2 autos de infração com VALOR_ORIGINAL zerado (legado SIG Prodata)

Dashboard "Análise para Transação" agora é GENÉRICO por receita (rotas /api/analise-receita/:cd/*) - jun/2026 cmqe2dgrh023epl0ia197t9yk

---

### [12] ARMADILHA: "otimização de query de brinde" muda semântica e quebra dashboard em produção (jun/2026)

O caso (task cmqed2spr02j4pl0i2olzecpy, commit 1f9d32f)
O executor corrigia 4 issues do /simular (Transação por Adesão). No MESMO commit, "de brinde", reescreveu 3 queries de _computeAnaliseReceitaKpis (protesto, padrao, criticos - rotas /api/analise-receita/:cd/*) para CTEs pré-agregadas, visando performance (issue cmqeabxim aberta sobre timeout do protesto). Resultado: mudou a semântica e zerou o bloco "Devedores Críticos" do dashboard de produção CD 92327 (7 devedores -> 0). O commit message NÃO mencionava essa mudança.
A regressão exata
criticos: a versão antiga contava count(DISTINCT l.INSCRICAO) FROM LIVRO1 l WHERE l.CCP=c.CCP SEM filtro de receita = "CDAs históricas de TODAS as receitas do CCP" (reincidência fiscal crônica). A nova livro_agg adicionou JOIN DUAM d ON d.DUAM=l.DUAM_IT WHERE d.REC=$1 AND d.FLAG_PGTO='0' = "CDAs só desta receita". Como ninguém tem >50 CDAs DENTRO de uma única receita, o filtro WHERE cdas > 50 passou a retornar 0. CD 92327: 7->0 (Osvaldo 143, Construtora Rio Jordão 118, etc., todos sumiram). CD 267: 349->0.
Lições (REGRAS DURAS)
Otimização de query NUNCA pode mudar o resultado. Antes de aceitar qualquer reescrita de query "por performance", exigir cross-check OLD=NEW célula a célula em múltiplos inputs. Se diverge em QUALQUER célula, não é otimização - é mudança de comportamento.
Scope creep em commit de fix é red flag. Se o commit deveria corrigir issues A/B/C/D e o git show --stat/diff mostra mudanças em funções não relacionadas, validar essas mudanças extras com o mesmo rigor - elas não passaram por revisão de plano.
Reviewer: sempre rodar git show completo, não confiar no --stat nem no commit message. O --stat mostrou só "server.js 1 file changed" - parecia inofensivo. O diff revelou a reescrita das 3 queries.
Conceito de "devedor crítico" em _computeAnaliseReceitaKpis = CDAs históricas de TODAS as receitas (LIVRO1.CCP sem filtro REC), >50. NÃO filtrar por receita no count de INSCRICAO. Já documentado em memórias anteriores, mas foi violado.
Curiosamente o executor JÁ tinha rodado os cross-checks (processos xcheck-padrao/xcheck-criticos) que mostravam a divergência (CD 267 criticos 349->0), mas commitou mesmo assim. Cross-check só serve se o resultado for LIDO e a divergência bloquear o merge.
O caso (task cmqed2spr02j4pl0i2olzecpy, commit 1f9d32f)
O executor corrigia 4 issues do /simular. No MESMO commit, "de brinde", reescreveu 3 queries de _computeAnaliseReceitaKpis (protesto, padrao, criticos) para CTEs pré-agregadas. Resultado: mudou a semântica e zerou o bloco "Devedores Críticos" do dashboard (7 devedores -> 0).

A regressão exata
1. criticos: a versão antiga contava CDAs SEM filtro de receita = "CDAs históricas de TODAS as receitas do CCP" (reincidência fiscal crônica). A nova filtrou por receita. CD 92327: 7->0. 2. padrao divergiu em CD 43 e 267.

Lições (REGRAS DURAS)
1. Otimização de query NUNCA pode mudar o resultado. Cross-check OLD=NEW célula a célula. 2. Scope creep em commit de fix é red flag. 3. Reviewer: sempre rodar git show completo, não confiar no --stat. 4. "Devedor crítico" = CDAs históricas de TODAS as receitas (LIVRO1.CCP sem filtro REC), >50.

Auditoria CDAs com VL_CONVERTIDO=0 no LIVRO1 (jun/2026) cmqe7zxxr02eopl0ictjeiww1

---

### [14] Valores de referência VL_DIVIDA / VALOR_PAGO (snapshot do banco em 11/06/2026)

[!] Baseline novo, atualizado pós-correção de projeção. Os valores divergem marginalmente do snapshot anterior (ref. 10/06/2026) porque parcelas foram registradas como pagas no intervalo entre os dois snapshots. O novo baseline reflete o estado atual.
Totais (vigentes, PARCELA>0)
valor_recebido (sum VALOR_PAGO WHERE DATA_PGTO IS NOT NULL): R$ 232.485.367,06 (sem mudança)
saldo_real_a_receber (sum VL_DIVIDA WHERE DATA_PGTO IS NULL): R$ 132.826.489,31 (antes: 132.826.479,58 - subiu R$ 9,73 por 1+ pagamento registrado entre os snapshots)
total_parcelado (somado): R$ 365.311.856,37 (antes: 365.311.846,64)
O recebido ficou EXATAMENTE igual porque a parcela que virou paga teve o VL_DIVIDA zerado E o VALOR_PAGO incrementado, mantendo o total - coerente.
Resumo mensal jun-dez/2026 (sum VL_DIVIDA, DATA_PGTO IS NULL)
Total nominal: R$ 25.039.382,78 (antes: 25.039.373,05 - subiu R$ 9,73)
Esperado (×0,667): R$ 16.701.268,31 (antes: 16.701.261,82)
Perda (×0,333): R$ 8.338.114,47 (antes: 8.338.111,23)
Antecipadas (sum VALOR_PAGO, DATA_PGTO IS NOT NULL): R$ 716.853,86 (sem mudança)
Por mês:
2026-06: nominal R$ 4.092.796,25
2026-07: nominal R$ 4.060.236,81
2026-08: nominal R$ 3.797.427,72
2026-09: nominal R$ 3.572.350,78
2026-10: nominal R$ 3.378.323,76
2026-11: nominal R$ 3.182.644,29
2026-12: nominal R$ 2.955.593,44
Top 10 pagadores / Top 10 inadimplentes (1ª linha, sem mudança)
Top pagadores 1ª: B&G (100% taxa, 12/12 pagas), saldo_total=R$ 17.966.923,80, aberto_fut=R$ 911.365,70, provavel=R$ 911.365,70
Top inadimplentes 1ª: Joselita Miranda de Sousa (11,1% taxa, 1/9 pagas), saldo_total=R$ 393.444,63, aberto_fut=R$ 46.373,95, risco=R$ 41.221,29
Decisão (jun/2026): use sum(VL_DIVIDA) e sum(VALOR_PAGO) na aba Projeção
Pagas -> sum(VALOR_PAGO) (valor efetivamente pago pelo contribuinte)
Em aberto -> sum(VL_DIVIDA) (valor a pagar = VALOR + JUROS + MULTA + ATUALIZACAO - DESCONTO)
NÃO somar VALOR (principal) - subestima em ~60%
NÃO confundir VALOR_PAGO com VALOR: VALOR_PAGO pode ser > VALOR (encargos) e é replicado em quitação antecipada - mas para "valor recebido total" e "valor antecipado", usar VALOR_PAGO (não o VALOR nominal)
Totais (vigentes, PARCELA>0)
- valor_recebido: R$ 232.485.367,06 - saldo_real_a_receber: R$ 132.826.489,31 - total_parcelado: R$ 365.311.856,37

Resumo mensal jun-dez/2026
- Total nominal: R$ 25.039.382,78 - Esperado (×0,667): R$ 16.701.268,31 - Perda (×0,333): R$ 8.338.114,47 - Antecipadas: R$ 716.853,86

Decisão (jun/2026)
- Pagas -> sum(VALOR_PAGO) (valor efetivamente pago) - Em aberto -> sum(VL_DIVIDA) (valor a pagar = VALOR + JUROS + MULTA + ATUALIZACAO - DESCONTO) - NÃO somar VALOR (principal) - subestima em ~60%

VALOR_PAGO também é replicado em quitação antecipada - usar VALOR nominal (validado jun/2026) cmq9bdbes0096q50iptphl3sv

---

### [17] DECISÃO DO USUÁRIO (jun/2026): régua oficial do banco = foto de 31/05/2026

O usuário CONFIRMOU e DECIDIU: o banco SCH é uma FOTO do dia 31/05/2026. Toda métrica de inadimplência/vencimento deve usar DATA_REF = 2026-05-31 como "hoje", NUNCA CURRENT_DATE (servidor = 2026-06-10, ~10 dias adiantado e errado).
Evidências que fecharam a decisão
Última parcela de parcelamento paga: 31/05/2026. ZERO pagamentos em junho/2026.
Volume de pagamentos normal até 28/05 (qui), cai 29/05 (sex=69), ~1/dia no fim de semana (30-31/05). Dump tirado ~28-31/05.
Inadimplência diária de maio sobe pro fim do mês (30/05=79%, 31/05=82%) porque venceram véspera do corte - confirma a régua.
Índice de inadimplência de 2026 RECALCULADO com régua 31/05/2026 (parcelamentos vigentes, PARCELA>0, parcela vencida não paga / vencida)
Régua errada (CURRENT_DATE 10/06): 38,0%
Régua correta (31/05/2026): 33,3% (vencidas 24.952 / não pagas 8.315)
Decisão sobre interpretação
O usuário está convencido de que a inadimplência de 2026 está ALTA MESMO, destoando dos outros anos (que ficam <1,1%). Ou seja: aceitar 2026 ~= 33% como o índice da safra (não "descontar" tudo como maturação). Manter o efeito de maturação como CONTEXTO explicativo, mas o número oficial de 2026 = 33,3% (régua 31/05). Aplicar essa régua no backend/dashboard.
O usuário CONFIRMOU e DECIDIU: o banco SCH é uma FOTO do dia 31/05/2026. Toda métrica de inadimplência/vencimento deve usar DATA_REF = 2026-05-31 como "hoje", NUNCA CURRENT_DATE (servidor = 2026-06-10, ~10 dias adiantado e errado).

Evidências que fecharam a decisão
- Última parcela de parcelamento paga: 31/05/2026. ZERO pagamentos em junho/2026. - Volume de pagamentos normal até 28/05 (qui), cai 29/05 (sex=69), ~1/dia no fim de semana (30-31/05). Dump tirado ~28-31/05. - Inadimplência diária de maio sobe pro fim do mês (30/05=79%, 31/05=82%) porque venceram véspera do corte

Índice de inadimplência de 2026 RECALCULADO
- Régua errada (CURRENT_DATE 10/06): 38,0% - Régua correta (31/05/2026): 33,3% (vencidas 24.952 / não pagas 8.315)

DATA DE REFERÊNCIA do snapshot != CURRENT_DATE - corrigir no backend (CRÍTICO, descoberto jun/2026) cmq8s4grs001fq50idet6ol1f
memória [REVER] SUPERADA

O banco SCH é um BACKUP ESTÁTICO (foto). A data dos DADOS != data do SERVIDOR.
Data real da foto: ~28-31/05/2026
max(DATA_PGTO) nas parcelas de parcelamentos vigentes = 2026-05-31.
Distribuição de pagamentos/dia: volume normal até 28/05 (sex 29/05 já cai a 63; sáb 30 e dom 31 = 1/dia). Dump tirado ~28-31/05/2026.
CURRENT_DATE do servidor = 2026-06-10 -> está ~12 dias ADIANTADO em relação aos dados.
[!] max(DATA_PGTO) geral na DUAM_IT inteira retorna LIXO ('2204-03-16' - data digitada errada). Para achar a data da foto, filtrar DATA_PGTO <= CURRENT_DATE ou usar só parcelamentos vigentes.
Impacto - toda métrica de inadimplência do dashboard está inflada
O backend (backend/src/server.js) usa it."DATA_VENC" < CURRENT_DATE nas rotas de parcelamentos (kpis, faixas-atraso, etc.). Como CURRENT_DATE (10/06) > data da foto (31/05), parcelas que "venceram" entre 31/05 e 10/06 são contadas como vencidas/inadimplentes, mas seus pagamentos nunca puderam ser capturados -> inadimplência superestimada.
Exemplo: inadimplência safra 2026 com CURRENT_DATE(10/06) = 38,0%; com data-foto(31/05) = 33,3%.
CORREÇÃO recomendada
Definir uma DATA_REF = data da foto, calculada dinamicamente, e usar no lugar de CURRENT_DATE em TODAS as queries de inadimplência/vencimento:
-- data de referência confiável do snapshot
SELECT max(it."DATA_PGTO")
FROM "SCH"."SMCALCREPAC" r JOIN "SCH"."DUAM_IT" it ON it."DUAM"=r."DUAM"
WHERE r."REGISTRADA_S_N"='S' AND r."DATA_ESTORNO" IS NULL
  AND (r."CANCELADO" IS NULL OR r."CANCELADO"=false) AND it."PARCELA">0
  AND it."DATA_PGTO" <= CURRENT_DATE;   -- filtra lixo de data futura
-- => 2026-05-31copiar
Assim, se o cliente atualizar o banco, a régua se reajusta sozinha. NUNCA usar CURRENT_DATE cru em banco de backup.
Nota: maturação continua válida
Mesmo com a data corrigida, a safra 2026 ainda aparece alta (~33%) porque é safra VERDE (maturação). Inadimplência DEFINITIVA (safras +12m) permanece ~1,2%. As duas coisas se somam: parte do "38%" era régua adiantada (~5 p.p.) e o grosso é maturação.
O banco SCH é um BACKUP ESTÁTICO (foto). A data dos DADOS != data do SERVIDOR.

Data real da foto: ~28-31/05/2026
- max(DATA_PGTO) nas parcelas de parcelamentos vigentes = 2026-05-31 - CURRENT_DATE do servidor = 2026-06-10 -> está ~12 dias ADIANTADO

Impacto - toda métrica de inadimplência do dashboard está inflada
O backend (backend/src/server.js) usa it."DATA_VENC" < CURRENT_DATE. Como CURRENT_DATE > data da foto, parcelas que "venceram" entre 31/05 e 10/06 são contadas como vencidas/inadimplentes, mas seus pagamentos nunca puderam ser capturados. - Exemplo: inadimplência safra 2026 com CURRENT_DATE(10/06) = 38,0%; com data-foto(31/05) = 33,3%.

CORREÇÃO recomendada
Definir uma DATA_REF = data da foto, calculada dinamicamente, e usar no lugar de CURRENT_DATE.

TIPOAVIS - mapa TAB_RECEITA -> módulo tributário (validado empiricamente jun/2026) cmqb9dnxg00q2q50i7xf76632
memória [REVISADA] CONTRADIZ

Complemento da memória anterior (cmqb5v4ob...). Esta foi validada via 5 fases de queries e contém o mapa oficial extraído empiricamente que conecta TAB_RECEITA ao módulo tributário, mais as armadilhas do AVISO em DUAM_IT.
MAPA OFICIAL TAB_RECEITA -> MÓDULO (extraído via DS_TIPOAVI de cada TAB, jun/2026)
| TAB | Módulo | # TIPOAVIS | Exemplo | DS_TIPOAVI típico | |---|---|---:|---|---| | 0 | (sem classificação - recebe consignações/orçamentário) | 4.236 | - | Muitos têm TAB=0 mas com keywords de banco, COSIP, IPTU etc. | | 1 | IPTU (imposto predial) | 14 | CD 1 | "IPTU - IMPOSTO SOBRE A PROPRIEDADE PREDIAL E TERRITORIAL URBANA" | | 2 | IPTU_TAXAS (serviços urbanos: coleta lixo, limpeza, conservação) | 50 | CD 2 | "TX SERV URBANOS" / "TX SERV COLETA LIXO" / "TX SERV LIMPEZA PUBLICA" | | 3 | ISS (imposto sobre serviços) | 41 | CD 10 | "ISS - IMPOSTO SOBRE SERVIÇOS" / "ISS AUTONOMO" / "ISS RETIDO" | | 4 | ALVARÁ_FUNCIONAMENTO (taxa licença funcionamento, publicidade, horário) | 200 | CD 9 | "TX LIC FUNCIONAMENTO" / "TX LIC PUBLICIDADE" / "TAXA DE LICENÇA PARA EXECUÇÃO DE OBRAS" | | 5 | CONTRIBUIÇÃO DE MELHORIA | 3 | CD 8 | "CONTRIBUICAO MELHORIA" / "CONTRIBUIÇÃO DE MELHORIA ARSE 41" | | 6 | ITBI (imposto transmissão imóveis) | 9 | CD 14 | "ITBI - IMP TRANSMISSAO BENS IMOVEIS" / "ITBI - NOTIFICAÇÃO DE LANÇAMENTO" | | 7 | ITBI_RURAL | 1 | CD X | "ITBI RURAL" | | 8 | IPTU_DIVIDA_ATIVA | 5 | CD 109 | "IPTU DIV ATIVA - P JURÍDICA" / "IPTU-DIVIDA ATIVA- NORMAL" | | 9 | ISS_DIVIDA_ATIVA | 20 | CD 108 | "ISS DIV ATIVA DIF" / "ALVARA JUD - ISS ESTIMATIVO" | | 10 | TAXAS_DIVIDA_ATIVA | 2 | CD 164 | "RECEITA DIVIDA ATIVA - TAXAS" | | 11 | CONTR_MELHORIA_DA | 1 | CD 11 | "CONTRIBUIÇÃO DE MELHORIA - DÍVIDA ATIVA" | | 12 | TAXAS_DIVERSAS (expediente, certidões, inumação, autenticação) | 88 | CD 22 | "TX EXPEDIENTE" / "TX CERTIDAO QUITACAO MUNICIPAL" / "TX INUMACAO/REINUMACAO" | | 14 | MULTAS (TX MULTA, MULTA FORMAL, MUL-ISS, MUL-IPTU) | 43 | CD 32 | "TX MULTA" / "MULTA FORMAL" / "MULTA FORMAL GUIA NEGATIVA" / "MULTAS ISSQN" | | 15 | COSIP (iluminação pública) + MULTAS/JUROS MORA | 6 | CD 6 | "TX SERV ILUMINACAO PUBLICA" / "COSIP - CONTRIB SERV ILUM PUBLICA" | | 16 | RECEITA_DIVIDA_ATIVA (genérico) | 3 | CD 7 | "RECEITA DE DIVIDA ATIVA" | | 19 | ALVARÁ_CONSTRUÇÃO | 1 | CD 31 | "TX ALVARA DE CONSTRUCAO" | | 21 | ISS_ACAO_FISCAL (parc/denunciado) | 2 | CD X | "ISS ACAO FISCAL PARC DENUNCIADO" | | 23 | CONSIGNAÇÕES (1% sobre consignações FOPAG) | 1 | CD X | "RECEITA DE 1% SOBRE AS CONSIGNACOES FOPAG" | | 99 | RECEITAS_DIVERSAS (outros tributos: IPVA, IRRF, IVVC, TX AMBULANTE, S.M.T., etc.) | 157 | CD 12 | "RECEITAS DIVERSAS" / "PARTE DA QUOTA DO IPVA" / "IRRF - IMP DE RENDA RETIDO NA FONTE" / "IMP. VENDA VAREJO COMBUSTIVEL" / "TAXA DE AMBULANTE" |
[!] NÃO existe campo MODULO/SISTEMA/ORIGEM em TIPOAVIS. O TAB_RECEITA é o "módulo" indireto mais confiável. O GESTAO agrupa por origem orçamentária (fontes de recurso), não por módulo tributário. GESTAO=0 (4.853) = gestão padrão (Tesouro); GESTAO != 0 (30) = gestões específicas (FUNDEB, RPPS, Convênios).
COBERTURA COMPLETA POR MÓDULO (prova empírica, jun/2026)
O cadastro TIPOAVIS (4.883 linhas) cobre, com movimento real em DUAM_IT: | Módulo | # TIPOAVIS | # Parcelas com AVISO preenchido | Exemplo concreto DUAM (2015-2020) | |---|---:|---:|---| | ALVARA_FUNCIONAMENTO | 200 | 184 | TX LIC FUNCIONAMENTO (CD 9), TX LIC PUBLICIDADE (CD 13), TAXA DE LICENÇA PARA EXECUÇÃO DE OBRAS (CD 23), TX LIC HORARIO ESPECIAL (CD 24) | | RECEITAS_DIVERSAS | 157 | 1.178 | TX CERTIDAO QUITACAO MUNICIPAL (CD 37), PARTE DA QUOTA DO IPVA (CD 30), TAXA DE AMBULANTE (CD 20), IRRF (CD 49) | | TAXAS_DIVERSAS | 88 | 114 | TX EXPEDIENTE (CD 22), TX INUMACAO/REINUMACAO (CD 40), TX RECOMPOSICAO ASFALTO (CD 57) | | IPTU_TAXAS (serviços) | 50 | 56 | TX SERV URBANOS (CD 2), TX SERV COLETA LIXO (CD 3), TX SERV LIMPEZA PUBLICA (CD 4) | | MULTAS | 43 | 66 | TX MULTA (CD 32), MULTA FORMAL (CD 43), MULTA FORMAL GUIA NEGATIVA (CD 59), MULTAS ISSQN (CD 92) | | ISS | 41 | 71 | ISS (CD 10), ISS ACAO FISCAL (CD 15), ISS ESTIMATIVO (CD 16), ISS RETIDO NA FONTE (CD 17), ISS AUTONOMO (CD 25) | | ISS_DIVIDA_ATIVA | 20 | 89 | ISS DIV ATIVA DIF (CD 108), RECEITA DIVIDA ATIVA - ISS (CD 165), ALVARA JUD - ISS (CD 91787-91909) | | IPTU | 14 | 35 | IPTU (CD 1), IPTU PARC (CD 35), IPTU DIFERENÇA (CD 63), IPTU - NOTIFICAÇÃO DE LANÇAMENTO (CD 91728) | | ITBI | 9 | 219 | ITBI (CD 14), ITBI ACAO FISCAL (CD 106), ITBI PARCELADO (CD 157), ITBI - NOTIFICAÇÃO DE LANÇAMENTO (CD 90508) | | COSIP (Iluminação Pública) | 6 | 15 | TX SERV ILUMINACAO PUBLICA (CD 6), COSIP (CD 201), COSIP - CONTRIBUIÇÃO PARA CUSTEIO DA ILUMINAÇÃO PÚBLICA - PRINCIPAL - CELTINS (CD 212) | | IPTU_DIVIDA_ATIVA | 5 | 7 | IPTU DIV ATIVA - P JURÍDICA (CD 109), IPTU-DIVIDA ATIVA- NORMAL (CD 122), RECEITA DIVIDA ATIVA - IPTU (CD 166) | | RECEITA_DIVIDA_ATIVA | 3 | 5 | RECEITA DE DIVIDA ATIVA (CD 7) | | CONTRIBUIÇÃO DE MELHORIA | 3 | 4 | CONTRIBUICAO MELHORIA (CD 8), CONTRIBUIÇÃO DE MELHORIA ARSE 41 (CD 172) | | TAXAS_DIVIDA_ATIVA | 2 | 0 | RECEITA DIVIDA ATIVA - TAXAS (CD 164) | | ISS_ACAO_FISCAL | 2 | 7 | ISS ACAO FISCAL PARC DENUNCIADO | | ALVARÁ_CONSTRUÇÃO | 1 | 2 | TX ALVARA DE CONSTRUCAO (CD 31) | | CONSIGNACOES (FOPAG) | 1 | 0 | RECEITA DE 1% SOBRE AS CONSIGNACOES FOPAG (CD 23) | | ITBI_RURAL | 1 | 0 | ITBI RURAL | | CONTR_MELHORIA_DA | 1 | 0 | CONTRIBUIÇÃO DE MELHORIA - DÍVIDA ATIVA | | TAB=0 (consignações/orçamentário) | 4.236 | 20.089 | INSS CPF, IRRF, BANCO BRADESCO, BANCO ITAÚ, RECEITAS DIVERSAS, FOPAG |
[!] ACHADO CRÍTICO - AVISO em DUAM_IT é raramente preenchido (jun/2026)
Distribuição de DUAM_IT.AVISO por ano de vencimento (validado):
2010-2013: ~300k parcelas/ano com AVISO > 0, mas a esmagadora maioria com AVISO > 93.089 (fora do cadastro TIPOAVIS)
2014-2020: 400k-700k parcelas/ano com AVISO > 0, 99,9% com AVISO fora do cadastro ou 0
2021-2026: 500k-800k parcelas/ano com AVISO > 0, quase 100% com AVISO = 0 ou fora do cadastro
Total atual: 604.979 AVISO distintos em DUAM_IT, mas apenas 73.760 (12%) estão no cadastro TIPOAVIS (CD <= 93.089); 531.219 (88%) são lixo numérico (AVISO > 1M, qtd_linhas = qtd_duams, padrão de dado aleatório).
Conclusão: o vínculo direto DUAM_IT.AVISO -> TIPOAVIS.CD_TIPOAVI está praticamente quebrado na base histórica (provável bug do sistema que parou de preencher essa coluna). O cadastro TIPOAVIS está íntegro, mas o uso real dele em DUAM_ITs recentes é ínfimo.
O vínculo CONFIÁVEL que funciona: TIPOAVIS.CONTA_CONTABIL -> RECEITAS.ID -> DUAM.REC
Caminho alternativo 100% preenchido (DUAM.REC preenchido em 99,99% dos 10,8M DUAMs):
Pegar DUAM.REC (= RECEITAS.ID, plano contábil LRF)
Cruzar TIPOAVIS.CONTA_CONTABIL com RECEITAS.ID
Descobrir quais TIPOAVIS existem para aquele REC
Para DUAMs recentes (2020-2026), o caminho REC->TIPOAVIS retorna ~25-30 TIPOAVIS vinculados (exemplos validados):
DUAM 12897552 (CM CONSTRUTORA, 2026, R$ 755.724, REC=1889) -> 21 TIPOAVIS: RECEITA DIVIDA ATIVA - ISS, IPTU, ITBI, IVVC, MF, TAXA, DIV (todos com TAB=8/9/14/99)
DUAM 12976338 (FRANCISCA JOSEFA, 2026, REC=1930) -> 5 TIPOAVIS: TX CERTIDÃO AVERBAÇÃO, TX APREENSÃO ANIMAIS, TX AUT MUDANÇA TAXÍMETRO, TX 2ª VIA DOCUMENTO
DUAM 11604399 (2024, REC=4 "Impostos sobre Comércio Exterior") -> 1 TIPOAVI: INSS CPF (CD 336)
Queries canônicas (jun/2026)
-- 1. Classificar TIPOAVIS por módulo via TAB_RECEITA (oficial)
SELECT t."CD_TIPOAVI", t."DS_TIPOAVI", t."DS_ABREVIADA", t."TAB_RECEITA", t."CONTA_CONTABIL"
FROM "SCH"."TIPOAVIS" t
ORDER BY t."TAB_RECEITA", t."CD_TIPOAVI";

-- 2. Top 30 TIPOAVIS por movimento (qtd DUAMs distintas com AVISO preenchido)
WITH mov AS (
  SELECT "AVISO" AS cd, count(*) AS qtd_linhas, count(distinct "DUAM") AS qtd_duams, sum("VALOR_PAGO") AS vl_pago
  FROM "SCH"."DUAM_IT" WHERE "AVISO" > 0 AND "AVISO" <= 93089
  GROUP BY "AVISO"
)
SELECT m.cd, t."DS_TIPOAVI", t."DS_ABREVIADA", t."TAB_RECEITA", m.qtd_duams, m.qtd_linhas, m.vl_pago::bigint
FROM mov m JOIN "SCH"."TIPOAVIS" t ON t."CD_TIPOAVI" = m.cd
ORDER BY m.qtd_duams DESC LIMIT 30;

-- 3. DUAMs recentes com REC vinculado a TIPOAVIS (caminho CONTA_CONTABIL)
WITH duams AS (
  SELECT d."DUAM", d."REC" AS rec_id, d."ANO_REF" AS ano, d."CCP" AS ccp, d."DATA_EMISSAO",
         (SELECT sum("VL_DIVIDA")::bigint FROM "SCH"."DUAM_IT" WHERE "DUAM" = d."DUAM") AS valor
  FROM "SCH"."DUAM" d WHERE d."DATA_EMISSAO" >= '2020-01-01' AND d."REC" > 0
)
SELECT DISTINCT ON (t."CD_TIPOAVI")
  t."CD_TIPOAVI" AS cd, t."DS_TIPOAVI" AS tipo, t."DS_ABREVIADA" AS sigla, t."TAB_RECEITA" AS tr,
  dr."DUAM", dr.ano, dr.valor, dr.rec_id, r."NOME" AS receita_lrf, p."NOME" AS contribuinte
FROM duams dr
JOIN "SCH"."TIPOAVIS" t ON t."CONTA_CONTABIL" = dr.rec_id
LEFT JOIN "SCH"."RECEITAS" r ON r."ID" = dr.rec_id
LEFT JOIN "SCH"."PESSOA" p ON p."CCP" = dr.ccp
ORDER BY t."CD_TIPOAVI", dr."DUAM" DESC;copiar
Bug conhecido em TIPOAVIS - CONTA_CONTABIL errada em alguns cadastros
Exemplo: TIPOAVIS com TAB=1 (IPTU) tem CONTA_CONTABIL=1410, que aponta para RECEITAS "Empréstimos Compulsórios - Principal" (NÃO para receita de IPTU). Provável falha de cadastro/importação - afeta os 14 TIPOAVIS clássicos de IPTU. Não usar TIPOAVIS.CONTA_CONTABIL -> RECEITAS.ID para filtrar IPTU - usar TAB_RECEITA=1.
Outras observações
TIPOAVIS = 129 colunas (não 99 - a memória antiga diz 99, mas o banco tem 129). Coluna-pivô CD_TIPOAVI (PK), DS_TIPOAVI (descrição), DS_ABREVIADA (sigla), CONTA_CONTABIL (FK->RECEITAS), TAB_RECEITA (módulo), CD_DIV_ATIVA/CD_REPACTUA (auto-relacionamento para DA/parcelamento).
AUDITA_SISTEMA: 14 registros = 0 (sistema 0), 12 = sistema 1. Pouco útil.
GESTAO (10 valores distintos): 0 = gestão padrão (4.853 TIPOAVIS), outros (1200, 2798, 3200, 3500, 6100, 6800, 2700, 1400, 2600) = gestões orçamentárias específicas (SUS, FUNDEB, Convênios).
FONTE (103 valores): códigos de fonte de recurso orçamentário (ex: 0010, 0030, 0050, 0550, 2015.000265, etc.) - não tem utilidade tributária direta.
DATA_HORA_ULTIMA_ALTERACAO: 20 alterações em 2026 - cadastro VIVO (não estático).
TIPO (4 valores): 3=146 (principal), 1=3, 2=3 - não tem relação direta com módulo.
TRIBUTARIO (2 valores): 0=4603 (não-tributário), 1=2 - pouco usado.
O cadastro inclui também CONSIGNAÇÕES DA FOLHA (CD 296-340: INSS, IRRF, ISS-PF, ISS-PJ, PREVIPALMAS, bancos consignados - IGEPREV, BRADESCO, BMG, BANCO PAN AMERICANO, etc.). Isso reforça a tese de "cadastro GERAL" de toda receita, não só tributos.
MAPA OFICIAL TAB_RECEITA -> MÓDULO
TAB	Módulo	# TIPOAVIS	Exemplo
0	(consignações/orçamentário)	4.236	-
1	IPTU	14	CD 1
2	IPTU_TAXAS	50	CD 2
3	ISS	41	CD 10
4	ALVARÁ_FUNCIONAMENTO	200	CD 9
5	CONTRIBUIÇÃO DE MELHORIA	3	CD 8
6	ITBI	9	CD 14
7	ITBI_RURAL	1	-
8	IPTU_DIVIDA_ATIVA	5	CD 109
9	ISS_DIVIDA_ATIVA	20	CD 108
10	TAXAS_DIVIDA_ATIVA	2	CD 164
11	CONTR_MELHORIA_DA	1	CD 11
12	TAXAS_DIVERSAS	88	CD 22
14	MULTAS	43	CD 32, 43, 59, 92
15	COSIP	6	CD 6, 201, 212
16	RECEITA_DIVIDA_ATIVA	3	CD 7
19	ALVARÁ_CONSTRUÇÃO	1	CD 31
21	ISS_ACAO_FISCAL	2	-
23	CONSIGNAÇÕES (FOPAG)	1	CD 23
99	RECEITAS_DIVERSAS	157	CD 12, 30, 49, 20
[!] ACHADO CRÍTICO - AVISO em DUAM_IT é raramente preenchido
88% das DUAM_ITs têm AVISO > 1M (lixo numérico) - só 12% no cadastro TIPOAVIS. O vínculo direto DUAM_IT.AVISO -> TIPOAVIS.CD_TIPOAVI está praticamente quebrado.
TIPOAVIS - cadastro GERAL de tipos de lançamento tributário (jun/2026) cmqb5v4ob00nuq50ioapkutfi
memória [REVER] SUPERADA

[!] REGRA DURA para futuras análises: TIPOAVIS NÃO é exclusiva de multas. Ela é o cadastro central de TODOS os tipos de lançamento tributário do SIG Prodata. Cobre IPTU, ISS, ITBI, Alvarás, Taxas, Multas, Contribuição de Melhoria, etc.
O que é TIPOAVIS
Tabela SCH.TIPOAVIS (4.883 linhas, 99 colunas)
PK: CD_TIPOAVI (integer)
Nome: DS_TIPOAVI (descrição), DS_ABREVIADA (sigla)
Cada registro = 1 tipo de lançamento usado por algum módulo do SIG
Controla: template, fórmula de cálculo, conta contábil, vencimento, % multa/juros, caminhos de DA e parcelamento
Como TIPOAVIS se relaciona com cada módulo
| Módulo | Origem do cálculo | TIPOAVIS usado? | Como o AVISO chega na DUAM | |---|---|---|---| | IPTU | SMCALC | [OK] | DUAM_IT.AVISO = CD_TIPOAVI (gerado no cálculo) | | ISS / NFE-s | SMCALCISS / NFE | [OK] | DUAM_IT.AVISO = CD_TIPOAVI | | ITBI | (módulo específico) | [OK] | DUAM_IT.AVISO | | Alvarás | ITEMFER (vinculado a CADCAR) | [OK] | DUAM_IT.AVISO | | Multas / Autos de Infração | AUTO (Auditoria) | [OK] | DUAM_IT.AVISO (gerado a partir de AI) | | Parcelamento | SMCALCREPACIT | [OK] | DUAM_IT.AVISO (cada parcela mensal = 1 tipo) | | Taxas diversas | (módulos específicos) | [OK] | DUAM_IT.AVISO |
Conclusão: a coluna DUAM_IT.AVISO é a chave universal que diz "que tipo de lançamento tributário originou esta parcela". Preencher AVISO = o SIG Prodata padronizou TIPOAVIS como catálogo único de tipos.
Colunas de ligação da TIPOAVIS
CD_TIPOAVI (PK) -> DUAM_IT.AVISO (bigint, com cast implícito)
CONTA_CONTABIL (bigint) -> aponta para RECEITAS.ID (plano contábil LRF) - NÃO confunde CD_TIPOAVI com ID da RECEITA
TAB_RECEITA (integer) -> aponta para outra chave de RECEITAS (agrupador fiscal)
CD_DIV_ATIVA -> qual TIPOAVIS usar quando essa receita for inscrita em DA
CD_REPACTUA -> qual TIPOAVIS usar quando essa receita for parcelada
CD_JUROS_MULTA -> TIPOAVIS para os juros/multa cobrados em cima
REC_MULTA, REC_JUROS, REC_CORMON -> IDs de RECEITAS (contabil) para cada componente
TIPOAVIS × RECEITAS - as DUAS visões
Existem DOIS IDs diferentes e é fácil confundir: | Campo | Tabela | Escala | Para que serve | |---|---|---|---| | RECEITAS.ID | SCH.RECEITAS (41.074 linhas) | 1-61.827 (13 cópias por ano de carga) | Plano contábil LRF (classificação fiscal do destino) | | TIPOAVIS.CD_TIPOAVI | SCH.TIPOAVIS (4.883 linhas) | 1-93.089 | Tipo de lançamento tributário (template/fórmula) | | DUAM.REC | SCH.DUAM | integer | FK lógica -> RECEITAS.ID (classificação LRF da DUAM) | | DUAM_IT.AVISO | SCH.DUAM_IT | bigint | FK lógica -> TIPOAVIS.CD_TIPOAVI (tipo de lançamento) |
Coincidência numérica: alguns IDs podem casar entre as duas tabelas (ex: 43 = IRRF Trabalho em RECEITAS, 43 = MULTA FORMAL em TIPOAVIS) - coincidência pura, são universos distintos.
Como descobrir o nome de uma "receita" do lançamento
Se o usuário pergunta "qual o nome da receita X usada em lançamentos":
Tentar TIPOAVIS primeiro: SELECT * FROM "SCH"."TIPOAVIS" WHERE "CD_TIPOAVI" = X
Se encontrar -> é o tipo de lançamento (multa, taxa, IPTU, ISS, etc.)
DS_TIPOAVI = nome do tipo de tributo
Tentar RECEITAS: SELECT * FROM "SCH"."RECEITAS" WHERE "ID" = X
Se encontrar -> é o plano contábil (LRF)
NOME = nome da rubrica contábil
Cruzar as duas: SELECT t.CD_TIPOAVI, t.DS_TIPOAVI, t.CONTA_CONTABIL, r.ID, r.NOME FROM TIPOAVIS t LEFT JOIN RECEITAS r ON r.ID = t.CONTA_CONTABIL WHERE t.CD_TIPOAVI = X
Mostra o tipo de lançamento E a conta contábil LRF dele
Investigação típica de "receita de lançamento"
Query canônica para mostrar ID + nome + contexto contábil:
SELECT 
  t."CD_TIPOAVI"        AS id,
  t."DS_TIPOAVI"        AS nome_lancamento,
  t."DS_ABREVIADA"      AS sigla,
  t."CONTA_CONTABIL"    AS receita_lrf_id,
  r."NOME"              AS receita_lrf_nome,
  t."TAB_RECEITA"       AS tab_receita_id,
  t."CD_DIV_ATIVA"      AS tipoavi_da,
  t."CD_REPACTUA"       AS tipoavi_parc
FROM "SCH"."TIPOAVIS" t
LEFT JOIN "SCH"."RECEITAS" r ON r."ID" = t."CONTA_CONTABIL"
WHERE t."CD_TIPOAVI" IN (:ids)
ORDER BY t."CD_TIPOAVI";copiar
Erros comuns a evitar
[X] Assumir que TIPOAVIS é só multas (não é - é genérico)
[X] Confundir TIPOAVIS.CD_TIPOAVI com RECEITAS.ID (escalas e propósitos diferentes)
[X] Buscar receita só em RECEITAS quando o usuário quer "receita de lançamento" - tentar TIPOAVIS primeiro
[X] Dizer que "TIPOAVIS não tem movimento" baseado em amostra pequena - o movimento de IPTU/ISS/Alvarás usa TIPOAVIS diferentes dos 25 IDs típicos de multa
Validação feita (jun/2026)
Investigação dos 25 IDs fornecidos (43, 1810, 267, 276, 292, 91481, 59, 200, 113, 187, 1911, 90581, 266, 205, 1681, 216, 134, 167, 111, 1680, 1735, 1734, 91020, 91021) - todos acharam cadastro em TIPOAVIS, com volumes pequenos apenas porque eram multas antigas/paradas. Mas TIPOAVIS tem 4.883 linhas cobrindo TODOS os tipos de lançamento do SIG.
Próximas investigações sugeridas
Amostrar TIPOAVIS de cada módulo: pegar 5 de IPTU, 5 de ISS, 5 de ITBI, 5 de Alvarás, 5 de Taxas, 5 de Multas - mostrar a distribuição
Cruzar DS_TIPOAVI com padrões de nomenclatura (IPVA? ISS? ITBI?) pra mapear quais IDs pertencem a qual módulo
Investigar se há campo MODULO ou SISTEMA em TIPOAVIS pra classificar diretamente


Regras de Negócio Tributário
20 memórias de longo prazo com regras duras, armadilhas e casos canônicos do SIG Prodata (DUAM, DUAM_IT, LIVRO1, ARQ1033, SMCALCREPAC, etc).

[DICA]
Como ler: cada memória abaixo tem ID mono-visível, âncora #m-<ID>, e conteúdo integral. Use o sumário do índice para navegação rápida entre as 79 memórias.
Estoque devedor - quadro fechado dos 4 estados (atualizado jun/2026, tabelas-base, SEM views do banco) cmq7gj13o01k5l70iydzigmdi

---

### [18] Estoque devedor - quadro fechado dos 4 estados (atualizado jun/2026, tabelas-base, SEM views do banco)

[!] LEITURA OBRIGATÓRIA ANTES: memória canônica cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA. Esta memória usa "Dívida Ativa" no sentido administrativo (parcelas com DATA_DIV_ATI IS NOT NULL), NÃO no sentido de "tem CDA emitida". São coisas diferentes: DA é o estado, CDA é o documento.

[!] ATUALIZAÇÃO CRÍTICA (jun/2026, task cmqqtx2fl000lph0idq82w3bb): os 4 valores abaixo foram RECORRIGIDOS com a regra canônica nova (EXISTS LIVRO1 para "em DA") e com o filtro FLAG_PG_TOTAL='0' (eliminação de stale). Os valores antigos de jun/2026 (R$ 4,52 bi para E1, R$ 697 mi para E2) estavam INFLADOS por 86% e 42% respectivamente. Use os valores desta versão (v3) como referência canônica. Detalhes da decomposição da queda na issue cmqqwp8o1002rph00ixorhckz8.
Os 4 valores (vigentes, foto 23/06/2026, regras canônicas)
| # | Conceito | Valor (pós-correção) | Regra canônica | |---|---|---:|---| | 1 | Lançamento sem pagamento, NÃO migrado p/ DA | R$ 616.082.285,86 / 1.222.219 parc / 219.874 DUAMs | DATA_DIV_ATI IS NULL + FLAG_PG_TOTAL='0' + fora de parc. vigente + VALOR_PAGO IS NULL OR 0 | | 2 | Em Dívida Ativa (CDA emitida) | R$ 401.639.984,01 / 965.093 parc / 193.436 DUAMs | EXISTS (SELECT 1 FROM SCH.LIVRO1 l WHERE l."DUAM_IT" = it."DUAM") + FLAG_PG_TOTAL='0' + fora de parc. vigente | | 3 | Valor que ESTÁ em parcelamento vigente (dívida original migrada) | R$ 285.635.300,39 / 350.835 parc origem / 48.640 parcelamentos | SMCALCREPAC_ORIGEM.VL_ORIGINAL (parc. vigente) | | 4 | Parcelamento A RECEBER (saldo em aberto hoje) | R$ 175.402.084,96 / 63.968 parc / 6.803 parcelamentos | DUAM-mãe (SMCALCREPAC.DUAM -> DUAM_IT, PARCELA>0, VL_DIVIDA>0) | Estoque total = E1 + E2 + E4 = R$ 1.193.124.354,83 (~R$ 1,19 bi).
REGRA DURA - #3 e #4 medem o MESMO parcelamento em momentos diferentes
#3 = quanto ENTROU (valor original migrado, no ato da consolidação).
#4 = quanto AINDA FALTA receber (saldo aberto hoje na DUAM-mãe).
A diferença (#3 - #4 = R$ 110,2 mi, ou consolidado - #4 = R$ 226,9 mi) já foi paga ao longo do tempo (incl. descontos REFIS).
[!] NUNCA somar #3 + #4 - é dupla contagem do mesmo parcelamento.
Estilo "exato" (jun/2026, foto 23/06)
consolidado_parcelamento (no kpis): R$ 402.312.282,26 (= sum(VL_DIVIDA) das origens - VL_ORIGINAL + encargos)
Diferença consolidado - #4 = R$ 226,9 mi: já pagos/abatidos, inclusive descontos REFIS.
E1^E2 (parcelas DATA_DIV_ATI IS NULL mas DUAM com CDA) = R$ 342,96 mi / 762.787 parc (interseção DELIBERADA - explicada na task).
Soma E1 + E2 - E1^E2 = R$ 674,76 mi (= 1.424.525 parc dedupe) = valor total retornado pela rota composicao-receitas.
Por que mudou vs jun/2026 (R$ 4,52 bi -> R$ 616 mi para E1)
A versão antiga somava VL_DIVIDA de DUAM_IT direto, sem cruzar com DUAM.FLAG_PG_TOTAL. Isso incluía 8,96M parcelas stale de DUAMs já pagas no cabeçalho (cabeçalho FLAG_PG_TOTAL=1 mas parcela VL_DIVIDA>0 - design do sistema, ver memória cmqky1qa202ntp30in7vzlrpv). A nova query adiciona d.FLAG_PG_TOTAL='0' AND d.VL_DIVIDA>0 que elimina o stale. Mesma técnica aplicada para E2: trocou-se DATA_DIV_ATI IS NOT NULL (que tem 33% de sentinela 0001-01-01 placeholder) por EXISTS LIVRO1 (canônica). Detalhes: memória cmqksxh0y02lfp30i9rzzsteo.
Decisão de uso (jun/2026, oficial)
Para dashboards e relatórios oficiais de estoque: usar E1, E2, E4, consolidado, estoque_total da v3 desta memória.
Para o funil de cobrança (/api/funil-cobranca ou similar): mantém sua própria régua (N3 = 838.840 DUAMs / R$ 1,96 bi, ver cmqo806k00011pi0ik56iq742).
A discrepância E2 = R$ 401 mi (canônica EXISTS LIVRO1) vs. ~R$ 600 mi (escolha A, DATA_DIV_ATI NOT NULL AND != sentinela) é JUSTIFICÁVEL: a canônica reflete "DA real" (CDA emitida), a A reflete "DA administrativa" (apenas marcador, com CDA provavelmente em outra parcela). A canônica está alinhada ao funil.
Memórias relacionadas
cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA
cmqksxh0y02lfp30i9rzzsteo - DATA_DIV_ATI não é detector confiável de "em DA"
cmqky1qa202ntp30in7vzlrpv - FLAG_PG_TOTAL=1 não zera parcelas stale
cmqbl4frb000vpl0iu1lsphvk - DUAM.REC = TIPOAVIS.CD_TIPOAVI
cmqcp38pi00impl0izbsac41s - JOIN correto LIVRO1.DUAM_IT = DUAM_IT.DUAM
Task cmqqtx2fl000lph0idq82w3bb (jun/2026) - alinhamento de kpis/top-contribuintes com esta regra canônica. Issue HIGH cmqqwp8o0002pph0iylg4l4dz sobre copy do Estado 2 desatualizado em frontend/src/pages/DividaAtiva.jsx:124.
> [!] LEITURA OBRIGATÓRIA ANTES: memória canônica cmqjwqab501l4p30isxkku5c5 - Dívida Ativa != CDA. Esta memória usa "Dívida Ativa" no sentido administrativo (parcelas com DATA_DIV_ATI IS NOT NULL), NÃO no sentido de "tem CDA emitida". São coisas diferentes: DA é o estado, CDA é o documento. > > [!] ATUALIZAÇÃO CRÍTICA (jun/2026, task cmqqtx2fl000lph0idq82w3bb): os 4 valores abaixo foram RECORRIGIDOS com a regra canônica nova (EXISTS LIVRO1 para "em DA") e com o filtro FLAG_PG_TOTAL='0' (eliminação de stale). Os valores antigos de jun/2026 (R$ 4,52 bi para E1, R$ 697 mi para E2) estavam INFLADOS por 86% e 42% respectivamente. Use os valores desta versão (v3) como referência canônica. Detalhes da decomposição da queda na issue cmqqwp8o1002rph0ixorhckz8.

Os 4 valores (vigentes, foto 23/06/2026, regras canônicas)
#	Conceito	Valor (pós-correção)	Regra canônica
1	Lançamento sem pagamento, NÃO migrado p/ DA	R$ 616.082.285,86 / 1.222.219 parc / 219.874 DUAMs	DATA_DIV_ATI IS NULL + FLAG_PG_TOTAL='0' + fora de parc. vigente + VALOR_PAGO IS NULL OR 0
2	Em Dívida Ativa (CDA emitida)	R$ 401.639.984,01 / 965.093 parc / 193.436 DUAMs	EXISTS (SELECT 1 FROM SCH.LIVRO1 l WHERE l."DUAM_IT" = it."DUAM") + FLAG_PG_TOTAL='0' + fora de parc. vigente
3	Valor que ESTÁ em parcelamento vigente (dívida original migrada)	R$ 285.635.300,39 / 350.835 parc origem / 48.640 parcelamentos	SMCALCREPAC_ORIGEM.VL_ORIGINAL (parc. vigente)
4	Parcelamento A RECEBER (saldo em aberto hoje)	R$ 175.402.084,96 / 63.968 parc / 6.803 parcelamentos	DUAM-mãe (SMCALCREPAC.DUAM -> DUAM_IT, PARCELA>0, VL_DIVIDA>0)
Estoque total = E1 + E2 + E4 = R$ 1.193.124.354,83 (~R$ 1,19 bi).
REGRA DURA - #3 e #4 medem o MESMO parcelamento em momentos diferentes
- #3 = quanto ENTROU (valor original migrado, no ato da consolidação). - #4 = quanto AINDA FALTA receber (saldo aberto hoje na DUAM-mãe). - A diferença (#3 - #4 = R$ 110,2 mi, ou consolidado - #4 = R$ 226,9 mi) já foi paga ao longo do tempo (incl. descontos REFIS). - [!] NUNCA somar #3 + #4 - é dupla contagem do mesmo parcelamento.

REGRAS DURAS - DUAM / DUAM_IT / "documento liquidado" (jun/2026) cmqmhn5ju039ep30iiva685dj

---

### [26] REGRA DURA - Diferenciar PF × PJ pelo campo SCH.PESSOA.TP_PESSOA (NUNCA por dígitos do CGC)

REGRA DURA - Diferenciar PF × PJ pelo campo SCH.PESSOA.TP_PESSOA (NUNCA por dígitos do CGC) - validado ao vivo jun/2026
A tabela de cadastro único de pessoas é SCH.PESSOA (PK = CCP). O campo que classifica natureza da pessoa é TP_PESSOA (character varying). É o caminho CORRETO e CANÔNICO. PROIBIDO classificar PF/PJ por contagem de dígitos do CGC (CGC é bigint, perde zeros à esquerda -> 9-10 díg em CPF, 12-13 em CNPJ - frágil e errado) e PROIBIDO usar NAT_JURIDICA (99,6% VAZIO na tabela - 494.659 de 496.919 em branco; inútil).
Mapa dos códigos de TP_PESSOA (distribuição na tabela inteira, ~496.919 cadastros, jun/2026)
| TP_PESSOA | Significado | Qtd | Amostra de nomes | |---|---|---:|---| | 2 | Pessoa Física (PF) | 340.769 | CHARLENE SOARES DA LUZ, REGINA MARIA CASTILHO, ESPÓLIO DE RUBENS... | | 3 | Pessoa Jurídica (PJ) | 155.496 | CONDOMÍNIO BLOCO C, JB COMÉRCIO DE REFRIGERAÇÃO LTDA, ALVORADA MAT.CONST. LTDA, ITABRASIL TERRAPLANAGEM LTDA | | 4 | PJ estrangeira (multinacional/holding) | 23 | DIEBOLD NIXDORF INCORPORATED, VIASAT WORLDWIDE LIMITED, CORTEVA AGRISCIENCE HOLDING SPAIN | | 1 | Registro técnico do sistema (NÃO é pessoa real) | 23 | "DUAMS A REGULARIZAR" | | 0 | Não informado / placeholder | 534 | "." (cadastro vazio) + raros reais | | NULL | sem classificação | 74 | - |
Classificação recomendada
CASE
  WHEN p."TP_PESSOA" = '2' THEN 'PF'
  WHEN p."TP_PESSOA" IN ('3','4') THEN 'PJ'   -- 4 = PJ estrangeira
  ELSE 'NAO_CLASSIFICADO'                      -- 0,1,NULL (~631 reg = 0,13%)
ENDcopiar
Prova de robustez (TP_PESSOA × nº de dígitos do CGC)
TP_PESSOA=2: 334.987 com CGC <=11 díg (CPF) vs 981 com >=12 díg -> 99,7% coerente com PF.
TP_PESSOA=3: 154.777 com CGC >=12 díg (CNPJ) vs 691 com <=11 díg -> 99,6% coerente com PJ.
Onde diverge, é o CGC que está com erro de cadastro, NÃO o TP_PESSOA. Logo TP_PESSOA é a fonte de verdade.
Impacto / correção pendente
Toda análise/dashboard que classificou PF/PJ por dígitos do CGC (ex.: "Análise para Transação" CD 92327 - perfil PF/PJ, e qualquer KPI de perfil) deve ser RECONSTRUÍDA usando JOIN SCH.PESSOA p ON p.CCP = ... p.TP_PESSOA. A memória antiga que dizia "NAT_JURIDICA está em branco, classificar por dígitos do CGC" está SUPERADA por esta - o certo é TP_PESSOA.
Outros campos candidatos descartados em PESSOA
NAT_JURIDICA (99,6% vazio), CATEGORIA (99,4% vazio, valores AB/B/AD... = outra coisa), PESSOA_TXT. Nenhum serve para PF/PJ. Só TP_PESSOA serve.
O campo canônico é TP_PESSOA. PROIBIDO classificar PF/PJ por dígitos do CGC. PROIBIDO usar NAT_JURIDICA (99,6% VAZIO).

Mapa dos códigos de TP_PESSOA
TP_PESSOA	Significado	Qtd
2	Pessoa Física (PF)	340.769
3	Pessoa Jurídica (PJ)	155.496
4	PJ estrangeira	23
0, 1, NULL	placeholders / registros técnicos	~631
-- SQL
CASE WHEN p."TP_PESSOA" = '2' THEN 'PF' WHEN p."TP_PESSOA" IN ('3','4') THEN 'PJ' ELSE 'NAO_CLASSIFICADO' END

copiar
DUAM_IT: VALOR = principal original; VL_DIVIDA = VALOR A PAGAR (com encargos), SOMÁVEL. [!] corrige erro cmq8xfm5k006fq50i9tf1btez

---

### [30] REGRA DURA - Proibido usar views pré-existentes do banco (decisão do usuário, jun/2026)

O usuário NÃO confia nas views já existentes no banco SCH. Regra obrigatória para TODOS os agentes e análises:
PROIBIDO consultar qualquer view que o agente não tenha criado. Isso inclui explicitamente as views de Dívida Ativa: V_DIVIDA_ATIVA, V_DIVIDA_ATIVA_EXECUCAO, V_DIVIDA_ATIVA_PROTESTO, V_DIVIDA_ATIVA_PRESCRICAO - e qualquer outra view pré-existente do schema. NÃO usar em SELECT, JOIN, subquery, backend, dashboard, ou diagnóstico.
Toda análise deve sair das TABELAS-BASE (DUAM, DUAM_IT, LIVRO1, SMCALCREPAC, SMCALCREPAC_ORIGEM, SMCALCREPACIT, PESSOA, BCI, etc.) - montando a lógica na query (CTEs/JOINs sobre tabelas reais), nunca delegando a uma view do banco.
Se o agente CONSTRUIR uma view/materialização/CTE própria, deve AVISAR o usuário explicitamente - declarando que é um objeto criado pelo agente e mostrando a definição. O usuário sempre precisa saber a origem de cada objeto consultado.
As views pré-existentes continuam existindo no banco, mas são tratadas como "não confiáveis / fora de uso". Não removê-las, apenas nunca consultá-las.
Memória anterior (cmpimxoo5... / snapshot do banco) lista as views como "confirmadas existentes" - isso é só inventário estrutural; NÃO autoriza uso. Esta regra prevalece.
O usuário NÃO confia nas views já existentes no banco SCH. Regra obrigatória:

1. PROIBIDO consultar qualquer view que o agente não tenha criado. Views proibidas explicitamente: V_DIVIDA_ATIVA, V_DIVIDA_ATIVA_EXECUCAO, V_DIVIDA_ATIVA_PROTESTO, V_DIVIDA_ATIVA_PRESCRICAO.

2. Toda análise deve sair das TABELAS-BASE - montando a lógica na query (CTEs/JOINs sobre tabelas reais).

3. Se o agente CONSTRUIR uma view/materialização/CTE própria, deve AVISAR o usuário explicitamente.

4. As views pré-existentes continuam existindo no banco, mas são tratadas como "não confiáveis / fora de uso".

Inconsistência de dados: VL_DIVIDA > 0 com VALOR_PAGO > 0 (DUAM_IT) cmq5vlvmj00htl70ixl2fwk2t

---

### [36] Backend crashando com ETIMEDOUT no pg-pool (jun/2026)

Sintoma
Error: read ETIMEDOUT
    at TCP.onStreamRead (node:internal/stream_base_commons:216:20)
Emitted 'error' event on BoundPool instancecopiar
Processo Node derruba com Unhandled 'error' event no BoundPool. O node --watch reinicia -> cai de novo. Loop infinito, todas as rotas devolvem 5xx (ou penduram no proxy reverso até o statement_timeout=180000 estourar).
Causa raiz
backend/src/db.js tinha connectionTimeoutMillis: 2000 (2s). Sem listener pool.on('error', ...). Conexão TCP com 177.126.90.21:38432 oscila (10-12s de warm-up após restart, e picos intermitentes); um ETIMEDOUT num cliente ocioso derruba o BoundPool inteiro porque o Node não tem handler pro error event.
Correção aplicada (jun/2026)
connectionTimeoutMillis: 2000 -> 15000 (tolera até 15s de oscilação)
query_timeout: 180000 (batente explícito por query)
keepAlive: true + keepAliveInitialDelayMillis: 10000 (mantém socket ativo)
Listener pool.on('error', ...) que apenas loga - sem isso o Node mata o processo. Esta é a correção mais importante: o pg-pool emite error no pool quando um cliente ocioso perde a conexão, e o Node crasha com unhandled error.
Wrapper db.query / db.getClient com 1 retry automático em erros transientes (ETIMEDOUT, ECONNRESET, EHOSTUNREACH, ENOTFOUND, EPIPE, ECONNREFUSED e mensagens contendo "timeout"/"connection terminated"/"connection refused"/"eof"). Backoff: 250ms × tentativa.
testConnection() agora executa SELECT 1 para validar de fato (não só connect()).
Como aplicar em tasks futuras
Se ver ETIMEDOUT no stderr do BE -> confirmar correção em backend/src/db.js (timeout 15s + handler de error + retry).
Se o BE reiniciar em loop com Failed running 'src/server.js', é quase sempre a mesma causa.
Validar com: node --check backend/src/db.js + curl /api/receitas/multa após restart.
Performance após fix: 11/12 rotas voltam em 40-500ms; /api/parcelamentos/kpis mantém ~25-30s em cold cache (esperado, ver memória cmqfc757d03ewpl0i5ckc5oay).
Não mudar
connectionTimeoutMillis: 15000 é o limite - se voltar a oscilar, o problema é de rede entre Serendiped e o cliente do DB, não do backend.
O wrapper com retry é por query; queries dentro de transação (db.getClient()) também passam pelo retry no connect(). Não duplicar retry dentro de handlers.
statement_timeout continua sendo responsabilidade de cada rota via SET LOCAL (rotas pesadas fazem isso explicitamente com db.getClient() + SET statement_timeout=120000).
Sintoma
Error: read ETIMEDOUT
at TCP.onStreamRead (node:internal/stream_base_commons:216:20) Emitted 'error' event on BoundPool instance

copiar
Processo Node derruba com Unhandled 'error' event. Loop infinito.
Causa raiz
backend/src/db.js tinha connectionTimeoutMillis: 2000. Sem listener pool.on('error', ...). Conexão TCP oscila (10-12s warm-up); um ETIMEDOUT derruba o BoundPool inteiro.
Correção aplicada
1. connectionTimeoutMillis: 2000 -> 15000 2. query_timeout: 180000 3. keepAlive: true + keepAliveInitialDelayMillis: 10000 4. Listener pool.on('error', ...) - sem isso o Node mata o processo 5. Wrapper db.query / db.getClient com 1 retry automático em erros transientes 6. testConnection() agora executa SELECT 1

Cold cache do /api/analise-receita/:cd/kpis é LENTO - não confundir com bug do frontend cmqfdsj5d03fqpl0ieq05rgoh

---

### [37] Cold cache do /api/analise-receita/:cd/kpis é LENTO - não confundir com bug do frontend

Cold cache do /api/analise-receita/:cd/kpis é LENTO - não confundir com bug do frontend (jun/2026, task cmqfc757d03ewpl0i5ckc5oay)
Medições reais (BE reiniciado, sem cache em memória, jun/2026):
BE startup + warm-up dos 25 KPIs: 8.9s (computa TODOS em série na inicialização)
1ª chamada cold do CD 92327 (pós-warmup): 7.1s (responseTime do log Fastify)
1ª chamada cold do CD 43: 18.9s (!)
1ª chamada cold do CD 267 (3645 CCPs): >30s (timeout 30s do curl)
HITs subsequentes: <50ms (cache em memória funciona perfeitamente)
Causa
O kpis chama 8+ queries pesadas (status1-2-3, ano-emissão, ano-CDA, protesto, top5, perfil, padrão, críticos).
Cada query é multi-join em tabelas grandes (DUAM 10M, DUAM_IT 28M, LIVRO1 2.5M).
O warm-up cacheia 1× para todos os 25 CDs mas o cache tem limite (provavelmente LRU) - chamadas cold pós-warmup podem acontecer.
Implicação
A 1ª chamada SEMPRE é cold. Após restart do BE, todas as 25 chamadas dos 25 CDs estão cacheadas, mas a 1ª chamada do user para um CD específico pode pegar cold de novo.
Performance: warm = 50ms, cold = 7-30s.
Já documentado em cmqehaimq02tupl0irfd3mqm9 como "ANTES: >180s timeout; DEPOIS: ~7-10s (cache frio) / ~2-4s (cache quente)".
Diagnóstico rápido
# Verificar se cache está HIT ou MISS:
ps -ef | grep "node.*server.js" | grep -v grep
# Se processo foi reiniciado há pouco, é cold
# Se está rodando há minutos, é warmcopiar
Para futuras tasks
Não esperar "cold cache <3s" para CD 267 ou CDs grandes - esse critério é INATINGÍVEL sem mudanças estruturais.
Para melhorar: considerar materialized views por REC, ou cache mais agressivo (Redis).
Em tasks de UI: validar performance com WARM cache (HIT), não cold.
Em tasks de backend: documentar tempo cold vs warm separadamente, sempre.
Medições reais (BE reiniciado, sem cache em memória, jun/2026): - BE startup + warm-up dos 25 KPIs: 8.9s - 1ª chamada cold do CD 92327: 7.1s - 1ª chamada cold do CD 43: 18.9s - 1ª chamada cold do CD 267: >30s (timeout) - HITs subsequentes: <50ms (cache funciona)

Causa
O kpis chama 8+ queries pesadas (status1-2-3, ano-emissão, ano-CDA, protesto, top5, perfil, padrão, críticos).

Implicação
- Performance: warm = 50ms, cold = 7-30s - Não esperar "cold cache <3s" para CD 267 ou CDs grandes - critério INATINGÍVEL sem mudanças estruturais

AUTO.VALOR_ORIGINAL = 100% zerado - caminho REAL do valor: AUTO -> DUAM -> LIVRO1 (jun/2026) cmqf9xxcu03dkpl0ia70tfipe

---

### [39] ARMADILHA: `node --watch` pode resetar o working tree durante validação (jun/2026)

Sintoma: você edita backend/src/server.js com fs_edit/apply_edit, sobe o backend com npm run dev (que internamente usa node --watch), e em algum momento as edições são PERDIDAS - o working tree volta a um estado anterior (geralmente o do último commit). O git diff mostra working tree limpo mesmo depois de múltiplas edições que "deveriam" ter ficado. Causa provável (jun/2026): o node --watch observa src/server.js e, ao detectar mudança, recarrega. Mas alguma ação na cadeia (rodar curl pesado, restart do backend, etc.) pode disparar o salvamento de uma versão em cache. O sintoma exato não é 100% claro, mas o efeito é real: edits podem desaparecer. REGRA DURA - validação após edits no backend/src/server.js:
Após CADA fs_edit/apply_edit, rodar git diff --stat IMEDIATAMENTE para confirmar que o edit persistiu.
Se a edição sumiu, refazer o fs_edit (determinístico).
NÃO confiar em node --check nem em git status logo após o edit - se o backend foi reiniciado várias vezes, o node --watch pode ter regravaçado o arquivo.
SEMPRE rodar grep da string nova antes de subir o backend e antes de commitar.
Diagnóstico:
Edit sumiu -> grep -c "" retorna 0 mesmo após fs_edit reportar sucesso.
Confirmar: git diff --stat mostra working tree limpo.
Causa: alguma ação (provavelmente restart do node --watch ou escrita concorrente) sobrescreveu o arquivo.
Caso concreto (jun/2026, task cmqed2spr02j4pl0i2olzecpy): reverti 3 queries de _computeAnaliseReceitaKpis. As 2 primeiras (protesto, padrao) foram validadas com curl e os números bateram. A 3ª (criticos) "se perdeu" silenciosamente - só fui descobrir quando rodei grep -c "coalesce(la.cdas, 0)::int AS cdas_historicas" (deveria ser 0, estava em 1) ANTES de commitar. Se eu tivesse feito git diff --stat logo após o 3º fs_edit, teria visto o problema na hora. Workaround: rodar git diff --stat e os greps de validação IMEDIATAMENTE após cada fs_edit/apply_edit em arquivos do backend, ANTES de subir o dev server.
Sintoma: você edita backend/src/server.js, sobe o backend com npm run dev (que usa node --watch), e em algum momento as edições são PERDIDAS - o working tree volta a um estado anterior.
REGRA DURA - validação após edits no backend/src/server.js:
1. Após CADA fs_edit/apply_edit, rodar git diff --stat IMEDIATAMENTE para confirmar que o edit persistiu. 2. Se a edição sumiu, refazer o fs_edit (determinístico). 3. SEMPRE rodar grep da string nova antes de subir o backend e antes de commitar.

Diagnóstico
- Edit sumiu -> grep -c "" retorna 0 mesmo após fs_edit reportar sucesso. - Confirmar: git diff --stat mostra working tree limpo.

---

### [42] [!] BUG CRÍTICO DE METODOLOGIA - DUAM.REC = TIPOAVIS.CD_TIPOAVI, NÃO CONTA_CONTABIL (jun/2026)

[!] BUG CRÍTICO DE METODOLOGIA - DUAM.REC = TIPOAVIS.CD_TIPOAVI, NÃO CONTA_CONTABIL (descoberto jun/2026)
A análise das 25 receitas de multas feita em jun/2026 estava ERRADA porque usou o caminho de mapeamento errado. Esta memória registra a correção definitiva.
O erro
A análise SQL de jun/2026 das 25 receitas (CD_TIPOAVI de multas) usou o caminho:
FROM "SCH"."DUAM_IT" it
JOIN "SCH"."DUAM" d ON d."DUAM" = it."DUAM"
WHERE d."REC" IN (
  SELECT DISTINCT t."CONTA_CONTABIL" AS rec
  FROM "SCH"."TIPOAVIS" t
  WHERE t."CD_TIPOAVI" IN (43,59,...)
)copiar
Está errado. O caminho real é:
WHERE d."REC" = TIPOAVIS.CD_TIPOAVI
-- Ex: WHERE d."REC" = 267   (para CD 267 = MULTA INFRACAO POSTURAS)copiar
A evidência (validada em jun/2026 com CD 267)
Tela do SIG Prodata mostra 3.633 registros de CD 267 (MULTA INFRACAO POSTURAS).
Análise anterior usou DUAM.REC = TIPOAVIS.CONTA_CONTABIL = 1865 -> retornou 0 registros (zero absoluto).
Análise correta usa DUAM.REC = TIPOAVIS.CD_TIPOAVI = 267 -> retorna 13.429 DUAMs (total) / 3.645 CCPs / 4.778 DUAMs / R$ 6,54 mi (filtrando FLAG_PG_TOTAL=0).
Validação cruzada: 12/12 CCPs visíveis na tela do sistema são encontrados com a query corrigida, com valores batendo em 8/12 casos (diferenças de centavos/raros onde a tela agrega de forma diferente).
Por que o caminho CONTA_CONTABIL estava errado
TIPOAVIS.CONTA_CONTABIL é FK -> RECEITAS.ID (plano contábil LRF).
Mas o SIG Prodata grava DUAM.REC = CD_TIPOAVI (não o RECEITAS.ID).
O nome do campo é "RECEITA" mas o conteúdo é o tipo de lançamento (CD_TIPOAVI).
Conclusão: DUAM.REC é o TIPOAVIS, não RECEITAS (apesar do nome confuso).
A definição da view V_DIVIDA confirma
A view SCH.V_DIVIDA (consultada no banco) filtra:
WHERE duam."FLAG_PG_TOTAL" = 0
  AND COALESCE(duam_it."AVISO", 0) <= 0   -- ignora o lixo de 88% das DUAM_ITscopiar
E usa DUAM.REC como chave. Confirma que o sistema usa REC (= CD_TIPOAVI).
Implicações
A análise anterior (jun/2026) das 25 receitas tem que ser REFEITA com o caminho DUAM.REC = TIPOAVIS.CD_TIPOAVI. Os 24 CDs de MULTA que apareceram como "vazios" provavelmente TÊM movimento real.
A memória antiga que dizia "use CONTA_CONTABIL para mapear receita -> DUAM" estava errada (válida para IPTU onde CONTA_CONTABIL casualmente bate, mas não para multas).
A descoberta do INFRACAO.ID_RECEITA (NOME ENGANADOR) também é importante: esse campo bigint armazena CD_TIPOAVI (267, 266 etc.), não RECEITAS.ID. É o caminho inverso AUTO.COD_INFRACAO -> INFRACAO.CODIGO -> INFRACAO.ID_RECEITA.
DUAM_IT.AVISO continua 88% quebrado - não usar como caminho primário.
Query correta para análise de 1 CD_TIPOAVI
WITH base AS (
  SELECT d."DUAM", d."CCP", d."FLAG_PG_TOTAL",
         it."PARCELA", it."VL_DIVIDA" AS it_vl_divida,
         it."DATA_DIV_ATI", it."DATA_PGTO"
  FROM "SCH"."DUAM" d
  JOIN "SCH"."DUAM_IT" it ON it."DUAM" = d."DUAM"
  WHERE d."REC" = 267                    -- = TIPOAVIS.CD_TIPOAVI
    AND d."FLAG_PG_TOTAL" = 0            -- não quitada
    AND it."PARCELA" = 0                 -- só entrada (vide regra de negócio)
    AND it."DATA_PGTO" IS NULL
    AND it."VL_DIVIDA" > 0
),
parc_origem AS (
  SELECT DISTINCT o."DUAM", o."PARCELA"
  FROM "SCH"."SMCALCREPAC_ORIGEM" o
  JOIN "SCH"."SMCALCREPAC" r ON r."ID_SIMULA" = o."ID_SIMULA"
  WHERE r."REGISTRADA_S_N" = 'S' AND r."DATA_ESTORNO" IS NULL
    AND (r."CANCELADO" IS NULL OR r."CANCELADO" = false)
)
SELECT
  CASE
    WHEN (b."DUAM", b."PARCELA") IN (SELECT "DUAM","PARCELA" FROM parc_origem) THEN 'C_PARCELADO'
    WHEN b."DATA_DIV_ATI" IS NOT NULL THEN 'B_DIVIDA_ATIVA'
    ELSE 'A_DEBITO'
  END AS grupo,
  count(*) AS qtd_parcelas, count(DISTINCT b."DUAM") AS qtd_duams,
  count(DISTINCT b."CCP") AS qtd_ccps,
  sum(b."it_vl_divida")::numeric(15,2) AS vl_saldo_aberto
FROM base b GROUP BY 1 ORDER BY 1;copiar
O que mudar nas memórias antigas
Memória cmpimypwm000guf0i2ygqk93f (Regras de Negócio) tem a query "Listar DUAMs em DA de um contribuinte" usando i."DATA_DIV_ATI" IS NOT NULL AND i."VL_DIVIDA" > 0 - está ok.
Memória antiga que afirmava "o vínculo TIPOAVIS.CONTA_CONTABIL -> RECEITAS.ID" - REVISAR, esse caminho é o contábil, não o caminho de vínculo com DUAM.
Memória cmqb9dnxg... (TIPOAVIS - TAB_RECEITA -> módulo) tem a observação "Bug conhecido em TIPOAVIS - CONTA_CONTABIL errada em alguns cadastros" - mantém a observação, mas agora fica claro que CONTA_CONTABIL é plano contábil, não é o caminho para DUAM.
Refazer a análise das 25 receitas
Ação: despachar novo explorer para rerodar Q1..Q8 com o caminho corrigido em todas as 25 receitas.
> A análise das 25 receitas de multas feita em jun/2026 estava ERRADA porque usou o caminho de mapeamento errado.

O erro
A análise SQL usou:

-- SQL
WHERE d."REC" IN ( SELECT DISTINCT t."CONTA_CONTABIL" AS rec FROM "SCH"."TIPOAVIS" t WHERE t."CD_TIPOAVI" IN (43,59,...) )

copiar
Está errado. O caminho real é:
-- SQL
WHERE d."REC" = TIPOAVIS.CD_TIPOAVI -- Ex: WHERE d."REC" = 267

copiar
A evidência (validada com CD 267)
- Análise errada (CONTA_CONTABIL=1865) -> 0 registros - Análise correta (CD_TIPOAVI=267) -> 13.429 DUAMs / 3.645 CCPs / R$ 6,54 mi

Por que CONTA_CONTABIL estava errado
- TIPOAVIS.CONTA_CONTABIL é FK -> RECEITAS.ID (plano contábil LRF) - Mas o SIG Prodata grava DUAM.REC = CD_TIPOAVI (não o RECEITAS.ID) - Conclusão: DUAM.REC é o TIPOAVIS, não RECEITAS

VALIDAÇÃO OBRIGATÓRIA: contar alterações com `git diff`/`grep` após cada `apply_edit` cmqa1wvt300i8q50i9yy3i7tw

---

### [43] VALIDAÇÃO OBRIGATÓRIA: contar alterações com `git diff`/`grep` após cada `apply_edit`

O que aconteceu (jun/2026): executor anterior reportou "troquei em 3 rotas do backend" mas só trocou em 2 - a 3ª alteração falhou silenciosamente. Foi aprovado pelo próprio executor (todos marcados done) e só pego pelo reviewer depois, quando a evidência contra o banco mostrou que /top-devedores ainda usava VALOR em vez de VL_DIVIDA. Por que apply_edit/lazyEdit falha silenciosamente:
O lazyEdit precisa casar EXATAMENTE com o trecho do arquivo (até whitespace). Se a string de busca não bate 1:1, a edição é reportada como sucesso mas não aplica nada.
Às vezes o trecho já foi modificado por um apply_edit anterior e a âncora mudou.
REGRA DURA - validação pós-edit:
Após CADA apply_edit (ou fs_edit) em arquivo existente, rodar grep/git diff específico para confirmar que a string NOVA está no arquivo E a string ANTIGA sumiu.
Se a edição envolver várias ocorrências da mesma substituição (ex.: trocar em 3 rotas), CONTAR as ocorrências esperadas e validar que a contagem confere.
Antes de marcar todos como done, rodar git diff --stat + git diff do arquivo e revisar o diff linha-a-linha.
Exemplo concreto:
Tarefa: trocar SUM(it."VALOR") por SUM(it."VL_DIVIDA") em 3 rotas.
Comando de validação: grep -n 'SUM(it\."VAL_DIVIDA")' backend/src/server.js
Esperado: 3 ocorrências (1 por rota). Se vier 2, alguma apply_edit falhou - investigar e refazer.
Outra armadilha similar: quando o executor tinha 3 apply_edit no front que "não persistiram" (linhas 557, 626, "Top 10"). Mesmo padrão - lazyEdit não fez match exato, sucesso reportado, alteração perdida. Lembrete: fs_edit é determinístico (falha explícita se 0 ou >1 match) - preferir quando o trecho for EXATO e curto. apply_edit é bom para edições com markers de preservação, mas EXIGE validação por grep.
O que aconteceu: executor anterior reportou "troquei em 3 rotas do backend" mas só trocou em 2 - a 3ª alteração falhou silenciosamente.
Por que apply_edit/lazyEdit falha silenciosamente
- O lazyEdit precisa casar EXATAMENTE com o trecho do arquivo (até whitespace). Se a string de busca não bate 1:1, a edição é reportada como sucesso mas não aplica nada.

REGRA DURA - validação pós-edit:
1. Após CADA apply_edit (ou fs_edit) em arquivo existente, rodar grep/git diff específico para confirmar que a string NOVA está no arquivo E a string ANTIGA sumiu. 2. Se a edição envolver várias ocorrências, CONTAR as ocorrências esperadas. 3. Antes de marcar todos como done, rodar git diff --stat + git diff do arquivo e revisar.

Exemplo
Tarefa: trocar SUM(it."VALOR") por SUM(it."VL_DIVIDA") em 3 rotas. - grep -n 'SUM(it\\."VAL_DIVIDA")' backend/src/server.js - Esperado: 3 ocorrências. Se vier 2, alguma apply_edit falhou.

SNAPSHOT ESTRUTURAL DO BANCO SCH (baseline - jun/2026) cmq7e4u7q01jpl70i12on12zy

---

### [44] SNAPSHOT ESTRUTURAL DO BANCO SCH (baseline - jun/2026)

Verdade absoluta = o banco consultado ao vivo. Este snapshot foi medido via information_schema no PostgreSQL real (177.126.90.21:38432, db sch, schema SCH, user FiscalizaIA) e serve de BASELINE para comparações estruturais futuras. Se o cliente atualizar o banco de novo, re-medir e comparar contra estes números.
Permissão & totais (medidos jun/2026)
has_schema_privilege('FiscalizaIA','SCH','USAGE') = t (resolvido).
Total de tabelas no SCH: 4.896 (era 4.887 em mai/2026 -> +9).
Total de colunas no SCH: 71.759 (era 71.620 em mai/2026 -> +139).
Evolução incremental (~0,18%/0,19%), NÃO reestruturação. Nenhuma tabela do MER/DER do PDF foi removida/renomeada.
As 36 tabelas canônicas (TABELAS_PDF) - nº REAL de colunas no banco
cols_banco = COUNT(*) em information_schema.columns WHERE table_schema='SCH' AND table_name=. Todas existem (nenhuma com 0 colunas). colsPDF = o que o PDF documenta (!= cols_banco), mantido em backend/src/server.js (const TABELAS_PDF).
| Tabela | Módulo | cols_banco | colsPDF | |---|---|---|---| | DUAM | Dívida Ativa | 85 | 9 | | DUAM_IT | Dívida Ativa | 76 | 7 | | LIVRO1 | Dívida Ativa | 42 | 9 | | fato_detalhamento_divida_ativa | Dívida Ativa | 51 | 11 | | SMCALCREPAC | Dívida Ativa | 36 | 7 | | SMCALCREPACIT | Dívida Ativa | 20 | 0 | | SMCALCREPAC_ORIGEM | Dívida Ativa | 34 | 0 | | BCI | IPTU | 343 | 17 | | BCI_SUB | IPTU | 166 | 0 | | BCI_GEO | IPTU | 110 | 0 | | BCI_HISTORICO_CALCULOS | IPTU | 156 | 0 | | SMCALC | IPTU | 70 | 11 | | CADURB | IPTU | 23 | 17 | | LOG_CADURB | IPTU | 7 | 0 | | DALICONS | Alvarás | 124 | 13 | | CAPAFER | Alvarás | 19 | 0 | | ITEMFER | Alvarás | 27 | 0 | | CADCAR | Alvarás | 99 | 0 | | CADCART | Alvarás | 7 | 0 | | ITEMFER_HIST | Alvarás | 5 | 0 | | ALVARA | Alvarás | 17 | 0 | | SOLICITACAO_ALVARA | Alvarás | 58 | 0 | | SIGFACIL_EMPRESA | Alvarás | 57 | 0 | | ATIVIDADES_ALVARA | Alvarás | 11 | 0 | | CONFIGURACAO_LANCAMENTO_TAXAS_INSCRICAO_ECONOMICA | Alvarás | 8 | 6 | | NFE | NFE-s | 131 | 21 | | RPS | NFE-s | 23 | 0 | | LOTE_RPS | NFE-s | 14 | 0 | | NFE_CANCELADA | NFE-s | 16 | 0 | | AUTO | Auditoria | 37 | 18 | | AUTO_APREENSAO | Auditoria | 46 | 0 | | ANEXOS_AUTO_INFRACAO | Auditoria | 12 | 0 | | ORDEM_SERVICO | Auditoria | 32 | 0 | | FISCAL | Auditoria | 12 | 0 | | APURACAO_DESIF | Auditoria | 21 | 0 | | AUDITORIA | Auditoria | 13 | 0 |
Tabelas críticas (propósito diferente do PDF - RH/Folha, NÃO Alvarás)
"FER" = férias. Gap vs PDF confirmado e persistente:
CAPAFER (19 cols) -> Férias. Colunas: RECNUM, ID_CAPAFER, MATRICULA, EXERCICIO, AQUISICAO_INI, AQUISICAO_FINAL...
ITEMFER (27 cols) -> Itens de folha/férias. Colunas: RECNUM, ID_ITEMFER, ID_CAPAFER, ID_TIPOFOLHA, GOZO_INICIAL, GOZO_FINAL...
ITEMFER_HIST (5 cols) -> Histórico de férias. Colunas: RECNUM, MATRICULA, PROCESSO, CD_USUARIO_AUDITA...
CADCAR (99 cols) -> Cargos (RH). Colunas: RECNUM, ID_CARGO, ID_CBO, DESCRICAO, QTDE_LIMITE, QTDE_USADO...
CADCART (7 cols) -> Tipo de cartório. Colunas: RECNUM, CODIGO, DESCRICAO, SIGLA, TIPO_CART...
Tabelas relevantes FORA do PDF (presentes no SCH, não em TABELAS_PDF)
Reforma tributária / NFSE / REFIS / DDA / repactuação - todas existem mas NÃO são documentadas pelo PDF MER/DER, logo não entram no score: RPS_DUAM, LOTE_RPS_DUAM, REFIS_CONDICOES (+DESCONTOS/+VENCIMENTO), NFSE_GOV_LOG, SERVICO_NACIONAL_NFSE, SERVICO_NBS_NFSE, SOLICITACAO_NFSE (+ANEXO/+AUTORIZADOS/+ATIV_SECUNDARIAS), PARAMETROS_NFSE, HISTORICO_ALTERACAO_VALORES_DDA, AUDITA_ACERTA_ESTORNO_REPACTUACAO.
Como re-medir (auditoria estrutural futura)
-- Totais do schema
SELECT count(*) AS tabelas FROM information_schema.tables  WHERE table_schema='SCH';
SELECT count(*) AS colunas FROM information_schema.columns WHERE table_schema='SCH';

-- cols_banco de todas as canônicas de uma vez
SELECT table_name, count(*)::int AS cols_banco
FROM information_schema.columns
WHERE table_schema='SCH'
  AND table_name IN ('DUAM','DUAM_IT','LIVRO1','fato_detalhamento_divida_ativa','SMCALCREPAC',
    'SMCALCREPACIT','SMCALCREPAC_ORIGEM','BCI','BCI_SUB','BCI_GEO','BCI_HISTORICO_CALCULOS','SMCALC',
    'CADURB','LOG_CADURB','DALICONS','CAPAFER','ITEMFER','CADCAR','CADCART','ITEMFER_HIST','ALVARA',
    'SOLICITACAO_ALVARA','SIGFACIL_EMPRESA','ATIVIDADES_ALVARA',
    'CONFIGURACAO_LANCAMENTO_TAXAS_INSCRICAO_ECONOMICA','NFE','RPS','LOTE_RPS','NFE_CANCELADA',
    'AUTO','AUTO_APREENSAO','ANEXOS_AUTO_INFRACAO','ORDEM_SERVICO','FISCAL','APURACAO_DESIF','AUDITORIA')
GROUP BY table_name ORDER BY table_name;copiar
Comparar o resultado contra a tabela acima -> qualquer diferença = mudança estrutural feita pelo cliente.
> Verdade absoluta = o banco consultado ao vivo. Este snapshot foi medido via information_schema no PostgreSQL real (177.126.90.21:38432, db sch, schema SCH, user FiscalizaIA) e serve de BASELINE para comparações estruturais futuras.

Permissão & totais
- has_schema_privilege('FiscalizaIA','SCH','USAGE') = t (resolvido). - Total de tabelas no SCH: 4.896 (era 4.887 em mai/2026 -> +9) - Total de colunas no SCH: 71.759 (era 71.620 em mai/2026 -> +139) - Evolução incremental (~0,18%/0,19%), NÃO reestruturação

5 tabelas críticas por "propósito diferente" (RH/Folha, NÃO Alvarás)
"FER" = férias: - CAPAFER (19 cols) -> Férias - ITEMFER (27 cols) -> Itens de folha/férias - ITEMFER_HIST (5 cols) -> Histórico de férias - CADCAR (99 cols) -> Cargos (RH) - CADCART (7 cols) -> Tipo de cartório

Padrões SQL para análise de parcelamentos (FiscalizaIA) cmq5s4fzr00fbl70ikohng35z

---

