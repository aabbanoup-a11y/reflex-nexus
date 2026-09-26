import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, Check, X, LogOut } from "lucide-react";
import { getMemoryState, setMemorySettings, saveMemory, deleteMemory } from "@/lib/memory.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MoodTracker } from "@/components/MoodTracker";

export const Route = createFileRoute("/_authenticated/memory")({
  component: MemoryPage,
  head: () => ({
    meta: [
      { title: "ذاكرتي — تفضيلاتي وأهدافي وعاداتي" },
      { name: "description", content: "راجع وعدّل وامسح اللي المساعدين فاكرينه عنك، أو وقّف الذاكرة بالكامل." },
      { property: "og:title", content: "ذاكرتي" },
      { property: "og:description", content: "ذاكرة شخصية مشفّرة تحت تحكمك الكامل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const CATS = { preference: "تفضيل", trait: "صفة", goal: "هدف", habit: "عادة" } as const;
type Cat = keyof typeof CATS;

function MemoryPage() {
  const qc = useQueryClient();
  const get = useServerFn(getMemoryState);
  const setS = useServerFn(setMemorySettings);
  const save = useServerFn(saveMemory);
  const del = useServerFn(deleteMemory);
  const q = useQuery({ queryKey: ["memory"], queryFn: () => get() });
  const [text, setText] = useState("");
  const [cat, setCat] = useState<Cat>("goal");
  const [edit, setEdit] = useState<{ id: string; content: string } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["memory"] });
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    }
  };
  const s = q.data;

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">ذاكرتي</h1>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/assistant">المساعدين</Link></Button>
            <Button size="sm" variant="outline" onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/"))}>
              <LogOut className="size-4" /> خروج
            </Button>
          </div>
        </div>

        {q.isLoading && <p className="mt-6 text-sm text-muted-foreground">بيحمّل...</p>}

        {s && !s.consent && (
          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">توافق إن المساعدين يفتكروا حاجات عنك؟</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              هيتحفظ بس اللي انت توافق عليه (تفضيلات، صفات، أهداف، عادات)، مشفّر، وتقدر تعدّله أو تمسحه أو توقفه في أي وقت. مفيش أي تشخيص.
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => run(() => setS({ data: { consent: true, enabled: true } }), "الذاكرة اشتغلت")}>موافق</Button>
              <Button variant="outline" asChild><Link to="/assistant">لا شكراً</Link></Button>
            </div>
          </div>
        )}

        {s?.consent && (
          <>
            <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium">الذاكرة {s.enabled ? "شغّالة" : "متوقفة"}</p>
                <p className="text-xs text-muted-foreground">لما تتوقف، المساعدين مش هيستخدموها.</p>
              </div>
              <Switch checked={s.enabled} onCheckedChange={(v) => run(() => setS({ data: { consent: true, enabled: v } }), v ? "اشتغلت" : "اتوقفت")} />
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATS) as Cat[]).map((c) => (
                  <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>{CATS[c]}</Button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="مثلاً: عايز أطلع الأول على المدرسة" />
                <Button disabled={!text.trim()} onClick={() => run(() => save({ data: { id: null, category: cat, content: text } }).then(() => setText("")), "اتحفظت")}>إضافة</Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {s.memories.length === 0 && <p className="text-sm text-muted-foreground">لسه مفيش ذكريات.</p>}
              {s.memories.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">{CATS[m.category as Cat] ?? m.category}</span>
                  {edit?.id === m.id ? (
                    <>
                      <Input value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} />
                      <Button size="icon" variant="ghost" aria-label="حفظ" onClick={() => run(() => save({ data: { id: m.id, category: m.category as Cat, content: edit.content } }).then(() => setEdit(null)), "اتعدّلت")}><Check className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="إلغاء" onClick={() => setEdit(null)}><X className="size-4" /></Button>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm">{m.content}</p>
                      <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setEdit({ id: m.id, content: m.content })}><Pencil className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="مسح" onClick={() => confirm("تمسح دي؟") && run(() => del({ data: { id: m.id } }), "اتمسحت")}><Trash2 className="size-4" /></Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => confirm("تمسح كل الذكريات؟") && run(() => del({ data: { id: null } }), "اتمسح الكل")}>مسح الكل</Button>
              <Button variant="outline" onClick={() => confirm("تسحب موافقتك وتمسح كل حاجة؟") && run(async () => { await del({ data: { id: null } }); await setS({ data: { consent: false, enabled: false } }); }, "اتسحبت الموافقة")}>سحب الموافقة</Button>
            </div>
          </>
        )}

        <div className="mt-8"><MoodTracker /></div>
      </div>
    </div>
  );
}
