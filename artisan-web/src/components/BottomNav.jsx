import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { to: '/', label: t('nav.home', 'Home'), icon: 'home' },
    { to: '/catalog', label: t('nav.catalog', 'Catalog'), icon: 'storefront' },
    { to: '/capture', label: t('nav.studio', 'Studio'), icon: 'photo_camera', isHighlight: true },
    { to: '/orders', label: t('nav.orders', 'Orders'), icon: 'local_mall' },
    { to: '/profile', label: t('nav.profile', 'Profile'), icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 md:hidden shadow-lg safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all ${
                item.isHighlight
                  ? 'text-white'
                  : isActive
                  ? 'text-amber-800 font-bold'
                  : 'text-stone-500 hover:text-stone-800 font-medium'
              }`}
            >
              {item.isHighlight ? (
                <div className="w-10 h-10 -mt-5 rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform ring-4 ring-white">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
              ) : (
                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-amber-800' : 'text-stone-500'}`}>
                  {item.icon}
                </span>
              )}
              <span className={`text-[11px] leading-tight mt-0.5 tracking-tight ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
