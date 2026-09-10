import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import NotificationBar from './components/NotificationBar';
import LanguageToggle from './components/LanguageToggle';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    artisanName,
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
  ];

  const isVerified = !!artisanProfile?.verified;

  return (
    <div className="flex min-h-screen bg-[#fdf9f3] text-on-surface font-sans selection:bg-[#ffdbce]">
      {/* Desktop Left Sidebar */}
      <aside className="w-64 bg-[#fdf9f3] border-r border-[#d1c4bd]/40 flex flex-col justify-between p-4 shrink-0 hidden lg:flex sticky top-0 h-screen overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center px-2 pt-2">
            <div 
              onClick={() => navigate('/home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2e241e] flex items-center justify-center text-[#ffdeaa] shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">storefront</span>
              </div>
              <span className="font-bold text-[18px] text-primary tracking-tight leading-tight">
                Shilp Setu
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
            href="tel:1800-SHILP"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-[#ebe8e2] transition-colors text-[13px] font-medium"
          >
            <span className="material-symbols-outlined text-[19px]">help</span>
            <span>{language === 'hi' ? 'सहायता केंद्र (1800-SHILP)' : 'Support Center (1800-SHILP)'}</span>
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
        {/* Minimalist Mobile-First Sticky Top Navigation */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center">
          {/* Left-Side: Branding */}
          <div 
            onClick={() => navigate('/home')} 
            className="flex items-center gap-2 cursor-pointer group"
            title={language === 'hi' ? 'शिल्प सेतु' : 'Shilp Setu'}
          >
            <h1 className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors">
              {language === 'hi' ? 'शिल्प सेतु' : 'Shilp Setu'}
            </h1>
          </div>

          {/* Right-Side: Essential Controls Only */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Language Toggle */}
            <LanguageToggle variant="light" />

            {/* Notifications */}
            <button
              onClick={toggleNotifications}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center relative transition-all cursor-pointer active:scale-95 border border-gray-200"
              title={language === 'hi' ? 'सूचनाएं' : 'Notifications'}
              aria-label="Notifications"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#9c441c] absolute top-1.5 right-1.5 ring-1 ring-white animate-pulse" />
              )}
            </button>

            {/* Profile / Logout */}
            {isVerified ? (
              <button
                onClick={signOut}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200"
                title={language === 'hi' ? 'लॉगआउट' : 'Sign Out'}
                aria-label="Sign Out"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="w-9 h-9 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-amber-200"
                title={language === 'hi' ? 'लॉगिन' : 'Sign In'}
                aria-label="Sign In"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
              </button>
            )}
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
          className={({ isActive }) => {
            const isCatalogActive =
              isActive ||
              location.pathname.includes('/details') ||
              location.pathname.includes('/product');
            return `flex flex-col items-center gap-0.5 text-[11px] font-bold transition-colors ${
              isCatalogActive ? 'text-primary' : 'text-on-surface-variant'
            }`;
          }}
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
      </nav>
    </div>
  );
}
