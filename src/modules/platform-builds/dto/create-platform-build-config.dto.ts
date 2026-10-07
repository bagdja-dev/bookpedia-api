import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, IsObject, MinLength, Min } from 'class-validator';

export class CreatePlatformBuildConfigDto {
  @ApiProperty({ description: 'Platform ID target build' })
  @IsUUID()
  platformId: string;

  @ApiProperty({ enum: ['dev', 'staging', 'prod'], description: 'Environment build target' })
  @IsEnum(['dev', 'staging', 'prod'])
  environment: 'dev' | 'staging' | 'prod';

  @ApiProperty({ description: 'Version name output build', example: '1.0.0' })
  @MinLength(1)
  versionName: string;

  @ApiProperty({ description: 'Version code output build', example: 1 })
  @IsInt()
  @Min(1)
  versionCode: number;

  @ApiProperty({ required: false, description: 'Optional keystore profile ID' })
  @IsOptional()
  @IsUUID()
  keystoreProfileId?: string | null;

  @ApiProperty({ required: false, description: 'Additional build flags', type: 'object', default: {} })
  @IsOptional()
  @IsObject()
  buildFlags?: Record<string, unknown>;
}
