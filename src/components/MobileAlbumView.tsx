import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Disc3,
  Play,
  Pause,
  Download,
  Check,
  Loader2,
  Volume2,
} from 'lucide-react';
import { DeezerAlbum, DeezerTrack } from '../types';
import { formatDuration } from '../utils/formatters';

export interface MobileAlbumViewProps {
  album: DeezerAlbum;
  artistName: string;
  tracks: DeezerTrack[];
  isLoading?: boolean;
  activeTrackId?: string | number | null;
  isPlaying?: boolean;
  downloadingTrackId?: string | number | null;
  downloadedIds?: Set<string>;
  onBack: () => void;
  onPlayTrack: (track: DeezerTrack) => void;
  onPauseTrack: () => void;
  onDownloadTrack: (track: DeezerTrack) => void;
}

/* =========================================================================
   AlbumTrackRow Sub-Component
   ========================================================================= */
interface AlbumTrackRowProps {
  track: DeezerTrack;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  onToggleTrack: (track: DeezerTrack) => void;
  onDownloadTrack: (track: DeezerTrack) => void;
}

const AlbumTrackRow = React.memo<AlbumTrackRowProps>(({
  track,
  index,
  isActive,
  isPlaying,
  isDownloading,
  isDownloaded,
  onToggleTrack,
  onDownloadTrack,
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
      {/* Primary Track Button (Toggles Play/Pause) */}
      <button
        type="button"
        onClick={() => onToggleTrack(track)}
        aria-label={isActiveAndPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-lg p-1 -m-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        {/* Track number or Playing indicator */}
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

        {/* Track Title */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span
            className={`text-sm font-medium truncate ${
              isActive ? 'text-zinc-100' : 'text-zinc-200'
            }`}
            title={track.title}
          >
            {track.title}
          </span>
        </div>

        {/* Duration Text */}
        <span className="font-mono text-xs text-zinc-400 shrink-0 pr-1">
          {track.durationFormatted || formatDuration(track.duration)}
        </span>
      </button>

      {/* Action buttons */}
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
          onClick={() => onDownloadTrack(track)}
          aria-label={
            isDownloaded
              ? `${track.title} downloaded`
              : isDownloading
              ? `Downloading ${track.title}`
              : `Download ${track.title}`
          }
          disabled={isDownloading}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
            isDownloaded
              ? 'text-emerald-400 hover:text-emerald-300'
              : isDownloading
              ? 'text-zinc-200 cursor-wait'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 active:scale-95'
          }`}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : isDownloaded ? (
            <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </li>
  );
});

AlbumTrackRow.displayName = 'AlbumTrackRow';

/* =========================================================================
   MobileAlbumView Main Component
   ========================================================================= */
export const MobileAlbumView: React.FC<MobileAlbumViewProps> = React.memo(({
  album,
  artistName,
  tracks,
  isLoading = false,
  activeTrackId,
  isPlaying = false,
  downloadingTrackId,
  downloadedIds,
  onBack,
  onPlayTrack,
  onPauseTrack,
  onDownloadTrack,
}) => {
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    setCoverError(false);
  }, [album.id, album.coverBig, album.coverMedium, album.cover, album.coverXl]);

  const coverUrl =
    album.coverBig ||
    album.coverXl ||
    album.coverMedium ||
    album.cover;

  const isTrackDownloaded = useCallback((track: DeezerTrack): boolean => {
    if (!downloadedIds) return false;
    return (
      downloadedIds.has(String(track.id)) ||
      downloadedIds.has(track.title.toLowerCase().trim())
    );
  }, [downloadedIds]);

  const isTrackDownloading = useCallback((track: DeezerTrack): boolean => {
    if (downloadingTrackId === null || downloadingTrackId === undefined) return false;
    return String(downloadingTrackId) === String(track.id);
  }, [downloadingTrackId]);

  const isTrackActive = useCallback((track: DeezerTrack): boolean => {
    if (activeTrackId === null || activeTrackId === undefined) return false;
    return String(activeTrackId) === String(track.id);
  }, [activeTrackId]);

  const handleToggleTrack = useCallback((track: DeezerTrack) => {
    if (isTrackActive(track) && isPlaying) {
      onPauseTrack();
    } else {
      onPlayTrack(track);
    }
  }, [isTrackActive, isPlaying, onPauseTrack, onPlayTrack]);

  const resolvedTrackCount = tracks.length > 0 ? tracks.length : album.trackCount || 0;

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8 select-none">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${artistName || 'Artist'}`}
          className="h-10 px-3.5 inline-flex items-center gap-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-white/10 shadow-xs transition-transform duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[260px]">Back to {artistName || 'Artist'}</span>
        </button>
      </div>

      {/* Album Hero Banner */}
      <section className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-5 select-none">
        {/* Cover */}
        <div className="w-36 h-36 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-2xl shadow-black/80 shrink-0 flex items-center justify-center">
          {coverUrl && !coverError ? (
            <img
              src={coverUrl}
              alt={album.title}
              onError={() => setCoverError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Disc3 className="w-12 h-12 text-zinc-600" aria-hidden="true" />
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 justify-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <Disc3 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Album</span>
            {album.releaseYear && (
              <>
                <span>•</span>
                <span>{album.releaseYear}</span>
              </>
            )}
          </div>

          <h1
            className="text-2xl font-bold text-zinc-100 tracking-tight line-clamp-2"
            title={album.title}
          >
            {album.title}
          </h1>

          <p className="text-sm font-medium text-zinc-400">
            {artistName}
          </p>

          <span className="text-xs font-mono text-zinc-500 mt-1">
            {resolvedTrackCount} {resolvedTrackCount === 1 ? 'Track' : 'Tracks'}
          </span>
        </div>
      </section>

      {/* Tracklist Section */}
      <section className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Tracklist</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400 border border-white/5">
              {resolvedTrackCount}
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 p-2.5 rounded-xl border border-white/5 bg-zinc-800/40 animate-pulse flex items-center gap-3"
              >
                <div className="w-6 h-4 bg-zinc-700/50 rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-2/3 h-4 bg-zinc-700/50 rounded" />
                </div>
                <div className="w-10 h-3.5 bg-zinc-700/50 rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && tracks.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 select-none">
            <Disc3 className="w-8 h-8 text-zinc-600" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-300 mt-1">No tracks found for this album</p>
          </div>
        )}

        {!isLoading && tracks.length > 0 && (
          <ol className="space-y-1.5" role="list">
            {tracks.map((track, index) => (
              <AlbumTrackRow
                key={track.id}
                track={track}
                index={index}
                isActive={isTrackActive(track)}
                isPlaying={isPlaying}
                isDownloading={isTrackDownloading(track)}
                isDownloaded={isTrackDownloaded(track)}
                onToggleTrack={handleToggleTrack}
                onDownloadTrack={onDownloadTrack}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
});

MobileAlbumView.displayName = 'MobileAlbumView';
export default MobileAlbumView;
