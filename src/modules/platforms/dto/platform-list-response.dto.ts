import { ApiProperty } from '@nestjs/swagger';

import { PlatformResponseDto } from './platform-response.dto';

export class PlatformListResponseDto {
  @ApiProperty({ description: 'true jika user adalah Owner setidaknya satu organisasi yang dapat membuat Platform' })
  isOwner: boolean;

  @ApiProperty({
    description: 'Organisasi yang role user saat ini adalah Owner; hanya organisasi ini yang dapat dipilih untuk Platform baru.',
    type: 'array',
    items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, orgId: { type: 'string' } } },
  })
  ownedOrganizations: Array<{ id: string; name: string; orgId: string }>;

  @ApiProperty({ type: PlatformResponseDto, isArray: true })
  platforms: PlatformResponseDto[];
}
