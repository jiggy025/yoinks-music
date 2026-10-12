export type FormatKind = 'audio' | 'video';

export interface DeezerArtist {
  id: number;
  name: string;
  picture: string;
  pictureSmall?: string;
  pictureMedium: string;
  pictureBig: string;
  pictureXl: string;
  nbAlbum: number;
  nbFan: number;
  tracklist: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  durationFormatted: string;
  preview: string;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    coverMedium: string;
    coverBig: string;
  };
  resolvedVideoId?: string;
}

export interface DeezerAlbum {
  id: number;
  title: string;
  cover: string;
  coverMedium: string;
  coverBig: string;
  coverXl: string;
  releaseDate?: string;
  releaseYear: string;
  trackCount?: number;
}

export interface RecentTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  filePath?: string;
  fileUri?: string;
  format?: string;
  downloadedAt: number;
  url?: string;
  resolvedVideoId?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  url: string;
  format?: FormatKind;
}

export interface ResolvedStream {
  videoId: string;
  source: 'youtube';
  title?: string;
  artist?: string;
  duration?: number;
}

export type PlaybackSource = 'stream' | 'preview' | 'offline';

