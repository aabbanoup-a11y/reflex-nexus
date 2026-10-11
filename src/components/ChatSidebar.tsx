import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Image, Library, Folder, Laptop, Clock3, Plug, Settings, Pencil, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/runtime-client";

type Conversation = { id: string; title: string; updated_at: string; created_at: string };

type MenuItem = { label: string; icon: typeof Image; section: string };
const menu: MenuItem[] = [
  { label: "Images", icon: Image, section: "images" },
  { label: "Library", icon: Library, section: "library" },
  { label: "Projects", icon: Folder, section: "projects" },
  { label: "Remote", icon: Laptop, section: "remote" },
  { label: "Scheduled", icon: Clock3, section: "scheduled" },
  { label: "Plugins", icon: Plug, section: "plugins" },
];

export function ChatSidebar() {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [busy, setBusy] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const loadConversations = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data, error } = await (supabase as any).from("conversations").select("id,title,updated_at,created_at").eq("user_id", uid).order("updated_at", { ascending: false }).limit(10);
    if (!error && data) { setConversations(data as Conversation[]); return; }
    // Until the migration is applied, show existing agent paths as useful chat history.
    const fallback = await (supabase as any).from("agent_paths").select("id,name,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(10);
    setConversations((fallback.data ?? []).map((row: any) => ({ id: row.id, title: row.name, created_at: row.created_at, updated_at: row.created_at })));
  };

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => { touchStart.current = { x: event.clientX, y: event.clientY }; };
    const onPointerUp = (event: PointerEvent) => {
      const start = touchStart.current; touchStart.current = null;
      if (!start || Math.abs(event.clientY - start.y) > 100) return;
      const delta = event.clientX - start.x;
      if (!open && start.x < 32 && delta > 56) setOpen(true);
      if (open && start.x < 360 && delta < -56) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown); window.addEventListener("pointerup", onPointerUp);
    return () => { window.removeEventListener("pointerdown", onPointerDown); window.removeEventListener("pointerup", onPointerUp); };
  }, [open]);

  const createChat = async () => {
    if (busy) return; setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser(); const uid = userData.user?.id;
      if (!uid) { window.location.assign("/auth"); return; }
      const conversationId = crypto.randomUUID(); const branchId = crypto.randomUUID();
      const db = supabase as any;
      const branch = await db.from("memory_branches").insert({ id: branchId, user_id: uid, name: "فرع محادثة جديدة", root_context: "" }).select("id").single();
      if (branch.error) throw new Error(branch.error.message);
      const conversation = await db.from("conversations").insert({ id: conversationId, user_id: uid, title: "محادثة جديدة", branch_id: branchId }).select("id").single();
      if (conversation.error) throw new Error(conversation.error.message);
      await db.from("memory_branches").update({ conversation_id: conversationId }).eq("id", branchId).eq("user_id", uid);
      window.location.assign(`/chat/${conversationId}`);
    } catch (error) { console.error("new chat", error); setBusy(false); }
  };

  const shown = conversations.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
  return (
    <>
      {!open && <button type="button" aria-label="فتح القائمة الجانبية" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#171717] text-white shadow-xl"><MessageCircle className="h-6 w-6" /></button>}
      {open && <button type="button" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/45" />}
      <aside dir="ltr" aria-label="ChatGPT sidebar" className={`fixed left-0 top-0 z-50 flex h-dvh w-[min(350px,88vw)] flex-col bg-[#171717] text-white shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <header className="flex items-center justify-between px-5 pb-5 pt-7">
          <button type="button" aria-label="بحث في المحادثات" onClick={() => setSearching((value) => !value)} className="rounded-full p-3 text-white/90 hover:bg-white/10"><Search className="h-7 w-7" /></button>
          <div className="flex items-center gap-2 text-[27px] font-semibold tracking-tight">ChatGPT <span className="h-2.5 w-2.5 rounded-full bg-white/80" /></div>
          <button type="button" aria-label="إغلاق" onClick={() => setOpen(false)} className="rounded-full p-2 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </header>
        {searching && <div className="px-5 pb-3"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث في المحادثات" className="w-full rounded-xl border border-white/15 bg-[#252525] px-3 py-2 text-right text-sm outline-none placeholder:text-white/45" /></div>}
        <nav className="space-y-1 px-5" aria-label="أدوات ChatGPT">
          {menu.map(({ label, icon: Icon, section }) => <a key={section} href={`/paths-ui?section=${section}`} className="flex items-center justify-between rounded-xl px-4 py-3 text-[22px] font-semibold text-white/95 transition hover:bg-white/10"><span>{label}</span><Icon className="h-7 w-7" strokeWidth={1.8} /></a>)}
        </nav>
        <div className="mx-5 my-6 border-t border-white/20" />
        <div className="min-h-0 flex-1 overflow-y-auto px-5" dir="rtl">
          <div className="space-y-1">{shown.map((chat) => <Link key={chat.id} to="/chat/$id" params={{ id: chat.id }} onClick={() => setOpen(false)} className="block truncate rounded-lg px-3 py-3 text-right text-[18px] text-white/90 hover:bg-white/10">{chat.title || "محادثة جديدة"}</Link>)}</div>
          {!shown.length && <p className="px-3 py-4 text-right text-sm text-white/45">لا توجد محادثات بعد</p>}
        </div>
        <footer className="flex items-center gap-3 px-5 pb-7 pt-4" dir="rtl">
          <button type="button" disabled={busy} onClick={() => void createChat()} className="flex flex-1 items-center justify-center gap-3 rounded-full bg-[#0A84FF] px-5 py-4 text-[22px] font-semibold text-white shadow-lg transition hover:bg-[#2b94ff] disabled:opacity-60">Chat <Pencil className="h-6 w-6" /></button>
          <a href="/paths-ui?section=settings" aria-label="الإعدادات" className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-[#252525] text-white hover:bg-white/10"><Settings className="h-8 w-8" /></a>
        </footer>
      </aside>
    </>
  );
}
