import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import type { BookStatus, BookType } from '../../../entities/book.entity';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Kisah di Ujung Senja (Revisi)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  judul?: string;

  @ApiPropertyOptional({ example: 'Sinopsis terbaru setelah direvisi.' })
  @IsOptional()
  @IsString()
  sinopsis?: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description:
      'ID genre dari GET /public/genres. Kirim null untuk mengosongkan genre Book. 400 kalau tidak match genre manapun.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  genreId?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/book/kisah-di-ujung-senja/cover-2.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'ongoing', enum: ['draft', 'ongoing', 'completed'] })
  @IsOptional()
  @IsIn(['draft', 'ongoing', 'completed'])
  status?: BookStatus;

  @ApiPropertyOptional({
    example: true,
    description:
      'Saklar publikasi level Book (terpisah dari status draft/ongoing/completed di atas, dan dari status publish per-Chapter). true = publish Book (isi published_at = now()), false = batalkan publish (published_at jadi null). Book baru tampil di /public/* kalau ini true DAN punya >=1 Chapter published.',
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    example: 'translation',
    enum: ['original', 'translation', 'adaptation'],
    description: 'original / translation / adaptation — Book terjemahan/adaptasi karya orang lain.',
  })
  @IsOptional()
  @IsIn(['original', 'translation', 'adaptation'])
  bookType?: BookType;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Nama penulis asli. Kirim string kosong untuk mengosongkan.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalAuthor?: string | null;
}
