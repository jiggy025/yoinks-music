import type { DeezerArtist, DeezerTrack, DeezerAlbum } from '../types';
import { formatDuration } from '../utils/formatters';

const DEEZER_BASE_URL = 'https://api.deezer.com';
const REQUEST_TIMEOUT_MS = 10_000;

function createSignal(callerSignal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  if (!callerSignal) return timeoutSignal;
  if (typeof (AbortSignal as any).any === 'function') {
    return (AbortSignal as any).any([callerSignal, timeoutSignal]);
  }
  return callerSignal;
}

/**
 * Searches for artists matching query using Deezer public search API.
 * Returns empty array on rate limits, negative/empty query, or network errors.
 */
export async function searchDeezerArtist(query: string, callerSignal?: AbortSignal): Promise<DeezerArtist[]> {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }
  const trimmed = query.trim();

  try {
    const url = `${DEEZER_BASE_URL}/search/artist?q=${encodeURIComponent(trimmed)}&limit=10`;
    const res = await fetch(url, { signal: createSignal(callerSignal) });
    if (!res.ok) {
      console.warn(`[Deezer API] searchDeezerArtist HTTP ${res.status}: ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    if (json?.error) {
      console.warn(`[Deezer API] Error ${json.error.code}: ${json.error.message}`);
      return [];
    }
    if (!json || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any): DeezerArtist => ({
      id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
      name: item.name || '',
      picture: item.picture || '',
      pictureSmall: item.picture_small || item.picture || undefined,
      pictureMedium: item.picture_medium || item.picture || '',
      pictureBig: item.picture_big || item.picture || '',
      pictureXl: item.picture_xl || item.picture_big || item.picture || '',
      nbAlbum: typeof item.nb_album === 'number' ? item.nb_album : Number(item.nb_album) || 0,
      nbFan: typeof item.nb_fan === 'number' ? item.nb_fan : Number(item.nb_fan) || 0,
      tracklist: item.tracklist || '',
    }));
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return [];
    }
    console.error('[Deezer API] searchDeezerArtist error:', error);
    return [];
  }
}

/**
 * Fetches top tracks for an artist by ID.
 * Returns up to 25 top tracks with formatted durations and preview URLs.
 */
export async function getArtistTopTracks(artistId: number, callerSignal?: AbortSignal): Promise<DeezerTrack[]> {
  if (typeof artistId !== 'number' || !Number.isFinite(artistId) || artistId <= 0) {
    return [];
  }

  try {
    const url = `${DEEZER_BASE_URL}/artist/${artistId}/top?limit=25`;
    const res = await fetch(url, { signal: createSignal(callerSignal) });
    if (!res.ok) {
      console.warn(`[Deezer API] getArtistTopTracks HTTP ${res.status}: ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    if (json?.error) {
      console.warn(`[Deezer API] Error ${json.error.code}: ${json.error.message}`);
      return [];
    }
    if (!json || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any): DeezerTrack => {
      const duration = typeof item.duration === 'number' ? item.duration : Number(item.duration) || 0;
      return {
        id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
        title: item.title || '',
        duration,
        durationFormatted: formatDuration(duration),
        preview: item.preview || '',
        artist: {
          id: typeof item.artist?.id === 'number' ? item.artist.id : Number(item.artist?.id) || artistId,
          name: item.artist?.name || '',
        },
        album: {
          id: typeof item.album?.id === 'number' ? item.album.id : Number(item.album?.id) || 0,
          title: item.album?.title || '',
          cover: item.album?.cover || (item.album?.id ? `${DEEZER_BASE_URL}/album/${item.album.id}/image` : ''),
          coverMedium: item.album?.cover_medium || (item.album?.id ? `${DEEZER_BASE_URL}/album/${item.album.id}/image?size=medium` : ''),
          coverBig: item.album?.cover_big || (item.album?.id ? `${DEEZER_BASE_URL}/album/${item.album.id}/image?size=big` : ''),
        },
      };
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return [];
    }
    console.error('[Deezer API] getArtistTopTracks error:', error);
    return [];
  }
}

/**
 * Fetches albums for an artist by ID.
 * Returns up to 50 albums with releaseYear extracted from release_date.
 */
export async function getArtistAlbums(artistId: number, callerSignal?: AbortSignal): Promise<DeezerAlbum[]> {
  if (typeof artistId !== 'number' || !Number.isFinite(artistId) || artistId <= 0) {
    return [];
  }

  try {
    const url = `${DEEZER_BASE_URL}/artist/${artistId}/albums?limit=50`;
    const res = await fetch(url, { signal: createSignal(callerSignal) });
    if (!res.ok) {
      console.warn(`[Deezer API] getArtistAlbums HTTP ${res.status}: ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    if (json?.error) {
      console.warn(`[Deezer API] Error ${json.error.code}: ${json.error.message}`);
      return [];
    }
    if (!json || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any): DeezerAlbum => {
      const releaseDate = item.release_date || undefined;
      const releaseYear = releaseDate ? releaseDate.slice(0, 4) : '';
      return {
        id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
        title: item.title || '',
        cover: item.cover || (item.id ? `${DEEZER_BASE_URL}/album/${item.id}/image` : ''),
        coverMedium: item.cover_medium || (item.id ? `${DEEZER_BASE_URL}/album/${item.id}/image?size=medium` : ''),
        coverBig: item.cover_big || (item.id ? `${DEEZER_BASE_URL}/album/${item.id}/image?size=big` : ''),
        coverXl: item.cover_xl || item.cover_big || (item.id ? `${DEEZER_BASE_URL}/album/${item.id}/image?size=big` : ''),
        releaseDate,
        releaseYear,
        trackCount: typeof item.nb_tracks === 'number' ? item.nb_tracks : undefined,
      };
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return [];
    }
    console.error('[Deezer API] getArtistAlbums error:', error);
    return [];
  }
}

/**
 * Fetches tracks for an album by ID.
 * Returns up to 50 tracks mapped to DeezerTrack.
 */
export async function getAlbumTracks(albumId: number, callerSignal?: AbortSignal): Promise<DeezerTrack[]> {
  if (typeof albumId !== 'number' || !Number.isFinite(albumId) || albumId <= 0) {
    return [];
  }

  try {
    const url = `${DEEZER_BASE_URL}/album/${albumId}/tracks?limit=50`;
    const res = await fetch(url, { signal: createSignal(callerSignal) });
    if (!res.ok) {
      console.warn(`[Deezer API] getAlbumTracks HTTP ${res.status}: ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    if (json?.error) {
      console.warn(`[Deezer API] Error ${json.error.code}: ${json.error.message}`);
      return [];
    }
    if (!json || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item: any): DeezerTrack => {
      const duration = typeof item.duration === 'number' ? item.duration : Number(item.duration) || 0;
      const cover = item.album?.cover || (albumId ? `${DEEZER_BASE_URL}/album/${albumId}/image` : '');
      const coverMedium = item.album?.cover_medium || (item.md5_image ? `https://cdn-images.dzcdn.net/images/cover/${item.md5_image}/250x250-000000-80-0-0.jpg` : (albumId ? `${DEEZER_BASE_URL}/album/${albumId}/image?size=medium` : ''));
      const coverBig = item.album?.cover_big || (item.md5_image ? `https://cdn-images.dzcdn.net/images/cover/${item.md5_image}/500x500-000000-80-0-0.jpg` : (albumId ? `${DEEZER_BASE_URL}/album/${albumId}/image?size=big` : ''));

      return {
        id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
        title: item.title || '',
        duration,
        durationFormatted: formatDuration(duration),
        preview: item.preview || '',
        artist: {
          id: typeof item.artist?.id === 'number' ? item.artist.id : Number(item.artist?.id) || 0,
          name: item.artist?.name || '',
        },
        album: {
          id: typeof item.album?.id === 'number' ? item.album.id : albumId,
          title: item.album?.title || '',
          cover,
          coverMedium,
          coverBig,
        },
      };
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return [];
    }
    console.error('[Deezer API] getAlbumTracks error:', error);
    return [];
  }
}
