'use client';
import { useEffect, useState } from 'react';

type ParkingSpot = {
  id: number;
  name: string;
  type: string;
  zone: string;
};

type ParkingBooking = {
  id: number;
  spotId: number;
  bookingDate: string;
  status: string;
};

export default function ParkingPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [bookings, setBookings] = useState<ParkingBooking[]>([]);
  const [tab, setTab] = useState<'CAR' | 'MOTORCYCLE'>('CAR');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [booking, setBooking] = useState(false);

  function load() {
    Promise.all([
      fetch('/api/parking-spots').then((r) => r.json()),
      fetch('/api/parking-bookings').then((r) => r.json()),
    ]).then(([s, b]) => {
      setSpots(Array.isArray(s) ? s : []);
      setBookings(Array.isArray(b) ? b : []);
    });
  }

  useEffect(() => { load(); }, []);

  const bookedSpotIds = new Set(
    bookings.filter((b) => b.bookingDate === date && b.status !== 'CANCELLED').map((b) => b.spotId)
  );
  const mySpotIds = new Set(
    bookings.filter((b) => b.bookingDate === date && b.status !== 'CANCELLED').map((b) => b.spotId)
  );

  async function book(spotId: number) {
    setBooking(true);
    const r = await fetch('/api/parking-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotId, bookingDate: date }),
    });
    setBooking(false);
    if (r.ok) {
      setMsg('Parking spot booked!');
      setMsgType('ok');
      load();
    } else {
      const d = await r.json();
      setMsg(d.error ?? 'Booking failed');
      setMsgType('err');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  const filtered = spots.filter((s) => s.type === tab);
  const zones = Array.from(new Set(filtered.map((s) => s.zone))).sort();

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Parking Reservation</h2>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
        />
      </div>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${msgType === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['CAR', 'MOTORCYCLE'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-[#1e3a5f]'}`}
          >
            {t === 'CAR' ? '🚗 Car' : '🏍️ Motorcycle'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">
          <p>No {tab.toLowerCase()} spots configured yet.</p>
          <a href="/admin/parking" className="text-[#1e3a5f] font-medium hover:underline mt-1 inline-block text-sm">Add spots in Admin</a>
        </div>
      )}

      {zones.map((zone) => (
        <div key={zone} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{zone}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.filter((s) => s.zone === zone).map((spot) => {
              const isMine = mySpotIds.has(spot.id);
              const isTaken = bookedSpotIds.has(spot.id) && !isMine;
              return (
                <div
                  key={spot.id}
                  className={`bg-white rounded-xl p-4 shadow-sm ring-1 flex flex-col gap-2 ${
                    isMine ? 'ring-blue-400' : isTaken ? 'ring-gray-200 opacity-60' : 'ring-gray-200'
                  }`}
                >
                  <p className="font-semibold text-gray-900 text-sm">{spot.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                    isMine ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
                    : isTaken ? 'bg-gray-100 text-gray-500'
                    : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200'
                  }`}>
                    {isMine ? 'Mine' : isTaken ? 'Taken' : 'Available'}
                  </span>
                  {!isMine && !isTaken && (
                    <button
                      onClick={() => book(spot.id)}
                      disabled={booking}
                      className="mt-1 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-medium hover:bg-[#16304d] disabled:opacity-50"
                    >
                      Book
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
