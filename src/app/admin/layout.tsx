import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 bg-gray-50 overflow-auto">
        {children}
      </div>
    </div>
  );
}
