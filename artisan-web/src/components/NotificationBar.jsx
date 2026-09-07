import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotificationBar() {
  const navigate = useNavigate();
  const {
    language,
    notifications,
    isNotificationsOpen,
    closeNotifications,
    markAllNotificationsRead,
    unreadCount,
    toast,
  } = useAuth();

  return (
    <>
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-3 right-4 z-50 animate-bounce transition-all duration-300">
          <div className="bg-[#180f0a] text-[#ffdeaa] px-4 py-2.5 rounded-2xl shadow-2xl border border-[#ff9062]/40 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff9062] animate-ping" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Slide-in Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={closeNotifications}
          />

          {/* Drawer Content */}
          <aside className="relative w-full max-w-sm bg-[#fdf9f3] text-[#180f0a] h-full shadow-2xl border-l border-[#d1c4bd] flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-[#2e241e] text-white flex items-center justify-between border-b border-[#443831]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-[#ffdeaa]">notifications_active</span>
                <span className="font-bold text-sm tracking-wide">
                  {language === 'hi' ? 'सूचनाएं एवं अलर्ट' : 'Notifications & Alerts'}
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#ff9062] text-[#180f0a]">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={closeNotifications}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Subheader with Mark All as Read */}
            <div className="px-4 py-2 bg-[#f1ede7] border-b border-[#e5dfd7] flex items-center justify-between text-xs">
              <span className="text-secondary font-medium">
                {language === 'hi' ? `${notifications.length} अपडेट उपलब्ध` : `${notifications.length} updates available`}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-[#9c441c] hover:underline font-bold text-[11px] cursor-pointer"
                >
                  {language === 'hi' ? 'सभी पढ़ा हुआ चिह्नित करें' : 'Mark all as read'}
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.link) {
                      navigate(item.link);
                      closeNotifications();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    !item.read
                      ? 'bg-white border-[#ff9062]/50 shadow-sm ring-1 ring-[#ff9062]/20'
                      : 'bg-[#f7f3ed] border-[#e8e2d9] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-[#180f0a] leading-tight">
                      {language === 'hi' ? item.title_hi : item.title}
                    </span>
                    <span className="text-[10px] text-[#80756f] shrink-0 font-medium">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-[#554a43] leading-relaxed">
                    {language === 'hi' ? item.message_hi : item.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#9c441c] hover:underline flex items-center gap-1">
                      <span>{language === 'hi' ? 'देखें' : 'View'}</span>
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#ff9062]" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-[#ebe8e2] border-t border-[#d1c4bd]/60 text-center">
              <span className="text-[11px] text-[#6b6059] flex items-center justify-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[15px] text-green-700">verified</span>
                <span>{language === 'hi' ? 'ONDC व GeM रीयलटाइम लिंक सक्रिय' : 'ONDC & GeM Realtime Link Active'}</span>
              </span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
