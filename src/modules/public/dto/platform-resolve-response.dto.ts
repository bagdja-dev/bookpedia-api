import { ApiProperty } from '@nestjs/swagger';

export class PlatformResolveResponseDto {
  @ApiProperty({ example: 'teknobuku', description: 'Slug Platform yang punya custom domain ini' })
  slug: string;
}
