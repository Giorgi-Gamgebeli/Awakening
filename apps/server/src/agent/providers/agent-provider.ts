import { Logger } from '@nestjs/common';
import {
  agentModelSchema,
  ApiKeysProviderSchema,
  ApiKeysReasoningEffortSchema,
  z,
} from '@repo/zod';
import type { StepResult, StopCondition, ToolSet } from 'ai';

export type AgentChatResult =
  | { status: 'success'; text: string }
  | { status: 'blocked'; reason: string; message: string }
  | { status: 'incomplete'; reason: string; message: string };
export type AgentModel = z.infer<typeof agentModelSchema>;
export type AgentProviderName = z.infer<typeof ApiKeysProviderSchema>;

export type AgentProvider = {
  readonly name: AgentProviderName;
  listModels(apiKey: string): Promise<AgentModel[]>;
  chat(input: {
    apiKey: string;
    text: string;
    model: string;
    reasoningEffort: z.infer<typeof ApiKeysReasoningEffortSchema> | null;
    system?: string;
    tools?: ToolSet;
  }): Promise<AgentChatResult>;
};

export function logAgentStep(
  logger: Logger,
  providerName: string,
  step: StepResult<ToolSet>,
) {
  const toolErrors = step.content.flatMap((part) =>
    part.type === 'tool-error'
      ? [
          {
            toolName: part.toolName,
            error:
              part.error instanceof Error
                ? part.error.message
                : String(part.error),
          },
        ]
      : [],
  );

  logger.debug(
    `[${providerName}] step ${step.stepNumber} finish=${step.finishReason} rawFinish=${step.rawFinishReason ?? 'unknown'} textLen=${step.text.length} reasoningLen=${step.reasoningText?.length ?? 0} calls=${step.toolCalls.length} results=${step.toolResults.length} errors=${toolErrors.length}`,
  );

  if (step.toolCalls.length > 0) {
    logger.debug(
      `[${providerName}] tool calls: ${JSON.stringify(
        step.toolCalls.map((call) => ({
          toolName: call.toolName,
          input: call.input,
        })),
      )}`,
    );
  }

  if (step.toolResults.length > 0) {
    logger.debug(
      `[${providerName}] tool results: ${JSON.stringify(
        step.toolResults.map((result) => ({
          toolName: result.toolName,
          output: result.output,
        })),
      )}`,
    );
  }

  if (toolErrors.length > 0) {
    logger.error(
      `[${providerName}] tool errors: ${toolErrors
        .map((toolError) => `${toolError.toolName}: ${toolError.error}`)
        .join(' | ')}`,
    );
  }
}

const MUTATING_CALENDAR_TOOLS = new Set([
  'create_calendar_event',
  'update_calendar_event',
  'delete_calendar_event',
]);

export const stopCalendarAgentLoop: StopCondition<ToolSet> = ({ steps }) => {
  const lastStep = steps.at(-1);
  if (!lastStep) return false;

  if (lastStep.toolCalls.length === 0) return true;

  const hasToolError = lastStep.content.some(
    (part) => part.type === 'tool-error',
  );
  if (hasToolError) return steps.length >= 3;

  const hasMutation = lastStep.toolResults.some((result) =>
    MUTATING_CALENDAR_TOOLS.has(result.toolName),
  );
  if (hasMutation) return true;

  const listSteps = steps.filter((step) =>
    step.toolResults.some(
      (result) => result.toolName === 'list_calendar_events',
    ),
  ).length;
  if (listSteps >= 2) return true;

  return steps.length >= 3;
};

export function toToolResultText(
  toolResults: ReadonlyArray<{ output: unknown }>,
): string {
  const messages = toolResults
    .map((result) => {
      const output = result.output;
      if (typeof output !== 'object' || output === null) return null;
      if (!('message' in output)) return null;
      const message = (output as { message?: unknown }).message;
      return typeof message === 'string' && message.trim() ? message.trim() : null;
    })
    .filter((message): message is string => message !== null);

  return messages.join('\n');
}

export function toAgentChatResult(
  text: string,
  finishReason: string | undefined,
  toolText = '',
): AgentChatResult {
  const combined = [text.trim(), toolText.trim()]
    .filter(Boolean)
    .join('\n\n');

  if (combined) {
    return { status: 'success', text: combined };
  }

  if (finishReason === 'content-filter') {
    return {
      status: 'blocked',
      reason: finishReason,
      message: 'The AI provider blocked the response for safety reasons.',
    };
  }

  return {
    status: 'incomplete',
    reason: finishReason ?? 'UNKNOWN',
    message: 'The AI provider finished without returning text.',
  };
}
