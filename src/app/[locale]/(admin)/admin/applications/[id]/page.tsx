import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SellerApplication, Profile } from "@/types";
import { ApplicationActions } from "./application-actions";

type ApplicationWithProfile = SellerApplication & {
  profiles: Pick<Profile, "full_name" | "email" | "avatar_url"> | null;
};

const STATUS_VARIANT: Record<
  SellerApplication["status"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

interface ApplicationDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps): Promise<React.ReactElement> {
  const { id, locale } = await params;
  const t = await getTranslations("admin.applications");

  const manager = await getManagerSession();
  if (!manager) {
    redirect(`/${locale}/home`);
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("seller_applications")
    .select("*, profiles!user_id(full_name, email, avatar_url)")
    .eq("id", id)
    .maybeSingle();

  const app: ApplicationWithProfile | null =
    (data as ApplicationWithProfile | null) ?? null;

  if (!app) {
    return (
      <>
        <PageHeader title={t("detail")} showBack />
        <main className="p-4">
          <p className="text-muted-foreground">Application not found.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("detail")} showBack />
      <main className="flex flex-col gap-6 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{app.business_name}</CardTitle>
              <Badge variant={STATUS_VARIANT[app.status]}>{app.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Applicant" value={app.profiles?.full_name ?? "—"} />
              <InfoRow label="Email" value={app.profiles?.email ?? "—"} />
              <InfoRow label="Phone" value={app.phone} />
              <InfoRow label="Address" value={app.address} />
              <InfoRow
                label="Applied"
                value={new Date(app.created_at).toLocaleDateString()}
              />
              <InfoRow
                label="Fee Terms Accepted"
                value={app.accepted_fee_terms ? "Yes" : "No"}
              />
            </div>

            {app.bio && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Bio
                  </p>
                  <p className="text-sm">{app.bio}</p>
                </div>
              </>
            )}

            {(app.profile_photo_url || app.cover_photo_url) && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Photos
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {app.profile_photo_url && (
                      <img
                        src={app.profile_photo_url}
                        alt="Profile"
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                    {app.cover_photo_url && (
                      <img
                        src={app.cover_photo_url}
                        alt="Cover"
                        className="h-24 w-40 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {app.admin_note && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Admin Note
                  </p>
                  <p className="text-sm">{app.admin_note}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {app.status === "pending" && <ApplicationActions applicationId={app.id} />}
      </main>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
