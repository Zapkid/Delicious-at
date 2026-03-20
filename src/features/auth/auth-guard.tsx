"use client";

import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireSeller?: boolean;
  requireManager?: boolean;
}

export function AuthGuard({
  children,
  requireSeller = false,
  requireManager = false,
}: AuthGuardProps): React.ReactElement | null {
  const { isAuthenticated, isSeller, isManager, isLoading } = useUser();
  const router = useRouter();
  const locale: string = useLocale();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
      return;
    }

    if (requireSeller && !isSeller && !isManager) {
      router.replace(`/${locale}/home`);
      return;
    }

    if (requireManager && !isManager) {
      router.replace(`/${locale}/home`);
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    isSeller,
    isManager,
    requireSeller,
    requireManager,
    router,
    locale,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requireSeller && !isSeller && !isManager) return null;
  if (requireManager && !isManager) return null;

  return <>{children}</>;
}
