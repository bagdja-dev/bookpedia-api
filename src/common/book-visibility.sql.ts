/**
 * Fragment SQL "Book discoverable publik" — dipakai berkali-kali lintas
 * modul (public catalog, similar books, promotions) lewat TypeORM
 * QueryBuilder `.andWhere(...)`. Diekstrak ke sini (bukan duplikat literal
 * string per modul) supaya syarat "discoverable" selalu satu sumber
 * kebenaran kalau nanti direvisi.
 */

/** Book ini "discoverable" publik kalau punya minimal 1 Chapter published. Butuh alias query builder `book`. */
export const HAS_PUBLISHED_CHAPTER_SQL =
  "EXISTS (SELECT 1 FROM chapters c WHERE c.book_id = book.id AND c.status = 'published')";

/**
 * Book "discoverable" publik butuh DUA syarat sekaligus: saklar publikasi
 * level Book aktif (`published_at IS NOT NULL`) DAN minimal 1 Chapter
 * published (`HAS_PUBLISHED_CHAPTER_SQL`). Revisi 9 Sep 2026 — sebelumnya
 * hanya syarat kedua, Book otomatis "hidup" begitu 1 chapter dipublish
 * tanpa momen rilis eksplisit. Butuh alias query builder `book`.
 */
export const IS_BOOK_PUBLISHED_SQL = 'book.published_at IS NOT NULL';
