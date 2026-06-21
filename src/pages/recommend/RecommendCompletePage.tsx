import { Result, Asset, Button } from '@toss/tds-mobile';

interface Props {
  onGoToSong: () => void;
  goToSongLoading?: boolean;
}

export function RecommendCompletePage({ onGoToSong, goToSongLoading }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Result
          title="작성 완료"
          description="곧 추천한 노래가 화면에 보여요."
          figure={
            <Asset.Image
              frameShape={Asset.frameShape.CleanW60}
              src="https://static.toss.im/icons/png/4x/icon-check-fill.png"
              aria-hidden={true}
            />
          }
        />
      </div>

      <div
        style={{
          padding: '0 24px 24px',
        }}
      >
        <Button size="large" display="block" onClick={onGoToSong} loading={goToSongLoading}>
          신청곡 보러가기
        </Button>
      </div>
    </div>
  );
}
