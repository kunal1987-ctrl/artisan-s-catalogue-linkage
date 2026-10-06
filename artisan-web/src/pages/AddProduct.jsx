import React, { useState } from 'react';
import FairPricingModal from '../components/FairPricingModal';
import { appraiseProduct } from '../services/pricingService';
import { supabase } from '../supabaseClient';

/**
 * AddProduct Page
 * Full product creation and Fair-Trade valuation workflow.
 */
export default function AddProduct() {
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [category] = useState('Handicrafts');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Pricing & Crafting inputs
  const [materialCost, setMaterialCost] = useState('');
  const [craftingTimeValue, setCraftingTimeValue] = useState(1);
  const [craftingTimeUnit, setCraftingTimeUnit] = useState('hours');
  
  // Main form selling price state (Strictly NO 1800 hardcoded initial state!)
  const [sellingPrice, setSellingPrice] = useState('');
  
  // Appraisal Modal state
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState(null);
  const [pricingError, setPricingError] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Trigger Appraisal Flow
  const handleAppraise = async () => {
    if (!imageFile) {
      showToast('कृपया पहले उत्पाद की तस्वीर चुनें (Please select product photo).');
      return;
    }

    const costNum = Number(materialCost);
    // Strict validation: Reject blank or <= 0 without fallback to 250
    if (!materialCost || isNaN(costNum) || costNum <= 0) {
      showToast('कृपया कच्चे माल की मान्य लागत दर्ज करें (Enter valid material cost).');
      return;
    }

    const timeNum = Number(craftingTimeValue);
    if (!craftingTimeValue || isNaN(timeNum) || timeNum <= 0) {
      showToast('कृपया बनाने का समय दर्ज करें (Enter crafting time).');
      return;
    }

    // Format micro-duration as string (e.g., "30 minutes", "1 hour")
    const formattedDuration = `${craftingTimeValue} ${craftingTimeUnit}`;

    // Launch modal and engage loading sequence
    setIsPricingModalOpen(true);
    setIsLoading(true);
    setPricingError(null);

    try {
      const data = await appraiseProduct(imageFile, costNum, formattedDuration);
      setPricingData(data);
      // Auto-bind suggested_price immediately to main form sellingPrice state
      if (data?.suggested_price) {
        setSellingPrice(String(data.suggested_price));
      }
    } catch (err) {
      console.error('[AddProduct] Appraisal error:', err);
      setPricingError(err?.message || 'Could not calculate fair price.');
    } finally {
      // Strictly unmount loading view in finally block
      setIsLoading(false);
    }
  };

  // Publish Form Submission (No secondary AI generation step)
  const handlePublish = async (e) => {
    e.preventDefault();

    const priceNum = Number(sellingPrice);
    if (!sellingPrice || isNaN(priceNum) || priceNum <= 0) {
      showToast('कृपया मान्य विक्रय मूल्य दर्ज करें या AI उचित मूल्य का उपयोग करें।');
      return;
    }

    if (!productTitle.trim()) {
      showToast('कृपया उत्पाद का नाम दर्ज करें।');
      return;
    }

    setIsPublishing(true);
    try {
      // Direct submission using actual bound state price
      const payload = {
        title: productTitle.trim(),
        description: productDescription.trim(),
        category,
        price: priceNum,
        raw_material_cost: Number(materialCost) || 0,
        crafting_time: `${craftingTimeValue} ${craftingTimeUnit}`,
        status: 'published',
      };

      const { error } = await supabase.from('products').insert([payload]).select().maybeSingle();
      if (error) {
        console.warn('[AddProduct] Products table note:', error.message);
      }
      showToast('🎉 उत्पाद सफलतापूर्वक प्रकाशित हो गया! (Product Published Successfully)');
    } catch (err) {
      console.error('[AddProduct] Publish exception:', err);
      showToast(`प्रकाशन त्रुटि: ${err.message || 'Error publishing product'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-amber-500 mb-2 flex items-center gap-2">
          <span>🎨</span> नया उत्पाद जोड़ें (Add New Product)
        </h1>
        <p className="text-xs text-stone-400 mb-6">
          कारीगर उचित मूल्य इंजन एवं ONDC/GeM कैटलॉग तैयार करें।
        </p>

        {toastMessage && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold">
            {toastMessage}
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-5">
          {/* Product Image */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              उत्पाद फ़ोटो (Product Photo) *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden border border-stone-700">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              उत्पाद का नाम (Product Title) *
            </label>
            <input
              type="text"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              placeholder="e.g. Handcrafted Terracotta Tea Set"
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Material Cost with Number Stepper */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1">
                <span>₹</span> कच्चे माल की लागत (Material Cost in ₹) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                placeholder="उदा. 350"
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Crafting Time with Stepper & Unit Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1">
                <span>⏱️</span> बनाने का समय (Crafting Time) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={craftingTimeValue}
                  onChange={(e) => setCraftingTimeValue(parseFloat(e.target.value) || 0)}
                  className="w-1/2 px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
                <select
                  value={craftingTimeUnit}
                  onChange={(e) => setCraftingTimeUnit(e.target.value)}
                  className="w-1/2 px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="minutes">मिनट (minutes)</option>
                  <option value="hours">घंटे (hours)</option>
                  <option value="days">दिन (days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Fair Price Trigger Button */}
          <button
            type="button"
            onClick={handleAppraise}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>⚖️</span>
            <span>AI उचित मूल्य की गणना करें (Appraise Fair Price with AI)</span>
          </button>

          {/* Selling Price Field (Auto-bound from appraisal, fully editable) */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center justify-between">
              <span>विक्रय मूल्य (Selling Price in ₹) *</span>
              {sellingPrice && (
                <span className="text-[11px] text-emerald-400 font-bold">
                  ✓ मूल्य स्वतः भरा गया (Auto-bound)
                </span>
              )}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="उदा. 850"
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              विवरण (Description)
            </label>
            <textarea
              rows={3}
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="उत्पाद की सामग्री एवं विशेषताएँ लिखें..."
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* "उत्पाद प्रकाशित करें" (Publish) Button */}
          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <span>प्रकाशित हो रहा है...</span>
            ) : (
              <span>उत्पाद प्रकाशित करें (Publish Product: ₹{sellingPrice || '0'})</span>
            )}
          </button>
        </form>

        {/* AI Fair-Pricing Valuation Modal */}
        <FairPricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          isLoading={isLoading}
          pricingData={pricingData}
          error={pricingError}
          onRetry={handleAppraise}
          imageFile={imageFile}
          statedCost={materialCost}
          claimedTime={`${craftingTimeValue} ${craftingTimeUnit}`}
          onApplyPrice={(price) => {
            setSellingPrice(String(price));
          }}
        />
      </div>
    </div>
  );
}
