-- =============================================================================
-- Chat / Agente de IA: cria as tabelas `conversations` e `chat_messages`.
--
-- Esta migration ESTAVA FALTANDO na history: o `schema.prisma` define os models
-- Conversation/ChatMessage, e a migration posterior
-- (20260625000000_channels_whatsapp_metadata) faz `ALTER TABLE conversations`
-- para adicionar a coluna `metadata` — mas nenhuma migration criava a tabela.
-- Resultado: `prisma migrate deploy` num banco limpo quebrava com
-- `relation "conversations" does not exist` (P3018 / 42P01).
--
-- `conversations` é criada AQUI SEM a coluna `metadata` de propósito: a coluna
-- é adicionada pela migration do canal WhatsApp (a seguir), preservando a
-- history existente sem reescrever migrations já publicadas.
-- =============================================================================

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nova conversa',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tool_data" JSONB,
    "tokens_in" INTEGER,
    "tokens_out" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_created_at_idx" ON "chat_messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
