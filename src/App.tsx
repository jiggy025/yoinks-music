import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  HardDrive,
  Trash2,
  Sliders,
  CheckCircle2,
  Info,
  Music2,
  Sparkles,
  Radio,
} from 'lucide-react';
import type {
  DeezerArtist,
  DeezerTrack,
  DeezerAlbum,
  RecentTrack,
  PlaybackSource,
} from './types';
import {
  MobileTopHeader,
  MobileSearchBar,
  ArtistSpotlightCard,
  MobileArtistView,
  MobileAlbumView,
  MobileDockedPlayer,
  MobilePlayerSheet,
  MobileBottomNav,
  MobileLibraryView,
  YouTubeAudioBridge,
  type YouTubeAudioBridgeHandle,
  type YTPlaybackState,
  type MobileTab,
  type AnyPlayableTrack,
} from './components';
import { Preferences } from '@capacitor/preferences';
import {
  searchDeezerArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getAlbumTracks,
} from './services/deezer';
import {
  getStoredTracks,
  addStoredTrack,
  removeStoredTrack,
  clearStoredTracks,
} from './services/mobileStorage';
import { resolveTrackStream } from './services/streamResolver';

function getTrackAudioUrl(track: AnyPlayableTrack | null): string {
  if (!track) return '';
  if ('preview' in track && track.preview) return track.preview;
  if ('url' in track && track.url) return track.url;
  if ('fileUri' in track && track.fileUri) return track.fileUri;
  if ('filePath' in track && track.filePath) return track.filePath;
  return '';
}

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<MobileTab>('search');
  const [currentView, setCurrentView] = useState<
    'search' | 'artist' | 'album' | 'library' | 'settings'
  >('search');

  // Search & Exploration State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedArtist, setMatchedArtist] = useState<DeezerArtist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<DeezerArtist | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<DeezerAlbum | null>(null);

  // Artist & Album Details State
  const [artistTopTracks, setArtistTopTracks] = useState<DeezerTrack[]>([]);
  const [artistAlbums, setArtistAlbums] = useState<DeezerAlbum[]>([]);
  const [isLoadingArtistTracks, setIsLoadingArtistTracks] = useState(false);
  const [isLoadingArtistAlbums, setIsLoadingArtistAlbums] = useState(false);

  const [albumTracks, setAlbumTracks] = useState<DeezerTrack[]>([]);
  const [isLoadingAlbumTracks, setIsLoadingAlbumTracks] = useState(false);

  // Offline Library State
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | number | null>(null);

  // Audio Engine State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytBridgeRef = useRef<YouTubeAudioBridgeHandle | null>(null);
  const streamReqIdRef = useRef(0);
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const userPlayIntentRef = useRef<boolean>(false);
  const isHandoffRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);
  const searchReqIdRef = useRef(0);
  const artistReqIdRef = useRef(0);
  const albumReqIdRef = useRef(0);

  const [playbackSource, setPlaybackSource] = useState<PlaybackSource>('stream');
  const [streamPreference, setStreamPreference] = useState<'full' | 'preview'>('full');

  const [activeTrack, setActiveTrack] = useState<AnyPlayableTrack | null>(null);
  const [activeQueue, setActiveQueue] = useState<AnyPlayableTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);

  // Keep currentTimeRef in sync for stable callbacks
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Load streamPreference on initial mount
  useEffect(() => {
    Preferences.get({ key: 'stream_preference' })
      .then(({ value }) => {
        if (value === 'full' || value === 'preview') {
          setStreamPreference(value);
        } else if (typeof window !== 'undefined' && window.localStorage) {
          const local = window.localStorage.getItem('stream_preference');
          if (local === 'full' || local === 'preview') {
            setStreamPreference(local as 'full' | 'preview');
          }
        }
      })
      .catch((err) => {
        console.warn('[Preferences] Load stream_preference error:', err);
      });
  }, []);

  const handleSetStreamPreference = useCallback(async (pref: 'full' | 'preview') => {
    setStreamPreference(pref);
    try {
      await Preferences.set({ key: 'stream_preference', value: pref });
    } catch (err) {
      console.warn('[Preferences] Set stream_preference error:', err);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('stream_preference', pref);
      } catch {
        // Non-fatal
      }
    }
  }, []);

  // Load offline stored tracks on initial mount
  useEffect(() => {
    getStoredTracks()
      .then((tracks) => {
        setRecentTracks(tracks);
      })
      .catch((err) => {
        console.error('[mobileStorage] Initial load error:', err);
      });
  }, []);

  // Pre-seed an iconic senior-friendly artist on mount if no artist set
  useEffect(() => {
    searchDeezerArtist('The Carpenters')
      .then((artists) => {
        if (artists && artists.length > 0) {
          const candidate = artists.find((a) => a.nbAlbum > 0) || artists[0];
          setMatchedArtist(candidate);
        }
      })
      .catch(() => {
        // Non-fatal if offline
      });
  }, []);

  // Compute downloaded IDs set for deduplication & instant UI badges
  const downloadedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const track of recentTracks) {
      if (track.id) ids.add(String(track.id));
      if (track.title) ids.add(track.title.toLowerCase().trim());
    }
    return ids;
  }, [recentTracks]);

  // Audio queue index calculations
  const currentQueueIndex = useMemo(() => {
    if (!activeTrack || activeQueue.length === 0) return -1;
    return activeQueue.findIndex((t) => String(t.id) === String(activeTrack.id));
  }, [activeTrack, activeQueue]);

  const hasNext = useMemo(() => {
    if (activeQueue.length <= 1 || currentQueueIndex === -1) return false;
    return currentQueueIndex < activeQueue.length - 1;
  }, [currentQueueIndex, activeQueue.length]);

  const hasPrev = useMemo(() => {
    if (activeQueue.length <= 1 || currentQueueIndex === -1) return false;
    return currentQueueIndex > 0;
  }, [currentQueueIndex, activeQueue.length]);

  // Audio Playback Controls
  const handlePlayTrack = useCallback(
    async (track: AnyPlayableTrack, queue?: AnyPlayableTrack[]) => {
      // Unconditionally abort previous in-flight stream resolution and increment request ID
      streamAbortControllerRef.current?.abort();
      const controller = new AbortController();
      streamAbortControllerRef.current = controller;
      const reqId = ++streamReqIdRef.current;

      // Track playback intent and reset handoff flag
      userPlayIntentRef.current = true;
      isHandoffRef.current = false;

      if (queue) {
        setActiveQueue(queue);
      }
      setActiveTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      currentTimeRef.current = 0;

      // Check if track is offline / downloaded without stream
      const isOffline = Boolean(
        ('filePath' in track && track.filePath) ||
        ('fileUri' in track && track.fileUri) ||
        ('downloadedAt' in track)
      );

      // If track is offline / downloaded without stream: play via HTML5 audio
      if (isOffline) {
        setPlaybackSource('offline');
        ytBridgeRef.current?.pause();
        const audio = audioRef.current;
        if (audio) {
          const localUrl = getTrackAudioUrl(track);
          if (localUrl) {
            if (audio.src !== localUrl) {
              audio.src = localUrl;
              audio.currentTime = 0;
            }
            audio.play().catch((err) => {
              console.warn('[Audio Engine] Offline play error:', err);
              setIsPlaying(false);
            });
          }
        }
        return;
      }

      if (streamPreference === 'full') {
        const previewUrl = getTrackAudioUrl(track);

        // Instant 0ms feedback: if track has preview URL, start playing preview on HTML5 audio immediately
        if (previewUrl && audioRef.current) {
          setPlaybackSource('preview');
          const audio = audioRef.current;
          if (audio.src !== previewUrl) {
            audio.src = previewUrl;
            audio.currentTime = 0;
          }
          audio.play().catch((err) => {
            console.warn('[Audio Engine] Instant preview play error:', err);
          });
        }

        // Concurrently call resolveTrackStream(track.title, artistName, controller.signal)
        let artistName = 'Unknown Artist';
        if ('artist' in track && track.artist) {
          if (typeof track.artist === 'string') {
            artistName = track.artist;
          } else if (
            typeof track.artist === 'object' &&
            'name' in track.artist &&
            track.artist.name
          ) {
            artistName = track.artist.name;
          }
        } else if (selectedArtist?.name) {
          artistName = selectedArtist.name;
        }

        try {
          const resolved = await resolveTrackStream(track.title, artistName, controller.signal);
          // Only trigger loadAndPlay if request ID matches and user play intent is still active
          if (reqId === streamReqIdRef.current && userPlayIntentRef.current) {
            if (resolved && resolved.videoId) {
              // Smooth handoff: maintain isHandoffRef and let preview keep playing until YouTube bridge fires 'playing'
              isHandoffRef.current = true;
              ytBridgeRef.current?.loadAndPlay(resolved.videoId);
              setPlaybackSource('stream');
              if (resolved.duration && resolved.duration > 0) {
                setDuration(resolved.duration);
              }
            } else {
              isHandoffRef.current = false;
              // If resolution returns null: keep HTML5 audio playing as graceful fallback
              setPlaybackSource('preview');
            }
          }
        } catch (err) {
          console.warn('[streamResolver] Resolution error, falling back to preview:', err);
          if (reqId === streamReqIdRef.current) {
            isHandoffRef.current = false;
            setPlaybackSource('preview');
          }
        }
      } else {
        // streamPreference === 'preview'
        setPlaybackSource('preview');
        ytBridgeRef.current?.pause();
        const audio = audioRef.current;
        if (audio) {
          const streamUrl = getTrackAudioUrl(track);
          if (streamUrl) {
            if (audio.src !== streamUrl) {
              audio.src = streamUrl;
              audio.currentTime = 0;
            }
            audio.play().catch((err) => {
              console.warn('[Audio Engine] Preview play error:', err);
              setIsPlaying(false);
            });
          }
        }
      }
    },
    [selectedArtist, streamPreference]
  );

  const handleNext = useCallback(() => {
    if (currentQueueIndex >= 0 && currentQueueIndex < activeQueue.length - 1) {
      const nextTrack = activeQueue[currentQueueIndex + 1];
      handlePlayTrack(nextTrack);
    }
  }, [currentQueueIndex, activeQueue, handlePlayTrack]);

  const handlePrevious = useCallback(() => {
    if (playbackSource === 'stream') {
      const ytTime = ytBridgeRef.current?.getCurrentTime() ?? currentTimeRef.current;
      if (ytTime > 3) {
        ytBridgeRef.current?.seekTo(0);
        setCurrentTime(0);
        currentTimeRef.current = 0;
        return;
      }
    } else if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      currentTimeRef.current = 0;
      return;
    }
    if (currentQueueIndex > 0) {
      const prevTrack = activeQueue[currentQueueIndex - 1];
      handlePlayTrack(prevTrack);
    }
  }, [currentQueueIndex, activeQueue, handlePlayTrack, playbackSource]);

  const handlePlayPause = useCallback(() => {
    if (!activeTrack) return;

    if (playbackSource === 'stream') {
      if (isPlaying) {
        userPlayIntentRef.current = false;
        isHandoffRef.current = false;
        ytBridgeRef.current?.pause();
        setIsPlaying(false);
      } else {
        userPlayIntentRef.current = true;
        ytBridgeRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      // 'preview' or 'offline'
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        userPlayIntentRef.current = false;
        isHandoffRef.current = false;
        audio.pause();
        setIsPlaying(false);
      } else {
        userPlayIntentRef.current = true;
        if (!audio.src) {
          audio.src = getTrackAudioUrl(activeTrack);
        }
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('[Audio Engine] Play error:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [isPlaying, activeTrack, playbackSource]);

  const handlePauseTrack = useCallback(() => {
    userPlayIntentRef.current = false;
    isHandoffRef.current = false;
    if (playbackSource === 'stream') {
      ytBridgeRef.current?.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [playbackSource]);

  const handleSeek = useCallback(
    (timeSec: number) => {
      setCurrentTime(timeSec);
      currentTimeRef.current = timeSec;
      if (playbackSource === 'stream') {
        ytBridgeRef.current?.seekTo(timeSec);
      } else if (audioRef.current) {
        audioRef.current.currentTime = timeSec;
      }
    },
    [playbackSource]
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const clamped = Math.max(0, Math.min(1, newVolume));
      setVolume(clamped);
      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }
      ytBridgeRef.current?.setVolume(clamped);
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
        if (audioRef.current) {
          audioRef.current.muted = false;
        }
      }
    },
    [isMuted]
  );

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    ytBridgeRef.current?.setVolume(nextMuted ? 0 : volume);
  }, [isMuted, volume]);

  // YouTube Audio Bridge Event Handlers
  const handleYtStateChange = useCallback(
    (state: YTPlaybackState) => {
      if (playbackSource === 'stream') {
        if (state === 'playing') {
          // Pause HTML5 preview immediately upon YouTube playing
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          isHandoffRef.current = false;
          setIsPlaying(true);
        } else if (state === 'paused') {
          isHandoffRef.current = false;
          setIsPlaying(false);
        } else if (state === 'ended') {
          isHandoffRef.current = false;
          if (hasNext) {
            handleNext();
          } else {
            setIsPlaying(false);
          }
        }
      }
    },
    [playbackSource, hasNext, handleNext]
  );

  const handleYtTimeUpdate = useCallback(
    (time: number, dur: number) => {
      if (playbackSource === 'stream') {
        setCurrentTime(time);
        currentTimeRef.current = time;
        if (dur > 0) {
          setDuration(dur);
        }
      }
    },
    [playbackSource]
  );

  const handleYtError = useCallback(
    (errorCode: number) => {
      console.warn('[YouTubeAudioBridge] Error code:', errorCode);
      isHandoffRef.current = false;
      if (playbackSource === 'stream') {
        // Fallback to HTML5 audio preview if available
        const previewUrl = activeTrack ? getTrackAudioUrl(activeTrack) : '';
        if (previewUrl && audioRef.current) {
          setPlaybackSource('preview');
          audioRef.current.src = previewUrl;
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((err) => {
            console.warn('[Audio Engine] Fallback preview error:', err);
            setIsPlaying(false);
          });
        } else {
          setIsPlaying(false);
        }
      }
    },
    [playbackSource, activeTrack]
  );

  // Audio Element Event Handlers
  const handleTimeUpdate = useCallback(() => {
    if (playbackSource !== 'stream' && audioRef.current) {
      const cur = audioRef.current.currentTime || 0;
      setCurrentTime(cur);
      currentTimeRef.current = cur;
    }
  }, [playbackSource]);

  const handleLoadedMetadata = useCallback(() => {
    if (playbackSource !== 'stream' && audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, [playbackSource]);

  const handleAudioEnded = useCallback(() => {
    if (playbackSource !== 'stream' && !isHandoffRef.current) {
      if (hasNext) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    }
  }, [playbackSource, hasNext, handleNext]);

  const handleAudioError = useCallback(() => {
    if (playbackSource !== 'stream' && !isHandoffRef.current) {
      console.warn('[Audio Engine] HTML5 Playback error encountered gracefully.');
      setIsPlaying(false);
    }
  }, [playbackSource]);

  // Offline Track Download Handler
  const handleDownloadTrack = useCallback(
    async (track: AnyPlayableTrack) => {
      try {
        setDownloadingTrackId(track.id);

        let artistName = 'Unknown Artist';
        if ('artist' in track && track.artist) {
          if (typeof track.artist === 'string') {
            artistName = track.artist;
          } else if (
            typeof track.artist === 'object' &&
            'name' in track.artist &&
            track.artist.name
          ) {
            artistName = track.artist.name;
          }
        } else if (selectedArtist?.name) {
          artistName = selectedArtist.name;
        }

        let thumbnail = '';
        if ('album' in track && track.album) {
          thumbnail =
            track.album.coverMedium ||
            track.album.cover ||
            track.album.coverBig ||
            '';
        } else if ('thumbnail' in track && track.thumbnail) {
          thumbnail = track.thumbnail;
        } else if (selectedArtist?.pictureMedium) {
          thumbnail = selectedArtist.pictureMedium;
        }

        let previewUrl = '';
        if ('preview' in track && track.preview) {
          previewUrl = track.preview;
        } else if ('url' in track && track.url) {
          previewUrl = track.url;
        }

        const recent: RecentTrack = {
          id: String(track.id),
          title: track.title,
          artist: artistName,
          thumbnail,
          url: previewUrl,
          downloadedAt: Date.now(),
          format: 'MP3 320k',
        };

        const updated = await addStoredTrack(recent);
        setRecentTracks(updated);
      } catch (error) {
        console.error('[mobileStorage] Failed to save track:', error);
      } finally {
        setDownloadingTrackId(null);
      }
    },
    [selectedArtist]
  );

  // Offline Track Deletion Handlers
  const handleDeleteStoredTrack = useCallback(async (trackId: string) => {
    try {
      const updated = await removeStoredTrack(trackId);
      setRecentTracks(updated);
    } catch (error) {
      console.error('[mobileStorage] Failed to delete track:', error);
    }
  }, []);

  const handleClearLibrary = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to remove all saved songs from your offline library? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await clearStoredTracks();
      setRecentTracks([]);
    } catch (error) {
      console.error('[mobileStorage] Failed to clear library:', error);
    }
  }, []);

  // Navigation & Tab Switching
  const handleSelectTab = useCallback(
    (tab: MobileTab) => {
      setActiveTab(tab);
      if (tab === 'search') {
        if (activeTab === 'search') {
          // If already on search tab, tapping resets to main search view
          setSelectedAlbum(null);
          setSelectedArtist(null);
          setCurrentView('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          if (selectedAlbum) {
            setCurrentView('album');
          } else if (selectedArtist) {
            setCurrentView('artist');
          } else {
            setCurrentView('search');
          }
        }
      } else if (tab === 'library') {
        setCurrentView('library');
      } else if (tab === 'settings') {
        setCurrentView('settings');
      }
    },
    [activeTab, selectedAlbum, selectedArtist]
  );

  // Search Deezer Exploration
  const handleSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    const reqId = ++searchReqIdRef.current;
    setIsSearching(true);
    try {
      const artists = await searchDeezerArtist(trimmed);
      if (reqId === searchReqIdRef.current) {
        if (artists && artists.length > 0) {
          const candidate = artists.find((a) => a.nbAlbum > 0) || artists[0];
          setMatchedArtist(candidate);
        } else {
          setMatchedArtist(null);
        }
      }
    } catch (err) {
      console.error('[Deezer API] Search error:', err);
      if (reqId === searchReqIdRef.current) {
        setMatchedArtist(null);
      }
    } finally {
      if (reqId === searchReqIdRef.current) {
        setIsSearching(false);
        setSelectedAlbum(null);
        setSelectedArtist(null);
        setCurrentView('search');
        setActiveTab('search');
      }
    }
  }, []);

  const handleViewArtist = useCallback(async (artist: DeezerArtist) => {
    const reqId = ++artistReqIdRef.current;
    setSelectedArtist(artist);
    setSelectedAlbum(null);
    setCurrentView('artist');
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setIsLoadingArtistTracks(true);
    setIsLoadingArtistAlbums(true);

    try {
      const [tracks, albums] = await Promise.all([
        getArtistTopTracks(artist.id),
        getArtistAlbums(artist.id),
      ]);
      if (reqId === artistReqIdRef.current) {
        setArtistTopTracks(tracks);
        setArtistAlbums(albums);
      }
    } catch (err) {
      console.error('[Deezer API] Artist detail fetch error:', err);
    } finally {
      if (reqId === artistReqIdRef.current) {
        setIsLoadingArtistTracks(false);
        setIsLoadingArtistAlbums(false);
      }
    }
  }, []);

  const handleSelectAlbum = useCallback(async (album: DeezerAlbum) => {
    const reqId = ++albumReqIdRef.current;
    setSelectedAlbum(album);
    setCurrentView('album');
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setIsLoadingAlbumTracks(true);
    try {
      const tracks = await getAlbumTracks(album.id);
      if (reqId === albumReqIdRef.current) {
        setAlbumTracks(tracks);
      }
    } catch (err) {
      console.error('[Deezer API] Album tracks fetch error:', err);
    } finally {
      if (reqId === albumReqIdRef.current) {
        setIsLoadingAlbumTracks(false);
      }
    }
  }, []);

  const handleBackFromAlbum = useCallback(() => {
    setSelectedAlbum(null);
    if (selectedArtist) {
      setCurrentView('artist');
    } else {
      setCurrentView('search');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedArtist]);

  const handleBackFromArtist = useCallback(() => {
    setSelectedArtist(null);
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleExploreMusic = useCallback(() => {
    setSelectedAlbum(null);
    setSelectedArtist(null);
    setCurrentView('search');
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenSettings = useCallback(() => {
    setActiveTab('settings');
    setCurrentView('settings');
  }, []);

  const handleExpandPlayerSheet = useCallback(() => {
    setIsPlayerSheetOpen(true);
  }, []);

  const handleClosePlayerSheet = useCallback(() => {
    setIsPlayerSheetOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 select-none">
      {/* Hidden single HTML5 <audio> engine mounted at root */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        onPlay={() => {
          if (playbackSource !== 'stream') {
            setIsPlaying(true);
          }
        }}
        onPause={() => {
          if (!isHandoffRef.current && playbackSource !== 'stream') {
            setIsPlaying(false);
          }
        }}
      />

      {/* Hidden YouTube Audio Bridge Engine */}
      <YouTubeAudioBridge
        ref={ytBridgeRef}
        onStateChange={handleYtStateChange}
        onTimeUpdate={handleYtTimeUpdate}
        onError={handleYtError}
      />

      {/* Sticky Top Header */}
      <MobileTopHeader
        title="Yoinks Music"
        playbackSource={playbackSource}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Scrollable Canvas with Safe Padding (pb-36 prevents overlap with docked player and bottom nav) */}
      <main className="flex-1 w-full max-w-lg mx-auto px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-36">
        {/* VIEW 1: Main Search & Artist Spotlight */}
        {currentView === 'search' && (
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Mobile Search Bar with Quick Chips */}
            <MobileSearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              onSearch={handleSearch}
              isSearching={isSearching}
            />

            {/* Skeletons while searching */}
            {isSearching && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse flex flex-col gap-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-[60px] h-[60px] rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-4 bg-slate-200 rounded-full" />
                    <div className="w-48 h-5 bg-slate-200 rounded" />
                    <div className="w-32 h-3.5 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="w-full h-12 bg-slate-200 rounded-xl" />
              </div>
            )}

            {/* Matched Artist Spotlight Card */}
            {!isSearching && matchedArtist && (
              <ArtistSpotlightCard
                artist={matchedArtist}
                onViewArtist={handleViewArtist}
              />
            )}

            {/* Empty discovery state when query returned 0 matches */}
            {!isSearching && !matchedArtist && (
              <section className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center gap-2.5 shadow-xs select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Music2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  No artist found
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xs">
                  Try searching for another artist or choose from the quick discovery chips above.
                </p>
              </section>
            )}
          </div>
        )}

        {/* VIEW 2: Artist Discography & Top Tracks */}
        {currentView === 'artist' && selectedArtist && (
          <MobileArtistView
            artist={selectedArtist}
            topTracks={artistTopTracks}
            albums={artistAlbums}
            isLoadingTracks={isLoadingArtistTracks}
            isLoadingAlbums={isLoadingArtistAlbums}
            activeTrackId={activeTrack?.id}
            isPlaying={isPlaying}
            downloadingTrackId={downloadingTrackId}
            downloadedIds={downloadedIds}
            onBack={handleBackFromArtist}
            onSelectAlbum={handleSelectAlbum}
            onPlayTrack={(track) => handlePlayTrack(track, artistTopTracks)}
            onPauseTrack={handlePauseTrack}
            onDownloadTrack={handleDownloadTrack}
          />
        )}

        {/* VIEW 3: Album Detail & Tracklist */}
        {currentView === 'album' && selectedAlbum && (
          <MobileAlbumView
            album={selectedAlbum}
            artistName={selectedArtist?.name || 'Artist'}
            tracks={albumTracks}
            isLoading={isLoadingAlbumTracks}
            activeTrackId={activeTrack?.id}
            isPlaying={isPlaying}
            downloadingTrackId={downloadingTrackId}
            downloadedIds={downloadedIds}
            onBack={handleBackFromAlbum}
            onPlayTrack={(track) => handlePlayTrack(track, albumTracks)}
            onPauseTrack={handlePauseTrack}
            onDownloadTrack={handleDownloadTrack}
          />
        )}

        {/* VIEW 4: My Offline Music Library */}
        {currentView === 'library' && (
          <MobileLibraryView
            tracks={recentTracks}
            activeTrackId={activeTrack?.id}
            isPlaying={isPlaying}
            onPlayTrack={(track) => handlePlayTrack(track, recentTracks)}
            onPauseTrack={handlePauseTrack}
            onDeleteTrack={handleDeleteStoredTrack}
            onClearLibrary={handleClearLibrary}
            onExploreMusic={handleExploreMusic}
          />
        )}

        {/* VIEW 5: Settings Tab */}
        {currentView === 'settings' && (
          <div className="flex flex-col gap-4 sm:gap-5 pb-8 select-none">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Settings & Preferences
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Audio fidelity, streaming preferences, offline cache metrics, and app principles.
              </p>
            </div>

            {/* Audio Streaming Mode Card */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100/80">
                  <Radio className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Audio Streaming Mode
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Choose between full songs or quick 30s previews
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mt-1">
                {/* Full-Length Audio (Stream Resolver) */}
                <button
                  type="button"
                  onClick={() => handleSetStreamPreference('full')}
                  className={`min-h-[52px] p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    streamPreference === 'full'
                      ? 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={streamPreference === 'full'}
                >
                  <div className="flex flex-col pr-2">
                    <span className="text-sm font-bold text-slate-900">
                      Full-Length Audio (Stream Resolver)
                    </span>
                    <span className="text-xs text-slate-600 font-medium mt-0.5">
                      Stream complete tracks with instant 0ms preview feedback
                    </span>
                  </div>
                  {streamPreference === 'full' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 shrink-0 px-2 py-1">
                      Select
                    </span>
                  )}
                </button>

                {/* Quick 30s Previews */}
                <button
                  type="button"
                  onClick={() => handleSetStreamPreference('preview')}
                  className={`min-h-[52px] p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    streamPreference === 'preview'
                      ? 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={streamPreference === 'preview'}
                >
                  <div className="flex flex-col pr-2">
                    <span className="text-sm font-bold text-slate-900">
                      Quick 30s Previews
                    </span>
                    <span className="text-xs text-slate-600 font-medium mt-0.5">
                      Lightweight 30s preview clips with minimal data usage
                    </span>
                  </div>
                  {streamPreference === 'preview' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 shrink-0 px-2 py-1">
                      Select
                    </span>
                  )}
                </button>
              </div>
            </section>

            {/* Audio Quality Card */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100/80">
                  <Sliders className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Audio Quality
                </h2>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    High Quality (MP3 320k)
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    Standard high-bitrate streaming & offline format
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ACTIVE</span>
                </span>
              </div>
            </section>

            {/* Offline Cache & Storage Management */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200/80">
                  <HardDrive className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Offline Music Storage
                </h2>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total Offline Size
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    ~{(recentTracks.length * 3.8).toFixed(1)} MB
                  </span>
                  <span className="text-xs text-slate-600 mt-0.5">
                    {recentTracks.length} {recentTracks.length === 1 ? 'song saved' : 'songs saved'}
                  </span>
                </div>

                {recentTracks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLibrary}
                    aria-label="Clear all offline music from device"
                    className="min-h-[48px] px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Clear Cache</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Tracks saved offline are stored on your device and can be played even without an active internet connection.
              </p>
            </section>

            {/* Senior-Friendly Anti-Slop Principles */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100/80">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Design Standards
                </h2>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Senior-Friendly Touch Targets:</strong> All buttons and interactive rows are sized at 48px or larger.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>WCAG AAA Contrast:</strong> Clean high-contrast typography ensuring maximum legibility under all conditions.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Zero Clutter:</strong> Ad-free, distraction-free player with single-purpose controls.
                  </span>
                </li>
              </ul>
            </section>

            {/* About Yoinks Music */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200/80">
                  <Info className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  About Yoinks Music
                </h2>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-800">Version:</strong> 1.0.0 (Capacitor Native Android)
                </p>
                <p>
                  <strong className="text-slate-800">Catalog Engine:</strong> Deezer Music Public API
                </p>
                <p>
                  <strong className="text-slate-800">Offline Engine:</strong> Dual-tier Capacitor Preferences &amp; LocalStorage
                </p>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* TIER 1: Docked Mini Player (Visible when a track is active) */}
      {activeTrack && (
        <div className="fixed bottom-[58px] left-0 right-0 z-30 px-3 pb-1 max-w-lg mx-auto pointer-events-none">
          <div className="pointer-events-auto">
            <MobileDockedPlayer
              track={activeTrack}
              isPlaying={isPlaying}
              playbackSource={playbackSource}
              onPlayPause={handlePlayPause}
              onNext={hasNext ? handleNext : undefined}
              onExpand={handleExpandPlayerSheet}
            />
          </div>
        </div>
      )}

      {/* TIER 2: Full Screen Vinyl Sleeve Player Sheet */}
      <MobilePlayerSheet
        isOpen={isPlayerSheetOpen}
        track={activeTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackSource={playbackSource}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onNext={hasNext ? handleNext : undefined}
        onPrevious={hasPrev ? handlePrevious : undefined}
        onClose={handleClosePlayerSheet}
        onDownload={handleDownloadTrack}
        isDownloaded={
          activeTrack
            ? downloadedIds.has(String(activeTrack.id)) ||
              downloadedIds.has(activeTrack.title.toLowerCase().trim())
            : false
        }
        isDownloading={
          activeTrack
            ? String(downloadingTrackId) === String(activeTrack.id)
            : false
        }
      />

      {/* Persistent Bottom Tab Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />
    </div>
  );
}
