// Browser-safe registry of the 30 network models.
// cf/* = Cloudflare Workers AI on the user's own Cloudflare account (not Lovable credit).

export type NetModel = {
  id: string;
  label: string;
  provider: "cloudflare" | "google" | "openai" | "anthropic";
  browser?: boolean;
};

export const NET_MODELS: NetModel[] = [
  // 12 Cloudflare (your account)
  { id: "cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast", label: "Llama 3.3 70B", provider: "cloudflare" },
  { id: "cf/@cf/meta/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout (متصفح)", provider: "cloudflare", browser: true },
  { id: "cf/@cf/qwen/qwen3-30b-a3b-fp8", label: "Qwen 3", provider: "cloudflare" },
  { id: "cf/@cf/mistralai/mistral-small-3.1-24b-instruct", label: "Mistral Small", provider: "cloudflare" },
  { id: "cf/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", label: "DeepSeek R1", provider: "cloudflare" },
  { id: "cf/@cf/qwen/qwq-32b", label: "QwQ 32B", provider: "cloudflare" },
  { id: "cf/@cf/qwen/qwen2.5-coder-32b-instruct", label: "Qwen Coder", provider: "cloudflare" },
  { id: "cf/@cf/meta/llama-3.1-8b-instruct-fast", label: "Llama 3.1 8B", provider: "cloudflare" },
  { id: "cf/@cf/openai/gpt-oss-20b", label: "GPT-OSS 20B", provider: "cloudflare" },
  { id: "cf/@cf/openai/gpt-oss-120b", label: "GPT-OSS 120B", provider: "cloudflare" },
  { id: "cf/@cf/ibm-granite/granite-4.0-h-micro", label: "Granite 4", provider: "cloudflare" },
  { id: "cf/@cf/meta/llama-3.2-3b-instruct", label: "Llama 3.2 3B", provider: "cloudflare" },
  // 18 Lovable AI
  { id: "google/gemini-3.1-flash-lite", label: "جيميني لايت (متصفح)", provider: "google", browser: true },
  { id: "google/gemini-3.8-flash", label: "جيميني 3.8 فلاش", provider: "google" },
  { id: "google/gemini-3.7-flash", label: "جيميني 3.7 فلاش", provider: "google" },
  { id: "google/gemini-3-flash-preview", label: "جيميني 3 فلاش", provider: "google" },
  { id: "google/gemini-3.6-flash", label: "جيميني 3.6 فلاش", provider: "google" },
  { id: "google/gemini-3.1-pro-preview", label: "جيميني برو", provider: "google" },
  { id: "openai/gpt-6-astra", label: "GPT-6 أسترا", provider: "openai" },
  { id: "openai/gpt-5-nano", label: "GPT-5 نانو", provider: "openai" },
  { id: "openai/gpt-5.4-nano", label: "GPT-5.4 نانو", provider: "openai" },
  { id: "openai/gpt-5.6-luna", label: "GPT-5.6 لونا", provider: "openai" },
  { id: "openai/gpt-6-luna", label: "GPT-6 لونا", provider: "openai" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 ميني", provider: "openai" },
  { id: "openai/gpt-5.6-terra", label: "GPT-5.6 تيرا", provider: "openai" },
  { id: "openai/chat-latest", label: "ChatGPT", provider: "openai" },
  { id: "openai/gpt-6-sol", label: "GPT-6 سول", provider: "openai" },
  { id: "openai/gpt-5.4", label: "GPT-5.4", provider: "openai" },
  { id: "anthropic/claude-haiku-4-5", label: "كلود هايكو", provider: "anthropic" },
  { id: "anthropic/claude-sonnet-5", label: "كلود سونيت", provider: "anthropic" },
];

export const netLabel = (id: string) => NET_MODELS.find((m) => m.id === id)?.label ?? id;

// Deterministic spread of the 30 models over employees / assistants.
export function modelForKey(key: string) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return NET_MODELS[h % NET_MODELS.length]!.id;
}

export const REPOS = ["aabbanoup-a11y/abra-cadabra-repo", "aabbanoup-a11y/AbanoupAi"] as const;
export const WORK_BRANCH = "ai-team";
