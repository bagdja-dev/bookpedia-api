import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProfileService } from '../user/auth-profile.service';
import { randomUUID } from 'node:crypto';

export interface PlatformBuildDispatchResponse {
  jobId?: string;
  status?: string;
  externalJobId?: string | null;
}

export interface BuilderJobStatusResponse {
  id: string;
  status: string;
  progress: number;
  stage: string | null;
  buildType?: 'release' | 'debug' | null;
  outputFormat?: 'aab' | 'apk' | null;
  artifactUrl: string | null;
  logUrl: string | null;
  errorMessage: string | null;
  updatedAt: string;
  createdAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  platformId?: string;
}

@Injectable()
export class BuildQueueService {
  private readonly logger = new Logger(BuildQueueService.name);
  private readonly builderUrl: string;
  private readonly callerAppId: string;

  constructor(
    config: ConfigService,
    private readonly authProfile: AuthProfileService,
  ) {
    this.builderUrl = (config.get<string>('TWA_BUILDER_URL') ?? 'http://localhost:4010').replace(/\/$/, '');
    this.callerAppId = config.get<string>('CLIENT_APP_ID') ?? '';
  }

  async enqueue(request: { tenantId: string; platformId: string; payload: Record<string, unknown> }) {
    const idempotencyKey = randomUUID();
    const response = await this.request('/build-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        source: this.callerAppId,
        appId: this.callerAppId,
        tenantId: request.tenantId,
        platformId: request.platformId,
        payload: request.payload,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadGatewayException(`TWA Builder rejected the build request: ${response.status} ${body}`);
    }

    const data = (await response.json()) as PlatformBuildDispatchResponse;

    this.logger.log(
      `Build request dispatched to TWA Builder. Builder job: ${data.jobId ?? data.externalJobId ?? 'unknown'}`,
    );

    return {
      jobId: data.jobId ?? data.externalJobId,
      status: data.status ?? 'queued',
      externalJobId: data.externalJobId ?? data.jobId ?? null,
    };
  }

  async listJobs(platformId: string, tenantId: string): Promise<BuilderJobStatusResponse[]> {
    const query = new URLSearchParams({ platformId, tenantId });
    const response = await this.request(`/build-jobs?${query.toString()}`);
    if (!response.ok) {
      const body = await response.text();
      throw new BadGatewayException(`TWA Builder history request failed: ${response.status} ${body}`);
    }
    return response.json() as Promise<BuilderJobStatusResponse[]>;
  }

  async getStatus(externalJobId: string): Promise<BuilderJobStatusResponse> {
    const response = await this.request(`/build-jobs/${encodeURIComponent(externalJobId)}/status`);
    if (!response.ok) {
      const body = await response.text();
      throw new BadGatewayException(`TWA Builder status request failed: ${response.status} ${body}`);
    }
    return response.json() as Promise<BuilderJobStatusResponse>;
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.callerAppId) {
      throw new BadGatewayException('CLIENT_APP_ID is not configured for TWA Builder access');
    }
    const token = await this.authProfile.getClientToken();
    if (!token) {
      throw new BadGatewayException('Bookpedia client credentials could not obtain a Builder access token');
    }

    try {
      return await fetch(`${this.builderUrl}${path}`, {
        ...init,
        headers: { ...(init.headers as Record<string, string>), 'x-api-token': token },
      });
    } catch {
      throw new BadGatewayException('TWA Builder service is unreachable');
    }
  }
}
