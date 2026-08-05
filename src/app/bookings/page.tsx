'use client';
import { useEffect, useState } from 'react';

type Booking = {
  id: number;
  bookingDate: string;
  status: string;
  qrToken: string;
  desk: { name: string; floorId: string };
};

type ParkingBooking = {
  id: number;
  bookingDate: string;
  status: string;
  spot: { name: string; type: string; zone: string };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [parkingBookings, setParkingBookings] = useState<ParkingBooking[]>([]);
  const [tab, setTab] = useState<'desk' | 'parking'>('desk');
  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/bookings').then((r) => r.json()).then((d) => setBookings(Array.isArray(d) ? d : [])).catch(() => setBookings([]));
    fetch('/api/parking-bookings').then((r) => r.json()).then((d) => setParkingBookings(Array.isArray(d) ? d : [])).catch(() => setParkingBookings([]));
  }

  useEffect(() => { load(); }, []);

  function cancel(id: number) {
    fetch('/api/bookings/' + id, { method: 'DELETE' }).then(() => { setMsg('Cancelled'); load(); });
  }

  function checkin(id: number) {
    fetch('/api/bookings/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin' }),
    }).then((r) => { if (r.ok) { setMsg('Checked in!'); load(); } else { setMsg('Check-in failed'); } });
  }

  function cancelParking(id: number) {
    fetch('/api/parking-bookings/' + id, { method: 'DELETE' }).then(() => { setMsg('Cancelled'); load(); });
  }

  function checkinParking(id: number) {
    fetch('/api/parking-bookings/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin' }),
    }).then((r) => { if (r.ok) { setMsg('Checked in!'); load(); } else { setMsg('Check-in failed'); } });
  }

  const statusStyle = (s: string) => {
    if (s === 'CONFIRMED') return 'text-blue-700 bg-blue-50 ring-1 ring-inset ring-blue-200';
    if (s === 'CHECKED_IN') return 'text-green-700 bg-green-50 ring-1 ring-inset ring-green-200';
    if (s === 'CANCELLED') return 'text-gray-500 bg-gray-100 ring-1 ring-inset ring-gray-200';
    return 'text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-200';
  };

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 tracking-tight">My Bookings</h2>

      {msg && <div className="p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('desk')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'desk' ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-[#1e3a5f]'}`}
        >
          Desk Bookings {bookings.length > 0 && <span className="ml-1 opacity-70">({bookings.length})</span>}
        </button>
        <button
          onClick={() => setTab('parking')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'parking' ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-[#1e3a5f]'}`}
        >
          Parking {parkingBookings.length > 0 && <span className="ml-1 opacity-70">({parkingBookings.length})</span>}
        </button>
      </div>

      {/* Desk bookings */}
      {tab === 'desk' && (
        <>
          {bookings.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-gray-400">No desk bookings yet.</p>
              <a href="/floormap" className="text-[#1e3a5f] font-medium hover:underline mt-1 inline-block">Browse desks</a>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{b.desk?.name ?? 'Desk'}</p>
                  <p className="text-sm text-gray-500">Date: {b.bookingDate}</p>
                  <p className="text-sm text-gray-500">Floor: {b.desk?.floorId}</p>
                  <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle(b.status)}`}>{b.status}</span>
                </div>
                <div className="flex gap-2">
                  {b.status === 'CONFIRMED' && (
                    <button onClick={() => checkin(b.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Check In</button>
                  )}
                  {b.status !== 'CANCELLED' && b.status !== 'CHECKED_IN' && (
                    <button onClick={() => cancel(b.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Parking bookings */}
      {tab === 'parking' && (
        <>
          {parkingBookings.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-gray-400">No parking bookings yet.</p>
              <a href="/parking" className="text-[#1e3a5f] font-medium hover:underline mt-1 inline-block">Reserve a spot</a>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {parkingBookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{b.spot?.name}</p>
                  <p className="text-sm text-gray-500">{b.spot?.type === 'CAR' ? '🚗 Car' : '🏍️ Motorcycle'} · {b.spot?.zone}</p>
                  <p className="text-sm text-gray-500">Date: {b.bookingDate}</p>
                  <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle(b.status)}`}>{b.status}</span>
                </div>
                <div className="flex gap-2">
                  {b.status === 'CONFIRMED' && (
                    <button onClick={() => checkinParking(b.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Check In</button>
                  )}
                  {b.status !== 'CANCELLED' && b.status !== 'CHECKED_IN' && (
                    <button onClick={() => cancelParking(b.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
