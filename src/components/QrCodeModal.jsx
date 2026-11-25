import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import QRCode from 'qrcode';
import { Check, Copy, Download, X } from 'lucide-react';

function slugifyFilename(name) {
  const cleaned = (name || 'shop')
    .replace(/^\[(.*)\]$/, '$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'shop';
}

export default function QrCodeModal({
  isOpen,
  shopName,
  shopLocation,
  onClose,
  onShowToast,
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const url = window.location.origin;
    setTargetUrl(url);

    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('QR generation error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  async function handleDownloadPng() {
    if (!targetUrl) return;
    try {
      // Render a crisp, print-ready counter standee card PNG (1200x1480)
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White printable background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle print border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

      // Shop Name Header
      const displayName = shopName.replace(/^\[(.*)\]$/, '$1').trim() || 'Our Store';
      ctx.fillStyle = '#111827';
      ctx.font = '700 56px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(displayName.slice(0, 32), canvas.width / 2, 162);

      ctx.fillStyle = '#5B6472';
      ctx.font = '500 30px "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(
        shopLocation || 'We value your feedback',
        canvas.width / 2,
        222
      );

      // High-res QR code
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, targetUrl, {
        width: 820,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#111827',
          light: '#FFFFFF',
        },
      });
      ctx.drawImage(qrCanvas, (canvas.width - 820) / 2, 285, 820, 820);

      // Five gold stars below QR
      ctx.fillStyle = '#F59E0B';
      ctx.font = '600 56px sans-serif';
      ctx.fillText('★  ★  ★  ★  ★', canvas.width / 2, 1205);

      // Footer instruction
      ctx.fillStyle = '#111827';
      ctx.font = '600 38px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Scan to share a quick review', canvas.width / 2, 1285);

      ctx.fillStyle = '#6B7280';
      ctx.font = '400 24px "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Takes less than 15 seconds', canvas.width / 2, 1338);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${slugifyFilename(shopName)}-review-qr.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast?.('Printable QR PNG downloaded');
    } catch (err) {
      console.error('QR download error:', err);
      onShowToast?.('Could not download QR image', 'info');
    }
  }

  async function handleCopyUrl() {
    if (!targetUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const input = document.createElement('input');
        input.value = targetUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      onShowToast?.('Review link copied');
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      onShowToast?.('Unable to copy link', 'info');
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs"
          />

          {/* Modal Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/20"
          >
            {/* Mobile drag affordance bar */}
            <div
              className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden"
              aria-hidden="true"
            />

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="qr-modal-title"
                  className="text-lg font-bold tracking-tight text-[#111827]"
                >
                  Store Counter QR Code
                </h2>
                <p className="mt-0.5 text-xs text-[#5B6472]">
                  Print and place at your checkout desk
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close QR code modal"
                className="flex h-11 w-11 -mt-1.5 -mr-1.5 items-center justify-center rounded-xl text-[#5B6472] hover:bg-slate-100 hover:text-[#111827] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code linking to ${targetUrl}`}
                    className="h-52 w-52 sm:h-56 sm:w-56 object-contain"
                  />
                ) : (
                  <div className="skeleton-line h-52 w-52 sm:h-56 sm:w-56 rounded-xl" />
                )}
              </div>

              <p className="mt-3 max-w-full truncate text-xs text-[#6B7280] font-mono px-2">
                {targetUrl}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={!qrDataUrl}
                onClick={handleDownloadPng}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#1A56DB] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 transition-all hover:bg-[#1546B5] active:scale-[0.985] disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] focus-visible:ring-offset-2 whitespace-nowrap"
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-[#374151] hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A56DB] whitespace-nowrap"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Copy Review Link</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
