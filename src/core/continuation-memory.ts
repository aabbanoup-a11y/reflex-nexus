export type MemoryNode = {
  id: string;
  parentId: string | null;
  kind: "request" | "plan" | "result" | "error";
  content: string;
  createdAt: string;
};

export function addMemoryNode(
  nodes: MemoryNode[],
  node: Omit<MemoryNode, "createdAt">,
): MemoryNode[] {
  return [...nodes, { ...node, createdAt: new Date().toISOString() }].slice(-500);
}

export function buildContinuationContext(nodes: MemoryNode[], max = 12) {
  return nodes
    .slice(-max)
    .map((n) => `[${n.kind}] ${n.content}`)
    .join("\n");
}

export function offlineFallbackOrder() {
  return [
    "local/Qwen2.5-3B-Instruct-q4f16_1-MLC",
    "local/Phi-3.5-mini-instruct-q4f16_1-MLC",
    "local/Llama-3.2-3B-Instruct-q4f16_1-MLC",
    "local/Llama-3.2-1B-Instruct-q4f16_1-MLC",
  ];
}
