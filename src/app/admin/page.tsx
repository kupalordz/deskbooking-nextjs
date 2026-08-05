'use client';
import { useEffect, useState } from 'react';

type Booking = {
  id: number;
  bookingDate: string;
  status: string;
  userEmail: string;
  desk: { name: string; zone: string; floorId: string };
};

type StatCard = { label: string; value: number | string; sub: string; color: string; bg: string; icon: React.ReactNode };

function DesksIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function BookingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function ParkingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalDesks, setTotalDesks] = useState(0);
  const [parkingCount, setParkingCount] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/bookings').then((r) => r.json()).then((d) => setBookings(Array.isArray(d) ? d : []));
    fetch('/api/desks').then((r) => r.json()).then((d) => setTotalDesks(Array.isArray(d) ? d.length : 0));
    fetch('/api/parking-spots').then((r) => r.json()).then((d) => setParkingCount(Array.isArray(d) ? d.length : 0));
  }, []);

  const todayBookings = bookings.filter((b) => b.bookingDate === today);
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const latest = [...bookings].sort((a, b) => b.id - a.id).slice(0, 10);

  const stats: StatCard[] = [
    { label: 'Total Desks', value: totalDesks, sub: 'Registered desks', color: 'text-[#0e7490]', bg: 'bg-[#ecfeff]', icon: <DesksIcon /> },
    { label: "Today's Bookings", value: todayBookings.length, sub: 'Booked for today', color: 'text-[#15803d]', bg: 'bg-[#f0fdf4]', icon: <BookingIcon /> },
    { label: 'Confirmed', value: confirmedBookings.length, sub: 'All confirmed', color: 'text-[#b45309]', bg: 'bg-[#fffbeb]', icon: <CheckIcon /> },
    { label: 'Parking Spots', value: parkingCount, sub: 'Total spots', color: 'text-[#b91c1c]', bg: 'bg-[#fff1f2]', icon: <ParkingIcon /> },
  ];

  return (
    <div className="p-5 sm:p-7 md:p-8">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 flex flex-col gap-3`}>
            <div className={s.color}>{s.icon}</div>
            <div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { href: '/admin/floorplans', label: 'Floor Plan Builder' },
          { href: '/admin/users', label: 'User Profiles' },
          { href: '/admin/locations', label: 'Locations' },
          { href: '/admin/shifts', label: 'Shift Schedules' },
          { href: '/admin/parking', label: 'Parking Spots' },
          { href: '/admin/manage-lists', label: 'Manage Lists' },
        ].map((s) => (
          <a
            key={s.href}
            href={s.href}
            className="bg-white rounded-xl px-4 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100 hover:ring-[#3b82f6] hover:text-[#1e3a5f] transition-all"
          >
            {s.label} →
          </a>
        ))}
      </div>

      {/* Latest Bookings */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Latest Bookings</h3>
          <span className="text-xs text-gray-400">{bookings.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Code', 'Desk', 'Zone', 'Date', 'Email', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {latest.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No bookings yet.</td></tr>
              )}
              {latest.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">BK-{b.id.toString().padStart(6, '0')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.desk?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.desk?.zone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{b.userEmail}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      b.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' :
                      b.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
