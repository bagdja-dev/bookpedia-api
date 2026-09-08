import { ApiProperty } from '@nestjs/swagger';

/**
 * Response `POST /uploads/image` — direduksi dari `StorageFileResponse`
 * mentah `bagdja-storage-service`. Shape SAMA PERSIS dengan
 * `UploadAssetResponseDto` di `bagdja-auction-api` — kontrak yang dipakai
 * frontend (novelo-studio), JANGAN diubah.
 */
export class UploadImageResponseDto {
  @ApiProperty({
    example: 'https://storage.bagdja.com/novelo-assets/libraries/abc123.jpg',
    description: 'URL publik file, siap dipakai langsung (mis. field coverUrl Library/Book)',
  })
  url: string;

  @ApiProperty({
    example: 'libraries/abc123.jpg',
    description: 'Key/path file di storage-service',
  })
  path: string;
}
