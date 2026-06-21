import { scrapeOgTags } from './og-scraper.ts';

export interface MusicMetadata {
  title: string;
  artist: string;
  imageUrl: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

/**
 * Spotify URL에서 intl-xx prefix를 제거하여 정규화한다.
 * "https://open.spotify.com/intl-ko/track/xxx" → "https://open.spotify.com/track/xxx"
 */
function normalizeSpotifyUrl(url: string): string {
  return url.replace(/\/intl-[a-z]{2,}(\/)/i, '$1');
}

function extractTrackId(url: string): string | null {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

/**
 * Extract metadata from a Spotify track URL.
 *
 * Strategy 1: Fetch the embed page (SSR) and parse __NEXT_DATA__ JSON.
 * Strategy 2: Scrape OG meta tags from the regular Spotify page.
 * Strategy 3: OEmbed API (title + thumbnail only, no artist).
 */
export async function parseSpotify(url: string): Promise<MusicMetadata> {
  const normalizedUrl = normalizeSpotifyUrl(url);

  // Try embed page first (has artist info)
  const embedResult = await tryParseEmbed(normalizedUrl);
  if (embedResult) return embedResult;

  // Fallback: scrape OG tags from regular page (has artist in description/title)
  const ogResult = await tryParseRegularPage(normalizedUrl);
  if (ogResult) return ogResult;

  // Last resort: OEmbed (no artist, but at least title + image)
  return parseViaOEmbed(normalizedUrl);
}

async function tryParseEmbed(url: string): Promise<MusicMetadata | null> {
  const trackId = extractTrackId(url);
  if (!trackId) return null;

  // locale=ko で韓国語メタデータを要求
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?locale=ko`;

  try {
    const res = await fetch(embedUrl, {
      headers: {
        ...HEADERS,
        Accept: 'text/html',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(
      /<script\s+id="__NEXT_DATA__"\s+type="application\/json">\s*(\{.+?\})\s*<\/script>/,
    );
    if (!match?.[1]) return null;

    const nextData = JSON.parse(match[1]);
    const entity = nextData?.props?.pageProps?.state?.data?.entity;
    if (!entity?.name) return null;

    const artists: { name: string }[] = entity.artists ?? [];
    const artist = artists.map((a) => a.name).join(', ');

    // Get the largest image available
    const images: { url: string; maxWidth: number }[] =
      entity.visualIdentity?.image ?? [];
    const imageUrl =
      images.sort((a, b) => b.maxWidth - a.maxWidth)[0]?.url ?? '';

    return {
      title: entity.name,
      artist,
      imageUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Scrape the regular Spotify track page for OG meta tags.
 */
async function tryParseRegularPage(
  url: string,
): Promise<MusicMetadata | null> {
  try {
    const og = await scrapeOgTags(url);
    if (!og.title) return null;

    let artist = '';

    if (og.description) {
      const parts = og.description.split('·').map((s) => s.trim());
      if (parts.length >= 2 && parts[0]) {
        const cleaned = parts[0]
          .replace(/^Listen to .+ on Spotify\.\s*/i, '')
          .replace(/^Spotify에서 .+ 듣기\.\s*/i, '')
          .trim();
        artist = cleaned || parts[1] || '';
      }
    }

    if (!artist && og.description === null) {
      const dashParts = og.title.split(' - ');
      if (dashParts.length === 2) {
        artist = dashParts[1].replace(/\s*\|\s*Spotify$/, '').trim();
      }
    }

    return {
      title: og.title,
      artist,
      imageUrl: og.image ?? '',
    };
  } catch {
    return null;
  }
}

async function parseViaOEmbed(url: string): Promise<MusicMetadata> {
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;

  const res = await fetch(oembedUrl, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`Spotify OEmbed failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    title?: string;
    thumbnail_url?: string;
  };

  if (!data.title) {
    throw new Error('Spotify: could not extract title');
  }

  return {
    title: data.title,
    artist: '',
    imageUrl: data.thumbnail_url ?? '',
  };
}
