import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { supabase } from "@/integrations/supabase/runtime-client";

export type LocalArtifact = { blob: Blob; name: string; mime: string };

export function createLocalPdf(title: string, body: string): LocalArtifact {
  const pdf = new jsPDF();
  pdf.setFontSize(18); pdf.text(title || "AbanoupAi", 190, 20, { align: "right" });
  pdf.setFontSize(12);
  const lines = pdf.splitTextToSize(body || "مستند محلي", 170);
  pdf.text(lines, 190, 35, { align: "right", maxWidth: 170 });
  return { blob: pdf.output("blob"), name: `${title || "abanoupai-document"}.pdf`, mime: "application/pdf" };
}

export async function createLocalDocx(title: string, body: string): Promise<LocalArtifact> {
  const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun({ text: title || "AbanoupAi", bold: true, size: 32 })] }), ...body.split(/\n+/).map((line) => new Paragraph(line))] }] });
  return { blob: await Packer.toBlob(doc), name: `${title || "abanoupai-document"}.docx`, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
}

export async function createLocalCanvas(title: string, body: string): Promise<LocalArtifact> {
  const canvas = document.createElement("canvas"); canvas.width = 1400; canvas.height = 900;
  const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f766e"; ctx.font = "bold 52px sans-serif"; ctx.fillText(title || "AbanoupAi", 80, 100);
  ctx.fillStyle = "#172033"; ctx.font = "30px sans-serif";
  body.split(/\n/).slice(0, 22).forEach((line, i) => ctx.fillText(line.slice(0, 70), 80, 170 + i * 32));
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas failed")), "image/png"));
  return { blob, name: `${title || "abanoupai-artifact"}.png`, mime: "image/png" };
}

export async function saveArtifact(artifact: LocalArtifact, userId: string) {
  const path = `u/${userId}/${crypto.randomUUID()}-${artifact.name.replace(/[^\w.\-ء-ي]+/g, "_")}`;
  const { error: uploadError } = await supabase.storage.from("artifacts").upload(path, artifact.blob, { contentType: artifact.mime, upsert: false });
  if (uploadError) throw new Error(uploadError.message);
  const { data, error } = await (supabase as any).from("artifacts").insert({ user_id: userId, name: artifact.name, mime: artifact.mime, storage_path: path, size_bytes: artifact.blob.size }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export function downloadArtifact(artifact: LocalArtifact) {
  const url = URL.createObjectURL(artifact.blob); const a = document.createElement("a"); a.href = url; a.download = artifact.name; a.click(); URL.revokeObjectURL(url);
}
