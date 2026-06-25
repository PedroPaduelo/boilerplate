/**
 * Cliente da Evolution API v2 — POST `/message/sendText/{instance}`.
 *
 * DECISÃO: erros são LOGADOS e o método retorna `{ key: null }` em vez de
 * propagar exceção. Razão: o canal de WhatsApp é FIRE-AND-FORGET no
 * webhook (a mensagem do usuário já foi persistida ANTES). Se a Evolution
 * está fora, NÃO queremos queimar o handler — o operador vê o log e a
 * mensagem fica no DB pra reenvio manual posterior. Quem chama o
 * `sendText` é o `processWhatsappMessage` (handler T3), que por sua vez
 * já tem `try/catch` em volta.
 *
 * SINGLETON: `evolutionClient` é exportado para reuso direto sem precisar
 * instanciar a cada chamada (a classe é stateless, mas o axios instance
 * tem `baseURL`/`headers`/`timeout` que valem a pena cachear).
 *
 * Documentação: https://docs.evolutionfoundation.com.br/evolution-api/
 */

import axios, { type AxiosInstance, isAxiosError } from 'axios';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import type { SendTextResult } from './types';

const TIMEOUT_MS = 10_000;

export interface SendTextInput {
  /** Telefone no formato que a Evolution espera (ex.: "5562999999999"). */
  number: string;
  /** Texto da mensagem (já tratado: 4000 chars máx + sufixo "(continua...)"). */
  text: string;
}

/**
 * Cliente HTTP fino sobre a Evolution API. Stateless — armazena só o
 * `AxiosInstance` configurado (baseURL, headers, timeout). Métodos
 * cobrem o subconjunto que usamos no MVP (apenas sendText).
 */
export class EvolutionClient {
  private readonly http: AxiosInstance | null;

  constructor() {
    if (!env.EVOLUTION_API_URL || !env.EVOLUTION_APIKEY) {
      this.http = null;
      return;
    }
    this.http = axios.create({
      baseURL: env.EVOLUTION_API_URL,
      headers: {
        apikey: env.EVOLUTION_APIKEY,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT_MS,
    });
  }

  /**
   * Envia uma mensagem de texto. Retorna `{ key: { id } }` em sucesso
   * (o `id` é o id da mensagem no WhatsApp, devolvido pela Evolution) ou
   * `{ key: null }` em erro (rede, 4xx/5xx, sem env configurada).
   *
   * Erros são logados com `logger.error` (nunca propagados). Quem chamou
   * continua o fluxo — a mensagem do usuário JÁ foi persistida.
   */
  async sendText({ number, text }: SendTextInput): Promise<SendTextResult> {
    if (!this.http || !env.EVOLUTION_INSTANCE) {
      logger.error(
        { number, textLength: text.length },
        'evolution sendText called without env configured'
      );
      return { key: null };
    }

    const url = `/message/sendText/${env.EVOLUTION_INSTANCE}`;
    const body = { number, text };

    try {
      const res = await this.http.post(url, body);
      const key = (res.data?.key ?? null) as { id: string } | null;
      return { key: key && typeof key.id === 'string' ? { id: key.id } : null };
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const axiosMsg = isAxiosError(err) ? err.message : undefined;
      logger.error(
        {
          err,
          number,
          textLength: text.length,
          status,
          axiosMsg,
        },
        'evolution sendText failed'
      );
      return { key: null };
    }
  }

  /**
   * Busca mensagens recentes da instância (fallback ao webhook). A Evolution
   * v2.3.7 às vezes NÃO entrega o webhook de mensagens inbound (especialmente
   * de contatos `@lid` — privacidade nova do WhatsApp), embora ARMAZENE a
   * mensagem. O poller usa este método pra puxar as mensagens e processá-las.
   *
   * Endpoint: `POST /chat/findMessages/{instance}`. A resposta pode vir como
   * `{ messages: { records: [...] } }` OU como array direto — normalizamos
   * para sempre devolver um array de records crus.
   *
   * Devolve `[]` em qualquer erro (fail-soft — o poller tenta de novo no
   * próximo tick).
   */
  async findRecentMessages(limit = 20): Promise<Record<string, unknown>[]> {
    if (!this.http || !env.EVOLUTION_INSTANCE) return [];
    const url = `/chat/findMessages/${env.EVOLUTION_INSTANCE}`;
    try {
      const res = await this.http.post(url, { page: 1, offset: limit });
      const data = res.data;
      // Normaliza os formatos conhecidos da Evolution.
      let records: unknown =
        data?.messages?.records ?? data?.records ?? data?.messages ?? data;
      if (!Array.isArray(records)) records = [];
      return records as Record<string, unknown>[];
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      logger.warn({ err, status }, 'evolution findRecentMessages failed (poller will retry)');
      return [];
    }
  }
}

/** Singleton para reuso. Reaproveita o mesmo `AxiosInstance` por processo. */
export const evolutionClient = new EvolutionClient();
