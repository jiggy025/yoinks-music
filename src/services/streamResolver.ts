import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { ResolvedStream } from '../types';

const REQUEST_TIMEOUT_MS = 6000;
const HTTP_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// In-memory cache for O(1) resolution
const memoryCache = new Map<string, string>();

/**
 * Normalizes artist/title string for preference cache key format.
 */
function normalizeKeyPart(str: string): string {
  const ascii = (str || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (ascii.length > 0) {
    return ascii;
  }
  return encodeURIComponent((str || '').toLowerCase().trim()).replace(/%/g, '_');
}

/**
 * Generates persistent cache key: stream_${normalizedArtist}_${normalizedTitle}
 */
function getCacheKey(artist: string, title: string): string {
  const normalizedArtist = normalizeKeyPart(artist);
  const normalizedTitle = normalizeKeyPart(title);
  return `stream_${normalizedArtist}_${normalizedTitle}`;
}

/**
 * Checks in-memory cache and Preferences cache for a previously resolved video ID.
 */
export async function getCachedStream(title: string, artist: string): Promise<string | null> {
  if (!title || !artist) return null;
  const key = getCacheKey(artist, title);

  // 1. In-memory check: O(1)
  const memValue = memoryCache.get(key);
  if (memValue) {
    return memValue;
  }

  // 2. Preferences persistent cache check
  try {
    const { value } = await Preferences.get({ key });
    if (value) {
      memoryCache.set(key, value);
      return value;
    }
  } catch (err) {
    // Non-fatal if Preferences is unavailable
  }

  return null;
}

/**
 * Persists resolved video ID to in-memory cache and Preferences.
 */
export async function cacheStream(title: string, artist: string, videoId: string): Promise<void> {
  if (!title || !artist || !videoId) return;
  const key = getCacheKey(artist, title);

  memoryCache.set(key, videoId);

  try {
    await Preferences.set({ key, value: videoId });
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Clears stream cache in memory and removes all stream_* keys from Preferences.
 */
export async function clearStreamCache(): Promise<void> {
  memoryCache.clear();

  try {
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      if (key.startsWith('stream_')) {
        await Preferences.remove({ key });
      }
    }
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Fetches HTML from YouTube search endpoint using CapacitorHttp on native devices
 * or fetch in web browsers, with a 6-second timeout and abort signal support.
 */
async function fetchYouTubeHtml(url: string, signal?: AbortSignal): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onCallerAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      return null;
    }
    signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const nativePromise = CapacitorHttp.get({
        url,
        headers: HTTP_HEADERS,
        connectTimeout: REQUEST_TIMEOUT_MS,
        readTimeout: REQUEST_TIMEOUT_MS,
      });

      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
      });

      const response = await Promise.race([nativePromise, abortPromise]);
      if (response.status >= 200 && response.status < 300) {
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }
      return null;
    } else {
      const res = await fetch(url, {
        headers: HTTP_HEADERS,
        signal: controller.signal,
      });

      if (!res.ok) {
        return null;
      }

      return await res.text();
    }
  } catch (err) {
    // Timeout, network error, or abort
    return null;
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', onCallerAbort);
    }
  }
}

/**
 * Resolves a track to a YouTube stream video ID.
 * Checks memory & Preferences cache first. If not cached, performs YouTube search,
 * extracts the top video ID, caches it, and returns ResolvedStream.
 */
export async function resolveTrackStream(
  title: string,
  artist: string,
  signal?: AbortSignal
): Promise<ResolvedStream | null> {
  if (!title || !artist || !title.trim() || !artist.trim()) {
    return null;
  }

  const trimmedTitle = title.trim();
  const trimmedArtist = artist.trim();

  try {
    // 1. Check cache first: O(1)
    const cachedVideoId = await getCachedStream(trimmedTitle, trimmedArtist);
    if (cachedVideoId) {
      return {
        videoId: cachedVideoId,
        source: 'youtube',
        title: trimmedTitle,
        artist: trimmedArtist,
      };
    }

    // 2. Build search query: `${artist} ${title} audio`
    const query = `${trimmedArtist} ${trimmedTitle} audio`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    // 3. Network fetcher
    const html = await fetchYouTubeHtml(url, signal);
    if (!html) {
      return null;
    }

    // 4. Extraction logic: match videoId and pick top unique match
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1]);
    }

    const uniqueVideoIds = Array.from(new Set(matches));
    if (uniqueVideoIds.length === 0) {
      return null;
    }

    const topVideoId = uniqueVideoIds[0];

    // 5. Cache result
    await cacheStream(trimmedTitle, trimmedArtist, topVideoId);

    return {
      videoId: topVideoId,
      source: 'youtube',
      title: trimmedTitle,
      artist: trimmedArtist,
    };
  } catch (error) {
    // Gracefully handle any unexpected errors
    return null;
  }
}
