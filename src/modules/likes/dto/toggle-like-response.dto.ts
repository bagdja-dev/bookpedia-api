import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeResponseDto {
  @ApiProperty({ example: true, description: 'Status like user login SETELAH toggle ini (true = baru saja like, false = baru saja unlike).' })
  liked: boolean;

  @ApiProperty({ example: 43, description: 'Total like Chapter ini SETELAH toggle ini.' })
  likeCount: number;
}
