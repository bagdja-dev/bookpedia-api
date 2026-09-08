import { Injectable } from '@nestjs/common';

import { StorageClientService } from '../storage/storage-client.service';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageClientService) {}

  async uploadImage(file: Express.Multer.File, folder: string): Promise<UploadImageResponseDto> {
    return this.storage.uploadFile(file.buffer, file.originalname, file.mimetype, folder);
  }
}
