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

type ParkingBooking = {
  id: number;
  bookingDate: string;
  status: string;
  qrToken: string;
  spot: { name: string; type: string; zone: string };
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function formatQrDisplay(label: string, dateStr: string, token: string) {
  return label.replace(/\s/g, '') + '|' + dateStr.replace(/-/g, '') + '|' + token.slice(0, 8);
}

function QrCard({
  title, label, sublabel, date, token, bookingCode, onCancel,
}: {
  title: string; label: string; sublabel: string; date: string; token: string; bookingCode: string; onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden mb-5">
      <div className="px-6 pt-6 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{title}</p>

        <div className="bg-blue-50 rounded-xl px-5 py-4 text-sm text-left mb-5">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          <p className="text-gray-500 text-xs">{sublabel}</p>
          <p className="text-gray-600 text-xs mt-1">Date: {formatDate(date)}</p>
          <p className="text-gray-600 text-xs">Booking ID: {bookingCode}</p>
          <p className="mt-2 text-green-600 font-semibold text-xs uppercase tracking-wide">Confirmed</p>
        </div>

        <div className="flex flex-col items-center mb-4">
          <div className="p-3 bg-white rounded-xl ring-1 ring-gray-100 shadow-sm">
            <QRCodeSVG value={token} size={180} />
          </div>
          <p className="mt-3 text-xs font-mono text-[#1e7a8f] break-all text-center">
            {formatQrDisplay(label, date, token)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Scan at the floor kiosk when you arrive</p>
        </div>

        <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-800 text-left mb-3">
          Hold your phone up to the kiosk camera at the entrance. The kiosk will check you in automatically.
        </div>
        <div className="bg-red-50 rounded-xl px-4 py-3 text-xs text-red-700 text-left mb-5">
          Check in within 1 hour of your start time or your reservation will be automatically released.
        </div>
      </div>
      <div className="px-6 pb-6">
        <button onClick={onCancel} className="w-full py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 text-sm">
          Cancel Booking
        </button>
      </div>
    </div>
  );
}

export default function QRPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [parkingBookings, setParkingBookings] = useState<ParkingBooking[]>([]);
  const [msg, setMsg] = useState('');
  const today = new Date().toISOString().split('T')[0];

  function load() {
    fetch('/api/bookings').then((r) => r.json()).then((d) => {
      const arr: Booking[] = Array.isArray(d) ? d : [];
      setBookings(arr.filter((b) => b.bookingDate === today && b.status === 'CONFIRMED'));
    });
    fetch('/api/parking-bookings').then((r) => r.json()).then((d) => {
      const arr: ParkingBooking[] = Array.isArray(d) ? d : [];
      setParkingBookings(arr.filter((b) => b.bookingDate === today && b.status === 'CONFIRMED'));
    });
  }

  useEffect(() => { load(); }, []);

  function cancelDesk(id: number) {
    fetch('/api/bookings/' + id, { method: 'DELETE' }).then(() => { setMsg('Booking cancelled'); load(); });
  }

  function cancelParking(id: number) {
    fetch('/api/parking-bookings/' + id, { method: 'DELETE' }).then(() => { setMsg('Booking cancelled'); load(); });
  }

  const total = bookings.length + parkingBookings.length;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1 text-center tracking-tight">Check-In QR Code</h2>
      <p className="text-xs text-gray-400 text-center mb-6">Scan at the kiosk when you arrive</p>

      {msg && (
        <div className="p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm text-center">{msg}</div>
      )}

      {total === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">
          <p className="font-medium text-sm">No confirmed bookings for today</p>
          <p className="text-xs mt-1 mb-4">Book a desk or parking spot first</p>
          <div className="flex gap-3 justify-center">
            <a href="/floormap" className="px-4 py-2 bg-[#1e3a5f] text-white rounded-full text-xs font-medium hover:bg-[#16304d]">Floor Map</a>
            <a href="/parking" className="px-4 py-2 bg-[#1e3a5f] text-white rounded-full text-xs font-medium hover:bg-[#16304d]">Parking</a>
          </div>
        </div>
      )}

      {bookings.map((b) => (
        <QrCard
          key={'desk-' + b.id}
          title="Desk Booking"
          label={b.desk?.name ?? 'Desk'}
          sublabel={'Floor ' + (b.desk?.floorId ?? '') + (b.desk?.zone ? ' · ' + b.desk.zone : '')}
          date={b.bookingDate}
          token={b.qrToken}
          bookingCode={'BK-' + b.bookingDate.replace(/-/g, '') + '-' + b.id.toString().padStart(7, '0')}
          onCancel={() => cancelDesk(b.id)}
        />
      ))}

      {parkingBookings.map((b) => (
        <QrCard
          key={'parking-' + b.id}
          title="Parking Booking"
          label={b.spot?.name ?? 'Parking Spot'}
          sublabel={(b.spot?.type === 'CAR' ? 'Car' : 'Motorcycle') + ' · ' + (b.spot?.zone ?? '')}
          date={b.bookingDate}
          token={b.qrToken}
          bookingCode={'PK-' + b.bookingDate.replace(/-/g, '') + '-' + b.id.toString().padStart(7, '0')}
          onCancel={() => cancelParking(b.id)}
        />
      ))}
    </div>
  );
}
