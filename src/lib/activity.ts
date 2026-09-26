// Browser helpers: persist every AI run + notify when a task finishes.
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type RunLog = {
  agent_kind: "assistant" | "employee" | "team";
  agent_key: string;
  agent_name: string;
  model?: string;
  prompt: string;
  reply?: string;
  status: "done" | "error";
};

export async function logRun(run: RunLog) {
  const { error } = await (supabase as any).from("ai_runs").insert({
    ...run,
    prompt: run.prompt.slice(0, 19000),
    reply: run.reply?.slice(0, 59000) ?? null,
  });
  if (error) console.warn("log failed", error.message);
}

export function requestNotifyPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") void Notification.requestPermission();
}

export function notifyDone(title: string, body: string, ok = true) {
  if (ok) toast.success(title, { description: body.slice(0, 120) });
  else toast.error(title, { description: body.slice(0, 120) });
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.hidden) {
    try {
      new Notification(title, { body: body.slice(0, 160) });
    } catch {
      // ignore
    }
  }
}
