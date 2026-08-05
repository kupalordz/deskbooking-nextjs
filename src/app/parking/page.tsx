'use client';
import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type ParkingSpot = {
  id: number;
  name: string;
  type: string;
  zone: string;
  active: boolean;
  floorId: string;
  xPosition: number;
  yPosition: number;
};

type Floor = { id: number; floorId: string; name: string; imageUrl: string; isParking: boolean };

type ParkingBooking = {
  id: number;
  spotId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  spot: { name: string; type: string; zone: string };
};

function addOneDay(d: string) {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + 1);
  return dt.toISOString().split('T')[0];
}

function fmtDate(d: string) {
  const [, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}`;
}

export default function ParkingPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [bookings, setBookings] = useState<ParkingBooking[]>([]);
  const [tab, setTab] = useState<'CAR' | 'MOTORCYCLE'>('CAR');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [mapFloor, setMapFloor] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [booking, setBooking] = useState(false);

  const crossDay = endTime <= startTime;
  const endDate = crossDay ? addOneDay(date) : date;

  function load() {
    Promise.all([
      fetch('/api/parking-spots').then((r) => r.json()),
      fetch('/api/parking-bookings').then((r) => r.json()),
      fetch('/api/floors').then((r) => r.json()),
    ]).then(([s, b, f]) => {
      setSpots(Array.isArray(s) ? s.filter((x: ParkingSpot) => x.active) : []);
      setBookings(Array.isArray(b) ? b : []);
      const parkingFloors = (Array.isArray(f) ? f : []).filter((x: Floor) => x.isParking);
      setFloors(parkingFloors);
      if (parkingFloors.length > 0) setMapFloor(parkingFloors[0].floorId);
    });
  }

  useEffect(() => { load(); }, []);

  const bookedSpotIds = new Set(
    bookings.filter((b) => b.bookingDate === date && b.status !== 'CANCELLED').map((b) => b.spotId)
  );

  async function book(spotId: number) {
    setBooking(true);
    const startISO = `${date}T${startTime}`;
    const endISO = `${endDate}T${endTime}`;
    const r = await fetch('/api/parking-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotId, bookingDate: date, startTime: startISO, endTime: endISO }),
    });
    setBooking(false);
    if (r.ok) {
      setMsg('Parking spot booked!');
      setMsgType('ok');
      setSelectedSpot(null);
      load();
    } else {
      const d = await r.json();
      setMsg(d.error ?? 'Booking failed');
      setMsgType('err');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  const currentFloor = floors.find((f) => f.floorId === mapFloor);
  const mapSpots = spots.filter((s) => s.floorId === mapFloor && (s.xPosition !== 0 || s.yPosition !== 0));
  const filtered = spots.filter((s) => s.type === tab);
  const zones = filtered.map((s) => s.zone).filter((v, i, a) => v && a.indexOf(v) === i).sort();

  function spotPinColor(s: ParkingSpot) {
    if (bookedSpotIds.has(s.id)) return '#dc2626';
    return s.type === 'CAR' ? '#2563eb' : '#ea580c';
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Parking Reservation</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Date</p>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Start</p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              End {crossDay && <span className="text-orange-500 normal-case font-normal">· ends {fmtDate(endDate)}</span>}
            </p>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${msgType === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{msg}</div>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {(['CAR', 'MOTORCYCLE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-[#1e3a5f]'}`}
            >
              {t === 'CAR' ? 'Car' : 'Motorcycle'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && (
        <div className="mb-6">
          {floors.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400 text-sm">
              No parking floor maps available. Ask admin to upload one in Floor Plans.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
              {/* Floor tabs */}
              {floors.length > 1 && (
                <div className="flex gap-1.5 px-4 pt-3 pb-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {floors.map((f) => (
                    <button
                      key={f.floorId}
                      onClick={() => { setMapFloor(f.floorId); setSelectedSpot(null); }}
                      className={`px-3 py-1 rounded-full border text-xs font-medium whitespace-nowrap flex-shrink-0 mb-2 ${
                        mapFloor === f.floorId ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Map */}
              {currentFloor && (
                <div className="relative" style={{ height: 320 }}>
                  <TransformWrapper
                    initialScale={1} minScale={0.3} maxScale={6} centerOnInit
                    doubleClick={{ mode: 'zoomIn', step: 0.7 }}
                    pinch={{ step: 5 }} wheel={{ step: 0.2 }}
                  >
                    {({ zoomIn, zoomOut, resetTransform, state }) => (
                      <div className="relative w-full h-full">
                        <div className="absolute top-2 right-2 z-50 flex flex-col bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                          <button type="button" onClick={() => zoomIn()} className="w-8 h-8 flex items-center justify-center text-base text-gray-600 hover:bg-gray-50 border-b border-gray-100">+</button>
                          <button type="button" onClick={() => zoomOut()} className="w-8 h-8 flex items-center justify-center text-base text-gray-600 hover:bg-gray-50 border-b border-gray-100">−</button>
                          <button type="button" onClick={() => resetTransform()} className="w-8 h-7 flex items-center justify-center text-[9px] font-medium text-gray-400 hover:bg-gray-50 uppercase tracking-wide">Fit</button>
                        </div>

                        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%' }}>
                          <div style={{ position: 'relative', width: '100%' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={currentFloor.imageUrl} alt={currentFloor.name} style={{ width: '100%', height: 'auto', display: 'block' }} draggable={false} />
                            {mapSpots.map((s) => (
                              <div
                                key={s.id}
                                onClick={() => setSelectedSpot(selectedSpot?.id === s.id ? null : s)}
                                style={{
                                  position: 'absolute',
                                  left: `${s.xPosition / 10}%`,
                                  top: `${s.yPosition / 10}%`,
                                  transform: `translate(-50%, -50%) scale(${1 / state.scale})`,
                                  transformOrigin: 'center center',
                                  cursor: 'pointer',
                                  zIndex: 20,
                                }}
                                title={s.name}
                              >
                                <div style={{
                                  width: selectedSpot?.id === s.id ? 16 : 12,
                                  height: selectedSpot?.id === s.id ? 16 : 12,
                                  borderRadius: '50%',
                                  background: spotPinColor(s),
                                  boxShadow: selectedSpot?.id === s.id
                                    ? '0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px ' + spotPinColor(s)
                                    : '0 0 0 2px rgba(255,255,255,0.8)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'width 0.15s, height 0.15s',
                                }}>
                                  <span style={{ fontSize: 6, color: 'white', fontWeight: 700, lineHeight: 1 }}>P</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TransformComponent>
                      </div>
                    )}
                  </TransformWrapper>
                </div>
              )}

              {/* Legend */}
              <div className="flex gap-4 px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />Car</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />Moto</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />Booked</span>
              </div>

              {/* Selected spot panel */}
              {selectedSpot && (
                <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{selectedSpot.name}</p>
                    <p className="text-xs text-gray-400">{selectedSpot.type === 'CAR' ? 'Car' : 'Motorcycle'}{selectedSpot.zone ? ' · ' + selectedSpot.zone : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {bookedSpotIds.has(selectedSpot.id) ? (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full">Already booked</span>
                    ) : (
                      <button
                        onClick={() => book(selectedSpot.id)}
                        disabled={booking}
                        className="px-4 py-2 bg-[#1e3a5f] text-white rounded-full text-sm font-semibold hover:bg-[#16304d] disabled:opacity-50 active:scale-95 transition-transform"
                      >
                        Book
                      </button>
                    )}
                    <button onClick={() => setSelectedSpot(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg leading-none">×</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <>
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
                  const isMine = bookedSpotIds.has(spot.id);
                  const isTaken = false;
                  return (
                    <div
                      key={spot.id}
                      className={`bg-white rounded-xl p-4 shadow-sm ring-1 flex flex-col gap-2 ${
                        isMine ? 'ring-blue-400' : 'ring-gray-200'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{spot.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                        isMine ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'
                        : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200'
                      }`}>
                        {isMine ? 'Mine' : 'Available'}
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
        </>
      )}
    </div>
  );
}
