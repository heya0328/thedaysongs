import type { EmojiConfig, FloatingPiece, OrbitRing } from '../../types';

export const EMOJIS: EmojiConfig[] = [
  {
    key: 'red-heart',
    iconName: 'icon-emoji-red-heart',
    glow: 'rgba(244, 114, 182, 0.52)',
  },
  {
    key: 'fire',
    iconName: 'icon-emoji-fire',
    glow: 'rgba(251, 146, 60, 0.54)',
  },
  {
    key: 'heart-eyes',
    iconName: 'icon-emoji-smiling-face-with-heart-eyes',
    glow: 'rgba(236, 72, 153, 0.5)',
  },
  {
    key: 'party',
    iconName: 'icon-emoji-party-popper',
    glow: 'rgba(250, 204, 21, 0.52)',
  },
  {
    key: 'clap',
    iconName: 'icon-u1F44F',
    glow: 'rgba(134, 239, 172, 0.5)',
  },
];

export function createSeededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function buildFloatingPieces(
  config: EmojiConfig,
  seed: number,
): FloatingPiece[] {
  const generator = createSeededRandom(seed);
  const count = 10 + Math.floor(generator() * 5);

  return Array.from({ length: count }, (_, index) => {
    const driftDirection = generator() > 0.5 ? 1 : -1;
    const sizeRoll = generator();
    const frameSize =
      index === 0 ? 60 : sizeRoll < 0.4 ? 24 : sizeRoll < 0.78 ? 30 : 40;
    const iconScale = index === 0 ? 1.08 : 0.96;
    return {
      id: `${seed}-${index}`,
      iconName: config.iconName,
      frameSize,
      iconScale,
      startX: Math.round((generator() - 0.5) * 42),
      driftX: Math.round((40 + generator() * 180) * driftDirection),
      lift: Math.round(120 + generator() * 190 + index * 10),
      rotate: Math.round((generator() - 0.5) * 160),
      delay: index === 0 ? 0 : generator() * 0.18,
      duration: 1.2 + generator() * 1.2,
      popScale: 0.95 + generator() * 0.65,
      endScale: 0.72 + generator() * 0.38,
    };
  });
}

export function buildOrbitRings(seed: number): OrbitRing[] {
  const generator = createSeededRandom(seed + 44);
  return Array.from({ length: 3 }, (_, index) => ({
    id: `ring-${seed}-${index}`,
    size: 70 + index * 42 + Math.round(generator() * 10),
    rotate: Math.round(generator() * 120),
    duration: 0.8 + index * 0.2,
  }));
}
