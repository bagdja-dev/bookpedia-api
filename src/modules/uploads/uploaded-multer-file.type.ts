/**
 * Bentuk minimal file hasil `FileInterceptor`/`@UploadedFile()` (multer,
 * `storage: memoryStorage()` default Nest) yang kita pakai.
 *
 * Idealnya ini cukup pakai `Express.Multer.File` (sama seperti
 * `bagdja-auction-api`), tapi Novelo belum punya devDependency
 * `@types/multer` (sudah ada di auction-api/pos-api/website-api, tinggal
 * disamakan) — nambah dependency baru butuh konfirmasi eksplisit dulu
 * (lihat aturan organisasi). Tipe lokal ini menghindari itu tanpa mengubah
 * perilaku runtime; ganti ke `Express.Multer.File` kalau `@types/multer`
 * sudah ditambahkan.
 */
export interface UploadedMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
