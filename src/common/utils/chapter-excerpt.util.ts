const BLOCK_END = /<\/(p|h[1-6]|li|blockquote|div|pre)>/gi;
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Potongan paragraf PERTAMA Chapter (HTML TipTap) sebagai teks polos untuk halaman preview
 * share & meta description — tidak pernah lebih dari `maxChars`, dipotong di batas kata
 * dengan "…". Paragraf kosong dilewati. Isi Chapter utuh tidak pernah ikut keluar.
 */
export function extractFirstParagraph(html: string, maxChars: number): string {
  const blocks = (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCK_END, '\n\n')
    .split(/\n{2,}/)
    .map((block) => decodeEntities(block.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim())
    .filter((block) => block.length > 0);

  const first = blocks[0] ?? '';
  const limit = Math.max(1, Math.floor(maxChars));
  if (first.length <= limit) return first;

  const cut = first.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  // Potong di spasi terakhir bila tidak terlalu jauh ke belakang (kata tidak terbelah).
  const trimmed = lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s.,;:!?-]+$/, '')}…`;
}
