export class SeriesBookDto {
  id: string;
  judul: string;
  slug: string;
  coverUrl: string | null;
  libraryNama: string;
  publishedAt: string | null;
  status: string;
}

export class SeriesDetailDto {
  id: string;
  nama: string;
  platformId: string;
  bookCount: number;
  books: SeriesBookDto[];
  createdAt: string;
  updatedAt: string;
}
