import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  Bot,
  Brain,
  CalendarDays,
  Folder,
  Home,
  Image,
  Laptop,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  Moon,
  Network,
  Plug,
  Plus,
  Sparkles,
  Smartphone,
  Sun,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/runtime-client";
import { useAuth } from "@/hooks/useAuth";

type Conversation = { id: string; title: string | null; created_at: string };
type NavItem = { label: string; icon: LucideIcon; to: string };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "الذكاء والتنفيذ",
    items: [
      { label: "المساعد الذكي", icon: Sparkles, to: "/assistant" },
      { label: "شبكة النماذج", icon: Network, to: "/network" },
      { label: "الوكلاء", icon: Bot, to: "/agent" },
      { label: "التخطيط والمهام", icon: CalendarDays, to: "/scheduled" },
      { label: "سجل النشاط", icon: Activity, to: "/history" },
    ],
  },
  {
    label: "المعرفة والمساحات",
    items: [
      { label: "الذاكرة", icon: Brain, to: "/_authenticated/memory" },
      { label: "المشروعات", icon: Folder, to: "/projects" },
      { label: "المكتبة", icon: BookOpen, to: "/library" },
      { label: "الصور والمخرجات", icon: Image, to: "/images" },
    ],
  },
  {
    label: "الأجهزة والتكاملات",
    items: [
      { label: "أجهزة متصلة", icon: Smartphone, to: "/_authenticated/companion" },
      { label: "المتصفح السحابي", icon: Laptop, to: "/remote" },
      { label: "التكاملات", icon: Plug, to: "/plugins" },
    ],
  },
];

function isActivePath(pathname: string, target: string) {
  return target === "/"
    ? pathname === "/"
    : pathname === target || pathname.startsWith(target + "/");
}

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

export function ChatSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }

    const { data, error } = await (supabase as any)
      .from("conversations")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.warn("تعذر تحميل المحادثات", error.message);
      return;
    }

    setConversations((data ?? []) as Conversation[]);
  }, [user]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations, location.pathname]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("abanoubai-theme-v1");
      const selected = saved === "light" ? "light" : "dark";
      setTheme(selected);
      applyTheme(selected);
    } catch {
      applyTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem("abanoubai-theme-v1", next);
    } catch {
      toast.error("تعذر حفظ اختيار المظهر على هذا الجهاز");
    }
  };

  const createConversation = async () => {
    if (!user) {
      toast.error("سجّل الدخول أولًا لبدء محادثة محفوظة");
      void navigate({ to: "/auth" });
      return;
    }

    const branchId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    const db = supabase as any;
    const branch = await db
      .from("memory_branches")
      .insert({ id: branchId, user_id: user.id, name: "فرع محادثة جديدة", root_context: "" })
      .select("id")
      .single();

    if (branch.error) {
      toast.error(branch.error.message);
      return;
    }

    const { data, error } = await db
      .from("conversations")
      .insert({ id: conversationId, title: "محادثة جديدة", user_id: user.id, branch_id: branchId })
      .select("id")
      .single();

    if (error || !data) {
      toast.error(error?.message ?? "تعذر إنشاء المحادثة");
      return;
    }

    await db
      .from("memory_branches")
      .update({ conversation_id: conversationId })
      .eq("id", branchId)
      .eq("user_id", user.id);

    setOpen(false);
    await navigate({ to: "/chat/$id", params: { id: data.id } });
  };

  const closeDrawer = () => setOpen(false);
  const initials = user?.email?.slice(0, 1)?.toUpperCase() ?? "A";

  return (
    <>
      <button
        type="button"
        aria-label="فتح القائمة الجانبية"
        aria-controls="abanoubai-sidebar"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 grid size-11 place-items-center rounded-2xl border border-border bg-card/95 text-foreground shadow-lg backdrop-blur lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <button
          type="button"
          aria-label="إغلاق القائمة الجانبية"
          onClick={closeDrawer}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        id="abanoubai-sidebar"
        dir="rtl"
        aria-label="القائمة الرئيسية"
        className={[
          "fixed inset-y-0 right-0 z-50 flex w-[min(88vw,296px)] flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
          "lg:w-[288px] lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-5">
          <Link to="/" onClick={closeDrawer} className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-offset-4">
            <img src="/abanoubai-mark.svg" alt="" className="size-11 shrink-0 rounded-2xl" />
            <span className="min-w-0">
              <span className="block truncate text-[16px] font-bold tracking-tight">AbanoubAI</span>
              <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
                نظام الذكاء والتنفيذ الشخصي
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="إغلاق القائمة"
            className="grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <Link
            to="/"
            onClick={closeDrawer}
            aria-current={isActivePath(location.pathname, "/") ? "page" : undefined}
            className={[
              "flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition-colors",
              isActivePath(location.pathname, "/")
                ? "border-primary/35 bg-primary/12 text-primary shadow-sm"
                : "border-transparent text-sidebar-foreground/85 hover:bg-sidebar-accent",
            ].join(" ")}
          >
            <span className="grid size-8 place-items-center rounded-xl bg-primary/12">
              <Home className="size-[18px]" />
            </span>
            <span>الرئيسية</span>
          </Link>
        </div>

        <nav aria-label="وجهات AbanoubAI" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
          {navGroups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 px-3 text-[10px] font-bold tracking-[0.12em] text-muted-foreground">
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.items.map(({ label, icon: Icon, to }) => {
                  const active = isActivePath(location.pathname, to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeDrawer}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-inset ring-primary/25"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      ].join(" ")}
                    >
                      <Icon className={active ? "size-[18px] text-primary" : "size-[18px] text-muted-foreground transition-colors group-hover:text-primary"} />
                      <span className="flex-1">{label}</span>
                      {active && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          {conversations.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2 px-3">
                <MessageSquare className="size-3.5 text-muted-foreground" />
                <h2 className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground">محادثات حديثة</h2>
              </div>
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    to="/chat/$id"
                    params={{ id: conversation.id }}
                    onClick={closeDrawer}
                    className="block truncate rounded-xl px-3.5 py-2 text-xs text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {conversation.title || "محادثة جديدة"}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center justify-between rounded-xl bg-sidebar-accent/70 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full border border-primary/35 bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">
                  {user?.email ? user.email.split("@")[0] : "مساحة العمل"}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {user ? "حسابك الشخصي" : "تصفح قبل تسجيل الدخول"}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "تفعيل المظهر الفاتح" : "تفعيل المظهر الداكن"}
              aria-pressed={theme === "light"}
              title={theme === "dark" ? "المظهر الفاتح" : "المظهر الداكن"}
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-sidebar-border bg-card text-primary transition hover:border-primary/45"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void createConversation()}
            className="flex min-h-11 w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-black/15 transition hover:brightness-105 focus-visible:outline-offset-4"
          >
            <span className="flex items-center gap-2">
              <MessageSquarePlus className="size-[18px]" />
              محادثة جديدة
            </span>
            <Plus className="size-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
