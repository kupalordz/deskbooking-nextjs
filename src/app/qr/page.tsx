'use client';
import { useEffect, useState } from 'react';

type Booking = {
  id: number;
  bookingDate: string;
  status: string;
  qrToken: string;
  desk: { name: string; floorId: string; zone: string };
};

export default function QRPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const today = new Date().toISOString().split('T')[0];

  function load() {
    fetch('/api/bookings').then((r) => r.json()).then((d) => {
      const arr = Array.isArray(d) ? d : [];
      setBookings(arr.filter((b: Booking) => b.bookingDate === today && b.status === 'CONFIRMED'));
    });
  }

  useEffect(() => { load(); }, []);

  function checkin(id: number) {
    fetch('/api/bookings/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin' }),
    }).then((r) => {
      if (r.ok) { setMsg('Checked in successfully!'); setMsgType('ok'); load(); } else { setMsg('Check-in failed'); setMsgType('err'); }
    });
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 tracking-tight">QR Check-in</h2>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${msgType === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{msg}</div>
      )}

      {bookings.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">
          <p>No confirmed bookings for today</p>
          <p className="text-sm mt-2">Book a desk from the Floor Map screen</p>
        </div>
      )}

      {bookings.map((b) => (
        <div key={b.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-semibold text-gray-900">{b.desk?.name}</p>
              <p className="text-sm text-gray-500">Zone: {b.desk?.zone}</p>
              <p className="text-sm text-gray-500">Floor: {b.desk?.floorId}</p>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ring-blue-200">CONFIRMED</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
            <p className="text-xs text-gray-400 mb-2">QR Token</p>
            <code className="text-xs text-gray-700 break-all">{b.qrToken}</code>
          </div>
          <button onClick={() => checkin(b.id)} className="w-full py-3 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#16304d]">Check In Now</button>
        </div>
      ))}
    </div>
  );
}