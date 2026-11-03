import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Disc3, Loader2 } from 'lucide-react';
import { DeezerTrack, SearchResult, RecentTrack, PlaybackSource } from '../types';

export type AnyPlayableTrack = DeezerTrack | SearchResult | RecentTrack;

export interface MobileDockedPlayerProps {
  track: AnyPlayableTrack | null;
  isPlaying: boolean;
  playbackSource?: PlaybackSource;
  isResolvingStream?: boolean;
  currentTime?: number;
  duration?: number;
  onPlayPause: () => void;
  onNext?: () => void;
  onExpand: () => void;
}

export function extractTrackMeta(track: AnyPlayableTrack | null): {
  title: string;
  artist: string;
  cover: string;
} {
  if (!track) {
    return { title: '', artist: '', cover: '' };
  }

  const title = track.title || 'Unknown Track';

  let artist = 'Unknown Artist';
  if ('artist' in track && track.artist) {
    if (typeof track.artist === 'string') {
      artist = track.artist;
    } else if (
      typeof track.artist === 'object' &&
      'name' in track.artist &&
      typeof track.artist.name === 'string' &&
      track.artist.name
    ) {
      artist = track.artist.name;
    }
  }

  let cover = '';
  if ('album' in track && track.album) {
    cover =
      track.album.coverBig ||
      track.album.coverMedium ||
      track.album.cover ||
      '';
  } else if ('thumbnail' in track && track.thumbnail) {
    cover = track.thumbnail;
  }

  return { title, artist, cover };
}

interface DockedTrackArtworkProps {
  cover?: string;
  title: string;
  isPlaying: boolean;
  isResolving?: boolean;
}

const DockedTrackArtwork = React.memo<DockedTrackArtworkProps>(({ cover, title, isPlaying, isResolving }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [cover]);

  if (!cover || hasError) {
    return (
      <div
        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-400"
        aria-hidden="true"
      >
        <Disc3
          className={`w-5 h-5 text-zinc-400 ${isPlaying && !isResolving ? 'animate-spin' : ''}`}
          style={{ animationDuration: '4s' }}
        />
      </div>
    );
  }

  return (
    <div className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl overflow-hidden border border-white/10 flex-shrink-0 shadow-md">
      <img
        src={cover}
        alt={title}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {isResolving && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-zinc-200 animate-spin" />
        </div>
      )}
    </div>
  );
});

DockedTrackArtwork.displayName = 'DockedTrackArtwork';

export const MobileDockedPlayer = React.memo<MobileDockedPlayerProps>(({
  track,
  isPlaying,
  playbackSource,
  isResolvingStream = false,
  currentTime = 0,
  duration = 0,
  onPlayPause,
  onNext,
  onExpand,
}) => {
  if (!track) {
    return null;
  }

  const { title, artist, cover } = extractTrackMeta(track);
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      data-testid="mobile-docked-player"
      className="relative w-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-player rounded-2xl p-2.5 flex items-center justify-between gap-3 select-none overflow-hidden"
    >
      {/* Mini top progress indicator */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
          <div
            className="h-full bg-zinc-300 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Left Area: Clickable Cover & Metadata to Expand Tier 2 */}
      <button
        type="button"
        onClick={onExpand}
        aria-label={`Now playing: ${title} by ${artist}. Open full player`}
        className="flex-1 min-w-0 flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-xl p-0.5 transition-opacity active:opacity-90 cursor-pointer"
      >
        <DockedTrackArtwork cover={cover} title={title} isPlaying={isPlaying} isResolving={isResolvingStream} />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-zinc-100 truncate leading-snug">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
            <span className="text-xs text-zinc-400 font-normal truncate block leading-tight">
              {artist}
            </span>
            {isResolvingStream ? (
              <span className="text-[10px] text-amber-300/90 font-mono tracking-tight shrink-0">
                • loading full audio
              </span>
            ) : playbackSource === 'stream' ? (
              <span className="text-[10px] text-emerald-400/90 font-mono tracking-tight shrink-0">
                • full audio
              </span>
            ) : null}
          </div>
        </div>
      </button>

      {/* Right Controls: Play/Pause and Next */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onPlayPause}
          disabled={isResolvingStream}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer disabled:opacity-70"
        >
          {isResolvingStream ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next track"
            className="w-9 h-9 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-white/5 flex items-center justify-center active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

MobileDockedPlayer.displayName = 'MobileDockedPlayer';
export default MobileDockedPlayer;
