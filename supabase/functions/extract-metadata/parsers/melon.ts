import { scrapeOgTags } from './og-scraper.ts';
import type { MusicMetadata } from './spotify.ts';

/**
 * Extract metadata from a Melon track URL via OG meta tags.
 *
 * Melon OG tags typically:
 * - og:title: "곡명"
 * - og:description: "아티스트의 곡 정보" or similar
 * - og:image: album art URL (high quality)
 */
export async function parseMelon(url: string): Promise<MusicMetadata> {
  const og = await scrapeOgTags(url);

  if (!og.title) {
    throw new Error('Melon: og:title not found');
  }

  const artist = extractArtistFromDescription(og.description);

  return {
    title: og.title,
    artist,
    imageUrl: og.image ?? '',
  };
}

/**
 * Melon description patterns vary.
 * Common: "아티스트명의 곡 상세정보를 확인해보세요."
 */
function extractArtistFromDescription(description: string | null): string {
  if (!description) return '';

  // Pattern: "아티스트명의 ..."
  const match = description.match(/^(.+?)의\s/);
  if (match?.[1]) {
    return match[1].trim();
  }

  return '';
}
