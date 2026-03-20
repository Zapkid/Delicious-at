import Link from "next/link";
import { useTranslations } from "next-intl";
import { DEFAULT_LOCALE } from "@/lib/constants";

export default function NotFound(): React.ReactElement {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">{t("notFound")}</p>
      <Link
        href={`/${DEFAULT_LOCALE}/home`}
        className="text-primary underline-offset-4 hover:underline"
      >
        {t("goHome")}
      </Link>
    </div>
  );
}
