import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * 비속어 사전 — 카테고리별 정리
 * 서버에만 존재하여 클라이언트 번들에 노출되지 않는다.
 */
const PROFANITY_LIST: string[] = [
  // ── 욕설 / 비하 (한글) ──
  '시발', '씨발', '씨팔', '씨벌', '시벌', 'ㅅㅂ', 'ㅆㅂ',
  '병신', '빙신', 'ㅂㅅ',
  '지랄', '지럴', 'ㅈㄹ',
  '개새끼', '개세끼', '개색끼', '개쉑', '개쌍놈', '개쌍년',
  '새끼', '쌔끼', '색끼',
  '미친놈', '미친년', '미친새끼',
  '존나', '졸라', 'ㅈㄴ',
  '좆', '좇', 'ㅈㅇㅌ',
  '꺼져', '닥쳐', '뒤져', '뒈져', '디져',
  '엿먹어', '엿이나', '염병', '얨병',
  '쓰레기', '찐따', '찐찌버거',
  '한남', '한녀',
  '느금마', '느그마', '니미', '니엄마', '느금',
  '애미', '애비', '에미', '에비',
  '보지', '자지', '잠지',
  '씹', '씨빨', '씨부랄', '부랄',
  '개같은', '개년', '개놈',
  '썅', '쌍놈', '쌍년',
  '멍청이', '바보', '등신', '대가리',
  '후레자식', '후레아들',
  '걸레', '화냥', '화냥년',
  '쉬발', '쒸발', '쓔발', '슈발',
  '아가리', '주둥이',
  '장애인', '정신병자',

  // ── 성적 비속어 (한글) ──
  '섹스', '섹쓰', '쎅스', '섹수',
  '성교', '성행위',
  '강간', '강갂',
  '자위', '딸치', '딸딸이',
  '야동', '포르노', '에로',
  '음란', '음경', '질내',
  '사까시', '사까치',
  '떡치', '떡쳤', '떡친',
  '박아', '박히', '따먹',
  '꼴리', '꼴림',
  '변태', '치한',

  // ── 변형 / 초성 ──
  'ㅅㅂㄴ', 'ㅄ', 'ㅁㅊ',

  // ── 영어 비속어 ──
  'fuck', 'f*ck', 'fck', 'fuk', 'fucker', 'fucking',
  'shit', 'bullshit', 'shitty',
  'bitch', 'btch',
  'asshole', 'arsehole',
  'damn', 'dammit',
  'dick', 'cock', 'penis',
  'pussy', 'cunt',
  'bastard',
  'nigger', 'nigga',
  'retard', 'retarded',
  'whore', 'slut',
  'motherfucker', 'mf',
  'stfu', 'gtfo', 'wtf',
];

/**
 * 비속어를 같은 길이의 *로 치환한다.
 * 단어 목록에서 긴 것부터 매칭하여 부분 매칭 문제를 방지한다.
 */
function maskProfanity(text: string): string {
  // 긴 단어부터 매칭 (예: '개새끼'를 '새끼'보다 먼저)
  const sorted = [...PROFANITY_LIST].sort((a, b) => b.length - a.length);

  let result = text;
  for (const word of sorted) {
    // 대소문자 무시, 글로벌 매칭
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    result = result.replace(regex, (match) => '*'.repeat(match.length));
  }

  return result;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { text } = await req.json();

    if (typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'text field is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const masked = maskProfanity(text);

    return new Response(
      JSON.stringify({ ok: true, masked }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid request' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
