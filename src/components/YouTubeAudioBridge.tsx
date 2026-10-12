import React, { useEffect, useImperativeHandle, useRef } from 'react';

export interface YouTubeAudioBridgeHandle {
  loadAndPlay: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void; // 0.0 - 1.0 (mapped to 0 - 100 for YT)
  getCurrentTime: () => number;
  getDuration: () => number;
}

export type YTPlaybackState = 'unstarted' | 'playing' | 'paused' | 'buffering' | 'ended';

export interface YouTubeAudioBridgeProps {
  onReady?: () => void;
  onStateChange?: (state: YTPlaybackState) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (errorCode: number) => void;
}

// Safely declare global types for YouTube IFrame API
declare global {
  interface Window {
    YT?: {
      Player: {
        new (
          elementId: string | HTMLElement,
          options: YTPlayerConfig
        ): YTPlayer;
      };
      PlayerState?: {
        UNSTARTED?: number;
        ENDED?: number;
        PLAYING?: number;
        PAUSED?: number;
        BUFFERING?: number;
        CUED?: number;
        [key: string]: number | undefined;
      };
      ready?: (callback: () => void) => void;
      [key: string]: unknown;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerConfig {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: {
    playsinline?: number;
    controls?: number;
    disablekb?: number;
    fs?: number;
    rel?: number;
    autoplay?: number;
    [key: string]: unknown;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number; target: YTPlayer }) => void;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface YTPlayer {
  loadVideoById: (args: string | { videoId: string; startSeconds?: number; endSeconds?: number }) => void;
  cueVideoById: (args: string | { videoId: string; startSeconds?: number; endSeconds?: number }) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
  [key: string]: unknown;
}

const YT_API_SCRIPT_SRC = 'https://www.youtube.com/iframe_api';
type ApiCallback = () => void;
const apiReadyCallbacks: ApiCallback[] = [];
let isScriptLoadingOrLoaded = false;

function loadYouTubeIframeApi(callback: ApiCallback): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Already loaded and ready
  if (window.YT && typeof window.YT.Player === 'function') {
    callback();
    return () => {};
  }

  apiReadyCallbacks.push(callback);

  if (!isScriptLoadingOrLoaded) {
    isScriptLoadingOrLoaded = true;

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousOnReady === 'function') {
        try {
          previousOnReady();
        } catch (err) {
          console.error('[YouTubeAudioBridge] Error in previous onYouTubeIframeAPIReady:', err);
        }
      }

      while (apiReadyCallbacks.length > 0) {
        const nextCb = apiReadyCallbacks.shift();
        try {
          nextCb?.();
        } catch (err) {
          console.error('[YouTubeAudioBridge] Error in API ready callback:', err);
        }
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${YT_API_SCRIPT_SRC}"]`
    );

    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = YT_API_SCRIPT_SRC;
      tag.async = true;
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(tag, firstScript);
      } else {
        (document.head || document.body).appendChild(tag);
      }
    }
  }

  return () => {
    const idx = apiReadyCallbacks.indexOf(callback);
    if (idx !== -1) {
      apiReadyCallbacks.splice(idx, 1);
    }
  };
}

function mapYTState(data: number): YTPlaybackState {
  const PlayerState = window.YT?.PlayerState;
  const playingCode = PlayerState?.PLAYING ?? 1;
  const pausedCode = PlayerState?.PAUSED ?? 2;
  const bufferingCode = PlayerState?.BUFFERING ?? 3;
  const endedCode = PlayerState?.ENDED ?? 0;
  const unstartedCode = PlayerState?.UNSTARTED ?? -1;

  if (data === playingCode) return 'playing';
  if (data === pausedCode) return 'paused';
  if (data === bufferingCode) return 'buffering';
  if (data === endedCode) return 'ended';
  if (data === unstartedCode) return 'unstarted';
  return 'unstarted';
}

export const YouTubeAudioBridge = React.forwardRef<
  YouTubeAudioBridgeHandle,
  YouTubeAudioBridgeProps
>(function YouTubeAudioBridge(
  { onReady, onStateChange, onTimeUpdate, onError },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const isReadyRef = useRef<boolean>(false);
  const progressTimerRef = useRef<number | null>(null);
  const pendingVideoIdRef = useRef<string | null>(null);
  const pendingVolumeRef = useRef<number | null>(null);

  // Keep callback refs fresh
  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onStateChangeRef.current = onStateChange;
    onTimeUpdateRef.current = onTimeUpdate;
    onErrorRef.current = onError;
  });

  const stopProgressTimer = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const startProgressTimer = () => {
    stopProgressTimer();

    // Trigger immediate time update if player is ready
    if (playerRef.current && isReadyRef.current) {
      try {
        const ct = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        const currentTime = typeof ct === 'number' && Number.isFinite(ct) ? ct : 0;
        const duration = typeof dur === 'number' && Number.isFinite(dur) ? dur : 0;
        onTimeUpdateRef.current?.(currentTime, duration);
      } catch {
        // Player might still be preparing
      }
    }

    progressTimerRef.current = window.setInterval(() => {
      if (playerRef.current && isReadyRef.current) {
        try {
          const ct = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          const currentTime = typeof ct === 'number' && Number.isFinite(ct) ? ct : 0;
          const duration = typeof dur === 'number' && Number.isFinite(dur) ? dur : 0;
          onTimeUpdateRef.current?.(currentTime, duration);
        } catch {
          // Ignore polling errors during track transitions
        }
      }
    }, 250);
  };

  useImperativeHandle(
    ref,
    () => ({
      loadAndPlay: (videoId: string) => {
        if (!videoId) return;
        if (playerRef.current && isReadyRef.current) {
          try {
            playerRef.current.loadVideoById(videoId);
          } catch (err) {
            console.error('[YouTubeAudioBridge] Error calling loadVideoById:', err);
          }
        } else {
          pendingVideoIdRef.current = videoId;
        }
      },
      play: () => {
        if (playerRef.current && isReadyRef.current) {
          try {
            playerRef.current.playVideo();
          } catch (err) {
            console.error('[YouTubeAudioBridge] Error calling playVideo:', err);
          }
        }
      },
      pause: () => {
        if (playerRef.current && isReadyRef.current) {
          try {
            playerRef.current.pauseVideo();
          } catch (err) {
            console.error('[YouTubeAudioBridge] Error calling pauseVideo:', err);
          }
        }
      },
      seekTo: (seconds: number) => {
        const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
        if (playerRef.current && isReadyRef.current) {
          try {
            playerRef.current.seekTo(safeSeconds, true);
          } catch (err) {
            console.error('[YouTubeAudioBridge] Error calling seekTo:', err);
          }
        }
      },
      setVolume: (volume: number) => {
        const safeVol = Number.isFinite(volume) ? volume : 1.0;
        const clamped = Math.max(0, Math.min(1, safeVol));
        const ytVolume = Math.round(clamped * 100);
        pendingVolumeRef.current = ytVolume;
        if (playerRef.current && isReadyRef.current) {
          try {
            playerRef.current.setVolume(ytVolume);
          } catch (err) {
            console.error('[YouTubeAudioBridge] Error calling setVolume:', err);
          }
        }
      },
      getCurrentTime: () => {
        if (playerRef.current && isReadyRef.current) {
          try {
            const time = playerRef.current.getCurrentTime();
            return typeof time === 'number' && Number.isFinite(time) ? time : 0;
          } catch {
            return 0;
          }
        }
        return 0;
      },
      getDuration: () => {
        if (playerRef.current && isReadyRef.current) {
          try {
            const dur = playerRef.current.getDuration();
            return typeof dur === 'number' && Number.isFinite(dur) ? dur : 0;
          } catch {
            return 0;
          }
        }
        return 0;
      },
    }),
    []
  );

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || !window.YT || !window.YT.Player) return;

      // Ensure host element exists inside container
      const existingHost = document.getElementById('yt-audio-player-host');
      if (!existingHost && containerRef.current) {
        const hostDiv = document.createElement('div');
        hostDiv.id = 'yt-audio-player-host';
        containerRef.current.appendChild(hostDiv);
      }

      try {
        playerRef.current = new window.YT.Player('yt-audio-player-host', {
          height: '1',
          width: '1',
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            autoplay: 1,
          },
          events: {
            onReady: () => {
              if (!isMounted) {
                try {
                  playerRef.current?.destroy();
                } catch {}
                return;
              }
              isReadyRef.current = true;
              if (pendingVolumeRef.current !== null) {
                try {
                  playerRef.current?.setVolume(pendingVolumeRef.current);
                } catch (err) {
                  console.warn('[YouTubeAudioBridge] Error applying pending volume:', err);
                }
              }
              if (pendingVideoIdRef.current) {
                const vid = pendingVideoIdRef.current;
                pendingVideoIdRef.current = null;
                try {
                  playerRef.current?.loadVideoById(vid);
                } catch (err) {
                  console.error('[YouTubeAudioBridge] Error playing pending video:', err);
                }
              }
              onReadyRef.current?.();
            },
            onStateChange: (event: { data: number }) => {
              if (!isMounted) return;
              const mappedState = mapYTState(event.data);
              if (mappedState === 'playing') {
                startProgressTimer();
              } else {
                stopProgressTimer();
              }
              onStateChangeRef.current?.(mappedState);
            },
            onError: (event: { data: number }) => {
              if (!isMounted) return;
              onErrorRef.current?.(event.data);
            },
          },
        });
      } catch (err) {
        console.error('[YouTubeAudioBridge] Failed to construct YT.Player:', err);
      }
    };

    const unsubscribe = loadYouTubeIframeApi(() => {
      initPlayer();
    });

    return () => {
      isMounted = false;
      unsubscribe();
      stopProgressTimer();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.warn('[YouTubeAudioBridge] Error destroying YT.Player:', err);
        }
        playerRef.current = null;
      }
      isReadyRef.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed -left-[9999px] -top-[9999px] w-px h-px opacity-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div id="yt-audio-player-host" />
    </div>
  );
});

YouTubeAudioBridge.displayName = 'YouTubeAudioBridge';
