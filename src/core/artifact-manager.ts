export type ArtifactKind = "image" | "video" | "document" | "code";
export type Artifact = {
  id: string;
  kind: ArtifactKind;
  name: string;
  mime: string;
  status: "ready" | "queued" | "blocked";
  url?: string;
  preview?: string;
  provider?: string;
  createdAt: string;
};

export type ArtifactProvider = {
  generateImage?: (prompt: string) => Promise<{ url: string }>;
  generateVideo?: (prompt: string) => Promise<{ url: string }>;
  createDocument?: (input: {
    title: string;
    markdown: string;
    format: "pdf" | "docx";
  }) => Promise<{ url: string }>;
};

export async function produceArtifact(
  kind: ArtifactKind,
  input: string,
  provider: ArtifactProvider,
): Promise<Artifact> {
  const base = {
    id: crypto.randomUUID(),
    kind,
    name: `${kind}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as Artifact;
  if (kind === "image" && provider.generateImage) {
    const r = await provider.generateImage(input);
    return { ...base, mime: "image/png", status: "ready", url: r.url, provider: "image-tool" };
  }
  if (kind === "video" && provider.generateVideo) {
    const r = await provider.generateVideo(input);
    return {
      ...base,
      mime: "video/mp4",
      status: "ready",
      url: r.url,
      provider: "official-video-connector",
    };
  }
  if (kind === "document" && provider.createDocument) {
    const r = await provider.createDocument({ title: base.name, markdown: input, format: "pdf" });
    return {
      ...base,
      mime: "application/pdf",
      status: "ready",
      url: r.url,
      provider: "document-tool",
    };
  }
  return {
    ...base,
    mime: kind === "code" ? "text/plain" : "application/octet-stream",
    status: "blocked",
    preview: input.slice(0, 4000),
    provider: "not-configured",
  };
}

export function previewCode(code: string, language = "text") {
  return {
    language,
    html: `<pre data-language="${language}"><code>${escapeHtml(code)}</code></pre>`,
  };
}
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
