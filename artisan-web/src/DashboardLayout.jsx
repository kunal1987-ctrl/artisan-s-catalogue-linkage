import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, artisanName, artisanStudio } = useAuth();

  const navItems = [
    { to: '/home', label: 'Home (आवास)', icon: 'cottage' },
    { to: '/catalog', label: 'Catalog (कैटलॉग)', icon: 'inventory_2', badge: '12' },
    { to: '/orders', label: 'Orders (ऑर्डर्स)', icon: 'receipt_long', badge: '3 New', badgeColor: 'bg-[#ff9062]/20 text-[#9c441c]' },
    { to: '/success', label: 'Success / Details (विवरण)', icon: 'verified' },
  ];

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
                <span className="text-[12px] text-secondary font-medium tracking-wide">कला संगम स्टूडियो</span>
              </div>
            </div>
            {/* Sync Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Sync</span>
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
              <span>AI Studio Assistant</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Snap photo & speak Hindi/English to list in 10s.
            </p>
            <button
              onClick={() => navigate('/capture')}
              className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>+ Add Craft (नया शिल्प)</span>
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
            <span>Sahayata Kendra (1800-KALA)</span>
          </a>
          <div 
            onClick={() => navigate('/success')}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#ebe8e2]/60 border border-[#d1c4bd]/30 cursor-pointer hover:bg-[#ebe8e2] transition-all"
          >
            <div className="relative">
              <img
                alt="Ramesh Kumar"
                className="w-10 h-10 rounded-full object-cover shadow-sm"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmvGYszZXuA45tASeKKSeAVzVfFnHtKAGtNsa4IB8eSEDv7aMN2Dj5pKYYgdmAj_qpHqPikrwnevchRmdRCCcuMRXPRl7fhyfOt-_XjOQic4K5XzVtP9-UCofnVEe570fnmUd_GNT4uQVrjHGKIIoPPyo1B2RZ4vXYFmloLyQfCyNa2hjDllGlTqYSywEQevMYAYPK6K6FMsX9YfKjc5nGMVc5iOINi_PYrPZd2lLY5bqH9AK1mI1L"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-600 ring-2 ring-[#f7f3ed]"></span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-[13px] text-primary truncate">{artisanName.split('(')[0].trim()}</span>
              <span className="text-[11px] text-secondary truncate">
                UID: ...{user?.id ? user.id.slice(0, 6) : 'anon'}
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-emerald-700">verified</span>
          </div>
        </div>
      </aside>

      {/* Main Routed Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#fdf9f3] pb-20 lg:pb-0 overflow-y-auto">
        {/* Global Auth Status Top Bar */}
        <header className="bg-[#180f0a] text-white px-4 sm:px-6 py-2 flex items-center justify-between border-b border-black/20 text-xs sticky top-0 z-30 shadow-sm flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>🟢 ऑथेंटिकेटेड (UID: ...{user?.id ? user.id.slice(0, 6) : 'anon'}) • {artisanName}</span>
            </span>
            <span className="hidden sm:inline-block text-white/50 text-[11px]">
              | Supabase Auth JWT Active • Institutional GeM & ONDC
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#ffdeaa] font-medium hidden md:inline">
              {artisanStudio}
            </span>
          </div>
        </header>

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
          <span>Home</span>
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
          <span>Catalog</span>
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
          <span>Orders</span>
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
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
