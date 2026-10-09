import { ApiProperty } from '@nestjs/swagger';

/** Book di list section manual, urut sesuai posisi tampil. */
export class HomepageSectionBookDto {
  @ApiProperty({ example: '5f0c1b7e-8a4d-4e2b-9c3f-1a2b3c4d5e6f' })
  id: string;

  @ApiProperty({ example: 'The Early Spring' })
  judul: string;

  @ApiProperty({ example: 'the-early-spring' })
  slug: string;

  @ApiProperty({ example: 'https://cdn.bagdja.com/covers/the-early-spring.jpg', nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 'Pustaka Cici', description: 'Nama Library pemilik Book.' })
  libraryNama: string;

  @ApiProperty({
    example: true,
    description: 'false = Book sedang tidak published / belum punya Chapter published — tersimpan di list tapi tidak tampil di homepage.',
  })
  isVisible: boolean;
}
