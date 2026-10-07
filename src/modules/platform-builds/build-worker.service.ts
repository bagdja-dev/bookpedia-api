import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BuildWorkerService {
  private readonly logger = new Logger(BuildWorkerService.name);

  async syncStatus() {
    this.logger.log('Build worker placeholder ready for TWA builder integration');
    return { ok: true, mode: 'bookpedia-bridge' };
  }
}
