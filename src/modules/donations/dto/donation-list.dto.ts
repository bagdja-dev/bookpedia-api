import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DonationListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  optionTitle: string;

  @ApiPropertyOptional({ nullable: true })
  donorName: string | null;

  @ApiPropertyOptional({ nullable: true })
  donorEmail: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null;
}

export class DonationListSummaryDto {
  @ApiProperty()
  paidCount: number;

  @ApiProperty()
  paidAmount: number;

  @ApiProperty()
  uniqueDonorCount: number;

  @ApiProperty()
  pendingCount: number;
}

export class DonationListResponseDto {
  @ApiProperty({ type: DonationListItemDto, isArray: true })
  items: DonationListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: DonationListSummaryDto })
  summary: DonationListSummaryDto;
}
