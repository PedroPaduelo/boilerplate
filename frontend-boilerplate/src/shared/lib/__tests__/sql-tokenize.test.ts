import { describe, it, expect } from 'vitest';
import { tokenizeSql, type SqlToken } from '../sql-tokenize';

/** Reconstrói o texto a partir dos tokens. */
const reconstituir = (tokens: SqlToken[]) => tokens.map((t) => t.text).join('');
/** Tipo atribuído ao trecho exato informado. */
const tipoDe = (tokens: SqlToken[], texto: string) =>
  tokens.find((t) => t.text === texto)?.kind;

describe('tokenizeSql', () => {
  it('NUNCA perde ou altera caractere (o texto tem de sair idêntico)', () => {
    const ddl = [
      'CREATE TABLE "public"."conversations" (',
      '  "id" uuid NOT NULL DEFAULT gen_random_uuid(),',
      '  "preco" numeric(10,2) DEFAULT 0.5,',
      '  "rotulo" text DEFAULT \'oi, tudo bem\',',
      '  CONSTRAINT "pk_conversations" PRIMARY KEY ("id")',
      ');',
    ].join('\n');

    expect(reconstituir(tokenizeSql(ddl))).toBe(ddl);
  });

  it('classifica os elementos do DDL gerado pelo app', () => {
    const t = tokenizeSql(
      'CREATE TABLE "public"."users" (\n  "id" uuid NOT NULL DEFAULT gen_random_uuid()\n);',
    );

    expect(tipoDe(t, 'CREATE')).toBe('keyword');
    expect(tipoDe(t, 'TABLE')).toBe('keyword');
    expect(tipoDe(t, '"public"')).toBe('identifier');
    expect(tipoDe(t, '"users"')).toBe('identifier');
    expect(tipoDe(t, 'uuid')).toBe('type');
    expect(tipoDe(t, 'gen_random_uuid')).toBe('function');
    // Pontuação vizinha é MESCLADA num token só (menos nós no DOM), então o
    // fecha-parênteses e o ponto e vírgula finais saem juntos como ");".
    expect(tipoDe(t, ');')).toBe('punctuation');
  });

  it('mescla tokens vizinhos do mesmo tipo em vez de gerar um span por caractere', () => {
    const t = tokenizeSql('"a" int, "b" int);');
    const pontuacoes = t.filter((x) => x.kind === 'punctuation');

    // ");" é um único token, não dois.
    expect(pontuacoes.some((p) => p.text === ');')).toBe(true);
    expect(pontuacoes.every((p) => p.text.length >= 1)).toBe(true);
  });

  it('não quebra identificador que contém palavra reservada ou espaço', () => {
    // Uma coluna pode se chamar "table" ou "primary key" — dentro das aspas é
    // NOME, não palavra reservada. Tokenizador ingênuo pinta errado aqui.
    const t = tokenizeSql('CREATE TABLE "primary key" ("table" text);');

    expect(tipoDe(t, '"primary key"')).toBe('identifier');
    expect(tipoDe(t, '"table"')).toBe('identifier');
    // O CREATE/TABLE de fora seguem sendo palavras reservadas.
    expect(tipoDe(t, 'CREATE')).toBe('keyword');
  });

  it('entende aspas escapadas dentro do identificador', () => {
    const ddl = 'CREATE TABLE "diz ""oi""" ("x" int);';
    const t = tokenizeSql(ddl);

    expect(reconstituir(t)).toBe(ddl);
    expect(tipoDe(t, '"diz ""oi"""')).toBe('identifier');
  });

  it('trata literal de texto como string, não como identificador', () => {
    const t = tokenizeSql('"status" text DEFAULT \'aberto\'');

    expect(tipoDe(t, "'aberto'")).toBe('string');
    expect(tipoDe(t, '"status"')).toBe('identifier');
  });

  it('suporta os outros estilos de citação (SQL Server e MySQL)', () => {
    expect(tipoDe(tokenizeSql('CREATE TABLE [dbo].[users] ('), '[dbo]')).toBe(
      'identifier',
    );
    expect(tipoDe(tokenizeSql('CREATE TABLE `app`.`users` ('), '`app`')).toBe(
      'identifier',
    );
  });

  it('reconhece números, inclusive decimais', () => {
    const t = tokenizeSql('"preco" numeric(10,2) DEFAULT 0.5');

    expect(tipoDe(t, '10')).toBe('number');
    expect(tipoDe(t, '0.5')).toBe('number');
  });

  it('aguenta entrada vazia e texto sem SQL nenhum', () => {
    expect(tokenizeSql('')).toEqual([]);
    expect(reconstituir(tokenizeSql('¯\\_(ツ)_/¯'))).toBe('¯\\_(ツ)_/¯');
  });
});
