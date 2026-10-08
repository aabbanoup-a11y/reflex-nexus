import { createServerFn } from "@tanstack/react-start";

export type AIRoutingStatus = {
  router: "active" | "fallback";
  gateway: "active" | "fallback";
  gatewayId: string;
  message: string;
};

export const getAIRoutingStatus = createServerFn({ method: "GET" }).handler(async (): Promise<AIRoutingStatus> => {
  const nativeReady = Boolean(process.env["CLOUDFLARE_API_TOKEN"]?.trim() && process.env["CLOUDFLARE_ACCOUNT_ID"]?.trim());
  const gatewayId = process.env["CLOUDFLARE_AI_GATEWAY_ID"]?.trim() || "default";
  return nativeReady
    ? { router: "active", gateway: "active", gatewayId, message: "Cloudflare AI Router + AI Gateway يعملان" }
    : { router: "fallback", gateway: "fallback", gatewayId, message: "مسار Cloudflare الموصل يعمل، وتفعيل Gateway الأصلي يحتاج متغيرات الحساب" };
});
