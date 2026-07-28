/**
 * A EVIDÊNCIA de um passo da trilha — o conteúdo que abre ao expandir a linha.
 *
 * É o que transforma "o agente disse que são 128 notas" em algo com que dá para
 * discordar: qual conexão ele abriu, qual SQL rodou, quantas linhas voltaram e
 * uma amostra do que veio. Sem isso a resposta é só uma opinião bem formatada.
 *
 * Nada aqui é obrigatório — o backend manda o que tem. Cada bloco só aparece
 * quando há dado, e a ausência nunca vira um rótulo vazio. Quando não sobra
 * NADA, quem decide não abrir a linha é `hasStepEvidence` (em `lib/chat-tools`):
 * ele lista exatamente os campos consumidos aqui.
 */
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { Banner } from '@astryxdesign/core/Banner';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Table, pixel, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/Stack';
import { tokenizeSql } from '@/shared/lib/sql-tokenize';
import type { AuditStep, ChatStepPreview } from '../model';
import { formatCount, formatDuration } from '../lib/chat-tools';

/** Largura fixa por coluna: o mesmo critério do resultado de query da conexão. */
const PREVIEW_COLUMN_WIDTH = 160;

type PreviewRow = Record<string, unknown>;

/** `null` vira ∅ para não se confundir com texto em branco. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '∅';
  return String(value);
}

/** A amostra chega como matriz; a `Table` do DS consome objetos por linha. */
function toPreviewRows(preview: ChatStepPreview): PreviewRow[] {
  return preview.rows.map((row, index) => {
    const entry: PreviewRow = { __index: index };
    preview.columns.forEach((_name, columnIndex) => {
      entry[`c${columnIndex}`] = row[columnIndex] ?? null;
    });
    return entry;
  });
}

function toPreviewColumns(preview: ChatStepPreview): TableColumn<PreviewRow>[] {
  return preview.columns.map((name, index) => ({
    key: `c${index}`,
    header: name,
    width: pixel(PREVIEW_COLUMN_WIDTH),
    renderCell: (row: PreviewRow) => (
      <Text type="code" maxLines={1} hasTruncateTooltip>
        {formatCell(row[`c${index}`])}
      </Text>
    ),
  }));
}

function StepPreview({ preview }: { preview: ChatStepPreview }) {
  const shown = preview.rows.length;
  const total = preview.totalRows ?? shown;

  return (
    <VStack gap={2}>
      <Table<PreviewRow>
        data={toPreviewRows(preview)}
        columns={toPreviewColumns(preview)}
        idKey={(row) => String(row.__index)}
        density="compact"
        dividers="grid"
        isStriped
        textOverflow="truncate"
      />
      {/* Amostra truncada precisa se declarar: quem lê 8 linhas e conclui pelo
          total erra por duas ordens de grandeza — e a culpa seria da tela. */}
      <Text type="supporting" color="secondary">
        {total > shown
          ? `Amostra: mostrando ${formatCount(shown)} de ${formatCount(total)} linhas.`
          : `Amostra completa: ${formatCount(shown)} ${shown === 1 ? 'linha' : 'linhas'}.`}
      </Text>
    </VStack>
  );
}

export interface AuditStepDetailProps {
  step: AuditStep;
}

export function AuditStepDetail({ step }: AuditStepDetailProps) {
  const hasFacts =
    step.connectionName !== undefined ||
    step.rowCount !== undefined ||
    step.durationMs !== undefined;

  return (
    <VStack gap={3}>
      {step.errorMessage ? (
        // O DS já mostra a falha no `title` do ícone de status, mas tooltip não
        // existe no toque e não é lido em voz alta: a mensagem também fica aqui.
        <Banner
          status="error"
          container="section"
          title="A ferramenta falhou"
          description={step.errorMessage}
        />
      ) : null}

      {hasFacts ? (
        <MetadataList columns="multi">
          {step.connectionName !== undefined ? (
            // A MESMA pergunta em dois bancos dá respostas diferentes: sem a
            // conexão, o número não quer dizer nada.
            <MetadataListItem label="Conexão">{step.connectionName}</MetadataListItem>
          ) : null}
          {step.rowCount !== undefined ? (
            <MetadataListItem label="Linhas retornadas">
              {formatCount(step.rowCount)}
            </MetadataListItem>
          ) : null}
          {step.durationMs !== undefined ? (
            <MetadataListItem label="Duração">
              {formatDuration(step.durationMs)}
            </MetadataListItem>
          ) : null}
        </MetadataList>
      ) : null}

      {step.sql ? (
        // `tokenizer`: o realce embutido do DS não conhece SQL (cobre bash,
        // css, html, js, json, jsx, python, tsx, ts). Sem ele a query sai como
        // texto cru — e é justamente a peça que o auditor precisa LER com
        // atenção. `tokenizeSql` é a mesma função que pinta o DDL no explorador
        // de schema, agora em `shared/` por ser usada por duas features.
        //
        // O selo de linguagem FICA, apesar de soar redundante ao lado de "SQL
        // executado": no DS ele é também o nome acessível do bloco
        // (`aria-label`). Sem ele o leitor de tela anuncia um "Código" genérico
        // e a informação de que aquilo é SQL se perde — trocar acessibilidade
        // por um pedaço de estética não vale.
        <CodeBlock
          code={step.sql}
          language="sql"
          title="SQL executado"
          tokenizer={tokenizeSql}
          hasCopyButton
          isWrapped
          size="sm"
          width="100%"
        />
      ) : null}

      {step.preview ? <StepPreview preview={step.preview} /> : null}
    </VStack>
  );
}
