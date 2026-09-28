import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "الدخول إلى AbanoubAI" },
      { name: "description", content: "دخول آمن إلى مساحة AbanoubAI الخاصة بك." },
    ],
  }),
});

function AuthPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (ready && user) void navigate({ to: "/memory" });
  }, [ready, user, navigate]);

  async function emailAuth() {
    setNotice("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return setNotice("اكتب بريدًا إلكترونيًا صحيحًا.");
    if (password.length < 6) return setNotice("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      : await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (result.error) {
      const msg = result.error.message.toLowerCase().includes("confirm")
        ? "الحساب يحتاج تأكيد البريد. افحص مجلد الرسائل غير المرغوبة أو استخدم الدخول الاجتماعي."
        : result.error.message;
      return setNotice(msg);
    }
    if (mode === "signup" && !result.data.session) return setNotice("تم إنشاء الحساب. أكّد بريدك ثم ارجع إلى هنا لتسجيل الدخول.");
    void navigate({ to: "/memory" });
  }

  async function social(provider: "google" | "github") {
    setNotice("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (error) setNotice(`${provider === "google" ? "Google" : "GitHub"} غير متاح حاليًا في إعدادات المصادقة.`);
  }

  return (
    <main dir="rtl" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-indigo-500 text-xl font-black text-slate-950">A</div>
          <div>
            <p className="text-lg font-bold tracking-tight">AbanoubAI</p>
            <p className="text-xs text-slate-300">مساحتك الذكية الخاصة</p>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">أهلًا بك من جديد</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">سجّل دخولك للوصول إلى المساعدين، الذاكرة، والتحكم الآمن في أجهزتك.</p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <Button className="h-11 border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline" disabled={busy} onClick={() => void social("google")}>Google</Button>
          <Button className="h-11 border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline" disabled={busy} onClick={() => void social("github")}>GitHub</Button>
        </div>
        <div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-white/10" />أو بالبريد الإلكتروني<span className="h-px flex-1 bg-white/10" /></div>

        <div className="space-y-3">
          <Input className="h-12 border-white/10 bg-black/20 text-left text-white placeholder:text-slate-500" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <Input className="h-12 border-white/10 bg-black/20 text-left text-white placeholder:text-slate-500" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          <Button className="h-12 w-full bg-white text-slate-950 hover:bg-slate-200" disabled={busy} onClick={() => void emailAuth()}>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</Button>
        </div>
        {notice && <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-center text-sm leading-6 text-amber-100">{notice}</p>}
        <button className="mt-5 w-full text-sm text-slate-300 transition hover:text-white" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setNotice(""); }}>
          {mode === "login" ? "ليس لديك حساب؟ إنشاء حساب جديد" : "لديك حساب بالفعل؟ تسجيل الدخول"}
        </button>
        <p className="mt-7 text-center text-xs leading-5 text-slate-400">دخولك محمي بجلسة Supabase مشفّرة. لا نشارك بياناتك مع أي طرف.</p>
      </section>
    </main>
  );
}
