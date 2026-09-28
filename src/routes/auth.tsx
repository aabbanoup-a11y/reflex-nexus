import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "تسجيل الدخول — AbanoubAI" }] }),
});

function AuthPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ready && user) void navigate({ to: "/memory" });
  }, [ready, user, navigate]);

  async function submit() {
    setMessage("");
    if (!email.trim() || password.length < 6) return setMessage("اكتب بريدًا صحيحًا وكلمة مرور 6 أحرف على الأقل.");
    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (result.error) return toast.error(result.error.message);
    if (mode === "signup" && !result.data.session) setMessage("تم إنشاء الحساب. راجع بريدك لتأكيد الحساب ثم سجّل الدخول.");
    else void navigate({ to: "/memory" });
  }

  async function sendMagicLink() {
    if (!email.trim()) return setMessage("اكتب البريد أولًا.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (error) toast.error(error.message);
    else setMessage("تم إرسال رابط الدخول إلى بريدك.");
  }

  async function oauth(provider: "google" | "github") {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-bold text-center">تسجيل الدخول إلى AbanoubAI</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">الدخول مربوط الآن مباشرة بمشروع Supabase الحقيقي.</p>
        <div className="mt-6 space-y-3">
          <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" autoComplete="email" />
          <Input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          <Button className="w-full" disabled={busy} onClick={() => void submit()}>{mode === "login" ? "دخول" : "إنشاء حساب"}</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy} onClick={() => void oauth("google")}>Google</Button>
            <Button variant="outline" disabled={busy} onClick={() => void oauth("github")}>GitHub</Button>
          </div>
          <Button className="w-full" variant="outline" disabled={busy} onClick={() => void sendMagicLink()}>إرسال رابط دخول للبريد</Button>
          <button className="w-full text-sm text-primary underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "ليس لدي حساب — إنشاء حساب" : "لدي حساب — تسجيل الدخول"}
          </button>
          {message && <p className="text-sm text-center text-muted-foreground">{message}</p>}
        </div>
      </div>
    </div>
  );
}
