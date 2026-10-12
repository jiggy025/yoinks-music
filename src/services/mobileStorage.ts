import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { RecentTrack } from '../types';

const RECENT_TRACKS_KEY = 'recent_tracks';

// In-memory fallback if both Preferences and localStorage are unavailable (e.g. Node.js environment)
const inMemoryFallback = new Map<string, string>();

function isWindowAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function canUsePreferences(): boolean {
  return Capacitor.isNativePlatform() || typeof window !== 'undefined';
}

/**
 * Retrieves raw string value from storage with Preferences and localStorage fallback.
 */
async function getRaw(key: string): Promise<string | null> {
  if (canUsePreferences()) {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch (err) {
      console.warn('[mobileStorage] Preferences.get failed, trying localStorage fallback:', err);
    }
  }

  if (isWindowAvailable()) {
    try {
      const localVal = window.localStorage.getItem(key);
      if (localVal !== null && localVal !== undefined) {
        return localVal;
      }
    } catch (err) {
      console.warn('[mobileStorage] localStorage.getItem failed:', err);
    }
  }

  return inMemoryFallback.get(key) ?? null;
}

/**
 * Stores raw string value to storage with dual persistence across Preferences and localStorage.
 */
async function setRaw(key: string, value: string): Promise<void> {
  let saved = false;

  if (canUsePreferences()) {
    try {
      await Preferences.set({ key, value });
      saved = true;
    } catch (err) {
      console.warn('[mobileStorage] Preferences.set failed, trying localStorage fallback:', err);
    }
  }

  if (isWindowAvailable()) {
    try {
      window.localStorage.setItem(key, value);
      saved = true;
    } catch (err) {
      console.warn('[mobileStorage] localStorage.setItem failed:', err);
    }
  }

  if (!saved) {
    inMemoryFallback.set(key, value);
  }
}

/**
 * Removes value from storage with Preferences and localStorage fallback.
 */
async function removeRaw(key: string): Promise<void> {
  if (canUsePreferences()) {
    try {
      await Preferences.remove({ key });
    } catch (err) {
      console.warn('[mobileStorage] Preferences.remove failed:', err);
    }
  }

  if (isWindowAvailable()) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn('[mobileStorage] localStorage.removeItem failed:', err);
    }
  }

  inMemoryFallback.delete(key);
}

const MAX_STORED_TRACKS = 100;

/**
 * Retrieves the stored list of recent tracks.
 * Returns empty array if none stored, corrupted, or on error.
 */
export async function getStoredTracks(): Promise<RecentTrack[]> {
  try {
    const raw = await getRaw(RECENT_TRACKS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is RecentTrack =>
        Boolean(
          item &&
          typeof item === 'object' &&
          'id' in item &&
          item.id != null &&
          String(item.id).trim().length > 0
        )
      );
    }
    return [];
  } catch (error) {
    console.error('[mobileStorage] getStoredTracks error:', error);
    return [];
  }
}

/**
 * Adds a track to recent tracks storage.
 * Deduplicates by ID and prepends the new track to the start of the list.
 * Bounded by MAX_STORED_TRACKS to prevent unbounded storage growth.
 */
export async function addStoredTrack(track: RecentTrack): Promise<RecentTrack[]> {
  if (!track || (typeof track.id !== 'string' && typeof track.id !== 'number')) {
    return await getStoredTracks();
  }

  const cleanId = String(track.id).trim();
  if (!cleanId) {
    return await getStoredTracks();
  }

  const normalizedTrack: RecentTrack = {
    ...track,
    id: cleanId,
    downloadedAt: track.downloadedAt || Date.now(),
  };

  try {
    const current = await getStoredTracks();
    const filtered = current.filter((t) => String(t.id).trim() !== cleanId);
    const updated = [normalizedTrack, ...filtered].slice(0, MAX_STORED_TRACKS);
    await setRaw(RECENT_TRACKS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[mobileStorage] addStoredTrack error:', error);
    return await getStoredTracks();
  }
}

/**
 * Removes a track from recent tracks storage by ID.
 */
export async function removeStoredTrack(id: string): Promise<RecentTrack[]> {
  if (!id) {
    return await getStoredTracks();
  }

  try {
    const current = await getStoredTracks();
    const updated = current.filter((t) => String(t.id) !== String(id));
    await setRaw(RECENT_TRACKS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[mobileStorage] removeStoredTrack error:', error);
    return await getStoredTracks();
  }
}

/**
 * Clears all stored recent tracks.
 */
export async function clearStoredTracks(): Promise<void> {
  try {
    await removeRaw(RECENT_TRACKS_KEY);
  } catch (error) {
    console.error('[mobileStorage] clearStoredTracks error:', error);
  }
}
