import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Disc3,
  CheckCircle2,
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

interface AlbumCoverProps {
  src?: string;
  alt: string;
}

const AlbumCover = React.memo<AlbumCoverProps>(({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="aspect-square w-full rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 shadow-xs">
        <Disc3 className="w-10 h-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="aspect-square w-full rounded-xl object-cover bg-zinc-800 border border-white/10 shadow-md"
      loading="lazy"
    />
  );
});

AlbumCover.displayName = 'AlbumCover';

/* =========================================================================
   ArtistTrackRow Sub-Component
   ========================================================================= */
interface ArtistTrackRowProps {
  track: DeezerTrack;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  artistName: string;
  onToggleTrack: (track: DeezerTrack) => void;
  onDownloadTrack: (track: DeezerTrack) => void;
}

const ArtistTrackRow = React.memo<ArtistTrackRowProps>(({
  track,
  index,
  isActive,
  isPlaying,
  isDownloading,
  isDownloaded,
  artistName,
  onToggleTrack,
  onDownloadTrack,
}) => {
  const isActiveAndPlaying = isActive && isPlaying;

  const artworkUrl =
    track.album?.coverMedium ||
    track.album?.cover ||
    track.album?.coverBig;

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
        {/* Monospace track number or Volume2 playing indicator */}
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

        {/* 40x40px square artwork thumbnail */}
        <TrackThumbnail
          src={artworkUrl}
          alt={track.album?.title || track.title}
        />

        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span
            className={`text-sm font-medium truncate ${
              isActive ? 'text-zinc-100' : 'text-zinc-200'
            }`}
            title={track.title}
          >
            {track.title}
          </span>
          <span
            className="text-xs text-zinc-400 font-normal truncate mt-0.5"
            title={track.album?.title || track.artist?.name || artistName}
          >
            {track.album?.title || track.artist?.name || artistName}
          </span>
        </div>

        {/* Duration text */}
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
            <Check className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </li>
  );
});

ArtistTrackRow.displayName = 'ArtistTrackRow';

/* =========================================================================
   AlbumCard Sub-Component
   ========================================================================= */
interface AlbumCardProps {
  album: DeezerAlbum;
  onSelectAlbum: (album: DeezerAlbum) => void;
}

const AlbumCard = React.memo<AlbumCardProps>(({ album, onSelectAlbum }) => {
  const coverUrl =
    album.coverMedium ||
    album.coverBig ||
    album.cover ||
    album.coverXl;

  return (
    <button
      type="button"
      onClick={() => onSelectAlbum(album)}
      aria-label={`View album ${album.title}${
        album.releaseYear ? `, released in ${album.releaseYear}` : ''
      }`}
      className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-3 shadow-lg flex flex-col text-left transition-all active:scale-[0.98] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer group select-none"
    >
      {/* Square cover art */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-800 border border-white/5 shadow-md">
        <AlbumCover src={coverUrl} alt={album.title} />
      </div>

      {/* Album metadata */}
      <div className="mt-3 flex flex-col flex-1 justify-between gap-1 w-full">
        {album.releaseYear && (
          <span className="font-mono text-[11px] text-zinc-400">
            {album.releaseYear}
          </span>
        )}
        <h3
          className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-white transition-colors"
          title={album.title}
        >
          {album.title}
        </h3>
        {typeof album.trackCount === 'number' && album.trackCount > 0 && (
          <span className="text-xs text-zinc-400 font-mono mt-0.5">
            {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
          </span>
        )}
      </div>
    </button>
  );
});

AlbumCard.displayName = 'AlbumCard';

/* =========================================================================
   MobileArtistView Main Component
   ========================================================================= */
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

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8 select-none">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Search"
          className="h-10 px-3.5 inline-flex items-center gap-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-white/10 shadow-xs transition-transform duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
          <span>Back to Search</span>
        </button>
      </div>

      {/* Artist Hero Banner */}
      <section className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl flex flex-col items-center text-center gap-3.5 select-none">
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10 bg-zinc-800 flex items-center justify-center shadow-lg">
          {artistImageUrl && !artistImageError ? (
            <img
              src={artistImageUrl}
              alt={artist.name}
              onError={() => setArtistImageError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User className="w-10 h-10 text-zinc-400" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col items-center gap-1 max-w-full">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" aria-hidden="true" />
            <span>Verified Artist</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight line-clamp-2 px-2"
            title={artist.name}
          >
            {artist.name}
          </h1>

          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-0.5">
            <span className="flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" aria-hidden="true" />
              <span>
                {artist.nbAlbum} {artist.nbAlbum === 1 ? 'Album' : 'Albums'}
              </span>
            </span>

            {typeof artist.nbFan === 'number' && artist.nbFan > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" aria-hidden="true" />
                  <span>{artist.nbFan.toLocaleString()} listeners</span>
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Section 1: Top Songs */}
      <section className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Top Songs</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400 border border-white/5">
              {topTracks.length}
            </span>
          </div>
        </div>

        {isLoadingTracks && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 p-2 rounded-xl border border-white/5 bg-zinc-800/40 animate-pulse flex items-center gap-3"
              >
                <div className="w-6 h-4 bg-zinc-700/50 rounded" />
                <div className="w-10 h-10 bg-zinc-700/50 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-3/4 h-3.5 bg-zinc-700/50 rounded" />
                  <div className="w-1/2 h-3 bg-zinc-700/50 rounded" />
                </div>
                <div className="w-10 h-3.5 bg-zinc-700/50 rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoadingTracks && topTracks.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 select-none">
            <Disc3 className="w-8 h-8 text-zinc-600" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-300 mt-1">No top songs available</p>
          </div>
        )}

        {!isLoadingTracks && topTracks.length > 0 && (
          <ol className="space-y-1.5" role="list">
            {topTracks.map((track, index) => (
              <ArtistTrackRow
                key={track.id}
                track={track}
                index={index}
                isActive={isTrackActive(track)}
                isPlaying={isPlaying}
                isDownloading={isTrackDownloading(track)}
                isDownloaded={isTrackDownloaded(track)}
                artistName={artist.name}
                onToggleTrack={handleToggleTrack}
                onDownloadTrack={onDownloadTrack}
              />
            ))}
          </ol>
        )}
      </section>

      {/* Section 2: Albums & Discography (2-Column Grid) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Albums & Discography</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400 border border-white/5">
              {albums.length}
            </span>
          </div>
        </div>

        {isLoadingAlbums && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-zinc-900/50 rounded-2xl border border-white/5 p-3 space-y-2.5 animate-pulse"
              >
                <div className="aspect-square w-full rounded-xl bg-zinc-800" />
                <div className="w-full h-4 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoadingAlbums && albums.length === 0 && (
          <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-8 text-center flex flex-col items-center justify-center gap-2 select-none">
            <Disc3 className="w-8 h-8 text-zinc-600" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-300 mt-1">No albums found</p>
          </div>
        )}

        {!isLoadingAlbums && albums.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onSelectAlbum={onSelectAlbum}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
});

MobileArtistView.displayName = 'MobileArtistView';
export default MobileArtistView;
