"use client";

import { useTranslations } from "next-intl";
import { SignInButton } from "@/features/auth/sign-in-button";

export function LoginPanel(): React.ReactElement {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-5xl font-bold text-primary">🍳</h1>
        <h2 className="text-3xl font-bold">{t("appName")}</h2>
        <p className="max-w-sm text-muted-foreground">
          Homemade food marketplace — fresh, local, homemade
        </p>
      </div>
      <SignInButton />
    </div>
  );
}
