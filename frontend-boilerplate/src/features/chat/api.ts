/**
 * API de conversas do agent — CRUD do histórico.
 *
 * O turno em si não passa por aqui: ele é disparado por POST e chega pela sala
 * do socket (`transport/socket-transport.ts`). O que este arquivo entrega é o
 * histórico — e, com ele, a TRILHA DE AUDITORIA já persistida.
 */
import { apiClient } from '@/shared/lib/api-client';
import type { TrailSourceRecord } from './lib/chat-tools';

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessageRecord[];
}

/**
 * Uma mensagem como o banco a devolve.
 *
 * `extends TrailSourceRecord` não é enfeite: amarra em tipo o fato de que este
 * registro é a FONTE da trilha de auditoria. Quem mexer nos campos abaixo
 * quebra o build em vez de quebrar a auditoria silenciosamente — que foi
 * exatamente o que aconteceu com `toolData`, gravado desde sempre e lido por
 * ninguém.
 */
export interface ChatMessageRecord extends TrailSourceRecord {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  /**
   * Trilha do turno. Dois formatos convivem:
   * - NOVO: `{steps, artifacts, usage}`;
   * - ANTIGO: `[{toolCallId, toolName, args, output}]` (conversas já existentes).
   * Quem entende os dois é `readPersistedTrail` — a tela nunca vê este `unknown`.
   */
  toolData: unknown;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: string;
}

export const agentApi = {
  async listConversations(): Promise<Conversation[]> {
    const { data } = await apiClient.get<{ conversations: Conversation[] }>(
      '/agent/conversations',
    );
    return data.conversations;
  },

  async createConversation(title?: string): Promise<Conversation> {
    const { data } = await apiClient.post<Conversation>('/agent/conversations', {
      title,
    });
    return data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await apiClient.get<Conversation>(`/agent/conversations/${id}`);
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/agent/conversations/${id}`);
  },

  async updateConversation(id: string, title: string): Promise<Conversation> {
    const { data } = await apiClient.patch<Conversation>(`/agent/conversations/${id}`, {
      title,
    });
    return data;
  },

  async checkHealth(): Promise<{ configured: boolean; model: string }> {
    const { data } = await apiClient.get('/agent/health');
    return data;
  },
};
