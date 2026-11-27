import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Star,
} from 'lucide-react';
import { RATING_LABELS } from './StarRatingStep.jsx';

function countWords(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function AiReviewStep({
  shopName,
  rating,
  products = [],
  selectedProducts = [],
  tags = [],
  selectedTags = [],
  language,
  reviewText,
  isLoading,
  isFallback,
  onReviewChange,
  onToggleProduct,
  onToggleTag,
  onLanguageChange,
  onRegenerate,
  onCopyAndOpenGoogle,
  onChangeRating,
}) {
  const wordCount = countWords(reviewText);

  return (
    <motion.div
      key="step-ai-review"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col"
    >
      {/* Top Row: Back link + selected rating summary */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <button
          type="button"
          onClick={onChangeRating}
          className="inline-flex min-h-[44px] items-center gap-1.5 -ml-2 px-2 rounded-lg text-sm font-medium text-[#5B6472] hover:text-[#111827] hover:bg-slate-100/70 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Change rating</span>
        </button>

        <div
          className="flex items-center gap-1.5 text-sm font-medium text-[#111827] whitespace-nowrap shrink-0"
          aria-label={`Rated ${rating} out of 5 stars: ${RATING_LABELS[rating]}`}
        >
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= rating
                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                    : 'fill-slate-100 text-slate-200'
                }`}
              />
            ))}
          </span>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="text-[#5B6472] text-xs font-medium">
            {RATING_LABELS[rating]}
          </span>
        </div>
      </div>

      {/* Heading & Language Toggle */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">
            Glad you had a great visit
          </h2>
          <p className="mt-1 text-sm text-[#5B6472]">
            Review for <span className="font-medium text-[#111827]">{shopName}</span>
          </p>
        </div>

        {/* Language Segmented Control */}
        <div
          className="inline-flex items-center rounded-xl bg-slate-100 p-1 shrink-0"
          role="group"
          aria-label="Review language"
        >
          {[
            { id: 'english', label: 'English' },
            { id: 'hinglish', label: 'Hinglish' },
          ].map((option) => {
            const active = language === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (!active) onLanguageChange(option.id);
                }}
                className={`min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] ${
                  active
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#5B6472] hover:text-[#111827]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* What did you shop for? (Local SEO Product Selector) */}
      {products.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium text-[#5B6472] mb-2">
            What did you buy? <span className="text-slate-400 font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Products purchased">
            {products.map((product) => {
              const isSelected = selectedProducts.includes(product);
              return (
                <button
                  key={product}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleProduct(product)}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs sm:text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] ${
                    isSelected
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-slate-50 text-[#374151] border border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/70'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  <span>{product}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Experience Highlight Tags */}
      <div className="mt-4">
        <p className="text-xs font-medium text-[#5B6472] mb-2">
          What stood out?
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Store highlights">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggleTag(tag)}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs sm:text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] ${
                  isSelected
                    ? 'bg-[#1A56DB] text-white shadow-xs shadow-blue-900/10'
                    : 'bg-slate-50 text-[#374151] border border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Review Textarea / Loading Skeleton */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label
            htmlFor="generated-review-input"
            className="text-xs font-medium text-[#5B6472]"
          >
            Your review draft
          </label>
          {!isLoading && (
            <span className="text-xs text-[#6B7280] tabular-nums">
              Tap to edit · {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          )}
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-[#F8FAFC] transition-colors focus-within:border-[#1A56DB] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#1A56DB]/12">
          {isLoading ? (
            <div
              className="min-h-[132px] p-4 flex flex-col justify-center gap-3"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="sr-only">Generating a natural review draft</span>
              <div className="skeleton-line h-4 w-[94%] rounded-md" />
              <div className="skeleton-line h-4 w-[82%] rounded-md" />
              <div className="skeleton-line h-4 w-[64%] rounded-md" />
            </div>
          ) : (
            <textarea
              id="generated-review-input"
              rows={4}
              value={reviewText}
              onChange={(e) => onReviewChange(e.target.value)}
              placeholder="Write or tweak your review here..."
              className="block w-full min-h-[132px] resize-none rounded-2xl bg-transparent p-4 text-[15px] sm:text-base leading-relaxed text-[#111827] placeholder:text-slate-400 focus:outline-none"
            />
          )}
        </div>

        {isFallback && !isLoading && (
          <p className="mt-2 text-xs text-[#6B7280]">
            Offline suggestion shown — AI writer is temporarily unavailable. You can edit this freely.
          </p>
        )}
      </div>

      {/* Action Buttons (Natural Thumb Zone) */}
      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          disabled={isLoading || !reviewText.trim()}
          onClick={onCopyAndOpenGoogle}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm shadow-blue-900/15 transition-all hover:bg-[#1546B5] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2 whitespace-nowrap"
        >
          <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Copy Review &amp; Open Google</span>
          <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={onRegenerate}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#374151] transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2 whitespace-nowrap"
        >
          <RefreshCw
            className={`h-4 w-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{isLoading ? 'Writing a fresh draft...' : 'Generate Another'}</span>
        </button>
      </div>
    </motion.div>
  );
}
