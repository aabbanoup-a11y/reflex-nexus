// Browser-safe registry of the 30 network models.
// cf/* = Cloudflare Workers AI on the user's own Cloudflare account (not Lovable credit).

export type NetModel = {
  id: string;
  label: string;
  provider: "cloudflare" | "google" | "openai" | "anthropic" | "local";
  browser?: boolean;
};

export const MANAGER_ID = "abanoupai/manager";
export const MANAGER_LABEL = "AbanoupAi — المدير";

export const NET_MODELS: NetModel[] = [
  // 16 Cloudflare (your account)
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
  { id: "cf/@cf/google/gemma-3-12b-it", label: "Gemma 3 12B", provider: "cloudflare" },
  { id: "cf/@cf/meta/llama-3.2-11b-vision-instruct", label: "Llama 3.2 Vision", provider: "cloudflare" },
  { id: "cf/@cf/meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B", provider: "cloudflare" },
  { id: "cf/@cf/meta/llama-3.2-1b-instruct", label: "Llama 3.2 1B", provider: "cloudflare" },
  // 24 Lovable AI (incl. strongest)
  { id: "google/gemini-3.1-flash-lite", label: "جيميني لايت (متصفح)", provider: "google", browser: true },
  { id: "google/gemini-3.8-flash", label: "جيميني 3.8 فلاش", provider: "google" },
  { id: "google/gemini-3.7-flash", label: "جيميني 3.7 فلاش", provider: "google" },
  { id: "google/gemini-3-flash-preview", label: "جيميني 3 فلاش", provider: "google" },
  { id: "google/gemini-3.6-flash", label: "جيميني 3.6 فلاش", provider: "google" },
  { id: "google/gemini-3.1-pro-preview", label: "جيميني برو 💪", provider: "google" },
  { id: "openai/gpt-6-astra", label: "GPT-6 أسترا 💪", provider: "openai" },
  { id: "openai/gpt-5-nano", label: "GPT-5 نانو", provider: "openai" },
  { id: "openai/gpt-5.4-nano", label: "GPT-5.4 نانو", provider: "openai" },
  { id: "openai/gpt-5.6-luna", label: "GPT-5.6 لونا", provider: "openai" },
  { id: "openai/gpt-6-luna", label: "GPT-6 لونا", provider: "openai" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 ميني", provider: "openai" },
  { id: "openai/gpt-5.6-terra", label: "GPT-5.6 تيرا", provider: "openai" },
  { id: "openai/chat-latest", label: "ChatGPT", provider: "openai" },
  { id: "openai/gpt-6-sol", label: "GPT-6 سول", provider: "openai" },
  { id: "openai/gpt-5.4", label: "GPT-5.4", provider: "openai" },
  { id: "openai/gpt-5.6-sol", label: "GPT-5.6 سول 💪", provider: "openai" },
  { id: "openai/gpt-5.5", label: "GPT-5.5 💪", provider: "openai" },
  { id: "openai/gpt-5.5-pro", label: "GPT-5.5 برو 💪", provider: "openai" },
  { id: "anthropic/claude-haiku-4-5", label: "كلود هايكو", provider: "anthropic" },
  { id: "anthropic/claude-sonnet-5", label: "كلود سونيت", provider: "anthropic" },
  { id: "anthropic/claude-opus-5", label: "كلود أوبس 5 💪", provider: "anthropic" },
  { id: "anthropic/claude-opus-5-5", label: "كلود أوبس 5.5 💪", provider: "anthropic" },
  { id: "anthropic/claude-fable-5-1", label: "كلود فيبل 💪", provider: "anthropic" },
  // 10 offline: run inside the device's browser (WebGPU) after a one-time download
  { id: "local/Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 1B أوفلاين", provider: "local" },
  { id: "local/Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3B أوفلاين", provider: "local" },
  { id: "local/Qwen2.5-0.5B-Instruct-q4f16_1-MLC", label: "Qwen 0.5B أوفلاين", provider: "local" },
  { id: "local/Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 1.5B أوفلاين", provider: "local" },
  { id: "local/Qwen2.5-3B-Instruct-q4f16_1-MLC", label: "Qwen 3B أوفلاين", provider: "local" },
  { id: "local/Phi-3.5-mini-instruct-q4f16_1-MLC", label: "Phi 3.5 أوفلاين", provider: "local" },
  { id: "local/gemma-2-2b-it-q4f16_1-MLC", label: "Gemma 2B أوفلاين", provider: "local" },
  { id: "local/SmolLM2-1.7B-Instruct-q4f16_1-MLC", label: "SmolLM2 أوفلاين", provider: "local" },
  { id: "local/Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC", label: "Qwen Coder أوفلاين", provider: "local" },
  { id: "local/TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC", label: "TinyLlama أوفلاين", provider: "local" },
];

export const isLocal = (id: string) => id.startsWith("local/");
// When a local model is needed on the server (no device GPU), use this cloud model instead.
export const LOCAL_SERVER_FALLBACK = "cf/@cf/meta/llama-3.1-8b-instruct-fast";

export const netLabel = (id: string) => id === MANAGER_ID ? MANAGER_LABEL : NET_MODELS.find((m) => m.id === id)?.label ?? id;

// Even spread of the 50 models over the 162 employees (by employee number), hash otherwise.
export function modelForKey(key: string) {
  const n = key.match(/\d+/)?.[0];
  if (n) return NET_MODELS[(Number(n) - 1 + NET_MODELS.length) % NET_MODELS.length]!.id;
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return NET_MODELS[h % NET_MODELS.length]!.id;
}

export const REPOS = ["aabbanoup-a11y/abra-cadabra-repo", "aabbanoup-a11y/AbanoupAi"] as const;
export const WORK_BRANCH = "ai-team";
