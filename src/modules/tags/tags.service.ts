import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Tag } from '../../entities/tag.entity';
import { BookTag } from '../../entities/book-tag.entity';
import { slugify } from '../../common/utils/slugify.util';
import { TagResponseDto } from './dto/tag-response.dto';

/**
 * Fase 6 (16 Sep 2026) — folksonomi BEBAS: siapa pun penulis boleh
 * menciptakan Tag baru begitu saja saat menyimpan Book (find-or-create),
 * beda dari Genre/Category yang wajib dibuat Owner lebih dulu lewat admin
 * console. TIDAK ada endpoint CRUD Tag terpisah — penciptaan Tag murni
 * efek-samping `findOrCreateMany()`. Lihat plan/bookpedia/overview.md §12.
 */
@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(BookTag)
    private readonly bookTagRepo: Repository<BookTag>,
  ) {}

  /** Autocomplete — dipakai Studio saat penulis mengetik Tag. Tanpa `search`, kembalikan ter-alfabet (bukan daftar penuh). */
  async search(platformId: string, search?: string, limit = 20): Promise<Tag[]> {
    const qb = this.tagRepo.createQueryBuilder('tag').where('tag.platform_id = :platformId', { platformId });
    const trimmed = search?.trim();
    if (trimmed) {
      qb.andWhere('tag.nama ILIKE :search', { search: `%${trimmed}%` });
    }
    qb.orderBy('tag.nama', 'ASC').take(Math.min(limit, 50));
    return qb.getMany();
  }

  /**
   * Find-or-create batch — normalisasi tiap nama (trim+slugify), dedupe
   * dalam satu batch (nama beda tapi slug sama dianggap Tag yang sama),
   * lalu untuk tiap slug: pakai row existing kalau ada, buat baru kalau
   * belum. Dipanggil `BooksService` saat create/update Book.
   */
  async findOrCreateMany(platformId: string, rawNames: string[]): Promise<Tag[]> {
    const namaBySlug = new Map<string, string>();
    for (const raw of rawNames) {
      const nama = raw.trim();
      if (!nama) continue;
      const slug = slugify(nama);
      if (!slug) continue;
      if (!namaBySlug.has(slug)) namaBySlug.set(slug, nama);
    }
    if (namaBySlug.size === 0) return [];

    const slugs = [...namaBySlug.keys()];
    let tags = await this.tagRepo.find({ where: { platform_id: platformId, slug: In(slugs) } });
    const existingSlugs = new Set(tags.map((t) => t.slug));
    const missingSlugs = slugs.filter((s) => !existingSlugs.has(s));

    if (missingSlugs.length > 0) {
      const toCreate = missingSlugs.map((slug) =>
        this.tagRepo.create({ platform_id: platformId, nama: namaBySlug.get(slug)!, slug }),
      );
      try {
        const created = await this.tagRepo.save(toCreate);
        tags = [...tags, ...created];
      } catch {
        // Kemungkinan tabrakan concurrent create Tag baru yang sama persis
        // (dua penulis menyimpan Book di waktu bersamaan dengan Tag baru
        // yang identik) — unique index (platform_id, slug) menolak salah
        // satu insert. Re-fetch supaya tetap dapat baris yang menang,
        // bukan gagalkan simpan Book untuk skenario yang bukan salah user.
        tags = await this.tagRepo.find({ where: { platform_id: platformId, slug: In(slugs) } });
      }
    }

    return tags;
  }

  /**
   * Ganti seluruh Tag milik satu Book (hapus semua baris `book_tags` lama,
   * insert ulang dari `tagIds` resolved) — pola replace-wholesale yang sama
   * sederhananya dengan trik `book.genre = undefined` di `BooksService`.
   */
  async replaceBookTags(bookId: string, tagIds: string[]): Promise<void> {
    await this.bookTagRepo.delete({ book_id: bookId });
    if (tagIds.length === 0) return;
    const rows = tagIds.map((tagId) => this.bookTagRepo.create({ book_id: bookId, tag_id: tagId }));
    await this.bookTagRepo.save(rows);
  }

  /** Batch-fetch Tag milik sekumpulan Book (via `book_tags`), key = book_id — satu query, bukan N+1 per Book. */
  async findTagsForBooks(bookIds: string[]): Promise<Map<string, Tag[]>> {
    const map = new Map<string, Tag[]>();
    if (bookIds.length === 0) return map;

    const rows = await this.bookTagRepo.find({ where: { book_id: In(bookIds) }, relations: ['tag'] });
    for (const row of rows) {
      if (!row.tag) continue;
      const list = map.get(row.book_id) ?? [];
      list.push(row.tag);
      map.set(row.book_id, list);
    }
    return map;
  }

  /** Tag milik satu Book saja — wrapper tipis di atas `findTagsForBooks()` untuk pemanggil single-Book (mis. detail Chapter/Book). */
  async findTagsForBook(bookId: string): Promise<Tag[]> {
    const map = await this.findTagsForBooks([bookId]);
    return map.get(bookId) ?? [];
  }

  toResponseDto(tag: Tag): TagResponseDto {
    return {
      id: tag.id,
      platformId: tag.platform_id,
      nama: tag.nama,
      slug: tag.slug,
    };
  }
}
