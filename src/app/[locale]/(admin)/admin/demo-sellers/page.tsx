import { redirect } from "next/navigation";

interface DemoSellersRedirectProps {
  params: Promise<{ locale: string }>;
}

/** @deprecated Use `/admin/override-sellers`. */
export default async function AdminDemoSellersRedirectPage({
  params,
}: DemoSellersRedirectProps): Promise<never> {
  const { locale } = await params;
  redirect(`/${locale}/admin/override-sellers`);
}
