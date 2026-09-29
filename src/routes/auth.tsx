import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Chrome, Eye, EyeOff, KeyRound, Loader2, Mail, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/runtime-client";
import { lovable } from "@/integrations/lovable/index";
import { ensureUserProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "الدخول إلى AbanoubAI" },
      { name: "description", content: "أنشئ حسابك أو سجّل الدخول بأمان إلى AbanoubAI." },
      { property: "og:title", content: "الدخول إلى AbanoubAI" },
      { property: "og:description", content: "دخول آمن إلى مساعديك وذاكرتك وأجهزتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Mode = "login" | "signup" | "forgot";

const authMessages: Record<string, string> = {
  "Invalid login credentials": "البريد أو كلمة المرور غير صحيحة. يمكنك إنشاء حساب أو استعادة كلمة المرور.",
  "Email not confirmed": "افتح رسالة التأكيد في بريدك أولًا، ثم سجّل الدخول.",
  "User already registered": "هذا البريد مسجّل بالفعل. سجّل الدخول أو استعد كلمة المرور.",
  "Password should be at least 6 characters": "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
};

function messageFor(error: { message: string }) {
  return authMessages[error.message] ?? error.message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      try { await ensureUserProfile(data.user); } catch { /* profile creation can retry after navigation */ }
      await navigate({ to: "/memory", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  async function emailAuth() {
    setNotice(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setNotice({ kind: "error", text: "اكتب بريدًا إلكترونيًا صحيحًا." });
      return;
    }
    if (mode === "forgot") {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      setNotice(error
        ? { kind: "error", text: messageFor(error) }
        : { kind: "success", text: "أرسلنا رابط تعيين كلمة مرور جديدة. افحص بريدك." });
      return;
    }
    if (password.length < 6) {
      setNotice({ kind: "error", text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." });
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setNotice({ kind: "error", text: "اكتب اسمك لملفك الشخصي." });
      return;
    }

    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      : await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { display_name: displayName.trim() },
          },
        });
    setBusy(false);

    if (result.error) {
      setNotice({ kind: "error", text: messageFor(result.error) });
      return;
    }
    if (!result.data.session) {
      setNotice({ kind: "success", text: "الحساب اتعمل. افتح رسالة التأكيد في بريدك، ثم ارجع وسجّل الدخول." });
      return;
    }
    if (result.data.user) await ensureUserProfile(result.data.user);
    await navigate({ to: "/memory", replace: true });
  }

  async function googleAuth() {
    setNotice(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
      extraParams: { prompt: "select_account" },
    });
    if (result.redirected) return;
    setBusy(false);
    if (result.error) {
      setNotice({ kind: "error", text: "تعذّر فتح Google الآن. حاول مرة أخرى." });
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await ensureUserProfile(data.user);
      await navigate({ to: "/memory", replace: true });
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setNotice(null);
    setPassword("");
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-primary text-xl font-black text-primary-foreground">A</div>
          <div>
            <p className="text-lg font-bold">AbanoubAI</p>
            <p className="text-xs text-muted-foreground">مساحتك الذكية الخاصة</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold">
          {mode === "login" ? "أهلًا بك من جديد" : mode === "signup" ? "أنشئ حسابك" : "استعادة كلمة المرور"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {mode === "forgot" ? "سنرسل لك رابطًا آمنًا لتعيين كلمة مرور جديدة." : "ادخل إلى المساعدين والذاكرة والتحكم في أجهزتك."}
        </p>

        {mode !== "forgot" && (
          <Button className="mt-7 h-12 w-full gap-2" variant="outline" disabled={busy} onClick={() => void googleAuth()}>
            <Chrome className="size-5" /> المتابعة باستخدام Google
          </Button>
        )}

        {mode !== "forgot" && (
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />أو بالبريد الإلكتروني<span className="h-px flex-1 bg-border" />
          </div>
        )}

        <div className={mode === "forgot" ? "mt-7 space-y-3" : "space-y-3"}>
          {mode === "signup" && (
            <div className="relative">
              <UserRound className="pointer-events-none absolute right-3 top-3.5 size-5 text-muted-foreground" />
              <Input className="h-12 pr-11" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="الاسم الظاهر" autoComplete="name" />
            </div>
          )}
          <div className="relative">
            <Mail className="pointer-events-none absolute right-3 top-3.5 size-5 text-muted-foreground" />
            <Input className="h-12 pr-11 text-left" dir="ltr" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          {mode !== "forgot" && (
            <div className="relative">
              <KeyRound className="pointer-events-none absolute right-3 top-3.5 size-5 text-muted-foreground" />
              <Input className="h-12 px-11 text-left" dir="ltr" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="كلمة المرور" autoComplete={mode === "login" ? "current-password" : "new-password"} />
              <Button type="button" size="icon" variant="ghost" className="absolute left-1 top-1" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </Button>
            </div>
          )}
          <Button className="h-12 w-full" disabled={busy} onClick={() => void emailAuth()}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "login" ? "تسجيل الدخول" : mode === "signup" ? "إنشاء الحساب" : "إرسال رابط الاستعادة"}
          </Button>
        </div>

        {notice && (
          <p role="status" className={`mt-4 rounded-md border p-3 text-center text-sm leading-6 ${notice.kind === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-foreground"}`}>
            {notice.text}
          </p>
        )}

        <div className="mt-5 flex flex-col items-center gap-3 text-sm">
          {mode === "login" && <Button variant="link" onClick={() => changeMode("forgot")}>نسيت كلمة المرور؟</Button>}
          <Button variant="link" onClick={() => changeMode(mode === "signup" ? "login" : mode === "login" ? "signup" : "login")}>
            {mode === "signup" ? "لديك حساب بالفعل؟ تسجيل الدخول" : mode === "login" ? "ليس لديك حساب؟ إنشاء حساب" : "العودة لتسجيل الدخول"}
          </Button>
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">حسابك وملفك الشخصي محفوظان بأمان، ولا يطّلع أي مستخدم على بيانات غيره.</p>
      </section>
    </main>
  );
}
