-- TWA Digital Asset Links per-Platform (7 Okt 2026) — dibalas dinamis oleh
-- middleware bookpedia-app di `/.well-known/assetlinks.json` sesuai Host
-- yang resolve ke Platform ini. Tanpa file ini Chrome gagal memverifikasi
-- app TWA dan tetap menampilkan URL bar. Lihat plan/bookpedia/mobile-twa-build-plan.md.
--
-- android_package_name              : applicationId / bundle ID app TWA (mis. com.bagdja.novello)
-- android_sha256_cert_fingerprints  : SHA-256 sertifikat penanda tangan, format AA:BB:..
--                                     (release/upload key, Play App Signing, debug key bila perlu)

ALTER TABLE platforms ADD COLUMN IF NOT EXISTS android_package_name VARCHAR(255);
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS android_sha256_cert_fingerprints TEXT[] NOT NULL DEFAULT '{}';
