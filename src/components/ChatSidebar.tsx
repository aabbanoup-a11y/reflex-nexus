import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Clock3,
  Folder,
  Image,
  Laptop,
  Menu,
  MessageSquare,
  Pencil,
  Plug,
  Search,
  Settings,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/runtime-client";
import { useAuth } from "@/hooks/useAuth";

type Conversation = { id: string; title: string | null; created_at: string };

type NavItem = { label: string; icon: typeof Image; to: string };
const navItems: NavItem[] = [
  { label: "Images", icon: Image, to: "/images" },
  { label: "Library", icon: BookOpen, to: "/library" },
  { label: "Projects", icon: Folder, to: "/projects" },
  { label: "Remote", icon: Laptop, to: "/remote" },
  { label: "Scheduled", icon: Clock3, to: "/scheduled" },
  { label: "Plugins", icon: Plug, to: "/plugins" },
];

export function ChatSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const touchStart = useRef<number | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) {
      console.warn("تعذر تحميل المحادثات", error.message);
      return;
    }
    setConversations((data ?? []) as Conversation[]);
  }, [user]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations, location.pathname]);

  const createConversation = async () => {
    if (!user) {
      toast.error("سجّل دخول الأول عشان تبدأ محادثة");
      void navigate({ to: "/auth" });
      return;
    }
    const branchId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    const db = supabase as any;
    const branch = await db.from("memory_branches").insert({ id: branchId, user_id: user.id, name: "فرع محادثة جديدة", root_context: "" }).select("id").single();
    if (branch.error) { toast.error(branch.error.message); return; }
    const { data, error } = await db.from("conversations").insert({ id: conversationId, title: "محادثة جديدة", user_id: user.id, branch_id: branchId }).select("id").single();
    if (error || !data) { toast.error(error?.message ?? "ما قدرتش أبدأ المحادثة"); return; }
    await db.from("memory_branches").update({ conversation_id: conversationId }).eq("id", branchId).eq("user_id", user.id);
    setOpen(false);
    await navigate({ to: "/chat/$id", params: { id: data.id } });
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
    if (delta > 60) setOpen(true);
    if (delta < -60) setOpen(false);
    touchStart.current = null;
  };

  return (
    <>
      <button
        type="button"
        aria-label="فتح القائمة"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 rounded-xl border border-white/10 bg-[#171717] p-2 text-white shadow-lg lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      {open && <button aria-label="إغلاق القائمة" className="fixed inset-0 z-40 bg-black/55 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        dir="ltr"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-[#171717] px-3 py-4 text-[#ececec] shadow-2xl transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2 pb-4">
          <Link to="/chat" onClick={() => setOpen(false)} className="flex items-center gap-3 text-[15px] font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#19c37d] via-[#3b82f6] to-[#8b5cf6] text-sm font-bold">C</span>
            ChatGPT
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#9b9b9b] hover:bg-white/10 hover:text-white lg:hidden" aria-label="إغلاق">
            <X className="size-5" />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="hidden rounded-lg p-2 text-[#9b9b9b] hover:bg-white/10 hover:text-white lg:block" aria-label="إخفاء القائمة">
            <Menu className="size-5" />
          </button>
        </div>

        <nav className="space-y-1">
          <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#d9d9d9] hover:bg-[#2a2a2a]" onClick={() => toast.info("اكتب كلمة البحث في شريط المحادثات") }>
            <Search className="size-[18px]" /> <span>Search</span>
          </button>
          {navItems.map(({ label, icon: Icon, to }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#d9d9d9] hover:bg-[#2a2a2a]">
              <Icon className="size-[18px]" /> <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="my-4 border-t border-[#3b3b3b]" />
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#8e8e8e]">Chats</div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {conversations.length === 0 ? <p className="px-3 py-2 text-xs text-[#777]">مفيش محادثات لسه</p> : conversations.map((conversation) => (
            <Link key={conversation.id} to="/chat/$id" params={{ id: conversation.id }} onClick={() => setOpen(false)} className="block truncate rounded-lg px-3 py-2 text-[13px] text-[#a8a8a8] hover:bg-[#2a2a2a] hover:text-white">
              {conversation.title || "محادثة جديدة"}
            </Link>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-[#3b3b3b] pt-3">
          <div className="flex items-center justify-between px-1">
            <button type="button" onClick={() => toast.info("زر الصوت جاهز للمحادثة الصوتية")} className="grid size-8 place-items-center rounded-full bg-[#2563eb] text-white hover:bg-[#3b82f6]" aria-label="صوت"><Volume2 className="size-4" /></button>
            <button type="button" onClick={() => toast.info("الإعدادات هتتوفر قريبًا")} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#b8b8b8] hover:bg-[#2a2a2a] hover:text-white"><Settings className="size-4" /> Settings</button>
          </div>
          <button type="button" onClick={() => void createConversation()} className="flex w-full items-center justify-between rounded-lg bg-[#3b82f6] px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 hover:bg-[#2563eb]"><span className="flex items-center gap-2"><MessageSquare className="size-4" /> Chat</span><Pencil className="size-4" /></button>
        </div>
      </aside>
    </>
  );
}
