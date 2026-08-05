'use client';
import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type Desk = {
  id: number;
  name: string;
  zone: string;
  floorId: string;
  xPosition: number;
  yPosition: number;
  active: boolean;
  restricted: boolean;
};

type Floor = { id: number; floorId: string; name: string; imageUrl: string; isParking: boolean };
type BookingSummary = { bookingDate: string; status: string; deskId: number };

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

export default function FloorMap() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [floor, setFloor] = useState('');
  const [allBookings, setAllBookings] = useState<BookingSummary[]>([]);
  const [selected, setSelected] = useState<Desk | null>(null);
  const [msg, setMsg] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [bookDate, setBookDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const crossDay = endTime <= startTime;
  const endDate = crossDay ? addOneDay(bookDate) : bookDate;

  function load() {
    fetch('/api/floors').then((r) => r.json()).then((d) => {
      const list = (Array.isArray(d) ? d : []).filter((f: Floor) => !f.isParking);
      setFloors(list);
      if (list.length > 0 && !floor) setFloor(list[0].floorId);
    });
    fetch('/api/desks').then((r) => r.json()).then((d) => setDesks(Array.isArray(d) ? d : []));
    fetch('/api/bookings').then((r) => r.json()).then((d: BookingSummary[]) => {
      setAllBookings(Array.isArray(d) ? d : []);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookedIds = allBookings
    .filter((b) => b.bookingDate === bookDate && b.status !== 'CANCELLED')
    .map((b) => b.deskId);

  const currentFloor = floors.find((f) => f.floorId === floor);
  const floorDesks = desks.filter((d) => d.floorId === floor && d.active);

  function pinColor(d: Desk) {
    if (d.restricted) return '#7c3aed';
    if (bookedIds.includes(d.id)) return '#dc2626';
    return '#16a34a';
  }

  function book() {
    if (!selected) return;
    const startISO = `${bookDate}T${startTime}`;
    const endISO = `${endDate}T${endTime}`;
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: selected.id, bookingDate: bookDate, startTime: startISO, endTime: endISO }),
    }).then((r) => {
      if (r.ok) {
        setMsg('Booked ' + selected.name + '!');
        setAllBookings((p) => [...p, { bookingDate: bookDate, status: 'CONFIRMED', deskId: selected.id }]);
        setSelected(null);
        setTimeout(() => setMsg(''), 3000);
      } else {
        r.json().then((d) => { setMsg(d.error ?? 'Booking failed'); setTimeout(() => setMsg(''), 3000); });
      }
    });
  }

  // h-[calc(100vh-8rem)] = 100vh - top nav (4rem/64px) - bottom nav (4rem/64px)
  // md:h-[calc(100vh-5rem)] = 100vh - desktop top nav (5rem/80px), no bottom nav
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">

      {/* Header: floor tabs + legend */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-xs font-semibold text-gray-400 flex-shrink-0 mr-1">Floor</span>
          {floors.map((f) => (
            <button
              key={f.floorId}
              onClick={() => { setFloor(f.floorId); setSelected(null); }}
              className={`px-3 py-1 rounded-full border text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                floor === f.floorId
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {f.name}
            </button>
          ))}
          {floors.length === 0 && (
            <span className="text-xs text-gray-400">No floors yet. Upload one in Admin.</span>
          )}
        </div>
        <div className="flex gap-4 px-3 pb-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />Available</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />Booked</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />Restricted</span>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        {!currentFloor && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            {floors.length === 0 ? 'No floor plans uploaded yet.' : 'Select a floor above.'}
          </div>
        )}

        {currentFloor && (
          <TransformWrapper
            initialScale={1}
            minScale={0.3}
            maxScale={6}
            centerOnInit
            doubleClick={{ mode: 'zoomIn', step: 0.7 }}
            pinch={{ step: 5 }}
            wheel={{ step: 0.2 }}
          >
            {({ zoomIn, zoomOut, resetTransform, state }) => (
              <div className="w-full h-full relative">
                <div className="absolute top-3 right-3 z-50 flex flex-col bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <button type="button" onClick={() => zoomIn()} className="w-9 h-9 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-50 border-b border-gray-100 active:bg-gray-100">+</button>
                  <button type="button" onClick={() => zoomOut()} className="w-9 h-9 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-50 border-b border-gray-100 active:bg-gray-100">−</button>
                  <button type="button" onClick={() => resetTransform()} className="w-9 h-8 flex items-center justify-center text-[9px] font-medium text-gray-400 hover:bg-gray-50 active:bg-gray-100 uppercase tracking-wide">Fit</button>
                </div>

                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentFloor.imageUrl}
                      alt={currentFloor.name}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                      draggable={false}
                    />
                    {floorDesks.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelected(d)}
                        style={{
                          position: 'absolute',
                          left: `${d.xPosition / 10}%`,
                          top: `${d.yPosition / 10}%`,
                          transform: `translate(-50%, -50%) scale(${1 / state.scale})`,
                          transformOrigin: 'center center',
                          cursor: 'pointer',
                          zIndex: 20,
                        }}
                        title={d.name}
                      >
                        <div
                          style={{
                            width: selected?.id === d.id ? 14 : 10,
                            height: selected?.id === d.id ? 14 : 10,
                            borderRadius: '50%',
                            background: pinColor(d),
                            boxShadow: selected?.id === d.id
                              ? '0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px ' + pinColor(d)
                              : '0 0 0 2px rgba(255,255,255,0.8)',
                            transition: 'width 0.15s, height 0.15s',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </TransformComponent>
              </div>
            )}
          </TransformWrapper>
        )}
      </div>

      {/* Toast */}
      {msg && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-green-50 border-t border-green-100 text-sm text-green-800 text-center">
          {msg}
        </div>
      )}

      {/* Desk booking bottom sheet */}
      {selected && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg px-4 pt-3 pb-4">
          {/* Desk info + close */}
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">{selected.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {selected.zone ? selected.zone + ' · ' : ''}{selected.floorId}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="ml-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Date + time pickers */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Date</p>
              <input
                type="date"
                value={bookDate}
                min={today}
                onChange={(e) => setBookDate(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
            <div className="w-24">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Start</p>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
            <div className="w-24">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                End {crossDay && <span className="text-orange-500 normal-case font-normal">+1d ({fmtDate(endDate)})</span>}
              </p>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>
          </div>

          {/* Book button */}
          <div className="flex items-center gap-2">
            {bookedIds.includes(selected.id) ? (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                Already booked on {fmtDate(bookDate)}
              </span>
            ) : (
              <button
                onClick={book}
                className="px-5 py-2 bg-[#1e3a5f] text-white rounded-full text-sm font-semibold hover:bg-[#16304d] active:scale-95 transition-transform"
              >
                Book
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
