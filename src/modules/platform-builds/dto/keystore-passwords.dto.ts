import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Password keystore (request: simpan/ubah, response: dibuka untuk dilihat Owner). */
export class KeystorePasswordsDto {
  @ApiProperty({ description: 'Password keystore (JKS store password). Android mensyaratkan minimal 6 karakter.', example: 'rahasia-keystore' })
  @IsString()
  @MinLength(6)
  @MaxLength(512)
  storePassword: string;

  @ApiProperty({ description: 'Password key untuk alias (sering sama dengan store password).', example: 'rahasia-key' })
  @IsString()
  @MinLength(6)
  @MaxLength(512)
  keyPassword: string;
}
