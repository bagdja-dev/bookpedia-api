import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { KeystorePasswordsDto } from './keystore-passwords.dto';

/** Field multipart saat upload JKS (`file` dikirim terpisah). Password disimpan terenkripsi. */
export class CreatePlatformKeystoreProfileDto extends KeystorePasswordsDto {
  @ApiProperty({ example: 'Novello Play signing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: 'novello-release', description: 'Alias key di dalam JKS.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  alias: string;
}
