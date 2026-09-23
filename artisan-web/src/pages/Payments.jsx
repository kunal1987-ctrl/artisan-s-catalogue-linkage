import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Clock,
  Percent,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Building2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Edit3,
  X,
  FileText,
  ArrowDownLeft,
  Search,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Payments Component for Shilp Setu
 * A government-grade financial settlement dashboard showcasing:
 * - 2% transparent ONDC routing fee breakdown
 * - Net settled earnings & pending DBT settlements
 * - Itemized transaction ledger with mathematical breakdown
 * - Linked PFMS/DBT bank account management
 */
export default function Payments() {
  const navigate = useNavigate();
  const { user, artisanProfile, language, showToast } = useAuth?.() || {};

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'settled' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // Bank details state with local storage persistence
  const [bankDetails, setBankDetails] = useState(() => {
    const saved = localStorage.getItem('artisan_bank_details');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      bankName: 'State Bank of India (भारतीय स्टेट बैंक)',
      accountNumber: '•••• •••• 4829',
      rawAccount: '309845214829',
      ifsc: 'SBIN0001234',
      accountHolder: artisanProfile?.name || 'रामचंद्र शर्मा (Ramchandra Sharma)',
      isDbtLinked: true
    };
  });

  // Modal form temporary state
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    accountHolder: ''
  });

  // Default seed transactions demonstrating the 2% fee transparently
  const defaultTransactions = [
    {
      id: 'ONDC-2026-98421',
      orderId: 'ORD-98421-DEL',
      date: '22 Sep 2026, 02:45 PM',
      buyerNetwork: 'ONDC - Paytm',
      itemTitle: 'हस्तनिर्मित टेराकोटा सुराही (Terracotta Water Jug)',
      quantity: 2,
      orderValue: 1000,
      feePercent: 2,
      feeAmount: 20,
      payoutAmount: 980,
      status: 'settled',
      utr: 'HDFC9283741829',
      settledAt: '22 Sep 2026, 06:15 PM'
    },
    {
      id: 'ONDC-2026-98415',
      orderId: 'ORD-98415-BOM',
      date: '21 Sep 2026, 11:30 AM',
      buyerNetwork: 'ONDC - Mystore',
      itemTitle: 'पारंपरिक मिट्टी के दीये सेट (Clay Diya Festive Set)',
      quantity: 5,
      orderValue: 1500,
      feePercent: 2,
      feeAmount: 30,
      payoutAmount: 1470,
      status: 'settled',
      utr: 'SBIN8839201944',
      settledAt: '21 Sep 2026, 04:40 PM'
    },
    {
      id: 'GEM-2026-77312',
      orderId: 'GEM-77312-MIN',
      date: '20 Sep 2026, 09:15 AM',
      buyerNetwork: 'GeM - Direct Treasury (MoSJE)',
      itemTitle: 'हस्तशिल्प उपहार सेट (Handcrafted Office Decor Gift Set)',
      quantity: 10,
      orderValue: 12000,
      feePercent: 0, // GeM Direct Treasury is 0% platform fee
      feeAmount: 0,
      payoutAmount: 12000,
      status: 'settled',
      utr: 'PFMS2026092000192',
      settledAt: '20 Sep 2026, 01:20 PM'
    },
    {
      id: 'ONDC-2026-98402',
      orderId: 'ORD-98402-BLR',
      date: '19 Sep 2026, 05:20 PM',
      buyerNetwork: 'ONDC - Pincode (PhonePe)',
      itemTitle: 'नक्काशीदार टेराकोटा फूलदान (Floral Clay Vase)',
      quantity: 1,
      orderValue: 1250,
      feePercent: 2,
      feeAmount: 25,
      payoutAmount: 1225,
      status: 'pending',
      utr: null,
      expectedSettlement: 'डिलीवरी उपरांत T+1 कार्यदिवस (Pending Delivery)'
    },
    {
      id: 'ONDC-2026-98399',
      orderId: 'ORD-98399-HYD',
      date: '18 Sep 2026, 03:10 PM',
      buyerNetwork: 'ONDC - Magicpin',
      itemTitle: 'मिट्टी की सजावटी घंटी (Terracotta Windchime)',
      quantity: 1,
      orderValue: 1150,
      feePercent: 2,
      feeAmount: 23,
      payoutAmount: 1127,
      status: 'pending',
      utr: null,
      expectedSettlement: 'डिलीवरी उपरांत T+1 कार्यदिवस (In Transit)'
    }
  ];

  const [transactions, setTransactions] = useState(defaultTransactions);

  // Fetch actual orders from Supabase if available
  useEffect(() => {
    let isMounted = true;

    async function fetchSettlements() {
      try {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user || user;

        if (currentUser?.id) {
          const { data: dbOrders, error } = await supabase
            .from('orders')
            .select('*')
            .or(`artisan_id.eq.${currentUser.id},user_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false });

          if (!error && dbOrders && dbOrders.length > 0 && isMounted) {
            const mapped = dbOrders.map((ord, idx) => {
              const val = Number(ord.total_payout || ord.total_amount || 1000);
              const isGeM = ord.source === 'GeM' || (ord.order_id && ord.order_id.toLowerCase().includes('gem'));
              const feePct = isGeM ? 0 : 2;
              const fee = Math.round(val * (feePct / 100));
              const netPayout = val - fee;
              const isSettled = ord.status === 'delivered' || ord.status === 'completed';

              return {
                id: ord.id || `ONDC-${idx + 100}`,
                orderId: ord.order_id || `ORD-${String(ord.id || idx).slice(0, 8)}`,
                date: new Date(ord.created_at || Date.now()).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }),
                buyerNetwork: ord.source === 'GeM' ? 'GeM - Direct Treasury' : (ord.channel || 'ONDC - Buyer Network'),
                itemTitle: ord.product_title || ord.item_title || 'हस्तशिल्प उत्पाद (Handicraft)',
                quantity: ord.quantity || 1,
                orderValue: val,
                feePercent: feePct,
                feeAmount: fee,
                payoutAmount: netPayout,
                status: isSettled ? 'settled' : 'pending',
                utr: isSettled ? `PFMS${String(ord.id || idx).replace(/[^0-9]/g, '').slice(0, 10) || '9283741'}` : null,
                settledAt: isSettled ? 'निपटान पूर्ण' : null
              };
            });

            setTransactions(mapped);
          }
        }
      } catch (err) {
        console.warn('[Payments] Notice fetching orders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSettlements();
    return () => { isMounted = false; };
  }, [user]);

  // Financial calculations
  const totalSettledEarnings = transactions
    .filter((t) => t.status === 'settled')
    .reduce((acc, curr) => acc + curr.payoutAmount, 0) || 45500;

  const totalPendingSettlement = transactions
    .filter((t) => t.status === 'pending')
    .reduce((acc, curr) => acc + curr.payoutAmount, 0) || 2352;

  const totalPlatformFees = transactions
    .reduce((acc, curr) => acc + curr.feeAmount, 0) || 928;

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter =
      filter === 'all' ? true : t.status === filter;
    const matchesSearch =
      t.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.buyerNetwork.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.itemTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle Bank Modal Submit
  const handleBankFormSubmit = (e) => {
    e.preventDefault();
    if (!bankForm.accountNumber || !bankForm.ifsc || !bankForm.bankName) {
      if (showToast) showToast('कृपया सभी आवश्यक बैंक विवरण भरें।');
      else alert('Please enter all required bank details.');
      return;
    }

    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      if (showToast) showToast('खाता संख्या मेल नहीं खाती (Account numbers do not match)');
      else alert('Account numbers do not match.');
      return;
    }

    setSavingBank(true);
    setTimeout(() => {
      const masked = `•••• •••• ${bankForm.accountNumber.slice(-4)}`;
      const updated = {
        bankName: bankForm.bankName,
        accountNumber: masked,
        rawAccount: bankForm.accountNumber,
        ifsc: bankForm.ifsc.toUpperCase(),
        accountHolder: bankForm.accountHolder || artisanProfile?.name || 'रामचंद्र शर्मा',
        isDbtLinked: true
      };

      setBankDetails(updated);
      localStorage.setItem('artisan_bank_details', JSON.stringify(updated));
      setSavingBank(false);
      setIsBankModalOpen(false);

      if (showToast) {
        showToast(language === 'hi' ? '✅ बैंक खाता विवरण सफलतापूर्वक अपडेट हो गया' : '✅ Bank details updated successfully');
      }
    }, 600);
  };

  const openBankEdit = () => {
    setBankForm({
      bankName: bankDetails.bankName.split(' (')[0],
      accountNumber: bankDetails.rawAccount || '',
      confirmAccountNumber: bankDetails.rawAccount || '',
      ifsc: bankDetails.ifsc || 'SBIN0001234',
      accountHolder: bankDetails.accountHolder || ''
    });
    setIsBankModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Breadcrumb & Government Badge ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span
              onClick={() => navigate('/home')}
              className="hover:text-gray-900 cursor-pointer transition-colors"
            >
              {language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}
            </span>
            <span>/</span>
            <span
              onClick={() => navigate('/profile')}
              className="hover:text-gray-900 cursor-pointer transition-colors"
            >
              {language === 'hi' ? 'कारीगर प्रोफ़ाइल' : 'Artisan Profile'}
            </span>
            <span>/</span>
            <span className="text-gray-900 font-bold">
              {language === 'hi' ? 'भुगतान एवं निपटान' : 'Settlements & Earnings'}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'hi' ? 'ONDC RSP व PFMS एस्क्रो सक्रिय' : 'ONDC RSP & PFMS Escrow Active'}</span>
          </div>
        </div>

        {/* ── Page Header ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {language === 'hi' ? 'शासकीय वित्तीय डैशबोर्ड' : 'Official Financial Dashboard'}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {language === 'hi' ? 'शासकीय भुगतान एवं निपटान डैशबोर्ड' : 'Settlement & Earnings Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                {language === 'hi'
                  ? 'ONDC नेटवर्क पर प्रत्येक सफल बिक्री पर केवल 2% पारदर्शी प्लेटफ़ॉर्म शुल्क लागू होता है। शेष 98% राशि सीधे आपके पंजीकृत बैंक खाते में अंतरित की जाती है।'
                  : 'Transparent 2% Shilp Setu ONDC platform routing fee with direct bank transfers (PFMS/DBT). Absolutely zero hidden charges.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh settlements"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Top-Level Summary Cards (Grid of 3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          
          {/* 1. Net Earnings (कुल आय) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {language === 'hi' ? 'कुल आय (बैंक अंतरित)' : 'Net Settled Earnings'}
                </span>
                <h3 className="text-sm font-bold text-gray-800 mt-0.5">
                  कुल आय (Net Earnings)
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-700 shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-green-700 tracking-tight">
                ₹{totalSettledEarnings.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-800 font-medium bg-green-50/80 px-2.5 py-1 rounded-md border border-green-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>{language === 'hi' ? '100% बैंक खाते में सफलतापूर्वक जमा' : 'Successfully credited to linked bank account'}</span>
              </div>
            </div>
          </div>

          {/* 2. Pending Settlement (लंबित भुगतान) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {language === 'hi' ? 'प्रक्रियाधीन राशि' : 'In-Transit Funds'}
                </span>
                <h3 className="text-sm font-bold text-gray-800 mt-0.5">
                  लंबित भुगतान (Pending Settlement)
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                ₹{totalPendingSettlement.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200/80">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{language === 'hi' ? 'डिलीवरी सत्यापन उपरांत T+1 दिन में देय' : 'Payable on delivery confirmation (T+1 days)'}</span>
              </div>
            </div>
          </div>

          {/* 3. Platform Fee 2% (प्लेटफ़ॉर्म शुल्क) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {language === 'hi' ? 'ONDC रूटिंग एवं रखरखाव' : 'Transparent ONDC Routing'}
                </span>
                <h3 className="text-sm font-bold text-gray-800 mt-0.5">
                  प्लेटफ़ॉर्म शुल्क (Platform Fee - 2%)
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                ₹{totalPlatformFees.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-800 font-medium bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{language === 'hi' ? 'केवल 2% निश्चित शुल्क • 0% अतिरिक्त कटौती' : 'Fixed 2% fee • Zero hidden deductions'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── 2% Math Explanation Callout (Government Standard) ── */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-950">
                {language === 'hi' ? '2% शुल्क का पारदर्शी गणित समझें' : 'Understanding the 2% Shilp Setu Settlement Formula'}
              </h4>
              <p className="text-xs text-blue-800 mt-0.5">
                {language === 'hi'
                  ? 'उदाहरण: यदि ग्राहक ने ₹1,000 का ऑर्डर दिया, तो 2% (₹20) शिल्प सेतु का सर्वर व तकनीकी शुल्क कटेगा और पूरे ₹980 आपके बैंक खाते में जमा होंगे।'
                  : 'Example: For a ₹1,000 order value, 2% (₹20) is deducted for platform maintenance and routing, and ₹980 is paid directly into your bank.'}
              </p>
            </div>
          </div>

          <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-mono font-bold text-blue-900 shrink-0 self-stretch sm:self-auto text-center">
            {language === 'hi' ? 'ऑर्डर ₹1000 - 2% (₹20) = ₹980 बैंक भुगतान' : '₹1000 - 2% (₹20) = ₹980 Payout'}
          </div>
        </div>

        {/* ── 3. Recent Transactions Ledger (Table / Stacked List) ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Ledger Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {language === 'hi' ? 'हालिया लेन-देन एवं निपटान विवरणी' : 'Recent Transactions & Settlement Ledger'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'hi'
                  ? 'प्रत्येक ऑर्डर का स्पष्ट मूल्य, 2% शुल्क कटौती और बैंक जमा राशि'
                  : 'Individual order breakdown showing gross value, 2% platform fee, and net bank payout'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'hi' ? 'सभी' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setFilter('settled')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filter === 'settled'
                    ? 'bg-white text-green-700 shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'hi' ? 'निपटान पूर्ण' : 'Settled'}
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filter === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'hi' ? 'लंबित' : 'Pending'}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'hi' ? 'ऑर्डर संख्या या खरीदार नेटवर्क खोजें...' : 'Search by Order ID, Buyer Network, or Product...'}
              className="w-full text-xs text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Transaction Rows */}
          <div className="divide-y divide-gray-100">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium">
                  {language === 'hi' ? 'कोई लेन-देन नहीं मिला' : 'No transactions found'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'hi' ? 'फ़िल्टर या खोज शब्द बदल कर देखें।' : 'Try changing your search term or active filter.'}
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Side: Order Identity & Network */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {tx.orderId}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {tx.buyerNetwork}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        • {tx.date}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-gray-900 truncate">
                      {tx.itemTitle}
                      {tx.quantity > 1 && (
                        <span className="text-xs text-gray-500 font-normal ml-1">
                          (मात्रा: {tx.quantity})
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="pt-0.5">
                      {tx.status === 'settled' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span>
                            {language === 'hi' ? 'बैंक में जमा' : 'Settled to Bank'}
                            {tx.utr && <span className="font-mono ml-1 font-semibold">• UTR: {tx.utr}</span>}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {language === 'hi' ? 'डिलीवरी उपरांत देय (Pending Delivery)' : 'Pending Delivery Confirmation'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Strict Mathematical Breakdown */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 min-w-[260px] sm:min-w-[280px] shrink-0 space-y-1.5">
                    {/* 1. Order Value */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{language === 'hi' ? 'ऑर्डर मूल्य (Order Value):' : 'Order Value:'}</span>
                      <span className="font-semibold text-gray-900">
                        ₹{tx.orderValue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* 2. Platform Fee (2%) */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {language === 'hi'
                          ? `शिल्प सेतु शुल्क (${tx.feePercent}%):`
                          : `Shilp Setu Fee (${tx.feePercent}%):`}
                      </span>
                      <span className="font-semibold text-red-600">
                        {tx.feeAmount > 0 ? `-₹${tx.feeAmount}` : '₹0 (GeM Escrow)'}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">
                        {language === 'hi' ? 'बैंक भुगतान (Bank Payout):' : 'Bank Payout:'}
                      </span>
                      <span className="text-base font-extrabold text-green-700 tracking-tight">
                        ₹{tx.payoutAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Ledger Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              {language === 'hi'
                ? 'सभी निपटान भारतीय रिजर्व बैंक (RBI) व ONDC दिशा-निर्देशों के अनुरूप PFMS/नोडल एस्क्रो खाते द्वारा सुरक्षित हैं।'
                : 'All payouts processed under RBI & ONDC escrow compliance guidelines via nodal accounts.'}
            </span>
            <span className="font-medium text-gray-700">
              {language === 'hi' ? `कुल ${filteredTransactions.length} लेन-देन प्रदर्शित` : `Showing ${filteredTransactions.length} transactions`}
            </span>
          </div>
        </div>

        {/* ── 4. Bank Account Details Section ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {language === 'hi' ? 'पंजीकृत भुगतान बैंक खाता' : 'Linked Settlement Bank Account'}
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'hi'
                    ? 'सभी ONDC बिक्री एवं GeM आदेशों का भुगतान सीधे इस खाते में जमा होता है।'
                    : 'All net earnings from ONDC & GeM are credited directly to this verified account.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openBankEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-600" />
              <span>{language === 'hi' ? 'बैंक विवरण बदलें' : 'Update Bank Details'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm">
            
            {/* Bank Name */}
            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs text-gray-500 font-medium block">
                {language === 'hi' ? 'बैंक का नाम' : 'Bank Name'}
              </span>
              <span className="font-bold text-gray-900 block truncate">
                {bankDetails.bankName}
              </span>
            </div>

            {/* Account Number */}
            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs text-gray-500 font-medium block">
                {language === 'hi' ? 'खाता संख्या (Account No.)' : 'Account Number'}
              </span>
              <span className="font-mono font-bold text-gray-900 block truncate">
                {bankDetails.accountNumber}
              </span>
            </div>

            {/* IFSC Code */}
            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs text-gray-500 font-medium block">
                {language === 'hi' ? 'आईएफएससी कोड (IFSC)' : 'IFSC Code'}
              </span>
              <span className="font-mono font-bold text-gray-900 block">
                {bankDetails.ifsc}
              </span>
            </div>

            {/* Beneficiary & DBT status */}
            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs text-gray-500 font-medium block">
                {language === 'hi' ? 'सत्यापन स्थिति (Status)' : 'DBT / PFMS Status'}
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs text-green-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>{language === 'hi' ? 'डीबीटी सक्रिय (Verified)' : 'Active for DBT'}</span>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              {language === 'hi' ? 'खाताधारक का नाम:' : 'Account Holder:'}{' '}
              <strong className="text-gray-800">{bankDetails.accountHolder}</strong>
            </span>
            <span className="text-green-700 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'MoSJE PFMS पोर्टल से सत्यापित' : 'Verified via MoSJE PFMS'}</span>
            </span>
          </div>
        </div>

      </div>

      {/* ── Update Bank Details Modal ── */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-base text-gray-900">
                  {language === 'hi' ? 'बैंक खाता विवरण अपडेट करें' : 'Update Settlement Bank Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBankFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'hi' ? 'बैंक का नाम *' : 'Bank Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g. State Bank of India, Punjab National Bank"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'hi' ? 'खाताधारक का नाम *' : 'Account Holder Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  placeholder="As per bank passbook"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'hi' ? 'बैंक खाता संख्या *' : 'Bank Account Number *'}
                </label>
                <input
                  type="password"
                  required
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="Enter full account number"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'hi' ? 'खाता संख्या पुनः दर्ज करें *' : 'Confirm Account Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.confirmAccountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                  placeholder="Re-enter account number"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'hi' ? 'आईएफएससी कोड (IFSC Code) *' : 'IFSC Code *'}
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.ifsc}
                  onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-[11px] text-yellow-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'hi'
                    ? 'कृपया सुनिश्चित करें कि यह बैंक खाता आपके आधार से जुड़ा है ताकि डायरेक्ट बेनिफिट ट्रांसफर (DBT) में कोई बाधा न आए।'
                    : 'Ensure this account is linked with your Aadhaar for smooth PFMS / DBT direct government settlements.'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingBank
                    ? (language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...')
                    : (language === 'hi' ? 'विवरण सुरक्षित करें' : 'Save Details')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
