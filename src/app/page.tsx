'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Booking = {
  id: number;
  bookingDate: string;
  status: string;
  desk: { name: string; floorId: string; zone: string };
};
type Desk = { id: number; name: string; zone: string; floorId: string; active: boolean };

export default function Dashboard() {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/desks').then((r) => r.json()).then((d) => setDesks(Array.isArray(d) ? d : []));
    fetch('/api/bookings').then((r) => r.json()).then((d) => setBookings(Array.isArray(d) ? d : []));
  }, []);

  const todayBookings = bookings.filter((b) => b.bookingDate === today && b.status !== 'CANCELLED');
  const recent = bookings.slice(0, 5);

  const statusStyle = (s: string) => {
    if (s === 'CONFIRMED') return 'text-blue-600 bg-blue-50';
    if (s === 'CHECKED_IN') return 'text-emerald-600 bg-emerald-50';
    if (s === 'CANCELLED') return 'text-gray-400 bg-gray-100';
    return 'text-amber-600 bg-amber-50';
  };

  const stats = [
    { label: 'Total desks', value: desks.length, accent: 'border-l-sky-400' },
    { label: 'Today booked', value: todayBookings.length, accent: 'border-l-violet-400' },
    { label: 'Available now', value: Math.max(desks.length - todayBookings.length, 0), accent: 'border-l-emerald-400' },
  ];

  return (
    <div className="bg-[#f5f6f8] min-h-screen">
      {/* Header band */}
      <div className="bg-gradient-to-br from-[#0f1e35] via-[#1a3254] to-[#1e3a5f] text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-7 md:py-10">
          <p className="text-[10px] uppercase tracking-[0.18em] text-blue-300/80 mb-1 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight mb-5 md:mb-6 text-white/95">
            Good day, Jordan
          </h1>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/7 border border-white/10 rounded-xl px-4 py-3.5 md:px-5 md:py-4">
                <p className="text-[10px] md:text-xs text-blue-200/70 mb-1.5 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-5 md:mb-6">
          {/* Book a Desk CTA */}
          <Link
            href="/floormap"
            className="md:col-span-2 group flex items-center justify-between bg-white rounded-2xl px-6 py-6 md:px-8 md:py-8 shadow-sm ring-1 ring-gray-200/60 hover:shadow-md hover:ring-[#1e3a5f]/20 transition-all"
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#1e3a5f]/60 font-semibold mb-2">Quick action</p>
              <p className="font-bold text-base md:text-xl text-gray-900 mb-1">Book a Desk</p>
              <p className="text-xs md:text-sm text-gray-400">Browse the floor map and reserve your spot for today</p>
            </div>
            <span className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center transition-transform group-hover:translate-x-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* Quick links */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/60 divide-y divide-gray-100">
            {[
              { href: '/qr', label: 'QR Check-in' },
              { href: '/bookings', label: 'My Bookings' },
              { href: '/admin', label: 'Admin Panel' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/70 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                <span className="text-sm font-medium text-gray-700">{l.label}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-300">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent bookings</h3>
            <Link href="/bookings" className="text-xs text-[#1e3a5f] font-medium hover:underline">View all</Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400 mb-2">No bookings yet.</p>
              <Link href="/floormap" className="text-sm text-[#1e3a5f] font-medium hover:underline">Browse desks →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/8 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth={1.8} className="w-4 h-4 opacity-60">
                        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.desk?.name ?? 'Desk'}</p>
                      <p className="text-xs text-gray-400">{b.bookingDate} · Floor {b.desk?.floorId}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${statusStyle(b.status)}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
