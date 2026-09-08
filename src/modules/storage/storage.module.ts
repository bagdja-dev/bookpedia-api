import { Module } from '@nestjs/common';

import { StorageClientService } from './storage-client.service';

/**
 * Client ke `bagdja-storage-service` — pola sama seperti
 * `bagdja-auction-api/src/modules/storage/storage.module.ts`. Diekspor
 * supaya `UploadsModule` bisa reuse `StorageClientService`.
 */
@Module({
  providers: [StorageClientService],
  exports: [StorageClientService],
})
export class StorageModule {}
