import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatTopicResponse {
  id: string;
  appId: string;
  orgId: string;
  type: string;
}

export interface ChatMessageResponse {
  id: string;
  topicId: string;
  senderUserId: string;
  senderDisplayName: string | null;
  senderAvatarUrl: string | null;
  body: string;
  parentMessageId: string | null;
  threadRootMessageId: string;
  replyCount: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface ChatMessageListResponse {
  items: ChatMessageResponse[];
  total: number;
}

/** Respons `POST /topics/direct` — get-or-create idempoten, lihat chat-service/overview.md §4.3.1. */
export interface ChatDirectTopicResponse {
  id: string;
  appId: string;
  orgId: string;
  type: string;
  accessMode: string;
  dmKey: string;
}

/** Respons `POST /topics/read-state` (batch) & item hasil `POST /topics/:id/read` — Fase 3.5 (Status Baca). */
export interface ChatReadStateItem {
  topicId: string;
  lastReadMessageId: string | null;
  unreadCount: number;
}

/**
 * Client proxy ke `bagdja-chat-service` — pola auth PORT PERSIS
 * `StorageClientService` (exchange `CLIENT_APP_ID`/`CLIENT_APP_SECRET` yang
 * SUDAH teregistrasi untuk `bagdja-bookpedia` jadi `x-api-token` berumur
 * pendek via `POST {BAGDJA_AUTH_API}/auth/client`, TIDAK pakai API key statis
 * di `.env`). Sebelumnya pakai `CHAT_SERVICE_API_KEY` statis yang dikirim
 * sebagai `x-api-key` — itu SALAH: `ClientAppGuard` di chat-service memvalidasi
 * token ke `bagdja-auth` (`GET /auth/client/me`), yang cuma menerima token
 * hasil exchange resmi (berumur pendek, sesuai `expires_in`), bukan string
 * statis buatan sendiri — makanya selalu gagal dengan "Invalid or expired
 * token". Lihat plan/chat-service/execution-plan.md §0.4.
 */
@Injectable()
export class ChatServiceClient {
  private readonly logger = new Logger(ChatServiceClient.name);
  private readonly baseUrl: string;
  private readonly authApiUrl: string;
  private readonly clientAppId: string;
  private readonly clientAppSecret: string;
  private readonly appId: string;
  private readonly orgId: string;
  private readonly eventServiceUrl: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (config.get<string>('CHAT_SERVICE_URL') ?? 'http://localhost:3008').replace(/\/$/, '');
    this.authApiUrl = (config.get<string>('BAGDJA_AUTH_API') ?? 'http://localhost:4001').replace(/\/$/, '');
    this.clientAppId = config.get<string>('CLIENT_APP_ID') ?? '';
    this.clientAppSecret = config.get<string>('CLIENT_APP_SECRET') ?? '';
    this.appId = config.get<string>('CLIENT_APP_ID', 'bagdja-bookpedia');
    this.orgId = config.get<string>('CHAT_SERVICE_ORG_ID', 'bagdja');
    this.eventServiceUrl = (config.get<string>('EVENT_SERVICE_URL') ?? 'http://localhost:4085').replace(/\/$/, '');
  }

  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60_000) {
      return this.tokenCache.token;
    }

    if (!this.clientAppId || !this.clientAppSecret) {
      throw new BadGatewayException('CLIENT_APP_ID or CLIENT_APP_SECRET is not configured');
    }

    const response = await fetch(`${this.authApiUrl}/auth/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.clientAppId, app_secret: this.clientAppSecret }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadGatewayException(`Failed to get auth token: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { 'x-api-token': string; expires_in?: number };
    const token = data['x-api-token'];
    const expiresIn = data.expires_in || 3600;
    this.tokenCache = { token, expiresAt: now + expiresIn * 1000 };
    return token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let token: string;
    try {
      token = await this.getAuthToken();
    } catch (error) {
      this.logger.error('Failed to obtain client token for chat-service', error);
      throw new BadGatewayException('Failed to authenticate with auth service');
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': token,
          ...(options.headers ?? {}),
        },
      });

      const body = await response.text();
      let parsed: unknown = null;
      try {
        parsed = body ? JSON.parse(body) : null;
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        this.logger.error(`Chat service ${options.method ?? 'GET'} ${path} failed with ${response.status}`);
        throw new BadGatewayException('Chat service request failed');
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      this.logger.error(`Chat service ${options.method ?? 'GET'} ${path} failed`, error);
      throw new BadGatewayException('Chat service is unavailable');
    }
  }

  async createCommentTopic(createdByUserId: string): Promise<ChatTopicResponse> {
    return this.request<ChatTopicResponse>('/topics', {
      method: 'POST',
      body: JSON.stringify({
        type: 'comment',
        createdByUserId,
      }),
    });
  }

  async listMessages(topicId: string, limit = 20, offset = 0): Promise<ChatMessageListResponse> {
    return this.request<ChatMessageListResponse>(
      `/topics/${encodeURIComponent(topicId)}/messages?limit=${limit}&offset=${offset}`,
    );
  }

  /** Ambil satu pesan by id — dipakai reader app untuk append realtime tanpa refetch daftar penuh. */
  async getMessage(topicId: string, messageId: string): Promise<ChatMessageResponse> {
    return this.request<ChatMessageResponse>(`/topics/${encodeURIComponent(topicId)}/messages/${encodeURIComponent(messageId)}`);
  }

  async listReplies(topicId: string, messageId: string): Promise<ChatMessageResponse[]> {
    return this.request<ChatMessageResponse[]>(
      `/topics/${encodeURIComponent(topicId)}/messages/${encodeURIComponent(messageId)}/replies`,
    );
  }

  async createMessage(
    topicId: string,
    input: {
      senderUserId: string;
      senderDisplayName?: string | null;
      senderAvatarUrl?: string | null;
      body: string;
      parentMessageId?: string | null;
    },
  ): Promise<ChatMessageResponse> {
    return this.request<ChatMessageResponse>(`/topics/${encodeURIComponent(topicId)}/messages`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Get-or-create idempoten sebuah Topic `type=private, accessMode=direct`
   * by `dmKey` — dipakai Inbox/DM (peer maupun Library), lihat
   * chat-service/overview.md §4.3.1. `dmKey` opaque buat chat-service,
   * rumusnya diputuskan `InboxService` (lihat komentar di sana).
   */
  async createDirectTopic(input: {
    dmKey: string;
    participantUserIds: string[];
    name?: string;
    createdByUserId: string;
  }): Promise<ChatDirectTopicResponse> {
    return this.request<ChatDirectTopicResponse>('/topics/direct', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /** Tambah partisipan langsung ke Topic private/direct (tanpa invite) — dipakai sinkron staff Library nanti. */
  async addDirectParticipant(topicId: string, userId: string, email?: string | null): Promise<void> {
    await this.request(`/topics/${encodeURIComponent(topicId)}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId, email: email ?? undefined }),
    });
  }

  /** Hapus partisipan dari Topic private/direct — dipakai sinkron staff Library nanti. */
  async removeDirectParticipant(topicId: string, userId: string): Promise<void> {
    await this.request(`/topics/${encodeURIComponent(topicId)}/participants/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  }

  async deleteMessage(topicId: string, messageId: string, requesterUserId: string): Promise<ChatMessageResponse> {
    return this.request<ChatMessageResponse>(
      `/topics/${encodeURIComponent(topicId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ requesterUserId }),
      },
    );
  }

  /** Tandai Topic sudah dibaca `userId` sampai pesan terbaru saat ini — Fase 3.5. */
  async markTopicRead(topicId: string, userId: string): Promise<{ topicId: string; lastReadMessageId: string | null }> {
    return this.request(`/topics/${encodeURIComponent(topicId)}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * BATCH `lastReadMessageId`+`unreadCount` buat banyak Topic sekaligus —
   * Fase 3.5, dipakai `GET /inbox`/`GET /library/inbox` supaya tidak N+1
   * (satu panggilan buat SEMUA percakapan, bukan satu per percakapan).
   */
  async getReadState(userId: string, topicIds: string[]): Promise<ChatReadStateItem[]> {
    if (topicIds.length === 0) {
      return [];
    }
    return this.request<ChatReadStateItem[]>('/topics/read-state', {
      method: 'POST',
      body: JSON.stringify({ userId, topicIds }),
    });
  }

  async getCommentCountForTopic(topicId: string): Promise<number> {
    const response = await this.listMessages(topicId, 1000, 0);
    return response.items.reduce((sum, item) => sum + item.replyCount + 1, 0);
  }

  async getRealtimeWsToken(): Promise<{ access_token: string; expires_in: number; channels: string[] }> {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.eventServiceUrl}/subscriptions/token`, {
      method: 'POST',
      headers: { 'x-api-key': token, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadGatewayException(`Failed to get realtime token: ${response.status} ${errorText}`);
    }

    return (await response.json()) as { access_token: string; expires_in: number; channels: string[] };
  }

  getClientAppId(): string {
    return this.appId;
  }

  getOrgId(): string {
    return this.orgId;
  }
}
