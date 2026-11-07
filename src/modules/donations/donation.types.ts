export const DONATION_LOCATIONS = [
  'home',
  'book_detail',
  'chapter_end',
  'footer',
  'reader_menu',
] as const;

export type DonationLocation = (typeof DONATION_LOCATIONS)[number];
export type DonationOptionType = 'fixed' | 'custom';

export interface PlatformDonationOption {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  /** Legacy field accepted during migration from the earlier icon picker. */
  icon?: string;
  type: DonationOptionType;
  amount?: number;
  multiple?: number;
  isActive: boolean;
  isPopular: boolean;
}

export interface PlatformDonationSettings {
  enabled: boolean;
  title: string;
  description: string;
  buttonLabel: string;
  locations: DonationLocation[];
  options: PlatformDonationOption[];
}

export const DEFAULT_PLATFORM_DONATION_SETTINGS: PlatformDonationSettings = {
  enabled: false,
  title: 'Dukung operasional platform ini',
  description: 'Donasi sukarela ini membantu biaya operasional platform.',
  buttonLabel: 'Dukung platform',
  locations: [],
  options: [],
};

export const MAX_DONATION_AMOUNT = 100_000_000;
