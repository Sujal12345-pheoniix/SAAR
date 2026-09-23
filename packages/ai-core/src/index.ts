// SAAR AI Core — Provider-agnostic AI adapter
// Phase 1: Interface definitions only. Implementation in Phase 6.
// DO NOT add OpenAI/Anthropic SDKs yet.

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiRequest {
  messages: AiMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  userId: string;
  sessionId: string;
}

export interface AiResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  actions?: AiAction[];
}

// Whitelisted action types — AI cannot call arbitrary mutations
export type AiActionType =
  | 'suggest_task'
  | 'suggest_reschedule'
  | 'suggest_routine_change'
  | 'create_insight'
  | 'save_memory';

export interface AiAction {
  type: AiActionType;
  requiresConfirmation: boolean;
  payload: Record<string, unknown>;
}

// Provider interface — swap without touching domain code
export interface AiProvider {
  complete(request: AiRequest): Promise<AiResponse>;
}

// Phase 6: Real providers will implement AiProvider
// Phase 1: Stub only
export class StubAiProvider implements AiProvider {
  async complete(_request: AiRequest): Promise<AiResponse> {
    return {
      content: 'AI companion will be available in Phase 6.',
      model: 'stub',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      actions: [],
    };
  }
}
