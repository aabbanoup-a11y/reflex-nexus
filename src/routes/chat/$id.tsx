import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Send, Menu } from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Textarea } from "@/components/ui/textarea";
import { askAssistant } from "@/lib/chat.functions";
import { addMemoryNode, buildContinuationContext, type MemoryNode } from "@/core/continuation-memory";
import { supabase } from "@/integrations/supabase/runtime-client";

export const Route = createFileRoute("/chat/$id")({ component: ChatConversation });
type Message = { id: string; role: "user" | "assistant" | "system"; content: string; model?: string | null; created_at: string };

function ChatConversation() {
  const { id } = Route.useParams();
  const ask = useServerFn(askAssistant);
  const [title, setTitle] = useState("محادثة جديدة");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const db = supabase as any;

  useEffect(() => {
    void (async () => {
      const [{ data: userData }, conversation, rows] = await Promise.all([
        supabase.auth.getUser(),
        db.from("conversations").select("title").eq("id", id).maybeSingle(),
        db.from("conversation_messages").select("id,role,content,model,created_at").eq("conversation_id", id).order("created_at", { ascending: true }).limit(200),
      ]);
      setUid(userData.user?.id ?? null); setTitle(conversation.data?.title ?? "محادثة جديدة"); setMessages((rows.data ?? []) as Message[]);
    })();
  }, [id]);

  const memory = useMemo<MemoryNode[]>(() => messages.map((message) => ({ id: message.id, parentId: null, kind: message.role === "user" ? "request" : message.role === "assistant" ? "result" : "plan", content: message.content, createdAt: message.created_at })), [messages]);
  const context = buildContinuationContext(memory, 14);

  const send = async () => {
    const text = input.trim(); if (!text || busy || !uid) return;
    setInput(""); setBusy(true); setNotice("");
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((old) => [...old, userMessage]);
    const nextMemory = addMemoryNode(memory, { id: userMessage.id, parentId: null, kind: "request", content: text });
    try {
      const result = await ask({ data: { system: `أنت AbanoupAi داخل محادثة مستمرة. استخدم سياق الفرع التالي ولا تكرر ما سبق إلا عند الحاجة. رد بالعربية المصرية بوضوح.\n${buildContinuationContext(nextMemory, 14)}`, messages: [...messages.slice(-14).map((message) => ({ role: message.role as "user" | "assistant", content: message.content })), { role: "user", content: text }], model: "openai/chat-latest", fallbacks: ["google/gemini-3.8-flash", "anthropic/claude-sonnet-5"], attachments: [], memories: [context] } });
      const assistant: Message = { id: crypto.randomUUID(), role: "assistant", content: result.text, model: result.model, created_at: new Date().toISOString() };
      setMessages((old) => [...old, assistant]);
      await db.from("conversation_messages").insert([{ id: userMessage.id, conversation_id: id, user_id: uid, role: "user", content: text }, { id: assistant.id, conversation_id: id, user_id: uid, role: "assistant", content: assistant.content, model: assistant.model }]);
      await db.from("conversations").update({ updated_at: new Date().toISOString(), title: title === "محادثة جديدة" ? text.slice(0, 48) : title }).eq("id", id).eq("user_id", uid);
      if (title === "محادثة جديدة") setTitle(text.slice(0, 48));
    } catch (error) { setNotice((error as Error).message); setMessages((old) => old.filter((message) => message.id !== userMessage.id)); }
    finally { setBusy(false); }
  };

  return <div dir="rtl" className="min-h-dvh bg-background text-foreground"><ChatSidebar /><main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 pb-6 pt-5 md:px-8"><header className="flex items-center justify-between border-b pb-4"><div className="flex items-center gap-2"><button type="button" aria-label="فتح القائمة" onClick={() => document.querySelector<HTMLButtonElement>("[aria-label='فتح القائمة الجانبية']")?.click()} className="rounded-full border p-2 md:hidden"><Menu className="h-5 w-5" /></button><Link to="/" className="rounded-full border p-2"><ArrowRight className="h-5 w-5" /></Link><h1 className="text-lg font-semibold">{title}</h1></div><span className="text-xs text-muted-foreground">فرع ذاكرة مستمر</span></header><section className="flex-1 space-y-4 overflow-y-auto py-6">{messages.length === 0 && <div className="mx-auto mt-20 max-w-md text-center text-muted-foreground"><h2 className="text-2xl font-semibold text-foreground">بماذا يمكنني مساعدتك؟</h2><p className="mt-2">هذه محادثة جديدة، وسيتابع AbanoupAi سياقها في فرع ذاكرة مستقل.</p></div>}{messages.map((message) => <article key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.role === "user" ? "mr-auto bg-primary text-primary-foreground" : "ml-auto border bg-card"}`}><p className="whitespace-pre-wrap leading-8">{message.content}</p></article>)}{busy && <div className="ml-auto rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">AbanoupAi يكتب...</div>}</section>{notice && <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">{notice}</div>}<div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm"><Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="اكتب رسالتك..." className="min-h-14 resize-none border-0 shadow-none focus-visible:ring-0" disabled={busy} /><button type="button" aria-label="إرسال" onClick={() => void send()} disabled={busy || !input.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-white disabled:opacity-50"><Send className="h-5 w-5" /></button></div></main></div>;
}
