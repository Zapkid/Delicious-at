"use client";

import { AuthGuard } from "@/features/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AuthGuard requireManager>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
