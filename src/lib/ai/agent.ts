import {
  query,
  type SDKAssistantMessage,
  type SDKMessage,
  type SDKResultMessage,
} from "@anthropic-ai/claude-agent-sdk";

export type ClaudeAgentTask = {
  prompt: string;
  systemPrompt?: string;
  outputSchema?: Record<string, unknown>;
  maxTurns?: number;
  title?: string;
};

export async function runClaudeAgentTask<T = string>(
  task: ClaudeAgentTask,
): Promise<T> {
  let resultMessage: SDKResultMessage | undefined;
  let assistantText = "";

  for await (const message of query({
    prompt: task.prompt,
    options: {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CLAUDE_AGENT_SDK_CLIENT_APP: "fastlane-clone/0.1.0",
      },
      maxTurns: task.maxTurns ?? 1,
      outputFormat: task.outputSchema
        ? {
            type: "json_schema",
            schema: task.outputSchema,
          }
        : undefined,
      permissionMode: "dontAsk",
      persistSession: false,
      systemPrompt: task.systemPrompt,
      title: task.title,
      tools: [],
    },
  })) {
    assistantText += collectAssistantText(message);

    if (message.type === "result") {
      resultMessage = message;
    }
  }

  if (!resultMessage) {
    throw new Error("Claude Agent SDK did not return a result message.");
  }

  if (resultMessage.subtype !== "success") {
    const errors = resultMessage.errors.join("; ");

    throw new Error(
      errors.length > 0
        ? `Claude Agent SDK task failed: ${errors}`
        : `Claude Agent SDK task failed with ${resultMessage.subtype}.`,
    );
  }

  if (!task.outputSchema) {
    return resultMessage.result as T;
  }

  if (typeof resultMessage.structured_output !== "undefined") {
    return resultMessage.structured_output as T;
  }

  const parsedOutput = parseJsonFromText(resultMessage.result || assistantText);

  if (typeof parsedOutput === "undefined") {
    throw new Error("Claude Agent SDK did not return structured JSON output.");
  }

  return parsedOutput as T;
}

function collectAssistantText(message: SDKMessage) {
  if (message.type !== "assistant") {
    return "";
  }

  return message.message.content
    .map((block: SDKAssistantMessage["message"]["content"][number]) =>
      block.type === "text" ? block.text : "",
    )
    .join("");
}

function parseJsonFromText(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);

    if (!match) {
      return undefined;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return undefined;
    }
  }
}
