import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, Disc3, ArrowRight, Users } from 'lucide-react';
import { DeezerArtist } from '../types';

export interface ArtistSpotlightCardProps {
  artist: DeezerArtist;
  onViewArtist: (artist: DeezerArtist) => void;
}

export const ArtistSpotlightCard: React.FC<ArtistSpotlightCardProps> = React.memo(({
  artist,
  onViewArtist,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [artist.id, artist.pictureMedium, artist.pictureBig]);

  const imageUrl =
    artist.pictureMedium ||
    artist.pictureBig ||
    artist.picture ||
    artist.pictureXl ||
    artist.pictureSmall;

  return (
    <article className="bg-zinc-900/70 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-xl flex flex-col gap-3.5 select-none hover:border-white/20 transition-colors duration-200">
      {/* Row 1: Portrait & Info */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onViewArtist(artist)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewArtist(artist);
          }
        }}
        aria-label={`View discography for ${artist.name}`}
        className="flex items-center gap-3.5 cursor-pointer rounded-xl p-1 -m-1 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        {/* 64x64px circular artist portrait */}
        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-zinc-800 flex items-center justify-center shadow-md">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={artist.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User className="w-7 h-7 text-zinc-400" aria-hidden="true" />
          )}
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5 justify-center">
          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" aria-hidden="true" />
            <span>Verified Artist</span>
          </div>

          <h3
            className="text-lg font-semibold text-zinc-100 truncate tracking-tight"
            title={artist.name}
          >
            {artist.name}
          </h3>

          <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <Disc3 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" aria-hidden="true" />
              <span>
                {artist.nbAlbum} {artist.nbAlbum === 1 ? 'Album' : 'Albums'}
              </span>
            </span>

            {typeof artist.nbFan === 'number' && artist.nbFan > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" aria-hidden="true" />
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" aria-hidden="true" />
                  <span>{artist.nbFan.toLocaleString()} listeners</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Clean action CTA button */}
      <button
        type="button"
        onClick={() => onViewArtist(artist)}
        className="w-full h-11 px-4 rounded-xl bg-zinc-100 text-zinc-950 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <span>Explore Discography</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </article>
  );
});

ArtistSpotlightCard.displayName = 'ArtistSpotlightCard';
export default ArtistSpotlightCard;
