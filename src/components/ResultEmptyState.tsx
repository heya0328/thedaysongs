import { Top, Paragraph } from '@toss/tds-mobile';

export function ResultEmptyState() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <Top title={<Top.TitleParagraph>오늘의 한 곡</Top.TitleParagraph>} />
      <div
        style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 80,
        }}
      >
        <Paragraph
          typography="t4"
          color="grey600"
          style={{ textAlign: 'center' }}
        >
          오늘의 추천곡을 준비 중이에요
        </Paragraph>
        <Paragraph
          typography="t6"
          color="grey400"
          style={{ textAlign: 'center', marginTop: 8 }}
        >
          내일 다시 방문해주세요!
        </Paragraph>
      </div>
    </div>
  );
}
