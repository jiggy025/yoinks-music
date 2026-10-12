import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Disc3,
  Play,
  Pause,
  Download,
  Check,
  Loader2,
  Volume2,
  Music,
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

  const isTrackDownloaded = (track: DeezerTrack): boolean => {
    if (!downloadedIds) return false;
    return (
      downloadedIds.has(String(track.id)) ||
      downloadedIds.has(track.title.toLowerCase().trim())
    );
  };

  const isTrackDownloading = (track: DeezerTrack): boolean => {
    if (downloadingTrackId === null || downloadingTrackId === undefined) return false;
    return String(downloadingTrackId) === String(track.id);
  };

  const isTrackActive = (track: DeezerTrack): boolean => {
    if (activeTrackId === null || activeTrackId === undefined) return false;
    return String(activeTrackId) === String(track.id);
  };

  const handleToggleTrack = (track: DeezerTrack) => {
    if (isTrackActive(track) && isPlaying) {
      onPauseTrack();
    } else {
      onPlayTrack(track);
    }
  };

  const resolvedTrackCount = tracks.length > 0 ? tracks.length : album.trackCount || 0;

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8 select-none">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back to ${artistName || 'Artist'}`}
          className="min-h-[48px] px-3.5 py-2 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 select-none"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[260px]">Back to {artistName || 'Artist'}</span>
        </button>
      </div>

      {/* Album Hero Banner */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 select-none">
        {/* 130x130px square album cover with fallback to Disc3 */}
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md shrink-0 flex items-center justify-center">
          {coverUrl && !coverError ? (
            <img
              src={coverUrl}
              alt={album.title}
              onError={() => setCoverError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Disc3 className="w-12 h-12 text-slate-400" aria-hidden="true" />
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 justify-center">
          {/* Eyebrow pill: ALBUM with Disc3 icon */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold tracking-wider uppercase border border-blue-100/80 w-fit">
            <Disc3 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" aria-hidden="true" />
            <span>ALBUM</span>
          </div>

          {/* Album Title */}
          <h1
            className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight line-clamp-2"
            title={album.title}
          >
            {album.title}
          </h1>

          {/* Artist Name */}
          <p className="text-base font-semibold text-slate-700 truncate max-w-full">
            {artistName}
          </p>

          {/* Release Year & Track Count */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {album.releaseYear && <span>{album.releaseYear}</span>}
            {album.releaseYear && resolvedTrackCount > 0 && (
              <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" aria-hidden="true" />
            )}
            {resolvedTrackCount > 0 && (
              <span>
                {resolvedTrackCount} {resolvedTrackCount === 1 ? 'track' : 'tracks'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Album Tracklist */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        {/* Tracklist Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Album Tracks</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="min-h-[52px] p-2.5 rounded-xl border border-slate-200/60 bg-white/60 animate-pulse flex items-center gap-3"
              >
                <div className="w-6 h-4 bg-slate-200 rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-3/4 h-3.5 bg-slate-200 rounded" />
                </div>
                <div className="w-10 h-3.5 bg-slate-200 rounded" />
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tracks.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 select-none">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Music className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1">No tracks available</p>
            <p className="text-xs text-slate-500">No tracks could be found for this album.</p>
          </div>
        )}

        {/* Ordered Track Rows (#1 to #N) */}
        {!isLoading && tracks.length > 0 && (
          <div className="space-y-1.5">
            {tracks.map((track, index) => {
              const active = isTrackActive(track);
              const activeAndPlaying = active && isPlaying;
              const downloading = isTrackDownloading(track);
              const downloaded = isTrackDownloaded(track);

              return (
                <div
                  key={track.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToggleTrack(track)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleTrack(track);
                    }
                  }}
                  aria-label={`${activeAndPlaying ? 'Pause' : 'Play'} ${track.title}`}
                  className={`min-h-[52px] p-2 sm:p-2.5 rounded-xl border flex items-center gap-2.5 sm:gap-3 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-blue-50/70 border-blue-200/90'
                      : 'bg-white border-slate-200/60 hover:bg-slate-50'
                  }`}
                >
                  {/* Monospace track number or Volume2 playing indicator */}
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {activeAndPlaying ? (
                      <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" aria-label="Playing" />
                    ) : (
                      <span
                        className={`font-mono text-xs ${
                          active ? 'text-blue-600 font-bold' : 'font-semibold text-slate-400'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Track Title */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span
                      className={`text-sm sm:text-base font-semibold truncate ${
                        active ? 'text-blue-700' : 'text-slate-900'
                      }`}
                      title={track.title}
                    >
                      {track.title}
                    </span>
                  </div>

                  {/* Duration Text */}
                  <span className="font-mono text-xs text-slate-500 shrink-0">
                    {track.durationFormatted || formatDuration(track.duration)}
                  </span>

                  {/* 1-tap Play / Pause button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTrack(track);
                    }}
                    aria-label={activeAndPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 flex-shrink-0"
                  >
                    {activeAndPlaying ? (
                      <Pause className="w-4 h-4 text-blue-600 fill-blue-600" aria-hidden="true" />
                    ) : (
                      <Play className="w-4 h-4 text-slate-700 fill-slate-700" aria-hidden="true" />
                    )}
                  </button>

                  {/* 1-tap Download button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadTrack(track);
                    }}
                    aria-label={
                      downloaded
                        ? `${track.title} downloaded`
                        : downloading
                        ? `Downloading ${track.title}`
                        : `Download ${track.title}`
                    }
                    disabled={downloading}
                    className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 flex-shrink-0 ${
                      downloaded
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : downloading
                        ? 'text-blue-600 bg-blue-50 cursor-wait'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
                    }`}
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
                    ) : downloaded ? (
                      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Download className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
});

MobileAlbumView.displayName = 'MobileAlbumView';
export default MobileAlbumView;
