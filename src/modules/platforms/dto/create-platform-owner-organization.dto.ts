import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";

export class CreatePlatformOwnerOrganizationDto {
  @ApiProperty({ example: "Bookpedia Owner" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: "bookpedia-owner" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  orgId?: string;
}
