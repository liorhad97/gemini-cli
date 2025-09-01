/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * Represents a request to be sent to the DeepSeek API.
 * Uses OpenAI-compatible message format.
 */
export type DeepSeekCodeRequest = ChatCompletionMessageParam[];

export function messageParamsToString(messages: ChatCompletionMessageParam[]): string {
  return messages.map(msg => `${msg.role}: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}`).join('\n');
}

// Legacy function for backward compatibility
export function partListUnionToString(value: any): string {
  if (Array.isArray(value)) {
    return messageParamsToString(value);
  }
  return JSON.stringify(value);
}
