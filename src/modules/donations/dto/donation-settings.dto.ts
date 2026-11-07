import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { DONATION_LOCATIONS, MAX_DONATION_AMOUNT } from '../donation.types';

export class DonationOptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title: string;

  @ApiProperty({ maxLength: 240 })
  @IsString()
  @MaxLength(240)
  description: string;

  @ApiProperty({ required: false, maxLength: 2048, description: 'URL gambar ilustrasi nominal yang diunggah.' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  imageUrl?: string;

  @ApiProperty({ required: false, deprecated: true, description: 'Legacy field accepted for compatibility and ignored.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;

  @ApiProperty({ enum: ['fixed', 'custom'] })
  @IsIn(['fixed', 'custom'])
  type: 'fixed' | 'custom';

  @ApiProperty({ required: false, minimum: 1, maximum: MAX_DONATION_AMOUNT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_DONATION_AMOUNT)
  amount?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: MAX_DONATION_AMOUNT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_DONATION_AMOUNT)
  multiple?: number;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsBoolean()
  isPopular: boolean;
}

export class DonationSettingsDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ maxLength: 40 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  buttonLabel: string;

  @ApiProperty({ enum: DONATION_LOCATIONS, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsIn(DONATION_LOCATIONS, { each: true })
  locations: Array<(typeof DONATION_LOCATIONS)[number]>;

  @ApiProperty({ type: [DonationOptionDto] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => DonationOptionDto)
  options: DonationOptionDto[];
}

export class CreateDonationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  optionId: string;

  @ApiProperty({ required: false, minimum: 1, maximum: MAX_DONATION_AMOUNT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_DONATION_AMOUNT)
  amount?: number;
}
