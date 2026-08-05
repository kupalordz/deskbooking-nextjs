'use client';
import { useEffect, useMemo, useState } from 'react';

type Booking = {
  id: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  userEmail: string;
  desk: { name: string; zone: string; floorId: string };
};
type ParkingBooking = {
  id: number;
  bookingDate: string;
  status: string;
  spot: { name: string; zone: string };
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

function isoToLocal(dateStr: string) {
  return new Date(dateStr + 'T00:00:00');
}

function fmtShort(dateStr: string) {
  const d = isoToLocal(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getLast(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

function pct(n: number, total: number) {
  if (!total) return '0%';
  return Math.round((n / total) * 100) + '%';
}

function trend(data: number[]): number {
  if (data.length < 2) return 0;
  const half = Math.floor(data.length / 2);
  const recent = data.slice(-half).reduce((a, b) => a + b, 0) / half;
  const earlier = data.slice(0, half).reduce((a, b) => a + b, 0) / half;
  if (!earlier) return recent > 0 ? 100 : 0;
  return Math.round(((recent - earlier) / earlier) * 100);
}

// ─── Chart components (pure SVG) ─────────────────────────────────────────────

function SparkLine({ data, color = '#3b82f6', h = 40 }: { data: number[]; color?: string; h?: number }) {
  const max = Math.max(...data, 1);
  const W = 120;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const area = `0,${h} ${pts.join(' ')} ${W},${h}`;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <polygon points={area} fill={color} fillOpacity="0.12" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TrendLine({
  series, labels,
}: {
  series: { label: string; color: string; data: number[] }[];
  labels: string[];
}) {
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals, 1);
  const W = 600, H = 140, pL = 32, pR = 12, pT = 12, pB = 28;
  const cW = W - pL - pR, cH = H - pT - pB;
  const n = labels.length;
  const xi = (i: number) => pL + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
  const yi = (v: number) => pT + cH - (v / max) * cH;

  function pathD(data: number[]) {
    if (data.length === 0) return '';
    let d = `M ${xi(0)} ${yi(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const cpx = (xi(i) + xi(i - 1)) / 2;
      d += ` C ${cpx} ${yi(data[i - 1])}, ${cpx} ${yi(data[i])}, ${xi(i)} ${yi(data[i])}`;
    }
    return d;
  }

  const gridVals = [0, Math.round(max * 0.5), max];
  const tickDates = labels.reduce<{ i: number; label: string }[]>((acc, l, i) => {
    if (i === 0 || i === n - 1 || i % 7 === 0) acc.push({ i, label: fmtShort(l) });
    return acc;
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      {gridVals.map(v => (
        <g key={v}>
          <line x1={pL} y1={yi(v)} x2={W - pR} y2={yi(v)} stroke="#f3f4f6" strokeWidth="1" />
          <text x={pL - 4} y={yi(v) + 3.5} textAnchor="end" fontSize="7" fill="#d1d5db">{v}</text>
        </g>
      ))}
      {tickDates.map(({ i, label }) => (
        <text key={i} x={xi(i)} y={H - 4} textAnchor="middle" fontSize="7" fill="#d1d5db">{label}</text>
      ))}
      {series.map(s => {
        const path = pathD(s.data);
        return (
          <g key={s.label}>
            <path d={`${path} L ${xi(n - 1)} ${pT + cH} L ${xi(0)} ${pT + cH} Z`} fill={s.color} fillOpacity="0.07" stroke="none" />
            <path d={path} fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({ data, color = '#3b82f6' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 300, H = 100, pB = 20, pT = 8;
  const bW = Math.floor((W / data.length) * 0.55);
  const gap = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
      {data.map((d, i) => {
        const barH = ((d.value / max) * (H - pT - pB));
        const bx = gap * i + (gap - bW) / 2;
        const by = H - pB - barH;
        return (
          <g key={d.label}>
            <rect x={bx} y={by} width={bW} height={Math.max(barH, 1)} rx="2" fill={color} fillOpacity={d.value ? 0.8 : 0.15} />
            <text x={bx + bW / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#9ca3af">{d.label}</text>
            {d.value > 0 && barH > 12 && (
              <text x={bx + bW / 2} y={by + 10} textAnchor="middle" fontSize="7" fill="white" fontWeight="600">{d.value}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 34, cx = 44, cy = 44, sw = 14;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <svg viewBox="0 0 88 88" className="w-20 h-20 flex-shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
      {segments.filter(s => s.value > 0).map((seg) => {
        const dash = (seg.value / total) * circ;
        const rot = (cumulative / total) * 360 - 90;
        cumulative += seg.value;
        return (
          <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`}
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
        );
      })}
    </svg>
  );
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

function StatCard({ label, value, sub, color, bg, trend: t, sparkData }: {
  label: string; value: string | number; sub: string;
  color: string; bg: string; trend?: number; sparkData?: number[];
}) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden`}>
      {sparkData && (
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <SparkLine data={sparkData} color={color.replace('text-', '#').replace('[', '').replace(']', '')} />
        </div>
      )}
      <div className="relative">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-[11px] text-gray-400">{sub}</p>
          {t !== undefined && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${t >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {t >= 0 ? '+' : ''}{t}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [parkingBookings, setParkingBookings] = useState<ParkingBooking[]>([]);
  const [totalDesks, setTotalDesks] = useState(0);
  const [totalParking, setTotalParking] = useState(0);
  const [activeTab, setActiveTab] = useState<'desk' | 'parking'>('desk');

  useEffect(() => {
    fetch('/api/bookings').then(r => r.json()).then(d => setBookings(Array.isArray(d) ? d : []));
    fetch('/api/parking-bookings').then(r => r.json()).then(d => setParkingBookings(Array.isArray(d) ? d : []));
    fetch('/api/desks').then(r => r.json()).then(d => setTotalDesks(Array.isArray(d) ? d.length : 0));
    fetch('/api/parking-spots').then(r => r.json()).then(d => setTotalParking(Array.isArray(d) ? d.length : 0));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const active = activeTab === 'desk' ? bookings : parkingBookings;

  const last30 = useMemo(() => getLast(30), []);
  const last7 = useMemo(() => getLast(7), []);

  // ── Daily counts ──────────────────────────────────────────────────────────
  const deskDaily = useMemo(() => last30.map(d => bookings.filter(b => b.bookingDate === d && b.status !== 'CANCELLED').length), [bookings, last30]);
  const parkDaily = useMemo(() => last30.map(d => parkingBookings.filter(b => b.bookingDate === d && b.status !== 'CANCELLED').length), [parkingBookings, last30]);

  // ── KPI ───────────────────────────────────────────────────────────────────
  const todayDesk = bookings.filter(b => b.bookingDate === today && b.status !== 'CANCELLED').length;
  const todayParking = parkingBookings.filter(b => b.bookingDate === today && b.status !== 'CANCELLED').length;
  const weekDesk = last7.reduce((s, d) => s + bookings.filter(b => b.bookingDate === d && b.status !== 'CANCELLED').length, 0);
  const cancelRate = bookings.length ? Math.round((bookings.filter(b => b.status === 'CANCELLED').length / bookings.length) * 100) : 0;
  const checkinRate = bookings.length ? Math.round((bookings.filter(b => b.status === 'CHECKED_IN').length / bookings.length) * 100) : 0;
  const utilRate = totalDesks ? Math.round((todayDesk / totalDesks) * 100) : 0;
  const deskTrend = trend(deskDaily);

  // ── Day-of-week ───────────────────────────────────────────────────────────
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowData = useMemo(() => DOW.map((day, i) => ({
    label: day,
    value: active.filter(b => isoToLocal(b.bookingDate).getDay() === i && b.status !== 'CANCELLED').length,
  })), [active]);

  // ── Top desks ─────────────────────────────────────────────────────────────
  const topDesks = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => { const k = b.desk?.name ?? '—'; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [bookings]);

  // ── Zone breakdown ────────────────────────────────────────────────────────
  const zoneData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => { const k = b.desk?.zone || 'Unknown'; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [bookings]);

  // ── Peak hours ────────────────────────────────────────────────────────────
  const hourData = useMemo(() => {
    const counts = Array(24).fill(0);
    bookings.forEach(b => {
      if (b.startTime) {
        const h = parseInt((b.startTime.split('T')[1] || b.startTime).split(':')[0]);
        if (!isNaN(h)) counts[h]++;
      }
    });
    const labeled = counts.map((v, i) => ({ label: i % 4 === 0 ? `${i}h` : '', value: v, hour: i }));
    return labeled;
  }, [bookings]);
  const maxHour = Math.max(...hourData.map(d => d.value), 1);

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusSegs = [
    { label: 'Confirmed', value: active.filter(b => b.status === 'CONFIRMED').length, color: '#3b82f6' },
    { label: 'Checked In', value: active.filter(b => b.status === 'CHECKED_IN').length, color: '#16a34a' },
    { label: 'Cancelled', value: active.filter(b => b.status === 'CANCELLED').length, color: '#dc2626' },
  ];

  const latest = [...bookings].sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <div className="p-5 sm:p-7 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setActiveTab('desk')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'desk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Desk</button>
          <button onClick={() => setActiveTab('parking')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'parking' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Parking</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today's Bookings" value={todayDesk} sub="Desk · active" color="text-blue-600" bg="bg-blue-50" trend={deskTrend} />
        <StatCard label="This Week" value={weekDesk} sub="Last 7 days" color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Utilization" value={`${utilRate}%`} sub={`${todayDesk} / ${totalDesks} desks`} color="text-green-700" bg="bg-green-50" />
        <StatCard label="Parking Today" value={todayParking} sub={`${totalParking} spots total`} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* Rate row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Cancellation Rate', value: `${cancelRate}%`, sub: `${bookings.filter(b => b.status === 'CANCELLED').length} cancelled`, color: 'text-red-600' },
          { label: 'Check-in Rate', value: `${checkinRate}%`, sub: `${bookings.filter(b => b.status === 'CHECKED_IN').length} checked in`, color: 'text-green-700' },
          { label: 'Total Bookings', value: bookings.length, sub: 'All desk bookings', color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Trend + DoW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* 30-day trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Booking Trend</h3>
              <p className="text-xs text-gray-400">Last 30 days</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Desk</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" />Parking</span>
            </div>
          </div>
          <TrendLine
            labels={last30}
            series={[
              { label: 'Desk', color: '#3b82f6', data: deskDaily },
              { label: 'Parking', color: '#fb923c', data: parkDaily },
            ]}
          />
        </div>

        {/* Day of week */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Day Pattern</h3>
            <p className="text-xs text-gray-400">Bookings by weekday</p>
          </div>
          <BarChart data={dowData} color={activeTab === 'desk' ? '#3b82f6' : '#fb923c'} />
        </div>
      </div>

      {/* Top desks + Status + Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Top desks */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Desks</h3>
          <p className="text-xs text-gray-400 mb-4">By total bookings</p>
          {topDesks.length === 0 ? (
            <p className="text-xs text-gray-400">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topDesks.map(([name, count]) => (
                <HBar key={name} label={name} value={count} max={topDesks[0][1]} color="#3b82f6" />
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Status Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">{activeTab === 'desk' ? 'Desk' : 'Parking'} bookings</p>
          <div className="flex items-center gap-4">
            <DonutChart segments={statusSegs} />
            <div className="flex flex-col gap-2.5">
              {statusSegs.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label} · {pct(s.value, active.length)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Zone Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Desk bookings by zone</p>
          {zoneData.length === 0 ? (
            <p className="text-xs text-gray-400">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {zoneData.map(([zone, count]) => (
                <HBar key={zone} label={zone} value={count} max={zoneData[0][1]} color="#8b5cf6" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Peak hours heatmap */}
      {bookings.some(b => b.startTime) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Peak Booking Hours</h3>
          <p className="text-xs text-gray-400 mb-4">Start time distribution</p>
          <div className="flex items-end gap-0.5 h-14">
            {hourData.map(({ label, value, hour }) => (
              <div key={hour} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${Math.max((value / maxHour) * 48, value > 0 ? 4 : 0)}px`,
                    background: value > 0 ? `rgba(59,130,246,${0.2 + (value / maxHour) * 0.8})` : '#f3f4f6',
                  }}
                  title={`${hour}:00 — ${value} bookings`}
                />
                {label && <span className="text-[8px] text-gray-400">{label}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest bookings table */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Recent Desk Bookings</h3>
          <span className="text-xs text-gray-400">{bookings.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Code', 'Desk', 'Zone', 'Date', 'Email', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {latest.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No bookings yet.</td></tr>
              )}
              {latest.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">BK-{b.id.toString().padStart(5, '0')}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900 text-xs">{b.desk?.name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{b.desk?.zone ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtShort(b.bookingDate)}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{b.userEmail}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      b.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700' :
                      b.status === 'CHECKED_IN' ? 'bg-green-50 text-green-700' :
                      b.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{b.status}</span>
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
