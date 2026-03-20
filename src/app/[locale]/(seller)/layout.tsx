"use client";

import { AuthGuard } from "@/features/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AuthGuard requireSeller>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
