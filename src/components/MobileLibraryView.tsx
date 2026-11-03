import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FolderHeart,
  Music,
  Play,
  Pause,
  Trash2,
  Volume2,
  Search,
  X,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import type { RecentTrack } from '../types';
import { formatDate } from '../utils/formatters';

export interface MobileLibraryViewProps {
  tracks: RecentTrack[];
  activeTrackId?: string | number | null;
  isPlaying?: boolean;
  onPlayTrack: (track: RecentTrack) => void;
  onPauseTrack: () => void;
  onDeleteTrack: (trackId: string) => void;
  onClearLibrary?: () => void;
  onExploreMusic?: () => void;
}

interface TrackThumbnailProps {
  src?: string;
  alt: string;
}

const TrackThumbnail = React.memo<TrackThumbnailProps>(({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-500 shadow-xs">
        <Music className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-10 h-10 rounded-lg object-cover bg-zinc-800 border border-white/10 flex-shrink-0 shadow-sm"
      loading="lazy"
    />
  );
});

TrackThumbnail.displayName = 'TrackThumbnail';

/* =========================================================================
   LibraryTrackRow Sub-Component
   ========================================================================= */
interface LibraryTrackRowProps {
  track: RecentTrack;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onToggleTrack: (track: RecentTrack) => void;
  onDeleteTrack: (trackId: string) => void;
}

const LibraryTrackRow = React.memo<LibraryTrackRowProps>(({
  track,
  index,
  isActive,
  isPlaying,
  onToggleTrack,
  onDeleteTrack,
}) => {
  const isActiveAndPlaying = isActive && isPlaying;

  return (
    <li
      className={`min-h-[52px] p-2 rounded-xl border flex items-center gap-2.5 transition-colors select-none ${
        isActive
          ? 'bg-zinc-800/80 border-white/20 shadow-md'
          : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/70'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleTrack(track)}
        aria-label={`Select and play ${track.title} by ${track.artist}`}
        className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-lg p-1 -m-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <div className="w-6 flex items-center justify-center flex-shrink-0">
          {isActiveAndPlaying ? (
            <Volume2 className="w-4 h-4 text-zinc-100 animate-pulse" role="img" aria-hidden="true" />
          ) : (
            <span
              className={`font-mono text-xs ${
                isActive ? 'text-zinc-100 font-bold' : 'text-zinc-500'
              }`}
            >
              #{index + 1}
            </span>
          )}
        </div>

        <TrackThumbnail src={track.thumbnail} alt={track.title} />

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span
            className={`text-sm font-medium truncate ${
              isActive ? 'text-zinc-100' : 'text-zinc-200'
            }`}
            title={track.title}
          >
            {track.title}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-normal truncate mt-0.5">
            <span className="truncate">{track.artist}</span>
            {track.downloadedAt && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="font-mono text-[11px] text-zinc-500">{formatDate(track.downloadedAt)}</span>
              </>
            )}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => onToggleTrack(track)}
          aria-label={isActiveAndPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/5 active:scale-95 transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          {isActiveAndPlaying ? (
            <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onDeleteTrack(track.id)}
          aria-label={`Delete ${track.title} from offline library`}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
});

LibraryTrackRow.displayName = 'LibraryTrackRow';

/* =========================================================================
   MobileLibraryView Main Component
   ========================================================================= */
export const MobileLibraryView: React.FC<MobileLibraryViewProps> = React.memo(({
  tracks,
  activeTrackId,
  isPlaying = false,
  onPlayTrack,
  onPauseTrack,
  onDeleteTrack,
  onClearLibrary,
  onExploreMusic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const estimatedSizeMb = useMemo(() => {
    const raw = tracks.length * 8.5;
    return raw.toFixed(1);
  }, [tracks.length]);

  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => {
      const matchTitle = t.title ? t.title.toLowerCase().includes(q) : false;
      const matchArtist = t.artist ? t.artist.toLowerCase().includes(q) : false;
      return matchTitle || matchArtist;
    });
  }, [tracks, searchQuery]);

  const isTrackActive = useCallback((track: RecentTrack): boolean => {
    if (activeTrackId === null || activeTrackId === undefined) return false;
    return String(activeTrackId) === String(track.id);
  }, [activeTrackId]);

  const handleToggleTrack = useCallback((track: RecentTrack) => {
    if (isTrackActive(track) && isPlaying) {
      onPauseTrack();
    } else {
      onPlayTrack(track);
    }
  }, [isTrackActive, isPlaying, onPauseTrack, onPlayTrack]);

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8 select-none">
      {/* Header & Storage Metrics Section */}
      <section className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl flex flex-col gap-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              Offline Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400 border border-white/5">
              {tracks.length}
            </span>
          </div>

          {onClearLibrary && tracks.length > 0 && (
            <button
              type="button"
              onClick={onClearLibrary}
              aria-label="Clear all offline songs"
              className="h-9 px-3 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-white/5 inline-flex items-center gap-1.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Storage Metrics Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 bg-zinc-800/80 text-zinc-300 px-3 py-1 rounded-full text-xs font-mono border border-white/5">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
            <span>~{estimatedSizeMb} MB stored</span>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            FLAC / High-Res Audio
          </span>
        </div>

        {/* Search Input within library */}
        {tracks.length > 0 && (
          <div className="relative w-full flex items-center mt-1">
            <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-zinc-500">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter saved tracks or artists..."
              aria-label="Filter offline library"
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-zinc-800/50 border border-white/5 text-zinc-100 placeholder:text-zinc-500 text-xs font-normal focus:outline-none focus:border-zinc-400 shadow-inner transition-colors [&::-webkit-search-cancel-button]:hidden"
              autoComplete="off"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear library filter"
                className="absolute right-1 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Empty State */}
      {tracks.length === 0 && (
        <section className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 sm:p-10 shadow-xl flex flex-col items-center justify-center text-center gap-3.5 select-none">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center border border-white/10 shadow-xs">
            <FolderHeart className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            No offline songs yet
          </h2>
          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
            Search for artists and download complete tracks to listen offline anytime.
          </p>
          {onExploreMusic && (
            <button
              type="button"
              onClick={onExploreMusic}
              aria-label="Explore music"
              className="h-10 px-5 rounded-xl bg-zinc-100 text-zinc-950 font-medium text-xs shadow-xs active:scale-95 hover:bg-white inline-flex items-center gap-2 cursor-pointer transition-transform duration-150 mt-2"
            >
              <span>Explore Music</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </section>
      )}

      {/* Filtered Empty State */}
      {tracks.length > 0 && filteredTracks.length === 0 && (
        <section className="bg-zinc-900/40 rounded-3xl border border-white/10 p-8 text-center flex flex-col items-center justify-center gap-2 select-none">
          <p className="text-sm font-medium text-zinc-300">
            No matching tracks found in your library.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear filter to show all songs"
            className="text-xs font-mono text-zinc-400 hover:text-white underline mt-1 cursor-pointer"
          >
            Clear search filter
          </button>
        </section>
      )}

      {/* Track List */}
      {filteredTracks.length > 0 && (
        <section className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Saved Tracks
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {filteredTracks.length} of {tracks.length}
            </span>
          </div>

          <ol role="list" className="space-y-1.5">
            {filteredTracks.map((track, index) => (
              <LibraryTrackRow
                key={track.id}
                track={track}
                index={index}
                isActive={isTrackActive(track)}
                isPlaying={isPlaying}
                onToggleTrack={handleToggleTrack}
                onDeleteTrack={onDeleteTrack}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
});

MobileLibraryView.displayName = 'MobileLibraryView';
export default MobileLibraryView;
