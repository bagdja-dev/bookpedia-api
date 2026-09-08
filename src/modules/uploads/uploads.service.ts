import { Injectable } from '@nestjs/common';

import { StorageClientService } from '../storage/storage-client.service';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import type { UploadedMulterFile } from './uploaded-multer-file.type';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageClientService) {}

  async uploadImage(file: UploadedMulterFile, folder: string): Promise<UploadImageResponseDto> {
    return this.storage.uploadFile(file.buffer, file.originalname, file.mimetype, folder);
  }
}
