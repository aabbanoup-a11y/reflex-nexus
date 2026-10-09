import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Paperclip, Send, Volume2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/runtime-client";
import { useAuth } from "@/hooks/useAuth";
import { askAssistant } from "@/lib/chat.functions";
import { assistantFallback, basicReply, isYouTubeRequest, type ChatTurn } from "@/lib/chat-assistant";

type Message = { id: string; role: "user" | "assistant" | "system"; content: string; created_at: string };

export const Route = createFileRoute("/chat/$id")({ component: ChatPage, ssr: false });

function ChatPage() {
  const { id } = Route.useParams();
  const { user, ready } = useAuth();
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("محادثة جديدة");
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !ready) return;
    let cancelled = false;
    void (async () => {
      const [{ data: conversation, error: conversationError }, { data: rows, error }] = await Promise.all([
        supabase.from("conversations").select("title").eq("id", id).maybeSingle(),
        supabase.from("messages").select("id,role,content,created_at").eq("conversation_id", id).order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (conversationError || error) {
        toast.error("ما قدرتش أحمّل المحادثة");
        return;
      }
      if (!conversation) {
        toast.error("المحادثة دي مش موجودة");
        return;
      }
      setTitle(conversation.title || "محادثة جديدة");
      setMessages((rows ?? []) as Message[]);
    })();
    return () => { cancelled = true; };
  }, [id, ready, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading || !user) return;
    setInput("");
    setLoading(true);
    const localUserMessage: Message = { id: crypto.randomUUID(), role: "user", content: prompt, created_at: new Date().toISOString() };
    setMessages((current) => [...current, localUserMessage]);

    const { data: saved, error: saveError } = await supabase.from("messages").insert({ conversation_id: id, user_id: user.id, role: "user", content: prompt }).select("id,role,content,created_at").single();
    if (saveError) {
      toast.error("الرسالة ما اتحفظتش");
      setLoading(false);
      return;
    }
    if (saved) setMessages((current) => current.map((message) => message.id === localUserMessage.id ? saved as Message : message));
    if (messages.length === 0) {
      const nextTitle = prompt.slice(0, 42) || "محادثة جديدة";
      setTitle(nextTitle);
      void supabase.from("conversations").update({ title: nextTitle, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    }

    const history: ChatTurn[] = [...messages, localUserMessage].map(({ role, content }) => ({ role: role === "system" ? "assistant" : role, content }));
    let reply = basicReply(prompt);
    let model = "basic-local";
    if (isYouTubeRequest(prompt)) {
      reply = await assistantFallback(prompt, history, id, user.id);
      model = "phone-command-fallback";
    } else {
      try {
        const cloud = await ask({ data: { system: "أنت مساعد عربي ودود وعملي. أجب بالعربية المصرية باختصار مفيد.", model: "google/gemini-3.8-flash", fallbacks: [], messages: history, attachments: [], memories: [] } });
        if (cloud.text?.trim()) {
          reply = cloud.text.trim();
          model = cloud.model;
        }
      } catch {
        reply = await assistantFallback(prompt, history, id, user.id);
        model = "local-or-basic-fallback";
      }
    }
    const { data: savedReply, error: replyError } = await supabase.from("messages").insert({ conversation_id: id, user_id: user.id, role: "assistant", content: reply }).select("id,role,content,created_at").single();
    if (replyError) toast.error("الرد ظهر محليًا لكن ما اتحفظش في Supabase");
    setMessages((current) => [...current, (savedReply as Message | null) ?? { id: crypto.randomUUID(), role: "assistant", content: reply, created_at: new Date().toISOString() }]);
    void model;
    setLoading(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  if (!ready) return <main className="grid min-h-screen flex-1 place-items-center bg-[#212121] text-white"><Loader2 className="size-6 animate-spin" /></main>;
  if (!user) return <main dir="rtl" className="flex min-h-screen flex-1 items-center justify-center bg-[#212121] text-white"><Link to="/auth" className="rounded-lg bg-blue-600 px-4 py-2">سجّل دخول عشان تفتح الشات</Link></main>;

  return (
    <main dir="rtl" className="flex min-h-screen flex-1 flex-col bg-[#212121] text-[#ececec]">
      <header className="flex h-14 items-center gap-3 border-b border-[#3b3b3b] px-5">
        <Link to="/chat" className="rounded-lg p-2 text-[#aaa] hover:bg-[#2f2f2f]" aria-label="رجوع"><ArrowRight className="size-5" /></Link>
        <h1 className="truncate text-sm font-semibold">{title}</h1>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-4 py-8">
        {messages.length === 0 && <div className="flex flex-1 items-center justify-center text-center"><div><h2 className="text-2xl font-semibold">إزاي أقدر أساعدك؟</h2><p className="mt-2 text-sm text-[#a0a0a0]">اكتب رسالتك تحت وهنبدأ المحادثة.</p></div></div>}
        <div className="space-y-6">
          {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-7 ${message.role === "user" ? "bg-[#2f2f2f] text-white" : "bg-transparent text-[#ececec]"}`}>{message.content}</div></div>)}
          {loading && <div className="flex justify-end"><div className="flex items-center gap-2 text-sm text-[#999]"><Loader2 className="size-4 animate-spin" /> بفكر...</div></div>}
          <div ref={endRef} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-5">
        <div className="flex items-end gap-2 rounded-2xl border border-[#4b4b4b] bg-[#2f2f2f] p-2 shadow-xl">
          <input ref={fileRef} type="file" className="hidden" onChange={() => toast.info("المرفقات هتتضاف قريبًا")} />
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl p-2 text-[#aaa] hover:bg-[#444] hover:text-white" aria-label="مرفقات"><Paperclip className="size-5" /></button>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} rows={1} placeholder="اكتب رسالة..." className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#858585]" />
          <button type="button" onClick={() => { setListening((value) => !value); toast.info("الإدخال الصوتي متاح من جهازك"); }} className={`rounded-xl p-2 hover:bg-[#444] ${listening ? "text-blue-400" : "text-[#aaa]"}`} aria-label="صوت"><Volume2 className="size-5" /></button>
          <button type="button" disabled={loading || !input.trim()} onClick={() => void send()} className="rounded-xl bg-white p-2 text-black transition hover:bg-[#ddd] disabled:cursor-not-allowed disabled:opacity-40" aria-label="إرسال"><Send className="size-5" /></button>
        </div>
        <p className="mt-2 text-center text-[11px] text-[#777]">قد يخطئ المساعد، راجع المعلومات المهمة.</p>
      </div>
    </main>
  );
}
