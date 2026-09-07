import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const ACTIVE_INSTITUTIONAL_TENDERS = [
  {
    id: 'TENDER-GEM-2026-8812',
    tender_no: 'GEM/2026/B/8812903',
    ministry: 'Ministry of Textiles (DC Handlooms)',
    ministry_hi: 'वस्त्र मंत्रालय (विकास आयुक्त हथकरघा)',
    title: 'Handwoven Silk-Cotton Stoles & Zari Border Shawls',
    title_hi: 'हथकरघा सिल्क-कॉटन जरी बॉर्डर स्टोल',
    category: 'Handloom Textiles & Apparels',
    category_hi: 'हथकरघा वस्त्र एवं परिधान',
    quantity: 150,
    unit_budget_inr: 1150,
    total_budget_inr: 172500,
    deadline_days: 18,
    delivery_location: 'Udyog Bhawan, Rafi Marg, New Delhi',
    delivery_location_hi: 'उद्योग भवन, रफी मार्ग, नई दिल्ली',
    eligibility: 'Registered Handloom Weavers / GI-Certified / MSME Udyam',
    escrow: 'PFMS Govt Treasury Escrow (Auto-settlement on Dispatch)',
    hsn_code: '52085290',
    unspsc_code: '53102504',
  },
  {
    id: 'TENDER-GEM-2026-7719',
    tender_no: 'GEM/2026/B/7719401',
    ministry: 'Ministry of Tourism & Culture (Govt. of India)',
    ministry_hi: 'पर्यटन एवं संस्कृति मंत्रालय (भारत सरकार)',
    title: 'Handcrafted Terracotta Earthen Pitchers (Surahi) with Folk Motifs',
    title_hi: 'पारंपरिक हस्तनिर्मित मिट्टी की सुराही (टेराकोटा)',
    category: 'Terracotta & Pottery Artware',
    category_hi: 'टेराकोटा एवं मिट्टी शिल्प',
    quantity: 200,
    unit_budget_inr: 260,
    total_budget_inr: 52000,
    deadline_days: 14,
    delivery_location: 'Central State Guest House, Chanakyapuri, New Delhi',
    delivery_location_hi: 'केंद्रीय स्टेट गेस्ट हाउस, चाणक्यपुरी, नई दिल्ली',
    eligibility: 'KVIC Pottery Clusters / Rural Artisan SHGs',
    escrow: 'PFMS Govt Treasury Escrow (Auto-settlement on Dispatch)',
    hsn_code: '69120010',
    unspsc_code: '60121002',
  },
  {
    id: 'TENDER-GEM-2026-4402',
    tender_no: 'TRIFED/BULK/2026/410',
    ministry: 'TRIFED - Ministry of Tribal Affairs',
    ministry_hi: 'ट्राइफेड - जनजातीय कार्य मंत्रालय',
    title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plates (10 Inch)',
    title_hi: 'भौगोलिक संकेतक (GI) जयपुर ब्लू पॉटरी सजावटी प्लेट',
    category: 'Ceramics & Decorative Pottery',
    category_hi: 'सिरेमिक एवं सजावटी पॉटरी',
    quantity: 100,
    unit_budget_inr: 780,
    total_budget_inr: 78000,
    deadline_days: 21,
    delivery_location: 'TRIFED Central Distribution Center, Sector 62, Noida',
    delivery_location_hi: 'ट्राइफेड केंद्रीय वितरण केंद्र, नोएडा',
    eligibility: 'Artisan Clusters / Aatmanirbhar Bharat Artisans',
    escrow: 'PFMS Govt Treasury Escrow (Auto-settlement on Dispatch)',
    hsn_code: '69139000',
    unspsc_code: '60121001',
  },
];

export default function InstitutionalTenderCard({ tender, onAcceptTender }) {
  const { language } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const isHindi = language === 'hi';

  return (
    <div className="bg-white border border-[#d1c4bd]/70 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
      {/* Top Meta */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </span>
            <div>
              <span className="text-xs font-bold text-blue-900 block leading-tight">
                {isHindi ? tender.ministry_hi : tender.ministry}
              </span>
              <span className="font-mono text-[11px] text-stone-500">
                {tender.tender_no}
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>{tender.deadline_days} {isHindi ? 'दिन शेष' : 'days left'}</span>
          </span>
        </div>

        {/* Tender Item Title */}
        <h4 className="text-base font-bold text-stone-900 leading-snug mt-1">
          {isHindi ? tender.title_hi : tender.title}
        </h4>

        {/* Budget & Quantity Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#fdfaf6] border border-[#d1c4bd]/40 mt-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              {isHindi ? 'आवश्यक मात्रा' : 'Required Qty'}
            </span>
            <span className="text-base font-extrabold text-stone-900">
              {tender.quantity} {isHindi ? 'इकाइयां' : 'Units'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              {isHindi ? 'अनुमानित बजट' : 'Tender Value'}
            </span>
            <span className="text-base font-extrabold text-emerald-800">
              ₹{tender.total_budget_inr.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Escrow badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
          <span>{isHindi ? 'PFMS डिजिटल एस्क्रो भुगतान गारंटी' : 'GeM PFMS Institutional Escrow Guaranteed'}</span>
        </div>

        {/* Expandable Specifications */}
        {showDetails && (
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1.5 animate-in fade-in duration-150 mt-1">
            <p className="text-stone-700">
              <strong>{isHindi ? 'वितरण स्थल:' : 'Destination:'}</strong> {isHindi ? tender.delivery_location_hi : tender.delivery_location}
            </p>
            <p className="text-stone-700">
              <strong>{isHindi ? 'पात्रता:' : 'Eligibility:'}</strong> {tender.eligibility}
            </p>
            <p className="text-stone-700 font-mono text-[11px]">
              HSN: {tender.hsn_code} • UNSPSC: {tender.unspsc_code}
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-stone-200">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
        >
          {showDetails ? (isHindi ? 'संक्षेप' : 'Less') : (isHindi ? 'विवरण' : 'Details')}
        </button>

        <button
          type="button"
          onClick={() => onAcceptTender && onAcceptTender(tender)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
          <span>{isHindi ? '1-क्लिक बोली लगाएं (Accept Tender)' : '1-Click Bid (Accept Tender)'}</span>
        </button>
      </div>
    </div>
  );
}
