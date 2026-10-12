import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Disc3 } from 'lucide-react';
import { DeezerTrack, SearchResult, RecentTrack, PlaybackSource } from '../types';

export type AnyPlayableTrack = DeezerTrack | SearchResult | RecentTrack;

export interface MobileDockedPlayerProps {
  track: AnyPlayableTrack | null;
  isPlaying: boolean;
  playbackSource?: PlaybackSource;
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
}

const DockedTrackArtwork = React.memo<DockedTrackArtworkProps>(({ cover, title, isPlaying }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [cover]);

  if (!cover || hasError) {
    return (
      <div
        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-400"
        aria-hidden="true"
      >
        <Disc3
          className={`w-5 h-5 text-slate-400 ${isPlaying ? 'animate-spin' : ''}`}
          style={{ animationDuration: '4s' }}
        />
      </div>
    );
  }

  return (
    <img
      src={cover}
      alt={title}
      onError={() => setHasError(true)}
      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl object-cover bg-slate-100 border border-slate-200/80 flex-shrink-0"
      loading="lazy"
    />
  );
});

DockedTrackArtwork.displayName = 'DockedTrackArtwork';

export const MobileDockedPlayer = React.memo<MobileDockedPlayerProps>(({
  track,
  isPlaying,
  playbackSource,
  onPlayPause,
  onNext,
  onExpand,
}) => {
  if (!track) {
    return null;
  }

  const { title, artist, cover } = extractTrackMeta(track);

  return (
    <div
      data-testid="mobile-docked-player"
      className="h-16 w-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-2xl p-2 flex items-center justify-between gap-3 select-none"
    >
      {/* Left Area: Clickable Cover & Metadata to Expand Tier 2 */}
      <button
        type="button"
        onClick={onExpand}
        aria-label={`Now playing: ${title} by ${artist}. Open full player`}
        className="flex-1 min-w-0 flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl p-0.5 transition-opacity active:opacity-90 cursor-pointer"
      >
        <DockedTrackArtwork cover={cover} title={title} isPlaying={isPlaying} />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-slate-900 truncate leading-snug">
              {title}
            </span>
            {playbackSource === 'stream' && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 uppercase"
                aria-label="Full audio stream"
              >
                FULL
              </span>
            )}
            {playbackSource === 'preview' && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0 uppercase"
                aria-label="30s preview"
              >
                PREVIEW
              </span>
            )}
          </div>
          <span className="text-xs text-slate-600 font-medium truncate block leading-tight mt-0.5">
            {artist}
          </span>
        </div>
      </button>

      {/* Right Controls: Play/Pause and Next */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-12 h-12 min-w-[48px] min-h-[48px] text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full flex items-center justify-center active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next track"
          className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            onNext
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
              : 'text-slate-300 cursor-not-allowed opacity-40'
          }`}
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

MobileDockedPlayer.displayName = 'MobileDockedPlayer';
