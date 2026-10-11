import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function WorkspacePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main dir="rtl" className="flex min-h-screen flex-1 items-center justify-center bg-[#212121] px-6 text-white">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[#a0a0a0]">{description}</p>
        <Link to="/chat" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold hover:bg-[#2563eb]">العودة للشات <ArrowLeft className="size-4" /></Link>
      </div>
    </main>
  );
}
