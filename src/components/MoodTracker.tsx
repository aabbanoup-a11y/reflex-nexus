import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FACES = ["😣", "😕", "😐", "🙂", "😄"];
type Row = { id: string; mood: number; note: string | null; created_at: string };

export function MoodTracker() {
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState("");
  const load = async () => {
    const { data } = await supabase.from("mood_checkins").select("*").order("created_at", { ascending: false }).limit(14);
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => {
    void load();
  }, []);
  const add = async (mood: number) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("سجّل دخول الأول");
    const { error } = await supabase.from("mood_checkins").insert({ user_id: u.user.id, mood, note: note.trim() || null });
    if (error) return toast.error(error.message);
    setNote("");
    toast.success("اتسجل — أي خطوة صغيرة تفرق");
    void load();
  };
  const series = [...rows].reverse();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold">🌿 مزاجك النهاردة</h2>
      <Input className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة اختيارية" />
      <div className="mt-3 flex gap-2">
        {FACES.map((f, i) => (
          <Button key={f} variant="outline" size="lg" onClick={() => add(i + 1)} aria-label={`مزاج ${i + 1}`}>{f}</Button>
        ))}
      </div>
      {series.length > 0 && (
        <div className="mt-4 flex h-24 items-end gap-1">
          {series.map((r) => (
            <div key={r.id} title={`${FACES[r.mood - 1]} ${r.note ?? ""}`} className="flex-1 rounded-t bg-primary/70" style={{ height: `${r.mood * 20}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
