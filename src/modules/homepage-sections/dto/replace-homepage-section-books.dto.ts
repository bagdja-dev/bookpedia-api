import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export const MAX_HOMEPAGE_SECTION_BOOKS = 50;

export class ReplaceHomepageSectionBooksDto {
  @ApiProperty({
    type: [String],
    description: `ID Book berurutan (urutan array = urutan tampil). Maks ${MAX_HOMEPAGE_SECTION_BOOKS}, tanpa duplikat. Kirim [] untuk mengosongkan.`,
    example: ['5f0c1b7e-8a4d-4e2b-9c3f-1a2b3c4d5e6f'],
  })
  @IsArray()
  @ArrayMaxSize(MAX_HOMEPAGE_SECTION_BOOKS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  bookIds: string[];
}
