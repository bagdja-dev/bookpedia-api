import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Notification } from '../../entities/notification.entity';

const NOTIFICATION_EVENT_NAME = 'bookpedia.notification.created';

@Injectable()
export class NotificationEventBroadcasterService {
  private readonly logger = new Logger(NotificationEventBroadcasterService.name);
  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private readonly config: ConfigService) {}

  async broadcast(notification: Notification): Promise<void> {
    const token = await this.getApiToken();
    if (!token) return;

    const eventServiceUrl = (this.config.get<string>('EVENT_SERVICE_URL') ?? 'http://localhost:4085').replace(/\/$/, '');
    const orgId = this.config.get<string>('EVENT_ORG_ID') ?? this.config.get<string>('ORG_ID') ?? 'bagdja';
    const appId = this.config.get<string>('EVENT_APP_ID') ?? this.config.get<string>('CLIENT_APP_ID') ?? 'bagdja-bookpedia';
    const data = {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      ...(notification.actionLabel ? { actionLabel: notification.actionLabel } : {}),
      actionUrl: notification.actionUrl,
      ...(notification.entityType ? { entityType: notification.entityType } : {}),
      ...(notification.entityId ? { entityId: notification.entityId } : {}),
      createdAt: notification.createdAt.toISOString(),
    };

    try {
      const response = await fetch(`${eventServiceUrl}/broadcast`, {
        method: 'POST',
        headers: { 'x-api-key': token, 'Content-Type': 'application/json' },
        // Bookpedia's WS token is app-level (client-credentials, see
        // ChatServiceClient.getRealtimeWsToken), not per-user, so every
        // connected socket authenticates with the SAME `sub` in Event
        // Service (the registered app id). `filters.userId` is matched by
        // Event Service against each socket's own JWT `sub`/`id`
        // (EventsGateway.sendEventToChannel), which can never equal a real
        // end-user id here — the event would silently never reach any
        // browser. Broadcast unfiltered instead (same pattern chat-service
        // already uses for `bagdja.chat.message.created`) and let
        // RealtimeProvider filter client-side by `data.userId`.
        body: JSON.stringify({
          orgId,
          appId,
          eventName: NOTIFICATION_EVENT_NAME,
          data,
          // Event Service currently accepts this development signature. A registered
          // production public key must replace it before production broadcasting.
          signature: this.config.get<string>('EVENT_SIGNATURE') ?? 'mock-signature-for-dev',
        }),
      });

      if (!response.ok) {
        this.logger.error(`Notification broadcast rejected: ${response.status} ${await response.text()}`);
        return;
      }

      this.logger.debug(`Notification ${notification.id} broadcast successfully`);
    } catch (error) {
      this.logger.error(`Notification broadcast failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getApiToken(): Promise<string | null> {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiry > now + 60_000) return this.cachedToken;

    const authApiUrl = (this.config.get<string>('BAGDJA_AUTH_API') ?? 'http://localhost:4001').replace(/\/$/, '');
    const clientAppId = this.config.get<string>('CLIENT_APP_ID');
    const clientAppSecret = this.config.get<string>('CLIENT_APP_SECRET');
    if (!clientAppId || !clientAppSecret) {
      this.logger.warn('CLIENT_APP_ID/CLIENT_APP_SECRET missing; notification broadcast skipped');
      return null;
    }

    try {
      const response = await fetch(`${authApiUrl}/auth/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: clientAppId, app_secret: clientAppSecret }),
      });
      if (!response.ok) throw new Error(`Auth failed: ${response.status}`);

      const data = (await response.json()) as { 'x-api-token'?: string; expires_in?: number };
      if (!data['x-api-token']) throw new Error('Auth response missing x-api-token');
      this.cachedToken = data['x-api-token'];
      this.tokenExpiry = now + (data.expires_in ?? 3600) * 1000;
      return this.cachedToken;
    } catch (error) {
      this.logger.error(`Failed to obtain Event Service token: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}
