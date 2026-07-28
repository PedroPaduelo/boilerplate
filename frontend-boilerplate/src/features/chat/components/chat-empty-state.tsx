/**
 * Conversa vazia: boas-vindas + sugestões clicáveis.
 *
 * Clicar já ENVIA a pergunta (um clique em vez de "preencher e depois enviar"):
 * o objetivo é tirar o usuário do branco da página no menor número de passos.
 *
 * A descrição promete o ciclo inteiro — evidência na tela e gráfico pronto para
 * virar dashboard —, e cada cartão nomeia uma capacidade diferente do agente,
 * para que a promessa venha com exemplos do que pedir.
 */
import { Bot } from 'lucide-react';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { SUGGESTED_PROMPTS } from '../lib/suggested-prompts';

export interface ChatEmptyStateProps {
  onPick: (prompt: string) => void;
  /** Sem agente configurado não adianta sugerir: os cartões ficam inativos. */
  isDisabled?: boolean;
}

/** `ClickableCard` não tem tooltip: o motivo do bloqueio vira texto visível. */
const DISABLED_REASON =
  'As sugestões ficam inativas enquanto o agente estiver indisponível.';

export function ChatEmptyState({ onPick, isDisabled = false }: ChatEmptyStateProps) {
  return (
    /**
     * `maxWidth={720}` e não 640: a grade de cartões abaixo tem duas colunas e
     * ocupava ~660px, enquanto o texto ficava preso em 410px — o bloco de
     * abertura era MAIS ESTREITO que o menu que ele apresenta, e o título de
     * 28px quebrava em "investigar / hoje?" sem necessidade. Um eixo só para
     * os dois.
     */
    // `app-chat-empty` é o gancho que centraliza o bloco no eixo vertical
    // enquanto a conversa está vazia (ver `.app-chat` em app/index.css).
    // `gap={8}` e não 7: a escala de espaçamento do tema é discreta
    // (0, .5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10) e 7 não existe nela.
    <VStack
      className="app-chat-empty"
      gap={8}
      hAlign="center"
      maxWidth={720}
      width="100%"
    >
      {/**
       * Escrito à mão em vez do `EmptyState` do DS. Aquele componente desenha
       * um CARD (fundo + borda), porque foi feito para ocupar o vazio DENTRO
       * de um painel — uma tabela sem resultados, uma listagem vazia. Aqui ele
       * é a abertura da tela inteira, e a moldura só apertava o texto contra
       * as bordas, criando uma caixa cinza no meio de uma área livre.
       */}
      <VStack gap={3} hAlign="center">
        <Icon icon={Bot} size="lg" color="accent" />
        {/**
         * O `style` aqui é o ÚNICO caminho que funciona, e isso foi verificado
         * na tela antes de escrever a linha:
         *
         *   prop `type="display-2"` .... aplica `data-type` e a classe, mas o
         *                                tamanho continua o do `level` (19px).
         *                                Bug do DS nesta versão (0.1.8).
         *   CSS em `@layer` ............ perde: as classes atômicas do StyleX
         *                                são injetadas FORA de layer, e regra
         *                                em layer nunca ganha delas.
         *   utility do Tailwind ........ mesmo motivo — também vive em layer.
         *   `style` inline ............. funciona.
         *   `xstyle` ................... inerte (sem compilador StyleX aqui).
         *
         * Não é valor mágico: o tamanho vem do MESMO token que o `display-2`
         * usaria. O `level={2}` preserva o `h2` semântico para o leitor de tela.
         */}
        <Heading
          level={2}
          justify="center"
          textWrap="balance"
          style={{ fontSize: 'var(--text-display-2-size)', lineHeight: 1.2 }}
        >
          O que você quer investigar hoje?
        </Heading>
        {/* `textWrap="balance"` reparte as linhas por igual em vez de deixar
            uma órfã curta na última — some o efeito de texto "picado". */}
        <Text type="supporting" justify="center" textWrap="balance">
          Pergunte em português. O agente lê o schema das suas conexões, escreve o SQL,
          mostra a evidência de cada passo e devolve a resposta — com o gráfico pronto
          para salvar num dashboard.
        </Text>
      </VStack>

      <Grid columns={{ minWidth: 260, max: 2 }} gap={3} width="100%">
        {SUGGESTED_PROMPTS.map(({ icon, title, prompt }) => (
          <ClickableCard
            key={title}
            label={title}
            padding={3}
            isDisabled={isDisabled}
            onClick={() => onPick(prompt)}
          >
            <HStack gap={3} vAlign="start">
              <Icon icon={icon} size="sm" color="accent" />
              <VStack gap={0.5}>
                <Text type="label">{title}</Text>
                {/* O texto do cartão É a pergunta enviada: três linhas para que
                    ela caiba sem cortar o que o usuário está prestes a pedir. */}
                <Text type="supporting" maxLines={3}>
                  {prompt}
                </Text>
              </VStack>
            </HStack>
          </ClickableCard>
        ))}
      </Grid>

      {isDisabled ? (
        <Text type="supporting" role="status">
          {DISABLED_REASON}
        </Text>
      ) : null}
    </VStack>
  );
}
