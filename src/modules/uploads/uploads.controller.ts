import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/auth';
import { UploadsService } from './uploads.service';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';

/** Batas ukuran gambar cover Library/Book — sama dengan yang dipakai frontend (bookpedia-studio). */
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Endpoint upload gambar generik (cover Library, nanti Book) — hanya
 * menyimpan file & mengembalikan URL, TIDAK terikat ke resource manapun
 * (pola PERSIS `POST /api/uploads/asset` di `bagdja-auction-api`, disederhanakan
 * karena Bookpedia cuma butuh kategori gambar, tidak ada video/model 3D). Guard
 * cuma `JwtAuthGuard` — kepemilikan/keterkaitan ke Library/Book divalidasi
 * saat URL hasil upload disimpan lewat endpoint create/update Library/Book.
 */
@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @ApiOperation({
    summary: 'Upload gambar cover Library/Book ke bagdja-storage-service',
    description:
      'Validasi tipe & ukuran file dilakukan di sini (storage-service tidak validasi apapun). ' +
      `Gambar (${IMAGE_MIME_TYPES.join(', ')}) maks 5MB.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: {
          type: 'string',
          description: "Kind/metadata di storage-service, mis. 'libraries'/'books', default: 'libraries'",
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: UploadImageResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException('File wajib diunggah');
    }

    this.assertIsImage(file);

    return this.uploadsService.uploadImage(file, folder || 'libraries');
  }

  private assertIsImage(file: Express.Multer.File): void {
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipe file tidak didukung (mime: '${file.mimetype}', nama: '${file.originalname}'). ` +
          `Gunakan gambar (${IMAGE_MIME_TYPES.join(', ')}).`,
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `Ukuran file (${(file.size / (1024 * 1024)).toFixed(2)}MB) melebihi batas maksimal ` +
          `${(MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB.`,
      );
    }
  }
}
