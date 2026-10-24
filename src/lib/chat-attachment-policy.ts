/**
 * Validate a chat attachment's object key before the privileged storage client is used.
 * Storage keys are not filesystem paths, but reject ambiguous empty/dot/backslash segments
 * so ownership checks cannot be confused by path normalization.
 */
export function isOwnedChatAttachmentPath(path: unknown, userId: unknown): path is string {
  if (typeof path !== "string" || typeof userId !== "string" || !userId) return false;
  if (path.length > 2048) return false;

  const prefix = "u/" + userId + "/";
  if (!path.startsWith(prefix)) return false;

  const relative = path.slice(prefix.length);
  if (!relative || relative.includes("\\") || /[\u0000-\u001f\u007f]/.test(relative)) return false;

  const segments = relative.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}
