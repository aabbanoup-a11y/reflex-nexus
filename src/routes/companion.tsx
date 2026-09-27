import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  listCompanionDevices,
  queueCompanionCommand,
  stopCompanion,
} from "@/lib/companion.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/companion")({ component: CompanionPage });

type Device = {
  id: string;
  device_name: string;
  platform: string;
  status: string;
  last_seen_at: string | null;
};

function CompanionPage() {
  const list = useServerFn(listCompanionDevices);
  const queue = useServerFn(queueCompanionCommand);
  const stop = useServerFn(stopCompanion);
  const [devices, setDevices] = useState<Device[]>([]);
  const [url, setUrl] = useState("https://example.com");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("جاري تحميل الأجهزة…");

  async function refresh() {
    try {
      setDevices((await list()).map((d) => d as Device));
      setMessage("اختر جهازًا لإرسال أمر آمن");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
    // The initial load is intentionally one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(deviceId: string, kind: "open_chrome" | "open_url" | "back") {
    setBusy(true);
    setMessage("جاري إرسال الأمر…");
    try {
      await queue({ data: { deviceId, kind, payload: kind === "open_url" ? { url } : {} } });
      setMessage("تم تسجيل الأمر. الأوامر الحساسة تحتاج موافقة.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function halt(deviceId: string) {
    setBusy(true);
    try {
      await stop({ data: { deviceId } });
      setMessage("تم إرسال أمر الإيقاف");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-5 p-5">
      <header>
        <h1 className="text-2xl font-bold">ربط هاتف Oppo</h1>
        <p className="text-sm text-muted-foreground">
          لوحة التحكم تبقى على Lovable. التطبيق المثبت على الهاتف ينفذ الأوامر بعد تفعيل
          Accessibility.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm">{message}</p>
      </div>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="رابط HTTPS لفتحه في Chrome"
        dir="ltr"
      />
      {devices.length === 0 ? (
        <div className="rounded-lg border p-5 text-sm">
          لا توجد أجهزة مقترنة بعد. ابنِ APK وثبّته ثم استخدم رمز الاقتران.
        </div>
      ) : (
        devices.map((device) => (
          <section key={device.id} className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <b>{device.device_name}</b>
                <p className="text-xs text-muted-foreground">
                  {device.platform} · {device.status}
                </p>
              </div>
              <span
                className={device.status === "online" ? "text-green-600" : "text-muted-foreground"}
              >
                {device.status === "online" ? "متصل" : "غير متصل"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void send(device.id, "open_chrome")}>
                فتح Chrome
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => void send(device.id, "open_url")}
              >
                فتح الرابط
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => void send(device.id, "back")}
              >
                رجوع
              </Button>
              <Button disabled={busy} variant="destructive" onClick={() => void halt(device.id)}>
                إيقاف
              </Button>
            </div>
          </section>
        ))
      )}
    </main>
  );
}
