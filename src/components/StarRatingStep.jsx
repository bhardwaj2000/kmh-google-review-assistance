import { useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function StarRatingStep({
  shopName,
  shopLocation,
  shopDetails,
  onSelectRating,
}) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [pressedStar, setPressedStar] = useState(0);

  const activeStar = hoveredStar || pressedStar;
  const activeLabel = activeStar ? RATING_LABELS[activeStar] : 'Tap a star to rate your visit';

  return (
    <motion.div
      key="step-rating"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center"
    >
      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium text-[#1A56DB]">
          Thank you for visiting
        </p>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#111827] leading-tight">
          {shopName}
        </h1>
        {shopLocation ? (
          <p className="text-xs sm:text-[13px] font-medium text-[#5B6472]">
            Curtains &amp; Handloom Furnishings · {shopLocation}
          </p>
        ) : (
          shopDetails && (
            <p className="text-sm text-[#5B6472] max-w-xs mx-auto leading-relaxed">
              {shopDetails}
            </p>
          )
        )}
      </div>

      <div className="w-full border-t border-slate-100 pt-7 pb-2">
        <h2 className="text-base sm:text-lg font-semibold text-[#111827] mb-1.5">
          How was your experience today?
        </h2>
        <p className="text-sm text-[#5B6472] mb-6">
          Your quick feedback means a lot to our team.
        </p>

        <div
          className="flex items-center justify-center gap-1.5 sm:gap-2.5"
          role="radiogroup"
          aria-label="Rate your experience from 1 to 5 stars"
          onMouseLeave={() => setHoveredStar(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= activeStar;
            return (
              <motion.button
                key={star}
                type="button"
                role="radio"
                aria-checked={pressedStar === star}
                aria-label={`${star} ${star === 1 ? 'star' : 'stars'} — ${RATING_LABELS[star]}`}
                onMouseEnter={() => setHoveredStar(star)}
                onFocus={() => setHoveredStar(star)}
                onBlur={() => setHoveredStar(0)}
                onPointerDown={() => setPressedStar(star)}
                onClick={() => {
                  setPressedStar(star);
                  onSelectRating(star);
                }}
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2 cursor-pointer"
              >
                <Star
                  className={`h-9 w-9 sm:h-10 sm:w-10 transition-colors duration-150 ${
                    isFilled
                      ? 'fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                      : 'fill-slate-100 text-slate-300 group-hover:text-amber-300'
                  }`}
                  strokeWidth={1.75}
                />
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 h-6 flex items-center justify-center">
          <motion.span
            key={activeLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14 }}
            className={`text-sm font-medium ${
              activeStar ? 'text-[#111827]' : 'text-[#6B7280]'
            }`}
          >
            {activeStar ? `${activeStar} / 5 · ${activeLabel}` : activeLabel}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
