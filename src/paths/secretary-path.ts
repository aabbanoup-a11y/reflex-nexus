export type WhatsAppMessage = { name?: string; phone?: string; message: string; id: string };
export type SecretaryDeps = {
  readRecentMessages: (limit: number) => Promise<WhatsAppMessage[]>;
  sendReply?: (message: WhatsAppMessage, reply: string) => Promise<void>;
  saveOrder: (order: { name: string; phone: string; message: string }) => Promise<void>;
};

const PRICE_REPLY = "السعر 250 والتوصيل مجاني";

export async function runSecretaryPath(
  deps: SecretaryDeps,
  options: { allowReplies?: boolean } = {},
) {
  const messages = await deps.readRecentMessages(10);
  const matched = messages.filter((m) => /بكام؟|بكم|السعر/i.test(m.message));
  const results = [] as Array<{ id: string; replied: boolean; saved: boolean; reason?: string }>;
  for (const message of matched) {
    const order = {
      name: message.name ?? "غير معروف",
      phone: message.phone ?? "غير معروف",
      message: message.message,
    };
    await deps.saveOrder(order);
    if (options.allowReplies && deps.sendReply) {
      await deps.sendReply(message, PRICE_REPLY);
      results.push({ id: message.id, replied: true, saved: true });
    } else
      results.push({
        id: message.id,
        replied: false,
        saved: true,
        reason: "الرد الخارجي متوقف حتى تفعيل موصل واتساب والموافقة",
      });
  }
  return { scanned: messages.length, matched: matched.length, results };
}
