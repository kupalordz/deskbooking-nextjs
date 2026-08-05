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

type Floor = { id: number; floorId: string; name: string; imageUrl: string };

type BookingSummary = { bookingDate: string; status: string; deskId: number };

export default function FloorMap() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [floor, setFloor] = useState('');
  const [bookedIds, setBookedIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Desk | null>(null);
  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/floors').then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : [];
      setFloors(list);
      if (list.length > 0 && !floor) setFloor(list[0].floorId);
    });
    fetch('/api/desks').then((r) => r.json()).then((d) => setDesks(Array.isArray(d) ? d : []));
    fetch('/api/bookings').then((r) => r.json()).then((d: BookingSummary[]) => {
      const today = new Date().toISOString().split('T')[0];
      const ids = (Array.isArray(d) ? d : [])
        .filter((b: BookingSummary) => b.bookingDate === today && b.status !== 'CANCELLED')
        .map((b: BookingSummary) => b.deskId);
      setBookedIds(ids);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentFloor = floors.find((f) => f.floorId === floor);
  const floorDesks = desks.filter((d) => d.floorId === floor && d.active);

  function pinColor(d: Desk) {
    if (d.restricted) return '#7c3aed';
    if (bookedIds.includes(d.id)) return '#dc2626';
    return '#16a34a';
  }

  function book() {
    if (!selected) return;
    const today = new Date().toISOString().split('T')[0];
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: selected.id, bookingDate: today }),
    }).then((r) => {
      if (r.ok) {
        setMsg('Booked ' + selected.name + '!');
        setBookedIds((p) => [...p, selected.id]);
        setSelected(null);
      } else {
        setMsg('Already booked for today');
      }
    });
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Header: floor tabs + legend */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        {/* Floor tabs — horizontal scroll, no wrap */}
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
        {/* Legend row */}
        <div className="flex gap-4 px-3 pb-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />Booked
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />Restricted
          </span>
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
            {({ zoomIn, zoomOut, resetTransform }) => (
              <div className="w-full h-full relative">
                {/* Zoom controls */}
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
                          transform: 'translate(-50%, -50%)',
                          cursor: 'pointer',
                          zIndex: 20,
                        }}
                        title={d.name}
                      >
                        <div
                          style={{
                            width: selected?.id === d.id ? 16 : 12,
                            height: selected?.id === d.id ? 16 : 12,
                            borderRadius: '50%',
                            background: pinColor(d),
                            boxShadow: selected?.id === d.id ? '0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px ' + pinColor(d) : '0 0 0 2px rgba(255,255,255,0.8)',
                            transition: 'all 0.15s',
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

      {/* Booking success toast */}
      {msg && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-green-50 border-t border-green-100 text-sm text-green-800 text-center">
          {msg}
        </div>
      )}

      {/* Desk detail bottom sheet */}
      {selected && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">{selected.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {selected.zone ? selected.zone + ' · ' : ''}{selected.floorId}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {bookedIds.includes(selected.id) ? (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full">Already booked</span>
              ) : (
                <button
                  onClick={book}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-full text-sm font-medium hover:bg-[#16304d] active:scale-95 transition-transform"
                >
                  Book Today
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
