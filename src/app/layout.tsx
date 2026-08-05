import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DeskBookingApp',
};

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/floormap', label: 'Floor Map' },
  { href: '/parking', label: 'Parking' },
  { href: '/bookings', label: 'My Bookings' },
  { href: '/qr', label: 'Check In' },
  { href: '/admin', label: 'Admin' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 font-sans bg-gray-50 min-h-screen">
        <header className="bg-gradient-to-r from-[#1e3a5f] to-[#274b7a] text-white h-16 md:h-20 px-4 sm:px-8 md:px-12 flex items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-6 max-w-7xl w-full mx-auto justify-between">
            <span className="font-bold text-base sm:text-lg md:text-2xl tracking-tight">DeskBookingApp</span>
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-base font-medium text-blue-100 hover:text-white transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <span className="hidden sm:inline text-sm md:text-base opacity-80">Jordan P. - Albertsons</span>
          </div>
        </header>

        <main className="pb-20 md:pb-0">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex h-16 z-50 md:hidden">
          <div className="flex max-w-7xl w-full mx-auto">
            {navItems.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex-1 flex flex-col items-center justify-center text-gray-500 no-underline text-[11px] gap-0.5 hover:text-[#1e3a5f] transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                <span>{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}