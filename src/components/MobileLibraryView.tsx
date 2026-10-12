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
      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-400 shadow-xs">
        <Music className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/80 flex-shrink-0 shadow-xs"
      loading="lazy"
    />
  );
});

TrackThumbnail.displayName = 'TrackThumbnail';

/* =========================================================================
   LibraryTrackRow Sub-Component (Memoized)
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
      className={`min-h-[52px] p-1.5 sm:p-2 rounded-xl border flex items-center gap-2 sm:gap-2.5 transition-colors select-none ${
        isActive
          ? 'bg-blue-50/70 border-blue-200/90'
          : 'bg-white border-slate-200/60 hover:bg-slate-50'
      }`}
    >
      {/* Primary Track Button (Wraps artwork, title, artist, date, invoking play/pause) */}
      <button
        type="button"
        onClick={() => onToggleTrack(track)}
        aria-label={`Select and play ${track.title} by ${track.artist}`}
        className="flex-1 min-w-0 flex items-center gap-2.5 sm:gap-3 text-left rounded-lg p-1 -m-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        {/* Monospace track number (#1 to #N) or Volume2 animated playing indicator */}
        <div className="w-6 flex items-center justify-center flex-shrink-0">
          {isActiveAndPlaying ? (
            <>
              <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" role="img" aria-hidden="true" />
              <span className="sr-only">Now playing</span>
            </>
          ) : (
            <span
              className={`font-mono text-xs ${
                isActive ? 'text-blue-600 font-bold' : 'font-semibold text-slate-600'
              }`}
            >
              #{index + 1}
            </span>
          )}
        </div>

        {/* 40x40px square artwork thumbnail */}
        <TrackThumbnail src={track.thumbnail} alt={track.title} />

        {/* Title, Artist, & Download Date */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span
            className={`text-sm sm:text-base font-semibold truncate ${
              isActive ? 'text-blue-700' : 'text-slate-900'
            }`}
            title={track.title}
          >
            {track.title}
          </span>
          <span
            className="text-xs text-slate-600 font-medium truncate"
            title={`${track.artist}${track.downloadedAt ? ` • ${formatDate(track.downloadedAt)}` : ''}`}
          >
            {track.artist}
            {track.downloadedAt ? ` • ${formatDate(track.downloadedAt)}` : ''}
          </span>
        </div>

        {/* Format Badge (if present) */}
        {track.format && (
          <span className="font-mono text-[11px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 shrink-0 hidden sm:inline-block border border-slate-200/60">
            {track.format}
          </span>
        )}
      </button>

      {/* Action buttons (Clean siblings, no nested interactive controls) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Sibling 44px 1-tap Play / Pause button */}
        <button
          type="button"
          onClick={() => onToggleTrack(track)}
          aria-label={isActiveAndPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {isActiveAndPlaying ? (
            <Pause className="w-4 h-4 text-blue-600 fill-blue-600" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4 text-slate-700 fill-slate-700" aria-hidden="true" />
          )}
        </button>

        {/* Sibling 44px Delete button */}
        <button
          type="button"
          onClick={() => onDeleteTrack(track.id)}
          aria-label={`Delete ${track.title} from offline library`}
          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
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

  // Estimated offline storage size (approx 3.8 MB per 320k track)
  const estimatedSizeMb = useMemo(() => {
    return (tracks.length * 3.8).toFixed(1);
  }, [tracks.length]);

  // Filter offline songs by title or artist
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
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              My Offline Music
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/80">
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            </span>
          </div>

          {onClearLibrary && tracks.length > 0 && (
            <button
              type="button"
              onClick={onClearLibrary}
              aria-label="Clear all offline songs"
              className="min-h-[44px] px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200/60 inline-flex items-center gap-1.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Storage Metrics Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200/60">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>~{estimatedSizeMb} MB saved offline</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            High Quality (MP3 320k)
          </span>
        </div>

        {/* Search Input within library (active when library has tracks) */}
        {tracks.length > 0 && (
          <div className="relative w-full flex items-center mt-1">
            <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-slate-400">
              <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter offline songs or artists..."
              aria-label="Filter offline library"
              className="w-full min-h-[48px] pl-10 pr-11 rounded-xl bg-white border border-slate-200/80 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus:border-blue-500 shadow-xs transition-all [&::-webkit-search-cancel-button]:hidden"
              autoComplete="off"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear library filter"
                className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Main Content Area */}
      {/* Empty State: tracks.length === 0 */}
      {tracks.length === 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xs flex flex-col items-center justify-center text-center gap-3.5 select-none">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs">
            <FolderHeart className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            No offline songs yet
          </h2>
          <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
            Search for your favorite artists or songs to save music for offline playback.
          </p>
          {onExploreMusic && (
            <button
              type="button"
              onClick={onExploreMusic}
              aria-label="Explore music"
              className="min-h-[48px] px-6 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-xs active:scale-95 hover:bg-blue-700 inline-flex items-center gap-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 mt-2"
            >
              <span>Explore Music</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </section>
      )}

      {/* Filtered Empty State: tracks.length > 0 && filteredTracks.length === 0 */}
      {tracks.length > 0 && filteredTracks.length === 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center gap-2.5 shadow-xs select-none">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            No matching songs found in your library.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Try searching with a different song title or artist name.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear filter to show all songs"
            className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center text-xs font-semibold text-blue-600 hover:text-blue-700 underline mt-1 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Clear search filter
          </button>
        </section>
      )}

      {/* Ordered Track Rows: filteredTracks.length > 0 */}
      {filteredTracks.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 px-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Saved Tracks
            </h2>
            <span className="text-xs font-semibold text-slate-500">
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
