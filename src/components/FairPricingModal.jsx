import React, { useEffect, useState, useCallback } from 'react';
import { appraiseProduct } from '../services/pricingService';

// ─── Labor intensity badge config ──────────────────────────────────────────
const LABOR_CONFIG = {
  low:         { label: 'Low Labor',         color: 'text-sky-400',    bg: 'bg-sky-400/10 border-sky-400/30'    },
  medium:      { label: 'Medium Labor',      color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/30' },
  high:        { label: 'High Labor',        color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  masterpiece: { label: 'Masterpiece Craft', color: 'text-rose-400',   bg: 'bg-rose-400/10 border-rose-400/30'  },
};

const DEFAULT_LABOR = { label: 'Unknown', color: 'text-neutral-400', bg: 'bg-neutral-400/10 border-neutral-400/30' };

// ─── Animated spinner ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin h-8 w-8 text-amber-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Tag chip ───────────────────────────────────────────────────────────────
function Tag({ label, value, colorClass = 'text-amber-300', bgClass = 'bg-amber-400/10 border-amber-400/25' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${colorClass} ${bgClass}`}
    >
      <span className="text-neutral-500 font-normal">{label}</span>
      {value}
    </span>
  );
}

/**
 * FairPricingModal
 *
 * Props:
 *   isOpen          {boolean}
 *   onClose         {() => void}
 *   imageFile       {File|Blob|null}
 *   statedCost      {number}  — artisan's material cost in INR
 *   onApplyPrice    {(price: number) => void}
 */
export default function FairPricingModal({
  isOpen,
  onClose,
  imageFile,
  statedCost = 0,
  onApplyPrice,
}) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [status, setStatus]     = useState('idle');   // idle | loading | success | error
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualMode, setManualMode]   = useState(false);

  // ── Run appraisal when modal opens ────────────────────────────────────────
  const runAppraisal = useCallback(async () => {
    if (!imageFile) {
      setErrorMsg('No image file provided for appraisal.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    setManualMode(false);
    setManualPrice('');

    try {
      const data = await appraiseProduct(imageFile, statedCost);
      setResult(data);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err?.message || 'An unexpected error occurred during appraisal.');
      setStatus('error');
    }
  }, [imageFile, statedCost]);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      runAppraisal();
    }
  }, [isOpen, runAppraisal]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApply = () => {
    const price = result?.suggested_price;
    if (price && onApplyPrice) onApplyPrice(price);
    onClose();
  };

  const handleManualApply = () => {
    const price = parseFloat(manualPrice);
    if (!price || price <= 0) return;
    if (onApplyPrice) onApplyPrice(price);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  // ── Derived display values ────────────────────────────────────────────────
  const craftProfile  = result?.craft_profile ?? {};
  const laborKey      = craftProfile.labor_intensity ?? 'low';
  const laborCfg      = LABOR_CONFIG[laborKey] ?? DEFAULT_LABOR;
  const suggestedPrice = result?.suggested_price;
  const fairRange      = result?.fair_range;
  const rationale      = result?.rationale ?? '';
  const category       = craftProfile.craft_category ?? '—';
  const material       = craftProfile.primary_material ?? '—';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/85 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Fair Pricing Appraisal"
    >
      {/* Sheet panel */}
      <div
        className="
          relative w-full sm:max-w-md
          bg-[#181b24] border border-white/[0.07]
          rounded-t-3xl sm:rounded-3xl
          overflow-hidden shadow-2xl
          animate-fade-in
        "
        style={{ boxShadow: '0 -8px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        {/* ── Header gradient bar ── */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #ea580c 100%)' }} />

        {/* ── Drag handle (mobile) ── */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Title ── */}
        <div className="px-6 pt-5 pb-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-widest text-amber-500 uppercase">AI Fair Pricing</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Craft Valuation Report
          </h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">Powered by Gemini · Indian Market Comps</p>
        </div>

        {/* ── Content area ── */}
        <div className="px-6 pt-4 pb-6 space-y-5">

          {/* ════ LOADING STATE ════ */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="relative">
                <Spinner />
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }}
                />
              </div>
              <p className="text-sm text-neutral-300 text-center leading-relaxed max-w-[220px]">
                Appraising craft &amp; scanning{' '}
                <span className="text-amber-400 font-semibold">Indian market comps</span>
                ...
              </p>
              {/* Animated step indicators */}
              <div className="flex flex-col gap-2 w-full mt-2">
                {[
                  'Analysing craft image with Gemini Vision',
                  'Scanning Google Shopping (India)',
                  'Querying historical price vectors',
                  'Synthesising fair trade price',
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: '#d97706',
                        animation: `pulse 1.4s ${i * 0.35}s ease-in-out infinite`,
                      }}
                    />
                    <span className="text-[11px] text-neutral-500">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ SUCCESS STATE ════ */}
          {status === 'success' && result && (
            <>
              {/* Craft tag chips */}
              <div className="flex flex-wrap gap-2">
                <Tag label="Category" value={category} />
                <Tag
                  label="Material"
                  value={material}
                  colorClass="text-emerald-300"
                  bgClass="bg-emerald-400/10 border-emerald-400/25"
                />
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${laborCfg.color} ${laborCfg.bg}`}
                >
                  {laborCfg.label}
                </span>
              </div>

              {/* Recommended price — hero display */}
              <div
                className="rounded-2xl p-5 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                {/* Subtle glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center top, rgba(16,185,129,0.07) 0%, transparent 60%)' }}
                />
                <p className="text-[11px] font-semibold tracking-widest text-emerald-500/80 uppercase mb-1">
                  Recommended Price
                </p>
                <p
                  className="text-5xl font-black text-emerald-400 leading-none"
                  style={{ textShadow: '0 0 40px rgba(52,211,153,0.3)' }}
                >
                  ₹{suggestedPrice?.toLocaleString('en-IN') ?? '—'}
                </p>
                {/* Fair range */}
                {fairRange && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="text-[10px] text-neutral-400 font-medium">Fair Range</span>
                    <span className="text-xs font-semibold text-white">
                      ₹{fairRange.min?.toLocaleString('en-IN')}
                      <span className="text-neutral-500 mx-1">–</span>
                      ₹{fairRange.max?.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Rationale box */}
              {rationale && (
                <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] font-semibold tracking-widest text-amber-500/70 uppercase mb-2">
                    Valuation Rationale
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed">{rationale}</p>
                </div>
              )}

              {/* Action buttons */}
              {!manualMode ? (
                <div className="flex gap-3 pt-1">
                  <button
                    id="fair-pricing-accept-btn"
                    onClick={handleApply}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 18px rgba(16,185,129,0.3)' }}
                  >
                    ✓ Accept &amp; Apply Price
                  </button>
                  <button
                    id="fair-pricing-adjust-btn"
                    onClick={() => { setManualMode(true); setManualPrice(String(suggestedPrice ?? '')); }}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-neutral-300 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
                  >
                    Adjust Manually
                  </button>
                </div>
              ) : (
                /* Manual override input */
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-neutral-400">Enter your preferred price (INR):</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">₹</span>
                      <input
                        id="fair-pricing-manual-input"
                        type="number"
                        min="1"
                        step="1"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full pl-7 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
                        autoFocus
                      />
                    </div>
                    <button
                      id="fair-pricing-manual-apply-btn"
                      onClick={handleManualApply}
                      disabled={!manualPrice || parseFloat(manualPrice) <= 0}
                      className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
                      style={{ background: 'linear-gradient(135deg, #d97706 0%, #c2410c 100%)' }}
                    >
                      Apply
                    </button>
                  </div>
                  <button
                    onClick={() => setManualMode(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    ← Back to AI suggestion
                  </button>
                </div>
              )}
            </>
          )}

          {/* ════ ERROR STATE ════ */}
          {status === 'error' && (
            <>
              {/* Error banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/8 border border-rose-500/25">
                <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-rose-400 mb-1">Appraisal Failed</p>
                  <p className="text-[11px] text-rose-300/80 leading-relaxed">{errorMsg}</p>
                </div>
              </div>

              {/* Manual override fallback */}
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">Set a price manually instead:</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">₹</span>
                    <input
                      id="fair-pricing-error-manual-input"
                      type="number"
                      min="1"
                      step="1"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      placeholder="Enter your price"
                      className="w-full pl-7 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                  <button
                    id="fair-pricing-error-apply-btn"
                    onClick={handleManualApply}
                    disabled={!manualPrice || parseFloat(manualPrice) <= 0}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #d97706 0%, #c2410c 100%)' }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Retry button */}
              <button
                id="fair-pricing-retry-btn"
                onClick={runAppraisal}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-neutral-300 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
              >
                ↻ Retry Appraisal
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
