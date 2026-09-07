import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NotificationBar from './components/NotificationBar';
import LanguageToggle from './components/LanguageToggle';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    artisanName,
    artisanStudio,
    artisanProfile,
    signOut,
    openAuthModal,
    language,
    toggleNotifications,
    unreadCount,
  } = useAuth();

  const navItems = [
    { to: '/home', label: language === 'hi' ? 'आवास' : 'Home', icon: 'cottage' },
    { to: '/catalog', label: language === 'hi' ? 'कैटलॉग' : 'Catalog', icon: 'inventory_2', badge: '12' },
    { to: '/orders', label: language === 'hi' ? 'ऑर्डर्स' : 'Orders', icon: 'receipt_long', badge: language === 'hi' ? '3 नए' : '3 New', badgeColor: 'bg-[#ff9062]/20 text-[#9c441c]' },
    { to: '/success', label: language === 'hi' ? 'विवरण' : 'Details', icon: 'verified' },
  ];

  const isVerified = !!artisanProfile?.verified;

  return (
    <div className="flex min-h-screen bg-[#fdf9f3] text-on-surface font-sans selection:bg-[#ffdbce]">
      {/* Desktop Left Sidebar */}
      <aside className="w-64 bg-[#fdf9f3] border-r border-[#d1c4bd]/40 flex flex-col justify-between p-4 shrink-0 hidden lg:flex sticky top-0 h-screen overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Studio Brand Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div 
              onClick={() => navigate('/home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2e241e] flex items-center justify-center text-[#ffdeaa] shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">token</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[17px] text-primary tracking-tight leading-tight">Kala Sangam</span>
                <span className="text-[12px] text-secondary font-medium tracking-wide">
                  {language === 'hi' ? 'कला संगम स्टूडियो' : 'Kala Sangam Studio'}
                </span>
              </div>
            </div>
            {/* Sync Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>{language === 'hi' ? 'सिंक' : 'Sync'}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 mt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
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
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-[#ffdeaa]' : item.badgeColor || 'bg-[#ebe8e2] text-primary'
                    }`}>
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
              <span>{language === 'hi' ? 'एआई स्टूडियो सहायक' : 'AI Studio Assistant'}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              {language === 'hi'
                ? 'फ़ोटो लें और 10 सेकंड में शिल्प सूचीबद्ध करें।'
                : 'Snap photo & speak naturally to list in 10s.'}
            </p>
            <button
              onClick={() => navigate('/capture')}
              className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>{language === 'hi' ? '+ नया शिल्प' : '+ Add Craft'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Sidebar Profile & Help */}
        <div className="flex flex-col gap-4 pt-4 border-t border-[#d1c4bd]/40">
          <a
            href="tel:1800-KALA"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-[#ebe8e2] transition-colors text-[13px] font-medium"
          >
            <span className="material-symbols-outlined text-[19px]">help</span>
            <span>{language === 'hi' ? 'सहायता केंद्र (1800-KALA)' : 'Support Center (1800-KALA)'}</span>
          </a>
          <div 
            onClick={() => isVerified ? navigate('/success') : openAuthModal()}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#ebe8e2]/60 border border-[#d1c4bd]/30 cursor-pointer hover:bg-[#ebe8e2] transition-all"
          >
            <div className="relative">
              <img
                alt="Ramesh Kumar"
                className="w-10 h-10 rounded-full object-cover shadow-sm"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmvGYszZXuA45tASeKKSeAVzVfFnHtKAGtNsa4IB8eSEDv7aMN2Dj5pKYYgdmAj_qpHqPikrwnevchRmdRCCcuMRXPRl7fhyfOt-_XjOQic4K5XzVtP9-UCofnVEe570fnmUd_GNT4uQVrjHGKIIoPPyo1B2RZ4vXYFmloLyQfCyNa2hjDllGlTqYSywEQevMYAYPK6K6FMsX9YfKjc5nGMVc5iOINi_PYrPZd2lLY5bqH9AK1mI1L"
              />
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#f7f3ed] ${isVerified ? 'bg-green-600' : 'bg-amber-500'}`}></span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-[13px] text-primary truncate">
                {isVerified 
                  ? (artisanProfile.phone || artisanName.split('(')[0].trim()) 
                  : (language === 'hi' ? 'रामेश कुम्हार (अतिथि)' : 'Ramesh Kumar (Guest)')}
              </span>
              <span className="text-[11px] text-secondary truncate">
                {isVerified 
                  ? (language === 'hi' ? '✓ फ़ोन सत्यापित' : '✓ Phone Verified') 
                  : (language === 'hi' ? 'फ़ोन सत्यापन करें' : 'Tap to Verify Phone')}
              </span>
            </div>
            <span className={`material-symbols-outlined text-[18px] ${isVerified ? 'text-emerald-700' : 'text-amber-600'}`}>
              {isVerified ? 'verified' : 'login'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Routed Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#fdf9f3] pb-20 lg:pb-0 overflow-y-auto">
        {/* Global Auth Status Top Bar */}
        <header className="bg-[#180f0a] text-white px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between border-b border-black/20 text-xs sticky top-0 z-30 shadow-sm w-full gap-4">
          <div className="flex items-center gap-3">
            {/* Logo on far left */}
            <div 
              onClick={() => navigate('/home')} 
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Kala Sangam Home"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2e241e] border border-white/10 flex items-center justify-center text-[#ffdeaa] shadow-xs group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">token</span>
              </div>
              <div className="flex flex-col lg:hidden">
                <span className="font-bold text-sm text-white tracking-tight leading-tight">Kala Sangam</span>
                <span className="text-[10px] text-white/60">{language === 'hi' ? 'कला संगम' : 'Artisan Hub'}</span>
              </div>
            </div>

            {/* Path / Institutional indicator */}
            <div className="hidden sm:flex items-center gap-2 text-white/70 text-xs font-semibold">
              <span className="h-4 w-[1px] bg-white/20 hidden lg:block" />
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{language === 'hi' ? 'GeM एवं ONDC लिंकेज' : 'GeM & ONDC Dual Linkage'}</span>
              </span>
            </div>
          </div>

          {/* Far Right: Auth Controls & Language Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {isVerified ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>🟢 {artisanProfile.phone || user?.phone || '+91 99999 99999'} [{language === 'hi' ? '✓ सत्यापित' : '✓ Verified'}]</span>
                </span>
                <button
                  onClick={signOut}
                  className="px-2.5 py-1 rounded-full bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                  title={language === 'hi' ? 'लॉगआउट' : 'Logout'}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[13px]">logout</span>
                  <span className="hidden sm:inline">{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] shadow-md transition-all cursor-pointer active:scale-95 animate-pulse"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span>{language === 'hi' ? '📲 फ़ोन लॉगिन' : '📲 Phone Login'}</span>
              </button>
            )}
            <span className="text-[11px] text-[#ffdeaa] font-medium hidden md:inline">
              {artisanStudio}
            </span>

            {/* Sleek Language Switcher Component */}
            <LanguageToggle variant="dark" />

            {/* Notifications Bell Button */}
            <button
              onClick={toggleNotifications}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center relative transition-all cursor-pointer active:scale-95"
              title="Notifications"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#ff9062] absolute top-1 right-1 ring-1 ring-[#180f0a]" />
              )}
            </button>
          </div>
        </header>

        {/* Global Notification Drawer & Toast Bar */}
        <NotificationBar />

        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fdf9f3]/95 backdrop-blur-md border-t border-[#d1c4bd]/50 px-4 py-2 flex items-center justify-around shadow-lg">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-colors ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">cottage</span>
          <span>{language === 'hi' ? 'आवास' : 'Home'}</span>
        </NavLink>
        <NavLink
          to="/catalog"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-colors ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">inventory_2</span>
          <span>{language === 'hi' ? 'कैटलॉग' : 'Catalog'}</span>
        </NavLink>
        {/* Floating Center Capture Button */}
        <button
          onClick={() => navigate('/capture')}
          className="w-12 h-12 -mt-5 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-2 border-white cursor-pointer"
          aria-label="Add Product"
        >
          <span className="material-symbols-outlined text-[24px]">photo_camera</span>
        </button>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-colors relative ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          <span>{language === 'hi' ? 'ऑर्डर्स' : 'Orders'}</span>
          <span className="w-2 h-2 rounded-full bg-[#9c441c] absolute top-0 right-2"></span>
        </NavLink>
        <NavLink
          to="/success"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-colors ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
          <span>{language === 'hi' ? 'विवरण' : 'Profile'}</span>
        </NavLink>
      </nav>
    </div>
  );
}
