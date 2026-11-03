import React from 'react';
import { Disc3, Settings } from 'lucide-react';
import type { PlaybackSource } from '../types';

export interface MobileTopHeaderProps {
  title?: string;
  format?: string;
  playbackSource?: PlaybackSource;
  isResolvingStream?: boolean;
  onOpenSettings?: () => void;
}

export const MobileTopHeader: React.FC<MobileTopHeaderProps> = React.memo(({
  title = 'Yoinks Music',
  format = 'FLAC / 320k',
  playbackSource,
  isResolvingStream = false,
  onOpenSettings,
}) => {
  const renderStatus = () => {
    if (isResolvingStream) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-full bg-zinc-800/80 text-zinc-300 border border-white/10 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Connecting
        </span>
      );
    }
    if (playbackSource === 'stream') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-full bg-zinc-800/80 text-zinc-300 border border-white/10 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Full Audio
        </span>
      );
    }
    if (playbackSource === 'offline') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-full bg-zinc-800/80 text-zinc-300 border border-white/10 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Downloaded
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[11px] font-mono tracking-wider rounded-full bg-zinc-900 text-zinc-400 border border-white/5 select-none">
        {format}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 pt-safe-top select-none">
      <div className="w-full px-4 h-14 sm:h-16 flex items-center justify-between max-w-lg mx-auto">
        {/* Left: Brand mark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-100 shadow-xs">
            <Disc3 className="w-4 h-4 text-zinc-200" aria-hidden="true" />
          </div>
          <span className="text-base font-semibold text-zinc-100 tracking-tight">
            {title}
          </span>
        </div>

        {/* Right: Audio format pill & settings */}
        <div className="flex items-center gap-2">
          {renderStatus()}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/5 active:scale-95 transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

MobileTopHeader.displayName = 'MobileTopHeader';
export default MobileTopHeader;
