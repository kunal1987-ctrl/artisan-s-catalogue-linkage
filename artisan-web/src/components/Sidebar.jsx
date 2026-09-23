import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { handleAddCraftNavigation } from '../utils/authGuard';
import { supabase } from '../supabaseClient';

/**
 * Sidebar Component for Shilp Setu
 * Fully internationalized using react-i18next `t()` hook.
 * Uses `sidebar.*` translation dictionary keys.
 */
export default function Sidebar({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { artisanName, session, artisanProfile } = useAuth();
  const { openAtmLanguageModal, currentLanguageConfig, language = 'en' } = useLanguage();

  // Dynamic badge counts from Supabase
  const [productCount, setProductCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        // Products count
        let productQuery = supabase.from('items').select('id', { count: 'exact', head: true });
        if (session?.user?.id) {
          productQuery = productQuery.or(`artisan_id.eq.${session.user.id},user_id.eq.${session.user.id}`);
        }
        const { count: pCount } = await productQuery;
        if (typeof pCount === 'number') setProductCount(pCount);

        // New orders count
        const { count: oCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'new', 'PENDING', 'NEW']);
        if (typeof oCount === 'number') setNewOrderCount(oCount);
      } catch (err) {
        console.warn('Sidebar badge count fetch notice:', err);
      }
    }
    fetchCounts();
  }, [session?.user?.id]);

  const navItems = [
    { to: '/home', label: t('sidebar.home', 'Home'), icon: 'cottage' },
    { to: '/catalog', label: t('sidebar.catalog', 'Catalog'), icon: 'inventory_2', badge: String(productCount) },
    {
      to: '/orders',
      label: t('sidebar.orders', 'Orders'),
      icon: 'receipt_long',
      badge: newOrderCount > 0 ? `${newOrderCount} ${t('sidebar.new_badge_suffix', 'New')}` : null,
      badgeColor: 'bg-[#ff9062]/20 text-[#9c441c]',
    },
    {
      to: '/verification',
      label: language === 'hi' ? 'सरकारी सत्यापन' : 'Gov Verification',
      icon: 'verified_user',
      badge: artisanProfile?.isGovVerified || artisanProfile?.verified ? '✓ GeM' : 'Verify',
      badgeColor: artisanProfile?.isGovVerified || artisanProfile?.verified
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <aside
      className={`w-64 bg-[#fdf9f3] border-r border-[#d1c4bd]/40 flex flex-col justify-between p-4 shrink-0 hidden lg:flex sticky top-0 h-screen overflow-y-auto ${className}`}
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center px-2 pt-2">
          <div
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/shilp-setu-logo.png"
              alt="Shilp Setu"
              className="h-9 w-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="font-bold text-[18px] text-primary tracking-tight leading-tight">
              {t('sidebar.brand', 'Shilp Setu')}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const isDirectActive = location.pathname === item.to;
            const isCatalogActive =
              item.to === '/catalog' &&
              (location.pathname.includes('/details') || location.pathname.includes('/product'));
            const isActive = isDirectActive || isCatalogActive;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-[14px] transition-all ${
                  isActive
                    ? 'bg-[#2e241e] text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-primary hover:bg-[#ebe8e2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-[#ffdeaa]' : item.badgeColor || 'bg-[#ebe8e2] text-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Capture Craft CTA */}
        <div className="p-3 bg-[#f1ede7] rounded-2xl border border-[#d1c4bd]/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-secondary text-[18px]">photo_camera</span>
            <span>{t('sidebar.ai_studio', 'AI Studio Assistant')}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {t('sidebar.studio_desc', 'Snap photo & speak naturally to list your craft.')}
          </p>
          <button
            onClick={(e) => handleAddCraftNavigation(navigate, e)}
            className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>{t('sidebar.add_craft', '+ Add Craft')}</span>
          </button>
        </div>

        {/* Desktop Language Selector Card */}
        <button
          type="button"
          onClick={openAtmLanguageModal}
          className="w-full p-3 rounded-2xl bg-white border border-[#d1c4bd]/70 hover:border-[#9c441c]/50 shadow-xs hover:shadow-md transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#2e241e] text-[#ffdeaa] flex items-center justify-center text-xs font-black group-hover:scale-105 transition-transform shadow-2xs">
              {currentLanguageConfig?.keyChar || 'अ'}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-primary truncate">
                {currentLanguageConfig?.native || 'हिंदी'}
              </span>
              <span className="text-[10px] text-secondary font-medium">
                {t('sidebar.change_language', 'Change Language')}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Bottom Sidebar Profile & Help */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[#d1c4bd]/40">
        <Link
          to="/support"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-semibold cursor-pointer ${
            location.pathname === '/support'
              ? 'bg-[#2e241e] text-white shadow-xs'
              : 'text-on-surface-variant hover:text-primary hover:bg-[#ebe8e2]'
          }`}
        >
          <HelpCircle className="w-[18px] h-[18px] shrink-0" />
          <span>{t('sidebar.help_support', 'Help & Support')}</span>
        </Link>
        <div
          onClick={() => navigate('/profile')}
          title="Artisan Profile (प्रोफ़ाइल)"
          className="flex items-center gap-3 p-2.5 rounded-xl bg-[#ebe8e2]/60 border border-[#d1c4bd]/30 cursor-pointer hover:bg-[#ebe8e2] transition-all"
        >
          <img
            alt={artisanName}
            className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmvGYszZXuA45tASeKKSeAVzVfFnHtKAGtNsa4IB8eSEDv7aMN2Dj5pKYYgdmAj_qpHqPikrwnevchRmdRCCcuMRXPRl7fhyfOt-_XjOQic4K5XzVtP9-UCofnVEe570fnmUd_GNT4uQVrjHGKIIoPPyo1B2RZ4vXYFmloLyQfCyNa2hjDllGlTqYSywEQevMYAYPK6K6FMsX9YfKjc5nGMVc5iOINi_PYrPZd2lLY5bqH9AK1mI1L"
          />
          <span className="font-bold text-[13px] text-primary truncate min-w-0">
            {artisanName}
          </span>
        </div>
      </div>
    </aside>
  );
}
