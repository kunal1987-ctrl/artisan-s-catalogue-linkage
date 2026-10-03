import React, { useEffect, useState, useCallback, useRef } from 'react';
import { appraiseProduct } from '../services/pricingService';

// ── Friendly Craft Icons ───────────────────────────────────────────────────
function SpinnerIcon({ className = 'h-10 w-10 text-emerald-400' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function ShoppingBagIcon({ className = 'w-5 h-5 text-sky-400' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function ClockIcon({ className = 'w-5 h-5 text-amber-400' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-5 h-5 text-emerald-400' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CloseIcon({ className = 'w-5 h-5 text-stone-400' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function formatNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return Math.round(Number(amount)).toLocaleString('en-IN');
}

const LOADING_STEPS = [
  "📸 Analyzing craft materials and labor intensity...",
  "🛒 Scanning Amazon India & Google Shopping...",
  "🌐 Querying ONDC staging network...",
  "⚖️ Applying Ministry of Labour wage standards...",
  "✨ Finalizing fair-trade price...",
];

/**
 * FairPricingModal - Artisan-Friendly Fair-Trade Pricing Appraisal
 *
 * Props:
 *   isOpen          {boolean}
 *   onClose         {() => void}
 *   isLoading       {boolean}
 *   pricingData     {object|null}
 *   error           {string|null}
 *   onRetry         {() => void}
 *   imageFile       {File|Blob|string|null}
 *   statedCost      {number|string}  — artisan's raw material cost in INR
 *   claimedTime     {string}         — artisan's claimed duration (e.g. "2 days")
 *   onApplyPrice    {(price: number) => void}
 */
export default function FairPricingModal({
  isOpen,
  onClose,
  isLoading: propIsLoading,
  pricingData: propPricingData,
  error: propError,
  onRetry,
  imageFile,
  statedCost,
  claimedTime,
  onApplyPrice,
}) {
  const [internalStatus, setInternalStatus] = useState('idle'); // idle | loading | success | error
  const [internalResult, setInternalResult] = useState(null);
  const [internalErrorMsg, setInternalErrorMsg] = useState('');
  const [isTypingCustomPrice, setIsTypingCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const onApplyPriceRef = useRef(onApplyPrice);
  useEffect(() => {
    onApplyPriceRef.current = onApplyPrice;
  }, [onApplyPrice]);

  // Determine active state strictly from either props or internal execution
  const isParentControlled = propIsLoading !== undefined;
  const isLoading = isParentControlled ? Boolean(propIsLoading) : internalStatus === 'loading';
  const pricingData = isParentControlled ? propPricingData : internalResult;
  const errorMsg = isParentControlled ? (propError || '') : internalErrorMsg;
  const isAppraisalError = !isLoading && Boolean(errorMsg);

  // ── Sync customPrice with pricingData whenever pricingData arrives ───────────
  useEffect(() => {
    if (pricingData?.suggested_price) {
      setCustomPrice(String(pricingData.suggested_price));
      if (typeof onApplyPriceRef.current === 'function') {
        const num = Number(pricingData.suggested_price);
        if (!isNaN(num) && num > 0) {
          onApplyPriceRef.current(num);
        }
      }
    }
  }, [pricingData]);

  // ── Dynamic rotating status sequence during appraisal (never loops back) ───
  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // ── Fallback internal appraisal runner if parent doesn't manage API call ────
  const executeAppraisal = useCallback(async () => {
    if (isParentControlled) {
      if (onRetry) onRetry();
      return;
    }
    if (!imageFile) {
      setInternalErrorMsg('Please capture or select a photo of your craft first.');
      setInternalStatus('error');
      return;
    }

    const costNum = Number(statedCost);
    if (isNaN(costNum) || costNum <= 0) {
      setInternalErrorMsg('Please enter a valid raw material cost first.');
      setInternalStatus('error');
      return;
    }

    setInternalStatus('loading');
    setInternalResult(null);
    setInternalErrorMsg('');
    setIsTypingCustomPrice(false);
    setCustomPrice('');

    try {
      const timeStr = claimedTime ? String(claimedTime).trim() : 'Not specified';
      const data = await appraiseProduct(imageFile, costNum, timeStr);
      setInternalResult(data);
      setInternalStatus('success');
      if (data?.suggested_price) {
        const numericPrice = Number(data.suggested_price);
        setCustomPrice(String(numericPrice));
        if (typeof onApplyPriceRef.current === 'function' && !isNaN(numericPrice) && numericPrice > 0) {
          onApplyPriceRef.current(numericPrice);
        }
      }
    } catch (err) {
      setInternalErrorMsg(err?.message || 'Could not calculate price right now. Please try again.');
      setInternalStatus('error');
    }
  }, [isParentControlled, onRetry, imageFile, statedCost, claimedTime]);

  useEffect(() => {
    if (isOpen && !isParentControlled && !internalResult && internalStatus === 'idle') {
      executeAppraisal();
    }
  }, [isOpen, isParentControlled, internalResult, internalStatus, executeAppraisal]);

  if (!isOpen) return null;

  // ── Parsed Metrics Strictly from API response (pricingData) ───────────────
  const suggested_price = pricingData?.suggested_price ?? 0;
  const validated_material_cost =
    pricingData?.cost_breakdown?.validated_material_cost ??
    pricingData?.cost_breakdown?.material_cost ??
    pricingData?.validated_material_cost ??
    0;
  const calculated_labor_cost =
    pricingData?.cost_breakdown?.calculated_labor_cost ??
    pricingData?.calculated_labor_cost ??
    0;
  const minRange = pricingData?.fair_range?.min;
  const maxRange = pricingData?.fair_range?.max;

  const handleApply = (priceToApply) => {
    const numeric = Math.round(Number(priceToApply));
    if (numeric > 0 && typeof onApplyPrice === 'function') {
      onApplyPrice(numeric);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/85 backdrop-blur-md transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-stone-100 animate-in fade-in duration-200">

        {/* ── Simple Top Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚖️</span>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Fair Price Appraisal
              </h2>
              <p className="text-xs text-stone-400">
                Covers your material and pays for your hard work
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body: Conditionally Renders Two Distinct Views Based on isLoading ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ════ 1. STEPPER UI VIEW (When isLoading is TRUE: pulsing circle and 5 steps) ════ */}
          {isLoading ? (
            <div className="py-8 sm:py-10 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
              {/* Pulsing Circle */}
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <SpinnerIcon className="h-9 w-9 text-emerald-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping opacity-30 pointer-events-none" />
              </div>

              {/* The 5 Steps */}
              <div className="space-y-4 max-w-sm w-full px-2">
                <div className="text-center space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-stone-100">
                    Calculating Fair-Trade Price
                  </h3>
                  <p className="text-xs text-stone-400">
                    Auditing material costs, labor hours & live marketplace comps
                  </p>
                </div>

                {/* Sleek Animated Progress Bar */}
                <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden border border-stone-700/60 p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-700 ease-out shadow-lg shadow-emerald-500/30 relative overflow-hidden"
                    style={{ width: `${Math.max(20, Math.min(100, Math.round(((loadingStepIndex + 1) / LOADING_STEPS.length) * 100)))}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>

                {/* 5-Step Visual Stepper List */}
                <div className="space-y-2.5 text-left pt-1">
                  {LOADING_STEPS.map((stepText, idx) => {
                    const isPast = idx < loadingStepIndex;
                    const isCurrent = idx === loadingStepIndex;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-300 ${
                          isCurrent
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold'
                            : isPast
                            ? 'text-stone-300 bg-stone-800/40 border border-stone-800/60'
                            : 'text-stone-500 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500 text-stone-950 animate-pulse'
                              : isPast
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-stone-800 text-stone-500 border border-stone-700'
                          }`}
                        >
                          {isPast ? '✓' : idx + 1}
                        </div>
                        <span className="text-xs sm:text-sm">{stepText}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[11px] text-stone-400 px-1 pt-1 font-medium">
                  <span>Step {loadingStepIndex + 1} of {LOADING_STEPS.length}</span>
                  <span className="text-emerald-400/90 font-semibold">AI Valuation Engine</span>
                </div>
              </div>
            </div>
          ) : pricingData ? (
            /* ════ 2. SUCCESS VIEW (Unmounted when loading, rendered when !isLoading && pricingData) ════ */
            <div className="space-y-5 animate-in fade-in duration-300">

              {/* A massive, bold header with the predicted price: ₹{pricingData.suggested_price} */}
              <div className="text-center p-6 rounded-3xl bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 block mb-1">
                  Suggested Selling Price
                </span>
                <div className="text-5xl sm:text-6xl font-black text-emerald-400 tracking-tight flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">₹</span>
                  <span>{formatNumber(suggested_price)}</span>
                </div>
                {minRange !== undefined && maxRange !== undefined && (
                  <p className="text-xs text-stone-400 mt-2 font-medium">
                    Fair market range: <span className="text-emerald-300">₹{formatNumber(minRange)} – ₹{formatNumber(maxRange)}</span>
                  </p>
                )}
              </div>

              {/* The simplified breakdown (Material: ₹{validated_material_cost} + Labor: ₹{calculated_labor_cost}) */}
              <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60 text-center space-y-1">
                <div className="text-xs uppercase tracking-wider font-bold text-stone-400">
                  Simplified Breakdown
                </div>
                <div className="text-base sm:text-lg font-bold text-stone-100 flex items-center justify-center flex-wrap gap-2">
                  <span className="text-stone-300">
                    Material: <strong className="text-emerald-400 font-extrabold">₹{formatNumber(validated_material_cost)}</strong>
                  </span>
                  <span className="text-stone-500 font-normal">+</span>
                  <span className="text-stone-300">
                    Labor: <strong className="text-amber-400 font-extrabold">₹{formatNumber(calculated_labor_cost)}</strong>
                  </span>
                </div>
                {(pricingData?.labor_audit?.material_discrepancy_detected || pricingData?.cost_breakdown?.material_discrepancy_detected) && (
                  <p className="text-[11px] text-amber-400/90 font-medium pt-1">
                    * Material adjusted to market standard for raw craft supplies
                  </p>
                )}
              </div>

              {/* Detailed Cost & Market Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {/* Card 1: Cost Detail */}
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm">
                      ₹
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                      Cost & Wage Audit
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-stone-300 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Validated Material:</span>
                      <span className="font-bold text-stone-100">₹{formatNumber(validated_material_cost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Calculated Labor:</span>
                      <span className="font-bold text-amber-300">
                        ₹{formatNumber(calculated_labor_cost)}
                        {pricingData?.labor_audit?.validated_days_used !== undefined && (
                          <span className="text-stone-400 font-normal ml-1">
                            ({pricingData.labor_audit.validated_days_used} {pricingData.labor_audit.validated_days_used === 1 ? 'day' : 'days'})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Market Average */}
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <ShoppingBagIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                      Market Comparison
                    </span>
                  </div>
                  <div className="space-y-1 text-left pt-1">
                    <div className="text-2xl font-black text-stone-100">
                      ₹{formatNumber(pricingData?.cost_breakdown?.market_anchor_median)}
                    </div>
                    <p className="text-[11px] text-stone-400 leading-tight">
                      Similar handmade items online
                    </p>
                  </div>
                </div>
              </div>

              {/* Simplified Warning (Only if labor_discrepancy_detected is true) */}
              {pricingData?.labor_audit?.labor_discrepancy_detected && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                  <ClockIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    Note: We adjusted the time to {pricingData?.labor_audit?.validated_days_used} days to match market standards so your item sells faster.
                  </p>
                </div>
              )}

              {/* Rationale Note */}
              <div className="p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700/50 text-xs text-stone-300 flex items-start gap-2.5">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Evaluated based on {pricingData?.market_sources_evaluated?.amazon_rainforest_count ?? 0} Amazon, {pricingData?.market_sources_evaluated?.ondc_comps_count ?? 0} ONDC, and Google Shopping records. This price covers your material and pays you fairly for your time.
                </p>
              </div>

              {/* The Action buttons to dismiss the modal */}
              {isTypingCustomPrice ? (
                <div className="p-4 rounded-2xl bg-stone-800/90 border border-stone-700 space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-200">Enter Your Custom Price:</span>
                    <button
                      type="button"
                      onClick={() => setIsTypingCustomPrice(false)}
                      className="text-stone-400 hover:text-white underline cursor-pointer"
                    >
                      Use Suggested
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 850"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-stone-950 border border-stone-700 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTypingCustomPrice(false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!customPrice || Number(customPrice) <= 0}
                      onClick={() => handleApply(customPrice)}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Save & Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2">
                  {/* Primary Action: Accept and dismiss */}
                  <button
                    type="button"
                    onClick={() => handleApply(suggested_price)}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-stone-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Accept Fair-Trade Price (₹{formatNumber(suggested_price)})</span>
                  </button>

                  <div className="flex gap-2">
                    {/* Secondary Action: Dismiss modal */}
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-semibold transition cursor-pointer"
                    >
                      Dismiss Modal
                    </button>

                    {/* Tertiary Action: Type Custom Price */}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPrice(String(suggested_price || ''));
                        setIsTypingCustomPrice(true);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-sm font-medium transition cursor-pointer"
                    >
                      Custom Price
                    </button>
                  </div>
                </div>
              )}

              {/* 3-API Verification Footer Note */}
              <div className="text-center text-[11px] text-stone-400 font-medium px-2 pt-1">
                Evaluated based on {pricingData?.market_sources_evaluated?.amazon_rainforest_count ?? 0} Amazon, {pricingData?.market_sources_evaluated?.ondc_comps_count ?? 0} ONDC, and Google Shopping records.
              </div>

            </div>
          ) : isAppraisalError ? (
            /* ════ 3. ERROR VIEW (When error occurred) ════ */
            <div className="py-8 space-y-4 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-100">Could not calculate price</h4>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">{errorMsg}</p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={executeAppraisal}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
