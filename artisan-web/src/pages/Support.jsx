import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Search
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Support() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [openFaq, setOpenFaq] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      question: language === 'hi' 
        ? 'मैं ओएनडीसी (ONDC) पर शिल्प कैसे सूचीबद्ध करूं?' 
        : 'How do I list a product on ONDC?',
      answer: language === 'hi'
        ? 'कैटलॉग पेज पर जाएं, किसी भी उत्पाद कार्ड पर क्लिक करके उसका विवरण (Details) पेज खोलें, और "List to ONDC" बटन दबाएं। आपका शिल्प पेटीएम, फोनपे पिनकोड, माईस्टोर और मैजिकपिन पर बिना किसी अतिरिक्त प्लेटफ़ॉर्म शुल्क के तुरंत लाइव हो जाएगा।'
        : 'Navigate to your Catalog, click on any product card to open its Details page, and click the "List to ONDC" button. Your craft will immediately sync across major buyer apps including Paytm, PhonePe Pincode, Mystore, and Magicpin with zero added platform fees.',
    },
    {
      id: 2,
      question: language === 'hi'
        ? 'मैं खरीद आदेश (PO Slip) कैसे प्रिंट करूं?'
        : 'How do I print a PO slip?',
      answer: language === 'hi'
        ? 'ऑर्डर्स (Orders) पेज पर जाएं और संबंधित ऑर्डर कार्ड पर "पर्ची देखें" (View PO Slip) बटन दबाएं। एक स्वच्छ चालान/पीओ स्लिप पॉपअप खुलेगा। वहां दिए गए "Print PO Slip" बटन पर क्लिक करके आप इसे प्रिंट या पीडीएफ के रूप में सहेज सकते हैं।'
        : 'Go to the Orders page, locate your purchase order card, and click the "View PO Slip" ("पर्ची देखें") button. A clean invoice modal will open with itemized details, HSN codes, and platform badges. Click the "Print PO Slip" button to print directly or save as PDF.',
    },
    {
      id: 3,
      question: language === 'hi'
        ? 'मुझे GeM सरकारी खरीद का भुगतान कब प्राप्त होगा?'
        : 'When will I receive my GeM payment?',
      answer: language === 'hi'
        ? 'GeM संस्थागत ऑर्डर भारत सरकार के PFMS एस्क्रो द्वारा सुरक्षित होते हैं। जैसे ही आप "डिस्पैच मार्क करें" पर क्लिक करते हैं और कूरियर रसीद सत्यापित होती है, राशि 10 कार्य दिवसों के भीतर सीधे आपके पंजीकृत बैंक खाते में स्थानांतरित कर दी जाती है।'
        : 'GeM institutional orders are backed by Government PFMS Escrow. Once you click "Mark Dispatched" and the courier logs receipt, settlement is automatically released directly into your registered bank account within 10 business days.',
    },
    {
      id: 4,
      question: language === 'hi'
        ? 'एआई स्टूडियो से नया शिल्प कैसे जोड़ें?'
        : 'How do I capture and upload crafts with AI Studio?',
      answer: language === 'hi'
        ? 'नीचे या साइडबार में दिए गए कैमरा आइकन पर क्लिक करें। अपने फोन से फोटो खींचें या गैलरी से चुनें। शिल्प सेतु का एआई सहायक स्वतः बैकग्राउंड हटा देगा, विवरण तैयार करेगा और उपयुक्त एचएसएन कोड सुझाएगा।'
        : 'Click the Camera icon in your navigation, take a photo or select an image from your device gallery. Shilp Setu\'s AI Studio will automatically remove backgrounds, generate bilingual craft stories, and suggest official HSN codes.',
    },
    {
      id: 5,
      question: language === 'hi'
        ? 'खुदरा मूल्य और GeM थोक मूल्य में क्या अंतर है?'
        : 'What is the difference between direct retail and GeM bulk rates?',
      answer: language === 'hi'
        ? 'खुदरा मूल्य ONDC ऐप्स पर सामान्य ग्राहकों के लिए प्रति इकाई मूल्य है। थोक मूल्य सरकारी मंत्रालयों और सार्वजनिक उपक्रमों (GeM) के बड़े बल्क ऑर्डर्स (MOQ के साथ) के लिए निर्धारित रियायती दर है।'
        : 'Retail price applies to single-unit consumer orders across ONDC apps. Institutional bulk rates apply to reserved government tenders (GeM) with a minimum order quantity (MOQ), securing guaranteed large-volume batch purchases.',
    },
  ];

  const filteredFaqs = searchQuery.trim()
    ? faqs.filter(f => 
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  return (
    <div className="w-full min-h-screen bg-[#fdf9f3] text-stone-900 pb-16">
      {/* Top Breadcrumb Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <Link to="/home" className="hover:text-stone-900 transition-colors">
              {language === 'hi' ? 'आवास' : 'Home'}
            </Link>
            <span>/</span>
            <span className="text-stone-900 font-bold">
              {language === 'hi' ? 'सहायता एवं समर्थन' : 'Help & Support'}
            </span>
          </div>

          <button
            onClick={() => navigate(-1)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'वापस जाएं' : 'Back'}</span>
          </button>
        </div>

        {/* Hero Header */}
        <div className="text-center py-6 sm:py-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-3 shadow-xs">
            <HelpCircle className="w-7 h-7 text-[#9c441c]" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
            {language === 'hi' ? 'आज हम आपकी क्या मदद कर सकते हैं?' : 'How can we help you today?'}
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-2 max-w-xl">
            {language === 'hi'
              ? 'शिल्प सेतु सहायता केंद्र • ओएनडीसी लिस्टिंग, सरकारी GeM टेंडर व भुगतान समाधान'
              : 'Shilp Setu Artisan Help Desk • Instant answers for ONDC listings, GeM tenders, and payouts.'}
          </p>

          {/* Quick FAQ Search Bar */}
          <div className="relative w-full max-w-lg mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'समस्या या प्रश्न खोजें...' : 'Search for questions, orders, or topics...'}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#d1c4bd]/60 focus:border-[#9c441c] focus:outline-none focus:ring-2 focus:ring-[#9c441c]/20 text-sm shadow-xs transition-all"
            />
          </div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
          {/* Card 1: Call Us */}
          <a
            href="tel:1800-SHILP"
            className="p-6 rounded-3xl bg-white border border-[#d1c4bd]/60 shadow-xs hover:shadow-md hover:border-[#9c441c]/40 transition-all group flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-[#ffdbce] text-[#9c441c] flex items-center justify-center transition-colors">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                    {language === 'hi' ? 'सीधा संपर्क' : 'Toll-Free Hotline'}
                  </span>
                  <h3 className="text-lg font-black text-stone-900">
                    {language === 'hi' ? 'हमें कॉल करें' : 'Call Us'}
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                24x7 Active
              </span>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#9c441c] tracking-tight block">
                1800-SHILP
              </span>
              <p className="text-xs text-stone-500 mt-1">
                {language === 'hi'
                  ? 'शिल्पकारों हेतु निःशुल्क राष्ट्रीय हेल्पलाइन (1800-744-57)'
                  : 'Toll-free national artisan assistance hotline (1800-744-57)'}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#9c441c]">
              <span>{language === 'hi' ? 'अभी कॉल मिलाएं' : 'Tap to Dial'}</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>

          {/* Card 2: WhatsApp Support */}
          <a
            href="https://wa.me/919876543210?text=Hello%20Shilp%20Setu%20Support,%20I%20need%20help%20with%20my%20craft%20orders."
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-3xl bg-white border border-[#d1c4bd]/60 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all group flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                    {language === 'hi' ? 'त्वरित चैट' : 'Live Chat'}
                  </span>
                  <h3 className="text-lg font-black text-stone-900">
                    {language === 'hi' ? 'व्हाट्सएप सहायता' : 'WhatsApp Support'}
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300">
                Instant Reply
              </span>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 tracking-tight block">
                +91 98765 43210
              </span>
              <p className="text-xs text-stone-500 mt-1">
                {language === 'hi'
                  ? 'फोटो भेजें, आर्डर पूछताछ या कैटलॉग में तत्काल सहायता पाएं'
                  : 'Send craft photos, order issues, or get direct onboarding help'}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{language === 'hi' ? 'व्हाट्सएप चैट शुरू करें' : 'Open WhatsApp Chat'}</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900">
                {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न (FAQ)' : 'Frequently Asked Questions'}
              </h2>
              <p className="text-xs text-stone-500">
                {language === 'hi'
                  ? 'शिल्प सेतु के प्रमुख उपयोग व समाधान'
                  : 'Everything you need to know about ONDC, GeM, and orders.'}
              </p>
            </div>
            <span className="text-xs font-bold text-stone-400">
              {filteredFaqs.length} {language === 'hi' ? 'प्रश्न' : 'Topics'}
            </span>
          </div>

          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
                <p className="text-sm text-stone-500 font-medium">
                  {language === 'hi' ? 'कोई प्रश्न नहीं मिला' : 'No matching questions found.'}
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all overflow-hidden bg-white ${
                      isOpen 
                        ? 'border-[#9c441c]/40 shadow-xs ring-1 ring-[#9c441c]/10' 
                        : 'border-[#d1c4bd]/50 hover:border-stone-400'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 font-black text-xs flex items-center justify-center shrink-0">
                          0{faq.id}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900">
                          {faq.question}
                        </h3>
                      </div>
                      <div className="shrink-0 text-stone-400">
                        {isOpen ? <ChevronUp className="w-5 h-5 text-[#9c441c]" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 bg-stone-50/50">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Institutional Trust Banner */}
        <div className="mt-10 p-5 rounded-2xl bg-white border border-[#d1c4bd]/60 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-700 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-stone-900">
                {language === 'hi' ? 'भारत सरकार समर्थित शिल्पकार सहायता' : 'Government Recognized Artisan Support'}
              </h4>
              <p className="text-[11px] text-stone-500">
                {language === 'hi'
                  ? 'सभी लेनदेन एवं शिकायतें ONDC और GeM दिशा-निर्देशों के तहत सुरक्षित हैं।'
                  : 'Direct grievance resolution under Ministry of Commerce & Industry guidelines.'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-stone-400">
            ID: SS-HELP-2026
          </span>
        </div>
      </div>
    </div>
  );
}
