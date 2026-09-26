import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { label: "شهيق", secs: 4 },
  { label: "اثبت", secs: 4 },
  { label: "زفير", secs: 6 },
];

export function BreathingExercise() {
  const [on, setOn] = useState(false);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(STEPS[0]!.secs);
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        setI((x) => {
          const n = (x + 1) % STEPS.length;
          if (n === 0) setRounds((r) => r + 1);
          setLeft(STEPS[n]!.secs);
          return n;
        });
        return l;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [on]);

  const step = STEPS[i]!;
  const scale = step.label === "شهيق" ? "scale-110" : step.label === "زفير" ? "scale-75" : "scale-100";

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-sm font-medium">تمرين تنفّس 4-4-6</p>
      <div className={`mx-auto my-4 flex size-28 items-center justify-center rounded-full bg-primary/20 transition-transform duration-1000 ${on ? scale : ""}`}>
        <div>
          <p className="font-bold">{on ? step.label : "جاهز؟"}</p>
          {on && <p className="text-2xl">{left}</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">جولات: {rounds}</p>
      <Button className="mt-2" size="sm" variant={on ? "outline" : "default"} onClick={() => { setOn(!on); setI(0); setLeft(STEPS[0]!.secs); }}>
        {on ? "إيقاف" : "ابدأ"}
      </Button>
    </div>
  );
}
