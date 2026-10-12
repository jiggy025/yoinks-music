import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  HardDrive,
  Trash2,
  Sliders,
  CheckCircle2,
  Info,
  Music2,
  Sparkles,
} from 'lucide-react';
import type {
  DeezerArtist,
  DeezerTrack,
  DeezerAlbum,
  RecentTrack,
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
  type MobileTab,
  type AnyPlayableTrack,
} from './components';
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
  const [activeTrack, setActiveTrack] = useState<AnyPlayableTrack | null>(null);
  const [activeQueue, setActiveQueue] = useState<AnyPlayableTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);

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
    (track: AnyPlayableTrack, queue?: AnyPlayableTrack[]) => {
      if (queue) {
        setActiveQueue(queue);
      }
      setActiveTrack(track);
      setIsPlaying(true);

      const audio = audioRef.current;
      if (audio) {
        const streamUrl = getTrackAudioUrl(track);
        if (audio.src !== streamUrl) {
          audio.src = streamUrl;
          audio.currentTime = 0;
        }
        audio.play().catch((err) => {
          console.warn('[Audio Engine] Play error:', err);
          setIsPlaying(false);
        });
      }
    },
    []
  );

  const handlePauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
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
  }, [isPlaying, activeTrack]);

  const handleNext = useCallback(() => {
    if (currentQueueIndex >= 0 && currentQueueIndex < activeQueue.length - 1) {
      const nextTrack = activeQueue[currentQueueIndex + 1];
      handlePlayTrack(nextTrack);
    }
  }, [currentQueueIndex, activeQueue, handlePlayTrack]);

  const handlePrevious = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (currentQueueIndex > 0) {
      const prevTrack = activeQueue[currentQueueIndex - 1];
      handlePlayTrack(prevTrack);
    }
  }, [currentQueueIndex, activeQueue, handlePlayTrack]);

  const handleSeek = useCallback((timeSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSec;
      setCurrentTime(timeSec);
    }
  }, []);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const clamped = Math.max(0, Math.min(1, newVolume));
      setVolume(clamped);
      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }
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
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  // Audio Element Event Handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, []);

  const handleAudioEnded = useCallback(() => {
    if (hasNext) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  }, [hasNext, handleNext]);

  const handleAudioError = useCallback(() => {
    console.warn('[Audio Engine] Playback error encountered gracefully.');
    setIsPlaying(false);
  }, []);

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

    setIsSearching(true);
    try {
      const artists = await searchDeezerArtist(trimmed);
      if (artists && artists.length > 0) {
        const candidate = artists.find((a) => a.nbAlbum > 0) || artists[0];
        setMatchedArtist(candidate);
      } else {
        setMatchedArtist(null);
      }
    } catch (err) {
      console.error('[Deezer API] Search error:', err);
      setMatchedArtist(null);
    } finally {
      setIsSearching(false);
      setSelectedAlbum(null);
      setSelectedArtist(null);
      setCurrentView('search');
      setActiveTab('search');
    }
  }, []);

  const handleViewArtist = useCallback(async (artist: DeezerArtist) => {
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
      setArtistTopTracks(tracks);
      setArtistAlbums(albums);
    } catch (err) {
      console.error('[Deezer API] Artist detail fetch error:', err);
    } finally {
      setIsLoadingArtistTracks(false);
      setIsLoadingArtistAlbums(false);
    }
  }, []);

  const handleSelectAlbum = useCallback(async (album: DeezerAlbum) => {
    setSelectedAlbum(album);
    setCurrentView('album');
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setIsLoadingAlbumTracks(true);
    try {
      const tracks = await getAlbumTracks(album.id);
      setAlbumTracks(tracks);
    } catch (err) {
      console.error('[Deezer API] Album tracks fetch error:', err);
    } finally {
      setIsLoadingAlbumTracks(false);
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Sticky Top Header */}
      <MobileTopHeader
        title="Yoinks Music"
        format="MP3 320k"
        onOpenSettings={() => {
          setActiveTab('settings');
          setCurrentView('settings');
        }}
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
                Audio fidelity, offline cache metrics, and app principles.
              </p>
            </div>

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
              onPlayPause={handlePlayPause}
              onNext={hasNext ? handleNext : undefined}
              onExpand={() => setIsPlayerSheetOpen(true)}
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
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onNext={hasNext ? handleNext : undefined}
        onPrevious={hasPrev ? handlePrevious : undefined}
        onClose={() => setIsPlayerSheetOpen(false)}
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
