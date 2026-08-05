'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/admin/floorplans',
    label: 'Floor Plans',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/locations',
    label: 'Locations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    href: '/admin/shifts',
    label: 'Shifts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: '/admin/parking',
    label: 'Parking',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/admin/manage-lists',
    label: 'Manage Lists',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/admin/kiosk',
    label: 'Kiosk Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-14 sm:w-52 bg-[#1a2535] flex-shrink-0 flex flex-col sticky top-16 md:top-20 self-start h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-y-auto z-40">
      <div className="hidden sm:flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg bg-[#3b82f6] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <p className="text-white text-xs font-semibold leading-tight">DeskBooking</p>
          <p className="text-white/40 text-[10px]">Admin Panel</p>
        </div>
      </div>

      <nav className="flex flex-col py-3 flex-1">
        {navItems.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 mx-2 rounded-lg my-0.5 transition-all duration-150 ${
                active
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-white/55 hover:text-white hover:bg-white/8'
              }`}
              style={!active ? { ['--tw-bg-opacity' as string]: '0.08' } : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="hidden sm:block text-sm font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden sm:block px-4 py-4 border-t border-white/10">
        <p className="text-white/30 text-[10px] truncate">Jordan P. — Albertsons</p>
      </div>
    </aside>
  );
}
