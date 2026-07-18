export type ClaudeAgentTask = {
  prompt: string;
  systemPrompt?: string;
};

export async function runClaudeAgentTask(
  _task: ClaudeAgentTask,
): Promise<never> {
  throw new Error(
    "Claude Agent SDK integration is scaffolded for Phase 1 implementation.",
  );
}
