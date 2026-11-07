import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AssignPlatformOwnerWalletDto {
  @ApiProperty({
    example: "bookpedia-owner-org",
    description: "Organization slug (`orgId`) milik user yang sedang login.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  orgSlug: string;
}
