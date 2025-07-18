import { DashboardClient } from '@/components/dashboard-client';

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardClient />
    </main>
  );
}
