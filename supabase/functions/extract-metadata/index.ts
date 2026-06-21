// Supabase Edge Function: `extract-metadata`
// - Receives a music platform URL
// - Detects the platform (Spotify, Apple Music, YouTube Music, Melon)
// - Extracts metadata (title, artist, album art) using OEmbed or OG scraping
// - Returns structured metadata
//
// Deploy:  supabase functions deploy extract-metadata --no-verify-jwt

import { detectPlatform } from './parsers/platform-detector.ts';
import { parseSpotify } from './parsers/spotify.ts';
import { parseAppleMusic } from './parsers/apple-music.ts';
import { parseYouTubeMusic, parseYouTube } from './parsers/youtube-music.ts';
import { parseMelon } from './parsers/melon.ts';
import type { MusicMetadata } from './parsers/spotify.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

const PARSERS: Record<string, (url: string) => Promise<MusicMetadata>> = {
  spotify: parseSpotify,
  'apple-music': parseAppleMusic,
  'youtube-music': parseYouTubeMusic,
  youtube: parseYouTube,
  melon: parseMelon,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, reason: 'method_not_allowed' }, 405);
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: 'bad_request' }, 400);
  }

  const url = typeof body.url === 'string' ? body.url.trim() : null;
  if (!url) {
    return json({ ok: false, reason: 'missing_url' }, 400);
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return json({ ok: false, reason: 'invalid_url' }, 400);
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return json(
      { ok: false, reason: 'unsupported_platform', supportedPlatforms: ['spotify', 'apple-music', 'youtube-music', 'youtube', 'melon'] },
      400,
    );
  }

  if (platform === 'youtube-playlist') {
    return json(
      { ok: false, reason: 'unsupported_format', detail: '플레이리스트가 아닌 개별 곡 링크를 공유해주세요.' },
      400,
    );
  }

  // Parse metadata
  const parser = PARSERS[platform];
  let metadata: MusicMetadata;
  try {
    metadata = await parser(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'parse_failed';
    return json({ ok: false, reason: 'parse_error', detail: message }, 502);
  }

  return json({
    ok: true,
    platform,
    title: metadata.title,
    artist: metadata.artist,
    imageUrl: metadata.imageUrl,
    originalUrl: url,
  });
});
