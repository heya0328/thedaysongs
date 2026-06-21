import { scrapeOgTags } from './og-scraper.ts';
import type { MusicMetadata } from './spotify.ts';

/**
 * Extract metadata from an Apple Music track URL via OG meta tags.
 *
 * Apple Music OG tags typically:
 * - og:title: "곡명"
 * - og:description: "Song · 아티스트 · Album · 2024" or similar
 * - og:image: album art URL
 */
export async function parseAppleMusic(url: string): Promise<MusicMetadata> {
  const og = await scrapeOgTags(url);

  if (!og.title) {
    throw new Error('Apple Music: og:title not found');
  }

  // Apple Music og:title에서 "Apple" "Music" 사이에 non-breaking space(\u00a0)가 올 수 있으므로 정규화
  let title = og.title.replace(/\u00a0/g, ' ');
  let artist = extractArtistFromDescription(og.description);

  // og:title이 "Apple Music에서 만나는 ..." 형식인 경우 처리
  const prefixMatch = title.match(/^Apple\s+Music에서\s+만나는\s+(.+)$/);
  if (prefixMatch) {
    const rest = prefixMatch[1];

    // 패턴 1: "{아티스트}의 {노래제목}"
    const withSong = rest.match(/^(.+?)의\s+(.+)$/);
    if (withSong) {
      artist = withSong[1];
      title = withSong[2];
    } else {
      // 패턴 2: "{아티스트}" (노래제목 없음)
      artist = rest;
      const descTitle = extractTitleFromDescription(og.description);
      title = descTitle || rest;
    }
  }

  return {
    title,
    artist,
    imageUrl: og.image ?? '',
  };
}

/**
 * Apple Music og:description patterns:
 * - "Song · 아티스트 · Album · 2024"
 * - "아티스트의 노래"
 */
function extractArtistFromDescription(description: string | null): string {
  if (!description) return '';

  // Pattern: "Song · Artist · Album · Year"
  const parts = description.split('·').map((s) => s.trim());
  if (parts.length >= 2) {
    return parts[1];
  }

  return '';
}

/** description 첫 번째 세그먼트에서 곡/앨범 제목 추출 */
function extractTitleFromDescription(description: string | null): string {
  if (!description) return '';

  const parts = description.split('·').map((s) => s.trim());
  if (parts.length >= 1 && parts[0]) {
    return parts[0];
  }

  return '';
}
