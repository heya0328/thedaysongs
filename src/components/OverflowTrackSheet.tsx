import { BottomSheet, ListRow, Spacing } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import type { Track } from '../types';

interface OverflowTrackSheetProps {
  open: boolean;
  onClose: () => void;
  tracks: Track[];
  onSelectTrack: (index: number) => void;
}

export function OverflowTrackSheet({
  open,
  onClose,
  tracks,
  onSelectTrack,
}: OverflowTrackSheetProps) {
  return (
    <BottomSheet
      header={<BottomSheet.Header>오늘의 추천곡</BottomSheet.Header>}
      headerDescription={
        <BottomSheet.HeaderDescription>
          오늘 추천된 음악 목록이에요.
        </BottomSheet.HeaderDescription>
      }
      open={open}
      onClose={onClose}
      cta={[]}
    >
      {tracks.map((track, index) => (
        <ListRow
          key={track.id}
          onClick={() => {
            onSelectTrack(index);
            onClose();
          }}
          left={
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: adaptive.greyOpacity100,
              }}
            >
              <img
                src={track.albumImageUrl || '/logo-75.png'}
                alt={track.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo-75.png';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          }
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top={
                <span
                  style={{
                    display: 'block',
                    width: 0,
                    minWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                >
                  {track.title}
                </span>
              }
              bottom={track.artistName}
              bottomProps={{ color: adaptive.grey500 }}
            />
          }
          verticalPadding="large"
          arrowType="right"
        />
      ))}
      <Spacing size={24} />
    </BottomSheet>
  );
}
