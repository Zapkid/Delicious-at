"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRole } from "@/hooks/use-role";
import { useUser } from "@/hooks/use-user";
import {
  Home,
  Search,
  Heart,
  ClipboardList,
  User,
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  Shield,
  Flag,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function BottomNav(): React.ReactElement | null {
  const t = useTranslations("nav");
  const locale: string = useLocale();
  const pathname: string = usePathname();
  const { isAuthenticated } = useUser();
  const { activeView, isSeller, isManager } = useRole();

  if (!isAuthenticated) return null;

  const userItems: NavItem[] = [
    { href: `/${locale}/home`, label: t("home"), icon: <Home className="h-5 w-5" /> },
    { href: `/${locale}/explore`, label: t("explore"), icon: <Search className="h-5 w-5" /> },
    {
      href: `/${locale}/favorites`,
      label: t("favorites"),
      icon: <Heart className="h-5 w-5" />,
    },
    {
      href: `/${locale}/my-requests`,
      label: t("myRequests"),
      icon: <ClipboardList className="h-5 w-5" />,
    },
    { href: `/${locale}/profile`, label: t("profile"), icon: <User className="h-5 w-5" /> },
  ];

  const sellerItems: NavItem[] = [
    {
      href: `/${locale}/seller/dashboard`,
      label: t("sellerDashboard"),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    { href: `/${locale}/seller/shop`, label: t("myShop"), icon: <Store className="h-5 w-5" /> },
    {
      href: `/${locale}/seller/items`,
      label: t("myItems"),
      icon: <Package className="h-5 w-5" />,
    },
    {
      href: `/${locale}/seller/orders`,
      label: t("orders"),
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    { href: `/${locale}/profile`, label: t("profile"), icon: <User className="h-5 w-5" /> },
  ];

  const adminItems: NavItem[] = [
    {
      href: `/${locale}/admin/applications`,
      label: t("admin"),
      icon: <Shield className="h-5 w-5" />,
    },
    {
      href: `/${locale}/admin/sellers`,
      label: t("sellers"),
      icon: <Store className="h-5 w-5" />,
    },
    {
      href: `/${locale}/admin/fees`,
      label: t("fees"),
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: `/${locale}/admin/reports`,
      label: t("reports"),
      icon: <Flag className="h-5 w-5" />,
    },
    {
      href: `/${locale}/admin/health`,
      label: t("health"),
      icon: <Activity className="h-5 w-5" />,
    },
    {
      href: `/${locale}/admin/override-sellers`,
      label: t("overrideSellers"),
      icon: <Store className="h-5 w-5" />,
    },
    { href: `/${locale}/profile`, label: t("profile"), icon: <User className="h-5 w-5" /> },
  ];

  const onSellerPaths: boolean = pathname.startsWith(`/${locale}/seller`);
  const showSellerNav: boolean =
    (activeView === "seller" && (isSeller || isManager)) ||
    (isSeller && onSellerPaths);

  let items: NavItem[];
  if (pathname.startsWith(`/${locale}/admin`) && isManager) {
    items = adminItems;
  } else if (showSellerNav) {
    items = sellerItems;
  } else {
    items = userItems;
  }

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {items.map((item) => {
          const isActive: boolean =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
