'use client';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type Booking = {
  id: number;
  bookingDate: string;
  status: string;
  qrToken: string;
  desk: { name: string; floorId: string; zone: string };
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatBookingId(id: number, dateStr: string) {
  return 'BK-' + dateStr.replace(/-/g, '') + '-' + id.toString().padStart(7, '0');
}

function formatQrDisplay(deskName: string, dateStr: string, token: string) {
  return deskName.replace(/\s/g, '') + '|' + dateStr.replace(/-/g, '') + '|' + token.slice(0, 8);
}

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
      if (r.ok) { setMsg('Checked in successfully!'); setMsgType('ok'); load(); }
      else { setMsg('Check-in failed'); setMsgType('err'); }
    });
  }

  function cancel(id: number) {
    fetch('/api/bookings/' + id, { method: 'DELETE' }).then(() => { setMsg('Booking cancelled'); setMsgType('ok'); load(); });
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center tracking-tight">Check-In QR Code</h2>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm text-center ${msgType === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{msg}</div>
      )}

      {bookings.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">
          <p className="font-medium">No confirmed bookings for today</p>
          <p className="text-sm mt-2">Book a desk from the Floor Map screen</p>
          <a href="/floormap" className="mt-4 inline-block px-5 py-2 bg-[#1e3a5f] text-white rounded-full text-sm font-medium hover:bg-[#16304d]">Go to Floor Map</a>
        </div>
      )}

      {bookings.map((b) => (
        <div key={b.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden mb-6">
          <div className="px-6 pt-6 pb-4 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Booking</h3>

            {/* Booking info card */}
            <div className="bg-blue-50 rounded-xl px-5 py-4 text-sm text-left mb-5">
              <p className="font-semibold text-gray-900 mb-1">{b.desk?.name}</p>
              <p className="text-gray-600">Date: {formatDate(b.bookingDate)}</p>
              <p className="text-gray-600">Booking ID: {formatBookingId(b.id, b.bookingDate)}</p>
              <p className="mt-2 text-green-600 font-semibold text-xs uppercase tracking-wide">Confirmed</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-4">
              <div className="p-3 bg-white rounded-xl ring-1 ring-gray-100 shadow-sm">
                <QRCodeSVG value={b.qrToken} size={200} />
              </div>
              <p className="mt-3 text-xs font-mono text-[#1e7a8f] break-all text-center">
                {formatQrDisplay(b.desk?.name ?? '', b.bookingDate, b.qrToken)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Scan at the floor kiosk when you arrive</p>
            </div>

            {/* Info boxes */}
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-800 text-left mb-3">
              Hold your phone up to the kiosk camera at the floor entrance. The kiosk will check you in automatically.
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-3 text-xs text-red-700 text-left mb-5">
              Check in within 1 hour of your start time or your desk will be automatically released.
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 flex flex-col gap-3">
            <button
              onClick={() => checkin(b.id)}
              className="w-full py-3 bg-[#1e3a5f] text-white rounded-full font-semibold hover:bg-[#16304d] text-sm"
            >
              Check In Now
            </button>
            <button
              onClick={() => cancel(b.id)}
              className="w-full py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 text-sm"
            >
              Cancel Booking
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
