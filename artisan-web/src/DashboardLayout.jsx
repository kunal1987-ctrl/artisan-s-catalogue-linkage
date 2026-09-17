import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { HelpCircle, Menu, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import NotificationBar from './components/NotificationBar';
import LanguageSwitcher from './components/LanguageSwitcher';
import AudioMuteButton from './components/AudioMuteButton';
import AudioAssistantIndicator from './components/AudioAssistantIndicator';

import Sidebar from './components/Sidebar';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { openAtmLanguageModal, currentLanguageConfig } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    artisanName,
    artisanProfile,
    signOut,
    openAuthModal,
    language,
    toggleNotifications,
    unreadCount,
    isLoading,
    showToast,
    user,
    session,
    isAuthenticated,
  } = useAuth();

  const isVerified = Boolean(
    artisanProfile?.verified ||
    isAuthenticated ||
    (user && !user.is_anonymous) ||
    session
  );

  // Production-grade logout workflow
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Header Logout] Supabase signOut fallback notice:', err);
    } finally {
      // Clear local user storage & caches
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn('[Header Logout] Storage clear notice:', storageErr);
      }

      // Reset global auth context state
      await signOut();

      // High-contrast localized feedback toast
      showToast?.(
        language === 'hi'
          ? 'सफलतापूर्वक लॉगआउट हो गया (Logged out successfully)'
          : 'Logged out successfully'
      );

      // Immediate replace redirect to prevent hitting browser back button
      navigate('/login', { replace: true });
    }
  };

  // Immediate route protection guard: redirect unauthenticated access to /login
  useEffect(() => {
    if (!isLoading && !isVerified) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isVerified, navigate]);

  if (!isLoading && !isVerified) {
    return <Navigate to="/login" replace />;
  }

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/home', label: t('sidebar.home', 'Home'), icon: 'cottage' },
    { to: '/catalog', label: t('sidebar.catalog', 'Catalog'), icon: 'inventory_2', badge: '12' },
    { to: '/orders', label: t('sidebar.orders', 'Orders'), icon: 'receipt_long', badge: t('sidebar.new_badge', '3 New'), badgeColor: 'bg-[#ff9062]/20 text-[#9c441c]' },
  ];

  return (
    <div className="flex min-h-screen bg-[#fdf9f3] text-on-surface font-sans selection:bg-[#ffdbce]">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Routed Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#fdf9f3] pb-20 lg:pb-0 overflow-y-auto">
        {/* Minimalist Mobile-First Sticky Top Navigation */}
        <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-xs px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center">
          {/* Left-Side: Mobile Hamburger + Branding */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button (mobile only) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer border border-gray-200 active:scale-95"
              aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              title="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-800" />
              ) : (
                <Menu className="w-5 h-5 text-gray-800" />
              )}
            </button>

            <div 
              onClick={() => navigate('/home')} 
              className="flex items-center gap-2 cursor-pointer group"
              title={t('nav.brand', 'Shilp Setu')}
            >
              <img
                src="/shilp-setu-logo.png"
                alt="Shilp Setu"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain group-hover:scale-105 transition-transform shrink-0"
              />
              <h1 className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                {t('nav.brand', 'Shilp Setu')}
              </h1>
            </div>
          </div>

          {/* Right-Side: Essential Controls Only */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* EQ waveform — visible only while audio assistant is speaking */}
            <AudioAssistantIndicator />

            {/* Audio Assistant Mute Toggle */}
            <AudioMuteButton />

            {/* Language Switcher using react-i18next */}
            <LanguageSwitcher />

            {/* Notifications */}
            <button
              onClick={toggleNotifications}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center relative transition-all cursor-pointer active:scale-95 border border-gray-200"
              title={t('nav.notifications', 'Notifications')}
              aria-label={t('nav.notifications', 'Notifications')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#9c441c] absolute top-1 sm:top-1.5 right-1 sm:right-1.5 ring-1 ring-white animate-pulse" />
              )}
            </button>

            {/* Profile / Logout */}
            {isVerified ? (
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200"
                title={t('nav.sign_out', 'Sign Out')}
                aria-label={t('nav.sign_out', 'Sign Out')}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">logout</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-amber-200"
                title={t('nav.sign_in', 'Sign In')}
                aria-label={t('nav.sign_in', 'Sign In')}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">account_circle</span>
              </button>
            )}
          </div>
        </header>

        {/* Global Notification Drawer & Toast Bar */}
        <NotificationBar />

        {/* Mobile Slide-Over Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="relative w-72 max-w-[85vw] bg-[#fdf9f3] h-full shadow-2xl border-r border-[#d1c4bd]/60 flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-250 overflow-y-auto">
              <div className="flex flex-col gap-5">
                {/* Drawer Header with Close */}
                <div className="flex items-center justify-between pb-3 border-b border-[#d1c4bd]/40">
                  <div
                    onClick={() => {
                      navigate('/home');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <img
                      src="/shilp-setu-logo.png"
                      alt="Shilp Setu"
                      className="h-8 w-8 object-contain shrink-0"
                    />
                    <span className="font-bold text-base text-primary tracking-tight">
                      {t('sidebar.brand', 'Shilp Setu')}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Artisan Profile Card */}
                <div
                  onClick={() => {
                    navigate('/catalog');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#ebe8e2]/60 border border-[#d1c4bd]/40 cursor-pointer hover:bg-[#ebe8e2] transition-all"
                >
                  <img
                    alt={artisanName}
                    className="w-11 h-11 rounded-full object-cover shadow-sm shrink-0"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmvGYszZXuA45tASeKKSeAVzVfFnHtKAGtNsa4IB8eSEDv7aMN2Dj5pKYYgdmAj_qpHqPikrwnevchRmdRCCcuMRXPRl7fhyfOt-_XjOQic4K5XzVtP9-UCofnVEe570fnmUd_GNT4uQVrjHGKIIoPPyo1B2RZ4vXYFmloLyQfCyNa2hjDllGlTqYSywEQevMYAYPK6K6FMsX9YfKjc5nGMVc5iOINi_PYrPZd2lLY5bqH9AK1mI1L"
                  />
                  <span className="font-bold text-sm text-primary truncate min-w-0">
                    {artisanName}
                  </span>
                </div>

                {/* Mobile Drawer Language Selector */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAtmLanguageModal();
                  }}
                  className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#d1c4bd]/80 hover:border-[#9c441c]/60 shadow-xs transition-all cursor-pointer group text-left"
                >
                  <span className="w-8 h-8 rounded-xl bg-[#2e241e] text-[#ffdeaa] flex items-center justify-center text-xs font-black shadow-2xs">
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
                </button>

                {/* Mobile Navigation Links */}
                <nav className="flex flex-col gap-1.5">
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
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          isActive
                            ? 'bg-[#2e241e] text-white shadow-xs'
                            : 'text-on-surface-variant hover:text-primary hover:bg-[#ebe8e2]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-white/20 text-[#ffdeaa]' : item.badgeColor || 'bg-[#ebe8e2] text-primary'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}

                  {/* Help & Support link now accessible on mobile! */}
                  <Link
                    to="/support"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      location.pathname === '/support'
                        ? 'bg-[#2e241e] text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-primary hover:bg-[#ebe8e2]'
                    }`}
                  >
                    <HelpCircle className="w-[18px] h-[18px] shrink-0" />
                    <span>{t('sidebar.help_support', 'Help & Support')}</span>
                  </Link>
                </nav>

                {/* Quick Add Craft Button */}
                <div className="p-3 bg-[#f1ede7] rounded-2xl border border-[#d1c4bd]/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-secondary text-[18px]">photo_camera</span>
                    <span>{t('sidebar.ai_studio', 'AI Studio Assistant')}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {t('sidebar.studio_desc', 'Snap photo & speak naturally to list in 10s.')}
                  </p>
                  <button
                    onClick={() => {
                      navigate('/capture');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <span>{t('sidebar.add_craft', '+ Add Craft')}</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-[#d1c4bd]/40 flex flex-col gap-2">
                {isVerified ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>{t('sidebar.sign_out', 'Sign Out')}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>{t('sidebar.sign_in', 'Sign In')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fdf9f3]/95 backdrop-blur-md border-t border-[#d1c4bd]/50 px-3 sm:px-4 py-2 flex items-center justify-around shadow-lg">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-bold transition-colors min-w-[56px] py-1 ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">cottage</span>
          <span>{t('sidebar.home', 'Home')}</span>
        </NavLink>
        <NavLink
          to="/catalog"
          className={({ isActive }) => {
            const isCatalogActive =
              isActive ||
              location.pathname.includes('/details') ||
              location.pathname.includes('/product');
            return `flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-bold transition-colors min-w-[56px] py-1 ${
              isCatalogActive ? 'text-primary' : 'text-on-surface-variant'
            }`;
          }}
        >
          <span className="material-symbols-outlined text-[22px]">inventory_2</span>
          <span>{t('sidebar.catalog', 'Catalog')}</span>
        </NavLink>
        {/* Floating Center Capture Button */}
        <button
          onClick={() => navigate('/capture')}
          className="w-12 h-12 -mt-5 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-white cursor-pointer shrink-0"
          aria-label={t('sidebar.add_craft', 'Add Craft')}
        >
          <span className="material-symbols-outlined text-[24px]">photo_camera</span>
        </button>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] sm:text-[11px] font-bold transition-colors relative min-w-[56px] py-1 ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          <span>{t('sidebar.orders', 'Orders')}</span>
          <span className="w-2 h-2 rounded-full bg-[#9c441c] absolute top-1 right-2"></span>
        </NavLink>
      </nav>
    </div>
  );
}

