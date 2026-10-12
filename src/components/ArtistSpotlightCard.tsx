import React, { useState, useEffect } from 'react';
import { User, BadgeCheck, Disc3, ArrowRight, Users } from 'lucide-react';
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

  // Reset image error state whenever the artist changes
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
    <article className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col gap-3.5 select-none">
      {/* Row 1: Portrait & Info (clickable for quick discography access) */}
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
        className="flex items-center gap-3.5 cursor-pointer rounded-xl p-1 -m-1 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        {/* 60x60px circular artist portrait with fallback */}
        <div className="w-[60px] h-[60px] rounded-full overflow-hidden flex-shrink-0 border border-slate-200/80 bg-slate-100 flex items-center justify-center shadow-xs">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={artist.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User className="w-7 h-7 text-slate-400" aria-hidden="true" />
          )}
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5 justify-center">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold tracking-wider uppercase border border-blue-100/80 w-fit">
            <BadgeCheck className="w-[13px] h-[13px] text-blue-600 flex-shrink-0" aria-hidden="true" />
            <span>VERIFIED ARTIST</span>
          </div>

          {/* Artist name */}
          <h3
            className="text-lg sm:text-xl font-bold text-slate-900 truncate"
            title={artist.name}
          >
            {artist.name}
          </h3>

          {/* Stats: Albums count with Disc3 icon, fan count if > 0 */}
          <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <Disc3 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
              <span>
                {artist.nbAlbum} {artist.nbAlbum === 1 ? 'Album' : 'Albums'}
              </span>
            </span>

            {typeof artist.nbFan === 'number' && artist.nbFan > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" aria-hidden="true" />
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
                  <span>
                    {artist.nbFan.toLocaleString()} {artist.nbFan === 1 ? 'Fan' : 'Fans'}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Full-width primary CTA button */}
      <button
        type="button"
        onClick={() => onViewArtist(artist)}
        aria-label={`View discography and albums for ${artist.name}`}
        className="min-h-[48px] w-full px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <span>View Discography & Albums</span>
        <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      </button>
    </article>
  );
});

ArtistSpotlightCard.displayName = 'ArtistSpotlightCard';
export default ArtistSpotlightCard;
