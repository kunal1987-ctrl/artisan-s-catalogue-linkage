import React from 'react';
import type { Inquiry } from '../types/database';
import { MessageSquare, Mail, User, Calendar, Database } from 'lucide-react';

interface InquiriesListProps {
  inquiries: Inquiry[];
  onRefresh: () => void;
}

export const InquiriesList: React.FC<InquiriesListProps> = ({ inquiries, onRefresh }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Real-time Supabase Inquiries Table</span>
          </div>
          <h2 className="text-3xl font-bold text-white serif-font">Customer Inquiries Inbox</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Custom order requests sent by buyers directly stored in your database.
          </p>
        </div>

        <button onClick={onRefresh} className="btn-secondary text-xs">
          Refresh Database
        </button>
      </div>

      {inquiries.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white serif-font">No Inquiries Yet</h3>
          <p className="text-xs text-neutral-400">
            Click on any product in the catalogue, submit an inquiry form, and it will appear here in real-time from Supabase!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="glass-panel p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row items-start justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" /> {inquiry.customer_name}
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" /> {inquiry.customer_email}
                  </span>
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 ml-auto">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    {new Date(inquiry.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 text-sm text-neutral-200 leading-relaxed">
                  "{inquiry.message}"
                </div>
              </div>

              {inquiry.products && (
                <div className="w-full md:w-64 bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 flex items-center gap-3 shrink-0">
                  <img
                    src={inquiry.products.image_url || 'https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7'}
                    alt={inquiry.products.title}
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-700"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Inquired Item</p>
                    <p className="text-xs font-bold text-white truncate">{inquiry.products.title}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
