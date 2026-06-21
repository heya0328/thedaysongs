import { Asset, Button, Result } from '@toss/tds-mobile';

interface ResultErrorStateProps {
  onRetry: () => void;
  onGoHome?: () => void;
}

export function ResultErrorState({ onRetry, onGoHome }: ResultErrorStateProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
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
          title="잠시 후 다시 시도해주세요"
          description={`잠시 문제가 생겨 노래를 불러오지 못했어요.\n문제가 반복되면 고객센터에 문의해주세요.`}
          figure={
            <Asset.Image
              frameShape={Asset.frameShape.CleanW60}
              src="https://static.toss.im/icons/png/4x/icon-warning-circle-fill.png"
              aria-hidden={true}
            />
          }
          button={<Result.Button onClick={onRetry}>다시 시도하기</Result.Button>}
        />
      </div>
      {onGoHome && (
        <div style={{ padding: '0 24px 24px' }}>
          <Button size="large" display="block" onClick={onGoHome}>
            홈으로 돌아가기
          </Button>
        </div>
      )}
    </div>
  );
}
