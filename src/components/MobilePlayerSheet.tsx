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
  Sparkles,
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
}

const SheetArtwork = React.memo<SheetArtworkProps>(({ cover, title, isPlaying }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [cover]);

  return (
    <div className="aspect-square w-56 sm:w-64 mx-auto rounded-3xl object-cover bg-slate-100 border border-slate-200/80 shadow-xl overflow-hidden flex items-center justify-center relative">
      {!cover || hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-6">
          <Disc3
            className={`w-24 h-24 text-slate-400 ${isPlaying ? 'animate-spin' : ''}`}
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

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen || !track) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, track, onClose]);

  // Lock body scroll when sheet is open
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
      // Fallback toggling volume if no onToggleMute handler provided
      onVolumeChange(volume > 0 ? 0 : 0.8);
    }
  }, [onToggleMute, onVolumeChange, volume]);

  if (!isOpen || !track) {
    return null;
  }

  const { title, artist, cover } = extractTrackMeta(track);

  // Safe numerical guards for scrubber
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
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end transition-opacity select-none"
    >
      <div
        data-testid="mobile-player-sheet"
        className="w-full max-h-[92vh] h-full bg-white rounded-t-3xl border-t border-slate-200/80 shadow-2xl flex flex-col justify-between p-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto"
      >
        {/* Top Section: Drag Handle & Header Row */}
        <div>
          {/* Drag Handle Bar */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2" />

          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            {/* Left: Dismiss Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close now playing player"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-600 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* Center: Badge */}
            {playbackSource === 'stream' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200/80">
                <Sparkles
                  className={`w-3.5 h-3.5 text-emerald-600 ${isPlaying ? 'animate-pulse' : ''}`}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
                  FULL AUDIO
                </span>
              </div>
            ) : playbackSource === 'preview' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-200/80">
                <Disc3
                  className={`w-3.5 h-3.5 text-amber-600 ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '4s' }}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">
                  30s PREVIEW
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200/70">
                <Disc3
                  className={`w-3.5 h-3.5 text-blue-600 ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '4s' }}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                  {playbackSource === 'offline' ? 'OFFLINE' : 'NOW PLAYING'}
                </span>
              </div>
            )}

            {/* Right: Download or Placeholder */}
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
                className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDownloading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : isDownloaded ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            ) : (
              <div className="min-h-[48px] min-w-[48px]" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Center Section: Vinyl Sleeve Artwork & Titles */}
        <div className="my-auto py-2 flex flex-col items-center">
          <SheetArtwork cover={cover} title={title} isPlaying={isPlaying} />

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center tracking-tight line-clamp-2 px-4 mt-4 leading-tight">
            {title}
          </h2>

          <p className="text-base font-semibold text-slate-600 text-center mt-1 truncate px-4 max-w-sm">
            {artist}
          </p>
        </div>

        {/* Bottom Section: Progress Scrubber, Playback Controls, and Volume */}
        <div className="w-full flex flex-col items-center pt-2 pb-1">
          {/* Scrubber / Progress Bar */}
          <div className="w-full px-2">
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={safeDuration > 0 ? safeDuration : 100}
                step={0.5}
                disabled={safeDuration === 0}
                value={clampedCurrentTime}
                onChange={handleSeekChange}
                aria-label="Seek track position"
                className={`w-full h-2 rounded-lg appearance-none accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  safeDuration === 0
                    ? 'bg-slate-100 cursor-not-allowed'
                    : 'bg-slate-200 cursor-pointer'
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5 select-none">
              <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                {formatDuration(safeCurrentTime)}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                {formatDuration(safeDuration)}
              </span>
            </div>
          </div>

          {/* Playback Controls Row */}
          <div className="flex items-center justify-between w-full max-w-xs mt-4 px-2">
            {/* Shuffle Button */}
            <button
              type="button"
              onClick={() => setIsShuffle((prev) => !prev)}
              aria-label={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
              className={`min-h-[48px] min-w-[48px] w-12 h-12 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 cursor-pointer ${
                isShuffle
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous Button */}
            <button
              type="button"
              onClick={onPrevious}
              disabled={!onPrevious}
              aria-label="Previous track"
              className={`min-h-[48px] min-w-[48px] w-12 h-12 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
                onPrevious
                  ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed opacity-30'
              }`}
            >
              <SkipBack className="w-6 h-6" />
            </button>

            {/* Big Play / Pause Button */}
            <button
              type="button"
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="min-h-[64px] min-w-[64px] w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              aria-label="Next track"
              className={`min-h-[48px] min-w-[48px] w-12 h-12 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
                onNext
                  ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed opacity-30'
              }`}
            >
              <SkipForward className="w-6 h-6" />
            </button>

            {/* Repeat Button */}
            <button
              type="button"
              onClick={() => setIsRepeat((prev) => !prev)}
              aria-label={isRepeat ? 'Disable repeat' : 'Enable repeat'}
              className={`min-h-[48px] min-w-[48px] w-12 h-12 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 cursor-pointer ${
                isRepeat
                  ? 'text-blue-600 bg-blue-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Control Row */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200/70 rounded-2xl mt-4 max-w-sm mx-auto w-full">
            <button
              type="button"
              onClick={handleMuteClick}
              aria-label={isVolumeMuted ? 'Unmute volume' : 'Mute volume'}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              {isVolumeMuted ? (
                <VolumeX className="w-5 h-5 text-slate-500" />
              ) : (
                <Volume2 className="w-5 h-5 text-slate-600" />
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
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

MobilePlayerSheet.displayName = 'MobilePlayerSheet';
