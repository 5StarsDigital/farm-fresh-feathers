import Navigation from '@/components/ui/navigation';
import AdminNotificationTable from '@/components/ui/admin-notification-table';

export default function AdminNotifications() {
  return (
    <div>
      <Navigation />
      <main className="pt-20">
        <AdminNotificationTable />
      </main>
    </div>
  );
}
