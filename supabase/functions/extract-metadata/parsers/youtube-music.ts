import { scrapeOgTags } from './og-scraper.ts';
import type { MusicMetadata } from './spotify.ts';

/**
 * Extract metadata from YouTube Music URL.
 * Strategy 1: OG 태그 스크래핑 (한국어 제목 지원)
 * Strategy 2: OEmbed API fallback (영어 제목만 제공)
 */
export async function parseYouTubeMusic(url: string): Promise<MusicMetadata> {
  // OG 태그 우선 시도 (한국어 제목 반환)
  const ogResult = await tryParseOgTags(url);
  if (ogResult) return ogResult;

  // Fallback: OEmbed
  return parseYouTubeOEmbed(url);
}

export const parseYouTube = parseYouTubeMusic;

/**
 * YouTube Music 페이지의 OG 태그에서 메타데이터 추출.
 * og:title = 곡 제목 (한국어 지원)
 * og:description = 아티스트명
 */
async function tryParseOgTags(url: string): Promise<MusicMetadata | null> {
  try {
    const og = await scrapeOgTags(url);
    if (!og.title) return null;

    const title = og.title;
    // og:description에 아티스트명이 들어있음
    const artist = og.description ?? '';

    let imageUrl = og.image ?? '';
    // YouTube Music 썸네일은 크기 파라미터 제거하면 원본 해상도
    imageUrl = imageUrl.replace(/=w\d+-h\d+.*$/, '=w600-h600');

    return { title, artist, imageUrl };
  } catch {
    return null;
  }
}

async function parseYouTubeOEmbed(url: string): Promise<MusicMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  const res = await fetch(oembedUrl, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`YouTube OEmbed failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  if (!data.title) {
    throw new Error('YouTube OEmbed returned no title');
  }

  let title = data.title;
  let artist = data.author_name ?? '';

  // Many music videos have "아티스트 - 곡명" in the title
  const dashIndex = title.indexOf(' - ');
  if (dashIndex !== -1) {
    const beforeDash = title.substring(0, dashIndex).trim();
    const afterDash = title.substring(dashIndex + 3).trim();
    artist = beforeDash;
    title = afterDash;
  }

  // Upgrade thumbnail to max resolution
  let imageUrl = data.thumbnail_url ?? '';
  imageUrl = upgradeYouTubeThumbnail(imageUrl);

  return { title, artist, imageUrl };
}

function upgradeYouTubeThumbnail(url: string): string {
  return url.replace(
    /\/(default|hqdefault|mqdefault|sddefault)\.(jpg|webp)/,
    '/maxresdefault.$2',
  );
}
