import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — ذاكرتك الخاصة" },
      { name: "description", content: "سجّل دخول بجوجل عشان ذاكرتك ومتابعة مزاجك تبقى خاصة بيك ومشفّرة." },
      { property: "og:title", content: "تسجيل الدخول" },
      { property: "og:description", content: "دخول آمن بجوجل لحفظ ذاكرتك الخاصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) navigate({ to: "/memory" });
  }, [user, navigate]);

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-bold">ذاكرتك الخاصة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          سجّل دخول عشان محدش غيرك يقدر يشوف ذاكرتك ومتابعة مزاجك.
        </p>
        <Button
          className="mt-6 w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
            if (r.error) toast.error("تعذر تسجيل الدخول");
            setBusy(false);
          }}
        >
          الدخول بحساب جوجل
        </Button>
      </div>
    </div>
  );
}
