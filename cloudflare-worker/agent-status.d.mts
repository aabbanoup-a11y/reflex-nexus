export interface AgentStatusResult {
  status: number;
  body: Record<string, unknown>;
}

export declare function buildScheduledJobsUrl(supabaseUrl: string): URL;

export declare function readAgentStatus(options: {
  supabaseUrl: string;
  publishableKey: string;
  authorization: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}): Promise<AgentStatusResult>;
