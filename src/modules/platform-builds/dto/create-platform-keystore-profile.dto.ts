import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePlatformKeystoreProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  alias: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  passwordSecretRef: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  keyPasswordSecretRef: string;
}