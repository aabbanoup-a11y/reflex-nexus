import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/runtime-client";

type Bridge = {
  getDeviceId(): string;
  pairSession(deviceId: string, accessToken: string, refreshToken: string): void;
  openAccessibility(): void;
  stop(): void;
  isAccessibilityOn(): boolean;
};
const bridge = (): Bridge | undefined => (typeof window === "undefined" ? undefined : (window as unknown as { AbanoubAI?: Bridge }).AbanoubAI);

/** Runs inside the Android app: registers this phone to the signed-in account and hands it the session. */
export function useAndroidAutoPair() {
  useEffect(() => {
    const b = bridge();
    if (!b?.pairSession) return;
    const pair = async (session: { access_token: string; refresh_token: string; user: { id: string } } | null) => {
      if (!session) return;
      let id = b.getDeviceId?.() || "";
      if (id) {
        const { data } = await supabase.from("companion_devices").select("id").eq("id", id).maybeSingle();
        if (!data) id = "";
      }
      if (!id) {
        const { data, error } = await supabase
          .from("companion_devices")
          .insert({ user_id: session.user.id, device_name: "هاتف Oppo (التطبيق)", platform: "android", status: "online", last_seen_at: new Date().toISOString() })
          .select("id")
          .single();
        if (error || !data) return;
        id = data.id;
      }
      b.pairSession(id, session.access_token, session.refresh_token);
    };
    void supabase.auth.getSession().then(({ data }) => pair(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") void pair(session);
      if (event === "SIGNED_OUT") b.stop?.();
    });
    return () => data.subscription.unsubscribe();
  }, []);
}

type Dev = { id: string; device_name: string; platform: string; status: string; last_seen_at: string | null };

/** Home-page card: shows phone + Chrome connection for the signed-in user. */
export function DeviceStatusCard() {
  const [devs, setDevs] = useState<Dev[] | null>(null);
  const [signed, setSigned] = useState<boolean | null>(null);
  const [inApp, setInApp] = useState(false);
  const [a11y, setA11y] = useState(false);

  useEffect(() => {
    const b = bridge();
    setInApp(!!b);
    if (b) setA11y(!!b.isAccessibilityOn?.());
    let ch: ReturnType<typeof supabase.channel> | null = null;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setSigned(!!data.user);
      if (!data.user) return;
      const load = async () => {
        const { data: rows } = await supabase.from("companion_devices").select("id,device_name,platform,status,last_seen_at").order("created_at", { ascending: false });
        setDevs(rows ?? []);
      };
      await load();
      ch = supabase.channel("home-devices").on("postgres_changes", { event: "*", schema: "public", table: "companion_devices" }, () => void load()).subscribe();
    })();
    return () => { if (ch) void supabase.removeChannel(ch); };
  }, []);

  if (signed === null) return null;
  if (!signed)
    return (
      <div className="mt-4 rounded-lg border bg-card p-3 text-sm">
        <Link to="/auth" className="font-semibold text-primary underline">سجّل دخول</Link> عشان تشوف هاتفك وChrome متصلين.
      </div>
    );
  const phone = devs?.find((d) => d.platform === "android");
  const chrome = devs?.find((d) => d.platform !== "android");
  const online = (d?: Dev) => !!d && d.status === "online";
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 text-sm">
      <span>📱 الهاتف: <b className={online(phone) ? "text-primary" : "text-muted-foreground"}>{phone ? (online(phone) ? "متصل" : "غير متصل") : "لم يُربط بعد"}</b></span>
      <span>🌐 Chrome: <b className={online(chrome) ? "text-primary" : "text-muted-foreground"}>{chrome ? (online(chrome) ? "متصل" : "غير متصل") : "لم يُربط بعد"}</b></span>
      {inApp && !a11y && (
        <button className="rounded-md border px-2 py-1" onClick={() => bridge()?.openAccessibility()}>فعّل إمكانية الوصول مرة واحدة</button>
      )}
      {inApp && (
        <button className="rounded-md border border-destructive px-2 py-1 text-destructive" onClick={() => bridge()?.stop()}>إيقاف طارئ للهاتف</button>
      )}
      <Link to="/companion" className="text-primary underline">لوحة التحكم</Link>
    </div>
  );
}
