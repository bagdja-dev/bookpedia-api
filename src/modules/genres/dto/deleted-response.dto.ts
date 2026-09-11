import { ApiProperty } from '@nestjs/swagger';

export class DeletedResponseDto {
  @ApiProperty({ example: true })
  deleted: boolean;
}
