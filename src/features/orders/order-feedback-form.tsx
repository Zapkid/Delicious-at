"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderFeedbackFormProps {
  orderId: string;
}

const FEEDBACK_TAGS: readonly string[] = [
  "tasty",
  "friendly",
  "on_time",
  "packed_well",
  "great_value",
] as const;

function StarRow(props: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  name: string;
}): React.ReactElement {
  const { label, value, onChange, name } = props;
  return (
    <div className="space-y-2">
      <Label id={`${name}-label`}>{label}</Label>
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-labelledby={`${name}-label`}
      >
        {([1, 2, 3, 4, 5] as const).map((n: number) => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={value === n ? "default" : "outline"}
            className="h-9 w-9 min-w-9 p-0"
            onClick={() => onChange(n)}
            data-testid={`${name}-star-${n}`}
            aria-pressed={value === n}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function OrderFeedbackForm({
  orderId,
}: OrderFeedbackFormProps): React.ReactElement {
  const t = useTranslations("order");
  const router = useRouter();
  const [appStars, setAppStars] = useState<number>(0);
  const [sellerStars, setSellerStars] = useState<number>(0);
  const [itemStars, setItemStars] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tag: string): void {
    setTags((prev: string[]) =>
      prev.includes(tag) ? prev.filter((x: string) => x !== tag) : [...prev, tag]
    );
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (appStars < 1 || sellerStars < 1 || itemStars < 1) {
      setError(t("feedback.pickAll"));
      return;
    }
    setSubmitting(true);
    setError(null);
    const res: Response = await fetch(`/api/orders/${orderId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_stars: appStars,
        seller_stars: sellerStars,
        item_stars: itemStars,
        comment: comment.trim() || undefined,
        feedback_tags: tags.length > 0 ? tags : undefined,
      }),
    });
    if (!res.ok) {
      const j: unknown = await res.json().catch(() => ({}));
      const msg: string =
        typeof j === "object" &&
        j !== null &&
        "error" in j &&
        typeof (j as { error: unknown }).error === "string"
          ? (j as { error: string }).error
          : t("feedback.submitFailed");
      setError(msg);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
      data-testid="order-feedback-form"
    >
      <h2 className="text-base font-semibold">{t("feedback.title")}</h2>
      <StarRow
        name="app"
        label={t("feedback.app")}
        value={appStars}
        onChange={setAppStars}
      />
      <StarRow
        name="seller"
        label={t("feedback.seller")}
        value={sellerStars}
        onChange={setSellerStars}
      />
      <StarRow
        name="item"
        label={t("feedback.item")}
        value={itemStars}
        onChange={setItemStars}
      />
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("feedback.tags")}</p>
        <p className="text-xs text-muted-foreground">{t("feedback.tagsHint")}</p>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TAGS.map((tag: string) => (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant={tags.includes(tag) ? "default" : "outline"}
              onClick={() => toggleTag(tag)}
            >
              {tag.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fb-comment">{t("feedback.comment")}</Label>
        <Textarea
          id="fb-comment"
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setComment(e.target.value)
          }
          rows={2}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={submitting}
        data-testid="submit-feedback"
      >
        {submitting ? t("feedback.submitting") : t("feedback.submit")}
      </Button>
    </form>
  );
}
