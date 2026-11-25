import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { QrCode } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import StarRatingStep from './components/StarRatingStep.jsx';
import AiReviewStep from './components/AiReviewStep.jsx';
import PrivateFeedbackStep from './components/PrivateFeedbackStep.jsx';
import QrCodeModal from './components/QrCodeModal.jsx';
import Toast from './components/Toast.jsx';
import { getFallbackReview } from './data/fallbackReviews.js';

// ============================================================================
// CONFIGURATION CONSTANTS — Edit these values to customize for your store
// ============================================================================
const SHOP_NAME = 'K.M. Handloom';
const SHOP_DETAILS =
  'Curtains, bedsheets, and handloom furnishings store on Nala Road, Kadam Kuan, Patna';
const SHOP_LOCATION = 'Nala Road, Kadam Kuan · Patna';
const SHOP_PHONE = '093041 04210';
const GOOGLE_REVIEW_URL = 'https://g.page/r/CSYI-M0EajmFEBM/review';
const DEFAULT_TAGS = [
  'Great Quality',
  'Good Curtain Variety',
  'Reasonable Prices',
  'Helpful Staff',
  'Good collectioin of bedshhet',
  'Clean Store',
];

function resolveGoogleReviewUrl(rawUrl) {
  const cleaned = (rawUrl || '').trim().replace(/^\[(.*)\]$/, '$1').trim();
  const isPlaceholder =
    !cleaned || /YOUR_GOOGLE_REVIEW_LINK/i.test(cleaned);
  const normalized = /^https?:\/\//i.test(cleaned)
    ? cleaned
    : `https://${cleaned}`;
  return { url: normalized, isPlaceholder };
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for older mobile QR scanners & WebViews
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

export default function App() {
  const [rating, setRating] = useState(0);
  const [language, setLanguage] = useState('english');
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isFallbackReview, setIsFallbackReview] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const abortControllerRef = useRef(null);
  const fallbackCounterRef = useRef(0);
  const toastTimerRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const lastReviewRef = useRef('');

  const showToast = useCallback((message, variant = 'success', duration = 2600) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ id: Date.now(), message, variant });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const fetchAiReview = useCallback(
    async ({ targetRating, targetLanguage, targetTags, previousReview = '' }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoadingReview(true);
      setIsFallbackReview(false);

      try {
        const response = await fetch('/api/generate-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            rating: targetRating,
            language: targetLanguage,
            tags: targetTags,
            shopName: SHOP_NAME,
            shopDetails: SHOP_DETAILS,
            previousReview,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!data?.review || typeof data.review !== 'string') {
          throw new Error('No review text returned.');
        }

        if (controller.signal.aborted) return;
        lastReviewRef.current = data.review;
        setReviewText(data.review);
        setIsFallbackReview(false);
      } catch (err) {
        if (controller.signal.aborted || err?.name === 'AbortError') return;

        const fallback = getFallbackReview({
          rating: targetRating,
          language: targetLanguage,
          shopName: SHOP_NAME,
          tags: targetTags,
          index: fallbackCounterRef.current,
        });
        fallbackCounterRef.current += 1;
        lastReviewRef.current = fallback;
        setReviewText(fallback);
        setIsFallbackReview(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingReview(false);
        }
      }
    },
    []
  );

  function handleSelectRating(nextRating) {
    setRating(nextRating);
    if (nextRating >= 4) {
      fetchAiReview({
        targetRating: nextRating,
        targetLanguage: language,
        targetTags: selectedTags,
        previousReview: '',
      });
    } else if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoadingReview(false);
    }
  }

  function handleChangeRating() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoadingReview(false);
    setRating(0);
  }

  function handleToggleTag(tag) {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];
    setSelectedTags(nextTags);

    if (rating >= 4) {
      fetchAiReview({
        targetRating: rating,
        targetLanguage: language,
        targetTags: nextTags,
        previousReview: lastReviewRef.current,
      });
    }
  }

  function handleLanguageChange(nextLanguage) {
    setLanguage(nextLanguage);
    if (rating >= 4) {
      fetchAiReview({
        targetRating: rating,
        targetLanguage: nextLanguage,
        targetTags: selectedTags,
        previousReview: lastReviewRef.current,
      });
    }
  }

  function handleRegenerate() {
    if (rating < 4) return;
    fetchAiReview({
      targetRating: rating,
      targetLanguage: language,
      targetTags: selectedTags,
      previousReview: reviewText || lastReviewRef.current,
    });
  }

  async function handleCopyAndOpenGoogle() {
    const textToCopy = reviewText.trim();
    if (!textToCopy) return;

    await copyTextToClipboard(textToCopy);
    showToast('Copied! Opening Google...', 'success', 2400);

    const { url, isPlaceholder } = resolveGoogleReviewUrl(GOOGLE_REVIEW_URL);
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    redirectTimerRef.current = setTimeout(() => {
      if (isPlaceholder) {
        showToast(
          'Review copied! Set GOOGLE_REVIEW_URL in src/App.jsx to enable live Google redirect.',
          'info',
          4000
        );
        return;
      }
      window.location.assign(url);
    }, 600);
  }

  function handleOpenGoogleDirectly() {
    const { url, isPlaceholder } = resolveGoogleReviewUrl(GOOGLE_REVIEW_URL);
    if (isPlaceholder) {
      showToast(
        'Set GOOGLE_REVIEW_URL in src/App.jsx to link your Google review page.',
        'info',
        3600
      );
      return;
    }
    window.location.assign(url);
  }

  async function handleSubmitFeedback(payload) {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          shopName: SHOP_NAME,
        }),
      });
    } catch {
      // Still show thank-you confirmation gracefully if offline
    }
    showToast('Feedback received — thank you!');
  }

  const displayShopDetails = SHOP_DETAILS.replace(/^\[(.*)\]$/, '$1').trim();

  return (
    <div className="min-h-dvh w-full bg-[#F4F5F7] text-[#111827] flex flex-col justify-between px-4 py-6 sm:px-6 sm:py-10">
      <main className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-[468px] rounded-3xl bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
          <AnimatePresence mode="wait">
            {rating === 0 && (
              <StarRatingStep
                shopName={SHOP_NAME}
                shopLocation={SHOP_LOCATION}
                shopDetails={displayShopDetails}
                onSelectRating={handleSelectRating}
              />
            )}

            {rating >= 4 && (
              <AiReviewStep
                shopName={SHOP_NAME}
                rating={rating}
                tags={DEFAULT_TAGS}
                selectedTags={selectedTags}
                language={language}
                reviewText={reviewText}
                isLoading={isLoadingReview}
                isFallback={isFallbackReview}
                onReviewChange={setReviewText}
                onToggleTag={handleToggleTag}
                onLanguageChange={handleLanguageChange}
                onRegenerate={handleRegenerate}
                onCopyAndOpenGoogle={handleCopyAndOpenGoogle}
                onChangeRating={handleChangeRating}
              />
            )}

            {rating >= 1 && rating <= 3 && (
              <PrivateFeedbackStep
                shopName={SHOP_NAME}
                shopPhone={SHOP_PHONE}
                rating={rating}
                onSubmitFeedback={handleSubmitFeedback}
                onOpenGoogleDirectly={handleOpenGoogleDirectly}
                onChangeRating={handleChangeRating}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="mt-6 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setIsQrModalOpen(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-[#6B7280] hover:bg-white/80 hover:text-[#111827] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] whitespace-nowrap"
        >
          <QrCode className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Get QR Code</span>
        </button>
      </footer>

      <QrCodeModal
        isOpen={isQrModalOpen}
        shopName={SHOP_NAME}
        shopLocation={SHOP_LOCATION}
        onClose={() => setIsQrModalOpen(false)}
        onShowToast={showToast}
      />

      <Toast toast={toast} />
      <Analytics />
    </div>
  );
}
