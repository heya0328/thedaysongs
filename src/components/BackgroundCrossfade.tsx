interface BackgroundCrossfadeProps {
  prevImage: string;
  currentImage: string;
  transitioning: boolean;
}

export function BackgroundCrossfade({ prevImage, currentImage, transitioning }: BackgroundCrossfadeProps) {
  return (
    <>
      {/* 블러 배경 — 크로스페이드 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${prevImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(64px) saturate(1.4)',
          transform: 'scale(1.5)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${currentImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(64px) saturate(1.4)',
          transform: 'scale(1.5)',
          zIndex: 0,
          opacity: transitioning ? 1 : 1,
          transition: 'opacity 0.5s ease',
        }}
      />
      {/* 어두운 오버레이 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.75) 100%)',
          zIndex: 1,
        }}
      />
    </>
  );
}
