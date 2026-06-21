import { getClipboardText } from '@apps-in-toss/web-framework';

/** 클립보드 텍스트가 음악 링크인지 판별 */
const MUSIC_URL_PATTERNS = [
  /open\.spotify\.com\/(track|album|intl-\w+\/track)/i,
  /music\.apple\.com\/.+\/album\//i,
  /music\.youtube\.com\/watch/i,
  /(www\.)?youtube\.com\/watch|youtu\.be\//i,
  /(www\.)?youtube\.com\/playlist/i,
];

export function isMusicUrl(text: string): boolean {
  return MUSIC_URL_PATTERNS.some((p) => p.test(text));
}

/**
 * 클립보드 권한 상태 캐시.
 * - null: 아직 확인 안 함
 * - 'allowed': 허용됨 → getClipboardText() 호출 가능
 * - 'denied': 거부됨 → 클립보드 읽기 스킵
 * - 'dialogShown': openPermissionDialog()를 이미 호출함 → 재호출 방지
 */
let clipboardPermissionCache: 'allowed' | 'denied' | 'dialogShown' | null = null;

/**
 * 클립보드 읽기 권한을 확인하고, 필요 시 1회만 다이얼로그를 표시한다.
 * @returns true면 클립보드 읽기 가능, false면 스킵
 */
async function ensureClipboardPermission(): Promise<boolean> {
  // 이미 확인된 상태면 캐시 사용
  if (clipboardPermissionCache === 'allowed') return true;
  if (clipboardPermissionCache === 'denied' || clipboardPermissionCache === 'dialogShown') return false;

  // SDK 권한 API 사용 가능 여부 체크
  if (typeof getClipboardText.getPermission !== 'function') {
    // 비토스 환경 — 권한 체크 없이 시도
    clipboardPermissionCache = 'allowed';
    return true;
  }

  try {
    const status = await getClipboardText.getPermission();

    if (status === 'allowed') {
      clipboardPermissionCache = 'allowed';
      return true;
    }

    if (status === 'denied') {
      clipboardPermissionCache = 'denied';
      return false;
    }

    // notDetermined → 다이얼로그 1회 표시
    if (typeof getClipboardText.openPermissionDialog === 'function') {
      const result = await getClipboardText.openPermissionDialog();
      if (result === 'allowed') {
        clipboardPermissionCache = 'allowed';
        return true;
      }
      // denied 또는 한 번만 허용 후 거부 → 이 세션에서는 더 이상 묻지 않음
      clipboardPermissionCache = 'dialogShown';
      return false;
    }

    // openPermissionDialog 없는 환경 — 시도해봄
    clipboardPermissionCache = 'allowed';
    return true;
  } catch {
    // 권한 API 자체가 실패 — 시도해봄
    clipboardPermissionCache = 'allowed';
    return true;
  }
}

/**
 * SDK getClipboardText()가 `/` 문자를 깨뜨려 반환하는 문제 대응.
 * 도메인·ID 등 정상 부분을 추출해 올바른 URL로 재구성한다.
 */
function reconstructMusicUrl(raw: string): string | null {
  // 유니코드 공백·제어문자만 제거 (SDK가 삽입하는 Line Separator 등)
  // URL 문자 치환은 하지 않음 — regex에서 유연하게 매칭
  const cleaned = raw.replace(/[\s\u2028\u2029\u200B\u200C\u200D\uFEFF]/g, '');

  let m;

  // Spotify: 도메인 + track/album + 22자 ID — 구분자는 아무 문자 허용
  m = cleaned.match(/open\.spotify\.com.*?(intl-\w+.track|track|album).*?([A-Za-z0-9]{22})/i);
  if (m) {
    const type = m[1].replace(/[^a-z0-9/-]/gi, '/').replace(/\/+/g, '/');
    return `https://open.spotify.com/${type}/${m[2]}`;
  }

  // Apple Music: 도메인 + 2자리 리전 + album + 이름 + 숫자ID
  // 구분자 위치에 V, W, \, / 등 아무 문자가 올 수 있으므로 .{1,3}으로 매칭
  m = cleaned.match(/music\.apple\.com.{1,3}([a-z]{2}).{1,3}album.{1,3}(.+?)(?:\?|$)/i);
  if (m) {
    // 캡처된 경로에서 비정상 구분자를 /로 복원, 숫자ID 앞 구분자도 복원
    const pathRaw = m[2];
    const parts = pathRaw.replace(/[^A-Za-z0-9-](?=\d{5,})/g, '/').replace(/[^A-Za-z0-9/?=&-]/g, '/').replace(/\/+/g, '/');
    const query = cleaned.match(/\?(.+)$/)?.[1] ?? '';
    return `https://music.apple.com/${m[1]}/album/${parts}${query ? '?' + query : ''}`;
  }

  // YouTube Music: music.youtube.com ... watch?v={id}
  m = cleaned.match(/music\.youtube\.com.*?watch\?v=([A-Za-z0-9_-]+)/i);
  if (m) return `https://music.youtube.com/watch?v=${m[1]}`;

  // YouTube: youtube.com ... watch?v={id}
  m = cleaned.match(/(www\.)?youtube\.com.*?watch\?v=([A-Za-z0-9_-]+)/i);
  if (m) return `https://www.youtube.com/watch?v=${m[2]}`;

  // youtu.be/{id}
  m = cleaned.match(/youtu\.be.([A-Za-z0-9_-]+)/i);
  if (m) return `https://youtu.be/${m[1]}`;

  // YouTube playlist: youtube.com ... playlist?list={id}
  m = cleaned.match(/youtube\.com.*?playlist\?list=([A-Za-z0-9_-]+)/i);
  if (m) return `https://www.youtube.com/playlist?list=${m[1]}`;

  return null;
}

/**
 * SDK로 클립보드 텍스트를 읽고, 깨진 URL이면 재구성한다.
 */
async function readViaSDK(): Promise<string> {
  const raw = await getClipboardText();
  if (!raw) return '';
  if (isMusicUrl(raw)) return raw;

  const fixed = reconstructMusicUrl(raw);
  return fixed ?? raw;
}

/**
 * 클립보드 텍스트 읽기 (자동 감지용).
 * SDK만 사용하고 Web API fallback은 사용하지 않는다 (iOS 붙여넣기 툴팁 방지).
 * SDK 권한 거부 시 빈 문자열을 반환한다.
 */
export async function readClipboardSilent(): Promise<string> {
  const permitted = await ensureClipboardPermission();
  if (!permitted) return '';

  try {
    return await readViaSDK();
  } catch {
    // 권한이 있어도 읽기 실패 가능 (빈 클립보드 등) — 무시
  }
  return '';
}

/**
 * 클립보드 텍스트 읽기 (사용자 액션용).
 * SDK를 먼저 시도하고, 실패 시 Web API fallback을 사용한다.
 */
export async function readClipboardText(): Promise<string> {
  try {
    const result = await readViaSDK();
    if (result) return result;
  } catch { /* SDK 실패 */ }

  // Web API fallback (비-토스 환경용)
  try {
    return await navigator.clipboard.readText();
  } catch { /* Web API도 실패 */ }

  return '';
}
