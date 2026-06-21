import { Top, Asset } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

export function ResultLoadingState() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Top
        title={
          <Top.TitleParagraph size={22} color={adaptive.grey900}>
            노래를 가져오고 있어요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph color={adaptive.grey500}>
            잠시만 기다려주세요.
          </Top.SubtitleParagraph>
        }
      />
      <div
        style={{
          width: '100%',
          height: 375,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Asset.Lottie
          frameShape={{ width: 375 }}
          src="https://static.toss.im/lotties/loading/load-ripple.json"
          loop
          aria-hidden
        />
      </div>
    </div>
  );
}
