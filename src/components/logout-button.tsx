'use client';

import { logoutAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="ghost" size="icon" type="submit">
        <LogOut className="h-5 w-5" />
        <span className="sr-only">Logout</span>
      </Button>
    </form>
  );
}
