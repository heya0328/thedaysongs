import { BottomSheet, ListRow, Spacing } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { openURL } from '@apps-in-toss/web-framework';
import type { Track } from '../types';
import { PLATFORM_LIST } from '../constants';

interface ListenBottomSheetProps {
  open: boolean;
  onClose: () => void;
  track: Track;
  isUserRecommendation: boolean;
  openToast: (message: string, options?: Record<string, unknown>) => void;
}

export function ListenBottomSheet({
  open,
  onClose,
  track,
  isUserRecommendation,
  openToast,
}: ListenBottomSheetProps) {
  const query = encodeURIComponent(`${track.title} ${track.artistName}`);
  const platformUrls = {
    'apple-music': `https://music.apple.com/search?term=${query}`,
    'youtube-music': `https://music.youtube.com/search?q=${query}`,
    youtube: `https://music.youtube.com/search?q=${query}`,
    spotify: `https://open.spotify.com/search/${query}`,
    melon: `https://www.melon.com/search/total/index.htm?q=${query}`,
  };

  const visiblePlatforms = isUserRecommendation
    ? PLATFORM_LIST.filter((p) => p.key === track.platform)
    : PLATFORM_LIST.filter((p) => p.key !== 'youtube');

  const handleOpenPlatform = (url: string) => {
    onClose();
    const isInTossWebView =
      typeof window !== 'undefined' &&
      (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView != null;
    if (isInTossWebView) {
      openURL(url).catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <BottomSheet
      header={<BottomSheet.Header>어디서 들을까요?</BottomSheet.Header>}
      headerDescription={
        <BottomSheet.HeaderDescription>
          사용하고 있는 음악 앱으로 이동해요.
        </BottomSheet.HeaderDescription>
      }
      open={open}
      onClose={onClose}
      cta={[]}
    >
      {visiblePlatforms.map((p) => (
        <ListRow
          key={p.key}
          onClick={() =>
            handleOpenPlatform(
              isUserRecommendation && track.originalUrl
                ? track.originalUrl
                : platformUrls[p.key as keyof typeof platformUrls],
            )
          }
          left={
            <ListRow.AssetImage
              src={p.icon}
              shape="circle"
              backgroundColor={adaptive.greyOpacity100}
            />
          }
          contents={
            <ListRow.Texts
              type="1RowTypeB"
              top={p.label}
              topProps={{ color: adaptive.grey800 }}
            />
          }
          verticalPadding="large"
          arrowType="right"
        />
      ))}
      {isUserRecommendation && (
        <ListRow
          onClick={() => {
            navigator.clipboard.writeText(track.title).then(() => {
              onClose();
              openToast('노래 제목을 복사했어요.', {
                type: 'top',
                lottie: 'https://static.toss.im/lotties-common/check-green-spot.json',
              });
            }).catch(() => {
              onClose();
              openToast('복사에 실패했어요. 다시 시도해주세요.', {
                type: 'top',
              });
            });
          }}
          left={
            <ListRow.AssetIcon
              shape="circle-masking"
              name="icon-open-fill"
              variant="fill"
            />
          }
          contents={
            <ListRow.Texts
              type="1RowTypeB"
              top="노래 제목 복사"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          verticalPadding="large"
        />
      )}
      <Spacing size={24} />
    </BottomSheet>
  );
}
