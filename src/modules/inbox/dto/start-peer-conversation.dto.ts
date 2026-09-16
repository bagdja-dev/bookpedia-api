import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartPeerConversationDto {
  @ApiPropertyOptional({
    description:
      'Snapshot nama lawan bicara, best-effort dari konteks UI pemanggil (mis. senderDisplayName komentar yang sedang tampil) — chat-service TIDAK bisa resolve nama user lain sendiri.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetDisplayName?: string | null;
}
