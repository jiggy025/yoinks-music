import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  Disc3,
  Download,
  Check,
  Loader2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { AnyPlayableTrack, extractTrackMeta } from './MobileDockedPlayer';
import { formatDuration } from '../utils/formatters';
import type { PlaybackSource } from '../types';

export interface MobilePlayerSheetProps {
  isOpen: boolean;
  track: AnyPlayableTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted?: boolean;
  playbackSource?: PlaybackSource;
  isResolvingStream?: boolean;
  onPlayPause: () => void;
  onSeek: (timeSec: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose: () => void;
  onDownload?: (track: AnyPlayableTrack) => void;
  isDownloaded?: boolean;
  isDownloading?: boolean;
}

interface SheetArtworkProps {
  cover?: string;
  title: string;
  isPlaying: boolean;
  isResolving?: boolean;
}

const SheetArtwork = React.memo<SheetArtworkProps>(({ cover, title, isPlaying, isResolving }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [cover]);

  return (
    <div className="relative aspect-square w-64 sm:w-72 mx-auto rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl shadow-black/90 flex items-center justify-center">
      {!cover || hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-6">
          <Disc3
            className={`w-24 h-24 text-zinc-600 ${isPlaying && !isResolving ? 'animate-spin' : ''}`}
            style={{ animationDuration: '6s' }}
            aria-hidden="true"
          />
        </div>
      ) : (
        <img
          src={cover}
          alt={title}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover select-none"
        />
      )}

      {isResolving && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-zinc-200 animate-spin" />
          <span className="text-xs text-zinc-300 font-mono tracking-wider uppercase">
            Buffering Full Audio
          </span>
        </div>
      )}
    </div>
  );
});

SheetArtwork.displayName = 'SheetArtwork';

export const MobilePlayerSheet = React.memo<MobilePlayerSheetProps>(({
  isOpen,
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted = false,
  playbackSource,
  isResolvingStream = false,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onNext,
  onPrevious,
  onClose,
  onDownload,
  isDownloaded = false,
  isDownloading = false,
}) => {
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    if (!isOpen || !track) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, track, onClose]);

  useEffect(() => {
    if (!isOpen || !track) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, track]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSeekChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!Number.isNaN(val) && Number.isFinite(val)) {
        onSeek(val);
      }
    },
    [onSeek]
  );

  const handleVolumeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!Number.isNaN(val) && Number.isFinite(val)) {
        onVolumeChange(Math.max(0, Math.min(1, val)));
      }
    },
    [onVolumeChange]
  );

  const handleMuteClick = useCallback(() => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      onVolumeChange(volume > 0 ? 0 : 0.8);
    }
  }, [onToggleMute, onVolumeChange, volume]);

  if (!isOpen || !track) {
    return null;
  }

  const { title, artist, cover } = extractTrackMeta(track);

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime = Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;
  const clampedCurrentTime = safeDuration > 0 ? Math.min(safeCurrentTime, safeDuration) : 0;
  const isVolumeMuted = isMuted || volume <= 0.001;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing Audio Player"
      data-testid="mobile-player-sheet-overlay"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col justify-end select-none"
    >
      <div
        data-testid="mobile-player-sheet"
        className="relative w-full max-h-[94vh] h-full bg-zinc-950/95 rounded-t-[32px] border-t border-white/10 shadow-2xl flex flex-col justify-between p-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-hidden"
      >
        {/* Ambient Artwork Glow Backdrop */}
        {cover && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20 filter blur-3xl scale-125"
            style={{
              backgroundImage: `url(${cover})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
            aria-hidden="true"
          />
        )}

        {/* Top Header Row */}
        <div className="relative z-10 w-full">
          {/* Pull Handle */}
          <div className="w-10 h-1 bg-zinc-700/80 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close now playing player"
              className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-white/5 active:scale-95 transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* Status Pill */}
            {isResolvingStream ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                  Loading Stream
                </span>
              </div>
            ) : playbackSource === 'stream' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider">
                  Full Audio Stream
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-full border border-white/10">
                <Radio className="w-3 h-3 text-zinc-400" />
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  {playbackSource === 'offline' ? 'Offline' : 'Now Playing'}
                </span>
              </div>
            )}

            {/* Download Action */}
            {onDownload ? (
              <button
                type="button"
                onClick={() => onDownload(track)}
                disabled={isDownloading || isDownloaded}
                aria-label={
                  isDownloaded
                    ? 'Track downloaded'
                    : isDownloading
                    ? 'Downloading track'
                    : 'Download track'
                }
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-white/5 active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer disabled:opacity-40"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-200" />
                ) : isDownloaded ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-10 h-10" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Center Artwork & Track Titles */}
        <div className="relative z-10 my-auto py-3 flex flex-col items-center">
          <SheetArtwork cover={cover} title={title} isPlaying={isPlaying} isResolving={isResolvingStream} />

          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 text-center tracking-tight line-clamp-2 px-6 mt-6 leading-snug">
            {title}
          </h2>

          <p className="text-sm font-medium text-zinc-400 text-center mt-1.5 truncate px-6 max-w-sm">
            {artist}
          </p>
        </div>

        {/* Bottom Playback & Volume Area */}
        <div className="relative z-10 w-full flex flex-col items-center pt-2">
          {/* Scrubber Timeline */}
          <div className="w-full px-2 max-w-md mx-auto">
            <input
              type="range"
              min={0}
              max={safeDuration > 0 ? safeDuration : 100}
              step={0.5}
              disabled={safeDuration === 0}
              value={clampedCurrentTime}
              onChange={handleSeekChange}
              aria-label="Seek track position"
              className={`w-full h-1.5 rounded-full appearance-none accent-zinc-100 focus:outline-none ${
                safeDuration === 0
                  ? 'bg-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-800 cursor-pointer hover:bg-zinc-700'
              }`}
            />
            <div className="flex items-center justify-between mt-2 select-none font-mono text-xs text-zinc-400">
              <span>{formatDuration(safeCurrentTime)}</span>
              <span>{formatDuration(safeDuration)}</span>
            </div>
          </div>

          {/* Core Playback Buttons */}
          <div className="flex items-center justify-between w-full max-w-xs mt-5 px-2">
            <button
              type="button"
              onClick={() => setIsShuffle((prev) => !prev)}
              aria-label={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
              className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer ${
                isShuffle
                  ? 'text-zinc-100 bg-white/10'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onPrevious}
              disabled={!onPrevious}
              aria-label="Previous track"
              className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                onPrevious
                  ? 'text-zinc-300 hover:text-zinc-100 cursor-pointer'
                  : 'text-zinc-700 cursor-not-allowed opacity-30'
              }`}
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Main Play / Pause Button */}
            <button
              type="button"
              onClick={onPlayPause}
              disabled={isResolvingStream}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-16 h-16 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-glow hover:bg-white active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer disabled:opacity-70"
            >
              {isResolvingStream ? (
                <Loader2 className="w-6 h-6 animate-spin text-zinc-950" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              aria-label="Next track"
              className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                onNext
                  ? 'text-zinc-300 hover:text-zinc-100 cursor-pointer'
                  : 'text-zinc-700 cursor-not-allowed opacity-30'
              }`}
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setIsRepeat((prev) => !prev)}
              aria-label={isRepeat ? 'Disable repeat' : 'Enable repeat'}
              className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer ${
                isRepeat
                  ? 'text-zinc-100 bg-white/10'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/60 border border-white/5 rounded-2xl mt-5 max-w-xs mx-auto w-full">
            <button
              type="button"
              onClick={handleMuteClick}
              aria-label={isVolumeMuted ? 'Unmute volume' : 'Mute volume'}
              className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
            >
              {isVolumeMuted ? (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isVolumeMuted ? 0 : volume}
              onChange={handleVolumeInput}
              aria-label="Volume level"
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-100 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

MobilePlayerSheet.displayName = 'MobilePlayerSheet';
export default MobilePlayerSheet;
