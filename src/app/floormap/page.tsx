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

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white';
const labelCls = 'block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5';

export default function FloorMap() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [floor, setFloor] = useState('');
  const [allBookings, setAllBookings] = useState<BookingSummary[]>([]);
  const [selected, setSelected] = useState<Desk | null>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const [showPanel, setShowPanel] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [bookDate, setBookDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  function handleDeskClick(d: Desk) {
    setSelected((prev) => (prev?.id === d.id ? null : d));
    if (isDesktop) setShowPanel(true);
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
        setMsgType('ok');
        setAllBookings((p) => [...p, { bookingDate: bookDate, status: 'CONFIRMED', deskId: selected.id }]);
        setSelected(null);
        setTimeout(() => setMsg(''), 3000);
      } else {
        r.json().then((d) => {
          setMsg(d.error ?? 'Booking failed');
          setMsgType('err');
          setTimeout(() => setMsg(''), 3000);
        });
      }
    });
  }

  const isBooked = selected ? bookedIds.includes(selected.id) : false;

  return (
    // h-[calc(100vh-8rem)] = top nav 4rem + bottom nav 4rem (mobile)
    // md:h-[calc(100vh-5rem)] = desktop top nav 5rem, no bottom nav
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] overflow-hidden bg-gray-50">

      {/* ── LEFT: toolbar + map + mobile sheet ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Toolbar */}
        <div
          className="bg-white border-b border-gray-100 flex-shrink-0 flex items-center gap-1.5 px-3 py-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Floor tabs */}
          {floors.map((f) => (
            <button
              key={f.floorId}
              onClick={() => { setFloor(f.floorId); setSelected(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                floor === f.floorId
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.name}
            </button>
          ))}
          {floors.length === 0 && (
            <span className="text-xs text-gray-400 flex-shrink-0">No floors yet.</span>
          )}

          <div className="flex-1" />

          {/* Legend — desktop only */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-gray-400 flex-shrink-0 pr-3 border-r border-gray-100">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />Booked</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />Restricted</span>
          </div>

          {/* Panel toggle — desktop only */}
          <button
            onClick={() => setShowPanel((p) => !p)}
            className="hidden md:flex items-center gap-1 flex-shrink-0 ml-1 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            {showPanel ? 'Hide ›' : '‹ Panel'}
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden">
          {!currentFloor ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              {floors.length === 0 ? 'No floor plans uploaded yet.' : 'Select a floor above.'}
            </div>
          ) : (
            <TransformWrapper
              initialScale={1} minScale={0.3} maxScale={6} centerOnInit
              doubleClick={{ mode: 'zoomIn', step: 0.7 }}
              pinch={{ step: 5 }} wheel={{ step: 0.2 }}
            >
              {({ zoomIn, zoomOut, resetTransform, state }) => (
                <div className="w-full h-full relative">
                  {/* Zoom controls — bottom right */}
                  <div className="absolute bottom-4 right-4 z-50 flex flex-col bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <button type="button" onClick={() => zoomIn()} className="w-9 h-9 flex items-center justify-center text-lg text-gray-500 hover:bg-gray-50 border-b border-gray-100 active:bg-gray-100">+</button>
                    <button type="button" onClick={() => zoomOut()} className="w-9 h-9 flex items-center justify-center text-lg text-gray-500 hover:bg-gray-50 border-b border-gray-100 active:bg-gray-100">−</button>
                    <button type="button" onClick={() => resetTransform()} className="w-9 h-8 flex items-center justify-center text-[9px] font-medium text-gray-400 hover:bg-gray-50 active:bg-gray-100 uppercase tracking-wide">Fit</button>
                  </div>

                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentFloor.imageUrl} alt={currentFloor.name} style={{ width: '100%', height: 'auto', display: 'block' }} draggable={false} />
                      {floorDesks.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => handleDeskClick(d)}
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
                          <div style={{
                            width:  selected?.id === d.id ? (isDesktop ? 10 : 7) : (isDesktop ? 8 : 5),
                            height: selected?.id === d.id ? (isDesktop ? 10 : 7) : (isDesktop ? 8 : 5),
                            borderRadius: '50%',
                            background: pinColor(d),
                            transition: 'width 0.15s, height 0.15s',
                          }} />
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
          <div className={`flex-shrink-0 px-4 py-2.5 text-sm text-center ${msgType === 'ok' ? 'bg-green-50 text-green-800 border-t border-green-100' : 'bg-red-50 text-red-800 border-t border-red-100'}`}>
            {msg}
          </div>
        )}

        {/* ── Mobile bottom sheet (hidden on desktop) ── */}
        {selected && (
          <div className="md:hidden flex-shrink-0 bg-white border-t border-gray-200 shadow-lg px-4 pt-3 pb-4">
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
              >×</button>
            </div>

            {/* Date + time pickers */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Date</p>
                <input type="date" value={bookDate} min={today} onChange={(e) => setBookDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
              <div className="w-24">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Start</p>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
              <div className="w-24">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                  End {crossDay && <span className="text-orange-500 normal-case font-normal">+1d ({fmtDate(endDate)})</span>}
                </p>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
              </div>
            </div>

            {isBooked ? (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                Already booked on {fmtDate(bookDate)}
              </span>
            ) : (
              <button onClick={book}
                className="px-5 py-2 bg-[#1e3a5f] text-white rounded-full text-sm font-semibold hover:bg-[#16304d] active:scale-95 transition-transform">
                Book
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: booking panel (desktop only) ── */}
      <div className={`hidden md:flex flex-col flex-shrink-0 bg-white border-l border-gray-100 overflow-hidden transition-all duration-200 ease-in-out ${showPanel ? 'w-72' : 'w-0'}`}>
        {/* Inner wrapper keeps content at fixed width during collapse animation */}
        <div className="w-72 flex flex-col h-full">

          {/* Panel header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Desk Booking</p>
          </div>

          {/* Empty state */}
          {!selected && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="10" rx="2" />
                  <path d="M6 17v2M18 17v2" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">No desk selected</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Click any pin on the map to view details and book</p>
              </div>
            </div>
          )}

          {/* Selected desk */}
          {selected && (
            <>
              {/* Desk info */}
              <div className="px-5 pt-4 pb-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-lg leading-tight truncate">{selected.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {[selected.zone, selected.floorId].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 text-base leading-none mt-0.5">×</button>
                </div>
                <div className="mt-3">
                  {isBooked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" /> Booked on {fmtDate(bookDate)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" /> Available
                    </span>
                  )}
                </div>
              </div>

              {/* Booking form */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={bookDate} min={today} onChange={(e) => setBookDate(e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>
                      End {crossDay && <span className="text-orange-400 normal-case font-normal tracking-normal">+1d</span>}
                    </label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
                {crossDay && (
                  <p className="text-xs text-orange-500 -mt-2">Ends {fmtDate(endDate)}</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 pb-6 pt-4 border-t border-gray-100 flex-shrink-0 space-y-2">
                {isBooked ? (
                  <p className="text-sm text-center text-red-500 font-medium py-1">Already booked on {fmtDate(bookDate)}</p>
                ) : (
                  <button onClick={book}
                    className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-semibold text-sm hover:bg-[#16304d] active:scale-[0.98] transition-all">
                    Book Desk
                  </button>
                )}
                <button onClick={() => setSelected(null)}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  Clear selection
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
