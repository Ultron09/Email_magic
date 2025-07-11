import { Rocket } from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">
            Resend AI Blaster
          </h1>
        </div>
        <Suspense fallback={null}>
          <LogoutButton />
        </Suspense>
      </header>
      {children}
    </div>
  );
}
