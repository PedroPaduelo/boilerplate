/**
 * i18n do design system DENTRO do shell.
 *
 * O Astryx só embarca `en.json`. Enquanto o `InternationalizationProvider` não
 * foi montado em `providers.tsx`, todo texto nascido no DS saía em inglês no
 * meio da interface em português — `aria-label="Send"` no botão de enviar do
 * chat, "Copy code" no `CodeBlock`, "Scroll to bottom" no tooltip VISÍVEL do
 * botão de rolagem. Nada disso quebra teste nem estoura em runtime: passa
 * batido em review e só aparece para quem usa (ou para quem depende de leitor
 * de tela). Por isso vale um teste.
 *
 * O que se trava aqui:
 *   1. componente REAL do DS, dentro do `AppProviders` REAL, sai em português —
 *      é o que prova que o provider está no lugar certo da cadeia, e não só que
 *      o catálogo existe;
 *   2. chave que o catálogo não tem DEGRADA PARA INGLÊS em vez de quebrar ou
 *      vazar o nome da chave na tela. Esse é o cenário de uma atualização do DS
 *      que traz chave nova: a tela fica feia num canto, não quebra;
 *   3. o catálogo cobre exatamente as chaves do `en.json` instalado — nem
 *      faltando (texto em inglês na tela), nem inventada (peso morto que nunca
 *      é lido);
 *   4. os placeholders ICU sobrevivem à tradução. `{label}` trocado por
 *      `{rotulo}` não dá erro de compilação: estoura na formatação, em runtime;
 *   5. toda mensagem ainda é ICU válido depois de traduzida — quem formata é o
 *      motor do próprio DS, não uma imitação escrita aqui.
 *
 * SOBRE O MOCK: `../i18n` é mockado com UMA chave a menos para simular o item
 * 2 — é a única forma de produzir o buraco, já que o catálogo real está
 * completo (item 3 garante isso). O mock vale para o arquivo inteiro, então a
 * chave escolhida (`scrollToBottom`) não é usada por nenhum outro caso aqui. Os
 * itens 3 a 5 leem `../i18n/pt-br` direto — outro módulo, fora do mock.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InternationalizationProvider, useTranslator } from '@astryxdesign/core/i18n';
import { ChatLayoutScrollButton, ChatSendButton } from '@astryxdesign/core/Chat';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import enCatalog from '@astryxdesign/core/locales/en.json';
import { AppProviders } from '../providers';
import { APP_LOCALE } from '../i18n';
import { ptBR } from '../i18n/pt-br';

/**
 * Chave que o catálogo mockado NÃO tem — simula chave nova vinda do DS.
 * `vi.hoisted` porque a fábrica do `vi.mock` sobe para o topo do arquivo e não
 * enxerga const declarada depois.
 */
const { CHAVE_SEM_TRADUCAO } = vi.hoisted(() => ({
  CHAVE_SEM_TRADUCAO: '@astryx.chatLayoutScrollButton.scrollToBottom',
}));

vi.mock('../i18n', async (importOriginal) => {
  const original = await importOriginal<typeof import('../i18n')>();
  const catalogoComBuraco = { ...original.ptBR };
  delete catalogoComBuraco[CHAVE_SEM_TRADUCAO];
  return { ...original, dsMessages: { [original.APP_LOCALE]: catalogoComBuraco } };
});

describe('i18n do design system no shell', () => {
  it('traduz o botão de enviar do chat (era aria-label="Send")', () => {
    render(
      <AppProviders>
        <ChatSendButton />
      </AppProviders>,
    );

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('traduz o botão de copiar do CodeBlock (era "Copy code")', () => {
    render(
      <AppProviders>
        <CodeBlock code="select 1;" language="sql" hasCopyButton />
      </AppProviders>,
    );

    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeInTheDocument();
  });

  it('chave que falta no catálogo cai para o inglês do DS, sem quebrar', () => {
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AppProviders>
        <ChatLayoutScrollButton isVisible onClick={() => {}} />
      </AppProviders>,
    );

    // Degradou para o `en.json` embarcado — feio, porém funcional.
    expect(screen.getByRole('button', { name: 'Scroll to bottom' })).toBeInTheDocument();
    // O que NÃO pode acontecer: o nome cru da chave vazar para a tela.
    expect(screen.queryByText(CHAVE_SEM_TRADUCAO)).not.toBeInTheDocument();
    // Fallback para `en` é caminho previsto, não erro: o DS não avisa nada.
    expect(avisos).not.toHaveBeenCalled();

    avisos.mockRestore();
  });
});

describe('catálogo pt-BR', () => {
  const chavesEn = Object.keys(enCatalog);
  const chavesPt = Object.keys(ptBR);

  it('cobre todas as chaves do en.json instalado', () => {
    // Falha aqui = o DS subiu de versão e trouxe chave nova. O app continua de
    // pé (cai para o inglês); o conserto é traduzir a chave listada.
    expect(chavesEn.filter((chave) => !chavesPt.includes(chave))).toEqual([]);
  });

  it('não inventa chave que o DS não usa', () => {
    // Chave com nome errado nunca é lida por ninguém — e ninguém percebe.
    expect(chavesPt.filter((chave) => !chavesEn.includes(chave))).toEqual([]);
  });

  it('preserva os placeholders ICU de cada mensagem', () => {
    const divergentes = chavesEn
      .map((chave) => ({
        chave,
        en: argumentosIcu(mensagemEn(chave)),
        pt: argumentosIcu(ptBR[chave]?.defaultMessage ?? ''),
      }))
      .filter(({ en, pt }) => en.join('|') !== pt.join('|'));

    expect(divergentes).toEqual([]);
  });

  it('formata todas as mensagens sem estourar (ICU válido)', () => {
    // Mensagem sem argumento também passa pelo parser: `values = {}` (e não
    // `undefined`) faz o DS formatar em vez de devolver a string crua. Chaveta
    // sem fechar ou plural mal escrito estoura AQUI, e não na tela do usuário.
    render(
      <InternationalizationProvider locale={APP_LOCALE} messages={{ [APP_LOCALE]: ptBR }}>
        <SondaDeFormatacao />
      </InternationalizationProvider>,
    );

    // Plural em pt-BR resolvido pelo próprio motor do DS, não por concatenação.
    expect(screen.getByTestId('@astryx.powersearch.resultCount')).toHaveTextContent(
      '1 resultado',
    );
  });
});

/** Rende as mensagens JÁ FORMATADAS — é o parser ICU do DS rodando de verdade. */
function SondaDeFormatacao() {
  const traduzir = useTranslator();

  return (
    <>
      {Object.keys(ptBR).map((chave) => (
        <span key={chave} data-testid={chave}>
          {traduzir(chave, valoresFicticios(chave))}
        </span>
      ))}
    </>
  );
}

/** Um valor por argumento que a mensagem em inglês declara. */
function valoresFicticios(chave: string): Record<string, number> {
  return Object.fromEntries(
    argumentosIcu(mensagemEn(chave)).map((argumento) => [argumento, 1]),
  );
}

/** O `en.json` vem tipado como JSON solto; o acesso por chave mora aqui. */
function mensagemEn(chave: string): string {
  return (enCatalog as Record<string, { defaultMessage: string }>)[chave].defaultMessage;
}

/** Ramo de plural/select (`one {item}`) é texto, não argumento. */
const RAMO_PLURAL = /\b(?:zero|one|two|few|many|other|=\d+)\s*$/;
const ARGUMENTO_ICU = /\{\s*(\w+)\s*[,}]/g;

/** Nomes dos argumentos ICU de uma mensagem, ordenados. */
function argumentosIcu(mensagem: string): string[] {
  const nomes = new Set<string>();

  for (const ocorrencia of mensagem.matchAll(ARGUMENTO_ICU)) {
    if (RAMO_PLURAL.test(mensagem.slice(0, ocorrencia.index))) continue;
    nomes.add(ocorrencia[1]);
  }

  return [...nomes].sort();
}
