-- =============================================================
-- Bagdja Bookpedia — Fase 4: drop UNIQUE(nama)/UNIQUE(slug) GLOBAL di genres
-- (11 Sep 2026, bug fix)
--
-- Migration 20260910010000 SENGAJA mempertahankan constraint global ini
-- "sampai §4.4" — tapi asumsi itu keliru KHUSUS untuk `genres`: auto-seed
-- 11 genre default ke Platform BARU (PlatformsService.create(), §4.1) sudah
-- jadi fitur aktif SEKARANG, bukan nanti — Platform kedua manapun otomatis
-- gagal dibuat karena genre "Aksi"/"Drama"/dst SUDAH dipakai Platform
-- pertama (constraint global menolak duplikat nama lintas-Platform, padahal
-- itu justru perilaku yang DIINGINKAN per Platform). Ditemukan langsung
-- dari error production nyata (409 "duplicate key value violates unique
-- constraint genres_nama_key") saat user mencoba buat Platform kedua lewat
-- bookpedia-admin.
--
-- Unique index composite (platform_id, nama)/(platform_id, slug) dari
-- migration 20260910010000 SUDAH cukup jadi constraint yang benar — baris
-- lama (platform_id masih NULL, belum di-backfill §4.4) tetap aman karena
-- index composite itu memperbolehkan banyak NULL (Postgres tidak anggap
-- NULL=NULL utk UNIQUE index).
--
-- CATATAN: `libraries`/`books` TIDAK ikut di-drop di sini — constraint
-- global slug-nya belum terbukti aktif menghalangi alur manapun yang sudah
-- dipakai sekarang (tidak ada auto-seed serupa), jadi tetap ditunda ke §4.4
-- sesuai rencana semula.
-- =============================================================

ALTER TABLE genres DROP CONSTRAINT IF EXISTS genres_nama_key;
ALTER TABLE genres DROP CONSTRAINT IF EXISTS genres_slug_key;
