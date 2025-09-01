/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';
export const DEFAULT_DEEPSEEK_REASONER_MODEL = 'deepseek-reasoner';

// Legacy Gemini constants for backward compatibility - map to DeepSeek models
export const DEFAULT_GEMINI_MODEL = DEFAULT_DEEPSEEK_MODEL;
export const DEFAULT_GEMINI_FLASH_MODEL = DEFAULT_DEEPSEEK_MODEL; 
export const DEFAULT_GEMINI_FLASH_LITE_MODEL = DEFAULT_DEEPSEEK_MODEL;
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'text-embedding-ada-002'; // Fallback embedding model

// Some thinking models do not default to dynamic thinking which is done by a value of -1
export const DEFAULT_THINKING_MODE = -1;
