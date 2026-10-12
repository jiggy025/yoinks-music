import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Disc3,
  BadgeCheck,
  Users,
  User,
  Play,
  Pause,
  Download,
  Check,
  Loader2,
  Volume2,
  Music,
} from 'lucide-react';
import { DeezerArtist, DeezerTrack, DeezerAlbum } from '../types';
import { formatDuration } from '../utils/formatters';

export interface MobileArtistViewProps {
  artist: DeezerArtist;
  topTracks: DeezerTrack[];
  albums: DeezerAlbum[];
  isLoadingTracks?: boolean;
  isLoadingAlbums?: boolean;
  activeTrackId?: string | number | null;
  isPlaying?: boolean;
  downloadingTrackId?: string | number | null;
  downloadedIds?: Set<string>;
  onBack: () => void;
  onSelectAlbum: (album: DeezerAlbum) => void;
  onPlayTrack: (track: DeezerTrack) => void;
  onPauseTrack: () => void;
  onDownloadTrack: (track: DeezerTrack) => void;
}

interface TrackThumbnailProps {
  src?: string;
  alt: string;
}

const TrackThumbnail: React.FC<TrackThumbnailProps> = ({ src, alt }) => {
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
};

interface AlbumCoverProps {
  src?: string;
  alt: string;
}

const AlbumCover: React.FC<AlbumCoverProps> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="aspect-square w-full rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-xs">
        <Disc3 className="w-10 h-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="aspect-square w-full rounded-xl object-cover bg-slate-100 border border-slate-200/80 shadow-xs"
      loading="lazy"
    />
  );
};

export const MobileArtistView: React.FC<MobileArtistViewProps> = React.memo(({
  artist,
  topTracks,
  albums,
  isLoadingTracks = false,
  isLoadingAlbums = false,
  activeTrackId,
  isPlaying = false,
  downloadingTrackId,
  downloadedIds,
  onBack,
  onSelectAlbum,
  onPlayTrack,
  onPauseTrack,
  onDownloadTrack,
}) => {
  const [artistImageError, setArtistImageError] = useState(false);

  useEffect(() => {
    setArtistImageError(false);
  }, [artist.id, artist.pictureBig, artist.pictureMedium, artist.picture]);

  const artistImageUrl =
    artist.pictureBig ||
    artist.pictureMedium ||
    artist.picture ||
    artist.pictureXl ||
    artist.pictureSmall;

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

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8 select-none">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Search"
          className="min-h-[48px] px-3.5 py-2 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 select-none"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
          <span>Back to Search</span>
        </button>
      </div>

      {/* Artist Hero Banner */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col items-center text-center gap-3 select-none">
        {/* 88x88px circular artist portrait with fallback */}
        <div className="w-[88px] h-[88px] rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200/80 bg-slate-100 flex items-center justify-center shadow-xs">
          {artistImageUrl && !artistImageError ? (
            <img
              src={artistImageUrl}
              alt={artist.name}
              onError={() => setArtistImageError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User className="w-10 h-10 text-slate-400" aria-hidden="true" />
          )}
        </div>

        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold tracking-wider uppercase border border-blue-100/80 w-fit">
          <BadgeCheck className="w-[13px] h-[13px] text-blue-600 flex-shrink-0" aria-hidden="true" />
          <span>VERIFIED ARTIST</span>
        </div>

        {/* Artist name */}
        <h1
          className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight line-clamp-2"
          title={artist.name}
        >
          {artist.name}
        </h1>

        {/* Stats: Albums count with Disc3 icon, fan count if > 0 with Users icon */}
        <div className="flex items-center justify-center gap-2.5 text-sm text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <Disc3 className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
            <span>
              {artist.nbAlbum} {artist.nbAlbum === 1 ? 'Album' : 'Albums'}
            </span>
          </span>

          {typeof artist.nbFan === 'number' && artist.nbFan > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
                <span>
                  {artist.nbFan.toLocaleString()} {artist.nbFan === 1 ? 'Fan' : 'Fans'}
                </span>
              </span>
            </>
          )}
        </div>
      </section>

      {/* Section 1: Top Songs (Top 15 Tracks) */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Top Songs</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
              {topTracks.length} {topTracks.length === 1 ? 'song' : 'songs'}
            </span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoadingTracks && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-h-[52px] p-2.5 rounded-xl border border-slate-200/60 bg-white/60 animate-pulse flex items-center gap-3"
              >
                <div className="w-6 h-4 bg-slate-200 rounded" />
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-3/4 h-3.5 bg-slate-200 rounded" />
                  <div className="w-1/2 h-3 bg-slate-200 rounded" />
                </div>
                <div className="w-10 h-3.5 bg-slate-200 rounded" />
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingTracks && topTracks.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center gap-2 select-none shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Music className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1">No top songs available</p>
            <p className="text-xs text-slate-500">There are no popular tracks listed for this artist right now.</p>
          </div>
        )}

        {/* Track Rows */}
        {!isLoadingTracks && topTracks.length > 0 && (
          <div className="space-y-1.5">
            {topTracks.map((track, index) => {
              const active = isTrackActive(track);
              const activeAndPlaying = active && isPlaying;
              const downloading = isTrackDownloading(track);
              const downloaded = isTrackDownloaded(track);

              const artworkUrl =
                track.album?.coverMedium ||
                track.album?.cover ||
                track.album?.coverBig;

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

                  {/* 40x40px square artwork thumbnail */}
                  <TrackThumbnail
                    src={artworkUrl}
                    alt={track.album?.title || track.title}
                  />

                  {/* Title & Subtitle */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span
                      className={`text-sm sm:text-base font-semibold truncate ${
                        active ? 'text-blue-700' : 'text-slate-900'
                      }`}
                      title={track.title}
                    >
                      {track.title}
                    </span>
                    <span
                      className="text-xs text-slate-500 font-medium truncate"
                      title={track.album?.title || track.artist?.name || artist.name}
                    >
                      {track.album?.title || track.artist?.name || artist.name}
                    </span>
                  </div>

                  {/* Duration text */}
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

      {/* Section 2: Albums & Discography (2-Column Mobile Grid) */}
      <section className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Albums & Discography</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
              {albums.length} {albums.length === 1 ? 'album' : 'albums'}
            </span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoadingAlbums && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-2.5 animate-pulse"
              >
                <div className="aspect-square w-full rounded-xl bg-slate-200" />
                <div className="w-12 h-4 bg-slate-200 rounded-full" />
                <div className="w-full h-4 bg-slate-200 rounded" />
                <div className="w-2/3 h-3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingAlbums && albums.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center gap-2 select-none shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Disc3 className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1">No albums found</p>
            <p className="text-xs text-slate-500">There are no albums listed for this artist right now.</p>
          </div>
        )}

        {/* 2-Column Grid */}
        {!isLoadingAlbums && albums.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {albums.map((album) => {
              const coverUrl =
                album.coverMedium ||
                album.coverBig ||
                album.cover ||
                album.coverXl;

              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => onSelectAlbum(album)}
                  aria-label={`View album ${album.title}${
                    album.releaseYear ? `, released in ${album.releaseYear}` : ''
                  }`}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col text-left transition-all active:scale-[0.98] hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer group select-none"
                >
                  {/* Square cover art */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
                    <AlbumCover src={coverUrl} alt={album.title} />
                  </div>

                  {/* Album metadata */}
                  <div className="mt-2.5 flex flex-col flex-1 justify-between gap-1 w-full">
                    {album.releaseYear && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold w-fit border border-slate-200/60">
                        {album.releaseYear}
                      </span>
                    )}
                    <h3
                      className="text-sm font-bold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors"
                      title={album.title}
                    >
                      {album.title}
                    </h3>
                    {typeof album.trackCount === 'number' && album.trackCount > 0 && (
                      <span className="text-xs text-slate-500 font-medium">
                        {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
});

MobileArtistView.displayName = 'MobileArtistView';
export default MobileArtistView;
