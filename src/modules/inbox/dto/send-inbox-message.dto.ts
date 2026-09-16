import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendInboxMessageDto {
  @ApiProperty({ description: 'Message content', maxLength: 5000 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  body: string;

  @ApiPropertyOptional({ description: 'Parent message ID for replies (threading)', nullable: true })
  @IsOptional()
  @IsUUID()
  parentMessageId?: string | null;

  @ApiPropertyOptional({
    description:
      'true = kirim sebagai identitas Library (dipakai Studio "Inbox"), bukan identitas pribadi pengirim — cuma berlaku kalau requester adalah owner Library milik percakapan ini (diabaikan diam-diam kalau tidak, tetap kirim sebagai diri sendiri).',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  asLibrary?: boolean;
}
