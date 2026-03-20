"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useUser } from "@/hooks/use-user";
import { LoginPanel } from "@/features/auth/login-panel";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function LoginPage(): React.ReactElement {
  const { isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const locale: string = useLocale();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(`/${locale}/home`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <LoginPanel />;
}
