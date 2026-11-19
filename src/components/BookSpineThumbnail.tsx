import React from 'react';

interface BookSpineThumbnailProps {
  title: string;
  category: string;
  shelfCode: string;
  size?: 'sm' | 'md';
}

const CATEGORY_COLORS: Record<string, { cover: string; spine: string; accent: string }> = {
  'Sastra & Fiksi': { cover: '#1E3A5F', spine: '#152842', accent: '#E2E8F0' },
  'Teknologi & Komputer': { cover: '#0F4C5C', spine: '#09343F', accent: '#CCFBF1' },
  'Sains & Matematika': { cover: '#2D4F38', spine: '#1C3524', accent: '#DCFCE7' },
  'Sejarah & Budaya': { cover: '#5B3A29', spine: '#3F271B', accent: '#FEF3C7' },
  'Ekonomi & Bisnis': { cover: '#334155', spine: '#1E293B', accent: '#E2E8F0' },
  'Pengembangan Diri': { cover: '#0F766E', spine: '#115E59', accent: '#CCFBF1' },
  Pendidikan: { cover: '#3F3C6B', spine: '#2A284B', accent: '#E0E7FF' },
};

export function BookSpineThumbnail({
  title,
  category,
  shelfCode,
  size = 'md',
}: BookSpineThumbnailProps) {
  const palette = CATEGORY_COLORS[category] || {
    cover: '#1E293B',
    spine: '#0F172A',
    accent: '#E2E8F0',
  };
  const dims = size === 'sm' ? 'w-7 h-9' : 'w-8 h-11';
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      aria-hidden="true"
      className={`${dims} rounded-[3px] shrink-0 relative overflow-hidden flex flex-col justify-between p-1 shadow-xs select-none`}
      style={{ backgroundColor: palette.cover }}
    >
      {/* Left hardcover spine crease */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: palette.spine }}
      />
      {/* Top rule */}
      <div
        className="relative z-10 ml-1 h-[2px] w-3 opacity-80"
        style={{ backgroundColor: palette.accent }}
      />
      {/* Monogram */}
      <div
        className="relative z-10 ml-1 font-display text-[9px] font-bold leading-none tracking-tight"
        style={{ color: palette.accent }}
      >
        {initials}
      </div>
      {/* Shelf marker line */}
      <div
        className="relative z-10 ml-1 text-[6px] font-mono leading-none opacity-75 truncate"
        style={{ color: palette.accent }}
      >
        {shelfCode}
      </div>
    </div>
  );
}
