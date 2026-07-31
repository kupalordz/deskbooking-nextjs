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
    if (s === 'CONFIRMED') return 'text-blue-700 bg-blue-50 ring-1 ring-inset ring-blue-200';
    if (s === 'CHECKED_IN') return 'text-green-700 bg-green-50 ring-1 ring-inset ring-green-200';
    if (s === 'CANCELLED') return 'text-gray-500 bg-gray-100 ring-1 ring-inset ring-gray-200';
    return 'text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-200';
  };

  const stats = [
    { label: 'Total desks', value: desks.length },
    { label: 'Today booked', value: todayBookings.length },
    { label: 'Available now', value: Math.max(desks.length - todayBookings.length, 0) },
  ];

  return (
    <div>
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#274b7a] to-[#2f5a94] text-white">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-8 sm:py-6 md:px-12 md:py-8">
          <p className="text-xs sm:text-sm md:text-base uppercase tracking-widest text-blue-200 mb-1 md:mb-2 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 md:mb-6">Good day, Jordan</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-5 md:p-5">
                <p className="text-xs sm:text-sm text-blue-100 mb-1">{s.label}</p>
                <p className="text-3xl sm:text-4xl md:text-4xl xl:text-5xl font-bold tracking-tight text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          <Link
            href="/floormap"
            className="md:col-span-2 group flex items-center justify-between bg-white rounded-2xl px-6 py-6 md:px-10 md:py-12 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:ring-[#1e3a5f]/20 transition-all"
          >
            <div>
              <p className="text-[11px] md:text-sm uppercase tracking-widest text-[#1e3a5f] font-semibold mb-2 md:mb-3">Quick action</p>
              <p className="font-bold text-lg md:text-3xl text-gray-900 mb-1 md:mb-2">Book a Desk</p>
              <p className="text-sm md:text-lg text-gray-500">Browse the floor map and reserve your spot for today</p>
            </div>
            <span className="flex-shrink-0 w-12 h-12 md:w-20 md:h-20 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xl md:text-3xl transition-transform group-hover:translate-x-1">
              {'\u2192'}
            </span>
          </Link>

          <div className="bg-white rounded-2xl p-5 md:p-7 shadow-sm ring-1 ring-gray-100 flex flex-col gap-2 md:gap-3 justify-center">
            <Link href="/qr" className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-sm md:text-lg font-medium text-gray-700">QR Check-in</span>
              <span className="text-gray-400 md:text-xl">{'\u2192'}</span>
            </Link>
            <Link href="/bookings" className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-sm md:text-lg font-medium text-gray-700">My Bookings</span>
              <span className="text-gray-400 md:text-xl">{'\u2192'}</span>
            </Link>
            <Link href="/admin" className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-sm md:text-lg font-medium text-gray-700">Admin Panel</span>
              <span className="text-gray-400 md:text-xl">{'\u2192'}</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-10 shadow-sm ring-1 ring-gray-100 mt-5 md:mt-8">
          <div className="flex items-center justify-between mb-5 md:mb-8">
            <h3 className="text-base md:text-2xl font-semibold text-gray-900">Recent bookings</h3>
            <Link href="/bookings" className="text-xs md:text-base text-[#1e3a5f] font-medium hover:underline">View all</Link>
          </div>

          {recent.length === 0 && (
            <div className="text-center py-10 md:py-16">
              <p className="text-sm md:text-lg text-gray-400 mb-1 md:mb-2">No bookings yet.</p>
              <Link href="/floormap" className="text-sm md:text-lg text-[#1e3a5f] font-medium hover:underline">Browse desks</Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {recent.map((b) => (
              <div key={b.id} className="border border-gray-100 rounded-xl p-4 md:p-6 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <p className="font-semibold text-sm md:text-lg text-gray-900 truncate">{b.desk?.name ?? 'Desk'}</p>
                  <span className={`text-[10px] md:text-xs font-medium px-2 py-0.5 md:px-3 md:py-1 rounded-full whitespace-nowrap ${statusStyle(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-xs md:text-base text-gray-500">{b.bookingDate}</p>
                <p className="text-xs md:text-base text-gray-400">Floor: {b.desk?.floorId}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}