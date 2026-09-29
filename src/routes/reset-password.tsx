import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة — AbanoubAI" },
      { name: "description", content: "اختر كلمة مرور جديدة وآمنة لحساب AbanoubAI." },
      { property: "og:title", content: "تعيين كلمة مرور جديدة — AbanoubAI" },
      { property: "og:description", content: "استعادة آمنة لحساب AbanoubAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    setRecoveryReady(hash.get("type") === "recovery" || query.get("type") === "recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function updatePassword() {
    setMessage("");
    if (!recoveryReady) return setMessage("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.");
    if (password.length < 8) return setMessage("استخدم 8 أحرف على الأقل.");
    if (password !== confirmPassword) return setMessage("كلمتا المرور غير متطابقتين.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(error.message);
    setDone(true);
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl sm:p-8">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h1 className="mt-4 text-2xl font-bold">تم تحديث كلمة المرور</h1>
            <p className="mt-2 text-sm text-muted-foreground">تقدر تدخل إلى حسابك الآن بكلمة المرور الجديدة.</p>
            <Button className="mt-6 w-full" onClick={() => void navigate({ to: "/memory", replace: true })}>الدخول إلى حسابي</Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">كلمة مرور جديدة</h1>
            <p className="mt-2 text-sm text-muted-foreground">اكتب كلمة قوية مختلفة عن كلمات المرور السابقة.</p>
            <div className="mt-6 space-y-3">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute right-3 top-3.5 size-5 text-muted-foreground" />
                <Input className="h-12 px-11 text-left" dir="ltr" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="كلمة المرور الجديدة" autoComplete="new-password" />
                <Button type="button" size="icon" variant="ghost" className="absolute left-1 top-1" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </Button>
              </div>
              <Input className="h-12 text-left" dir="ltr" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="تأكيد كلمة المرور" autoComplete="new-password" />
              <Button className="h-12 w-full" disabled={busy} onClick={() => void updatePassword()}>
                {busy && <Loader2 className="size-4 animate-spin" />} حفظ كلمة المرور
              </Button>
            </div>
            {message && <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}
          </>
        )}
      </section>
    </main>
  );
}
