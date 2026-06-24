/**
 * API de conversas do agent — CRUD + chat SSE.
 */
import { apiClient } from '@/shared/lib/api-client';
import { env } from '@/shared/lib/env';
import { useAuthStore } from '@/features/auth/store';

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessageRecord[];
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  role: string;
  content: string;
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
    const { data } = await apiClient.get<Conversation>(
      `/agent/conversations/${id}`,
    );
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/agent/conversations/${id}`);
  },

  async updateConversation(id: string, title: string): Promise<Conversation> {
    const { data } = await apiClient.patch<Conversation>(
      `/agent/conversations/${id}`,
      { title },
    );
    return data;
  },

  async checkHealth(): Promise<{ configured: boolean; model: string }> {
    const { data } = await apiClient.get('/agent/health');
    return data;
  },
};
