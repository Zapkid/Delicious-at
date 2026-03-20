"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useUser } from "@/hooks/use-user";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function LandingPage(): React.ReactElement {
  const { isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const locale: string = useLocale();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(`/${locale}/home`);
    } else {
      router.replace(`/${locale}/login`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
