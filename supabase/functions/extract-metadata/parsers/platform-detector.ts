export type Platform = 'spotify' | 'apple-music' | 'youtube-music' | 'youtube' | 'youtube-playlist' | 'melon';

const PLATFORM_PATTERNS: { platform: Platform; pattern: RegExp }[] = [
  { platform: 'spotify', pattern: /open\.spotify\.com\/(track|album|intl-\w+\/track)/i },
  { platform: 'apple-music', pattern: /music\.apple\.com\/.+\/album\//i },
  // youtube-music must come before youtube to match first
  { platform: 'youtube-music', pattern: /music\.youtube\.com\/watch/i },
  // playlist must come before generic youtube watch
  { platform: 'youtube-playlist', pattern: /(www\.)?youtube\.com\/playlist/i },
  { platform: 'youtube', pattern: /(www\.)?youtube\.com\/watch|youtu\.be\//i },
  { platform: 'melon', pattern: /melon\.com\/song\/detail/i },
];

export function detectPlatform(url: string): Platform | null {
  for (const { platform, pattern } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return null;
}
