"use client";

import { BottomNav } from "./bottom-nav";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { useUser } from "@/hooks/use-user";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.ReactElement {
  const { isAuthenticated } = useUser();

  return (
    <div className="flex min-h-screen flex-col">
      {isAuthenticated ? (
        <header className="sticky top-0 z-40 flex h-12 items-center justify-end border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <NotificationBell />
        </header>
      ) : null}
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
