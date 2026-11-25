import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Send, Star } from 'lucide-react';
import { RATING_LABELS } from './StarRatingStep.jsx';

export default function PrivateFeedbackStep({
  shopName,
  shopPhone,
  rating,
  onSubmitFeedback,
  onOpenGoogleDirectly,
  onChangeRating,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError('Please share a short note so we know how to make this right.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSubmitFeedback({
        rating,
        name: name.trim(),
        phone: phone.trim(),
        comment: trimmedComment,
      });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    const telHref = shopPhone ? `tel:${shopPhone.replace(/\s+/g, '')}` : '';
    return (
      <motion.div
        key="step-feedback-done"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center py-4"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#111827]">
          Thank you for sharing your feedback
        </h2>
        <p className="mt-2.5 text-sm text-[#5B6472] max-w-sm leading-relaxed">
          We appreciate you taking a moment to tell us. The team at{' '}
          <span className="font-medium text-[#111827]">{shopName}</span> will
          review your note carefully and work on improving.
        </p>

        {shopPhone && (
          <p className="mt-3 text-xs text-[#6B7280]">
            Need urgent assistance? Call us at{' '}
            <a
              href={telHref}
              className="font-medium text-[#1A56DB] underline underline-offset-2"
            >
              {shopPhone}
            </a>
          </p>
        )}

        <button
          type="button"
          onClick={onChangeRating}
          className="mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#111827] hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB]"
        >
          Done
        </button>

        <div className="mt-5 pt-4 border-t border-slate-100 w-full">
          <button
            type="button"
            onClick={onOpenGoogleDirectly}
            className="inline-flex min-h-[44px] items-center justify-center px-3 text-xs text-[#6B7280] hover:text-[#111827] underline underline-offset-4 decoration-slate-300 transition-colors cursor-pointer"
          >
            Prefer to post on Google?
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="step-private-feedback"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col"
    >
      {/* Top Row: Back link + rating summary */}
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

      {/* Empathetic Heading */}
      <div className="mt-5">
        <h2 className="text-xl font-bold tracking-tight text-[#111827] leading-snug">
          We&apos;re sorry we fell short — let us know how we can improve
        </h2>
        <p className="mt-1.5 text-sm text-[#5B6472] leading-relaxed">
          Share what went wrong so the manager at{' '}
          <span className="font-medium text-[#111827]">{shopName}</span> can
          follow up and make things better.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="feedback-name"
              className="block text-xs font-medium text-[#5B6472] mb-1.5"
            >
              Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="feedback-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="block w-full min-h-[46px] rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-base text-[#111827] placeholder:text-slate-400 transition-colors focus:border-[#1A56DB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#1A56DB]/12"
            />
          </div>

          <div>
            <label
              htmlFor="feedback-phone"
              className="block text-xs font-medium text-[#5B6472] mb-1.5"
            >
              Phone <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="feedback-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="block w-full min-h-[46px] rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-base text-[#111827] placeholder:text-slate-400 transition-colors focus:border-[#1A56DB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#1A56DB]/12"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="feedback-comment"
            className="block text-xs font-medium text-[#5B6472] mb-1.5"
          >
            How can we improve?
          </label>
          <textarea
            id="feedback-comment"
            rows={4}
            required
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError('');
            }}
            placeholder="Tell us about your visit, service, or product experience..."
            className="block w-full min-h-[120px] resize-none rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 text-base leading-relaxed text-[#111827] placeholder:text-slate-400 transition-colors focus:border-[#1A56DB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#1A56DB]/12"
          />
          {error && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm shadow-blue-900/15 transition-all hover:bg-[#1546B5] active:scale-[0.985] disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2 whitespace-nowrap"
        >
          <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isSubmitting ? 'Sending feedback...' : 'Submit Feedback'}</span>
        </button>
      </form>

      {/* Subtle secondary Google link */}
      <div className="mt-5 pt-4 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={onOpenGoogleDirectly}
          className="inline-flex min-h-[44px] items-center justify-center px-3 text-xs text-[#6B7280] hover:text-[#111827] underline underline-offset-4 decoration-slate-300 transition-colors cursor-pointer"
        >
          Prefer to post on Google?
        </button>
      </div>
    </motion.div>
  );
}
