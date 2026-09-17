import { IsBoolean } from 'class-validator';

export class UpdateReadingProgressVisibilityDto {
  @IsBoolean()
  isPublic: boolean;
}
