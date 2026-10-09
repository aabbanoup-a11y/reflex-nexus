import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";

export const Route = createFileRoute("/chat")({ component: NewChatPage });

function NewChatPage() {
  return (
    <main dir="rtl" className="flex min-h-screen flex-1 items-center justify-center bg-[#212121] px-6 text-white">
      <div className="text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-[#2f2f2f] text-[#9b9b9b]"><MessageSquarePlus className="size-8" /></div>
        <h1 className="text-2xl font-semibold">ابدأ محادثة جديدة</h1>
        <p className="mt-2 text-sm text-[#a0a0a0]">استخدم زر Chat في القائمة الجانبية لإنشاء محادثة وحفظها.</p>
        <Link to="/chat" className="sr-only">محادثة جديدة</Link>
      </div>
    </main>
  );
}
