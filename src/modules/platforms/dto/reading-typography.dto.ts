import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, Max, Min } from 'class-validator';

import { READING_FONT_FAMILIES, READING_TYPOGRAPHY_LIMITS, type ReadingFontFamily } from '../../../common/utils/reading-typography.util';

const { fontSize, lineHeight, paragraphSpacing, firstLineIndent } = READING_TYPOGRAPHY_LIMITS;

/** Tipografi teks bacaan (isi Chapter, sinopsis, preview share, editor Studio). */
export class ReadingTypographyDto {
  @ApiProperty({ enum: READING_FONT_FAMILIES, example: 'source-serif-4', description: 'Font kurasi teks bacaan.' })
  @IsIn(READING_FONT_FAMILIES)
  fontFamily: ReadingFontFamily;

  @ApiProperty({ example: 17, minimum: fontSize.min, maximum: fontSize.max, description: 'Ukuran font (px).' })
  @IsInt()
  @Min(fontSize.min)
  @Max(fontSize.max)
  fontSize: number;

  @ApiProperty({ example: 1.9, minimum: lineHeight.min, maximum: lineHeight.max, description: 'Jarak antar baris (kelipatan ukuran font).' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(lineHeight.min)
  @Max(lineHeight.max)
  lineHeight: number;

  @ApiProperty({ example: 1.25, minimum: paragraphSpacing.min, maximum: paragraphSpacing.max, description: 'Jarak antar paragraf (em).' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(paragraphSpacing.min)
  @Max(paragraphSpacing.max)
  paragraphSpacing: number;

  @ApiProperty({ example: 0, minimum: firstLineIndent.min, maximum: firstLineIndent.max, description: 'Indentasi baris pertama paragraf (em), 0 = tanpa indentasi.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(firstLineIndent.min)
  @Max(firstLineIndent.max)
  firstLineIndent: number;
}
