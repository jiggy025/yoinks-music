/**
 * Formats duration in seconds into mm:ss (or hh:mm:ss for durations >= 1 hour).
 * Handles finite and positive checks defensively.
 * Examples:
 *   - 273 => "4:33"
 *   - 45 => "0:45"
 *   - 3665 => "1:01:05"
 *   - invalid / negative / 0 => "0:00"
 */
export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    const paddedMins = mins.toString().padStart(2, '0');
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${mins}:${paddedSecs}`;
}

/**
 * Cleans up media titles by removing excessive bracketed noise tags
 * (e.g. "[Official Video]", "[Official Music Video]", "(Lyrics)", "【HD】") and trimming clutter.
 */
export function sanitizeTitle(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text;

  // Remove common media tags in (), [], or 【】
  const tagsRegex =
    /\s*(\(|\[|【)(?:official\s+(?:music\s+)?video|official\s+audio|official\s+hd|official\s+4k|official\s+visualizer|music\s+video|lyric\s+video|official\s+mv|official|audio|lyrics|lyric|hd|hq|4k|1080p|720p|mv|remastered|explicit|full\s+album|visualizer)(\)|\]|】)\s*/gi;
  cleaned = cleaned.replace(tagsRegex, ' ');

  // Collapse consecutive spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Strip trailing punctuation like dashes, pipes, colons left over
  cleaned = cleaned.replace(/[\s\-_|:]+$/, '').trim();

  return cleaned || text.trim();
}

/**
 * Formats a timestamp into a user-friendly date string.
 * Examples:
 *   Today at 2:15 PM => "Today, 2:15 PM"
 *   Yesterday at 3:00 PM => "Yesterday, 3:00 PM"
 *   Other dates => "Oct 9, 2026"
 */
export function formatDate(timestamp: number): string {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0) {
    return '';
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a byte count into a human-readable string (B, KB, MB, GB).
 */
export function formatBytes(bytes?: number): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB';
  }
  const gb = 1024 * 1024 * 1024;
  const mb = 1024 * 1024;
  const kb = 1024;

  if (bytes >= gb) {
    return `${(bytes / gb).toFixed(2)} GB`;
  }
  if (bytes >= mb) {
    return `${(bytes / mb).toFixed(1)} MB`;
  }
  if (bytes >= kb) {
    return `${Math.round(bytes / kb)} KB`;
  }
  return `${bytes} B`;
}
